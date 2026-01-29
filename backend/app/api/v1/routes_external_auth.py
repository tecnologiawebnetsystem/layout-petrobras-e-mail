# Gerar código e designar token de acesso a área compartilhada ao usuário externo
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlmodel import Session
from pydantic import BaseModel, EmailStr
from app.db.session import get_session
from app.services.auth_service import AuthFacade
from app.services.token_service import TokenError

from app.services.email_service import send_otp_email

router = APIRouter(prefix="/auth/external", tags=["Auth / External"])


class RequestCode(BaseModel):
    email: EmailStr
    validity_minutes: int = 10


class VerifyCode(BaseModel):
    email: EmailStr
    code: str
    max_attempts: int = 5
    cooldown_minutes: int = 15
    access_valid_hours: int = 24


@router.post("/request-code")
def request_code(payload: RequestCode, background_tasks: BackgroundTasks, session: Session = Depends(get_session), request: Request = None):
    """
    O externo informa apenas o e-mail. O backend localiza o share ATIVO e
    envia um código de 6 dígitos por e-mail. Não expõe share_id.
    """
    facade = AuthFacade() # Serviço Externo
    try:
        otp, code = facade.external.request_code(
            session=session,
            email=payload.email,
            validity_minutes=payload.validity_minutes,
            meta={
                "ip": request.client.host,
                "ua": request.headers.get("User-Agent")
            }
        )

        # TESTADO O ENVIO DE E-MAIL, MAS SOMENTE ATIVAR PARA ENVIAR PARA DEV/PRODUÇÃO
        # background_tasks.add_task(
        #     send_otp_email,
        #     payload.email,
        #     code,
        #     otp.expires_at
        # )

        # Remover code quando subir a aplicação para produção
        return {
            "code": code,
            "message": "Código enviado por e-mail.",
            "expires_at": otp.expires_at.isoformat()
        }
    except TokenError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-code")
def verify_code(payload: VerifyCode, session: Session = Depends(get_session), request: Request = None):
    facade = AuthFacade()
    try:
        return facade.external.verify_code(
            session,
            payload.email,
            payload.code,
            payload.max_attempts,
            payload.cooldown_minutes,
            payload.access_valid_hours,
            {
                "ip": request.client.host, 
                "ua": request.headers.get("User-Agent")
            }
        )

    except TokenError as e:
        raise HTTPException(status_code=400, detail=str(e))
