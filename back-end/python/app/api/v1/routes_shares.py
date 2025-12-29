from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile
from typing import List
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.share_schema import ShareCreate, ShareRead
from app.services.share_service import create_share
from app.services.token_service import issue_token_access, TokenError
from app.schemas.token_schema import TokenRead

router = APIRouter(prefix="/shares", tags=["Shares"])

@router.post("/", response_model=ShareRead, status_code=status.HTTP_201_CREATED)
async def create(
    payload: ShareCreate, 
    files: List[UploadFile], 
    session: Session = Depends(get_session), 
    request: Request = None
):
    
    """
    Recebe ShareCreate no corpo JSON + uploads opcionais.
    Se area_id não vier, cria/usa área automática do solicitante.
    Também aceita file_ids (para arquivos já existentes na área).
    """

    try:

        new_uploads = None

        if files:
            new_uploads = []
            for f in files:
                content = await f.read()
                new_uploads.append((f.filename, content, f.content_type or "application/octet-stream"))


        share = create_share(
            session=session,
            area_id=payload.area_id, # None => área automática para o modelo atual e com possibilidade de crescer a aplicação
            external_email=payload.external_email,
            created_by_id=payload.created_by_id,
            expira_at=payload.expira_at,
            consumption_policy=payload.consumption_policy,
            file_ids=payload.file_ids or [], # IDs existentes
            new_uploads=new_uploads,
            request_meta={
                "ip": request.client.host if request else None, 
                "ua": request.headers.get("User-Agent") if request else None
            }
        )
        return share
    
    except ShareError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{share_id}/token", response_model=TokenRead, status_code=status.HTTP_201_CREATED)
def issue_token(share_id: int, validity_hours: int = 24, session: Session = Depends(get_session), request: Request = None):
    try:
        token = issue_token_access(
            session=session,
            share_id=share_id,
            validity_hours=validity_hours,
            request_meta={"ip": request.client.host, "ua": request.headers.get("User-Agent")}
        )
        return TokenRead(token=token.token, expira_at=token.expira_at)
    except TokenError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{share_id}/cancel", response_model=ShareRead)
def cancel_share(
    share_id: int,
    cancelled_by: str,
    cancellation_reason: str | None = None,
    session: Session = Depends(get_session),
    request: Request = None
):
    """
    Cancela um compartilhamento que ainda está pendente de aprovação.
    Apenas compartilhamentos com status 'pending' podem ser cancelados.
    """
    from app.models.shared_area import SharedArea
    from app.services.audit_service import log_event
    from datetime import datetime
    
    share = session.get(SharedArea, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado.")
    
    if share.status == "approved":
        raise HTTPException(
            status_code=400,
            detail="Não é possível cancelar. Este compartilhamento já foi aprovado pelo supervisor."
        )
    
    if share.status == "rejected":
        raise HTTPException(
            status_code=400,
            detail="Não é possível cancelar. Este compartilhamento já foi rejeitado pelo supervisor."
        )
    
    if share.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Este compartilhamento já foi cancelado anteriormente."
        )
    
    # Atualiza o status para cancelled
    share.status = "cancelled"
    share.cancelled_by = cancelled_by
    share.cancellation_date = datetime.utcnow()
    share.cancellation_reason = cancellation_reason or "Cancelado pelo usuário"
    
    session.add(share)
    session.commit()
    session.refresh(share)
    
    # Registra no log de auditoria
    log_event(
        session=session,
        action="CANCELAR_COMPARTILHAMENTO",
        user_id=share.sender_id,
        share_id=share_id,
        detail=f"Compartilhamento cancelado por {cancelled_by}. Motivo: {cancellation_reason or 'Não informado'}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return share
