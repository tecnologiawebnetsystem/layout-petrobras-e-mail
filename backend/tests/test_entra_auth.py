"""
test_entra_auth.py — Testes completos para autenticacao Entra ID backend-driven.

Cobertura:
  1. GET  /auth/entra/authorize     — redirect, parametros, state
  2. GET  /auth/entra/callback      — code valido/invalido, CSRF, usuario desativado
  3. POST /auth/entra/refresh       — valido, expirado, revogado, inexistente
  4. POST /auth/entra/logout        — com/sem token, revogacao de refresh tokens
  5. GET  /auth/entra/me            — valido, expirado, invalido, usuario inativo
  6. GET  /auth/entra/session-check — valido, expirado, sem token
  7. Seguranca                      — tokens fake, issuer errado, tokens forjados
  8. Integracao (mock Microsoft)    — fluxo completo authorize → callback → me → refresh → logout
"""

from __future__ import annotations

import hashlib
import json
import os
import secrets
from datetime import datetime, timedelta, UTC
from unittest.mock import MagicMock, patch, PropertyMock
from urllib.parse import parse_qs, urlparse

import pytest
from jose import jwt as jose_jwt

# Garante modo local para conftest; rotas Entra usam settings diretamente
os.environ.setdefault("AUTH_MODE", "local")


# ═════════════════════════════════════════════════════════════════════════════
# 1. GET /auth/entra/authorize
# ═════════════════════════════════════════════════════════════════════════════

class TestAuthorize:
    """Testes do endpoint GET /api/v1/auth/entra/authorize."""

    def test_authorize_redirects_to_microsoft(self, client):
        """Deve retornar 302 para login.microsoftonline.com."""
        resp = client.get("/api/v1/auth/entra/authorize", follow_redirects=False)
        assert resp.status_code == 302
        location = resp.headers["location"]
        assert "login.microsoftonline.com" in location

    def test_authorize_contains_required_params(self, client):
        """URL de redirect deve conter client_id, redirect_uri, scope, state."""
        resp = client.get("/api/v1/auth/entra/authorize", follow_redirects=False)
        location = resp.headers["location"]
        parsed = urlparse(location)
        params = parse_qs(parsed.query)

        assert "client_id" in params
        assert "redirect_uri" in params
        assert "scope" in params
        assert "state" in params
        assert "response_type" in params
        assert params["response_type"] == ["code"]

    def test_authorize_state_is_unique(self, client):
        """Cada chamada deve gerar um state diferente (CSRF protection)."""
        resp1 = client.get("/api/v1/auth/entra/authorize", follow_redirects=False)
        resp2 = client.get("/api/v1/auth/entra/authorize", follow_redirects=False)

        loc1 = resp1.headers["location"]
        loc2 = resp2.headers["location"]

        state1 = parse_qs(urlparse(loc1).query)["state"][0]
        state2 = parse_qs(urlparse(loc2).query)["state"][0]
        assert state1 != state2

    def test_authorize_returns_503_when_not_configured(self, client):
        """Deve retornar 503 se Entra ID nao estiver configurado."""
        from app.core.config import settings

        original_tenant = settings.entra_tenant_id
        settings.entra_tenant_id = None
        try:
            resp = client.get("/api/v1/auth/entra/authorize")
            assert resp.status_code == 503
            assert "nao configurado" in resp.json()["detail"].lower()
        finally:
            settings.entra_tenant_id = original_tenant


# ═════════════════════════════════════════════════════════════════════════════
# 2. GET /auth/entra/callback
# ═════════════════════════════════════════════════════════════════════════════

