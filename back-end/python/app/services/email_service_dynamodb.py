"""
Servico de Email
Envia emails via AWS SES e registra no DynamoDB
"""

import os
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import uuid4
import logging
import boto3
from botocore.exceptions import ClientError

from app.core.dynamodb_client import db
from app.models.dynamodb_models import Email, EmailType

logger = logging.getLogger(__name__)

# Configuracoes
AWS_REGION = os.getenv("AWS_REGION", "sa-east-1")
SES_SENDER_EMAIL = os.getenv("SES_SENDER_EMAIL", "noreply@petrobras.com.br")
SES_SENDER_NAME = os.getenv("SES_SENDER_NAME", "Petrobras - Compartilhamento Seguro")
APP_URL = os.getenv("APP_URL", "https://compartilhamento.petrobras.com.br")


class EmailService:
    """Servico para envio de emails"""
    
    _ses_client = None
    
    @classmethod
    def get_ses_client(cls):
        """Retorna cliente SES (singleton)"""
        if cls._ses_client is None:
            cls._ses_client = boto3.client('ses', region_name=AWS_REGION)
        return cls._ses_client
    
    @staticmethod
    def _record_email(
        email_type: EmailType,
        to_email: str,
        subject: str,
        status: str = "pending",
        to_name: Optional[str] = None,
        message_id: Optional[str] = None,
        related_share_id: Optional[str] = None,
        error_message: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Email:
        """Registra email no DynamoDB"""
        email = Email(
            email_id=str(uuid4()),
            message_id=message_id,
            type=email_type,
            to_email=to_email,
            to_name=to_name,
            from_email=SES_SENDER_EMAIL,
            subject=subject,
            status=status,
            sent_at=datetime.utcnow().isoformat() if status == "sent" else None,
            error_message=error_message,
            related_share_id=related_share_id,
            metadata=metadata,
        )
        
        db.create_email_record(email.to_dynamodb_item())
        return email
    
    @staticmethod
    def _send_email(
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        email_type: EmailType,
        to_name: Optional[str] = None,
        related_share_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Envia email via SES e registra
        
        Returns:
            True se enviado com sucesso
        """
        ses = EmailService.get_ses_client()
        
        try:
            response = ses.send_email(
                Source=f"{SES_SENDER_NAME} <{SES_SENDER_EMAIL}>",
                Destination={
                    'ToAddresses': [to_email]
                },
                Message={
                    'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                    'Body': {
                        'Text': {'Data': text_body, 'Charset': 'UTF-8'},
                        'Html': {'Data': html_body, 'Charset': 'UTF-8'}
                    }
                }
            )
            
            message_id = response.get('MessageId')
            
            # Registra sucesso
            EmailService._record_email(
                email_type=email_type,
                to_email=to_email,
                to_name=to_name,
                subject=subject,
                status="sent",
                message_id=message_id,
                related_share_id=related_share_id,
                metadata=metadata,
            )
            
            logger.info(f"Email enviado: {to_email} ({email_type})")
            return True
            
        except ClientError as e:
            error_msg = str(e)
            
            # Registra falha
            EmailService._record_email(
                email_type=email_type,
                to_email=to_email,
                to_name=to_name,
                subject=subject,
                status="failed",
                error_message=error_msg,
                related_share_id=related_share_id,
                metadata=metadata,
            )
            
            logger.error(f"Erro ao enviar email para {to_email}: {error_msg}")
            return False
    
    # =========================================================================
    # TEMPLATES DE EMAIL
    # =========================================================================
    
    @staticmethod
    def send_otp_email(
        recipient_email: str,
        otp_code: str,
        sender_name: str,
        share_name: str,
        expiration_hours: int,
    ) -> bool:
        """Envia email com codigo OTP para usuario externo"""
        
        subject = f"Codigo de Acesso - Compartilhamento Petrobras"
        
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(to right, #0047BB, #00A99D); padding: 20px; text-align: center; }}
        .header h1 {{ color: white; margin: 0; }}
        .content {{ padding: 30px; background: #f9f9f9; }}
        .code-box {{ background: #fff; border: 2px solid #0047BB; padding: 20px; text-align: center; margin: 20px 0; }}
        .code {{ font-size: 32px; font-weight: bold; color: #0047BB; letter-spacing: 8px; }}
        .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Petrobras</h1>
            <p style="color: white; margin: 5px 0;">Compartilhamento Seguro de Arquivos</p>
        </div>
        
        <div class="content">
            <h2>Codigo de Acesso</h2>
            
            <p>Voce recebeu um compartilhamento de <strong>{sender_name}</strong>.</p>
            
            <p>Arquivo: <strong>{share_name}</strong></p>
            
            <p>Use o codigo abaixo para acessar os arquivos:</p>
            
            <div class="code-box">
                <div class="code">{otp_code}</div>
            </div>
            
            <div class="warning">
                <strong>Importante:</strong>
                <ul>
                    <li>Este codigo expira em <strong>3 minutos</strong></li>
                    <li>Os arquivos estarao disponiveis por <strong>{expiration_hours} horas</strong></li>
                    <li>Nao compartilhe este codigo com outras pessoas</li>
                </ul>
            </div>
            
            <p>Para acessar os arquivos, clique no botao abaixo:</p>
            
            <p style="text-align: center;">
                <a href="{APP_URL}/external-verify?email={recipient_email}" 
                   style="background: #0047BB; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Acessar Arquivos
                </a>
            </p>
        </div>
        
        <div class="footer">
            <p>Este email foi enviado automaticamente pelo sistema de Compartilhamento Seguro da Petrobras.</p>
            <p>© 2025 Petrobras. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
"""
        
        text_body = f"""
PETROBRAS - COMPARTILHAMENTO SEGURO DE ARQUIVOS

Codigo de Acesso
================

Voce recebeu um compartilhamento de {sender_name}.

Arquivo: {share_name}

SEU CODIGO DE ACESSO: {otp_code}

IMPORTANTE:
- Este codigo expira em 3 minutos
- Os arquivos estarao disponiveis por {expiration_hours} horas
- Nao compartilhe este codigo com outras pessoas

Para acessar os arquivos, visite:
{APP_URL}/external-verify?email={recipient_email}

--
Este email foi enviado automaticamente pelo sistema de Compartilhamento Seguro da Petrobras.
© 2025 Petrobras. Todos os direitos reservados.
"""
        
        return EmailService._send_email(
            to_email=recipient_email,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            email_type="otp",
            metadata={
                "sender_name": sender_name,
                "share_name": share_name,
                "expiration_hours": expiration_hours,
            }
        )
    
    @staticmethod
    def send_supervisor_notification(
        supervisor_email: str,
        supervisor_name: str,
        sender_name: str,
        sender_email: str,
        share_name: str,
        description: str,
        recipient_email: str,
        expiration_hours: int,
        share_id: str,
    ) -> bool:
        """Envia email de notificacao para supervisor"""
        
        subject = f"[Aprovacao Necessaria] Novo Compartilhamento - {share_name}"
        
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(to right, #0047BB, #00A99D); padding: 20px; text-align: center; }}
        .header h1 {{ color: white; margin: 0; }}
        .content {{ padding: 30px; background: #f9f9f9; }}
        .info-box {{ background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; }}
        .info-row {{ display: flex; margin: 10px 0; }}
        .info-label {{ font-weight: bold; width: 150px; }}
        .buttons {{ text-align: center; margin: 30px 0; }}
        .btn {{ padding: 12px 25px; margin: 0 10px; text-decoration: none; border-radius: 5px; display: inline-block; }}
        .btn-approve {{ background: #00A99D; color: white; }}
        .btn-review {{ background: #0047BB; color: white; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Petrobras</h1>
            <p style="color: white; margin: 5px 0;">Compartilhamento Seguro de Arquivos</p>
        </div>
        
        <div class="content">
            <h2>Nova Solicitacao de Compartilhamento</h2>
            
            <p>Ola {supervisor_name},</p>
            
            <p>Um novo compartilhamento de arquivos esta aguardando sua aprovacao:</p>
            
            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Remetente:</span>
                    <span>{sender_name} ({sender_email})</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Descricao:</span>
                    <span>{share_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Destinatario:</span>
                    <span>{recipient_email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Validade:</span>
                    <span>{expiration_hours} horas apos aprovacao</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Detalhes:</span>
                    <span>{description}</span>
                </div>
            </div>
            
            <div class="buttons">
                <a href="{APP_URL}/supervisor" class="btn btn-review">
                    Revisar Solicitacao
                </a>
            </div>
            
            <p style="font-size: 12px; color: #666;">
                Por favor, revise cuidadosamente os arquivos antes de aprovar o compartilhamento 
                com usuarios externos.
            </p>
        </div>
        
        <div class="footer">
            <p>Este email foi enviado automaticamente pelo sistema de Compartilhamento Seguro da Petrobras.</p>
            <p>© 2025 Petrobras. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
"""
        
        text_body = f"""
PETROBRAS - COMPARTILHAMENTO SEGURO DE ARQUIVOS

Nova Solicitacao de Compartilhamento
=====================================

Ola {supervisor_name},

Um novo compartilhamento de arquivos esta aguardando sua aprovacao:

Remetente: {sender_name} ({sender_email})
Descricao: {share_name}
Destinatario: {recipient_email}
Validade: {expiration_hours} horas apos aprovacao
Detalhes: {description}

Para revisar a solicitacao, acesse:
{APP_URL}/supervisor

Por favor, revise cuidadosamente os arquivos antes de aprovar o compartilhamento com usuarios externos.

--
Este email foi enviado automaticamente pelo sistema de Compartilhamento Seguro da Petrobras.
© 2025 Petrobras. Todos os direitos reservados.
"""
        
        return EmailService._send_email(
            to_email=supervisor_email,
            to_name=supervisor_name,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            email_type="supervisor",
            related_share_id=share_id,
            metadata={
                "sender_name": sender_name,
                "sender_email": sender_email,
                "recipient_email": recipient_email,
            }
        )
    
    @staticmethod
    def send_sender_confirmation(
        sender_email: str,
        sender_name: str,
        share_name: str,
        recipient_email: str,
        expiration_hours: int,
    ) -> bool:
        """Envia email de confirmacao para o remetente"""
        
        subject = f"Compartilhamento Enviado - {share_name}"
        
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(to right, #0047BB, #00A99D); padding: 20px; text-align: center; }}
        .header h1 {{ color: white; margin: 0; }}
        .content {{ padding: 30px; background: #f9f9f9; }}
        .success-icon {{ text-align: center; font-size: 48px; margin: 20px 0; }}
        .info-box {{ background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Petrobras</h1>
            <p style="color: white; margin: 5px 0;">Compartilhamento Seguro de Arquivos</p>
        </div>
        
        <div class="content">
            <div class="success-icon">&#9989;</div>
            
            <h2 style="text-align: center;">Compartilhamento Enviado!</h2>
            
            <p>Ola {sender_name},</p>
            
            <p>Seu compartilhamento foi enviado com sucesso para aprovacao do supervisor.</p>
            
            <div class="info-box">
                <p><strong>Descricao:</strong> {share_name}</p>
                <p><strong>Destinatario:</strong> {recipient_email}</p>
                <p><strong>Validade:</strong> {expiration_hours} horas apos aprovacao</p>
                <p><strong>Status:</strong> Aguardando aprovacao</p>
            </div>
            
            <p>Voce sera notificado quando o supervisor aprovar ou rejeitar a solicitacao.</p>
            
            <p style="text-align: center;">
                <a href="{APP_URL}/historico" 
                   style="background: #0047BB; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Acompanhar Status
                </a>
            </p>
        </div>
        
        <div class="footer">
            <p>Este email foi enviado automaticamente pelo sistema de Compartilhamento Seguro da Petrobras.</p>
            <p>© 2025 Petrobras. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
"""
        
        text_body = f"""
PETROBRAS - COMPARTILHAMENTO SEGURO DE ARQUIVOS

Compartilhamento Enviado!
=========================

Ola {sender_name},

Seu compartilhamento foi enviado com sucesso para aprovacao do supervisor.

Descricao: {share_name}
Destinatario: {recipient_email}
Validade: {expiration_hours} horas apos aprovacao
Status: Aguardando aprovacao

Voce sera notificado quando o supervisor aprovar ou rejeitar a solicitacao.

Para acompanhar o status, acesse:
{APP_URL}/historico

--
Este email foi enviado automaticamente pelo sistema de Compartilhamento Seguro da Petrobras.
© 2025 Petrobras. Todos os direitos reservados.
"""
        
        return EmailService._send_email(
            to_email=sender_email,
            to_name=sender_name,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            email_type="confirmation",
            metadata={
                "recipient_email": recipient_email,
                "share_name": share_name,
            }
        )


# Instancia singleton
email_service = EmailService()
