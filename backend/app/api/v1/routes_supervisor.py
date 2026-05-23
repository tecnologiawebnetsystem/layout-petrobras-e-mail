from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta, UTC
import zipfile as _zipfile
import re
import unicodedata
import tempfile
import shutil

from app.db.session import get_session
from app.utils.authz import require_supervisor, get_current_user
from app.services.token_service import deactivate_external_if_no_active_share
from app.models.area import SharedArea
from app.models.areasupervisors import AreaSupervisor
from app.models.share import Share, ShareStatus
from app.models.user import User, TypeUser
from app.models.share_file import ShareFile
from app.models.restricted_file import RestrictedFile
from app.models.email_log import EmailLog
from app.services.audit_service import log_event
from app.services.s3_service import delete_object, S3ServiceError, get_s3_object_stream, generate_presigned_get, S3ObjectNotFound
from app.core.config import settings
from app.services.email_service import (
    send_share_approved_external_email,
    send_share_approved_requester_email,
    send_share_rejected_requester_email,
    send_supervisor_approval_request_email,
)
import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/supervisor", tags=["Supervisor"])


class ApproveRequest(BaseModel):
    message: Optional[str] = None


class RejectRequest(BaseModel):
    reason: str


class ExtendRequest(BaseModel):
    additional_hours: int
    reason: str


# =====================================================
# GET /supervisor/pending - Lista pendentes
# =====================================================

@router.get("/pending")
def get_pending_files(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    user: User = Depends(require_supervisor),
    request: Request = None,
):
    """
    Lista compartilhamentos pendentes de aprovaçao.
    Retorna apenas os shares criados por usuários que têm este supervisor como gestor
    (manager_id == supervisor.id), refletindo o vínculo declarado no chamado ServiceNow.
    """
    # Busca IDs dos supervisionados deste supervisor
    supervised_users = session.exec(
        select(User.id).where(User.manager_id == user.id)
    ).all()

    if not supervised_users:
        return {
            "files": [],
            "pagination": {"current_page": page, "total_pages": 1, "total_items": 0},
        }

    # Query base - shares pendentes dos supervisionados
    query = select(Share).where(
        Share.status == ShareStatus.PENDING,
        Share.created_by_id.in_(supervised_users),
    )

    # Conta total
    count_query = select(func.count()).select_from(Share).where(
        Share.status == ShareStatus.PENDING,
        Share.created_by_id.in_(supervised_users),
    )
    total_items = session.exec(count_query).one()
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1

    # Paginacao
    offset = (page - 1) * limit
    query = query.order_by(Share.created_at.desc()).offset(offset).limit(limit)
    shares = session.exec(query).all()

    result = []
    for share in shares:
        # Busca remetente
        sender = session.get(User, share.created_by_id)
        sender_data = {
            "id": sender.id if sender else None,
            "name": sender.name if sender else "Desconhecido",
            "email": sender.email if sender else None,
            "department": sender.department if sender else None,
            "employee_id": sender.employee_id if sender else None,
        }

        # Busca arquivos do share
        share_files = session.exec(
            select(ShareFile).where(ShareFile.share_id == share.id)
        ).all()

        files_data = []
        for sf in share_files:
            rfile = session.get(RestrictedFile, sf.file_id)
            if rfile:
                # Formata tamanho
                size_mb = rfile.size_bytes / \
                    (1024 * 1024) if rfile.size_bytes else 0
                files_data.append({
                    "name": rfile.name,
                    "size": f"{size_mb:.2f} MB",
                    "type": rfile.mime_type or "unknown",
                })

        # Último e-mail de notificação enviado ao supervisor para este share
        last_notification = session.exec(
            select(EmailLog)
            .where(EmailLog.share_id == share.id, EmailLog.email_type == "approval_request")
            .order_by(EmailLog.created_at.desc())
        ).first()

        result.append({
            "id": share.id,
            "name": share.name or f"Compartilhamento #{share.id}",
            "recipient_email": share.external_email,
            "description": share.description,
            "sender": sender_data,
            "files": files_data,
            "expiration_hours": share.expiration_hours,
            "created_at": share.created_at.isoformat(),
            "notification_email": {
                "status": last_notification.status if last_notification else None,
                "sent_at": last_notification.sent_at.isoformat() if last_notification and last_notification.sent_at else None,
                "error_message": last_notification.error_message if last_notification else None,
            },
            "workflow": {
                "current_step": 2,
                "total_steps": 3,
                "steps": [
                    {"name": "Criacao", "status": "completed"},
                    {"name": "Aprovacao", "status": "current"},
                    {"name": "Disponibilizacao", "status": "pending"},
                ]
            }
        })

    log_event(
        session=session,
        action="VER_PENDENTES",
        user_id=user.id,
        detail=f"page={page}, total={total_items}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return {
        "files": result,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_items": total_items,
        }
    }


