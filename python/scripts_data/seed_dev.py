
# scripts/seed_dev.py
import os
from pathlib import Path
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.db.session import engine
from app.db.init_db import init_db
from app.models.usuario import Usuario, TipoUsuario
from app.models.area import AreaCompartilhamento
from app.models.arquivo import Arquivo
from app.models.share import Share, TokenConsumo, ShareStatus
from app.models.share_arquivo import ShareArquivo

# Opcional: usar serviço para emitir OTP
from app.services.token_service import emitir_otp

STORAGE_ROOT = Path("./storage")
AREA_PREFIX = "areas/PROJX/"
EXTERNO_EMAIL = "destinatario@example.com"

def main():
    init_db()
    STORAGE_ROOT.mkdir(exist_ok=True)
    with Session(engine) as session:
        # 1) Usuário interno
        interno = session.exec(select(Usuario).where(Usuario.email == "interno@empresa.com")).first()
        if not interno:
            interno = Usuario(
                nome_completo="Usuário Interno",
                email="interno@empresa.com",
                tipo=TipoUsuario.INTERNO,
                ativo=True
            )
            session.add(interno)
            session.commit()
            session.refresh(interno)
        print(f"[seed] interno_id={interno.id}")

        # 2) Área
        area = session.exec(select(AreaCompartilhamento).where(AreaCompartilhamento.prefixo_s3 == AREA_PREFIX)).first()
        if not area:
            area = AreaCompartilhamento(
                nome_area="Projeto X",
                descricao="Projeto de teste X",
                prefixo_s3=AREA_PREFIX,
                solicitante_id=interno.id,
                expira_em=datetime.utcnow() + timedelta(days=30)
            )
            session.add(area)
            session.commit()
            session.refresh(area)
        print(f"[seed] area_id={area.id}")

        # 3) Arquivos locais (dummy)
        area_path = STORAGE_ROOT / AREA_PREFIX
        area_path.mkdir(parents=True, exist_ok=True)

        files_to_create = [
            ("relatorio.pdf", b"%PDF-1.4\n%dummy file for dev\n"),
            ("planilha.xlsx", b"PK\x03\x04dummy xlsx\n"),
        ]
        arquivo_ids = []
        for nome, content in files_to_create:
            dest = area_path / nome
            if not dest.exists():
                with dest.open("wb") as f:
                    f.write(content)
            arq = session.exec(select(Arquivo).where(Arquivo.area_id == area.id, Arquivo.nome_arquivo == nome)).first()
            if not arq:
                arq = Arquivo(
                    area_id=area.id,
                    nome_arquivo=nome,
                    chave_s3=str(dest),
                    tamanho_bytes=dest.stat().st_size,
                    mime_type="application/octet-stream",
                    upload_por_id=interno.id
                )
                session.add(arq)
                session.commit()
                session.refresh(arq)
            arquivo_ids.append(arq.id)
        print(f"[seed] arquivos_ids={arquivo_ids}")

        # 4) Share
        share = session.exec(select(Share).where(Share.area_id == area.id, Share.externo_email == EXTERNO_EMAIL)).first()
        if not share:
            share = Share(
                area_id=area.id,
                externo_email=EXTERNO_EMAIL,
                criado_por_id=interno.id,
                consumo_policy=TokenConsumo.APOS_TODOS,
                expira_em=datetime.utcnow() + timedelta(days=7),
                status=ShareStatus.ATIVO
            )
            session.add(share)
            session.commit()
            session.refresh(share)

            for arq_id in arquivo_ids:
                sa = ShareArquivo(share_id=share.id, arquivo_id=arq_id)
                session.add(sa)
            session.commit()
        print(f"[seed] share_id={share.id} externo={EXTERNO_EMAIL}")

        # 5) (Opcional) Emitir OTP para o externo — envio mock (console)
        otp = emitir_otp(session=session, email=EXTERNO_EMAIL, validade_minutos=10, request_meta={"ip": "127.0.0.1", "ua": "seed-script"})
        print(f"[seed] OTP expira_em={otp.expira_em.isoformat()} (código impresso no console acima via [EMAIL MOCK])")

if __name__ == "__main__":
    main()
