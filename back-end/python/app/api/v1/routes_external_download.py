"""
Rotas de Download para Usuários Externos - Backend Python
Endpoints para acesso e download de arquivos compartilhados
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi.responses import StreamingResponse, RedirectResponse
import os

router = APIRouter(prefix="/external", tags=["External Download"])


# =============================================================================
# SCHEMAS
# =============================================================================

class VerifyAccessRequest(BaseModel):
    email: EmailStr


class AuthenticateRequest(BaseModel):
    email: EmailStr
    otp_code: str


class FileDownloadInfo(BaseModel):
    id: str
    name: str
    size: str
    type: str
    download_url: Optional[str] = None
    downloaded: bool = False
    downloaded_at: Optional[str] = None


class ShareInfo(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    sender_name: str
    sender_email: EmailStr
    files: List[FileDownloadInfo]
    expires_at: str
    remaining_hours: int
    download_count: int
    max_downloads: int


# =============================================================================
# IN-MEMORY STORE (Para desenvolvimento)
# =============================================================================

# Tokens de acesso externo { token: { email, share_id, expires_at, downloads_used } }
_external_tokens: dict = {}


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/verify")
async def verify_external_access(payload: VerifyAccessRequest, request: Request):
    """
    POST /api/v1/external/verify
    
    Verifica se o email tem compartilhamentos disponíveis.
    
    Request Body:
    {
        "email": "externo@empresa.com"
    }
    
    Response (sucesso):
    {
        "has_shares": true,
        "share_count": 2,
        "message": "Compartilhamentos encontrados. Um código será enviado para seu email."
    }
    
    Response (sem compartilhamentos):
    {
        "has_shares": false,
        "share_count": 0,
        "message": "Nenhum compartilhamento encontrado para este email."
    }
    """
    email = payload.email.lower()
    
    # Em produção: buscar compartilhamentos aprovados para este email
    # shares = session.query(Share).filter(
    #     Share.recipient == email,
    #     Share.status == "approved",
    #     Share.expires_at > datetime.utcnow()
    # ).all()
    
    # Mock: simular que sempre tem compartilhamentos para teste
    has_shares = "@" in email
    share_count = 1 if has_shares else 0
    
    if has_shares:
        # Gerar e enviar OTP automaticamente
        # await generate_and_send_otp(email)
        pass
    
    return {
        "has_shares": has_shares,
        "share_count": share_count,
        "message": "Compartilhamentos encontrados. Um código será enviado para seu email." if has_shares
                   else "Nenhum compartilhamento encontrado para este email."
    }


@router.post("/authenticate")
async def authenticate_external(payload: AuthenticateRequest, request: Request):
    """
    POST /api/v1/external/authenticate
    
    Autentica usuário externo com código OTP.
    
    Request Body:
    {
        "email": "externo@empresa.com",
        "otp_code": "123456"
    }
    
    Response (sucesso):
    {
        "success": true,
        "access_token": "ext_xxx",
        "expires_in": 3600,
        "shares": [
            {
                "id": "upload-123",
                "name": "Documentos Q4",
                "sender_name": "João Silva",
                "files_count": 3,
                "expires_at": "23/01/2026 14:30"
            }
        ]
    }
    
    Response (erro):
    {
        "success": false,
        "error": "invalid_code",
        "message": "Código inválido ou expirado"
    }
    """
    email = payload.email.lower()
    
    # Em produção: validar OTP via routes_otp.py
    # otp_valid = verify_otp(email, payload.otp_code)
    
    # Mock: aceitar qualquer código de 6 dígitos para teste
    otp_valid = len(payload.otp_code) == 6 and payload.otp_code.isdigit()
    
    if not otp_valid:
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "error": "invalid_code",
                "message": "Código inválido ou expirado"
            }
        )
    
    # Gerar token de acesso
    access_token = f"ext_{email}_{datetime.utcnow().timestamp()}"
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    _external_tokens[access_token] = {
        "email": email,
        "expires_at": expires_at,
        "downloads_used": 0,
        "max_downloads": 10
    }
    
    # Mock: dados de compartilhamento
    shares = [
        {
            "id": "upload-mock",
            "name": "Documentos Compartilhados",
            "sender_name": "Sistema de Teste",
            "files_count": 2,
            "expires_at": (datetime.utcnow() + timedelta(hours=72)).strftime("%d/%m/%Y %H:%M")
        }
    ]
    
    return {
        "success": True,
        "access_token": access_token,
        "expires_in": 3600,
        "shares": shares
    }


@router.get("/shares")
async def get_available_shares(
    authorization: str = Header(...),
    request: Request = None
):
    """
    GET /api/v1/external/shares
    
    Lista todos os compartilhamentos disponíveis para o usuário externo autenticado.
    
    Headers:
    - Authorization: Bearer {access_token}
    
    Response:
    {
        "shares": [
            {
                "id": "upload-123",
                "name": "Documentos Q4",
                "description": "Relatórios financeiros trimestrais",
                "sender_name": "João Silva",
                "sender_email": "joao@petrobras.com.br",
                "files": [...],
                "expires_at": "23/01/2026 14:30",
                "remaining_hours": 48,
                "download_count": 1,
                "max_downloads": 10
            }
        ]
    }
    """
    # Validar token
    token = authorization.replace("Bearer ", "") if authorization else None
    
    if not token or token not in _external_tokens:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    
    token_data = _external_tokens[token]
    
    if datetime.utcnow() > token_data["expires_at"]:
        del _external_tokens[token]
        raise HTTPException(status_code=401, detail="Token expirado")
    
    email = token_data["email"]
    
    # Em produção: buscar compartilhamentos do banco
    # shares = session.query(Share).filter(...).all()
    
    # Mock data
    mock_shares = [
        {
            "id": "upload-mock",
            "name": "Documentos Compartilhados",
            "description": "Arquivos de teste para desenvolvimento",
            "sender_name": "Sistema de Teste",
            "sender_email": "sistema@petrobras.com.br",
            "files": [
                {
                    "id": "file-1",
                    "name": "Relatorio_Q4.pdf",
                    "size": "2.5 MB",
                    "type": "application/pdf",
                    "downloaded": False
                },
                {
                    "id": "file-2",
                    "name": "Planilha_Dados.xlsx",
                    "size": "1.2 MB",
                    "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "downloaded": False
                }
            ],
            "expires_at": (datetime.utcnow() + timedelta(hours=48)).strftime("%d/%m/%Y %H:%M"),
            "remaining_hours": 48,
            "download_count": token_data["downloads_used"],
            "max_downloads": token_data["max_downloads"]
        }
    ]
    
    return {"shares": mock_shares}


@router.get("/shares/{share_id}")
async def get_share_details(
    share_id: str,
    authorization: str = Header(...),
    request: Request = None
):
    """
    GET /api/v1/external/shares/{share_id}
    
    Retorna detalhes de um compartilhamento específico.
    
    Headers:
    - Authorization: Bearer {access_token}
    
    Response:
    {
        "id": "upload-123",
        "name": "Documentos Q4",
        "description": "Relatórios financeiros",
        "sender": {
            "name": "João Silva",
            "email": "joao@petrobras.com.br",
            "department": "Financeiro"
        },
        "files": [...],
        "expires_at": "23/01/2026 14:30",
        "remaining_hours": 48,
        "created_at": "20/01/2026 14:30",
        "terms_accepted": false
    }
    """
    # Validar token
    token = authorization.replace("Bearer ", "") if authorization else None
    
    if not token or token not in _external_tokens:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    # Mock response
    return {
        "id": share_id,
        "name": "Documentos Compartilhados",
        "description": "Arquivos de teste para desenvolvimento",
        "sender": {
            "name": "Sistema de Teste",
            "email": "sistema@petrobras.com.br",
            "department": "TI"
        },
        "files": [
            {
                "id": "file-1",
                "name": "Relatorio_Q4.pdf",
                "size": "2.5 MB",
                "type": "application/pdf",
                "downloaded": False
            }
        ],
        "expires_at": (datetime.utcnow() + timedelta(hours=48)).strftime("%d/%m/%Y %H:%M"),
        "remaining_hours": 48,
        "created_at": datetime.utcnow().strftime("%d/%m/%Y %H:%M"),
        "terms_accepted": False
    }


@router.post("/shares/{share_id}/accept-terms")
async def accept_share_terms(
    share_id: str,
    authorization: str = Header(...),
    request: Request = None
):
    """
    POST /api/v1/external/shares/{share_id}/accept-terms
    
    Aceita os termos de uso para acessar os arquivos.
    
    Headers:
    - Authorization: Bearer {access_token}
    
    Response:
    {
        "success": true,
        "message": "Termos aceitos. Você pode baixar os arquivos.",
        "accepted_at": "20/01/2026 15:00"
    }
    """
    # Validar token
    token = authorization.replace("Bearer ", "") if authorization else None
    
    if not token or token not in _external_tokens:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    # Em produção: registrar aceitação no banco
    # share.terms_accepted = True
    # share.terms_accepted_at = datetime.utcnow()
    # share.terms_accepted_ip = request.client.host
    
    return {
        "success": True,
        "message": "Termos aceitos. Você pode baixar os arquivos.",
        "accepted_at": datetime.utcnow().strftime("%d/%m/%Y %H:%M")
    }


@router.get("/files/{file_id}/download")
async def download_file(
    file_id: str,
    authorization: str = Header(...),
    request: Request = None
):
    """
    GET /api/v1/external/files/{file_id}/download
    
    Gera URL de download para um arquivo específico.
    
    Headers:
    - Authorization: Bearer {access_token}
    
    Response:
    {
        "download_url": "https://s3.amazonaws.com/...",
        "expires_in": 300,
        "file_name": "Relatorio_Q4.pdf",
        "file_size": "2.5 MB"
    }
    
    Ou redireciona diretamente para o S3 presigned URL.
    """
    # Validar token
    token = authorization.replace("Bearer ", "") if authorization else None
    
    if not token or token not in _external_tokens:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    token_data = _external_tokens[token]
    
    # Verificar limite de downloads
    if token_data["downloads_used"] >= token_data["max_downloads"]:
        raise HTTPException(
            status_code=429,
            detail="Limite de downloads atingido. Entre em contato com o remetente."
        )
    
    # Incrementar contador
    token_data["downloads_used"] += 1
    
    # Em produção: gerar presigned URL do S3
    # presigned_url = s3_client.generate_presigned_url(
    #     'get_object',
    #     Params={'Bucket': bucket, 'Key': file_key},
    #     ExpiresIn=300
    # )
    
    # Mock response
    return {
        "download_url": f"https://storage.example.com/files/{file_id}?token=xxx",
        "expires_in": 300,
        "file_name": "Relatorio_Q4.pdf",
        "file_size": "2.5 MB",
        "downloads_remaining": token_data["max_downloads"] - token_data["downloads_used"]
    }


@router.get("/files/{file_id}/preview")
async def preview_file(
    file_id: str,
    authorization: str = Header(...),
    request: Request = None
):
    """
    GET /api/v1/external/files/{file_id}/preview
    
    Gera URL de preview para visualizar arquivo sem baixar (para PDFs e imagens).
    
    Headers:
    - Authorization: Bearer {access_token}
    
    Response:
    {
        "preview_url": "https://...",
        "can_preview": true,
        "file_type": "application/pdf"
    }
    """
    # Validar token
    token = authorization.replace("Bearer ", "") if authorization else None
    
    if not token or token not in _external_tokens:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    # Mock response
    return {
        "preview_url": f"https://storage.example.com/files/{file_id}/preview",
        "can_preview": True,
        "file_type": "application/pdf"
    }


@router.post("/logout")
async def external_logout(
    authorization: str = Header(...),
    request: Request = None
):
    """
    POST /api/v1/external/logout
    
    Encerra a sessão do usuário externo.
    
    Headers:
    - Authorization: Bearer {access_token}
    
    Response:
    {
        "success": true,
        "message": "Sessão encerrada com sucesso"
    }
    """
    token = authorization.replace("Bearer ", "") if authorization else None
    
    if token and token in _external_tokens:
        del _external_tokens[token]
    
    return {
        "success": True,
        "message": "Sessão encerrada com sucesso"
    }
