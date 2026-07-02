"""
Testes das regras de negócio de ciclo de vida de compartilhamentos e usuários.

Cobre:
- has_auto_approve_job_title: detecção de cargos com aprovação automática
- ShareNoSupervisorError: bloqueio de criação de share sem supervisor
- deactivate_supervisor_if_no_pending: desativação de supervisor sem pendências
- deactivate_internal_if_all_shares_done: desativação de upload user sem atividade
- deactivate_external_if_no_active_share: desativação de externo sem share ativo

Execução:
    pytest tests/test_business_rules.py -v
"""

from __future__ import annotations

from datetime import datetime, timedelta, UTC

import pytest
from sqlmodel import Session

from app.models.share import Share, ShareStatus, TokenConsumption
from app.models.user import User, TypeUser
from app.services.share_service import (
    ShareNoSupervisorError,
    has_auto_approve_job_title,
)
from app.services.token_service import (
    deactivate_external_if_no_active_share,
    deactivate_internal_if_all_shares_done,
    deactivate_supervisor_if_no_pending,
)


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures locais
# ─────────────────────────────────────────────────────────────────────────────

def _make_user(
    session: Session,
    email: str,
    type: TypeUser = TypeUser.INTERNAL,
    is_supervisor: bool = False,
    is_admin: bool = False,
    job_title: str | None = None,
    manager_id: int | None = None,
    status: bool = True,
    login_cav4: str | None = None,
    employee_id: str | None = None,
) -> User:
    user = User(
        name=email.split("@")[0],
        email=email,
        type=type,
        is_supervisor=is_supervisor,
        is_admin=is_admin,
        job_title=job_title,
        manager_id=manager_id,
        status=status,
        login_cav4=login_cav4,
        employee_id=employee_id,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _make_share(
    session: Session,
    creator: User,
    external_email: str,
    status: ShareStatus = ShareStatus.PENDING,
    expires_at: datetime | None = None,
    recipient_user_id: int | None = None,
) -> Share:
    if expires_at is None:
        expires_at = datetime.now(UTC) + timedelta(hours=24)
    share = Share(
        external_email=external_email,
        created_by_id=creator.id,
        status=status,
        consumption_policy=TokenConsumption.AFTER_ALL,
        expiration_hours=24,
        expires_at=expires_at,
        recipient_user_id=recipient_user_id,
    )
    session.add(share)
    session.commit()
    session.refresh(share)
    return share


# ─────────────────────────────────────────────────────────────────────────────
# has_auto_approve_job_title
# ─────────────────────────────────────────────────────────────────────────────

class TestHasAutoApproveJobTitle:
    def test_retorna_false_sem_job_title(self, session):
        user = _make_user(session, "sem.cargo@p.com")
        assert has_auto_approve_job_title(user) is False

    def test_detecta_diretor_exato(self, session):
        user = _make_user(session, "dir@p.com", job_title="Diretor")
        assert has_auto_approve_job_title(user) is True

    def test_detecta_diretor_case_insensitive(self, session):
        user = _make_user(session, "dir2@p.com", job_title="DIRETOR")
        assert has_auto_approve_job_title(user) is True

    def test_detecta_diretor_com_acento(self, session):
        user = _make_user(session, "dir3@p.com", job_title="Diretora")
        assert has_auto_approve_job_title(user) is True

    def test_detecta_diretor_prefixo(self, session):
        """'Diretor de Operações' deve bater no prefixo 'diretor'."""
        user = _make_user(session, "dir4@p.com", job_title="Diretor de Operações")
        assert has_auto_approve_job_title(user) is True

    def test_detecta_presidente(self, session):
        user = _make_user(session, "pres@p.com", job_title="Presidente")
        assert has_auto_approve_job_title(user) is True

    def test_detecta_gerente_geral(self, session):
        user = _make_user(session, "gg@p.com", job_title="Gerente Geral")
        assert has_auto_approve_job_title(user) is True

    def test_nao_detecta_cargo_comum(self, session):
        user = _make_user(session, "ana@p.com", job_title="Analista de Sistemas")
        assert has_auto_approve_job_title(user) is False

    def test_nao_detecta_engenheiro(self, session):
        user = _make_user(session, "eng@p.com", job_title="Engenheiro Sênior")
        assert has_auto_approve_job_title(user) is False


# ─────────────────────────────────────────────────────────────────────────────
# ShareNoSupervisorError via create_share
# ─────────────────────────────────────────────────────────────────────────────

class TestShareNoSupervisorError:
    def test_cria_share_sem_supervisor_lanca_erro(self, session):
        """Usuário sem manager_id e sem cargo de auto-aprovação não pode criar share."""
        from app.models.area import SharedArea
        from app.services.share_service import create_share

        user = _make_user(session, "sem.gestor@p.com")
        area = SharedArea(
            name="Área Teste",
            prefix_s3="areas/TEST/",
            applicant_id=user.id,
            status=True,
        )
        session.add(area)
        session.commit()
        session.refresh(area)

        with pytest.raises(ShareNoSupervisorError):
            create_share(
                session=session,
                area_id=area.id,
                external_email="ext@example.com",
                created_by_id=user.id,
            )

    def test_admin_dispensa_supervisor(self, session):
        """Administrador pode criar share mesmo sem manager_id."""
        from app.models.area import SharedArea
        from app.services.share_service import create_share

        admin = _make_user(session, "admin@p.com", is_admin=True)
        area = SharedArea(
            name="Área Admin",
            prefix_s3=f"areas/AUTO-{admin.id}/",
            applicant_id=admin.id,
            status=True,
        )
        session.add(area)
        session.commit()
        session.refresh(area)

        # Não deve lançar exceção
        share = create_share(
            session=session,
            area_id=area.id,
            external_email="ext@example.com",
            created_by_id=admin.id,
        )
        assert share.id is not None

    def test_cargo_auto_aprovacao_dispensa_supervisor(self, session):
        """Usuário com cargo de aprovação automática não precisa de supervisor."""
        from app.models.area import SharedArea
        from app.services.share_service import create_share

        diretor = _make_user(session, "dir@p.com", job_title="Diretor")
        area = SharedArea(
            name="Área Dir",
            prefix_s3=f"areas/AUTO-{diretor.id}/",
            applicant_id=diretor.id,
            status=True,
        )
        session.add(area)
        session.commit()
        session.refresh(area)

        # Não deve lançar ShareNoSupervisorError
        share = create_share(
            session=session,
            area_id=area.id,
            external_email="ext@example.com",
            created_by_id=diretor.id,
        )
        assert share.id is not None


# ─────────────────────────────────────────────────────────────────────────────
# deactivate_supervisor_if_no_pending
# ─────────────────────────────────────────────────────────────────────────────

class TestDeactivateSupervisorIfNoPending:
    def test_desativa_supervisor_sem_pendencias(self, session):
        sup = _make_user(session, "sup@p.com", is_supervisor=True)
        result = deactivate_supervisor_if_no_pending(session, sup)
        assert result is True
        session.refresh(sup)
        assert sup.status is False
        assert sup.is_supervisor is False

    def test_mantem_supervisor_com_pendencias(self, session):
        sup = _make_user(session, "sup2@p.com", is_supervisor=True)
        subordinado = _make_user(session, "sub@p.com", manager_id=sup.id)
        _make_share(session, subordinado, "ext@example.com", status=ShareStatus.PENDING)

        result = deactivate_supervisor_if_no_pending(session, sup)
        assert result is False
        session.refresh(sup)
        assert sup.status is True
        assert sup.is_supervisor is True

    def test_ignora_usuario_nao_supervisor(self, session):
        user = _make_user(session, "normal@p.com", is_supervisor=False)
        result = deactivate_supervisor_if_no_pending(session, user)
        assert result is False

    def test_ignora_supervisor_ja_inativo(self, session):
        sup = _make_user(session, "sup3@p.com", is_supervisor=True, status=False)
        result = deactivate_supervisor_if_no_pending(session, sup)
        assert result is False

    def test_supervisor_com_share_nao_pendente_e_desativado(self, session):
        """Share ACTIVE (não PENDING) não bloqueia desativação do supervisor."""
        sup = _make_user(session, "sup4@p.com", is_supervisor=True)
        subordinado = _make_user(session, "sub2@p.com", manager_id=sup.id)
        _make_share(session, subordinado, "ext2@example.com", status=ShareStatus.ACTIVE)

        result = deactivate_supervisor_if_no_pending(session, sup)
        assert result is True

    def test_remove_papel_supervisor_quando_desativar(self, session, monkeypatch):
        sup = _make_user(
            session,
            "sup5@p.com",
            is_supervisor=True,
            login_cav4="SUP5",
            employee_id="SUP5",
        )
        captured: dict[str, str | None] = {}

        def _fake_remove_role(login: str, role_code: str, user_access_token: str | None = None):
            captured["login"] = login
            captured["role_code"] = role_code
            captured["token"] = user_access_token
            return True, "service_token"

        monkeypatch.setattr(
            "app.services.token_service.remove_role_from_user_with_fallback",
            _fake_remove_role,
        )

        result = deactivate_supervisor_if_no_pending(session, sup)

        assert result is True
        assert captured["login"] == "SUP5"
        assert captured["role_code"] == "CD_PAPEL_SUPERVISOR"

    def test_nao_remove_papel_supervisor_quando_flag_desligada(self, session, monkeypatch):
        sup = _make_user(session, "sup6@p.com", is_supervisor=True, login_cav4="SUP6")

        def _fail_if_called(*args, **kwargs):
            raise AssertionError("Nao deveria tentar remover papel CAV4 no job")

        monkeypatch.setattr(
            "app.services.token_service.remove_role_from_user_with_fallback",
            _fail_if_called,
        )

        result = deactivate_supervisor_if_no_pending(session, sup, remove_cav4_role=False)
        assert result is True


# ─────────────────────────────────────────────────────────────────────────────
# deactivate_internal_if_all_shares_done
# ─────────────────────────────────────────────────────────────────────────────

class TestDeactivateInternalIfAllSharesDone:
    def test_nao_desativa_sem_nenhum_share(self, session):
        """Usuário sem nenhum share criado não deve ser desativado (recém-provisionado)."""
        user = _make_user(session, "novo@p.com")
        result = deactivate_internal_if_all_shares_done(session, user)
        assert result is False

    def test_nao_desativa_com_share_pending(self, session):
        user = _make_user(session, "pending@p.com")
        _make_share(session, user, "ext@example.com", status=ShareStatus.PENDING)
        result = deactivate_internal_if_all_shares_done(session, user)
        assert result is False

    def test_nao_desativa_com_share_active_dentro_prazo(self, session):
        user = _make_user(session, "active@p.com")
        _make_share(
            session, user, "ext@example.com",
            status=ShareStatus.ACTIVE,
            expires_at=datetime.now(UTC) + timedelta(hours=1),
        )
        result = deactivate_internal_if_all_shares_done(session, user)
        assert result is False

    def test_desativa_quando_todos_shares_terminais(self, session):
        user = _make_user(session, "done@p.com")
        _make_share(session, user, "ext@example.com", status=ShareStatus.COMPLETED)
        _make_share(session, user, "ext2@example.com", status=ShareStatus.REJECTED)

        result = deactivate_internal_if_all_shares_done(session, user)
        assert result is True
        session.refresh(user)
        assert user.status is False

    def test_nao_desativa_admin(self, session):
        """Administradores nunca são desativados por este mecanismo."""
        admin = _make_user(session, "adm@p.com", is_admin=True)
        _make_share(session, admin, "ext@example.com", status=ShareStatus.COMPLETED)

        result = deactivate_internal_if_all_shares_done(session, admin)
        assert result is False

    def test_share_active_expirado_e_considerado_terminal(self, session):
        """Share ACTIVE com expires_at no passado é considerado terminal (não bloqueia)."""
        user = _make_user(session, "exp@p.com")
        _make_share(
            session, user, "ext@example.com",
            status=ShareStatus.ACTIVE,
            expires_at=datetime.now(UTC) - timedelta(hours=1),  # passado
        )
        result = deactivate_internal_if_all_shares_done(session, user)
        assert result is True

    def test_remove_papel_usuario_quando_desativar(self, session, monkeypatch):
        user = _make_user(session, "upload@p.com", login_cav4="UP1", employee_id="UP1")
        _make_share(session, user, "ext@example.com", status=ShareStatus.COMPLETED)
        captured: dict[str, str | None] = {}

        def _fake_remove_role(login: str, role_code: str, user_access_token: str | None = None):
            captured["login"] = login
            captured["role_code"] = role_code
            captured["token"] = user_access_token
            return True, "service_token"

        monkeypatch.setattr(
            "app.services.token_service.remove_role_from_user_with_fallback",
            _fake_remove_role,
        )

        result = deactivate_internal_if_all_shares_done(session, user)

        assert result is True
        assert captured["login"] == "UP1"
        assert captured["role_code"] == "CD_PAPEL_USUARIO"

    def test_nao_remove_papel_usuario_quando_flag_desligada(self, session, monkeypatch):
        user = _make_user(session, "upload2@p.com", login_cav4="UP2")
        _make_share(session, user, "ext@example.com", status=ShareStatus.COMPLETED)

        def _fail_if_called(*args, **kwargs):
            raise AssertionError("Nao deveria tentar remover papel CAV4 no job")

        monkeypatch.setattr(
            "app.services.token_service.remove_role_from_user_with_fallback",
            _fail_if_called,
        )

        result = deactivate_internal_if_all_shares_done(session, user, remove_cav4_role=False)
        assert result is True


# ─────────────────────────────────────────────────────────────────────────────
# deactivate_external_if_no_active_share
# ─────────────────────────────────────────────────────────────────────────────

class TestDeactivateExternalIfNoActiveShare:
    def test_desativa_externo_sem_share_ativo(self, session):
        user = _make_user(session, "ext@example.com", type=TypeUser.EXTERNAL)
        result = deactivate_external_if_no_active_share(session, user)
        assert result is True
        session.refresh(user)
        assert user.status is False

    def test_mantem_externo_com_share_ativo(self, session):
        interno = _make_user(session, "int@p.com")
        ext = _make_user(session, "ext2@example.com", type=TypeUser.EXTERNAL)
        _make_share(
            session, interno, ext.email,
            status=ShareStatus.ACTIVE,
            expires_at=datetime.now(UTC) + timedelta(hours=1),
            recipient_user_id=ext.id,
        )

        result = deactivate_external_if_no_active_share(session, ext)
        assert result is False
        session.refresh(ext)
        assert ext.status is True

    def test_ignora_usuario_interno(self, session):
        user = _make_user(session, "int2@p.com", type=TypeUser.INTERNAL)
        result = deactivate_external_if_no_active_share(session, user)
        assert result is False
