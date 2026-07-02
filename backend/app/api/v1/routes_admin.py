"""
routes_admin.py — Rotas exclusivas para Super Administrador Global.

O Admin pode visualizar TODOS os logs, usuarios, compartilhamentos e
rastreamento do sistema, independente de hierarquia.

Endpoints:
- GET /admin/dashboard          — Metricas globais completas
- GET /admin/users              — Lista TODOS os usuarios com filtros
- GET /admin/shares             — Lista TODOS os compartilhamentos
- GET /admin/logs               — Lista TODOS os logs de auditoria
- GET /admin/tracking/by-email  — Rastreamento completo por email
- GET /admin/tracking/{id}      — Rastreamento completo por ID
- PATCH /admin/users/{id}/admin — Promover/rebaixar admin
- GET /admin/mip-diagnostico    — Diagnostico da integracao MIP SDK
"""

import sys
from datetime import datetime, UTC, timedelta
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session, select, func, or_

from app.db.session import get_session
from app.models.user import User, TypeUser
from app.models.share import Share, ShareStatus
from app.models.share_file import ShareFile
from app.models.restricted_file import RestrictedFile
from app.models.audit import Audit as AuditLog
from app.models.email_log import EmailLog
from app.utils.authz import require_admin
from app.services.audit_service import log_event
from app.services.task_service import run_cleanup_job

router = APIRouter(prefix="/admin", tags=["Admin"])


# ---------------------------------------------------------------------------
# GET /admin/dashboard — Metricas globais completas
# ---------------------------------------------------------------------------

@router.get("/dashboard")
def admin_dashboard(
    session: Session = Depends(get_session),
    user: User = Depends(require_admin),
    request: Request = None,
):
    """
    Retorna metricas globais do sistema inteiro.
    Inclui: total de usuarios, shares, arquivos, downloads, storage usado.
    """
    total_users = session.exec(select(func.count()).select_from(User)).one()
    internal_users = session.exec(
        select(func.count()).select_from(User).where(User.type == TypeUser.INTERNAL)
    ).one()
    external_users = session.exec(
        select(func.count()).select_from(User).where(User.type == TypeUser.EXTERNAL)
    ).one()
    supervisors = session.exec(
        select(func.count()).select_from(User).where(User.is_supervisor == True)
    ).one()
    admins = session.exec(
        select(func.count()).select_from(User).where(User.is_admin == True)
    ).one()
    active_users = session.exec(
        select(func.count()).select_from(User).where(User.status == True)
    ).one()

    total_shares = session.exec(select(func.count()).select_from(Share)).one()
    pending_shares = session.exec(
        select(func.count()).select_from(Share).where(Share.status == ShareStatus.PENDING)
    ).one()
    approved_shares = session.exec(
        select(func.count()).select_from(Share).where(Share.status == ShareStatus.APPROVED)
    ).one()
    active_shares = session.exec(
        select(func.count()).select_from(Share).where(Share.status == ShareStatus.ACTIVE)
    ).one()
    rejected_shares = session.exec(
        select(func.count()).select_from(Share).where(Share.status == ShareStatus.REJECTED)
    ).one()
    expired_shares = session.exec(
        select(func.count()).select_from(Share).where(Share.status == ShareStatus.EXPIRED)
    ).one()

    total_files = session.exec(select(func.count()).select_from(RestrictedFile)).one()
    total_storage_bytes = session.exec(
        select(func.sum(RestrictedFile.size_bytes)).select_from(RestrictedFile)
    ).one() or 0

    total_logs = session.exec(select(func.count()).select_from(AuditLog)).one()
    week_ago = datetime.now(UTC) - timedelta(days=7)
    logs_last_week = session.exec(
        select(func.count()).select_from(AuditLog).where(AuditLog.created_at >= week_ago)
    ).one()

    total_emails = session.exec(select(func.count()).select_from(EmailLog)).one()

    log_event(
        session=session,
        action="ADMIN_VIEW_DASHBOARD",
        user_id=user.id,
        detail="Visualizou dashboard global",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {
        "users": {
            "total": total_users,
            "internal": internal_users,
            "external": external_users,
            "supervisors": supervisors,
            "admins": admins,
            "active": active_users,
        },
        "shares": {
            "total": total_shares,
            "pending": pending_shares,
            "approved": approved_shares,
            "active": active_shares,
            "rejected": rejected_shares,
            "expired": expired_shares,
        },
        "files": {
            "total": total_files,
            "storage_bytes": total_storage_bytes,
            "storage_mb": round(total_storage_bytes / (1024 * 1024), 2),
        },
        "audit": {
            "total_logs": total_logs,
            "logs_last_7_days": logs_last_week,
        },
        "emails": {
            "total_sent": total_emails,
        },
    }


# ---------------------------------------------------------------------------
# GET /admin/users — Lista TODOS os usuarios com filtros
# ---------------------------------------------------------------------------

@router.get("/users")
def admin_list_users(
    search: Optional[str] = Query(None, description="Busca por nome ou email"),
    user_type: Optional[str] = Query(None, description="Filtro: internal, external"),
    status: Optional[bool] = Query(None, description="Filtro por status ativo/inativo"),
    is_supervisor: Optional[bool] = Query(None),
    is_admin: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
    user: User = Depends(require_admin),
    request: Request = None,
):
    """Lista TODOS os usuarios do sistema com filtros e paginacao."""
    query = select(User)

    if search:
        query = query.where(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )
    if user_type:
        if user_type.lower() == "internal":
            query = query.where(User.type == TypeUser.INTERNAL)
        elif user_type.lower() == "external":
            query = query.where(User.type == TypeUser.EXTERNAL)
    if status is not None:
        query = query.where(User.status == status)
    if is_supervisor is not None:
        query = query.where(User.is_supervisor == is_supervisor)
    if is_admin is not None:
        query = query.where(User.is_admin == is_admin)

    count_query = select(func.count()).select_from(query.subquery())
    total_items = session.exec(count_query).one()
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1

    offset = (page - 1) * limit
    query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)
    users = session.exec(query).all()

    log_event(
        session=session,
        action="ADMIN_LIST_USERS",
        user_id=user.id,
        detail=f"page={page}, limit={limit}, total={total_items}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "type": u.type.value if hasattr(u.type, "value") else str(u.type),
                "department": u.department,
                "job_title": u.job_title,
                "is_supervisor": u.is_supervisor,
                "is_admin": u.is_admin,
                "status": u.status,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "last_login": u.last_login.isoformat() if u.last_login else None,
            }
            for u in users
        ],
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_items": total_items,
            "limit": limit,
        },
    }