# =====================================================
# POST /supervisor/approve/{file_id} - Aprovar
# =====================================================

@router.post("/approve/{file_id}")
async def approve_file(
    file_id: int,
    payload: ApproveRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    user: User = Depends(require_supervisor),
    request: Request = None,
):
    """
    Aprova um compartilhamento pendente.
    O supervisor só pode aprovar shares criados pelos seus supervisionados.
    """
    share = session.get(Share, file_id)
    if not share:
        raise HTTPException(
            status_code=404, detail="Compartilhamento nao encontrado.")

    # Verifica autoridade: o criador do share deve ter este supervisor como gestor
    creator = session.get(User, share.created_by_id)
    if not creator or creator.manager_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="Acesso negado: este compartilhamento nao pertence a um de seus supervisionados.",
        )

    if share.status != ShareStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Compartilhamento nao esta pendente. Status atual: {share.status}"
        )

    # Atualiza status
    now = datetime.now(UTC)
    share.status = ShareStatus.ACTIVE
    share.approver_id = user.id
    share.approved_at = now
    share.approval_comments = payload.message
    share.expires_at = now + timedelta(hours=share.expiration_hours)

    session.add(share)
    session.commit()
    session.refresh(share)

    # Reativa o usuário externo se estiver inativo (pode ter sido desativado após downloads anteriores)
    if share.recipient_user_id:
        ext_user = session.get(User, share.recipient_user_id)
        if ext_user and not ext_user.status:
            ext_user.status = True
            session.add(ext_user)
            session.commit()
            log_event(
                session=session,
                action="REATIVAR_USUARIO_EXTERNO",
                user_id=ext_user.id,
                share_id=share.id,
                detail=f"reativado_por_aprovacao_share={share.id}",
                ip=request.client.host if request else None,
                user_agent=request.headers.get("User-Agent") if request else None,
            )

    # Busca dados para emails
    applicant = session.get(User, share.created_by_id)
    share_files = session.exec(select(ShareFile).where(
        ShareFile.share_id == share.id)).all()
    files_count = len(share_files)

    # Envia emails em background
    if applicant:
        background_tasks.add_task(
            send_share_approved_external_email,
            share.external_email,
            applicant.name or "Usuario Interno",
            files_count,
            share.expires_at,
            share.id,
        )
        background_tasks.add_task(
            send_share_approved_requester_email,
            applicant.email,
            applicant.name or "Usuario Interno",
            share.external_email,
            share.id,
            applicant.id,
        )

    log_event(
        session=session,
        action="APROVAR_SHARE",
        user_id=user.id,
        share_id=share.id,
        detail=f"approved_by={user.email}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return {
        "file_id": share.id,
        "status": share.status,
        "approved_at": share.approved_at.isoformat(),
        "approved_by": user.name,
        "expires_at": share.expires_at.isoformat(),
        "otp_sent": True,
        "recipient_email": share.external_email,
    }


# =====================================================
# POST /supervisor/reject/{file_id} - Rejeitar
# =====================================================

