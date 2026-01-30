
# app/services/email_service.py
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from jinja2 import Environment, FileSystemLoader, select_autoescape
import boto3
from datetime import datetime
from app.core.config import settings

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


async def send_email_dev(subject: str, recipients: list[str], body: str):
    conf = ConnectionConfig(
        MAIL_USERNAME=settings.smtp_user,
        MAIL_PASSWORD=settings.smtp_pass,
        MAIL_FROM=settings.mail_from,
        MAIL_PORT=settings.smtp_port,
        MAIL_SERVER=settings.smtp_server,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True
    )
    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=body,
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)

def send_email_ses(subject: str, recipients: list[str], body: str):
    client = boto3.client(
        "ses",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key
    )
    client.send_email(
        Source=settings.mail_from,
        Destination={"ToAddresses": recipients},
        Message={
            "Subject": {"Data": subject, "Charset": "UTF-8"},
            "Body": {"Html": {"Data": body, "Charset": "UTF-8"}}
        }
    )

async def send_email(subject: str, recipients: list[str], body: str):
    if settings.email_provider == "ses":
        send_email_ses(subject, recipients, body)
    else:
        await send_email_dev(subject, recipients, body)


def send_custom_email(to_email: str, subject: str, body_html: str):
    """
    Envia email customizado de forma sincrona.
    Usado pelo routes_emails.py.
    """
    if settings.email_provider == "ses":
        send_email_ses(subject, [to_email], body_html)
    else:
        # Em modo dev, apenas loga o email
        print(f"[EMAIL DEV] To: {to_email}")
        print(f"[EMAIL DEV] Subject: {subject}")
        print(f"[EMAIL DEV] Body: {body_html[:200]}...")


# ---- Facades de e-mail de negócios ----
async def send_otp_email(dest_email: str, code: str, expires_at: datetime):
    html = render_email_template(
        "email/otp_code.html",
        {
            "subject": "Seu código de acesso",
            "code": code,
            "expires_at": expires_at.strftime("%d/%m/%Y %H:%M"),
            "portal_url": settings.frontend_external_portal_url,
        }
    )
    await send_email("Seu código de acesso", [dest_email], html)


async def send_share_approved_external_email(external_email: str, applicant_name: str, files_quantity: int, expires_at: datetime):
    html = render_email_template(
        "email/share_approved_external.html",
        {
            "subject": "Arquivos disponíveis para download",
            "applicant_name": applicant_name,
            "files_quantity": files_quantity,
            "expires_at": expires_at.strftime("%d/%m/%Y %H:%M"),
            "portal_url": settings.frontend_external_portal_url
        }
    )
    await send_email("Arquivos disponíveis para download", [external_email], html)


async def send_share_approved_requester_email(applicant_email: str, applicant_name: str, external_email: str, share_id: int):
    details_url = settings.frontend_share_details_url.replace("{share_id}", str(share_id))
    html = render_email_template(
        "email/share_approved_requester.html",
        {
            "subject": "Compartilhamento aprovado",
            "applicant_name": applicant_name,
            "external_email": external_email,
            "details_url": details_url
        }
    )
    await send_email("Compartilhamento aprovado", [applicant_email], html)


