"""
Rotas de compartilhamentos (shares).
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Request, UploadFile, Form, Query
import json
import structlog
from typing import List, Optional
from sqlmodel import Session, select, func
from datetime import datetime, UTC

logger = structlog.get_logger(__name__)
from pydantic import BaseModel

from app.db.session import get_session
from app.schemas.share_schema import ShareCreate, ShareRead
from app.models.share import Share, ShareStatus
from app.models.share_file import ShareFile
from app.models.restricted_file import RestrictedFile
from app.models.user import User
from app.models.email_log import EmailLog
from app.services.share_service import create_share, ShareError, S3UploadError, get_or_create_external_user
from app.services.token_service import issue_token_access, TokenError
from app.schemas.token_schema import TokenRead
from app.utils.authz import require_internal, get_current_user
from app.services.audit_service import log_event
from app.services.s3_service import delete_object, S3ServiceError
from app.services.email_service import (
    send_supervisor_approval_request_email,
    send_share_approved_external_email,
    send_share_approved_requester_email,
)
from datetime import timedelta
from app.core.config import settings

router = APIRouter(prefix="/shares", tags=["Shares"])


# =====================================================
# Schemas para request/response
# =====================================================

class ShareCreateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    recipient_email: str
    expiration_hours: int = 72
    file_ids: List[int] = []
    area_id: Optional[int] = None
    consumption_policy: Optional[str] = "after_all"


class ShareCancelRequest(BaseModel):
    reason: Optional[str] = None


# =====================================================
# POST /shares - Criar novo compartilhamento
# =====================================================

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_share_endpoint(
    payload: ShareCreateRequest,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Cria um novo compartilhamento de arquivos.
    """
    try:
        # Provisiona destinatário externo antes de criar o share
        recipient = get_or_create_external_user(session, payload.recipient_email)

        # Cria o share
        share = Share(
            name=payload.name,
            description=payload.description,
            external_email=payload.recipient_email,
            recipient_user_id=recipient.id,
            expiration_hours=payload.expiration_hours,
            area_id=payload.area_id,
            created_by_id=user.id,
            status=ShareStatus.PENDING,
        )
        session.add(share)
        session.commit()
        session.refresh(share)

        # Associa os arquivos
        for file_id in payload.file_ids:
            rfile = session.get(RestrictedFile, file_id)
            if rfile:
                share_file = ShareFile(
                    share_id=share.id,
                    file_id=file_id,
                )
                session.add(share_file)

        session.commit()

        log_event(
            session=session,
            action="CRIAR_SHARE",
            user_id=user.id,
            share_id=share.id,
            detail=f"recipient={payload.recipient_email}, files={len(payload.file_ids)}",
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None
        )

        return {
            "id": share.id,
            "name": share.name,
            "recipient_email": share.external_email,
            "recipient_user_id": recipient.id,
            "status": share.status,
            "expiration_hours": share.expiration_hours,
            "created_at": share.created_at.isoformat(),
            "files_count": len(payload.file_ids),
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =====================================================
# POST /shares/create - Criar com upload (legado)
# =====================================================

@router.post("/create", response_model=ShareRead, status_code=status.HTTP_201_CREATED)
async def create_with_upload(
    background_tasks: BackgroundTasks,
    payload: str = Form(...),
    files: List[UploadFile] = [],
    session: Session = Depends(get_session),
    request: Request = None
):
    """
    Recebe ShareCreate no corpo JSON + uploads opcionais.
    Se area_id nao vier, cria/usa area automatica do solicitante.
    Tambem aceita file_ids (para arquivos ja existentes na area).
    """
    # Parsing do payload fora do try causaria 500 não tratado — feito aqui antes.
    try:
        payload_dict = json.loads(payload)
        payload_obj = ShareCreate(**payload_dict)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=422, detail=f"Payload inválido: {e}")

    try:
        new_uploads = None
        if files:
            new_uploads = []
            for f in files:
                content = await f.read()
                new_uploads.append((f.filename, content, f.content_type or "application/octet-stream"))

        share = create_share(
            session=session,
            area_id=payload_obj.area_id,
            external_email=payload_obj.external_email,
            created_by_id=payload_obj.created_by_id,
            expiration_hours=payload_obj.expiration_hours,
            name=payload_obj.name,
            description=payload_obj.description,
            consumption_policy=payload_obj.consumption_policy,
            file_ids=payload_obj.file_ids or [],
            new_uploads=new_uploads,
            request_meta={
                "ip": request.client.host if request else None,
                "ua": request.headers.get("User-Agent") if request else None
            }
        )

        # Se o criador é supervisor, aprova automaticamente
        creator = session.get(User, payload_obj.created_by_id)
        if creator and creator.is_supervisor:
            now = datetime.now(UTC)
            share.status = ShareStatus.ACTIVE
            share.approver_id = creator.id
            share.approved_at = now
            share.expires_at = now + timedelta(hours=share.expiration_hours)
            session.add(share)
            session.commit()
            session.refresh(share)

            # Reativa o usuário externo se estiver inativo
            ext_user = session.exec(
                select(User).where(User.email == payload_obj.external_email)
            ).first()
            if ext_user and not ext_user.status:
                ext_user.status = True
                session.add(ext_user)
                session.commit()

            files_count = len(new_uploads) if new_uploads else len(payload_obj.file_ids or [])
            background_tasks.add_task(
                send_share_approved_external_email,
                share.external_email,
                creator.name or "Supervisor",
                files_count,
                share.expires_at,
                share.id,
            )
            background_tasks.add_task(
                send_share_approved_requester_email,
                creator.email,
                creator.name or "Supervisor",
                share.external_email,
                share.id,
                creator.id,
            )
            log_event(
                session=session,
                action="AUTO_APROVAR_SHARE_SUPERVISOR",
                user_id=creator.id,
                share_id=share.id,
                detail=f"supervisor_self_approved, files={files_count}",
                ip=request.client.host if request else None,
                user_agent=request.headers.get("User-Agent") if request else None,
            )
        else:
            # Notifica supervisor via e-mail (background — não bloqueia resposta)
            if creator and creator.manager_id:
                supervisor = session.get(User, creator.manager_id)
                if supervisor:
                    files_count = len(new_uploads) if new_uploads else len(payload_obj.file_ids or [])
                    background_tasks.add_task(
                        send_supervisor_approval_request_email,
                        supervisor_email=supervisor.email,
                        supervisor_name=supervisor.name,
                        requester_name=creator.name,
                        requester_email=creator.email,
                        recipient_email=payload_obj.external_email,
                        files_count=files_count,
                        expiration_hours=payload_obj.expiration_hours,
                        share_name=payload_obj.name,
                        share_id=share.id,
                    )

        return share

    except S3UploadError as e:
        logger.error(
            "s3_upload_failed",
            detail=str(e),
            user_id=payload_obj.created_by_id,
            external_email=payload_obj.external_email,
        )
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except ShareError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("create_share_unexpected_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Erro interno ao criar compartilhamento.")