# ---------------------------------------------------------------------------
# GET /admin/shares — Lista TODOS os compartilhamentos
# ---------------------------------------------------------------------------

@router.get("/shares")
def admin_list_shares(
    search: Optional[str] = Query(None, description="Busca por nome ou email destinatario"),
    status: Optional[str] = Query(None, description="Filtro: pending, approved, active, rejected, expired"),
    start_date: Optional[str] = Query(None, description="Data inicio (ISO 8601)"),
    end_date: Optional[str] = Query(None, description="Data fim (ISO 8601)"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
    user: User = Depends(require_admin),
    request: Request = None,
):
    """Lista TODOS os compartilhamentos do sistema com filtros e paginacao."""
    query = select(Share)

    if search:
        query = query.where(
            or_(
                Share.name.ilike(f"%{search}%"),
                Share.external_email.ilike(f"%{search}%"),
            )
        )

    status_map = {
        "pending": ShareStatus.PENDING,
        "approved": ShareStatus.APPROVED,
        "active": ShareStatus.ACTIVE,
        "rejected": ShareStatus.REJECTED,
        "expired": ShareStatus.EXPIRED,
        "canceled": ShareStatus.CANCELED,
        "completed": ShareStatus.COMPLETED,
    }
    if status and status.lower() in status_map:
        query = query.where(Share.status == status_map[status.lower()])

    if start_date:
        try:
            sd = datetime.fromisoformat(start_date)
            query = query.where(Share.created_at >= sd)
        except ValueError:
            pass
    if end_date:
        try:
            ed = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59)
            query = query.where(Share.created_at <= ed)
        except ValueError:
            pass

    count_query = select(func.count()).select_from(query.subquery())
    total_items = session.exec(count_query).one()
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1

    offset = (page - 1) * limit
    query = query.order_by(Share.created_at.desc()).offset(offset).limit(limit)
    shares = session.exec(query).all()

    result = []
    for s in shares:
        creator = session.get(User, s.created_by_id) if s.created_by_id else None
        approver = session.get(User, s.approver_id) if s.approver_id else None
        files_count = session.exec(
            select(func.count()).select_from(ShareFile).where(ShareFile.share_id == s.id)
        ).one()

        result.append({
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "external_email": s.external_email,
            "status": s.status.value if hasattr(s.status, "value") else str(s.status),
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "expires_at": s.expires_at.isoformat() if s.expires_at else None,
            "approved_at": s.approved_at.isoformat() if s.approved_at else None,
            "files_count": files_count,
            "creator": {
                "id": creator.id,
                "name": creator.name,
                "email": creator.email,
            } if creator else None,
            "approver": {
                "id": approver.id,
                "name": approver.name,
                "email": approver.email,
            } if approver else None,
        })

    log_event(
        session=session,
        action="ADMIN_LIST_SHARES",
        user_id=user.id,
        detail=f"page={page}, limit={limit}, total={total_items}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {
        "shares": result,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_items": total_items,
            "limit": limit,
        },
    }


