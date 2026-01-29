

from sqlmodel import Session, select
from datetime import datetime, UTC
from pathlib import Path
from typing import Iterable

from app.models.area import SharedArea
from app.models.user import User
from app.models.restricted_file import RestrictedFile
from app.models.share import Share, ShareStatus, TokenConsumption
from app.models.share_file import ShareFile
from app.services.audit_service import log_event



STORAGE_ROOT = Path("./storage")

class ShareError(Exception):
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


def create_share(
    session: Session,
    area_id: int,
    external_email: str,
    created_by_id: int,
    expires_at,
    consumption_policy: TokenConsumption,
    file_ids: list[int],
    new_uploads: Iterable[tuple[str, bytes, str]] | None = None,
    request_meta: dict | None = None
) -> Share:
    
    # valida interno
    internal = session.exec(select(User).where(User.id == created_by_id)).first()
    if not internal:
        raise ShareError("Usuário interno (criador) não encontrado.")
    if not external_email:
        raise ShareError("E-mail do destinatário externo é obrigatório.")
    
    # resolve área
    if area_id is None:
        area = _get_or_create_automatic_area(session, applicant_id=created_by_id)
    else:
        area = session.get(SharedArea, area_id)
        if not area:
            raise ShareError("Área informada não existe.")
        if not area.status:
            raise ShareError("Área não está ativa.")
    area_path = STORAGE_ROOT / area.prefix_s3
    area_path.mkdir(parents=True, exist_ok=True)

    # Cria o share
    share = Share(
        area_id=area.id,
        external_email=external_email,
        created_by_id=created_by_id,
        expires_at=expires_at,
        consumption_policy=consumption_policy,
        status=ShareStatus.ACTIVE
    )
    session.add(share)
    session.commit()
    session.refresh(share)


    # vincula arquivos existentes (se vieram ids)
    if file_ids:
        files = session.exec(
            select(RestrictedFile).where(RestrictedFile.id.in_(file_ids), RestrictedFile.area_id == area.id)
        ).all()
        for rfile in files:
            sf = ShareFile(share_id=share.id, file_id=rfile.id)
            session.add(sf)
        session.commit()


    # grava uploads novos (opcional) e vincula ao share
    if new_uploads:
        for name, content_bytes, mime_type in new_uploads:
            dest = area_path / name
            with dest.open("wb") as fh:
                fh.write(content_bytes)
            rfile = RestrictedFile(
                area_id=area.id,
                name=name,
                key_s3=str(dest),  # ****em prod, trocar por key S3****
                size_bytes=dest.stat().st_size,
                mime_type=mime_type,
                upload_id=created_by_id,
                status=True,
                created_at=datetime.now(UTC)
            )
            session.add(rfile)
            session.commit()
            session.refresh(rfile)

            sf = ShareFile(share_id=share.id, file_id=rfile.id)
            session.add(sf)
        session.commit()


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
