
# app/services/email_service.py
from jinja2 import Environment, FileSystemLoader, select_autoescape
import boto3
import aiosmtplib
import logging
import uuid
from email.message import EmailMessage
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)

# ---- Jinja2 env ----
env = Environment(
    loader=FileSystemLoader("templates"),
    autoescape=select_autoescape(["html", "xml"])
)


def render_email_template(name: str, context: dict) -> str:
    context = {
        **context,
        "app_name": settings.app_name,
        "company_name": settings.company_name,
        "support_email": settings.support_email,
    }
    return env.get_template(name).render(**context)


# ---- Persistência de log de e-mail ----

def _log_email(
    *,
    email_type: str,
    to_email: str,
    subject: str,
    body: str,
    share_id: int | None,
    user_id: int | None,
    status: str,          # "sent" | "failed"
    error_message: str | None = None,
) -> None:
    """
    Persiste um registro em EmailLog usando sessão própria (seguro para BackgroundTasks).
    Nunca propaga exceções — falha de log não deve interromper fluxo.
    """
    try:
        from app.db.session import engine
        from sqlmodel import Session
        from app.models.email_log import EmailLog, EmailStatus, EmailType

        type_map = {
            "approval_request":   EmailType.APPROVAL_REQUEST,
            "approval_granted":   EmailType.APPROVAL_GRANTED,
            "approval_rejected":  EmailType.APPROVAL_REJECTED,
            "otp":                EmailType.OTP,
            "file_share":         EmailType.FILE_SHARE,
        }
        status_map = {
            "sent":   EmailStatus.SENT,
            "failed": EmailStatus.FAILED,
        }

        with Session(engine) as db:
            entry = EmailLog(
                message_id=str(uuid.uuid4()),
                email_type=type_map.get(email_type, EmailType.SYSTEM),
                from_email=settings.mail_from or "noreply",
                to_email=to_email,
                subject=subject,
                body_preview=body[:300] if body else None,
                status=status_map.get(status, EmailStatus.FAILED),
                sent_at=datetime.utcnow() if status == "sent" else None,
                error_message=error_message,
                share_id=share_id,
                user_id=user_id,
            )
            db.add(entry)
            db.commit()
    except Exception as exc:
        logger.warning("email_log_persist_failed", error=str(exc))


def send_email_ses(subject: str, recipients: list[str], body: str):
    client = boto3.client(
        "ses",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        aws_session_token=settings.aws_session_token or None,
    )
    client.send_email(
        Source=settings.mail_from,
        Destination={"ToAddresses": recipients},
        Message={
            "Subject": {"Data": subject, "Charset": "UTF-8"},
            "Body": {"Html": {"Data": body, "Charset": "UTF-8"}}
        }
    )


async def send_email_smtp_internal(subject: str, recipients: list[str], body: str):
    """
    Envia e-mail via SMTP interno Petrobras (smtp.petrobras.com.br:25).
    Sem autenticação. TLS via STARTTLS.

    Suporta dois headers de controle do Exchange Petrobras:
    - X-Route     → desvio para caixa de teste em não-produção (MAIL_ROUTE no .env)
                    Ex: TESTE_TIC → cc-test_apps_tic@petrobras.com.br
    - X-Protecao  → criptografia MIP para conteúdo confidencial (MAIL_PROTECTION no .env)
                    Ex: CONFIDENCIAL
    """
    sender = settings.mail_from
    if not sender:
        raise RuntimeError("smtp_internal provider requer MAIL_FROM no .env")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = ", ".join(recipients)
    msg.set_content(body, subtype="html")

    # Header de desvio para caixa de teste (não-produção)
    if settings.mail_route:
        msg["X-Route"] = settings.mail_route

    # Header de criptografia MIP (conteúdo confidencial)
    if settings.mail_protection:
        msg["X-Protecao"] = settings.mail_protection

    await aiosmtplib.send(
        msg,
        hostname="smtp.petrobras.com.br",
        port=25,
        start_tls=True,
    )


async def send_email(subject: str, recipients: list[str], body: str):
    if settings.email_provider == "ses":
        send_email_ses(subject, recipients, body)
    elif settings.email_provider == "smtp_internal":
        await send_email_smtp_internal(subject, recipients, body)
    else:
        raise ValueError(f"EMAIL_PROVIDER desconhecido: '{settings.email_provider}'. Use 'ses' ou 'smtp_internal'.")


def send_custom_email(to_email: str, subject: str, body_html: str):
    """
    Envia email customizado de forma sincrona.
    Usado pelo routes_emails.py.
    smtp_internal é assíncrono — neste contexto síncrono usa o loop de eventos.
    """
    if settings.email_provider == "ses":
        send_email_ses(subject, [to_email], body_html)
    elif settings.email_provider == "smtp_internal":
        import asyncio
        asyncio.get_event_loop().run_until_complete(
            send_email_smtp_internal(subject, [to_email], body_html)
        )
    else:
        raise ValueError(f"EMAIL_PROVIDER desconhecido: '{settings.email_provider}'. Use 'ses' ou 'smtp_internal'.")


