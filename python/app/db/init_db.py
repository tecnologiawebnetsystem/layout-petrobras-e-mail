# seed inicial (usuários admin, etc)

from sqlmodel import SQLModel
from app.db.session import engine

# IMPORTAR MODELOS (garante que as tabelas existam):
import app.models.usuario      
import app.models.area         
import app.models.arquivo      
import app.models.share        
import app.models.share_arquivo
import app.models.token_acesso    
import app.models.auditoria       

def init_db():
    SQLModel.metadata.create_all(engine)
