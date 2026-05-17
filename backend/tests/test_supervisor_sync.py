"""
Testes para o servico de auto-criacao e vinculacao de supervisores.

Cobertura:
- resolve_and_link_supervisor: manager existe, nao existe, auto-cria, promove, reativa
- _auto_create_supervisor: criacao com e sem enriquecimento Graph
- _enrich_manager_from_graph: sucesso, erro, timeout
- get_manager_info_from_graph: sucesso, 404, erro
- Integracao com _sync_user e sync_user_from_group
"""

from __future__ import annotations

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, UTC

from app.models.user import User, TypeUser
from app.services.supervisor_sync_service import (
    resolve_and_link_supervisor,
    _auto_create_supervisor,
    _enrich_manager_from_graph,
    get_manager_info_from_graph,
)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Testes de resolve_and_link_supervisor
# ─────────────────────────────────────────────────────────────────────────────

class TestResolveAndLinkSupervisor:
    """Testes para a funcao principal resolve_and_link_supervisor."""

    def test_no_manager_email_returns_none(self, session, usuario_interno):
        """Se graph_info nao tem manager_email, retorna None sem alteracoes."""
        result = resolve_and_link_supervisor(
            session=session,
            user=usuario_interno,
            graph_info={},
        )
        assert result is None
        assert usuario_interno.manager_id is None

    def test_manager_exists_links_correctly(self, session, usuario_interno):
        """Se o manager ja existe na base, apenas vincula (nao cria novo)."""
        # Criar manager existente
        manager = User(
            email="manager.existente@petrobras.com.br",
            name="Manager Existente",
            type=TypeUser.INTERNAL,
            is_supervisor=True,
            status=True,
        )
        session.add(manager)
        session.commit()
        session.refresh(manager)

        result = resolve_and_link_supervisor(
            session=session,
            user=usuario_interno,
            graph_info={
                "manager_email": "manager.existente@petrobras.com.br",
                "manager_name": "Manager Existente",
            },
        )

        assert result is not None
        assert result.id == manager.id
        session.refresh(usuario_interno)
        assert usuario_interno.manager_id == manager.id

    def test_manager_not_exists_auto_creates(self, session, usuario_interno):
        """Se o manager NAO existe na base, cria automaticamente."""
        with patch(
            "app.services.supervisor_sync_service._enrich_manager_from_graph",
            return_value={
                "name": "Novo Gerente",
                "department": "TI",
                "job_title": "Gerente de TI",
                "employee_id": "EMP999",
            },
        ):
            result = resolve_and_link_supervisor(
                session=session,
                user=usuario_interno,
                graph_info={
                    "manager_email": "novo.gerente@petrobras.com.br",
                    "manager_name": "Novo Gerente",
                },
                ms_access_token="fake_token",
            )

        assert result is not None
        assert result.email == "novo.gerente@petrobras.com.br"
        assert result.is_supervisor is True
        assert result.status is True
        assert result.type == TypeUser.INTERNAL
        assert result.department == "TI"
        assert result.job_title == "Gerente de TI"
        assert result.employee_id == "EMP999"

        # Usuario vinculado
        session.refresh(usuario_interno)
        assert usuario_interno.manager_id == result.id

    def test_manager_exists_not_supervisor_gets_promoted(self, session, usuario_interno):
        """Se manager existe mas nao e supervisor, promove automaticamente."""
        manager = User(
            email="nao.supervisor@petrobras.com.br",
            name="Nao Supervisor",
            type=TypeUser.INTERNAL,
            is_supervisor=False,  # NAO e supervisor
            status=True,
        )
        session.add(manager)
        session.commit()
        session.refresh(manager)

        result = resolve_and_link_supervisor(
            session=session,
            user=usuario_interno,
            graph_info={
                "manager_email": "nao.supervisor@petrobras.com.br",
                "manager_name": "Nao Supervisor",
            },
        )

        assert result is not None
        session.refresh(result)
        assert result.is_supervisor is True

    def test_manager_exists_inactive_gets_reactivated(self, session, usuario_interno):
        """Se manager existe mas esta inativo, reativa automaticamente."""
        manager = User(
            email="inativo.manager@petrobras.com.br",
            name="Manager Inativo",
            type=TypeUser.INTERNAL,
            is_supervisor=True,
            status=False,  # INATIVO
        )
        session.add(manager)
        session.commit()
        session.refresh(manager)

        result = resolve_and_link_supervisor(
            session=session,
            user=usuario_interno,
            graph_info={
                "manager_email": "inativo.manager@petrobras.com.br",
                "manager_name": "Manager Inativo",
            },
        )

        assert result is not None
        session.refresh(result)
        assert result.status is True
        assert result.is_supervisor is True

    def test_manager_already_linked_no_change(self, session, usuario_interno):
        """Se usuario ja tem manager_id correto, nao duplica vinculacao."""
        manager = User(
            email="ja.vinculado@petrobras.com.br",
            name="Ja Vinculado",
            type=TypeUser.INTERNAL,
            is_supervisor=True,
            status=True,
        )
        session.add(manager)
        session.commit()
        session.refresh(manager)

        # Vincular manualmente antes
        usuario_interno.manager_id = manager.id
        session.add(usuario_interno)
        session.commit()

        result = resolve_and_link_supervisor(
            session=session,
            user=usuario_interno,
            graph_info={
                "manager_email": "ja.vinculado@petrobras.com.br",
                "manager_name": "Ja Vinculado",
            },
        )

        assert result is not None
        assert result.id == manager.id
        session.refresh(usuario_interno)
        assert usuario_interno.manager_id == manager.id

    def test_manager_changes_updates_link(self, session, usuario_interno):
        """Se o manager mudou (Graph retorna outro), atualiza o vinculo."""
        old_manager = User(
            email="old.manager@petrobras.com.br",
            name="Old Manager",
            type=TypeUser.INTERNAL,
            is_supervisor=True,
            status=True,
        )
        new_manager = User(
            email="new.manager@petrobras.com.br",
            name="New Manager",
            type=TypeUser.INTERNAL,
            is_supervisor=True,
            status=True,
        )
        session.add(old_manager)
        session.add(new_manager)
        session.commit()
        session.refresh(old_manager)
        session.refresh(new_manager)

        # Vincular ao antigo
        usuario_interno.manager_id = old_manager.id
        session.add(usuario_interno)
        session.commit()

        # Agora Graph retorna novo manager
        result = resolve_and_link_supervisor(
            session=session,
            user=usuario_interno,
            graph_info={
                "manager_email": "new.manager@petrobras.com.br",
                "manager_name": "New Manager",
            },
        )

        assert result is not None
        assert result.id == new_manager.id
        session.refresh(usuario_interno)
        assert usuario_interno.manager_id == new_manager.id

    def test_email_case_insensitive(self, session, usuario_interno):
        """Busca de manager por email deve ser case-insensitive."""
        manager = User(
            email="case.test@petrobras.com.br",
            name="Case Test",
            type=TypeUser.INTERNAL,
            is_supervisor=True,
            status=True,
        )
        session.add(manager)
        session.commit()
        session.refresh(manager)

        result = resolve_and_link_supervisor(
            session=session,
            user=usuario_interno,
            graph_info={
                "manager_email": "CASE.TEST@PETROBRAS.COM.BR",
                "manager_name": "Case Test",
            },
        )

        assert result is not None
        assert result.id == manager.id


