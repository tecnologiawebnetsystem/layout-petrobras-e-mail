# login e integração com CAv4 – backend emite JWT interno após autenticação OIDC.
from dataclasses import dataclass, field
from typing import Optional, Literal
from datetime import datetime, timedelta, UTC
from sqlmodel import Session, select
from fastapi.responses import JSONResponse
from fastapi import HTTPException
import secrets
import hashlib
import logging

from app.core.config import settings
from app.models.user import User, TypeUser
from app.models.session_token import SessionToken, TokenType
from app.services.token_service import (
    issue_otp, verify_otp, issue_token_access
)
from app.utils.session_jwt import create_app_jwt, create_session_jwt
from app.services.local_auth_service import (
    dev_signup, dev_set_password, login, LocalAuthError)
from app.services.audit_service import log_event
from app.services.cav4_auth_service import get_cav4_user_details, add_role_to_user_with_fallback

logger = logging.getLogger(__name__)


def _pick_login_values(
    *,
    graph_info: dict,
    cav4_info: dict | None,
    fallback_login: str | None,
) -> tuple[str | None, str | None]:
    """Resolve login_cav4 e employee_id com prioridade consistente."""
    login_cav4 = (
        graph_info.get("login_cav4")
        or (cav4_info or {}).get("employee_id")
        or graph_info.get("employee_id")
        or fallback_login
    )
    employee_id = (
        graph_info.get("employee_id")
        or (cav4_info or {}).get("employee_id")
        or login_cav4
        or fallback_login
    )
    return login_cav4, employee_id


def _supervisor_role_candidates() -> list[str]:
    """Retorna lista de códigos de papel para supervisor em ordem de tentativa."""
    configured = [str(r).strip() for r in (settings.cav4_supervisor_role_names or []) if str(r).strip()]
    fallback = "cd_papel_supervisor"
    if fallback not in configured:
        configured.append(fallback)
    return configured


def resolve_primary_role(user: User) -> str:
    """
    Resolve o papel principal do usuario.
    Prioridade: admin > supervisor > internal.
    """
    if user.is_admin:
        return "admin"
    if user.is_supervisor:
        return "supervisor"
    return "internal"


def issue_internal_tokens(
        session: Session,
        user: User,
        request=None,
        expires_minutes: int = 480,
        refresh_days: int = 7,
) -> dict:
    """
    Emite access_token JWT (HS256) e refresh_token persistido no banco.
    O access_token carrega user_id, email, type, is_supervisor, is_admin.
    O refresh_token é um opaque token armazenado como hash SHA-256.
    """
    access_token = create_session_jwt(
        user_id=user.id,
        email=user.email,
        user_type=user.type,
        is_supervisor=user.is_supervisor,
        is_admin=user.is_admin,
        expires_minutes=expires_minutes,
    )

    refresh_token_value = secrets.token_urlsafe(32)
    ip = request.client.host if request else None
    user_agent = ((request.headers.get("User-Agent") or "")[:500] if request else None)
    refresh_token = SessionToken(
        user_id=user.id,
        token_hash=hashlib.sha256(refresh_token_value.encode()).hexdigest(),
        token_type=TokenType.REFRESH,
        expires_at=datetime.now(UTC) + timedelta(days=refresh_days),
        ip_address=ip,
        user_agent=user_agent,
        email=user.email,
    )
    session.add(refresh_token)
    session.commit()
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_value,
        "expires_in": expires_minutes * 60,
        "token_type": "bearer",
    }