class TestCallback:
    """Testes do endpoint GET /api/v1/auth/entra/callback."""

    def test_callback_without_code_returns_400(self, client):
        """Sem parametro 'code' deve retornar 400."""
        resp = client.get("/api/v1/auth/entra/callback")
        assert resp.status_code == 400
        assert "code" in resp.json()["detail"].lower()

    def test_callback_invalid_state_returns_403(self, client):
        """State invalido (nao presente no store) deve retornar 403 (CSRF)."""
        resp = client.get(
            "/api/v1/auth/entra/callback",
            params={"code": "fake-code", "state": "invalid-state-12345"},
        )
        assert resp.status_code == 403
        assert "csrf" in resp.json()["detail"].lower() or "state" in resp.json()["detail"].lower()

    @patch("app.api.v1.routes_entra_auth.httpx.Client")
    @patch("app.api.v1.routes_entra_auth._validate_id_token")
    def test_callback_valid_code_creates_user_and_redirects(
        self, mock_validate, mock_httpx_class, client
    ):
        """Code valido deve criar usuario, emitir tokens e redirecionar para frontend."""
        # Setup: criar state valido
        from app.api.v1.routes_entra_auth import _pending_states
        state = "test-state-valid"
        _pending_states[state] = {
            "nonce": "test-nonce",
            "created_at": datetime.now(UTC).isoformat(),
            "ip": "127.0.0.1",
        }

        # Mock Microsoft token endpoint
        mock_client_instance = MagicMock()
        mock_httpx_class.return_value.__enter__ = MagicMock(return_value=mock_client_instance)
        mock_httpx_class.return_value.__exit__ = MagicMock(return_value=False)

        # Token response
        mock_token_resp = MagicMock()
        mock_token_resp.status_code = 200
        mock_token_resp.json.return_value = {
            "id_token": "mock-id-token",
            "access_token": "mock-access-token",
            "token_type": "bearer",
        }

        # Graph responses
        mock_graph_profile = MagicMock()
        mock_graph_profile.status_code = 200
        mock_graph_profile.json.return_value = {
            "jobTitle": "Engenheiro",
            "department": "TI",
            "employeeId": "EMP001",
        }

        mock_graph_manager = MagicMock()
        mock_graph_manager.status_code = 404  # sem gestor
        mock_graph_manager.json.return_value = {}

        mock_graph_photo = MagicMock()
        mock_graph_photo.status_code = 404  # sem foto

        def side_effect_requests(*args, **kwargs):
            url = args[0] if args else kwargs.get("url", "")
            if "oauth2/v2.0/token" in url:
                return mock_token_resp
            if "/me/manager" in url:
                return mock_graph_manager
            if "/me/photo" in url:
                return mock_graph_photo
            if "/me" in url:
                return mock_graph_profile
            return MagicMock(status_code=404)

        mock_client_instance.post = MagicMock(return_value=mock_token_resp)
        mock_client_instance.get = MagicMock(side_effect=side_effect_requests)

        # Mock id_token validation
        mock_validate.return_value = {
            "preferred_username": "teste.usuario@petrobras.com.br",
            "name": "Teste Usuario",
            "groups": [],
        }

        resp = client.get(
            "/api/v1/auth/entra/callback",
            params={"code": "valid-auth-code", "state": state},
            follow_redirects=False,
        )

        assert resp.status_code == 302
        location = resp.headers["location"]
        assert "/auth/entra-callback" in location
        assert "access_token=" in location
        assert "refresh_token=" in location

    def test_callback_with_error_param_redirects_to_frontend(self, client):
        """Se Microsoft retornar erro, deve redirecionar com mensagem de erro."""
        resp = client.get(
            "/api/v1/auth/entra/callback",
            params={"error": "access_denied", "error_description": "User cancelled"},
            follow_redirects=False,
        )
        assert resp.status_code == 302
        location = resp.headers["location"]
        assert "error=" in location

    @patch("app.api.v1.routes_entra_auth.httpx.Client")
    def test_callback_microsoft_rejects_code_returns_401(self, mock_httpx_class, client):
        """Se Microsoft rejeitar o code, deve retornar 401."""
        from app.api.v1.routes_entra_auth import _pending_states
        state = "test-state-bad-code"
        _pending_states[state] = {
            "nonce": "n",
            "created_at": datetime.now(UTC).isoformat(),
            "ip": "127.0.0.1",
        }

        mock_instance = MagicMock()
        mock_httpx_class.return_value.__enter__ = MagicMock(return_value=mock_instance)
        mock_httpx_class.return_value.__exit__ = MagicMock(return_value=False)
        mock_resp = MagicMock()
        mock_resp.status_code = 400
        mock_resp.json.return_value = {"error_description": "Invalid code"}
        mock_instance.post.return_value = mock_resp

        resp = client.get(
            "/api/v1/auth/entra/callback",
            params={"code": "invalid-code", "state": state},
        )
        assert resp.status_code == 401

    @patch("app.api.v1.routes_entra_auth.httpx.Client")
    @patch("app.api.v1.routes_entra_auth._validate_id_token")
    def test_callback_deactivated_user_returns_403(
        self, mock_validate, mock_httpx_class, client, usuario_inativo
    ):
        """Usuario desativado deve receber 403 no callback."""
        from app.api.v1.routes_entra_auth import _pending_states
        state = "test-state-inactive"
        _pending_states[state] = {
            "nonce": "n",
            "created_at": datetime.now(UTC).isoformat(),
            "ip": "127.0.0.1",
        }

        mock_instance = MagicMock()
        mock_httpx_class.return_value.__enter__ = MagicMock(return_value=mock_instance)
        mock_httpx_class.return_value.__exit__ = MagicMock(return_value=False)
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "id_token": "mock-id-token",
            "access_token": "mock-access-token",
        }
        mock_instance.post.return_value = mock_resp
        mock_instance.get.return_value = MagicMock(status_code=404)

        mock_validate.return_value = {
            "preferred_username": usuario_inativo.email,
            "name": usuario_inativo.name,
            "groups": [],
        }

        resp = client.get(
            "/api/v1/auth/entra/callback",
            params={"code": "code-for-inactive", "state": state},
        )
        assert resp.status_code == 403


