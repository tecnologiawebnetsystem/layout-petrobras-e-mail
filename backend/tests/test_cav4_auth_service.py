from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.core.config import settings
from app.services import cav4_auth_service as svc


def test_generate_pkce_returns_verifier_and_challenge() -> None:
    verifier, challenge = svc.generate_pkce()
    assert verifier
    assert challenge
    assert len(verifier) > 40
    assert len(challenge) > 20


def test_extract_user_login_prefers_user_login_claim() -> None:
    claims = {
        "user_login": "GFZ3",
        "preferred_username": "usuario@petrobras.com.br",
    }
    assert svc.extract_user_login(claims) == "GFZ3"


def test_extract_user_login_fallbacks_to_email_prefix() -> None:
    claims = {"email": "matricula.teste@petrobras.com.br"}
    assert svc.extract_user_login(claims) == "matricula.teste"


def test_resolve_access_from_cav4_roles_mapping(monkeypatch) -> None:
    monkeypatch.setattr(settings, "cav4_admin_role_names", ["adm_scac"])
    monkeypatch.setattr(settings, "cav4_supervisor_role_names", ["sup_scac"])
    monkeypatch.setattr(settings, "cav4_internal_role_names", ["usr_scac"])

    admin = svc.resolve_access_from_cav4_roles(["ADM_SCAC"])
    assert admin["authorized"] is True
    assert admin["role"] == "admin"
    assert admin["is_admin"] is True

    supervisor = svc.resolve_access_from_cav4_roles(["sup_scac"])
    assert supervisor["authorized"] is True
    assert supervisor["role"] == "supervisor"
    assert supervisor["is_supervisor"] is True

    internal = svc.resolve_access_from_cav4_roles(["usr_scac"])
    assert internal["authorized"] is True
    assert internal["role"] == "internal"

    denied = svc.resolve_access_from_cav4_roles(["unknown"])
    assert denied["authorized"] is False
    assert denied["role"] is None


def test_extract_role_names_handles_nested_dict_payload() -> None:
    payload = {
        "value": [
            {"name": "CD_PAPEL_ADMIN"},
            {"nome": "CD_PAPEL_USUARIO"},
        ]
    }
    roles = svc._extract_role_names(payload)
    assert "CD_PAPEL_ADMIN" in roles
    assert "CD_PAPEL_USUARIO" in roles


def test_resolve_access_normalizes_case_and_accent(monkeypatch) -> None:
    monkeypatch.setattr(settings, "cav4_admin_role_names", ["Gestão Admin"])
    monkeypatch.setattr(settings, "cav4_supervisor_role_names", ["SUPERVISÃO"])
    monkeypatch.setattr(settings, "cav4_internal_role_names", ["Usuário Interno"])

    admin = svc.resolve_access_from_cav4_roles(["gestao admin"])
    assert admin["authorized"] is True
    assert admin["role"] == "admin"

    supervisor = svc.resolve_access_from_cav4_roles(["supervisao"])
    assert supervisor["authorized"] is True
    assert supervisor["role"] == "supervisor"

    internal = svc.resolve_access_from_cav4_roles(["USUARIO INTERNO"])
    assert internal["authorized"] is True
    assert internal["role"] == "internal"


def test_extract_role_names_handles_cav4_content_code_payload() -> None:
    payload = {
        "content": [
            {
                "uid": 1793352,
                "code": "CD_PAPEL_USUARIO",
                "enabled": True,
                "type": "common",
            },
            {
                "uid": 1793354,
                "code": "CD_PAPEL_SUPERVISOR",
                "enabled": True,
                "type": "common",
            },
        ],
        "totalsize": 2,
    }

    roles = svc._extract_role_names(payload)

    assert "CD_PAPEL_USUARIO" in roles
    assert "CD_PAPEL_SUPERVISOR" in roles