# ---------------------------------------------------------------------------
# GET /admin/logs — Lista TODOS os logs de auditoria
# ---------------------------------------------------------------------------

@router.get("/logs")
def admin_list_logs(
    search: Optional[str] = Query(None, description="Busca por acao ou detalhe"),
    action: Optional[str] = Query(None, description="Filtro por tipo de acao"),
    user_id: Optional[int] = Query(None, description="Filtro por usuario"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    session: Session = Depends(get_session),
    user: User = Depends(require_admin),
    request: Request = None,
):
    """Lista TODOS os logs de auditoria do sistema com filtros e paginacao."""
    query = select(AuditLog)

    if search:
        query = query.where(
            or_(
                AuditLog.action.ilike(f"%{search}%"),
                AuditLog.detail.ilike(f"%{search}%"),
            )
        )
    if action:
        query = query.where(AuditLog.action == action.upper())
    if user_id:
        query = query.where(AuditLog.user_id == user_id)
    if start_date:
        try:
            sd = datetime.fromisoformat(start_date)
            query = query.where(AuditLog.created_at >= sd)
        except ValueError:
            pass
    if end_date:
        try:
            ed = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59)
            query = query.where(AuditLog.created_at <= ed)
        except ValueError:
            pass

    count_query = select(func.count()).select_from(query.subquery())
    total_items = session.exec(count_query).one()
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1

    offset = (page - 1) * limit
    query = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
    logs = session.exec(query).all()

    result = []
    for log in logs:
        log_user = session.get(User, log.user_id) if log.user_id else None
        result.append({
            "id": log.id,
            "action": log.action,
            "detail": log.detail,
            "ip": log.ip_address,  # campo correto: ip_address
            "user_agent": log.user_agent,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "share_id": log.share_id,
            "user": {
                "id": log_user.id,
                "name": log_user.name,
                "email": log_user.email,
            } if log_user else None,
        })

    log_event(
        session=session,
        action="ADMIN_LIST_LOGS",
        user_id=user.id,
        detail=f"page={page}, limit={limit}, total={total_items}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {
        "logs": result,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_items": total_items,
            "limit": limit,
        },
    }


# ---------------------------------------------------------------------------
# GET /admin/tracking/by-email — Rastreamento completo por email
# ---------------------------------------------------------------------------

@router.get("/tracking/by-email")
def admin_tracking_user_by_email(
    email: str = Query(..., description="Email do usuario para rastrear"),
    session: Session = Depends(get_session),
    user: User = Depends(require_admin),
    request: Request = None,
):
    """Retorna rastreamento completo de um usuario especifico por email."""
    target = session.exec(select(User).where(User.email == email)).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado com este email.")
    return _build_tracking_response(session, target, user, request)


# ---------------------------------------------------------------------------
# GET /admin/tracking/{user_id} — Rastreamento completo por ID
# ---------------------------------------------------------------------------

