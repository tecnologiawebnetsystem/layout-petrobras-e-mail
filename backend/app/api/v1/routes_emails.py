"""
Rotas para gerenciamento de emails.
Compativel com as chamadas do frontend Next.js.

Endpoints:
- POST /v1/emails/send - Envia email via SES ou SMTP
- GET /v1/emails/history - Lista historico de emails
- GET /v1/emails/{message_id}/status - Status de um email especifico
- POST /v1/emails/otp - Envia email com codigo OTP
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select, func
from datetime import datetime, UTC
from typing import Optional, List
import uuid

from app.db.session import get_session
from app.models.user import User
from app.models.audit import Audit
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


# =====================================================
# Armazenamento de emails enviados (em producao usar banco)
# =====================================================

class EmailRecord:
    def __init__(
        self,
        message_id: str,
        to: List[str],
        subject: str,
        sender_id: int,
        status: str = "sent"
    ):
        self.message_id = message_id
        self.to = to
        self.subject = subject
        self.sender_id = sender_id
        self.status = status
        self.sent_at = datetime.now(UTC)
        self.delivered_at = None
        self.bounced_at = None
        self.bounce_reason = None
        self.opens = 0
        self.clicks = 0


_email_history: dict[str, EmailRecord] = {}


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
        # TODO: Renderizar template com template_data
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
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao enviar email: {str(e)}"
        )
    
    # Registra no historico
    record = EmailRecord(
        message_id=message_id,
        to=payload.to,
        subject=payload.subject,
        sender_id=current_user.id,
    )
    _email_history[message_id] = record
    
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
        "sent_at": datetime.now(UTC).isoformat(),
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
    """
    # Filtra emails do usuario
    user_emails = [
        e for e in _email_history.values()
        if e.sender_id == current_user.id
    ]
    
    # Aplica filtros
    if status:
        user_emails = [e for e in user_emails if e.status == status]
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            user_emails = [e for e in user_emails if e.sent_at >= start_dt]
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            user_emails = [e for e in user_emails if e.sent_at <= end_dt]
        except ValueError:
            pass
    
    # Ordena por data (mais recente primeiro)
    user_emails.sort(key=lambda x: x.sent_at, reverse=True)
    
    # Paginacao
    total_items = len(user_emails)
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1
    offset = (page - 1) * limit
    paginated = user_emails[offset:offset + limit]
    
    return {
        "emails": [
            {
                "message_id": e.message_id,
                "to": e.to,
                "subject": e.subject,
                "status": e.status,
                "sent_at": e.sent_at.isoformat(),
                "delivered_at": e.delivered_at.isoformat() if e.delivered_at else None,
                "opens": e.opens,
                "clicks": e.clicks,
            }
            for e in paginated
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
    """
    record = _email_history.get(message_id)
    
    if not record:
        raise HTTPException(status_code=404, detail="Email nao encontrado")
    
    # Verifica se pertence ao usuario
    if record.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    return {
        "message_id": message_id,
        "status": record.status,
        "sent_at": record.sent_at.isoformat(),
        "delivered_at": record.delivered_at.isoformat() if record.delivered_at else None,
        "bounced_at": record.bounced_at.isoformat() if record.bounced_at else None,
        "bounce_reason": record.bounce_reason,
        "opens": record.opens,
        "clicks": record.clicks,
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
    
    try:
        send_custom_email(
            to_email=payload.email,
            subject=f"Codigo de Verificacao - {settings.company_name}",
            body_html=html_content,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao enviar email OTP: {str(e)}"
        )
    
    message_id = f"otp_{uuid.uuid4().hex[:16]}"
    
    log_event(
        session=session,
        action="ENVIAR_OTP_EMAIL",
        detail=f"to={payload.email}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return {
        "success": True,
        "message_id": message_id,
    }
