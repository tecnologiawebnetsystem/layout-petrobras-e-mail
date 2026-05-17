"""
Autenticacao via Microsoft Entra ID — fluxo Authorization Code (backend-driven).

O frontend NAO lida com MSAL/tokens Microsoft diretamente.
Todo o fluxo OAuth2 e conduzido pelo backend:

  1. GET  /auth/entra/authorize     → redireciona para login.microsoftonline.com
  2. GET  /auth/entra/callback      → recebe code, troca por tokens, emite JWT interno
  3. POST /auth/entra/refresh       → renova access_token via refresh_token
  4. POST /auth/entra/logout        → revoga tokens, retorna URL de logout Microsoft
  5. GET  /auth/entra/me            → dados do usuario autenticado
  6. GET  /auth/entra/session-check → verifica se sessao (JWT) e valida

Nenhum mock, fallback local ou token fake e aceito.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse, JSONResponse
from sqlmodel import Session, select
from datetime import datetime, timedelta, UTC
from typing import Optional
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
from app.services.group_sync_service import (
    check_user_in_group,
    sync_user_from_group,
    bulk_sync_group_members,
)
from app.services.supervisor_sync_service import resolve_and_link_supervisor

router = APIRouter(prefix="/auth/entra", tags=["Auth / Entra ID"])

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------

_AUTHORITY = f"https://login.microsoftonline.com/{settings.entra_tenant_id}"
_AUTHORIZE_URL = f"{_AUTHORITY}/oauth2/v2.0/authorize"
_TOKEN_URL = f"{_AUTHORITY}/oauth2/v2.0/token"
_JWKS_URI = f"{_AUTHORITY}/discovery/v2.0/keys"
_LOGOUT_URL = f"{_AUTHORITY}/oauth2/v2.0/logout"

# Scopes solicitados ao Microsoft
# GroupMember.Read.All: necessario para verificar membership no grupo obrigatorio
_SCOPES = "openid profile email User.Read GroupMember.Read.All"

# Cargos que concedem is_supervisor=True (provisorio ate integracao ServiceNow)
_SUPERVISOR_TITLES = [
    "gerente", "coordenador", "diretor", "superintendente",
    "chefe", "líder", "lider", "supervisor",
]

# Cache JWKS client
_jwks_client: pyjwt.PyJWKClient | None = None

# In-memory state store (em producao usar Redis/DB com TTL)
_pending_states: dict[str, dict] = {}


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
            # Manager — coletar dados completos
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
            # Foto
            photo_resp = client.get(
                "https://graph.microsoft.com/v1.0/me/photo/$value", headers=headers
            )
            if photo_resp.status_code == 200:
                import base64 as _b64
                ct = photo_resp.headers.get("Content-Type", "image/jpeg")
                info["photo_url"] = f"data:{ct};base64,{_b64.b64encode(photo_resp.content).decode()}"
    except Exception:
        pass  # Graph indisponivel nao bloqueia login
    return info


def _sync_user(
    session: Session,
    email: str,
    name: str,
    claims: dict,
    graph_info: dict,
    ms_access_token: Optional[str] = None,
    request_ip: Optional[str] = None,
    request_ua: Optional[str] = None,
) -> User:
    """
    Cria ou atualiza usuario no banco local a partir dos dados Entra + Graph.

    Apos criar/atualizar o usuario, chama resolve_and_link_supervisor()
    para auto-criar o supervisor caso nao exista na base e vincular via manager_id.
    """
    groups = set(claims.get("groups", []))
    sup_groups = set(settings.entra_supervisor_group_ids or [])
    is_supervisor = bool(groups.intersection(sup_groups))

    job_title = graph_info.get("job_title")
    if not is_supervisor and job_title:
        if any(t in job_title.lower() for t in _SUPERVISOR_TITLES):
            is_supervisor = True

    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        user = User(
            email=email,
            name=name,
            type=TypeUser.INTERNAL,
            is_supervisor=is_supervisor,
            department=graph_info.get("department"),
            job_title=job_title,
            employee_id=graph_info.get("employee_id"),
            photo_url=(graph_info.get("photo_url") or "")[:500] or None,
            last_login=datetime.now(UTC),
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    else:
        user.name = name
        user.type = TypeUser.INTERNAL
        if job_title is not None:
            user.job_title = job_title
        if graph_info.get("department") is not None:
            user.department = graph_info["department"]
        if graph_info.get("employee_id") is not None:
            user.employee_id = graph_info["employee_id"]
        if graph_info.get("photo_url"):
            user.photo_url = graph_info["photo_url"][:500]
        user.last_login = datetime.now(UTC)
        session.add(user)
        session.commit()
        session.refresh(user)

    # Auto-criar e vincular supervisor (se Graph retornou manager)
    resolve_and_link_supervisor(
        session=session,
        user=user,
        graph_info=graph_info,
        ms_access_token=ms_access_token,
        request_ip=request_ip,
        request_ua=request_ua,
    )

    return user


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
# 1. GET /auth/entra/authorize
# ---------------------------------------------------------------------------

@router.get("/authorize")
def authorize(request: Request):
    """
    Inicia o fluxo OAuth2 Authorization Code.
    Redireciona o browser para login.microsoftonline.com.
    """
    if not settings.entra_tenant_id or not settings.entra_client_id:
        raise HTTPException(
            status_code=503,
            detail="Entra ID nao configurado no servidor. Contacte o administrador.",
        )

    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(16)

    # Armazena state para validacao no callback (CSRF protection)
    _pending_states[state] = {
        "nonce": nonce,
        "created_at": datetime.now(UTC).isoformat(),
        "ip": request.client.host if request else None,
    }

    # Limpa states antigos (> 10 min)
    cutoff = datetime.now(UTC) - timedelta(minutes=10)
    expired_keys = [
        k for k, v in _pending_states.items()
        if datetime.fromisoformat(v["created_at"]) < cutoff
    ]
    for k in expired_keys:
        _pending_states.pop(k, None)

    params = {
        "client_id": settings.entra_client_id,
        "response_type": "code",
        "redirect_uri": settings.entra_redirect_uri,
        "scope": _SCOPES,
        "state": state,
        "nonce": nonce,
        "response_mode": "query",
        "prompt": "select_account",
    }
    auth_url = f"{_AUTHORIZE_URL}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=auth_url, status_code=302)


# ---------------------------------------------------------------------------
# 2. GET /auth/entra/callback
# ---------------------------------------------------------------------------

@router.get("/callback")
def callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    session: Session = Depends(get_session),
    request: Request = None,
):
    """
    Callback do Microsoft Entra ID.
    Recebe o authorization code, troca por tokens, cria sessao interna.
    Redireciona para o frontend com os tokens.
    """
    # Erro retornado pelo Microsoft
    if error:
        frontend_url = settings.frontend_external_portal_url
        err_msg = urllib.parse.quote(error_description or error)
        return RedirectResponse(
            url=f"{frontend_url}/auth/entra-callback?error={err_msg}",
            status_code=302,
        )

    if not code:
        raise HTTPException(status_code=400, detail="Parametro 'code' ausente.")

    # Validar state (CSRF protection)
    if not state or state not in _pending_states:
        raise HTTPException(status_code=403, detail="State invalido (possivel CSRF).")

    state_data = _pending_states.pop(state)

    # Trocar code por tokens na Microsoft
    token_data = {
        "client_id": settings.entra_client_id,
        "client_secret": settings.entra_client_secret,
        "code": code,
        "redirect_uri": settings.entra_redirect_uri,
        "grant_type": "authorization_code",
        "scope": _SCOPES,
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            token_resp = client.post(_TOKEN_URL, data=token_data)
    except httpx.TimeoutException:
        raise HTTPException(status_code=502, detail="Timeout ao contactar Microsoft.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erro ao contactar Microsoft: {e}")

    if token_resp.status_code != 200:
        detail = "Falha na troca do code por tokens."
        try:
            err_body = token_resp.json()
            detail = err_body.get("error_description", detail)
        except Exception:
            pass
        raise HTTPException(status_code=401, detail=detail)

    token_json = token_resp.json()
    id_token = token_json.get("id_token")
    ms_access_token = token_json.get("access_token")

    if not id_token:
        raise HTTPException(status_code=401, detail="Microsoft nao retornou id_token.")

    # Validar id_token via JWKS
    claims = _validate_id_token(id_token)

    email = claims.get("preferred_username") or claims.get("email") or ""
    name = claims.get("name") or email.split("@")[0]

    if not email:
        raise HTTPException(status_code=401, detail="id_token sem email/UPN.")

    # Enriquecer com Graph API (usa ms_access_token)
    graph_info = _enrich_from_graph(ms_access_token) if ms_access_token else {}

    # -----------------------------------------------------------------------
    # Verificar membership no grupo obrigatorio ANTES de criar/emitir tokens
    # -----------------------------------------------------------------------
    is_in_group = True  # default: permitir se grupo nao configurado
    group_name = settings.entra_required_group_name
    group_id = settings.entra_required_group_id

    if group_id and ms_access_token:
        is_in_group = check_user_in_group(ms_access_token)

    if not is_in_group:
        strategy = settings.entra_group_sync_strategy
        # Log de bloqueio
        log_event(
            session=session,
            action="LOGIN_BLOCKED_NOT_IN_GROUP",
            user_id=None,
            detail=f"email={email}, group={group_name}, group_id={group_id}, strategy={strategy}",
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None,
        )

        if strategy == "deactivate":
            # Desativa usuario se existir
            try:
                sync_user_from_group(
                    session=session,
                    email=email,
                    name=name,
                    claims=claims,
                    graph_info=graph_info,
                    is_in_group=False,
                    request_ip=request.client.host if request else None,
                    request_ua=request.headers.get("User-Agent") if request else None,
                )
            except ValueError:
                pass  # usuario nao existe e nao sera criado

        # Redirecionar com erro
        frontend_url = settings.frontend_external_portal_url
        err_msg = urllib.parse.quote(
            f"Acesso negado. Voce nao pertence ao grupo autorizado: {group_name}. "
            f"Solicite acesso ao seu gestor."
        )
        return RedirectResponse(
            url=f"{frontend_url}/auth/entra-callback?error={err_msg}",
            status_code=302,
        )

    # Criar/atualizar usuario via group sync (garante status=True)
    try:
        user = sync_user_from_group(
            session=session,
            email=email,
            name=name,
            claims=claims,
            graph_info=graph_info,
            is_in_group=True,
            request_ip=request.client.host if request else None,
            request_ua=request.headers.get("User-Agent") if request else None,
        )
    except ValueError as e:
        frontend_url = settings.frontend_external_portal_url
        err_msg = urllib.parse.quote(str(e))
        return RedirectResponse(
            url=f"{frontend_url}/auth/entra-callback?error={err_msg}",
            status_code=302,
        )

    # Verificar se usuario esta ativo
    if not user.status:
        raise HTTPException(status_code=403, detail="Usuario desativado.")

    # Emitir tokens internos
    tokens = _issue_tokens(session, user, request)

    # Log de auditoria
    log_event(
        session=session,
        action="LOGIN_ENTRA_AUTHCODE",
        user_id=user.id,
        detail=f"email={email}, is_supervisor={user.is_supervisor}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    # Redirecionar para o frontend com tokens
    frontend_url = settings.frontend_external_portal_url
    display_type = "admin" if user.is_admin else ("supervisor" if user.is_supervisor else "internal")

    # Montar user_info para o frontend
    user_info = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": display_type,
        "is_supervisor": user.is_supervisor,
        "is_admin": user.is_admin,
        "department": user.department or "",
        "job_title": user.job_title or "",
        "employee_id": user.employee_id or "",
    }
    if graph_info.get("photo_url"):
        user_info["photo_url"] = graph_info["photo_url"][:500]

    import json
    user_info_encoded = urllib.parse.quote(json.dumps(user_info))

    redirect_url = (
        f"{frontend_url}/auth/entra-callback"
        f"?access_token={tokens['access_token']}"
        f"&refresh_token={tokens['refresh_token']}"
        f"&expires_in={tokens['expires_in']}"
        f"&user_info={user_info_encoded}"
    )
    return RedirectResponse(url=redirect_url, status_code=302)


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
    Espera JSON: {"refresh_token": "..."}
    """
    try:
        body = None
        import json
        # FastAPI nao parseia body automaticamente em sync endpoints sem Pydantic model
        # Vamos ler do header ou body
    except Exception:
        pass

    # Tentar obter refresh_token do body ou header
    refresh_value: str | None = None

    # Tenta do Authorization header (Bearer refresh_token)
    auth_header = request.headers.get("X-Refresh-Token", "")
    if auth_header:
        refresh_value = auth_header

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

    if stored.expires_at < datetime.now(UTC):
        raise HTTPException(status_code=401, detail="refresh_token expirado.")

    # Buscar usuario
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

    display_type = "supervisor" if user.is_supervisor else "internal"
    return {
        **tokens,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": display_type,
            "is_supervisor": user.is_supervisor,
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
    # Obter usuario do Bearer token
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

    # URL de logout Microsoft
    frontend_url = settings.frontend_external_portal_url
    ms_logout_url = (
        f"{_LOGOUT_URL}"
        f"?post_logout_redirect_uri={urllib.parse.quote(frontend_url)}"
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
    """
    Retorna dados do usuario autenticado.
    Valida o JWT interno (Bearer token).
    """
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

    display_type = "supervisor" if user.is_supervisor else user.type.value if hasattr(user.type, "value") else str(user.type)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": display_type,
        "is_supervisor": user.is_supervisor,
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
    Retorna status e tempo restante.
    Nao aceita tokens fake, expirados ou de outro issuer.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token ausente.")

    token = auth_header.split(" ", 1)[1]
    data = decode_app_jwt(token)
    if not data:
        raise HTTPException(status_code=401, detail="Sessao invalida ou expirada.")

    # Verificar issuer
    if data.get("iss") != "secure-share":
        raise HTTPException(status_code=401, detail="Token com issuer invalido.")

    # Verificar usuario no banco
    user_id = data.get("user_id")
    user = session.get(User, user_id) if user_id else None
    if not user or not user.status:
        raise HTTPException(status_code=401, detail="Usuario invalido ou inativo.")

    # Calcular tempo restante
    exp = data.get("exp", 0)
    now_ts = datetime.now(UTC).timestamp()
    expires_in = max(0, int(exp - now_ts))

    return {
        "valid": True,
        "user_id": user.id,
        "email": user.email,
        "role": "supervisor" if user.is_supervisor else (user.type.value if hasattr(user.type, "value") else str(user.type)),
        "expires_in": expires_in,
    }


# ---------------------------------------------------------------------------
# 7. POST /auth/entra/sync-group
# ---------------------------------------------------------------------------

@router.post("/sync-group")
def sync_group(
    request: Request,
    session: Session = Depends(get_session),
):
    """
    Endpoint administrativo: sincroniza todos os membros do grupo Entra ID
    com o banco de dados local.

    Requer autenticacao como supervisor.
    Requer um ms_access_token com permissao GroupMember.Read.All
    passado no header X-MS-Access-Token.

    Acoes executadas:
    - Cria usuarios que estao no grupo mas nao no banco
    - Atualiza dados de usuarios existentes
    - Desativa usuarios internos que NAO estao mais no grupo

    Retorna relatorio detalhado da sincronizacao.
    """
    from app.utils.authz import get_current_user

    # Autenticar supervisor
    try:
        user = get_current_user(request, session)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Nao autenticado.")

    if not user.is_supervisor:
        raise HTTPException(status_code=403, detail="Acesso restrito a supervisores.")

    # Obter ms_access_token do header
    ms_token = request.headers.get("X-MS-Access-Token", "")
    if not ms_token:
        raise HTTPException(
            status_code=400,
            detail="Header X-MS-Access-Token obrigatorio com token Microsoft Graph.",
        )

    # Verificar grupo configurado
    if not settings.entra_required_group_id:
        raise HTTPException(
            status_code=503,
            detail="ENTRA_REQUIRED_GROUP_ID nao configurado no servidor.",
        )

    # Executar sync
    result = bulk_sync_group_members(
        session=session,
        admin_access_token=ms_token,
        request_ip=request.client.host if request else None,
        request_ua=request.headers.get("User-Agent") if request else None,
    )

    if "error" in result:
        raise HTTPException(status_code=502, detail=result["error"])

    # Log de auditoria
    log_event(
        session=session,
        action="BULK_GROUP_SYNC",
        user_id=user.id,
        detail=(
            f"group={result['group_name']}, "
            f"created={result['created']}, "
            f"updated={result['updated']}, "
            f"reactivated={result['reactivated']}, "
            f"deactivated={result['deactivated']}"
        ),
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {
        "message": "Sincronizacao concluida com sucesso.",
        **result,
    }


# ---------------------------------------------------------------------------
# 8. GET /auth/entra/group-info
# ---------------------------------------------------------------------------

@router.get("/group-info")
def group_info(
    request: Request,
    session: Session = Depends(get_session),
):
    """
    Retorna informacoes sobre o grupo obrigatorio configurado.
    Endpoint publico (sem autenticacao) para exibir na tela de login/erro.
    """
    return {
        "group_id": settings.entra_required_group_id or None,
        "group_name": settings.entra_required_group_name,
        "sync_strategy": settings.entra_group_sync_strategy,
        "configured": bool(settings.entra_required_group_id),
    }
