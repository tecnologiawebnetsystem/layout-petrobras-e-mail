
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.area import SharedArea
    from app.models.user import User

class AreaSupervisor(SQLModel, table=True):
    __tablename__ = "areasupervisor"

    id: Optional[int] = Field(default=None, primary_key=True)
    area_id: int = Field(foreign_key="shared_area.id", index=True)
    supervisor_id: int = Field(foreign_key="user.id", index=True)

    area: Optional["SharedArea"] = Relationship(back_populates="supervisors")
    supervisor: Optional["User"] = Relationship(back_populates="supervised_areas")

