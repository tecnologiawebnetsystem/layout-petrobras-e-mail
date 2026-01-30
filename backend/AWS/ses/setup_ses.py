#!/usr/bin/env python3
"""
Script para configuracao do Amazon SES (Simple Email Service) para o sistema
de transferencia segura de arquivos da Petrobras.

Uso:
    python setup_ses.py verify-domain --domain petrobras.com.br
    python setup_ses.py verify-email --email no-reply@petrobras.com.br
    python setup_ses.py create-template --name otp_code
    python setup_ses.py list-identities
    python setup_ses.py check-quota
    python setup_ses.py request-production
"""

import boto3
import json
import argparse
from botocore.exceptions import ClientError


DEFAULT_REGION = "sa-east-1"


def get_ses_client(region: str = DEFAULT_REGION):
    """Retorna cliente SES."""
    return boto3.client("ses", region_name=region)


def get_sesv2_client(region: str = DEFAULT_REGION):
    """Retorna cliente SES v2."""
    return boto3.client("sesv2", region_name=region)


def verify_domain(domain: str, region: str = DEFAULT_REGION):
    """
    Inicia verificacao de dominio para envio de emails.
    Retorna registros DNS que precisam ser configurados.
    """
    ses = get_ses_client(region)
    
    print(f"Iniciando verificacao do dominio: {domain}")
    
    try:
        # Verificar dominio
        response = ses.verify_domain_identity(Domain=domain)
        verification_token = response["VerificationToken"]
        
        print(f"\n[OK] Solicitacao de verificacao enviada")
        print(f"\nAdicione o seguinte registro TXT no DNS do dominio:")
        print("-" * 60)
        print(f"  Nome: _amazonses.{domain}")
        print(f"  Tipo: TXT")
        print(f"  Valor: {verification_token}")
        print("-" * 60)
        
        # Configurar DKIM
        print("\nConfigurando DKIM...")
        dkim_response = ses.verify_domain_dkim(Domain=domain)
        dkim_tokens = dkim_response["DkimTokens"]
        
        print(f"\nAdicione os seguintes registros CNAME para DKIM:")
        print("-" * 60)
        for token in dkim_tokens:
            print(f"  Nome: {token}._domainkey.{domain}")
            print(f"  Tipo: CNAME")
            print(f"  Valor: {token}.dkim.amazonses.com")
            print()
        print("-" * 60)
        
        # Configurar MAIL FROM customizado
        mail_from_domain = f"mail.{domain}"
        print(f"\nConfigurando MAIL FROM customizado: {mail_from_domain}")
        
        try:
            ses.set_identity_mail_from_domain(
                Identity=domain,
                MailFromDomain=mail_from_domain,
                BehaviorOnMXFailure="UseDefaultValue"
            )
            
            print(f"\nAdicione os seguintes registros para MAIL FROM:")
            print("-" * 60)
            print(f"  Nome: {mail_from_domain}")
            print(f"  Tipo: MX")
            print(f"  Valor: 10 feedback-smtp.{region}.amazonses.com")
            print()
            print(f"  Nome: {mail_from_domain}")
            print(f"  Tipo: TXT")
            print(f"  Valor: \"v=spf1 include:amazonses.com ~all\"")
            print("-" * 60)
        except ClientError as e:
            print(f"  [WARN] MAIL FROM nao configurado: {e}")
        
        print("\n[INFO] Apos configurar os registros DNS, aguarde a propagacao (ate 72h)")
        print("[INFO] Use 'python setup_ses.py check-domain --domain {domain}' para verificar status")
        
        return True
        
    except ClientError as e:
        print(f"[ERROR] Erro ao verificar dominio: {e}")
        return False


