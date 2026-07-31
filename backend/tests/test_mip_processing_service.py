from __future__ import annotations

import pytest

from app.services import mip_processing_service as svc


def test_returns_disabled_when_feature_flag_off(monkeypatch):
    monkeypatch.setattr(svc.settings, "mip_processing_enabled", False)

    result = svc.process_upload_file(filename="arquivo.docx", content_bytes=b"abc")

    assert result.status == "disabled"
    assert result.content_bytes == b"abc"


def test_fail_closed_for_unsupported_extension(monkeypatch):
    monkeypatch.setattr(svc.settings, "mip_processing_enabled", True)
    monkeypatch.setattr(svc.settings, "mip_fail_closed", True)

    with pytest.raises(svc.MipProcessingPolicyError) as exc:
        svc.process_upload_file(filename="arquivo.exe", content_bytes=b"abc")

    assert exc.value.error_code == "MIP_UNSUPPORTED_EXTENSION"


def test_nao_criptografado_retorna_processado(monkeypatch):
    """Arquivo sem RMS (Interno/Público): worker retorna original → status processed."""
    monkeypatch.setattr(svc.settings, "mip_processing_enabled", True)
    monkeypatch.setattr(svc.settings, "mip_fail_closed", True)
    monkeypatch.setattr(svc.settings, "mip_sdk_base_url", "https://mip-worker.local")
    monkeypatch.setattr(svc.settings, "mip_sdk_api_token", "tok")
    monkeypatch.setattr(svc.settings, "mip_sdk_verify_tls", False)
    monkeypatch.setattr(svc.settings, "mip_processing_timeout_seconds", 30)

    class FakeAdapter:
        def __init__(self, **kw): pass
        def remove_label_and_protection(self, *, content_bytes, filename):
            # Worker detecta sem RMS e devolve original
            return content_bytes

    monkeypatch.setattr(svc, "MipSdkAdapter", FakeAdapter)
    result = svc.process_upload_file(filename="interno.docx", content_bytes=b"original")
    assert result.status == "processed"
    assert result.content_bytes == b"original"


def test_not_configured_bypass_when_sdk_url_missing(monkeypatch):
    monkeypatch.setattr(svc.settings, "mip_processing_enabled", True)
    monkeypatch.setattr(svc.settings, "mip_fail_closed", False)
    monkeypatch.setattr(svc.settings, "mip_sdk_base_url", None)
    result = svc.process_upload_file(filename="arquivo.docx", content_bytes=b"abc")
    assert result.status == "not_configured_bypass"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _adapter_settings(monkeypatch):
    monkeypatch.setattr(svc.settings, "mip_processing_enabled", True)
    monkeypatch.setattr(svc.settings, "mip_fail_closed", True)
    monkeypatch.setattr(svc.settings, "mip_sdk_base_url", "https://mip-worker.local")
    monkeypatch.setattr(svc.settings, "mip_sdk_api_token", "tok")
    monkeypatch.setattr(svc.settings, "mip_sdk_verify_tls", False)
    monkeypatch.setattr(svc.settings, "mip_processing_timeout_seconds", 30)


# ---------------------------------------------------------------------------
# Arquivo Confidencial com RMS
# ---------------------------------------------------------------------------

def test_sem_token_levanta_mip_encrypted_no_rights(monkeypatch):
    """Arquivo RMS, sem token → frontend abre MipAuthModal."""
    _adapter_settings(monkeypatch)

    class FakeAdapter:
        def __init__(self, **kw): pass
        def remove_label_and_protection(self, *, content_bytes, filename):
            raise svc.MipSdkAdapterError("criptografado", error_code="MIP_ENCRYPTED_NO_RIGHTS")

    monkeypatch.setattr(svc, "MipSdkAdapter", FakeAdapter)
    with pytest.raises(svc.MipProcessingPolicyError) as exc_info:
        svc.process_upload_file(filename="confidencial.docx", content_bytes=b"enc")
    assert exc_info.value.error_code == "MIP_ENCRYPTED_NO_RIGHTS"
    assert "autorizar" in str(exc_info.value).lower()


def test_popup_com_policy_token_usa_change_label(monkeypatch):
    """
    Popup: aadrm_token + policy_token → change-label-as-user.
    Remove RMS + aplica rótulo Público Externo. Fluxo completo.
    """
    _adapter_settings(monkeypatch)

    class FakeAdapter:
        def __init__(self, **kw): pass
        def remove_label_and_protection(self, *, content_bytes, filename):
            raise svc.MipSdkAdapterError("criptografado", error_code="MIP_ENCRYPTED_NO_RIGHTS")
        def change_label_with_user_token(self, *, content_bytes, filename, aadrm_token, policy_token):
            assert aadrm_token == "tok_aadrm"
            assert policy_token == "tok_policy"
            return b"rotulado_publico_externo"
        def remove_label_with_user_token(self, **kw):
            raise AssertionError("remove_label não deve ser chamado quando policy_token está presente")

    monkeypatch.setattr(svc, "MipSdkAdapter", FakeAdapter)
    result = svc.process_upload_file(
        filename="confidencial.docx",
        content_bytes=b"enc",
        aadrm_token="tok_aadrm",
        mip_policy_token="tok_policy",
    )
    assert result.status == "processed_as_user"
    assert result.content_bytes == b"rotulado_publico_externo"


