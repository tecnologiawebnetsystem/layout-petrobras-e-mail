
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.share import Share
    from app.models.arquivo import Arquivo

class ShareArquivo(SQLModel, table=True):
    __tablename__ = "share_arquivo"

    id: Optional[int] = Field(default=None, primary_key=True)
    share_id: int = Field(foreign_key="share.id", index=True)
    arquivo_id: int = Field(foreign_key="arquivo.id", index=True)
    baixado: bool = Field(default=False, index=True)
    baixado_em: Optional[datetime] = None

    share: Optional["Share"] = Relationship(back_populates="arquivos")
    arquivo: Optional["Arquivo"] = Relationship(back_populates="shares")
