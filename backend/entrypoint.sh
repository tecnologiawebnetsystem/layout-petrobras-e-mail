#!/bin/sh
# entrypoint.sh – Carrega config AWS, executa migrations, seed opcional e inicia o servidor
#
# Variáveis de controle (definir na ECS Task Definition / docker run -e):
#
#   No pipeline CDK Petrobras as variáveis já chegam injetadas pela task
#   definition — USE_AWS_CONFIG NÃO é necessário no fluxo padrão.
#
#   USE_AWS_CONFIG=true        → ativa aws_loader (boto3 em runtime)
#                                útil apenas fora do pipeline CDK
#   CDK_APP_SERVICE_NAME=...   → nome do módulo CDK (padrão: backend)
#   APP_ENV=dsv|tst|trn|hmg|prd → sufixo do path SSM (padrão: dsv)
#   SEED_ON_STARTUP=true       → popula banco com dados dev (somente DSV)
set -e

echo "[entrypoint] Aplicando migrations do Alembic..."
alembic upgrade head

# Seed de dados de desenvolvimento.
# Ative apenas nos ambientes que precisam de dados iniciais:
#   SEED_ON_STARTUP=true  (via ECS Task Definition ou docker run -e)
# Em produção deixe a variável ausente ou vazia.
if [ "${SEED_ON_STARTUP}" = "true" ]; then
    echo "[entrypoint] SEED_ON_STARTUP=true – populando banco com dados dev..."
    python -m scripts_data.seed_dev
    echo "[entrypoint] Seed concluído."
fi

echo "[entrypoint] Iniciando uvicorn na porta ${APP_PORT:-8080}..."
exec uvicorn app.main:app \
    --host "${APP_HOST:-0.0.0.0}" \
    --port "${APP_PORT:-8080}"
