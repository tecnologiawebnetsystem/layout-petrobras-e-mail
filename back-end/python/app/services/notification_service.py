"""
Servico de Notificacoes
Gerencia notificacoes in-app para usuarios
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import uuid4
import logging

from app.core.dynamodb_client import db
from app.models.dynamodb_models import Notification, NotificationType, NotificationPriority

logger = logging.getLogger(__name__)


class NotificationService:
    """Servico para gerenciamento de notificacoes"""
    
    @staticmethod
    def create_notification(
        user_id: str,
        type: NotificationType,
        title: str,
        message: str,
        priority: NotificationPriority = "medium",
        action_label: Optional[str] = None,
        action_url: Optional[str] = None,
    ) -> Notification:
        """
        Cria nova notificacao para usuario
        
        Args:
            user_id: ID do destinatario
            type: Tipo da notificacao
            title: Titulo
            message: Mensagem completa
            priority: Prioridade (low, medium, high)
            action_label: Texto do botao de acao
            action_url: URL do botao de acao
        
        Returns:
            Notificacao criada
        """
        notification = Notification(
            notification_id=str(uuid4()),
            user_id=user_id,
            type=type,
            priority=priority,
            title=title,
            message=message,
            action_label=action_label,
            action_url=action_url,
            read=False,
            created_at=datetime.utcnow().isoformat(),
        )
        
        db.create_notification(notification.to_dynamodb_item())
        logger.info(f"Notificacao criada para usuario {user_id}: {title}")
        
        return notification
    
    @staticmethod
    def get_notifications(
        user_id: str,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Busca notificacoes do usuario"""
        return db.get_notifications_by_user(user_id, unread_only, limit)
    
    @staticmethod
    def get_unread_count(user_id: str) -> int:
        """Retorna quantidade de notificacoes nao lidas"""
        unread = db.get_notifications_by_user(user_id, unread_only=True, limit=100)
        return len(unread)
    
    @staticmethod
    def mark_as_read(user_id: str, notification_sk: str) -> bool:
        """Marca notificacao como lida"""
        return db.mark_notification_read(user_id, notification_sk)
    
    @staticmethod
    def mark_all_as_read(user_id: str) -> int:
        """Marca todas as notificacoes como lidas"""
        unread = db.get_notifications_by_user(user_id, unread_only=True, limit=100)
        count = 0
        
        for notif in unread:
            if db.mark_notification_read(user_id, notif["SK"]):
                count += 1
        
        return count
    
    # =========================================================================
    # NOTIFICACOES PRE-DEFINIDAS
    # =========================================================================
    
    @staticmethod
    def notify_pending_approval(
        supervisor_email: str,
        sender_name: str,
        share_name: str,
        share_id: str,
    ):
        """Notifica supervisor sobre novo compartilhamento pendente"""
        # Busca usuario supervisor
        from app.services.user_service import user_service
        supervisor = user_service.get_user_by_email(supervisor_email)
        
        if not supervisor:
            logger.warning(f"Supervisor nao encontrado: {supervisor_email}")
            return
        
        NotificationService.create_notification(
            user_id=supervisor.user_id,
            type="approval",
            priority="medium",
            title="Novo upload aguardando aprovacao",
            message=f'{sender_name} enviou "{share_name}" para aprovacao',
            action_label="Revisar",
            action_url="/supervisor",
        )
    
    @staticmethod
    def notify_upload_sent(
        user_email: str,
        share_name: str,
        recipient_email: str,
    ):
        """Notifica remetente que upload foi enviado"""
        from app.services.user_service import user_service
        user = user_service.get_user_by_email(user_email)
        
        if not user:
            return
        
        NotificationService.create_notification(
            user_id=user.user_id,
            type="info",
            priority="low",
            title="Compartilhamento enviado",
            message=f'Seu envio "{share_name}" para {recipient_email} foi encaminhado para aprovacao',
            action_label="Ver Status",
            action_url="/historico",
        )
    
    @staticmethod
    def notify_share_approved(
        user_email: str,
        share_name: str,
        recipient_email: str,
        approver_name: str,
        expiration_hours: int,
    ):
        """Notifica remetente que compartilhamento foi aprovado"""
        from app.services.user_service import user_service
        user = user_service.get_user_by_email(user_email)
        
        if not user:
            return
        
        NotificationService.create_notification(
            user_id=user.user_id,
            type="success",
            priority="high",
            title="Upload Aprovado!",
            message=f'Seu envio "{share_name}" para {recipient_email} foi aprovado por {approver_name}. Valido por {expiration_hours}h.',
            action_label="Ver Historico",
            action_url="/historico",
        )
    
    @staticmethod
    def notify_share_rejected(
        user_email: str,
        share_name: str,
        rejected_by: str,
        reason: str,
    ):
        """Notifica remetente que compartilhamento foi rejeitado"""
        from app.services.user_service import user_service
        user = user_service.get_user_by_email(user_email)
        
        if not user:
            return
        
        NotificationService.create_notification(
            user_id=user.user_id,
            type="error",
            priority="high",
            title="Upload Rejeitado",
            message=f'Seu envio "{share_name}" foi rejeitado por {rejected_by}. Motivo: {reason}',
            action_label="Revisar",
            action_url="/upload",
        )
    
    @staticmethod
    def notify_share_cancelled(
        user_email: str,
        share_name: str,
    ):
        """Notifica que compartilhamento foi cancelado"""
        from app.services.user_service import user_service
        user = user_service.get_user_by_email(user_email)
        
        if not user:
            return
        
        NotificationService.create_notification(
            user_id=user.user_id,
            type="info",
            priority="medium",
            title="Compartilhamento Cancelado",
            message=f'Seu compartilhamento "{share_name}" foi cancelado com sucesso.',
            action_label="Ver Historico",
            action_url="/historico",
        )
    
    @staticmethod
    def notify_expiration_changed(
        user_email: str,
        share_name: str,
        changed_by: str,
        previous_hours: int,
        new_hours: int,
    ):
        """Notifica que tempo de expiracao foi alterado"""
        from app.services.user_service import user_service
        user = user_service.get_user_by_email(user_email)
        
        if not user:
            return
        
        NotificationService.create_notification(
            user_id=user.user_id,
            type="info",
            priority="medium",
            title="Tempo de expiracao alterado",
            message=f'{changed_by} alterou o tempo de validade de "{share_name}" de {previous_hours}h para {new_hours}h',
            action_label="Ver Detalhes",
            action_url="/historico",
        )


# Instancia singleton
notification_service = NotificationService()
