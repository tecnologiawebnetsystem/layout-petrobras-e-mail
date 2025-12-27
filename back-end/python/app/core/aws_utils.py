# integração S3 (boto3)

from app.core.config import settings


# Se não configurado, retornar URL simulada para dev local
def _mock_upload_url(key: str, expires_in: int = 3600) -> str:
    return f"http://localhost:{settings.app_port}/mock/upload/{key}?expires_in={expires_in}"

def _mock_download_url(key: str, expires_in: int = 3600) -> str:
    return f"http://localhost:{settings.app_port}/mock/download/{key}?expires_in={expires_in}"

# Se não for AWS (ou faltarem variáveis), usar mock local
USE_AWS = (
    settings.storage_provider == "aws"
    and settings.aws_region
    and settings.aws_s3_bucket
    and settings.aws_access_key_id
    and settings.aws_secret_access_key
)

if not USE_AWS:
    def generate_presigned_upload(key: str, expires_in: int = 3600):
        return _mock_upload_url(key, expires_in)

    def generate_presigned_download(key: str, expires_in: int = 3600):
        return _mock_download_url(key, expires_in)

else:
    import boto3
    s3 = boto3.client(
        "s3",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
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
