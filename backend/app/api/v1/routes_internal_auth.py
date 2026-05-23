"""
Rotas de autenticacao interna — modo local (dev/test).

Endpoints exclusivos para quando AUTH_MODE=local:
  POST /auth/internal/signup  — cadastro manual de usuario (apenas local)
  POST /auth/internal/login   — login por email+senha (apenas local)
  POST /auth/internal/logout  — logout

Em producao (AUTH_MODE=entra) use o fluxo em /auth/entra/* (Authorization Code).
Todas as acoes geram log de auditoria na tabela 'audit'.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select
from datetime import datetime, UTC
from zoneinfo import ZoneInfo
from typing import Optional
import json
from app.db.session import get_session
from app.services.auth_service import AuthFacade
from app.services.audit_service import log_event
from app.models.user import User, TypeUser

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
    agora_brasil = datetime.now(
        ZoneInfo("America/Sao_Paulo")
    )
    if facade.mode == "local":
        # login via email+senha
        response = provider.login(session, payload.email, payload.password)

        # Busca user_id para log
        user = session.exec(select(User).where(User.email == payload.email)).first()

        if user:
            user.last_login = agora_brasil

            session.add(user)  
            session.commit()
            session.refresh(user)

        log_event(
            session=session,
            action="LOGIN_INTERNAL_LOCAL",
            user_id=user.id if user else None,
            detail=f"email={payload.email}, mode=local",
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None
        )

        # Enriquecer resposta com dados do manager
        manager_data = None
        if user and user.manager_id:
            manager_user = session.get(User, user.manager_id)
            if manager_user:
                manager_data = {
                    "id": manager_user.id,
                    "name": manager_user.name,
                    "email": manager_user.email,
                    "job_title": manager_user.job_title or "",
                    "department": manager_user.department or "",
                }

        resp_body = json.loads(response.body)
        resp_body["manager"] = manager_data
        new_resp = JSONResponse(content=resp_body)
        token = resp_body.get("access_token")
        if token:
            new_resp.set_cookie("app_session", token, httponly=True, secure=False, samesite="lax", max_age=60 * 60 * 12)
        return new_resp
    else:
        # Modo entra: o frontend autentica via MSAL e envia o id_token para POST /auth/internal/entra
        raise HTTPException(
            status_code=404,
            detail="Login por email/senha indisponivel no modo entra. Use POST /auth/internal/entra.",
        )


@router.post("/logout")
def logout(request: Request = None, session: Session = Depends(get_session)):
    """
    Encerra a sessão do usuário interno (modo local).
    """
    facade = AuthFacade()
    provider = facade.internal_provider()

    log_event(
        session=session,
        action="LOGOUT_INTERNAL",
        detail=f"mode={facade.mode}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return provider.logout()