@router.post("/reject/{file_id}")
async def reject_file(
    file_id: int,
    payload: RejectRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    user: User = Depends(require_supervisor),
    request: Request = None,
):
    """
    Rejeita um compartilhamento pendente.
    O supervisor só pode rejeitar shares criados pelos seus supervisionados.
    """
    share = session.get(Share, file_id)
    if not share:
        raise HTTPException(
            status_code=404, detail="Compartilhamento nao encontrado.")

    # Verifica autoridade
    creator = session.get(User, share.created_by_id)
    if not creator or creator.manager_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="Acesso negado: este compartilhamento nao pertence a um de seus supervisionados.",
        )

    if share.status != ShareStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Compartilhamento nao esta pendente. Status atual: {share.status}"
        )

    # Atualiza status
    share.status = ShareStatus.REJECTED
    share.approver_id = user.id
    share.rejected_at = datetime.now(UTC)
    share.rejection_reason = payload.reason

    session.add(share)
    session.commit()
    session.refresh(share)

    # Exclui arquivos do S3 (não bloqueia a operação em caso de falha)
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
                    pass

    # Notifica o solicitante sobre a rejeição
    if creator:
        background_tasks.add_task(
            send_share_rejected_requester_email,
            requester_email=creator.email,
            requester_name=creator.name or "Usuário Interno",
            supervisor_name=user.name or "Supervisor",
            share_name=share.name,
            share_id=share.id,
            rejection_reason=payload.reason,
            requester_user_id=creator.id,
        )

    log_event(
        session=session,
        action="REJEITAR_SHARE",
        user_id=user.id,
        share_id=share.id,
        detail=f"reason={payload.reason[:100]}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    # Após rejeição, verifica se o destinatário externo tem outro share ativo.
    # Se não tiver, desativa o usuário para revogar qualquer acesso remanescente.
    if share.recipient_user_id:
        recipient = session.get(User, share.recipient_user_id)
    else:
        recipient = session.exec(
            select(User).where(User.email == share.external_email)
        ).first()
    if recipient:
        deactivate_external_if_no_active_share(
            session, recipient,
            {"ip": request.client.host if request else None,
             "ua": request.headers.get("User-Agent") if request else None},
        )

    return {
        "file_id": share.id,
        "status": share.status,
        "rejected_at": share.rejected_at.isoformat(),
        "rejected_by": user.name,
        "reason": share.rejection_reason,
    }


# =====================================================
# PUT /supervisor/extend/{file_id} - Estender expiracao
# =====================================================

@router.put("/extend/{file_id}")
def extend_expiration(
    file_id: int,
    payload: ExtendRequest,
    session: Session = Depends(get_session),
    user: User = Depends(require_supervisor),
    request: Request = None,
):
    """
    Estende o tempo de expiracao de um compartilhamento.
    O supervisor só pode estender shares dos seus supervisionados.
    """
    share = session.get(Share, file_id)
    if not share:
        raise HTTPException(
            status_code=404, detail="Compartilhamento nao encontrado.")

    # Verifica autoridade
    creator = session.get(User, share.created_by_id)
    if not creator or creator.manager_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="Acesso negado: este compartilhamento nao pertence a um de seus supervisionados.",
        )

    if share.status not in [ShareStatus.APPROVED, ShareStatus.ACTIVE]:
        raise HTTPException(
            status_code=400,
            detail="Somente compartilhamentos aprovados podem ter o prazo estendido."
        )

    if payload.additional_hours > 72:
        raise HTTPException(
            status_code=400, detail="Extensao maxima e de 72 horas.")

    previous_expiration = share.expires_at
    new_expiration = (share.expires_at or datetime.now(UTC)) + \
        timedelta(hours=payload.additional_hours)

    share.expires_at = new_expiration
    share.expiration_hours = share.expiration_hours + payload.additional_hours

    session.add(share)
    session.commit()
    session.refresh(share)

    log_event(
        session=session,
        action="ESTENDER_EXPIRACAO",
        user_id=user.id,
        share_id=share.id,
        detail=f"additional_hours={payload.additional_hours}, reason={payload.reason[:100]}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return {
        "file_id": share.id,
        "previous_expiration": previous_expiration.isoformat() if previous_expiration else None,
        "new_expiration": new_expiration.isoformat(),
        "additional_hours": payload.additional_hours,
        "extended_by": user.name,
        "reason": payload.reason,
    }


