from __future__ import annotations

import base64
import hashlib
import secrets
import ssl
import unicodedata
from typing import Any
from urllib.parse import quote

import httpx
import jwt
from fastapi import HTTPException

from app.core.config import settings

_CAV4_CODE_TO_ROLE: dict[str, str] = {
    "cd_papel_auditor":    "auditor",
    "cd_papel_supervisor": "supervisor",
    "cd_papel_usuario":    "internal",
}

_OIDC_CACHE: dict[str, Any] = {}
_JWKS_CLIENT: jwt.PyJWKClient | None = None


def generate_pkce() -> tuple[str, str]:
    """Gera par PKCE (code_verifier/code_challenge) para Authorization Code Flow."""
    code_verifier = secrets.token_urlsafe(96)
    digest = hashlib.sha256(code_verifier.encode()).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return code_verifier, code_challenge


def _get_ssl_verify() -> bool | str | ssl.SSLContext:
    """Resolve politica de verificacao TLS para chamadas ao CAv4.

    Prioridade:
    1) verify=False apenas em debug
    2) cert_file customizado
    3) truststore do SO
    4) verify=True padrao
    """
    if not settings.ca_ssl_verify:
        # Fail-safe: nunca aceitar verify=False fora de debug.
        if not settings.debug:
            raise HTTPException(
                status_code=500,
                detail="CA_SSL_VERIFY=false so e permitido em ambiente debug.",
            )
        return False

    if settings.ca_ssl_cert_file:
        return settings.ca_ssl_cert_file

    if settings.ca_ssl_use_truststore:
        try:
            import truststore

            return truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        except Exception:
            # Fallback seguro para verify=True caso truststore nao esteja instalado.
            return True

    return True


def _require_env(name: str, value: str | None) -> str:
    """Garante configuracao obrigatoria; falha com erro 500 explicito."""
    if value:
        return value
    raise HTTPException(status_code=500, detail=f"Configuracao ausente: {name}")


def get_oidc_config() -> dict[str, Any]:
    """Busca (e cacheia em memoria) o documento discovery do OIDC."""
    discovery_url = _require_env("OIDC_DISCOVERY_URL", settings.oidc_discovery_url)

    cached = _OIDC_CACHE.get("cfg")
    if cached:
        return cached

    with httpx.Client(timeout=15.0, verify=_get_ssl_verify()) as client:
        resp = client.get(discovery_url)
    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Falha ao obter discovery OIDC do CAv4: {resp.status_code}",
        )

    cfg = resp.json()
    _OIDC_CACHE["cfg"] = cfg
    return cfg


def get_authorization_url(state: str, nonce: str, code_challenge: str) -> str:
    """Monta URL de autorizacao OIDC com parametros de seguranca (state/nonce/PKCE)."""
    cfg = get_oidc_config()
    auth_ep = cfg.get("authorization_endpoint")
    if not auth_ep:
        raise HTTPException(status_code=500, detail="OIDC sem authorization_endpoint")

    client_id = _require_env("CA_CLIENT_ID", settings.ca_client_id)
    redirect_uri = _require_env("CA_REDIRECT_URI", settings.ca_redirect_uri)
    scopes = settings.ca_scopes or "openid profile"

    return (
        f"{auth_ep}?client_id={quote(client_id, safe='')}"
        f"&redirect_uri={quote(redirect_uri, safe='')}"
        f"&response_type=code"
        f"&scope={quote(scopes, safe='')}"
        f"&state={quote(state, safe='')}"
        f"&nonce={quote(nonce, safe='')}"
        f"&code_challenge={quote(code_challenge, safe='')}"
        f"&code_challenge_method=S256"
    )


def exchange_code_for_tokens(code: str, code_verifier: str) -> dict[str, Any]:
    """Troca o authorization code por tokens no endpoint token do provedor OIDC."""
    cfg = get_oidc_config()
    token_ep = cfg.get("token_endpoint")
    if not token_ep:
        raise HTTPException(status_code=500, detail="OIDC sem token_endpoint")

    client_id = _require_env("CA_CLIENT_ID", settings.ca_client_id)
    client_secret = _require_env("CA_CLIENT_SECRET", settings.ca_client_secret)
    redirect_uri = _require_env("CA_REDIRECT_URI", settings.ca_redirect_uri)

    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": client_id,
        "client_secret": client_secret,
        "code_verifier": code_verifier,
    }

    with httpx.Client(timeout=20.0, verify=_get_ssl_verify()) as client:
        resp = client.post(token_ep, data=payload)

    if resp.status_code >= 400:
        raise HTTPException(
            status_code=401,
            detail=f"Falha no code exchange CAv4: {resp.status_code}",
        )

    return resp.json()


