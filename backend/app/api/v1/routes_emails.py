"""
Rotas para gerenciamento de emails.
Compativel com as chamadas do frontend Next.js.

Endpoints:
- POST /v1/emails/send - Envia email via SES ou SMTP
- GET /v1/emails/history - Lista historico de emails (persistido na tabela email_log)
- GET /v1/emails/{message_id}/status - Status de um email especifico
- POST /v1/emails/otp - Envia email com codigo OTP
- POST /v1/emails/log-external - Registra email enviado externamente (via Graph)
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select, func
from datetime import datetime, UTC
from typing import Optional, List
import uuid

from app.db.session import get_session
from app.models.user import User
from app.models.email_log import EmailLog, EmailStatus, EmailType
from app.utils.authz import get_current_user
from app.services.audit_service import log_event
from app.services.email_service import send_custom_email
from app.core.config import settings

router = APIRouter(prefix="/emails", tags=["Emails"])


# =====================================================
# Schemas
# =====================================================

class EmailAttachment(BaseModel):
    filename: str
    content: str  # Base64 encoded
    content_type: str


class SendEmailRequest(BaseModel):
    to: List[EmailStr]
    subject: str
    body: Optional[str] = None
    html: Optional[str] = None
    template: Optional[str] = None
    template_data: Optional[dict] = None
    attachments: Optional[List[EmailAttachment]] = None


class OTPEmailRequest(BaseModel):
    email: EmailStr
    code: str
    share_info: dict


class LogExternalEmailRequest(BaseModel):
    """Schema para registrar emails enviados externamente (ex: via Microsoft Graph)."""
    message_id: Optional[str] = None
    email_type: str = "system"
    to_email: str
    subject: str
    body_preview: Optional[str] = None
    status: str = "sent"
    user_id: Optional[int] = None
    share_id: Optional[int] = None


# =====================================================
# POST /v1/emails/send
# =====================================================

@router.post("/send")
async def send_email(
    payload: SendEmailRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Envia email para os destinatarios especificados.
    Suporta texto plano, HTML ou templates.
    Persiste o registro na tabela email_log.
    """
    if not payload.body and not payload.html and not payload.template:
        raise HTTPException(
            status_code=400,
            detail="E necessario fornecer body, html ou template"
        )
    
    # Gera message_id unico
    message_id = f"msg_{uuid.uuid4().hex[:16]}"
    
    # Conteudo do email
    html_content = payload.html
    if payload.template:
        html_content = f"<html><body>{payload.body or ''}</body></html>"
    elif payload.body and not payload.html:
        html_content = f"<html><body><p>{payload.body}</p></body></html>"
    
    # Envia email
    try:
        for recipient in payload.to:
            send_custom_email(
                to_email=recipient,
                subject=payload.subject,
                body_html=html_content or payload.body or "",
            )
    except Exception as e:
        # Registra falha na tabela email_log
        for recipient in payload.to:
            email_log = EmailLog(
                message_id=f"{message_id}_{recipient}",
                email_type=EmailType.SYSTEM,
                from_email=settings.from_email if hasattr(settings, 'from_email') else f"noreply@{settings.company_name}",
                to_email=recipient,
                subject=payload.subject,
                body_preview=(payload.body or payload.html or "")[:500],
                status=EmailStatus.FAILED,
                error_message=str(e)[:1000],
                user_id=current_user.id,
                sent_at=datetime.now(UTC),
            )
            session.add(email_log)
        session.commit()
        
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao enviar email: {str(e)}"
        )
    
    # Registra no banco de dados (tabela email_log)
    now = datetime.now(UTC)
    for recipient in payload.to:
        email_log = EmailLog(
            message_id=f"{message_id}_{recipient}" if len(payload.to) > 1 else message_id,
            email_type=EmailType.SYSTEM,
            from_email=settings.from_email if hasattr(settings, 'from_email') else f"noreply@{settings.company_name}",
            to_email=recipient,
            subject=payload.subject,
            body_preview=(payload.body or payload.html or "")[:500],
            status=EmailStatus.SENT,
            user_id=current_user.id,
            sent_at=now,
        )
        session.add(email_log)
    session.commit()
    
    log_event(
        session=session,
        action="ENVIAR_EMAIL",
        user_id=current_user.id,
        detail=f"to={','.join(payload.to)}, subject={payload.subject[:50]}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return {
        "message_id": message_id,
        "status": "sent",
        "sent_to": payload.to,
        "sent_at": now.isoformat(),
    }


