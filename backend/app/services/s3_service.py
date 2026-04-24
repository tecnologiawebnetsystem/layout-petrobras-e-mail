"""
S3 Service (MVP)
- Centraliza tudo que envolve S3: client, paths/prefixos, marker/meta, presigned PUT,
  e helpers opcionais (head/get streaming).
 
Como usar:
    from s3_service import (
        share_prefix,
        build_upload_key,
        ensure_share_marker,
        generate_presigned_put,
        get_s3_object_stream,
        head_object_safe,
        sanitize_filename,
    )
 
Requisitos:
- boto3 instalado
- AWS creds configuradas (SSO/profile/role/ECS task role)
- Env vars opcionais:
    AWS_REGION (default: sa-east-1)
    S3_BUCKET  (default: mvp-files-dev)
"""
 
from __future__ import annotations
 
import json
import os
import re
import posixpath
import urllib.parse
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple
 
import boto3
from botocore.client import BaseClient
from botocore.exceptions import ClientError
 
# Config 
AWS_REGION = os.getenv("AWS_REGION", "sa-east-1")
S3_BUCKET = os.getenv("S3_BUCKET", "s3-a12022-dsv-a12022-s3-119392112451-sa-east-1")
 
def get_s3_client() -> BaseClient:
    """Retorna o client S3. Suporta credenciais STS temporarias (key + secret + session token)."""
    kwargs: dict = {"region_name": AWS_REGION}
    key_id = os.getenv("AWS_ACCESS_KEY_ID")
    secret = os.getenv("AWS_SECRET_ACCESS_KEY")
    session_token = os.getenv("AWS_SESSION_TOKEN")
    if key_id and secret:
        kwargs["aws_access_key_id"] = key_id
        kwargs["aws_secret_access_key"] = secret
        if session_token:
            kwargs["aws_session_token"] = session_token
    return boto3.client("s3", **kwargs)
 
 
# Errors
class S3ServiceError(RuntimeError):
    pass
 
 
class S3ObjectNotFound(S3ServiceError):
    pass
 
 
# Filename sanitization (anti ZipSlip / header safety)
_FILENAME_SAFE = re.compile(r"[^A-Za-z0-9.\-_\s()]+")
 
 
def sanitize_filename(name: str, max_len: int = 150) -> str:
    """
    Sanitiza filename para evitar:
    - path traversal (../)
    - caracteres estranhos em headers
    - nomes vazios
 
    Mantém: letras, números, espaço, . - _ ( )
    """
    name = (name or "").strip()

    # decode URL encoding
    name = urllib.parse.unquote(name)

    name = name.replace("\x00", "")  # null byte
    name = name.replace("\\", "/")
    
    name = os.path.basename(name)  # remove ../ e paths
    # remove traversal explícito
    while ".." in name:
        name = name.replace("..", "")

    name = _FILENAME_SAFE.sub("_", name)
    name = name.strip(" .")  # evita "." ou " " no fim
    
    if not name:
        name = "file"
    return name[:max_len]
 
 
# Key builders / prefixes
def share_prefix(share_id: str) -> str:
    """Prefixo base do share dentro do bucket."""
    return f"shares/{share_id}/"
 
 
def build_upload_key(share_id: str, file_id: str, filename: str) -> str:
    """
    Monta a key de upload.
    Ex: shares/<share_id>/uploads/<file_id>-<filename>
    """
    safe = sanitize_filename(filename)
    # posixpath para garantir "/" mesmo no Windows
    return posixpath.join(share_prefix(share_id), "uploads", f"{file_id}-{safe}")
 
 
def build_meta_key(share_id: str) -> str:
    """Key do marker/meta do share."""
    return posixpath.join(share_prefix(share_id), "_meta.json")
 
 
# Marker/meta object
def ensure_share_marker(
    share_id: str,
    meta: Dict[str, Any],
    *,
    content_type: str = "application/json",
    sse: Optional[str] = "AES256",
) -> str:
    """
    Cria/atualiza um _meta.json no prefixo do share.
    Ajuda na visualização/debug do S3 (opcional), não substitui Dynamo.
 
    sse:
      - "AES256" (SSE-S3)
      - "aws:kms" (SSE-KMS) + SSEKMSKeyId
      - None (sem SSE explícito)
    """
    key = build_meta_key(share_id)
 
    body = json.dumps(
        {
            "shareId": share_id,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            **(meta or {}),
        },
        ensure_ascii=False,
    ).encode("utf-8")
 
    params: Dict[str, Any] = {
        "Bucket": S3_BUCKET,
        "Key": key,
        "Body": body,
        "ContentType": content_type,
    }
 
    if sse:
        params["ServerSideEncryption"] = sse
 
    get_s3_client().put_object(**params)
    return key
 
 