# ─────────────────────────────────────────────────────────────────────────────
# 2. Testes de _auto_create_supervisor
# ─────────────────────────────────────────────────────────────────────────────

class TestAutoCreateSupervisor:
    """Testes para a funcao _auto_create_supervisor."""

    def test_creates_with_basic_data(self, session):
        """Cria supervisor com dados minimos (email + nome)."""
        with patch(
            "app.services.supervisor_sync_service._enrich_manager_from_graph",
            return_value={},
        ):
            sup = _auto_create_supervisor(
                session=session,
                manager_email="basico@petrobras.com.br",
                manager_name="Basico Supervisor",
                ms_access_token="fake",
                subordinate_email="sub@petrobras.com.br",
            )

        assert sup.id is not None
        assert sup.email == "basico@petrobras.com.br"
        assert sup.name == "Basico Supervisor"
        assert sup.type == TypeUser.INTERNAL
        assert sup.is_supervisor is True
        assert sup.status is True
        assert sup.last_login is None  # nunca logou

    def test_creates_without_name_uses_email_prefix(self, session):
        """Se nome nao fornecido, usa parte antes do @ como fallback."""
        with patch(
            "app.services.supervisor_sync_service._enrich_manager_from_graph",
            return_value={},
        ):
            sup = _auto_create_supervisor(
                session=session,
                manager_email="sem.nome@petrobras.com.br",
                manager_name=None,
            )

        assert sup.name == "sem.nome"

    def test_creates_with_enriched_data(self, session):
        """Cria supervisor enriquecido com dados do Graph."""
        with patch(
            "app.services.supervisor_sync_service._enrich_manager_from_graph",
            return_value={
                "name": "Enriquecido Graph",
                "department": "Engenharia",
                "job_title": "Diretor",
                "employee_id": "DIR001",
                "photo_url": "data:image/jpeg;base64,abc123",
            },
        ):
            sup = _auto_create_supervisor(
                session=session,
                manager_email="enriquecido@petrobras.com.br",
                manager_name="Fallback Name",
                ms_access_token="fake_token",
            )

        assert sup.name == "Enriquecido Graph"  # Graph sobrescreve
        assert sup.department == "Engenharia"
        assert sup.job_title == "Diretor"
        assert sup.employee_id == "DIR001"

    def test_creates_without_token_uses_basic(self, session):
        """Sem ms_access_token, cria apenas com dados basicos."""
        sup = _auto_create_supervisor(
            session=session,
            manager_email="no.token@petrobras.com.br",
            manager_name="No Token",
            ms_access_token=None,
        )

        assert sup.name == "No Token"
        assert sup.department is None
        assert sup.is_supervisor is True


