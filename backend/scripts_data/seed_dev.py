"""
seed_dev.py – Popula o banco de desenvolvimento com dados mínimos para testar
o fluxo completo: INTERNO cria share → SUPERVISOR aprova → EXTERNO recebe OTP → download.

Dados criados:
  1. Usuário interno  (jefferson.breno.prestserv@petrobras.com.br / internal@123)
  2. Supervisor       (supervisor@petrobras.com.br / supervisor@123)
  3. Área + vínculo AreaSupervisor
  4. Share PENDENTE   → 2 arquivos vinculados (RestrictedFile gravados no storage local)
  5. Usuário externo  (destinatario@example.com)

Uso:
    python -m scripts_data.seed_dev
"""

import uuid
import secrets
from pathlib import Path
from datetime import datetime, UTC

from sqlmodel import Session, select

from app.db.session import engine
from app.db.init_db import init_db
from app.models.area import SharedArea
from app.models.areasupervisors import AreaSupervisor
from app.models.credencial_local import CredentialLocal
from app.models.restricted_file import RestrictedFile
from app.models.share import Share, ShareStatus, TokenConsumption
from app.models.share_file import ShareFile
from app.models.user import User, TypeUser
from app.services.audit_service import log_event

STORAGE_ROOT   = Path("./storage")
AREAS_ROOT     = STORAGE_ROOT / "areas"
EXTERNAL_EMAIL = "destinatario@example.com"

