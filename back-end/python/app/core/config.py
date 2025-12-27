# variáveis de ambiente e settings

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # Banco — defina por .env; fallback: SQLite local
    database_url: str | None = None

    # Armazenamento: "local" (mock) ou "aws" (S3)
    storage_provider: str = "local"

    # OTP e cooldown
    otp_max_attempts: int = 5
    otp_cooldown_minutes: int = 15
    otp_validity_minutes: int = 10

    # ACCESS
    access_valid_hours: int = 24

    # Presigned TTL
    presigned_ttl_seconds_default: int = 300

    
    # Auth provider
    auth_mode: str = "local"  # 'local' | 'entra'


    # AWS (preparado para prod; vazio no dev por enquanto)
    aws_region: str | None = None
    aws_s3_bucket: str | None = None
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None

    # Segurança (dev default)
    jwt_secret_key: str = "dev-secret-change-me"

    class Config:
        env_file = ".env"


settings = Settings()

# Fallback para dev local (SQLite)
if not settings.database_url:
    settings.database_url = "sqlite:///./dev.db"