# ─────────────────────────────────────────────────────────────────────────────
# 3. Testes de _enrich_manager_from_graph
# ─────────────────────────────────────────────────────────────────────────────

class TestEnrichManagerFromGraph:
    """Testes para busca de dados do manager via Graph API."""

    def test_success_returns_data(self):
        """Graph retorna 200 com dados completos."""
        mock_profile = MagicMock()
        mock_profile.status_code = 200
        mock_profile.json.return_value = {
            "displayName": "Manager Graph",
            "jobTitle": "Coordenador",
            "department": "Financeiro",
            "employeeId": "FIN001",
            "mail": "manager.graph@petrobras.com.br",
        }

        mock_photo = MagicMock()
        mock_photo.status_code = 404  # Sem foto

        with patch("app.services.supervisor_sync_service.httpx.Client") as mock_client:
            client_instance = MagicMock()
            client_instance.get.side_effect = [mock_profile, mock_photo]
            client_instance.__enter__ = MagicMock(return_value=client_instance)
            client_instance.__exit__ = MagicMock(return_value=False)
            mock_client.return_value = client_instance

            result = _enrich_manager_from_graph("fake_token", "manager@test.com")

        assert result["name"] == "Manager Graph"
        assert result["job_title"] == "Coordenador"
        assert result["department"] == "Financeiro"
        assert result["employee_id"] == "FIN001"

    def test_graph_error_returns_empty(self):
        """Graph retorna erro — retorna dicionario vazio sem falhar."""
        mock_resp = MagicMock()
        mock_resp.status_code = 403
        mock_resp.text = "Forbidden"

        mock_photo = MagicMock()
        mock_photo.status_code = 403

        with patch("app.services.supervisor_sync_service.httpx.Client") as mock_client:
            client_instance = MagicMock()
            client_instance.get.side_effect = [mock_resp, mock_photo]
            client_instance.__enter__ = MagicMock(return_value=client_instance)
            client_instance.__exit__ = MagicMock(return_value=False)
            mock_client.return_value = client_instance

            result = _enrich_manager_from_graph("fake_token", "error@test.com")

        assert result == {} or "name" not in result

    def test_timeout_returns_empty(self):
        """Timeout no Graph — retorna dicionario vazio sem falhar."""
        import httpx

        with patch("app.services.supervisor_sync_service.httpx.Client") as mock_client:
            client_instance = MagicMock()
            client_instance.get.side_effect = httpx.TimeoutException("timeout")
            client_instance.__enter__ = MagicMock(return_value=client_instance)
            client_instance.__exit__ = MagicMock(return_value=False)
            mock_client.return_value = client_instance

            result = _enrich_manager_from_graph("fake_token", "timeout@test.com")

        assert result == {}


