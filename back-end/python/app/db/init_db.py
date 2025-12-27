# seed inicial (usuários admin, etc)

from sqlmodel import SQLModel
from app.db.session import engine

# IMPORTAR MODELOS (garante que as tabelas existam):
import app.models.user      
import app.models.area         
import app.models.restricted_file      
import app.models.share        
import app.models.share_file
import app.models.token_access    
import app.models.audit       

def init_db():
    SQLModel.metadata.create_all(engine)
