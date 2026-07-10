from __future__ import annotations

from datetime import UTC, datetime, timedelta
import hashlib
import secrets
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.config import settings
from app.db.session import get_session
from app.models.session_token import SessionToken, TokenType
from app.models.user import User
from app.services.audit_service import log_event
from app.services.auth_service import issue_internal_tokens, resolve_primary_role, sync_user_from_access
from app.services.cav4_auth_service import (
    exchange_code_for_tokens,
    extract_user_login,
    generate_pkce,
    get_authorization_url,
    get_cav4_roles,
    resolve_access_from_cav4_roles,
    validate_cav4_id_token,
)
from app.services.graph_service import enrich_graph_profile_by_upn
from app.utils.authz import get_current_user
from app.utils.session_jwt import decode_app_jwt

from app.services.authorization_service import resolve_permissions
from app.services.cav4_client import cav4_client, Cav4ClientError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth/cav4", tags=["Auth / CAv4"])

_PENDING_AUTH: dict[str, dict[str, str | datetime]] = {}
_PENDING_TTL_MINUTES = 10


class CAv4TokenRequest(BaseModel):
    """Payload do frontend/BFF para concluir o exchange via endpoint de token."""
    code: str
    state: str


def _cleanup_pending_auth() -> None:
    """Remove registros de autenticacao pendentes expirados (state/nonce/verifier)."""
    now = datetime.now(UTC)
    expired = [k for k, v in _PENDING_AUTH.items() if v["expires_at"] < now]
    for key in expired:
        _PENDING_AUTH.pop(key, None)


def _assert_cav4_mode() -> None:
    """Bloqueia uso das rotas CAv4 quando AUTH_MODE nao estiver em cav4."""
    if settings.auth_mode != "cav4":
        raise HTTPException(
            status_code=403,
            detail="Autenticacao CAv4 desativada (AUTH_MODE != cav4).",
        )


def _resolve_email(claims: dict, user_login: str) -> str:
    """Resolve email do usuario a partir das claims; usa fallback previsivel por matricula."""
    email = (claims.get("email") or claims.get("preferred_username") or "").strip().lower()
    if email:
        return email
    
    
    fallback_email = f"{user_login}@petrobras.com.br"

    logger.warning(
        "Email não presente no token. Aplicando fallback controlado para login=%s",
        user_login
    )

    return fallback_email



def _build_manager_data(session: Session, user: User) -> dict | None:
    """Monta bloco de gestor para manter compatibilidade com contrato atual do frontend."""
    if not user.manager_id:
        return None
    manager_user = session.get(User, user.manager_id)
    if not manager_user:
        return None
    return {
        "id": manager_user.id,
        "name": manager_user.name,
        "email": manager_user.email,
        "job_title": manager_user.job_title or "",
        "department": manager_user.department or "",
    }


