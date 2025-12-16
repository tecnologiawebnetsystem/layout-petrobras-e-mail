# ponto de entrada da aplicação
from fastapi import FastAPI, Request
from app.core.config import settings
from app.db.init_db import init_db

# Rotas existentes
from app.api.v1 import routes_usuarios, routes_areas, routes_arquivos, routes_shares, routes_externo_download, routes_opt

app = FastAPI(title="Compartilhamento Seguro de Arquivos (dev)")


@app.on_event("startup")
def on_startup():
    init_db()

# Middleware simples de logging


@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(
        f"[REQ] {request.method} {request.url.path} from {request.client.host}")
    response = await call_next(request)
    print(f"[RES] {response.status_code} {request.url.path}")
    return response

# Rotas de versionamento (podemos mudar a abordagem de acordo com o projeto)
prefix_v1 = "/api/v1"

# Rotas principais
app.include_router(routes_usuarios.router, prefix=prefix_v1, tags=["Usuarios"])
app.include_router(routes_areas.router, prefix=prefix_v1, tags=["Areas"])
app.include_router(routes_arquivos.router, prefix=prefix_v1, tags=["Arquivos"])
app.include_router(routes_shares.router, prefix=prefix_v1, tags=["Shares"])
app.include_router(routes_externo_download.router, prefix=prefix_v1, tags=["Externo"])
app.include_router(routes_opt.router, prefix=prefix_v1, tags=["Auth / Código"])

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
    return {"version":"001", "sytem": "active"}

@app.get("/")
def health():
    return {"status": "ok", "storage": settings.storage_provider}
