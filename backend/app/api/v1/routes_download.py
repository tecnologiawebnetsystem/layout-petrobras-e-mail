from datetime import datetime, UTC
import shutil
import tempfile
import zipfile as _zipfile
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select, func

from app.core.config import settings
from app.db.session import get_session
from app.deps.external_auth import get_external_access_context, ExternalAccessContext
from app.models.user import User
from app.models.share import Share, ShareStatus
from app.models.share_file import ShareFile
from app.models.restricted_file import RestrictedFile
from app.services.audit_service import log_event
from app.services.email_service import send_otp_email
from app.services.file_service import generate_download_url
from app.services.s3_service import get_s3_object_stream
from app.services.token_service import issue_otp, verify_otp, issue_token_access, TokenError

logger = logging.getLogger(__name__)

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
    background_tasks: BackgroundTasks,
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

    # Resposta base genérica — nunca revela se o e-mail existe (anti-enumeration)
    resp: dict = {
        "otp_sent": False,
        "expires_in": 300,
        "message": "Se houver compartilhamentos ativos para este e-mail, enviaremos um código.",
    }
    if not shares:
        # Verifica se o usuario externo existe e ainda esta ativo — se todos os
        # shares expiraram sem download, desativa agora para consistencia
        ext_user = session.exec(select(User).where(User.email == email)).first()
        if ext_user and ext_user.status:
            # Considera PENDING também: share ainda aguardando aprovação não justifica desativação
            still_has_valid = session.exec(
                select(Share).where(
                    Share.external_email == email,
                    Share.status.in_([
                        ShareStatus.PENDING,
                        ShareStatus.APPROVED,
                        ShareStatus.ACTIVE,
                    ]),
                    Share.expires_at > now,
                )
            ).first()
            if not still_has_valid:
                ext_user.status = False
                session.add(ext_user)
                session.commit()
                log_event(
                    session=session,
                    action="DESATIVAR_USUARIO_EXTERNO",
                    user_id=ext_user.id,
                    detail="Desativado automaticamente: nenhum share vivo (PENDING/APPROVED/ACTIVE)",
                    ip=request.client.host if request else None,
                    user_agent=request.headers.get("User-Agent") if request else None,
                )
        return resp

    # Se houver shares, emite OTP e envia por e-mail
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

    # Envia o código exclusivamente por e-mail — nunca exposto na resposta
    background_tasks.add_task(send_otp_email, email, code, otp.expires_at)

    resp["otp_sent"] = True
    resp["expires_at"] = otp.expires_at.isoformat()
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
    Retorna arquivos de TODOS os compartilhamentos ativos vinculados ao e-mail,
    nao apenas o share ligado ao token.
    """
    token_obj = ctx.token
    now = ctx.now

    # Busca o e-mail externo via o share do token (fonte canonica)
    anchor_share = ctx.share
    external_email = anchor_share.external_email

    # Todos os shares aprovados/ativos ainda dentro do prazo para este e-mail
    active_shares = session.exec(
        select(Share).where(
            Share.external_email == external_email,
            Share.status.in_([ShareStatus.APPROVED, ShareStatus.ACTIVE]),
            Share.expires_at > now,
        )
    ).all()

    result = []
    for share in active_shares:
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
                "created_at": rfile.created_at.isoformat() if rfile.created_at else None,
            })

        exp_at = share.expires_at
        if exp_at and not exp_at.tzinfo:
            exp_at = exp_at.replace(tzinfo=UTC)
        remaining_seconds = int((exp_at - now).total_seconds()) if exp_at else 0

        result.append({
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
        })

    # Desativa usuário externo se não restar nenhum arquivo pendente de download
    total_remaining = sum(
        1 for share_data in result
        for f in share_data["files"]
        if not f["downloaded"]
    )
    if total_remaining == 0:
        ext_user = session.get(User, token_obj.user_id)
        if ext_user and ext_user.status:
            ext_user.status = False
            session.add(ext_user)
            session.commit()
            log_event(
                session=session,
                action="DESATIVAR_USUARIO_EXTERNO",
                user_id=token_obj.user_id,
                detail="Nenhum arquivo pendente disponível",
                ip=request.client.host if request else None,
                user_agent=request.headers.get("User-Agent") if request else None,
            )

    log_event(
        session=session,
        action="LISTAR_DOWNLOADS",
        user_id=token_obj.user_id,
        share_id=anchor_share.id,
        detail=f"shares_listados={len(result)}, pendentes={total_remaining}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )
    return {"files": result}

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
    Aceita arquivos de qualquer share ativo vinculado ao e-mail do usuario.
    """
    token_obj = ctx.token
    external_email = ctx.share.external_email
    now = ctx.now

    share_file = session.get(ShareFile, file_id)
    if not share_file:
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado.")

    # Verifica se o share do arquivo pertence ao mesmo e-mail externo
    owner_share = session.get(Share, share_file.share_id)
    if (
        not owner_share
        or owner_share.external_email != external_email
        or owner_share.status not in (ShareStatus.APPROVED, ShareStatus.ACTIVE)
        or (owner_share.expires_at and owner_share.expires_at.replace(tzinfo=UTC) <= now)
    ):
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
            share_id=owner_share.id,
            file_id=rfile.id,
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None,
        )

    # Conta pendentes em TODOS os shares ativos do e-mail
    active_shares = session.exec(
        select(Share).where(
            Share.external_email == external_email,
            Share.status.in_([ShareStatus.APPROVED, ShareStatus.ACTIVE]),
            Share.expires_at > datetime.now(UTC),
        )
    ).all()
    remaining = 0
    for s in active_shares:
        remaining += session.exec(
            select(func.count()).select_from(ShareFile).where(
                ShareFile.share_id == s.id,
                ShareFile.downloaded == False,
            )
        ).one()

    # Se nao restar nenhum arquivo pendente, desativa o usuario externo
    if remaining == 0:
        ext_user = session.get(User, token_obj.user_id)
        if ext_user and ext_user.status:
            ext_user.status = False
            session.add(ext_user)
            session.commit()
            log_event(
                session=session,
                action="DESATIVAR_USUARIO_EXTERNO",
                user_id=token_obj.user_id,
                detail="Todos os arquivos foram baixados",
                ip=request.client.host if request else None,
                user_agent=request.headers.get("User-Agent") if request else None,
            )

    return {
        "download_url": download_url,
        "expires_in": 300,
        "file_name": rfile.name,
        "file_size": rfile.size_bytes,
        "remaining_downloads": remaining,
    }


