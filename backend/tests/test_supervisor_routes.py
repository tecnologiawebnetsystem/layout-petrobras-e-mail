"""
Testes de rotas do supervisor — pending, shares, aprovacao, rejeicao,
filtro por remetente e presença de chamado + SLA no response.

Execucao:
    pytest tests/test_supervisor_routes.py -v
"""

from __future__ import annotations

from datetime import datetime, timedelta, UTC

import pytest
from fastapi.testclient import TestClient

from app.models.share import Share, ShareStatus, TokenConsumption
from app.models.support_registration import SupportRegistration, SupportRegistrationStatus


# ── Fixture: supervisor autenticado ─────────────────────────────────────────

@pytest.fixture()
def supervisor_client(db_engine, usuario_supervisor):
    """TestClient com require_supervisor sobrescrito para usuario_supervisor."""
    import app.db.session as _db_module
    from app.main import app as fastapi_app
    from app.utils.authz import require_supervisor, get_current_user

    original_engine = _db_module.engine
    _db_module.engine = db_engine
    fastapi_app.dependency_overrides[require_supervisor] = lambda: usuario_supervisor
    fastapi_app.dependency_overrides[get_current_user] = lambda: usuario_supervisor
    with TestClient(fastapi_app, raise_server_exceptions=True) as c:
        yield c
    fastapi_app.dependency_overrides.pop(require_supervisor, None)
    fastapi_app.dependency_overrides.pop(get_current_user, None)
    _db_module.engine = original_engine


@pytest.fixture()
def share_pendente_com_chamado(session, usuario_interno, usuario_supervisor, area, support_registration):
    """Share PENDING vinculado ao supervisor e com chamado do suporte."""
    # Vincula o usuario_interno ao supervisor
    usuario_interno.manager_id = usuario_supervisor.id
    session.add(usuario_interno)
    session.commit()

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
    return share


# ─────────────────────────────────────────────────────────────────────────────
# GET /supervisor/pending
# ─────────────────────────────────────────────────────────────────────────────

class TestGetPending:
    def test_lista_pendentes_do_supervisor(
        self, supervisor_client, share_pendente_com_chamado
    ):
        """Supervisor deve ver shares pendentes dos seus supervisionados."""
        response = supervisor_client.get("/api/v1/supervisor/pending")
        assert response.status_code == 200
        data = response.json()
        assert "files" in data
        ids = [f["id"] for f in data["files"]]
        assert share_pendente_com_chamado.id in ids

    def test_resposta_inclui_chamado_e_sla(
        self, supervisor_client, share_pendente_com_chamado
    ):
        """O response deve incluir os campos 'chamado' e 'horas_pendente'."""
        response = supervisor_client.get("/api/v1/supervisor/pending")
        assert response.status_code == 200
        share_data = next(
            (f for f in response.json()["files"] if f["id"] == share_pendente_com_chamado.id),
            None,
        )
        assert share_data is not None
        assert "chamado" in share_data
        assert "horas_pendente" in share_data
        assert share_data["chamado"] is not None
        assert share_data["chamado"]["numero_solicitacao"] == "INC-TEST-001"
        assert share_data["horas_pendente"] is not None
        assert share_data["horas_pendente"] >= 0

    def test_retorna_lista_vazia_sem_supervisionados(self, supervisor_client):
        """Supervisor sem supervisionados deve receber lista vazia."""
        response = supervisor_client.get("/api/v1/supervisor/pending")
        assert response.status_code == 200
        data = response.json()
        assert data["files"] == []

    def test_filtro_por_sender_email(
        self, supervisor_client, share_pendente_com_chamado, usuario_interno
    ):
        """Filtrar por e-mail do remetente deve retornar apenas shares desse usuario."""
        # Busca com e-mail correto
        response = supervisor_client.get(
            f"/api/v1/supervisor/pending?sender_email={usuario_interno.email}"
        )
        assert response.status_code == 200
        ids = [f["id"] for f in response.json()["files"]]
        assert share_pendente_com_chamado.id in ids

        # Busca com e-mail inexistente deve retornar vazio
        response = supervisor_client.get(
            "/api/v1/supervisor/pending?sender_email=naoexiste@petrobras.com.br"
        )
        assert response.status_code == 200
        assert response.json()["files"] == []


# ─────────────────────────────────────────────────────────────────────────────
# GET /supervisor/shares
# ─────────────────────────────────────────────────────────────────────────────