def get_client_credentials_token() -> str | None:
    """Obtém access_token técnico via client_credentials para operações administrativas no CAv4.

    Retorna None quando não for possível obter token técnico. Não lança exceção para permitir fallback gracioso.
    """
    try:
        cfg = get_oidc_config()
        token_ep = cfg.get("token_endpoint")
        if not token_ep:
            return None

        client_id = settings.ca_client_id
        client_secret = settings.ca_client_secret
        if not client_id or not client_secret:
            return None

        scopes = settings.ca_scopes or "openid profile"
        payload = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": scopes,
        }

        with httpx.Client(timeout=20.0, verify=_get_ssl_verify()) as client:
            resp = client.post(token_ep, data=payload)

        if resp.status_code >= 400:
            return None

        return resp.json().get("access_token")
    except Exception:
        return None


def _get_jwks_client() -> jwt.PyJWKClient:
    """Inicializa cliente JWKS com cache para validacao de assinatura dos JWTs."""
    global _JWKS_CLIENT
    if _JWKS_CLIENT is not None:
        return _JWKS_CLIENT

    cfg = get_oidc_config()
    jwks_uri = cfg.get("jwks_uri")
    if not jwks_uri:
        raise HTTPException(status_code=500, detail="OIDC sem jwks_uri")

    _JWKS_CLIENT = jwt.PyJWKClient(jwks_uri, cache_jwk_set=True, lifespan=3600)
    return _JWKS_CLIENT


def validate_cav4_id_token(id_token: str) -> dict[str, Any]:
    """Valida id_token CAv4 (assinatura, issuer, audience e expiracao)."""
    cfg = get_oidc_config()
    issuer = cfg.get("issuer")
    if not issuer:
        raise HTTPException(status_code=500, detail="OIDC sem issuer")

    client_id = _require_env("CA_CLIENT_ID", settings.ca_client_id)

    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(id_token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Falha ao obter chave JWKS: {exc}")

    try:
        return jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=client_id,
            issuer=issuer,
            leeway=settings.ca_jwt_leeway_seconds,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="id_token CAv4 expirado")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="id_token CAv4 com audience invalida")
    except jwt.InvalidIssuerError:
        raise HTTPException(status_code=401, detail="id_token CAv4 com issuer invalido")
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"id_token CAv4 invalido: {exc}")


def extract_user_login(claims: dict[str, Any]) -> str | None:
    """Extrai matricula/login do usuario a partir das claims conhecidas do CAv4."""
    for key in ("user_login", "login", "samaccountname", "onpremisesamaccountname"):
        value = claims.get(key)
        if value:
            return str(value)

    for key in ("preferred_username", "upn", "email", "sub"):
        value = claims.get(key)
        if value:
            return str(value).split("@")[0]

    return None


def _normalize_role_name(value: Any) -> str:
    """Normaliza nome de role para comparação estável (case/acento/espaço)."""
    text = str(value or "").strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return " ".join(text.split())


def _extract_role_names(raw_roles: Any) -> list[str]:
    """Extrai nomes de roles do payload CAv4, preservando o case original."""
    if not raw_roles:
        return []

    # Payload comum: {"value": [...]} ou {"roles": [...]} ou {"items": [...]}.
    # CAv4 pode responder em formato paginado com {"content": [...]}.
    if isinstance(raw_roles, dict):
        for key in ("value", "roles", "items", "data", "content"):
            nested = raw_roles.get(key)
            if nested is not None:
                return _extract_role_names(nested)

    if isinstance(raw_roles, list):
        result: list[str] = []
        for item in raw_roles:
            if isinstance(item, dict):
                name = (
                    item.get("code")
                    or item.get("name")
                    or item.get("nome")
                    or item.get("role")
                    or item.get("description")
                    or item.get("descricao")
                    or item.get("id")
                )
                if name:
                    result.append(str(name).strip())
            else:
                result.append(str(item).strip())
        return [r for r in result if r]

    return [str(raw_roles).strip()]


