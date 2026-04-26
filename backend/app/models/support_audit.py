"""
Modelo para auditoria de acoes do time de suporte.
"""

from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, UTC
from typing import Optional, TYPE_CHECKING
from enum import Enum

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.support_registration import SupportRegistration


class SupportAction(str, Enum):
    CADASTRO = "CADASTRO"
    REATIVACAO = "REATIVACAO"
    INATIVACAO = "INATIVACAO"
    ALTERACAO = "ALTERACAO"
    CONSULTA = "CONSULTA"


class SupportAudit(SQLModel, table=True):
    """
    Registra todas as acoes realizadas pelo time de suporte para fins de auditoria.
    """
    __tablename__ = "support_audit"

    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Tipo de acao realizada
    action: SupportAction = Field(index=True)
    
    # Descricao da acao
    description: str = Field(max_length=500)
    
    # Detalhes adicionais (JSON serializado)
    details: Optional[str] = Field(default=None)
    
    # ID do atendente que realizou a acao
    support_user_id: int = Field(foreign_key="user.id", index=True)
    
    # ID do registro de suporte relacionado (se aplicavel)
    registration_id: Optional[int] = Field(
        default=None, 
        foreign_key="support_registration.id",
        index=True
    )
    
    # ID do usuario afetado pela acao (se aplicavel)
    affected_user_id: Optional[int] = Field(
        default=None,
        foreign_key="user.id",
        index=True
    )
    
    # Informacoes de rastreamento
    ip_address: Optional[str] = Field(default=None, max_length=45)
    user_agent: Optional[str] = Field(default=None, max_length=500)
    
    # Timestamp
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), index=True)

    # Relacionamentos
    support_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[SupportAudit.support_user_id]"}
    )
    registration: Optional["SupportRegistration"] = Relationship()
    affected_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[SupportAudit.affected_user_id]"}
    )