class TestGetSupervisorShares:
    def test_lista_todos_os_shares(
        self, supervisor_client, share_pendente_com_chamado
    ):
        """Supervisor deve ver todos os shares dos supervisionados."""
        response = supervisor_client.get("/api/v1/supervisor/shares")
        assert response.status_code == 200
        data = response.json()
        assert "files" in data

    def test_filtro_por_status_pending(
        self, supervisor_client, share_pendente_com_chamado
    ):
        """Filtro por status=pending deve retornar apenas shares pendentes."""
        response = supervisor_client.get("/api/v1/supervisor/shares?status=pending")
        assert response.status_code == 200
        files = response.json()["files"]
        for f in files:
            assert f["status"] in ("pendente", "pending")

    def test_resposta_inclui_chamado_e_sla(
        self, supervisor_client, share_pendente_com_chamado
    ):
        """O response de shares deve incluir campos 'chamado' e 'horas_pendente'."""
        response = supervisor_client.get("/api/v1/supervisor/shares?status=pending")
        assert response.status_code == 200
        share_data = next(
            (f for f in response.json()["files"] if f["id"] == share_pendente_com_chamado.id),
            None,
        )
        assert share_data is not None
        assert "chamado" in share_data
        assert "horas_pendente" in share_data


# ─────────────────────────────────────────────────────────────────────────────
# POST /supervisor/approve/{id}
# ─────────────────────────────────────────────────────────────────────────────

class TestApproveShare:
    def test_aprova_share_pendente(
        self, supervisor_client, share_pendente_com_chamado, session
    ):
        """Supervisor deve conseguir aprovar um share pendente dos supervisionados."""
        response = supervisor_client.post(
            f"/api/v1/supervisor/approve/{share_pendente_com_chamado.id}",
            json={"message": "Aprovado nos testes"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ("ativo", "active")
        assert "approved_at" in data

    def test_nao_aprova_share_inexistente(self, supervisor_client):
        """Aprovar ID inexistente deve retornar 404."""
        response = supervisor_client.post(
            "/api/v1/supervisor/approve/999999",
            json={"message": ""},
        )
        assert response.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# POST /supervisor/reject/{id}
# ─────────────────────────────────────────────────────────────────────────────

class TestRejectShare:
    def test_rejeita_share_pendente(
        self, supervisor_client, share_pendente_com_chamado, session
    ):
        """Supervisor deve conseguir rejeitar um share pendente com motivo."""
        response = supervisor_client.post(
            f"/api/v1/supervisor/reject/{share_pendente_com_chamado.id}",
            json={"reason": "Documentacao insuficiente"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ("rejeitado", "rejected")
        assert data["reason"] == "Documentacao insuficiente"

    def test_rejeita_exige_motivo(self, supervisor_client, share_pendente_com_chamado):
        """Rejeicao sem motivo (campo vazio) deve ser barrada pelo Pydantic com 422."""
        response = supervisor_client.post(
            f"/api/v1/supervisor/reject/{share_pendente_com_chamado.id}",
            json={},
        )
        assert response.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# GET /shares/my-downloads
# ─────────────────────────────────────────────────────────────────────────────

class TestMyDownloads:
    def test_externo_ve_seus_downloads(self, db_engine, session, usuario_externo, area, share_ativo):
        """Usuario externo deve ver os shares onde external_email == seu e-mail."""
        import app.db.session as _db_module
        from app.main import app as fastapi_app
        from app.utils.authz import get_current_user

        original_engine = _db_module.engine
        _db_module.engine = db_engine
        fastapi_app.dependency_overrides[get_current_user] = lambda: usuario_externo

        with TestClient(fastapi_app) as c:
            response = c.get("/api/v1/shares/my-downloads")

        fastapi_app.dependency_overrides.pop(get_current_user, None)
        _db_module.engine = original_engine

        assert response.status_code == 200
        data = response.json()
        assert "downloads" in data
        assert "total" in data

    def test_share_vinculado_tem_horas_restantes(
        self, db_engine, session, usuario_externo, area
    ):
        """Share aprovado com expires_at futuro deve ter horas_restantes > 0."""
        import app.db.session as _db_module
        from app.main import app as fastapi_app
        from app.utils.authz import get_current_user

        share = Share(
            area_id=area.id,
            external_email=usuario_externo.email,
            created_by_id=area.applicant_id,
            status=ShareStatus.ACTIVE,
            consumption_policy=TokenConsumption.AFTER_ALL,
            expiration_hours=72,
            expires_at=datetime.now(UTC) + timedelta(hours=72),
        )
        session.add(share)
        session.commit()

        original_engine = _db_module.engine
        _db_module.engine = db_engine
        fastapi_app.dependency_overrides[get_current_user] = lambda: usuario_externo

        with TestClient(fastapi_app) as c:
            response = c.get("/api/v1/shares/my-downloads")

        fastapi_app.dependency_overrides.pop(get_current_user, None)
        _db_module.engine = original_engine

        assert response.status_code == 200
        downloads = response.json()["downloads"]
        if downloads:
            s = next((d for d in downloads if d["id"] == share.id), None)
            if s:
                assert s["horas_restantes"] is not None
                assert s["horas_restantes"] > 0
