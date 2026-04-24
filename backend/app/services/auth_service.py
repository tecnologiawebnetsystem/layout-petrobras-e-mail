# login e integração com EntraID – modelo SPA
# O frontend (MSAL) conduz o fluxo OAuth; o backend apenas valida o token e emite JWT interno.
from dataclasses import dataclass, field
from typing import Optional, Literal
from datetime import datetime, timedelta, UTC
from sqlmodel import Session, select
from fastapi.responses import JSONResponse
from fastapi import HTTPException
import secrets
import hashlib
import httpx
import jwt  # PyJWT

from app.core.config import settings
from app.models.user import User, TypeUser
from app.models.session_token import SessionToken, TokenType
from app.services.token_service import (
    issue_otp, verify_otp, issue_token_access
)
from app.utils.session_jwt import create_app_jwt, create_session_jwt
from app.services.local_auth_service import (dev_signup, dev_set_password, login, LocalAuthError)

# Cargos que concedem is_supervisor=True até integração ServiceNow.
_SUPERVISOR_TITLES = [
    "gerente", "coordenador", "diretor", "superintendente",
    "chefe", "líder", "lider", "supervisor",
]

# ---------- Validação de token Entra ID via JWKS ----------

_jwks_client: jwt.PyJWKClient | None = None


def _get_jwks_client() -> jwt.PyJWKClient:
    """Retorna (e memoriza) o cliente JWKS do tenant. Cache de 1 hora."""
    global _jwks_client
    if _jwks_client is None:
        jwks_uri = (
            f"https://login.microsoftonline.com/"
            f"{settings.entra_tenant_id}/discovery/v2.0/keys"
        )
        _jwks_client = jwt.PyJWKClient(jwks_uri, cache_jwk_set=True, lifespan=3600)
    return _jwks_client


def validate_entra_token(token: str) -> dict:
    """
    Valida um JWT do Microsoft Entra ID usando JWKS (chaves públicas RS256).

    Validações realizadas:
    - Assinatura RSA contra o JWKS do tenant
    - Expiração (exp)
    - Issuer: https://login.microsoftonline.com/<tenant_id>/v2.0
    - Audience: <client_id>  OU  api://<client_id>

    Envie o id_token retornado pelo MSAL (result.idToken) — audience = client_id.
    O access_token para Graph API tem audience diferente e será rejeitado.

    Returns:
        dict com os claims do token validado.
    Raises:
        HTTPException 401 em qualquer falha de validação.
    """
    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
    except jwt.exceptions.PyJWKClientError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Chave publica Entra ID indisponivel: {e}",
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token Entra ID invalido: {e}")

    expected_issuer = (
        f"https://login.microsoftonline.com/{settings.entra_tenant_id}/v2.0"
    )
    # id_token → audience = client_id
    # access_token para API exposta → audience = api://<client_id>
    valid_audiences = [
        settings.entra_client_id,
        f"api://{settings.entra_client_id}",
    ]

    for audience in valid_audiences:
        try:
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=audience,
                issuer=expected_issuer,
            )
        except jwt.exceptions.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token Entra ID expirado.")
        except jwt.exceptions.InvalidIssuerError:
            raise HTTPException(
                status_code=401, detail="Token Entra ID com issuer invalido."
            )
        except jwt.exceptions.DecodeError as e:
            raise HTTPException(
                status_code=401, detail=f"Token Entra ID malformado: {e}"
            )
        except jwt.exceptions.InvalidAudienceError:
            continue  # tenta a próxima audience válida
        except Exception as e:
            raise HTTPException(
                status_code=401, detail=f"Token Entra ID invalido: {e}"
            )

    raise HTTPException(
        status_code=401,
        detail=(
            "Token Entra ID com audience invalida. "
            "Envie o id_token do MSAL (nao o access_token para Graph API)."
        ),
    )


# ---------- External (OTP + ACCESS) ----------

@dataclass
class ExternalAuthService:
    """
    Modalidade de usuário EXTERNO.
    Orquestra:
      - request_code(email, validade_minutos?)
      - verify_code(email, codigo, ..) -> emite ACCESS e retorna {token, expires_at, share_id}
    """
    def request_code(self, session: Session, email: str, validity_minutes: Optional[int] = None, meta: dict | None = None) -> dict:
        return issue_otp(
            session=session,
            email=email,
            validity_minutes=validity_minutes or settings.otp_validity_minutes,
            request_meta=meta or {}
        )

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
        return {"token": access.token, "expires_at": access.expires_at.isoformat(), "share_id": access.share_id}

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

