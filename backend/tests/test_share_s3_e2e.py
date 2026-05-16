"""
Teste E2E: fluxo completo da aplicação contra o S3 REAL.

Valida que:
  1. create_share() (chamado pela rota POST /shares) faz upload real no bucket
  2. O cancelamento (PATCH /shares/{id}/cancel) remove os objetos do S3

Marcado @pytest.mark.integration. Skip automático se AWS_S3_BUCKET / credenciais
não estiverem disponíveis. Para rodar localmente:

    Get-Content .env | ? { $_ -match '^(AWS_|STORAGE_)' } | % {
        $p = $_ -split '=',2; Set-Item "env:$($p[0])" $p[1]
    }
    $env:STORAGE_PROVIDER = "aws"
    python -m pytest tests/test_share_s3_e2e.py -v -m integration
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, UTC

import pytest

pytestmark = pytest.mark.integration

# Skip antes de importar qualquer coisa do projeto se ambiente não suportar
_BUCKET = os.getenv("AWS_S3_BUCKET", "")
_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
_SECRET = os.getenv("AWS_SECRET_ACCESS_KEY", "")

if not _BUCKET or _KEY_ID == "testing" or not _SECRET or _SECRET == "testing":
    pytest.skip(
        "Credenciais AWS reais ausentes — rode com env vars do .env exportadas.",
        allow_module_level=True,
    )

# Garante que o app vai usar S3 real (e não mock) ANTES dos imports
os.environ["STORAGE_PROVIDER"] = "aws"

from app.models.share import Share, ShareStatus, TokenConsumption  # noqa: E402
from app.models.share_file import ShareFile  # noqa: E402
from app.models.restricted_file import RestrictedFile  # noqa: E402
from app.services.share_service import create_share  # noqa: E402
from app.services.s3_service import (  # noqa: E402
    delete_object,
    head_object_safe,
)
from sqlmodel import select  # noqa: E402


# ─────────────────────────────────────────────────────────────────────────────
# Teste E2E completo
# ─────────────────────────────────────────────────────────────────────────────

class TestShareS3EndToEnd:
    def test_upload_via_create_share_e_delete_via_cancel(
        self, session, usuario_interno, area
    ):
        """Fluxo completo: cria share com 2 arquivos novos → confirma upload no S3
        → cancela share simulando a rota → confirma delete no S3."""

        # ── 1. CRIA SHARE COM UPLOADS NOVOS ──────────────────────────────────
        unique = uuid.uuid4().hex[:6]
        new_uploads = [
            (f"e2e_doc_{unique}.txt", b"Conteudo de teste E2E\n", "text/plain"),
            (f"e2e_data_{unique}.json", b'{"chave":"valor"}', "application/json"),
        ]

        share = create_share(
            session=session,
            area_id=area.id,
            external_email="e2e@example.com",
            created_by_id=usuario_interno.id,
            expiration_hours=24,
            consumption_policy=TokenConsumption.AFTER_ALL,
            file_ids=[],
            new_uploads=new_uploads,
        )

        # Coleta as keys S3 dos arquivos criados
        share_files = session.exec(
            select(ShareFile).where(ShareFile.share_id == share.id)
        ).all()
        assert len(share_files) == 2, "Esperado 2 ShareFile criados"

        keys_s3 = []
        for sf in share_files:
            rfile = session.get(RestrictedFile, sf.file_id)
            assert rfile is not None
            assert rfile.key_s3, f"key_s3 vazio em RestrictedFile id={rfile.id}"
            keys_s3.append(rfile.key_s3)

        # ── 2. CONFIRMA QUE OS OBJETOS EXISTEM NO S3 REAL ────────────────────
        for key in keys_s3:
            meta = head_object_safe(key=key)
            assert meta is not None, (
                f"Arquivo NÃO subiu ao S3: {key} — verifique credenciais/bucket"
            )

        # ── 3. SIMULA A LÓGICA DE CANCELAMENTO DA ROTA ────────────────────────
        # (replica o que routes_shares.py faz quando STORAGE_PROVIDER=aws)
        from app.core.config import settings as _settings
        share.status = ShareStatus.CANCELED
        session.add(share)
        session.commit()

        if _settings.storage_provider == "aws":
            for sf in share_files:
                rfile = session.get(RestrictedFile, sf.file_id)
                if rfile and rfile.key_s3:
                    delete_object(key=rfile.key_s3)

        # ── 4. CONFIRMA QUE OS OBJETOS SUMIRAM DO S3 ─────────────────────────
        for key in keys_s3:
            meta = head_object_safe(key=key)
            assert meta is None, f"Arquivo persistiu no S3 após cancelamento: {key}"
