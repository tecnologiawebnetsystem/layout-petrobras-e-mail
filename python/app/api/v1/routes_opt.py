
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.db.session import get_session

from app.services.token_service import (
    emitir_otp,
    verificar_otp,
    emitir_token_access,
    TokenError
)

from app.schemas.token_schema import TokenRead
from app.services.audit_service import log_event
from app.core.config import settings

router = APIRouter(prefix="/auth/codigo", tags=["Auth / Código"])


class SolicitarPayload(BaseModel):
    email: EmailStr
    validade_minutos: int = 10


class VerificarPayload(BaseModel):
    email: EmailStr
    codigo: str
    max_tentativas: int = 5
    cooldown_minutes: int = 15
    validade_horas_access: int = 24


@router.post("/solicitar")
def solicitar(payload: SolicitarPayload, session: Session = Depends(get_session), request: Request = None):
    """
    O externo informa apenas o e-mail. O backend localiza o share ATIVO e
    envia um código de 6 dígitos por e-mail. Não expõe share_id.
    """
    try:
        otp = emitir_otp(
            session=session,
            email=payload.email,
            validade_minutos=payload.validade_minutos or settings.otp_validade_minutos,
            request_meta={"ip": request.client.host,
                          "ua": request.headers.get("User-Agent")}
        )
        return {"message": "Código de verificação enviado por e-mail.", "expira_em": otp.expira_em.isoformat()}
    except TokenError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verificar")
def verificar(payload: VerificarPayload, session: Session = Depends(get_session), request: Request = None):
    try:
        otp = verificar_otp(
            session=session,
            email=payload.email,
            codigo=payload.codigo,
            max_tentativas=payload.max_tentativas or settings.otp_max_tentativas,
            cooldown_minutes=payload.cooldown_minutes or settings.otp_cooldown_minutes,
            request_meta={"ip": request.client.host, "ua": request.headers.get("User-Agent")})
    except TokenError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Emite ACCESS vinculado ao mesmo share valido
    try:
        access = emitir_token_access(
            session=session,
            otp=otp,
            externo_email=payload.email,
            validade_horas=payload.validade_horas_access or settings.access_valid_hours,
            request_meta={"ip": request.client.host if request else None,
                            "ua": request.headers.get("User-Agent") if request else None}
        )

        log_event(
            session=session,
            evento="ACESSO_LIBERADO",
            usuario_id=otp.usuario_id,
            share_id=otp.share_id,
            ip=request.client.host if request else None,
            user_agent=request.headers.get("User-Agent") if request else None
        )

        return TokenRead(token=access.token, expira_em=access.expira_em)
    except TokenError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
