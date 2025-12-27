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
    ACTIVE = "ativo"
    COMPLETED = "concluido"
    EXPIRED = "expirado"
    CANCELED = "cancelado"


class TokenConsumption(str, Enum):
    AFTER_ALL = "apos_todos"
    AFTER_FIRST = "apos_primeiro"


class Share(SQLModel, table=True):
    __tablename__ = "share"

    id: Optional[int] = Field(default=None, primary_key=True)
    area_id: Optional[int] = Field(foreign_key="shared_area.id", index=True)
    external_email: str = Field(index=True)
    status: ShareStatus = Field(default=ShareStatus.ACTIVE, index=True)
    consumption_policy: TokenConsumption = Field(default=TokenConsumption.AFTER_ALL)
    expira_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Quem criou o compartilhamento (interno)
    created_by_id: int = Field(foreign_key="user.id", index=True)

    # Relacionamentos
    area: Optional["SharedArea"] = Relationship(back_populates="shares")
    created_by: Optional["User"] = Relationship(back_populates="shares_created")
    files: List["ShareFile"] = Relationship(back_populates="share")
    token: Optional["TokenAccess"] = Relationship(back_populates="share", sa_relationship_kwargs={"uselist": False})