# =====================================================
# GET /v1/emails/history
# =====================================================

@router.get("/history")
def get_email_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None, alias="startDate"),
    end_date: Optional[str] = Query(None, alias="endDate"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Lista historico de emails enviados pelo usuario.
    Agora consulta a tabela email_log no banco de dados.
    """
    # Query base - emails do usuario
    query = select(EmailLog).where(EmailLog.user_id == current_user.id)
    count_query = select(func.count()).select_from(EmailLog).where(EmailLog.user_id == current_user.id)
    
    # Aplica filtros
    if status:
        try:
            status_enum = EmailStatus(status)
            query = query.where(EmailLog.status == status_enum)
            count_query = count_query.where(EmailLog.status == status_enum)
        except ValueError:
            pass
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.where(EmailLog.created_at >= start_dt)
            count_query = count_query.where(EmailLog.created_at >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.where(EmailLog.created_at <= end_dt)
            count_query = count_query.where(EmailLog.created_at <= end_dt)
        except ValueError:
            pass
    
    # Conta total
    total_items = session.exec(count_query).one()
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1
    
    # Ordena por data (mais recente primeiro) e aplica paginacao
    offset = (page - 1) * limit
    query = query.order_by(EmailLog.created_at.desc()).offset(offset).limit(limit)
    emails = session.exec(query).all()
    
    return {
        "emails": [
            {
                "message_id": e.message_id,
                "to": [e.to_email],
                "subject": e.subject,
                "status": e.status,
                "email_type": e.email_type,
                "sent_at": e.sent_at.isoformat() if e.sent_at else e.created_at.isoformat(),
                "delivered_at": e.delivered_at.isoformat() if e.delivered_at else None,
                "opened_at": e.opened_at.isoformat() if e.opened_at else None,
                "error_message": e.error_message,
                "opens": 1 if e.opened_at else 0,
                "clicks": 1 if e.clicked_at else 0,
            }
            for e in emails
        ],
        "total_pages": total_pages,
        "total_items": total_items,
    }


# =====================================================
# GET /v1/emails/{message_id}/status
# =====================================================

@router.get("/{message_id}/status")
def get_email_status(
    message_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna o status detalhado de um email enviado.
    Consulta a tabela email_log no banco de dados.
    """
    record = session.exec(
        select(EmailLog).where(EmailLog.message_id == message_id)
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Email nao encontrado")
    
    # Verifica se pertence ao usuario
    if record.user_id and record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    return {
        "message_id": message_id,
        "email_type": record.email_type,
        "to_email": record.to_email,
        "subject": record.subject,
        "status": record.status,
        "sent_at": record.sent_at.isoformat() if record.sent_at else None,
        "delivered_at": record.delivered_at.isoformat() if record.delivered_at else None,
        "opened_at": record.opened_at.isoformat() if record.opened_at else None,
        "clicked_at": record.clicked_at.isoformat() if record.clicked_at else None,
        "bounced_at": record.bounced_at.isoformat() if record.bounced_at else None,
        "error_message": record.error_message,
        "error_code": record.error_code,
        "opens": 1 if record.opened_at else 0,
        "clicks": 1 if record.clicked_at else 0,
    }


# =====================================================
# POST /v1/emails/otp
# =====================================================

@router.post("/otp")
async def send_otp_email(
    payload: OTPEmailRequest,
    session: Session = Depends(get_session),
    request: Request = None,
):
    """
    Envia email com codigo OTP para usuario externo.
    Este endpoint nao requer autenticacao.
    Persiste na tabela email_log.
    """
    share_info = payload.share_info
    
    # Template do email OTP
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #006B3F; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">{settings.company_name}</h1>
            <p style="margin: 5px 0;">Sistema de Transferencia Segura de Arquivos</p>
        </div>
        
        <div style="padding: 30px; background: #f5f5f5;">
            <h2 style="color: #333;">Codigo de Verificacao</h2>
            
            <p>Voce esta recebendo arquivos de <strong>{share_info.get('senderName', 'Usuario Petrobras')}</strong>.</p>
            
            <div style="background: white; border: 2px dashed #006B3F; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; color: #666;">Seu codigo de acesso:</p>
                <h1 style="margin: 10px 0; font-size: 36px; letter-spacing: 5px; color: #006B3F;">{payload.code}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">
                Este codigo expira em {share_info.get('expirationHours', 72)} horas.<br>
                Se voce nao solicitou este acesso, ignore este email.
            </p>
            
            <p><strong>Arquivo:</strong> {share_info.get('fileName', 'Compartilhamento')}</p>
        </div>
        
        <div style="background: #333; color: #999; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">Este e um email automatico. Por favor, nao responda.</p>
            <p style="margin: 5px 0;">{settings.company_name} - {settings.app_name}</p>
        </div>
    </body>
    </html>
    """
    
    message_id = f"otp_{uuid.uuid4().hex[:16]}"
    
    try:
        send_custom_email(
            to_email=payload.email,
            subject=f"Codigo de Verificacao - {settings.company_name}",
            body_html=html_content,
        )
    except Exception as e:
        # Registra falha na tabela email_log
        email_log = EmailLog(
            message_id=message_id,
            email_type=EmailType.OTP,
            from_email=settings.from_email if hasattr(settings, 'from_email') else f"noreply@{settings.company_name}",
            to_email=payload.email,
            subject=f"Codigo de Verificacao - {settings.company_name}",
            body_preview=f"OTP code sent to {payload.email}",
            status=EmailStatus.FAILED,
            error_message=str(e)[:1000],
            share_id=share_info.get('shareId'),
            sent_at=datetime.now(UTC),
        )
        session.add(email_log)
        session.commit()
        
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao enviar email OTP: {str(e)}"
        )
    
    # Registra sucesso na tabela email_log
    email_log = EmailLog(
        message_id=message_id,
        email_type=EmailType.OTP,
        from_email=settings.from_email if hasattr(settings, 'from_email') else f"noreply@{settings.company_name}",
        to_email=payload.email,
        subject=f"Codigo de Verificacao - {settings.company_name}",
        body_preview=f"OTP code sent to {payload.email}",
        status=EmailStatus.SENT,
        share_id=share_info.get('shareId'),
        sent_at=datetime.now(UTC),
    )
    session.add(email_log)
    session.commit()
    
    log_event(
        session=session,
        action="ENVIAR_OTP_EMAIL",
        detail=f"to={payload.email}, message_id={message_id}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return {
        "success": True,
        "message_id": message_id,
    }


# =====================================================
# POST /v1/emails/log-external
# =====================================================

@router.post("/log-external")
async def log_external_email(
    payload: LogExternalEmailRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Registra emails enviados externamente (ex: via Microsoft Graph no frontend).
    Isso garante que emails enviados fora do backend Python tambem sejam registrados
    na tabela email_log e na auditoria.
    """
    # Mapeia tipo de email
    email_type_map = {
        "system": EmailType.SYSTEM,
        "file_share": EmailType.FILE_SHARE,
        "otp": EmailType.OTP,
        "approval_request": EmailType.APPROVAL_REQUEST,
        "approval_granted": EmailType.APPROVAL_GRANTED,
        "approval_rejected": EmailType.APPROVAL_REJECTED,
        "expiration_warning": EmailType.EXPIRATION_WARNING,
        "download_confirmation": EmailType.DOWNLOAD_CONFIRMATION,
        "password_reset": EmailType.PASSWORD_RESET,
        "welcome": EmailType.WELCOME,
    }
    
    email_type = email_type_map.get(payload.email_type, EmailType.SYSTEM)
    
    # Mapeia status
    status_map = {
        "sent": EmailStatus.SENT,
        "delivered": EmailStatus.DELIVERED,
        "failed": EmailStatus.FAILED,
        "pending": EmailStatus.PENDING,
    }
    email_status = status_map.get(payload.status, EmailStatus.SENT)
    
    message_id = payload.message_id or f"graph_{uuid.uuid4().hex[:16]}"
    
    email_log = EmailLog(
        message_id=message_id,
        email_type=email_type,
        from_email=current_user.email,
        to_email=payload.to_email,
        subject=payload.subject,
        body_preview=payload.body_preview[:500] if payload.body_preview else None,
        status=email_status,
        user_id=payload.user_id or current_user.id,
        share_id=payload.share_id,
        sent_at=datetime.now(UTC),
    )
    session.add(email_log)
    session.commit()
    
    log_event(
        session=session,
        action="ENVIAR_EMAIL_GRAPH",
        user_id=current_user.id,
        share_id=payload.share_id,
        detail=f"to={payload.to_email}, subject={payload.subject[:50]}, type={payload.email_type}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return {
        "success": True,
        "message_id": message_id,
    }