def sync_user_from_access(
    session: Session,
    email: str,
    name: str,
    graph_info: dict,
    access_info: dict,
    request_ip: Optional[str] = None,
    request_ua: Optional[str] = None,
    access_token: Optional[str] = None,
    user_login: Optional[str] = None,
) -> User:
    """
    Cria ou atualiza usuário interno após autenticação CAv4.

    - Novo usuário: cria com os dados de perfil e acesso recebidos.
    - Usuário existente (inclusive inativo): atualiza dados e reativa.
    - Dados do Graph (cargo, departamento, foto) são aplicados quando disponíveis.
    - manager_id é vinculado/removido conforme manager_email do Graph.
    - Gestor é provisionado no banco E vinculado ao papel cd_papel_supervisor no CAv4.

    Esta função NÃO desativa usuários — apenas sincroniza dados locais.
    O enriquecimento via Graph é realizado em graph_service.enrich_graph_profile_by_upn().
    
    Args:
        session: Sessão SQL
        email: e-mail do usuário
        name: nome do usuário
        graph_info: dict com dados do Graph (job_title, department, employee_id, manager_email, manager_employee_id, etc)
        access_info: dict com autorização (role, is_admin, is_supervisor, etc)
        request_ip: IP da requisição
        request_ua: User-Agent da requisição
        access_token: token de acesso CAv4 (necessário para atribuir papel ao gestor)
        user_login: matrícula do usuário (fallback para employee_id)
    """
    user = session.exec(select(User).where(User.email == email)).first()

    role = access_info["role"]
    is_admin = role == "admin"
    is_supervisor = role == "supervisor"

    # Complementa dados com CAv4 quando Graph vier incompleto (ex.: job_title ausente).
    cav4_user_info: dict | None = None
    if access_token and user_login:
        try:
            cav4_user_info = get_cav4_user_details(login=user_login, access_token=access_token)
        except Exception as exc:
            logger.warning("Falha ao obter detalhes do usuário no CAv4 (login=%s): %s", user_login, exc)

    resolved_login_cav4, resolved_employee_id = _pick_login_values(
        graph_info=graph_info,
        cav4_info=cav4_user_info,
        fallback_login=user_login,
    )
    resolved_job_title = graph_info.get("job_title") or (cav4_user_info or {}).get("job_title")
    resolved_department = graph_info.get("department") or (cav4_user_info or {}).get("department")

    if not user:
        user = User(
            email=email,
            name=name,
            type=TypeUser.INTERNAL,
            is_admin=is_admin,
            is_supervisor=False if is_admin else is_supervisor,
            department=resolved_department,
            job_title=resolved_job_title,
            employee_id=resolved_employee_id,
            login_cav4=resolved_login_cav4,
            photo_url=graph_info.get("photo_url"),
            status=True,
            last_login=datetime.now(UTC),
        )
        session.add(user)
        session.flush()
        log_event(
            session=session,
            action="USER_CREATED_BY_ACCESS",
            user_id=user.id,
            detail=f"email={email}, role={role}",
            ip=request_ip,
            user_agent=request_ua,
        )
        logger.info("Usuario criado por sync de acesso: %s", email)
    else:
        was_inactive = not user.status

        user.name = name
        user.type = TypeUser.INTERNAL
        user.is_admin = is_admin
        user.is_supervisor = False if is_admin else is_supervisor
        user.status = True
        user.last_login = datetime.now(UTC)

        if resolved_job_title is not None:
            user.job_title = resolved_job_title
        if resolved_department is not None:
            user.department = resolved_department
        if resolved_employee_id is not None:
            user.employee_id = resolved_employee_id
        if resolved_login_cav4 is not None:
            user.login_cav4 = resolved_login_cav4
        if graph_info.get("photo_url") is not None:
            user.photo_url = graph_info["photo_url"]

        session.add(user)
        session.flush()

        if was_inactive:
            log_event(
                session=session,
                action="USER_REACTIVATED_BY_ACCESS",
                user_id=user.id,
                detail=f"email={email}, role={role}",
                ip=request_ip,
                user_agent=request_ua,
            )
            logger.info("Usuario reativado por sync de acesso: %s", email)

    # ── Vincular / atualizar manager ────────────────────────────────────────
    # O Graph retorna manager_email e manager_name via /users/{id}/manager.
    # Se o gestor ainda não tem conta no banco, ele é criado automaticamente
    # com os dados disponíveis — garantindo que o vínculo seja estabelecido
    # imediatamente, sem depender de um login futuro do gestor.
    # Isso é necessário para que o fluxo de aprovação de shares funcione.
    # APÓS criar o gestor no banco, ele é atribuído ao papel cd_papel_supervisor
    # no CAv4 para que tenha acesso quando fizer seu primeiro login.
    manager_email = graph_info.get("manager_email")
    manager_name  = graph_info.get("manager_name")
    manager_employee_id = graph_info.get("manager_employee_id")
    manager_login = manager_employee_id

    # Busca complemento do supervisor no CAv4 durante login do supervisionado,
    # evitando dependência do primeiro login do supervisor para completar cadastro.
    manager_cav4_info: dict | None = None
    if access_token and manager_login:
        try:
            manager_cav4_info = get_cav4_user_details(login=manager_login, access_token=access_token)
        except Exception as exc:
            logger.warning("Falha ao obter detalhes do supervisor no CAv4 (login=%s): %s", manager_login, exc)

    manager_login_cav4 = manager_login or (manager_cav4_info or {}).get("employee_id")
    manager_effective_email = manager_email or (manager_cav4_info or {}).get("email")
    manager_effective_name = manager_name
    manager_effective_job = (manager_cav4_info or {}).get("job_title")
    manager_effective_dept = (manager_cav4_info or {}).get("department")

    if manager_effective_email:
        resolved_manager = session.exec(
            select(User).where(User.email == manager_effective_email)
        ).first()

        if not resolved_manager:
            # Gestor identificado pelo Graph mas ainda sem conta no banco.
            # Cria um registro com status=False (sem acesso ativo) e
            # is_supervisor=True para que o sistema de aprovação o reconheça.
            # Quando o gestor fizer login, seus dados serão atualizados.
            resolved_manager = User(
                email=manager_effective_email,
                name=manager_effective_name or manager_effective_email.split("@")[0].replace(".", " ").title(),
                type=TypeUser.INTERNAL,
                is_supervisor=True,
                is_admin=False,
                employee_id=manager_login_cav4,
                login_cav4=manager_login_cav4,
                job_title=manager_effective_job,
                department=manager_effective_dept,
                status=False,  # sem acesso ativo até fazer login
            )
            session.add(resolved_manager)
            session.flush()
            log_event(
                session=session,
                action="MANAGER_PROVISIONADO",
                user_id=resolved_manager.id,
                detail=f"gestor criado via Graph para subordinado={email}",
                ip=request_ip,
                user_agent=request_ua,
            )
            logger.info("Manager provisionado para subordinado=%s (manager=%s)", email, manager_effective_email)
        else:
            if manager_login_cav4 and not resolved_manager.login_cav4:
                resolved_manager.login_cav4 = manager_login_cav4
            if manager_login_cav4 and not resolved_manager.employee_id:
                resolved_manager.employee_id = manager_login_cav4
            if manager_effective_job and not resolved_manager.job_title:
                resolved_manager.job_title = manager_effective_job
            if manager_effective_dept and not resolved_manager.department:
                resolved_manager.department = manager_effective_dept
            if manager_effective_name and (not resolved_manager.name or "@" in resolved_manager.name):
                resolved_manager.name = manager_effective_name
            session.add(resolved_manager)
            session.flush()

        if user.manager_id != resolved_manager.id:
            user.manager_id = resolved_manager.id
            session.add(user)
            session.flush()
            logger.info("Manager vinculado ao usuario=%s (manager_id=%s)", user.email, resolved_manager.id)

        # ── Atribuir papel cd_papel_supervisor no CAv4 ────────────────────────
        # Quando a gestora é provisionada ou já existe no banco, atribuir o papel
        # no CAv4 para que ela tenha acesso quando fizer login.
        # Usa o access_token do usuário atual (que está fazendo login) para chamar
        # a API de admin do CAv4 — esse usuário também precisa ter permissões.
        manager_role_login = resolved_manager.login_cav4 or resolved_manager.employee_id
        if access_token and manager_role_login:
            try:
                last_reason = ""
                assigned_any = False
                for role_code in _supervisor_role_candidates():
                    assigned, source = add_role_to_user_with_fallback(
                        login=manager_role_login,
                        role_code=role_code,
                        user_access_token=access_token,
                    )
                    if assigned:
                        logger.info("Papel %s atribuido para manager=%s via %s", role_code, resolved_manager.email, source)
                        assigned_any = True
                        break
                    last_reason = f"{role_code}:{source}"

                if not assigned_any:
                    logger.warning(
                        "Nao foi possivel atribuir papel CAv4 para manager=%s (motivo=%s)",
                        resolved_manager.email,
                        last_reason or "sem_motivo",
                    )
            except Exception as exc:
                # Não bloqueia login do subordinado se integração CAv4 falhar.
                logger.warning("Falha ao atribuir papel CAv4 para manager=%s: %s", resolved_manager.email, exc)

    # ── Atribuir papel para supervisores (gestoras) quando fazem login ────────
    # Se o usuário é supervisor e tem employee_id/login_cav4 (matrícula CAv4),
    # tentar atribuir o papel cd_papel_supervisor no CAv4 (caso não tenha sido
    # atribuído quando foi provisionado como gestor de outro usuário).
    # Isso garante que gestoras criadas sem matrícula agora recebam o papel
    # assim que fazerem login e tiverem sua identidade CAv4 completa.
    if user.is_supervisor and access_token and (user.employee_id or user.login_cav4):
        supervisor_login = user.login_cav4 or user.employee_id
        try:
            last_reason = ""
            assigned_any = False
            for role_code in _supervisor_role_candidates():
                assigned, source = add_role_to_user_with_fallback(
                    login=supervisor_login,
                    role_code=role_code,
                    user_access_token=access_token,
                )
                if assigned:
                    logger.info("Papel %s atribuido para supervisor=%s via %s", role_code, user.email, source)
                    assigned_any = True
                    break
                last_reason = f"{role_code}:{source}"

            if not assigned_any:
                logger.warning(
                    "Nao foi possivel atribuir papel CAv4 para supervisor=%s (motivo=%s)",
                    user.email,
                    last_reason or "sem_motivo",
                )
        except Exception as exc:
            logger.warning("Falha ao atribuir papel CAv4 para supervisor=%s: %s", user.email, exc)

    session.commit()
    session.refresh(user)
    return user


