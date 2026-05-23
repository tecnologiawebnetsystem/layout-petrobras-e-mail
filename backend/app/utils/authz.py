
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime, UTC
from app.db.session import get_session
from app.models.user import User, TypeUser
from app.utils.session_jwt import decode_app_jwt

# Security scheme para Bearer token (obrigatorio)
security = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    session: Session = Depends(get_session),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> User:
    """
    Obtem o usuario atual a partir do Bearer token (JWT interno).

    Validacoes:
    - Token DEVE estar presente no header Authorization: Bearer <token>
    - Token DEVE ser um JWT valido emitido por este backend (issuer: secure-share)
    - Token NAO pode estar expirado
    - Usuario DEVE existir e estar ativo no banco
    """
    token = None

    # 1. Obter do Bearer token (header Authorization)
    if credentials and credentials.credentials:
        token = credentials.credentials

    # 2. Fallback manual para header Authorization
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    # 3. Fallback para cookie de sessao (compatibilidade legado)
    if not token:
        token = request.cookies.get("app_session")

    if not token:
        raise HTTPException(status_code=401, detail="Nao autenticado. Token Bearer obrigatorio.")

    # Decodifica o token
    data = decode_app_jwt(token)
    if not data:
        raise HTTPException(status_code=401, detail="Token invalido ou expirado.")

    # Verificar issuer
    if data.get("iss") != "secure-share":
        raise HTTPException(status_code=401, detail="Token com issuer invalido.")

    # Verificar expiracao explicita
    exp = data.get("exp")
    if exp and datetime.fromtimestamp(exp, tz=UTC) < datetime.now(UTC):
        raise HTTPException(status_code=401, detail="Token expirado.")

    # Busca usuario por user_id (preferencial) ou email
    user_id = data.get("user_id")
    email = data.get("email")

    user = None
    if user_id:
        user = session.get(User, user_id)
    if not user and email:
        user = session.exec(select(User).where(User.email == email)).first()

    if not user:
        raise HTTPException(status_code=401, detail="Usuario nao encontrado.")

    if not user.status:
        raise HTTPException(status_code=403, detail="Usuario desativado.")

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
    if user.type != TypeUser.INTERNAL:
        raise HTTPException(status_code=403, detail="Acesso restrito a usuários internos.")
    return user

def require_supervisor(user: User = Depends(get_current_user)) -> User:
    if user.type != TypeUser.INTERNAL or not user.is_supervisor:
        raise HTTPException(status_code=403, detail="Acesso restrito a supervisores.")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """
    Exige que o usuario seja um Super Administrador Global.
    Admins podem ver TODOS os logs, usuarios e compartilhamentos do sistema.
    """
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")
    return user
