"""
Routes for external user downloads.
Handles email verification, OTP authentication, and file downloads.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select, func
from pydantic import BaseModel, EmailStr
from datetime import datetime, UTC

from app.db.session import get_session
from app.models.user import User, TypeUser
from app.models.share import Share, ShareStatus
from app.models.share_file import ShareFile
from app.models.restricted_file import RestrictedFile
from app.services.token_service import (
    issue_otp, verify_otp, issue_token_access,
    get_token_access, validate_token_access, TokenError
)
from app.services.file_service import generate_download_url
from app.services.audit_service import log_event

router = APIRouter(prefix="/download", tags=["Download"])


class VerifyEmailRequest(BaseModel):
    email: EmailStr


class AuthenticateRequest(BaseModel):
    email: EmailStr
    code: str


# =====================================================
# POST /download/verify - Verificar email e enviar OTP
# =====================================================

@router.post("/verify")
def verify_email(
    payload: VerifyEmailRequest,
    session: Session = Depends(get_session),
    request: Request = None,
):
    """
    Verifica se um email externo tem arquivos disponiveis para download.
    Se houver, envia codigo OTP para autenticacao.
    """
    email = payload.email.lower()
    
    # Busca shares aprovados e nao expirados para este email
    now = datetime.now(UTC)
    shares = session.exec(
        select(Share).where(
            Share.external_email == email,
            Share.status.in_([ShareStatus.APPROVED, ShareStatus.ACTIVE]),
            Share.expires_at > now
        )
    ).all()
    
    if not shares:
        return {
            "has_files": False,
            "file_count": 0,
            "otp_sent": False,
            "expires_in": 0,
            "error": {
                "code": "NO_FILES",
                "message": "Nenhum arquivo encontrado para este email"
            }
        }
    
    # Conta total de arquivos
    total_files = 0
    for share in shares:
        count = session.exec(
            select(func.count()).select_from(ShareFile).where(ShareFile.share_id == share.id)
        ).one()
        total_files += count
    
    # Gera e envia OTP
    try:
        otp, code = issue_otp(
            session=session,
            email=email,
            validity_minutes=5,
            request_meta={
                "ip": request.client.host if request else None,
                "ua": request.headers.get("User-Agent") if request else None
            }
        )
        
        # Em producao, remover o code do retorno
        return {
            "has_files": True,
            "file_count": total_files,
            "otp_sent": True,
            "expires_in": 300,  # 5 minutos
            "code": code,  # REMOVER EM PRODUCAO
        }
    except TokenError as e:
        raise HTTPException(status_code=400, detail=str(e))


# =====================================================
# POST /download/authenticate - Autenticar com OTP
# =====================================================

@router.post("/authenticate")
def authenticate_external(
    payload: AuthenticateRequest,
    session: Session = Depends(get_session),
    request: Request = None,
):
    """
    Autentica usuario externo com codigo OTP.
    Retorna token temporario para acesso aos downloads.
    """
    email = payload.email.lower()
    
    try:
        otp = verify_otp(
            session=session,
            email=email,
            code=payload.code,
            max_attempts=5,
            cooldown_minutes=15,
            request_meta={
                "ip": request.client.host if request else None,
                "ua": request.headers.get("User-Agent") if request else None
            }
        )
        
        # Emite token de acesso
        access = issue_token_access(
            session=session,
            otp=otp,
            validity_hours=1,  # 1 hora
            request_meta={
                "ip": request.client.host if request else None,
                "ua": request.headers.get("User-Agent") if request else None
            }
        )
        
        # Conta arquivos
        file_count = session.exec(
            select(func.count()).select_from(ShareFile).where(ShareFile.share_id == access.share_id)
        ).one()
        
        return {
            "token": access.token,
            "expires_in": 3600,  # 1 hora em segundos
            "email": email,
            "file_count": file_count,
        }
    except TokenError as e:
        raise HTTPException(status_code=400, detail=str(e))


# =====================================================
# GET /download/files - Listar arquivos disponiveis
# =====================================================

@router.get("/files")
def get_download_files(
    session: Session = Depends(get_session),
    request: Request = None,
):
    """
    Lista arquivos disponiveis para download do usuario externo.
    Requer token de autenticacao externa no header Authorization.
    """
    # Extrai token do header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token nao fornecido.")
    
    token_str = auth_header.split(" ")[1]
    
    token_obj = get_token_access(session, token_str)
    if not token_obj:
        raise HTTPException(status_code=401, detail="Token invalido.")
    
    try:
        validate_token_access(token_obj)
    except TokenError as e:
        raise HTTPException(status_code=401, detail=str(e))
    
    # Busca share do token
    share = token_obj.share
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")
    
    # Verifica se ainda esta ativo/aprovado e nao expirado
    now = datetime.now(UTC)
    if share.status not in [ShareStatus.APPROVED, ShareStatus.ACTIVE]:
        raise HTTPException(status_code=403, detail="Compartilhamento nao esta mais disponivel.")
    
    if share.expires_at and share.expires_at.replace(tzinfo=UTC) <= now:
        raise HTTPException(status_code=403, detail="Compartilhamento expirado.")
    
    # Busca remetente
    sender = session.get(User, share.created_by_id)
    
    # Busca arquivos
    share_files = session.exec(
        select(ShareFile).where(ShareFile.share_id == share.id)
    ).all()
    
    files_data = []
    for sf in share_files:
        rfile = session.get(RestrictedFile, sf.file_id)
        if rfile:
            size_mb = rfile.size_bytes / (1024 * 1024) if rfile.size_bytes else 0
            files_data.append({
                "name": rfile.name,
                "size": f"{size_mb:.2f} MB",
                "type": rfile.mime_type or "unknown",
            })
    
    # Calcula tempo restante
    remaining_seconds = int((share.expires_at - now).total_seconds()) if share.expires_at else 0
    
    # Registra acesso
    log_event(
        session=session,
        action="LISTAR_DOWNLOADS",
        user_id=token_obj.user_id,
        share_id=share.id,
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return {
        "files": [
            {
                "id": share.id,
                "name": share.name or f"Compartilhamento #{share.id}",
                "description": share.description,
                "sender": {
                    "name": sender.name if sender else "Desconhecido",
                    "email": sender.email if sender else None,
                    "department": sender.department if sender else None,
                },
                "files": files_data,
                "expires_at": share.expires_at.isoformat() if share.expires_at else None,
                "remaining_time": remaining_seconds,
                "download_count": sum(1 for sf in share_files if sf.downloaded),
                "max_downloads": len(share_files),
                "created_at": share.created_at.isoformat(),
            }
        ]
    }


# =====================================================
# GET /download/files/{file_id}/url - Gerar URL de download
# =====================================================

@router.get("/files/{file_id}/url")
def get_download_url(
    file_id: int,
    session: Session = Depends(get_session),
    request: Request = None,
):
    """
    Gera URL pre-assinada para download do arquivo.
    """
    # Extrai token do header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token nao fornecido.")
    
    token_str = auth_header.split(" ")[1]
    
    token_obj = get_token_access(session, token_str)
    if not token_obj:
        raise HTTPException(status_code=401, detail="Token invalido.")
    
    try:
        validate_token_access(token_obj)
    except TokenError as e:
        raise HTTPException(status_code=401, detail=str(e))
    
    share = token_obj.share
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")
    
    # Busca o ShareFile correspondente
    # Note: file_id aqui e o share_id, e buscamos o primeiro arquivo disponivel
    # ou pode ser o ID do ShareFile
    share_file = session.exec(
        select(ShareFile).where(ShareFile.share_id == share.id)
    ).first()
    
    if not share_file:
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado.")
    
    rfile = session.get(RestrictedFile, share_file.file_id)
    if not rfile:
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado.")
    
    # Gera URL pre-assinada
    download_url = generate_download_url(rfile.key_s3, expires_in=300, filename=rfile.name)
    
    # Marca como baixado
    if not share_file.downloaded:
        share_file.downloaded = True
        share_file.downloaded_at = datetime.now(UTC)
        session.add(share_file)
        session.commit()
    
    # Registra download
    log_event(
        session=session,
        action="GERAR_URL_DOWNLOAD",
        user_id=token_obj.user_id,
        share_id=share.id,
        file_id=rfile.id,
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    # Conta downloads restantes
    remaining = session.exec(
        select(func.count()).select_from(ShareFile).where(
            ShareFile.share_id == share.id,
            ShareFile.downloaded == False
        )
    ).one()
    
    return {
        "download_url": download_url,
        "expires_in": 300,  # 5 minutos
        "file_name": rfile.name,
        "file_size": rfile.size_bytes,
        "remaining_downloads": remaining,
    }
