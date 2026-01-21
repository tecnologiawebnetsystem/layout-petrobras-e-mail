"""
Servico de Compartilhamento
Gerencia o workflow de compartilhamento de arquivos
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from uuid import uuid4
import logging

from app.core.dynamodb_client import db
from app.models.dynamodb_models import (
    Share, SenderInfo, ApproverInfo, FileInfo,
    ExpirationLog, Notification, ShareStatus
)
from app.services.user_service import user_service
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service
from app.services.email_service import email_service

logger = logging.getLogger(__name__)


class ShareService:
    """Servico para gerenciamento de compartilhamentos"""
    
    @staticmethod
    def create_share(
        name: str,
        description: str,
        sender_id: str,
        sender_name: str,
        sender_email: str,
        sender_employee_id: Optional[str],
        recipient_email: str,
        expiration_hours: int,
        files: List[Dict[str, str]],
        approver_id: Optional[str] = None,
        approver_name: Optional[str] = None,
        approver_email: Optional[str] = None,
    ) -> Share:
        """
        Cria novo compartilhamento
        
        Args:
            name: Nome/titulo do compartilhamento
            description: Descricao detalhada
            sender_id: ID do remetente
            sender_name: Nome do remetente
            sender_email: Email do remetente
            sender_employee_id: Matricula do remetente
            recipient_email: Email do destinatario externo
            expiration_hours: Horas de validade (24, 48, 72)
            files: Lista de arquivos [{name, size, type}]
            approver_id: ID do aprovador (opcional)
            approver_name: Nome do aprovador (opcional)
            approver_email: Email do aprovador (opcional)
        
        Returns:
            Compartilhamento criado
        """
        # Busca usuario remetente para determinar aprovador
        sender_user = user_service.get_user_by_id(sender_id)
        
        # Determina se foi enviado por supervisor
        sent_by_supervisor = sender_user.user_type == "supervisor" if sender_user else False
        
        # Determina aprovador se nao foi informado
        if not approver_email and sender_user:
            approver_info = user_service.get_approver_for_user(sender_user)
            if approver_info:
                approver_id = approver_info.id
                approver_name = approver_info.name
                approver_email = approver_info.email
        
        # Cria objeto de compartilhamento
        share = Share(
            share_id=str(uuid4()),
            name=name,
            description=description,
            status="pending",
            sender=SenderInfo(
                id=sender_id,
                name=sender_name,
                email=sender_email,
                employee_id=sender_employee_id,
            ),
            recipient_email=recipient_email,
            approver=ApproverInfo(
                id=approver_id or "",
                name=approver_name or "",
                email=approver_email or "",
            ) if approver_email else None,
            sent_by_supervisor=sent_by_supervisor,
            expiration_hours=expiration_hours,
            files=files,
        )
        
        # Salva no DynamoDB
        db.create_share(share.to_dynamodb_item())
        
        # Cria log de expiracao inicial
        exp_log = ExpirationLog(
            share_id=share.share_id,
            changed_by=sender_name,
            changed_by_email=sender_email,
            previous_value=None,
            new_value=expiration_hours,
            reason="Definicao inicial pelo remetente",
        )
        db.create_expiration_log(exp_log.to_dynamodb_item())
        
        # Log de auditoria
        audit_service.log_upload(
            user_id=sender_id,
            user_name=sender_name,
            user_email=sender_email,
            user_type=sender_user.user_type if sender_user else "internal",
            employee_id=sender_employee_id,
            share_id=share.share_id,
            share_name=name,
            recipient_email=recipient_email,
            file_count=len(files),
            expiration_hours=expiration_hours,
        )
        
        # Notificacao para supervisor
        if approver_email:
            notification_service.notify_pending_approval(
                supervisor_email=approver_email,
                sender_name=sender_name,
                share_name=name,
                share_id=share.share_id,
            )
            
            # Email para supervisor
            email_service.send_supervisor_notification(
                supervisor_email=approver_email,
                supervisor_name=approver_name or "Supervisor",
                sender_name=sender_name,
                sender_email=sender_email,
                share_name=name,
                description=description,
                recipient_email=recipient_email,
                expiration_hours=expiration_hours,
                share_id=share.share_id,
            )
        
        # Notificacao para remetente
        notification_service.notify_upload_sent(
            user_email=sender_email,
            share_name=name,
            recipient_email=recipient_email,
        )
        
        # Email de confirmacao para remetente
        email_service.send_sender_confirmation(
            sender_email=sender_email,
            sender_name=sender_name,
            share_name=name,
            recipient_email=recipient_email,
            expiration_hours=expiration_hours,
        )
        
        logger.info(f"Compartilhamento criado: {share.share_id}")
        return share
    
    @staticmethod
    def get_share_by_id(share_id: str) -> Optional[Dict[str, Any]]:
        """Busca compartilhamento por ID com arquivos"""
        share_data = db.get_share_by_id(share_id)
        if not share_data:
            return None
        
        # Busca arquivos
        files = db.get_files_by_share(share_id)
        share_data["files_data"] = files
        
        # Busca logs de expiracao
        exp_logs = db.get_expiration_logs(share_id)
        share_data["expiration_logs"] = exp_logs
        
        return share_data
    
    @staticmethod
    def get_shares_by_sender(sender_id: str) -> List[Dict[str, Any]]:
        """Busca compartilhamentos por remetente"""
        return db.get_shares_by_sender(sender_id)
    
    @staticmethod
    def get_shares_by_recipient(recipient_email: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Busca compartilhamentos por destinatario"""
        return db.get_shares_by_recipient(recipient_email, status)
    
    @staticmethod
    def get_pending_approvals(approver_email: str) -> List[Dict[str, Any]]:
        """Busca compartilhamentos pendentes de aprovacao"""
        return db.get_shares_by_approver(approver_email, "pending")
    
    @staticmethod
    def approve_share(
        share_id: str,
        approver_id: str,
        approver_name: str,
        approver_email: str,
    ) -> bool:
        """
        Aprova compartilhamento
        
        Args:
            share_id: ID do compartilhamento
            approver_id: ID do aprovador
            approver_name: Nome do aprovador
            approver_email: Email do aprovador
        
        Returns:
            True se aprovado com sucesso
        """
        share_data = db.get_share_by_id(share_id)
        if not share_data:
            logger.error(f"Share nao encontrado: {share_id}")
            return False
        
        if share_data["status"] != "pending":
            logger.error(f"Share nao esta pendente: {share_id}")
            return False
        
        # Calcula data de expiracao
        expiration_hours = share_data.get("expiration_hours", 72)
        expires_at = (datetime.utcnow() + timedelta(hours=expiration_hours)).isoformat()
        
        # Atualiza status
        success = db.approve_share(share_id, approver_name, expires_at)
        
        if success:
            # Log de auditoria
            audit_service.log_approval(
                user_id=approver_id,
                user_name=approver_name,
                user_email=approver_email,
                share_id=share_id,
                share_name=share_data["name"],
                sender_name=share_data["sender_name"],
                recipient_email=share_data["recipient_email"],
                expires_at=expires_at,
                expiration_hours=expiration_hours,
            )
            
            # Notificacao para remetente
            sender_email = share_data["sender_email"]
            notification_service.notify_share_approved(
                user_email=sender_email,
                share_name=share_data["name"],
                recipient_email=share_data["recipient_email"],
                approver_name=approver_name,
                expiration_hours=expiration_hours,
            )
            
            # Envia email OTP para destinatario
            from app.services.otp_service import otp_service
            otp_code = otp_service.generate_otp(share_data["recipient_email"])
            
            email_service.send_otp_email(
                recipient_email=share_data["recipient_email"],
                otp_code=otp_code,
                sender_name=share_data["sender_name"],
                share_name=share_data["name"],
                expiration_hours=expiration_hours,
            )
            
            logger.info(f"Compartilhamento aprovado: {share_id}")
        
        return success
    
    @staticmethod
    def reject_share(
        share_id: str,
        rejected_by_id: str,
        rejected_by_name: str,
        rejected_by_email: str,
        reason: str,
    ) -> bool:
        """
        Rejeita compartilhamento
        
        Args:
            share_id: ID do compartilhamento
            rejected_by_id: ID de quem rejeitou
            rejected_by_name: Nome de quem rejeitou
            rejected_by_email: Email de quem rejeitou
            reason: Motivo da rejeicao
        
        Returns:
            True se rejeitado com sucesso
        """
        share_data = db.get_share_by_id(share_id)
        if not share_data:
            logger.error(f"Share nao encontrado: {share_id}")
            return False
        
        if share_data["status"] != "pending":
            logger.error(f"Share nao esta pendente: {share_id}")
            return False
        
        # Atualiza status
        success = db.reject_share(share_id, rejected_by_name, reason)
        
        if success:
            # Log de auditoria
            audit_service.log_rejection(
                user_id=rejected_by_id,
                user_name=rejected_by_name,
                user_email=rejected_by_email,
                share_id=share_id,
                share_name=share_data["name"],
                sender_name=share_data["sender_name"],
                recipient_email=share_data["recipient_email"],
                reason=reason,
            )
            
            # Notificacao para remetente
            notification_service.notify_share_rejected(
                user_email=share_data["sender_email"],
                share_name=share_data["name"],
                rejected_by=rejected_by_name,
                reason=reason,
            )
            
            logger.info(f"Compartilhamento rejeitado: {share_id}")
        
        return success
    
    @staticmethod
    def cancel_share(
        share_id: str,
        cancelled_by_id: str,
        cancelled_by_name: str,
        cancelled_by_email: str,
        reason: Optional[str] = None,
    ) -> Tuple[bool, str]:
        """
        Cancela compartilhamento
        
        Args:
            share_id: ID do compartilhamento
            cancelled_by_id: ID de quem cancelou
            cancelled_by_name: Nome de quem cancelou
            cancelled_by_email: Email de quem cancelou
            reason: Motivo do cancelamento
        
        Returns:
            Tuple (sucesso, mensagem)
        """
        share_data = db.get_share_by_id(share_id)
        if not share_data:
            return False, "Compartilhamento nao encontrado"
        
        status = share_data["status"]
        
        if status == "approved":
            return False, "Este compartilhamento ja foi aprovado e nao pode ser cancelado"
        
        if status == "rejected":
            return False, "Este compartilhamento ja foi rejeitado"
        
        if status == "cancelled":
            return False, "Este compartilhamento ja foi cancelado"
        
        # Atualiza status
        success = db.cancel_share(share_id, cancelled_by_name, reason or "Cancelado pelo usuario")
        
        if success:
            # Log de auditoria
            audit_service.log_cancellation(
                user_id=cancelled_by_id,
                user_name=cancelled_by_name,
                user_email=cancelled_by_email,
                share_id=share_id,
                share_name=share_data["name"],
                recipient_email=share_data["recipient_email"],
                reason=reason or "Cancelado pelo usuario",
            )
            
            # Notificacao
            notification_service.notify_share_cancelled(
                user_email=share_data["sender_email"],
                share_name=share_data["name"],
            )
            
            logger.info(f"Compartilhamento cancelado: {share_id}")
        
        return success, "Compartilhamento cancelado com sucesso"
    
    @staticmethod
    def update_expiration(
        share_id: str,
        new_hours: int,
        changed_by_id: str,
        changed_by_name: str,
        changed_by_email: str,
        reason: Optional[str] = None,
    ) -> bool:
        """
        Atualiza tempo de expiracao
        
        Args:
            share_id: ID do compartilhamento
            new_hours: Novo valor em horas
            changed_by_id: ID de quem alterou
            changed_by_name: Nome de quem alterou
            changed_by_email: Email de quem alterou
            reason: Motivo da alteracao
        
        Returns:
            True se atualizado com sucesso
        """
        share_data = db.get_share_by_id(share_id)
        if not share_data:
            logger.error(f"Share nao encontrado: {share_id}")
            return False
        
        previous_hours = share_data.get("expiration_hours", 72)
        
        # Calcula nova data de expiracao se ja aprovado
        updates = {"expiration_hours": new_hours}
        if share_data["status"] == "approved":
            updates["expires_at"] = (datetime.utcnow() + timedelta(hours=new_hours)).isoformat()
        
        success = db.update_share(share_id, updates)
        
        if success:
            # Cria log de expiracao
            exp_log = ExpirationLog(
                share_id=share_id,
                changed_by=changed_by_name,
                changed_by_email=changed_by_email,
                previous_value=previous_hours,
                new_value=new_hours,
                reason=reason or "Ajuste pelo supervisor",
            )
            db.create_expiration_log(exp_log.to_dynamodb_item())
            
            # Log de auditoria
            audit_service.log_expiration_change(
                user_id=changed_by_id,
                user_name=changed_by_name,
                user_email=changed_by_email,
                share_id=share_id,
                share_name=share_data["name"],
                previous_hours=previous_hours,
                new_hours=new_hours,
                reason=reason,
            )
            
            # Notificacao
            notification_service.notify_expiration_changed(
                user_email=share_data["sender_email"],
                share_name=share_data["name"],
                changed_by=changed_by_name,
                previous_hours=previous_hours,
                new_hours=new_hours,
            )
            
            logger.info(f"Expiracao atualizada: {share_id} de {previous_hours}h para {new_hours}h")
        
        return success
    
    @staticmethod
    def record_download(
        share_id: str,
        user_id: str,
        user_name: str,
        user_email: str,
    ) -> bool:
        """
        Registra download
        
        Args:
            share_id: ID do compartilhamento
            user_id: ID do usuario que baixou
            user_name: Nome do usuario
            user_email: Email do usuario
        
        Returns:
            True se registrado com sucesso
        """
        share_data = db.get_share_by_id(share_id)
        if not share_data:
            return False
        
        # Verifica se expirou
        if share_data.get("expires_at"):
            expires_at = datetime.fromisoformat(share_data["expires_at"].replace("Z", "+00:00"))
            if datetime.utcnow() > expires_at.replace(tzinfo=None):
                logger.warning(f"Tentativa de download de share expirado: {share_id}")
                return False
        
        # Incrementa contador
        success = db.increment_download_count(share_id)
        
        if success:
            # Log de auditoria
            audit_service.log_download(
                user_id=user_id,
                user_name=user_name,
                user_email=user_email,
                share_id=share_id,
                share_name=share_data["name"],
                sender_name=share_data["sender_name"],
                download_count=share_data.get("download_count", 0) + 1,
            )
            
            logger.info(f"Download registrado: {share_id} por {user_email}")
        
        return success
    
    @staticmethod
    def check_if_expired(share_id: str) -> bool:
        """Verifica se compartilhamento expirou"""
        share_data = db.get_share_by_id(share_id)
        if not share_data or not share_data.get("expires_at"):
            return False
        
        expires_at = datetime.fromisoformat(share_data["expires_at"].replace("Z", "+00:00"))
        return datetime.utcnow() > expires_at.replace(tzinfo=None)


# Necessario import adiado para evitar dependencia circular
from typing import Tuple

# Instancia singleton
share_service = ShareService()
