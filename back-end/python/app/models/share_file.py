from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.share import Share
    from app.models.restricted_file import RestrictedFile

class ShareFile(SQLModel, table=True):
    __tablename__ = "share_file"

    id: Optional[int] = Field(default=None, primary_key=True)
    share_id: int = Field(foreign_key="share.id", index=True)
    file_id: int = Field(foreign_key="restricted_file.id", index=True)
    downloaded: bool = Field(default=False, index=True) # Se o arquivo já foi baixado
    downloaded_at: Optional[datetime] = None # Quando o arquivo foi baixado

    # Relacionamentos
    share: Optional["Share"] = Relationship(back_populates="files")
    file: Optional["RestrictedFile"] = Relationship(back_populates="shares")
