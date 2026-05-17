"""
test_admin_routes.py — Testes para rotas do Super Administrador Global.

Cobertura:
- GET /admin/dashboard — Metricas globais
- GET /admin/users — Lista todos usuarios
- GET /admin/shares — Lista todos compartilhamentos
- GET /admin/logs — Lista todos logs
- GET /admin/tracking/{user_id} — Rastreamento de usuario
- GET /admin/actions — Lista tipos de acoes
- Autorizacao — Apenas is_admin=True pode acessar
"""

from __future__ import annotations

import base64
import os
import sys
from datetime import datetime, UTC

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

# GARANTE que o root do projeto esteja no path (CI-safe)
ROOT_DIR = os.path.abspath(os.getcwd())
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Variaveis de ambiente antes de qualquer import do projeto
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("STORAGE_PROVIDER", "local")
os.environ.setdefault("AUTH_MODE", "local")
os.environ.setdefault("EMAIL_PROVIDER", "dev")
os.environ.setdefault("USE_AWS_CONFIG", "false")

import app.models.user
import app.models.area
import app.models.restricted_file
import app.models.share
import app.models.share_file
import app.models.token_access
import app.models.audit
import app.models.notification
import app.models.email_log
import app.models.credencial_local
import app.models.areasupervisors
import app.models.session_token

from app.main import app as fastapi_app
from app.models.area import SharedArea
from app.models.credencial_local import CredentialLocal
from app.models.share import Share, ShareStatus, TokenConsumption
from app.models.user import User, TypeUser
from app.models.audit import AuditLog
from app.models.restricted_file import RestrictedFile
from app.utils.session_jwt import create_app_jwt


# Senha fixture
_SENHA_FIXTURE = base64.b64decode(b"c2VuaGFAMTIz").decode()


