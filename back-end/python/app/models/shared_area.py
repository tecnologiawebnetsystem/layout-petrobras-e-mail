from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from typing import Optional

class SharedArea(SQLModel, table=True):
    __tablename__ = "shared_areas"
    
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str | None = None
    sender_id: int = Field(foreign_key="users.id")
    recipient_email: str
    status: str = Field(default="pending")  # pending, approved, rejected, cancelled
    
    # ... existing fields ...
    
    cancelled_by: str | None = None
    cancellation_date: datetime | None = None
    cancellation_reason: str | None = None
