import secrets
import random
from datetime import datetime, timedelta, UTC
from sqlmodel import Session, select
from passlib.context import CryptContext

from app.models.usuario import Usuario, TipoUsuario
from app.models.token_acesso import TokenAcesso, TokenTipo
from app.models.share import Share, ShareStatus
from app.services.audit_service import log_event

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenError(Exception):
    pass


# =====================
# OTP (código 6 dígitos)
# =====================


def _gerar_codigo_6_digitos() -> str:
    return f"{random.randint(0, 999999):06d}"


def _hash_codigo(codigo: str) -> str:
    return pwd_context.hash(codigo)


def _verificar_hash(codigo: str, codigo_hash: str) -> bool:
    return pwd_context.verify(codigo, codigo_hash)


# Fake de envio de e-mail (apenas para visualização)
def enviar_email_mock(email: str, codigo: str) -> None:
    print(f"[EMAIL MOCK] Código OTP para {email}: {codigo}")


# Gerar senha de 6 digitos para o usuário de acesso externo
def emitir_otp(session: Session, email: str, validade_minutos: int = 10, request_meta: dict | None = None) -> TokenAcesso:
    # Obter share ativo por email do usuário externo
    share = session.exec(
        select(Share)
        .where(
            Share.externo_email == email,
            Share.status == ShareStatus.ATIVO,
            Share.expira_em > datetime.now()
        )
        .order_by(Share.id.desc())
    ).first()

    if not share:
        raise TokenError("Não há compartilhamento ativo para este e-mail.")

    # Garante usuário externo
    usuario = session.exec(select(Usuario).where(
        Usuario.email == email)).first()
    if not usuario:
        usuario = Usuario(
            nome_completo=email.split("@")[0],
            email=email,
            tipo=TipoUsuario.EXTERNO,
            ativo=True
        )
        session.add(usuario)
        session.commit()
        session.refresh(usuario)

    # Valida tipo e status
    if usuario.tipo != TipoUsuario.EXTERNO:
        raise TokenError(
            "A emissão de token por e-mail é apenas para usuário EXTERNO.")
    if not usuario.ativo:
        raise TokenError("Usuário inativo. Contate o suporte.")

    codigo = _gerar_codigo_6_digitos()
    codigo_hash = _hash_codigo(codigo)
    expira_em = datetime.now(UTC) + timedelta(minutes=validade_minutos)

    otp = TokenAcesso(
        tipo=TokenTipo.OTP,
        token=None,
        token_hash=codigo_hash,
        usuario_id=usuario.id,
        share_id=share.id,
        expira_em=expira_em,
        usado=False
    )
    session.add(otp)
    session.commit()
    session.refresh(otp)

    enviar_email_mock(email, codigo)

    log_event(
        session, "EMITIR_OTP",
        usuario_id=usuario.id,
        detalhe=f"validade_minutos={validade_minutos}",
        ip=request_meta.get("ip") if request_meta else None,
        user_agent=request_meta.get("ua") if request_meta else None
    )

    return otp


def verificar_otp(
        session: Session, 
        email: str, 
        codigo: str, 
        max_tentativas: int = 5,
        cooldown_minutes: int = 15,
        request_meta: dict | None = None) -> TokenAcesso:
    # Pega o último OTP não usado do e-mail
    otp = session.exec(
        select(TokenAcesso)
        .where(TokenAcesso.tipo == TokenTipo.OTP, TokenAcesso.usado == False)
        .where(TokenAcesso.usuario.has(Usuario.email == email))
        .order_by(TokenAcesso.id.desc())
    ).first()

    if not otp:
        raise TokenError("OTP não encontrado ou já utilizado.")
    
    # cooldown ativo?
    if otp.bloqueado_ate and otp.bloqueado_ate > datetime.now():
        raise TokenError(f"Tentativas excedidas. Tente novamente após {otp.bloqueado_ate.isoformat()}.")

    # Expiração
    if otp.expira_em <= datetime.now():
        raise TokenError("OTP expirado.")

    # Verificar hash
    if not _verificar_hash(codigo, otp.token_hash or ""):
        otp.tentativas += 1
        
        if otp.tentativas >= max_tentativas:
            otp.bloqueado_ate = datetime.now(UTC) + timedelta(minutes=cooldown_minutes)
        session.add(otp)
        session.commit()
        
        if otp.bloqueado_ate:
            raise TokenError(f"Código inválido. Acesso bloqueado até {otp.bloqueado_ate.isoformat()}.")

        raise TokenError("Código inválido.")


    otp.usado = True
    otp.tentativas = 0
    otp.bloqueado_ate = None
    session.add(otp)
    session.commit()
    session.refresh(otp)

    share = otp.share
    if not share or share.status != ShareStatus.ATIVO or share.expira_em <= datetime.now():
        raise TokenError("Compartilhamento indisponível ou expirado.")

    # Registro do log da verificação
    log_event(
        session, "VERIFICAR_OTP",
        usuario_id=otp.usuario_id,
        detalhe=f"otp_id={otp.id}",
        ip=request_meta.get("ip") if request_meta else None,
        user_agent=request_meta.get("ua") if request_meta else None
    )

    return otp


# =====================
# ACCESS (token p/ share)
# =====================


def emitir_token_access(
        session: Session,
        otp: TokenAcesso, externo_email: str,
        validade_horas: int = 24,
        request_meta: dict | None = None) -> TokenAcesso:
    # Valida share
    share = otp.share

    if not share or share.status != ShareStatus.ATIVO or share.expira_em <= datetime.now():
        raise TokenError("Compartilhamento indisponível ou expirado.")

    token_str = secrets.token_urlsafe(32)
    expira_em = datetime.now(UTC) + timedelta(hours=validade_horas)

    access = TokenAcesso(
        tipo=TokenTipo.ACCESS,
        token=token_str,
        token_hash=None,
        usuario_id=otp.usuario_id,
        share_id=share.id,
        expira_em=expira_em,
        usado=False
    )
    session.add(access)
    session.commit()
    session.refresh(access)

    log_event(
        session, "EMITIR_ACCESS",
        usuario_id=access.usuario_id,
        share_id=share.id,
        detalhe=f"validade_horas={validade_horas}",
        ip=request_meta.get("ip") if request_meta else None,
        user_agent=request_meta.get("ua") if request_meta else None)

    return access


def obter_token_access(session: Session, token_str: str) -> TokenAcesso | None:
    return session.exec(
        select(TokenAcesso).where(
            TokenAcesso.tipo == TokenTipo.ACCESS, 
            TokenAcesso.token == token_str
        )
    ).first()


def validar_token_access(token_obj: TokenAcesso) -> None:
    if token_obj.usado:
        raise TokenError("Token já utilizado.")
    if token_obj.expira_em <= datetime.now():
        raise TokenError("Token expirado.")


def consumir_token(token_obj: TokenAcesso, session: Session) -> None:
    token_obj.usado = True
    session.add(token_obj)
    session.commit()
