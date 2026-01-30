
from datetime import datetime, timedelta, UTC
from jose import jwt
from app.core.config import settings

ALGO = "HS256"


def create_app_jwt(claims: dict, expires_minutes: int = 720) -> str:
    """Cria JWT com claims customizados."""
    payload = claims.copy()
    payload["exp"] = datetime.now(UTC) + timedelta(minutes=expires_minutes)
    payload["iat"] = datetime.now(UTC)
    payload["iss"] = "secure-share"
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=ALGO)


def decode_app_jwt(token: str) -> dict | None:
    """Decodifica JWT e retorna payload ou None se invalido."""
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[ALGO])
    except Exception as e:
        print(f"[ERRO JWT]: {str(e)}")
        return None


# Alias para compatibilidade com routes_auth.py
def create_session_jwt(
    user_id: int,
    email: str,
    user_type: str,
    expires_minutes: int = 60
) -> str:
    """
    Cria JWT de sessao para usuario autenticado.
    """
    claims = {
        "user_id": user_id,
        "email": email,
        "type": user_type,
        "sub": str(user_id),
    }
    return create_app_jwt(claims, expires_minutes)


def decode_session_jwt(token: str) -> dict | None:
    """
    Decodifica JWT de sessao.
    Alias para decode_app_jwt.
    """
    return decode_app_jwt(token)
