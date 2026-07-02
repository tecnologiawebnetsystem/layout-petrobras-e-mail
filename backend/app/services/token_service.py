import secrets
import random
import logging
from datetime import datetime, timedelta, UTC
from sqlmodel import Session, select
from sqlalchemy import or_
from passlib.context import CryptContext

from app.models.user import User, TypeUser
from app.models.token_access import TokenAccess, TypeToken
from app.models.share import Share, ShareStatus
from app.services.audit_service import log_event
from app.services.cav4_auth_service import remove_role_from_user_with_fallback

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class TokenError(Exception):
    pass


def _remove_cav4_role_on_deactivation(
    user: User,
    role_code: str,
    cav4_access_token: str | None = None,
) -> None:
    """Remove papel CAV4 de forma resiliente, sem bloquear o fluxo principal."""
    login = user.login_cav4 or user.employee_id
    if not login:
        logger.warning("Nao foi possivel remover papel %s: usuario sem login_cav4/employee_id (user_id=%s)", role_code, user.id)
        return

    removed, source = remove_role_from_user_with_fallback(
        login=login,
        role_code=role_code,
        user_access_token=cav4_access_token,
    )
    if not removed:
        logger.warning(
            "Falha ao remover papel CAV4 %s do usuario=%s (login=%s, motivo=%s)",
            role_code,
            user.email,
            login,
            source,
        )


def deactivate_external_if_no_active_share(
    session: Session,
    user: User,
    request_meta: dict | None = None,
) -> bool:
    """
    Verifica se o usuário externo possui algum compartilhamento ativo e dentro
    do prazo. Se não possuir, desativa o usuário (status=False) e registra
    auditoria. Retorna True se o usuário foi desativado, False caso contrário.

    Deve ser chamado sempre que o sistema detectar que o share do usuário
    expirou ou foi encerrado durante a navegação.
    """
    if not user or user.type != TypeUser.EXTERNAL or not user.status:
        return False

    now = datetime.now(UTC)
    active_share = session.exec(
        select(Share).where(
            or_(
                Share.recipient_user_id == user.id,
                Share.external_email == user.email,
            ),
            Share.status.in_([
                ShareStatus.PENDING,
                ShareStatus.APPROVED,
                ShareStatus.ACTIVE,
            ]),
            Share.expires_at > now,
        ).limit(1)
    ).first()

    if active_share:
        return False

    user.status = False
    session.add(user)
    session.commit()
    log_event(
        session,
        "EXTERNO_DESATIVADO",
        user_id=user.id,
        detail="Nenhum share ativo detectado durante navegação — acesso revogado",
        ip=request_meta.get("ip") if request_meta else None,
        user_agent=request_meta.get("ua") if request_meta else None,
    )
    return True


# =====================================================
# Desativação de supervisor sem pendências
# =====================================================

def deactivate_supervisor_if_no_pending(
    session: Session,
    supervisor: User,
    request_meta: dict | None = None,
    remove_cav4_role: bool = True,
    cav4_access_token: str | None = None,
) -> bool:
    """
    Desativa o supervisor (status=False, is_supervisor=False) quando não há
    mais nenhum compartilhamento PENDING sob sua responsabilidade.

    Deve ser chamado após cada aprovação ou rejeição de compartilhamento.
    Retorna True se o supervisor foi desativado nesta chamada.
    """
    if not supervisor or not supervisor.is_supervisor or not supervisor.status:
        return False

    # Busca subordinados diretos
    subordinate_ids = session.exec(
        select(User.id).where(User.manager_id == supervisor.id)
    ).all()

    if not subordinate_ids:
        # Nenhum subordinado — sem pendências possíveis
        has_pending = False
    else:
        has_pending = session.exec(
            select(Share).where(
                Share.status == ShareStatus.PENDING,
                Share.created_by_id.in_(subordinate_ids),
            ).limit(1)
        ).first() is not None

    if has_pending:
        return False

    supervisor.is_supervisor = False
    supervisor.status = False
    session.add(supervisor)
    session.commit()

    log_event(
        session,
        "SUPERVISOR_DESATIVADO",
        user_id=supervisor.id,
        detail="Sem compartilhamentos pendentes — acesso supervisor revogado",
        ip=request_meta.get("ip") if request_meta else None,
        user_agent=request_meta.get("ua") if request_meta else None,
    )

    if remove_cav4_role:
        _remove_cav4_role_on_deactivation(
            supervisor,
            role_code="CD_PAPEL_SUPERVISOR",
            cav4_access_token=cav4_access_token,
        )
    return True


# =====================================================
# Desativação de usuário de upload
# =====================================================

_SHARE_CONCLUDED_STATUSES = {
    ShareStatus.APPROVED,
    ShareStatus.COMPLETED,
    ShareStatus.EXPIRED,
    ShareStatus.REJECTED,
    ShareStatus.CANCELED,
}


