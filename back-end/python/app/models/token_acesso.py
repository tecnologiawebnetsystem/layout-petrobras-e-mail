from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional
from enum import Enum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.usuario import Usuario
    from app.models.share import Share


class TokenTipo(str, Enum):
    OTP = "otp"
    ACCESS = "access"


class TokenAcesso(SQLModel, table=True):
    __tablename__ = "token_acesso"

    id: Optional[int] = Field(default=None, primary_key=True)
    tipo: TokenTipo = Field(index=True)
    # Para ACCESS: armazenar valor url-safe aqui
    token: Optional[str] = Field(
        default=None, index=True, sa_column_kwargs={"unique": True})
    # Para OTP: armazenar hash do código de 6 dígitos aqui
    token_hash: Optional[str] = None

    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    share_id: int = Field(foreign_key="share.id", index=True)
    expira_em: datetime
    usado: bool = Field(default=False, index=True)
    criado_em: datetime = Field(default_factory=datetime.utcnow)

    # Número de tentativas de verificação (para rate limit / bloqueio)
    tentativas: int = Field(default=0, index=True)
    bloqueado_ate: Optional[datetime] = Field(default=None, index=True)

    # Relacionamentos
    usuario: Optional["Usuario"] = Relationship(back_populates="tokens")
    share: Optional["Share"] = Relationship(back_populates="token")