class EntraTokenProvider:
    """
    Provedor Entra ID – modelo SPA.
    O frontend autentica via MSAL e envia o id_token ao backend.
    O backend valida via JWKS, enriquece com Graph API (opcional)
    e emite tokens internos da aplicação.
    """

    def exchange(
        self,
        session: Session,
        entra_token: str,
        graph_token: str | None = None,
        request=None,
    ) -> dict:
        """
        Valida o id_token Entra ID, sincroniza o usuário e retorna tokens internos.

        Args:
            entra_token: id_token do MSAL (Authorization: Bearer) — validado via JWKS.
            graph_token: access_token do MSAL para Graph API (X-Graph-Token, opcional).
            request: objeto Request do FastAPI para IP/UA de auditoria.
        """
        # 1. Validar token via JWKS (assinatura RS256, exp, iss, aud)
        claims = validate_entra_token(entra_token)
        upn: str = claims.get("preferred_username") or claims.get("email") or ""
        name: str = claims.get("name") or upn.split("@")[0]
        groups: set = set(claims.get("groups", []))
        sup_groups: set = set(settings.entra_supervisor_group_ids or [])
        is_supervisor: bool = bool(groups.intersection(sup_groups))

        # 2. Enriquecer perfil via Graph API
        # Usa graph_token (access_token do MSAL) se fornecido; senão tenta entra_token
        # (só funciona se entra_token for um access_token — id_tokens são rejeitados pelo Graph).
        job_title: Optional[str] = None
        department: Optional[str] = None
        employee_id: Optional[str] = None
        manager_email: Optional[str] = None
        manager_name: Optional[str] = None
        photo_url: Optional[str] = None
        bearer = graph_token or entra_token
        try:
            headers = {"Authorization": f"Bearer {bearer}"}
            with httpx.Client(timeout=10.0) as client:
                profile_resp = client.get(
                    "https://graph.microsoft.com/v1.0/me", headers=headers
                )
                if profile_resp.status_code == 200:
                    prof = profile_resp.json()
                    job_title = prof.get("jobTitle")
                    department = prof.get("department")
                    employee_id = prof.get("employeeId")

                manager_resp = client.get(
                    "https://graph.microsoft.com/v1.0/me/manager", headers=headers
                )
                if manager_resp.status_code == 200:
                    mgr = manager_resp.json()
                    manager_email = mgr.get("mail")
                    manager_name = mgr.get("displayName")

                # Foto de perfil: Graph retorna bytes JPEG
                photo_resp = client.get(
                    "https://graph.microsoft.com/v1.0/me/photo/$value", headers=headers
                )
                if photo_resp.status_code == 200:
                    import base64 as _b64
                    content_type = photo_resp.headers.get("Content-Type", "image/jpeg")
                    photo_b64 = _b64.b64encode(photo_resp.content).decode()
                    photo_url = f"data:{content_type};base64,{photo_b64}"
        except Exception:
            pass  # Falha na Graph API não bloqueia o login

        # 3. Determinar supervisor pelo cargo caso não membro de grupo AD
        if not is_supervisor and job_title:
            if any(t in job_title.lower() for t in _SUPERVISOR_TITLES):
                is_supervisor = True

        # 4. Criar ou atualizar usuário no banco
        user = session.exec(select(User).where(User.email == upn)).first()
        if not user:
            user = User(
                email=upn,
                name=name,
                type=TypeUser.INTERNAL,
                is_supervisor=is_supervisor,
                department=department,
                job_title=job_title,
                employee_id=employee_id,
                photo_url=photo_url[:500] if photo_url else None,
                last_login=datetime.now(UTC),
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        else:
            user.name = name
            user.type = TypeUser.INTERNAL
            # user.is_supervisor é definido manualmente ou via ServiceNow — não sobrescrever no login.
            if job_title is not None:
                user.job_title = job_title
            if department is not None:
                user.department = department
            if employee_id is not None:
                user.employee_id = employee_id
            if photo_url is not None:
                user.photo_url = photo_url[:500]
            user.last_login = datetime.now(UTC)
            session.add(user)
            session.commit()
            session.refresh(user)

        # Vincular gestor somente se ainda não houver um cadastrado no banco.
        # O gestor pode ter sido definido manualmente ou via ServiceNow — não sobrescrever.
        if manager_email and user.manager_id is None:
            manager = session.exec(
                select(User).where(User.email == manager_email)
            ).first()
            if manager:
                user.manager_id = manager.id
                session.add(user)
                session.commit()

        # 5. Emitir tokens internos da aplicação
        access_token = create_session_jwt(
            user_id=user.id,
            email=user.email,
            user_type=user.type,
            is_supervisor=user.is_supervisor,
            expires_minutes=480,
        )
        refresh_token_value = secrets.token_urlsafe(32)
        ip = request.client.host if request else None
        ua = (request.headers.get("User-Agent") or "")[:500] if request else None
        session_token = SessionToken(
            user_id=user.id,
            token_hash=hashlib.sha256(refresh_token_value.encode()).hexdigest(),
            token_type=TokenType.REFRESH,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            ip_address=ip,
            user_agent=ua,
            email=user.email,
        )
        session.add(session_token)
        session.commit()

        display_type = "supervisor" if user.is_supervisor else "internal"
        result: dict = {
            "access_token": access_token,
            "refresh_token": refresh_token_value,
            "expires_in": 28800,
            "token_type": "bearer",
            "user_id": user.id,
            "name": name,
            "email": upn,
            "role": display_type,
        }
        if job_title:
            result["job_title"] = job_title
        if department:
            result["department"] = department
        if employee_id:
            result["employee_id"] = employee_id
        if manager_email:
            result["manager_email"] = manager_email
        if manager_name:
            result["manager_name"] = manager_name
        if photo_url:
            result["photo_url"] = photo_url
        return result

    def logout(self) -> JSONResponse:
        return JSONResponse({"message": "Logout"})

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
        return LocalAuthProvider() if self.mode == "local" else EntraTokenProvider()