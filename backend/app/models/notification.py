from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, UTC
from typing import Optional
from enum import Enum

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User


class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    APPROVAL = "approval"
    REJECTION = "rejection"
    DOWNLOAD = "download"
    EXPIRATION = "expiration"


class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Notification(SQLModel, table=True):
    __tablename__ = "notification"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    type: NotificationType = Field(default=NotificationType.INFO, index=True)
    priority: NotificationPriority = Field(default=NotificationPriority.MEDIUM)
    title: str = Field(max_length=255)
    message: str = Field(max_length=1000)
    read: bool = Field(default=False, index=True)
    action_label: Optional[str] = Field(default=None, max_length=100)
    action_url: Optional[str] = Field(default=None, max_length=500)
    metadata: Optional[str] = Field(default=None)  # JSON string for extra data
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Relacionamento
    user: Optional["User"] = Relationship(back_populates="notifications")
