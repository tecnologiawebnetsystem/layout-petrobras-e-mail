"""
Modelo para rastreamento de emails enviados.
"""
from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
from enum import Enum


class EmailStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"
    COMPLAINED = "complained"
    FAILED = "failed"


class EmailType(str, Enum):
    FILE_SHARE = "file_share"
    OTP = "otp"
    APPROVAL_REQUEST = "approval_request"
    APPROVAL_GRANTED = "approval_granted"
    APPROVAL_REJECTED = "approval_rejected"
    EXPIRATION_WARNING = "expiration_warning"
    DOWNLOAD_CONFIRMATION = "download_confirmation"
    PASSWORD_RESET = "password_reset"
    WELCOME = "welcome"
    SYSTEM = "system"


class EmailLog(SQLModel, table=True):
    __tablename__ = "email_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Identificador unico do email (para rastreamento SES)
    message_id: str = Field(index=True, unique=True)
    
    # Tipo de email
    email_type: EmailType = Field(index=True)
    
    # Remetente e destinatario
    from_email: str
    to_email: str = Field(index=True)
    
    # Conteudo
    subject: str
    body_preview: Optional[str] = Field(default=None, max_length=500)
    
    # Status
    status: EmailStatus = Field(default=EmailStatus.PENDING, index=True)
    
    # Metadados de entrega
    sent_at: Optional[datetime] = Field(default=None)
    delivered_at: Optional[datetime] = Field(default=None)
    opened_at: Optional[datetime] = Field(default=None)
    clicked_at: Optional[datetime] = Field(default=None)
    bounced_at: Optional[datetime] = Field(default=None)
    
    # Erro (se houver)
    error_message: Optional[str] = Field(default=None, max_length=1000)
    error_code: Optional[str] = Field(default=None, max_length=50)
    
    # Relacionamentos
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)
    share_id: Optional[int] = Field(default=None, foreign_key="share.id", index=True)
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: Optional[datetime] = Field(default=None)
    
    # Metadados adicionais (JSON serializado)
    # Nota: "metadata" e palavra reservada do SQLAlchemy, por isso usamos "extra_metadata"
    extra_metadata: Optional[str] = Field(default=None, sa_column_kwargs={"name": "extra_metadata"})
