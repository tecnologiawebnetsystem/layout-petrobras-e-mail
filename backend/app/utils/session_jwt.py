
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
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGO)


def decode_app_jwt(token: str) -> dict | None:
    """Decodifica JWT e retorna payload ou None se invalido."""
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[ALGO])
    except Exception as e:
        print(f"[ERRO JWT]: {str(e)}")
        return None


# Alias para compatibilidade com routes_auth.py
def create_session_jwt(
    user_id: int,
    email: str,
    user_type: str,
    is_supervisor: bool = False,
    expires_minutes: int = 60
) -> str:
    """
    Cria JWT de sessao para usuario autenticado.
    O campo 'type' no JWT reflete o papel lógico (supervisor | internal | externo)
    para compatibilidade com o frontend, mesmo que o DB armazene apenas INTERNAL/EXTERNAL.
    """
    type_value = user_type.value if hasattr(user_type, "value") else str(user_type)
    display_type = "supervisor" if is_supervisor else type_value
    claims = {
        "user_id": user_id,
        "email": email,
        "type": display_type,
        "is_supervisor": is_supervisor,
        "sub": str(user_id),
    }
    return create_app_jwt(claims, expires_minutes)


def decode_session_jwt(token: str) -> dict | None:
    """
    Decodifica JWT de sessao.
    Alias para decode_app_jwt.
    """
    return decode_app_jwt(token)
