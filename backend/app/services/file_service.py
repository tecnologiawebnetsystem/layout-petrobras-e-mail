from app.core.config import settings
from app.services.s3_service import get_s3_client, S3_BUCKET
import urllib.parse


def generate_download_url(file_key: str, expires_in: int = 300, filename: str | None = None) -> str:
    if settings.storage_provider == "local":
        # Serve o arquivo diretamente do disco via endpoint do próprio backend
        params = urllib.parse.urlencode({"filename": filename or ""})
        encoded_key = urllib.parse.quote(file_key, safe="")
        return f"http://localhost:{settings.app_port}/mock/download/{encoded_key}?{params}"
    else:
        # get_s3_client() já usa Config(signature_version="s3v4"), obrigatório para SSE-KMS
        params = {"Bucket": S3_BUCKET, "Key": file_key}
        if filename:
            params["ResponseContentDisposition"] = f'attachment; filename="{filename}"'
        return get_s3_client().generate_presigned_url("get_object", Params=params, ExpiresIn=expires_in)