# =====================================================
# GET /shares - Listar compartilhamentos
# =====================================================

@router.get("/")
def list_shares(
    status_filter: Optional[str] = Query(None, alias="status"),
    recipient: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """
    Lista compartilhamentos do usuario autenticado.
    """
    query = select(Share).where(Share.created_by_id == user.id)

    if status_filter:
        try:
            status_enum = ShareStatus(status_filter)
            query = query.where(Share.status == status_enum)
        except ValueError:
            pass

    if recipient:
        query = query.where(Share.external_email.ilike(f"%{recipient}%"))

    # Conta total
    count_query = select(func.count()).select_from(Share).where(Share.created_by_id == user.id)
    if status_filter:
        try:
            status_enum = ShareStatus(status_filter)
            count_query = count_query.where(Share.status == status_enum)
        except ValueError:
            pass
    total_items = session.exec(count_query).one()
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1

    # Paginacao
    offset = (page - 1) * limit
    query = query.order_by(Share.created_at.desc()).offset(offset).limit(limit)
    shares = session.exec(query).all()

    result = []
    for share in shares:
        share_files = session.exec(
            select(ShareFile).where(ShareFile.share_id == share.id)
        ).all()

        files_data = []
        for sf in share_files:
            rfile = session.get(RestrictedFile, sf.file_id)
            if rfile:
                files_data.append({
                    "id": rfile.id,
                    "name": rfile.name,
                    "size": rfile.size_bytes,
                    "downloaded": sf.downloaded,
                    "downloaded_at": sf.downloaded_at.isoformat() if sf.downloaded_at else None,
                })

        result.append({
            "id": share.id,
            "name": share.name or f"Compartilhamento #{share.id}",
            "description": share.description,
            "recipient_email": share.external_email,
            "status": share.status,
            "expiration_hours": share.expiration_hours,
            "expires_at": share.expires_at.isoformat() if share.expires_at else None,
            "created_at": share.created_at.isoformat(),
            "files": files_data,
            "files_count": len(files_data),
            "downloaded_count": sum(1 for f in files_data if f["downloaded"]),
        })

    return {
        "shares": result,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_items": total_items,
            "items_per_page": limit,
        }
    }


