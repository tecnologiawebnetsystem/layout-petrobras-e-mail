
from sqlmodel import SQLModel
from datetime import datetime
from typing import Optional


class AreaCreate(SQLModel):
    nome_area: str
    descricao: str
    prefixo_s3: str
    solicitante_id: int
    expira_em: Optional[datetime] = None


class AreaRead(SQLModel):
    id: int
    nome_area: str
    descricao: str
    prefixo_s3: str
    expira_em: Optional[datetime]
    criado_em: datetime
    solicitante_id: int
