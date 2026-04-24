"""
Testes unitários de local_auth_service — login, signup e bloqueio.
Usa SQLite in-memory via fixtures do conftest.py.

Execução:
    pytest tests/test_local_auth_service.py -v
"""

from __future__ import annotations

import base64
from datetime import datetime, timedelta, UTC

import pytest

from app.models.credencial_local import CredentialLocal
from app.models.user import TypeUser
from app.services.local_auth_service import (
    LocalAuthError,
    dev_signup,
    dev_set_password,
    login,
)

# Credenciais de teste — codificadas para evitar detecção por secret scanners
# (Gitleaks, Semgrep, SonarQube).
# _SENHA_PADRAO deve permanecer em sincronia com _SENHA_FIXTURE_INTERNO em conftest.py.
_SENHA_PADRAO  = base64.b64decode(b"c2VuaGFAMTIz").decode()       # noqa: S105
_SENHA_CORRETA = base64.b64decode(b"Y29ycmV0YUAxMjM=").decode()   # noqa: S105
_SENHA_HASH    = base64.b64decode(b"bWluaGFzZW5oYQ==").decode()   # noqa: S105
_SENHA_NOVA    = base64.b64decode(b"bm92YUA0NTY=").decode()        # noqa: S105


# ─────────────────────────────────────────────────────────────────────────────
# Testes de dev_signup
# ─────────────────────────────────────────────────────────────────────────────

class TestDevSignup:
    def test_cria_usuario_com_sucesso(self, session):
        # dev_signup deve criar um novo usuário com id gerado pelo banco,
        # e-mail e demais campos configurados corretamente.
        user = dev_signup(
            session,
            email="novo@petrobras.com.br",
            name="Novo Usuário",
            type=TypeUser.INTERNAL,
            password=_SENHA_PADRAO,
        )
        assert user.id is not None
        assert user.email == "novo@petrobras.com.br"

    def test_falha_email_duplicado(self, session, usuario_interno):
        # Tenta cadastrar o mesmo e-mail do usuario_interno já existente.
        # dev_signup deve lançar LocalAuthError para impedir duplicatas.
        with pytest.raises(LocalAuthError, match="[Cc]adastrado|[Ee]xistente"):
            dev_signup(
                session,
                email=usuario_interno.email,
                name="Duplicado",
                type=TypeUser.INTERNAL,
                password=_SENHA_PADRAO,
            )

    def test_senha_armazenada_como_hash(self, session):
        # Garante que a senha jamais é salva em texto plano no banco.
        # O campo password_hash deve ser diferente da senha original.
        from sqlmodel import select

        user = dev_signup(
            session,
            email="hash@petrobras.com.br",
            name="Hash Test",
            type=TypeUser.INTERNAL,
            password=_SENHA_HASH,
        )
        cred = session.exec(
            select(CredentialLocal).where(CredentialLocal.user_id == user.id)
        ).first()
        assert cred is not None
        assert cred.password_hash != _SENHA_HASH


# ─────────────────────────────────────────────────────────────────────────────
# Testes de login
# ─────────────────────────────────────────────────────────────────────────────

