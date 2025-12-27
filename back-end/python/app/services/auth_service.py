# login e integração com EntraID
# Primeira versão gerada por IA para testar
from dataclasses import dataclass, field
from typing import Optional, Literal
from sqlmodel import Session, select
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi import HTTPException

from app.core.config import settings
from app.models.user import User, TypeUser
from app.services.token_service import (
    issue_otp, verify_otp, issue_token_access
)
from app.utils.session_jwt import create_app_jwt
from app.services.local_auth_service import (dev_signup, dev_set_password, login, LocalAuthError)
# Biblioteca AzureAD para Entre ID MS
import msal, secrets

# ---------- External (OTP + ACCESS) ----------

@dataclass
class ExternalAuthService:
    """
    Modalidade de usuário EXTERNO.
    Orquestra:
      - request_code(email, validade_minutos?)
      - verify_code(email, codigo, ..) -> emite ACCESS e retorna {token, expira_em, share_id}
    """
    def request_code(self, session: Session, email: str, validity_minutes: Optional[int] = None, meta: dict | None = None) -> dict:
        otp = issue_otp(
            session=session,
            email=email,
            validity_minutes=validity_minutes or settings.otp_validity_minutes,
            request_meta=meta or {}
        )
        return {"message": "Código enviado por e-mail.", "expira_em": otp.expira_at.isoformat()}

    def verify_code(self, session: Session, email: str, code: str,
                    max_attempts: Optional[int] = None,
                    cooldown_minutes: Optional[int] = None,
                    access_valid_hours: Optional[int] = None,
                    meta: dict | None = None) -> dict:
        otp = verify_otp(
            session=session,
            email=email,
            code=code,
            max_attempts=max_attempts or settings.otp_max_attempts,
            cooldown_minutes=cooldown_minutes or settings.otp_cooldown_minutes,
            request_meta=meta or {}
        )
        access = issue_token_access(
            session=session,
            otp=otp,
            validity_hours=access_valid_hours or settings.access_valid_hours,
            request_meta=meta or {}
        )
        return {"token": access.token, "expira_em": access.expira_at.isoformat(), "share_id": access.share_id}

# ---------- Internal providers ----------

class LocalAuthProvider:
    """
    Provedor local (dev): email+senha -> Ambiente local para teste
    """
    def signup(self, session: Session, email: str, name: str, type: TypeUser, password_hash: str) -> User:
        # você pode reutilizar o local_auth_service.py; aqui deixo a assinatura
        return dev_signup(session, email, name, type, password_hash)

    def set_password(self, session: Session, email: str, new_password: str) -> None:
        return dev_set_password(session, email, new_password)

    def login(self, session: Session, email: str, password: str) -> JSONResponse:
        try:
            user = login(session, email, password, max_attempts=5, cooldown_minutes=15)
        except LocalAuthError as e:
            raise HTTPException(status_code=401, detail=str(e))
        token = create_app_jwt({"user_id": user.id, "email": user.email, "type": user.type})
        resp = JSONResponse({"message": "Autenticado", "user_id": user.id, "type": user.type})
        resp.set_cookie("app_session", token, httponly=True, secure=False, samesite="lax", max_age=60*60*12)
        return resp

    def logout(self) -> JSONResponse:
        resp = JSONResponse({"message": "Logout"})
        resp.delete_cookie("app_session")
        return resp

class EntraAuthProvider:
    """
    Provedor Entra ID (OIDC/MSAL) - pronto para plugar quando tiver tenant configurado.
    Mantém a mesma interface de login/logout via cookie 'app_session'.
    """
    def login_redirect(self) -> RedirectResponse:
        state = secrets.token_urlsafe(16)
        authority = f"https://login.microsoftonline.com/{settings.entra_tenant_id}"
        scopes = ["openid", "profile", "email"]
        url = (
            f"{authority}/oauth2/v2.0/authorize"
            f"?client_id={settings.entra_client_id}"
            f"&response_type=code"
            f"&redirect_uri={settings.entra_redirect_uri}"
            f"&response_mode=query"
            f"&scope={' '.join(scopes)}"
            f"&state={state}"
        )
        return RedirectResponse(url)

    def handle_callback(self, session: Session, code: str) -> JSONResponse:
        authority = f"https://login.microsoftonline.com/{settings.entra_tenant_id}"
        app = msal.ConfidentialClientApplication(
            client_id=settings.entra_client_id,
            client_credential=settings.entra_client_secret,
            authority=authority
        )
        result = app.acquire_token_by_authorization_code(
            code=code, scopes=["openid", "profile", "email"], redirect_uri=settings.entra_redirect_uri
        )
        if "error" in result:
            raise HTTPException(status_code=401, detail=result.get("error_description"))

        claims = result.get("id_token_claims") or {}
        upn = claims.get("preferred_username") or claims.get("email")
        name = claims.get("name")
        groups = set(claims.get("groups", []))
        sup_groups = set(settings.entra_supervisor_group_ids or [])
        type = TypeUser.SUPERVISOR if groups.intersection(sup_groups) else TypeUser.INTERNAL

        user = session.exec(select(User).where(User.email == upn)).first()
        if not user:
            user = User(name=name or upn.split("@")[0], email=upn, type=type, status=True)
            session.add(user); session.commit(); session.refresh(user)
        else:
            user.type = type; user.status = True
            session.add(user); session.commit(); session.refresh(user)

        token = create_app_jwt({"user_id": user.id, "email": user.email, "type": user.type})
        resp = JSONResponse({"message": "Autenticado", "user_id": user.id, "type": user.type})
        resp.set_cookie("app_session", token, httponly=True, secure=True, samesite="lax", max_age=60*60*12)
        return resp

    def logout(self) -> JSONResponse:
        resp = JSONResponse({"message": "Logout"})
        resp.delete_cookie("app_session")
        return resp

# ---------- Façade (escolhe provider) ----------

@dataclass
class AuthFacade:
    """
    Ponto único para autenticação de 'usuários da empresa'.
    Externo é coberto por ExternalAuthService.
    Interno/Supervisor usa provider conforme AUTH_MODE.
    """
    mode: Literal["local", "entra"] = settings.auth_mode or "local"
    external: ExternalAuthService = field(default_factory=ExternalAuthService)

    def internal_provider(self) -> object:
        return LocalAuthProvider() if self.mode == "local" else EntraAuthProvider()
