"""
Testes de rotas de shares — criação, listagem e cancelamento.
Usa TestClient + dependency_overrides para simular autenticação interna.

Execução:
    pytest tests/test_share_routes.py -v
"""

from __future__ import annotations

from datetime import datetime, timedelta, UTC

import pytest
from fastapi.testclient import TestClient

from app.models.share import Share, ShareStatus, TokenConsumption
from app.models.user import User


# ── Fixture: cliente HTTP com usuario_interno autenticado ────────────────────

@pytest.fixture()
def authed_client(db_engine, usuario_interno):
    """TestClient com engine de teste e get_current_user sobrescritos para usuario_interno."""
    import app.db.session as _db_module
    from app.main import app as fastapi_app
    from app.utils.authz import get_current_user

    original_engine = _db_module.engine
    _db_module.engine = db_engine

    fastapi_app.dependency_overrides[get_current_user] = lambda: usuario_interno
    with TestClient(fastapi_app, raise_server_exceptions=True) as c:
        yield c
    fastapi_app.dependency_overrides.pop(get_current_user, None)
    _db_module.engine = original_engine


# ─────────────────────────────────────────────────────────────────────────────
# Testes de criação de share
# ─────────────────────────────────────────────────────────────────────────────

class TestCreateShare:
    def test_cria_share_com_dados_validos(self, authed_client):
        # Verifica que POST /shares/ com dados válidos retorna 201 Created.
        # A dependência de autenticação é substituída via dependency_overrides para
        # simular um usuário interno logado. O share deve iniciar com status PENDING.
        response = authed_client.post(
            "/api/v1/shares/",
            json={
                "recipient_email": "externo@example.com",
                "expiration_hours": 48,
                "file_ids": [],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["recipient_email"] == "externo@example.com"
        assert data["status"] == ShareStatus.PENDING

    def test_falha_sem_autenticacao(self, client):
        # Sem header Authorization o endpoint deve rejeitar a requisição
        # com 401 Unauthorized ou 403 Forbidden — acesso negado sem token.
        response = client.post(
            "/api/v1/shares/",
            json={"recipient_email": "externo@example.com", "expiration_hours": 48},
        )
        assert response.status_code in (401, 403)

    def test_falha_email_destinatario_ausente(self, authed_client):
        # O campo recipient_email é obrigatório no payload.
        # Pydantic deve rejeitar a requisição incompleta com 422 Unprocessable Entity.
        response = authed_client.post(
            "/api/v1/shares/",
            json={"expiration_hours": 48},
        )
        assert response.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# Testes de listagem de shares
# ─────────────────────────────────────────────────────────────────────────────

class TestListShares:
    def test_lista_shares_do_usuario_autenticado(
        self, authed_client, share_ativo
    ):
        # Verifica que GET /shares/ retorna 200 com lista dos shares do usuário.
        # O share_ativo já existe no banco (criado pelo conftest).
        response = authed_client.get("/api/v1/shares/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))

    def test_falha_sem_autenticacao(self, client):
        # GET /shares/ sem token deve ser barrado com 401 ou 403.
        response = client.get("/api/v1/shares/")
        assert response.status_code in (401, 403)


# ─────────────────────────────────────────────────────────────────────────────
# Testes de detalhes de share
# ─────────────────────────────────────────────────────────────────────────────

class TestGetShare:
    def test_retorna_share_existente(
        self, authed_client, share_ativo
    ):
        # Verifica que GET /shares/{id} para um ID existente retorna 200 OK.
        # O share_ativo pertence ao mesmo usuario_interno autenticado.
        response = authed_client.get(f"/api/v1/shares/{share_ativo.id}")
        assert response.status_code == 200

    def test_retorna_404_share_inexistente(self, authed_client):
        # Buscar um share com ID que não existe no banco deve retornar 404 Not Found.
        # Usa ID 999999 improvável de existir no banco SQLite in-memory.
        response = authed_client.get("/api/v1/shares/999999")
        assert response.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# Testes de cancelamento
# ─────────────────────────────────────────────────────────────────────────────

class TestCancelShare:
    def test_cancela_share_pendente(
        self, authed_client, session, usuario_interno, area
    ):
        # Cria um share com status PENDING diretamente no banco para ter um ID conhecido,
        # depois confirma que DELETE /shares/{id} aceita o cancelamento (200 ou 204).
        share = Share(
            area_id=area.id,
            external_email="cancelar@example.com",
            created_by_id=usuario_interno.id,
            expires_at=datetime.now(UTC) + timedelta(hours=24),
            status=ShareStatus.PENDING,
            consumption_policy=TokenConsumption.AFTER_ALL,
        )
        session.add(share)
        session.commit()
        session.refresh(share)

        response = authed_client.delete(f"/api/v1/shares/{share.id}")
        assert response.status_code in (200, 204)
