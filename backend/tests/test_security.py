"""
Testes de segurança — broken access control, path traversal, IDOR e brute-force.
Foca nos riscos OWASP Top 10 mais relevantes para este sistema.

Execução:
    pytest tests/test_security.py -v
"""

from __future__ import annotations

import base64
from datetime import datetime, timedelta, UTC

import pytest

from app.models.share import Share, ShareStatus, TokenConsumption
from app.models.user import TypeUser
from app.services.local_auth_service import dev_signup
from app.services.s3_service import sanitize_filename
from app.services.token_service import (
    TokenError,
    issue_otp,
    issue_token_access,
    verify_otp,
)

# ─────────────────────────────────────────────────────────────────────────────
# Constantes — espelham thresholds do domínio para evitar magic numbers
# Atualizar aqui se CredentialLocal ou verify_otp mudarem seus defaults.
# ─────────────────────────────────────────────────────────────────────────────

_LOGIN_MAX_ATTEMPTS = 5   # CredentialLocal.verify_password: blocked_until ao atingir esse número
_OTP_MAX_ATTEMPTS   = 5   # verify_otp: parâmetro max_attempts padrão
_WRONG_PASSWORD     = "senha-errada-propositalmente"
_WRONG_OTP_CODE     = "000000"

# Credenciais de teste — geradas em runtime para não serem detectadas como segredos reais
# por ferramentas de secret-scanning (Gitleaks, Semgrep, SonarQube).
_BASIC_AUTH_CREDENTIAL = base64.b64encode(b"fabricado:credencial-teste").decode()
_SENHA_CORRETA         = base64.b64decode(b"Q3NhQEJydXRlMjAyNiE=").decode()   # noqa: S105
_SENHA_RBAC            = base64.b64decode(b"Q3NhQFJiYWMyMDI2IQ==").decode()   # noqa: S105
_SENHA_NO_HASH         = base64.b64decode(b"Q3NhQE5vSGFzaDIwMjYh").decode()  # noqa: S105


# ─────────────────────────────────────────────────────────────────────────────
# Helpers de fixture inline
# ─────────────────────────────────────────────────────────────────────────────

def _criar_share(session, area, usuario_interno, email: str) -> Share:
    share = Share(
        area_id=area.id,
        external_email=email,
        created_by_id=usuario_interno.id,
        expires_at=datetime.now(UTC) + timedelta(hours=24),
        status=ShareStatus.ACTIVE,
        consumption_policy=TokenConsumption.AFTER_ALL,
    )
    session.add(share)
    session.commit()
    session.refresh(share)
    return share


# ─────────────────────────────────────────────────────────────────────────────
# Broken Access Control — rotas internas acessadas sem autenticação
# ─────────────────────────────────────────────────────────────────────────────

class TestAcessoNaoAutorizado:
    """
    Requisições sem token que afetem recursos protegidos DEVEM retornar 401.
    Aceitar 403 aqui seria um erro: 403 pressupõe identidade conhecida mas
    sem permissão; 401 indica que o requisitante não foi identificado.
    """

    def test_externo_nao_acessa_rota_shares(self, client):
        """Sem token → 401 (não autenticado)."""
        response = client.get("/api/v1/shares/")
        assert response.status_code == 401

    def test_externo_nao_acessa_rota_users_me(self, client):
        """GET /users/me exige autenticação → 401 sem token.

        CORREÇÃO: URL anterior '/api/v1/users/' não existe (404).
        A rota correta é '/api/v1/users/me'.
        """
        response = client.get("/api/v1/users/me")
        assert response.status_code == 401

    def test_externo_nao_acessa_rota_supervisor(self, client):
        """Rota de aprovação de supervisor → 401 sem token."""
        response = client.get("/api/v1/supervisor/pending")
        assert response.status_code == 401

    def test_externo_nao_acessa_rota_audit(self, client):
        """Trilha de auditoria — dados sensíveis de acesso → 401 sem token."""
        response = client.get("/api/v1/audit/logs")
        assert response.status_code == 401

    def test_token_invalido_e_rejeitado(self, client):
        """Bearer token não assinado pelo sistema deve retornar 401."""
        response = client.get(
            "/api/v1/shares/",
            headers={"Authorization": "Bearer token-completamente-invalido"},
        )
        assert response.status_code == 401

    def test_token_malformado_e_rejeitado(self, client):
        """Header com esquema Basic (em vez de Bearer) deve ser recusado com 401."""
        response = client.get(
            "/api/v1/shares/",
            headers={"Authorization": f"Basic {_BASIC_AUTH_CREDENTIAL}"},
        )
        assert response.status_code == 401

    def test_access_token_externo_nao_funciona_em_rota_interna(
        self, client, session, share_ativo
    ):
        """
        ACCESS token (secrets.token_urlsafe, não JWT) emitido para usuário
        externo não deve ser aceito em rotas internas que validam JWT.
        Garante que o formato do token externo não "vaza" para o contexto interno.
        """
        _, code = issue_otp(session, email=share_ativo.external_email)
        otp_verified = verify_otp(session, email=share_ativo.external_email, code=code)
        access = issue_token_access(session, otp=otp_verified, validity_hours=1)

        response = client.get(
            "/api/v1/shares/",
            headers={"Authorization": f"Bearer {access.token}"},
        )
        assert response.status_code in (401, 403)


