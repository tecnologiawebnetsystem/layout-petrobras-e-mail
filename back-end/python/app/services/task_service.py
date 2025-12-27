# agendamento e limpeza

import os
import boto3
from datetime import datetime, timezone, timedelta
 
# Configurações
S3_BUCKET = os.environ.get("S3_BUCKET")
GRACE_DAYS = int(os.environ.get("GRACE_DAYS", 0))
 
# Clientes AWS
s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
 
# Tabelas
FILES_TABLE = dynamodb.Table(os.environ["FILES_TABLE"])
SHARE_TABLE = dynamodb.Table(os.environ["SHARE_TABLE"])
 
 
def lambda_handler(event, context):
    """
    Lambda de limpeza diária.
    Remove arquivos cujo compartilhamento já expirou
    e marca o registro como DELETED.
    """
 
    now = datetime.now(timezone.utc)
    limit = now - timedelta(days=GRACE_DAYS)
 
    print(f"[CLEANUP] Iniciando limpeza. GRACE={GRACE_DAYS} | NOW={now}")
 
    # 1. Buscar arquivos expirados pela tabela de compartilhamentos
    expired_shares = buscar_compartilhamentos_expirados(limit)
    print(f"[CLEANUP] Compartilhamentos expirados encontrados: {len(expired_shares)}")
 
    deleted_count = 0
 
    for share in expired_shares:
        share_id = share["share_id"]
 
        # 2. Buscar arquivos desse compartilhamento
        files = buscar_arquivos_por_share(share_id)
 
        for file in files:
            # pula arquivos já removidos
            if file["status"] != "AVAILABLE":
                continue
 
            s3_key = file["s3_key"]
 
            # 3. Excluir arquivo do S3
            try:
                print(f"[DELETE] Removendo arquivo S3: {s3_key}")
                s3.delete_object(Bucket=S3_BUCKET, Key=s3_key)
 
                # 4. Atualizar status no banco
                atualizar_status_arquivo(file["file_id"])
 
                deleted_count += 1
 
            except Exception as e:
                print(f"[ERRO] Falha ao excluir arquivo {s3_key}: {str(e)}")
 
    print(f"[CLEANUP] Limpeza finalizada. Arquivos deletados: {deleted_count}")
    return {"deleted": deleted_count}
 
 
 
def buscar_compartilhamentos_expirados(limit_date):
    """
    Busca compartilhamentos onde expires_at < limit_date.
    Supondo uso de DynamoDB com índice por expires_at.
    """
 
    # Exemplo com query + GSI (dependendo da modelagem)
    response = SHARE_TABLE.scan()  # Exemplo simples — substituir por GSI
    items = response.get("Items", [])
 
    expirados = []
    for share in items:
        exp_at = datetime.fromisoformat(share["expires_at"])
        if exp_at < limit_date:
            expirados.append(share)
 
    return expirados
 
 
 
def buscar_arquivos_por_share(share_id):
    """Busca arquivos pelo ID do compartilhamento."""
    response = FILES_TABLE.query(
        IndexName="share_id-index",  # se existir
        KeyConditionExpression=boto3.dynamodb.conditions.Key("share_id").eq(share_id)
    )
    return response.get("Items", [])
 
 
 
def atualizar_status_arquivo(file_id):
    """Marca o arquivo como DELETED e registra deleted_at."""
    FILES_TABLE.update_item(
        Key={"file_id": file_id},
        UpdateExpression="SET #s = :st, deleted_at = :dt",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={
            ":st": "DELETED",
            ":dt": datetime.now(timezone.utc).isoformat()
        }
    )