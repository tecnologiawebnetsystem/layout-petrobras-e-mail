"""
CAV4 Client - integração com FWCA

Responsável por buscar permissões do usuário no CAV4.
"""

import httpx
import ssl
import truststore
from typing import List, Optional

from app.core.config import settings
from app.utils.logger import logger
from app.services.authorization_service import get_allowed_modules


class Cav4ClientError(Exception):
    """Erro de integração com CAV4."""
    pass


class Cav4Client:
    """Cliente para comunicação com API CAV4 (FWCA)."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: float = 10.0,
        ssl_verify: Optional[bool] = None,
    ) -> None:
        self.base_url = base_url or settings.ca_api_base_url
        self.timeout = timeout
        self.ssl_verify = ssl_verify if ssl_verify is not None else settings.ca_ssl_verify

    def get_user_resources(self, token: str, user_login: str) -> List[str]:
        """
        Busca resources (permissões reais) do usuário no CAV4.

        :param token: JWT/Bearer token do usuário.
        :paramrio no CAV4.
        :return: Lista de códigos de resources (ex: ["shares:create", "shares:approve"])
        """

        url = f"{self.base_url}/api/users/{user_login}/resources"

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }

        # SSL corporativo
        if getattr(settings, "ca_ssl_use_truststore", False):
            ssl_context = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
            transport = httpx.HTTPTransport(verify=ssl_context)
        else:
            transport = httpx.HTTPTransport(verify=self.ssl_verify)

        with httpx.Client(
            transport=transport,
            timeout=self.timeout,
        ) as client:
            try:
                response = client.get(url, headers=headers)

                if response.status_code != 200:
                    raise Cav4ClientError(
                        f"Erro ao buscar resources no CAV4: {response.status_code} - {response.text}"
                    )

                data = response.json()
                
                """ logger.debug(
                    "CAV4_RAW_RESPONSE=%s",
                    data
                ) """

                # Tratamento FLEXÍVEL (FWCA varia formato)
                resources = []

                if isinstance(data, list):
                    resources = data

                elif isinstance(data, dict):

                    embedded = data.get("_embedded", {})

                    if "resources" in embedded:
                        resources = embedded["resources"]

                    elif "resources" in data:
                        resources = data["resources"]

                    elif "content" in data:
                        resources = data["content"]

                # Extrair apenas os códigos
                codes = []

                for item in resources:
                    if isinstance(item, dict):
                        code = item.get("code") or item.get("resourceCode")
                        if code:
                            codes.append(code)

                    elif isinstance(item, str):
                        codes.append(item)

                # ✅ Normalização (evita erro de permission)
                normalized_codes = [
                    c.strip().lower()
                    for c in codes
                    if isinstance(c, str) and c.strip()
                ]
                
                resource_codes = [
                    code
                    for code in normalized_codes
                    if ":" not in code
                ]
                permission_codes = [
                    code
                    for code in normalized_codes
                    if ":" in code
                ]

                # ✅ Log observável
                logger.info(
                    "CAV4 resources carregados",
                    user_login=user_login,
                    resources=len(resource_codes),
                    permissions=len(permission_codes),
                    total=len(normalized_codes),
                    sample=resource_codes[:15],  # evita log gigante
                )
                
                permissions_only = [
                    code
                    for code in normalized_codes
                    if ":" in code
                ]

                active_modules = get_allowed_modules(permissions_only)

                logger.info(
                    "CAV4_PERMISSIONS=%s",
                    permissions_only
                )

                logger.info(
                    "MÓDULOS_ATIVOS=%s",
                    active_modules,
                    total=len(active_modules)
                )

                return permissions_only

            except httpx.RequestError as e:
                raise Cav4ClientError(
                    f"Erro de conexão com CAV4: {str(e)}"
                ) from e


# Singleton simples
cav4_client = Cav4Client()