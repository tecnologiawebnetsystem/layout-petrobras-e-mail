
from sqlmodel import SQLModel
from datetime import datetime
from app.models.share import ShareStatus, TokenConsumption


class ShareCreate(SQLModel):
    area_id: int | None
    external_email: str
    created_by_id: int
    expiration_hours: int = 168
    name: str | None = None
    description: str | None = None
    consumption_policy: TokenConsumption = TokenConsumption.AFTER_ALL
    file_ids: list[int] = []


class ShareRead(SQLModel):
    id: int
    area_id: int | None
    external_email: str
    created_by_id: int
    status: ShareStatus
    consumption_policy: TokenConsumption
    expires_at: datetime | None       # None enquanto aguarda aprovação do supervisor
    created_at: datetime
