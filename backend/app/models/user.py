

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
    from app.models.notification import Notification
    from app.models.areasupervisors import AreaSupervisor

class TypeUser(str, Enum):
    EXTERNAL = "externo"
    INTERNAL = "internal"
    SUPPORT = "support"  # Time de atendimento - pode cadastrar usuarios externos
    # SUPERVISOR foi removido: supervisores são usuários INTERNAL com is_supervisor=True.
    # A relação supervisor-supervisionado vem do chamado ServiceNow e é armazenada em manager_id.


class User(SQLModel, table=True):
    __tablename__ = "user"

    id: Optional[int] = Field(default=None, primary_key=True)
    type: TypeUser = Field(index=True)
    name: str = Field(min_length=2, max_length=255)  # Nome completo (em caso de usar o Entra ID)
    email: EmailStr = Field(index=True, unique=True)
    phone: Optional[str] = Field(default=None, max_length=20)
    department: Optional[str] = Field(default=None, max_length=255)
    job_title: Optional[str] = Field(default=None, max_length=255)
    employee_id: Optional[str] = Field(default=None, max_length=50)
    photo_url: Optional[str] = Field(default=None, max_length=500)
    manager_id: Optional[int] = Field(default=None, foreign_key="user.id")
    is_supervisor: bool = Field(default=False)  # True = pode aprovar/rejeitar shares da sua área
    status: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    last_login: Optional[datetime] = Field(default=None)

    # Relacionamentos
    areas_created: List["SharedArea"] = Relationship(back_populates="applicant")
    upload_files: List["RestrictedFile"] = Relationship(back_populates="upload_by")
    shares_created: List["Share"] = Relationship(
        back_populates="created_by",
        sa_relationship_kwargs={"foreign_keys": "[Share.created_by_id]"}
    )
    shares_approved: List["Share"] = Relationship(
        back_populates="approver",
        sa_relationship_kwargs={"foreign_keys": "[Share.approver_id]"}
    )
    manager: Optional["User"] = Relationship(
        sa_relationship_kwargs={"remote_side": "User.id"}
    )
    tokens: List["TokenAccess"] = Relationship(back_populates="user")
    supervised_areas: List["AreaSupervisor"] = Relationship(back_populates="supervisor")
    notifications: List["Notification"] = Relationship(back_populates="user")
