"""
Testes de rotas de suporte — my-tickets, shares vinculados e encerrar chamado.

Execucao:
    pytest tests/test_support_routes.py -v
"""

from __future__ import annotations

import pytest
from datetime import datetime, UTC, timedelta
from fastapi.testclient import TestClient

from app.models.support_registration import SupportRegistration, SupportRegistrationStatus
from app.models.share import Share, ShareStatus, TokenConsumption
from app.models.user import TypeUser


# ── Fixture: cliente autenticado como usuario INTERNO ───────────────────────

@pytest.fixture()
def internal_client(db_engine, usuario_interno):
    """TestClient com get_current_user_from_token sobrescrito para usuario_interno."""
    import app.db.session as _db_module
    from app.main import app as fastapi_app
    from app.core.security import get_current_user_from_token

    original_engine = _db_module.engine
    _db_module.engine = db_engine
    fastapi_app.dependency_overrides[get_current_user_from_token] = lambda: usuario_interno
    with TestClient(fastapi_app, raise_server_exceptions=True) as c:
        yield c
    fastapi_app.dependency_overrides.pop(get_current_user_from_token, None)
    _db_module.engine = original_engine


@pytest.fixture()
def support_client(db_engine, usuario_suporte):
    """TestClient com get_current_user_from_token sobrescrito para usuario_suporte."""
    import app.db.session as _db_module
    from app.main import app as fastapi_app
    from app.core.security import get_current_user_from_token

    original_engine = _db_module.engine
    _db_module.engine = db_engine
    fastapi_app.dependency_overrides[get_current_user_from_token] = lambda: usuario_suporte
    with TestClient(fastapi_app, raise_server_exceptions=True) as c:
        yield c
    fastapi_app.dependency_overrides.pop(get_current_user_from_token, None)
    _db_module.engine = original_engine


# ─────────────────────────────────────────────────────────────────────────────
# GET /support/my-tickets
# ─────────────────────────────────────────────────────────────────────────────

class TestMyTickets:
    def test_retorna_lista_vazia_sem_chamados(self, internal_client):
        """Usuario interno sem chamados ativos deve receber lista vazia."""
        response = internal_client.get("/api/v1/support/my-tickets")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_retorna_chamados_ativos_do_solicitante(
        self, internal_client, support_registration
    ):
        """Usuario interno com chamado ativo deve receber o chamado na lista."""
        response = internal_client.get("/api/v1/support/my-tickets")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        ids = [item["id"] for item in data]
        assert support_registration.id in ids

    def test_nao_retorna_chamados_inativos(self, internal_client, session, support_registration):
        """Chamados inativos nao devem aparecer em my-tickets."""
        support_registration.status = SupportRegistrationStatus.INATIVO
        session.add(support_registration)
        session.commit()

        response = internal_client.get("/api/v1/support/my-tickets")
        assert response.status_code == 200
        data = response.json()
        ids = [item["id"] for item in data]
        assert support_registration.id not in ids

    def test_nao_retorna_chamado_vencido_apos_7_dias(
        self, internal_client, session, support_registration
    ):
        """
        Chamado com expires_at no passado (mais de 7 dias) nao deve aparecer.
        A lazy expiration deve inativa-lo antes de retornar a lista.
        """
        # Simula chamado criado ha 8 dias (expirado)
        support_registration.expires_at = datetime.now(UTC) - timedelta(days=1)
        session.add(support_registration)
        session.commit()

        response = internal_client.get("/api/v1/support/my-tickets")
        assert response.status_code == 200
        data = response.json()
        ids = [item["id"] for item in data]
        assert support_registration.id not in ids

        # Verifica que foi inativado no banco pela lazy expiration
        session.refresh(support_registration)
        assert support_registration.status == SupportRegistrationStatus.INATIVO

    def test_retorna_dias_restantes_no_chamado(
        self, internal_client, support_registration
    ):
        """O campo dias_restantes deve ser retornado para cada chamado ativo."""
        response = internal_client.get("/api/v1/support/my-tickets")
        assert response.status_code == 200
        data = response.json()
        for item in data:
            assert "dias_restantes" in item
            assert item["dias_restantes"] >= 0
            assert "expires_at" in item

    def test_acesso_negado_para_usuario_suporte(self, support_client):
        """Usuario de suporte nao pode acessar my-tickets (apenas interno)."""
        response = support_client.get("/api/v1/support/my-tickets")
        assert response.status_code == 403


# ─────────────────────────────────────────────────────────────────────────────
# GET /support/registrations/{id}/shares
# ─────────────────────────────────────────────────────────────────────────────

class TestSharesVinculados:
    def test_retorna_lista_vazia_sem_shares(self, support_client, support_registration):
        """Chamado sem shares vinculados deve retornar lista vazia."""
        response = support_client.get(
            f"/api/v1/support/registrations/{support_registration.id}/shares"
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_retorna_shares_vinculados(
        self, support_client, session, support_registration, usuario_interno, area
    ):
        """Chamado com share vinculado deve retornar o share na lista."""
        share = Share(
            area_id=area.id,
            external_email="externo@example.com",
            created_by_id=usuario_interno.id,
            status=ShareStatus.PENDING,
            consumption_policy=TokenConsumption.AFTER_ALL,
            support_registration_id=support_registration.id,
        )
        session.add(share)
        session.commit()
        session.refresh(share)

        response = support_client.get(
            f"/api/v1/support/registrations/{support_registration.id}/shares"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        ids = [item["id"] for item in data]
        assert share.id in ids

    def test_retorna_404_para_chamado_inexistente(self, support_client):
        """ID de chamado que nao existe deve retornar 404."""
        response = support_client.get("/api/v1/support/registrations/999999/shares")
        assert response.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /support/registrations/{id}/encerrar
# ─────────────────────────────────────────────────────────────────────────────

class TestEncerrarChamado:
    def test_encerra_chamado_ativo(self, support_client, session, support_registration):
        """Deve encerrar (inativar) um chamado ativo com sucesso."""
        assert support_registration.status == SupportRegistrationStatus.ATIVO

        response = support_client.patch(
            f"/api/v1/support/registrations/{support_registration.id}/encerrar"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == support_registration.id

        session.refresh(support_registration)
        assert support_registration.status == SupportRegistrationStatus.INATIVO

    def test_erro_ao_encerrar_chamado_ja_inativo(self, support_client, session, support_registration):
        """Tentar encerrar um chamado ja inativo deve retornar 400."""
        support_registration.status = SupportRegistrationStatus.INATIVO
        session.add(support_registration)
        session.commit()

        response = support_client.patch(
            f"/api/v1/support/registrations/{support_registration.id}/encerrar"
        )
        assert response.status_code == 400

    def test_retorna_404_para_chamado_inexistente(self, support_client):
        """ID de chamado que nao existe deve retornar 404."""
        response = support_client.patch("/api/v1/support/registrations/999999/encerrar")
        assert response.status_code == 404

    def test_acesso_negado_para_usuario_interno(self, internal_client, support_registration):
        """Usuario interno nao pode encerrar chamados."""
        response = internal_client.patch(
            f"/api/v1/support/registrations/{support_registration.id}/encerrar"
        )
        assert response.status_code == 403
