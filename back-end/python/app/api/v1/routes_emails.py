"""
Rotas de Email - Backend Python
Endpoints para envio de emails via Resend ou AWS SES
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
import os

router = APIRouter(prefix="/emails", tags=["Emails"])


# =============================================================================
# SCHEMAS
# =============================================================================

class EmailRecipient(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class SendEmailRequest(BaseModel):
    to: List[EmailRecipient]
    cc: Optional[List[EmailRecipient]] = None
    bcc: Optional[List[EmailRecipient]] = None
    subject: str
    body: str
    html_body: Optional[str] = None
    template_type: Optional[str] = None  # 'otp', 'approval_request', 'approved', 'rejected', 'confirmation'


class SendOTPEmailRequest(BaseModel):
    email: EmailStr
    code: str
    share_info: dict  # { senderName, fileName, expirationHours }


class SendSupervisorEmailRequest(BaseModel):
    supervisor_email: EmailStr
    supervisor_name: str
    upload_data: dict  # Dados do compartilhamento


class SendConfirmationEmailRequest(BaseModel):
    sender_email: EmailStr
    upload_data: dict  # Dados do compartilhamento


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/send")
async def send_email(payload: SendEmailRequest, request: Request):
    """
    POST /api/v1/emails/send
    
    Envia email genérico.
    
    Request Body:
    {
        "to": [{"email": "dest@email.com", "name": "Nome"}],
        "subject": "Assunto do email",
        "body": "Corpo do email em texto",
        "html_body": "<html>...</html>"  // opcional
    }
    
    Response:
    {
        "success": true,
        "message_id": "msg_xxx",
        "status": "sent"
    }
    """
    try:
        # Em produção: usar Resend ou AWS SES
        # import resend
        # resend.api_key = os.getenv("RESEND_API_KEY")
        
        # Mock response para desenvolvimento
        return {
            "success": True,
            "message_id": f"msg_{datetime.utcnow().timestamp()}",
            "status": "sent",
            "recipients_count": len(payload.to)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar email: {str(e)}")


@router.post("/send-otp")
async def send_otp_email(payload: SendOTPEmailRequest, request: Request):
    """
    POST /api/v1/emails/send-otp
    
    Envia email com código OTP para usuário externo.
    
    Request Body:
    {
        "email": "externo@empresa.com",
        "code": "123456",
        "share_info": {
            "senderName": "João Silva",
            "fileName": "Documentos Q4",
            "expirationHours": 72
        }
    }
    
    Response:
    {
        "success": true,
        "message_id": "msg_xxx",
        "expires_in_seconds": 180
    }
    """
    try:
        email = payload.email
        code = payload.code
        share_info = payload.share_info
        
        # Template HTML do email OTP
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; }}
                .header {{ background: linear-gradient(135deg, #006494 0%, #00A99D 100%); padding: 30px; text-align: center; }}
                .header h1 {{ color: white; margin: 0; font-size: 24px; }}
                .content {{ padding: 30px; }}
                .code-box {{ background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; }}
                .code {{ font-size: 36px; font-weight: bold; color: #006494; letter-spacing: 8px; font-family: monospace; }}
                .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }}
                .footer {{ background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }}
                .btn {{ display: inline-block; background: #006494; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Petrobras - Compartilhamento Seguro</h1>
                </div>
                <div class="content">
                    <h2>Código de Acesso</h2>
                    <p><strong>{share_info.get('senderName', 'Um usuário')}</strong> compartilhou arquivos com você:</p>
                    <p style="color: #006494; font-weight: bold;">{share_info.get('fileName', 'Documentos')}</p>
                    
                    <div class="code-box">
                        <p style="margin: 0 0 10px 0; color: #64748b;">Seu código de acesso:</p>
                        <div class="code">{code}</div>
                        <p style="margin: 10px 0 0 0; color: #64748b; font-size: 14px;">Válido por 3 minutos</p>
                    </div>
                    
                    <div class="warning">
                        <strong>Importante:</strong>
                        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                            <li>Este código expira em <strong>3 minutos</strong></li>
                            <li>Você tem <strong>3 tentativas</strong> para inserir o código</li>
                            <li>Não compartilhe este código</li>
                            <li>Os arquivos ficam disponíveis por <strong>{share_info.get('expirationHours', 72)} horas</strong></li>
                        </ul>
                    </div>
                    
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="{os.getenv('FRONTEND_URL', 'https://localhost:3000')}/external-verify?email={email}" class="btn">
                            Acessar Portal de Download
                        </a>
                    </p>
                </div>
                <div class="footer">
                    <p>© 2026 Petrobras. Todos os direitos reservados.</p>
                    <p>Este é um email automático. Não responda.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Em produção: enviar via Resend/SES
        # import resend
        # resend.api_key = os.getenv("RESEND_API_KEY")
        # result = resend.Emails.send({
        #     "from": "Petrobras <noreply@petrobras.com.br>",
        #     "to": [email],
        #     "subject": f"Código de Acesso: {code}",
        #     "html": html_content
        # })
        
        return {
            "success": True,
            "message_id": f"otp_{datetime.utcnow().timestamp()}",
            "expires_in_seconds": 180
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar OTP: {str(e)}")


@router.post("/send-supervisor-notification")
async def send_supervisor_notification(payload: SendSupervisorEmailRequest, request: Request):
    """
    POST /api/v1/emails/send-supervisor-notification
    
    Envia notificação para supervisor aprovar compartilhamento.
    
    Request Body:
    {
        "supervisor_email": "supervisor@petrobras.com.br",
        "supervisor_name": "Maria Santos",
        "upload_data": {
            "name": "Documentos Q4",
            "sender": { "name": "João Silva", "email": "joao@petrobras.com.br" },
            "recipient": "externo@empresa.com",
            "description": "Relatórios financeiros",
            "files": [{ "name": "doc.pdf", "size": "2.5 MB" }],
            "expirationHours": 72,
            "uploadId": "upload-123"
        }
    }
    
    Response:
    {
        "success": true,
        "message_id": "msg_xxx"
    }
    """
    try:
        data = payload.upload_data
        
        files_html = ""
        for f in data.get("files", []):
            files_html += f"<li>{f.get('name')} ({f.get('size')})</li>"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; }}
                .header {{ background: linear-gradient(135deg, #006494 0%, #00A99D 100%); padding: 30px; text-align: center; }}
                .header h1 {{ color: white; margin: 0; }}
                .content {{ padding: 30px; }}
                .info-box {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; }}
                .files-box {{ background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }}
                .btn {{ display: inline-block; background: #006494; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 5px; }}
                .btn-approve {{ background: #22c55e; }}
                .footer {{ background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Aprovação Pendente</h1>
                </div>
                <div class="content">
                    <p>Olá <strong>{payload.supervisor_name}</strong>,</p>
                    <p>Um novo compartilhamento está aguardando sua aprovação:</p>
                    
                    <div class="info-box">
                        <p><strong>Solicitante:</strong> {data.get('sender', {}).get('name')}</p>
                        <p><strong>Email:</strong> {data.get('sender', {}).get('email')}</p>
                        <p><strong>Destinatário Externo:</strong> {data.get('recipient')}</p>
                        <p><strong>Descrição:</strong> {data.get('description')}</p>
                        <p><strong>Validade:</strong> {data.get('expirationHours')} horas após aprovação</p>
                    </div>
                    
                    <div class="files-box">
                        <strong>Arquivos:</strong>
                        <ul>{files_html}</ul>
                    </div>
                    
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="{os.getenv('FRONTEND_URL', 'https://localhost:3000')}/supervisor?uploadId={data.get('uploadId')}" class="btn btn-approve">
                            Revisar e Aprovar
                        </a>
                    </p>
                </div>
                <div class="footer">
                    <p>© 2026 Petrobras. Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return {
            "success": True,
            "message_id": f"supervisor_{datetime.utcnow().timestamp()}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar notificação: {str(e)}")


@router.post("/send-confirmation")
async def send_confirmation_email(payload: SendConfirmationEmailRequest, request: Request):
    """
    POST /api/v1/emails/send-confirmation
    
    Envia confirmação de envio para o remetente.
    
    Request Body:
    {
        "sender_email": "joao@petrobras.com.br",
        "upload_data": {
            "name": "Documentos Q4",
            "recipient": "externo@empresa.com",
            "files": [...],
            "uploadDate": "20/01/2026 10:30"
        }
    }
    
    Response:
    {
        "success": true,
        "message_id": "msg_xxx"
    }
    """
    try:
        data = payload.upload_data
        
        return {
            "success": True,
            "message_id": f"confirm_{datetime.utcnow().timestamp()}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar confirmação: {str(e)}")


@router.get("/{message_id}/status")
async def get_email_status(message_id: str, request: Request):
    """
    GET /api/v1/emails/{message_id}/status
    
    Retorna o status de um email enviado.
    
    Response:
    {
        "message_id": "msg_xxx",
        "status": "delivered",
        "sent_at": "2026-01-20T10:30:00Z",
        "delivered_at": "2026-01-20T10:30:05Z"
    }
    """
    return {
        "message_id": message_id,
        "status": "delivered",
        "sent_at": datetime.utcnow().isoformat(),
        "delivered_at": datetime.utcnow().isoformat()
    }


@router.get("/history")
async def get_email_history(
    page: int = 1,
    limit: int = 50,
    request: Request = None
):
    """
    GET /api/v1/emails/history?page=1&limit=50
    
    Retorna histórico de emails enviados.
    
    Response:
    {
        "emails": [...],
        "total": 100,
        "page": 1,
        "pages": 2
    }
    """
    return {
        "emails": [],
        "total": 0,
        "page": page,
        "pages": 0
    }
