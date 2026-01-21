"""
Servico de OTP (One-Time Password)
Gerencia codigos de verificacao para usuarios externos
"""

import random
import string
from typing import Optional, Tuple
from datetime import datetime, timedelta
from uuid import uuid4
import logging

from app.core.dynamodb_client import db
from app.models.dynamodb_models import OTP
from app.services.audit_service import audit_service

logger = logging.getLogger(__name__)

# Configuracoes
OTP_LENGTH = 6
OTP_EXPIRATION_MINUTES = 3
MAX_ATTEMPTS = 3


class OTPService:
    """Servico para gerenciamento de codigos OTP"""
    
    @staticmethod
    def generate_code() -> str:
        """Gera codigo numerico de 6 digitos"""
        return ''.join(random.choices(string.digits, k=OTP_LENGTH))
    
    @staticmethod
    def generate_otp(
        email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """
        Gera novo codigo OTP para email
        
        Args:
            email: Email do destinatario
            ip_address: IP de quem solicitou
            user_agent: Browser/device info
        
        Returns:
            Codigo OTP gerado
        """
        code = OTPService.generate_code()
        
        otp = OTP(
            email=email,
            code=code,
            attempts=0,
            max_attempts=MAX_ATTEMPTS,
            created_at=datetime.utcnow().isoformat(),
            expires_at=(datetime.utcnow() + timedelta(minutes=OTP_EXPIRATION_MINUTES)).isoformat(),
            is_valid=True,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        db.create_otp(otp.to_dynamodb_item())
        
        # Log de auditoria
        audit_service.log_otp_generated(email)
        
        logger.info(f"OTP gerado para: {email}")
        return code
    
    @staticmethod
    def validate_otp(email: str, code: str) -> Tuple[bool, str]:
        """
        Valida codigo OTP
        
        Args:
            email: Email do usuario
            code: Codigo informado
        
        Returns:
            Tuple (valido, mensagem)
        """
        otp_data = db.get_active_otp(email)
        
        if not otp_data:
            audit_service.log_otp_not_found(email)
            return False, "Codigo nao encontrado. Solicite um novo codigo."
        
        # Verifica expiracao
        expires_at = datetime.fromisoformat(otp_data["expires_at"].replace("Z", "+00:00"))
        if datetime.utcnow() > expires_at.replace(tzinfo=None):
            db.invalidate_otp(email, otp_data["SK"].replace("CODE#", ""))
            audit_service.log_otp_expired(email)
            return False, "Codigo expirado. Solicite um novo codigo."
        
        # Verifica tentativas
        current_attempts = otp_data.get("attempts", 0)
        if current_attempts >= MAX_ATTEMPTS:
            db.invalidate_otp(email, otp_data["SK"].replace("CODE#", ""))
            audit_service.log_otp_max_attempts(email, MAX_ATTEMPTS)
            return False, "Maximo de tentativas excedido. Solicite um novo codigo."
        
        # Valida codigo
        if otp_data["code"] != code:
            new_attempts = db.increment_otp_attempts(email, otp_data["SK"].replace("CODE#", ""))
            remaining = MAX_ATTEMPTS - new_attempts
            
            audit_service.log_otp_invalid(email, new_attempts, MAX_ATTEMPTS)
            
            if remaining <= 0:
                db.invalidate_otp(email, otp_data["SK"].replace("CODE#", ""))
                return False, "Maximo de tentativas excedido. Solicite um novo codigo."
            
            return False, f"Codigo incorreto. {remaining} tentativa(s) restante(s)."
        
        # Codigo valido - invalida para nao reusar
        db.invalidate_otp(email, otp_data["SK"].replace("CODE#", ""))
        audit_service.log_otp_validated(email)
        
        logger.info(f"OTP validado com sucesso para: {email}")
        return True, "Codigo validado com sucesso!"
    
    @staticmethod
    def get_time_remaining(email: str) -> int:
        """
        Retorna tempo restante em segundos
        
        Args:
            email: Email do usuario
        
        Returns:
            Segundos restantes ou 0 se expirado
        """
        otp_data = db.get_active_otp(email)
        
        if not otp_data:
            return 0
        
        expires_at = datetime.fromisoformat(otp_data["expires_at"].replace("Z", "+00:00"))
        remaining = (expires_at.replace(tzinfo=None) - datetime.utcnow()).total_seconds()
        
        return max(0, int(remaining))
    
    @staticmethod
    def invalidate_all_for_email(email: str) -> bool:
        """
        Invalida todos os OTPs ativos para um email
        Usado quando um novo OTP eh solicitado
        
        Args:
            email: Email do usuario
        
        Returns:
            True se algum foi invalidado
        """
        otp_data = db.get_active_otp(email)
        
        if otp_data:
            db.invalidate_otp(email, otp_data["SK"].replace("CODE#", ""))
            return True
        
        return False


# Instancia singleton
otp_service = OTPService()
