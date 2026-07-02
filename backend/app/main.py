# ponto de entrada da aplicacao
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.init_db import init_db
from fastapi.responses import FileResponse
from pathlib import Path
import os

# Rotas existentes
from app.api.v1 import (
    routes_cav4_auth,
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
    routes_admin,
)

# ── Documentação OpenAPI ─────────────────────────────────────────────────────
# Em produção, /docs e /redoc devem ser desabilitados (docs_url=None).
# Controlado pela variável DEBUG: True = docs habilitado, False = desabilitado.
_docs_url    = "/docs"    if settings.debug else None
_redoc_url   = "/redoc"   if settings.debug else None
_openapi_url = "/openapi.json" if settings.debug else None

app = FastAPI(
    title="Solução de Compartilhamento Seguro de Arquivos Confidenciais - Petrobras",
    description="""
## Solução de Compartilhamento Seguro de Arquivos Confidenciais (CSAC)

API RESTful para compartilhamento seguro de arquivos da Petrobras com usuários externos.

### Funcionalidades Principais

- **Autenticação**: Login via CAv4 (OIDC/PKCE) ou credenciais locais (dev)
- **Upload de Arquivos**: Upload seguro com processamento MIP e armazenamento no S3
- **Compartilhamento**: Envio de arquivos para usuários externos com aprovação por supervisor
- **OTP**: Verificação por código único enviado por e-mail
- **Auditoria**: Log completo de todas as ações do sistema

### Fluxo de Compartilhamento

1. Usuário interno autentica via CAv4 (OIDC Authorization Code + PKCE)
2. Faz upload dos arquivos (processamento MIP automático)
3. Cria um compartilhamento com e-mail do destinatário externo
4. Supervisor recebe notificação e aprova ou rejeita a solicitação
5. Destinatário recebe e-mail com link e código OTP
6. Destinatário acessa o portal, valida OTP e baixa os arquivos

### Autenticação

- **CAv4 (OIDC)**: Fluxo corporativo padrão — Authorization Code + PKCE
- **Bearer Token (JWT)**: Emitido internamente após autenticação; válido para todas as rotas internas
- **Cookie de Sessão**: Alternativa ao Bearer token para aplicações web
- **OTP Externo**: Para usuários externos; válido apenas para o share aprovado
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
        {"name": "Auth", "description": "Autenticação unificada (login, logout, refresh)"},
        {"name": "Auth / CAv4", "description": "Autenticação corporativa via CAv4 (OIDC + PKCE)"},
        {"name": "Auth Internal", "description": "Autenticação local para desenvolvimento (email+senha)"},
        {"name": "Auth / External", "description": "Autenticação para usuários externos (OTP)"},
        {"name": "Users", "description": "Gerenciamento de usuários e perfil"},
        {"name": "Files", "description": "Upload e gerenciamento de arquivos"},
        {"name": "Shares", "description": "Compartilhamentos de arquivos"},
        {"name": "Supervisor", "description": "Aprovação e gestão de compartilhamentos"},
        {"name": "Notifications", "description": "Notificações do sistema"},
        {"name": "Audit", "description": "Logs de auditoria e métricas"},
        {"name": "Emails", "description": "Envio e histórico de e-mails"},
        {"name": "Download", "description": "Portal de download para usuários externos"},
        {"name": "Areas", "description": "Gerenciamento de áreas/departamentos"},
        {"name": "External", "description": "Endpoints para acesso externo"},
        {"name": "Admin", "description": "Painel administrativo global (requer is_admin=True)"},
    ],
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    openapi_url=_openapi_url,
    lifespan=None
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# ATENÇÃO: allow_origins=["*"] com allow_credentials=True é proibido pelo padrão
# CORS (browsers rejeitam). Em produção, definir CORS_ALLOW_ORIGINS no .env.
# Formato: "https://app.petrobras.com.br,https://outro.petrobras.com.br"
_raw_origins = os.getenv("CORS_ALLOW_ORIGINS", "")
_allow_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# Fallback seguro: em dev (DEBUG=true) aceita localhost; em produção exige config explícita.
if not _allow_origins:
    if settings.debug:
        _allow_origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8080",
        ]
    else:
        import logging as _logging
        _logging.getLogger(__name__).warning(
            "CORS_ALLOW_ORIGINS não configurado. Requisições cross-origin serão bloqueadas."
        )
        _allow_origins = []

# Ambientes Petrobras são sempre adicionados quando a variável não foi definida manualmente.
# Em produção, defina CORS_ALLOW_ORIGINS explicitamente para controle total.
_petrobras_origins = [
    "https://scac-dsv.petrobras.com.br",   # Desenvolvimento
    "https://scac-tst.petrobras.com.br",   # Teste
    "https://scac.petrobras.com.br",       # Produção
    # hmg (homologação) adicionado quando o ambiente subir
]
for _o in _petrobras_origins:
    if _o not in _allow_origins:
        _allow_origins.append(_o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Forwarded-For", "User-Agent"],
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

# Auth CAv4 (OIDC)
app.include_router(routes_cav4_auth.router, prefix=prefix_v1, tags=["Auth / CAv4"])

# Admin — Super Administrador Global
app.include_router(routes_admin.router, prefix=prefix_v1, tags=["Admin"])

# Rotas MOCK (sem AWS): integradas com core/aws_utils.py
@app.get("/mock/upload/{key}")
def mock_upload(key: str, expires_in: int = 3600):
    # Aqui você pode simular um upload (ex.: gravar metadados, copiar arquivo local)
    return {"status": "ok", "action": "upload", "key": key, "expires_in": expires_in}


@app.get("/mock/download/{key:path}")
def mock_download(key: str, filename: str = ""):
    """Serve arquivo do disco local (apenas quando STORAGE_PROVIDER=local)."""
    import urllib.parse
    if settings.storage_provider != "local":
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Endpoint disponivel apenas em modo local.")

    # key pode vir URL-encoded
    decoded_key = urllib.parse.unquote(key)
    # Normaliza separadores (Windows pode gravar \ em chaves antigas)
    decoded_key = decoded_key.replace("\\", "/")

    file_path = Path(decoded_key)
    if not file_path.is_absolute():
        file_path = Path("./storage") / decoded_key

    if not file_path.exists() or not file_path.is_file():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Arquivo nao encontrado: {decoded_key}")

    download_name = filename or file_path.name
    return FileResponse(path=str(file_path), filename=download_name)

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
