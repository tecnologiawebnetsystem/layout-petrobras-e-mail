# variaveis de ambiente e settings

from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    email_provider: str = "dev"  # dev | ses

    # SMTP
    smtp_server: str | None = None
    smtp_port: int | None = None
    smtp_user: str | None = None
    smtp_pass: str | None = None
    mail_from: str | None = None

    # Banco - defina por .env; fallback: SQLite local
    database_url: str | None = None

    # Armazenamento: "local" (mock) ou "aws" (S3)
    storage_provider: str = "local"

    # OTP e cooldown
    otp_max_attempts: int = 5
    otp_cooldown_minutes: int = 15
    otp_validity_minutes: int = 5

    # ACCESS
    access_valid_hours: int = 24

    # Presigned TTL
    presigned_ttl_seconds_default: int = 300

    # Auth provider
    auth_mode: str = "local"  # 'local' | 'entra'

    # Microsoft Entra ID (Azure AD) - configurar para producao
    entra_tenant_id: str | None = None
    entra_client_id: str | None = None
    entra_client_secret: str | None = None
    entra_redirect_uri: str = "http://localhost:8000/api/v1/auth/internal/callback"
    entra_supervisor_group_ids: List[str] = []

    # AWS (preparado para prod; vazio no dev por enquanto)
    aws_region: str | None = None
    aws_s3_bucket: str | None = None
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None

    # Branding/Links
    app_name: str = "Compartilhamento Seguro de Arquivos"
    company_name: str = "Petrobras"
    support_email: str = "suporte@petrobras.com.br"
    frontend_external_portal_url: str = "http://localhost:3000"
    frontend_share_details_url: str = "http://localhost:3000/compartilhamentos/{share_id}"

    # Seguranca (dev default)
    jwt_secret_key: str = "dev-secret-change-me"

    class Config:
        env_file = ".env"


settings = Settings()

# Suporte a DATABASE_URL (padrao do Neon/Vercel) com fallback para SQLite
import os

_db_url = os.environ.get("DATABASE_URL") or settings.database_url
if not _db_url:
    _db_url = "sqlite:///./dev.db"

# Neon usa postgresql:// mas SQLAlchemy prefere postgresql+psycopg://
# psycopg3 usa o dialeto 'postgresql+psycopg'
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif _db_url.startswith("postgresql://") and "+psycopg" not in _db_url:
    _db_url = _db_url.replace("postgresql://", "postgresql+psycopg://", 1)

settings.database_url = _db_url
