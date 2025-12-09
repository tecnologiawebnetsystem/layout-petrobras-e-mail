# Estrutura do Backend Python - FastAPI

## Arquitetura Recomendada

\`\`\`
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Configurações e variáveis de ambiente
│   ├── dependencies.py         # Dependency Injection
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py       # Router principal v1
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── auth.py
│   │           ├── users.py
│   │           ├── files.py
│   │           ├── supervisor.py
│   │           ├── download.py
│   │           ├── notifications.py
│   │           ├── audit.py
│   │           └── metrics.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py             # Pydantic models
│   │   ├── file.py
│   │   ├── notification.py
│   │   ├── audit_log.py
│   │   ├── session.py
│   │   └── expiration_log.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── requests/
│   │   │   ├── auth.py
│   │   │   ├── file.py
│   │   │   └── supervisor.py
│   │   └── responses/
│   │       ├── common.py
│   │       ├── auth.py
│   │       ├── file.py
│   │       └── metrics.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── file_service.py
│   │   ├── supervisor_service.py
│   │   ├── download_service.py
│   │   ├── notification_service.py
│   │   ├── audit_service.py
│   │   ├── email_service.py
│   │   └── storage_service.py
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user_repository.py
│   │   ├── file_repository.py
│   │   ├── notification_repository.py
│   │   ├── audit_repository.py
│   │   ├── session_repository.py
│   │   └── expiration_log_repository.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, hashing, tokens
│   │   ├── exceptions.py       # Custom exceptions
│   │   └── middleware.py       # Custom middleware
│   │
│   └── utils/
│       ├── __init__.py
│       ├── dynamodb.py         # DynamoDB client
│       ├── s3.py               # S3 client
│       ├── ses.py              # SES client
│       ├── validators.py       # Validações customizadas
│       └── helpers.py          # Funções auxiliares
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_files.py
│   └── test_supervisor.py
│
├── scripts/
│   ├── seed_data.py            # Popular dados de teste
│   └── migrate.py              # Migrações
│
├── .env.example
├── .gitignore
├── requirements.txt
├── requirements-dev.txt
├── Dockerfile
├── docker-compose.yml
├── serverless.yml              # Para deploy AWS Lambda
└── README.md
\`\`\`

---

## Dependências Principais (requirements.txt)

\`\`\`txt
# Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# AWS SDK
boto3==1.34.24
botocore==1.34.24

# Autenticação e Segurança
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0

# Validação
pydantic==2.5.3
pydantic-settings==2.1.0
email-validator==2.1.0

# Utilitários
python-dateutil==2.8.2
pytz==2024.1

# CORS
fastapi-cors==0.0.6

# Logging
structlog==24.1.0

# Rate Limiting
slowapi==0.1.9

# Testing (dev)
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0
\`\`\`

---

## Exemplo de Implementação

### 1. main.py

\`\`\`python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.exceptions import setup_exception_handlers
from app.config import settings

app = FastAPI(
    title="Petrobras File Transfer API",
    version="1.0.0",
    description="API para Sistema de Transferência Segura de Arquivos"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
setup_exception_handlers(app)

# Include routers
app.include_router(api_router, prefix="/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
\`\`\`

### 2. config.py

\`\`\`python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API
    API_V1_STR: str = "/v1"
    PROJECT_NAME: str = "Petrobras File Transfer"
    
    # AWS
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    
    # DynamoDB Tables
    USERS_TABLE: str = "petrobras-users"
    FILES_TABLE: str = "petrobras-files"
    AUDIT_LOGS_TABLE: str = "petrobras-audit-logs"
    NOTIFICATIONS_TABLE: str = "petrobras-notifications"
    SESSIONS_TABLE: str = "petrobras-sessions"
    EXPIRATION_LOGS_TABLE: str = "petrobras-expiration-logs"
    
    # S3
    S3_BUCKET: str = "petrobras-file-transfer-files-production"
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Email
    SES_SENDER_EMAIL: str = "noreply@petrobras-transfer.com.br"
    FRONTEND_URL: str = "https://petrobras-transfer.com.br"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://petrobras-transfer.com.br"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
\`\`\`

### 3. auth_service.py (exemplo)

\`\`\`python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings
from app.repositories.user_repository import UserRepository
from app.core.exceptions import InvalidCredentialsException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)
    
    def create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    async def authenticate_user(self, email: str, password: str):
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise InvalidCredentialsException()
        if not self.verify_password(password, user.password):
            raise InvalidCredentialsException()
        return user
\`\`\`

---

## Deploy na AWS Lambda

### serverless.yml

\`\`\`yaml
service: petrobras-api

provider:
  name: aws
  runtime: python3.11
  region: us-east-1
  stage: ${opt:stage, 'production'}
  environment:
    USERS_TABLE: petrobras-users-${self:provider.stage}
    FILES_TABLE: petrobras-files-${self:provider.stage}
    S3_BUCKET: petrobras-files-${self:provider.stage}
  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:*
      Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/*"
    - Effect: Allow
      Action:
        - s3:*
      Resource: "arn:aws:s3:::${self:provider.environment.S3_BUCKET}/*"

functions:
  api:
    handler: app.main.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true

plugins:
  - serverless-python-requirements
  - serverless-offline
\`\`\`

Este guia fornece toda a estrutura necessária para desenvolver o backend Python que se integra perfeitamente com o frontend Next.js já implementado.
