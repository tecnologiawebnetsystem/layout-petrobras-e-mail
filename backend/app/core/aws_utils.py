# integração S3 (boto3)

from app.core.config import settings


# Se não configurado, retornar URL simulada para dev local
def _mock_upload_url(key: str, expires_in: int = 3600) -> str:
    return f"http://localhost:{settings.app_port}/mock/upload/{key}?expires_in={expires_in}"

def _mock_download_url(key: str, expires_in: int = 3600) -> str:
    return f"http://localhost:{settings.app_port}/mock/download/{key}?expires_in={expires_in}"

# Se não for AWS (ou faltarem variáveis obrigatórias), usar mock local.
# Credenciais explícitas (aws_access_key_id/secret) NÃO são verificadas aqui:
# em ECS a autenticação é feita via IAM Role da task — sem credenciais no env.
USE_AWS = (
    settings.storage_provider == "aws"
    and bool(settings.aws_region)
    and bool(settings.aws_s3_bucket)
)

if not USE_AWS:
    def generate_presigned_upload(key: str, expires_in: int = 3600):
        return _mock_upload_url(key, expires_in)

    def generate_presigned_download(key: str, expires_in: int = 3600):
        return _mock_download_url(key, expires_in)

else:
    import boto3
    from botocore.config import Config
    # Não passar credenciais explícitas: em ECS, boto3 usa automaticamente
    # as credenciais da IAM Role da task. Em dev local com AWS_ACCESS_KEY_ID
    # no env, boto3 também as pega automaticamente via cadeia de credenciais.
    # signature_version="s3v4" é obrigatório para buckets com SSE-KMS.
    s3 = boto3.client(
        "s3",
        region_name=settings.aws_region,
        config=Config(signature_version="s3v4"),
    )

    def generate_presigned_upload(key: str, expires_in: int = 3600):
        return s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={"Bucket": settings.aws_s3_bucket, "Key": key},
            ExpiresIn=expires_in,
        )

    def generate_presigned_download(key: str, expires_in: int = 3600):
        return s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": settings.aws_s3_bucket, "Key": key},
            ExpiresIn=expires_in,
        )

