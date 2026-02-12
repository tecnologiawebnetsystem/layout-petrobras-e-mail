"""
Rotas de autenticacao interna (Entra ID / Local dev).
Endpoints legados - compatibilidade com auth_service.py.

Todas as acoes geram log de auditoria na tabela 'audit'.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select
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
        # redirect para Entra
        log_event(
            session=session,
            action="LOGIN_REDIRECT_ENTRA",
            detail=f"mode=entra, redirect_initiated",
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None
        )
        return provider.login_redirect()


@router.get("/callback")
def entra_callback(code: str | None = None, session: Session = Depends(get_session), request: Request = None):
    facade = AuthFacade()
    if facade.mode != "entra":
        raise HTTPException(status_code=404, detail="Callback nao habilitado no modo local.")
    provider = facade.internal_provider()
    response = provider.handle_callback(session, code)

    log_event(
        session=session,
        action="LOGIN_CALLBACK_ENTRA",
        detail=f"callback_processed",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return response


@router.post("/logout")
def logout(request: Request = None, session: Session = Depends(get_session)):
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
