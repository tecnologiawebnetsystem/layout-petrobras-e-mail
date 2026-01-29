
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, UTC
from typing import Optional
from enum import Enum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.share import Share


class TypeToken(str, Enum):
    OTP = "otp"
    ACCESS = "access"


class TokenAccess(SQLModel, table=True):
    __tablename__ = "token_access"

    id: Optional[int] = Field(default=None, primary_key=True)
    type: TypeToken = Field(index=True)
    # Para ACCESS: armazenar valor url-safe aqui
    token: Optional[str] = Field(default=None, index=True, sa_column_kwargs={"unique": True})
    # Para OTP: armazenar hash do código de 6 dígitos aqui
    token_hash: Optional[str] = None
    user_id: int = Field(foreign_key="user.id", index=True)
    share_id: int = Field(foreign_key="share.id", index=True)
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    used: bool = Field(default=False, index=True)

    # Número de tentativas de verificação (para rate limit / bloqueio)
    attempts: int = Field(default=0, index=True)
    blocked_until: Optional[datetime] = Field(default=None, index=True)

    # Relacionamentos
    user: Optional["User"] = Relationship(back_populates="tokens")
    share: Optional["Share"] = Relationship(back_populates="token")
