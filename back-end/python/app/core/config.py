# variáveis de ambiente e settings
# =====================================
# Configuracao completa para AWS (DynamoDB, S3, SES)

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ============================================
    # APLICACAO
    # ============================================
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_name: str = "Petrobras File Transfer"
    environment: str = "development"  # development, staging, production
    debug: bool = True
    
    # URL do frontend (para links em emails)
    frontend_url: str = "http://localhost:3000"

    # ============================================
    # AWS - CREDENCIAIS
    # ============================================
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    
    # ============================================
    # DYNAMODB - BANCO DE DADOS
    # ============================================
    # Endpoint local para desenvolvimento (DynamoDB Local)
    DYNAMODB_ENDPOINT_URL: Optional[str] = None  # Ex: http://localhost:8000
    
    # Prefixo das tabelas (permite multiplos ambientes na mesma conta)
    DYNAMODB_TABLE_PREFIX: str = "petrobras_transfer_"
    
    # Nomes das tabelas
    @property
    def DYNAMODB_TABLE_USERS(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}users"
    
    @property
    def DYNAMODB_TABLE_SHARES(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}shares"
    
    @property
    def DYNAMODB_TABLE_FILES(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}files"
    
    @property
    def DYNAMODB_TABLE_OTP(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}otp_codes"
    
    @property
    def DYNAMODB_TABLE_SESSIONS(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}sessions"
    
    @property
    def DYNAMODB_TABLE_AUDIT(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}audit_logs"
    
    @property
    def DYNAMODB_TABLE_NOTIFICATIONS(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}notifications"
    
    @property
    def DYNAMODB_TABLE_EMAILS(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}email_logs"

    # ============================================
    # S3 - ARMAZENAMENTO DE ARQUIVOS
    # ============================================
    S3_BUCKET_NAME: str = "petrobras-file-transfer"
    S3_BUCKET_REGION: str = "us-east-1"
    S3_PRESIGNED_URL_EXPIRATION: int = 3600  # 1 hora
    
    # Armazenamento: "local" (mock) ou "aws" (S3)
    storage_provider: str = "aws"

    # ============================================
    # SES - ENVIO DE EMAILS
    # ============================================
    SES_SENDER_EMAIL: str = "noreply@petrobras.com.br"
    SES_SENDER_NAME: str = "Petrobras File Transfer"
    SES_CONFIGURATION_SET: Optional[str] = None
    
    # Fallback para Resend (desenvolvimento)
    RESEND_API_KEY: Optional[str] = None
    EMAIL_PROVIDER: str = "ses"  # "ses" ou "resend"

    # ============================================
    # OTP - CODIGOS DE VERIFICACAO
    # ============================================
    otp_max_attempts: int = 5
    otp_cooldown_seconds: int = 30
    otp_validity_minutes: int = 3  # 3 minutos conforme frontend
    otp_code_length: int = 6

    # ============================================
    # SESSAO E AUTENTICACAO
    # ============================================
    # Auth provider: 'local' | 'entra'
    auth_mode: str = "entra"
    
    # JWT
    jwt_secret_key: str = "petrobras-file-transfer-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    
    # Duracao das sessoes
    session_duration_internal_hours: int = 8  # Usuarios internos/supervisores
    session_duration_external_hours: int = 3  # Usuarios externos

    # ============================================
    # COMPARTILHAMENTOS
    # ============================================
    # Opcoes de expiracao (em horas)
    share_expiration_options: list = [24, 48, 72]
    share_default_expiration_hours: int = 72
    
    # Tamanho maximo de arquivo (500MB)
    max_file_size_bytes: int = 500 * 1024 * 1024
    
    # Extensoes bloqueadas
    blocked_extensions: list = [
        ".exe", ".dll", ".bat", ".cmd", ".com",
        ".msi", ".scr", ".vbs", ".ps1", ".sh"
    ]

    # ============================================
    # MICROSOFT ENTRA ID
    # ============================================
    ENTRA_CLIENT_ID: Optional[str] = None
    ENTRA_TENANT_ID: Optional[str] = None
    ENTRA_CLIENT_SECRET: Optional[str] = None  # Para validacao server-side

    # ============================================
    # LOGS E MONITORAMENTO
    # ============================================
    CLOUDWATCH_LOG_GROUP: str = "/petrobras/file-transfer"
    CLOUDWATCH_METRICS_NAMESPACE: str = "Petrobras/FileTransfer"
    log_level: str = "INFO"

    # ============================================
    # SEGURANCA
    # ============================================
    # CORS
    cors_origins: list = [
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://transfer.petrobras.com.br"
    ]
    
    # Rate limiting
    rate_limit_requests_per_minute: int = 100

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
