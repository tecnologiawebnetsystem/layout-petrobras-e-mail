from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional

class CredentialLocal(SQLModel, table=True):
    __tablename__ = "credential_local"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    password_hash: str
    failed_attempts: int = Field(default=0, index=True)
    blocked_until: datetime | None = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