@pytest.fixture()
def db_engine():
    """Engine SQLite in-memory fresco por teste."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def db_session(db_engine):
    """Sessao de banco isolada por teste."""
    from app.db.session import get_session
    with Session(db_engine) as session:
        def override():
            yield session
        fastapi_app.dependency_overrides[get_session] = override
        yield session
        fastapi_app.dependency_overrides.pop(get_session, None)


@pytest.fixture()
def client(db_session):
    """TestClient configurado com sessao de banco."""
    return TestClient(fastapi_app)


@pytest.fixture()
def admin_user(db_session):
    """Usuario Super Admin para testes."""
    user = User(
        name="Admin Global",
        email="admin.global@petrobras.com.br",
        type=TypeUser.INTERNAL,
        is_supervisor=True,
        is_admin=True,
        status=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    cred = CredentialLocal(user_id=user.id)
    cred.set_password(_SENHA_FIXTURE)
    db_session.add(cred)
    db_session.commit()
    
    return user


@pytest.fixture()
def supervisor_user(db_session):
    """Usuario Supervisor (nao admin) para testes de acesso negado."""
    user = User(
        name="Supervisor Comum",
        email="supervisor@petrobras.com.br",
        type=TypeUser.INTERNAL,
        is_supervisor=True,
        is_admin=False,
        status=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    cred = CredentialLocal(user_id=user.id)
    cred.set_password(_SENHA_FIXTURE)
    db_session.add(cred)
    db_session.commit()
    
    return user


@pytest.fixture()
def internal_user(db_session):
    """Usuario interno comum para testes."""
    user = User(
        name="Usuario Interno",
        email="interno@petrobras.com.br",
        type=TypeUser.INTERNAL,
        is_supervisor=False,
        is_admin=False,
        status=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def external_user(db_session):
    """Usuario externo para testes."""
    user = User(
        name="Usuario Externo",
        email="externo@example.com",
        type=TypeUser.EXTERNAL,
        status=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def sample_area(db_session, internal_user):
    """Area para testes."""
    area = SharedArea(
        name="Area Teste",
        prefix_s3="areas/teste/",
        applicant_id=internal_user.id,
        status=True,
    )
    db_session.add(area)
    db_session.commit()
    db_session.refresh(area)
    return area


@pytest.fixture()
def sample_share(db_session, sample_area, internal_user, external_user):
    """Compartilhamento para testes."""
    share = Share(
        area_id=sample_area.id,
        external_email=external_user.email,
        created_by_id=internal_user.id,
        status=ShareStatus.PENDING,
        consumption_policy=TokenConsumption.AFTER_ALL,
        name="Compartilhamento Teste",
    )
    db_session.add(share)
    db_session.commit()
    db_session.refresh(share)
    return share


@pytest.fixture()
def sample_file(db_session, sample_area, internal_user):
    """Arquivo para testes."""
    file = RestrictedFile(
        area_id=sample_area.id,
        name="arquivo_teste.pdf",
        key_s3="areas/teste/arquivo_teste.pdf",
        size_bytes=1024,
        mime_type="application/pdf",
        upload_id=internal_user.id,
        status=True,
    )
    db_session.add(file)
    db_session.commit()
    db_session.refresh(file)
    return file


@pytest.fixture()
def sample_log(db_session, internal_user):
    """Log de auditoria para testes."""
    log = AuditLog(
        action="LOGIN",
        user_id=internal_user.id,
        detail="Login via teste",
        ip="127.0.0.1",
        user_agent="pytest",
    )
    db_session.add(log)
    db_session.commit()
    db_session.refresh(log)
    return log


def get_auth_header(user: User) -> dict:
    """Gera header de autorizacao para usuario."""
    token = create_app_jwt(user.id, user.email)
    return {"Authorization": f"Bearer {token}"}


# =============================================================================
# Testes de Autorizacao
# =============================================================================

class TestAdminAuthorization:
    """Testes de autorizacao — apenas admin pode acessar."""

    def test_dashboard_requires_admin(self, client, supervisor_user):
        """Supervisor nao-admin deve receber 403."""
        headers = get_auth_header(supervisor_user)
        resp = client.get("/api/v1/admin/dashboard", headers=headers)
        assert resp.status_code == 403
        assert "administradores" in resp.json()["detail"].lower()

    def test_dashboard_requires_auth(self, client):
        """Request sem token deve receber 401."""
        resp = client.get("/api/v1/admin/dashboard")
        assert resp.status_code == 401

    def test_users_requires_admin(self, client, supervisor_user):
        """Supervisor nao-admin deve receber 403."""
        headers = get_auth_header(supervisor_user)
        resp = client.get("/api/v1/admin/users", headers=headers)
        assert resp.status_code == 403

    def test_shares_requires_admin(self, client, supervisor_user):
        """Supervisor nao-admin deve receber 403."""
        headers = get_auth_header(supervisor_user)
        resp = client.get("/api/v1/admin/shares", headers=headers)
        assert resp.status_code == 403

    def test_logs_requires_admin(self, client, supervisor_user):
        """Supervisor nao-admin deve receber 403."""
        headers = get_auth_header(supervisor_user)
        resp = client.get("/api/v1/admin/logs", headers=headers)
        assert resp.status_code == 403

    def test_tracking_requires_admin(self, client, supervisor_user, internal_user):
        """Supervisor nao-admin deve receber 403."""
        headers = get_auth_header(supervisor_user)
        resp = client.get(f"/api/v1/admin/tracking/{internal_user.id}", headers=headers)
        assert resp.status_code == 403


# =============================================================================
# Testes do Dashboard
# =============================================================================

class TestAdminDashboard:
    """Testes do endpoint GET /admin/dashboard."""

    def test_dashboard_returns_metrics(
        self, client, admin_user, internal_user, external_user,
        sample_share, sample_file, sample_log
    ):
        """Dashboard deve retornar metricas globais."""
        headers = get_auth_header(admin_user)
        resp = client.get("/api/v1/admin/dashboard", headers=headers)
        
        assert resp.status_code == 200
        data = resp.json()
        
        # Verifica estrutura
        assert "users" in data
        assert "shares" in data
        assert "files" in data
        assert "audit" in data
        assert "emails" in data
        
        # Verifica usuarios
        assert data["users"]["total"] >= 3  # admin + internal + external
        assert data["users"]["internal"] >= 2  # admin + internal
        assert data["users"]["external"] >= 1
        assert data["users"]["admins"] >= 1
        
        # Verifica shares
        assert data["shares"]["total"] >= 1
        assert data["shares"]["pending"] >= 1
        
        # Verifica arquivos
        assert data["files"]["total"] >= 1

    def test_dashboard_empty_db(self, client, admin_user):
        """Dashboard com banco quase vazio deve retornar zeros."""
        headers = get_auth_header(admin_user)
        resp = client.get("/api/v1/admin/dashboard", headers=headers)
        
        assert resp.status_code == 200
        data = resp.json()
        assert data["users"]["total"] >= 1  # pelo menos o admin


# =============================================================================
# Testes de Listagem de Usuarios
# =============================================================================

class TestAdminListUsers:
    """Testes do endpoint GET /admin/users."""

    def test_list_users_returns_all(
        self, client, admin_user, internal_user, external_user
    ):
        """Deve retornar todos os usuarios."""
        headers = get_auth_header(admin_user)
        resp = client.get("/api/v1/admin/users", headers=headers)
        
        assert resp.status_code == 200
        data = resp.json()
        
        assert "users" in data
        assert "pagination" in data
        assert len(data["users"]) >= 3

    def test_list_users_filter_by_type(
        self, client, admin_user, internal_user, external_user
    ):
        """Deve filtrar por tipo de usuario."""
        headers = get_auth_header(admin_user)
        
        # Filtrar internos
        resp = client.get("/api/v1/admin/users?user_type=internal", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        for u in data["users"]:
            assert u["type"] == "internal"
        
        # Filtrar externos
        resp = client.get("/api/v1/admin/users?user_type=external", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        for u in data["users"]:
            assert u["type"] == "externo"

    def test_list_users_search(self, client, admin_user, internal_user):
        """Deve buscar por nome ou email."""
        headers = get_auth_header(admin_user)
        
        resp = client.get(
            f"/api/v1/admin/users?search={internal_user.email[:10]}",
            headers=headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["users"]) >= 1
        assert any(u["email"] == internal_user.email for u in data["users"])

    def test_list_users_pagination(self, client, admin_user, db_session):
        """Deve paginar resultados."""
        # Criar varios usuarios
        for i in range(10):
            user = User(
                name=f"User {i}",
                email=f"user{i}@petrobras.com.br",
                type=TypeUser.INTERNAL,
                status=True,
            )
            db_session.add(user)
        db_session.commit()
        
        headers = get_auth_header(admin_user)
        
        # Pagina 1 com limite 5
        resp = client.get("/api/v1/admin/users?page=1&limit=5", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["users"]) == 5
        assert data["pagination"]["current_page"] == 1
        assert data["pagination"]["total_pages"] >= 2


# =============================================================================
# Testes de Listagem de Compartilhamentos
# =============================================================================

class TestAdminListShares:
    """Testes do endpoint GET /admin/shares."""

    def test_list_shares_returns_all(
        self, client, admin_user, sample_share
    ):
        """Deve retornar todos os compartilhamentos."""
        headers = get_auth_header(admin_user)
        resp = client.get("/api/v1/admin/shares", headers=headers)
        
        assert resp.status_code == 200
        data = resp.json()
        
        assert "shares" in data
        assert "pagination" in data
        assert len(data["shares"]) >= 1

    def test_list_shares_filter_by_status(
        self, client, admin_user, sample_share
    ):
        """Deve filtrar por status."""
        headers = get_auth_header(admin_user)
        
        resp = client.get("/api/v1/admin/shares?status=pending", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        for s in data["shares"]:
            assert s["status"] == "pending"

    def test_list_shares_search(self, client, admin_user, sample_share):
        """Deve buscar por nome ou email."""
        headers = get_auth_header(admin_user)
        
        resp = client.get(
            f"/api/v1/admin/shares?search={sample_share.external_email[:10]}",
            headers=headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["shares"]) >= 1


# =============================================================================
# Testes de Listagem de Logs
# =============================================================================

class TestAdminListLogs:
    """Testes do endpoint GET /admin/logs."""

    def test_list_logs_returns_all(self, client, admin_user, sample_log):
        """Deve retornar todos os logs."""
        headers = get_auth_header(admin_user)
        resp = client.get("/api/v1/admin/logs", headers=headers)
        
        assert resp.status_code == 200
        data = resp.json()
        
        assert "logs" in data
        assert "pagination" in data
        # Pelo menos o log de sample + log de visualizacao do dashboard anterior
        assert len(data["logs"]) >= 1

    def test_list_logs_filter_by_action(self, client, admin_user, sample_log):
        """Deve filtrar por tipo de acao."""
        headers = get_auth_header(admin_user)
        
        resp = client.get("/api/v1/admin/logs?action=LOGIN", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        for log in data["logs"]:
            assert log["action"] == "LOGIN"

    def test_list_logs_search(self, client, admin_user, sample_log):
        """Deve buscar por acao ou detalhe."""
        headers = get_auth_header(admin_user)
        
        resp = client.get("/api/v1/admin/logs?search=teste", headers=headers)
        assert resp.status_code == 200


# =============================================================================
# Testes de Rastreamento
# =============================================================================

class TestAdminTracking:
    """Testes do endpoint GET /admin/tracking/{user_id}."""

    def test_tracking_returns_user_data(
        self, client, admin_user, internal_user, sample_share, sample_file, sample_log
    ):
        """Deve retornar rastreamento completo do usuario."""
        headers = get_auth_header(admin_user)
        resp = client.get(f"/api/v1/admin/tracking/{internal_user.id}", headers=headers)
        
        assert resp.status_code == 200
        data = resp.json()
        
        # Verifica estrutura
        assert "user" in data
        assert "shares_created" in data
        assert "shares_approved" in data
        assert "files_uploaded" in data
        assert "recent_logs" in data
        assert "stats" in data
        
        # Verifica dados do usuario
        assert data["user"]["id"] == internal_user.id
        assert data["user"]["email"] == internal_user.email
        
        # Verifica shares criados
        assert len(data["shares_created"]) >= 1
        
        # Verifica arquivos
        assert len(data["files_uploaded"]) >= 1
        
        # Verifica logs
        assert len(data["recent_logs"]) >= 1

    def test_tracking_user_not_found(self, client, admin_user):
        """Deve retornar 404 para usuario inexistente."""
        headers = get_auth_header(admin_user)
        resp = client.get("/api/v1/admin/tracking/99999", headers=headers)
        
        assert resp.status_code == 404
        assert "nao encontrado" in resp.json()["detail"].lower()


# =============================================================================
# Testes de Listagem de Acoes
# =============================================================================

class TestAdminListActions:
    """Testes do endpoint GET /admin/actions."""

    def test_list_actions(self, client, admin_user, sample_log):
        """Deve retornar lista de acoes distintas."""
        headers = get_auth_header(admin_user)
        resp = client.get("/api/v1/admin/actions", headers=headers)
        
        assert resp.status_code == 200
        data = resp.json()
        
        assert "actions" in data
        assert isinstance(data["actions"], list)
        assert "LOGIN" in data["actions"]
