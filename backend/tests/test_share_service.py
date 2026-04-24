"""
Testes unitários do ShareService — usa SQLite em memória, sem AWS real.

Execução:
    pytest tests/test_share_service.py -v
"""

from __future__ import annotations

import os
import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

# Garante SQLite em memória e desativa chamadas AWS durante os testes
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("STORAGE_PROVIDER", "local")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")

from app.models.area import SharedArea
from app.models.restricted_file import RestrictedFile
from app.models.share import Share, TokenConsumption
from app.models.user import User, TypeUser
from app.services.share_service import _get_or_create_automatic_area


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture()
def engine():
    """Engine SQLite em memória com todas as tabelas criadas."""
    # Importa todos os modelos para garantir que as tabelas sejam registradas
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

    _engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(_engine)
    return _engine


@pytest.fixture()
def session(engine):
    """Sessão isolada por teste — rollback no teardown."""
    with Session(engine) as s:
        yield s


@pytest.fixture()
def usuario_interno(session) -> User:
    """Cria e persiste um usuário interno para uso nos testes."""
    user = User(
        name="Dev Interno",
        email="dev.interno@petrobras.com.br",
        type=TypeUser.INTERNAL,
        status=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


# ─────────────────────────────────────────────────────────────────────────────
# Testes
# ─────────────────────────────────────────────────────────────────────────────

class TestGetOrCreateAutomaticArea:
    def test_cria_area_se_nao_existe(self, session, usuario_interno):
        area = _get_or_create_automatic_area(session, applicant_id=usuario_interno.id)
        assert area.applicant_id == usuario_interno.id
        assert area.id is not None

    def test_retorna_mesma_area_na_segunda_chamada(self, session, usuario_interno):
        area1 = _get_or_create_automatic_area(session, applicant_id=usuario_interno.id)
        area2 = _get_or_create_automatic_area(session, applicant_id=usuario_interno.id)
        assert area1.id == area2.id

    def test_areas_distintas_para_usuarios_distintos(self, session, engine):
        """Dois usuários distintos devem ter áreas distintas."""
        with Session(engine) as s:
            u1 = User(name="User A", email="a@petrobras.com.br", type=TypeUser.INTERNAL, status=True)
            u2 = User(name="User B", email="b@petrobras.com.br", type=TypeUser.INTERNAL, status=True)
            s.add(u1); s.add(u2); s.commit()
            s.refresh(u1); s.refresh(u2)

            a1 = _get_or_create_automatic_area(s, applicant_id=u1.id)
            a2 = _get_or_create_automatic_area(s, applicant_id=u2.id)
            assert a1.id != a2.id
