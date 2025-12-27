
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