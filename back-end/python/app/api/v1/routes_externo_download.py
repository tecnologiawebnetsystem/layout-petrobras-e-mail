from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session, select
from app.db.session import get_session
from app.services.token_service import obter_token_access, validar_token_access, TokenError
from app.services.file_service import gerar_download_url
from app.services.audit_service import log_event
from app.services.share_service import list_share_arquivos
from app.models.usuario import TipoUsuario
from app.models.share import ShareStatus
from app.models.share_arquivo import ShareArquivo
from datetime import datetime, UTC

router = APIRouter(prefix="/externo", tags=["Externo"])

@router.get("/lista")
def list_arquivos(
    token: str = Query(..., description="Token externo"),
    session: Session = Depends(get_session),
    request: Request = None
):
    token_obj = obter_token_access(session, token)
    if not token_obj:
        raise HTTPException(status_code=403, detail="Token inválido.")

    usuario = token_obj.usuario
    if not usuario or not usuario.ativo or usuario.tipo != TipoUsuario.EXTERNO:
        raise HTTPException(status_code=403, detail="Acesso não autorizado.")

    try:
        validar_token_access(token_obj)
    except TokenError as e:
        raise HTTPException(status_code=403, detail=str(e))

    share = token_obj.share
    if not share or share.status != ShareStatus.ATIVO or share.expira_em <= datetime.now():
        raise HTTPException(status_code=403, detail="Compartilhamento indisponível ou expirado.")


    # Auditoria de visualização
    log_event(
        session=session,
        evento="LISTAR_ARQUIVOS",
        usuario_id=usuario.id,
        share_id=share.id,
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
        detalhe=None
    )

    itens = list_share_arquivos(session, share.id)
    resposta = []
    for sa in itens:
        url = gerar_download_url(sa.arquivo.chave_s3, expires_in=300, filename=sa.arquivo.nome_arquivo)
        resposta.append({
            "share_arquivo_id": sa.id,
            "nome": sa.arquivo.nome_arquivo,
            "tamanho_bytes": sa.arquivo.tamanho_bytes,
            "baixado": sa.baixado,
            "url": url,
            "url_expires_in_seconds": 300
        })
    return {"arquivos": resposta, "token_expira_em": token_obj.expira_em}

@router.post("/ack")
def confirmar_baixa(
    token: str,
    share_arquivo_id: int,
    session: Session = Depends(get_session),
    request: Request = None
):
    token_obj = obter_token_access(session, token)
    if not token_obj:
        raise HTTPException(status_code=403, detail="Token inválido.")
    try:
        validar_token_access(token_obj)
    except TokenError as e:
        raise HTTPException(status_code=403, detail=str(e))

    # Confere que o SA pertence ao share do token
    sa = session.exec(select(ShareArquivo).where(
        ShareArquivo.id == share_arquivo_id,
        ShareArquivo.share_id == token_obj.share_id
    )).first()

    if not sa:
        raise HTTPException(status_code=404, detail="Arquivo não pertence ao compartilhamento.")

    if not sa.baixado:
        sa.baixado = True
        sa.baixado_em = datetime.now(UTC)
        session.add(sa)
        session.commit()

        # Auditoria de download
        log_event(
            session=session,
            evento="ACK_DOWNLOAD",
            usuario_id=token_obj.usuario_id,
            share_id=token_obj.share_id,
            arquivo_id=sa.arquivo_id,
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None,
            detalhe=None
        )

    return {"status": "ok"}
