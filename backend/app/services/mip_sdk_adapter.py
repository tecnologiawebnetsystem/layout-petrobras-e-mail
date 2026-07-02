from __future__ import annotations

import base64
from dataclasses import dataclass

import httpx


class MipSdkAdapterError(RuntimeError):
    """Erro tecnico ao integrar com o servico MIP SDK."""


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
            "file": (filename, content_bytes, "application/octet-stream"),
        }

        try:
            with httpx.Client(timeout=self.timeout_seconds, verify=self.verify_tls) as client:
                response = client.post(endpoint, headers=headers, files=files)
        except httpx.HTTPError as exc:
            raise MipSdkAdapterError(f"Falha de rede ao chamar servico MIP SDK: {exc}") from exc

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
