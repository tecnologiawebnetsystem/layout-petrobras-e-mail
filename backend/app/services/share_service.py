import uuid
import unicodedata
from sqlmodel import Session, select
from datetime import datetime, UTC
from typing import Iterable

from app.core.config import settings
from app.models.area import SharedArea
from app.models.user import User, TypeUser
from app.models.restricted_file import RestrictedFile
from app.models.share import Share, ShareStatus, TokenConsumption
from app.models.share_file import ShareFile
from app.services.audit_service import log_event
from botocore.exceptions import ClientError, NoCredentialsError
from app.services.s3_service import build_upload_key, sanitize_filename, get_s3_client, delete_object, S3_BUCKET
from app.services.mip_processing_service import process_upload_file, MipProcessingPolicyError

class ShareError(Exception):
    pass

class ShareNoSupervisorError(ShareError):
    """Share nao pode ser criado pois o usuario nao possui supervisor vinculado."""
    pass

class S3UploadError(ShareError):
    """Falha no upload ao S3 — share não registrado no banco."""
    pass


class MipProcessingShareError(ShareError):
    """Falha de política/processamento MIP antes do upload ao S3."""

    def __init__(self, message: str, error_code: str = "MIP_ERROR") -> None:
        super().__init__(message)
        self.error_code = error_code


def _normalize_text(value: str) -> str:
    """Normaliza string para comparacao estavel: lowercase, sem acento, sem espacos duplos."""
    text = value.strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return " ".join(text.split())


def has_auto_approve_job_title(user: User) -> bool:
    """
    Verifica se o cargo do usuário concede aprovação automática de compartilhamentos.
    A comparação é case-insensitive, sem acento e sem espaços extras.
    Suporta correspondência por prefixo: 'Diretor de Operações' bate em 'diretor'.
    A lista de cargos elegíveis é configurável via AUTO_APPROVE_JOB_TITLES no .env.
    """
    if not user.job_title:
        return False
    normalized_title = _normalize_text(user.job_title)
    for allowed in settings.auto_approve_job_titles:
        normalized_allowed = _normalize_text(allowed)
        # Bate exato ou se o cargo do usuario comeca com o padrao configurado
        if normalized_title == normalized_allowed or normalized_title.startswith(normalized_allowed):
            return True
    return False


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

    # Verifica se o criador precisa de supervisor antes de criar o share.
    # Usuários com cargo de aprovação automática ou administradores são isentos.
    if not has_auto_approve_job_title(internal) and not internal.is_admin:
        if not internal.manager_id:
            raise ShareNoSupervisorError(
                "Não é possível criar o compartilhamento: você não possui um supervisor "
                "vinculado na base. Solicite ao administrador que associe seu gestor."
            )

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
    # ── Inicia transação atômica ─────────────────────────────────────────────
    # O Share é adicionado mas NÃO commitado ainda.
    # Só haverá commit único ao final, após todos os arquivos serem processados.
    # Qualquer falha (MIP ou S3) dispara rollback total, sem registro órfão.
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
    # flush: sincroniza com o banco (gera share.id via SERIAL) sem commitar;
    # rollback ainda é possível se algo falhar a seguir.
    session.flush()

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

    # 2) Processa e envia uploads novos (bytes → MIP → S3 → banco)
    uploaded_keys: list[str] = []
    try:
        if new_uploads:
            s3 = get_s3_client()
            for upload_name, content_bytes, mime_type in new_uploads:
                safe_name = sanitize_filename(upload_name)

                # ── Processa MIP antes de qualquer gravação ──────────────────
                mip_result = process_upload_file(filename=safe_name, content_bytes=content_bytes)

                file_id = str(uuid.uuid4())
                key_s3 = build_upload_key(area.id, file_id, safe_name)

                # ── Upload S3 ANTES de gravar no banco ───────────────────────
                s3.put_object(
                    Bucket=S3_BUCKET,
                    Key=key_s3,
                    Body=mip_result.content_bytes,
                    ContentType=mime_type,
                )
                uploaded_keys.append(key_s3)

                # Grava RestrictedFile e vínculo apenas após S3 confirmar
                rfile = RestrictedFile(
                    area_id=area.id,
                    name=safe_name,
                    key_s3=key_s3,
                    size_bytes=len(mip_result.content_bytes),
                    mime_type=mime_type,
                    upload_id=created_by_id,
                    status=True,
                    created_at=datetime.now(UTC),
                )
                session.add(rfile)
                session.flush()  # obtém rfile.id sem commitar
                sf = ShareFile(share_id=share.id, file_id=rfile.id)
                session.add(sf)

        # ── Commit único: share + arquivos + vínculos ────────────────────────
        session.commit()
        session.refresh(share)

    except MipProcessingPolicyError as exc:
        # Rollback total: Share, RestrictedFile e ShareFile não foram commitados
        session.rollback()
        # Reverte objetos S3 já enviados antes da falha MIP (se houver)
        for k in uploaded_keys:
            try:
                delete_object(key=k)
            except Exception:
                pass
        log_event(
            session=session,
            action="MIP_PROCESSING_FALHOU",
            user_id=created_by_id,
            share_id=None,  # share não foi persistido
            detail=(
                f"Falha MIP ao criar share para {external_email}. "
                f"Chaves S3 revertidas: {uploaded_keys}. "
                f"Erro: {type(exc).__name__}: {exc}"
            ),
            ip=request_meta.get("ip") if request_meta else None,
            user_agent=request_meta.get("ua") if request_meta else None,
        )
        raise MipProcessingShareError(
            str(exc),
            error_code=getattr(exc, "error_code", "MIP_ERROR"),
        ) from exc

    except (ClientError, NoCredentialsError) as exc:
        # Rollback total: nada foi commitado
        session.rollback()
        for k in uploaded_keys:
            try:
                delete_object(key=k)
            except Exception:
                pass
        log_event(
            session=session,
            action="S3_UPLOAD_FALHOU",
            user_id=created_by_id,
            share_id=None,  # share não foi persistido
            detail=(
                f"Falha S3 ao criar share para {external_email}. "
                f"Chaves S3 revertidas: {uploaded_keys}. "
                f"Erro: {type(exc).__name__}: {exc}"
            ),
            ip=request_meta.get("ip") if request_meta else None,
            user_agent=request_meta.get("ua") if request_meta else None,
        )
        raise S3UploadError(
            f"Falha ao enviar arquivo para o S3: {exc}. "
            "Nenhum dado foi salvo. Tente novamente."
        ) from exc

    # Auditoria de sucesso
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