# =====================================================
# Endpoints de relatorio (legado)
# =====================================================

@router.get("/areas/{area_id}/report")
def relatorio_area(
    area_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(require_supervisor),
    request: Request = None,
):
    """
    Gera relatório de compartilhamentos de uma área específica.

    Requer que o supervisor esteja vinculado à área (tabela AreaSupervisor).
    Retorna todos os shares da área com contagem de arquivos, downloads e pendentes.
    Registra o evento VER_RELATORIO_AREA na auditoria.
    """
    area = session.get(SharedArea, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area nao encontrada.")

    # valida que o supervisor esta vinculado a esta area
    link = session.exec(select(AreaSupervisor).where(
        AreaSupervisor.area_id == area_id,
        AreaSupervisor.supervisor_id == user.id
    )).first()
    if not link:
        raise HTTPException(
            status_code=403, detail="Supervisor nao vinculado a esta area.")

    # shares da area
    shares = session.exec(select(Share).where(Share.area_id == area_id)).all()
    data = []
    for share in shares:
        items = session.exec(select(ShareFile).where(
            ShareFile.share_id == share.id)).all()
        total = len(items)
        downloadeds = sum(1 for i in items if i.downloaded)
        pending = total - downloadeds
        data.append({
            "share_id": share.id,
            "externo_email": share.external_email,
            "criado_em": share.created_at,
            "expires_at": share.expires_at,
            "status": share.status,
            "tot_arquivos": total,
            "baixados": downloadeds,
            "pendentes": pending
        })

    log_event(
        session=session,
        action="VER_RELATORIO_AREA",
        user_id=user.id,
        detail=f"area_id={area_id}, area_name={area.name}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return {"area_id": area_id, "nome_area": area.name, "shares": data}


# =====================================================
# Endpoint legado para compatibilidade
# =====================================================

@router.post("/shares/{share_id}/approve")
async def approve_share_legacy(
    share_id: int,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    user: User = Depends(require_supervisor),
    request: Request = None,
):
    """Endpoint legado - redireciona para novo endpoint."""
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Share nao encontrado.")

    creator = session.get(User, share.created_by_id)
    if not creator or creator.manager_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="Acesso negado: este compartilhamento nao pertence a um de seus supervisionados.",
        )

    if share.status in [ShareStatus.ACTIVE, ShareStatus.APPROVED]:
        pass
    else:
        share.status = ShareStatus.ACTIVE
        share.approved_at = datetime.now(UTC)
        share.approver_id = user.id
        if not share.expires_at:
            share.expires_at = datetime.now(
                UTC) + timedelta(hours=share.expiration_hours)
        session.add(share)
        session.commit()
        session.refresh(share)

    applicant = session.get(User, share.created_by_id)
    if not applicant:
        raise HTTPException(
            status_code=400, detail="Solicitante nao encontrado.")

    itens = session.exec(select(ShareFile).where(
        ShareFile.share_id == share.id)).all()
    files_quantity = len(itens)

    background_tasks.add_task(
        send_share_approved_external_email,
        share.external_email,
        applicant.name or "Usuario Interno",
        files_quantity,
        share.expires_at
    )
    background_tasks.add_task(
        send_share_approved_requester_email,
        applicant.email,
        applicant.name or "Usuario Interno",
        share.external_email,
        share.id
    )

    log_event(
        session=session,
        action="APROVAR_SHARE_LEGACY",
        user_id=user.id,
        share_id=share.id,
        detail=f"approved_by={user.email}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return {"status": "ok", "share_id": share.id, "status_atual": share.status}


# =====================================================
# GET /supervisor/shares - Lista todos os shares do supervisor
# =====================================================

@router.get("/shares")
def get_supervisor_shares(
    status: Optional[str] = Query(
        None, description="Filtro: pending | active | rejected"),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=200),
    session: Session = Depends(get_session),
    user: User = Depends(require_supervisor),
    request: Request = None,
):
    """
    Lista todos os compartilhamentos dos supervisionados deste supervisor.
    Suporta filtro por status. Sem filtro → retorna todos (pending + active + rejected).
    """
    supervised_users = session.exec(
        select(User.id).where(User.manager_id == user.id)
    ).all()

    if not supervised_users:
        return {
            "files": [],
            "pagination": {"current_page": page, "total_pages": 1, "total_items": 0},
        }

    status_map = {
        "pending": ShareStatus.PENDING,
        "active": ShareStatus.ACTIVE,
        "approved": ShareStatus.ACTIVE,
        "rejected": ShareStatus.REJECTED,
    }

    base_condition = Share.created_by_id.in_(supervised_users)
    status_condition = None
    if status and status.lower() in status_map:
        status_condition = Share.status == status_map[status.lower()]

    count_query = select(func.count()).select_from(Share).where(base_condition)
    if status_condition is not None:
        count_query = count_query.where(status_condition)
    total_items = session.exec(count_query).one()
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1

    offset = (page - 1) * limit
    query = select(Share).where(base_condition)
    if status_condition is not None:
        query = query.where(status_condition)
    query = query.order_by(Share.created_at.desc()).offset(offset).limit(limit)
    shares = session.exec(query).all()

    result = []
    for share in shares:
        sender = session.get(User, share.created_by_id)
        sender_data = {
            "id": sender.id if sender else None,
            "name": sender.name if sender else "Desconhecido",
            "email": sender.email if sender else None,
            "department": sender.department if sender else None,
            "employee_id": sender.employee_id if sender else None,
        }

        share_files = session.exec(
            select(ShareFile).where(ShareFile.share_id == share.id)
        ).all()
        files_data = []
        for sf in share_files:
            rfile = session.get(RestrictedFile, sf.file_id)
            if rfile:
                size_mb = rfile.size_bytes / \
                    (1024 * 1024) if rfile.size_bytes else 0
                files_data.append({
                    "share_file_id": sf.id,
                    "file_id": rfile.id,
                    "name": rfile.name,
                    "size": f"{size_mb:.2f} MB",
                    "type": rfile.mime_type or "unknown",
                })

        if share.status == ShareStatus.PENDING:
            workflow_step, steps = 2, [
                {"name": "Criacao", "status": "completed"},
                {"name": "Aprovacao", "status": "current"},
                {"name": "Disponibilizacao", "status": "pending"},
            ]
        elif share.status == ShareStatus.ACTIVE:
            workflow_step, steps = 3, [
                {"name": "Criacao", "status": "completed"},
                {"name": "Aprovacao", "status": "completed"},
                {"name": "Disponibilizacao", "status": "completed"},
            ]
        else:
            workflow_step, steps = 2, [
                {"name": "Criacao", "status": "completed"},
                {"name": "Aprovacao", "status": "failed"},
                {"name": "Disponibilizacao", "status": "pending"},
            ]

        result.append({
            "id": share.id,
            "name": share.name or f"Compartilhamento #{share.id}",
            "status": share.status,
            "recipient_email": share.external_email,
            "description": share.description,
            "sender": sender_data,
            "files": files_data,
            "expiration_hours": share.expiration_hours,
            "created_at": share.created_at.isoformat(),
            "approved_at": share.approved_at.isoformat() if share.approved_at else None,
            "rejected_at": share.rejected_at.isoformat() if hasattr(share, "rejected_at") and share.rejected_at else None,
            "rejection_reason": share.rejection_reason if hasattr(share, "rejection_reason") else None,
            "expires_at": share.expires_at.isoformat() if share.expires_at else None,
            "workflow": {
                "current_step": workflow_step,
                "total_steps": 3,
                "steps": steps,
            },
        })

    return {
        "files": result,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_items": total_items,
        },
    }


