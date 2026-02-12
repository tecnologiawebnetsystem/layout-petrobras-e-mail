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
import hashlib

from app.db.session import get_session
from app.models.user import User, TypeUser
from app.models.credencial_local import CredentialLocal
from app.models.session_token import SessionToken, TokenType
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
# Helpers para hash de tokens
# =====================================================

def _hash_token(token: str) -> str:
    """Gera SHA-256 do token para armazenamento seguro."""
    return hashlib.sha256(token.encode()).hexdigest()


def _cleanup_expired_tokens(session: Session) -> None:
    """Remove tokens expirados ou usados para manter a tabela limpa."""
    now = datetime.now(UTC)
    expired = session.exec(
        select(SessionToken).where(
            (SessionToken.expires_at < now) | (SessionToken.used == True) | (SessionToken.revoked == True)
        )
    ).all()
    for t in expired:
        session.delete(t)
    if expired:
        session.commit()


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
    
    # Persiste refresh token hashado no banco
    session_token = SessionToken(
        user_id=user.id,
        token_hash=_hash_token(refresh_token),
        token_type=TokenType.REFRESH,
        expires_at=datetime.now(UTC) + timedelta(days=7),
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent")[:500] if request and request.headers.get("User-Agent") else None,
        email=user.email,
    )
    session.add(session_token)
    session.commit()
    
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
    Revoga todos os refresh tokens ativos do usuario.
    """
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
        # Revoga todos os refresh tokens ativos do usuario
        active_tokens = session.exec(
            select(SessionToken).where(
                SessionToken.user_id == user_id,
                SessionToken.token_type == TokenType.REFRESH,
                SessionToken.used == False,
                SessionToken.revoked == False,
            )
        ).all()
        for t in active_tokens:
            t.revoked = True
            session.add(t)
        session.commit()
        
        log_event(
            session=session,
            action="LOGOUT",
            user_id=user_id,
            detail=f"revoked_tokens={len(active_tokens)}",
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
    request: Request = None,
):
    """
    Renova o token de acesso usando o refresh token.
    """
    token_hash = _hash_token(payload.refresh_token)
    
    # Busca token no banco
    token_record = session.exec(
        select(SessionToken).where(
            SessionToken.token_hash == token_hash,
            SessionToken.token_type == TokenType.REFRESH,
            SessionToken.used == False,
            SessionToken.revoked == False,
        )
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=401, detail="Refresh token invalido")
    
    if datetime.now(UTC) > token_record.expires_at.replace(tzinfo=UTC) if token_record.expires_at.tzinfo is None else token_record.expires_at:
        token_record.used = True
        session.add(token_record)
        session.commit()
        raise HTTPException(status_code=401, detail="Refresh token expirado")
    
    user = session.get(User, token_record.user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Usuario nao encontrado")
    
    if not user.status:
        raise HTTPException(status_code=401, detail="Usuario desativado")
    
    # Marca token antigo como usado
    token_record.used = True
    session.add(token_record)
    
    # Gera novo access token
    access_token = create_session_jwt(
        user_id=user.id,
        email=user.email,
        user_type=user.type,
        expires_minutes=60
    )
    
    # Gera novo refresh token e persiste no banco
    new_refresh_token = secrets.token_urlsafe(32)
    new_session_token = SessionToken(
        user_id=user.id,
        token_hash=_hash_token(new_refresh_token),
        token_type=TokenType.REFRESH,
        expires_at=datetime.now(UTC) + timedelta(days=7),
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent")[:500] if request and request.headers.get("User-Agent") else None,
        email=user.email,
    )
    session.add(new_session_token)
    session.commit()
    
    log_event(
        session=session,
        action="REFRESH_TOKEN",
        user_id=user.id,
        detail=f"email={user.email}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    # Limpeza periodica de tokens expirados (async-safe)
    try:
        _cleanup_expired_tokens(session)
    except Exception:
        pass
    
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
        
        # Persiste reset token hashado no banco
        session_token = SessionToken(
            user_id=user.id,
            token_hash=_hash_token(reset_token),
            token_type=TokenType.RESET,
            expires_at=datetime.now(UTC) + timedelta(hours=1),
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent")[:500] if request and request.headers.get("User-Agent") else None,
            email=user.email,
        )
        session.add(session_token)
        session.commit()
        
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
    token_hash = _hash_token(payload.token)
    
    # Busca token no banco
    token_record = session.exec(
        select(SessionToken).where(
            SessionToken.token_hash == token_hash,
            SessionToken.token_type == TokenType.RESET,
            SessionToken.used == False,
            SessionToken.revoked == False,
        )
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Token invalido ou expirado")
    
    expires_at = token_record.expires_at.replace(tzinfo=UTC) if token_record.expires_at.tzinfo is None else token_record.expires_at
    if datetime.now(UTC) > expires_at:
        token_record.used = True
        session.add(token_record)
        session.commit()
        raise HTTPException(status_code=400, detail="Token expirado")
    
    user = session.get(User, token_record.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Usuario nao encontrado")
    
    # Atualiza senha
    credential = session.exec(
        select(CredentialLocal).where(CredentialLocal.user_id == user.id)
    ).first()
    
    if credential:
        credential.set_password(payload.new_password)
        session.add(credential)
    
    # Marca token como usado
    token_record.used = True
    session.add(token_record)
    session.commit()
    
    log_event(
        session=session,
        action="RESET_PASSWORD",
        user_id=user.id,
        detail="password_reset_success",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return {"success": True, "message": "Senha alterada com sucesso"}
