"""
graph_service.py – Enriquecimento de perfil organizacional via Microsoft Graph API.

Responsabilidade: buscar cargo, departamento, gestor e foto do usuário
após autenticação CAv4, para enriquecer o registro local (User).

Ponto de entrada: enrich_graph_profile_by_upn(upn, employee_id)
  Chamado em routes_cav4_auth._complete_cav4_exchange() após resolução dos roles.

Lookup para usuários Petrobras:
  A matrícula do CAv4 (ex: "GCTL") corresponde ao onPremisesSamAccountName do AD.
  O lookup por onPremisesSamAccountName é a estratégia confiável e testada.

Configuração necessária (opcionais — fallback gracioso se ausentes):
  ENTRA_TENANT_ID, ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET

Permissões no App Registration (Application, Admin Consent obrigatório):
  - User.Read.All → perfil + gestor + foto
"""

from __future__ import annotations

import base64
import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_GRAPH_BASE = "https://graph.microsoft.com/v1.0"
_TOKEN_URL_TEMPLATE = "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
_GRAPH_SCOPE = "https://graph.microsoft.com/.default"

# Cache em memória para o token de app.
# Invalidado automaticamente em caso de 401 (token expirado).
_token_cache: dict[str, str] = {}


def _is_graph_configured() -> bool:
    """Verifica se as credenciais necessárias estão presentes."""
    return bool(
        settings.entra_tenant_id
        and settings.entra_client_id
        and settings.entra_client_secret
    )


def _get_app_token() -> str | None:
    """
    Obtém token de app via client credentials.
    Retorna None sem lançar exceção se as credenciais estiverem ausentes ou a chamada falhar.
    """
    if not _is_graph_configured():
        return None

    cached = _token_cache.get("app_token")
    if cached:
        return cached

    return _fetch_token(
        settings.entra_tenant_id,
        settings.entra_client_id,
        settings.entra_client_secret,
        cache_key="app_token",
    )


def _fetch_token(tenant_id: str, client_id: str | None, client_secret: str | None, cache_key: str) -> str | None:
    """Obtém token OAuth2 via client credentials e armazena no cache."""
    if not client_id or not client_secret:
        return None
    token_url = _TOKEN_URL_TEMPLATE.format(tenant_id=tenant_id)
    try:
        with httpx.Client(timeout=15.0) as c:
            resp = c.post(token_url, data={
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
                "scope": _GRAPH_SCOPE,
            })
            resp.raise_for_status()
            token = resp.json().get("access_token")
            if token:
                _token_cache[cache_key] = token
            return token
    except Exception as exc:
        logger.warning("graph_service: falha ao obter token: %s", exc)
        return None


def _invalidate_token_cache() -> None:
    """Limpa o cache de token. Chamado automaticamente em caso de 401."""
    _token_cache.pop("app_token", None)


def _get_user(token: str, path: str, eventual: bool = False) -> dict[str, Any] | None:
    """
    Executa GET no Graph. Trata objeto único e lista paginada.
    eventual=True adiciona ConsistencyLevel: eventual (necessário para alguns $filter).
    """
    headers: dict[str, str] = {"Authorization": f"Bearer {token}"}
    if eventual:
        headers["ConsistencyLevel"] = "eventual"
    try:
        with httpx.Client(timeout=10.0) as c:
            r = c.get(f"{_GRAPH_BASE}{path}", headers=headers)
        if r.status_code == 401:
            logger.warning("graph_service: HTTP 401 em %s; invalidando cache de token", path[:100])
            _invalidate_token_cache()
            return None
        if r.status_code != 200:
            if r.status_code not in (404,):
                logger.warning("graph_service: HTTP %s em %s (response=%s)", r.status_code, path[:100], r.text[:200])
            return None
        data = r.json()
        if "value" in data:
            return data["value"][0] if data["value"] else None
        # Alguns endpoints (ex.: /manager) podem retornar objeto válido sem id.
        if isinstance(data, dict) and data:
            return data
        return None
    except Exception as exc:
        logger.warning("graph_service: excecao em %s: %s", path[:100], exc)
        return None


def _get_bytes(token: str, path: str) -> bytes | None:
    """Executa GET binário no Graph (foto de perfil)."""
    try:
        with httpx.Client(timeout=10.0) as c:
            r = c.get(
                f"{_GRAPH_BASE}{path}",
                headers={"Authorization": f"Bearer {token}", "Accept": "image/*"},
            )
        return r.content if r.status_code == 200 else None
    except Exception as exc:
        logger.warning("graph_service: excecao bytes em %s: %s", path[:80], exc)
        return None