# ── Autenticação de usuário EXTERNO (OTP) ────────────────────────────────────

@dataclass
class ExternalAuthService:
    """
    Autenticação de usuário externo via OTP.
    Orquestra emissão e verificação de código + emissão de ACCESS token.
    """

    def request_code(self, session: Session, email: str, validity_minutes: Optional[int] = None, meta: dict | None = None) -> dict:
        return issue_otp(
            session=session,
            email=email,
            validity_minutes=validity_minutes or settings.otp_validity_minutes,
            request_meta=meta or {}
        )

    def verify_code(
        self,
        session: Session,
        email: str,
        code: str,
        max_attempts: Optional[int] = None,
        cooldown_minutes: Optional[int] = None,
        access_valid_hours: Optional[int] = None,
        meta: dict | None = None,
    ) -> dict:
        otp = verify_otp(
            session=session,
            email=email,
            code=code,
            max_attempts=max_attempts or settings.otp_max_attempts,
            cooldown_minutes=cooldown_minutes or settings.otp_cooldown_minutes,
            request_meta=meta or {}
        )
        access = issue_token_access(
            session=session,
            otp=otp,
            validity_hours=access_valid_hours or settings.access_valid_hours,
            request_meta=meta or {}
        )
        return {
            "token": access.token,
            "expires_at": access.expires_at.isoformat(),
            "share_id": access.share_id,
        }


