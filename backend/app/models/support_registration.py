"""
Modelo para registro de cadastros de usuarios externos pelo suporte.
"""

from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, UTC
from typing import Optional, TYPE_CHECKING
from enum import Enum

if TYPE_CHECKING:
    from app.models.user import User


class SupportRegistrationStatus(str, Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"
    CANCELADO = "cancelado"


class SupportRegistration(SQLModel, table=True):
    """
    Registra todos os cadastros de usuarios externos realizados pelo time de suporte.
    """
    __tablename__ = "support_registration"

    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Numero da solicitacao (ServiceNow ou outro sistema)
    request_number: str = Field(max_length=50, index=True)
    
    # Email do solicitante interno (quem pediu o cadastro)
    requester_email: str = Field(max_length=255, index=True)
    
    # Email do usuario externo que foi cadastrado
    external_user_email: str = Field(max_length=255, index=True)
    
    # ID do usuario externo criado (referencia a tabela user)
    external_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    # ID do atendente de suporte que realizou o cadastro
    registered_by_id: int = Field(foreign_key="user.id", index=True)
    
    # Nome do atendente (desnormalizado para historico)
    registered_by_name: str = Field(max_length=255)
    
    # Status do cadastro
    status: SupportRegistrationStatus = Field(
        default=SupportRegistrationStatus.ATIVO,
        index=True
    )
    
    # Observacoes adicionais
    notes: Optional[str] = Field(default=None)
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), index=True)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Se foi reativacao (usuario ja existia mas estava inativo)
    is_reactivation: bool = Field(default=False)

    # Relacionamentos
    external_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[SupportRegistration.external_user_id]"}
    )
    registered_by: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[SupportRegistration.registered_by_id]"}
    )
