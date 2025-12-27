from sqlmodel import SQLModel, Field, Relationship
from enum import Enum
from datetime import datetime, UTC
from typing import List, Optional
from pydantic import EmailStr
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.restricted_file import RestrictedFile
    from app.models.share import Share
    from app.models.token_access import TokenAccess
    from app.models.area import SharedArea

class TypeUser(str, Enum):
    EXTERNAL = "externo"
    INTERNAL = "internal"
    SUPERVISOR = "supervisor"


class User(SQLModel, table=True):
    __tablename__ = "user"

    id: Optional[int] = Field(default=None, primary_key=True)
    type: TypeUser = Field(index=True)
    name: str = Field(min_length=2, max_length=255) # Nome completo (em caso de usar o Entra ID)
    email: EmailStr = Field(index=True, unique=True)
    status: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Relacionamentos
    areas_created: List["SharedArea"] = Relationship(back_populates="applicant")
    upload_files: List["RestrictedFile"] = Relationship(back_populates="upload_by")
    shares_created: List["Share"] = Relationship(back_populates="created_by")
    tokens: List["TokenAccess"] = Relationship(back_populates="user")
    supervised_areas: List["AreaSupervisor"] = Relationship(back_populates="supervisor")
