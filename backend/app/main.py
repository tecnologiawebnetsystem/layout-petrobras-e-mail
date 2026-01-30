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
)

app = FastAPI(
    title="Petrobras File Transfer API",
    description="API RESTful para o sistema de transferencia segura de arquivos da Petrobras",
    version="2.0.0",
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

# Rotas de Login
# auth local e interno protegido (apenas enquanto AUTH_MODE=local)
app.include_router(routes_internal_auth.router, prefix=prefix_v1)

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


@app.get("/")
def health():
    return {"status": "ok", "storage": settings.storage_provider}
