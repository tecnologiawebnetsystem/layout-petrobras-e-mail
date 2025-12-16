
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.area import AreaCompartilhamento
    from app.models.usuario import Usuario

class AreaSupervisor(SQLModel, table=True):
    __tablename__ = "areasupervisor"

    id: Optional[int] = Field(default=None, primary_key=True)
    area_id: int = Field(foreign_key="area_compartilhamento.id", index=True)
    supervisor_id: int = Field(foreign_key="usuario.id", index=True)

    area: Optional["AreaCompartilhamento"] = Relationship(
        back_populates="supervisores")
    supervisor: Optional["Usuario"] = Relationship()
