from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime, UTC
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.areasupervisors import AreaSupervisor
    from app.models.restricted_file import RestrictedFile
    from app.models.share import Share


# Sugestão ou deixar apenas boolean?
# class AreaStatus(str, Enum):
#     ATIVA = "ativa"
#     ENCERRADA = "encerrada"
#     EXPIRADA = "expirada"


class SharedArea(SQLModel, table=True):
    __tablename__ = "shared_area"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    prefix_s3: str
    description: Optional[str] = None
    status: bool = True  # Posso colocar outros status, mas não vejo necessidade
    expira_at: Optional[datetime] = None # prazo para encerrar/excluir esta área
    created_at: datetime | None = Field(default_factory=lambda: datetime.now(UTC))
   
    # Dono da área (interno)
    # Usuário que fez o envio do compartilhamento
    applicant_id: int = Field(foreign_key="user.id", index=True)
    applicant: Optional["User"] = Relationship(back_populates="areas_created")

    # Supervisores (N:N) - ver tabela pivot abaixo
    supervisors: List["AreaSupervisor"] = Relationship(back_populates="area")
    # Conteúdo e compartilhamentos
    files: List["RestrictedFile"] = Relationship(back_populates="area")
    shares: List["Share"] = Relationship(back_populates="area")
