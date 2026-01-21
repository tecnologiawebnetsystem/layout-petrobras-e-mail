"""
Modelos DynamoDB para o Sistema de Compartilhamento Seguro de Arquivos
Baseado na estrutura do frontend (stores Zustand)
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, EmailStr
from uuid import uuid4


# =============================================================================
# ENUMS E TIPOS
# =============================================================================

UserType = Literal["internal", "supervisor", "external"]
ShareStatus = Literal["pending", "approved", "rejected", "cancelled", "expired"]
LogAction = Literal[
    "login", "logout", "login_failed",
    "upload", "download",
    "approve", "reject", "cancel",
    "expiration_change",
    "otp_generate", "otp_validate", "otp_expired", "otp_max_attempts",
    "terms_accepted",
    "file_expired",
    "session_created", "session_expired"
]
LogLevel = Literal["info", "warning", "error", "success"]
EmailType = Literal["otp", "supervisor", "confirmation", "recipient"]
NotificationType = Literal["approval", "success", "error", "info", "warning"]
NotificationPriority = Literal["low", "medium", "high"]


# =============================================================================
# MODELO: Usuario
# Corresponde a: auth-store.ts (User interface)
# =============================================================================

class ManagerInfo(BaseModel):
    """Informacoes do supervisor direto"""
    id: str
    name: str
    email: EmailStr
    job_title: Optional[str] = None
    department: Optional[str] = None


class User(BaseModel):
    """
    Usuario do sistema (interno, supervisor ou externo)
    
    PK: USER#<user_id>
    SK: PROFILE
    """
    user_id: str = Field(default_factory=lambda: str(uuid4()))
    email: EmailStr
    name: str
    user_type: UserType
    
    # Dados do Entra ID (internos/supervisores)
    job_title: Optional[str] = None
    department: Optional[str] = None
    office_location: Optional[str] = None
    mobile_phone: Optional[str] = None
    employee_id: Optional[str] = None
    photo_url: Optional[str] = None
    entra_id: Optional[str] = None
    
    # Supervisor direto
    manager: Optional[ManagerInfo] = None
    
    # Controle
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    last_login_at: Optional[str] = None
    
    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Converte para formato DynamoDB"""
        item = {
            "PK": f"USER#{self.user_id}",
            "SK": "PROFILE",
            "user_id": self.user_id,
            "email": self.email,
            "name": self.name,
            "user_type": self.user_type,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
        
        # Campos opcionais
        if self.job_title:
            item["job_title"] = self.job_title
        if self.department:
            item["department"] = self.department
        if self.office_location:
            item["office_location"] = self.office_location
        if self.mobile_phone:
            item["mobile_phone"] = self.mobile_phone
        if self.employee_id:
            item["employee_id"] = self.employee_id
        if self.photo_url:
            item["photo_url"] = self.photo_url
        if self.entra_id:
            item["entra_id"] = self.entra_id
        if self.last_login_at:
            item["last_login_at"] = self.last_login_at
            
        # Manager
        if self.manager:
            item["manager_id"] = self.manager.id
            item["manager_name"] = self.manager.name
            item["manager_email"] = self.manager.email
            if self.manager.job_title:
                item["manager_job_title"] = self.manager.job_title
            if self.manager.department:
                item["manager_department"] = self.manager.department
                
        return item
    
    @classmethod
    def from_dynamodb_item(cls, item: Dict[str, Any]) -> "User":
        """Cria instancia a partir de item DynamoDB"""
        manager = None
        if item.get("manager_id"):
            manager = ManagerInfo(
                id=item["manager_id"],
                name=item.get("manager_name", ""),
                email=item.get("manager_email", ""),
                job_title=item.get("manager_job_title"),
                department=item.get("manager_department"),
            )
        
        return cls(
            user_id=item["user_id"],
            email=item["email"],
            name=item["name"],
            user_type=item["user_type"],
            job_title=item.get("job_title"),
            department=item.get("department"),
            office_location=item.get("office_location"),
            mobile_phone=item.get("mobile_phone"),
            employee_id=item.get("employee_id"),
            photo_url=item.get("photo_url"),
            entra_id=item.get("entra_id"),
            manager=manager,
            is_active=item.get("is_active", True),
            created_at=item["created_at"],
            updated_at=item["updated_at"],
            last_login_at=item.get("last_login_at"),
        )


# =============================================================================
# MODELO: Arquivo
# Corresponde a: workflow-store.ts (files array)
# =============================================================================

class FileInfo(BaseModel):
    """
    Arquivo de um compartilhamento
    
    PK: SHARE#<share_id>
    SK: FILE#<file_id>
    """
    file_id: str = Field(default_factory=lambda: str(uuid4()))
    share_id: str
    file_name: str
    file_type: str  # Extensao (PDF, DOCX, etc)
    file_size: str  # Formatado (ex: "2.5 MB")
    file_size_bytes: int
    mime_type: str
    
    # S3
    s3_bucket: str
    s3_key: str
    s3_version_id: Optional[str] = None
    
    # Seguranca
    checksum_sha256: str
    is_encrypted: bool = True
    kms_key_id: Optional[str] = None
    
    # Upload
    upload_status: Literal["pending", "completed", "failed"] = "pending"
    uploaded_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    
    # Scan de virus
    scanned_at: Optional[str] = None
    scan_result: Optional[Literal["clean", "infected", "pending"]] = "pending"
    
    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Converte para formato DynamoDB"""
        item = {
            "PK": f"SHARE#{self.share_id}",
            "SK": f"FILE#{self.file_id}",
            "file_id": self.file_id,
            "share_id": self.share_id,
            "file_name": self.file_name,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "file_size_bytes": self.file_size_bytes,
            "mime_type": self.mime_type,
            "s3_bucket": self.s3_bucket,
            "s3_key": self.s3_key,
            "checksum_sha256": self.checksum_sha256,
            "is_encrypted": self.is_encrypted,
            "upload_status": self.upload_status,
            "uploaded_at": self.uploaded_at,
        }
        
        if self.s3_version_id:
            item["s3_version_id"] = self.s3_version_id
        if self.kms_key_id:
            item["kms_key_id"] = self.kms_key_id
        if self.scanned_at:
            item["scanned_at"] = self.scanned_at
        if self.scan_result:
            item["scan_result"] = self.scan_result
            
        return item


# =============================================================================
# MODELO: Compartilhamento (Share)
# Corresponde a: workflow-store.ts (FileUpload interface)
# =============================================================================

class SenderInfo(BaseModel):
    """Informacoes do remetente"""
    id: str
    name: str
    email: EmailStr
    employee_id: Optional[str] = None
    role: Optional[str] = None


class ApproverInfo(BaseModel):
    """Informacoes do aprovador"""
    id: str
    name: str
    email: EmailStr


class Share(BaseModel):
    """
    Compartilhamento de arquivos
    
    PK: SHARE#<share_id>
    SK: METADATA
    """
    share_id: str = Field(default_factory=lambda: str(uuid4()))
    name: str  # Titulo/descricao curta
    description: Optional[str] = None
    status: ShareStatus = "pending"
    
    # Remetente
    sender: SenderInfo
    
    # Destinatario externo
    recipient_email: EmailStr
    recipient_name: Optional[str] = None
    
    # Aprovador (supervisor)
    approver: Optional[ApproverInfo] = None
    
    # Flags especiais
    sent_by_supervisor: bool = False  # Se o remetente eh supervisor
    
    # Expiracao
    expiration_hours: int = 72  # 24, 48 ou 72
    expires_at: Optional[str] = None
    
    # Datas
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    approved_at: Optional[str] = None
    rejected_at: Optional[str] = None
    cancelled_at: Optional[str] = None
    
    # Motivos
    rejection_reason: Optional[str] = None
    cancellation_reason: Optional[str] = None
    cancelled_by: Optional[str] = None
    
    # Download
    download_count: int = 0
    last_download_at: Optional[str] = None
    
    # Termos de uso (externo)
    terms_accepted: bool = False
    terms_accepted_at: Optional[str] = None
    
    # Lista de arquivos (nao persistido aqui, separado em petrobras_files)
    files: List[Dict[str, str]] = []  # [{name, size, type}]
    
    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Converte para formato DynamoDB"""
        item = {
            "PK": f"SHARE#{self.share_id}",
            "SK": "METADATA",
            "share_id": self.share_id,
            "name": self.name,
            "status": self.status,
            "sender_id": self.sender.id,
            "sender_name": self.sender.name,
            "sender_email": self.sender.email,
            "recipient_email": self.recipient_email,
            "sent_by_supervisor": self.sent_by_supervisor,
            "expiration_hours": self.expiration_hours,
            "created_at": self.created_at,
            "download_count": self.download_count,
            "terms_accepted": self.terms_accepted,
        }
        
        # Campos opcionais
        if self.description:
            item["description"] = self.description
        if self.sender.employee_id:
            item["sender_employee_id"] = self.sender.employee_id
        if self.recipient_name:
            item["recipient_name"] = self.recipient_name
        if self.approver:
            item["approver_id"] = self.approver.id
            item["approver_name"] = self.approver.name
            item["approver_email"] = self.approver.email
        if self.expires_at:
            item["expires_at"] = self.expires_at
        if self.approved_at:
            item["approved_at"] = self.approved_at
        if self.rejected_at:
            item["rejected_at"] = self.rejected_at
        if self.cancelled_at:
            item["cancelled_at"] = self.cancelled_at
        if self.rejection_reason:
            item["rejection_reason"] = self.rejection_reason
        if self.cancellation_reason:
            item["cancellation_reason"] = self.cancellation_reason
        if self.cancelled_by:
            item["cancelled_by"] = self.cancelled_by
        if self.last_download_at:
            item["last_download_at"] = self.last_download_at
        if self.terms_accepted_at:
            item["terms_accepted_at"] = self.terms_accepted_at
            
        return item


# =============================================================================
# MODELO: OTP
# Corresponde a: otp-service.ts
# =============================================================================

class OTP(BaseModel):
    """
    Codigo OTP para autenticacao de usuario externo
    
    PK: OTP#<email>
    SK: CODE#<timestamp>
    """
    email: EmailStr
    code: str  # 6 digitos
    attempts: int = 0
    max_attempts: int = 3
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    expires_at: str = Field(
        default_factory=lambda: (datetime.utcnow() + timedelta(minutes=3)).isoformat()
    )
    validated_at: Optional[str] = None
    is_valid: bool = True
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Converte para formato DynamoDB"""
        return {
            "PK": f"OTP#{self.email}",
            "SK": f"CODE#{self.created_at}",
            "email": self.email,
            "code": self.code,
            "attempts": self.attempts,
            "max_attempts": self.max_attempts,
            "created_at": self.created_at,
            "expires_at": self.expires_at,
            "is_valid": self.is_valid,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "ttl": int((datetime.fromisoformat(self.expires_at.replace("Z", "+00:00"))).timestamp()),
        }


# =============================================================================
# MODELO: Sessao
# Corresponde a: auth-store.ts (tokens)
# =============================================================================

class Session(BaseModel):
    """
    Sessao de usuario
    
    PK: SESSION#<session_id>
    SK: USER#<user_id>
    """
    session_id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    user_email: EmailStr
    user_type: UserType
    access_token: str
    refresh_token: Optional[str] = None
    entra_id_token: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    expires_at: str = Field(
        default_factory=lambda: (datetime.utcnow() + timedelta(hours=8)).isoformat()
    )
    last_activity_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool = True
    
    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Converte para formato DynamoDB"""
        item = {
            "PK": f"SESSION#{self.session_id}",
            "SK": f"USER#{self.user_id}",
            "session_id": self.session_id,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "user_type": self.user_type,
            "access_token": self.access_token,
            "created_at": self.created_at,
            "expires_at": self.expires_at,
            "last_activity_at": self.last_activity_at,
            "is_active": self.is_active,
            "ttl": int((datetime.fromisoformat(self.expires_at.replace("Z", "+00:00"))).timestamp()),
        }
        
        if self.refresh_token:
            item["refresh_token"] = self.refresh_token
        if self.entra_id_token:
            item["entra_id_token"] = self.entra_id_token
        if self.ip_address:
            item["ip_address"] = self.ip_address
        if self.user_agent:
            item["user_agent"] = self.user_agent
            
        return item


# =============================================================================
# MODELO: Log de Auditoria
# Corresponde a: audit-log-store.ts (AuditLog interface)
# =============================================================================

class AuditLogUser(BaseModel):
    """Usuario que executou a acao"""
    id: str
    name: str
    email: EmailStr
    type: UserType
    employee_id: Optional[str] = None


class AuditLogDetails(BaseModel):
    """Detalhes da acao"""
    target_id: Optional[str] = None
    target_name: Optional[str] = None
    target_type: Optional[Literal["share", "file", "user", "session"]] = None
    description: str
    ip_address: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AuditLog(BaseModel):
    """
    Log de auditoria
    
    PK: LOG#<YYYY-MM-DD>
    SK: <timestamp>#<log_id>
    """
    log_id: str = Field(default_factory=lambda: str(uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    action: LogAction
    level: LogLevel
    user: AuditLogUser
    details: AuditLogDetails
    
    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Converte para formato DynamoDB"""
        date_part = self.timestamp[:10]  # YYYY-MM-DD
        
        item = {
            "PK": f"LOG#{date_part}",
            "SK": f"{self.timestamp}#{self.log_id}",
            "log_id": self.log_id,
            "timestamp": self.timestamp,
            "action": self.action,
            "level": self.level,
            "user_id": self.user.id,
            "user_name": self.user.name,
            "user_email": self.user.email,
            "user_type": self.user.type,
            "description": self.details.description,
        }
        
        if self.user.employee_id:
            item["user_employee_id"] = self.user.employee_id
        if self.details.target_id:
            item["target_id"] = self.details.target_id
        if self.details.target_name:
            item["target_name"] = self.details.target_name
        if self.details.target_type:
            item["target_type"] = self.details.target_type
        if self.details.ip_address:
            item["ip_address"] = self.details.ip_address
        if self.details.metadata:
            item["metadata"] = self.details.metadata
            
        return item


# =============================================================================
# MODELO: Notificacao
# Corresponde a: notification-store.ts (Notification interface)
# =============================================================================

class Notification(BaseModel):
    """
    Notificacao para usuario
    
    PK: USER#<user_id>
    SK: NOTIF#<timestamp>#<notif_id>
    """
    notification_id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    type: NotificationType
    priority: NotificationPriority = "medium"
    title: str
    message: str
    action_label: Optional[str] = None
    action_url: Optional[str] = None
    read: bool = False
    read_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    
    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Converte para formato DynamoDB"""
        item = {
            "PK": f"USER#{self.user_id}",
            "SK": f"NOTIF#{self.created_at}#{self.notification_id}",
            "notification_id": self.notification_id,
            "user_id": self.user_id,
            "type": self.type,
            "priority": self.priority,
            "title": self.title,
            "message": self.message,
            "read": self.read,
            "created_at": self.created_at,
        }
        
        if self.action_label:
            item["action_label"] = self.action_label
        if self.action_url:
            item["action_url"] = self.action_url
        if self.read_at:
            item["read_at"] = self.read_at
            
        return item


# =============================================================================
# MODELO: Log de Expiracao
# Corresponde a: workflow-store.ts (ExpirationLog interface)
# =============================================================================

class ExpirationLog(BaseModel):
    """
    Historico de alteracoes de expiracao
    
    PK: SHARE#<share_id>
    SK: EXPLOG#<timestamp>
    """
    share_id: str
    changed_by: str
    changed_by_email: EmailStr
    previous_value: Optional[int] = None
    new_value: int
    reason: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    
    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Converte para formato DynamoDB"""
        item = {
            "PK": f"SHARE#{self.share_id}",
            "SK": f"EXPLOG#{self.timestamp}",
            "share_id": self.share_id,
            "changed_by": self.changed_by,
            "changed_by_email": self.changed_by_email,
            "new_value": self.new_value,
            "timestamp": self.timestamp,
        }
        
        if self.previous_value is not None:
            item["previous_value"] = self.previous_value
        if self.reason:
            item["reason"] = self.reason
            
        return item


# =============================================================================
# MODELO: Email
# Corresponde a: send-email route handler
# =============================================================================

class Email(BaseModel):
    """
    Registro de email enviado
    
    PK: EMAIL#<YYYY-MM-DD>
    SK: <timestamp>#<email_id>
    """
    email_id: str = Field(default_factory=lambda: str(uuid4()))
    message_id: Optional[str] = None  # ID do SES
    type: EmailType
    to_email: EmailStr
    to_name: Optional[str] = None
    from_email: EmailStr
    subject: str
    status: Literal["pending", "sent", "delivered", "failed", "bounced"] = "pending"
    sent_at: Optional[str] = None
    delivered_at: Optional[str] = None
    error_message: Optional[str] = None
    related_share_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    
    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Converte para formato DynamoDB"""
        date_part = self.created_at[:10]  # YYYY-MM-DD
        
        item = {
            "PK": f"EMAIL#{date_part}",
            "SK": f"{self.created_at}#{self.email_id}",
            "email_id": self.email_id,
            "type": self.type,
            "to_email": self.to_email,
            "from_email": self.from_email,
            "subject": self.subject,
            "status": self.status,
            "created_at": self.created_at,
        }
        
        if self.message_id:
            item["message_id"] = self.message_id
        if self.to_name:
            item["to_name"] = self.to_name
        if self.sent_at:
            item["sent_at"] = self.sent_at
        if self.delivered_at:
            item["delivered_at"] = self.delivered_at
        if self.error_message:
            item["error_message"] = self.error_message
        if self.related_share_id:
            item["related_share_id"] = self.related_share_id
        if self.metadata:
            item["metadata"] = self.metadata
            
        return item