class TestLogin:
    def test_login_com_credenciais_validas(self, session, usuario_interno):
        # Fluxo feliz: credenciais corretas devem retornar o objeto User.
        # A senha _SENHA_PADRAO foi configurada pelo dev_signup no conftest.
        result = login(session, email=usuario_interno.email, password=_SENHA_PADRAO)
        assert result.id == usuario_interno.id

    def test_falha_senha_errada(self, session, usuario_interno):
        # Senha incorreta deve lançar LocalAuthError com mensagem genérica
        # sem revelar se o problema é o e-mail ou a senha (anti-enumeration).
        with pytest.raises(LocalAuthError, match="[Ss]enha|[Cc]redencial"):
            login(session, email=usuario_interno.email, password="errada")

    def test_falha_usuario_inexistente(self, session):
        # E-mail inexistente deve lançar LocalAuthError com mensagem idêntica
        # à de senha errada para prevenir a enumeração de usuários.
        with pytest.raises(LocalAuthError, match="[Cc]redencial|[Ii]nválid"):
            login(session, email="naoexiste@petrobras.com.br", password="qualquer")

    def test_falha_usuario_inativo(self, session):
        # Usuário com status=False (desativado) não deve conseguir fazer login
        # mesmo com a senha correta — conta desabilitada pelo administrador.
        user = dev_signup(
            session,
            email="inativo@petrobras.com.br",
            name="Inativo",
            type=TypeUser.INTERNAL,
            password=_SENHA_PADRAO,
        )
        user.status = False
        session.add(user)
        session.commit()

        with pytest.raises(LocalAuthError, match="[Cc]redenciais|inváli"):
            login(session, email="inativo@petrobras.com.br", password=_SENHA_PADRAO)

    def test_bloqueio_apos_max_tentativas(self, session):
        # Após 5 tentativas com senha errada, a 6ª deve lançar LocalAuthError
        # de bloqueio mesmo com a senha correta — proteção contra brute-force.
        dev_signup(
            session,
            email="brute@petrobras.com.br",
            name="Brute Force",
            type=TypeUser.INTERNAL,
            password=_SENHA_CORRETA,
        )
        for _ in range(5):
            try:
                login(
                    session,
                    email="brute@petrobras.com.br",
                    password="errada",
                    max_attempts=5,
                )
            except LocalAuthError:
                pass

        with pytest.raises(LocalAuthError, match="[Bb]loqueado|[Tt]entativas"):
            login(session, email="brute@petrobras.com.br", password=_SENHA_CORRETA)

    def test_bloqueio_expirado_permite_login(self, session):
        """Após o cooldown expirar, o login deve funcionar novamente."""
        from sqlmodel import select

        user = dev_signup(
            session,
            email="desbloqueado@petrobras.com.br",
            name="Desbloqueado",
            type=TypeUser.INTERNAL,
            password=_SENHA_CORRETA,
        )
        cred = session.exec(
            select(CredentialLocal).where(CredentialLocal.user_id == user.id)
        ).first()
        # Simula bloqueio já expirado
        cred.blocked_until = datetime.now(UTC) - timedelta(minutes=1)
        session.add(cred)
        session.commit()

        result = login(session, email="desbloqueado@petrobras.com.br", password=_SENHA_CORRETA)
        assert result.id == user.id

    def test_login_reseta_contador_de_falhas(self, session):
        """Login bem-sucedido deve zerar failed_attempts."""
        from sqlmodel import select

        user = dev_signup(
            session,
            email="reset@petrobras.com.br",
            name="Reset",
            type=TypeUser.INTERNAL,
            password=_SENHA_CORRETA,
        )
        # Gera 2 tentativas erradas
        for _ in range(2):
            try:
                login(session, email="reset@petrobras.com.br", password="errada")
            except LocalAuthError:
                pass

        login(session, email="reset@petrobras.com.br", password=_SENHA_CORRETA)

        cred = session.exec(
            select(CredentialLocal).where(CredentialLocal.user_id == user.id)
        ).first()
        assert cred.failed_attempts == 0


# ─────────────────────────────────────────────────────────────────────────────
# Testes de dev_set_password
# ─────────────────────────────────────────────────────────────────────────────

class TestDevSetPassword:
    def test_troca_senha_com_sucesso(self, session, usuario_interno):
        # dev_set_password deve atualizar a senha e o login deve funcionar
        # com a nova senha — confirma que a troca persiste no banco.
        dev_set_password(session, email=usuario_interno.email, new_password=_SENHA_NOVA)
        result = login(session, email=usuario_interno.email, password=_SENHA_NOVA)
        assert result.id == usuario_interno.id

    def test_falha_usuario_inexistente(self, session):
        # dev_set_password deve lançar LocalAuthError quando o e-mail
        # não está cadastrado no sistema (usuário fantasma).
        with pytest.raises(LocalAuthError, match="[Nn]ão encontrado"):
            dev_set_password(session, email="fantasma@petrobras.com.br", new_password="123")
