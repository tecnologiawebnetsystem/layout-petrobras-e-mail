from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.share_schema import ShareCreate, ShareRead
from app.services.share_service import create_share
from app.services.token_service import emitir_token_access, TokenError
from app.schemas.token_schema import TokenRead

router = APIRouter(prefix="/shares", tags=["Shares"])

@router.post("/", response_model=ShareRead, status_code=status.HTTP_201_CREATED)
def create(payload: ShareCreate, session: Session = Depends(get_session), request: Request = None):
    share = create_share(
        session=session,
        area_id=payload.area_id,
        externo_email=payload.externo_email,
        criado_por_id=payload.criado_por_id,
        expira_em=payload.expira_em,
        consumo_policy=payload.consumo_policy,
        arquivo_ids=payload.arquivo_ids,
        request_meta={"ip": request.client.host, "ua": request.headers.get("User-Agent")}
    )
    return share

@router.post("/{share_id}/token", response_model=TokenRead, status_code=status.HTTP_201_CREATED)
def issue_token(share_id: int, externo_email: str, validade_horas: int = 24, session: Session = Depends(get_session), request: Request = None):
    try:
        token = emitir_token_access(
            session=session,
            share_id=share_id,
            externo_email=externo_email,
            validade_horas=validade_horas,
            request_meta={"ip": request.client.host, "ua": request.headers.get("User-Agent")}
        )
        return TokenRead(token=token.token, expira_em=token.expira_em)
    except TokenError as e:
        raise HTTPException(status_code=400, detail=str(e))