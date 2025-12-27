from sqlmodel import SQLModel
from datetime import datetime
from typing import Optional


class FileCreate(SQLModel):
    area_id: int
    name: str
    key_s3: str
    size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    checksum: Optional[str] = None
    upload_by_id: Optional[int] = None
    expira_at: Optional[datetime] = None


class FileRead(SQLModel):
    id: int
    area_id: int
    name: str
    key_s3: str
    size_bytes: Optional[int]
    mime_type: Optional[str]
    checksum: Optional[str]
    upload_by_id: Optional[int]
    date_upload: datetime
    expira_at: Optional[datetime]
    created_at: datetime
