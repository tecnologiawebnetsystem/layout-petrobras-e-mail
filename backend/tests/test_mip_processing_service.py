from __future__ import annotations

import pytest

from app.services import mip_processing_service as svc
import pytest 

def test_returns_disabled_when_feature_flag_off(monkeypatch):
    monkeypatch.setattr(svc.settings, "mip_processing_enabled", False)

    result = svc.process_upload_file(filename="arquivo.docx", content_bytes=b"abc")

    assert result.status == "disabled"
    assert result.content_bytes == b"abc"


def test_fail_closed_for_unsupported_extension(monkeypatch):
    monkeypatch.setattr(svc.settings, "mip_processing_enabled", True)
    monkeypatch.setattr(svc.settings, "mip_fail_closed", True)

    """ try:
        svc.process_upload_file(filename="arquivo.exe", content_bytes=b"abc")
        assert False, "Era esperado MipProcessingPolicyError"
    except svc.MipProcessingPolicyError as exc:
        assert exc.value.error_code == "MIP_UNSUPPORTED_EXTENSION" """
    
    with pytest.raises(svc.MipProcessingPolicyError) as exc:
        svc.process_upload_file(filename="arquivo.exe", content_bytes=b"abc")

    assert exc.value.error_code == "MIP_UNSUPPORTED_EXTENSION"



def test_process_success_with_adapter(monkeypatch):
    monkeypatch.setattr(svc.settings, "mip_processing_enabled", True)
    monkeypatch.setattr(svc.settings, "mip_fail_closed", True)
    monkeypatch.setattr(svc.settings, "mip_sdk_base_url", "https://mip-worker.petrobras.com.br")
    monkeypatch.setattr(svc.settings, "mip_sdk_api_token", "token")
    monkeypatch.setattr(svc.settings, "mip_sdk_verify_tls", True)
    monkeypatch.setattr(svc.settings, "mip_processing_timeout_seconds", 30)

    class FakeAdapter:
        def __init__(
            self,
            base_url: str,
            timeout_seconds: int,
            api_token: str | None,
            verify_tls: bool,
        ):
            self.base_url = base_url
            self.timeout_seconds = timeout_seconds
            self.api_token = api_token
            self.verify_tls = verify_tls

        def remove_label_and_protection(self, *, content_bytes: bytes, filename: str) -> bytes:
            assert filename == "arquivo.docx"
            return b"limpo"

    monkeypatch.setattr(svc, "MipSdkAdapter", FakeAdapter)

    result = svc.process_upload_file(filename="arquivo.docx", content_bytes=b"abc")

    assert result.status == "processed"
    assert result.content_bytes == b"limpo"


def test_not_configured_bypass_when_sdk_url_missing(monkeypatch):
    monkeypatch.setattr(svc.settings, "mip_processing_enabled", True)
    monkeypatch.setattr(svc.settings, "mip_fail_closed", False)
    monkeypatch.setattr(svc.settings, "mip_sdk_base_url", None)

    result = svc.process_upload_file(filename="arquivo.docx", content_bytes=b"abc")

    assert result.status == "not_configured_bypass"
    assert result.content_bytes == b"abc"