def verify_email(email: str, region: str = DEFAULT_REGION):
    """
    Envia email de verificacao para um endereco especifico.
    Util para testes em sandbox mode.
    """
    ses = get_ses_client(region)
    
    print(f"Enviando verificacao para: {email}")
    
    try:
        ses.verify_email_identity(EmailAddress=email)
        print(f"\n[OK] Email de verificacao enviado para {email}")
        print("[INFO] Verifique a caixa de entrada e clique no link de confirmacao")
        return True
        
    except ClientError as e:
        print(f"[ERROR] Erro ao enviar verificacao: {e}")
        return False


def check_domain_status(domain: str, region: str = DEFAULT_REGION):
    """
    Verifica status de verificacao do dominio.
    """
    ses = get_ses_client(region)
    
    print(f"Verificando status do dominio: {domain}")
    
    try:
        # Status de verificacao
        response = ses.get_identity_verification_attributes(Identities=[domain])
        attrs = response["VerificationAttributes"].get(domain, {})
        
        status = attrs.get("VerificationStatus", "NotStarted")
        print(f"\n  Status de verificacao: {status}")
        
        # Status DKIM
        dkim_response = ses.get_identity_dkim_attributes(Identities=[domain])
        dkim_attrs = dkim_response["DkimAttributes"].get(domain, {})
        
        dkim_enabled = dkim_attrs.get("DkimEnabled", False)
        dkim_status = dkim_attrs.get("DkimVerificationStatus", "NotStarted")
        
        print(f"  DKIM habilitado: {dkim_enabled}")
        print(f"  DKIM status: {dkim_status}")
        
        # Status MAIL FROM
        mail_from_response = ses.get_identity_mail_from_domain_attributes(Identities=[domain])
        mail_from_attrs = mail_from_response["MailFromDomainAttributes"].get(domain, {})
        
        mail_from_domain = mail_from_attrs.get("MailFromDomain", "N/A")
        mail_from_status = mail_from_attrs.get("MailFromDomainStatus", "N/A")
        
        print(f"  MAIL FROM domain: {mail_from_domain}")
        print(f"  MAIL FROM status: {mail_from_status}")
        
        if status == "Success" and dkim_status == "Success":
            print("\n[OK] Dominio totalmente verificado e pronto para uso!")
        else:
            print("\n[WARN] Dominio ainda nao esta totalmente verificado")
        
        return status == "Success"
        
    except ClientError as e:
        print(f"[ERROR] Erro ao verificar status: {e}")
        return False


def list_identities(region: str = DEFAULT_REGION):
    """
    Lista todas as identidades verificadas.
    """
    ses = get_ses_client(region)
    
    print("Identidades verificadas:")
    print("=" * 60)
    
    try:
        # Listar dominios
        domains = ses.list_identities(IdentityType="Domain")["Identities"]
        emails = ses.list_identities(IdentityType="EmailAddress")["Identities"]
        
        # Obter status
        all_identities = domains + emails
        if all_identities:
            response = ses.get_identity_verification_attributes(Identities=all_identities)
            attrs = response["VerificationAttributes"]
        else:
            attrs = {}
        
        print("\nDominios:")
        for domain in domains:
            status = attrs.get(domain, {}).get("VerificationStatus", "Unknown")
            print(f"  {domain}: {status}")
        
        print("\nEmails:")
        for email in emails:
            status = attrs.get(email, {}).get("VerificationStatus", "Unknown")
            print(f"  {email}: {status}")
        
        return True
        
    except ClientError as e:
        print(f"[ERROR] Erro ao listar identidades: {e}")
        return False


