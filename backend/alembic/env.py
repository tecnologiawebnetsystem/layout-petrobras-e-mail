from __future__ import annotations

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Adicionar o diretorio raiz do backend ao sys.path para importar os models
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Nota: NÃO chamar load_dotenv() aqui.
# Pydantic BaseSettings já lê o .env nativo via env_file=".env" (config.py).
# Chamar load_dotenv() colocaria DATABASE_URL (só host) em os.environ e
# acionaria um bug em config.py que sobrescreveria a URL já montada.

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Reutiliza a mesma lógica de montagem de URL do app em runtime:
# Pydantic Settings lê os.environ + .env e monta DATABASE_URL via
# _assemble_database_url (3 cenários: URL completa / só host / só rds_aurora_*).
# Mesmo comportamento de GET /diagnostico/db-connection. Sem boto3 aqui.
from app.core.config import settings  # noqa: E402

database_url = settings.database_url or ""
if database_url and "://" in database_url:
    # configparser interpreta '%' como interpolação — escapar para '%%'
    config.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Importar todos os models para que o Alembic possa gerar migrations automaticas
from app.db.base import SQLModel  # noqa
import app.models  # noqa - importa todos os models via __init__.py

target_metadata = SQLModel.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Execute migrações no modo 'offline'.
    Isso configura o contexto apenas com uma URL
    e não com um Engine, embora um Engine também seja aceitável
    aqui. Ao omitir a criação do Engine,
    nem precisamos que uma DBAPI esteja disponível.

    As chamadas para context.execute() aqui emitem a string fornecida para a
    saída do script.
    """

    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

# -----------------------------------------------------------------------------
# 7) Execução online
# -----------------------------------------------------------------------------

def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()

# -----------------------------------------------------------------------------
# 8) Bootstrap
# -----------------------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

