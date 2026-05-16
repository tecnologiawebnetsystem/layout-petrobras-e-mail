
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Form
from sqlmodel import Session, select
from app.db.session import get_session
from app.services.token_service import get_token_access, validate_token_access, consume_token,TokenError
from app.services.file_service import generate_download_url
from app.services.audit_service import log_event
from app.services.share_service import list_share_files
from app.models.user import TypeUser
from app.models.share import ShareStatus
from app.models.share_file import ShareFile
from datetime import datetime, UTC

router = APIRouter(prefix="/external", tags=["External"])


@router.post("/logout")
def external_logout(token: str = Form(...), session: Session = Depends(get_session), request: Request = None):
    """
    Encerra a sessão de um usuário externo.

    Invalida o token de acesso temporário (consume_token) e registra o evento
    LOGOUT_EXTERNO na auditoria. Retorna 403 se o token for inválido ou inexistente.
    """
    token_obj = get_token_access(session, token)
    if not token_obj:
        raise HTTPException(status_code=403, detail="Token inválido.")

    user_id = token_obj.user_id
    share_id = token_obj.share_id

    # marca como usado para encerrar sessão externa
    consume_token(token_obj, session)

    log_event(
        session=session,
        action="LOGOUT_EXTERNO",
        user_id=user_id,
        share_id=share_id,
        detail="external_logout",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return {"message": "Sessão encerrada"}


@router.get("/list-files")
def list_files(
    token: str = Query(..., description="Token externo"),
    session: Session = Depends(get_session),
    request: Request = None
):
    """
    Lista os arquivos disponíveis para download vinculados ao token externo.

    Valida o token, verifica que o usuário é do tipo EXTERNAL e que o compartilhamento
    está ATIVO e dentro do prazo de expiração. Gera URLs pre-assinadas (300s) para
    cada arquivo e registra o evento LISTAR_ARQUIVOS na auditoria.
    """
    token_obj = get_token_access(session, token)
    if not token_obj:
        raise HTTPException(status_code=403, detail="Token inválido.")

    user = token_obj.user
    if not user or not user.status or user.type != TypeUser.EXTERNAL:
        raise HTTPException(status_code=403, detail="Acesso não autorizado.")

    try:
        validate_token_access(token_obj)
    except TokenError as e:
        raise HTTPException(status_code=403, detail=str(e))

    share = token_obj.share
    if not share or share.status != ShareStatus.ACTIVE or share.expires_at.replace(tzinfo=UTC) <= datetime.now(UTC):
        raise HTTPException(status_code=403, detail="Compartilhamento indisponível ou expirado.")


    # Auditoria de visualização
    log_event(
        session=session,
        action="LISTAR_ARQUIVOS",
        user_id=user.id,
        share_id=share.id,
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
        detail=None
    )

    itens = list_share_files(session, share.id)
    response = []
    for sf in itens:
        url = generate_download_url(sf.file.key_s3, expires_in=300, filename=sf.file.name)
        response.append({
            "share_file_id": sf.id,
            "name": sf.file.name,
            "size_bytes": sf.file.size_bytes,
            "downloaded": sf.downloaded,
            "url": url,
            "url_expires_in_seconds": 300
        })
    return {"files": response, "token_expires_at": token_obj.expires_at}

@router.post("/ack")
def confirm_down(
    token: str,
    share_file_id: int,
    session: Session = Depends(get_session),
    request: Request = None
):
    """
    Confirma o download de um arquivo específico (acknowledge).

    Marca o ShareFile como downloaded=True e registra o timestamp. Verifica que o
    arquivo pertence ao compartilhamento do token. Idempotente: se já fue baixado,
    retorna {status: ok} sem duplicar registros de auditoria.
    """
    token_obj = get_token_access(session, token)
    if not token_obj:
        raise HTTPException(status_code=403, detail="Token inválido.")
    try:
        validate_token_access(token_obj)
    except TokenError as e:
        raise HTTPException(status_code=403, detail=str(e))

    # Confere que o SF pertence ao share do token
    sf = session.exec(select(ShareFile).where(
        ShareFile.id == share_file_id,
        ShareFile.share_id == token_obj.share_id
    )).first()

    if not sf:
        raise HTTPException(status_code=404, detail="Arquivo não pertence ao compartilhamento.")

    if not sf.downloaded:
        sf.downloaded = True
        sf.downloaded_at = datetime.now(UTC)
        session.add(sf)
        session.commit()

        # Auditoria de download
        log_event(
            session=session,
            action="ACK_DOWNLOAD",
            user_id=token_obj.user_id,
            share_id=token_obj.share_id,
            file_id=sf.file_id,
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None,
            detail=None
        )

    return {"status": "ok"}
