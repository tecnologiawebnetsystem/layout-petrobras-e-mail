# seed inicial (usuarios admin, etc)

from sqlmodel import SQLModel
from app.db.session import engine

# IMPORTAR TODOS OS MODELOS (garante que as tabelas existam):
import app.models.user
import app.models.area
import app.models.restricted_file
import app.models.share
import app.models.share_file
import app.models.token_access
import app.models.audit
import app.models.notification
import app.models.email_log
import app.models.credencial_local
import app.models.areasupervisors
import app.models.session_token


def init_db():
    """
    Cria todas as tabelas no banco de dados (PostgreSQL Neon ou SQLite local).
    Chamado no startup do FastAPI.
    """
    SQLModel.metadata.create_all(engine)
