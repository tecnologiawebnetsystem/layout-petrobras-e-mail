"""
test_group_sync.py — Testes para sincronizacao de usuarios por grupo Entra ID.

Cobertura:
- check_user_in_group (membro / nao-membro / grupo nao configurado)
- sync_user_from_group (criar / atualizar / desativar / reativar / strategy)
- bulk_sync_group_members (criar / atualizar / desativar em massa)
- Endpoint GET /auth/entra/group-info
- Endpoint POST /auth/entra/sync-group (permissoes + execucao)
- Callback bloqueio por grupo (mock Graph)
"""

import os
import sys
import hashlib
import secrets
from datetime import datetime, timedelta, UTC
from unittest.mock import patch, MagicMock

import pytest
from sqlmodel import select

# Garantir que imports do projeto funcionem
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.models.user import User, TypeUser
from app.services.group_sync_service import (
    check_user_in_group,
    get_user_groups,
    check_user_in_group_by_id,
    sync_user_from_group,
    bulk_sync_group_members,
)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers para mock do Graph API
# ─────────────────────────────────────────────────────────────────────────────

FAKE_GROUP_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
FAKE_GROUP_NAME = "GN_CLOUD_AWS_SCAC_USERS"


def _mock_graph_member_of_response(group_ids: list[str]):
    """Cria um mock httpx.Response para GET /me/memberOf."""
    value = [{"id": gid, "displayName": f"Group-{gid[:8]}", "@odata.type": "#microsoft.graph.group"} for gid in group_ids]
    return MagicMock(
        status_code=200,
        json=MagicMock(return_value={"value": value}),
    )


def _mock_graph_check_member_groups_response(matched_ids: list[str]):
    """Cria um mock httpx.Response para POST /me/checkMemberGroups."""
    return MagicMock(
        status_code=200,
        json=MagicMock(return_value={"value": matched_ids}),
    )


def _mock_graph_group_members_response(members: list[dict]):
    """Cria um mock httpx.Response para GET /groups/{id}/members."""
    return MagicMock(
        status_code=200,
        json=MagicMock(return_value={"value": members}),
    )


# ═════════════════════════════════════════════════════════════════════════════
# Classe 1: check_user_in_group
# ═════════════════════════════════════════════════════════════════════════════

class TestCheckUserInGroup:
    """Testes para check_user_in_group() via Graph /me/memberOf."""

    @patch("app.services.group_sync_service.settings")
    @patch("app.services.group_sync_service.httpx.Client")
    def test_usuario_pertence_ao_grupo(self, mock_client_cls, mock_settings):
        """Deve retornar True quando usuario pertence ao grupo."""
        mock_settings.entra_required_group_id = FAKE_GROUP_ID
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME

        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.get.return_value = _mock_graph_member_of_response([FAKE_GROUP_ID, "outro-grupo-id"])
        mock_client_cls.return_value = mock_client

        result = check_user_in_group("fake_ms_token")
        assert result is True

    @patch("app.services.group_sync_service.settings")
    @patch("app.services.group_sync_service.httpx.Client")
    def test_usuario_nao_pertence_ao_grupo(self, mock_client_cls, mock_settings):
        """Deve retornar False quando usuario NAO pertence ao grupo."""
        mock_settings.entra_required_group_id = FAKE_GROUP_ID
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME

        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.get.return_value = _mock_graph_member_of_response(["outro-grupo-1", "outro-grupo-2"])
        mock_client_cls.return_value = mock_client

        result = check_user_in_group("fake_ms_token")
        assert result is False

    @patch("app.services.group_sync_service.settings")
    def test_grupo_nao_configurado_permite_todos(self, mock_settings):
        """Se ENTRA_REQUIRED_GROUP_ID nao estiver configurado, deve retornar True."""
        mock_settings.entra_required_group_id = None
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME

        result = check_user_in_group("fake_ms_token")
        assert result is True

    @patch("app.services.group_sync_service.settings")
    @patch("app.services.group_sync_service.httpx.Client")
    def test_graph_indisponivel_retorna_false(self, mock_client_cls, mock_settings):
        """Se Graph estiver indisponivel (timeout), deve retornar False."""
        mock_settings.entra_required_group_id = FAKE_GROUP_ID
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME

        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        import httpx
        mock_client.get.side_effect = httpx.TimeoutException("timeout")
        mock_client_cls.return_value = mock_client

        result = check_user_in_group("fake_ms_token")
        assert result is False

    @patch("app.services.group_sync_service.settings")
    @patch("app.services.group_sync_service.httpx.Client")
    def test_graph_retorna_erro_403(self, mock_client_cls, mock_settings):
        """Se Graph retornar 403 (sem permissao), retorna lista vazia."""
        mock_settings.entra_required_group_id = FAKE_GROUP_ID
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME

        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.get.return_value = MagicMock(status_code=403, text="Forbidden")
        mock_client_cls.return_value = mock_client

        result = check_user_in_group("fake_ms_token")
        assert result is False


