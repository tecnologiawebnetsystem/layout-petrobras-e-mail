
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from typing import Optional
from app.db.session import get_session
from app.models.user import User, TypeUser
from app.utils.session_jwt import decode_app_jwt

# Security scheme para Bearer token (opcional para documentacao)
security = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    session: Session = Depends(get_session),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> User:
    """
    Obtem o usuario atual a partir do cookie de sessao ou Bearer token.
    Suporta ambos os metodos de autenticacao.
    """
    token = None
    
    # 1. Tenta obter do Bearer token (header Authorization)
    if credentials and credentials.credentials:
        token = credentials.credentials
    
    # 2. Fallback para cookie de sessao
    if not token:
        token = request.cookies.get("app_session")
    
    # 3. Tenta header Authorization manualmente (caso HTTPBearer nao capture)
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Nao autenticado.")
    
    # Decodifica o token
    data = decode_app_jwt(token)
    if not data:
        raise HTTPException(status_code=401, detail="Token invalido ou expirado.")
    
    # Busca usuario
    user = session.exec(select(User).where(User.email == data.get("email"))).first()
    if not user or not user.status:
        raise HTTPException(status_code=401, detail="Sessao invalida ou usuario inativo.")
    
    return user


def get_current_user_optional(
    request: Request,
    session: Session = Depends(get_session),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """
    Versao opcional - retorna None se nao autenticado ao inves de erro.
    """
    try:
        return get_current_user(request, session, credentials)
    except HTTPException:
        return None

def require_internal(user: User = Depends(get_current_user)) -> User:
    if user.type not in (TypeUser.INTERNAL, TypeUser.SUPERVISOR):
        raise HTTPException(status_code=403, detail="Acesso restrito a usuários internos.")
    return user

def require_supervisor(user: User = Depends(get_current_user)) -> User:
    if user.type != TypeUser.SUPERVISOR:
        raise HTTPException(status_code=403, detail="Acesso restrito a supervisores.")
    return user
