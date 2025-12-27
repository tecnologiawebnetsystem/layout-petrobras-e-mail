from sqlmodel import SQLModel
from datetime import datetime

# Entrada para emissão de novo token (POST /auth/token)
class TokenCreate(SQLModel):
    share_id: int
    external_user_email: str
    validity_hours: int = 24  # padrão; pode customizar por fluxo

# Resposta ao emitir ACCESS
class TokenRead(SQLModel):
    token: str
    expira_at: datetime

# Saída detalhada (para auditoria/admin)
class TokenReadDetail(SQLModel):
    id: int
    token: str
    user_id: int
    share_id: int
    expira_at: datetime
    used: bool
    created_at: datetime
