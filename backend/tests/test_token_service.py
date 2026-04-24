"""
Testes unitários de token_service — OTP e ACCESS.
Usa SQLite in-memory via fixtures do conftest.py.

Execução:
    pytest tests/test_token_service.py -v
"""

from __future__ import annotations

from datetime import datetime, timedelta, UTC

import pytest
from app.models.share import Share, ShareStatus, TokenConsumption
from app.models.token_access import TypeToken
from app.models.user import TypeUser
from app.services.token_service import (
    TokenError,
    issue_otp,
    issue_token_access,
    verify_otp,
)


# ─────────────────────────────────────────────────────────────────────────────
# Testes de issue_otp
# ─────────────────────────────────────────────────────────────────────────────

class TestIssueOtp:
    def test_emite_otp_com_share_ativo(self, session, share_ativo):
        # Verifica o fluxo base: issue_otp deve retornar um TokenAccess do tipo OTP
        # e um código numérico de 6 dígitos quando há share ACTIVE para o e-mail.
        otp, code = issue_otp(session, email=share_ativo.external_email)

        assert otp is not None
        assert otp.type == TypeToken.OTP
        assert otp.used is False
        assert otp.share_id == share_ativo.id
        assert len(code) == 6
        assert code.isdigit()

    def test_falha_sem_share_ativo(self, session):
        # issue_otp deve lançar TokenError quando não há share ACTIVE para o e-mail.
        # O acesso externo depende obrigatoriamente de um share aprovado.
        with pytest.raises(TokenError, match="compartilhamento ativo"):
            issue_otp(session, email="semshare@example.com")

    def test_falha_com_share_expirado(self, session, share_expirado):
        # Share com expires_at no passado não é considerado ativo mesmo com status ACTIVE.
        # issue_otp deve lançar TokenError para bloquear o acesso ao conteúdo expirado.
        with pytest.raises(TokenError, match="compartilhamento ativo"):
            issue_otp(session, email=share_expirado.external_email)

    def test_falha_com_share_cancelado(self, session, area, usuario_interno):
        # Share com status CANCELED não deve gerar OTP — o fluxo só funciona
        # quando o share está ACTIVE e dentro do prazo de validade.
        share = Share(
            area_id=area.id,
            external_email="cancelado@example.com",
            created_by_id=usuario_interno.id,
            expires_at=datetime.now(UTC) + timedelta(hours=24),
            status=ShareStatus.CANCELED,
            consumption_policy=TokenConsumption.AFTER_ALL,
        )
        session.add(share)
        session.commit()

        with pytest.raises(TokenError, match="compartilhamento ativo"):
            issue_otp(session, email="cancelado@example.com")

    def test_usuario_externo_criado_automaticamente(self, session, share_ativo):
        """issue_otp deve criar o usuário EXTERNAL se não existir."""
        from sqlmodel import select
        from app.models.user import User

        issue_otp(session, email=share_ativo.external_email)

        user = session.exec(
            select(User).where(User.email == share_ativo.external_email)
        ).first()
        assert user is not None
        assert user.type == TypeUser.EXTERNAL

    def test_validade_do_otp(self, session, share_ativo):
        # Verifica que expires_at do OTP é calculado corretamente com base
        # no parâmetro validity_minutes. Margem de ±10s para tempo de execução.
        otp, _ = issue_otp(session, email=share_ativo.external_email, validity_minutes=5)
        delta = otp.expires_at.replace(tzinfo=UTC) - datetime.now(UTC)
        # Deve expirar em aprox. 5 minutos
        assert timedelta(minutes=4, seconds=50) <= delta <= timedelta(minutes=5, seconds=10)


# ─────────────────────────────────────────────────────────────────────────────
# Testes de verify_otp
# ─────────────────────────────────────────────────────────────────────────────

