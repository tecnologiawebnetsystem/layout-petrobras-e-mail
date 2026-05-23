"""
Verifica as tabelas existentes no schema PostgreSQL configurado.
Lê as credenciais do .env (local) ou de os.environ (AWS/ECS).
Nenhuma credencial hardcoded.
"""
import os
from pathlib import Path
from urllib.parse import quote_plus

import psycopg

# Carregar .env da raiz do backend (não-op se já estiver em os.environ)
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_path, override=False)

# Montar URL: usa DATABASE_URL completa ou monta a partir das partes
url = os.environ.get("DATABASE_URL", "")
if "://" not in url:
    host   = url
    user   = os.environ.get("RDS_AURORA_POSTGRES_USERNAME", "")
    pwd    = os.environ.get("RDS_AURORA_POSTGRES_PASSWORD", "")
    dbname = os.environ.get("RDS_AURORA_POSTGRES_DBNAME", "")
    schema = os.environ.get("DB_SCHEMA", "")
    if not (host and user and pwd and dbname):
        print("Erro: DATABASE_URL (host) ou RDS_AURORA_POSTGRES_* não configurados.")
        raise SystemExit(1)
    url = f"postgresql://{quote_plus(user)}:{quote_plus(pwd)}@{host}/{dbname}"
    if schema:
        url += f"?options=-csearch_path%3D{schema}"
else:
    # Normalizar prefixo SQLAlchemy para psycopg3
    url = url.replace("postgresql+psycopg2://", "postgresql://", 1)
    url = url.replace("postgresql+psycopg://", "postgresql://", 1)

schema_name = os.environ.get("DB_SCHEMA", "public")

conn = psycopg.connect(url, connect_timeout=10)
with conn.cursor() as cur:
    cur.execute(
        "SELECT tablename FROM pg_tables WHERE schemaname = %s ORDER BY tablename;",
        (schema_name,),
    )
    tables = [r[0] for r in cur.fetchall()]
    print(f"{len(tables)} tabelas no schema '{schema_name}':")
    for t in tables:
        print(" -", t)
conn.close()
