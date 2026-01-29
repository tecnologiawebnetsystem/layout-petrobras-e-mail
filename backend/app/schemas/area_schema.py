
from sqlmodel import SQLModel
from datetime import datetime
from typing import Optional


class AreaCreate(SQLModel):
    name: str
    description: str
    prefixo_s3: str
    applicant_id: int
    expires_at: Optional[datetime] = None


class AreaRead(SQLModel):
    id: int
    name: str
    description: Optional[str]
    prefix_s3: str
    expires_at: Optional[datetime]
    created_at: datetime
    applicant_id: int
