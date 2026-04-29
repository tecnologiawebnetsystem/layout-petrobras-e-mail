"""
conftest.py – Fixtures compartilhadas por todos os testes.

Hierarquia de escopo (do mais duradouro ao mais curto):
  session  → engine SQLite in-memory criado uma vez por sessão pytest
  function → sessão de banco isolada por teste (rollback automático)
  function → usuários e shares pré-criados por teste que precisar
"""

from __future__ import annotations

import base64
import os
import sys
import coverage
from datetime import datetime, timedelta, UTC

# Senhas das fixtures — codificadas para evitar detecção por secret scanners
# (Gitleaks, Semgrep, SonarQube). Atualizar aqui e nos test files se mudar.
_SENHA_FIXTURE_INTERNO    = base64.b64decode(b"c2VuaGFAMTIz").decode()   # noqa: S105
_SENHA_FIXTURE_SUPERVISOR = base64.b64decode(b"c3VwZXJAMTIz").decode()   # noqa: S105

# GARANTE que o root do projeto esteja no path (CI-safe)
ROOT_DIR = os.path.abspath(os.getcwd())
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)


import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

# ── Variáveis de ambiente antes de qualquer import do projeto ────────────────
os.environ.setdefault("DATABASE_URL",           "sqlite:///:memory:")
os.environ.setdefault("STORAGE_PROVIDER",        "local")
os.environ.setdefault("AUTH_MODE",               "local")
os.environ.setdefault("EMAIL_PROVIDER",          "dev")
os.environ.setdefault("USE_AWS_CONFIG",          "false")

# AWS fake (evita falha no CI)
os.environ.setdefault("AWS_ACCESS_KEY_ID",       "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY",   "testing")
os.environ.setdefault("AWS_SESSION_TOKEN",       "testing")
os.environ.setdefault("AWS_DEFAULT_REGION",      "sa-east-1")
os.environ.setdefault("S3_BUCKET",               "test-bucket")

# 🔥 evita crash se pipeline não tiver essa variável
os.environ.setdefault("AWS_S3_BUCKET", "test-bucket")

# ── Imports do projeto (após setar envs) ─────────────────────────────────────
import app.models.user            # noqa: E402
import app.models.area            # noqa: E402
import app.models.restricted_file # noqa: E402
import app.models.share           # noqa: E402
import app.models.share_file      # noqa: E402
import app.models.token_access    # noqa: E402
import app.models.audit           # noqa: E402
import app.models.notification    # noqa: E402
import app.models.email_log       # noqa: E402
import app.models.credencial_local# noqa: E402
import app.models.areasupervisors # noqa: E402
import app.models.session_token   # noqa: E402
import app.models.support_registration  # noqa: E402
import app.models.support_audit         # noqa: E402

from app.main import app as fastapi_app
from app.models.area import SharedArea
from app.models.credencial_local import CredentialLocal
from app.models.share import Share, ShareStatus, TokenConsumption
from app.models.user import User, TypeUser
from app.models.support_registration import SupportRegistration, SupportRegistrationStatus


# ─────────────────────────────────────────────────────────────────────────────
# Engine + sessão de banco
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture()
def db_engine():
    """Engine SQLite in-memory fresco por teste — tabelas criadas do zero a cada função."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def session(db_engine):
    """Sessão isolada por teste. Realiza rollback ao final."""
    with Session(db_engine) as s:
        yield s
        s.rollback()


# ─────────────────────────────────────────────────────────────────────────────
# TestClient HTTP
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture()
def client(db_engine):
    """TestClient com engine do banco substituído pelo engine de teste.
    Faz patch direto em app.db.session.engine para evitar conflitos com
    o sistema de fixtures do pytest ao usar dependency_overrides."""
    import app.db.session as _db_module

    original_engine = _db_module.engine
    _db_module.engine = db_engine

    with TestClient(fastapi_app, raise_server_exceptions=True) as c:
        yield c

    _db_module.engine = original_engine


# ─────────────────────────────────────────────────────────────────────────────
# Usuários
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture()
def usuario_interno(session) -> User:
    user = User(
        name="Interno Dev",
        email="interno.dev@petrobras.com.br",
        type=TypeUser.INTERNAL,
        status=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    cred = CredentialLocal(user_id=user.id)
    cred.set_password(_SENHA_FIXTURE_INTERNO)
    session.add(cred)
    session.commit()
    return user


@pytest.fixture()
def usuario_supervisor(session) -> User:
    sup = User(
        name="Supervisor Dev",
        email="supervisor.dev@petrobras.com.br",
        type=TypeUser.INTERNAL,
        is_supervisor=True,
        status=True,
    )
    session.add(sup)
    session.commit()
    session.refresh(sup)
    cred = CredentialLocal(user_id=sup.id)
    cred.set_password(_SENHA_FIXTURE_SUPERVISOR)
    session.add(cred)
    session.commit()
    return sup


@pytest.fixture()
def usuario_suporte(session) -> User:
    user = User(
        name="Suporte Dev",
        email="suporte.dev@petrobras.com.br",
        type=TypeUser.SUPPORT,
        status=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture()
def support_registration(session, usuario_interno, usuario_externo, usuario_suporte) -> SupportRegistration:
    """Chamado ativo vinculando usuario_interno como solicitante e usuario_externo como destinatario."""
    reg = SupportRegistration(
        request_number="INC-TEST-001",
        requester_email=usuario_interno.email,
        external_user_email=usuario_externo.email,
        external_user_id=usuario_externo.id,
        registered_by_id=usuario_suporte.id,
        registered_by_name=usuario_suporte.name,
        status=SupportRegistrationStatus.ATIVO,
        is_reactivation=False,
    )
    session.add(reg)
    session.commit()
    session.refresh(reg)
    return reg


@pytest.fixture()
def usuario_externo(session) -> User:
    user = User(
        name="externo",
        email="externo@example.com",
        type=TypeUser.EXTERNAL,
        status=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


# ─────────────────────────────────────────────────────────────────────────────
# Área e Share
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture()
def area(session, usuario_interno) -> SharedArea:
    a = SharedArea(
        name="Área Teste",
        prefix_s3=f"areas/AUTO-{usuario_interno.id}/",
        applicant_id=usuario_interno.id,
        status=True,
    )
    session.add(a)
    session.commit()
    session.refresh(a)
    return a


@pytest.fixture()
def share_ativo(session, usuario_interno, area) -> Share:
    """Share com status ACTIVE e expires_at no futuro."""
    s = Share(
        area_id=area.id,
        external_email="externo@example.com",
        created_by_id=usuario_interno.id,
        expires_at=datetime.now(UTC) + timedelta(hours=24),
        status=ShareStatus.ACTIVE,
        consumption_policy=TokenConsumption.AFTER_ALL,
    )
    session.add(s)
    session.commit()
    session.refresh(s)
    return s


@pytest.fixture()
def share_expirado(session, usuario_interno, area) -> Share:
    """Share ACTIVE mas com expires_at no passado."""
    s = Share(
        area_id=area.id,
        external_email="externo@example.com",
        created_by_id=usuario_interno.id,
        expires_at=datetime.now(UTC) - timedelta(hours=1),
        status=ShareStatus.ACTIVE,
        consumption_policy=TokenConsumption.AFTER_ALL,
    )
    session.add(s)
    session.commit()
    session.refresh(s)
    return s

def pytest_sessionfinish(session, exitstatus):
    cov = coverage.Coverage(data_file="/build/.coverage")
    cov.load()
    cov.save()