# ---- Facades de e-mail de negócios ----

async def send_otp_email(dest_email: str, code: str, expires_at: datetime):
    subject = "Seu código de acesso"
    html = render_email_template(
        "email/otp_code.html",
        {
            "subject": subject,
            "code": code,
            "expires_at": expires_at.strftime("%d/%m/%Y %H:%M"),
            "portal_url": settings.frontend_external_portal_url,
        }
    )
    try:
        await send_email(subject, [dest_email], html)
        _log_email(email_type="otp", to_email=dest_email, subject=subject,
                   body=html, share_id=None, user_id=None, status="sent")
    except Exception as exc:
        _log_email(email_type="otp", to_email=dest_email, subject=subject,
                   body=html, share_id=None, user_id=None, status="failed", error_message=str(exc))
        raise


async def send_share_approved_external_email(
    external_email: str, applicant_name: str, files_quantity: int,
    expires_at: datetime, share_id: int | None = None,
):
    subject = "Arquivos disponíveis para download"
    html = render_email_template(
        "email/share_approved_external.html",
        {
            "subject": subject,
            "applicant_name": applicant_name,
            "files_quantity": files_quantity,
            "expires_at": expires_at.strftime("%d/%m/%Y %H:%M"),
            "portal_url": settings.frontend_external_portal_url,
        }
    )
    try:
        await send_email(subject, [external_email], html)
        _log_email(email_type="file_share", to_email=external_email, subject=subject,
                   body=html, share_id=share_id, user_id=None, status="sent")
    except Exception as exc:
        _log_email(email_type="file_share", to_email=external_email, subject=subject,
                   body=html, share_id=share_id, user_id=None, status="failed", error_message=str(exc))
        raise


async def send_share_approved_requester_email(
    applicant_email: str, applicant_name: str, external_email: str,
    share_id: int, requester_user_id: int | None = None,
):
    subject = "Compartilhamento aprovado"
    details_url = settings.frontend_share_details_url.replace("{share_id}", str(share_id))
    html = render_email_template(
        "email/share_approved_requester.html",
        {
            "subject": subject,
            "applicant_name": applicant_name,
            "external_email": external_email,
            "details_url": details_url,
        }
    )
    try:
        await send_email(subject, [applicant_email], html)
        _log_email(email_type="approval_granted", to_email=applicant_email, subject=subject,
                   body=html, share_id=share_id, user_id=requester_user_id, status="sent")
    except Exception as exc:
        _log_email(email_type="approval_granted", to_email=applicant_email, subject=subject,
                   body=html, share_id=share_id, user_id=requester_user_id, status="failed", error_message=str(exc))
        raise


async def send_supervisor_approval_request_email(
    supervisor_email: str,
    supervisor_name: str,
    requester_name: str,
    requester_email: str,
    recipient_email: str,
    files_count: int,
    expiration_hours: int,
    share_name: str | None,
    share_id: int,
    supervisor_user_id: int | None = None,
):
    subject = "Novo compartilhamento aguardando sua aprovação"
    pending_url = settings.frontend_supervisor_url
    html = render_email_template(
        "email/share_pending_supervisor.html",
        {
            "subject": subject,
            "supervisor_name": supervisor_name,
            "requester_name": requester_name,
            "requester_email": requester_email,
            "recipient_email": recipient_email,
            "files_count": files_count,
            "expiration_hours": expiration_hours,
            "share_name": share_name or f"Compartilhamento #{share_id}",
            "pending_url": pending_url,
        }
    )
    try:
        await send_email(subject, [supervisor_email], html)
        _log_email(email_type="approval_request", to_email=supervisor_email, subject=subject,
                   body=html, share_id=share_id, user_id=supervisor_user_id, status="sent")
    except Exception as exc:
        _log_email(email_type="approval_request", to_email=supervisor_email, subject=subject,
                   body=html, share_id=share_id, user_id=supervisor_user_id, status="failed", error_message=str(exc))
        raise


async def send_share_rejected_requester_email(
    requester_email: str,
    requester_name: str,
    supervisor_name: str,
    share_name: str | None,
    share_id: int,
    rejection_reason: str,
    requester_user_id: int | None,
):
    subject = "Compartilhamento rejeitado"
    details_url = settings.frontend_share_details_url.replace("{share_id}", str(share_id))
    html = render_email_template(
        "email/share_rejected_requester.html",
        {
            "subject": subject,
            "requester_name": requester_name,
            "supervisor_name": supervisor_name,
            "share_name": share_name or f"Compartilhamento #{share_id}",
            "rejection_reason": rejection_reason,
            "details_url": details_url,
        }
    )
    try:
        await send_email(subject, [requester_email], html)
        _log_email(email_type="approval_rejected", to_email=requester_email, subject=subject,
                   body=html, share_id=share_id, user_id=requester_user_id, status="sent")
    except Exception as exc:
        _log_email(email_type="approval_rejected", to_email=requester_email, subject=subject,
                   body=html, share_id=share_id, user_id=requester_user_id, status="failed", error_message=str(exc))
        raise