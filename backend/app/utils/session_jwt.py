
from datetime import datetime, timedelta, UTC
from jose import jwt
from app.core.config import settings

ALGO = "HS256"

def create_app_jwt(claims: dict, expires_minutes: int = 720) -> str:
    payload = claims.copy()
    payload["exp"] = datetime.now(UTC) + timedelta(minutes=expires_minutes)
    payload["iat"] = datetime.now(UTC)
    payload["iss"] = "secure-share"
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=ALGO)

def decode_app_jwt(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[ALGO])
       
    except Exception as e:
        print(f"[ERRO]: {str(e)}")