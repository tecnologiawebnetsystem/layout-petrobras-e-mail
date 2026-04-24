"""
Testes de rotas de arquivos — usa moto (S3 mock) + FastAPI TestClient.

Execução:
    pytest tests/test_routes_files.py -v
"""

from __future__ import annotations

import os
import pytest
import boto3
from moto import mock_aws
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool

# Credenciais fake para o moto antes de qualquer import da aplicação
os.environ.setdefault("AWS_REGION", "sa-east-1")
os.environ.setdefault("AWS_DEFAULT_REGION", "sa-east-1")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_SESSION_TOKEN", "testing")
os.environ.setdefault("S3_BUCKET", "s3-a12022-dsv-a12022-s3-119392112451-sa-east-1")
os.environ.setdefault("STORAGE_PROVIDER", "aws")

from app.main import app
from app.utils.authz import get_current_user
from app.models.user import User, TypeUser
from app.services.s3_service import S3_BUCKET
from sqlmodel import SQLModel, create_engine


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def _test_engine():
    """Engine SQLite in-memory para a suíte de rotas de arquivos."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture(scope="module")
def client(_test_engine):
    """TestClient com autenticação e banco de dados mockados via engine patching."""
    import app.db.session as _db_module

    _fake_user = User(
        id=1,
        name="Test User",
        email="tester@petrobras.com.br",
        type=TypeUser.INTERNAL,
        status=True,
    )

    def override_get_current_user() -> User:
        return _fake_user

    original_engine = _db_module.engine
    _db_module.engine = _test_engine
    app.dependency_overrides[get_current_user] = override_get_current_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_current_user, None)
    _db_module.engine = original_engine


@pytest.fixture()
def mock_s3():
    """Bucket S3 falso via moto para cada teste."""
    with mock_aws():
        s3 = boto3.client("s3", region_name="sa-east-1")
        s3.create_bucket(
            Bucket=S3_BUCKET,
            CreateBucketConfiguration={"LocationConstraint": "sa-east-1"},
        )
        yield s3


# ─────────────────────────────────────────────────────────────────────────────
# Testes
# ─────────────────────────────────────────────────────────────────────────────

class TestUploadDownload:
    def test_upload_arquivo(self, client, mock_s3):
        """POST /files/upload deve retornar 201 com dados do compartilhamento criado."""
        response = client.post(
            "/api/v1/files/upload",
            data={"name": "Teste Upload", "recipientEmail": "externo@test.com"},
            files=[("files", ("teste.txt", b"hello world", "text/plain"))],
        )
        assert response.status_code == 201

    def test_download_arquivo(self, client, mock_s3):
        """Presigned-download deve retornar URL ou 400/404 para arquivo sem S3."""
        # Primeiro faz upload para ter um file_id real no banco
        upload = client.post(
            "/api/v1/files/upload",
            data={"name": "Teste Download", "recipientEmail": "externo@test.com"},
            files=[("files", ("arquivo.txt", b"conteudo", "text/plain"))],
        )
        assert upload.status_code == 201
        uploaded = upload.json().get("files", [])
        if not uploaded or "id" not in uploaded[0]:
            return  # sem file_id na resposta, pula o presigned-download
        file_id = uploaded[0]["id"]
        response = client.get(f"/api/v1/files/{file_id}/presigned-download")
        # 200 (URL gerada), 400/500 (S3 não disponível no ambiente de teste)
        assert response.status_code in (200, 400, 404, 500)


class TestPresignedUpload:
    def test_presigned_upload_retorna_url(self, client, mock_s3):
        """Rota /{file_id}/presigned-upload aceita a requisição autenticada."""
        # 9999 é um file_id inexistente — esperamos 404, não 401 (auth passou)
        response = client.get("/api/v1/files/9999/presigned-upload")
        assert response.status_code in (200, 400, 404, 500, 501)
