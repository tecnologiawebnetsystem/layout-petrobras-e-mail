from sqlmodel import SQLModel, Field
from enum import Enum
from datetime import datetime, UTC
from typing import Optional


class TypeLevel(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"

class Audit(SQLModel, table=True):
    __tablename__ = "audit"

    id: Optional[int] = Field(default=None, primary_key=True)
    action: str  # ex.: "UPLOAD", "EMITIR_TOKEN", "DOWNLOAD", "ACK", "EXCLUIR_AREA"
    level: TypeLevel = Field(index=True, default=TypeLevel.SUCCESS)
    user_id: Optional[int] = Field(foreign_key="user.id", index=True)
    share_id: Optional[int] = Field(foreign_key="share.id", index=True)
    file_id: Optional[int] = Field(foreign_key="restricted_file.id", index=True)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    detail: Optional[str] = None  # JSON/texto com metadados adicionais