# ═════════════════════════════════════════════════════════════════════════════
# Classe 2: get_user_groups
# ═════════════════════════════════════════════════════════════════════════════

class TestGetUserGroups:
    """Testes para get_user_groups() — listagem de grupos."""

    @patch("app.services.group_sync_service.httpx.Client")
    def test_retorna_ids_dos_grupos(self, mock_client_cls):
        """Deve retornar lista de IDs dos grupos do usuario."""
        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.get.return_value = _mock_graph_member_of_response(["g1", "g2", "g3"])
        mock_client_cls.return_value = mock_client

        groups = get_user_groups("fake_token")
        assert groups == ["g1", "g2", "g3"]

    @patch("app.services.group_sync_service.httpx.Client")
    def test_retorna_lista_vazia_quando_sem_grupos(self, mock_client_cls):
        """Deve retornar lista vazia se usuario nao tem grupos."""
        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.get.return_value = _mock_graph_member_of_response([])
        mock_client_cls.return_value = mock_client

        groups = get_user_groups("fake_token")
        assert groups == []


# ═════════════════════════════════════════════════════════════════════════════
# Classe 3: check_user_in_group_by_id
# ═════════════════════════════════════════════════════════════════════════════

class TestCheckUserInGroupById:
    """Testes para check_user_in_group_by_id() via /me/checkMemberGroups."""

    @patch("app.services.group_sync_service.httpx.Client")
    def test_membro_confirmado(self, mock_client_cls):
        """Deve retornar True quando Graph confirma membership."""
        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.post.return_value = _mock_graph_check_member_groups_response([FAKE_GROUP_ID])
        mock_client_cls.return_value = mock_client

        result = check_user_in_group_by_id("fake_token", FAKE_GROUP_ID)
        assert result is True

    @patch("app.services.group_sync_service.httpx.Client")
    def test_nao_membro(self, mock_client_cls):
        """Deve retornar False quando Graph nao confirma membership."""
        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.post.return_value = _mock_graph_check_member_groups_response([])
        mock_client_cls.return_value = mock_client

        result = check_user_in_group_by_id("fake_token", FAKE_GROUP_ID)
        assert result is False


# ═════════════════════════════════════════════════════════════════════════════
# Classe 4: sync_user_from_group
# ═════════════════════════════════════════════════════════════════════════════

