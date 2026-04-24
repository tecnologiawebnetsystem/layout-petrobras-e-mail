"""
Rotas de autenticacao interna (Entra ID / Local dev).
Endpoints legados - compatibilidade com auth_service.py.

Todas as acoes geram log de auditoria na tabela 'audit'.

HAVERA ENPOINTS DE CADASTRO MANUAL DA APLICAÇÃO AINDA NÃO MONTADOS
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select
from datetime import datetime, UTC
from typing import Optional
from app.db.session import get_session
from app.services.auth_service import AuthFacade, EntraTokenProvider, validate_entra_token
from app.services.audit_service import log_event
from app.models.user import User, TypeUser
from app.utils.session_jwt import create_session_jwt
from app.core.config import settings

router = APIRouter(prefix="/auth/internal", tags=["Auth / Internal"])


class LocalSignup(BaseModel):
    email: EmailStr
    name: str
    type: TypeUser
    password: str


class LocalLogin(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
def dev_signup(payload: LocalSignup, session: Session = Depends(get_session), request: Request = None):
    """
    Cadastra um novo usuário interno via modo local (apenas quando AUTH_MODE=local).

    Utilizado exclusivamente em ambiente de desenvolvimento. Em modo Entra ID (produção),
    retorna 403. Persiste o usuário via AuthFacade e registra o evento SIGNUP_LOCAL.
    """
    facade = AuthFacade()
    provider = facade.internal_provider()
    if facade.mode != "local":
        raise HTTPException(status_code=403, detail="Signup local indisponivel quando AUTH_MODE != local.")
    # usa provider local
    user = provider.signup(session, payload.email, payload.name, payload.type, payload.password)

    log_event(
        session=session,
        action="SIGNUP_LOCAL",
        user_id=user.id,
        detail=f"email={payload.email}, type={payload.type}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return {"usuario_id": user.id, "tipo": user.type}


@router.post("/login")
def login(request: Request, session: Session = Depends(get_session), payload: LocalLogin | None = None):
    """
    Autentica um usuário interno.

    Em modo local (AUTH_MODE=local): valida email e senha, retorna JWT.
    Em modo Entra ID: redireciona para o fluxo OAuth Microsoft (login_redirect).
    Registra o evento de auditoria correspondente em ambos os casos.
    """
    facade = AuthFacade()
    provider = facade.internal_provider()
    if facade.mode == "local":
        # login via email+senha
        response = provider.login(session, payload.email, payload.password)

        # Busca user_id para log
        user = session.exec(select(User).where(User.email == payload.email)).first()

        log_event(
            session=session,
            action="LOGIN_INTERNAL_LOCAL",
            user_id=user.id if user else None,
            detail=f"email={payload.email}, mode=local",
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None
        )

        return response
    else:
        # Modo entra: o frontend autentica via MSAL e envia o id_token para POST /auth/internal/entra
        raise HTTPException(
            status_code=404,
            detail="Login por email/senha indisponivel no modo entra. Use POST /auth/internal/entra.",
        )


@router.post("/entra")
def entra_token_exchange(
    request: Request,
    session: Session = Depends(get_session),
):
    """
    Troca um id_token do Microsoft Entra ID (SPA/MSAL) por tokens internos.

    Headers:
        Authorization: Bearer <id_token>   — id_token do MSAL (obrigatório)
        X-Graph-Token: <access_token>       — access_token para Graph API (opcional)

    O id_token é validado via JWKS (assinatura RS256, exp, iss, aud).
    O access_token, se fornecido, enriquece o perfil via Graph API.
    """
    if settings.auth_mode != "entra":
        raise HTTPException(
            status_code=404,
            detail="Entra ID nao habilitado (AUTH_MODE != entra).",
        )

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail="Header Authorization: Bearer <id_token> obrigatorio.",
        )
    entra_token = auth_header.split(" ", 1)[1].strip()
    if not entra_token:
        raise HTTPException(status_code=401, detail="id_token ausente no header Authorization.")

    graph_token: str | None = request.headers.get("X-Graph-Token") or None

    provider = EntraTokenProvider()
    result = provider.exchange(
        session=session,
        entra_token=entra_token,
        graph_token=graph_token,
        request=request,
    )

    log_event(
        session=session,
        action="LOGIN_ENTRA_TOKEN_EXCHANGE",
        user_id=result.get("user_id"),
        detail=f"email={result.get('email')}, role={result.get('role')}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return result


@router.post("/logout")
def logout(request: Request = None, session: Session = Depends(get_session)):
    """
    Encerra a sessão do usuário interno.

    Endpoint legado mantido para compatibilidade. Registra o evento LOGOUT_INTERNAL_LEGACY
    e delega a lógica de limpeza de sessão ao provider configurado (local ou Entra).
    """
    facade = AuthFacade()
    provider = facade.internal_provider()

    log_event(
        session=session,
        action="LOGOUT_INTERNAL_LEGACY",
        detail=f"mode={facade.mode}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return provider.logout()


# =====================================================
# POST /v1/auth/internal/sync-entra
# =====================================================

# Cargos que, provisoriamente, concedem is_supervisor=True até haver integração ServiceNow.
# Quando o ServiceNow estiver integrado, a flag virá diretamente do chamado de solicitação.
_SUPERVISOR_TITLES = [
    "gerente", "coordenador", "diretor", "superintendente",
    "chefe", "líder", "lider", "supervisor",
]


class EntraSyncRequest(BaseModel):
    email: EmailStr
    name: str
    entra_id: str
    job_title: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None
    photo_url: Optional[str] = None
    manager_email: Optional[str] = None
    manager_name: Optional[str] = None


@router.post("/sync-entra")
def sync_entra_user(
    payload: EntraSyncRequest,
    session: Session = Depends(get_session),
    request: Request = None,
):
    """
    Sincroniza (cria ou atualiza) o usuário autenticado via Microsoft Entra ID
    na base de dados local. Chamado automaticamente após cada login Microsoft.

    - Se o usuário não existir → cria com type determinado pelo cargo.
    - Se já existir → atualiza nome, cargo, departamento e last_login.
    - Retorna um JWT do backend para substituir o token MSAL nas chamadas API.
    """
    # Todos os usuários Entra ID são INTERNAL; is_supervisor é determinado pelo cargo
    # até a integração com ServiceNow estar disponível.
    is_supervisor = False
    if payload.job_title:
        title_lower = payload.job_title.lower()
        if any(t in title_lower for t in _SUPERVISOR_TITLES):
            is_supervisor = True

    user = session.exec(select(User).where(User.email == payload.email)).first()

    if not user:
        user = User(
            email=payload.email,
            name=payload.name,
            type=TypeUser.INTERNAL,
            is_supervisor=is_supervisor,
            department=payload.department,
            job_title=payload.job_title,
            employee_id=payload.employee_id,
            photo_url=payload.photo_url[:500] if payload.photo_url else None,
            last_login=datetime.now(UTC),
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        action = "ENTRA_SYNC_CREATE"
    else:
        user.name = payload.name
        user.type = TypeUser.INTERNAL
        user.is_supervisor = is_supervisor
        if payload.job_title is not None:
            user.job_title = payload.job_title
        if payload.department is not None:
            user.department = payload.department
        if payload.employee_id is not None:
            user.employee_id = payload.employee_id
        if payload.photo_url is not None:
            user.photo_url = payload.photo_url[:500]
        user.last_login = datetime.now(UTC)
        session.add(user)
        session.commit()
        session.refresh(user)
        action = "ENTRA_SYNC_UPDATE"

    # Vincular gestor se informado e existir na base
    if payload.manager_email:
        manager = session.exec(
            select(User).where(User.email == payload.manager_email)
        ).first()
        if manager and user.manager_id != manager.id:
            user.manager_id = manager.id
            session.add(user)
            session.commit()

    # Gerar JWT do backend (8 horas – sessão Entra ID costuma durar mais)
    access_token = create_session_jwt(
        user_id=user.id,
        email=user.email,
        user_type=user.type,
        is_supervisor=user.is_supervisor,
        expires_minutes=480,
    )

    log_event(
        session=session,
        action=action,
        user_id=user.id,
        detail=f"email={payload.email}, type=internal, is_supervisor={user.is_supervisor}, entra_id={payload.entra_id}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": "supervisor" if user.is_supervisor else user.type,
            "is_supervisor": user.is_supervisor,
            "department": user.department,
            "job_title": user.job_title,
            "employee_id": user.employee_id,
        },
    }