def get_cav4_roles(login: str, access_token: str) -> list[str]:
    """Consulta roles corporativos do usuario no CAv4 Admin API."""
    base_url = _require_env("CA_API_BASE_URL", settings.ca_api_base_url).rstrip("/")
    encoded_login = quote(login, safe="")
    url = f"{base_url}/api/admin/users/{encoded_login}/roles"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }

    with httpx.Client(timeout=15.0, verify=_get_ssl_verify()) as client:
        resp = client.get(url, headers=headers)

    if resp.status_code == 404:
        return []

    if resp.status_code >= 400:
        raise HTTPException(
            status_code=403 if resp.status_code in (401, 403) else 502,
            detail=f"Falha ao consultar roles no CAv4: {resp.status_code}",
        )
        
    import logging

    logging.getLogger(__name__).info(
        "CAV4_ROLES_RAW: %s",
        resp.json()
    )

    roles = _extract_role_names(resp.json())

    logging.getLogger(__name__).info(
        "CAV4_ROLES_EXTRAIDAS: %s",
        roles
    )

    return roles

    return _extract_role_names(resp.json())


def get_cav4_user_details(login: str, access_token: str) -> dict[str, Any]:
    """
    Consulta dados cadastrais do usuário na CAv4 Admin API.
    Endpoint: GET /api/admin/users/{login}

    Retorna dict padronizado compatível com graph_info em sync_user_from_access():
      {
        "email":        str | None,   — e-mail corporativo do usuário
        "job_title":    str | None,   — cargo/função
        "department":   str | None,   — lotação / departamento
        "employee_id":  str | None,   — matrícula (fallback se não vier do token)
        "manager_login": str | None,  — matrícula do gestor (para busca no banco)
        "manager_email": str | None,  — e-mail do gestor (para vinculação)
        "manager_name":  str | None,  — nome do gestor
      }

    Em caso de falha (404, timeout, CA indisponível), retorna dict com valores None
    sem lançar exceção — o login continua funcionando sem esses dados.
    """
    empty: dict[str, Any] = {
        "email": None,
        "job_title": None,
        "department": None,
        "employee_id": None,
        "manager_login": None,
        "manager_email": None,
        "manager_name": None,
    }

    base_url = settings.ca_api_base_url
    if not base_url:
        return empty

    base_url = base_url.rstrip("/")
    encoded_login = quote(login, safe="")
    url = f"{base_url}/api/admin/users/{encoded_login}"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }

    try:
        with httpx.Client(timeout=15.0, verify=_get_ssl_verify()) as client:
            resp = client.get(url, headers=headers)

        if resp.status_code == 404:
            return empty

        if resp.status_code >= 400:
            import logging as _logging
            _logging.getLogger(__name__).warning(
                "get_cav4_user_details: HTTP %s para login=%s", resp.status_code, login
            )
            return empty

        data = resp.json()

    except Exception as exc:
        import logging as _logging
        _logging.getLogger(__name__).warning(
            "get_cav4_user_details: excecao para login=%s: %s", login, exc
        )
        return empty

    # Extrai e-mail — CAv4 pode retornar em campos variados
    for key in ("email", "mail", "userPrincipalName", "upn"):
        value = data.get(key)
        if value and "@" in str(value):
            empty["email"] = str(value).lower()
            break

    # Helper: extrai string legível de um valor que pode ser str, int ou dict aninhado.
    # O CAv4 retorna objetos como {'uid': 60075563, 'code': 60075563, 'acronym': 'TIC/CORP/...'}
    # para campos como lotação, cargo e gestor.
    def _str_val(v: Any, preferred_keys: tuple = ("name", "nome", "acronym", "description", "descricao", "value")) -> str | None:
        if v is None:
            return None
        if isinstance(v, (str, int, float)):
            s = str(v).strip()
            return s if s else None
        if isinstance(v, dict):
            # Tenta extrair string preferida do objeto aninhado
            for k in preferred_keys:
                candidate = v.get(k)
                if candidate and str(candidate).strip():
                    return str(candidate).strip()
            # Fallback: primeiro valor string não-vazio do dict
            for candidate in v.values():
                if isinstance(candidate, str) and candidate.strip():
                    return candidate.strip()
        return None

    # Cargo e lotação — podem vir como objetos aninhados
    empty["job_title"] = (
        _str_val(data.get("cargo"))
        or _str_val(data.get("jobTitle"))
        or _str_val(data.get("funcao"))
    )
    empty["department"] = (
        _str_val(data.get("lotacao"), preferred_keys=("acronym", "name", "nome", "description"))
        or _str_val(data.get("department"))
        or _str_val(data.get("departamento"))
        or _str_val(data.get("orgao"))
    )

    # Matrícula
    empty["employee_id"] = (
        _str_val(data.get("matricula"))
        or _str_val(data.get("employeeId"))
        or _str_val(data.get("login"))
        or login
    )

    # Gestor — o CAv4 retorna um objeto com login/matrícula/nome ou apenas string de matrícula
    gestor_raw = data.get("gerente") or data.get("manager") or data.get("gestorImediato") or {}
    if isinstance(gestor_raw, dict):
        empty["manager_login"] = _str_val(gestor_raw.get("login") or gestor_raw.get("matricula"))
        empty["manager_name"] = (
            _str_val(gestor_raw.get("nome"))
            or _str_val(gestor_raw.get("name"))
            or _str_val(gestor_raw.get("displayName"))
        )
        for key in ("email", "mail"):
            value = gestor_raw.get(key)
            if value and "@" in str(value):
                empty["manager_email"] = str(value).lower()
                break
    elif isinstance(gestor_raw, str) and gestor_raw.strip():
        empty["manager_login"] = gestor_raw.strip()

    return empty


