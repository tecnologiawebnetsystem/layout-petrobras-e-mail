from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List
from enum import Enum

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.area import AreaCompartilhamento
    from app.models.usuario import Usuario
    from app.models.share_arquivo import ShareArquivo
    from app.models.token_acesso import TokenAcesso


class ShareStatus(str, Enum):
    ATIVO = "ativo"
    CONCLUIDO = "concluido"
    EXPIRADO = "expirado"
    CANCELADO = "cancelado"


class TokenConsumo(str, Enum):
    APOS_TODOS = "apos_todos"
    APOS_PRIMEIRO = "apos_primeiro"


class Share(SQLModel, table=True):
    __tablename__ = "share"

    id: Optional[int] = Field(default=None, primary_key=True)
    area_id: int = Field(foreign_key="area_compartilhamento.id", index=True)
    externo_email: str = Field(index=True)
    status: ShareStatus = Field(default=ShareStatus.ATIVO, index=True)
    consumo_policy: TokenConsumo = Field(default=TokenConsumo.APOS_TODOS)
    expira_em: datetime
    criado_em: datetime = Field(default_factory=datetime.utcnow)

    # Quem criou o compartilhamento (interno)
    criado_por_id: int = Field(foreign_key="usuario.id", index=True)

    # Relacionamentos
    area: Optional["AreaCompartilhamento"] = Relationship(
        back_populates="shares")
    criado_por: Optional["Usuario"] = Relationship(
        back_populates="shares_criados")
    arquivos: List["ShareArquivo"] = Relationship(back_populates="share")
    token: Optional["TokenAcesso"] = Relationship(
        back_populates="share", sa_relationship_kwargs={"uselist": False}
    )
