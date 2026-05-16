from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
import hashlib
import secrets


class CredentialLocal(SQLModel, table=True):
    __tablename__ = "credential_local"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    password_hash: str
    salt: str = Field(default_factory=lambda: secrets.token_hex(16))
    failed_attempts: int = Field(default=0, index=True)
    blocked_until: datetime | None = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime | None = Field(default=None)

    def _hash_password(self, password: str, salt: str) -> str:
        """Gera hash da senha com salt usando SHA-256."""
        salted = f"{salt}{password}".encode('utf-8')
        return hashlib.sha256(salted).hexdigest()

    def set_password(self, password: str) -> None:
        """Define uma nova senha."""
        self.salt = secrets.token_hex(16)
        self.password_hash = self._hash_password(password, self.salt)
        self.updated_at = datetime.now(UTC)

    def verify_password(self, password: str) -> bool:
        """Verifica se a senha esta correta."""
        # Verifica se esta bloqueado (stored as naive in SQLite, compare via .replace)
        if self.blocked_until and self.blocked_until.replace(tzinfo=UTC) > datetime.now(UTC):
            return False
        
        expected_hash = self._hash_password(password, self.salt)
        is_valid = secrets.compare_digest(self.password_hash, expected_hash)
        
        if not is_valid:
            self.failed_attempts += 1
            # Bloqueia apos 5 tentativas por 15 minutos (naive UTC para consistência com SQLite)
            if self.failed_attempts >= 5:
                from datetime import timedelta
                self.blocked_until = datetime.now(UTC) + timedelta(minutes=15)
        else:
            # Reset em caso de sucesso
            self.failed_attempts = 0
            self.blocked_until = None
        
        return is_valid