# =====================================================
# GET /supervisor/shares/{share_id}/email-logs
# =====================================================

@router.get("/shares/{share_id}/email-logs")
def get_share_email_logs_supervisor(
    share_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(require_supervisor),
    request: Request = None,
):
    """
    Retorna o histórico de e-mails de um share da visão do supervisor.
    Valida que o share pertence a um dos supervisionados.
    """
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(
            status_code=404, detail="Compartilhamento não encontrado.")

    creator = session.get(User, share.created_by_id)
    if not creator or creator.manager_id != user.id:
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
# POST /supervisor/shares/{share_id}/resend-notification
# =====================================================

@router.post("/shares/{share_id}/resend-notification")
async def resend_approval_notification(
    share_id: int,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    user: User = Depends(require_supervisor),
    request: Request = None,
):
    """
    Reenvia o e-mail de aprovação/rejeição ao solicitante.
    Útil quando o e-mail original falhou ou o solicitante não recebeu.
    """
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(
            status_code=404, detail="Compartilhamento não encontrado.")

    creator = session.get(User, share.created_by_id)
    if not creator or creator.manager_id != user.id:
        raise HTTPException(status_code=403, detail="Acesso negado.")

    if share.status == ShareStatus.ACTIVE:
        if not share.expires_at:
            raise HTTPException(
                status_code=400, detail="Share sem data de expiração.")
        share_files_count = session.exec(
            select(func.count()).select_from(ShareFile).where(
                ShareFile.share_id == share_id)
        ).one()
        background_tasks.add_task(
            send_share_approved_requester_email,
            creator.email,
            creator.name or "Usuário",
            share.external_email,
            share.id,
            creator.id,
        )
        background_tasks.add_task(
            send_share_approved_external_email,
            share.external_email,
            creator.name or "Usuário",
            share_files_count,
            share.expires_at,
            share.id,
        )
        target = f"{creator.email} e {share.external_email}"

    elif share.status == ShareStatus.REJECTED:
        background_tasks.add_task(
            send_share_rejected_requester_email,
            requester_email=creator.email,
            requester_name=creator.name or "Usuário",
            supervisor_name=user.name or "Supervisor",
            share_name=share.name,
            share_id=share.id,
            rejection_reason=share.rejection_reason or "Não informado",
            requester_user_id=creator.id,
        )
        target = creator.email

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Reenvio disponível apenas para shares aprovados ou rejeitados. Status atual: {share.status}"
        )

    log_event(
        session=session,
        action="SUPERVISOR_REENVIAR_EMAIL",
        user_id=user.id,
        share_id=share.id,
        detail=f"to={target}, share_status={share.status}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {"message": "E-mail será reenviado em breve.", "to": target}


# =====================================================
# DELETE /supervisor/shares/{share_id}/files/{share_file_id}
# Remove um arquivo individual do share (PENDING) e exclui do S3.
# Se todos os arquivos forem removidos, o share é automaticamente rejeitado.
# =====================================================

@router.delete("/shares/{share_id}/files/{share_file_id}")
async def remove_share_file(
    share_id: int,
    share_file_id: int,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    user: User = Depends(require_supervisor),
    request: Request = None,
):
    """
    Remove um arquivo individual de um share PENDENTE.
    - Deleta o objeto do S3.
    - Remove o registro ShareFile do banco.
    - Se não sobrar nenhum arquivo → rejeita o share inteiro (status REJECTED)
      e notifica o solicitante por e-mail.
    """
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(
            status_code=404, detail="Compartilhamento não encontrado.")

    creator = session.get(User, share.created_by_id)
    if not creator or creator.manager_id != user.id:
        raise HTTPException(status_code=403, detail="Acesso negado.")

    if share.status != ShareStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Apenas compartilhamentos pendentes permitem remoção individual. Status atual: {share.status}",
        )

    sf = session.get(ShareFile, share_file_id)
    if not sf or sf.share_id != share_id:
        raise HTTPException(
            status_code=404, detail="Arquivo não encontrado neste compartilhamento.")

    # Exclui do S3 e remove o registro ShareFile (tabela junção)
    rfile = session.get(RestrictedFile, sf.file_id)
    if not rfile:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")

    if settings.storage_provider == "aws" and rfile.key_s3:
        try:
            delete_object(key=rfile.key_s3)
        except S3ServiceError:
            pass

    # Remove a associação share ↔ arquivo (mantém RestrictedFile para auditoria)
    session.delete(sf)
    session.commit()

    log_event(
        session=session,
        action="REMOVER_ARQUIVO_SHARE",
        user_id=user.id,
        share_id=share.id,
        detail=f"share_file_id={share_file_id}, file_name={rfile.name}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    # Conta arquivos ainda vinculados ao share
    remaining = session.exec(
        select(func.count()).select_from(ShareFile).where(ShareFile.share_id == share_id)
    ).one()

    auto_rejected = False
    if remaining == 0:
        share.status = ShareStatus.REJECTED
        share.approver_id = user.id
        share.rejected_at = datetime.now(UTC)
        share.rejection_reason = "Todos os arquivos foram removidos pelo supervisor."
        session.add(share)
        session.commit()
        session.refresh(share)
        auto_rejected = True

        if creator:
            background_tasks.add_task(
                send_share_rejected_requester_email,
                requester_email=creator.email,
                requester_name=creator.name or "Usuário Interno",
                supervisor_name=user.name or "Supervisor",
                share_name=share.name,
                share_id=share.id,
                rejection_reason="Todos os arquivos foram removidos pelo supervisor.",
                requester_user_id=creator.id,
            )

        log_event(
            session=session,
            action="REJEITAR_SHARE_AUTO",
            user_id=user.id,
            share_id=share.id,
            detail="Auto-rejeitado: nenhum arquivo restante",
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None,
        )

    return {
        "message": "Arquivo removido com sucesso.",
        "share_file_id": share_file_id,
        "remaining_files": remaining,
        "share_auto_rejected": auto_rejected,
    }


def sanitize_filename(filename: str) -> str:
    normalized = unicodedata.normalize("NFKD", filename)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_name = ascii_name.replace(" ", "_")
    ascii_name = re.sub(r'[^A-Za-z0-9._-]', '', ascii_name)

    return ascii_name[:50]

# =====================================================
# GET /supervisor/shares/{share_id}/download-zip
# Baixa todos os arquivos do share em um único ZIP (apenas PENDING).
# =====================================================


@router.get("/shares/{share_id}/download-zip")
def download_share_zip(
    share_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(require_supervisor),
    request: Request = None,
):
    """
    Gera e transmite um arquivo ZIP com todos os arquivos do share.
    Disponível apenas enquanto o share está PENDENTE (antes da decisão).
    Requer STORAGE_PROVIDER=aws.
    """
    if settings.storage_provider != "aws":
        raise HTTPException(
            status_code=501, detail="Download disponível apenas com storage AWS S3.")

    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(
            status_code=404, detail="Compartilhamento não encontrado.")

    creator = session.get(User, share.created_by_id)
    if not creator or creator.manager_id != user.id:
        raise HTTPException(status_code=403, detail="Acesso negado.")

    if share.status != ShareStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="O download de arquivos está disponível apenas enquanto o compartilhamento está pendente.",
        )

    share_files = session.exec(select(ShareFile).where(
        ShareFile.share_id == share_id)).all()
    if not share_files:
        raise HTTPException(
            status_code=404, detail="Nenhum arquivo encontrado neste compartilhamento.")

    def generate_zip():

        with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as temp_zip:

            with _zipfile.ZipFile(
                temp_zip,
                mode="w",
                compression=_zipfile.ZIP_DEFLATED,
            ) as zf:

                for sf in share_files:

                    rfile = session.get(RestrictedFile, sf.file_id)

                    if not rfile or not rfile.key_s3:
                        continue

                    try:
                        body, _ = get_s3_object_stream(
                            key=rfile.key_s3
                        )
                        with zf.open(rfile.name, "w") as zip_file:
                            shutil.copyfileobj(body, zip_file)

                    except Exception:
                        logger.exception(
                            f"Erro ao adicionar arquivo {rfile.name} ao ZIP"
                        )

            temp_zip.seek(0)

            while chunk := temp_zip.read(1024 * 1024):
                yield chunk

    share_name_safe = sanitize_filename(share.name or f"share-{share_id}")

    log_event(
        session=session,
        action="SUPERVISOR_DOWNLOAD_ZIP",
        user_id=user.id,
        share_id=share.id,
        detail=f"files={len(share_files)}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return StreamingResponse(
        generate_zip(),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{share_name_safe}.zip"',
        },
    )
