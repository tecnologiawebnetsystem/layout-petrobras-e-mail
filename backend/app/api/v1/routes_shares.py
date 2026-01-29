
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, Form, Query
import json
from typing import List
from sqlmodel import Session, select
from datetime import datetime

from app.db.session import get_session
from app.schemas.share_schema import ShareCreate, ShareRead
from app.models.share import Share, ShareStatus
from app.models.share_file import ShareFile
from app.services.share_service import create_share
from app.services.token_service import issue_token_access, TokenError
from app.schemas.token_schema import TokenRead
from app.utils.authz import require_internal
from app.services.audit_service import log_event

router = APIRouter(prefix="/shares", tags=["Shares"])

@router.post("/create",  response_model=ShareRead, status_code=status.HTTP_201_CREATED)
async def create(
    payload: str = Form(...), 
    files: List[UploadFile] = [], 
    session: Session = Depends(get_session), 
    request: Request = None
):
    
    """
    Recebe ShareCreate no corpo JSON + uploads opcionais.
    Se area_id não vier, cria/usa área automática do solicitante.
    Também aceita file_ids (para arquivos já existentes na área).
    """

    payload_dict = json.loads(payload)
    payload_obj = ShareCreate(**payload_dict)
    try:

        new_uploads = None

        if files:
            new_uploads = []
            for f in files:
                content = await f.read()
                new_uploads.append((f.filename, content, f.content_type or "application/octet-stream"))


        share = create_share(
            session=session,
            area_id=payload_obj.area_id, # None => área automática para o modelo atual e com possibilidade de crescer a aplicação
            external_email=payload_obj.external_email,
            created_by_id=payload_obj.created_by_id,
            expires_at=payload_obj.expires_at,
            consumption_policy=payload_obj.consumption_policy,
            file_ids=payload_obj.file_ids or [], # IDs existentes
            new_uploads=new_uploads,
            request_meta={
                "ip": request.client.host if request else None, 
                "ua": request.headers.get("User-Agent") if request else None
            }
        )
        return share
    
    except ShareError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# ---------------------------------------------------------
# GET /shares/my-shares
# ---------------------------------------------------------
@router.get("/my-shares")
def list_my_shares(
    status: ShareStatus | None = Query(None, description="Filtrar por status (ativo, concluido, expirado, cancelado)"),
    session: Session = Depends(get_session),
    user = Depends(require_internal),
):
    """
    Lista compartilhamentos criados pelo usuário interno autenticado.
    Retorna resumo por share (totais baixados/pendentes).
    """
    q = select(Share).where(Share.created_by_id == user.id)
    if status:
        q = q.where(Share.status == status)

    shares = session.exec(q.order_by(Share.id.desc())).all()

    response = []
    for s in shares:
        itens = session.exec(select(ShareFile).where(ShareFile.share_id == s.id)).all()
        files_preview = [i.arquivo.nome_arquivo for i in itens[:3]]
        tot = len(itens)
        downloadeds = sum(1 for i in itens if i.downloaded)
        pending = tot - downloadeds

        response.append({
            "share_id": s.id,
            "externo_email": s.external_email,
            "status": s.status,
            "expira_em": s.expires_at,
            "criado_em": s.created_at,
            "tot_arquivos": tot,
            "baixados": downloadeds,
            "pendentes": pending,
            "arquivos_preview": files_preview

        })

    return {"my_shares": response}


