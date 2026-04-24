"""
Testes de rotas de download — usa FastAPI TestClient com mocks.
Não requer credenciais AWS nem banco de dados real.

Execução:
    pytest tests/test_routes_download.py -v
"""

from __future__ import annotations

from datetime import datetime, UTC

import pytest

from app.deps.external_auth import get_external_access_context
from app.main import app as fastapi_app

TEST_EMAIL = "usuarioexterno@teste.com"
TEST_OTP   = "123456"


# ─────────────────────────────────────────────────────────────────────────────
# Testes de verificação de e-mail (solicitação de OTP)
# ─────────────────────────────────────────────────────────────────────────────

def test_verify_email_response_ok(client, monkeypatch: pytest.MonkeyPatch):
    """POST /download/verify deve retornar 200 com os campos esperados."""
    def mock_issue_otp(*args, **kwargs):
        return "otp_obj", TEST_OTP

    monkeypatch.setattr("app.api.v1.routes_download.issue_otp", mock_issue_otp)

    response = client.post("/api/v1/download/verify", json={"email": TEST_EMAIL})
    assert response.status_code == 200
    data = response.json()
    assert "otp_sent"   in data
    assert "expires_in" in data
    assert "message"    in data


# ─────────────────────────────────────────────────────────────────────────────
# Testes de autenticação com OTP
# ─────────────────────────────────────────────────────────────────────────────

def test_authenticate_with_invalid_otp(client, monkeypatch: pytest.MonkeyPatch):
    """OTP inválido deve retornar 400."""
    def mock_verify_otp(*args, **kwargs):
        from app.services.token_service import TokenError
        raise TokenError("OTP inválido")

    monkeypatch.setattr("app.api.v1.routes_download.verify_otp", mock_verify_otp)

    response = client.post(
        "/api/v1/download/authenticate",
        json={"email": TEST_EMAIL, "code": "000000"},
    )
    assert response.status_code == 400
    assert "Falha na autenticação" in response.json()["detail"]


def test_authenticate_with_valid_otp(client, monkeypatch: pytest.MonkeyPatch):
    """OTP válido deve retornar 200 com token e expires_in."""
    class MockOtp:
        pass

    class MockAccess:
        token = "token123"

    monkeypatch.setattr("app.api.v1.routes_download.verify_otp",         lambda *a, **k: MockOtp())
    monkeypatch.setattr("app.api.v1.routes_download.issue_token_access",  lambda *a, **k: MockAccess())

    response = client.post(
        "/api/v1/download/authenticate",
        json={"email": TEST_EMAIL, "code": TEST_OTP},
    )
    assert response.status_code == 200
    data = response.json()
    assert "token"      in data
    assert "expires_in" in data
    assert "message"    in data


# ─────────────────────────────────────────────────────────────────────────────
# Testes de listagem de arquivos (endpoint protegido)
# ─────────────────────────────────────────────────────────────────────────────

def test_list_files(client):
    """GET /download/files deve retornar 200 com a chave 'files'."""

    class _Share:
        id            = 1
        name          = "Compartilhamento Teste"
        description   = "Descrição"
        created_by_id = 1
        expires_at    = datetime(2099, 1, 1, tzinfo=UTC)
        created_at    = datetime(2024, 1, 1, tzinfo=UTC)

    class _Token:
        user_id = 1

    class _Context:
        token = _Token()
        share = _Share()
        now   = datetime(2024, 1, 1, tzinfo=UTC)

    fastapi_app.dependency_overrides[get_external_access_context] = lambda: _Context()
    try:
        response = client.get(
            "/api/v1/download/files",
            headers={"Authorization": "Bearer token123"},
        )
    finally:
        fastapi_app.dependency_overrides.pop(get_external_access_context, None)

    assert response.status_code == 200
    assert "files" in response.json()
