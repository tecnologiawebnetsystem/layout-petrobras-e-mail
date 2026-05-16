"""
Testes unitários do S3 Service — usa moto para simular a AWS localmente.
Não requer credenciais reais nem acesso à internet.

Execução:
    pytest tests/test_s3_service.py -v
"""

from __future__ import annotations

import os
import pytest
import boto3
from moto import mock_aws

# Garante que o moto usa a região correta antes de qualquer import do serviço
os.environ.setdefault("AWS_REGION", "sa-east-1")
os.environ.setdefault("AWS_DEFAULT_REGION", "sa-east-1")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_SECURITY_TOKEN", "testing")
os.environ.setdefault("AWS_SESSION_TOKEN", "testing")

from app.services.s3_service import (
    S3_BUCKET,
    build_upload_key,
    delete_object,
    generate_presigned_put,
    get_s3_client,
    get_s3_object_stream,
    head_object_safe,
    sanitize_filename,
)


# ─────────────────────────────────────────────────────────────────────────────
# Fixture: bucket moto reutilizado em todos os testes da classe
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture()
def mock_bucket():
    """Cria um bucket S3 falso via moto para cada teste."""
    with mock_aws():
        s3 = boto3.client("s3", region_name="sa-east-1")
        s3.create_bucket(
            Bucket=S3_BUCKET,
            CreateBucketConfiguration={"LocationConstraint": "sa-east-1"},
        )
        yield s3


# ─────────────────────────────────────────────────────────────────────────────
# Testes de utilitários (sem AWS — não precisam de mock_bucket)
# ─────────────────────────────────────────────────────────────────────────────

class TestSanitizeFilename:
    @pytest.mark.parametrize("entrada,esperado", [
        ("abc/../def.txt",            "def.txt"),
        ("abc!@#$.txt",               "abc_.txt"),
        ("../../../etc/passwd",        "passwd"),
        ("arquivo\x00nulo.txt",        "arquivonulo.txt"),
        ("normal_doc-v2 (copia).docx", "normal_doc-v2 (copia).docx"),
    ])
    def test_sanitizacao(self, entrada, esperado):
        assert sanitize_filename(entrada) == esperado


class TestBuildUploadKey:
    def test_formato_do_path(self):
        key = build_upload_key("area1", "file1", "test.txt")
        assert "area1" in key
        assert "file1" in key
        assert key.endswith(".txt") or "test" in key

    def test_sem_path_traversal(self):
        key = build_upload_key("area1", "file1", "../etc/passwd")
        assert ".." not in key


# ─────────────────────────────────────────────────────────────────────────────
# Testes com S3 mockado via moto
# ─────────────────────────────────────────────────────────────────────────────

class TestS3Operations:
    def test_put_e_get_objeto(self, mock_bucket):
        """Faz upload e verifica leitura via get_s3_object_stream."""
        key = build_upload_key("area1", "file1", "test.txt")
        mock_bucket.put_object(
            Bucket=S3_BUCKET, Key=key, Body=b"hello", ContentType="text/plain"
        )
        body, meta = get_s3_object_stream(key=key)
        assert meta["ContentType"] == "text/plain"
        assert body.read() == b"hello"

    def test_head_objeto_existente(self, mock_bucket):
        """head_object_safe retorna metadata quando o objeto existe."""
        key = build_upload_key("area1", "file1", "test.txt")
        mock_bucket.put_object(Bucket=S3_BUCKET, Key=key, Body=b"hello")
        meta = head_object_safe(key=key)
        assert meta is not None
        assert meta["ContentLength"] == 5

    def test_head_objeto_ausente(self, mock_bucket):
        """head_object_safe retorna None quando o objeto não existe."""
        assert head_object_safe(key="chave/inexistente.txt") is None

    def test_delete_objeto(self, mock_bucket):
        """delete_object remove o objeto e head_object_safe confirma ausência."""
        key = build_upload_key("area1", "file1", "test.txt")
        mock_bucket.put_object(Bucket=S3_BUCKET, Key=key, Body=b"hello")
        delete_object(key=key)
        assert head_object_safe(key=key) is None

    def test_presigned_put_retorna_url(self, mock_bucket):
        """generate_presigned_put retorna um PresignedPutResult com upload_url válida."""
        key = build_upload_key("area1", "file1", "doc.pdf")
        result = generate_presigned_put(key=key, content_type="application/pdf")
        assert isinstance(result.upload_url, str)
        assert len(result.upload_url) > 0