class TestVerifyOtp:
    def test_verifica_otp_correto(self, session, share_ativo):
        # Fluxo feliz: OTP emitido e verificado com o código correto.
        # Após verificação bem-sucedida o campo `used` deve ser marcado True.
        otp, code = issue_otp(session, email=share_ativo.external_email)
        result = verify_otp(session, email=share_ativo.external_email, code=code)
        assert result.id == otp.id
        assert result.used is True

    def test_falha_com_codigo_errado(self, session, share_ativo):
        # Código OTP incorreto deve lançar TokenError.
        # "000000" é improvável de ser o código gerado aleatoriamente.
        issue_otp(session, email=share_ativo.external_email)
        with pytest.raises(TokenError, match="[Ii]nválido|[Ii]ncorreto|incorreto"):
            verify_otp(session, email=share_ativo.external_email, code="000000")

    def test_bloqueio_apos_max_tentativas(self, session, share_ativo):
        # Após 5 tentativas erradas consecutivas, verify_otp deve lançar
        # TokenError de bloqueio — proteção contra brute-force de OTP.
        issue_otp(session, email=share_ativo.external_email)
        for _ in range(5):
            try:
                verify_otp(
                    session,
                    email=share_ativo.external_email,
                    code="000000",
                    max_attempts=5,
                )
            except TokenError:
                pass

        with pytest.raises(TokenError, match="[Bb]loqueado|[Tt]entativas"):
            verify_otp(session, email=share_ativo.external_email, code="000000")

    def test_otp_expirado_nao_aceito(self, session, share_ativo):
        # OTP com expires_at no passado não deve ser aceito mesmo com o código correto.
        # A expiração é forçada manualmente reescrevendo o campo no banco.
        otp, code = issue_otp(session, email=share_ativo.external_email, validity_minutes=1)
        # Força expiracão
        otp.expires_at = datetime.now(UTC) - timedelta(minutes=2)
        session.add(otp)
        session.commit()

        with pytest.raises(TokenError, match="[Ee]xpirado"):
            verify_otp(session, email=share_ativo.external_email, code=code)

    def test_otp_ja_usado_nao_pode_ser_reutilizado(self, session, share_ativo):
        # Garante que cada OTP é de uso único: após a primeira verificação
        # bem-sucedida o mesmo código não deve ser aceito novamente.
        otp, code = issue_otp(session, email=share_ativo.external_email)
        verify_otp(session, email=share_ativo.external_email, code=code)

        with pytest.raises(TokenError):
            verify_otp(session, email=share_ativo.external_email, code=code)


# ─────────────────────────────────────────────────────────────────────────────
# Testes de issue_token_access
# ─────────────────────────────────────────────────────────────────────────────

class TestIssueTokenAccess:
    def test_emite_access_apos_otp_valido(self, session, share_ativo):
        # Fluxo completo: OTP emitido → verificado → ACCESS emitido.
        # O token ACCESS deve ter valor não-nulo e estar vinculado ao mesmo share do OTP.
        otp, code = issue_otp(session, email=share_ativo.external_email)
        otp_verified = verify_otp(session, email=share_ativo.external_email, code=code)
        access = issue_token_access(session, otp=otp_verified, validity_hours=24)

        assert access.type == TypeToken.ACCESS
        assert access.token is not None
        assert len(access.token) > 20
        assert access.share_id == share_ativo.id

    def test_access_expira_no_tempo_correto(self, session, share_ativo):
        # Verifica que expires_at do ACCESS é calculado com base em validity_hours.
        # Margem de ±5 min para compensar o tempo de execução do teste.
        otp, code = issue_otp(session, email=share_ativo.external_email)
        otp_verified = verify_otp(session, email=share_ativo.external_email, code=code)
        access = issue_token_access(session, otp=otp_verified, validity_hours=24)

        delta = access.expires_at.replace(tzinfo=UTC) - datetime.now(UTC)
        assert timedelta(hours=23, minutes=55) <= delta <= timedelta(hours=24, minutes=5)

    def test_falha_se_share_expirado(self, session, area, usuario_interno):
        """ACCESS não deve ser emitido se o share expirou após o OTP."""
        share = Share(
            area_id=area.id,
            external_email="expirado2@example.com",
            created_by_id=usuario_interno.id,
            expires_at=datetime.now(UTC) + timedelta(minutes=2),
            status=ShareStatus.ACTIVE,
            consumption_policy=TokenConsumption.AFTER_ALL,
        )
        session.add(share)
        session.commit()

        otp, code = issue_otp(session, email="expirado2@example.com")
        otp_verified = verify_otp(session, email="expirado2@example.com", code=code)

        # Expira o share após o OTP ser verificado
        share.expires_at = datetime.now(UTC) - timedelta(minutes=1)
        session.add(share)
        session.commit()

        with pytest.raises(TokenError, match="[Ee]xpirado|[Ii]ndisponível"):
            issue_token_access(session, otp=otp_verified, validity_hours=24)
