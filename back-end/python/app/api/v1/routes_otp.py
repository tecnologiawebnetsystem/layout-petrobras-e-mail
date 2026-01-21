"""
Rotas de OTP (One-Time Password) - Backend Python
Endpoints para geração e verificação de códigos OTP para usuários externos
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime, timedelta
import random
import string

from app.db.session import get_session

router = APIRouter(prefix="/otp", tags=["OTP"])


# =============================================================================
# SCHEMAS
# =============================================================================

class GenerateOTPRequest(BaseModel):
    email: EmailStr
    share_id: Optional[str] = None


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    code: str
    share_id: Optional[str] = None


class ResendOTPRequest(BaseModel):
    email: EmailStr
    share_id: Optional[str] = None


# =============================================================================
# IN-MEMORY STORE (Para desenvolvimento - em produção usar banco de dados)
# =============================================================================

# Armazena OTPs temporariamente { email: { code, expires_at, attempts, share_id } }
_otp_store: dict = {}

# Rate limiting { ip: { attempts, first_attempt, blocked_until } }
_rate_limit_store: dict = {}


def _generate_code(length: int = 6) -> str:
    """Gera código numérico aleatório"""
    return ''.join(random.choices(string.digits, k=length))


def _check_rate_limit(ip: str, email: str) -> bool:
    """Verifica se IP/email está bloqueado por rate limiting"""
    key = f"{ip}:{email}"
    
    if key not in _rate_limit_store:
        return True
    
    record = _rate_limit_store[key]
    
    # Se está bloqueado, verificar se já passou o tempo
    if record.get("blocked_until"):
        if datetime.utcnow() < record["blocked_until"]:
            return False
        else:
            # Desbloquear
            del _rate_limit_store[key]
            return True
    
    # Verificar janela de 15 minutos
    if datetime.utcnow() - record["first_attempt"] > timedelta(minutes=15):
        del _rate_limit_store[key]
        return True
    
    # Verificar número de tentativas
    if record["attempts"] >= 5:
        record["blocked_until"] = datetime.utcnow() + timedelta(minutes=30)
        return False
    
    return True


def _record_attempt(ip: str, email: str, success: bool):
    """Registra tentativa de OTP"""
    key = f"{ip}:{email}"
    
    if success:
        if key in _rate_limit_store:
            del _rate_limit_store[key]
        return
    
    if key not in _rate_limit_store:
        _rate_limit_store[key] = {
            "attempts": 1,
            "first_attempt": datetime.utcnow()
        }
    else:
        _rate_limit_store[key]["attempts"] += 1


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/generate")
async def generate_otp(payload: GenerateOTPRequest, request: Request):
    """
    POST /api/v1/otp/generate
    
    Gera um código OTP de 6 dígitos e envia por email.
    O código é válido por 3 minutos.
    
    Request Body:
    {
        "email": "externo@empresa.com",
        "share_id": "upload-123"  // opcional
    }
    
    Response:
    {
        "success": true,
        "message": "Código enviado para o email",
        "expires_in_seconds": 180,
        "masked_email": "ext***@empresa.com"
    }
    """
    ip = request.client.host if request.client else "unknown"
    email = payload.email
    
    # Verificar rate limit
    if not _check_rate_limit(ip, email):
        raise HTTPException(
            status_code=429,
            detail="Muitas tentativas. Aguarde 30 minutos antes de tentar novamente."
        )
    
    # Gerar código
    code = _generate_code(6)
    expires_at = datetime.utcnow() + timedelta(minutes=3)
    
    # Armazenar OTP
    _otp_store[email] = {
        "code": code,
        "expires_at": expires_at,
        "attempts": 0,
        "max_attempts": 3,
        "share_id": payload.share_id,
        "created_at": datetime.utcnow()
    }
    
    # Mascarar email para resposta
    parts = email.split("@")
    masked = parts[0][:3] + "***@" + parts[1]
    
    # Em produção: enviar email aqui
    # await send_otp_email(email, code)
    
    print(f"[OTP] Código gerado para {email}: {code} (expira em 3 min)")
    
    return {
        "success": True,
        "message": "Código enviado para o email",
        "expires_in_seconds": 180,
        "masked_email": masked,
        # REMOVER EM PRODUÇÃO - apenas para teste
        "_dev_code": code
    }


@router.post("/verify")
async def verify_otp(payload: VerifyOTPRequest, request: Request):
    """
    POST /api/v1/otp/verify
    
    Verifica o código OTP fornecido pelo usuário.
    
    Request Body:
    {
        "email": "externo@empresa.com",
        "code": "123456",
        "share_id": "upload-123"  // opcional
    }
    
    Response (sucesso):
    {
        "success": true,
        "message": "Código verificado com sucesso",
        "access_token": "jwt_token_here",
        "expires_in": 3600
    }
    
    Response (erro):
    {
        "success": false,
        "error": "invalid_code",
        "message": "Código inválido",
        "remaining_attempts": 2
    }
    """
    ip = request.client.host if request.client else "unknown"
    email = payload.email
    code = payload.code
    
    # Verificar se existe OTP para este email
    if email not in _otp_store:
        _record_attempt(ip, email, success=False)
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "error": "no_code",
                "message": "Nenhum código foi solicitado para este email. Solicite um novo código."
            }
        )
    
    otp_data = _otp_store[email]
    
    # Verificar expiração
    if datetime.utcnow() > otp_data["expires_at"]:
        del _otp_store[email]
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "error": "expired",
                "message": "Código expirado. Solicite um novo código."
            }
        )
    
    # Verificar tentativas
    if otp_data["attempts"] >= otp_data["max_attempts"]:
        del _otp_store[email]
        _record_attempt(ip, email, success=False)
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "error": "max_attempts",
                "message": "Número máximo de tentativas excedido. Solicite um novo código."
            }
        )
    
    # Verificar código
    if otp_data["code"] != code:
        otp_data["attempts"] += 1
        remaining = otp_data["max_attempts"] - otp_data["attempts"]
        _record_attempt(ip, email, success=False)
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "error": "invalid_code",
                "message": f"Código inválido. Tentativas restantes: {remaining}",
                "remaining_attempts": remaining
            }
        )
    
    # Código válido - limpar e retornar sucesso
    share_id = otp_data.get("share_id")
    del _otp_store[email]
    _record_attempt(ip, email, success=True)
    
    # Gerar token de acesso (em produção: usar JWT real)
    access_token = f"external_access_{email}_{datetime.utcnow().timestamp()}"
    
    print(f"[OTP] Código verificado com sucesso para {email}")
    
    return {
        "success": True,
        "message": "Código verificado com sucesso",
        "access_token": access_token,
        "expires_in": 3600,
        "share_id": share_id
    }


@router.post("/resend")
async def resend_otp(payload: ResendOTPRequest, request: Request):
    """
    POST /api/v1/otp/resend
    
    Reenvia o código OTP para o email.
    Gera um novo código e invalida o anterior.
    
    Request Body:
    {
        "email": "externo@empresa.com",
        "share_id": "upload-123"
    }
    
    Response:
    {
        "success": true,
        "message": "Novo código enviado",
        "expires_in_seconds": 180
    }
    """
    ip = request.client.host if request.client else "unknown"
    email = payload.email
    
    # Verificar rate limit
    if not _check_rate_limit(ip, email):
        raise HTTPException(
            status_code=429,
            detail="Muitas tentativas. Aguarde 30 minutos."
        )
    
    # Invalidar código anterior se existir
    if email in _otp_store:
        del _otp_store[email]
    
    # Gerar novo código
    code = _generate_code(6)
    expires_at = datetime.utcnow() + timedelta(minutes=3)
    
    _otp_store[email] = {
        "code": code,
        "expires_at": expires_at,
        "attempts": 0,
        "max_attempts": 3,
        "share_id": payload.share_id,
        "created_at": datetime.utcnow()
    }
    
    # Em produção: enviar email
    print(f"[OTP] Novo código gerado para {email}: {code}")
    
    return {
        "success": True,
        "message": "Novo código enviado para o email",
        "expires_in_seconds": 180,
        "_dev_code": code  # REMOVER EM PRODUÇÃO
    }


@router.get("/status/{email}")
async def get_otp_status(email: str, request: Request):
    """
    GET /api/v1/otp/status/{email}
    
    Verifica se existe um OTP ativo para o email.
    
    Response:
    {
        "has_active_code": true,
        "expires_in_seconds": 120,
        "attempts_remaining": 2
    }
    """
    if email not in _otp_store:
        return {
            "has_active_code": False,
            "expires_in_seconds": 0,
            "attempts_remaining": 0
        }
    
    otp_data = _otp_store[email]
    
    # Verificar se expirou
    if datetime.utcnow() > otp_data["expires_at"]:
        del _otp_store[email]
        return {
            "has_active_code": False,
            "expires_in_seconds": 0,
            "attempts_remaining": 0
        }
    
    remaining_seconds = int((otp_data["expires_at"] - datetime.utcnow()).total_seconds())
    remaining_attempts = otp_data["max_attempts"] - otp_data["attempts"]
    
    return {
        "has_active_code": True,
        "expires_in_seconds": remaining_seconds,
        "attempts_remaining": remaining_attempts
    }