class TestSyncUserFromGroup:
    """Testes para sync_user_from_group() — criacao/atualizacao/desativacao."""

    @patch("app.services.group_sync_service.settings")
    def test_cria_usuario_quando_no_grupo(self, mock_settings, session):
        """Deve criar usuario novo quando pertence ao grupo e nao existe."""
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME
        mock_settings.entra_group_sync_strategy = "deactivate"
        mock_settings.entra_supervisor_group_ids = []

        user = sync_user_from_group(
            session=session,
            email="novo.user@petrobras.com.br",
            name="Novo User",
            claims={},
            graph_info={"department": "TIC", "job_title": "Analista"},
            is_in_group=True,
        )

        assert user is not None
        assert user.id is not None
        assert user.email == "novo.user@petrobras.com.br"
        assert user.name == "Novo User"
        assert user.status is True
        assert user.type == TypeUser.INTERNAL
        assert user.department == "TIC"

    @patch("app.services.group_sync_service.settings")
    def test_atualiza_usuario_existente_quando_no_grupo(self, mock_settings, session, usuario_interno):
        """Deve atualizar dados de usuario existente quando pertence ao grupo."""
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME
        mock_settings.entra_group_sync_strategy = "deactivate"
        mock_settings.entra_supervisor_group_ids = []

        user = sync_user_from_group(
            session=session,
            email=usuario_interno.email,
            name="Nome Atualizado",
            claims={},
            graph_info={"department": "Nova Area", "job_title": "Senior"},
            is_in_group=True,
        )

        assert user.name == "Nome Atualizado"
        assert user.department == "Nova Area"
        assert user.job_title == "Senior"
        assert user.status is True

    @patch("app.services.group_sync_service.settings")
    def test_reativa_usuario_desativado_quando_volta_ao_grupo(self, mock_settings, session, usuario_inativo):
        """Deve reativar (status=True) usuario que estava desativado e voltou ao grupo."""
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME
        mock_settings.entra_group_sync_strategy = "deactivate"
        mock_settings.entra_supervisor_group_ids = []

        assert usuario_inativo.status is False

        user = sync_user_from_group(
            session=session,
            email=usuario_inativo.email,
            name=usuario_inativo.name,
            claims={},
            graph_info={},
            is_in_group=True,
        )

        assert user.status is True

    @patch("app.services.group_sync_service.settings")
    def test_desativa_usuario_quando_fora_do_grupo_strategy_deactivate(self, mock_settings, session, usuario_interno):
        """Strategy=deactivate: deve desativar usuario que saiu do grupo."""
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME
        mock_settings.entra_group_sync_strategy = "deactivate"
        mock_settings.entra_supervisor_group_ids = []

        assert usuario_interno.status is True

        user = sync_user_from_group(
            session=session,
            email=usuario_interno.email,
            name=usuario_interno.name,
            claims={},
            graph_info={},
            is_in_group=False,
        )

        assert user.status is False

    @patch("app.services.group_sync_service.settings")
    def test_nao_desativa_quando_strategy_block_login(self, mock_settings, session, usuario_interno):
        """Strategy=block_login: nao deve alterar status, apenas bloquear."""
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME
        mock_settings.entra_group_sync_strategy = "block_login"
        mock_settings.entra_supervisor_group_ids = []

        assert usuario_interno.status is True

        user = sync_user_from_group(
            session=session,
            email=usuario_interno.email,
            name=usuario_interno.name,
            claims={},
            graph_info={},
            is_in_group=False,
        )

        assert user.status is True  # NAO desativou

    @patch("app.services.group_sync_service.settings")
    def test_nao_cria_usuario_fora_do_grupo(self, mock_settings, session):
        """Nao deve criar usuario que nao pertence ao grupo e nao existe no banco."""
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME
        mock_settings.entra_group_sync_strategy = "block_login"
        mock_settings.entra_supervisor_group_ids = []

        with pytest.raises(ValueError, match="nao pertence ao grupo"):
            sync_user_from_group(
                session=session,
                email="inexistente@example.com",
                name="Inexistente",
                claims={},
                graph_info={},
                is_in_group=False,
            )

    @patch("app.services.group_sync_service.settings")
    def test_resolve_supervisor_por_cargo(self, mock_settings, session):
        """Deve marcar is_supervisor=True se cargo e de gestor."""
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME
        mock_settings.entra_group_sync_strategy = "deactivate"
        mock_settings.entra_supervisor_group_ids = []

        user = sync_user_from_group(
            session=session,
            email="gerente@petrobras.com.br",
            name="Gerente Fulano",
            claims={},
            graph_info={"job_title": "Gerente de TIC"},
            is_in_group=True,
        )

        assert user.is_supervisor is True

    @patch("app.services.group_sync_service.settings")
    def test_resolve_supervisor_por_grupo_entra(self, mock_settings, session):
        """Deve marcar is_supervisor=True se pertence ao grupo de supervisores."""
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME
        mock_settings.entra_group_sync_strategy = "deactivate"
        mock_settings.entra_supervisor_group_ids = ["supervisor-group-123"]

        user = sync_user_from_group(
            session=session,
            email="sup.grupo@petrobras.com.br",
            name="Sup Grupo",
            claims={"groups": ["supervisor-group-123", "outro"]},
            graph_info={"job_title": "Analista"},
            is_in_group=True,
        )

        assert user.is_supervisor is True


