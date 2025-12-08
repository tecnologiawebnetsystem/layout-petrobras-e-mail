# Estrutura Backend Python - FastAPI

## Exemplo de Implementação

### 1. main.py
\`\`\`python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, emails
from app.core.config import settings

app = FastAPI(
    title="Petrobras Email System API",
    version="1.0.0",
    description="API para sistema de envio de e-mails"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(emails.router, prefix="/api/v1/emails", tags=["emails"])

@app.get("/")
def read_root():
    return {"message": "Petrobras Email System API"}
\`\`\`

### 2. config.py
\`\`\`python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Petrobras Email System"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str
    
    # Email
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str
    
    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()
\`\`\`

### 3. api/v1/auth.py
\`\`\`python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.auth import Token, LoginRequest
from app.services.auth_service import AuthService

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    credentials: LoginRequest,
    auth_service: AuthService = Depends()
):
    user = await auth_service.authenticate_user(
        credentials.email,
        credentials.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = auth_service.create_access_token(user.id)
    refresh_token = auth_service.create_refresh_token(user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    auth_service: AuthService = Depends()
):
    # Implementar lógica de refresh
    pass

@router.post("/logout")
async def logout(
    current_user = Depends(get_current_user)
):
    # Implementar lógica de logout
    return {"message": "Logout successful"}
\`\`\`

### 4. api/v1/emails.py
\`\`\`python
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.email import SendEmailRequest, SendEmailResponse
from app.services.email_service import EmailService
from app.core.dependencies import get_current_user

router = APIRouter()

@router.post("/send", response_model=SendEmailResponse)
async def send_email(
    email_data: SendEmailRequest,
    current_user = Depends(get_current_user),
    email_service: EmailService = Depends()
):
    try:
        result = await email_service.send_email(
            sender=current_user.email,
            recipients=email_data.to,
            subject=email_data.subject,
            body=email_data.body,
            html_body=email_data.html_body,
            attachments=email_data.attachments
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )

@router.get("/{message_id}/status")
async def get_email_status(
    message_id: str,
    current_user = Depends(get_current_user),
    email_service: EmailService = Depends()
):
    status = await email_service.get_email_status(message_id)
    if not status:
        raise HTTPException(status_code=404, detail="Email not found")
    return status

@router.get("/history")
async def get_email_history(
    page: int = 1,
    limit: int = 50,
    current_user = Depends(get_current_user),
    email_service: EmailService = Depends()
):
    history = await email_service.get_user_email_history(
        user_id=current_user.id,
        page=page,
        limit=limit
    )
    return history
\`\`\`

### 5. services/email_service.py
\`\`\`python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from app.core.config import settings

class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
    
    async def send_email(
        self,
        sender: str,
        recipients: list,
        subject: str,
        body: str,
        html_body: str = None,
        attachments: list = None
    ):
        msg = MIMEMultipart('alternative')
        msg['From'] = sender
        msg['To'] = ', '.join([r['email'] for r in recipients])
        msg['Subject'] = subject
        
        # Texto e HTML
        if body:
            msg.attach(MIMEText(body, 'plain'))
        if html_body:
            msg.attach(MIMEText(html_body, 'html'))
        
        # Anexos
        if attachments:
            for attachment in attachments:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment['content'])
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename={attachment["filename"]}'
                )
                msg.attach(part)
        
        # Enviar
        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
        
        return {
            "message_id": "generated_message_id",
            "status": "sent",
            "recipients_count": len(recipients)
        }
\`\`\`

### 6. requirements.txt
\`\`\`txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
sqlalchemy==2.0.25
pydantic-settings==2.1.0
psycopg2-binary==2.9.9  # Para PostgreSQL
python-dotenv==1.0.0
\`\`\`

### 7. .env.example
\`\`\`env
# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256

# Database
DATABASE_URL=postgresql://user:password@localhost/petrobras_email

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@petrobras.com.br
SMTP_PASSWORD=your-app-password

# CORS
ALLOWED_ORIGINS=["http://localhost:3000","https://yourdomain.com"]
\`\`\`

## Como Executar

\`\`\`bash
# Instalar dependências
pip install -r requirements.txt

# Criar arquivo .env com as configurações

# Executar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
\`\`\`

## Endpoints Disponíveis

### Autenticação
- POST `/api/v1/auth/login` - Login
- POST `/api/v1/auth/refresh` - Renovar token
- POST `/api/v1/auth/logout` - Logout

### E-mails
- POST `/api/v1/emails/send` - Enviar e-mail
- GET `/api/v1/emails/{message_id}/status` - Status do e-mail
- GET `/api/v1/emails/history` - Histórico de envios

## Documentação
Após iniciar o servidor, acesse:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
