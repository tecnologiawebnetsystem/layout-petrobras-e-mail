
from sqlmodel import SQLModel
from datetime import datetime
from app.models.share import ShareStatus, TokenConsumption


class ShareCreate(SQLModel):
    area_id: int | None
    external_email: str
    created_by_id: int
    expires_at: datetime
    consumption_policy: TokenConsumption = TokenConsumption.AFTER_ALL
    file_ids: list[int] = []


class ShareRead(SQLModel):
    id: int
    area_id: int | None
    external_email: str
    created_by_id: int
    status: ShareStatus
    consumption_policy: TokenConsumption
    expires_at: datetime
    created_at: datetime
