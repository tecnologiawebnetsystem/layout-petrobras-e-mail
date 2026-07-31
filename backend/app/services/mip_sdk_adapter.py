from __future__ import annotations

import base64
import os
from dataclasses import dataclass

import httpx

# Mapeamento extensão → MIME type correto para o multipart/form-data.
# O WAF/ALB da Petrobras valida que o Content-Type bate com a extensão do arquivo.
_MIME_BY_EXT: dict[str, str] = {
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc":  "application/msword",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls":  "application/vnd.ms-excel",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".ppt":  "application/vnd.ms-powerpoint",
    ".pdf":  "application/pdf",
    ".txt":  "text/plain",
}


def _mime_for(filename: str) -> str:
    """Retorna o MIME type correto pela extensão do arquivo."""
    ext = os.path.splitext(filename)[1].lower()
    return _MIME_BY_EXT.get(ext, "application/octet-stream")


class MipSdkAdapterError(RuntimeError):
    """Erro tecnico ao integrar com o servico MIP SDK."""

    def __init__(self, message: str, error_code: str = "MIP_SDK_ERROR") -> None:
        super().__init__(message)
        self.error_code = error_code


@dataclass
class MipSdkAdapter:
    """Adapter para processar MIP via servico HTTP dedicado baseado em SDK."""

    base_url: str
    timeout_seconds: int
    api_token: str | None = None
    verify_tls: bool = True

    def remove_label_and_protection(self, *, content_bytes: bytes, filename: str) -> bytes:
        endpoint = f"{self.base_url.rstrip('/')}/api/v1/mip/remove-label"
        headers: dict[str, str] = {}
        if self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"

        files = {
            "file": (filename, content_bytes, _mime_for(filename)),
        }

        try:
            with httpx.Client(timeout=self.timeout_seconds, verify=self.verify_tls) as client:
                response = client.post(endpoint, headers=headers, files=files)
        except httpx.HTTPError as exc:
            raise MipSdkAdapterError(f"Falha de rede ao chamar servico MIP SDK: {exc}") from exc

        if response.status_code == 422:
            detail = ""
            try:
                payload = response.json()
                detail = payload.get("detail") or payload.get("error") or ""
            except ValueError:
                detail = response.text.strip()
            raise MipSdkAdapterError(
                f"MIP_ENCRYPTED_NO_RIGHTS: {detail}",
                error_code="MIP_ENCRYPTED_NO_RIGHTS",
            )

        if response.status_code >= 400:
            detail = response.text.strip() or f"HTTP {response.status_code}"
            try:
                payload = response.json()
                detail = payload.get("error") or payload.get("detail") or detail
            except ValueError:
                pass
            raise MipSdkAdapterError(
                f"Servico MIP SDK retornou erro ({response.status_code}): {detail}"
            )

        content_type = (response.headers.get("content-type") or "").lower()
        if "application/json" in content_type:
            try:
                payload = response.json()
            except ValueError as exc:
                raise MipSdkAdapterError("Servico MIP SDK retornou JSON invalido.") from exc

            content_b64 = payload.get("content_base64")
            if not content_b64:
                raise MipSdkAdapterError("Servico MIP SDK nao retornou content_base64 no payload.")

            try:
                return base64.b64decode(content_b64)
            except (ValueError, TypeError) as exc:
                raise MipSdkAdapterError("content_base64 retornado pelo servico MIP SDK e invalido.") from exc

        if not response.content:
            raise MipSdkAdapterError("Servico MIP SDK retornou resposta vazia.")

        return response.content

    def remove_label_with_user_token(
        self,
        *,
        content_bytes: bytes,
        filename: str,
        aadrm_token: str,
    ) -> bytes:
        """
        Remove proteção RMS e aplica rótulo Público usando o token AADRM do usuário owner.
        Chama POST /api/v1/mip/remove-label-as-user no worker.
        """
        endpoint = f"{self.base_url.rstrip('/')}/api/v1/mip/remove-label-as-user"
        headers: dict[str, str] = {}
        if self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"

        try:
            with httpx.Client(timeout=self.timeout_seconds, verify=self.verify_tls) as client:
                response = client.post(
                    endpoint,
                    headers=headers,
                    files={"file": (filename, content_bytes, _mime_for(filename))},
                    data={"userAadrmToken": aadrm_token},
                )
        except httpx.HTTPError as exc:
            raise MipSdkAdapterError(
                f"Falha de rede ao chamar servico MIP SDK (user-auth): {exc}"
            ) from exc

        if response.status_code == 422:
            detail = ""
            try:
                payload = response.json()
                detail = payload.get("detail") or payload.get("error") or ""
            except ValueError:
                detail = response.text.strip()
            raise MipSdkAdapterError(
                f"MIP_USER_NO_RIGHTS: {detail}",
                error_code="MIP_USER_NO_RIGHTS",
            )

        if response.status_code >= 400:
            detail = response.text.strip() or f"HTTP {response.status_code}"
            try:
                p = response.json()
                detail = p.get("error") or p.get("detail") or detail
            except ValueError:
                pass
            raise MipSdkAdapterError(
                f"Servico MIP SDK (user-auth) retornou erro ({response.status_code}): {detail}"
            )

        if not response.content:
            raise MipSdkAdapterError("Servico MIP SDK (user-auth) retornou resposta vazia.")

        return response.content

    def change_label_with_user_token(
        self,
        *,
        content_bytes: bytes,
        filename: str,
        aadrm_token: str,
        policy_token: str | None = None,
        target_label_id: str | None = None,
    ) -> bytes:
        """
        Altera o rótulo do arquivo usando o token AADRM + policy token do usuário.
        Usa ProtectionOnlyEngine = false — suporta arquivos com ou sem proteção RMS.
        Chama POST /api/v1/mip/change-label-as-user no worker.
        """
        endpoint = f"{self.base_url.rstrip('/')}/api/v1/mip/change-label-as-user"
        headers: dict[str, str] = {}
        if self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"

        data: dict[str, str] = {"userAadrmToken": aadrm_token}
        if policy_token:
            data["userPolicyToken"] = policy_token
        if target_label_id:
            data["targetLabelImmutableId"] = target_label_id

        try:
            with httpx.Client(timeout=self.timeout_seconds, verify=self.verify_tls) as client:
                response = client.post(
                    endpoint,
                    headers=headers,
                    files={"file": (filename, content_bytes, _mime_for(filename))},
                    data=data,
                )
        except httpx.HTTPError as exc:
            raise MipSdkAdapterError(
                f"Falha de rede ao chamar servico MIP SDK (change-label): {exc}"
            ) from exc

        if response.status_code == 422:
            detail = ""
            try:
                p = response.json()
                error_code = p.get("error", "MIP_LABEL_ERROR")
                detail = p.get("detail") or p.get("error") or ""
            except ValueError:
                error_code = "MIP_LABEL_ERROR"
                detail = response.text.strip()
            raise MipSdkAdapterError(
                f"{error_code}: {detail}",
                error_code=error_code,
            )

        if response.status_code >= 400:
            detail = response.text.strip() or f"HTTP {response.status_code}"
            try:
                p = response.json()
                detail = p.get("error") or p.get("detail") or detail
            except ValueError:
                pass
            raise MipSdkAdapterError(
                f"Servico MIP SDK (change-label) retornou erro ({response.status_code}): {detail}"
            )

        if not response.content:
            raise MipSdkAdapterError("Servico MIP SDK (change-label) retornou resposta vazia.")

        return response.content