def test_get_authorization_url_builds_expected_query(monkeypatch) -> None:
    monkeypatch.setattr(settings, "ca_client_id", "client-123")
    monkeypatch.setattr(settings, "ca_redirect_uri", "http://localhost:8080/api/v1/auth/cav4/callback")
    monkeypatch.setattr(settings, "ca_scopes", "openid profile")
    monkeypatch.setattr(
        svc,
        "get_oidc_config",
        lambda: {"authorization_endpoint": "https://ca.example.com/oauth2/authorize"},
    )

    url = svc.get_authorization_url(
        state="estado",
        nonce="nonce123",
        code_challenge="challenge123",
    )

    assert url.startswith("https://ca.example.com/oauth2/authorize?")
    assert "client_id=client-123" in url
    assert "response_type=code" in url
    assert "scope=openid%20profile" in url
    assert "state=estado" in url
    assert "nonce=nonce123" in url
    assert "code_challenge=challenge123" in url


def test_validate_cav4_id_token_success(monkeypatch) -> None:
    monkeypatch.setattr(settings, "ca_client_id", "client-abc")
    monkeypatch.setattr(settings, "ca_jwt_leeway_seconds", 120)
    monkeypatch.setattr(
        svc,
        "get_oidc_config",
        lambda: {"issuer": "https://issuer.example.com"},
    )

    fake_jwks_client = SimpleNamespace(
        get_signing_key_from_jwt=lambda _: SimpleNamespace(key="fake-public-key")
    )
    monkeypatch.setattr(svc, "_get_jwks_client", lambda: fake_jwks_client)

    def _fake_decode(token, key, algorithms, audience, issuer, leeway):
        assert token == "token-valido"
        assert key == "fake-public-key"
        assert algorithms == ["RS256"]
        assert audience == "client-abc"
        assert issuer == "https://issuer.example.com"
        assert leeway == 120
        return {"sub": "123", "aud": audience}

    monkeypatch.setattr(svc.jwt, "decode", _fake_decode)

    claims = svc.validate_cav4_id_token("token-valido")
    assert claims["sub"] == "123"


def test_validate_cav4_id_token_invalid_audience(monkeypatch) -> None:
    monkeypatch.setattr(settings, "ca_client_id", "client-abc")
    monkeypatch.setattr(
        svc,
        "get_oidc_config",
        lambda: {"issuer": "https://issuer.example.com"},
    )

    fake_jwks_client = SimpleNamespace(
        get_signing_key_from_jwt=lambda _: SimpleNamespace(key="fake-public-key")
    )
    monkeypatch.setattr(svc, "_get_jwks_client", lambda: fake_jwks_client)

    def _fake_decode(*_args, **_kwargs):
        raise svc.jwt.InvalidAudienceError("aud invalida")

    monkeypatch.setattr(svc.jwt, "decode", _fake_decode)

    with pytest.raises(Exception) as exc:
        svc.validate_cav4_id_token("token-invalido")

    assert "audience invalida" in str(exc.value).lower()


def test_add_role_with_fallback_uses_user_token_first(monkeypatch) -> None:
    calls: list[str] = []

    def _fake_add_role(login: str, role_code: str, access_token: str) -> bool:
        calls.append(access_token)
        return True

    monkeypatch.setattr(svc, "add_role_to_user", _fake_add_role)

    ok, source = svc.add_role_to_user_with_fallback(
        login="X4RQ",
        role_code="CD_PAPEL_SUPERVISOR",
        user_access_token="user-token",
    )

    assert ok is True
    assert source == "user_token"
    assert calls == ["user-token"]


def test_add_role_with_fallback_uses_service_token_on_403(monkeypatch) -> None:
    calls: list[str] = []

    def _fake_add_role(login: str, role_code: str, access_token: str) -> bool:
        calls.append(access_token)
        if access_token == "user-token":
            raise svc.HTTPException(status_code=403, detail="forbidden")
        return True

    monkeypatch.setattr(svc, "add_role_to_user", _fake_add_role)
    monkeypatch.setattr(svc, "get_client_credentials_token", lambda: "service-token")

    ok, source = svc.add_role_to_user_with_fallback(
        login="X4RQ",
        role_code="CD_PAPEL_SUPERVISOR",
        user_access_token="user-token",
    )

    assert ok is True
    assert source == "service_token"
    assert calls == ["user-token", "service-token"]


