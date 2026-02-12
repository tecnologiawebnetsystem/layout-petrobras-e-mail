"""
Modelo para tokens de sessao persistidos (refresh e reset).
Substitui o armazenamento em memoria (_refresh_tokens / _reset_tokens).
"""
from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
from enum import Enum


class TokenType(str, Enum):
    REFRESH = "refresh"
    RESET = "reset"


class SessionToken(SQLModel, table=True):
    __tablename__ = "session_token"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    token_hash: str = Field(index=True)
    token_type: TokenType = Field(index=True)
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    used: bool = Field(default=False)
    revoked: bool = Field(default=False)
    ip_address: Optional[str] = Field(default=None, max_length=45)
    user_agent: Optional[str] = Field(default=None, max_length=500)
    email: Optional[str] = Field(default=None, max_length=255)
