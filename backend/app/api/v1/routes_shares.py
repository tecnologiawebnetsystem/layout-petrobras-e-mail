"""
Rotas de compartilhamentos (shares).
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, Form, Query
import json
from typing import List, Optional
from sqlmodel import Session, select, func
from datetime import datetime, UTC
from pydantic import BaseModel

from app.db.session import get_session
from app.schemas.share_schema import ShareCreate, ShareRead
from app.models.share import Share, ShareStatus
from app.models.share_file import ShareFile
from app.models.restricted_file import RestrictedFile
from app.models.user import User
from app.services.share_service import create_share, ShareError
from app.services.token_service import issue_token_access, TokenError
from app.schemas.token_schema import TokenRead
from app.utils.authz import require_internal, get_current_user
from app.services.audit_service import log_event

router = APIRouter(prefix="/shares", tags=["Shares"])


# =====================================================
# Schemas para request/response
# =====================================================

class ShareCreateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    recipient_email: str
    expiration_hours: int = 72
    file_ids: List[int] = []
    area_id: Optional[int] = None
    consumption_policy: Optional[str] = "after_all"


class ShareCancelRequest(BaseModel):
    reason: Optional[str] = None


# =====================================================
# POST /shares - Criar novo compartilhamento
# =====================================================

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_share_endpoint(
    payload: ShareCreateRequest,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Cria um novo compartilhamento de arquivos.
    """
    try:
        # Cria o share
        share = Share(
            name=payload.name,
            description=payload.description,
            external_email=payload.recipient_email,
            expiration_hours=payload.expiration_hours,
            area_id=payload.area_id,
            created_by_id=user.id,
            status=ShareStatus.PENDING,
        )
        session.add(share)
        session.commit()
        session.refresh(share)

        # Associa os arquivos
        for file_id in payload.file_ids:
            rfile = session.get(RestrictedFile, file_id)
            if rfile:
                share_file = ShareFile(
                    share_id=share.id,
                    file_id=file_id,
                )
                session.add(share_file)

        session.commit()

        log_event(
            session=session,
            action="CRIAR_SHARE",
            user_id=user.id,
            share_id=share.id,
            detail=f"recipient={payload.recipient_email}, files={len(payload.file_ids)}",
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None
        )

        return {
            "id": share.id,
            "name": share.name,
            "recipient_email": share.external_email,
            "status": share.status,
            "expiration_hours": share.expiration_hours,
            "created_at": share.created_at.isoformat(),
            "files_count": len(payload.file_ids),
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =====================================================
# POST /shares/create - Criar com upload (legado)
# =====================================================

@router.post("/create", response_model=ShareRead, status_code=status.HTTP_201_CREATED)
async def create_with_upload(
    payload: str = Form(...),
    files: List[UploadFile] = [],
    session: Session = Depends(get_session),
    request: Request = None
):
    """
    Recebe ShareCreate no corpo JSON + uploads opcionais.
    Se area_id nao vier, cria/usa area automatica do solicitante.
    Tambem aceita file_ids (para arquivos ja existentes na area).
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
            area_id=payload_obj.area_id,
            external_email=payload_obj.external_email,
            created_by_id=payload_obj.created_by_id,
            expires_at=payload_obj.expires_at,
            consumption_policy=payload_obj.consumption_policy,
            file_ids=payload_obj.file_ids or [],
            new_uploads=new_uploads,
            request_meta={
                "ip": request.client.host if request else None,
                "ua": request.headers.get("User-Agent") if request else None
            }
        )
        return share

    except ShareError as e:
        raise HTTPException(status_code=400, detail=str(e))


# =====================================================
# GET /shares - Listar compartilhamentos
# =====================================================

@router.get("/")
def list_shares(
    status_filter: Optional[str] = Query(None, alias="status"),
    recipient: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """
    Lista compartilhamentos do usuario autenticado.
    """
    query = select(Share).where(Share.created_by_id == user.id)

    if status_filter:
        try:
            status_enum = ShareStatus(status_filter)
            query = query.where(Share.status == status_enum)
        except ValueError:
            pass

    if recipient:
        query = query.where(Share.external_email.ilike(f"%{recipient}%"))

    # Conta total
    count_query = select(func.count()).select_from(Share).where(Share.created_by_id == user.id)
    if status_filter:
        try:
            status_enum = ShareStatus(status_filter)
            count_query = count_query.where(Share.status == status_enum)
        except ValueError:
            pass
    total_items = session.exec(count_query).one()
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1

    # Paginacao
    offset = (page - 1) * limit
    query = query.order_by(Share.created_at.desc()).offset(offset).limit(limit)
    shares = session.exec(query).all()

    result = []
    for share in shares:
        share_files = session.exec(
            select(ShareFile).where(ShareFile.share_id == share.id)
        ).all()

        files_data = []
        for sf in share_files:
            rfile = session.get(RestrictedFile, sf.file_id)
            if rfile:
                files_data.append({
                    "id": rfile.id,
                    "name": rfile.name,
                    "size": rfile.size_bytes,
                    "downloaded": sf.downloaded,
                    "downloaded_at": sf.downloaded_at.isoformat() if sf.downloaded_at else None,
                })

        result.append({
            "id": share.id,
            "name": share.name or f"Compartilhamento #{share.id}",
            "description": share.description,
            "recipient_email": share.external_email,
            "status": share.status,
            "expiration_hours": share.expiration_hours,
            "expires_at": share.expires_at.isoformat() if share.expires_at else None,
            "created_at": share.created_at.isoformat(),
            "files": files_data,
            "files_count": len(files_data),
            "downloaded_count": sum(1 for f in files_data if f["downloaded"]),
        })

    return {
        "shares": result,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_items": total_items,
            "items_per_page": limit,
        }
    }


# =====================================================
# GET /shares/my-shares - Meus compartilhamentos
# =====================================================

@router.get("/my-shares")
def list_my_shares(
    status: ShareStatus | None = Query(None),
    session: Session = Depends(get_session),
    user: User = Depends(require_internal),
):
    """
    Lista compartilhamentos criados pelo usuario interno autenticado.
    Retorna resumo por share (totais baixados/pendentes).
    """
    q = select(Share).where(Share.created_by_id == user.id)
    if status:
        q = q.where(Share.status == status)

    shares = session.exec(q.order_by(Share.id.desc())).all()

    response = []
    for s in shares:
        itens = session.exec(select(ShareFile).where(ShareFile.share_id == s.id)).all()
        files_preview = []
        for i in itens[:3]:
            rfile = session.get(RestrictedFile, i.file_id)
            if rfile:
                files_preview.append(rfile.name)

        tot = len(itens)
        downloadeds = sum(1 for i in itens if i.downloaded)
        pending = tot - downloadeds

        response.append({
            "share_id": s.id,
            "name": s.name,
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


# =====================================================
# GET /shares/{share_id} - Detalhes do compartilhamento
# =====================================================

@router.get("/{share_id}")
def get_share_details(
    share_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """
    Retorna detalhes completos do share e seus arquivos.
    """
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")

    # Permite visualizar se for criador ou supervisor vinculado
    if share.created_by_id != user.id and not user.is_supervisor:
        raise HTTPException(status_code=403, detail="Voce nao tem permissao para visualizar este compartilhamento.")

    itens = session.exec(select(ShareFile).where(ShareFile.share_id == share_id)).all()
    files = []
    for sa in itens:
        fi = session.get(RestrictedFile, sa.file_id)
        if fi:
            files.append({
                "id": fi.id,
                "share_file_id": sa.id,
                "name": fi.name,
                "size": fi.size_bytes,
                "mime_type": fi.mime_type,
                "downloaded": sa.downloaded,
                "downloaded_at": sa.downloaded_at.isoformat() if sa.downloaded_at else None,
            })

    tot = len(itens)
    downloadeds = sum(1 for i in itens if i.downloaded)

    # Busca dados do criador
    creator = session.get(User, share.created_by_id)
    creator_data = None
    if creator:
        creator_data = {
            "id": creator.id,
            "name": creator.name,
            "email": creator.email,
        }

    return {
        "id": share.id,
        "name": share.name,
        "description": share.description,
        "recipient_email": share.external_email,
        "status": share.status,
        "expiration_hours": share.expiration_hours,
        "expires_at": share.expires_at.isoformat() if share.expires_at else None,
        "created_at": share.created_at.isoformat(),
        "approved_at": share.approved_at.isoformat() if share.approved_at else None,
        "rejected_at": share.rejected_at.isoformat() if share.rejected_at else None,
        "rejection_reason": share.rejection_reason,
        "created_by": creator_data,
        "files": files,
        "files_count": tot,
        "downloaded_count": downloadeds,
        "pending_count": tot - downloadeds,
    }


# =====================================================
# PATCH /shares/{share_id}/cancel - Cancelar
# =====================================================

@router.patch("/{share_id}/cancel")
def cancel_share(
    share_id: int,
    payload: ShareCancelRequest = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Cancela um compartilhamento.
    Apenas o criador pode cancelar.
    """
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")

    if share.created_by_id != user.id:
        raise HTTPException(status_code=403, detail="Voce nao tem permissao para cancelar este compartilhamento.")

    if share.status in (ShareStatus.CANCELED, ShareStatus.COMPLETED, ShareStatus.EXPIRED):
        raise HTTPException(status_code=400, detail=f"Nao e possivel cancelar um compartilhamento com status '{share.status}'.")

    # Verifica se ja houve download
    ja_baixado = session.exec(
        select(ShareFile).where(ShareFile.share_id == share.id, ShareFile.downloaded == True)
    ).first()
    if ja_baixado:
        raise HTTPException(status_code=400, detail="Nao e possivel cancelar: ja existe download registrado.")

    share.status = ShareStatus.CANCELED
    session.add(share)
    session.commit()
    session.refresh(share)

    log_event(
        session=session,
        action="CANCELAR_SHARE",
        user_id=user.id,
        share_id=share.id,
        detail=f"reason={payload.reason if payload else 'N/A'}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return {
        "message": "Compartilhamento cancelado com sucesso.",
        "id": share.id,
        "status": share.status,
    }


# =====================================================
# DELETE /shares/{share_id} - Excluir
# =====================================================

@router.delete("/{share_id}")
def delete_share(
    share_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Exclui um compartilhamento (soft delete - muda para cancelado).
    """
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")

    if share.created_by_id != user.id:
        raise HTTPException(status_code=403, detail="Voce nao tem permissao para excluir este compartilhamento.")

    # Soft delete
    share.status = ShareStatus.CANCELED
    session.add(share)
    session.commit()

    log_event(
        session=session,
        action="EXCLUIR_SHARE",
        user_id=user.id,
        share_id=share.id,
        detail=f"share_id={share.id}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return {"message": "Compartilhamento excluido com sucesso."}


# =====================================================
# POST /shares/{share_id}/resend - Reenviar email
# =====================================================

@router.post("/{share_id}/resend")
def resend_share_email(
    share_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Reenvia o email de compartilhamento para o destinatario.
    """
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")

    if share.created_by_id != user.id:
        raise HTTPException(status_code=403, detail="Voce nao tem permissao.")

    if share.status not in [ShareStatus.APPROVED, ShareStatus.ACTIVE]:
        raise HTTPException(status_code=400, detail="Compartilhamento nao esta aprovado.")

    # Aqui enviaria o email novamente
    # send_share_notification_email(share)

    log_event(
        session=session,
        action="REENVIAR_EMAIL_SHARE",
        user_id=user.id,
        share_id=share.id,
        detail=f"recipient={share.external_email}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return {
        "message": "Email reenviado com sucesso.",
        "recipient": share.external_email,
    }
