"""
Rotas de Autenticacao Completas
===============================
Gerencia autenticacao para todos os tipos de usuario:
- Interno (Petrobras via Entra ID)
- Supervisor (Petrobras via Entra ID com permissoes extras)
- Externo (via OTP por email)

Corresponde ao frontend:
- entra-provider.tsx (login Entra ID)
- login-form.tsx (seleção de tipo)
- external-verify/page.tsx (login externo)
- auth-store.ts (gerenciamento de estado)
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime, timedelta
import uuid
import jwt

from app.core.aws_config import get_aws_settings
from app.services.user_service import UserService
from app.services.otp_service import OTPService
from app.services.audit_service_dynamodb import AuditService


router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_aws_settings()
user_service = UserService()
otp_service = OTPService()
audit_service = AuditService()

# Segredo para JWT (em producao, usar AWS Secrets Manager)
JWT_SECRET = "petrobras-file-transfer-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"


# ============================================
# SCHEMAS - Request/Response
# ============================================

class EntraTokenValidationRequest(BaseModel):
    """
    Validacao de token do Microsoft Entra ID
    Recebido do frontend apos login com Microsoft
    """
    access_token: str
    id_token: Optional[str] = None
    # Dados extraidos do token pelo frontend
    email: EmailStr
    name: str
    job_title: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None
    # Dados do supervisor (manager) do Entra ID
    manager: Optional[dict] = None
    photo_url: Optional[str] = None


class EntraTokenValidationResponse(BaseModel):
    """Resposta da validacao do token Entra"""
    success: bool
    user_id: str
    email: str
    name: str
    user_type: Literal["internal", "supervisor"]
    job_title: Optional[str] = None
    department: Optional[str] = None
    manager: Optional[dict] = None
    session_token: str
    session_expires_at: str
    permissions: list


class ExternalVerifyRequest(BaseModel):
    """
    Verificacao de email externo
    Primeira etapa: verifica se email tem compartilhamentos
    """
    email: EmailStr


class ExternalVerifyResponse(BaseModel):
    """Resposta da verificacao de email externo"""
    has_shares: bool
    shares_count: int
    otp_sent: bool
    message: str


class ExternalOTPVerifyRequest(BaseModel):
    """
    Verificacao de codigo OTP
    Segunda etapa: valida codigo enviado por email
    """
    email: EmailStr
    otp_code: str


class ExternalOTPVerifyResponse(BaseModel):
    """Resposta da verificacao OTP"""
    success: bool
    session_token: Optional[str] = None
    session_expires_at: Optional[str] = None
    user_id: Optional[str] = None
    shares_count: Optional[int] = None
    message: str


class SessionValidationRequest(BaseModel):
    """Validacao de sessao ativa"""
    session_token: str


class SessionValidationResponse(BaseModel):
    """Resposta da validacao de sessao"""
    valid: bool
    user_id: Optional[str] = None
    email: Optional[str] = None
    user_type: Optional[str] = None
    expires_at: Optional[str] = None


class LogoutRequest(BaseModel):
    """Requisicao de logout"""
    session_token: str


# ============================================
# ENDPOINTS - Entra ID (Interno/Supervisor)
# ============================================

@router.post("/entra/validate", response_model=EntraTokenValidationResponse)
async def validate_entra_token(request: EntraTokenValidationRequest):
    """
    Valida token do Microsoft Entra ID e cria sessao
    
    Fluxo:
    1. Frontend faz login com Microsoft (MSAL)
    2. Frontend envia token e dados extraidos
    3. Backend valida e determina tipo de usuario
    4. Backend cria/atualiza usuario no DynamoDB
    5. Backend cria sessao e retorna token de sessao
    
    Corresponde a: entra-provider.tsx processLoginResponse()
    """
    try:
        # Validar dominio do email
        email_lower = request.email.lower()
        if not email_lower.endswith("@petrobras.com.br") and not email_lower.endswith("@petrobras"):
            audit_service.log_action(
                action="login_blocked",
                level="warning",
                user_id=request.email,
                user_type="unknown",
                details={"reason": "invalid_domain", "email": request.email}
            )
            raise HTTPException(status_code=403, detail="Dominio de email nao autorizado")
        
        # Determinar tipo de usuario
        user_type = _determine_user_type(request.email, request.job_title)
        
        # Criar ou atualizar usuario no DynamoDB
        user_data = {
            "email": request.email,
            "name": request.name,
            "user_type": user_type,
            "job_title": request.job_title,
            "department": request.department,
            "employee_id": request.employee_id,
            "photo_url": request.photo_url,
            "auth_provider": "entra_id",
            "last_login": datetime.utcnow().isoformat()
        }
        
        # Adicionar dados do manager se disponivel
        if request.manager:
            user_data["manager"] = {
                "id": request.manager.get("id"),
                "name": request.manager.get("name"),
                "email": request.manager.get("email"),
                "job_title": request.manager.get("jobTitle"),
                "department": request.manager.get("department")
            }
        
        user = user_service.create_or_update_user(user_data)
        
        # Criar sessao
        session_token = _create_session_token(user["user_id"], request.email, user_type)
        session_expires = datetime.utcnow() + timedelta(hours=8)
        
        # Salvar sessao no DynamoDB
        user_service.create_session(
            user_id=user["user_id"],
            session_token=session_token,
            user_type=user_type,
            expires_at=session_expires
        )
        
        # Registrar login na auditoria
        audit_service.log_action(
            action="login",
            level="success",
            user_id=user["user_id"],
            user_type=user_type,
            details={
                "auth_method": "entra_id",
                "email": request.email,
                "job_title": request.job_title
            }
        )
        
        # Definir permissoes baseado no tipo
        permissions = _get_user_permissions(user_type)
        
        return EntraTokenValidationResponse(
            success=True,
            user_id=user["user_id"],
            email=request.email,
            name=request.name,
            user_type=user_type,
            job_title=request.job_title,
            department=request.department,
            manager=user_data.get("manager"),
            session_token=session_token,
            session_expires_at=session_expires.isoformat(),
            permissions=permissions
        )
        
    except HTTPException:
        raise
    except Exception as e:
        audit_service.log_action(
            action="login_error",
            level="error",
            user_id=request.email,
            user_type="unknown",
            details={"error": str(e)}
        )
        raise HTTPException(status_code=500, detail=f"Erro ao validar token: {str(e)}")


# ============================================
# ENDPOINTS - Usuario Externo (OTP)
# ============================================

@router.post("/external/verify", response_model=ExternalVerifyResponse)
async def verify_external_email(request: ExternalVerifyRequest):
    """
    Verifica se email externo tem compartilhamentos e envia OTP
    
    Fluxo:
    1. Usuario externo informa email
    2. Backend verifica se ha shares para esse email
    3. Se houver, gera e envia OTP por email
    
    Corresponde a: external-verify/page.tsx handleEmailSubmit()
    """
    try:
        email_lower = request.email.lower()
        
        # Verificar se email pertence a Petrobras (nao permitir)
        if email_lower.endswith("@petrobras.com.br") or email_lower.endswith("@petrobras"):
            return ExternalVerifyResponse(
                has_shares=False,
                shares_count=0,
                otp_sent=False,
                message="Usuarios Petrobras devem usar o login com Microsoft"
            )
        
        # Buscar compartilhamentos para este email
        from app.services.share_service_dynamodb import ShareService
        share_service = ShareService()
        shares = share_service.get_shares_for_recipient(email_lower)
        
        # Filtrar apenas aprovados e nao expirados
        valid_shares = [
            s for s in shares 
            if s.get("status") == "approved" and not _is_expired(s.get("expires_at"))
        ]
        
        if not valid_shares:
            return ExternalVerifyResponse(
                has_shares=False,
                shares_count=0,
                otp_sent=False,
                message="Nenhum compartilhamento encontrado para este email"
            )
        
        # Gerar e enviar OTP
        otp_result = otp_service.generate_and_send_otp(email_lower)
        
        if not otp_result["success"]:
            raise HTTPException(status_code=500, detail="Erro ao enviar codigo de verificacao")
        
        # Registrar auditoria
        audit_service.log_action(
            action="external_verify_email",
            level="info",
            user_id=email_lower,
            user_type="external",
            details={
                "shares_found": len(valid_shares),
                "otp_sent": True
            }
        )
        
        return ExternalVerifyResponse(
            has_shares=True,
            shares_count=len(valid_shares),
            otp_sent=True,
            message=f"Codigo enviado para {request.email}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao verificar email: {str(e)}")


@router.post("/external/verify-otp", response_model=ExternalOTPVerifyResponse)
async def verify_external_otp(request: ExternalOTPVerifyRequest):
    """
    Verifica codigo OTP e cria sessao para usuario externo
    
    Fluxo:
    1. Usuario externo informa codigo OTP
    2. Backend valida codigo
    3. Se valido, cria sessao temporaria (3 horas)
    
    Corresponde a: external-verify/page.tsx handleOtpSubmit()
    """
    try:
        email_lower = request.email.lower()
        
        # Verificar OTP
        otp_result = otp_service.verify_otp(email_lower, request.otp_code)
        
        if not otp_result["valid"]:
            audit_service.log_action(
                action="external_otp_invalid",
                level="warning",
                user_id=email_lower,
                user_type="external",
                details={"reason": otp_result.get("reason", "invalid_code")}
            )
            return ExternalOTPVerifyResponse(
                success=False,
                message=otp_result.get("message", "Codigo invalido ou expirado")
            )
        
        # Criar ou buscar usuario externo
        user = user_service.get_or_create_external_user(email_lower)
        
        # Criar sessao temporaria (3 horas)
        session_token = _create_session_token(user["user_id"], email_lower, "external")
        session_expires = datetime.utcnow() + timedelta(hours=3)
        
        user_service.create_session(
            user_id=user["user_id"],
            session_token=session_token,
            user_type="external",
            expires_at=session_expires
        )
        
        # Contar shares disponiveis
        from app.services.share_service_dynamodb import ShareService
        share_service = ShareService()
        shares = share_service.get_shares_for_recipient(email_lower)
        valid_shares = [s for s in shares if s.get("status") == "approved"]
        
        # Registrar auditoria
        audit_service.log_action(
            action="external_login",
            level="success",
            user_id=user["user_id"],
            user_type="external",
            details={
                "email": email_lower,
                "shares_available": len(valid_shares)
            }
        )
        
        return ExternalOTPVerifyResponse(
            success=True,
            session_token=session_token,
            session_expires_at=session_expires.isoformat(),
            user_id=user["user_id"],
            shares_count=len(valid_shares),
            message="Autenticacao realizada com sucesso"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao verificar OTP: {str(e)}")


@router.post("/external/resend-otp")
async def resend_external_otp(request: ExternalVerifyRequest):
    """
    Reenvia codigo OTP para email externo
    
    Corresponde a: external-verify/page.tsx handleResendOtp()
    """
    try:
        email_lower = request.email.lower()
        
        # Verificar cooldown (30 segundos)
        if not otp_service.can_resend_otp(email_lower):
            return {"success": False, "message": "Aguarde 30 segundos para reenviar"}
        
        # Gerar novo OTP
        otp_result = otp_service.generate_and_send_otp(email_lower)
        
        if not otp_result["success"]:
            raise HTTPException(status_code=500, detail="Erro ao reenviar codigo")
        
        audit_service.log_action(
            action="external_otp_resent",
            level="info",
            user_id=email_lower,
            user_type="external",
            details={}
        )
        
        return {"success": True, "message": "Novo codigo enviado"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao reenviar OTP: {str(e)}")


# ============================================
# ENDPOINTS - Sessao
# ============================================

@router.post("/session/validate", response_model=SessionValidationResponse)
async def validate_session(request: SessionValidationRequest):
    """
    Valida se sessao ainda esta ativa
    
    Corresponde a: auth-store.ts verificacao de sessao
    """
    try:
        session = user_service.get_session(request.session_token)
        
        if not session:
            return SessionValidationResponse(valid=False)
        
        # Verificar expiracao
        expires_at = datetime.fromisoformat(session["expires_at"])
        if datetime.utcnow() > expires_at:
            user_service.delete_session(request.session_token)
            return SessionValidationResponse(valid=False)
        
        return SessionValidationResponse(
            valid=True,
            user_id=session["user_id"],
            email=session.get("email"),
            user_type=session.get("user_type"),
            expires_at=session["expires_at"]
        )
        
    except Exception:
        return SessionValidationResponse(valid=False)


@router.post("/logout")
async def logout(request: LogoutRequest):
    """
    Encerra sessao do usuario
    
    Corresponde a: auth-store.ts logout()
    """
    try:
        session = user_service.get_session(request.session_token)
        
        if session:
            audit_service.log_action(
                action="logout",
                level="info",
                user_id=session.get("user_id"),
                user_type=session.get("user_type"),
                details={}
            )
            user_service.delete_session(request.session_token)
        
        return {"success": True, "message": "Sessao encerrada"}
        
    except Exception as e:
        return {"success": False, "message": str(e)}


# ============================================
# FUNCOES AUXILIARES
# ============================================

def _determine_user_type(email: str, job_title: Optional[str]) -> Literal["internal", "supervisor"]:
    """
    Determina tipo de usuario baseado em email e cargo
    
    Corresponde a: entra-config.ts getUserTypeFromEmail()
    """
    email_lower = email.lower()
    
    # Lista de emails de supervisores conhecidos
    supervisor_emails = [
        "wagner.brazil@petrobras.com.br",
        "sabrina.araujo@petrobras.com.br",
    ]
    
    if email_lower in supervisor_emails:
        return "supervisor"
    
    # Verificar pelo cargo
    if job_title:
        job_title_lower = job_title.lower()
        supervisor_titles = [
            "gerente", "coordenador", "diretor", 
            "superintendente", "chefe", "lider", "supervisor"
        ]
        
        for title in supervisor_titles:
            if title in job_title_lower:
                return "supervisor"
    
    return "internal"


def _get_user_permissions(user_type: str) -> list:
    """Retorna permissoes baseado no tipo de usuario"""
    
    base_permissions = ["view_own_shares", "create_shares", "cancel_own_shares"]
    
    if user_type == "supervisor":
        return base_permissions + [
            "approve_shares",
            "reject_shares",
            "view_team_shares",
            "extend_expiration",
            "view_audit_logs"
        ]
    elif user_type == "external":
        return ["view_received_shares", "download_files"]
    
    return base_permissions


def _create_session_token(user_id: str, email: str, user_type: str) -> str:
    """Cria token JWT para sessao"""
    payload = {
        "user_id": user_id,
        "email": email,
        "user_type": user_type,
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4())
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _is_expired(expires_at: Optional[str]) -> bool:
    """Verifica se data de expiracao passou"""
    if not expires_at:
        return True
    try:
        exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        return datetime.utcnow() > exp.replace(tzinfo=None)
    except:
        return True