# ── Autenticação interna (desenvolvimento local) ─────────────────────────────

class LocalAuthProvider:
    """
    Autenticação local via email+senha (bcrypt).
    Utilizada exclusivamente com AUTH_MODE=local (desenvolvimento).
    Em produção, a autenticação é realizada via CAv4 (OIDC/PKCE).
    """

    def signup(self, session: Session, email: str, name: str, type: TypeUser, password_hash: str) -> User:
        return dev_signup(session, email, name, type, password_hash)

    def set_password(self, session: Session, email: str, new_password: str) -> None:
        return dev_set_password(session, email, new_password)

    def login(self, session: Session, email: str, password: str) -> JSONResponse:
        try:
            user = login(session, email, password, max_attempts=5, cooldown_minutes=15)
        except LocalAuthError as e:
            raise HTTPException(status_code=401, detail=str(e))

        display_type = resolve_primary_role(user)
        token = create_app_jwt({
            "user_id": user.id,
            "email": user.email,
            "type": display_type,
            "is_supervisor": user.is_supervisor,
            "is_admin": user.is_admin,
            "sub": str(user.id),
        })
        resp = JSONResponse({
            "message": "Autenticado",
            "access_token": token,
            "refresh_token": token,
            "expires_in": 43200,
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "type": display_type,
            "is_supervisor": user.is_supervisor,
            "is_admin": user.is_admin,
        })
        resp.set_cookie(
            "app_session",
            token,
            httponly=True,
            secure=not settings.debug,
            samesite="lax",
            max_age=60 * 60 * 12,
        )
        return resp

    def logout(self) -> JSONResponse:
        resp = JSONResponse({"message": "Logout"})
        resp.delete_cookie("app_session")
        return resp


# ── Façade de autenticação ────────────────────────────────────────────────────

@dataclass
class AuthFacade:
    """
    Ponto único de entrada para autenticação de usuários internos.
    Usuários externos são autenticados via ExternalAuthService (OTP).
    AUTH_MODE=cav4 → fluxo principal (produção).
    AUTH_MODE=local → fluxo de desenvolvimento (email+senha).
    """
    mode: Literal["local", "cav4"] = settings.auth_mode or "local"
    external: ExternalAuthService = field(default_factory=ExternalAuthService)

    def internal_provider(self) -> object:
        """Retorna o provider de autenticação interna conforme AUTH_MODE."""
        return LocalAuthProvider()  # CAv4 usa rotas dedicadas em routes_cav4_auth.py