def test_add_role_with_fallback_reports_when_service_token_missing(monkeypatch) -> None:
    def _fake_add_role(login: str, role_code: str, access_token: str) -> bool:
        raise svc.HTTPException(status_code=403, detail="forbidden")

    monkeypatch.setattr(svc, "add_role_to_user", _fake_add_role)
    monkeypatch.setattr(svc, "get_client_credentials_token", lambda: None)

    ok, source = svc.add_role_to_user_with_fallback(
        login="X4RQ",
        role_code="CD_PAPEL_SUPERVISOR",
        user_access_token="user-token",
    )

    assert ok is False
    assert source == "service_token_unavailable"


def test_add_role_with_fallback_uses_service_token_on_422(monkeypatch) -> None:
    calls: list[str] = []

    def _fake_add_role(login: str, role_code: str, access_token: str) -> bool:
        calls.append(access_token)
        if access_token == "user-token":
            raise svc.HTTPException(status_code=422, detail="role not found in area")
        return True

    monkeypatch.setattr(svc, "add_role_to_user", _fake_add_role)
    monkeypatch.setattr(svc, "get_client_credentials_token", lambda: "service-token")

    ok, source = svc.add_role_to_user_with_fallback(
        login="X4RQ",
        role_code="CD_PAPEL_SUPERVISOR",
        user_access_token="user-token",
    )

    assert ok is True
    assert source == "service_token"
    assert calls == ["user-token", "service-token"]


def test_remove_role_with_fallback_uses_user_token_first(monkeypatch) -> None:
    calls: list[str] = []

    def _fake_remove_role(login: str, role_code: str, access_token: str) -> bool:
        calls.append(access_token)
        return True

    monkeypatch.setattr(svc, "remove_role_from_user", _fake_remove_role)

    ok, source = svc.remove_role_from_user_with_fallback(
        login="X4RQ",
        role_code="CD_PAPEL_SUPERVISOR",
        user_access_token="user-token",
    )

    assert ok is True
    assert source == "user_token"
    assert calls == ["user-token"]


def test_remove_role_with_fallback_uses_service_token_on_403(monkeypatch) -> None:
    calls: list[str] = []

    def _fake_remove_role(login: str, role_code: str, access_token: str) -> bool:
        calls.append(access_token)
        if access_token == "user-token":
            raise svc.HTTPException(status_code=403, detail="forbidden")
        return True

    monkeypatch.setattr(svc, "remove_role_from_user", _fake_remove_role)
    monkeypatch.setattr(svc, "get_client_credentials_token", lambda: "service-token")

    ok, source = svc.remove_role_from_user_with_fallback(
        login="X4RQ",
        role_code="CD_PAPEL_SUPERVISOR",
        user_access_token="user-token",
    )

    assert ok is True
    assert source == "service_token"
    assert calls == ["user-token", "service-token"]


def test_remove_role_with_fallback_uses_service_token_when_user_token_missing(monkeypatch) -> None:
    calls: list[str] = []

    def _fake_remove_role(login: str, role_code: str, access_token: str) -> bool:
        calls.append(access_token)
        return True

    monkeypatch.setattr(svc, "remove_role_from_user", _fake_remove_role)
    monkeypatch.setattr(svc, "get_client_credentials_token", lambda: "service-token")

    ok, source = svc.remove_role_from_user_with_fallback(
        login="X4RQ",
        role_code="CD_PAPEL_USUARIO",
        user_access_token=None,
    )

    assert ok is True
    assert source == "service_token"
    assert calls == ["service-token"]