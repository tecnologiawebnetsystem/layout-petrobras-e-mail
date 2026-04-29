from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks
from sqlmodel import Session, select, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta, UTC

from app.db.session import get_session
from app.utils.authz import require_supervisor, get_current_user
from app.models.area import SharedArea
from app.models.areasupervisors import AreaSupervisor
from app.models.share import Share, ShareStatus
from app.models.user import User, TypeUser
from app.models.share_file import ShareFile
from app.models.restricted_file import RestrictedFile
from app.models.support_registration import SupportRegistration
from app.services.audit_service import log_event
from app.services.email_service import (
    send_share_approved_external_email,
    send_share_approved_requester_email
)

router = APIRouter(prefix="/supervisor", tags=["Supervisor"])


def _horas_pendente(share: Share) -> Optional[float]:
    """Retorna quantas horas o share esta pendente desde a criacao."""
    if share.status != ShareStatus.PENDING:
        return None
    delta = datetime.now(UTC) - share.created_at.replace(tzinfo=UTC) if share.created_at.tzinfo is None else datetime.now(UTC) - share.created_at
    return round(delta.total_seconds() / 3600, 1)


def _get_chamado_info(session: Session, share: Share) -> Optional[dict]:
    """Retorna dados do chamado do suporte vinculado ao share, se existir."""
    if not share.support_registration_id:
        return None
    reg = session.get(SupportRegistration, share.support_registration_id)
    if not reg:
        return None
    return {
        "id": reg.id,
        "numero_solicitacao": reg.request_number,
        "email_solicitante": reg.requester_email,
        "email_usuario_externo": reg.external_user_email,
        "cadastrado_por": reg.registered_by_name,
        "status": reg.status,
    }


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
    sender_email: Optional[str] = Query(None, description="Filtrar por e-mail do remetente"),
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

    # Filtra supervisionados por e-mail se fornecido
    if sender_email:
        supervised_users = [
            uid for uid in supervised_users
            if session.get(User, uid) and sender_email.lower() in (session.get(User, uid).email or "").lower()
        ]

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
                size_mb = rfile.size_bytes / (1024 * 1024) if rfile.size_bytes else 0
                files_data.append({
                    "name": rfile.name,
                    "size": f"{size_mb:.2f} MB",
                    "type": rfile.mime_type or "unknown",
                })
        
        result.append({
            "id": share.id,
            "name": share.name or f"Compartilhamento #{share.id}",
            "recipient_email": share.external_email,
            "description": share.description,
            "sender": sender_data,
            "files": files_data,
            "expiration_hours": share.expiration_hours,
            "created_at": share.created_at.isoformat(),
            "horas_pendente": _horas_pendente(share),
            "chamado": _get_chamado_info(session, share),
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
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")

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
    
    # Busca dados para emails
    applicant = session.get(User, share.created_by_id)
    share_files = session.exec(select(ShareFile).where(ShareFile.share_id == share.id)).all()
    files_count = len(share_files)
    
    # Envia emails em background
    if applicant:
        background_tasks.add_task(
            send_share_approved_external_email,
            share.external_email,
            applicant.name or "Usuario Interno",
            files_count,
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
def reject_file(
    file_id: int,
    payload: RejectRequest,
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
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")

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
    
    log_event(
        session=session,
        action="REJEITAR_SHARE",
        user_id=user.id,
        share_id=share.id,
        detail=f"reason={payload.reason[:100]}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
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
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")

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
        raise HTTPException(status_code=400, detail="Extensao maxima e de 72 horas.")
    
    previous_expiration = share.expires_at
    new_expiration = (share.expires_at or datetime.now(UTC)) + timedelta(hours=payload.additional_hours)
    
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
        raise HTTPException(status_code=403, detail="Supervisor nao vinculado a esta area.")

    # shares da area
    shares = session.exec(select(Share).where(Share.area_id == area_id)).all()
    data = []
    for share in shares:
        items = session.exec(select(ShareFile).where(ShareFile.share_id == share.id)).all()
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
            share.expires_at = datetime.now(UTC) + timedelta(hours=share.expiration_hours)
        session.add(share)
        session.commit()
        session.refresh(share)

    applicant = session.get(User, share.created_by_id)
    if not applicant:
        raise HTTPException(status_code=400, detail="Solicitante nao encontrado.")

    itens = session.exec(select(ShareFile).where(ShareFile.share_id == share.id)).all()
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
    status: Optional[str] = Query(None, description="Filtro: pending | active | rejected"),
    sender_email: Optional[str] = Query(None, description="Filtrar por e-mail do remetente"),
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

    # Filtro por e-mail do remetente
    if sender_email:
        supervised_users = [
            uid for uid in supervised_users
            if session.get(User, uid) and sender_email.lower() in (session.get(User, uid).email or "").lower()
        ]

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
                size_mb = rfile.size_bytes / (1024 * 1024) if rfile.size_bytes else 0
                files_data.append({
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
            "horas_pendente": _horas_pendente(share),
            "chamado": _get_chamado_info(session, share),
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
