"""
routes_mip_auth.py
==================
Endpoints para autenticaÃ§Ã£o MIP via Device Code Flow.

Problema resolvido: o app Microsoft "AIP Viewer" (c00e9d32) nao suporta
redirect URIs arbitrarios de terceiros, impossibilitando o popup MSAL no browser.

Solucao: o backend inicia o device code flow (Python MSAL, sem redirect URI),
o frontend exibe o codigo e link para o usuario, e o backend faz a sondagem
do token em background thread. Quando pronto, o frontend recebe os tokens
e re-submete o upload normalmente.

Endpoints:
  POST /api/v1/mip/auth/device-code    -> inicia fluxo, retorna user_code + link
  GET  /api/v1/mip/auth/token/{id}     -> sonda estado; 200 com tokens quando pronto
  DELETE /api/v1/mip/auth/{id}         -> descarta sessao (cancelamento)
"""

from __future__ import annotations

import threading
import uuid
from datetime import datetime, timedelta, UTC

import msal
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session

from app.core.config import settings
from app.db.session import get_session
from app.models.user import User
from app.services.audit_service import log_event
from app.utils.authz import get_current_user

router = APIRouter(prefix="/mip/auth", tags=["MIP Auth"])

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------

_AADRM_SCOPE  = "https://aadrm.com/user_impersonation"
_POLICY_SCOPE = "https://syncservice.o365syncservice.com/user_impersonation"

_SESSION_TTL  = timedelta(minutes=20)

# ---------------------------------------------------------------------------
# Armazenamento em memoria das sessoes pendentes
# ---------------------------------------------------------------------------
# { session_id: SessionState }
_sessions: dict[str, dict] = {}
_sessions_lock = threading.Lock()


def _get_tenant_id() -> str:
    tid = settings.entra_tenant_id
    if not tid:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ENTRA_TENANT_ID nao configurado.",
        )
    return tid


def _build_msal_app(tenant_id: str) -> msal.PublicClientApplication:
    return msal.PublicClientApplication(
        client_id=settings.mip_aip_viewer_client_id,
        authority=f"https://login.microsoftonline.com/{tenant_id}",
    )


def _cleanup_expired() -> None:
    """Remove sessoes expiradas. Chamado antes de operacoes de leitura/escrita."""
    now = datetime.now(UTC)
    with _sessions_lock:
        expired = [
            sid for sid, s in _sessions.items()
            if now - s["created_at"] > _SESSION_TTL
        ]
        for sid in expired:
            del _sessions[sid]


# ---------------------------------------------------------------------------
# Background thread: aguarda autenticacao e captura tokens
# ---------------------------------------------------------------------------

