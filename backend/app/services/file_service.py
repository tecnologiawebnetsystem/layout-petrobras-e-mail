from app.core.config import settings
import boto3


def generate_download_url_simulada(file_key: str, expires_in: int = 300, filename: str | None = None) -> str:
    # Simula uma URL local (sem AWS) para testes
    # Em produção, troque por S3 presigned URL
    return f"http://localhost:8000/mock-download?key={file_key}&ttl={expires_in}&name={filename or ''}"


def generate_download_url(file_key: str, expires_in: int = 300, filename: str | None = None) -> str:
    if settings.storage_provider == "local":
        return generate_download_url_simulada(file_key, expires_in, filename)
    else:
        # Aqui você implementa S3 presigned URL (quando conectar AWS)
        s3_client = boto3.client("s3", region_name=settings.AWS_REGION)
        params = {"Bucket": settings.AWS_BUCKET_NAME, "Key": file_key}
        if filename:
            params["ResponseContentDisposition"] = f'attachment; filename="{filename}"'
        return s3_client.generate_presigned_url("get_object", Params=params, ExpiresIn=expires_in)