# ---------------------------------------------------------
# GET /shares/{share_id}
# ---------------------------------------------------------
@router.get("/{share_id}")
def get_details_sharing(
    share_id: int,
    session: Session = Depends(get_session),
    user = Depends(require_internal),
):
    """
    Retorna detalhes completos do share e seus arquivos.
    Apenas o criador (remetente) pode acessar.
    """
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado.")

    if share.created_by_id != user.id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para visualizar este compartilhamento.")

    itens = session.exec(select(ShareFile).where(ShareFile.share_id == share_id)).all()
    files = []
    for sa in itens:
        fi = sa.file
        files.append({
            "share_arquivo_id": sa.id,
            "arquivo_id": fi.id,
            "nome_arquivo": fi.name,
            "tamanho_bytes": fi.size_bytes,
            "baixado": sa.downloaded,
            "baixado_em": sa.downloaded_at,
        })

    tot = len(itens)
    downloadeds = sum(1 for i in itens if i.downloaded)

    return {
        "share": {
            "share_id": share.id,
            "area_id": share.area_id,
            "externo_email": share.external_email,
            "status": share.status,
            "consumo_policy": share.consumption_policy,
            "expira_em": share.expires_at,
            "criado_em": share.created_at,
            "criado_por_id": share.created_by_id,
            "tot_arquivos": tot,
            "baixados": downloadeds,
            "pendentes": tot - downloadeds,
        },
        "arquivos": files
    }


# ---------------------------------------------------------
# PATCH /shares/{share_id}/cancel
# ---------------------------------------------------------
# @router.patch("/{share_id}/cancel")
# def cancelar_compartilhamento(
#     share_id: int,
#     session: Session = Depends(get_session),
#     request: Request | None = None,
#     user = Depends(require_internal),
# ):
#     """
#     Cancela um compartilhamento (share).
#     Apenas o remetente pode cancelar.
#     Regras padrão:
#       - status deve ser ATIVO (ou você pode permitir PENDENTE, se existir)
#       - nenhum arquivo foi baixado ainda
#     """
#     share = session.get(Share, share_id)
#     if not share:
#         raise HTTPException(status_code=404, detail="Compartilhamento não encontrado.")

#     if share.criado_por_id != user.id:
#         raise HTTPException(status_code=403, detail="Você não tem permissão para cancelar este compartilhamento.")

#     # Não cancela se já estiver cancelado/concluído/expirado
#     if share.status in (ShareStatus.CANCELADO, ShareStatus.CONCLUIDO, ShareStatus.EXPIRADO):
#         raise HTTPException(status_code=400, detail=f"Não é possível cancelar um compartilhamento com status '{share.status}'.")

#     # Se você usa apenas ATIVO como "pendente", mantenha isso:
#     if share.status != ShareStatus.ATIVO:
#         raise HTTPException(status_code=400, detail=f"Compartilhamento não está em status cancelável: {share.status}")

#     # Regra de segurança: não permitir cancelar se já houve download
#     ja_baixado = session.exec(
#         select(ShareFile).where(ShareFile.share_id == share.id, ShareFile.baixado == True)
#     ).first()
#     if ja_baixado:
#         raise HTTPException(status_code=400, detail="Não é possível cancelar: já existe download registrado para este compartilhamento.")

#     # (Opcional) Regra mais rígida: se já existe token ACCESS emitido, você pode cancelar mesmo assim,
#     # mas o externo não poderá usar porque o status ficará CANCELADO.
#     # Se quiser bloquear apenas se token já foi usado, exigiria tracking adicional.
#     # Exemplo de checagem simples:
#     # access_emitido = session.exec(select(TokenAcesso).where(
#     #     TokenAcesso.tipo == TokenTipo.ACCESS,
#     #     TokenAcesso.share_id == share.id
#     # )).first()

#     share.status = ShareStatus.CANCELADO
#     session.add(share)
#     session.commit()
#     session.refresh(share)

#     log_event(
#         session=session,
#         evento="CANCELAR_SHARE",
#         usuario_id=user.id,
#         share_id=share.id,
#         detalhe=f"share_id={share.id}",
#         ip=request.client.host if request else None,
#         user_agent=request.headers.get("User-Agent") if request else None
#     )

#     return {
#         "message": "Compartilhamento cancelado com sucesso.",
#         "share_id": share.id,
#         "status": share.status
#     }

    
