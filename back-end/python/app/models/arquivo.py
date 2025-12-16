from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.area import AreaCompartilhamento
    from app.models.usuario import Usuario
    from app.models.share_arquivo import ShareArquivo


class Arquivo(SQLModel, table=True):
    __tablename__ = "arquivo"

    id: Optional[int] = Field(default=None, primary_key=True)
    area_id: int = Field(foreign_key="area_compartilhamento.id")
    nome_arquivo: str
    chave_s3: str
    tamanho_bytes: Optional[int]
    mime_type: Optional[str] = None
    checksum: Optional[str] = None
    upload_por_id: Optional[int] = Field(foreign_key="usuario.id")
    data_upload: datetime | None = Field(default_factory=datetime.utcnow)
    expira_em: Optional[datetime]
    ativo: bool = True
    criado_em: datetime | None = Field(default_factory=datetime.utcnow)

    # Relacionamentos
    area: Optional["AreaCompartilhamento"] = Relationship(
        back_populates="arquivos")
    upload_por: Optional["Usuario"] = Relationship(
        back_populates="arquivos_upload")
    shares: List["ShareArquivo"] = Relationship(back_populates="arquivo")