def check_quota(region: str = DEFAULT_REGION):
    """
    Verifica cotas e limites de envio.
    """
    ses = get_ses_client(region)
    
    print("Cotas e limites de envio:")
    print("=" * 60)
    
    try:
        quota = ses.get_send_quota()
        
        max_24h = quota["Max24HourSend"]
        max_rate = quota["MaxSendRate"]
        sent_24h = quota["SentLast24Hours"]
        
        print(f"\n  Limite 24h: {max_24h}")
        print(f"  Enviados 24h: {sent_24h}")
        print(f"  Disponivel: {max_24h - sent_24h}")
        print(f"  Taxa maxima: {max_rate}/segundo")
        
        # Verificar se esta em sandbox
        sesv2 = get_sesv2_client(region)
        account = sesv2.get_account()
        
        production_access = account.get("ProductionAccessEnabled", False)
        
        print(f"\n  Modo: {'PRODUCAO' if production_access else 'SANDBOX'}")
        
        if not production_access:
            print("\n[WARN] Conta em modo SANDBOX!")
            print("  - So pode enviar para emails verificados")
            print("  - Use 'python setup_ses.py request-production' para solicitar acesso")
        
        return True
        
    except ClientError as e:
        print(f"[ERROR] Erro ao verificar cotas: {e}")
        return False


