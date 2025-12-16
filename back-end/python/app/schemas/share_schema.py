from sqlmodel import SQLModel
from datetime import datetime
from enum import Enum


class ShareStatus(str, Enum):
    ATIVO = "ativo"
    CONCLUIDO = "concluido"
    EXPIRADO = "expirado"
    CANCELADO = "cancelado"


class TokenConsumo(str, Enum):
    APOS_TODOS = "apos_todos"
    APOS_PRIMEIRO = "apos_primeiro"


class ShareCreate(SQLModel):
    area_id: int
    externo_email: str
    criado_por_id: int
    expira_em: datetime
    consumo_policy: TokenConsumo = TokenConsumo.APOS_TODOS
    arquivo_ids: list[int]


class ShareRead(SQLModel):
    id: int
    area_id: int
    externo_email: str
    criado_por_id: int
    status: ShareStatus
    consumo_policy: TokenConsumo
    expira_em: datetime
    criado_em: datetime