# Presigned URLs
@dataclass(frozen=True)
class PresignedPutResult:
    upload_url: str
    s3_bucket: str
    s3_key: str
    expires_in: int
 
 
def generate_presigned_put(
    *,
    key: str,
    content_type: str,
    expires_in: int = 900,
    sse: Optional[str] = "AES256",
    kms_key_id: Optional[str] = None,
    extra_headers: Optional[Dict[str, str]] = None,
) -> PresignedPutResult:
    """
    Gera presigned PUT para upload controlado pelo backend.
 
    Observações importantes:
    - PUT presigned não limita tamanho do arquivo. Para isso, use presigned POST.
    - Para forçar criptografia:
        sse="AES256" (SSE-S3) ou sse="aws:kms" + kms_key_id
 
    extra_headers:
    - Caso queira obrigar metadata/headers adicionais (ex.: x-amz-meta-...),
      inclua em Params (mas lembre: o cliente deve enviar exatamente os headers).
    """
    params: Dict[str, Any] = {
        "Bucket": S3_BUCKET,
        "Key": key,
        "ContentType": content_type,
    }
 
    if sse:
        params["ServerSideEncryption"] = sse
        if sse == "aws:kms" and kms_key_id:
            params["SSEKMSKeyId"] = kms_key_id
 
    # headers extras (ex.: Metadata)
    if extra_headers:
        # Exemplos comuns:
        # - params["Metadata"] = {"ticket": "123"}
        # - params["ACL"] = "private"
        # Aqui deixo genérico (apenas merge em Params)
        params.update(extra_headers)
 
    url = get_s3_client().generate_presigned_url(
        ClientMethod="put_object",
        Params=params,
        ExpiresIn=expires_in,
    )
 
    return PresignedPutResult(
        upload_url=url,
        s3_bucket=S3_BUCKET,
        s3_key=key,
        expires_in=expires_in,
    )

def generate_presigned_get(key: str, expires_in: int = 300):
    url = get_s3_client().generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": S3_BUCKET, "Key": key},
        ExpiresIn=expires_in
    )
    return url
 
# Fetch / streaming helpers
def get_s3_object_stream(*, key: str) -> Tuple[Any, Dict[str, Any]]:
    """
    Retorna (BodyStream, Metadata) do get_object.
    Use no FastAPI:
        obj_body, meta = get_s3_object_stream(key=...)
        return StreamingResponse(obj_body, media_type=meta.get("ContentType", ...))
 
    Levanta S3ObjectNotFound se não existir.
    """
    try:
        resp = get_s3_client().get_object(Bucket=S3_BUCKET, Key=key)
        body = resp["Body"]
        meta = {
            "ContentType": resp.get("ContentType"),
            "ContentLength": resp.get("ContentLength"),
            "ETag": resp.get("ETag"),
            "LastModified": resp.get("LastModified"),
            "Metadata": resp.get("Metadata") or {},
        }
        return body, meta
    except ClientError as e:
        code = (e.response or {}).get("Error", {}).get("Code")
        if code in ("NoSuchKey", "NotFound", "404"):
            raise S3ObjectNotFound(f"S3 key not found: {key}") from e
        raise S3ServiceError(f"Error getting object {key}: {e}") from e
 
 
def head_object_safe(*, key: str) -> Optional[Dict[str, Any]]:
    """
    Head object sem explodir o fluxo:
    - retorna dict com metadados se existir
    - retorna None se não existir
    """
    try:
        resp = get_s3_client().head_object(Bucket=S3_BUCKET, Key=key)
        return {
            "ContentType": resp.get("ContentType"),
            "ContentLength": resp.get("ContentLength"),
            "ETag": resp.get("ETag"),
            "LastModified": resp.get("LastModified"),
            "Metadata": resp.get("Metadata") or {},
        }
    except ClientError as e:
        code = (e.response or {}).get("Error", {}).get("Code")
        if code in ("NoSuchKey", "NotFound", "404"):
            return None
        raise S3ServiceError(f"Error heading object {key}: {e}") from e
 
 
def delete_object(*, key: str) -> None:
    """Delete simples (idempotente no S3)."""
    try:
        get_s3_client().delete_object(Bucket=S3_BUCKET, Key=key)
    except ClientError as e:
        raise S3ServiceError(f"Error deleting object {key}: {e}") from e