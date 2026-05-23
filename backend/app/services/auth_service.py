# login e integração com EntraID – modelo SPA
# O frontend (MSAL) conduz o fluxo OAuth; o backend apenas valida o token e emite JWT interno.
from dataclasses import dataclass, field
from typing import Optional, Literal
from datetime import datetime, timedelta, UTC
from sqlmodel import Session, select
from fastapi.responses import JSONResponse
from fastapi import HTTPException
import secrets
import hashlib
import httpx
import jwt  # PyJWT
import logging

from app.core.config import settings
from app.models.user import User, TypeUser
from app.models.session_token import SessionToken, TokenType
from app.services.token_service import (
    issue_otp, verify_otp, issue_token_access
)
from app.utils.session_jwt import create_app_jwt, create_session_jwt
from app.services.local_auth_service import (dev_signup, dev_set_password, login, LocalAuthError)
from app.services.audit_service import log_event

logger = logging.getLogger(__name__)
_GRAPH_BASE = "https://graph.microsoft.com/v1.0"

# Cargos que concedem is_supervisor=True até integração ServiceNow.
_SUPERVISOR_TITLES = [
    "gerente", "coordenador", "diretor", "superintendente",
    "chefe", "líder", "lider", "supervisor",
]

# ---------- Validação de token Entra ID via JWKS ----------

_jwks_client: jwt.PyJWKClient | None = None


def _get_jwks_client() -> jwt.PyJWKClient:
    """Retorna (e memoriza) o cliente JWKS do tenant. Cache de 1 hora."""
    global _jwks_client
    if _jwks_client is None:
        jwks_uri = (
            f"https://login.microsoftonline.com/"
            f"{settings.entra_tenant_id}/discovery/v2.0/keys"
        )
        _jwks_client = jwt.PyJWKClient(jwks_uri, cache_jwk_set=True, lifespan=3600)
    return _jwks_client


def validate_entra_token(token: str) -> dict:
    """
    Valida um JWT do Microsoft Entra ID usando JWKS (chaves públicas RS256).

    Validações realizadas:
    - Assinatura RSA contra o JWKS do tenant
    - Expiração (exp)
    - Issuer: https://login.microsoftonline.com/<tenant_id>/v2.0
    - Audience: <client_id>  OU  api://<client_id>

    Envie o id_token retornado pelo MSAL (result.idToken) — audience = client_id.
    O access_token para Graph API tem audience diferente e será rejeitado.

    Returns:
        dict com os claims do token validado.
    Raises:
        HTTPException 401 em qualquer falha de validação.
    """
    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
    except jwt.exceptions.PyJWKClientError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Chave publica Entra ID indisponivel: {e}",
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token Entra ID invalido: {e}")

    expected_issuer = (
        f"https://login.microsoftonline.com/{settings.entra_tenant_id}/v2.0"
    )
    # id_token → audience = client_id
    # access_token para API exposta → audience = api://<client_id>
    valid_audiences = [
        settings.entra_client_id,
        f"api://{settings.entra_client_id}",
    ]

    for audience in valid_audiences:
        try:
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=audience,
                issuer=expected_issuer,
            )
        except jwt.exceptions.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token Entra ID expirado.")
        except jwt.exceptions.InvalidIssuerError:
            raise HTTPException(
                status_code=401, detail="Token Entra ID com issuer invalido."
            )
        except jwt.exceptions.DecodeError as e:
            raise HTTPException(
                status_code=401, detail=f"Token Entra ID malformado: {e}"
            )
        except jwt.exceptions.InvalidAudienceError:
            continue  # tenta a próxima audience válida
        except Exception as e:
            raise HTTPException(
                status_code=401, detail=f"Token Entra ID invalido: {e}"
            )

    raise HTTPException(
        status_code=401,
        detail=(
            "Token Entra ID com audience invalida. "
            "Envie o id_token do MSAL (nao o access_token para Graph API)."
        ),
    )


# ---------- External (OTP + ACCESS) ----------