def resolve_access_from_cav4_roles(roles: list[str]) -> dict[str, Any]:
    """Mapeia roles CAv4 para perfil interno da aplicacao."""
    import logging

    logging.getLogger(__name__).info(
        "RESOLVE_ACCESS_ROLES: %s",
        roles
    )

    role_set = set(_normalize_role_name(r) for r in roles)

    # ── 1. Mapeamento direto por código CAV4 (prioridade máxima) ─────────────
    priority_order = ["auditor", "supervisor", "internal"]
    for target_role in priority_order:
        for normalized in role_set:
            if _CAV4_CODE_TO_ROLE.get(normalized) == target_role:       
                is_admin     = target_role in ("auditor", "admin")
                is_supervisor = target_role == "supervisor"
                # tirar depois
                logging.getLogger(__name__).info(
                    "ROLE_RESOLVIDA: %s",
                    target_role
                )
                
                
                frontend_role = target_role

                if target_role == "auditor":
                    frontend_role = "admin"

                return {                    
                    "authorized": True,
                    "role": frontend_role,
                    "cav4_role": target_role,
                    "is_admin": is_admin,
                    "is_supervisor": is_supervisor,
                    "source": "cav4_direct_code",
                }

    # ── 2. Fallback: comparação por settings (comportamento original) ─────────
    admin_names      = set(_normalize_role_name(r) for r in settings.cav4_admin_role_names)
    supervisor_names = set(_normalize_role_name(r) for r in settings.cav4_supervisor_role_names)
    internal_names   = set(_normalize_role_name(r) for r in settings.cav4_internal_role_names)

    if role_set & admin_names:
        logging.getLogger(__name__).info(
            "ROLE_RESOLVIDA: %s",
            target_role
        )
        return {"authorized": True, "role": "admin",
                "is_admin": True, "is_supervisor": False, "source": "cav4_roles"}
    if role_set & supervisor_names:
        logging.getLogger(__name__).info(
            "ROLE_RESOLVIDA: %s",
            target_role
        )
        return {"authorized": True, "role": "supervisor",
                "is_admin": False, "is_supervisor": True, "source": "cav4_roles"}
    if role_set & internal_names:
        logging.getLogger(__name__).info(
            "ROLE_RESOLVIDA: %s",
            target_role
        )
        return {"authorized": True, "role": "internal",
                "is_admin": False, "is_supervisor": False, "source": "cav4_roles"}
        logging.getLogger(__name__).info(
            "ROLE_RESOLVIDA: %s",
            target_role
        )
    return {"authorized": False, "role": None,
            "is_admin": False, "is_supervisor": False, "source": "cav4_roles"}