def test_device_code_sem_policy_token_remove_rms_apenas(monkeypatch):
    """
    Device code: só aadrm_token, sem policy_token → remove-label-as-user.
    Remove RMS. Rótulo Público Externo não é aplicado (limitação do device_code).
    """
    _adapter_settings(monkeypatch)

    class FakeAdapter:
        def __init__(self, **kw): pass
        def remove_label_and_protection(self, *, content_bytes, filename):
            raise svc.MipSdkAdapterError("criptografado", error_code="MIP_ENCRYPTED_NO_RIGHTS")
        def remove_label_with_user_token(self, *, content_bytes, filename, aadrm_token):
            assert aadrm_token == "tok_aadrm"
            return b"sem_rms"

    monkeypatch.setattr(svc, "MipSdkAdapter", FakeAdapter)
    result = svc.process_upload_file(
        filename="confidencial.docx",
        content_bytes=b"enc",
        aadrm_token="tok_aadrm",
    )
    assert result.status == "processed_as_user"
    assert result.content_bytes == b"sem_rms"


def test_change_label_falha_generico_faz_fallback_para_remove_label(monkeypatch):
    """
    change-label falha com erro genérico → fallback para remove-label-as-user.
    """
    _adapter_settings(monkeypatch)

    class FakeAdapter:
        def __init__(self, **kw): pass
        def remove_label_and_protection(self, *, content_bytes, filename):
            raise svc.MipSdkAdapterError("criptografado", error_code="MIP_ENCRYPTED_NO_RIGHTS")
        def change_label_with_user_token(self, **kw):
            raise svc.MipSdkAdapterError("timeout", error_code="MIP_SDK_ERROR")
        def remove_label_with_user_token(self, *, content_bytes, filename, aadrm_token):
            return b"fallback_sem_rms"

    monkeypatch.setattr(svc, "MipSdkAdapter", FakeAdapter)
    result = svc.process_upload_file(
        filename="confidencial.docx",
        content_bytes=b"enc",
        aadrm_token="tok_aadrm",
        mip_policy_token="tok_policy",
    )
    assert result.status == "processed_as_user"
    assert result.content_bytes == b"fallback_sem_rms"


def test_change_label_falha_user_no_rights_nao_faz_fallback(monkeypatch):
    """
    change-label falha com MIP_USER_NO_RIGHTS → propaga imediatamente (não faz fallback).
    """
    _adapter_settings(monkeypatch)

    class FakeAdapter:
        def __init__(self, **kw): pass
        def remove_label_and_protection(self, *, content_bytes, filename):
            raise svc.MipSdkAdapterError("criptografado", error_code="MIP_ENCRYPTED_NO_RIGHTS")
        def change_label_with_user_token(self, **kw):
            raise svc.MipSdkAdapterError("sem direitos", error_code="MIP_USER_NO_RIGHTS")

    monkeypatch.setattr(svc, "MipSdkAdapter", FakeAdapter)
    with pytest.raises(svc.MipProcessingPolicyError) as exc_info:
        svc.process_upload_file(
            filename="confidencial.docx",
            content_bytes=b"enc",
            aadrm_token="tok_aadrm",
            mip_policy_token="tok_policy",
        )
    assert exc_info.value.error_code == "MIP_USER_NO_RIGHTS"


def test_remove_label_as_user_falha_levanta_policy_error(monkeypatch):
    """remove-label-as-user falha (usuário não é owner) → MIP_USER_NO_RIGHTS."""
    _adapter_settings(monkeypatch)

    class FakeAdapter:
        def __init__(self, **kw): pass
        def remove_label_and_protection(self, *, content_bytes, filename):
            raise svc.MipSdkAdapterError("criptografado", error_code="MIP_ENCRYPTED_NO_RIGHTS")
        def remove_label_with_user_token(self, *, content_bytes, filename, aadrm_token):
            raise svc.MipSdkAdapterError("nao e owner", error_code="MIP_USER_NO_RIGHTS")

    monkeypatch.setattr(svc, "MipSdkAdapter", FakeAdapter)
    with pytest.raises(svc.MipProcessingPolicyError) as exc_info:
        svc.process_upload_file(
            filename="confidencial.docx",
            content_bytes=b"enc",
            aadrm_token="tok_aadrm",
        )
    assert exc_info.value.error_code == "MIP_USER_NO_RIGHTS"
    assert "propriet" in str(exc_info.value).lower()