# Arquivos de teste gravados localmente (sem S3)
DEV_FILES: list[tuple[str, bytes, str]] = [
    ("relatorio_dev.pdf",  b"%PDF-1.4\nConteudo de teste\n%%EOF\n", "application/pdf"),
    ("planilha_dev.xlsx",  b"PK\x03\x04XLSX de teste\n",           "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
]


# ── helpers ──────────────────────────────────────────────────────────────────

def _upsert_user(session: Session, email: str, name: str,
                 user_type: TypeUser, password: str,
                 is_supervisor: bool = False) -> tuple[User, bool]:
    user = session.exec(select(User).where(User.email == email)).first()
    if user:
        return user, False
    user = User(name=name, email=email, type=user_type, is_supervisor=is_supervisor, status=True)
    session.add(user)
    session.commit()
    session.refresh(user)
    cred = CredentialLocal(user_id=user.id)
    cred.set_password(password)
    session.add(cred)
    session.commit()
    return user, True


def _get_or_create_area(session: Session, internal_id: int) -> SharedArea:
    prefix = f"areas/AUTO-{internal_id}/"
    area = session.exec(
        select(SharedArea).where(
            SharedArea.prefix_s3 == prefix,
            SharedArea.applicant_id == internal_id,
        )
    ).first()
    if area:
        return area
    area = SharedArea(
        name=f"Área Dev - {internal_id}",
        prefix_s3=prefix,
        applicant_id=internal_id,
        status=True,
        description="Área automática de desenvolvimento",
        expires_at=None,
    )
    session.add(area)
    session.commit()
    session.refresh(area)
    return area


def _create_local_file(session: Session, area: SharedArea,
                       internal_id: int, filename: str,
                       content: bytes, mime_type: str) -> RestrictedFile:
    """Grava bytes no disco local e cria o registro RestrictedFile."""
    area_dir = AREAS_ROOT / str(area.id)
    area_dir.mkdir(parents=True, exist_ok=True)

    local_path = area_dir / f"{uuid.uuid4()}_{filename}"
    local_path.write_bytes(content)

    rfile = RestrictedFile(
        area_id=area.id,
        name=filename,
        key_s3=local_path.as_posix(),   # dev: usa path local como chave
        size_bytes=len(content),
        mime_type=mime_type,
        upload_id=internal_id,
        status=True,
        created_at=datetime.now(UTC),
    )
    session.add(rfile)
    session.commit()
    session.refresh(rfile)
    return rfile


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    init_db()
    STORAGE_ROOT.mkdir(exist_ok=True)
    AREAS_ROOT.mkdir(exist_ok=True)

    with Session(engine) as session:

        # 1. Usuário interno
        internal, ic = _upsert_user(
            session,
            email="jefferson.breno.prestserv@petrobras.com.br",
            name="Interno Dev",
            user_type=TypeUser.INTERNAL,
            password="internal@123",
        )
        print(f"[seed] interno     id={internal.id}  email={internal.email}"
              + ("  ← CRIADO" if ic else "  ← já existia"))

        # 2. Supervisor (usuário interno com is_supervisor=True)
        # Em produção, essa relação viria do chamado ServiceNow.
        supervisor, sc = _upsert_user(
            session,
            email="supervisor@petrobras.com.br",
            name="Supervisor Dev",
            user_type=TypeUser.INTERNAL,
            password="supervisor@123",
            is_supervisor=True,
        )
        print(f"[seed] supervisor  id={supervisor.id}  email={supervisor.email}"
              + ("  ← CRIADO" if sc else "  ← já existia"))

        # Vincula interno ao supervisor via manager_id
        if internal.manager_id != supervisor.id:
            internal.manager_id = supervisor.id
            session.add(internal)
            session.commit()

        # 3. Área automática
        area = _get_or_create_area(session, internal.id)
        print(f"[seed] área        id={area.id}  prefix={area.prefix_s3}")

        # Vincula supervisor à área via AreaSupervisor (necessário para relatório de área)
        area_link = session.exec(
            select(AreaSupervisor).where(
                AreaSupervisor.area_id == area.id,
                AreaSupervisor.supervisor_id == supervisor.id,
            )
        ).first()
        if not area_link:
            session.add(AreaSupervisor(area_id=area.id, supervisor_id=supervisor.id))
            session.commit()
            print(f"[seed] área-supervisor  área={area.id} → supervisor={supervisor.id}  ← CRIADO")
        else:
            print(f"[seed] área-supervisor  área={area.id} → supervisor={supervisor.id}  ← já existia")

        # 4a. Share PENDENTE (para o supervisor aprovar/rejeitar)
        share_pending = Share(
            area_id=area.id,
            external_email=EXTERNAL_EMAIL,
            created_by_id=internal.id,
            status=ShareStatus.PENDING,
            consumption_policy=TokenConsumption.AFTER_ALL,
            expires_at=None,
            name="Compartilhamento Pendente Dev",
            description="Aguardando aprovação do supervisor – gerado pelo seed_dev.py",
        )
        session.add(share_pending)
        session.commit()
        session.refresh(share_pending)
        print(f"[seed] share pend. id={share_pending.id}  status={share_pending.status}  para={EXTERNAL_EMAIL}")

        # 5. Arquivos locais vinculados ao share pendente
        for filename, content, mime_type in DEV_FILES:
            rfile = _create_local_file(session, area, internal.id,
                                       filename, content, mime_type)
            session.add(ShareFile(share_id=share_pending.id, file_id=rfile.id))
            session.commit()
            print(f"[seed]   arquivo  id={rfile.id}  nome={rfile.name}  {rfile.size_bytes}B")

        # 6. Usuário externo (necessário para o token_service encontrar o user pelo e-mail)
        ext_user, ec = _upsert_user(
            session,
            email=EXTERNAL_EMAIL,
            name=EXTERNAL_EMAIL.split("@")[0],
            user_type=TypeUser.EXTERNAL,
            password=secrets.token_urlsafe(16),
        )
        print(f"[seed] externo     id={ext_user.id}  email={ext_user.email}"
              + ("  ← CRIADO" if ec else "  ← já existia"))

        log_event(
            session=session,
            action="SEED_SHARE_CRIADO",
            user_id=internal.id,
            share_id=share_pending.id,
            detail=f"external_email={EXTERNAL_EMAIL}",
            ip="127.0.0.1",
            user_agent="seed-script",
        )

        sep = "─" * 60
        print(f"\n[seed] {sep}")
        print(f"[seed]  FLUXO COMPLETO PARA TESTAR:")
        print(f"[seed] {sep}")
        print(f"[seed]  1) Login como supervisor:")
        print(f"[seed]     POST /api/v1/auth/login")
        print(f'[seed]     {{"email":"supervisor@empresa.com","password":"supervisor@123"}}')
        print(f"[seed] ")
        print(f"[seed]  2) Listar pendentes:")
        print(f"[seed]     GET /api/v1/supervisor/pending")
        print(f"[seed]     Authorization: Bearer <token_supervisor>")
        print(f"[seed] ")
        print(f"[seed]  3) Aprovar o share (id={share_pending.id}):")
        print(f"[seed]     POST /api/v1/supervisor/approve/{share_pending.id}")
        print(f"[seed]     Authorization: Bearer <token_supervisor>")
        print(f'[seed]     {{"message":"Aprovado!"}}')
        print(f"[seed] ")
        print(f"[seed]  4) Externo solicita OTP:")
        print(f"[seed]     POST /api/v1/download/verify")
        print(f'[seed]     {{"email":"{EXTERNAL_EMAIL}"}}')
        print(f"[seed] ")
        print(f"[seed]  5) Externo autentica com OTP (código no log do servidor):")
        print(f"[seed]     POST /api/v1/download/authenticate")
        print(f'[seed]     {{"email":"{EXTERNAL_EMAIL}","code":"<otp>"}}')
        print(f"[seed] ")
        print(f"[seed]  6) Externo lista/baixa arquivos:")
        print(f"[seed]     GET /api/v1/download/files")
        print(f"[seed]     Authorization: Bearer <access_token>")
        print(f"[seed] {sep}\n")


if __name__ == "__main__":
    main()
