"""
Autenticacao via Microsoft Entra ID — fluxo SPA (MSAL no frontend).

O frontend usa MSAL para conduzir o fluxo Authorization Code + PKCE
diretamente com a Microsoft (sem client_secret).
O backend apenas valida os tokens recebidos e emite JWT internos.

Endpoints:
  POST /auth/entra/token        → recebe id_token + access_token do MSAL, valida,
                                   verifica grupo, sincroniza usuario, emite JWT interno
  POST /auth/entra/refresh      → renova access_token via refresh_token
  POST /auth/entra/logout       → revoga tokens, retorna URL de logout Microsoft
  GET  /auth/entra/me           → dados do usuario autenticado
  GET  /auth/entra/session-check→ verifica se sessao (JWT) e valida
  POST /auth/entra/sync-group   → (admin) sincroniza membros do grupo com o banco

Controles de acesso:
- Apenas usuarios do grupo GN_CLOUD_AWS_SCAC_USERS (ENTRA_REQUIRED_GROUP_ID) podem acessar
- Verificacao via claims do id_token (groups claim) ou Graph API como fallback
- Usuario e criado/atualizado automaticamente no primeiro login
- Supervisores sem usuarios vinculados NAO recebem acesso ao sistema
- Ativo apenas quando AUTH_MODE=entra
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, select, func
from datetime import datetime, timedelta, UTC
import secrets
import hashlib
import urllib.parse
import httpx
import jwt as pyjwt  # PyJWT

from app.db.session import get_session
from app.models.user import User, TypeUser
from app.models.session_token import SessionToken, TokenType
from app.services.audit_service import log_event
from app.utils.session_jwt import create_session_jwt, decode_app_jwt
from app.core.config import settings
from app.services.auth_service import (
    is_user_authorized,
    sync_user_from_group,
    bulk_sync_group_members,
)
from app.services.supervisor_sync_service import resolve_and_link_supervisor

router = APIRouter(prefix="/auth/entra", tags=["Auth / Entra ID"])

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------

_AUTHORITY = f"https://login.microsoftonline.com/{settings.entra_tenant_id}"
_JWKS_URI = f"{_AUTHORITY}/discovery/v2.0/keys"
_LOGOUT_URL = f"{_AUTHORITY}/oauth2/v2.0/logout"

# Cargos que concedem is_supervisor=True
_SUPERVISOR_TITLES = [
    "gerente", "coordenador", "diretor", "superintendente",
    "chefe", "líder", "lider", "supervisor",
]

# Cache JWKS client
_jwks_client: pyjwt.PyJWKClient | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_jwks_client() -> pyjwt.PyJWKClient:
    """Retorna (e memoriza) o cliente JWKS do tenant."""
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = pyjwt.PyJWKClient(_JWKS_URI, cache_jwk_set=True, lifespan=3600)
    return _jwks_client


def _validate_id_token(token: str) -> dict:
    """
    Valida um id_token Microsoft Entra ID via JWKS.
    Verifica assinatura RS256, exp, iss e aud.
    """
    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
    except pyjwt.exceptions.PyJWKClientError as e:
        raise HTTPException(status_code=401, detail=f"JWKS indisponivel: {e}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token invalido: {e}")

    expected_issuer = f"{_AUTHORITY}/v2.0"
    valid_audiences = [settings.entra_client_id, f"api://{settings.entra_client_id}"]

    for audience in valid_audiences:
        try:
            return pyjwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=audience,
                issuer=expected_issuer,
            )
        except pyjwt.exceptions.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="id_token expirado.")
        except pyjwt.exceptions.InvalidIssuerError:
            raise HTTPException(status_code=401, detail="id_token com issuer invalido.")
        except pyjwt.exceptions.InvalidAudienceError:
            continue
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"id_token invalido: {e}")

    raise HTTPException(status_code=401, detail="id_token com audience invalida.")


def _enrich_from_graph(access_token: str) -> dict:
    """
    Busca dados complementares do Microsoft Graph API.

    Coleta:
    - Perfil do usuario (/me): jobTitle, department, employeeId
    - Manager do usuario (/me/manager): mail, displayName, jobTitle, department, employeeId
    - Foto do usuario (/me/photo/$value): base64 data URI
    """
    info: dict = {}
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        with httpx.Client(timeout=10.0) as client:
            # Perfil
            resp = client.get("https://graph.microsoft.com/v1.0/me", headers=headers)
            if resp.status_code == 200:
                prof = resp.json()
                info["job_title"] = prof.get("jobTitle")
                info["department"] = prof.get("department")
                info["employee_id"] = prof.get("employeeId")

            # Manager
            mgr_resp = client.get(
                "https://graph.microsoft.com/v1.0/me/manager"
                "?$select=displayName,mail,jobTitle,department,employeeId",
                headers=headers,
            )
            if mgr_resp.status_code == 200:
                mgr = mgr_resp.json()
                info["manager_email"] = mgr.get("mail")
                info["manager_name"] = mgr.get("displayName")
                info["manager_job_title"] = mgr.get("jobTitle")
                info["manager_department"] = mgr.get("department")
                info["manager_employee_id"] = mgr.get("employeeId")

            # Foto de perfil
            photo_resp = client.get(
                "https://graph.microsoft.com/v1.0/me/photo/$value", headers=headers
            )
            if photo_resp.status_code == 200:
                import base64 as _b64
                info["photo_url"] = (
                    f"data:image/jpeg;base64,{_b64.b64encode(photo_resp.content).decode()}"
                )
    except Exception:
        pass  # Graph indisponivel nao bloqueia login
    return info


def _issue_tokens(session: Session, user: User, request: Request | None = None) -> dict:
    """Emite access_token (JWT) e refresh_token para o usuario."""
    access_token = create_session_jwt(
        user_id=user.id,
        email=user.email,
        user_type=user.type,
        is_supervisor=user.is_supervisor,
        expires_minutes=480,  # 8 horas
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

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_value,
        "expires_in": 28800,  # 8h em segundos
        "token_type": "bearer",
    }


# ---------------------------------------------------------------------------
# 3. POST /auth/entra/refresh
# ---------------------------------------------------------------------------

@router.post("/refresh")
def refresh_token(
    request: Request,
    session: Session = Depends(get_session),
):
    """
    Renova o access_token usando um refresh_token valido.
    Espera o refresh_token no header X-Refresh-Token.
    """
    refresh_value: str | None = request.headers.get("X-Refresh-Token", "") or None

    if not refresh_value:
        raise HTTPException(status_code=401, detail="refresh_token ausente.")

    token_hash = hashlib.sha256(refresh_value.encode()).hexdigest()
    stored = session.exec(
        select(SessionToken).where(
            SessionToken.token_hash == token_hash,
            SessionToken.token_type == TokenType.REFRESH,
        )
    ).first()

    if not stored:
        raise HTTPException(status_code=401, detail="refresh_token invalido.")

    if stored.revoked:
        raise HTTPException(status_code=401, detail="refresh_token revogado.")

    if stored.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
        raise HTTPException(status_code=401, detail="refresh_token expirado.")

    user = session.get(User, stored.user_id)
    if not user or not user.status:
        raise HTTPException(status_code=403, detail="Usuario inativo.")

    # Revogar refresh token atual (rotation)
    stored.revoked = True
    stored.used = True
    session.add(stored)

    # Emitir novos tokens
    tokens = _issue_tokens(session, user, request)

    log_event(
        session=session,
        action="REFRESH_ENTRA",
        user_id=user.id,
        detail=f"email={user.email}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    if user.is_admin:
        display_type = "admin"
    elif user.is_supervisor:
        display_type = "supervisor"
    else:
        display_type = "internal"

    return {
        **tokens,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": display_type,
            "is_supervisor": user.is_supervisor,
            "is_admin": user.is_admin,
        },
    }


# ---------------------------------------------------------------------------
# 4. POST /auth/entra/logout
# ---------------------------------------------------------------------------

@router.post("/logout")
def logout(
    request: Request,
    session: Session = Depends(get_session),
):
    """
    Encerra a sessao: revoga todos os refresh tokens do usuario.
    Retorna a URL de logout Microsoft para o frontend redirecionar.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token ausente.")

    token = auth_header.split(" ", 1)[1]
    data = decode_app_jwt(token)
    if not data:
        raise HTTPException(status_code=401, detail="Token invalido.")

    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token sem user_id.")

    # Revogar todos os refresh tokens do usuario
    active_tokens = session.exec(
        select(SessionToken).where(
            SessionToken.user_id == user_id,
            SessionToken.token_type == TokenType.REFRESH,
            SessionToken.revoked == False,
        )
    ).all()
    for t in active_tokens:
        t.revoked = True
        session.add(t)
    session.commit()

    log_event(
        session=session,
        action="LOGOUT_ENTRA",
        user_id=user_id,
        detail=f"revoked_tokens={len(active_tokens)}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    ms_logout_url = (
        f"{_LOGOUT_URL}"
        f"?post_logout_redirect_uri={urllib.parse.quote(settings.frontend_external_portal_url)}"
    )

    return {
        "message": "Sessao encerrada com sucesso.",
        "ms_logout_url": ms_logout_url,
        "revoked_tokens": len(active_tokens),
    }


