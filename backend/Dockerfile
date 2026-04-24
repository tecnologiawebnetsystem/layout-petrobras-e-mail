# =============================================================
# STAGE 1: builder – compila wheels das dependências Python
# =============================================================
FROM registry.petrobras.com.br/imagens-devops/base/petro-python3.12-slim AS builder

WORKDIR /app

# gcc é necessário para compilar extensões C (ex.: psycopg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Configuração do pip para repositório interno Petrobras
COPY pip.ini /etc/pip.conf
COPY requirements.txt .

RUN pip install --upgrade pip \
    && pip wheel --no-cache-dir -r requirements.txt -w /wheels


# =============================================================
# STAGE 2: runtime – imagem final mínima
# =============================================================
FROM registry.petrobras.com.br/imagens-devops/base/petro-python3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    # libpq5: cliente PostgreSQL (mantido para compatibilidade futura)
    libpq5 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Instala dependências a partir dos wheels pré-compilados
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

# Copia o código da aplicação (sem .env, sem *.db – ver .dockerignore)
COPY . .

# Garante que o entrypoint seja executável
RUN sed -i 's/\r$//' entrypoint.sh
RUN chmod +x entrypoint.sh

# Garante que o diretório do banco SQLite exista
RUN mkdir -p /app/data

# ── Variáveis de ambiente padrão ─────────────────────────────────────────────
# No pipeline CDK Petrobras (ECS), as variáveis abaixo são sobrescritas
# automaticamente pela task definition com os valores do Parameter Store.
# Para simular esse comportamento fora do pipeline:
#   USE_AWS_CONFIG=true         → ativa aws_loader.py (boto3 em runtime)
#   CDK_APP_SERVICE_NAME=backend → nome do módulo CDK (padrão: backend)
#   APP_ENV=dsv|tst|trn|hmg|prd → define o sufixo do path SSM
# ─────────────────────────────────────────────────────────────────────────────
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_PORT=8080 \
    APP_ENV=dsv \
    CDK_APP_SERVICE_NAME=backend \
    USE_AWS_CONFIG=true \
    DATABASE_URL=sqlite:////app/data/dev.db \
    STORAGE_PROVIDER=local \
    AUTH_MODE=local \
    EMAIL_PROVIDER=dev \
    SEED_ON_STARTUP=true

# Volume para persistência do banco SQLite (monte EFS na AWS)
VOLUME ["/app/data"]

EXPOSE 8080

# Executa migrations (alembic upgrade head) e depois sobe o servidor
ENTRYPOINT ["./entrypoint.sh"]