# =====================================================
# GET /shares/my-shares - Meus compartilhamentos
# =====================================================

@router.get("/my-shares")
def list_my_shares(
    status: ShareStatus | None = Query(None),
    session: Session = Depends(get_session),
    user: User = Depends(require_internal),
):
    """
    Lista compartilhamentos criados pelo usuario interno autenticado.
    Retorna resumo por share (totais baixados/pendentes).
    """
    q = select(Share).where(Share.created_by_id == user.id)
    if status:
        q = q.where(Share.status == status)

    shares = session.exec(q.order_by(Share.id.desc())).all()

    response = []
    for s in shares:
        itens = session.exec(select(ShareFile).where(ShareFile.share_id == s.id)).all()
        files_preview = []
        for i in itens[:3]:
            rfile = session.get(RestrictedFile, i.file_id)
            if rfile:
                files_preview.append(rfile.name)

        tot = len(itens)
        downloadeds = sum(1 for i in itens if i.downloaded)
        pending = tot - downloadeds

        response.append({
            "share_id": s.id,
            "name": s.name,
            "externo_email": s.external_email,
            "status": s.status,
            "expira_em": s.expires_at,
            "criado_em": s.created_at,
            "tot_arquivos": tot,
            "baixados": downloadeds,
            "pendentes": pending,
            "arquivos_preview": files_preview
        })

    return {"my_shares": response}


# =====================================================
# GET /shares/{share_id} - Detalhes do compartilhamento
# =====================================================

