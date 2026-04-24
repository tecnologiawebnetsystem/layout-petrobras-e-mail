# ponto de entrada da aplicacao
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.init_db import init_db

# Rotas existentes
from app.api.v1 import (
    routes_external,
    routes_external_auth,
    routes_files,
    routes_internal_auth,
    routes_users,
    routes_areas,
    routes_shares,
    routes_supervisor,
    routes_audit,
    routes_notifications,
    routes_download,
    routes_auth,
    routes_emails,
    routes_diagnostico,
)

app = FastAPI(
    title="Petrobras File Transfer API",
    description="""
## Sistema de Transferencia Segura de Arquivos

API RESTful para compartilhamento seguro de arquivos da Petrobras com usuarios externos.

### Funcionalidades Principais

- **Autenticacao**: Login via Entra ID (Microsoft) ou credenciais locais
- **Upload de Arquivos**: Upload seguro com armazenamento no S3
- **Compartilhamento**: Envio de arquivos para usuarios externos com aprovacao
- **OTP**: Verificacao por codigo unico enviado por email
- **Auditoria**: Log completo de todas as acoes do sistema

### Fluxo de Compartilhamento

1. Usuario interno faz upload dos arquivos
2. Cria um compartilhamento com email do destinatario externo
3. Supervisor aprova ou rejeita a solicitacao
4. Destinatario recebe email com link e codigo OTP
5. Destinatario acessa o portal, valida OTP e baixa os arquivos

### Autenticacao

- **Bearer Token (JWT)**: Para usuarios internos autenticados
- **Cookie de Sessao**: Alternativa ao Bearer token para aplicacoes web
- **Sessao Externa**: Para usuarios externos apos validacao do OTP
    """,
    version="2.0.0",
    contact={
        "name": "Suporte Petrobras",
        "email": "suporte@petrobras.com.br",
    },
    license_info={
        "name": "Proprietary",
    },
    openapi_tags=[
        {"name": "Auth", "description": "Autenticacao unificada (login, logout, refresh, reset password)"},
        {"name": "Auth Internal", "description": "Autenticacao para usuarios internos (Entra ID / Local)"},
        {"name": "Auth / External", "description": "Autenticacao para usuarios externos (OTP)"},
        {"name": "Users", "description": "Gerenciamento de usuarios e perfil"},
        {"name": "Files", "description": "Upload e gerenciamento de arquivos"},
        {"name": "Shares", "description": "Compartilhamentos de arquivos"},
        {"name": "Supervisor", "description": "Aprovacao e gestao de compartilhamentos"},
        {"name": "Notifications", "description": "Notificacoes do sistema"},
        {"name": "Audit", "description": "Logs de auditoria e metricas"},
        {"name": "Emails", "description": "Envio e historico de emails"},
        {"name": "Download", "description": "Portal de download para usuarios externos"},
        {"name": "Areas", "description": "Gerenciamento de areas/departamentos"},
        {"name": "External", "description": "Endpoints para acesso externo"},
    ],
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=None
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em producao, especificar origens permitidas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


# Middleware simples de logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"[REQ] {request.method} {request.url.path} from {request.client.host}")
    response = await call_next(request)
    print(f"[RES] {response.status_code} {request.url.path}")
    return response


# Rotas de versionamento (podemos mudar a abordagem de acordo com o projeto)
prefix_v1 = "/api/v1"

# Rotas principais
app.include_router(routes_users.router, prefix=prefix_v1, tags=["Users"])
app.include_router(routes_areas.router, prefix=prefix_v1, tags=["Areas"])
app.include_router(routes_files.router, prefix=prefix_v1, tags=["Files"])
app.include_router(routes_shares.router, prefix=prefix_v1, tags=["Shares"])
app.include_router(routes_supervisor.router, prefix=prefix_v1, tags=["Supervisor"])
app.include_router(routes_audit.router, prefix=prefix_v1, tags=["Audit"])
app.include_router(routes_notifications.router, prefix=prefix_v1, tags=["Notifications"])
app.include_router(routes_download.router, prefix=prefix_v1, tags=["Download"])

# Rotas de autenticacao externa
app.include_router(routes_external.router, prefix=prefix_v1, tags=["External"])
app.include_router(routes_external_auth.router, prefix=prefix_v1, tags=["Auth / External"])

# Rotas de autenticacao unificadas
app.include_router(routes_auth.router, prefix=prefix_v1, tags=["Auth"])

# Rotas de emails
app.include_router(routes_emails.router, prefix=prefix_v1, tags=["Emails"])

# Rotas de Login (legado - auth local e interno)
app.include_router(routes_internal_auth.router, prefix=prefix_v1)

# Diagnóstico de variáveis de ambiente
app.include_router(routes_diagnostico.router, prefix=prefix_v1)

# Rotas MOCK (sem AWS): integradas com core/aws_utils.py
@app.get("/mock/upload/{key}")
def mock_upload(key: str, expires_in: int = 3600):
    # Aqui você pode simular um upload (ex.: gravar metadados, copiar arquivo local)
    return {"status": "ok", "action": "upload", "key": key, "expires_in": expires_in}


@app.get("/mock/download/{key}")
def mock_download(key: str, expires_in: int = 3600):
    # Aqui você pode simular retorno de conteúdo ou apenas metadados
    return {"status": "ok", "action": "download", "key": key, "expires_in": expires_in}

@app.get(prefix_v1)
def version():
    return {"version": "001", "sytem": "active"}

@app.get(f"{prefix_v1}/status")
def version():
    return {"version": "001", "sytem": "active"}


@app.get("/api")
def health():
    return {"status": "ok", "storage": settings.storage_provider}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        port=8080,
        reload=True,
        lifespan="off",
    )