@router.get("/tracking/{target_user_id}")
def admin_tracking_user(
    target_user_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(require_admin),
    request: Request = None,
):
    """Retorna rastreamento completo de um usuario especifico por ID."""
    target = session.get(User, target_user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")
    return _build_tracking_response(session, target, user, request)


def _build_tracking_response(
    session: Session,
    target: User,
    requesting_admin: User,
    request: Request,
) -> dict:
    """Monta o payload de rastreamento completo de um usuario."""
    shares_created = session.exec(
        select(Share).where(Share.created_by_id == target.id).order_by(Share.created_at.desc())
    ).all()

    shares_approved = session.exec(
        select(Share).where(Share.approver_id == target.id).order_by(Share.approved_at.desc())
    ).all()

    logs = session.exec(
        select(AuditLog)
        .where(AuditLog.user_id == target.id)
        .order_by(AuditLog.created_at.desc())
        .limit(100)
    ).all()

    files_uploaded = session.exec(
        select(RestrictedFile)
        .where(RestrictedFile.upload_id == target.id)
        .order_by(RestrictedFile.created_at.desc())
    ).all()

    log_event(
        session=session,
        action="ADMIN_TRACKING_USER",
        user_id=requesting_admin.id,
        detail=f"Rastreou usuario email={target.email}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {
        "user": {
            "id": target.id,
            "name": target.name,
            "email": target.email,
            "type": target.type.value if hasattr(target.type, "value") else str(target.type),
            "department": target.department,
            "job_title": target.job_title,
            "is_supervisor": target.is_supervisor,
            "is_admin": target.is_admin,
            "status": target.status,
            "created_at": target.created_at.isoformat() if target.created_at else None,
            "last_login": target.last_login.isoformat() if target.last_login else None,
            "manager_id": target.manager_id,
        },
        "shares_created": [
            {
                "id": s.id,
                "name": s.name,
                "external_email": s.external_email,
                "status": s.status.value if hasattr(s.status, "value") else str(s.status),
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in shares_created
        ],
        "shares_approved": [
            {
                "id": s.id,
                "name": s.name,
                "external_email": s.external_email,
                "status": s.status.value if hasattr(s.status, "value") else str(s.status),
                "approved_at": s.approved_at.isoformat() if s.approved_at else None,
            }
            for s in shares_approved
        ],
        "files_uploaded": [
            {
                "id": f.id,
                "name": f.name,
                "size_bytes": f.size_bytes,
                "mime_type": f.mime_type,
                "created_at": f.created_at.isoformat() if f.created_at else None,
            }
            for f in files_uploaded
        ],
        "recent_logs": [
            {
                "id": log.id,
                "action": log.action,
                "detail": log.detail,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs[:50]
        ],
        "stats": {
            "total_shares_created": len(shares_created),
            "total_shares_approved": len(shares_approved),
            "total_files_uploaded": len(files_uploaded),
            "total_logs": len(logs),
        },
    }


# ---------------------------------------------------------------------------
# PATCH /admin/users/{user_id}/admin — Promover/rebaixar admin
# ---------------------------------------------------------------------------

@router.patch("/users/{target_user_id}/admin")
def toggle_admin(
    target_user_id: int,
    is_admin: bool = Query(..., description="True para promover, False para rebaixar"),
    session: Session = Depends(get_session),
    user: User = Depends(require_admin),
    request: Request = None,
):
    """Promove ou rebaixa um usuario a/de Super Administrador Global."""
    if target_user_id == user.id:
        raise HTTPException(status_code=400, detail="Voce nao pode alterar o proprio status de admin.")

    target = session.get(User, target_user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")

    old_value = target.is_admin
    target.is_admin = is_admin
    session.add(target)
    session.commit()

    action = "ADMIN_USER_PROMOTED" if is_admin else "ADMIN_USER_DEMOTED"
    log_event(
        session=session,
        action=action,
        user_id=user.id,
        detail=f"target_email={target.email}, old_is_admin={old_value}, new_is_admin={is_admin}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {
        "message": f"Usuario {'promovido a admin' if is_admin else 'rebaixado de admin'} com sucesso.",
        "user_id": target.id,
        "email": target.email,
        "is_admin": target.is_admin,
    }


# ---------------------------------------------------------------------------
# GET /admin/actions — Lista de tipos de acao distintos nos logs
# ---------------------------------------------------------------------------

@router.get("/actions")
def admin_list_actions(
    session: Session = Depends(get_session),
    user: User = Depends(require_admin),
):
    """Retorna todos os tipos de acao distintos registrados na tabela de auditoria."""
    actions = session.exec(
        select(AuditLog.action).distinct().order_by(AuditLog.action)
    ).all()
    return {"actions": list(actions)}


# ---------------------------------------------------------------------------
# GET /admin/mip-diagnostico — Diagnóstico da integração MIP SDK
# ---------------------------------------------------------------------------

@router.get("/mip-diagnostico")
def admin_mip_diagnostico():
    """
    Executa uma série de verificações da integração MIP SDK e retorna
    um relatório JSON com o resultado de cada etapa.
    """
    import httpx

    from app.core.config import settings

    checks: list[dict] = []

    mip_enabled = settings.mip_processing_enabled
    mip_fail_closed = settings.mip_fail_closed
    sdk_base_url = settings.mip_sdk_base_url
    sdk_verify_tls = settings.mip_sdk_verify_tls
    has_sdk_token = bool(settings.mip_sdk_api_token)
    timeout_s = settings.mip_processing_timeout_seconds

    checks.append(
        {
            "check": "settings",
            "ok": True,
            "detail": {
                "mip_processing_enabled": mip_enabled,
                "mip_fail_closed": mip_fail_closed,
                "mip_sdk_base_url": sdk_base_url,
                "mip_sdk_verify_tls": sdk_verify_tls,
                "mip_sdk_api_token_set": has_sdk_token,
                "mip_processing_timeout_seconds": timeout_s,
            },
        }
    )

    if not mip_enabled:
        return {
            "timestamp": datetime.now(UTC).isoformat(),
            "summary": "MIP desabilitado (MIP_PROCESSING_ENABLED=false). Nenhuma verificacao adicional necessaria.",
            "checks": checks,
        }

    sdk_config_ok = bool(sdk_base_url)
    checks.append(
        {
            "check": "sdk_configurado",
            "ok": sdk_config_ok,
            "detail": {"mip_sdk_base_url": sdk_base_url},
            "hint": (
                "Defina MIP_SDK_BASE_URL com o endpoint do servico MIP SDK."
                if not sdk_config_ok
                else None
            ),
        }
    )

    if sdk_config_ok:
        health_url = f"{sdk_base_url.rstrip('/')}/health"
        headers = {}
        if settings.mip_sdk_api_token:
            headers["Authorization"] = f"Bearer {settings.mip_sdk_api_token}"
        try:
            health_response = httpx.get(
                health_url,
                headers=headers,
                timeout=10,
                verify=sdk_verify_tls,
            )
            checks.append(
                {
                    "check": "sdk_health",
                    "ok": health_response.status_code < 400,
                    "detail": {
                        "url": health_url,
                        "status_code": health_response.status_code,
                        "body": (health_response.text or "")[:300],
                    },
                    "hint": (
                        "Verifique conectividade de rede e autenticacao entre backend e servico MIP SDK."
                        if health_response.status_code >= 400
                        else None
                    ),
                }
            )
        except httpx.HTTPError as exc:
            checks.append(
                {
                    "check": "sdk_health",
                    "ok": False,
                    "detail": f"Falha ao acessar health do servico MIP SDK: {exc}",
                    "hint": "Verifique DNS, rota de rede, TLS e token do servico MIP SDK.",
                }
            )
    else:
        checks.append(
            {
                "check": "sdk_health",
                "ok": None,
                "detail": "Pulado: MIP_SDK_BASE_URL nao configurado.",
            }
        )

    all_ok = all(c["ok"] is True for c in checks if c.get("ok") is not None)
    failed = [c["check"] for c in checks if c.get("ok") is False]

    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "python": sys.version,
        "cwd": str(Path.cwd()),
        "summary": "Tudo OK" if all_ok else f"Falhou em: {failed}",
        "checks": checks,
    }

# Rota gerada dentro de admin, mas pode ser encaixada em shared
# ---------------------------------------------------------------------------
# POST /admin/run-cleanup — Trigger manual do job de ciclo de vida
# ---------------------------------------------------------------------------

@router.post("/run-cleanup")
def trigger_cleanup(
    session: Session = Depends(get_session),
    user: User = Depends(require_admin),
    request: Request = None,
):
    """
    Executa manualmente as rotinas automáticas de ciclo de vida:
    - Expira shares vencidos e remove arquivos S3
    - Desativa usuários externos/internos/supervisores sem atividade pendente
    - Envia e-mails de notificação de expiração

    Equivale ao job automático que deve ser configurado externamente (cron/APScheduler).
    """
    result = run_cleanup_job(session)

    log_event(
        session=session,
        action="RUN_CLEANUP_JOB",
        user_id=user.id,
        detail=str(result),
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "triggered_by": user.email,
        "result": result,
    }