def add_role_to_user(login: str, role_code: str, access_token: str) -> bool:
    """
    Adiciona um papel (role) ao usuário no CAv4 Admin API.
    
    POST /api/admin/users/{userLogin}/roles/{roleCode}
    
    Args:
        login: matrícula/login do usuário (onPremisesSamAccountName)
        role_code: código do papel (ex: "CD_PAPEL_SUPERVISOR")
        access_token: token de acesso CAv4 com permissões de admin
    
    Returns:
        True se papel foi atribuído com sucesso, False caso já existisse
        Lança HTTPException em caso de erro de autenticação/autorização
    """
    import logging as _logging
    _log = _logging.getLogger(__name__)
    
    if not login or not role_code:
        _log.warning("add_role_to_user: login ou role_code vazios")
        return False
    
    base_url = settings.ca_api_base_url
    if not base_url:
        _log.warning("add_role_to_user: CA_API_BASE_URL nao configurada")
        return False
    
    base_url = base_url.rstrip("/")
    encoded_login = quote(login, safe="")
    encoded_role = quote(role_code, safe="")
    url = f"{base_url}/api/admin/users/{encoded_login}/roles/{encoded_role}"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    
    try:
        with httpx.Client(timeout=15.0, verify=_get_ssl_verify()) as client:
            # Endpoint não exige body; enviar {} pode causar 422 em alguns gateways.
            resp = client.post(url, headers=headers)
        
        if resp.status_code in (200, 201, 204):
            _log.info(
                "add_role_to_user: papel %s atribuido ao usuario %s com sucesso",
                role_code, login
            )
            return True
        
        if resp.status_code == 409:
            # Conflito — papel já atribuído
            _log.info(
                "add_role_to_user: papel %s ja atribuido ao usuario %s",
                role_code, login
            )
            return False
        
        if resp.status_code == 404:
            _log.error(
                "add_role_to_user: usuario %s ou papel %s nao encontrado no CAv4",
                login, role_code
            )
            raise HTTPException(
                status_code=404,
                detail=f"Usuário ou papel não encontrado no CAv4: {login}/{role_code}"
            )
        
        if resp.status_code in (401, 403):
            _log.error(
                "add_role_to_user: acesso negado ao atribuir papel %s ao usuario %s (HTTP %s)",
                role_code, login, resp.status_code
            )
            raise HTTPException(
                status_code=403,
                detail=f"Sem permissão para atribuir papéis no CAv4"
            )
        
        _log.error(
            "add_role_to_user: falha HTTP %s ao atribuir papel %s ao usuario %s (response=%s)",
            resp.status_code, role_code, login, resp.text[:300]
        )
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Falha ao atribuir papel no CAv4: {resp.status_code}"
        )
    
    except HTTPException:
        raise
    except httpx.TimeoutException:
        _log.error("add_role_to_user: timeout ao conectar ao CAv4 (login=%s, role=%s)", login, role_code)
        raise HTTPException(
            status_code=502,
            detail="Timeout ao conectar ao CAv4"
        )
    except httpx.RequestError as exc:
        _log.error("add_role_to_user: erro de conexao com CAv4: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Erro ao conectar ao CAv4: {exc}"
        )
    except Exception as exc:
        _log.error("add_role_to_user: excecao nao esperada: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Erro inesperado ao atribuir papel no CAv4"
        )


def add_role_to_user_with_fallback(login: str, role_code: str, user_access_token: str) -> tuple[bool, str]:
    """Tenta atribuir papel com token do usuário e fallback para token técnico.

    Retorna:
      (True, "user_token") quando sucesso com token do usuário
        (True, "user_token_already_assigned") quando papel já estava atribuído
      (True, "service_token") quando sucesso via fallback técnico
        (True, "service_token_already_assigned") quando papel já estava atribuído no fallback
      (False, motivo) quando não foi possível atribuir
    """
    try:
          assigned = add_role_to_user(login=login, role_code=role_code, access_token=user_access_token)
          return True, "user_token" if assigned else "user_token_already_assigned"
    except HTTPException as exc:
          # 422 também pode ser contexto/perfil do token do usuário (área/escopo),
          # então tentamos token técnico antes de desistir.
          if exc.status_code not in (401, 403, 422):
            return False, f"user_token_http_{exc.status_code}"
    except Exception:
        return False, "user_token_exception"

    service_token = get_client_credentials_token()
    if not service_token:
        return False, "service_token_unavailable"

    try:
        assigned = add_role_to_user(login=login, role_code=role_code, access_token=service_token)
        return True, "service_token" if assigned else "service_token_already_assigned"
    except HTTPException as exc:
        return False, f"service_token_http_{exc.status_code}"
    except Exception:
        return False, "service_token_exception"


