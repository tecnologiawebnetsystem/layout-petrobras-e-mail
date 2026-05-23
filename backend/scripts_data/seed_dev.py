"""
seed_dev.py – Popula o banco de desenvolvimento com dados mínimos para testar
o fluxo completo: INTERNO cria share → SUPERVISOR aprova → EXTERNO recebe OTP → download.

Dados criados:
  1. Administrador global (admin@petrobras.com.br / admin@123)  [is_admin=True]
  2. Supervisor           (supervisor@petrobras.com.br / supervisor@123)  [is_supervisor=True]
  3. Usuários internos    (múltiplos / internal@123) – ver INTERNAL_USERS
  4. Área + vínculo AreaSupervisor (um por usuário interno)
  5. Share PENDENTE       → 2 arquivos vinculados (carregados no S3 real)
  6. Usuário externo      (destinatario@example.com)

Os arquivos são enviados ao S3 apenas se ainda não existirem no bucket
(verificado via HeadObject), tornando o seed idempotente.

Uso:
    python -m scripts_data.seed_dev
"""

import posixpath
import secrets
from datetime import datetime, UTC

from botocore.exceptions import ClientError, NoCredentialsError
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
from app.services.s3_service import (
    S3_BUCKET,
    get_s3_client,
    head_object_safe,
    sanitize_filename,
)

EXTERNAL_EMAIL = "destinatario@example.com"

# Prefixo S3 reservado para arquivos de seed (facilita identificação no console)
_S3_SEED_PREFIX = "seed/dev/areas"

# Arquivos de teste carregados no S3
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
                 is_supervisor: bool = False,
                 is_admin: bool = False) -> tuple[User, bool]:
    user = session.exec(select(User).where(User.email == email)).first()
    if user:
        return user, False
    user = User(
        name=name, email=email, type=user_type,
        is_supervisor=is_supervisor, is_admin=is_admin, status=True,
    )
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


def _upload_s3_file(
    session: Session,
    area: SharedArea,
    internal_id: int,
    filename: str,
    content: bytes,
    mime_type: str,
) -> tuple[RestrictedFile, str]:
    """
    Garante que o arquivo existe no S3 e no banco de forma idempotente.

    Estratégia:
    - Se já existe no banco + S3  → retorna sem reenviar ('existente').
    - Se está no banco mas sumiu do S3 → faz re-upload ('recarregado').
    - Se não existe no banco       → cria registro e faz upload ('criado').

    A key S3 é determinística (baseada em area_id + filename), portanto
    execuções repetidas do seed nunca criam objetos duplicados no bucket.
    """
    safe_name = sanitize_filename(filename)
    key = posixpath.join(_S3_SEED_PREFIX, str(area.id), safe_name)

    # ── 1. Verifica existência no banco ──────────────────────────────────────
    rfile = session.exec(
        select(RestrictedFile).where(
            RestrictedFile.area_id == area.id,
            RestrictedFile.name == filename,
            RestrictedFile.status == True,
        )
    ).first()

    if rfile:
        # ── 2a. Arquivo no banco – verifica se ainda está no S3 ──────────────
        try:
            meta = head_object_safe(key=rfile.key_s3)
        except (ClientError, NoCredentialsError) as e:
            print(f"[seed][WARN] S3 indisponível ({type(e).__name__}) – mantendo registro do banco")
            return rfile, "existente (s3 nao verificado)"
        if meta:
            return rfile, "existente"
        # Arquivo sumiu do S3 → tenta re-upload (tolerante a falha)
        try:
            get_s3_client().put_object(
                Bucket=S3_BUCKET,
                Key=rfile.key_s3,
                Body=content,
                ContentType=mime_type,
            )
            return rfile, "recarregado"
        except (ClientError, NoCredentialsError) as e:
            print(f"[seed][WARN] Falha ao recarregar S3 ({type(e).__name__}): {rfile.key_s3}")
            return rfile, "existente (s3 falhou)"

    # ── 2b. Arquivo novo – tenta upload, mas não aborta o seed se falhar ────
    try:
        get_s3_client().put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=content,
            ContentType=mime_type,
        )
        upload_status = "criado"
    except (ClientError, NoCredentialsError) as e:
        print(
            f"[seed][WARN] S3 PutObject falhou ({type(e).__name__}) para {key} – "
            "criando registro no banco mesmo assim. Verifique a IAM Role da task."
        )
        upload_status = "criado (s3 ausente)"

    rfile = RestrictedFile(
        area_id=area.id,
        name=filename,
        key_s3=key,
        size_bytes=len(content),
        mime_type=mime_type,
        upload_id=internal_id,
        status=True,
        created_at=datetime.now(UTC),
    )
    session.add(rfile)
    session.commit()
    session.refresh(rfile)
    return rfile, upload_status


