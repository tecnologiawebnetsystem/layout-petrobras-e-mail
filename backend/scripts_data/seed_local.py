"""
seed_local.py – Versão local do seed para desenvolvedores sem acesso à AWS.

Diferenças em relação ao seed_dev.py (S3):
  - Arquivos são gravados em ./storage/areas/<area_id>/ no disco local.
  - key_s3 recebe o path local (posixpath relativo) – compatível com o modo
    storage_provider="local" configurado em Settings.
  - Nenhuma credencial AWS é necessária.

Dados criados:
  1. Usuários internos (múltiplos / internal@123) – ver INTERNAL_USERS
  2. Supervisor        (supervisor@petrobras.com.br / supervisor@123)
  3. Área + vínculo AreaSupervisor (um por usuário interno)
  4. Share PENDENTE    → 2 arquivos vinculados (gravados em disco local)
  5. Usuário externo   (destinatario@example.com)

O seed é idempotente: execuções repetidas não duplicam registros nem arquivos.

Uso:
    python -m scripts_data.seed_local
"""

import secrets
import uuid
from datetime import datetime, UTC
from pathlib import Path

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

# Arquivos de teste gravados em disco
DEV_FILES: list[tuple[str, bytes, str]] = [
    ("relatorio_dev.pdf",  b"%PDF-1.4\nConteudo de teste\n%%EOF\n", "application/pdf"),
    ("planilha_dev.xlsx",  b"PK\x03\x04XLSX de teste\n",           "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
]

# Usuários internos que serão criados/garantidos no banco
INTERNAL_USERS: list[tuple[str, str]] = [
    ("jefferson.breno.prestserv@petrobras.com.br", "Jefferson Breno"),
    ("bruno.enke.prestserv@petrobras.com.br",       "Bruno Enke"),
    ("raisa.moreira.prestserv@petrobras.com.br",    "Raisa Moreira"),
    ("isaachenriques@petrobras.com.br",             "Isaac Henriques"),
    ("wagner.brazil@petrobras.com.br",              "Wagner Brazil"),
    ("kleber.goncalves.prestserv@petrobras.com.br", "Kleber Goncalves"),
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


def _create_local_file(
    session: Session,
    area: SharedArea,
    internal_id: int,
    filename: str,
    content: bytes,
    mime_type: str,
) -> tuple[RestrictedFile, str]:
    """
    Garante que o arquivo existe em disco e no banco de forma idempotente.

    Estratégia:
    - Se já existe no banco e o arquivo está em disco → retorna sem recriar ('existente').
    - Se está no banco mas o arquivo sumiu do disco   → recria o arquivo ('reescrito').
    - Se não existe no banco                          → grava + cria registro ('criado').
    """
    area_dir = AREAS_ROOT / str(area.id)

    # ── 1. Verifica existência no banco ──────────────────────────────────────
    rfile = session.exec(
        select(RestrictedFile).where(
            RestrictedFile.area_id == area.id,
            RestrictedFile.name == filename,
            RestrictedFile.status == True,
        )
    ).first()

    if rfile:
        # ── 2a. Registro existe – verifica se o arquivo ainda está em disco ──
        disk_path = Path(rfile.key_s3)
        if disk_path.exists():
            return rfile, "existente"
        # Arquivo sumiu do disco → recria no mesmo path
        disk_path.parent.mkdir(parents=True, exist_ok=True)
        disk_path.write_bytes(content)
        return rfile, "reescrito"

    # ── 2b. Arquivo novo – grava em disco + cria registro ────────────────────
    area_dir.mkdir(parents=True, exist_ok=True)
    local_path = area_dir / f"{uuid.uuid4()}_{filename}"
    local_path.write_bytes(content)

    rfile = RestrictedFile(
        area_id=area.id,
        name=filename,
        key_s3=local_path.as_posix(),   # modo local: path no disco como chave
        size_bytes=len(content),
        mime_type=mime_type,
        upload_id=internal_id,
        status=True,
        created_at=datetime.now(UTC),
    )
    session.add(rfile)
    session.commit()
    session.refresh(rfile)
    return rfile, "criado"


# ── lógica por usuário interno ───────────────────────────────────────────────

def _seed_internal_user(
    session: Session,
    supervisor: User,
    email: str,
    name: str,
) -> None:
    """Garante usuário, área, arquivos locais e share pendente para um interno."""

    # 1. Upsert usuário interno
    internal, ic = _upsert_user(
        session, email=email, name=name,
        user_type=TypeUser.INTERNAL, password="internal@123",
    )
    print(f"[seed] interno     id={internal.id}  email={internal.email}"
          + ("  ← CRIADO" if ic else "  ← já existia"))

    # Vincula ao supervisor
    if internal.manager_id != supervisor.id:
        internal.manager_id = supervisor.id
        session.add(internal)
        session.commit()

    # 2. Área automática
    area = _get_or_create_area(session, internal.id)
    print(f"[seed] área        id={area.id}  prefix={area.prefix_s3}")

    # Vincula supervisor à área
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

    # 3. Arquivos locais (idempotente)
    file_ids: list[int] = []
    for filename, content, mime_type in DEV_FILES:
        rfile, status = _create_local_file(session, area, internal.id, filename, content, mime_type)
        file_ids.append(rfile.id)
        icon = {"criado": "← CRIADO em disco", "reescrito": "← REESCRITO em disco", "existente": "← já em disco"}[status]
        print(f"[seed]   arquivo  id={rfile.id}  nome={rfile.name}  path={rfile.key_s3}  {icon}")

    # 4. Share PENDENTE (idempotente por usuário + área + destinatário)
    share_pending = session.exec(
        select(Share).where(
            Share.area_id == area.id,
            Share.created_by_id == internal.id,
            Share.external_email == EXTERNAL_EMAIL,
            Share.status == ShareStatus.PENDING,
        )
    ).first()

    if not share_pending:
        share_pending = Share(
            area_id=area.id,
            external_email=EXTERNAL_EMAIL,
            created_by_id=internal.id,
            status=ShareStatus.PENDING,
            consumption_policy=TokenConsumption.AFTER_ALL,
            expires_at=None,
            name=f"Compartilhamento Pendente Dev – {name}",
            description="Aguardando aprovação do supervisor – gerado pelo seed_local.py",
        )
        session.add(share_pending)
        session.commit()
        session.refresh(share_pending)

        for fid in file_ids:
            session.add(ShareFile(share_id=share_pending.id, file_id=fid))
        session.commit()

        log_event(
            session=session,
            action="SEED_SHARE_CRIADO",
            user_id=internal.id,
            share_id=share_pending.id,
            detail=f"external_email={EXTERNAL_EMAIL}",
            ip="127.0.0.1",
            user_agent="seed-local-script",
        )
        print(f"[seed] share pend. id={share_pending.id}  status={share_pending.status}  para={EXTERNAL_EMAIL}  ← CRIADO")
    else:
        print(f"[seed] share pend. id={share_pending.id}  status={share_pending.status}  para={EXTERNAL_EMAIL}  ← já existia")


# ── main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    init_db()
    STORAGE_ROOT.mkdir(exist_ok=True)
    AREAS_ROOT.mkdir(exist_ok=True)

    with Session(engine) as session:

        # ── Supervisor (compartilhado por todos os internos) ─────────────────
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

        sep = "─" * 60
        print(f"\n[seed] {sep}")

        # ── Usuários internos ────────────────────────────────────────────────
        for email, name in INTERNAL_USERS:
            print(f"\n[seed] >>> {email}")
            _seed_internal_user(session, supervisor, email, name)

        print(f"\n[seed] {sep}")

        # ── Usuário externo ──────────────────────────────────────────────────
        ext_user, ec = _upsert_user(
            session,
            email=EXTERNAL_EMAIL,
            name=EXTERNAL_EMAIL.split("@")[0],
            user_type=TypeUser.EXTERNAL,
            password=secrets.token_urlsafe(16),
        )
        print(f"[seed] externo     id={ext_user.id}  email={ext_user.email}"
              + ("  ← CRIADO" if ec else "  ← já existia"))

        print(f"\n[seed] {sep}")
        print(f"[seed]  FLUXO COMPLETO PARA TESTAR (modo local – sem AWS):")
        print(f"[seed] {sep}")
        print(f"[seed]  1) Login como supervisor:")
        print(f"[seed]     POST /api/v1/auth/login")
        print(f'[seed]     {{"email":"supervisor@petrobras.com.br","password":"supervisor@123"}}')
        print(f"[seed] ")
        print(f"[seed]  2) Listar pendentes:")
        print(f"[seed]     GET /api/v1/supervisor/pending")
        print(f"[seed]     Authorization: Bearer <token_supervisor>")
        print(f"[seed] ")
        print(f"[seed]  3) Aprovar um share:")
        print(f"[seed]     POST /api/v1/supervisor/approve/<share_id>")
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
        print(f"[seed]  6) Externo lista/baixa arquivos (servidos do disco local):")
        print(f"[seed]     GET /api/v1/download/files")
        print(f"[seed]     Authorization: Bearer <access_token>")
        print(f"[seed] {sep}\n")


if __name__ == "__main__":
    main()
