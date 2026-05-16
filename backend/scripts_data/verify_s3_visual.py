"""
Verificação manual visual: upload → PAUSA (você confere no console S3) → delete.

Uso (com .env carregado):
    Get-Content .env | ? { $_ -match '^(AWS_|STORAGE_)' } | % {
        $p = $_ -split '=',2; Set-Item "env:$($p[0])" $p[1]
    }
    $env:STORAGE_PROVIDER = "aws"
    python -m scripts_data.verify_s3_visual
"""
from __future__ import annotations

import os
import sys
import uuid
from datetime import datetime, timezone

# Garante que vai usar S3 real
os.environ["STORAGE_PROVIDER"] = "aws"

from app.services.s3_service import (
    S3_BUCKET,
    AWS_REGION,
    build_upload_key,
    delete_object,
    get_s3_client,
    head_object_safe,
)


def main() -> int:
    print("=" * 70)
    print(f" VERIFICAÇÃO VISUAL S3")
    print("=" * 70)
    print(f" Bucket : {S3_BUCKET}")
    print(f" Região : {AWS_REGION}")
    print(f" Hora   : {datetime.now(timezone.utc).isoformat()}")
    print("=" * 70)

    s3 = get_s3_client()
    run_id = uuid.uuid4().hex[:8]
    arquivos = [
        ("verify_doc.txt",  b"Arquivo de verificacao visual\n", "text/plain"),
        ("verify_data.json", b'{"verify": true}',                "application/json"),
    ]

    keys: list[str] = []
    print("\n[1/3] Fazendo upload dos arquivos...")
    for filename, content, ctype in arquivos:
        file_id = uuid.uuid4().hex[:6]
        key = build_upload_key(f"verify-{run_id}", file_id, filename)
        s3.put_object(Bucket=S3_BUCKET, Key=key, Body=content, ContentType=ctype)
        meta = head_object_safe(key=key)
        assert meta is not None, f"Upload falhou para {key}"
        keys.append(key)
        print(f"   OK  s3://{S3_BUCKET}/{key}  ({meta['ContentLength']} bytes)")

    print("\n" + "─" * 70)
    print(" ABRA O CONSOLE AWS S3 AGORA e confirme que os arquivos existem:")
    print(f"   https://s3.console.aws.amazon.com/s3/buckets/{S3_BUCKET}?region={AWS_REGION}")
    print(f"   Prefixo: shares/verify-{run_id}/uploads/")
    print("─" * 70)
    try:
        input("\n>>> Pressione ENTER após conferir para DELETAR os arquivos... ")
    except (KeyboardInterrupt, EOFError):
        print("\nCancelado pelo usuário. Os arquivos PERMANECEM no S3.")
        print("Para limpar manualmente, delete o prefixo acima.")
        return 1

    print("\n[2/3] Deletando arquivos...")
    for key in keys:
        delete_object(key=key)
        print(f"   DEL s3://{S3_BUCKET}/{key}")

    print("\n[3/3] Confirmando que sumiram do S3...")
    for key in keys:
        meta = head_object_safe(key=key)
        if meta is None:
            print(f"   OK  ausente: {key}")
        else:
            print(f"   FALHA  ainda existe: {key}")
            return 2

    print("\n" + "=" * 70)
    print(" SUCESSO — upload e delete validados no S3 real.")
    print("=" * 70)
    return 0


if __name__ == "__main__":
    sys.exit(main())