# ═════════════════════════════════════════════════════════════════════════════
# Classe 5: bulk_sync_group_members
# ═════════════════════════════════════════════════════════════════════════════

class TestBulkSyncGroupMembers:
    """Testes para bulk_sync_group_members() — sync em massa."""

    @patch("app.services.group_sync_service.settings")
    def test_retorna_erro_quando_grupo_nao_configurado(self, mock_settings, session):
        """Deve retornar erro se ENTRA_REQUIRED_GROUP_ID nao configurado."""
        mock_settings.entra_required_group_id = None

        result = bulk_sync_group_members(session, "fake_token")
        assert "error" in result

    @patch("app.services.group_sync_service._list_group_members")
    @patch("app.services.group_sync_service.settings")
    def test_cria_usuarios_do_grupo(self, mock_settings, mock_list, session):
        """Deve criar usuarios que estao no grupo mas nao no banco."""
        mock_settings.entra_required_group_id = FAKE_GROUP_ID
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME

        mock_list.return_value = [
            {"mail": "user1@petrobras.com.br", "displayName": "User 1", "department": "TIC"},
            {"mail": "user2@petrobras.com.br", "displayName": "User 2", "department": "E&P"},
        ]

        result = bulk_sync_group_members(session, "fake_token")

        assert result["created"] == 2
        assert result["updated"] == 0
        assert result["deactivated"] == 0

        u1 = session.exec(select(User).where(User.email == "user1@petrobras.com.br")).first()
        u2 = session.exec(select(User).where(User.email == "user2@petrobras.com.br")).first()
        assert u1 is not None
        assert u2 is not None
        assert u1.status is True
        assert u2.department == "E&P"

    @patch("app.services.group_sync_service._list_group_members")
    @patch("app.services.group_sync_service.settings")
    def test_desativa_usuario_fora_do_grupo(self, mock_settings, mock_list, session, usuario_interno):
        """Deve desativar usuarios internos que NAO estao no grupo."""
        mock_settings.entra_required_group_id = FAKE_GROUP_ID
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME

        # Mock retorna lista vazia (usuario_interno NAO esta no grupo)
        mock_list.return_value = [
            {"mail": "outro@petrobras.com.br", "displayName": "Outro User"},
        ]

        result = bulk_sync_group_members(session, "fake_token")

        assert result["deactivated"] >= 1
        assert result["created"] == 1  # "outro" foi criado

        # usuario_interno deve estar desativado
        session.refresh(usuario_interno)
        assert usuario_interno.status is False

    @patch("app.services.group_sync_service._list_group_members")
    @patch("app.services.group_sync_service.settings")
    def test_atualiza_usuario_existente_no_grupo(self, mock_settings, mock_list, session, usuario_interno):
        """Deve atualizar dados de usuario que ja existe e ainda pertence ao grupo."""
        mock_settings.entra_required_group_id = FAKE_GROUP_ID
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME

        mock_list.return_value = [
            {
                "mail": usuario_interno.email,
                "displayName": "Nome Novo",
                "department": "Dept Novo",
                "jobTitle": "Cargo Novo",
            },
        ]

        result = bulk_sync_group_members(session, "fake_token")

        assert result["updated"] == 1
        session.refresh(usuario_interno)
        assert usuario_interno.name == "Nome Novo"
        assert usuario_interno.department == "Dept Novo"

    @patch("app.services.group_sync_service._list_group_members")
    @patch("app.services.group_sync_service.settings")
    def test_reativa_usuario_desativado_no_grupo(self, mock_settings, mock_list, session, usuario_inativo):
        """Deve reativar usuario desativado que voltou ao grupo."""
        mock_settings.entra_required_group_id = FAKE_GROUP_ID
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME

        mock_list.return_value = [
            {"mail": usuario_inativo.email, "displayName": usuario_inativo.name},
        ]

        assert usuario_inativo.status is False
        result = bulk_sync_group_members(session, "fake_token")

        assert result["reactivated"] == 1
        session.refresh(usuario_inativo)
        assert usuario_inativo.status is True

    @patch("app.services.group_sync_service._list_group_members")
    @patch("app.services.group_sync_service.settings")
    def test_retorna_erro_quando_graph_falha(self, mock_settings, mock_list, session):
        """Deve retornar erro se Graph API falhar ao listar membros."""
        mock_settings.entra_required_group_id = FAKE_GROUP_ID
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME
        mock_list.return_value = None  # Simula falha

        result = bulk_sync_group_members(session, "fake_token")
        assert "error" in result


