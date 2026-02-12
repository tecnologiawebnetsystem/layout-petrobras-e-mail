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
from app.services.audit_service import log_event
from app.services.email_service import (
    send_share_approved_external_email,
    send_share_approved_requester_email
)

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
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Lista todos os compartilhamentos pendentes de aprovacao.
    Para supervisores, mostra todos os pendentes de suas areas.
    """
    # Query base - shares pendentes
    query = select(Share).where(Share.status == ShareStatus.PENDING)
    
    # Conta total
    count_query = select(func.count()).select_from(Share).where(Share.status == ShareStatus.PENDING)
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
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Aprova um compartilhamento pendente.
    """
    share = session.get(Share, file_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")
    
    if share.status != ShareStatus.PENDING:
        raise HTTPException(
            status_code=400, 
            detail=f"Compartilhamento nao esta pendente. Status atual: {share.status}"
        )
    
    # Atualiza status
    now = datetime.now(UTC)
    share.status = ShareStatus.APPROVED
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
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Rejeita um compartilhamento pendente.
    """
    share = session.get(Share, file_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")
    
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
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Estende o tempo de expiracao de um compartilhamento.
    """
    share = session.get(Share, file_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")
    
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
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """Endpoint legado - redireciona para novo endpoint."""
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Share nao encontrado.")

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
