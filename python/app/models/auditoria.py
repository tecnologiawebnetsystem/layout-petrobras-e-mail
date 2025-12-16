
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class Auditoria(SQLModel, table=True):
    __tablename__ = "auditoria"

    id: Optional[int] = Field(default=None, primary_key=True)
    evento: str  # ex.: "UPLOAD", "EMITIR_TOKEN", "DOWNLOAD", "ACK", "EXCLUIR_AREA"
    usuario_id: Optional[int] = Field(foreign_key="usuario.id", index=True)
    share_id: Optional[int] = Field(foreign_key="share.id", index=True)
    arquivo_id: Optional[int] = Field(foreign_key="arquivo.id", index=True)
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    detalhe: Optional[str] = None  # JSON/texto com metadados adicionais
