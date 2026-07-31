from __future__ import annotations

import os
import structlog
from dataclasses import dataclass

from app.core.config import settings
from app.services.mip_sdk_adapter import MipSdkAdapter, MipSdkAdapterError

logger = structlog.get_logger(__name__)


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

# Extensões que nunca terão rótulo MIP e são seguras para bypass:
# apenas imagens e mídia — conteúdo inspecionável visualmente, sem container opaco.
BYPASS_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".tiff",
    ".webp",
    ".mp4",
    ".mp3",
    ".csv",
}

# Extensões bloqueadas explicitamente: arquivos compactados podem conter
# documentos com rótulos MIP que não seriam inspecionados nem removidos.
BLOCKED_EXTENSIONS = {
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
    ".bz2",
    ".xz",
    ".z",
}

_SUPPORTED_EXTENSIONS_DISPLAY = ", ".join(sorted(SUPPORTED_EXTENSIONS))
_ALL_ACCEPTED_EXTENSIONS_DISPLAY = ", ".join(sorted(SUPPORTED_EXTENSIONS | BYPASS_EXTENSIONS))


@dataclass
class MipProcessingResult:
    filename: str
    content_bytes: bytes
    status: str


def process_upload_file(
    *,
    filename: str,
    content_bytes: bytes,
    aadrm_token: str | None = None,
    mip_policy_token: str | None = None,
) -> MipProcessingResult:
    """
    Processa arquivo para remoção de proteção RMS e aplicação de rótulo Público Externo
    antes do upload ao S3.

    Fluxo:
    1. Arquivo não criptografado (Interno/Público) → S3 direto, sem alteração.
    2. Arquivo Confidencial com RMS:
       a. SP tenta processar via remove-label → sem SuperUser → 422 MIP_ENCRYPTED_NO_RIGHTS
       b. Frontend abre MipAuthModal → obtém aadrm_token do usuário (+ policy_token se popup)
       c. Com aadrm_token + policy_token (popup) → change-label-as-user:
              remove RMS + aplica rótulo Público Externo → S3
       d. Com aadrm_token apenas (device_code) → remove-label-as-user:
              remove RMS apenas → S3 (sem rótulo Público Externo — limitação do device_code)

    Nota: o supervisor apenas aprova/recusa. Nenhuma alteração de arquivo ocorre após o upload.

    Status possíveis:
    - "disabled"             : feature flag desativada
    - "processed"            : sucesso via SP (arquivo sem RMS ou SP com SuperUser)
    - "processed_as_user"    : sucesso via token do usuário
    - "mip_bypass"           : extensão sem rótulo MIP (imagem, csv, etc.)
    - "unsupported_bypass"   : extensão desconhecida (apenas se fail_closed=False)
    - "not_configured_bypass": serviço MIP SDK não configurado (apenas se fail_closed=False)
    - "error_bypass"         : falha de execução (apenas se fail_closed=False)
    """
    if not settings.mip_processing_enabled:
        return MipProcessingResult(filename=filename, content_bytes=content_bytes, status="disabled")

    extension = os.path.splitext(filename)[1].lower()

    # Arquivos compactados: bloqueados sempre, independente de fail_closed.
    if extension in BLOCKED_EXTENSIONS:
        raise MipProcessingPolicyError(
            f"O arquivo '{filename}' é um arquivo compactado ('{extension}') e não pode ser enviado. "
            "Arquivos compactados podem conter documentos classificados que não conseguimos inspecionar. "
            "Descompacte o conteúdo e envie os arquivos individualmente. "
            "Se precisar de suporte, acione informando o código do erro: MIP_BLOCKED_EXTENSION.",
            error_code="MIP_BLOCKED_EXTENSION",
        )

    # Extensões que nunca têm rótulo MIP: passam direto.
    if extension in BYPASS_EXTENSIONS:
        logger.debug("mip_bypass", filename=filename, extension=extension)
        return MipProcessingResult(filename=filename, content_bytes=content_bytes, status="mip_bypass")

    if extension and extension not in SUPPORTED_EXTENSIONS:
        if settings.mip_fail_closed:
            raise MipProcessingPolicyError(
                f"O arquivo '{filename}' possui extensão '{extension}' que não é suportada pelo sistema. "
                f"Formatos aceitos para documentos Office/PDF: {_SUPPORTED_EXTENSIONS_DISPLAY}. "
                f"Imagens e arquivos compactados ({', '.join(sorted(BYPASS_EXTENSIONS))}) também são aceitos. "
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

    logger.debug(
        "mip_sdk_call_start",
        filename=filename,
        base_url=settings.mip_sdk_base_url,
        verify_tls=settings.mip_sdk_verify_tls,
        timeout=settings.mip_processing_timeout_seconds,
    )

    # ── Passo 1: tenta via SP ──────────────────────────────────────────────────
    # Arquivo não criptografado: worker retorna original intacto.
    # Arquivo Confidencial com RMS: lança 422 MIP_ENCRYPTED_NO_RIGHTS.
    try:
        processed = adapter.remove_label_and_protection(content_bytes=content_bytes, filename=filename)
        logger.info("mip_sdk_call_success", filename=filename, status="processed")
        return MipProcessingResult(filename=filename, content_bytes=processed, status="processed")
    except MipSdkAdapterError as exc:
        # Log detalhado do erro real ANTES de qualquer tratamento de política
        cause = exc.__cause__
        logger.error(
            "mip_sdk_call_error",
            filename=filename,
            error_code=getattr(exc, "error_code", "MIP_SDK_ERROR"),
            adapter_error=str(exc),
            cause_type=type(cause).__name__ if cause else None,
            cause_detail=str(cause) if cause else None,
            base_url=settings.mip_sdk_base_url,
        )

        if getattr(exc, "error_code", None) == "MIP_ENCRYPTED_NO_RIGHTS":
            # Arquivo protegido por RMS sem permissão da SP
            # ── Passo 2: SP sem direitos → arquivo Confidencial criptografado ──
            if aadrm_token:
                if mip_policy_token:
                    # Popup: aadrm_token + policy_token disponíveis.
                    # Aplica rótulo Público Externo + remove RMS em uma única operação.
                    try:
                        processed = adapter.change_label_with_user_token(
                            content_bytes=content_bytes,
                            filename=filename,
                            aadrm_token=aadrm_token,
                            policy_token=mip_policy_token,
                        )
                        logger.info(
                            "mip_sdk_change_label_success",
                            filename=filename,
                            status="processed_as_user",
                        )
                        return MipProcessingResult(
                            filename=filename,
                            content_bytes=processed,
                            status="processed_as_user",
                        )
                    except MipSdkAdapterError as label_exc:
                        error_code = getattr(label_exc, "error_code", "")
                        if error_code in ("MIP_USER_NO_RIGHTS", "MIP_LABEL_NOT_FOUND"):
                            raise MipProcessingPolicyError(
                                str(label_exc), error_code=error_code
                            ) from label_exc
                        # Erro genérico no change-label: fallback para remove-label
                        logger.warning(
                            "mip_change_label_fallback",
                            filename=filename,
                            error=str(label_exc),
                        )

                # device_code ou fallback do change-label: apenas remove RMS.
                # O rótulo Público Externo não é aplicado neste caso (policy_token ausente).
                try:
                    processed = adapter.remove_label_with_user_token(
                        content_bytes=content_bytes,
                        filename=filename,
                        aadrm_token=aadrm_token,
                    )
                    logger.info(
                        "mip_sdk_remove_label_success",
                        filename=filename,
                        status="processed_as_user",
                        note="rms_removed_label_not_changed",
                    )
                    return MipProcessingResult(
                        filename=filename,
                        content_bytes=processed,
                        status="processed_as_user",
                    )
                except MipSdkAdapterError as user_exc:
                    raise MipProcessingPolicyError(
                        f"O arquivo '{filename}' está protegido com criptografia RMS e não foi possível "
                        "removê-la mesmo com sua autenticação. Verifique se você é o proprietário do arquivo "
                        "ou solicite ao proprietário que remova a proteção antes do upload.",
                        error_code=getattr(user_exc, "error_code", "MIP_USER_NO_RIGHTS"),
                    ) from user_exc

            # ── Sem token: frontend precisa autenticar o usuário ───────────────
            raise MipProcessingPolicyError(
                f"O arquivo '{filename}' está protegido com criptografia de confidencialidade (RMS/MIP). "
                "Para enviá-lo, é necessário autorizar o processamento com sua conta Microsoft. "
                "Clique em 'Autorizar processamento seguro' e autentique com sua conta @petrobras.com.br.",
                error_code="MIP_ENCRYPTED_NO_RIGHTS",
            ) from exc

        if settings.mip_fail_closed:
            raise MipProcessingPolicyError(
                f"Falha ao processar o arquivo '{filename}' no serviço de segurança (MIP SDK). "
                "Isso pode ocorrer quando o arquivo possui proteção incompatível ou o serviço está indisponível. "
                "Tente novamente em alguns instantes. Se o problema persistir, acione o suporte "
                "informando o código do erro: MIP_SDK_ERROR.",
                error_code="MIP_SDK_ERROR",
            ) from exc
        return MipProcessingResult(filename=filename, content_bytes=content_bytes, status="error_bypass")
