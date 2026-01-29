
from fastapi import HTTPException, Depends, Request
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.user import User, TypeUser
from app.utils.session_jwt import decode_app_jwt

def get_current_user(request: Request, session: Session = Depends(get_session)) -> User:
    tok = request.cookies.get("app_session")
    data = decode_app_jwt(tok) if tok else None
    if not data:
        raise HTTPException(status_code=401, detail="Não autenticado.")
    user = session.exec(select(User).where(User.email == data.get("email"))).first()
    if not user or not user.status:
        raise HTTPException(status_code=401, detail="Sessão inválida.")
    return user

def require_internal(user: User = Depends(get_current_user)) -> User:
    if user.type not in (TypeUser.INTERNAL, TypeUser.SUPERVISOR):
        raise HTTPException(status_code=403, detail="Acesso restrito a usuários internos.")
    return user

def require_supervisor(user: User = Depends(get_current_user)) -> User:
    if user.type != TypeUser.SUPERVISOR:
        raise HTTPException(status_code=403, detail="Acesso restrito a supervisores.")
    return user
