from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session, select, func
from datetime import datetime, UTC

from app.db.session import get_session
from app.models.notification import Notification, NotificationType, NotificationPriority
from app.models.user import User
from app.utils.authz import get_current_user
from app.services.audit_service import log_event

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
def get_notifications(
    unread_only: bool = Query(False, alias="unread_only"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Lista notificacoes do usuario autenticado.
    Suporta filtragem por nao lidas e paginacao.
    """
    query = select(Notification).where(Notification.user_id == user.id)
    
    if unread_only:
        query = query.where(Notification.read == False)
    
    # Conta total para paginacao
    count_query = select(func.count()).select_from(Notification).where(Notification.user_id == user.id)
    if unread_only:
        count_query = count_query.where(Notification.read == False)
    total_items = session.exec(count_query).one()
    
    # Conta nao lidas
    unread_count = session.exec(
        select(func.count()).select_from(Notification).where(
            Notification.user_id == user.id,
            Notification.read == False
        )
    ).one()
    
    # Aplica paginacao
    offset = (page - 1) * limit
    query = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
    notifications = session.exec(query).all()
    
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1
    
    log_event(
        session=session,
        action="VER_NOTIFICACOES",
        user_id=user.id,
        detail=f"page={page}, unread_only={unread_only}, total={total_items}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return {
        "notifications": [
            {
                "id": n.id,
                "type": n.type,
                "priority": n.priority,
                "title": n.title,
                "message": n.message,
                "read": n.read,
                "timestamp": n.created_at.isoformat(),
                "action_label": n.action_label,
                "action_url": n.action_url,
                "metadata": n.extra_metadata,
            }
            for n in notifications
        ],
        "unread_count": unread_count,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_items": total_items,
        }
    }


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Marca uma notificacao como lida.
    """
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notificacao nao encontrada.")
    
    if notification.user_id != user.id:
        raise HTTPException(status_code=403, detail="Sem permissao para acessar esta notificacao.")
    
    notification.read = True
    session.add(notification)
    session.commit()
    
    log_event(
        session=session,
        action="MARCAR_NOTIFICACAO_LIDA",
        user_id=user.id,
        detail=f"notification_id={notification_id}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return {"success": True, "message": "Notificacao marcada como lida."}


@router.put("/read-all")
def mark_all_notifications_read(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Marca todas as notificacoes do usuario como lidas.
    """
    notifications = session.exec(
        select(Notification).where(
            Notification.user_id == user.id,
            Notification.read == False
        )
    ).all()
    
    count = 0
    for n in notifications:
        n.read = True
        session.add(n)
        count += 1
    
    session.commit()
    
    log_event(
        session=session,
        action="MARCAR_TODAS_NOTIFICACOES_LIDAS",
        user_id=user.id,
        detail=f"count={count}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return {"success": True, "message": f"{count} notificacoes marcadas como lidas."}


# Funcao auxiliar para criar notificacoes (usada por outros servicos)
def create_notification(
    session: Session,
    user_id: int,
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    action_label: str = None,
    action_url: str = None,
    extra_metadata: str = None,
) -> Notification:
    """
    Cria uma nova notificacao para um usuario.
    """
    notification = Notification(
        user_id=user_id,
        type=type,
        priority=priority,
        title=title,
        message=message,
        action_label=action_label,
        action_url=action_url,
        extra_metadata=extra_metadata,
    )
    session.add(notification)
    session.commit()
    session.refresh(notification)
    return notification
