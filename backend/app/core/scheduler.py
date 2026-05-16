"""
Scheduler de tarefas periodicas.

- expire_shares:  marca shares ativos/aprovados como EXPIRADO quando expires_at < agora
- notify_expiring: envia alerta 24h antes da expiracao
"""
import logging
from datetime import datetime, timedelta, UTC

from sqlmodel import Session, select
from app.db.session import engine
from app.models.share import Share, ShareStatus
from app.models.share_file import ShareFile
from app.models.user import User
from app.services.audit_service import log_event

logger = logging.getLogger(__name__)


# =====================================================
# Job 1 - Expirar shares vencidos
# =====================================================

def expire_shares() -> int:
    """
    Varre shares com status ACTIVE/APPROVED cujo expires_at ja passou
    e atualiza para EXPIRED.  Retorna quantidade de shares expirados.
    """
    now = datetime.now(UTC)
    expired_count = 0

    with Session(engine) as session:
        shares = session.exec(
            select(Share).where(
                Share.status.in_([ShareStatus.ACTIVE, ShareStatus.APPROVED]),
                Share.expires_at != None,
                Share.expires_at < now,
            )
        ).all()

        for share in shares:
            share.status = ShareStatus.EXPIRED
            session.add(share)

            log_event(
                session=session,
                action="SHARE_EXPIRADO_AUTO",
                user_id=share.created_by_id,
                share_id=share.id,
                detail=f"expires_at={share.expires_at.isoformat()}, expirado automaticamente pelo scheduler",
            )
            expired_count += 1

        if expired_count:
            session.commit()
            logger.info("expire_shares_job", expired=expired_count)

    return expired_count


# =====================================================
# Job 2 - Notificar shares prestes a expirar (24h)
# =====================================================

def notify_expiring_shares() -> int:
    """
    Envia email de alerta para shares que expiram nas proximas 24h.
    Marca o share com um campo ou usa auditoria para nao reenviar.
    """
    import asyncio
    from app.services.email_service import send_email, render_email_template
    from app.core.config import settings

    now = datetime.now(UTC)
    threshold = now + timedelta(hours=24)
    notified_count = 0

    with Session(engine) as session:
        shares = session.exec(
            select(Share).where(
                Share.status.in_([ShareStatus.ACTIVE, ShareStatus.APPROVED]),
                Share.expires_at != None,
                Share.expires_at > now,
                Share.expires_at <= threshold,
            )
        ).all()

        for share in shares:
            # Verifica se ja notificamos via auditoria
            from app.models.audit import AuditLog
            already = session.exec(
                select(AuditLog).where(
                    AuditLog.share_id == share.id,
                    AuditLog.action == "ALERTA_EXPIRACAO_ENVIADO",
                )
            ).first()
            if already:
                continue

            creator = session.get(User, share.created_by_id)
            if not creator:
                continue

            # Envia email ao criador interno
            try:
                subject = "Alerta: compartilhamento expira em breve"
                files_count = len(
                    session.exec(
                        select(ShareFile).where(ShareFile.share_id == share.id)
                    ).all()
                )
                html = render_email_template(
                    "email/share_expiring_alert.html",
                    {
                        "subject": subject,
                        "user_name": creator.name,
                        "share_name": share.name or f"Compartilhamento #{share.id}",
                        "external_email": share.external_email,
                        "files_count": files_count,
                        "expires_at": share.expires_at.strftime("%d/%m/%Y %H:%M"),
                        "details_url": settings.frontend_share_details_url.replace(
                            "{share_id}", str(share.id)
                        ),
                    },
                )
                asyncio.get_event_loop().run_until_complete(
                    send_email(subject, [creator.email], html)
                )
            except Exception as exc:
                logger.warning(
                    "notify_expiring_email_failed",
                    share_id=share.id,
                    error=str(exc),
                )

            # Envia email ao destinatario externo
            try:
                subject_ext = "Lembrete: arquivos expiram em breve"
                html_ext = render_email_template(
                    "email/share_expiring_external.html",
                    {
                        "subject": subject_ext,
                        "external_email": share.external_email,
                        "expires_at": share.expires_at.strftime("%d/%m/%Y %H:%M"),
                        "portal_url": settings.frontend_external_portal_url,
                    },
                )
                asyncio.get_event_loop().run_until_complete(
                    send_email(subject_ext, [share.external_email], html_ext)
                )
            except Exception as exc:
                logger.warning(
                    "notify_expiring_external_email_failed",
                    share_id=share.id,
                    error=str(exc),
                )

            log_event(
                session=session,
                action="ALERTA_EXPIRACAO_ENVIADO",
                user_id=share.created_by_id,
                share_id=share.id,
                detail=f"expires_at={share.expires_at.isoformat()}, alerta 24h enviado",
            )
            notified_count += 1

        if notified_count:
            session.commit()
            logger.info("notify_expiring_job", notified=notified_count)

    return notified_count


# =====================================================
# Runner - executar todos os jobs
# =====================================================

def run_all_jobs():
    """Executa todos os jobs do scheduler sequencialmente."""
    logger.info("scheduler_run_start")
    expired = expire_shares()
    notified = notify_expiring_shares()
    logger.info("scheduler_run_complete", expired=expired, notified=notified)
    return {"expired": expired, "notified": notified}
