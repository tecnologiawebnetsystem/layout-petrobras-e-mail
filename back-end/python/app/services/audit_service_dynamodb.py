"""
Servico de Auditoria
Registra todas as acoes do sistema para compliance e rastreabilidade
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from uuid import uuid4
import logging

from app.core.dynamodb_client import db
from app.models.dynamodb_models import (
    AuditLog, AuditLogUser, AuditLogDetails, LogAction, LogLevel, UserType
)

logger = logging.getLogger(__name__)


class AuditService:
    """Servico para logs de auditoria"""
    
    # =========================================================================
    # METODOS GENERICOS
    # =========================================================================
    
    @staticmethod
    def create_log(
        action: LogAction,
        level: LogLevel,
        user_id: str,
        user_name: str,
        user_email: str,
        user_type: UserType,
        description: str,
        employee_id: Optional[str] = None,
        target_id: Optional[str] = None,
        target_name: Optional[str] = None,
        target_type: Optional[str] = None,
        ip_address: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Cria registro de auditoria generico
        """
        log = AuditLog(
            log_id=str(uuid4()),
            timestamp=datetime.utcnow().isoformat(),
            action=action,
            level=level,
            user=AuditLogUser(
                id=user_id,
                name=user_name,
                email=user_email,
                type=user_type,
                employee_id=employee_id,
            ),
            details=AuditLogDetails(
                target_id=target_id,
                target_name=target_name,
                target_type=target_type,
                description=description,
                ip_address=ip_address,
                metadata=metadata,
            )
        )
        
        db.create_audit_log(log.to_dynamodb_item())
        return log
    
    # =========================================================================
    # AUTENTICACAO
    # =========================================================================
    
    @staticmethod
    def log_login(
        user_id: str,
        user_name: str,
        user_email: str,
        user_type: UserType,
        employee_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ):
        """Registra login bem-sucedido"""
        AuditService.create_log(
            action="login",
            level="success",
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            user_type=user_type,
            employee_id=employee_id,
            description="Login realizado com sucesso",
            ip_address=ip_address,
            metadata={"method": "entra_id" if user_type != "external" else "otp"}
        )
    
    @staticmethod
    def log_logout(
        user_id: str,
        user_name: str,
        user_email: str,
        user_type: UserType,
        session_id: Optional[str] = None,
    ):
        """Registra logout"""
        AuditService.create_log(
            action="logout",
            level="info",
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            user_type=user_type,
            description="Logout realizado",
            target_id=session_id,
            target_type="session",
        )
    
    @staticmethod
    def log_login_failed(
        email: str,
        reason: str,
        ip_address: Optional[str] = None,
    ):
        """Registra falha de login"""
        AuditService.create_log(
            action="login_failed",
            level="warning",
            user_id="unknown",
            user_name="Desconhecido",
            user_email=email,
            user_type="external",
            description=f"Tentativa de login falhou: {reason}",
            ip_address=ip_address,
            metadata={"reason": reason}
        )
    
    # =========================================================================
    # UPLOAD / COMPARTILHAMENTO
    # =========================================================================
    
    @staticmethod
    def log_upload(
        user_id: str,
        user_name: str,
        user_email: str,
        user_type: UserType,
        share_id: str,
        share_name: str,
        recipient_email: str,
        file_count: int,
        expiration_hours: int,
        employee_id: Optional[str] = None,
    ):
        """Registra criacao de compartilhamento"""
        AuditService.create_log(
            action="upload",
            level="info",
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            user_type=user_type,
            employee_id=employee_id,
            description=f'Arquivo "{share_name}" enviado para aprovacao',
            target_id=share_id,
            target_name=share_name,
            target_type="share",
            metadata={
                "recipient": recipient_email,
                "file_count": file_count,
                "expiration_hours": expiration_hours,
            }
        )
    
    # =========================================================================
    # APROVACAO / REJEICAO / CANCELAMENTO
    # =========================================================================
    
    @staticmethod
    def log_approval(
        user_id: str,
        user_name: str,
        user_email: str,
        share_id: str,
        share_name: str,
        sender_name: str,
        recipient_email: str,
        expires_at: str,
        expiration_hours: int,
    ):
        """Registra aprovacao de compartilhamento"""
        AuditService.create_log(
            action="approve",
            level="success",
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            user_type="supervisor",
            description=f'Upload "{share_name}" aprovado e disponibilizado para {recipient_email}',
            target_id=share_id,
            target_name=share_name,
            target_type="share",
            metadata={
                "sender": sender_name,
                "recipient": recipient_email,
                "expires_at": expires_at,
                "expiration_hours": expiration_hours,
                "otp_sent": True,
            }
        )
    
    @staticmethod
    def log_rejection(
        user_id: str,
        user_name: str,
        user_email: str,
        share_id: str,
        share_name: str,
        sender_name: str,
        recipient_email: str,
        reason: str,
    ):
        """Registra rejeicao de compartilhamento"""
        AuditService.create_log(
            action="reject",
            level="warning",
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            user_type="supervisor",
            description=f'Upload "{share_name}" rejeitado. Motivo: {reason}',
            target_id=share_id,
            target_name=share_name,
            target_type="share",
            metadata={
                "sender": sender_name,
                "recipient": recipient_email,
                "rejection_reason": reason,
            }
        )
    
    @staticmethod
    def log_cancellation(
        user_id: str,
        user_name: str,
        user_email: str,
        share_id: str,
        share_name: str,
        recipient_email: str,
        reason: str,
    ):
        """Registra cancelamento de compartilhamento"""
        AuditService.create_log(
            action="cancel",
            level="info",
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            user_type="internal",
            description=f'Compartilhamento "{share_name}" cancelado. Motivo: {reason}',
            target_id=share_id,
            target_name=share_name,
            target_type="share",
            metadata={
                "recipient": recipient_email,
                "cancellation_reason": reason,
            }
        )
    
    # =========================================================================
    # DOWNLOAD
    # =========================================================================
    
    @staticmethod
    def log_download(
        user_id: str,
        user_name: str,
        user_email: str,
        share_id: str,
        share_name: str,
        sender_name: str,
        download_count: int,
    ):
        """Registra download de arquivo"""
        AuditService.create_log(
            action="download",
            level="success",
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            user_type="external",
            description=f'Download do arquivo "{share_name}" realizado com sucesso',
            target_id=share_id,
            target_name=share_name,
            target_type="share",
            metadata={
                "sender": sender_name,
                "download_count": download_count,
            }
        )
    
    # =========================================================================
    # EXPIRACAO
    # =========================================================================
    
    @staticmethod
    def log_expiration_change(
        user_id: str,
        user_name: str,
        user_email: str,
        share_id: str,
        share_name: str,
        previous_hours: int,
        new_hours: int,
        reason: Optional[str] = None,
    ):
        """Registra alteracao de tempo de expiracao"""
        AuditService.create_log(
            action="expiration_change",
            level="info",
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            user_type="supervisor",
            description=f'Tempo de expiracao alterado de {previous_hours}h para {new_hours}h',
            target_id=share_id,
            target_name=share_name,
            target_type="share",
            metadata={
                "previous_value": previous_hours,
                "new_value": new_hours,
                "reason": reason or "Ajuste pelo supervisor",
            }
        )
    
    @staticmethod
    def log_file_expired(
        share_id: str,
        share_name: str,
        sender_email: str,
        recipient_email: str,
    ):
        """Registra expiracao de arquivo"""
        AuditService.create_log(
            action="file_expired",
            level="info",
            user_id="system",
            user_name="Sistema",
            user_email="system@petrobras.com.br",
            user_type="internal",
            description=f'Compartilhamento "{share_name}" expirou automaticamente',
            target_id=share_id,
            target_name=share_name,
            target_type="share",
            metadata={
                "sender": sender_email,
                "recipient": recipient_email,
            }
        )
    
    # =========================================================================
    # OTP
    # =========================================================================
    
    @staticmethod
    def log_otp_generated(email: str):
        """Registra geracao de OTP"""
        AuditService.create_log(
            action="otp_generate",
            level="info",
            user_id="external-user",
            user_name="Usuario Externo",
            user_email=email,
            user_type="external",
            description="Codigo OTP gerado para acesso de usuario externo",
            metadata={"expires_in": "3 minutos"}
        )
    
    @staticmethod
    def log_otp_validated(email: str):
        """Registra validacao de OTP bem-sucedida"""
        AuditService.create_log(
            action="otp_validate",
            level="success",
            user_id="external-user",
            user_name="Usuario Externo",
            user_email=email,
            user_type="external",
            description="Codigo OTP validado com sucesso",
        )
    
    @staticmethod
    def log_otp_invalid(email: str, attempt: int, max_attempts: int):
        """Registra tentativa de OTP invalido"""
        AuditService.create_log(
            action="otp_validate",
            level="warning",
            user_id="external-user",
            user_name="Usuario Externo",
            user_email=email,
            user_type="external",
            description="Codigo OTP invalido informado",
            metadata={
                "attempt": attempt,
                "max_attempts": max_attempts,
            }
        )
    
    @staticmethod
    def log_otp_expired(email: str):
        """Registra OTP expirado"""
        AuditService.create_log(
            action="otp_expired",
            level="warning",
            user_id="external-user",
            user_name="Usuario Externo",
            user_email=email,
            user_type="external",
            description="Codigo OTP expirou (3 minutos)",
        )
    
    @staticmethod
    def log_otp_max_attempts(email: str, max_attempts: int):
        """Registra maximo de tentativas OTP excedido"""
        AuditService.create_log(
            action="otp_max_attempts",
            level="error",
            user_id="external-user",
            user_name="Usuario Externo",
            user_email=email,
            user_type="external",
            description="Maximo de tentativas de validacao OTP excedido",
            metadata={"attempts": max_attempts}
        )
    
    @staticmethod
    def log_otp_not_found(email: str):
        """Registra OTP nao encontrado"""
        AuditService.create_log(
            action="otp_validate",
            level="warning",
            user_id="external-user",
            user_name="Usuario Externo",
            user_email=email,
            user_type="external",
            description="Tentativa de validacao sem codigo OTP ativo",
        )
    
    # =========================================================================
    # CONSULTAS
    # =========================================================================
    
    @staticmethod
    def get_logs_by_date(date: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Busca logs por data (YYYY-MM-DD)"""
        return db.get_logs_by_date(date, limit)
    
    @staticmethod
    def get_logs_by_user(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Busca logs por usuario"""
        return db.get_logs_by_user(user_id, limit)
    
    @staticmethod
    def get_logs_by_action(action: LogAction, limit: int = 50) -> List[Dict[str, Any]]:
        """Busca logs por tipo de acao"""
        return db.get_logs_by_action(action, limit)
    
    @staticmethod
    def get_recent_logs(days: int = 7, limit: int = 100) -> List[Dict[str, Any]]:
        """Busca logs recentes"""
        all_logs = []
        
        for i in range(days):
            date = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
            logs = db.get_logs_by_date(date, limit // days)
            all_logs.extend(logs)
        
        # Ordena por timestamp decrescente
        all_logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return all_logs[:limit]
    
    @staticmethod
    def export_logs(start_date: str, end_date: str) -> str:
        """Exporta logs para JSON"""
        import json
        
        all_logs = []
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        
        current = start
        while current <= end:
            date_str = current.strftime("%Y-%m-%d")
            logs = db.get_logs_by_date(date_str, 1000)
            all_logs.extend(logs)
            current += timedelta(days=1)
        
        return json.dumps(all_logs, indent=2, ensure_ascii=False)


# Instancia singleton
audit_service = AuditService()