# ---------------------------------------------------------------------------
# 5. GET /auth/entra/me
# ---------------------------------------------------------------------------

@router.get("/me")
def get_me(
    request: Request,
    session: Session = Depends(get_session),
):
    """Retorna dados do usuario autenticado a partir do JWT interno."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token ausente.")

    token = auth_header.split(" ", 1)[1]
    data = decode_app_jwt(token)
    if not data:
        raise HTTPException(status_code=401, detail="Token invalido ou expirado.")

    user_id = data.get("user_id")
    user = session.get(User, user_id) if user_id else None

    if not user:
        raise HTTPException(status_code=401, detail="Usuario nao encontrado.")

    if not user.status:
        raise HTTPException(status_code=403, detail="Usuario desativado.")

    if user.is_admin:
        display_type = "admin"
    elif user.is_supervisor:
        display_type = "supervisor"
    else:
        display_type = user.type.value if hasattr(user.type, "value") else str(user.type)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": display_type,
        "is_supervisor": user.is_supervisor,
        "is_admin": user.is_admin,
        "department": user.department,
        "job_title": user.job_title,
        "employee_id": user.employee_id,
        "photo_url": user.photo_url,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "token_expires_at": data.get("exp"),
    }


# ---------------------------------------------------------------------------
# 6. GET /auth/entra/session-check
# ---------------------------------------------------------------------------

@router.get("/session-check")
def session_check(
    request: Request,
    session: Session = Depends(get_session),
):
    """
    Verifica se a sessao (JWT) e valida.
    Retorna status e tempo restante em segundos.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token ausente.")

    token = auth_header.split(" ", 1)[1]
    data = decode_app_jwt(token)
    if not data:
        raise HTTPException(status_code=401, detail="Sessao invalida ou expirada.")

    if data.get("iss") != "secure-share":
        raise HTTPException(status_code=401, detail="Token com issuer invalido.")

    user_id = data.get("user_id")
    user = session.get(User, user_id) if user_id else None
    if not user or not user.status:
        raise HTTPException(status_code=401, detail="Usuario invalido ou inativo.")

    exp = data.get("exp", 0)
    expires_in = max(0, int(exp - datetime.now(UTC).timestamp()))

    if user.is_admin:
        role = "admin"
    elif user.is_supervisor:
        role = "supervisor"
    else:
        role = user.type.value if hasattr(user.type, "value") else str(user.type)

    return {
        "valid": True,
        "user_id": user.id,
        "email": user.email,
        "role": role,
        "is_admin": user.is_admin,
        "expires_in": expires_in,
    }