# =====================================================
# GET /download/files/zip - Baixar selecionados como ZIP
# =====================================================

@router.get("/files/zip")
def download_files_zip(
    ids: str = Query(..., description="IDs de ShareFile separados por vírgula"),
    ctx: ExternalAccessContext = Depends(get_external_access_context),
    session: Session = Depends(get_session),
    request: Request = None,
):
    """
    Gera e transmite um ZIP com os arquivos selecionados pelo usuário externo.
    Cada id é o PK de ShareFile. Valida que cada arquivo pertence a um share
    ativo vinculado ao e-mail do token.
    Requer STORAGE_PROVIDER=aws.
    """
    if settings.storage_provider != "aws":
        raise HTTPException(status_code=501, detail="Download ZIP disponível apenas com storage AWS S3.")

    external_email = ctx.share.external_email
    token_obj = ctx.token
    now = ctx.now

    try:
        id_list = [int(i.strip()) for i in ids.split(",") if i.strip()]
    except ValueError:
        raise HTTPException(status_code=422, detail="Parâmetro ids inválido.")

    if not id_list:
        raise HTTPException(status_code=422, detail="Nenhum arquivo selecionado.")

    if len(id_list) > 50:
        raise HTTPException(status_code=400, detail="Máximo de 50 arquivos por ZIP.")

    # Valida e coleta cada arquivo
    files_to_zip: list[tuple[ShareFile, RestrictedFile]] = []
    for sf_id in id_list:
        sf = session.get(ShareFile, sf_id)
        if not sf:
            raise HTTPException(status_code=404, detail=f"Arquivo {sf_id} não encontrado.")

        owner_share = session.get(Share, sf.share_id)
        if (
            not owner_share
            or owner_share.external_email != external_email
            or owner_share.status not in (ShareStatus.APPROVED, ShareStatus.ACTIVE)
            or (owner_share.expires_at and owner_share.expires_at.replace(tzinfo=UTC) <= now)
        ):
            raise HTTPException(status_code=403, detail=f"Arquivo {sf_id} não disponível.")

        rfile = session.get(RestrictedFile, sf.file_id)
        if not rfile or not rfile.key_s3:
            raise HTTPException(status_code=404, detail=f"Arquivo {sf_id} não encontrado no storage.")

        files_to_zip.append((sf, rfile))

    # Marca todos como baixados antes de gerar o stream
    for sf, _ in files_to_zip:
        if not sf.downloaded:
            sf.downloaded = True
            sf.downloaded_at = datetime.now(UTC)
            session.add(sf)
    session.commit()

    # Verifica se restam arquivos pendentes em TODOS os shares ativos do e-mail
    active_shares = session.exec(
        select(Share).where(
            Share.external_email == external_email,
            Share.status.in_([ShareStatus.APPROVED, ShareStatus.ACTIVE]),
            Share.expires_at > datetime.now(UTC),
        )
    ).all()
    remaining = 0
    for s in active_shares:
        remaining += session.exec(
            select(func.count()).select_from(ShareFile).where(
                ShareFile.share_id == s.id,
                ShareFile.downloaded == False,
            )
        ).one()

    if remaining == 0:
        ext_user = session.get(User, token_obj.user_id)
        if ext_user and ext_user.status:
            ext_user.status = False
            session.add(ext_user)
            session.commit()
            log_event(
                session=session,
                action="DESATIVAR_USUARIO_EXTERNO",
                user_id=token_obj.user_id,
                detail="Todos os arquivos foram baixados via ZIP",
                ip=request.client.host if request else None,
                user_agent=request.headers.get("User-Agent") if request else None,
            )

    log_event(
        session=session,
        action="DOWNLOAD_ZIP",
        user_id=token_obj.user_id,
        share_id=ctx.share.id,
        detail=f"files={len(files_to_zip)}, ids={ids}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )

    # Captura os dados necessários antes de entrar no gerador (evita sessão lazy)
    files_info = [(rfile.name, rfile.key_s3) for _, rfile in files_to_zip]

    def generate_zip():
        with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
            with _zipfile.ZipFile(tmp, mode="w", compression=_zipfile.ZIP_DEFLATED) as zf:
                seen_names: dict[str, int] = {}
                for name, key_s3 in files_info:
                    # Garante nomes únicos dentro do ZIP
                    if name in seen_names:
                        seen_names[name] += 1
                        base, _, ext = name.rpartition(".")
                        arc_name = f"{base}_{seen_names[name]}.{ext}" if ext else f"{name}_{seen_names[name]}"
                    else:
                        seen_names[name] = 0
                        arc_name = name
                    try:
                        body, _ = get_s3_object_stream(key=key_s3)
                        with zf.open(arc_name, "w") as zentry:
                            shutil.copyfileobj(body, zentry)
                    except Exception:
                        logger.exception("Erro ao adicionar %s ao ZIP", name)
            tmp.seek(0)
            while chunk := tmp.read(1024 * 1024):
                yield chunk

    return StreamingResponse(
        generate_zip(),
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="arquivos.zip"'},
    )