def enrich_graph_profile_by_upn(upn: str, employee_id: str | None = None) -> dict[str, Any]:
    """
    Busca cargo, departamento, gestor e foto do usuário no Microsoft Graph.

    Parâmetros:
      upn         — email corporativo (ex: jefferson.breno.prestserv@petrobras.com.br)
      employee_id — matrícula CAv4 (ex: GCTL) = onPremisesSamAccountName no Entra

    Estratégia de lookup (para em quem encontrar primeiro):
      1. UPN direto pelo email
      2. $filter mail eq email
      3. $filter onPremisesSamAccountName eq employee_id  ← estratégia principal Petrobras
      4. $filter startsWith(userPrincipalName, employee_id)  ← fallback

    Retorna dict compatível com sync_user_from_access():
      {job_title, department, employee_id, manager_email, manager_name, photo_url}

    Nunca lança exceção — retorna dict com valores None em caso de falha.
    O login CAv4 continua funcionando mesmo sem dados de perfil.
    """
    result: dict[str, Any] = {
        "job_title": None,
        "department": None,
        "employee_id": None,  # matrícula CAv4 (onPremicesSamAccountName)
        "login_cav4": None,
        "manager_email": None,
        "manager_name": None,
        "manager_employee_id": None,  # matrícula do gestor (para chamar CAv4)
        "photo_url": None,
    }

    if not _is_graph_configured():
        logger.info("graph_service: ENTRA_* não configurado; enriquecimento desativado")
        return result

    token = _get_app_token()
    if not token:
        logger.warning("graph_service: falha ao obter token para enriquecer perfil")
        return result

    SEL = "id,displayName,mail,userPrincipalName,jobTitle,department,employeeId,onPremisesSamAccountName"
    user_obj: dict[str, Any] | None = None

    # 1. UPN direto
    user_obj = _get_user(token, f"/users/{upn}?$select={SEL}")

    # 2. $filter mail
    if not user_obj:
        user_obj = _get_user(token, f"/users?$filter=mail eq '{upn}'&$select={SEL}")

    # 3. onPremisesSamAccountName — lookup principal para usuários Petrobras.
    #    A matrícula do CAv4 (ex: GCTL) é o sAMAccountName sincronizado do AD local.
    #    Requer ConsistencyLevel: eventual.
    if not user_obj and employee_id:
        user_obj = _get_user(
            token,
            f"/users?$filter=onPremisesSamAccountName eq '{employee_id}'&$select={SEL}&$count=true",
            eventual=True,
        )

    # 4. startsWith UPN — fallback de último recurso
    if not user_obj and employee_id:
        user_obj = _get_user(
            token,
            f"/users?$filter=startsWith(userPrincipalName,'{employee_id}')&$select={SEL}&$count=true",
            eventual=True,
        )

    if not user_obj:
        logger.info("graph_service: usuario nao localizado para upn=%s employee_id=%s", upn, employee_id)
        return result

    user_id = user_obj.get("id")
    result["job_title"]   = user_obj.get("jobTitle")
    result["department"]  = user_obj.get("department")
    # Prioridade: onPremicesSamAccountName (matrícula AD) > employeeId > employee_id passado
    login_cav4 = user_obj.get("onPremisesSamAccountName") or user_obj.get("onPremicesSamAccountName")
    result["login_cav4"] = login_cav4
    result["employee_id"] = login_cav4 or user_obj.get("employeeId") or employee_id

    # Gestor
    manager_path = f"/users/{user_id}/manager?$select=id,displayName,mail,onPremisesSamAccountName,employeeId"
    manager = _get_user(token, manager_path)
    if manager:
        result["manager_email"] = manager.get("mail")
        result["manager_name"]  = manager.get("displayName")
        result["manager_employee_id"] = (
            manager.get("onPremisesSamAccountName") or
            manager.get("onPremicesSamAccountName") or
            manager.get("employeeId")
        )

    # Foto
    photo = _get_bytes(token, f"/users/{user_id}/photo/$value")
    if photo:
        result["photo_url"] = f"data:image/jpeg;base64,{base64.b64encode(photo).decode()}"

    return result