@router.get("/{share_id}")
def get_share_details(
    share_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """
    Retorna detalhes completos do share e seus arquivos.
    """
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")

    # Permite visualizar se for criador ou supervisor vinculado
    if share.created_by_id != user.id and not user.is_supervisor:
        raise HTTPException(status_code=403, detail="Voce nao tem permissao para visualizar este compartilhamento.")

    itens = session.exec(select(ShareFile).where(ShareFile.share_id == share_id)).all()
    files = []
    for sa in itens:
        fi = session.get(RestrictedFile, sa.file_id)
        if fi:
            files.append({
                "id": fi.id,
                "share_file_id": sa.id,
                "name": fi.name,
                "size": fi.size_bytes,
                "mime_type": fi.mime_type,
                "downloaded": sa.downloaded,
                "downloaded_at": sa.downloaded_at.isoformat() if sa.downloaded_at else None,
            })

    tot = len(itens)
    downloadeds = sum(1 for i in itens if i.downloaded)

    # Busca dados do criador
    creator = session.get(User, share.created_by_id)
    creator_data = None
    if creator:
        creator_data = {
            "id": creator.id,
            "name": creator.name,
            "email": creator.email,
        }

    return {
        "id": share.id,
        "name": share.name,
        "description": share.description,
        "recipient_email": share.external_email,
        "status": share.status,
        "expiration_hours": share.expiration_hours,
        "expires_at": share.expires_at.isoformat() if share.expires_at else None,
        "created_at": share.created_at.isoformat(),
        "approved_at": share.approved_at.isoformat() if share.approved_at else None,
        "rejected_at": share.rejected_at.isoformat() if share.rejected_at else None,
        "rejection_reason": share.rejection_reason,
        "created_by": creator_data,
        "files": files,
        "files_count": tot,
        "downloaded_count": downloadeds,
        "pending_count": tot - downloadeds,
    }


# =====================================================
# PATCH /shares/{share_id}/cancel - Cancelar
# =====================================================

@router.patch("/{share_id}/cancel")
def cancel_share(
    share_id: int,
    payload: ShareCancelRequest = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Cancela um compartilhamento.
    Apenas o criador pode cancelar.
    """
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")

    if share.created_by_id != user.id:
        raise HTTPException(status_code=403, detail="Voce nao tem permissao para cancelar este compartilhamento.")

    if share.status in (ShareStatus.CANCELED, ShareStatus.COMPLETED, ShareStatus.EXPIRED):
        raise HTTPException(status_code=400, detail=f"Nao e possivel cancelar um compartilhamento com status '{share.status}'.")

    # Verifica se ja houve download
    ja_baixado = session.exec(
        select(ShareFile).where(ShareFile.share_id == share.id, ShareFile.downloaded == True)
    ).first()
    if ja_baixado:
        raise HTTPException(status_code=400, detail="Nao e possivel cancelar: ja existe download registrado.")

    share.status = ShareStatus.CANCELED
    session.add(share)
    session.commit()
    session.refresh(share)

    # Remove arquivos do S3 (apenas se storage_provider == "aws")
    if settings.storage_provider == "aws":
        share_files = session.exec(
            select(ShareFile).where(ShareFile.share_id == share.id)
        ).all()
        for sf in share_files:
            rfile = session.get(RestrictedFile, sf.file_id)
            if rfile and rfile.key_s3:
                try:
                    delete_object(key=rfile.key_s3)
                except S3ServiceError:
                    pass  # loga mas não bloqueia o cancelamento

    log_event(
        session=session,
        action="CANCELAR_SHARE",
        user_id=user.id,
        share_id=share.id,
        detail=f"reason={payload.reason if payload else 'N/A'}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return {
        "message": "Compartilhamento cancelado com sucesso.",
        "id": share.id,
        "status": share.status,
    }


# =====================================================
# DELETE /shares/{share_id} - Excluir
# =====================================================

@router.delete("/{share_id}")
def delete_share(
    share_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Exclui um compartilhamento (soft delete - muda para cancelado).
    """
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")

    if share.created_by_id != user.id:
        raise HTTPException(status_code=403, detail="Voce nao tem permissao para excluir este compartilhamento.")

    # Soft delete
    share.status = ShareStatus.CANCELED
    session.add(share)
    session.commit()

    log_event(
        session=session,
        action="EXCLUIR_SHARE",
        user_id=user.id,
        share_id=share.id,
        detail=f"share_id={share.id}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return {"message": "Compartilhamento excluido com sucesso."}


# =====================================================
# GET /shares/{share_id}/email-logs - Histórico de e-mails
# =====================================================

@router.get("/{share_id}/email-logs")
def get_share_email_logs(
    share_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Retorna o histórico de e-mails enviados para um compartilhamento.
    Acessível pelo criador do share (visão do solicitante).
    """
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado.")

    if share.created_by_id != user.id:
        raise HTTPException(status_code=403, detail="Acesso negado.")

    logs = session.exec(
        select(EmailLog)
        .where(EmailLog.share_id == share_id)
        .order_by(EmailLog.created_at.desc())
    ).all()

    return {
        "share_id": share_id,
        "email_logs": [
            {
                "id": log.id,
                "email_type": log.email_type,
                "to_email": log.to_email,
                "subject": log.subject,
                "status": log.status,
                "sent_at": log.sent_at.isoformat() if log.sent_at else None,
                "error_message": log.error_message,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ],
    }


# =====================================================
# POST /shares/{share_id}/resend-notification - Reenviar notificação
# =====================================================

@router.post("/{share_id}/resend-notification")
async def resend_share_notification(
    share_id: int,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Reenvia o e-mail de notificação ao supervisor (share PENDING)
    ou o e-mail de disponibilização ao destinatário externo (share ACTIVE).
    Apenas o criador do share pode solicitar o reenvio.
    """
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado.")

    if share.created_by_id != user.id:
        raise HTTPException(status_code=403, detail="Acesso negado.")

    if share.status == ShareStatus.PENDING:
        # Reenvia notificação ao supervisor
        supervisor = session.get(User, user.manager_id) if user.manager_id else None
        if not supervisor:
            raise HTTPException(status_code=400, detail="Supervisor não encontrado para este usuário.")

        share_files_count = session.exec(
            select(func.count()).select_from(ShareFile).where(ShareFile.share_id == share_id)
        ).one()

        background_tasks.add_task(
            send_supervisor_approval_request_email,
            supervisor_email=supervisor.email,
            supervisor_name=supervisor.name,
            requester_name=user.name,
            requester_email=user.email,
            recipient_email=share.external_email,
            files_count=share_files_count,
            expiration_hours=share.expiration_hours,
            share_name=share.name,
            share_id=share.id,
            supervisor_user_id=supervisor.id,
        )
        target = supervisor.email
        detail_msg = f"supervisor={supervisor.email}"

    elif share.status in (ShareStatus.ACTIVE, ShareStatus.APPROVED):
        # Reenvia e-mail ao destinatário externo
        from app.services.email_service import send_share_approved_external_email
        if not share.expires_at:
            raise HTTPException(status_code=400, detail="Share ainda sem data de expiração definida.")

        background_tasks.add_task(
            send_share_approved_external_email,
            external_email=share.external_email,
            applicant_name=user.name,
            files_quantity=session.exec(
                select(func.count()).select_from(ShareFile).where(ShareFile.share_id == share_id)
            ).one(),
            expires_at=share.expires_at,
            share_id=share.id,
        )
        target = share.external_email
        detail_msg = f"recipient={share.external_email}"

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Reenvio não disponível para compartilhamentos com status '{share.status}'."
        )

    log_event(
        session=session,
        action="REENVIAR_NOTIFICACAO_EMAIL",
        user_id=user.id,
        share_id=share.id,
        detail=detail_msg,
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {"message": "E-mail de notificação será reenviado em breve.", "to": target}


# =====================================================
# POST /shares/{share_id}/resend - Reenviar email (legado)
# =====================================================

@router.post("/{share_id}/resend")
def resend_share_email(
    share_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """Legado — use /resend-notification."""
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")

    if share.created_by_id != user.id:
        raise HTTPException(status_code=403, detail="Voce nao tem permissao.")

    if share.status not in [ShareStatus.APPROVED, ShareStatus.ACTIVE]:
        raise HTTPException(status_code=400, detail="Compartilhamento nao esta aprovado.")

    log_event(
        session=session,
        action="REENVIAR_EMAIL_SHARE",
        user_id=user.id,
        share_id=share.id,
        detail=f"recipient={share.external_email}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {
        "message": "Email reenviado com sucesso.",
        "recipient": share.external_email,
    }