# ═════════════════════════════════════════════════════════════════════════════
# Classe 6: Endpoint GET /auth/entra/group-info
# ═════════════════════════════════════════════════════════════════════════════

class TestGroupInfoEndpoint:
    """Testes para o endpoint GET /auth/entra/group-info."""

    def test_retorna_info_do_grupo(self, client):
        """Deve retornar informacoes sobre o grupo configurado."""
        resp = client.get("/api/v1/auth/entra/group-info")
        assert resp.status_code == 200
        data = resp.json()
        assert "group_name" in data
        assert "sync_strategy" in data
        assert "configured" in data

    def test_grupo_nao_configurado_retorna_configured_false(self, client):
        """Se grupo nao configurado, configured deve ser False."""
        with patch("app.api.v1.routes_entra_auth.settings") as mock_settings:
            mock_settings.entra_required_group_id = None
            mock_settings.entra_required_group_name = "GN_CLOUD_AWS_SCAC_USERS"
            mock_settings.entra_group_sync_strategy = "deactivate"

            resp = client.get("/api/v1/auth/entra/group-info")
            assert resp.status_code == 200
            data = resp.json()
            assert data["configured"] is False


# ═════════════════════════════════════════════════════════════════════════════
# Classe 7: Endpoint POST /auth/entra/sync-group (permissoes)
# ═════════════════════════════════════════════════════════════════════════════