@dataclass
class ExternalAuthService:
    """
    Modalidade de usuário EXTERNO.
    Orquestra:
      - request_code(email, validade_minutos?)
      - verify_code(email, codigo, ..) -> emite ACCESS e retorna {token, expires_at, share_id}
    """
    def request_code(self, session: Session, email: str, validity_minutes: Optional[int] = None, meta: dict | None = None) -> dict:
        return issue_otp(
            session=session,
            email=email,
            validity_minutes=validity_minutes or settings.otp_validity_minutes,
            request_meta=meta or {}
        )

    def verify_code(self, session: Session, email: str, code: str,
                    max_attempts: Optional[int] = None,
                    cooldown_minutes: Optional[int] = None,
                    access_valid_hours: Optional[int] = None,
                    meta: dict | None = None) -> dict:
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
        return {"token": access.token, "expires_at": access.expires_at.isoformat(), "share_id": access.share_id}

# ---------- Internal providers ----------

class LocalAuthProvider:
    """
    Provedor local (dev): email+senha -> Ambiente local para teste
    """
    def signup(self, session: Session, email: str, name: str, type: TypeUser, password_hash: str) -> User:
        # você pode reutilizar o local_auth_service.py; aqui deixo a assinatura
        return dev_signup(session, email, name, type, password_hash)

    def set_password(self, session: Session, email: str, new_password: str) -> None:
        return dev_set_password(session, email, new_password)

    def login(self, session: Session, email: str, password: str) -> JSONResponse:
        try:
            user = login(session, email, password, max_attempts=5, cooldown_minutes=15)
        except LocalAuthError as e:
            raise HTTPException(status_code=401, detail=str(e))
        type_value = user.type.value if hasattr(user.type, "value") else str(user.type)
        display_type = "supervisor" if user.is_supervisor else type_value
        token = create_app_jwt({
            "user_id": user.id,
            "email": user.email,
            "type": display_type,
            "is_supervisor": user.is_supervisor,
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
        resp.set_cookie("app_session", token, httponly=True, secure=False, samesite="lax", max_age=60*60*12)
        return resp

    def logout(self) -> JSONResponse:
        resp = JSONResponse({"message": "Logout"})
        resp.delete_cookie("app_session")
        return resp

class EntraTokenProvider:
    """
    Provedor Entra ID – modelo SPA.
    O frontend autentica via MSAL e envia o id_token ao backend.
    O backend valida via JWKS, enriquece com Graph API (opcional)
    e emite tokens internos da aplicação.
    """

    def exchange(
        self,
        session: Session,
        entra_token: str,
        graph_token: str | None = None,
        request=None,
    ) -> dict:
        """
        Valida o id_token Entra ID, sincroniza o usuário e retorna tokens internos.

        Args:
            entra_token: id_token do MSAL (Authorization: Bearer) — validado via JWKS.
            graph_token: access_token do MSAL para Graph API (X-Graph-Token, opcional).
            request: objeto Request do FastAPI para IP/UA de auditoria.
        """
        # 1. Validar token via JWKS (assinatura RS256, exp, iss, aud)
        claims = validate_entra_token(entra_token)
        upn: str = claims.get("preferred_username") or claims.get("email") or ""
        name: str = claims.get("name") or upn.split("@")[0]
        groups: set = set(claims.get("groups", []))
        sup_groups: set = set(settings.entra_supervisor_group_ids or [])
        is_supervisor: bool = bool(groups.intersection(sup_groups))

        # 2. Enriquecer perfil via Graph API
        # Usa graph_token (access_token do MSAL) se fornecido; senão tenta entra_token
        # (só funciona se entra_token for um access_token — id_tokens são rejeitados pelo Graph).
        job_title: Optional[str] = None
        department: Optional[str] = None
        employee_id: Optional[str] = None
        manager_email: Optional[str] = None
        manager_name: Optional[str] = None
        photo_url: Optional[str] = None
        bearer = graph_token or entra_token
        try:
            headers = {"Authorization": f"Bearer {bearer}"}
            with httpx.Client(timeout=10.0) as client:
                profile_resp = client.get(
                    "https://graph.microsoft.com/v1.0/me", headers=headers
                )
                if profile_resp.status_code == 200:
                    prof = profile_resp.json()
                    job_title = prof.get("jobTitle")
                    department = prof.get("department")
                    employee_id = prof.get("employeeId")

                manager_resp = client.get(
                    "https://graph.microsoft.com/v1.0/me/manager", headers=headers
                )
                if manager_resp.status_code == 200:
                    mgr = manager_resp.json()
                    manager_email = mgr.get("mail")
                    manager_name = mgr.get("displayName")

                # Foto de perfil
                photo_resp = client.get(
                    "https://graph.microsoft.com/v1.0/me/photo/$value", headers=headers
                )
                if photo_resp.status_code == 200:
                    import base64 as _b64
                    photo_url = (
                        f"data:image/jpeg;base64,{_b64.b64encode(photo_resp.content).decode()}"
                    )
        except Exception:
            pass  # Falha na Graph API não bloqueia o login

        # 3. Determinar supervisor pelo cargo caso não membro de grupo AD
        if not is_supervisor and job_title:
            if any(t in job_title.lower() for t in _SUPERVISOR_TITLES):
                is_supervisor = True

        # 4. Criar ou atualizar usuário no banco
        user = session.exec(select(User).where(User.email == upn)).first()
        if not user:
            user = User(
                email=upn,
                name=name,
                type=TypeUser.INTERNAL,
                is_supervisor=is_supervisor,
                department=department,
                job_title=job_title,
                employee_id=employee_id,
                photo_url=photo_url,
                last_login=datetime.now(UTC),
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        else:
            user.name = name
            user.type = TypeUser.INTERNAL
            # user.is_supervisor é definido manualmente ou via ServiceNow — não sobrescrever no login.
            if job_title is not None:
                user.job_title = job_title
            if department is not None:
                user.department = department
            if employee_id is not None:
                user.employee_id = employee_id
            if photo_url is not None:
                user.photo_url = photo_url
            user.last_login = datetime.now(UTC)
            session.add(user)
            session.commit()
            session.refresh(user)

        # Vincular gestor somente se ainda não houver um cadastrado no banco.
        # O gestor pode ter sido definido manualmente ou via ServiceNow — não sobrescrever.
        if manager_email and user.manager_id is None:
            manager = session.exec(
                select(User).where(User.email == manager_email)
            ).first()
            if manager:
                user.manager_id = manager.id
                session.add(user)
                session.commit()

        # 5. Emitir tokens internos da aplicação
        access_token = create_session_jwt(
            user_id=user.id,
            email=user.email,
            user_type=user.type,
            is_supervisor=user.is_supervisor,
            expires_minutes=480,
        )
        refresh_token_value = secrets.token_urlsafe(32)
        ip = request.client.host if request else None
        ua = (request.headers.get("User-Agent") or "")[:500] if request else None
        session_token = SessionToken(
            user_id=user.id,
            token_hash=hashlib.sha256(refresh_token_value.encode()).hexdigest(),
            token_type=TokenType.REFRESH,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            ip_address=ip,
            user_agent=ua,
            email=user.email,
        )
        session.add(session_token)
        session.commit()

        display_type = "supervisor" if user.is_supervisor else "internal"
        result: dict = {
            "access_token": access_token,
            "refresh_token": refresh_token_value,
            "expires_in": 28800,
            "token_type": "bearer",
            "user_id": user.id,
            "name": name,
            "email": upn,
            "role": display_type,
        }
        if job_title:
            result["job_title"] = job_title
        if department:
            result["department"] = department
        if employee_id:
            result["employee_id"] = employee_id
        if manager_email:
            result["manager_email"] = manager_email
        if manager_name:
            result["manager_name"] = manager_name
        if photo_url:
            result["photo_url"] = photo_url
        return result

    def logout(self) -> JSONResponse:
        return JSONResponse({"message": "Logout"})

# ---------- Façade (escolhe provider) ----------

@dataclass
class AuthFacade:
    """
    Ponto único para autenticação de 'usuários da empresa'.
    Externo é coberto por ExternalAuthService.
    Interno/Supervisor usa provider conforme AUTH_MODE.
    """
    mode: Literal["local", "entra"] = settings.auth_mode or "local"
    external: ExternalAuthService = field(default_factory=ExternalAuthService)

    def internal_provider(self) -> object:
        return LocalAuthProvider() if self.mode == "local" else EntraTokenProvider()


# ===========================================================================
# Sincronizacao de usuario por grupo Microsoft Entra ID
# (anteriormente em group_sync_service.py)
#
# Responsavel por:
#   - Verificar se o usuario pertence ao grupo obrigatorio via Graph API
#   - Criar / atualizar / desativar usuarios baseado em membership no grupo
#   - Bulk sync de todos os membros do grupo (para cron ou admin)
#
# Configuracao via variaveis de ambiente:
#   ENTRA_REQUIRED_GROUP_ID    — Object ID (UUID) do grupo
#   ENTRA_REQUIRED_GROUP_NAME  — nome human-readable (logs / UI)
#   ENTRA_GROUP_SYNC_STRATEGY  — "deactivate" | "block_login"
# ===========================================================================


def check_user_in_group(ms_access_token: str) -> bool:
    """
    Verifica se o usuario autenticado pertence ao grupo obrigatorio.

    Estrategia de verificacao (em ordem de prioridade):
    1. ENTRA_REQUIRED_GROUP_ID configurado → compara Object ID (UUID) — recomendado.
    2. Apenas ENTRA_REQUIRED_GROUP_NAME configurado → compara displayName do grupo.
       Funciona sem o UUID, mas e sensivel a renomear o grupo no Azure AD.
    3. Nenhum configurado → loga warning e permite todos os usuarios.
    """
    group_id   = settings.entra_required_group_id
    group_name = settings.entra_required_group_name

    if not group_id and not group_name:
        logger.warning("Nem ENTRA_REQUIRED_GROUP_ID nem ENTRA_REQUIRED_GROUP_NAME configurados. Permitindo todos os usuarios.")
        return True

    groups = get_user_groups(ms_access_token)

    if group_id:
        return any(g["id"] == group_id for g in groups)

    # Fallback: verificar por displayName
    logger.info(
        "ENTRA_REQUIRED_GROUP_ID ausente — verificando membership pelo nome do grupo: %s",
        group_name,
    )
    return any(g["displayName"] == group_name for g in groups)


def get_user_groups(ms_access_token: str) -> list[dict]:
    """
    Retorna a lista de grupos/roles do usuario autenticado.
    Cada item e um dict com 'id' (Object ID) e 'displayName'.
    Usa paginacao automatica do Graph (@odata.nextLink).
    """
    groups: list[dict] = []
    url = f"{_GRAPH_BASE}/me/memberOf?$select=id,displayName,@odata.type"
    headers = {"Authorization": f"Bearer {ms_access_token}"}

    try:
        with httpx.Client(timeout=15.0) as client:
            while url:
                resp = client.get(url, headers=headers)
                if resp.status_code != 200:
                    logger.error(
                        f"Graph /me/memberOf retornou {resp.status_code}: {resp.text[:200]}"
                    )
                    break
                data = resp.json()
                for member in data.get("value", []):
                    member_id = member.get("id")
                    if member_id:
                        groups.append({
                            "id": member_id,
                            "displayName": member.get("displayName") or "",
                        })
                url = data.get("@odata.nextLink")
    except httpx.TimeoutException:
        logger.error("Timeout ao consultar Graph /me/memberOf")
    except Exception as e:
        logger.error(f"Erro ao consultar Graph /me/memberOf: {e}")

    return groups


def check_user_in_group_by_id(ms_access_token: str, group_id: str) -> bool:
    """
    Verifica membership usando /me/checkMemberGroups (mais eficiente para 1 grupo).
    Cai em fallback via /me/memberOf em caso de falha.
    """
    url = f"{_GRAPH_BASE}/me/checkMemberGroups"
    headers = {
        "Authorization": f"Bearer {ms_access_token}",
        "Content-Type": "application/json",
    }
    payload = {"groupIds": [group_id]}

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                result = resp.json()
                return group_id in result.get("value", [])
            else:
                logger.error(
                    f"Graph checkMemberGroups retornou {resp.status_code}: {resp.text[:200]}"
                )
    except Exception as e:
        logger.error(f"Erro ao verificar membership via checkMemberGroups: {e}")

    return check_user_in_group(ms_access_token)


def is_user_authorized(claims: dict, access_token: str | None = None) -> bool:
    """
    Verifica se o usuario autenticado tem acesso ao sistema.

    Estrategia (em ordem de eficiencia):

    1. 'groups' claim presente no id_token → compara ENTRA_REQUIRED_GROUP_ID
       diretamente, sem nenhuma chamada extra a Graph API.
       Requer que o App Registration no Azure AD esteja configurado para emitir
       group claims no token (Token configuration → Groups claim → Security groups).

    2. 'groups' ausente no token (claim nao configurado ou usuario em >200 grupos)
       e access_token disponivel → verifica via /me/checkMemberGroups (Graph API).
       Funciona com escopo User.Read em fluxo delegado (sem admin consent).

    3. Nenhuma fonte disponivel → nega acesso (deny-by-default).

    Distincao importante:
    - claims.get("groups") retorna None  → claim nao incluido no token → tenta API.
    - claims.get("groups") retorna []    → claim presente mas vazio (usuario sem grupos)
                                          → nega imediatamente, sem chamada API.
    """
    group_id = settings.entra_required_group_id

    if not group_id:
        logger.warning(
            "ENTRA_REQUIRED_GROUP_ID nao configurado. "
            "Negando acesso (configure a variavel de ambiente)."
        )
        return False

    groups = claims.get("groups")

    if groups is not None:
        # Claim presente: lista de Object IDs. Verificacao local, sem API call.
        return group_id in groups

    # Claim ausente: fallback para Graph API.
    if access_token:
        return check_user_in_group_by_id(access_token, group_id)

    logger.warning(
        "groups claim ausente no token e access_token indisponivel. Negando acesso."
    )
    return False


def _resolve_supervisor_from_claims(claims: dict, graph_info: dict) -> bool:
    """Determina se o usuario deve ser marcado como supervisor."""
    groups = set(claims.get("groups", []))
    sup_groups = set(settings.entra_supervisor_group_ids or [])
    if groups.intersection(sup_groups):
        return True
    job_title = graph_info.get("job_title", "")
    if job_title and any(t in job_title.lower() for t in _SUPERVISOR_TITLES):
        return True
    return False


def sync_user_from_group(
    session: Session,
    email: str,
    name: str,
    claims: dict,
    graph_info: dict,
    is_in_group: bool,
    ms_access_token: Optional[str] = None,
    request_ip: Optional[str] = None,
    request_ua: Optional[str] = None,
) -> User:
    """
    Cria, atualiza ou desativa um usuario baseado em membership no grupo.

    is_in_group=True → cria se nao existe; atualiza e garante status=True se ja existe.
    is_in_group=False → strategy=deactivate: desativa; strategy=block_login: nao altera.
    """
    from app.services.supervisor_sync_service import resolve_and_link_supervisor  # evita circular

    strategy = settings.entra_group_sync_strategy
    group_name = settings.entra_required_group_name

    user = session.exec(select(User).where(User.email == email)).first()

    if is_in_group:
        if not user:
            user = User(
                email=email,
                name=name,
                type=TypeUser.INTERNAL,
                is_supervisor=_resolve_supervisor_from_claims(claims, graph_info),
                department=graph_info.get("department"),
                job_title=graph_info.get("job_title"),
                employee_id=graph_info.get("employee_id"),
                photo_url=graph_info.get("photo_url"),
                status=True,
                last_login=datetime.now(UTC),
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            log_event(
                session=session,
                action="USER_CREATED_BY_GROUP_SYNC",
                user_id=user.id,
                detail=f"email={email}, group={group_name}",
                ip=request_ip,
                user_agent=request_ua,
            )
            logger.info(f"Usuario criado via group sync: {email}")
        else:
            was_inactive = not user.status
            user.name = name
            user.type = TypeUser.INTERNAL
            user.status = True
            user.last_login = datetime.now(UTC)
            user.is_supervisor = _resolve_supervisor_from_claims(claims, graph_info)
            if graph_info.get("job_title") is not None:
                user.job_title = graph_info["job_title"]
            if graph_info.get("department") is not None:
                user.department = graph_info["department"]
            if graph_info.get("employee_id") is not None:
                user.employee_id = graph_info["employee_id"]
            if graph_info.get("photo_url"):
                user.photo_url = graph_info["photo_url"]
            session.add(user)
            session.commit()
            session.refresh(user)
            if was_inactive:
                log_event(
                    session=session,
                    action="USER_REACTIVATED_BY_GROUP_SYNC",
                    user_id=user.id,
                    detail=f"email={email}, group={group_name}",
                    ip=request_ip,
                    user_agent=request_ua,
                )
                logger.info(f"Usuario reativado via group sync: {email}")

        resolve_and_link_supervisor(
            session=session,
            user=user,
            graph_info=graph_info,
            ms_access_token=ms_access_token,
            request_ip=request_ip,
            request_ua=request_ua,
        )
        return user

    else:
        if strategy == "deactivate":
            if user and user.status:
                user.status = False
                session.add(user)
                session.commit()
                session.refresh(user)
                log_event(
                    session=session,
                    action="USER_DEACTIVATED_BY_GROUP_SYNC",
                    user_id=user.id,
                    detail=f"email={email}, group={group_name}, strategy=deactivate",
                    ip=request_ip,
                    user_agent=request_ua,
                )
                logger.info(f"Usuario desativado (nao pertence ao grupo): {email}")
            if user:
                return user

        # strategy="block_login"
        if user:
            return user

        raise ValueError(
            f"Usuario {email} nao pertence ao grupo {group_name} e nao sera criado."
        )


def bulk_sync_group_members(
    session: Session,
    admin_access_token: str,
    request_ip: Optional[str] = None,
    request_ua: Optional[str] = None,
) -> dict:
    """
    Sincroniza todos os membros do grupo no banco de dados.
    1. Lista membros via Graph API.
    2. Para cada membro: cria se nao existe, atualiza, garante status=True.
    3. Desativa usuarios INTERNAL no banco que NAO estao no grupo.
    """
    group_id = settings.entra_required_group_id
    group_name = settings.entra_required_group_name

    if not group_id:
        return {"error": "ENTRA_REQUIRED_GROUP_ID nao configurado."}

    members = _list_group_members(admin_access_token, group_id)
    if members is None:
        return {"error": "Falha ao listar membros do grupo via Graph API."}

    created = 0
    updated = 0
    reactivated = 0
    member_emails: set[str] = set()

    for member in members:
        email = member.get("mail") or member.get("userPrincipalName")
        if not email:
            continue
        email = email.lower()
        member_emails.add(email)
        name = member.get("displayName") or email.split("@")[0]
        user = session.exec(select(User).where(User.email == email)).first()

        if not user:
            user = User(
                email=email,
                name=name,
                type=TypeUser.INTERNAL,
                is_supervisor=False,
                department=member.get("department"),
                job_title=member.get("jobTitle"),
                employee_id=member.get("employeeId"),
                status=True,
                last_login=None,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            created += 1
            log_event(
                session=session,
                action="USER_CREATED_BY_BULK_SYNC",
                user_id=user.id,
                detail=f"email={email}, group={group_name}",
                ip=request_ip,
                user_agent=request_ua,
            )
        else:
            was_inactive = not user.status
            user.name = name
            user.status = True
            if member.get("department"):
                user.department = member["department"]
            if member.get("jobTitle"):
                user.job_title = member["jobTitle"]
            if member.get("employeeId"):
                user.employee_id = member["employeeId"]
            session.add(user)
            session.commit()
            if was_inactive:
                reactivated += 1
                log_event(
                    session=session,
                    action="USER_REACTIVATED_BY_BULK_SYNC",
                    user_id=user.id,
                    detail=f"email={email}, group={group_name}",
                    ip=request_ip,
                    user_agent=request_ua,
                )
            else:
                updated += 1

    deactivated = 0
    all_internal = session.exec(
        select(User).where(User.type == TypeUser.INTERNAL, User.status == True)
    ).all()
    for user in all_internal:
        if user.email.lower() not in member_emails:
            user.status = False
            session.add(user)
            deactivated += 1
            log_event(
                session=session,
                action="USER_DEACTIVATED_BY_BULK_SYNC",
                user_id=user.id,
                detail=f"email={user.email}, group={group_name}, reason=not_in_group",
                ip=request_ip,
                user_agent=request_ua,
            )
            logger.info(f"Usuario desativado por bulk sync (nao no grupo): {user.email}")

    session.commit()
    return {
        "group_id": group_id,
        "group_name": group_name,
        "total_members_in_group": len(members),
        "created": created,
        "updated": updated,
        "reactivated": reactivated,
        "deactivated": deactivated,
    }


def _list_group_members(admin_token: str, group_id: str) -> Optional[list[dict]]:
    """Lista todos os membros de um grupo via Graph API com paginacao."""
    members: list[dict] = []
    url = (
        f"{_GRAPH_BASE}/groups/{group_id}/members"
        f"?$select=id,displayName,mail,userPrincipalName,jobTitle,department,employeeId"
        f"&$top=999"
    )
    headers = {"Authorization": f"Bearer {admin_token}"}

    try:
        with httpx.Client(timeout=30.0) as client:
            while url:
                resp = client.get(url, headers=headers)
                if resp.status_code != 200:
                    logger.error(
                        f"Graph /groups/{group_id}/members retornou "
                        f"{resp.status_code}: {resp.text[:300]}"
                    )
                    return None
                data = resp.json()
                members.extend(data.get("value", []))
                url = data.get("@odata.nextLink")
    except httpx.TimeoutException:
        logger.error(f"Timeout ao listar membros do grupo {group_id}")
        return None
    except Exception as e:
        logger.error(f"Erro ao listar membros do grupo {group_id}: {e}")
        return None

    return members