# ── main ──────────────────────────────────────────────────────────────────────

def _seed_internal_user(
    session: Session,
    supervisor: User,
    email: str,
    name: str,
) -> None:
    """Garante usuário, área, arquivos S3 e share pendente para um interno."""

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

    # 3. Arquivos no S3 (idempotente)
    file_ids: list[int] = []
    for filename, content, mime_type in DEV_FILES:
        rfile, status = _upload_s3_file(session, area, internal.id, filename, content, mime_type)
        file_ids.append(rfile.id)
        _icons = {
            "criado":                    "← ENVIADO S3",
            "recarregado":               "← RE-ENVIADO S3",
            "existente":                 "← já no S3",
            "existente (s3 nao verificado)": "← banco ok / S3 sem credencial",
            "existente (s3 falhou)":     "← banco ok / S3 indisponível",
            "criado (s3 ausente)":       "← banco ok / S3 sem permissão (verificar IAM)",
        }
        icon = _icons.get(status, f"← {status}")
        print(f"[seed]   arquivo  id={rfile.id}  nome={rfile.name}  key={rfile.key_s3}  {icon}")

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
            description="Aguardando aprovação do supervisor – gerado pelo seed_dev.py",
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
            user_agent="seed-script",
        )
        print(f"[seed] share pend. id={share_pending.id}  status={share_pending.status}  para={EXTERNAL_EMAIL}  ← CRIADO")
    else:
        print(f"[seed] share pend. id={share_pending.id}  status={share_pending.status}  para={EXTERNAL_EMAIL}  ← já existia")


def main() -> None:
    init_db()

    with Session(engine) as session:

        # ── Administrador global ──────────────────────────────────────────────
        admin, adc = _upsert_user(
            session,
            email="admin@petrobras.com.br",
            name="Admin Dev",
            user_type=TypeUser.INTERNAL,
            password="admin@123",
            is_admin=True,
        )
        print(f"[seed] admin       id={admin.id}  email={admin.email}"
              + ("  ← CRIADO" if adc else "  ← já existia"))

        # ── Supervisor (compartilhado por todos os internos) ──────────────────
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
        print(f"[seed]  FLUXO COMPLETO PARA TESTAR:")
        print(f"[seed] {sep}")
        print(f"[seed]  [ADMIN] Login como administrador global:")
        print(f"[seed]     POST /api/v1/auth/internal/login")
        print(f'[seed]     {{"email":"admin@petrobras.com.br","password":"admin@123"}}')
        print(f"[seed]     GET  /api/v1/admin/dashboard    Authorization: Bearer <token_admin>")
        print(f"[seed]     GET  /api/v1/admin/users        Authorization: Bearer <token_admin>")
        print(f"[seed]     GET  /api/v1/admin/logs         Authorization: Bearer <token_admin>")
        print(f"[seed] ")
        print(f"[seed]  [SUPERVISOR] Login como supervisor:")
        print(f"[seed]     POST /api/v1/auth/internal/login")
        print(f'[seed]     {{"email":"supervisor@petrobras.com.br","password":"supervisor@123"}}')
        print(f"[seed] ")
        print(f"[seed]  1) Listar pendentes:")
        print(f"[seed]     GET /api/v1/supervisor/pending")
        print(f"[seed]     Authorization: Bearer <token_supervisor>")
        print(f"[seed] ")
        print(f"[seed]  2) Aprovar um share:")
        print(f"[seed]     POST /api/v1/supervisor/approve/<share_id>")
        print(f"[seed]     Authorization: Bearer <token_supervisor>")
        print(f'[seed]     {{"message":"Aprovado!"}}')
        print(f"[seed] ")
        print(f"[seed]  3) Externo solicita OTP:")
        print(f"[seed]     POST /api/v1/download/verify")
        print(f'[seed]     {{"email":"{EXTERNAL_EMAIL}"}}')
        print(f"[seed] ")
        print(f"[seed]  4) Externo autentica com OTP (código no log do servidor):")
        print(f"[seed]     POST /api/v1/download/authenticate")
        print(f'[seed]     {{"email":"{EXTERNAL_EMAIL}","code":"<otp>"}}')
        print(f"[seed] ")
        print(f"[seed]  5) Externo lista/baixa arquivos:")
        print(f"[seed]     GET /api/v1/download/files")
        print(f"[seed]     Authorization: Bearer <access_token>")
        print(f"[seed] {sep}\n")


if __name__ == "__main__":
    main()
