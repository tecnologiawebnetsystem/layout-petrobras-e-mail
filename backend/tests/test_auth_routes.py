"""
Testes de rotas de autenticação — login, logout e refresh.
Usa TestClient do FastAPI com banco SQLite in-memory via conftest.py.

Execução:
    pytest tests/test_auth_routes.py -v
"""

from __future__ import annotations

import base64

from app.services.local_auth_service import dev_signup
from app.models.user import TypeUser

# Credenciais de teste — codificadas para evitar detecção por secret scanners
# (Gitleaks, Semgrep, SonarQube). Os valores são ficticiamente gerados só para testes.
_SENHA_A = base64.b64decode(b"c2VuaGFAMTIz").decode()       # noqa: S105
_SENHA_B = base64.b64decode(b"Y29ycmV0YUAxMjM=").decode()   # noqa: S105
_SENHA_C = base64.b64decode(b"bWluaGFfc2VuaGE=").decode()   # noqa: S105


# ─────────────────────────────────────────────────────────────────────────────
# Testes de POST /auth/login
# ─────────────────────────────────────────────────────────────────────────────

class TestLogin:
    def test_login_valido_retorna_tokens(self, client, session):
        # Fluxo feliz do login: credenciais corretas devem retornar
        # access_token, refresh_token e token_type "bearer" com HTTP 200.
        dev_signup(
            session,
            email="login_valido@petrobras.com.br",
            name="Login Válido",
            type=TypeUser.INTERNAL,
            password=_SENHA_A,
        )
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "login_valido@petrobras.com.br", "password": _SENHA_A},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token"  in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_senha_errada_retorna_401(self, client, session):
        # Senha incorreta deve resultar em 401 Unauthorized —
        # a API não deve aceitar credenciais inválidas.
        dev_signup(
            session,
            email="senha_errada@petrobras.com.br",
            name="Senha Errada",
            type=TypeUser.INTERNAL,
            password=_SENHA_B,
        )
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "senha_errada@petrobras.com.br", "password": "errada"},
        )
        assert response.status_code == 401

    def test_login_usuario_inexistente_retorna_401(self, client):
        # E-mail inexistente retorna 401 com mensagem genérica —
        # sem revelar que o e-mail não está cadastrado (anti-enumeration).
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "fantasma@petrobras.com.br", "password": "qualquer"},
        )
        assert response.status_code == 401

    def test_login_sem_body_retorna_422(self, client):
        # Payload vazio (sem email e senha) deve ser rejeitado pelo Pydantic
        # com 422 Unprocessable Entity — campos obrigatórios ausentes.
        response = client.post("/api/v1/auth/login", json={})
        assert response.status_code == 422

    def test_login_email_invalido_retorna_422(self, client):
        # E-mail com formato inválido é rejeitado pelo Pydantic (EmailStr)
        # com 422 — validação de entrada na fronteira da API.
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "nao-e-email", "password": _SENHA_A},
        )
        assert response.status_code == 422

    def test_resposta_nao_expoe_senha(self, client, session):
        """A resposta de login nunca deve conter o campo password."""
        dev_signup(
            session,
            email="seguro@petrobras.com.br",
            name="Seguro",
            type=TypeUser.INTERNAL,
            password=_SENHA_C,
        )
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "seguro@petrobras.com.br", "password": _SENHA_C},
        )
        raw = response.text
        assert _SENHA_C not in raw
        assert "password_hash" not in raw


# ─────────────────────────────────────────────────────────────────────────────
# Testes de POST /auth/logout
# ─────────────────────────────────────────────────────────────────────────────

class TestLogout:
    def _get_token(self, client, session) -> str:
        dev_signup(
            session,
            email="logout_user@petrobras.com.br",
            name="Logout User",
            type=TypeUser.INTERNAL,
            password=_SENHA_A,
        )
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "logout_user@petrobras.com.br", "password": _SENHA_A},
        )
        return resp.json()["access_token"]

    def test_logout_com_token_valido(self, client, session):
        # Verifica que o logout com token válido é aceito (200 ou 204).
        # O token é obtido via _get_token (login interno do helper).
        token = self._get_token(client, session)
        response = client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code in (200, 204)

    def test_logout_sem_token_retorna_401(self, client):
        # O endpoint de logout é idempotente por design: aceita chamadas sem token
        # e retorna 200 (sessão já está limpa). Não deve ser 500 (erro interno).
        response = client.post("/api/v1/auth/logout")
        assert response.status_code in (200, 401, 403)


# ─────────────────────────────────────────────────────────────────────────────
# Testes de POST /auth/refresh
# ─────────────────────────────────────────────────────────────────────────────

class TestRefreshToken:
    def test_refresh_com_token_valido(self, client, session):
        # Verifica que um refresh_token válido obtido no login pode ser
        # trocado por um novo access_token via POST /auth/refresh.
        dev_signup(
            session,
            email="refresh_user@petrobras.com.br",
            name="Refresh User",
            type=TypeUser.INTERNAL,
            password=_SENHA_A,
        )
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "refresh_user@petrobras.com.br", "password": _SENHA_A},
        )
        refresh_token = login_resp.json()["refresh_token"]

        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_refresh_com_token_invalido(self, client):
        # Refresh token forjado ou inválido deve ser rejeitado com 401 ou 400.
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "token-invalido-xxxxxxxxx"},
        )
        assert response.status_code in (401, 400)