def deactivate_internal_if_all_shares_done(
    session: Session,
    user: User,
    request_meta: dict | None = None,
    remove_cav4_role: bool = True,
    cav4_access_token: str | None = None,
) -> bool:
    """
    Desativa o usuário interno (upload user) quando todos os seus compartilhamentos
    estão em estado terminal e não há nenhum PENDING nem ACTIVE dentro do prazo.

    Considera como terminal: APPROVED+expirado, COMPLETED, REJECTED, CANCELED.
    Usuários administradores nunca são desativados por este mecanismo.
    Requer que o usuário tenha ao menos um compartilhamento criado (evita desativar
    usuários recém-provisionados que ainda não iniciaram nenhum fluxo).

    Retorna True se o usuário foi desativado nesta chamada.
    """
    if not user or user.type != TypeUser.INTERNAL or not user.status:
        return False

    # Admin nunca é desativado automaticamente
    if user.is_admin:
        return False

    now = datetime.now(UTC)

    # Verifica se existe algum share não-terminal: PENDING ou ACTIVE dentro do prazo
    open_share = session.exec(
        select(Share).where(
            Share.created_by_id == user.id,
            or_(
                Share.status == ShareStatus.PENDING,
                (Share.status == ShareStatus.ACTIVE) & (Share.expires_at > now),
            ),
        ).limit(1)
    ).first()

    if open_share:
        return False

    # Tem pelo menos um share (não desativar user que nunca criou nada)
    total = session.exec(
        select(Share).where(Share.created_by_id == user.id).limit(1)
    ).first()
    if not total:
        return False

    user.status = False
    session.add(user)
    session.commit()

    log_event(
        session,
        "UPLOAD_USER_DESATIVADO",
        user_id=user.id,
        detail="Todos os compartilhamentos concluídos — acesso revogado",
        ip=request_meta.get("ip") if request_meta else None,
        user_agent=request_meta.get("ua") if request_meta else None,
    )

    if remove_cav4_role:
        _remove_cav4_role_on_deactivation(
            user,
            role_code="CD_PAPEL_USUARIO",
            cav4_access_token=cav4_access_token,
        )
    return True


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
            Share.expires_at > datetime.now(UTC)
        )
        .order_by(Share.id.desc())
    ).first()

    if not share:
        # Verifica se há share PENDING (ainda aguardando aprovação do supervisor).
        # Nesse caso NÃO desativa o usuário — o share é válido, só ainda não foi aprovado.
        pending_share = session.exec(
            select(Share)
            .where(
                Share.external_email == email,
                Share.status == ShareStatus.PENDING,
                Share.expires_at > datetime.now(UTC),
            )
            .limit(1)
        ).first()
        if pending_share:
            raise TokenError("O compartilhamento ainda não foi aprovado pelo supervisor.")

        # Sem nenhum share vivo (PENDING, APPROVED ou ACTIVE): desativa o usuário.
        existing_user = session.exec(select(User).where(User.email == email)).first()
        if existing_user and existing_user.type == TypeUser.EXTERNAL and existing_user.status:
            existing_user.status = False
            session.add(existing_user)
            session.commit()
            log_event(
                session, "EXTERNO_DESATIVADO",
                user_id=existing_user.id,
                detail="Nenhum share vivo (PENDING/APPROVED/ACTIVE) no momento da solicitação de OTP",
                ip=request_meta.get("ip") if request_meta else None,
                user_agent=request_meta.get("ua") if request_meta else None,
            )
        raise TokenError("Não há compartilhamento ativo para este e-mail.")

    # Usa o usuário externo pré-provisionado na criação do share (recipient_user_id).
    # Caso o share antigo não possua o vínculo (dados migrados), recupera via e-mail.
    if share.recipient_user_id:
        user = session.get(User, share.recipient_user_id)
    else:
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

    # Valida tipo
    if user.type != TypeUser.EXTERNAL:
        raise TokenError(
            "A emissão de token por e-mail é apenas para usuário EXTERNO.")

    # Garante que o usuário está ativo (pode ter sido desativado por inatividade anterior)
    if not user.status:
        raise TokenError("Usuário inativo. Contate o suporte.")

    code = _generate_code_6_digit()
    code_hash = _hash_code(code)
    expires_at = datetime.now(UTC) + timedelta(minutes=validity_minutes)

    otp = TokenAccess(
        type=TypeToken.OTP,
        token=None,
        token_hash=code_hash,
        user_id=user.id,
        share_id=share.id,
        expires_at=expires_at,
        used=False
    )
    session.add(otp)
    session.commit()
    session.refresh(otp)

    # send_id_email(email, code)

    log_event(
        session, "issue_otp",
        user_id=user.id,
        detail=f"validity_minutes={validity_minutes}",
        ip=request_meta.get("ip") if request_meta else None,
        user_agent=request_meta.get("ua") if request_meta else None
    )

    return otp, code


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
    
    # cooldown ativo? (stored as naive in SQLite — compare via .replace)
    if otp.blocked_until and otp.blocked_until.replace(tzinfo=UTC) > datetime.now(UTC):
        raise TokenError(f"Tentativas excedidas. Tente novamente após {otp.blocked_until.isoformat()}.")

    # Expiração
    if otp.expires_at.replace(tzinfo=UTC) <= datetime.now(UTC):
        raise TokenError("OTP expirado.")

    # Verificar hash
    if not _verify_hash(code, otp.token_hash or ""):
        otp.attempts += 1
        
        if otp.attempts >= max_attempts:
            # Armazena como naive UTC para consistência com SQLite
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
    if not share or share.status != ShareStatus.ACTIVE or share.expires_at.replace(tzinfo=UTC) <= datetime.now(UTC):
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
        validity_hours: int,
        request_meta: dict | None = None) -> TokenAccess:
    # Valida share
    share = otp.share

    if not share or share.status != ShareStatus.ACTIVE or share.expires_at.replace(tzinfo=UTC) <= datetime.now(UTC):
        raise TokenError("Compartilhamento indisponível ou expirado.")

    token_str = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(hours=validity_hours)

    access = TokenAccess(
        type=TypeToken.ACCESS,
        token=token_str,
        token_hash=None,
        user_id=otp.user_id,
        share_id=share.id,
        expires_at=expires_at,
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
    if token_obj.expires_at.replace(tzinfo=UTC) <= datetime.now(UTC):
        raise TokenError("Token expirado.")


def consume_token(token_obj: TokenAccess, session: Session) -> None:
    token_obj.used = True
    session.add(token_obj)
    session.commit()
