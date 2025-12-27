
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlmodel import Session
from app.db.session import get_session
from app.services.auth_service import AuthFacade
from app.models.user import TypeUser

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
def dev_signup(payload: LocalSignup, session: Session = Depends(get_session)):
    facade = AuthFacade()
    provider = facade.internal_provider()
    if facade.mode != "local":
        raise HTTPException(status_code=403, detail="Signup local indisponível quando AUTH_MODE != local.")
    # usa provider local
    user = provider.signup(session, payload.email, payload.name, payload.type, payload.password)
    return {"usuario_id": user.id, "tipo": user.type}

@router.post("/login")
def login(request: Request, session: Session = Depends(get_session), payload: LocalLogin | None = None):
    facade = AuthFacade()
    provider = facade.internal_provider()
    if facade.mode == "local":
        # login via email+senha
        return provider.login(session, payload.email, payload.password)
    else:
        # redirect para Entra
        return provider.login_redirect()

@router.get("/callback")
def entra_callback(code: str | None = None, session: Session = Depends(get_session)):
    facade = AuthFacade()
    if facade.mode != "entra":
        raise HTTPException(status_code=404, detail="Callback não habilitado no modo local.")
    provider = facade.internal_provider()
    return provider.handle_callback(session, code)

@router.post("/logout")
def logout():
    facade = AuthFacade()
    provider = facade.internal_provider()
    return provider.logout()
