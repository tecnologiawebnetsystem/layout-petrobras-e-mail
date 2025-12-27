# Serviço de Auth Local
from datetime import datetime, timedelta, UTC
from sqlmodel import Session, select
from passlib.context import CryptContext
from app.models.user import User, TypeUser
from app.models.credencial_local import CredentialLocal

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LocalAuthError(Exception): ...

def _get_user_by_email(session: Session, email: str) -> User | None:
    return session.exec(select(User).where(User.email == email)).first()

def dev_signup(session: Session, email: str, name: str, type: TypeUser, password: str) -> User:
    user = _get_user_by_email(session, email)
    if user:
        raise LocalAuthError("Email já cadastrado.")
    user = User(name=name, email=email, type=type, status=True)
    session.add(user); session.commit(); session.refresh(user)
    cred = CredentialLocal(user_id=user.id, password_hash=pwd.hash(password))
    session.add(cred); session.commit()
    return user

def dev_set_password(session: Session, email: str, new_password: str) -> None:
    user = _get_user_by_email(session, email)
    if not user: raise LocalAuthError("Usuário não encontrado.")
    cred = session.exec(select(CredentialLocal).where(CredentialLocal.user_id == user.id)).first()
    if not cred:
        cred = CredentialLocal(user_id=user.id, password_hash=pwd.hash(new_password))
    else:
        cred.password_hash = pwd.hash(new_password)
        cred.failed_attempts = 0
        cred.blocked_until = None
    session.add(cred); session.commit()

def login(session: Session, email: str, password: str, max_attempts: int = 5, cooldown_minutes: int = 15) -> User:
    user = _get_user_by_email(session, email)
    if not user or user.type not in (TypeUser.INTERNAL, TypeUser.SUPERVISOR) or not user.status:
        raise LocalAuthError("Credenciais inválidas.")
    cred = session.exec(select(CredentialLocal).where(CredentialLocal.user_id == user.id)).first()
    if not cred: raise LocalAuthError("Credenciais não configuradas.")

    if cred.blocked_until and cred.blocked_until > datetime.now(UTC):
        raise LocalAuthError(f"Acesso bloqueado até {cred.blocked_until.isoformat()}.")

    if not pwd.verify(password, cred.password_hash):
        cred.failed_attempts += 1
        if cred.failed_attempts >= max_attempts:
            cred.blocked_until = datetime.now(UTC) + timedelta(minutes=cooldown_minutes)
        session.add(cred); session.commit()
        if cred.blocked_until:
            raise LocalAuthError(f"Tentativas excedidas. Tente após {cred.blocked_until.isoformat()}.")
        raise LocalAuthError("Senha incorreta.")
    # sucesso
    cred.failed_attempts = 0
    cred.blocked_until = None
    session.add(cred); session.commit()

    return user
   