def _complete_cav4_exchange(
    *,
    code: str,
    state: str,
    session: Session,
    request: Request,
) -> dict:
    """Executa fluxo completo de troca de codigo, validacao e emissao de tokens internos.

    Etapas:
    1) valida state + recupera code_verifier/nonce
    2) troca code por tokens no CAv4
    3) valida id_token e extrai user_login
    4) consulta/mapeia roles corporativos
    5) sincroniza usuario local e emite JWT interno
    """
    _cleanup_pending_auth()
    pending = _PENDING_AUTH.pop(state, None)

    if not pending:
        raise HTTPException(status_code=401, detail="State invalido ou expirado.")

    code_verifier = str(pending["code_verifier"])
    expected_nonce = str(pending["nonce"])

    token_payload = exchange_code_for_tokens(code=code, code_verifier=code_verifier)

    id_token = token_payload.get("id_token")
    access_token = token_payload.get("access_token")
    if not id_token or not access_token:
        raise HTTPException(status_code=401, detail="Resposta de token do CAv4 incompleta.")

    claims = validate_cav4_id_token(id_token)

    
    # ✅ LOG PARA EVIDÊNCIA DO CARD
    token_roles = claims.get("roles") or claims.get("groups") or []
    print(f"[DEBUG TOKEN] Roles no token: {bool(token_roles)} | quantidade={len(token_roles)}")


    nonce = str(claims.get("nonce") or "")
    if expected_nonce and nonce and nonce != expected_nonce:
        raise HTTPException(status_code=401, detail="Nonce invalido no id_token.")

    user_login = extract_user_login(claims)
    if not user_login:
        raise HTTPException(status_code=401, detail="Nao foi possivel extrair user_login.")

    cav4_roles = get_cav4_roles(login=user_login, access_token=access_token)
    access_info = resolve_access_from_cav4_roles(cav4_roles)

    role = access_info["role"]
    
    try:
        permissions = cav4_client.get_user_resources(
            token=access_token,
            user_login=user_login
        )
        logger.error(
            "TESTE_CAV4_RESOURCES=%s",
            permissions
        )
        logger.error(
            "TIPO_RESOURCES=%s",
            type(permissions)
        )
        
        logger.info(
            "PERMISSIONS_VINDAS_CAV4 role=%s permissions=%s",
            role,
            permissions
        )

    except Cav4ClientError as e:

        logger.warning(
            "Falha ao obter resources do CAV4. Aplicando fallback local. erro=%s",
            str(e)
        )

        permissions = resolve_permissions([role])


    logger.info(
        "Permissions resolvidas para usuário: role=%s permissions=%s",
        role,
        permissions
    )


    if not access_info["authorized"]:
        if settings.debug:
            raise HTTPException(
                status_code=403,
                detail={
                    "message": "Acesso negado pelos roles do CAv4.",
                    "roles_recebidos": cav4_roles,
                    "roles_esperados": {
                        "admin": settings.cav4_admin_role_names,
                        "supervisor": settings.cav4_supervisor_role_names,
                        "internal": settings.cav4_internal_role_names,
                    },
                },
            )
        raise HTTPException(status_code=403, detail="Acesso negado pelos roles do CAv4.")

    email = _resolve_email(claims, user_login)
    name = (claims.get("name") or user_login).strip()

    # ── Enriquecimento de perfil via Microsoft Graph ─────────────────────────
    # Busca cargo, departamento, gestor e foto usando a matrícula CAv4 (user_login)
    # como onPremisesSamAccountName — estratégia validada para usuários Petrobras.
    # Retorna dict com Nones se Graph não estiver configurado ou falhar,
    # sem bloquear o login (a menos que GRAPH_REQUIRED=true).
    try:
        graph_info = enrich_graph_profile_by_upn(email, employee_id=user_login)
    except Exception as exc:
        logger.exception("Falha no enrich_graph_profile_by_upn: %s", exc)
        graph_info = {
            "job_title": None,
            "department": None,
            "employee_id": None,
            "login_cav4": None,
            "manager_email": None,
            "manager_name": None,
            "manager_employee_id": None,
            "photo_url": None,
        }

    # ── Verificação de Postura de Falha do Graph ───────────────────────────
    # Se GRAPH_REQUIRED=true, bloqueia login se Graph falhou ou dados incompletos.
    # Se GRAPH_REQUIRED=false (padrão), continua mesmo sem dados do Graph.
    if settings.graph_required:
        has_enriched_data = any([
            graph_info.get("job_title"),
            graph_info.get("department"),
            graph_info.get("manager_email"),
        ])
        if not has_enriched_data:
            logger.warning(
                "GRAPH_REQUIRED=true mas enriquecimento falhou para user_login=%s; negando acesso",
                user_login,
            )
            raise HTTPException(
                status_code=503,
                detail="Serviço de enriquecimento de perfil indisponível. Tente novamente em instantes.",
            )

    # Garante employee_id mesmo sem Graph
    if not graph_info.get("employee_id"):
        graph_info["employee_id"] = user_login

    user = sync_user_from_access(
        session=session,
        email=email,
        name=name,
        graph_info=graph_info,
        access_info=access_info,
        request_ip=request.client.host if request else None,
        request_ua=request.headers.get("User-Agent") if request else None,
        access_token=access_token,
        user_login=user_login,
    )

    if not user.status:
        raise HTTPException(status_code=403, detail="Usuario desativado.")

    tokens = issue_internal_tokens(session, user, request, roles=[role], permissions=permissions)
    manager_data = _build_manager_data(session, user)

    role = resolve_primary_role(user)

    log_event(
        session=session,
        action="LOGIN_CAV4",
        user_id=user.id,
        detail=f"email={email}, role={role}, login={user_login}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {
        **tokens,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": role,
            "is_supervisor": user.is_supervisor,
            "is_admin": user.is_admin,
            "department": user.department or "",
            "job_title": user.job_title or "",
            "employee_id": user.employee_id or "",
            "photo_url": user.photo_url or "",
            "manager": manager_data,
        },
    }


