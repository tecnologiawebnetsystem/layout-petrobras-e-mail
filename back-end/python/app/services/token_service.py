
import secrets
import random
from datetime import datetime, timedelta, UTC
from sqlmodel import Session, select
from passlib.context import CryptContext

from app.models.user import User, TypeUser
from app.models.token_access import TokenAccess, TypeToken
from app.models.share import Share, ShareStatus
from app.services.audit_service import log_event

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenError(Exception):
    pass


# =====================
# OTP (código 6 dígitos)
# =====================


def _generate_code_6_digit() -> str:
    return f"{random.randint(0, 999999):06d}"


def _hash_code(codigo: str) -> str:
    return pwd_context.hash(codigo)


def _verify_hash(codigo: str, codigo_hash: str) -> bool:
    return pwd_context.verify(codigo, codigo_hash)


# Fake de envio de e-mail (apenas para visualização)
def send_id_email(email: str, codigo: str) -> None:
    print(f"[EMAIL MOCK] Código OTP para {email}: {codigo}")


# Gerar senha de 6 digitos para o usuário de acesso externo
def issue_otp(session: Session, email: str, validity_minutes: int = 10, request_meta: dict | None = None) -> TokenAccess:
    # Obter share ativo por email do usuário externo
    share = session.exec(
        select(Share)
        .where(
            Share.external_email == email,
            Share.status == ShareStatus.ACTIVE,
            Share.expira_at > datetime.now(UTC)
        )
        .order_by(Share.id.desc())
    ).first()

    if not share:
        raise TokenError("Não há compartilhamento ativo para este e-mail.")

    # Garante usuário externo
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        user = User(
            name=email.split("@")[0],
            email=email,
            type=TypeUser.EXTERNAL,
            status=True
        )
        session.add(user)
        session.commit()
        session.refresh(user)

    # Valida tipo e status
    if user.type != TypeUser.EXTERNAL:
        raise TokenError(
            "A emissão de token por e-mail é apenas para usuário EXTERNO.")
    if not user.status:
        raise TokenError("Usuário inativo. Contate o suporte.")

    code = _generate_code_6_digit()
    code_hash = _hash_code(code)
    expira_at = datetime.now(UTC) + timedelta(minutes=validity_minutes)

    otp = TokenAccess(
        type=TypeToken.OTP,
        token=None,
        token_hash=code_hash,
        user_id=user.id,
        share_id=share.id,
        expira_at=expira_at,
        used=False
    )
    session.add(otp)
    session.commit()
    session.refresh(otp)

    send_id_email(email, code)

    log_event(
        session, "issue_otp",
        user_id=user.id,
        detail=f"validity_minutes={validity_minutes}",
        ip=request_meta.get("ip") if request_meta else None,
        user_agent=request_meta.get("ua") if request_meta else None
    )

    return otp


def verify_otp(
        session: Session, 
        email: str, 
        code: str, 
        max_attempts: int = 5,
        cooldown_minutes: int = 15,
        request_meta: dict | None = None) -> TokenAccess:
    # Pega o último OTP não usado do e-mail
    otp = session.exec(
        select(TokenAccess)
        .where(TokenAccess.type == TypeToken.OTP, TokenAccess.used == False)
        .where(TokenAccess.user.has(User.email == email))
        .order_by(TokenAccess.id.desc())
    ).first()

    if not otp:
        raise TokenError("OTP não encontrado ou já utilizado.")
    
    # cooldown ativo?
    if otp.blocked_until and otp.blocked_until > datetime.now(UTC):
        raise TokenError(f"Tentativas excedidas. Tente novamente após {otp.blocked_until.isoformat()}.")

    # Expiração
    if otp.expira_at.replace(tzinfo=UTC) <= datetime.now(UTC):
        raise TokenError("OTP expirado.")

    # Verificar hash
    if not _verify_hash(code, otp.token_hash or ""):
        otp.attempts += 1
        
        if otp.attempts >= max_attempts:
            otp.blocked_until = datetime.now(UTC) + timedelta(minutes=cooldown_minutes)
        session.add(otp)
        session.commit()
        
        if otp.blocked_until:
            raise TokenError(f"Código inválido. Acesso bloqueado até {otp.blocked_until.isoformat()}.")

        raise TokenError("Código inválido.")


    otp.used = True
    otp.attempts = 0
    otp.blocked_until = None
    session.add(otp)
    session.commit()
    session.refresh(otp)


    share = otp.share
    if not share or share.status != ShareStatus.ACTIVE or share.expira_at.replace(tzinfo=UTC) <= datetime.now(UTC):
        raise TokenError("Compartilhamento indisponível ou expirado.")

    # Registro do log da verificação
    log_event(
        session, "verify_otp",
        user_id=otp.user_id,
        detail=f"otp_id={otp.id}",
        ip=request_meta.get("ip") if request_meta else None,
        user_agent=request_meta.get("ua") if request_meta else None
    )

    return otp


# =====================
# ACCESS (token p/ share)
# =====================


def issue_token_access(
        session: Session,
        otp: TokenAccess, 
        validity_hours: int = 24,
        request_meta: dict | None = None) -> TokenAccess:
    # Valida share
    share = otp.share

    if not share or share.status != ShareStatus.ACTIVE or share.expira_at.replace(tzinfo=UTC) <= datetime.now(UTC):
        raise TokenError("Compartilhamento indisponível ou expirado.")

    token_str = secrets.token_urlsafe(32)
    expira_at = datetime.now(UTC) + timedelta(hours=validity_hours)

    access = TokenAccess(
        type=TypeToken.ACCESS,
        token=token_str,
        token_hash=None,
        user_id=otp.user_id,
        share_id=share.id,
        expira_at=expira_at,
        used=False
    )
    session.add(access)
    session.commit()
    session.refresh(access)

    log_event(
        session, "EMITIR_ACCESS",
        user_id=access.user_id,
        share_id=share.id,
        detail=f"validade_horas={validity_hours}",
        ip=request_meta.get("ip") if request_meta else None,
        user_agent=request_meta.get("ua") if request_meta else None)

    return access


def get_token_access(session: Session, token_str: str) -> TokenAccess | None:
    return session.exec(
        select(TokenAccess).where(
            TokenAccess.type == TypeToken.ACCESS, 
            TokenAccess.token == token_str
        )
    ).first()


def validate_token_access(token_obj: TokenAccess) -> None:
    if token_obj.used:
        raise TokenError("Token já utilizado.")
    if token_obj.expira_at.replace(tzinfo=UTC) <= datetime.now(UTC):
        raise TokenError("Token expirado.")


def consume_token(token_obj: TokenAccess, session: Session) -> None:
    token_obj.used = True
    session.add(token_obj)
    session.commit()
