from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, UTC
from typing import Optional, List
from enum import Enum

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.area import SharedArea
    from app.models.user import User
    from app.models.share_file import ShareFile
    from app.models.token_access import TokenAccess


class ShareStatus(str, Enum):
    PENDING = "pendente"
    ACTIVE = "ativo"
    APPROVED = "aprovado"
    REJECTED = "rejeitado"
    COMPLETED = "concluido"
    EXPIRED = "expirado"
    CANCELED = "cancelado"


class TokenConsumption(str, Enum):
    AFTER_ALL = "apos_todos"
    AFTER_FIRST = "apos_primeiro"


class Share(SQLModel, table=True):
    __tablename__ = "share"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = Field(default=None, max_length=255)  # Titulo do compartilhamento
    description: Optional[str] = Field(default=None, max_length=1000)
    area_id: Optional[int] = Field(foreign_key="shared_area.id", index=True)
    external_email: str = Field(index=True)
    status: ShareStatus = Field(default=ShareStatus.PENDING, index=True)
    consumption_policy: TokenConsumption = Field(default=TokenConsumption.AFTER_ALL)
    expiration_hours: int = Field(default=72)  # Horas de expiracao solicitadas
    expires_at: Optional[datetime] = Field(default=None)  # Data efetiva de expiracao (definida na aprovacao)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Quem criou o compartilhamento (interno)
    created_by_id: int = Field(foreign_key="user.id", index=True)

    # Aprovacao/Rejeicao
    approver_id: Optional[int] = Field(default=None, foreign_key="user.id")
    approved_at: Optional[datetime] = Field(default=None)
    rejected_at: Optional[datetime] = Field(default=None)
    rejection_reason: Optional[str] = Field(default=None, max_length=500)
    approval_comments: Optional[str] = Field(default=None, max_length=500)

    # Relacionamentos
    area: Optional["SharedArea"] = Relationship(back_populates="shares")
    approver: Optional["User"] = Relationship(
        back_populates="shares_approved",
        sa_relationship_kwargs={"foreign_keys": "[Share.approver_id]"}
    )
    created_by: Optional["User"] = Relationship(
        back_populates="shares_created",
        sa_relationship_kwargs={"foreign_keys": "[Share.created_by_id]"}
    )
    files: List["ShareFile"] = Relationship(back_populates="share")
    token: Optional["TokenAccess"] = Relationship(back_populates="share", sa_relationship_kwargs={"uselist": False})
