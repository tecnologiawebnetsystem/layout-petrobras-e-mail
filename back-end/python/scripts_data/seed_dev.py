from pathlib import Path
from datetime import datetime, timedelta, UTC
from sqlmodel import Session, select
from app.db.session import engine
from app.db.init_db import init_db

from app.models.user import User, TypeUser
from app.models.share import TokenConsumption
from app.models.credencial_local import CredentialLocal

from app.services.token_service import issue_otp
from app.services.share_service import create_share

from passlib.context import CryptContext
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

STORAGE_ROOT = Path("./storage")
EXTERNAL_EMAIL = "destinatario@example.com"

def main():
    init_db()
    STORAGE_ROOT.mkdir(exist_ok=True)

    with Session(engine) as session:
        # 1) Usuário internal (dev) + credencial
        internal = session.exec(select(User).where(User.email == "jefferson.breno.prestserv@petrobras.com.br")).first()
        password_internal = "internal@123"
        password_internal_hash = pwd.hash(password_internal)
        if not internal:
            internal = User(
                name="Inerno Dev",
                email="jefferson.breno.prestserv@petrobras.com.br",
                type=TypeUser.INTERNAL,
                status=True
            )
            session.add(internal)
            session.commit()
            session.refresh(internal)
        
            cred = CredentialLocal(
                 user_id=internal.id, 
                 password_hash=password_internal_hash
            )
            session.add(cred); 
            session.commit()
        
        print(f"[seed] interno_id={internal.id} email={internal.email} senha={password_internal}")


        # 2) Share simplificado (sem area_id => cria/usa área automática)
        new_uploads = [
            ("relatorio.pdf", b"%PDF-1.4\nseed dev\n", "application/pdf"),
            ("planilha.xlsx", b"PK\x03\x04seed dev\n", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        ]

        share = create_share(
            session=session,
            created_by_id=internal.id,
            external_email=EXTERNAL_EMAIL,
            expira_at=datetime.now(UTC) + timedelta(days=7),
            consumption_policy=TokenConsumption.AFTER_ALL,
            area_id=None,
            file_ids=[],
            new_uploads=new_uploads,
            request_meta={"ip":"127.0.0.1","ua":"seed-script"}
        )

        print(f"[seed] share_id={share.id} externo={EXTERNAL_EMAIL} area_id={share.area_id}")


        # 3) Emitir OTP para o externo (mock)
        otp = issue_otp(
            session=session, 
            email=EXTERNAL_EMAIL, 
            validity_minutes=10, 
            request_meta={"ip": "127.0.0.1", "ue":"seed-script"}
        )

        print(f"[seed] OTP expira_em={otp.expira_at.isoformat()}  (veja o código no console do servidor: [EMAIL MOCK])")


        # 4) (Opcional) Supervisor local
        supervisor = session.exec(select(User).where(User.email == "supervisor@empresa.com")).first()
        if not supervisor:
            supervisor = User(
                name="Supervisor Dev",
                email="supervisor@empresa.com",
                type=TypeUser.SUPERVISOR,
                status=True
            )
            password_supervisor = "supervisor@123"
            password_supervisor_hash = pwd.hash("supervisor@123")

            session.add(supervisor); 
            session.commit(); 
            session.refresh(supervisor)
            
            cred_sup = CredentialLocal(user_id=supervisor.id, password_hash=password_supervisor_hash)
            session.add(cred_sup); 
            session.commit()
        
        print(f"[seed] supervisor_id={supervisor.id} email={supervisor.email} senha={password_supervisor}")

       
if __name__ == "__main__":
    main()