class TestSyncGroupEndpoint:
    """Testes para o endpoint POST /auth/entra/sync-group."""

    def test_requer_autenticacao(self, client):
        """Deve retornar 401 sem Bearer token."""
        resp = client.post("/api/v1/auth/entra/sync-group")
        assert resp.status_code == 401

    def test_requer_supervisor(self, client, jwt_interno):
        """Deve retornar 403 se usuario nao e supervisor."""
        resp = client.post(
            "/api/v1/auth/entra/sync-group",
            headers={
                "Authorization": f"Bearer {jwt_interno}",
                "X-MS-Access-Token": "fake_ms_token",
            },
        )
        assert resp.status_code == 403

    def test_requer_ms_access_token(self, client, jwt_supervisor):
        """Deve retornar 400 sem X-MS-Access-Token."""
        resp = client.post(
            "/api/v1/auth/entra/sync-group",
            headers={"Authorization": f"Bearer {jwt_supervisor}"},
        )
        assert resp.status_code == 400

    @patch("app.api.v1.routes_entra_auth.settings")
    def test_requer_grupo_configurado(self, mock_settings, client, jwt_supervisor):
        """Deve retornar 503 se grupo nao configurado."""
        mock_settings.entra_required_group_id = None
        mock_settings.entra_tenant_id = "fake-tenant"
        mock_settings.entra_client_id = "fake-client"
        mock_settings.entra_client_secret = "fake-secret"
        mock_settings.entra_redirect_uri = "http://localhost/callback"
        mock_settings.frontend_external_portal_url = "http://localhost:3000"
        mock_settings.entra_supervisor_group_ids = []
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME
        mock_settings.entra_group_sync_strategy = "deactivate"
        mock_settings.jwt_secret = "test-secret"

        resp = client.post(
            "/api/v1/auth/entra/sync-group",
            headers={
                "Authorization": f"Bearer {jwt_supervisor}",
                "X-MS-Access-Token": "fake_ms_token",
            },
        )
        assert resp.status_code == 503

    @patch("app.api.v1.routes_entra_auth.bulk_sync_group_members")
    @patch("app.api.v1.routes_entra_auth.settings")
    def test_executa_sync_com_sucesso(self, mock_settings, mock_bulk, client, jwt_supervisor):
        """Deve executar sync e retornar relatorio."""
        mock_settings.entra_required_group_id = FAKE_GROUP_ID
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME
        mock_settings.entra_group_sync_strategy = "deactivate"
        mock_settings.entra_tenant_id = "fake-tenant"
        mock_settings.entra_client_id = "fake-client"
        mock_settings.entra_client_secret = "fake-secret"
        mock_settings.entra_redirect_uri = "http://localhost/callback"
        mock_settings.frontend_external_portal_url = "http://localhost:3000"
        mock_settings.entra_supervisor_group_ids = []
        mock_settings.jwt_secret = "test-secret"

        mock_bulk.return_value = {
            "group_id": FAKE_GROUP_ID,
            "group_name": FAKE_GROUP_NAME,
            "total_members_in_group": 5,
            "created": 2,
            "updated": 2,
            "reactivated": 1,
            "deactivated": 0,
        }

        resp = client.post(
            "/api/v1/auth/entra/sync-group",
            headers={
                "Authorization": f"Bearer {jwt_supervisor}",
                "X-MS-Access-Token": "fake_ms_token",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["created"] == 2
        assert data["updated"] == 2
        assert data["reactivated"] == 1


# ═════════════════════════════════════════════════════════════════════════════
# Classe 8: Seguranca — variaveis de ambiente
# ═════════════════════════════════════════════════════════════════════════════

class TestSecurityEnvironmentVars:
    """Testa que variaveis de ambiente sao respeitadas corretamente."""

    @patch("app.services.group_sync_service.settings")
    def test_strategy_deactivate_desativa(self, mock_settings, session, usuario_interno):
        """Strategy=deactivate deve desativar o usuario."""
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME
        mock_settings.entra_group_sync_strategy = "deactivate"
        mock_settings.entra_supervisor_group_ids = []

        user = sync_user_from_group(
            session=session,
            email=usuario_interno.email,
            name=usuario_interno.name,
            claims={},
            graph_info={},
            is_in_group=False,
        )
        assert user.status is False

    @patch("app.services.group_sync_service.settings")
    def test_strategy_block_login_nao_desativa(self, mock_settings, session, usuario_interno):
        """Strategy=block_login NAO deve desativar — status permanece True."""
        mock_settings.entra_required_group_name = FAKE_GROUP_NAME
        mock_settings.entra_group_sync_strategy = "block_login"
        mock_settings.entra_supervisor_group_ids = []

        user = sync_user_from_group(
            session=session,
            email=usuario_interno.email,
            name=usuario_interno.name,
            claims={},
            graph_info={},
            is_in_group=False,
        )
        assert user.status is True

    @patch("app.services.group_sync_service.settings")
    def test_grupo_id_vazio_permite_todos(self, mock_settings):
        """Group ID vazio = sem filtro, todos sao permitidos."""
        mock_settings.entra_required_group_id = ""
        result = check_user_in_group("fake_token")
        assert result is True

    @patch("app.services.group_sync_service.settings")
    def test_grupo_id_none_permite_todos(self, mock_settings):
        """Group ID None = sem filtro, todos sao permitidos."""
        mock_settings.entra_required_group_id = None
        result = check_user_in_group("fake_token")
        assert result is True