# ═════════════════════════════════════════════════════════════════════════════
# 3. POST /auth/entra/refresh
# ═════════════════════════════════════════════════════════════════════════════

class TestRefresh:
    """Testes do endpoint POST /api/v1/auth/entra/refresh."""

    def test_refresh_valid_token_returns_new_access_token(
        self, client, refresh_token_valido
    ):
        """Refresh token valido deve retornar novo access_token."""
        resp = client.post(
            "/api/v1/auth/entra/refresh",
            headers={"X-Refresh-Token": refresh_token_valido},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_refresh_expired_token_returns_401(self, client, refresh_token_expirado):
        """Refresh token expirado deve retornar 401."""
        resp = client.post(
            "/api/v1/auth/entra/refresh",
            headers={"X-Refresh-Token": refresh_token_expirado},
        )
        assert resp.status_code == 401
        assert "expirado" in resp.json()["detail"].lower()

    def test_refresh_revoked_token_returns_401(self, client, refresh_token_revogado):
        """Refresh token revogado deve retornar 401."""
        resp = client.post(
            "/api/v1/auth/entra/refresh",
            headers={"X-Refresh-Token": refresh_token_revogado},
        )
        assert resp.status_code == 401
        assert "revogado" in resp.json()["detail"].lower()

    def test_refresh_nonexistent_token_returns_401(self, client):
        """Refresh token inexistente deve retornar 401."""
        resp = client.post(
            "/api/v1/auth/entra/refresh",
            headers={"X-Refresh-Token": "this-token-does-not-exist"},
        )
        assert resp.status_code == 401
        assert "invalido" in resp.json()["detail"].lower()

    def test_refresh_without_token_returns_401(self, client):
        """Sem refresh token deve retornar 401."""
        resp = client.post("/api/v1/auth/entra/refresh")
        assert resp.status_code == 401

    def test_refresh_rotates_token(self, client, refresh_token_valido):
        """Apos refresh, o token antigo deve ser revogado (rotation)."""
        resp1 = client.post(
            "/api/v1/auth/entra/refresh",
            headers={"X-Refresh-Token": refresh_token_valido},
        )
        assert resp1.status_code == 200

        # Tentar reutilizar o mesmo refresh token
        resp2 = client.post(
            "/api/v1/auth/entra/refresh",
            headers={"X-Refresh-Token": refresh_token_valido},
        )
        assert resp2.status_code == 401
        assert "revogado" in resp2.json()["detail"].lower()


# ═════════════════════════════════════════════════════════════════════════════
# 4. POST /auth/entra/logout
# ═════════════════════════════════════════════════════════════════════════════

class TestLogout:
    """Testes do endpoint POST /api/v1/auth/entra/logout."""

    def test_logout_with_valid_token_revokes_refresh_tokens(
        self, client, jwt_interno, refresh_token_valido
    ):
        """Logout deve revogar todos refresh tokens e retornar URL Microsoft."""
        resp = client.post(
            "/api/v1/auth/entra/logout",
            headers={"Authorization": f"Bearer {jwt_interno}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "ms_logout_url" in data
        assert "login.microsoftonline.com" in data["ms_logout_url"]
        assert data["revoked_tokens"] >= 0

    def test_logout_without_token_returns_401(self, client):
        """Logout sem token deve retornar 401."""
        resp = client.post("/api/v1/auth/entra/logout")
        assert resp.status_code == 401

    def test_logout_with_invalid_token_returns_401(self, client):
        """Logout com token invalido deve retornar 401."""
        resp = client.post(
            "/api/v1/auth/entra/logout",
            headers={"Authorization": "Bearer fake-token-123"},
        )
        assert resp.status_code == 401


# ═════════════════════════════════════════════════════════════════════════════
# 5. GET /auth/entra/me
# ═════════════════════════════════════════════════════════════════════════════

class TestMe:
    """Testes do endpoint GET /api/v1/auth/entra/me."""

    def test_me_with_valid_token_returns_user_data(self, client, jwt_interno):
        """Token valido deve retornar dados do usuario."""
        resp = client.get(
            "/api/v1/auth/entra/me",
            headers={"Authorization": f"Bearer {jwt_interno}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert "email" in data
        assert "name" in data
        assert data["email"] == "interno.dev@petrobras.com.br"

    def test_me_with_expired_token_returns_401(self, client, jwt_expirado):
        """Token expirado deve retornar 401."""
        resp = client.get(
            "/api/v1/auth/entra/me",
            headers={"Authorization": f"Bearer {jwt_expirado}"},
        )
        assert resp.status_code == 401

    def test_me_with_invalid_token_returns_401(self, client):
        """Token invalido/fake deve retornar 401."""
        resp = client.get(
            "/api/v1/auth/entra/me",
            headers={"Authorization": "Bearer this-is-a-fake-token"},
        )
        assert resp.status_code == 401

    def test_me_without_token_returns_401(self, client):
        """Sem token deve retornar 401."""
        resp = client.get("/api/v1/auth/entra/me")
        assert resp.status_code == 401

    def test_me_with_deactivated_user_returns_403(self, client, jwt_usuario_inativo):
        """Usuario desativado deve retornar 403."""
        resp = client.get(
            "/api/v1/auth/entra/me",
            headers={"Authorization": f"Bearer {jwt_usuario_inativo}"},
        )
        assert resp.status_code == 403

    def test_me_returns_supervisor_role(self, client, jwt_supervisor):
        """Supervisor deve ter role='supervisor' no retorno."""
        resp = client.get(
            "/api/v1/auth/entra/me",
            headers={"Authorization": f"Bearer {jwt_supervisor}"},
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == "supervisor"
        assert resp.json()["is_supervisor"] is True


# ═════════════════════════════════════════════════════════════════════════════
# 6. GET /auth/entra/session-check
# ═════════════════════════════════════════════════════════════════════════════

class TestSessionCheck:
    """Testes do endpoint GET /api/v1/auth/entra/session-check."""

    def test_session_check_valid_returns_200(self, client, jwt_interno):
        """Sessao valida deve retornar 200 com valid=True e expires_in."""
        resp = client.get(
            "/api/v1/auth/entra/session-check",
            headers={"Authorization": f"Bearer {jwt_interno}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True
        assert "expires_in" in data
        assert data["expires_in"] > 0

    def test_session_check_expired_returns_401(self, client, jwt_expirado):
        """Sessao expirada deve retornar 401."""
        resp = client.get(
            "/api/v1/auth/entra/session-check",
            headers={"Authorization": f"Bearer {jwt_expirado}"},
        )
        assert resp.status_code == 401

    def test_session_check_without_token_returns_401(self, client):
        """Sem token deve retornar 401."""
        resp = client.get("/api/v1/auth/entra/session-check")
        assert resp.status_code == 401

    def test_session_check_with_fake_token_returns_401(self, client):
        """Token fake deve retornar 401."""
        resp = client.get(
            "/api/v1/auth/entra/session-check",
            headers={"Authorization": "Bearer abcdef123456-not-a-real-jwt"},
        )
        assert resp.status_code == 401

    def test_session_check_returns_user_info(self, client, jwt_interno):
        """Deve retornar user_id, email e role."""
        resp = client.get(
            "/api/v1/auth/entra/session-check",
            headers={"Authorization": f"Bearer {jwt_interno}"},
        )
        data = resp.json()
        assert "user_id" in data
        assert "email" in data
        assert "role" in data


# ═════════════════════════════════════════════════════════════════════════════
# 7. Testes de seguranca
# ═════════════════════════════════════════════════════════════════════════════

class TestSecurity:
    """Testes de seguranca — garante que tokens fake, forjados e de outro issuer sao rejeitados."""

    def test_forged_jwt_wrong_secret_rejected(self, client, usuario_interno):
        """JWT assinado com segredo diferente deve ser rejeitado."""
        fake_token = jose_jwt.encode(
            {
                "user_id": usuario_interno.id,
                "email": usuario_interno.email,
                "type": "internal",
                "iss": "secure-share",
                "exp": (datetime.now(UTC) + timedelta(hours=1)).timestamp(),
            },
            "wrong-secret-key-123",
            algorithm="HS256",
        )
        resp = client.get(
            "/api/v1/auth/entra/me",
            headers={"Authorization": f"Bearer {fake_token}"},
        )
        assert resp.status_code == 401

    def test_token_wrong_issuer_rejected(self, client, usuario_interno):
        """Token com issuer diferente de 'secure-share' deve ser rejeitado."""
        from app.core.config import settings
        bad_token = jose_jwt.encode(
            {
                "user_id": usuario_interno.id,
                "email": usuario_interno.email,
                "type": "internal",
                "iss": "hacker-app",  # issuer errado
                "exp": (datetime.now(UTC) + timedelta(hours=1)).timestamp(),
            },
            settings.jwt_secret,
            algorithm="HS256",
        )
        # session-check verifica issuer explicitamente
        resp = client.get(
            "/api/v1/auth/entra/session-check",
            headers={"Authorization": f"Bearer {bad_token}"},
        )
        assert resp.status_code == 401
        assert "issuer" in resp.json()["detail"].lower()

    def test_demo_token_prefix_rejected(self, client):
        """Tokens com prefixo demo_ nao devem ser aceitos."""
        resp = client.get(
            "/api/v1/auth/entra/me",
            headers={"Authorization": "Bearer demo_access_1234567890"},
        )
        assert resp.status_code == 401

    def test_empty_bearer_rejected(self, client):
        """Bearer vazio deve ser rejeitado."""
        resp = client.get(
            "/api/v1/auth/entra/me",
            headers={"Authorization": "Bearer "},
        )
        assert resp.status_code == 401

    def test_no_bypass_without_backend(self, client):
        """
        Nenhum endpoint Entra aceita operacao sem validacao real do JWT.
        Testa que nao existe fallback ou bypass.
        """
        endpoints = [
            ("GET", "/api/v1/auth/entra/me"),
            ("GET", "/api/v1/auth/entra/session-check"),
            ("POST", "/api/v1/auth/entra/logout"),
            ("POST", "/api/v1/auth/entra/refresh"),
        ]
        for method, url in endpoints:
            resp = getattr(client, method.lower())(url)
            assert resp.status_code == 401, f"{method} {url} deveria retornar 401 sem token"


# ═════════════════════════════════════════════════════════════════════════════
# 8. Testes de integracao (mock Microsoft) — fluxo completo
# ═════════════════════════════════════════════════════════════════════════════

class TestIntegrationFlow:
    """Fluxo completo: authorize → callback → me → refresh → logout."""

    @patch("app.api.v1.routes_entra_auth.httpx.Client")
    @patch("app.api.v1.routes_entra_auth._validate_id_token")
    def test_full_flow_authorize_callback_me_refresh_logout(
        self, mock_validate, mock_httpx_class, client
    ):
        """Fluxo completo de autenticacao Entra ID backend-driven."""

        # ── 1. Authorize ──
        resp_auth = client.get("/api/v1/auth/entra/authorize", follow_redirects=False)
        assert resp_auth.status_code == 302
        location = resp_auth.headers["location"]
        state = parse_qs(urlparse(location).query)["state"][0]

        # ── 2. Callback (mock Microsoft) ──
        mock_instance = MagicMock()
        mock_httpx_class.return_value.__enter__ = MagicMock(return_value=mock_instance)
        mock_httpx_class.return_value.__exit__ = MagicMock(return_value=False)

        mock_token_resp = MagicMock()
        mock_token_resp.status_code = 200
        mock_token_resp.json.return_value = {
            "id_token": "mock-id-token-flow",
            "access_token": "mock-access-token-flow",
        }
        mock_instance.post.return_value = mock_token_resp
        mock_instance.get.return_value = MagicMock(status_code=404)

        mock_validate.return_value = {
            "preferred_username": "fluxo.completo@petrobras.com.br",
            "name": "Fluxo Completo",
            "groups": [],
        }

        resp_cb = client.get(
            "/api/v1/auth/entra/callback",
            params={"code": "auth-code-flow", "state": state},
            follow_redirects=False,
        )
        assert resp_cb.status_code == 302
        cb_location = resp_cb.headers["location"]
        cb_params = parse_qs(urlparse(cb_location).query)

        access_token = cb_params["access_token"][0]
        refresh_token = cb_params["refresh_token"][0]

        # ── 3. Me ──
        resp_me = client.get(
            "/api/v1/auth/entra/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert resp_me.status_code == 200
        me_data = resp_me.json()
        assert me_data["email"] == "fluxo.completo@petrobras.com.br"

        # ── 4. Session Check ──
        resp_check = client.get(
            "/api/v1/auth/entra/session-check",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert resp_check.status_code == 200
        assert resp_check.json()["valid"] is True

        # ── 5. Refresh ──
        resp_refresh = client.post(
            "/api/v1/auth/entra/refresh",
            headers={"X-Refresh-Token": refresh_token},
        )
        assert resp_refresh.status_code == 200
        new_access = resp_refresh.json()["access_token"]
        new_refresh = resp_refresh.json()["refresh_token"]

        # Token antigo de refresh nao funciona mais (rotation)
        resp_old_refresh = client.post(
            "/api/v1/auth/entra/refresh",
            headers={"X-Refresh-Token": refresh_token},
        )
        assert resp_old_refresh.status_code == 401

        # Novo token funciona
        resp_me2 = client.get(
            "/api/v1/auth/entra/me",
            headers={"Authorization": f"Bearer {new_access}"},
        )
        assert resp_me2.status_code == 200

        # ── 6. Logout ──
        resp_logout = client.post(
            "/api/v1/auth/entra/logout",
            headers={"Authorization": f"Bearer {new_access}"},
        )
        assert resp_logout.status_code == 200
        assert "ms_logout_url" in resp_logout.json()

        # Apos logout, refresh nao funciona mais
        resp_post_logout = client.post(
            "/api/v1/auth/entra/refresh",
            headers={"X-Refresh-Token": new_refresh},
        )
        assert resp_post_logout.status_code == 401
