import os
import uuid
from sqlmodel import Session, select
from datetime import datetime, UTC
from typing import Iterable
from pydantic import EmailStr

from app.core.config import settings
from app.models.area import SharedArea
from app.models.user import User, TypeUser
from app.models.restricted_file import RestrictedFile
from app.models.share import Share, ShareStatus, TokenConsumption
from app.models.share_file import ShareFile
from app.services.audit_service import log_event
from botocore.exceptions import ClientError, NoCredentialsError
from app.services.s3_service import build_upload_key, sanitize_filename, get_s3_client, delete_object, S3_BUCKET

class ShareError(Exception):
    pass

class S3UploadError(ShareError):
    """Falha no upload ao S3 — share não registrado no banco."""
    pass

def _get_or_create_automatic_area(session: Session, applicant_id: int) -> SharedArea:
    """
    Busca uma área automática do usuário ou cria, caso não exista.
    Não é exibida na UI; usada como contêiner técnico para uploads.
    """
    prefix_s3 = f"areas/AUTO-{applicant_id}/"
    area = session.exec(
        select(SharedArea).where(
            SharedArea.prefix_s3 == prefix_s3,
            SharedArea.applicant_id == applicant_id
        )
    ).first()
    if area:
        return area
    area = SharedArea(
        name=f"Área Automática - {applicant_id}",
        prefix_s3=prefix_s3,
        applicant_id=applicant_id,
        status=True,
        description=None,
        expires_at=None  # definir uma política padrão caso necessário
    )
    session.add(area)
    session.commit()
    session.refresh(area)
    return area


def get_or_create_external_user(session: Session, email: str) -> User:
    """
    Retorna o usuário externo existente com o e-mail informado, ou cria um
    novo registro com type=EXTERNAL caso não exista.

    Se o usuário existir mas estiver inativo (desativado por ausência de share
    anterior), reativa-o — pois um novo share válido está sendo criado.

    Chamado no momento da criação do share para que o destinatário já esteja
    provisionado na base antes de qualquer aprovação ou fluxo de OTP.
    """
    user = session.exec(select(User).where(User.email == email)).first()
    if user:
        if not user.status:
            # Reativa: novo share válido justifica o acesso
            user.status = True
            session.add(user)
            session.commit()
            session.refresh(user)
        return user
    # Deriva um nome amigável a partir do endereço de e-mail (parte antes do @)
    name_from_email = email.split("@")[0].replace(".", " ").replace("_", " ").title()
    user = User(
        name=name_from_email,
        email=email,
        type=TypeUser.EXTERNAL,
        status=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def create_share(
    session: Session,
    area_id: int,
    external_email: str,
    created_by_id: int,
    expiration_hours: int = 168,
    name: str | None = None,
    description: str | None = None,
    consumption_policy: TokenConsumption = TokenConsumption.AFTER_ALL,
    file_ids: list[int] | None = None,
    new_uploads: Iterable[tuple[str, bytes, str]] | None = None,
    request_meta: dict | None = None
) -> Share:
    # valida interno
    internal = session.exec(select(User).where(User.id == created_by_id)).first()
    if not internal:
        raise ShareError("Usuário interno (criador) não encontrado.")
    if not external_email:
        raise ShareError("E-mail do destinatário externo é obrigatório.")

    # Provisiona destinatário externo: cria o User se não existir
    recipient = get_or_create_external_user(session, external_email)

    # resolve área
    if area_id is None:
        area = _get_or_create_automatic_area(session, applicant_id=created_by_id)
    else:
        area = session.get(SharedArea, area_id)
        if not area:
            raise ShareError("Área informada não existe.")
        if not area.status:
            raise ShareError("Área não está ativa.")
    # Cria o share
    share = Share(
        area_id=area.id,
        name=name,
        description=description,
        external_email=external_email,
        recipient_user_id=recipient.id,
        created_by_id=created_by_id,
        expiration_hours=expiration_hours,
        expires_at=None,  # definido apenas na aprovação do supervisor
        consumption_policy=consumption_policy,
        status=ShareStatus.PENDING
    )
    session.add(share)
    session.commit()
    session.refresh(share)

    # 1) Vincula arquivos existentes pelo ID
    if file_ids:
        files = session.exec(
            select(RestrictedFile).where(
                RestrictedFile.id.in_(file_ids),
                RestrictedFile.area_id == area.id
            )
        ).all()
        for rfile in files:
            sf = ShareFile(share_id=share.id, file_id=rfile.id)
            session.add(sf)
        session.commit()

    # 2) Grava uploads novos (bytes → S3) e vincula ao share — independente de file_ids
    if new_uploads:
        s3 = get_s3_client()
        uploaded_keys: list[str] = []  # para rollback S3 em caso de falha parcial
        try:
            for name, content_bytes, mime_type in new_uploads:
                safe_name = sanitize_filename(name)
                file_id = str(uuid.uuid4())
                key_s3 = build_upload_key(area.id, file_id, safe_name)

                # ── Upload S3 ANTES de gravar no banco ──────────────────────
                # Se falhar aqui, nenhum registro foi criado para este arquivo.
                s3.put_object(
                    Bucket=S3_BUCKET,
                    Key=key_s3,
                    Body=content_bytes,
                    ContentType=mime_type,
                )
                uploaded_keys.append(key_s3)

                # Só grava no banco após upload S3 confirmar
                rfile = RestrictedFile(
                    area_id=area.id,
                    name=safe_name,
                    key_s3=key_s3,
                    size_bytes=len(content_bytes),
                    mime_type=mime_type,
                    upload_id=created_by_id,
                    status=True,
                    created_at=datetime.now(UTC),
                )
                session.add(rfile)
                session.commit()
                session.refresh(rfile)
                sf = ShareFile(share_id=share.id, file_id=rfile.id)
                session.add(sf)
            session.commit()

        except (ClientError, NoCredentialsError) as exc:
            # ── Rollback S3: remove objetos já enviados ──────────────────
            for k in uploaded_keys:
                try:
                    delete_object(key=k)
                except Exception:
                    pass
            # Rollback banco: descarta RestrictedFile/ShareFile não commitados
            session.rollback()
            # Auditoria de falha — gravada após rollback (nova transação limpa)
            log_event(
                session=session,
                action="S3_UPLOAD_FALHOU",
                user_id=created_by_id,
                share_id=share.id,
                detail=(
                    f"Falha S3 ao criar share para {external_email}. "
                    f"Chaves revertidas: {uploaded_keys}. "
                    f"Erro: {type(exc).__name__}: {exc}"
                ),
                ip=request_meta.get("ip") if request_meta else None,
                user_agent=request_meta.get("ua") if request_meta else None,
            )
            raise S3UploadError(
                f"Falha ao enviar arquivo para o S3: {exc}. "
                "Nenhum dado foi salvo. Tente novamente."
            ) from exc

    # Auditoria
    log_event(
        session=session,
        action="CRIAR_SHARE",
        user_id=created_by_id,
        share_id=share.id,
        detail=f"external_email={external_email}",
        ip=request_meta.get("ip") if request_meta else None,
        user_agent=request_meta.get("ua") if request_meta else None
    )
    return share

def list_share_files(session: Session, share_id: int) -> list[ShareFile]:
    return session.exec(select(ShareFile).where(ShareFile.share_id == share_id)).all()