from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, model_validator
from typing import List
import json as _json
from urllib.parse import quote_plus as _quote_plus


class Settings(BaseSettings):
    app_port: int = 8080
    email_provider: str = "smtp_internal"  # ses | smtp_internal

    # Remetente dos e-mails (obrigatório para ses e smtp_internal)
    mail_from: str | None = None

    # SMTP interno Petrobras (smtp_internal provider)
    # Servidor: smtp.petrobras.com.br — porta 25 — sem autenticação — TLS via STARTTLS
    # mail_route: valor do header X-Route para desvio em não-produção.
    #   Ex: TESTE_TIC → redireciona para cc-test_apps_tic@petrobras.com.br
    #   Vazio em produção → entrega normal ao destinatário real.
    # mail_protection: valor do header X-Protecao para criptografia.
    #   Ex: CONFIDENCIAL → Exchange aplica criptografia MIP automaticamente.
    mail_route: str | None = None
    mail_protection: str | None = None

    # Banco - defina por .env; fallback: SQLite local
    database_url: str | None = None

    # Credenciais BD — injetadas pelo ECS Task Definition ou definidas no .env
    # ECS: Task Definition injeta a partir das secrets do Secrets Manager
    # Local: definir todas no .env
    rds_aurora_postgres_host:     str | None = None 
    rds_aurora_postgres_username: str | None = None
    rds_aurora_postgres_password: str | None = None
    rds_aurora_postgres_dbname:   str | None = None
    db_schema: str = "public"

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

    # Microsoft Entra ID (Azure AD)
    # Desenvolvimento local: preencher no .env
    # Produção/homologação: carregados da secret via ponteiro SSM:
    #   /APP/backend-<env>/SECRETS_MANAGER/backend_<env>_secret
    #     → { "ENTRA_TENANT_ID": ..., "ENTRA_CLIENT_ID": ...,
    #         "ENTRA_CLIENT_SECRET": ..., "ENTRA_APP_NAME": ...,
    #         "ENTRA_REDIRECT_URI": ... }
    entra_app_name: str | None = None
    entra_tenant_id: str | None = None
    entra_client_id: str | None = None
    entra_client_secret: str | None = None
    entra_redirect_uri: str = "http://localhost:3000/auth/entra-callback"
    entra_supervisor_group_ids: List[str] = []

    # Grupo obrigatorio para acesso ao sistema
    # ENTRA_REQUIRED_GROUP_ID: Object ID (UUID) do grupo no Entra ID
    # ENTRA_REQUIRED_GROUP_NAME: nome human-readable (para logs e mensagens de erro)
    # ENTRA_GROUP_SYNC_STRATEGY: "deactivate" (desativa user.status=False) | "block_login" (bloqueia sem desativar)
    entra_required_group_id: str = "ccc28110-a7ad-45df-94ca-439cf7ff0c55"
    entra_required_group_name: str = "GN_CLOUD_AWS_SCAC_USERS"
    entra_group_sync_strategy: str = "deactivate"  # "deactivate" | "block_login"

    @field_validator("entra_supervisor_group_ids", mode="before")
    @classmethod
    def _parse_group_ids(cls, v):
        """Aceita tanto lista Python quanto string JSON vinda do Parameter Store."""
        if isinstance(v, str):
            v = v.strip()
            if not v or v == "[]":
                return []
            try:
                parsed = _json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except _json.JSONDecodeError:
                pass
            # fallback: string separada por vírgulas
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @model_validator(mode="after")
    def _assemble_database_url(self) -> "Settings":
        """Monta DATABASE_URL completa em 3 cenários:

        Caso 1 – DATABASE_URL já é uma URL completa (contém "://"):
            usa diretamente; credenciais já embutidas.

        Caso 2 – DATABASE_URL é apenas o host (sem "://"):
            monta a URL com rds_aurora_postgres_username/password/dbname.
            Compatibilidade: Parameter Store costumava fornecer só o host.

        Caso 3 – DATABASE_URL ausente, mas rds_aurora_postgres_host presente:
            monta a URL a partir das 4 variáveis RDS.
            Padrão ECS atual: Task Definition injeta cada variável separadamente.
        """
        url = self.database_url or ""

        # Caso 1: URL já completa — nada a fazer
        if url and "://" in url:
            return self

        # Casos 2 e 3: determinar host
        host   = url if url else (self.rds_aurora_postgres_host or "")
        user   = self.rds_aurora_postgres_username or ""
        pwd    = self.rds_aurora_postgres_password or ""
        dbname = self.rds_aurora_postgres_dbname   or ""

        if host and user and pwd and dbname:
            assembled = (
                f"postgresql+psycopg://{_quote_plus(user)}:{_quote_plus(pwd)}"
                f"@{host}/{dbname}"
            )
            if self.db_schema:
                assembled += f"?options=-csearch_path%3D{self.db_schema}"
            self.database_url = assembled

        return self

    # Chave de assinatura dos JWTs (obrigatória; gerada automaticamente em dev)
    jwt_secret: str = "dev-secret-local-insecure-change-in-prod"

    # AWS (preparado para prod; vazio no dev por enquanto)
    aws_region: str | None = None
    aws_s3_bucket: str | None = None
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_session_token: str | None = None

    # Branding/Links
    app_name: str = "Compartilhamento Seguro de Arquivos"
    company_name: str = "Petrobras"
    support_email: str = "suporte@petrobras.com.br"
    frontend_external_portal_url: str = "http://localhost:3000"
    frontend_share_details_url: str = "http://localhost:3000/compartilhamentos"
    frontend_supervisor_url: str = "http://localhost:3000/supervisor"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()

# Injeta credenciais AWS em os.environ para que o boto3 as encontre via
# cadeia de credenciais padrão (os.environ tem prioridade sobre ~/.aws).
# Só aplica quando os valores estão preenchidos (dev local com .env).
# Em produção (ECS), essas variáveis ficam vazias e a IAM Role é usada.
import os

if settings.aws_access_key_id:
    os.environ.setdefault("AWS_ACCESS_KEY_ID", settings.aws_access_key_id)
if settings.aws_secret_access_key:
    os.environ.setdefault("AWS_SECRET_ACCESS_KEY", settings.aws_secret_access_key)
if settings.aws_session_token:
    os.environ.setdefault("AWS_SESSION_TOKEN", settings.aws_session_token)
if settings.aws_region:
    os.environ.setdefault("AWS_DEFAULT_REGION", settings.aws_region)

# Ajuste final do driver (psycopg3) e fallback dev local.
# O validator _assemble_database_url já montou a URL completa quando possível.
_db_url = settings.database_url or "scac-backend-dsv.petrobras.com.br"
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif _db_url.startswith("postgresql://") and "+psycopg" not in _db_url:
    _db_url = _db_url.replace("postgresql://", "postgresql+psycopg://", 1)

settings.database_url = _db_url
