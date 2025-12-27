from fastapi import HTTPException, Depends, Request
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.user import Usuario, TipoUsuario
from app.utils.session_jwt import decode_app_jwt

def get_current_user(request: Request, session: Session = Depends(get_session)) -> Usuario:
    tok = request.cookies.get("app_session")
    data = decode_app_jwt(tok) if tok else None
    if not data:
        raise HTTPException(status_code=401, detail="Não autenticado.")
    user = session.exec(select(Usuario).where(Usuario.email == data.get("user_email"))).first()
    if not user or not user.ativo:
        raise HTTPException(status_code=401, detail="Sessão inválida.")
    return user

def require_internal(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.tipo not in (TipoUsuario.INTERNO, TipoUsuario.SUPERVISOR):
        raise HTTPException(status_code=403, detail="Acesso restrito a usuários internos.")
    return user

def require_supervisor(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.tipo != TipoUsuario.SUPERVISOR:
        raise HTTPException(status_code=403, detail="Acesso restrito a supervisores.")
    return user