def remove_role_from_user(login: str, role_code: str, access_token: str) -> bool:
    """
    Remove um papel (role) do usuário no CAv4 Admin API.
    
    DELETE /api/admin/users/{userLogin}/roles/{roleCode}
    
    Args:
        login: matrícula/login do usuário (onPremicesSamAccountName)
        role_code: código do papel (ex: "CD_PAPEL_SUPERVISOR")
        access_token: token de acesso CAv4 com permissões de admin
    
    Returns:
        True se papel foi removido com sucesso, False caso não existisse
        Lança HTTPException em caso de erro de autenticação/autorização
    """
    import logging as _logging
    _log = _logging.getLogger(__name__)
    
    if not login or not role_code:
        _log.warning("remove_role_from_user: login ou role_code vazios")
        return False
    
    base_url = settings.ca_api_base_url
    if not base_url:
        _log.warning("remove_role_from_user: CA_API_BASE_URL nao configurada")
        return False
    
    base_url = base_url.rstrip("/")
    encoded_login = quote(login, safe="")
    encoded_role = quote(role_code, safe="")
    url = f"{base_url}/api/admin/users/{encoded_login}/roles/{encoded_role}"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    
    try:
        with httpx.Client(timeout=15.0, verify=_get_ssl_verify()) as client:
            resp = client.delete(url, headers=headers)
        
        if resp.status_code in (200, 201, 204):
            _log.info(
                "remove_role_from_user: papel %s removido do usuario %s com sucesso",
                role_code, login
            )
            return True
        
        if resp.status_code == 404:
            # Papel ou usuário não encontrado (pode significar papel não atribuído)
            _log.info(
                "remove_role_from_user: usuario %s ou papel %s nao encontrado no CAv4",
                login, role_code
            )
            return False
        
        if resp.status_code in (401, 403):
            _log.error(
                "remove_role_from_user: acesso negado ao remover papel %s do usuario %s (HTTP %s)",
                role_code, login, resp.status_code
            )
            raise HTTPException(
                status_code=403,
                detail=f"Sem permissão para remover papéis no CAv4"
            )
        
        _log.error(
            "remove_role_from_user: falha HTTP %s ao remover papel %s do usuario %s",
            resp.status_code, role_code, login
        )
        raise HTTPException(
            status_code=502,
            detail=f"Falha ao remover papel no CAv4: {resp.status_code}"
        )
    
    except HTTPException:
        raise
    except httpx.TimeoutException:
        _log.error("remove_role_from_user: timeout ao conectar ao CAv4 (login=%s, role=%s)", login, role_code)
        raise HTTPException(
            status_code=502,
            detail="Timeout ao conectar ao CAv4"
        )
    except httpx.RequestError as exc:
        _log.error("remove_role_from_user: erro de conexao com CAv4: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Erro ao conectar ao CAv4: {exc}"
        )
    except Exception as exc:
        _log.error("remove_role_from_user: excecao nao esperada: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Erro inesperado ao remover papel no CAv4"
        )


def remove_role_from_user_with_fallback(login: str, role_code: str, user_access_token: str | None = None) -> tuple[bool, str]:
    """Tenta remover papel com token do usuário e fallback para token técnico.

    Retorna:
      (True, "user_token") quando remoção efetiva com token do usuário
      (True, "user_token_not_found") quando já não havia papel no usuário
      (True, "service_token") quando remoção efetiva via fallback técnico
      (True, "service_token_not_found") quando já não havia papel no fallback
      (False, motivo) quando não foi possível remover
    """
    if user_access_token:
        try:
            removed = remove_role_from_user(login=login, role_code=role_code, access_token=user_access_token)
            return True, "user_token" if removed else "user_token_not_found"
        except HTTPException as exc:
            if exc.status_code not in (401, 403, 422):
                return False, f"user_token_http_{exc.status_code}"
        except Exception:
            return False, "user_token_exception"

    service_token = get_client_credentials_token()
    if not service_token:
        return False, "service_token_unavailable"

    try:
        removed = remove_role_from_user(login=login, role_code=role_code, access_token=service_token)
        return True, "service_token" if removed else "service_token_not_found"
    except HTTPException as exc:
        return False, f"service_token_http_{exc.status_code}"
    except Exception:
        return False, "service_token_exception"
