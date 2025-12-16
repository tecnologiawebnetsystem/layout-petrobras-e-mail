from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.usuario import Usuario
    from app.models.areasupervisor import AreaSupervisor
    from app.models.arquivo import Arquivo
    from app.models.share import Share


# Sugestão ou deixar apenas boolean?
# class AreaStatus(str, Enum):
#     ATIVA = "ativa"
#     ENCERRADA = "encerrada"
#     EXPIRADA = "expirada"


class AreaCompartilhamento(SQLModel, table=True):
    __tablename__ = "area_compartilhamento"

    id: Optional[int] = Field(default=None, primary_key=True)
    nome_area: str
    prefixo_s3: str
    descricao: Optional[str]
    ativo: bool = True  # Posso colocar outros status, mas não vejo necessidade
    # prazo para encerrar/excluir esta área
    expira_em: Optional[datetime] = None
    criado_em: datetime | None = Field(default_factory=datetime.utcnow)
    # atualizado_em: datetime | None = Field(default_factory=datetime.utcnow) # Não sei se tera atualização nos compartilhamentos ainda

    # Dono da área (interno)
    # Usuário que fez o envio do compartilhamento
    solicitante_id: int = Field(foreign_key="usuario.id", index=True)
    solicitante: Optional["Usuario"] = Relationship(
        back_populates="areas_criadas")

    # Supervisores (N:N) - ver tabela pivot abaixo
    supervisores: List["AreaSupervisor"] = Relationship(back_populates="area")

    # Conteúdo e compartilhamentos
    arquivos: List["Arquivo"] = Relationship(back_populates="area")
    shares: List["Share"] = Relationship(back_populates="area")