def create_email_template(template_name: str, region: str = DEFAULT_REGION):
    """
    Cria templates de email no SES.
    """
    ses = get_ses_client(region)
    
    # Templates disponiveis
    templates = {
        "otp_code": {
            "TemplateName": "petrobras_otp_code",
            "SubjectPart": "Seu codigo de acesso - {{app_name}}",
            "HtmlPart": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00853F; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .code { font-size: 32px; font-weight: bold; color: #00853F; text-align: center; 
                padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{company_name}}</h1>
        </div>
        <div class="content">
            <p>Ola,</p>
            <p>Seu codigo de acesso para o sistema de transferencia de arquivos:</p>
            <div class="code">{{code}}</div>
            <p>Este codigo expira em <strong>{{expires_minutes}} minutos</strong>.</p>
            <p>Se voce nao solicitou este codigo, ignore este email.</p>
        </div>
        <div class="footer">
            <p>{{company_name}} - {{app_name}}</p>
            <p>Este e um email automatico, nao responda.</p>
        </div>
    </div>
</body>
</html>
""",
            "TextPart": """
{{company_name}} - {{app_name}}

Seu codigo de acesso: {{code}}

Este codigo expira em {{expires_minutes}} minutos.

Se voce nao solicitou este codigo, ignore este email.
"""
        },
        "share_approved_external": {
            "TemplateName": "petrobras_share_approved_external",
            "SubjectPart": "Arquivos disponiveis para download - {{company_name}}",
            "HtmlPart": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00853F; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { display: inline-block; background: #00853F; color: white; 
                  padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{company_name}}</h1>
        </div>
        <div class="content">
            <p>Ola,</p>
            <p><strong>{{sender_name}}</strong> compartilhou <strong>{{files_count}} arquivo(s)</strong> com voce.</p>
            <p>Os arquivos estarao disponiveis ate <strong>{{expires_at}}</strong>.</p>
            <p style="text-align: center;">
                <a href="{{portal_url}}" class="button">Acessar Arquivos</a>
            </p>
            <p>Voce precisara verificar seu email para acessar os arquivos.</p>
        </div>
        <div class="footer">
            <p>{{company_name}} - Sistema de Transferencia Segura de Arquivos</p>
        </div>
    </div>
</body>
</html>
""",
            "TextPart": """
{{company_name}}

{{sender_name}} compartilhou {{files_count}} arquivo(s) com voce.

Os arquivos estarao disponiveis ate {{expires_at}}.

Acesse: {{portal_url}}

Voce precisara verificar seu email para acessar os arquivos.
"""
        },
        "share_approved_requester": {
            "TemplateName": "petrobras_share_approved_requester",
            "SubjectPart": "Compartilhamento aprovado - {{company_name}}",
            "HtmlPart": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00853F; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724;
                   padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{company_name}}</h1>
        </div>
        <div class="content">
            <p>Ola {{requester_name}},</p>
            <div class="success">
                <strong>Seu compartilhamento foi aprovado!</strong>
            </div>
            <p>Os arquivos foram disponibilizados para <strong>{{external_email}}</strong>.</p>
            <p>O destinatario recebera um email com instrucoes de acesso.</p>
            <p><a href="{{details_url}}">Ver detalhes do compartilhamento</a></p>
        </div>
        <div class="footer">
            <p>{{company_name}} - Sistema de Transferencia Segura de Arquivos</p>
        </div>
    </div>
</body>
</html>
""",
            "TextPart": """
{{company_name}}

Ola {{requester_name}},

Seu compartilhamento foi aprovado!

Os arquivos foram disponibilizados para {{external_email}}.

Ver detalhes: {{details_url}}
"""
        },
        "share_rejected": {
            "TemplateName": "petrobras_share_rejected",
            "SubjectPart": "Compartilhamento rejeitado - {{company_name}}",
            "HtmlPart": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00853F; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24;
                 padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{company_name}}</h1>
        </div>
        <div class="content">
            <p>Ola {{requester_name}},</p>
            <div class="error">
                <strong>Seu compartilhamento foi rejeitado.</strong>
            </div>
            <p><strong>Motivo:</strong> {{rejection_reason}}</p>
            <p>Se tiver duvidas, entre em contato com seu supervisor.</p>
        </div>
        <div class="footer">
            <p>{{company_name}} - Sistema de Transferencia Segura de Arquivos</p>
        </div>
    </div>
</body>
</html>
""",
            "TextPart": """
{{company_name}}

Ola {{requester_name}},

Seu compartilhamento foi rejeitado.

Motivo: {{rejection_reason}}

Se tiver duvidas, entre em contato com seu supervisor.
"""
        },
        "password_reset": {
            "TemplateName": "petrobras_password_reset",
            "SubjectPart": "Redefinicao de senha - {{company_name}}",
            "HtmlPart": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00853F; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { display: inline-block; background: #00853F; color: white; 
                  padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404;
                   padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{company_name}}</h1>
        </div>
        <div class="content">
            <p>Ola {{user_name}},</p>
            <p>Recebemos uma solicitacao para redefinir sua senha.</p>
            <p style="text-align: center;">
                <a href="{{reset_url}}" class="button">Redefinir Senha</a>
            </p>
            <div class="warning">
                <strong>Este link expira em {{expires_minutes}} minutos.</strong>
            </div>
            <p>Se voce nao solicitou a redefinicao de senha, ignore este email ou entre em contato com o suporte.</p>
        </div>
        <div class="footer">
            <p>{{company_name}} - Sistema de Transferencia Segura de Arquivos</p>
            <p>Este e um email automatico, nao responda.</p>
        </div>
    </div>
</body>
</html>
""",
            "TextPart": """
{{company_name}}

Ola {{user_name}},

Recebemos uma solicitacao para redefinir sua senha.

Acesse o link abaixo para redefinir sua senha:
{{reset_url}}

Este link expira em {{expires_minutes}} minutos.

Se voce nao solicitou a redefinicao de senha, ignore este email.
"""
        },
        "file_expiring": {
            "TemplateName": "petrobras_file_expiring",
            "SubjectPart": "Arquivos expirando em breve - {{company_name}}",
            "HtmlPart": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00853F; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404;
                   padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; background: #00853F; color: white; 
                  padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{company_name}}</h1>
        </div>
        <div class="content">
            <p>Ola,</p>
            <div class="warning">
                <strong>Voce tem arquivos que expiram em breve!</strong>
            </div>
            <p>Os seguintes arquivos compartilhados com voce expirarao em <strong>{{hours_remaining}} horas</strong>:</p>
            <ul>
                {{#files}}
                <li>{{name}} ({{size}})</li>
                {{/files}}
            </ul>
            <p style="text-align: center;">
                <a href="{{portal_url}}" class="button">Baixar Agora</a>
            </p>
        </div>
        <div class="footer">
            <p>{{company_name}} - Sistema de Transferencia Segura de Arquivos</p>
        </div>
    </div>
</body>
</html>
""",
            "TextPart": """
{{company_name}}

Ola,

Voce tem arquivos que expiram em {{hours_remaining}} horas!

Arquivos:
{{#files}}
- {{name}} ({{size}})
{{/files}}

Acesse: {{portal_url}}
"""
        },
        "approval_request": {
            "TemplateName": "petrobras_approval_request",
            "SubjectPart": "Solicitacao de aprovacao pendente - {{company_name}}",
            "HtmlPart": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00853F; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460;
                padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; background: #00853F; color: white; 
                  padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .button-danger { background: #dc3545; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{company_name}}</h1>
        </div>
        <div class="content">
            <p>Ola {{supervisor_name}},</p>
            <div class="info">
                <strong>Nova solicitacao de compartilhamento aguardando aprovacao</strong>
            </div>
            <p><strong>Solicitante:</strong> {{requester_name}} ({{requester_email}})</p>
            <p><strong>Destinatario:</strong> {{recipient_email}}</p>
            <p><strong>Arquivos:</strong> {{files_count}} arquivo(s)</p>
            <p><strong>Expiracao solicitada:</strong> {{expiration_hours}} horas</p>
            <p style="text-align: center;">
                <a href="{{approve_url}}" class="button">Aprovar</a>
                <a href="{{reject_url}}" class="button button-danger">Rejeitar</a>
            </p>
            <p><a href="{{details_url}}">Ver detalhes completos</a></p>
        </div>
        <div class="footer">
            <p>{{company_name}} - Sistema de Transferencia Segura de Arquivos</p>
        </div>
    </div>
</body>
</html>
""",
            "TextPart": """
{{company_name}}

Ola {{supervisor_name}},

Nova solicitacao de compartilhamento aguardando aprovacao.

Solicitante: {{requester_name}} ({{requester_email}})
Destinatario: {{recipient_email}}
Arquivos: {{files_count}} arquivo(s)
Expiracao solicitada: {{expiration_hours}} horas

Ver detalhes: {{details_url}}
"""
        }
    }
    
    if template_name not in templates and template_name != "all":
        print(f"[ERROR] Template '{template_name}' nao encontrado")
        print(f"Templates disponiveis: {', '.join(templates.keys())}, all")
        return False
    
    templates_to_create = templates if template_name == "all" else {template_name: templates[template_name]}
    
    for name, template in templates_to_create.items():
        print(f"Criando template: {template['TemplateName']}")
        
        try:
            ses.create_template(Template=template)
            print(f"  [OK] Template {template['TemplateName']} criado")
        except ClientError as e:
            if e.response["Error"]["Code"] == "AlreadyExists":
                # Atualizar template existente
                ses.update_template(Template=template)
                print(f"  [OK] Template {template['TemplateName']} atualizado")
            else:
                print(f"  [ERROR] Erro ao criar template: {e}")
                return False
    
    return True


def request_production_access(region: str = DEFAULT_REGION):
    """
    Informacoes sobre como solicitar acesso de producao.
    """
    print("Solicitacao de Acesso de Producao ao SES")
    print("=" * 60)
    print("""
Para sair do modo sandbox e ter acesso de producao, voce precisa:

1. Acessar o console AWS SES
2. Ir em "Account dashboard"
3. Clicar em "Request production access"

Informacoes necessarias:
- Mail type: Transactional
- Website URL: https://transfer.petrobras.com.br
- Use case description:
  
  "Sistema interno de transferencia segura de arquivos da Petrobras.
   Enviamos emails transacionais para:
   1. Codigos OTP para autenticacao de usuarios externos
   2. Notificacoes de compartilhamento aprovado/rejeitado
   3. Alertas de expiracao de arquivos
   
   Volume estimado: 500-1000 emails/dia
   Todos os destinatarios sao usuarios que solicitaram acesso ao sistema
   ou funcionarios internos notificados sobre aprovacoes."

- Additional contacts: security@petrobras.com.br

Tempo de aprovacao: 24-48 horas

Alternativa via CLI (requer permissoes especiais):
aws sesv2 put-account-details \\
  --mail-type TRANSACTIONAL \\
  --website-url "https://transfer.petrobras.com.br" \\
  --use-case-description "Sistema de transferencia de arquivos..." \\
  --additional-contact-email-addresses "security@petrobras.com.br" \\
  --production-access-enabled
""")


def configure_configuration_set(name: str, region: str = DEFAULT_REGION):
    """
    Cria Configuration Set para tracking de emails.
    """
    sesv2 = get_sesv2_client(region)
    
    config_set_name = f"petrobras-{name}"
    
    print(f"Criando Configuration Set: {config_set_name}")
    
    try:
        # Criar configuration set
        sesv2.create_configuration_set(
            ConfigurationSetName=config_set_name,
            TrackingOptions={
                "CustomRedirectDomain": ""  # Usar dominio SES padrao
            },
            SendingOptions={
                "SendingEnabled": True
            },
            ReputationOptions={
                "ReputationMetricsEnabled": True,
                "LastFreshStart": "2024-01-01T00:00:00Z"
            },
            Tags=[
                {"Key": "Project", "Value": "PetrobrasFileTransfer"},
                {"Key": "Environment", "Value": name}
            ]
        )
        print(f"  [OK] Configuration Set criado")
        
        # Adicionar event destination para CloudWatch
        sesv2.create_configuration_set_event_destination(
            ConfigurationSetName=config_set_name,
            EventDestinationName=f"{config_set_name}-cloudwatch",
            EventDestination={
                "Enabled": True,
                "MatchingEventTypes": [
                    "SEND", "REJECT", "BOUNCE", "COMPLAINT", 
                    "DELIVERY", "OPEN", "CLICK"
                ],
                "CloudWatchDestination": {
                    "DimensionConfigurations": [
                        {
                            "DimensionName": "ses:source-ip",
                            "DimensionValueSource": "MESSAGE_TAG",
                            "DefaultDimensionValue": "unknown"
                        }
                    ]
                }
            }
        )
        print(f"  [OK] Event destination CloudWatch configurado")
        
        return True
        
    except ClientError as e:
        if "AlreadyExists" in str(e):
            print(f"  [INFO] Configuration Set ja existe")
            return True
        print(f"  [ERROR] Erro ao criar configuration set: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Configuracao do Amazon SES para Petrobras File Transfer"
    )
    
    parser.add_argument(
        "action",
        choices=[
            "verify-domain", "verify-email", "check-domain", 
            "list-identities", "check-quota", "create-template",
            "request-production", "create-config-set"
        ],
        help="Acao a executar"
    )
    
    parser.add_argument("--domain", help="Dominio para verificar")
    parser.add_argument("--email", help="Email para verificar")
    parser.add_argument("--name", help="Nome do template ou config set")
    parser.add_argument("--region", default=DEFAULT_REGION, help=f"Regiao AWS (default: {DEFAULT_REGION})")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Petrobras File Transfer - Configuracao SES")
    print("=" * 60)
    print(f"Regiao: {args.region}")
    print("=" * 60)
    print()
    
    if args.action == "verify-domain":
        if not args.domain:
            print("[ERROR] --domain e obrigatorio")
            return
        verify_domain(args.domain, args.region)
    
    elif args.action == "verify-email":
        if not args.email:
            print("[ERROR] --email e obrigatorio")
            return
        verify_email(args.email, args.region)
    
    elif args.action == "check-domain":
        if not args.domain:
            print("[ERROR] --domain e obrigatorio")
            return
        check_domain_status(args.domain, args.region)
    
    elif args.action == "list-identities":
        list_identities(args.region)
    
    elif args.action == "check-quota":
        check_quota(args.region)
    
    elif args.action == "create-template":
        name = args.name or "all"
        create_email_template(name, args.region)
    
    elif args.action == "request-production":
        request_production_access(args.region)
    
    elif args.action == "create-config-set":
        name = args.name or "prod"
        configure_configuration_set(name, args.region)


if __name__ == "__main__":
    main()
