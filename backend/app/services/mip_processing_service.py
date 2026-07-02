from __future__ import annotations

import os
from dataclasses import dataclass

from app.core.config import settings
from app.services.mip_sdk_adapter import MipSdkAdapter, MipSdkAdapterError


class MipProcessingPolicyError(RuntimeError):
    """Erro de política de processamento MIP para upload."""

    def __init__(self, message: str, error_code: str = "MIP_ERROR") -> None:
        super().__init__(message)
        self.error_code = error_code


SUPPORTED_EXTENSIONS = {
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".pdf",
    ".txt",
}

_SUPPORTED_EXTENSIONS_DISPLAY = ", ".join(sorted(SUPPORTED_EXTENSIONS))


@dataclass
class MipProcessingResult:
    filename: str
    content_bytes: bytes
    status: str


def process_upload_file(*, filename: str, content_bytes: bytes) -> MipProcessingResult:
    """
    Processa arquivo para remover rótulos/proteção MIP antes do upload ao S3.
    
    Status possíveis:
    - "disabled": feature flag desativada
    - "processed": sucesso na remoção
    - "unsupported_bypass": extensão não suportada (apenas se fail_closed=False)
    - "not_configured_bypass": serviço MIP SDK não configurado (apenas se fail_closed=False)
    - "error_bypass": falha de execução (apenas se fail_closed=False)
    """
    if not settings.mip_processing_enabled:
        return MipProcessingResult(filename=filename, content_bytes=content_bytes, status="disabled")

    extension = os.path.splitext(filename)[1].lower()
    if extension and extension not in SUPPORTED_EXTENSIONS:
        if settings.mip_fail_closed:
            raise MipProcessingPolicyError(
                f"O arquivo '{filename}' possui extensão '{extension}' que não é compatível com "
                f"o processamento de segurança (MIP). "
                f"Formatos aceitos: {_SUPPORTED_EXTENSIONS_DISPLAY}. "
                f"Se precisar enviar arquivos neste formato, entre em contato com o suporte "
                f"informando o código do erro: MIP_UNSUPPORTED_EXTENSION.",
                error_code="MIP_UNSUPPORTED_EXTENSION",
            )
        return MipProcessingResult(filename=filename, content_bytes=content_bytes, status="unsupported_bypass")

    if not settings.mip_sdk_base_url:
        if settings.mip_fail_closed:
            raise MipProcessingPolicyError(
                "O serviço de processamento de segurança (MIP SDK) não está configurado neste ambiente. "
                "Não é possível processar o arquivo para remoção de rótulos de proteção. "
                "Entre em contato com o suporte informando o código do erro: MIP_NOT_CONFIGURED.",
                error_code="MIP_NOT_CONFIGURED",
            )
        return MipProcessingResult(filename=filename, content_bytes=content_bytes, status="not_configured_bypass")

    adapter = MipSdkAdapter(
        base_url=settings.mip_sdk_base_url,
        timeout_seconds=settings.mip_processing_timeout_seconds,
        api_token=settings.mip_sdk_api_token,
        verify_tls=settings.mip_sdk_verify_tls,
    )

    try:
        processed = adapter.remove_label_and_protection(content_bytes=content_bytes, filename=filename)
        return MipProcessingResult(filename=filename, content_bytes=processed, status="processed")
    except MipSdkAdapterError as exc:
        if settings.mip_fail_closed:
            raise MipProcessingPolicyError(
                f"Falha ao processar o arquivo '{filename}' no serviço de segurança (MIP SDK). "
                "Isso pode ocorrer quando o arquivo possui proteção incompatível ou o serviço está indisponível. "
                "Tente novamente em alguns instantes. Se o problema persistir, acione o suporte "
                "informando o código do erro: MIP_SDK_ERROR.",
                error_code="MIP_SDK_ERROR",
            ) from exc
        return MipProcessingResult(filename=filename, content_bytes=content_bytes, status="error_bypass")