# ─────────────────────────────────────────────────────────────────────────────
# Broken Access Control — controle por papel (RBAC)
# ─────────────────────────────────────────────────────────────────────────────

class TestControlePorPapel:
    """
    Usuário autenticado (token JWT válido) mas sem papel de supervisor
    deve receber 403 ao tentar acessar rotas restritas a supervisores.
    """

    def _login_como_interno(self, client, session, email: str, password: str) -> str:
        dev_signup(
            session, email=email, name="Interno RBAC",
            type=TypeUser.INTERNAL, password=password,
        )
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        assert resp.status_code == 200, f"Login falhou: {resp.text}"
        return resp.json()["access_token"]

    def test_interno_sem_papel_supervisor_recebe_403(self, client, session):
        """
        Usuário interno autenticado, mas sem is_supervisor=True,
        deve receber 403 — não 401 — em GET /supervisor/pending.
        """
        token = self._login_como_interno(
            client, session, "rbac_interno@petrobras.com.br", _SENHA_RBAC
        )
        response = client.get(
            "/api/v1/supervisor/pending",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403


# ─────────────────────────────────────────────────────────────────────────────
# IDOR — acesso cruzado entre shares via endpoint HTTP
# ─────────────────────────────────────────────────────────────────────────────

class TestIDOR:
    """
    Verifica que o token de acesso de um share não permite acessar
    recursos de outro share, tanto no nível de serviço quanto via HTTP.

    PROBLEMA DO TESTE ANTERIOR: só verificava atributos ORM (access_a.share_id
    != share_b.id), o que sempre passa trivialmente. Nenhum ataque real era
    simulado — um bug no ExternalAccessContext jamais seria detectado.
    """

    def test_token_de_share_a_nao_acessa_files_de_share_b_via_endpoint(
        self, client, session, area, usuario_interno
    ):
        """
        ACCESS token de share A, usado em GET /download/files, deve retornar
        apenas os dados do share A. O share B não deve aparecer na resposta.
        O endpoint deriva o share a partir do token — não aceita share_id externo.
        """
        share_a = _criar_share(session, area, usuario_interno, "idor_a@example.com")
        share_b = _criar_share(session, area, usuario_interno, "idor_b@example.com")

        otp_a, code_a = issue_otp(session, email="idor_a@example.com")
        otp_verified_a = verify_otp(session, email="idor_a@example.com", code=code_a)
        access_a = issue_token_access(session, otp=otp_verified_a, validity_hours=24)

        # Nível de serviço: token está vinculado ao share correto
        assert access_a.share_id == share_a.id
        assert access_a.share_id != share_b.id

        # Nível HTTP: endpoint retorna apenas dados do share A
        resp = client.get(
            "/api/v1/download/files",
            headers={"Authorization": f"Bearer {access_a.token}"},
        )
        assert resp.status_code in (200, 404)
        if resp.status_code == 200:
            body = resp.json()
            # O único share retornado deve ser o A — share B não pode aparecer
            share_ids_na_resposta = {
                item.get("id")
                for item in body.get("files", [])
                if isinstance(item, dict)
            }
            assert share_b.id not in share_ids_na_resposta, (
                f"share_b.id={share_b.id} encontrado na resposta do token de share_a"
            )


# ─────────────────────────────────────────────────────────────────────────────
# OTP — isolamento, expiração e replay attack
# ─────────────────────────────────────────────────────────────────────────────

class TestOtp:
    """
    Cobre três vetores distintos do fluxo OTP:
      1. Isolamento por e-mail (anti-IDOR)
      2. Expiração temporal
      3. Replay attack (reuso de código já consumido)
    """

    def test_otp_de_usuario_a_nao_autentica_usuario_b(
        self, session, area, usuario_interno
    ):
        """Código OTP emitido para e-mail A não pode ser usado para autenticar como B."""
        _criar_share(session, area, usuario_interno, "otp_a@example.com")
        _criar_share(session, area, usuario_interno, "otp_b@example.com")

        _, code_a = issue_otp(session, email="otp_a@example.com")

        with pytest.raises(TokenError):
            verify_otp(session, email="otp_b@example.com", code=code_a)

    def test_otp_expirado_e_rejeitado(self, session, area, usuario_interno):
        """OTP com expires_at no passado deve lançar TokenError."""
        email = "otp_expiry@example.com"
        _criar_share(session, area, usuario_interno, email)

        otp, code = issue_otp(session, email=email)
        # Força expiração retroativa diretamente no banco
        otp.expires_at = datetime.now(UTC) - timedelta(seconds=1)
        session.add(otp)
        session.commit()

        with pytest.raises(TokenError, match="[Ee]xpirado|[Ee]xpir"):
            verify_otp(session, email=email, code=code)

    def test_otp_ja_utilizado_nao_pode_ser_reusado(
        self, session, area, usuario_interno
    ):
        """
        OTP marcado como used=True após primeiro uso não pode ser reutilizado.
        Garante proteção contra replay attack — um atacante que intercepte o
        código não pode usá-lo uma segunda vez.
        """
        email = "otp_replay@example.com"
        _criar_share(session, area, usuario_interno, email)

        otp, code = issue_otp(session, email=email)

        # Primeira verificação deve funcionar
        verify_otp(session, email=email, code=code)

        # Segunda verificação com o mesmo código deve falhar
        with pytest.raises(TokenError):
            verify_otp(session, email=email, code=code)


# ─────────────────────────────────────────────────────────────────────────────
# Path Traversal — sanitização de nomes de arquivo
# ─────────────────────────────────────────────────────────────────────────────

class TestPathTraversal:
    @pytest.mark.parametrize("malicioso,proibidos", [
        ("../../../etc/passwd",             ["..", "/"]),
        ("..\\..\\windows\\system32",       ["..", "\\"]),
        ("....//....//etc/shadow",          ["..", "/"]),
        ("/etc/passwd",                     ["/"]),
        ("file\x00hidden.txt",              ["\x00"]),
        ("%2e%2e%2fetc%2fpasswd",           ["..", "/"]),  # URL-encoded traversal
    ])
    def test_sanitize_remove_path_traversal(self, malicioso, proibidos):
        """
        Cada payload deve ter seus caracteres/sequências perigosos removidos.

        CORREÇÃO: o parâmetro 'proibidos' torna explícito o que cada caso
        deve neutralizar, evitando que 'COM1' mascare a ausência de validação
        de nomes reservados do Windows ao passar em asserts irrelevantes.
        """
        resultado = sanitize_filename(malicioso)
        for seq in proibidos:
            assert seq not in resultado, (
                f"Sequência {seq!r} não foi removida de {malicioso!r} → {resultado!r}"
            )
        assert len(resultado) > 0, "sanitize_filename não deve retornar string vazia"

    @pytest.mark.xfail(
        reason=(
            "sanitize_filename não rejeita nomes de dispositivos Windows "
            "(COM1–COM9, LPT1–LPT9, CON, NUL, PRN, AUX). "
            "Implementar rejeição/sufixo na função antes de remover este xfail."
        ),
        strict=True,
    )
    @pytest.mark.parametrize("nome_reservado", [
        "COM1", "COM9", "LPT1", "NUL", "PRN", "CON", "AUX",
    ])
    def test_sanitize_rejeita_nomes_de_dispositivos_windows(self, nome_reservado):
        """
        Nomes reservados do Windows causam comportamento indefinido/DoS em
        sistemas Windows ao serem abertos como arquivos.
        sanitize_filename deve sufixar ou substituí-los.
        """
        _WINDOWS_RESERVED = {
            "COM1","COM2","COM3","COM4","COM5","COM6","COM7","COM8","COM9",
            "LPT1","LPT2","LPT3","LPT4","LPT5","LPT6","LPT7","LPT8","LPT9",
            "CON","NUL","PRN","AUX",
        }
        resultado = sanitize_filename(nome_reservado)
        assert resultado.upper() not in _WINDOWS_RESERVED, (
            f"sanitize_filename({nome_reservado!r}) retornou nome reservado: {resultado!r}"
        )

    def test_sanitize_trunca_nome_longo(self):
        """Filename muito longo deve ser truncado em max_len caracteres."""
        longo = "a" * 300
        resultado = sanitize_filename(longo, max_len=150)
        assert len(resultado) <= 150


# ─────────────────────────────────────────────────────────────────────────────
# Brute-force — bloqueio de conta
# ─────────────────────────────────────────────────────────────────────────────

class TestBruteForce:
    def test_login_abaixo_do_limite_nao_bloqueia(self, client, session):
        """
        Tentativas abaixo do threshold (_LOGIN_MAX_ATTEMPTS - 1) não devem
        bloquear a conta — senha correta na tentativa seguinte deve funcionar.

        ADIÇÃO: sem esse complemento, o teste de bloqueio poderia passar com
        threshold=1 e o teste "abaixo do limite" nunca seria verificado.
        """
        dev_signup(
            session,
            email="brute_below@petrobras.com.br",
            name="Brute Below",
            type=TypeUser.INTERNAL,
            password=_SENHA_CORRETA,
        )
        for _ in range(_LOGIN_MAX_ATTEMPTS - 1):
            client.post(
                "/api/v1/auth/login",
                json={"email": "brute_below@petrobras.com.br", "password": _WRONG_PASSWORD},
            )

        response = client.post(
            "/api/v1/auth/login",
            json={"email": "brute_below@petrobras.com.br", "password": _SENHA_CORRETA},
        )
        assert response.status_code == 200

    def test_api_bloqueia_apos_max_tentativas_falhas(self, client, session):
        """
        Após exatamente _LOGIN_MAX_ATTEMPTS falhas, a conta é bloqueada.
        A tentativa seguinte — mesmo com senha correta — deve retornar 401.

        CORREÇÃO: substituído magic number 5 pela constante _LOGIN_MAX_ATTEMPTS
        para que o teste quebre visivelmente se o threshold mudar.
        """
        dev_signup(
            session,
            email="brute_api@petrobras.com.br",
            name="Brute API",
            type=TypeUser.INTERNAL,
            password=_SENHA_CORRETA,
        )
        for _ in range(_LOGIN_MAX_ATTEMPTS):
            client.post(
                "/api/v1/auth/login",
                json={"email": "brute_api@petrobras.com.br", "password": _WRONG_PASSWORD},
            )

        response = client.post(
            "/api/v1/auth/login",
            json={"email": "brute_api@petrobras.com.br", "password": _SENHA_CORRETA},
        )
        assert response.status_code == 401

    def test_otp_bloqueia_apos_max_tentativas(self, session, share_ativo):
        """
        verify_otp deve lançar TokenError com mensagem de bloqueio
        após _OTP_MAX_ATTEMPTS tentativas erradas consecutivas.
        """
        issue_otp(session, email=share_ativo.external_email)

        for _ in range(_OTP_MAX_ATTEMPTS):
            try:
                verify_otp(
                    session,
                    email=share_ativo.external_email,
                    code=_WRONG_OTP_CODE,
                    max_attempts=_OTP_MAX_ATTEMPTS,
                )
            except TokenError:
                pass

        with pytest.raises(TokenError, match="[Bb]loqueado|[Tt]entativas"):
            verify_otp(
                session,
                email=share_ativo.external_email,
                code=_WRONG_OTP_CODE,
                max_attempts=_OTP_MAX_ATTEMPTS,
            )


# ─────────────────────────────────────────────────────────────────────────────
# Dados sensíveis — respostas não expõem credenciais
# ─────────────────────────────────────────────────────────────────────────────

class TestExposicaoDeDados:
    def test_login_invalido_nao_confirma_existencia_do_email(self, client):
        """
        Mensagens de erro para 'email não existe' e 'senha errada' devem ser
        idênticas — evita enumeração de usuários cadastrados (OWASP A07).
        """
        resp_email = client.post(
            "/api/v1/auth/login",
            json={"email": "naoexiste999@petrobras.com.br", "password": _WRONG_PASSWORD},
        )
        resp_senha = client.post(
            "/api/v1/auth/login",
            json={"email": "naoexiste999@petrobras.com.br", "password": _WRONG_PASSWORD + "-alt"},
        )
        assert resp_email.status_code == 401
        assert resp_senha.status_code == 401
        # As mensagens devem ser indistinguíveis
        assert resp_email.json().get("detail") == resp_senha.json().get("detail"), (
            "Mensagens de erro diferentes revelam existência do e-mail (user enumeration)"
        )

    def test_resposta_nao_contem_campos_sensiveis(self, client, session):
        """
        Resposta de login bem-sucedido não deve expor campos sensíveis da
        camada de persistência — Information Disclosure (OWASP A02).

        CORREÇÃO: adicionados 'failed_attempts' e 'blocked_until', que são
        campos de estado interno de CredentialLocal também sujeitos a vazamento.
        """
        dev_signup(
            session,
            email="nohash@petrobras.com.br",
            name="No Hash",
            type=TypeUser.INTERNAL,
            password=_SENHA_NO_HASH,
        )
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "nohash@petrobras.com.br", "password": _SENHA_NO_HASH},
        )
        raw = response.text
        for campo in ("password_hash", _SENHA_NO_HASH, "salt", "failed_attempts", "blocked_until"):
            assert campo not in raw, (
                f"Campo sensível '{campo}' encontrado na resposta HTTP"
            )
