from sqlmodel import SQLModel
from datetime import datetime

# Entrada para emissão de novo token (POST /auth/token)


class TokenCreate(SQLModel):
    share_id: int
    usuario_externo_email: str
    validade_horas: int = 24  # padrão; pode customizar por fluxo

# Resposta ao emitir ACCESS


class TokenRead(SQLModel):
    token: str
    expira_em: datetime

# Saída detalhada (para auditoria/admin)


class TokenReadDetail(SQLModel):
    id: int
    token: str
    usuario_id: int
    share_id: int
    expira_em: datetime
    usado: bool
    criado_em: datetime