# ---------------------------------------------------------------------------
# 7. POST /auth/entra/token  — fluxo SPA / MSAL
# ---------------------------------------------------------------------------

class _EntraTokenRequest(BaseModel):
    id_token: str
    access_token: str


@router.post("/token")
def exchange_msal_tokens(
    payload: _EntraTokenRequest,
    request: Request,
    session: Session = Depends(get_session),
):
    """
    Recebe id_token + access_token emitidos pelo MSAL no frontend (fluxo SPA).

    O MSAL conduz o Authorization Code + PKCE diretamente com a Microsoft.
    Este endpoint apenas valida os tokens, verifica grupo e emite JWT interno.

    Requer AUTH_MODE=entra no backend.

    Fluxo esperado:
      1. Frontend: msal.loginRedirect(loginRequest)
      2. Microsoft: redireciona para /auth/entra-callback com code
      3. MSAL: troca code por tokens (sem client_secret, via PKCE)
      4. Frontend: POST /api/auth/entra/token { id_token, access_token }
      5. Backend: valida, verifica grupo, sincroniza usuario, retorna JWT interno
    """
    if settings.auth_mode != "entra":
        raise HTTPException(
            status_code=403,
            detail="Autenticacao Entra ID desativada (AUTH_MODE != entra).",
        )

    # 1. Validar id_token via JWKS
    claims = _validate_id_token(payload.id_token)
    email = claims.get("preferred_username") or claims.get("email") or ""
    name = claims.get("name") or email.split("@")[0]

    if not email:
        raise HTTPException(status_code=401, detail="id_token sem email/UPN.")

    # 2. Verificar membership no grupo obrigatorio
    group_name = settings.entra_required_group_name
    group_id = settings.entra_required_group_id
    is_in_group = is_user_authorized(claims, payload.access_token)

    if not is_in_group:
        log_event(
            session=session,
            action="LOGIN_BLOCKED_NOT_IN_GROUP",
            user_id=None,
            detail=f"email={email}, group={group_name}, group_id={group_id}",
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None,
        )
        raise HTTPException(
            status_code=403,
            detail=f"Acesso negado. Voce nao pertence ao grupo autorizado: {group_name}. "
                   f"Solicite acesso ao seu gestor.",
        )

    # 3. Enriquecer perfil via Graph API
    graph_info = _enrich_from_graph(payload.access_token)

    # 4. Criar / atualizar usuario
    try:
        user = sync_user_from_group(
            session=session,
            email=email,
            name=name,
            claims=claims,
            graph_info=graph_info,
            is_in_group=True,
            ms_access_token=payload.access_token,
            request_ip=request.client.host if request else None,
            request_ua=request.headers.get("User-Agent") if request else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    # 5. Verificar se usuario esta ativo
    if not user.status:
        raise HTTPException(status_code=403, detail="Usuario desativado.")

    # 6. Supervisor sem subordinados nao acessa
    if user.is_supervisor:
        supervised_count = session.exec(
            select(func.count()).select_from(User).where(User.manager_id == user.id)
        ).one()
        if supervised_count == 0:
            log_event(
                session=session,
                action="LOGIN_BLOCKED_SUPERVISOR_NO_SUBORDINATES",
                user_id=user.id,
                detail=f"email={email}, supervised_count=0",
                ip=request.client.host if request else None,
                user_agent=request.headers.get("User-Agent") if request else None,
            )
            raise HTTPException(
                status_code=403,
                detail="Acesso negado. Voce esta registrado como supervisor mas nao possui "
                       "usuarios vinculados sob sua gestao. Aguarde a sincronizacao ou "
                       "contate o administrador.",
            )

    # 6.1 Atualizar last_login
    from zoneinfo import ZoneInfo
    user.last_login = datetime.now(ZoneInfo("America/Sao_Paulo"))
    session.add(user)
    session.commit()
    session.refresh(user)

    # 7. Emitir tokens internos
    tokens = _issue_tokens(session, user, request)

    # 8. Auditoria
    if user.is_admin:
        display_type = "admin"
    elif user.is_supervisor:
        display_type = "supervisor"
    else:
        display_type = user.type.value if hasattr(user.type, "value") else str(user.type)

    log_event(
        session=session,
        action="LOGIN_ENTRA_MSAL",
        user_id=user.id,
        detail=f"email={email}, role={display_type}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    # 8.1 Buscar manager para incluir na resposta
    manager_data = None
    if user.manager_id:
        manager_user = session.get(User, user.manager_id)
        if manager_user:
            manager_data = {
                "id": manager_user.id,
                "name": manager_user.name,
                "email": manager_user.email,
                "job_title": manager_user.job_title or "",
                "department": manager_user.department or "",
            }

    return {
        **tokens,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": display_type,
            "is_supervisor": user.is_supervisor,
            "is_admin": user.is_admin,
            "department": user.department or "",
            "job_title": user.job_title or "",
            "employee_id": user.employee_id or "",
            "photo_url": user.photo_url or "",
            "manager": manager_data,
        },
    }


# ---------------------------------------------------------------------------
# 8. POST /auth/entra/sync-group
# ---------------------------------------------------------------------------

@router.post("/sync-group")
def sync_group(
    request: Request,
    session: Session = Depends(get_session),
):
    """
    Endpoint administrativo: sincroniza todos os membros do grupo Entra ID
    com o banco de dados local.

    Requer autenticacao como supervisor ou admin.
    Requer um ms_access_token com permissao GroupMember.Read.All
    no header X-MS-Access-Token.
    """
    from app.utils.authz import get_current_user

    try:
        user = get_current_user(request, session)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Nao autenticado.")

    if not user.is_supervisor and not user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso restrito a supervisores e admins.")

    ms_token = request.headers.get("X-MS-Access-Token", "")
    if not ms_token:
        raise HTTPException(
            status_code=400,
            detail="Header X-MS-Access-Token obrigatorio com token Microsoft Graph.",
        )

    result = bulk_sync_group_members(
        session=session,
        admin_access_token=ms_token,
        request_ip=request.client.host if request else None,
        request_ua=request.headers.get("User-Agent") if request else None,
    )

    log_event(
        session=session,
        action="ADMIN_BULK_SYNC_GROUP",
        user_id=user.id,
        detail=str(result),
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return result