def _poll_in_background(session_id: str) -> None:
    """
    Executa em thread separada. Bloqueia em acquire_token_by_device_flow()
    ate o usuario autenticar ou o codigo expirar.
    """
    with _sessions_lock:
        session = _sessions.get(session_id)
    if not session:
        return

    app: msal.PublicClientApplication = session["app"]
    flow: dict = session["flow"]

    result = app.acquire_token_by_device_flow(flow)

    with _sessions_lock:
        if session_id not in _sessions:
            return  # sessao foi cancelada/expirada

        if "access_token" not in result:
            _sessions[session_id]["status"] = "error"
            _sessions[session_id]["error"] = (
                result.get("error_description")
                or result.get("error")
                or "Autenticacao falhou ou codigo expirou."
            )
            return

        aadrm_token = result["access_token"]

        # Tenta obter o policy token silenciosamente (usa refresh token cacheado)
        policy_token: str | None = None
        try:
            accounts = app.get_accounts()
            if accounts:
                pr = app.acquire_token_silent(
                    scopes=[_POLICY_SCOPE],
                    account=accounts[0],
                )
                policy_token = pr.get("access_token") if pr else None
        except Exception:
            pass

        _sessions[session_id]["status"]       = "ready"
        _sessions[session_id]["aadrm_token"]  = aadrm_token
        _sessions[session_id]["policy_token"] = policy_token


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/device-code", summary="Inicia Device Code Flow para tokens MIP")
def start_device_code(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Inicia o Device Code Flow com o app AIP Viewer (pre-aprovado no tenant).
    Retorna o codigo e o link que o usuario deve acessar para autorizar.
    """
    _cleanup_expired()

    tenant_id = _get_tenant_id()
    app = _build_msal_app(tenant_id)

    flow = app.initiate_device_flow(scopes=[_AADRM_SCOPE])
    if "user_code" not in flow:
        err = flow.get("error_description") or flow.get("error") or "Falha ao iniciar autenticacao MIP."
        log_event(
            session=db,
            action="MIP_AUTH_DEVICE_CODE_FALHOU",
            user_id=current_user.id,
            detail=f"Falha ao iniciar device code flow: {err}",
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=err,
        )

    session_id = str(uuid.uuid4())
    with _sessions_lock:
        _sessions[session_id] = {
            "created_at":   datetime.now(UTC),
            "status":       "pending",   # pending | ready | error
            "app":          app,
            "flow":         flow,
            "aadrm_token":  None,
            "policy_token": None,
            "error":        None,
            "user_id":      current_user.id,
        }

    # Thread em background aguarda o usuario autenticar
    t = threading.Thread(target=_poll_in_background, args=(session_id,), daemon=True)
    t.start()

    log_event(
        session=db,
        action="MIP_AUTH_DEVICE_CODE_INICIADO",
        user_id=current_user.id,
        detail=f"session_id={session_id}, expires_in={flow.get('expires_in', 900)}s",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {
        "session_id":       session_id,
        "user_code":        flow["user_code"],
        "verification_uri": flow["verification_uri"],
        "expires_in":       flow.get("expires_in", 900),
    }


@router.get("/token/{session_id}", summary="Sonda o estado da autenticacao MIP")
def poll_token(
    session_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Sonda se o usuario ja completou a autenticacao.

    Respostas:
    - 200 { status: "pending" }                                  -> ainda nao autenticou
    - 200 { status: "ready", aadrm_token, policy_token }         -> pronto para upload
    - 400 { detail: "..." }                                      -> erro ou expirado
    - 404                                                        -> sessao nao encontrada
    """
    _cleanup_expired()

    with _sessions_lock:
        session_data = _sessions.get(session_id)

    if not session_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessao nao encontrada ou expirada.")

    s = session_data["status"]

    if s == "pending":
        return {"status": "pending"}

    if s == "ready":
        aadrm_token  = session_data["aadrm_token"]
        policy_token = session_data["policy_token"]
        with _sessions_lock:
            _sessions.pop(session_id, None)

        log_event(
            session=db,
            action="MIP_AUTH_CONCLUIDA",
            user_id=current_user.id,
            detail=(
                f"session_id={session_id}, "
                f"policy_token={'presente' if policy_token else 'ausente'}"
            ),
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None,
        )

        return {
            "status":       "ready",
            "aadrm_token":  aadrm_token,
            "policy_token": policy_token,
        }

    # status == "error"
    error_msg = session_data.get("error", "Autenticacao MIP falhou.")
    with _sessions_lock:
        _sessions.pop(session_id, None)

    log_event(
        session=db,
        action="MIP_AUTH_FALHOU",
        user_id=current_user.id,
        detail=f"session_id={session_id}, erro={error_msg}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.delete("/{session_id}", summary="Cancela sessao de autenticacao MIP")
def cancel_session(
    session_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Remove a sessao pendente (usuario cancelou o modal)."""
    with _sessions_lock:
        _sessions.pop(session_id, None)

    log_event(
        session=db,
        action="MIP_AUTH_CANCELADA",
        user_id=current_user.id,
        detail=f"session_id={session_id}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {"ok": True}

