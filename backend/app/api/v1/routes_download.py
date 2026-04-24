import os
from datetime import datetime, UTC

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select, func

from app.db.session import get_session
from app.deps.external_auth import get_external_access_context, ExternalAccessContext
from app.models.user import User
from app.models.share import Share, ShareStatus
from app.models.share_file import ShareFile
from app.models.restricted_file import RestrictedFile
from app.services.audit_service import log_event
from app.services.file_service import generate_download_url
from app.services.token_service import issue_otp, verify_otp, issue_token_access, TokenError

router = APIRouter(prefix="/download", tags=["Download"])

# Feature flags (env)
RETURN_OTP_CODE = os.getenv("RETURN_OTP_CODE", "false").lower() == "true"
HIDE_EMAIL_ENUMERATION = os.getenv("HIDE_EMAIL_ENUMERATION", "true").lower() == "true"

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
    email = payload.email.lower().strip()
    now = datetime.now(UTC)
    shares = session.exec(
        select(Share).where(
            Share.external_email == email,
            Share.status.in_([ShareStatus.APPROVED, ShareStatus.ACTIVE]),
            Share.expires_at > now
        )
    ).all()
  # resposta base sempre 200
    resp: dict = {
        "otp_sent": False,
        "expires_in": 300,
        "message": "Se houver compartilhamentos ativos para este e-mail, enviaremos um código.",
    }
    if not shares:
        if HIDE_EMAIL_ENUMERATION:
            return resp
        return {
            "has_files": False,
            "file_count": 0,
            "otp_sent": False,
            "expires_in": 0,
            "error": {"code": "NO_FILES", "message": "Nenhum arquivo encontrado para este email"},
        }
  # se houver shares, emite OTP
    try:
        otp, code = issue_otp(
            session=session,
            email=email,
            validity_minutes=5,
            request_meta={
                "ip": request.client.host if request else None,
                "ua": request.headers.get("User-Agent") if request else None,
            },
        )
    except TokenError as e:
        raise HTTPException(status_code=400, detail=str(e))
    resp["otp_sent"] = True
    if not HIDE_EMAIL_ENUMERATION:
        resp["has_files"] = True
        resp["file_count"] = sum(
            session.exec(
                select(func.count()).select_from(ShareFile).where(ShareFile.share_id == s.id)
            ).one()
            for s in shares
        )
        if RETURN_OTP_CODE:
            resp["code"] = code  # apenas DEV
            return resp

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
    Autentica usuário externo com código OTP.
    Retorna token temporário para acesso aos downloads.
    Resposta padronizada para evitar vazamento de informações.
    """
    email = payload.email.lower().strip()
    try:
        otp = verify_otp(
            session=session,
            email=email,
            code=payload.code,
            max_attempts=5,
            cooldown_minutes=15,
            request_meta={
                "ip": request.client.host if request else None,
                "ua": request.headers.get("User-Agent") if request else None,
            },
        )
        access = issue_token_access(
            session=session,
            otp=otp,
            validity_hours=1,  # 1 hora
            request_meta={
                "ip": request.client.host if request else None,
                "ua": request.headers.get("User-Agent") if request else None,
            },
        )
        return {
            "token": access.token,
            "expires_in": 3600,
            "email": email,
            "message": "Autenticação realizada. Se houver arquivos disponíveis, você poderá consultá-los."
        }
    except TokenError:
        raise HTTPException(status_code=400, detail="Falha na autenticação. Verifique o código e tente novamente.")

# =====================================================
# GET /download/files - Listar arquivos disponiveis
# =====================================================

@router.get("/files")
def get_download_files(
    ctx: ExternalAccessContext = Depends(get_external_access_context),
    session: Session = Depends(get_session),
    request: Request = None,
):
    """
    Lista arquivos disponiveis para download do usuario externo.
    Requer token de autenticacao externa no header Authorization.
    """
    token_obj = ctx.token
    share = ctx.share
    now = ctx.now
    sender = session.get(User, share.created_by_id)
    share_files = session.exec(
        select(ShareFile).where(ShareFile.share_id == share.id)
    ).all()
    files_data: list[dict] = []
    for sf in share_files:
        rfile = session.get(RestrictedFile, sf.file_id)
        if not rfile:
            continue
        size_mb = (rfile.size_bytes or 0) / (1024 * 1024)
        files_data.append({
            "id": sf.id,
            "restricted_file_id": rfile.id,
            "name": rfile.name,
            "size": f"{size_mb:.2f} MB",
            "type": rfile.mime_type or "unknown",
            "downloaded": bool(sf.downloaded),
            "downloaded_at": sf.downloaded_at.isoformat() if sf.downloaded_at else None,
        })

    exp_at = share.expires_at
    if exp_at and not exp_at.tzinfo:
        exp_at = exp_at.replace(tzinfo=UTC)
    remaining_seconds = int((exp_at - now).total_seconds()) if exp_at else 0
    log_event(
        session=session,
        action="LISTAR_DOWNLOADS",
        user_id=token_obj.user_id,
        share_id=share.id,
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
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
                "created_at": share.created_at.isoformat() if share.created_at else None,
            }
        ]
    }

# =====================================================
# GET /download/files/{file_id}/url - Gerar URL de download
# =====================================================

@router.get("/files/{file_id}/url")
def get_download_url(
    file_id: int,
    ctx: ExternalAccessContext = Depends(get_external_access_context),
    session: Session = Depends(get_session),
    request: Request = None,
):
    """
    Gera URL pre-assinada para download do arquivo.
    IMPORTANTE: file_id aqui e o PK de ShareFile (tabela de juncao).
    """
    token_obj = ctx.token
    share = ctx.share
    share_file = session.get(ShareFile, file_id)
    if not share_file or share_file.share_id != share.id:
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado.")
    rfile = session.get(RestrictedFile, share_file.file_id)
    if not rfile:
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado.")
    download_url = generate_download_url(
        rfile.key_s3,
        expires_in=300,
        filename=rfile.name,
    )
    if not share_file.downloaded:
        share_file.downloaded = True
        share_file.downloaded_at = datetime.now(UTC)
        session.add(share_file)
        session.commit()
        log_event(
            session=session,
            action="GERAR_URL_DOWNLOAD",
            user_id=token_obj.user_id,
            share_id=share.id,
            file_id=rfile.id,
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None,
        )

    remaining = session.exec(
        select(func.count()).select_from(ShareFile).where(
            ShareFile.share_id == share.id,
            ShareFile.downloaded == False
        )
    ).one()
    return {
        "download_url": download_url,
        "expires_in": 300,
        "file_name": rfile.name,
        "file_size": rfile.size_bytes,
        "remaining_downloads": remaining,
    }