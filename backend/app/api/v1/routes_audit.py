from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func
from datetime import datetime, timedelta, UTC
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_session
from app.models.audit import Audit, TypeLevel
from app.models.user import User, TypeUser
from app.models.share import Share, ShareStatus
from app.models.share_file import ShareFile
from app.models.restricted_file import RestrictedFile
from app.utils.authz import get_current_user, require_supervisor

router = APIRouter(prefix="/audit", tags=["Audit"])


class AuditLogEntry(BaseModel):
    action: str
    level: TypeLevel = TypeLevel.INFO
    user_id: Optional[int] = None
    share_id: Optional[int] = None
    file_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    detail: Optional[str] = None


@router.get("/logs")
def get_audit_logs(
    user_id: int | None = Query(None, alias="user_id"),
    action: str | None = Query(None),
    file_id: int | None = Query(None, alias="file_id"),
    start_date: str | None = Query(None, alias="start_date"),
    end_date: str | None = Query(None, alias="end_date"),
    level: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Lista logs de auditoria com filtros.
    Disponivel para usuarios internos e supervisores.
    """
    query = select(Audit)
    
    if user_id:
        query = query.where(Audit.user_id == user_id)
    if action:
        query = query.where(Audit.action.ilike(f"%{action}%"))
    if file_id:
        query = query.where(Audit.file_id == file_id)
    if level:
        query = query.where(Audit.level == level)
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.where(Audit.created_at >= start_dt)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.where(Audit.created_at <= end_dt)
        except ValueError:
            pass
    
    # Conta total
    count_query = select(func.count()).select_from(Audit)
    if user_id:
        count_query = count_query.where(Audit.user_id == user_id)
    if action:
        count_query = count_query.where(Audit.action.ilike(f"%{action}%"))
    if file_id:
        count_query = count_query.where(Audit.file_id == file_id)
    if level:
        count_query = count_query.where(Audit.level == level)
    
    total_items = session.exec(count_query).one()
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1
    
    # Aplica paginacao
    offset = (page - 1) * limit
    query = query.order_by(Audit.created_at.desc()).offset(offset).limit(limit)
    logs = session.exec(query).all()
    
    result_logs = []
    for log in logs:
        # Busca dados do usuario se existir
        user_data = None
        if log.user_id:
            user = session.get(User, log.user_id)
            if user:
                user_data = {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "type": user.type,
                    "employee_id": user.employee_id,
                }
        
        result_logs.append({
            "id": log.id,
            "timestamp": log.created_at.isoformat(),
            "action": log.action,
            "level": log.level,
            "user": user_data,
            "details": {
                "target_id": log.share_id or log.file_id,
                "target_name": None,
                "description": log.detail,
                "ip_address": log.ip_address,
                "metadata": None,
            }
        })
    
    return {
        "logs": result_logs,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_items": total_items,
            "items_per_page": limit,
        }
    }


@router.post("/logs")
def create_audit_log(
    payload: AuditLogEntry,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Cria uma nova entrada no log de auditoria.
    """
    audit = Audit(
        action=payload.action,
        level=payload.level,
        user_id=payload.user_id or current_user.id,
        share_id=payload.share_id,
        file_id=payload.file_id,
        ip_address=payload.ip_address,
        user_agent=payload.user_agent,
        detail=payload.detail,
    )
    session.add(audit)
    session.commit()
    session.refresh(audit)
    
    return {"success": True, "id": audit.id}


@router.get("/metrics")
def get_audit_metrics(
    period: str = Query("30d", description="Periodo: 7d, 30d, 90d, all"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna metricas agregadas do sistema.
    """
    # Define periodo
    now = datetime.now(UTC)
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "90d":
        start_date = now - timedelta(days=90)
    else:
        start_date = None
    
    # Total de uploads (shares criados)
    total_uploads_query = select(func.count()).select_from(Share)
    if start_date:
        total_uploads_query = total_uploads_query.where(Share.created_at >= start_date)
    total_uploads = session.exec(total_uploads_query).one()
    
    # Pendentes de aprovacao
    pending_approvals = session.exec(
        select(func.count()).select_from(Share).where(Share.status == ShareStatus.PENDING)
    ).one()
    
    # Aprovados
    approved_files = session.exec(
        select(func.count()).select_from(Share).where(Share.status.in_([ShareStatus.APPROVED, ShareStatus.ACTIVE]))
    ).one()
    
    # Rejeitados
    rejected_files = session.exec(
        select(func.count()).select_from(Share).where(Share.status == ShareStatus.REJECTED)
    ).one()
    
    # Cancelados
    cancelled_files = session.exec(
        select(func.count()).select_from(Share).where(Share.status == ShareStatus.CANCELED)
    ).one()
    
    # Expirados
    expired_files = session.exec(
        select(func.count()).select_from(Share).where(Share.status == ShareStatus.EXPIRED)
    ).one()
    
    # Total de downloads (arquivos com downloaded=True)
    total_downloads = session.exec(
        select(func.count()).select_from(ShareFile).where(ShareFile.downloaded == True)
    ).one()
    
    # Usuarios externos unicos que baixaram
    unique_downloaders_query = select(func.count(func.distinct(Share.external_email))).select_from(Share).join(ShareFile).where(ShareFile.downloaded == True)
    unique_downloaders = session.exec(unique_downloaders_query).one() or 0
    
    # Usuarios ativos (logaram no periodo)
    active_users_query = select(func.count()).select_from(User).where(User.status == True)
    if start_date:
        active_users_query = active_users_query.where(User.last_login >= start_date)
    active_users = session.exec(active_users_query).one()
    
    # Total de usuarios internos
    total_internal_users = session.exec(
        select(func.count()).select_from(User).where(User.type.in_([TypeUser.INTERNAL, TypeUser.SUPERVISOR]))
    ).one()
    
    # Total de usuarios externos
    total_external_users = session.exec(
        select(func.count()).select_from(User).where(User.type == TypeUser.EXTERNAL)
    ).one()
    
    # Storage usado (soma dos tamanhos dos arquivos)
    storage_used_bytes = session.exec(
        select(func.sum(RestrictedFile.size_bytes)).select_from(RestrictedFile).where(RestrictedFile.status == True)
    ).one() or 0
    storage_used_gb = round(storage_used_bytes / (1024 ** 3), 2)
    
    # Uploads por periodo
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)
    
    uploads_today = session.exec(
        select(func.count()).select_from(Share).where(Share.created_at >= today_start)
    ).one()
    
    uploads_this_week = session.exec(
        select(func.count()).select_from(Share).where(Share.created_at >= week_start)
    ).one()
    
    uploads_this_month = session.exec(
        select(func.count()).select_from(Share).where(Share.created_at >= month_start)
    ).one()
    
    # Top remetentes
    top_senders_query = (
        select(User.name, User.email, func.count(Share.id).label("count"))
        .select_from(Share)
        .join(User, Share.created_by_id == User.id)
        .group_by(User.id, User.name, User.email)
        .order_by(func.count(Share.id).desc())
        .limit(5)
    )
    top_senders = [
        {"name": row[0], "email": row[1], "count": row[2]}
        for row in session.exec(top_senders_query).all()
    ]
    
    # Top destinatarios
    top_recipients_query = (
        select(Share.external_email, func.count(Share.id).label("count"))
        .select_from(Share)
        .group_by(Share.external_email)
        .order_by(func.count(Share.id).desc())
        .limit(5)
    )
    top_recipients = [
        {"email": row[0], "count": row[1]}
        for row in session.exec(top_recipients_query).all()
    ]
    
    return {
        "total_uploads": total_uploads,
        "pending_approvals": pending_approvals,
        "approved_files": approved_files,
        "rejected_files": rejected_files,
        "cancelled_files": cancelled_files,
        "expired_files": expired_files,
        "total_downloads": total_downloads,
        "unique_downloaders": unique_downloaders,
        "active_users": active_users,
        "total_internal_users": total_internal_users,
        "total_external_users": total_external_users,
        "storage_used": f"{storage_used_gb} GB",
        "storage_limit": "100 GB",
        "storage_percentage": min(round(storage_used_gb / 100 * 100, 1), 100),
        "average_approval_time": 30,  # placeholder - calcular com dados reais
        "average_download_time": 60,  # placeholder - calcular com dados reais
        "uploads_today": uploads_today,
        "uploads_this_week": uploads_this_week,
        "uploads_this_month": uploads_this_month,
        "trends": None,  # Pode ser implementado com agregacao diaria
        "top_senders": top_senders,
        "top_recipients": top_recipients,
    }


# Endpoint legado para compatibilidade
@router.get("/")
def list_audit_legacy(
    session: Session = Depends(get_session),
    user_id: int | None = Query(None),
    share_id: int | None = Query(None),
    file_id: int | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
):
    q = select(Audit)
    if user_id:
        q = q.where(Audit.user_id == user_id)
    if share_id:
        q = q.where(Audit.share_id == share_id)
    if file_id:
        q = q.where(Audit.file_id == file_id)
    q = q.order_by(Audit.id.desc())
    return session.exec(q).all()[:limit]
