# Guia Completo: Sincronização Back-end Python com Front-end

Data: 05/01/2026
Versão: 1.0

---

## 📋 RESUMO EXECUTIVO

Este documento descreve **TUDO** que precisa ser implementado no back-end Python para sincronizar com as funcionalidades implementadas no front-end em 04/01/2026.

**Total de Tarefas:** 7 principais
**Tempo Estimado:** 40-60 horas

---

## 🗄️ PARTE 1: BANCO DE DADOS (SQL)

### 1.1 Criar Nova Tabela: `otp_codes`

\`\`\`sql
-- scripts/006_create_otp_table.sql
CREATE TABLE IF NOT EXISTS otp_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(6) NOT NULL,
    email VARCHAR(255) NOT NULL,
    share_id INTEGER REFERENCES shared_areas(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_otp_email (email),
    INDEX idx_otp_code (code),
    INDEX idx_otp_expires (expires_at)
);
\`\`\`

**Por quê?** Sistema de autenticação OTP para usuários externos precisa armazenar códigos com validade de 3 minutos.

---

### 1.2 Criar Nova Tabela: `rate_limit_attempts`

\`\`\`sql
-- scripts/007_create_rate_limit_table.sql
CREATE TABLE IF NOT EXISTS rate_limit_attempts (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    email VARCHAR(255) NULL,
    attempt_type VARCHAR(50) NOT NULL, -- 'login', 'otp', 'api'
    failed_attempts INTEGER DEFAULT 1,
    first_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blocked_until TIMESTAMP NULL,
    
    INDEX idx_rate_limit_ip (ip_address),
    INDEX idx_rate_limit_email (email),
    INDEX idx_rate_limit_blocked (blocked_until)
);
\`\`\`

**Por quê?** Rate Limiting implementado no front-end precisa persistir tentativas falhadas.

---

### 1.3 Criar Nova Tabela: `session_contexts`

\`\`\`sql
-- scripts/008_create_session_contexts_table.sql
CREATE TABLE IF NOT EXISTS session_contexts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL UNIQUE,
    user_agent VARCHAR(500) NOT NULL,
    screen_resolution VARCHAR(50) NOT NULL,
    timezone_offset INTEGER NOT NULL,
    fingerprint VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    hijack_detected BOOLEAN DEFAULT FALSE,
    hijack_detected_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    INDEX idx_session_token (session_token),
    INDEX idx_session_user (user_id),
    INDEX idx_session_valid (is_valid)
);
\`\`\`

**Por quê?** Session Hijacking Protection precisa validar contexto do navegador.

---

### 1.4 Adicionar Campos na Tabela `shared_areas`

\`\`\`sql
-- scripts/009_add_fields_shared_areas.sql
ALTER TABLE shared_areas 
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS cancellation_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL,
ADD COLUMN IF NOT EXISTS supervisor_id INTEGER REFERENCES users(id) NULL,
ADD COLUMN IF NOT EXISTS supervisor_name VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS supervisor_email VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS otp_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS otp_sent_at TIMESTAMP NULL;
\`\`\`

**Por quê?** Funcionalidades de cancelamento e captura de supervisor do AD.

---

### 1.5 Expandir Tabela `audit_logs`

\`\`\`sql
-- scripts/010_expand_audit_logs.sql
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS action_type VARCHAR(100) NULL, -- 'login', 'logout', 'upload', 'approve', 'reject', 'cancel', 'download', 'otp_request', 'otp_verify'
ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) NULL,
ADD COLUMN IF NOT EXISTS session_id VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS metadata JSONB NULL, -- Para dados extras como supervisor, rate limit info, etc
ADD COLUMN IF NOT EXISTS security_level VARCHAR(20) DEFAULT 'info'; -- 'info', 'warning', 'critical'
\`\`\`

**Por quê?** Logs de auditoria detalhados com informações de segurança.

---

## 🐍 PARTE 2: MODELOS PYTHON (SQLModel)

### 2.1 Criar Modelo: `OTPCode`

\`\`\`python
# back-end/python/app/models/otp_code.py
from sqlmodel import Field, SQLModel
from datetime import datetime
from typing import Optional

class OTPCode(SQLModel, table=True):
    __tablename__ = "otp_codes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(max_length=6)
    email: str = Field(max_length=255, index=True)
    share_id: Optional[int] = Field(default=None, foreign_key="shared_areas.id")
    expires_at: datetime
    attempts: int = Field(default=0)
    max_attempts: int = Field(default=3)
    verified: bool = Field(default=False)
    verified_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
\`\`\`

---

### 2.2 Criar Modelo: `RateLimitAttempt`

\`\`\`python
# back-end/python/app/models/rate_limit.py
from sqlmodel import Field, SQLModel
from datetime import datetime
from typing import Optional

class RateLimitAttempt(SQLModel, table=True):
    __tablename__ = "rate_limit_attempts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    ip_address: str = Field(max_length=45, index=True)
    email: Optional[str] = Field(default=None, max_length=255, index=True)
    attempt_type: str = Field(max_length=50)  # 'login', 'otp', 'api'
    failed_attempts: int = Field(default=1)
    first_attempt_at: datetime = Field(default_factory=datetime.utcnow)
    last_attempt_at: datetime = Field(default_factory=datetime.utcnow)
    blocked_until: Optional[datetime] = None
\`\`\`

---

### 2.3 Criar Modelo: `SessionContext`

\`\`\`python
# back-end/python/app/models/session_context.py
from sqlmodel import Field, SQLModel
from datetime import datetime
from typing import Optional

class SessionContext(SQLModel, table=True):
    __tablename__ = "session_contexts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    session_token: str = Field(max_length=500, unique=True, index=True)
    user_agent: str = Field(max_length=500)
    screen_resolution: str = Field(max_length=50)
    timezone_offset: int
    fingerprint: str = Field(max_length=100)
    ip_address: str = Field(max_length=45)
    is_valid: bool = Field(default=True)
    hijack_detected: bool = Field(default=False)
    hijack_detected_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_validated_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
\`\`\`

---

## 🔌 PARTE 3: ENDPOINTS API (FastAPI)

### 3.1 OTP Endpoints

\`\`\`python
# back-end/python/app/api/v1/routes_otp.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.otp_code import OTPCode
from app.models.shared_area import SharedArea
from app.services.email_service import send_otp_email
from app.services.rate_limit_service import check_rate_limit, record_attempt
from datetime import datetime, timedelta
import random
import string

router = APIRouter(prefix="/otp", tags=["OTP"])

@router.post("/generate")
async def generate_otp(
    email: str,
    share_id: int,
    request: Request,
    session: Session = Depends(get_session)
):
    """
    Gera um código OTP de 6 dígitos e envia por email.
    Validade: 3 minutos
    """
    # Verificar rate limit
    ip = request.client.host
    if not check_rate_limit(session, ip, email, "otp"):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente em 30 minutos.")
    
    # Verificar se o compartilhamento existe e está aprovado
    share = session.get(SharedArea, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado.")
    
    if share.status != "approved":
        raise HTTPException(status_code=400, detail="Compartilhamento ainda não foi aprovado.")
    
    if share.recipient_email != email:
        raise HTTPException(status_code=403, detail="Email não autorizado para este compartilhamento.")
    
    # Invalidar códigos anteriores
    statement = select(OTPCode).where(
        OTPCode.email == email,
        OTPCode.share_id == share_id,
        OTPCode.verified == False
    )
    old_codes = session.exec(statement).all()
    for old_code in old_codes:
        session.delete(old_code)
    
    # Gerar novo código
    code = ''.join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=3)
    
    otp = OTPCode(
        code=code,
        email=email,
        share_id=share_id,
        expires_at=expires_at
    )
    
    session.add(otp)
    session.commit()
    
    # Enviar email
    await send_otp_email(email, code, share.name)
    
    # Atualizar share
    share.otp_sent = True
    share.otp_sent_at = datetime.utcnow()
    session.add(share)
    session.commit()
    
    return {
        "message": "Código OTP enviado para o email.",
        "expires_in_seconds": 180
    }


@router.post("/verify")
async def verify_otp(
    email: str,
    code: str,
    share_id: int,
    request: Request,
    session: Session = Depends(get_session)
):
    """
    Verifica o código OTP fornecido pelo usuário externo.
    """
    ip = request.client.host
    
    # Buscar OTP
    statement = select(OTPCode).where(
        OTPCode.email == email,
        OTPCode.code == code,
        OTPCode.share_id == share_id,
        OTPCode.verified == False
    )
    otp = session.exec(statement).first()
    
    if not otp:
        record_attempt(session, ip, email, "otp", success=False)
        raise HTTPException(status_code=401, detail="Código inválido ou já utilizado.")
    
    # Verificar expiração
    if datetime.utcnow() > otp.expires_at:
        raise HTTPException(status_code=401, detail="Código expirado. Solicite um novo código.")
    
    # Verificar tentativas
    otp.attempts += 1
    if otp.attempts > otp.max_attempts:
        session.delete(otp)
        session.commit()
        record_attempt(session, ip, email, "otp", success=False)
        raise HTTPException(status_code=401, detail="Número máximo de tentativas excedido. Solicite um novo código.")
    
    # Marcar como verificado
    otp.verified = True
    otp.verified_at = datetime.utcnow()
    session.add(otp)
    session.commit()
    
    record_attempt(session, ip, email, "otp", success=True)
    
    return {
        "message": "Código verificado com sucesso.",
        "access_token": f"otp-verified-{share_id}-{email}",  # Gerar token JWT real aqui
        "share_id": share_id
    }
\`\`\`

---

### 3.2 Rate Limit Endpoints

\`\`\`python
# back-end/python/app/api/v1/routes_rate_limit.py
from fastapi import APIRouter, Depends, Request
from sqlmodel import Session
from app.db.session import get_session
from app.services.rate_limit_service import check_rate_limit, get_attempt_info

router = APIRouter(prefix="/rate-limit", tags=["Rate Limit"])

@router.get("/status")
async def get_rate_limit_status(
    email: str,
    request: Request,
    session: Session = Depends(get_session)
):
    """
    Retorna o status atual de rate limiting para um IP/email.
    """
    ip = request.client.host
    
    return {
        "is_blocked": not check_rate_limit(session, ip, email, "login"),
        "attempt_info": get_attempt_info(session, ip, email)
    }
\`\`\`

---

### 3.3 Session Context Endpoints

\`\`\`python
# back-end/python/app/api/v1/routes_session.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.session_context import SessionContext
from app.services.session_service import validate_session_context
from datetime import datetime

router = APIRouter(prefix="/session", tags=["Session"])

@router.post("/validate")
async def validate_session(
    session_token: str,
    user_id: int,
    user_agent: str,
    screen_resolution: str,
    timezone_offset: int,
    request: Request,
    session: Session = Depends(get_session)
):
    """
    Valida o contexto da sessão para detectar session hijacking.
    """
    statement = select(SessionContext).where(
        SessionContext.session_token == session_token,
        SessionContext.user_id == user_id,
        SessionContext.is_valid == True
    )
    stored_context = session.exec(statement).first()
    
    if not stored_context:
        raise HTTPException(status_code=401, detail="Sessão inválida.")
    
    # Verificar expiração
    if datetime.utcnow() > stored_context.expires_at:
        stored_context.is_valid = False
        session.add(stored_context)
        session.commit()
        raise HTTPException(status_code=401, detail="Sessão expirada.")
    
    # Validar contexto (detectar mudanças suspeitas)
    is_valid = validate_session_context(
        stored=stored_context,
        current_user_agent=user_agent,
        current_resolution=screen_resolution,
        current_timezone=timezone_offset
    )
    
    if not is_valid:
        stored_context.hijack_detected = True
        stored_context.hijack_detected_at = datetime.utcnow()
        stored_context.is_valid = False
        session.add(stored_context)
        session.commit()
        raise HTTPException(status_code=403, detail="Session hijacking detectado. Faça login novamente.")
    
    # Atualizar last_validated_at
    stored_context.last_validated_at = datetime.utcnow()
    session.add(stored_context)
    session.commit()
    
    return {"valid": True, "message": "Sessão válida."}
\`\`\`

---

### 3.4 Microsoft Graph API Proxy

\`\`\`python
# back-end/python/app/api/v1/routes_graph.py
from fastapi import APIRouter, Depends, HTTPException
from app.services.graph_service import get_user_profile, get_user_manager
import os

router = APIRouter(prefix="/graph", tags=["Microsoft Graph"])

@router.get("/user/{email}")
async def get_user_data(email: str):
    """
    Busca dados do usuário no Microsoft Graph API.
    Retorna: foto, cargo, departamento, localização.
    """
    try:
        profile = await get_user_profile(email)
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{email}/manager")
async def get_manager(email: str):
    """
    Busca o supervisor direto do usuário no AD da Petrobras.
    """
    try:
        manager = await get_user_manager(email)
        return manager
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
\`\`\`

---

## 🛠️ PARTE 4: SERVICES (Lógica de Negócio)

### 4.1 Email Service (Resend)

\`\`\`python
# back-end/python/app/services/email_service.py
import resend
import os
from datetime import datetime

resend.api_key = os.getenv("RESEND_API_KEY")

async def send_otp_email(to_email: str, code: str, share_name: str):
    """
    Envia email com código OTP para usuário externo.
    """
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #FDB813 0%, #008542 100%); padding: 30px; text-align: center; }}
            .code-box {{ background: #f8f9fa; border: 2px dashed #FDB813; padding: 20px; margin: 20px 0; text-align: center; }}
            .code {{ font-size: 32px; font-weight: bold; color: #008542; letter-spacing: 8px; }}
            .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="color: white; margin: 0;">Petrobras</h1>
                <p style="color: white; margin: 5px 0;">Compartilhamento de Arquivos Confidenciais</p>
            </div>
            
            <h2>Código de Verificação</h2>
            <p>Um compartilhamento foi aprovado para você: <strong>{share_name}</strong></p>
            
            <div class="code-box">
                <p style="margin: 0; color: #666;">Seu código de acesso:</p>
                <div class="code">{code}</div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Válido por 3 minutos</p>
            </div>
            
            <p><strong>⚠️ Importante:</strong></p>
            <ul>
                <li>Este código expira em <strong>3 minutos</strong></li>
                <li>Você tem <strong>3 tentativas</strong> para inserir o código correto</li>
                <li>Não compartilhe este código com ninguém</li>
            </ul>
            
            <a href="{os.getenv('FRONTEND_URL')}/external-verify?email={to_email}" 
               style="display: inline-block; background: #008542; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Acessar Portal de Verificação
            </a>
            
            <div class="footer">
                <p>© 2026 Petrobras. Todos os direitos reservados.</p>
                <p>Este é um email automático. Não responda.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    params = {
        "from": "Petrobras <noreply@petrobras.com.br>",
        "to": [to_email],
        "subject": f"🔐 Código de Verificação - {code}",
        "html": html_content
    }
    
    try:
        email = resend.Emails.send(params)
        return email
    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        raise
\`\`\`

---

### 4.2 Rate Limit Service

\`\`\`python
# back-end/python/app/services/rate_limit_service.py
from sqlmodel import Session, select
from app.models.rate_limit import RateLimitAttempt
from datetime import datetime, timedelta

def check_rate_limit(session: Session, ip: str, email: str, attempt_type: str) -> bool:
    """
    Verifica se o IP/email está bloqueado por rate limiting.
    Retorna True se pode prosseguir, False se está bloqueado.
    """
    statement = select(RateLimitAttempt).where(
        RateLimitAttempt.ip_address == ip,
        RateLimitAttempt.attempt_type == attempt_type
    )
    attempt = session.exec(statement).first()
    
    if not attempt:
        return True  # Primeira tentativa
    
    # Verificar se está bloqueado
    if attempt.blocked_until and datetime.utcnow() < attempt.blocked_until:
        return False  # Ainda bloqueado
    
    # Verificar janela de 15 minutos
    if datetime.utcnow() - attempt.first_attempt_at > timedelta(minutes=15):
        # Resetar contador após 15 minutos
        session.delete(attempt)
        session.commit()
        return True
    
    # Verificar número de tentativas
    if attempt.failed_attempts >= 5:
        # Bloquear por 30 minutos
        attempt.blocked_until = datetime.utcnow() + timedelta(minutes=30)
        session.add(attempt)
        session.commit()
        return False
    
    return True


def record_attempt(session: Session, ip: str, email: str, attempt_type: str, success: bool):
    """
    Registra uma tentativa de login/OTP/API.
    """
    statement = select(RateLimitAttempt).where(
        RateLimitAttempt.ip_address == ip,
        RateLimitAttempt.attempt_type == attempt_type
    )
    attempt = session.exec(statement).first()
    
    if success:
        # Limpar registro em caso de sucesso
        if attempt:
            session.delete(attempt)
            session.commit()
        return
    
    # Registrar falha
    if not attempt:
        attempt = RateLimitAttempt(
            ip_address=ip,
            email=email,
            attempt_type=attempt_type,
            failed_attempts=1
        )
    else:
        attempt.failed_attempts += 1
        attempt.last_attempt_at = datetime.utcnow()
    
    session.add(attempt)
    session.commit()
\`\`\`

---

### 4.3 Session Service

\`\`\`python
# back-end/python/app/services/session_service.py
from app.models.session_context import SessionContext

def validate_session_context(
    stored: SessionContext,
    current_user_agent: str,
    current_resolution: str,
    current_timezone: int
) -> bool:
    """
    Valida se o contexto da sessão mudou (possível hijacking).
    Retorna True se sessão é válida, False se suspeita.
    """
    # User-Agent deve ser EXATAMENTE igual
    if stored.user_agent != current_user_agent:
        return False
    
    # Timezone pode variar ±1 hora (horário de verão)
    if abs(stored.timezone_offset - current_timezone) > 60:
        return False
    
    # Resolução pode mudar (janela redimensionada) mas não drasticamente
    # Isso é mais tolerante
    
    return True
\`\`\`

---

### 4.4 Microsoft Graph Service

\`\`\`python
# back-end/python/app/services/graph_service.py
import httpx
import os
from typing import Dict, Any

GRAPH_API_BASE = "https://graph.microsoft.com/v1.0"

async def get_access_token() -> str:
    """
    Obtém token de acesso para o Microsoft Graph API.
    Usa Client Credentials Flow.
    """
    tenant_id = os.getenv("ENTRA_TENANT_ID")
    client_id = os.getenv("ENTRA_CLIENT_ID")
    client_secret = os.getenv("ENTRA_CLIENT_SECRET")
    
    url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": "https://graph.microsoft.com/.default",
        "grant_type": "client_credentials"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=data)
        response.raise_for_status()
        return response.json()["access_token"]


async def get_user_profile(email: str) -> Dict[str, Any]:
    """
    Busca perfil completo do usuário no AD.
    """
    token = await get_access_token()
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        # Buscar dados do usuário
        response = await client.get(
            f"{GRAPH_API_BASE}/users/{email}",
            headers=headers
        )
        response.raise_for_status()
        user_data = response.json()
        
        # Buscar foto
        photo_url = None
        try:
            photo_response = await client.get(
                f"{GRAPH_API_BASE}/users/{email}/photo/$value",
                headers=headers
            )
            if photo_response.status_code == 200:
                # Converter para base64 ou URL
                photo_url = f"data:image/jpeg;base64,{photo_response.content.hex()}"
        except:
            pass
        
        return {
            "email": user_data.get("mail"),
            "name": user_data.get("displayName"),
            "jobTitle": user_data.get("jobTitle"),
            "department": user_data.get("department"),
            "officeLocation": user_data.get("officeLocation"),
            "mobilePhone": user_data.get("mobilePhone"),
            "photo": photo_url
        }


async def get_user_manager(email: str) -> Dict[str, Any]:
    """
    Busca o supervisor direto do usuário.
    """
    token = await get_access_token()
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GRAPH_API_BASE}/users/{email}/manager",
            headers=headers
        )
        response.raise_for_status()
        manager_data = response.json()
        
        return {
            "email": manager_data.get("mail"),
            "name": manager_data.get("displayName"),
            "jobTitle": manager_data.get("jobTitle"),
            "department": manager_data.get("department")
        }
\`\`\`

---

## ⚙️ PARTE 5: CONFIGURAÇÕES

### 5.1 Adicionar Variáveis de Ambiente

\`\`\`env
# .env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
ENTRA_TENANT_ID=5b6f6241-9a57-4be4-8e50-1dfa72e79a57
ENTRA_CLIENT_ID=da3aaaad-619f-4bee-a434-51efd11faf7c
ENTRA_CLIENT_SECRET=Pnt8Q~0CQeLtKfv2T.jbQqRL.th5uPZwRIHfoaKM
FRONTEND_URL=https://layout-petro-e-mail.vercel.app
\`\`\`

---

### 5.2 Atualizar `requirements.txt`

\`\`\`txt
# back-end/python/requirements.txt
fastapi==0.104.1
sqlmodel==0.0.14
psycopg2-binary==2.9.9
resend==0.7.0
httpx==0.25.2
python-dotenv==1.0.0
uvicorn[standard]==0.24.0
pydantic==2.5.0
\`\`\`

---

## 📝 PARTE 6: TESTES

### 6.1 Testar OTP Flow

\`\`\`bash
# 1. Criar compartilhamento (usuário interno)
curl -X POST http://localhost:8000/api/v1/shares \
  -H "Content-Type: application/json" \
  -d '{
    "external_email": "usuario@externo.com",
    "created_by_id": 1,
    "area_id": 1
  }'

# 2. Aprovar (supervisor)
curl -X PATCH http://localhost:8000/api/v1/shares/1/approve

# 3. Gerar OTP (usuário externo)
curl -X POST http://localhost:8000/api/v1/otp/generate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@externo.com",
    "share_id": 1
  }'

# 4. Verificar OTP
curl -X POST http://localhost:8000/api/v1/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@externo.com",
    "code": "123456",
    "share_id": 1
  }'
\`\`\`

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Banco de Dados (4-6 horas)
- [ ] Criar tabela `otp_codes`
- [ ] Criar tabela `rate_limit_attempts`
- [ ] Criar tabela `session_contexts`
- [ ] Adicionar campos em `shared_areas`
- [ ] Expandir `audit_logs`
- [ ] Executar migrations

### Fase 2: Modelos Python (2-3 horas)
- [ ] Criar modelo `OTPCode`
- [ ] Criar modelo `RateLimitAttempt`
- [ ] Criar modelo `SessionContext`
- [ ] Atualizar modelo `SharedArea`
- [ ] Atualizar modelo `AuditLog`

### Fase 3: Services (8-12 horas)
- [ ] Implementar `email_service.py`
- [ ] Implementar `rate_limit_service.py`
- [ ] Implementar `session_service.py`
- [ ] Implementar `graph_service.py`
- [ ] Testar cada service individualmente

### Fase 4: Endpoints API (12-16 horas)
- [ ] Criar `routes_otp.py`
- [ ] Criar `routes_rate_limit.py`
- [ ] Criar `routes_session.py`
- [ ] Criar `routes_graph.py`
- [ ] Atualizar `routes_shares.py` (já tem cancel)
- [ ] Testar todos os endpoints

### Fase 5: Integração e Testes (8-12 horas)
- [ ] Testar fluxo completo OTP
- [ ] Testar rate limiting
- [ ] Testar session hijacking detection
- [ ] Testar integração com Graph API
- [ ] Testar cancelamento de compartilhamento
- [ ] Validar logs de auditoria

### Fase 6: Documentação (4-6 horas)
- [ ] Documentar APIs no Swagger
- [ ] Atualizar README do back-end
- [ ] Criar guia de deployment
- [ ] Documentar variáveis de ambiente

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

### Semana 1 (20 horas)
1. **Dia 1-2:** Criar todas as tabelas SQL e executar migrations
2. **Dia 3:** Criar todos os modelos Python
3. **Dia 4-5:** Implementar OTP (service + endpoint + testes)

### Semana 2 (20 horas)
4. **Dia 1-2:** Implementar Rate Limiting (service + endpoint + testes)
5. **Dia 3-4:** Implementar Session Hijacking (service + endpoint + testes)
6. **Dia 5:** Implementar Microsoft Graph API integration

### Semana 3 (20 horas)
7. **Dia 1-2:** Testes de integração completos
8. **Dia 3-4:** Correção de bugs e ajustes
9. **Dia 5:** Documentação e preparação para deploy

---

## 📊 RESUMO DE IMPACTO

### Novas Tabelas: 3
- `otp_codes`
- `rate_limit_attempts`
- `session_contexts`

### Tabelas Modificadas: 2
- `shared_areas` (+7 campos)
- `audit_logs` (+6 campos)

### Novos Endpoints: 8
- POST `/otp/generate`
- POST `/otp/verify`
- GET `/rate-limit/status`
- POST `/session/validate`
- GET `/graph/user/{email}`
- GET `/graph/user/{email}/manager`
- PATCH `/shares/{id}/cancel` (já implementado)

### Novos Services: 4
- `email_service.py`
- `rate_limit_service.py`
- `session_service.py`
- `graph_service.py`

### Tempo Total: 40-60 horas

---

## 🆘 TROUBLESHOOTING

### Problema: Email não está sendo enviado
**Solução:** Verificar se `RESEND_API_KEY` está configurada e válida.

### Problema: Graph API retorna 401
**Solução:** Verificar se as credenciais Entra ID estão corretas e se o app tem permissões no Azure Portal.

### Problema: Rate limiting não funciona
**Solução:** Verificar se a tabela `rate_limit_attempts` foi criada e se o IP está sendo capturado corretamente.

### Problema: Session hijacking detecta falsos positivos
**Solução:** Ajustar tolerância de validação em `validate_session_context()`.

---

## 📞 SUPORTE

Para dúvidas sobre implementação:
1. Consultar wiki-dev
2. Revisar este documento
3. Testar endpoints no Swagger UI

---

**Última atualização:** 05/01/2026
**Versão:** 1.0
**Autor:** Sistema v0 AI
