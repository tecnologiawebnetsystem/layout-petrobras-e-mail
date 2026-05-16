"""
Testes de integração S3 — pytest.

Marcados com @pytest.mark.integration. São executados automaticamente
no pipeline CDK Petrobras quando as variáveis de ambiente abaixo estão
presentes (injetadas via Parameter Store / Secrets Manager):

    AWS_S3_BUCKET      → /APP/scac-dsv/AWS_S3_BUCKET
    AWS_REGION         → /APP/scac-dsv/AWS_REGION         (padrão: sa-east-1)
    AWS_ACCESS_KEY_ID  → csa_dsv_aws_secret  (chave AWS_ACCESS_KEY_ID)
    AWS_SECRET_ACCESS_KEY → csa_dsv_aws_secret (chave AWS_SECRET_ACCESS_KEY)

Quando as variáveis não estiverem disponíveis (ex.: dev local sem credenciais),
todos os testes deste módulo são automaticamente ignorados (skip).

Execução manual (requer credenciais no ambiente):
    pytest tests/test_s3_integration.py -v -m integration
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

import pytest

# ─────────────────────────────────────────────────────────────────────────────
# Skip automático quando AWS_S3_BUCKET não estiver disponível
# ─────────────────────────────────────────────────────────────────────────────
pytestmark = pytest.mark.integration

_BUCKET = os.getenv("AWS_S3_BUCKET", "")
_REGION = os.getenv("AWS_REGION", "sa-east-1")

if not _BUCKET:
    pytest.skip(
        "AWS_S3_BUCKET não definido — testes de integração S3 ignorados. "
        "No pipeline CDK, verifique o parâmetro /APP/scac-dsv/AWS_S3_BUCKET.",
        allow_module_level=True,
    )

# Imports do projeto (só chegam aqui se _BUCKET estiver definido)
from app.services.s3_service import (  # noqa: E402
    S3_BUCKET,
    build_upload_key,
    delete_object,
    get_s3_client,
    head_object_safe,
    sanitize_filename,
    S3ServiceError,
)


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def s3():
    """Cliente boto3 S3 reutilizado por todos os testes do módulo."""
    return get_s3_client()


@pytest.fixture()
def share_id():
    """Share ID único para cada teste."""
    return f"pytest-{uuid.uuid4().hex[:8]}"


@pytest.fixture()
def upload_and_cleanup(s3):
    """
    Fixture de ciclo upload → yield key → delete garantido no teardown.
    Uso: key = upload_and_cleanup(share_id, file_id, filename, content, content_type)
    """
    keys_to_clean: list[str] = []

    def _upload(share_id: str, filename: str, content: bytes, content_type: str) -> str:
        file_id = f"f{uuid.uuid4().hex[:6]}"
        key = build_upload_key(share_id, file_id, filename)
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=content,
            ContentType=content_type,
            Metadata={"test-run": "pytest", "uploaded-at": datetime.now(timezone.utc).isoformat()},
        )
        keys_to_clean.append(key)
        return key

    yield _upload

    # Teardown: garante limpeza mesmo que o teste falhe
    for key in keys_to_clean:
        try:
            delete_object(key=key)
        except Exception:  # noqa: BLE001
            pass


# ─────────────────────────────────────────────────────────────────────────────
# Testes
# ─────────────────────────────────────────────────────────────────────────────

class TestConectividade:
    def test_bucket_acessivel(self, s3):
        """Verifica se o bucket definido em AWS_S3_BUCKET está acessível."""
        s3.head_bucket(Bucket=S3_BUCKET)

    def test_bucket_correto(self):
        """Confirma que S3_BUCKET bate com a variável de ambiente."""
        assert S3_BUCKET == _BUCKET, (
            f"S3_BUCKET='{S3_BUCKET}' diverge de AWS_S3_BUCKET='{_BUCKET}'"
        )

    def test_regiao(self):
        """Confirma região da AWS."""
        assert _REGION, "AWS_REGION não definida"


class TestCicloUploadDelete:
    def test_arquivo_texto(self, share_id, upload_and_cleanup):
        """Ciclo completo: upload texto → verifica existência → delete → verifica ausência."""
        content = b"Arquivo de teste CSA - integracao S3\nLinha 2\n"
        key = upload_and_cleanup(share_id, "relatorio_teste.txt", content, "text/plain")

        meta = head_object_safe(key=key)
        assert meta is not None, "Objeto não encontrado após upload"
        assert meta["ContentLength"] == len(content)

        delete_object(key=key)

        assert head_object_safe(key=key) is None, "Objeto ainda existe após delete"

    def test_arquivo_json(self, share_id, upload_and_cleanup):
        """Ciclo completo com arquivo JSON simulando metadados de compartilhamento."""
        content = b'{"share_id": "abc123", "recipient": "externo@empresa.com"}'
        key = upload_and_cleanup(share_id, "metadata.json", content, "application/json")

        meta = head_object_safe(key=key)
        assert meta is not None
        assert meta.get("ContentType", "").startswith("application/json")

        delete_object(key=key)
        assert head_object_safe(key=key) is None

    def test_arquivo_binario(self, share_id, upload_and_cleanup):
        """Ciclo completo com dados binários (~64 KB simulando PDF)."""
        content = bytes(range(256)) * 256  # 64 KB
        key = upload_and_cleanup(share_id, "documento.pdf", content, "application/pdf")

        meta = head_object_safe(key=key)
        assert meta is not None
        assert meta["ContentLength"] == len(content)

        delete_object(key=key)
        assert head_object_safe(key=key) is None

    def test_multiplos_arquivos_mesmo_share(self, share_id, upload_and_cleanup):
        """Sobe múltiplos arquivos no mesmo share_id e valida todos."""
        arquivos = [
            ("contrato.txt", b"conteudo do contrato", "text/plain"),
            ("anexo.csv",    b"col1,col2\n1,2\n",     "text/csv"),
            ("logo.png",     bytes(range(256)) * 4,   "image/png"),
        ]
        keys = [
            upload_and_cleanup(share_id, fname, body, ctype)
            for fname, body, ctype in arquivos
        ]

        for key in keys:
            assert head_object_safe(key=key) is not None, f"Objeto ausente: {key}"

        for key in keys:
            delete_object(key=key)
            assert head_object_safe(key=key) is None, f"Objeto persiste após delete: {key}"


class TestSanitizeFilename:
    @pytest.mark.parametrize("entrada,esperado", [
        ("relatorio final.pdf",        "relatorio final.pdf"),
        ("../../../etc/passwd",         "passwd"),
        ("arquivo\x00nulo.txt",         "arquivonulo.txt"),
        ("foto!@#$.jpg",                "foto_.jpg"),
        ("normal_doc-v2 (copia).docx",  "normal_doc-v2 (copia).docx"),
    ])
    def test_sanitizacao(self, entrada, esperado):
        assert sanitize_filename(entrada) == esperado