# ─────────────────────────────────────────────────────────────────────────────
# 4. Testes de get_manager_info_from_graph
# ─────────────────────────────────────────────────────────────────────────────

class TestGetManagerInfoFromGraph:
    """Testes para busca do manager do usuario autenticado."""

    def test_success_returns_info(self):
        """Graph /me/manager retorna 200 com dados."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "displayName": "Meu Manager",
            "mail": "meu.manager@petrobras.com.br",
            "jobTitle": "Superintendente",
            "department": "Exploracao",
            "employeeId": "SUP001",
        }

        with patch("app.services.supervisor_sync_service.httpx.Client") as mock_client:
            client_instance = MagicMock()
            client_instance.get.return_value = mock_resp
            client_instance.__enter__ = MagicMock(return_value=client_instance)
            client_instance.__exit__ = MagicMock(return_value=False)
            mock_client.return_value = client_instance

            result = get_manager_info_from_graph("fake_token")

        assert result is not None
        assert result["email"] == "meu.manager@petrobras.com.br"
        assert result["name"] == "Meu Manager"
        assert result["job_title"] == "Superintendente"

    def test_no_manager_returns_none(self):
        """Graph /me/manager retorna 404 (usuario sem manager)."""
        mock_resp = MagicMock()
        mock_resp.status_code = 404

        with patch("app.services.supervisor_sync_service.httpx.Client") as mock_client:
            client_instance = MagicMock()
            client_instance.get.return_value = mock_resp
            client_instance.__enter__ = MagicMock(return_value=client_instance)
            client_instance.__exit__ = MagicMock(return_value=False)
            mock_client.return_value = client_instance

            result = get_manager_info_from_graph("fake_token")

        assert result is None

    def test_error_returns_none(self):
        """Erro inesperado — retorna None."""
        with patch("app.services.supervisor_sync_service.httpx.Client") as mock_client:
            client_instance = MagicMock()
            client_instance.get.side_effect = Exception("Connection error")
            client_instance.__enter__ = MagicMock(return_value=client_instance)
            client_instance.__exit__ = MagicMock(return_value=False)
            mock_client.return_value = client_instance

            result = get_manager_info_from_graph("fake_token")

        assert result is None


# ─────────────────────────────────────────────────────────────────────────────
# 5. Testes de integracao com _sync_user (routes_entra_auth)
# ─────────────────────────────────────────────────────────────────────────────

class TestIntegrationWithSyncUser:
    """Verifica que _sync_user chama resolve_and_link_supervisor corretamente."""

    def test_sync_user_calls_resolve(self, session):
        """_sync_user deve chamar resolve_and_link_supervisor apos criar/atualizar usuario."""
        with patch(
            "app.services.supervisor_sync_service._enrich_manager_from_graph",
            return_value={"name": "Manager Test"},
        ):
            from app.api.v1.routes_entra_auth import _sync_user

            user = _sync_user(
                session=session,
                email="integracao.test@petrobras.com.br",
                name="Integracao Test",
                claims={},
                graph_info={
                    "manager_email": "manager.integracao@petrobras.com.br",
                    "manager_name": "Manager Integracao",
                },
                ms_access_token="fake_token",
            )

            assert user is not None
            assert user.email == "integracao.test@petrobras.com.br"

            # Manager deve ter sido auto-criado
            from sqlmodel import select
            manager = session.exec(
                select(User).where(User.email == "manager.integracao@petrobras.com.br")
            ).first()
            assert manager is not None
            assert manager.is_supervisor is True
            assert manager.status is True

            # Usuario vinculado ao manager
            session.refresh(user)
            assert user.manager_id == manager.id

    def test_sync_user_without_manager_no_error(self, session):
        """_sync_user sem manager_email funciona normalmente."""
        from app.api.v1.routes_entra_auth import _sync_user

        user = _sync_user(
            session=session,
            email="sem.manager@petrobras.com.br",
            name="Sem Manager",
            claims={},
            graph_info={},
        )

        assert user is not None
        assert user.manager_id is None


# ─────────────────────────────────────────────────────────────────────────────
# 6. Testes de auditoria (logs)
# ─────────────────────────────────────────────────────────────────────────────

class TestAuditLogs:
    """Verifica que eventos de auditoria sao registrados corretamente."""

    def test_auto_create_logs_event(self, session):
        """Auto-criacao de supervisor deve gerar log SUPERVISOR_AUTO_CREATED."""
        from app.models.audit import AuditLog

        with patch(
            "app.services.supervisor_sync_service._enrich_manager_from_graph",
            return_value={},
        ):
            _auto_create_supervisor(
                session=session,
                manager_email="audit.test@petrobras.com.br",
                manager_name="Audit Test",
                subordinate_email="sub.audit@petrobras.com.br",
            )

        logs = session.exec(
            select(AuditLog).where(AuditLog.action == "SUPERVISOR_AUTO_CREATED")
        ).all()
        assert len(logs) >= 1
        assert "audit.test@petrobras.com.br" in logs[-1].detail

    def test_promotion_logs_event(self, session, usuario_interno):
        """Promocao de usuario a supervisor deve gerar log SUPERVISOR_PROMOTED."""
        from app.models.audit import AuditLog
        from sqlmodel import select

        # Criar usuario que nao e supervisor
        not_sup = User(
            email="not.sup.audit@petrobras.com.br",
            name="Not Sup",
            type=TypeUser.INTERNAL,
            is_supervisor=False,
            status=True,
        )
        session.add(not_sup)
        session.commit()
        session.refresh(not_sup)

        resolve_and_link_supervisor(
            session=session,
            user=usuario_interno,
            graph_info={
                "manager_email": "not.sup.audit@petrobras.com.br",
                "manager_name": "Not Sup",
            },
        )

        logs = session.exec(
            select(AuditLog).where(AuditLog.action == "SUPERVISOR_PROMOTED")
        ).all()
        assert len(logs) >= 1

    def test_link_logs_event(self, session, usuario_interno):
        """Vinculacao de supervisor deve gerar log SUPERVISOR_LINKED."""
        from app.models.audit import AuditLog
        from sqlmodel import select

        manager = User(
            email="link.audit@petrobras.com.br",
            name="Link Audit",
            type=TypeUser.INTERNAL,
            is_supervisor=True,
            status=True,
        )
        session.add(manager)
        session.commit()
        session.refresh(manager)

        resolve_and_link_supervisor(
            session=session,
            user=usuario_interno,
            graph_info={
                "manager_email": "link.audit@petrobras.com.br",
                "manager_name": "Link Audit",
            },
        )

        logs = session.exec(
            select(AuditLog).where(AuditLog.action == "SUPERVISOR_LINKED")
        ).all()
        assert len(logs) >= 1
        assert f"supervisor_id={manager.id}" in logs[-1].detail
