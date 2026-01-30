"""
Rotas de autenticacao unificadas.
Compativel com as chamadas do frontend Next.js.

Endpoints:
- POST /v1/auth/login - Login com email/senha
- POST /v1/auth/logout - Logout (invalida token)
- POST /v1/auth/refresh - Renovar token JWT
- POST /v1/auth/forgot-password - Solicitar reset de senha
- POST /v1/auth/reset-password - Resetar senha com token
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select
from datetime import datetime, timedelta, UTC
from typing import Optional
import secrets

from app.db.session import get_session
from app.models.user import User, TypeUser
from app.models.credencial_local import CredentialLocal
from app.services.audit_service import log_event
from app.utils.session_jwt import create_session_jwt, decode_session_jwt
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])


# =====================================================
# Schemas
# =====================================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 3600
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class LogoutRequest(BaseModel):
    session_id: Optional[str] = None


# =====================================================
# Armazenamento temporario de tokens (em producao usar Redis)
# =====================================================
_refresh_tokens: dict[str, dict] = {}
_reset_tokens: dict[str, dict] = {}


# =====================================================
# POST /v1/auth/login
# =====================================================

@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    session: Session = Depends(get_session),
    request: Request = None,
):
    """
    Autentica usuario com email e senha.
    Retorna tokens JWT e dados do usuario.
    """
    # Busca usuario
    user = session.exec(
        select(User).where(User.email == payload.email)
    ).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Credenciais invalidas")
    
    if not user.status:
        raise HTTPException(status_code=401, detail="Usuario desativado")
    
    # Busca credencial local
    credential = session.exec(
        select(CredentialLocal).where(CredentialLocal.user_id == user.id)
    ).first()
    
    if not credential:
        raise HTTPException(status_code=401, detail="Credenciais invalidas")
    
    # Verifica senha
    if not credential.verify_password(payload.password):
        raise HTTPException(status_code=401, detail="Credenciais invalidas")
    
    # Atualiza ultimo login
    user.last_login = datetime.now(UTC)
    session.add(user)
    session.commit()
    
    # Gera tokens
    access_token = create_session_jwt(
        user_id=user.id,
        email=user.email,
        user_type=user.type,
        expires_minutes=60
    )
    
    refresh_token = secrets.token_urlsafe(32)
    _refresh_tokens[refresh_token] = {
        "user_id": user.id,
        "created_at": datetime.now(UTC),
        "expires_at": datetime.now(UTC) + timedelta(days=7)
    }
    
    # Busca manager se existir
    manager_data = None
    if user.manager_id:
        manager = session.get(User, user.manager_id)
        if manager:
            manager_data = {
                "id": manager.id,
                "name": manager.name,
                "email": manager.email,
            }
    
    log_event(
        session=session,
        action="LOGIN",
        user_id=user.id,
        detail=f"email={user.email}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=3600,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.type,
            "department": user.department,
            "employee_id": user.employee_id,
            "manager": manager_data,
        }
    )


# =====================================================
# POST /v1/auth/logout
# =====================================================

@router.post("/logout")
def logout(
    payload: LogoutRequest = None,
    session: Session = Depends(get_session),
    request: Request = None,
):
    """
    Invalida a sessao do usuario.
    """
    # Em uma implementacao real, invalidar o token no Redis/banco
    
    # Extrai user_id do token se possivel
    auth_header = request.headers.get("Authorization") if request else None
    user_id = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload_data = decode_session_jwt(token)
            user_id = payload_data.get("user_id")
        except Exception:
            pass
    
    if user_id:
        log_event(
            session=session,
            action="LOGOUT",
            user_id=user_id,
            detail="logout_manual",
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None
        )
    
    return {"success": True, "message": "Logout realizado com sucesso"}


# =====================================================
# POST /v1/auth/refresh
# =====================================================

@router.post("/refresh")
def refresh_token(
    payload: RefreshRequest,
    session: Session = Depends(get_session),
):
    """
    Renova o token de acesso usando o refresh token.
    """
    token_data = _refresh_tokens.get(payload.refresh_token)
    
    if not token_data:
        raise HTTPException(status_code=401, detail="Refresh token invalido")
    
    if datetime.now(UTC) > token_data["expires_at"]:
        del _refresh_tokens[payload.refresh_token]
        raise HTTPException(status_code=401, detail="Refresh token expirado")
    
    user = session.get(User, token_data["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="Usuario nao encontrado")
    
    if not user.status:
        raise HTTPException(status_code=401, detail="Usuario desativado")
    
    # Gera novo access token
    access_token = create_session_jwt(
        user_id=user.id,
        email=user.email,
        user_type=user.type,
        expires_minutes=60
    )
    
    # Gera novo refresh token
    new_refresh_token = secrets.token_urlsafe(32)
    _refresh_tokens[new_refresh_token] = {
        "user_id": user.id,
        "created_at": datetime.now(UTC),
        "expires_at": datetime.now(UTC) + timedelta(days=7)
    }
    
    # Remove refresh token antigo
    del _refresh_tokens[payload.refresh_token]
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": 3600,
    }


# =====================================================
# POST /v1/auth/forgot-password
# =====================================================

@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    session: Session = Depends(get_session),
    request: Request = None,
):
    """
    Envia email com link para redefinir senha.
    Por seguranca, sempre retorna sucesso mesmo se email nao existir.
    """
    user = session.exec(
        select(User).where(User.email == payload.email)
    ).first()
    
    if user:
        # Gera token de reset
        reset_token = secrets.token_urlsafe(32)
        _reset_tokens[reset_token] = {
            "user_id": user.id,
            "email": user.email,
            "created_at": datetime.now(UTC),
            "expires_at": datetime.now(UTC) + timedelta(hours=1)
        }
        
        # TODO: Enviar email com link de reset
        # O link seria algo como: {frontend_url}/reset-password?token={reset_token}
        
        log_event(
            session=session,
            action="FORGOT_PASSWORD",
            user_id=user.id,
            detail=f"email={user.email}",
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None
        )
    
    # Sempre retorna sucesso por seguranca
    return {
        "success": True,
        "message": "Se o email estiver cadastrado, voce recebera instrucoes para redefinir sua senha"
    }


# =====================================================
# POST /v1/auth/reset-password
# =====================================================

@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    session: Session = Depends(get_session),
    request: Request = None,
):
    """
    Reseta a senha usando o token recebido por email.
    """
    token_data = _reset_tokens.get(payload.token)
    
    if not token_data:
        raise HTTPException(status_code=400, detail="Token invalido ou expirado")
    
    if datetime.now(UTC) > token_data["expires_at"]:
        del _reset_tokens[payload.token]
        raise HTTPException(status_code=400, detail="Token expirado")
    
    user = session.get(User, token_data["user_id"])
    if not user:
        raise HTTPException(status_code=400, detail="Usuario nao encontrado")
    
    # Atualiza senha
    credential = session.exec(
        select(CredentialLocal).where(CredentialLocal.user_id == user.id)
    ).first()
    
    if credential:
        credential.set_password(payload.new_password)
        session.add(credential)
        session.commit()
    
    # Remove token usado
    del _reset_tokens[payload.token]
    
    log_event(
        session=session,
        action="RESET_PASSWORD",
        user_id=user.id,
        detail="password_reset_success",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return {"success": True, "message": "Senha alterada com sucesso"}
