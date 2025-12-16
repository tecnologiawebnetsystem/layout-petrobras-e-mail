

from sqlmodel import SQLModel, Field, Relationship
from enum import Enum
from datetime import datetime
from typing import List, Optional
from pydantic import EmailStr
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.arquivo import Arquivo
    from app.models.share import Share
    from app.models.token_acesso import TokenAcesso
    from app.models.area import AreaCompartilhamento

class TipoUsuario(str, Enum):
    EXTERNO = "externo"
    INTERNO = "interno"
    SUPERVISOR = "supervisor"


class Usuario(SQLModel, table=True):
    __tablename__ = "usuario"

    id: Optional[int] = Field(default=None, primary_key=True)
    tipo: TipoUsuario = Field(index=True)
    nome_completo: str = Field(min_length=2, max_length=255)
    email: EmailStr = Field(index=True, unique=True)
    ativo: bool = True
    criado_em: datetime = Field(default_factory=datetime.utcnow)

    # Relacionamentos
    areas_criadas: List["AreaCompartilhamento"] = Relationship(
        back_populates="solicitante")
    arquivos_upload: List["Arquivo"] = Relationship(
        back_populates="upload_por")
    shares_criados: List["Share"] = Relationship(back_populates="criado_por")
    tokens: List["TokenAcesso"] = Relationship(back_populates="usuario")
