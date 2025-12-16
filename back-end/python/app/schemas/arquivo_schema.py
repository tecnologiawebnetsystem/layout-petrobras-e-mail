
from sqlmodel import SQLModel
from datetime import datetime
from typing import Optional


class ArquivoCreate(SQLModel):
    area_id: int
    nome_arquivo: str
    chave_s3: str
    tamanho_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    checksum: Optional[str] = None
    upload_por_id: Optional[int] = None
    expira_em: Optional[datetime] = None


class ArquivoRead(SQLModel):
    id: int
    area_id: int
    nome_arquivo: str
    chave_s3: str
    tamanho_bytes: Optional[int]
    mime_type: Optional[str]
    checksum: Optional[str]
    upload_por_id: Optional[int]
    data_upload: datetime
    expira_em: Optional[datetime]
    criado_em: datetime