@router.get("/login")
def cav4_login() -> RedirectResponse:
    """Inicia login CAv4: gera state/nonce/PKCE e redireciona para authorization endpoint."""
    _assert_cav4_mode()

    _cleanup_pending_auth()

    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    code_verifier, code_challenge = generate_pkce()

    _PENDING_AUTH[state] = {
        "code_verifier": code_verifier,
        "nonce": nonce,
        "expires_at": datetime.now(UTC) + timedelta(minutes=_PENDING_TTL_MINUTES),
    }

    auth_url = get_authorization_url(state=state, nonce=nonce, code_challenge=code_challenge)
    return RedirectResponse(auth_url, status_code=302)


@router.get("/callback")
def cav4_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    session: Session = Depends(get_session),
):
    """Callback server-side do OIDC: conclui o exchange a partir de code/state recebidos."""
    _assert_cav4_mode()
    return _complete_cav4_exchange(code=code, state=state, session=session, request=request)


@router.post("/token")
def cav4_token_exchange(
    payload: CAv4TokenRequest,
    request: Request,
    session: Session = Depends(get_session),
):
    """Alternativa ao callback GET para BFF: conclui exchange recebendo code/state em JSON."""
    _assert_cav4_mode()
    return _complete_cav4_exchange(
        code=payload.code,
        state=payload.state,
        session=session,
        request=request,
    )


@router.get("/graph-me")
def cav4_graph_me(
    current_user: User = Depends(get_current_user),
):
    """Endpoint de diagnostico do enriquecimento via Graph para o usuario autenticado.

    Uso esperado:
    - suporte operacional e validacao de dados (ex.: cargo da gestora)
    - comparacao entre dados locais (user) e retorno atual do Graph (graph)

    Observacao:
    - nao participa do fluxo principal de autenticacao/sessao
    - nao persiste alteracoes no banco
    """
    _assert_cav4_mode()

    user_login = current_user.login_cav4 or current_user.employee_id or extract_user_login({
        "email": current_user.email,
        "preferred_username": current_user.email,
    })
    graph_info = enrich_graph_profile_by_upn(current_user.email, employee_id=user_login)

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "login_cav4": current_user.login_cav4 or "",
            "employee_id": current_user.employee_id or "",
            "job_title": current_user.job_title or "",
            "department": current_user.department or "",
        },
        "graph": graph_info,
    }


@router.post("/refresh")
def refresh_token(
    request: Request,
    session: Session = Depends(get_session),
):
    """Renova sessao interna via refresh token e aplica refresh rotation."""
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

    stored.revoked = True
    stored.used = True
    session.add(stored)

    # ── CORREÇÃO: reemitir com roles e permissions ──────────────────────
    role = resolve_primary_role(user)
    roles_list = [role]
    permissions = resolve_permissions(roles_list)
    tokens = issue_internal_tokens(
        session, user, request,
        roles=roles_list,
        permissions=permissions,
    )
    # ───────────────────────────────────────────────────────────────────

    log_event(
        session=session,
        action="REFRESH_CAV4",
        user_id=user.id,
        detail=f"email={user.email}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    display_type = role  # já resolvido acima, não precisa recalcular

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



@router.post("/logout")
def logout(
    request: Request,
    session: Session = Depends(get_session),
):
    """Encerra sessao local revogando refresh tokens ativos do usuario autenticado."""
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

    active_tokens = session.exec(
        select(SessionToken).where(
            SessionToken.user_id == user_id,
            SessionToken.token_type == TokenType.REFRESH,
            SessionToken.revoked == False,
        )
    ).all()
    for item in active_tokens:
        item.revoked = True
        session.add(item)
    session.commit()

    log_event(
        session=session,
        action="LOGOUT_CAV4",
        user_id=user_id,
        detail=f"revoked_tokens={len(active_tokens)}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {
        "message": "Sessao encerrada com sucesso.",
        "revoked_tokens": len(active_tokens),
    }


@router.get("/session-check")
def session_check(
    request: Request,
    session: Session = Depends(get_session),
):
    """Valida JWT interno vigente e retorna estado de sessao para o frontend."""
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

    role = resolve_primary_role(user)

    return {
        "valid": True,
        "user_id": user.id,
        "email": user.email,
        "role": role,
        "is_admin": user.is_admin,
        "expires_in": expires_in,
    }
