from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, UTC
from typing import Optional, List
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.area import SharedArea
    from app.models.user import User
    from app.models.share_file import ShareFile


class RestrictedFile(SQLModel, table=True):
    __tablename__ = "restricted_file"

    id: Optional[int] = Field(default=None, primary_key=True)
    area_id: int = Field(foreign_key="shared_area.id")
    name: str
    key_s3: str
    size_bytes: Optional[int]
    mime_type: Optional[str] = None
    checksum: Optional[str] = None
    upload_id: Optional[int] = Field(foreign_key="user.id") # Usuário que fez o upload
    expira_at: Optional[datetime]
    created_at: datetime | None = Field(default_factory=lambda: datetime.now(UTC))
    status: bool = True

    # Relacionamentos
    area: Optional["SharedArea"] = Relationship(back_populates="files")
    upload_by: Optional["User"] = Relationship(back_populates="upload_files")
    shares: List["ShareFile"] = Relationship(back_populates="file")
