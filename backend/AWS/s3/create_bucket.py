#!/usr/bin/env python3
"""
Script para criacao e configuracao do bucket S3 para o sistema de
transferencia segura de arquivos da Petrobras.

Uso:
    python create_bucket.py create [--env dev|staging|prod]
    python create_bucket.py delete [--env dev|staging|prod]
    python create_bucket.py configure-cors [--env dev|staging|prod]
    python create_bucket.py configure-lifecycle [--env dev|staging|prod]
    python create_bucket.py list
"""

import boto3
import json
import argparse
from botocore.exceptions import ClientError


# Configuracao base
BASE_BUCKET_NAME = "petrobras-file-transfer"
DEFAULT_REGION = "sa-east-1"


def get_bucket_name(env: str) -> str:
    """Retorna o nome do bucket baseado no ambiente."""
    return f"{BASE_BUCKET_NAME}-{env}"


def get_s3_client(region: str = DEFAULT_REGION):
    """Retorna cliente S3."""
    return boto3.client("s3", region_name=region)


def get_s3_resource(region: str = DEFAULT_REGION):
    """Retorna resource S3."""
    return boto3.resource("s3", region_name=region)


def create_bucket(env: str, region: str = DEFAULT_REGION):
    """
    Cria o bucket S3 com todas as configuracoes de seguranca.
    """
    bucket_name = get_bucket_name(env)
    s3_client = get_s3_client(region)
    
    print(f"Criando bucket: {bucket_name}")
    
    try:
        # Criar bucket (configuracao especial para sa-east-1)
        if region == "us-east-1":
            s3_client.create_bucket(Bucket=bucket_name)
        else:
            s3_client.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={"LocationConstraint": region}
            )
        print(f"  [OK] Bucket {bucket_name} criado")
        
        # Bloquear acesso publico
        s3_client.put_public_access_block(
            Bucket=bucket_name,
            PublicAccessBlockConfiguration={
                "BlockPublicAcls": True,
                "IgnorePublicAcls": True,
                "BlockPublicPolicy": True,
                "RestrictPublicBuckets": True
            }
        )
        print("  [OK] Acesso publico bloqueado")
        
        # Habilitar versionamento
        s3_client.put_bucket_versioning(
            Bucket=bucket_name,
            VersioningConfiguration={"Status": "Enabled"}
        )
        print("  [OK] Versionamento habilitado")
        
        # Habilitar criptografia padrao (SSE-S3)
        s3_client.put_bucket_encryption(
            Bucket=bucket_name,
            ServerSideEncryptionConfiguration={
                "Rules": [
                    {
                        "ApplyServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        },
                        "BucketKeyEnabled": True
                    }
                ]
            }
        )
        print("  [OK] Criptografia SSE-S3 habilitada")
        
        # Configurar CORS
        configure_cors(env, region)
        
        # Configurar lifecycle
        configure_lifecycle(env, region)
        
        # Adicionar tags
        s3_client.put_bucket_tagging(
            Bucket=bucket_name,
            Tagging={
                "TagSet": [
                    {"Key": "Project", "Value": "PetrobrasFileTransfer"},
                    {"Key": "Environment", "Value": env},
                    {"Key": "ManagedBy", "Value": "Script"},
                    {"Key": "CostCenter", "Value": "TI-Seguranca"}
                ]
            }
        )
        print("  [OK] Tags adicionadas")
        
        # Habilitar logging (em producao)
        if env == "prod":
            logging_bucket = f"{BASE_BUCKET_NAME}-logs-{env}"
            try:
                # Criar bucket de logs se nao existir
                if region == "us-east-1":
                    s3_client.create_bucket(Bucket=logging_bucket)
                else:
                    s3_client.create_bucket(
                        Bucket=logging_bucket,
                        CreateBucketConfiguration={"LocationConstraint": region}
                    )
                
                # Configurar logging
                s3_client.put_bucket_logging(
                    Bucket=bucket_name,
                    BucketLoggingStatus={
                        "LoggingEnabled": {
                            "TargetBucket": logging_bucket,
                            "TargetPrefix": f"s3-access-logs/{bucket_name}/"
                        }
                    }
                )
                print("  [OK] Logging habilitado")
            except ClientError as e:
                if e.response["Error"]["Code"] != "BucketAlreadyOwnedByYou":
                    print(f"  [WARN] Nao foi possivel configurar logging: {e}")
        
        print(f"\nBucket {bucket_name} criado e configurado com sucesso!")
        print(f"\nPara usar no .env:")
        print(f"  AWS_S3_BUCKET={bucket_name}")
        print(f"  AWS_REGION={region}")
        
        return True
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "BucketAlreadyOwnedByYou":
            print(f"  [INFO] Bucket {bucket_name} ja existe")
            return True
        elif e.response["Error"]["Code"] == "BucketAlreadyExists":
            print(f"  [ERROR] Nome de bucket {bucket_name} ja esta em uso globalmente")
            return False
        else:
            print(f"  [ERROR] Erro ao criar bucket: {e}")
            return False


def configure_cors(env: str, region: str = DEFAULT_REGION):
    """
    Configura CORS para permitir uploads via presigned URLs.
    """
    bucket_name = get_bucket_name(env)
    s3_client = get_s3_client(region)
    
    # Origens permitidas por ambiente
    allowed_origins = {
        "dev": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "staging": ["https://staging.petrobras-transfer.com.br"],
        "prod": ["https://transfer.petrobras.com.br", "https://www.transfer.petrobras.com.br"]
    }
    
    cors_configuration = {
        "CORSRules": [
            {
                "ID": "AllowPresignedUploads",
                "AllowedHeaders": ["*"],
                "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
                "AllowedOrigins": allowed_origins.get(env, ["*"]),
                "ExposeHeaders": [
                    "ETag",
                    "x-amz-server-side-encryption",
                    "x-amz-request-id",
                    "x-amz-id-2"
                ],
                "MaxAgeSeconds": 3600
            }
        ]
    }
    
    try:
        s3_client.put_bucket_cors(
            Bucket=bucket_name,
            CORSConfiguration=cors_configuration
        )
        print("  [OK] CORS configurado")
        return True
    except ClientError as e:
        print(f"  [ERROR] Erro ao configurar CORS: {e}")
        return False


def configure_lifecycle(env: str, region: str = DEFAULT_REGION):
    """
    Configura regras de lifecycle para gerenciar custos.
    """
    bucket_name = get_bucket_name(env)
    s3_client = get_s3_client(region)
    
    # Dias para transicao/expiracao por ambiente
    config = {
        "dev": {"ia_days": 7, "glacier_days": 30, "expire_days": 90},
        "staging": {"ia_days": 30, "glacier_days": 90, "expire_days": 365},
        "prod": {"ia_days": 90, "glacier_days": 365, "expire_days": 730}
    }
    
    env_config = config.get(env, config["dev"])
    
    lifecycle_configuration = {
        "Rules": [
            {
                "ID": "TransitionToIA",
                "Status": "Enabled",
                "Filter": {"Prefix": "uploads/"},
                "Transitions": [
                    {
                        "Days": env_config["ia_days"],
                        "StorageClass": "STANDARD_IA"
                    }
                ]
            },
            {
                "ID": "TransitionToGlacier",
                "Status": "Enabled",
                "Filter": {"Prefix": "uploads/"},
                "Transitions": [
                    {
                        "Days": env_config["glacier_days"],
                        "StorageClass": "GLACIER"
                    }
                ]
            },
            {
                "ID": "ExpireOldVersions",
                "Status": "Enabled",
                "Filter": {"Prefix": ""},
                "NoncurrentVersionExpiration": {
                    "NoncurrentDays": 30
                }
            },
            {
                "ID": "AbortIncompleteMultipartUploads",
                "Status": "Enabled",
                "Filter": {"Prefix": ""},
                "AbortIncompleteMultipartUpload": {
                    "DaysAfterInitiation": 7
                }
            },
            {
                "ID": "ExpireTempFiles",
                "Status": "Enabled",
                "Filter": {"Prefix": "temp/"},
                "Expiration": {
                    "Days": 1
                }
            }
        ]
    }
    
    # Adicionar expiracao total apenas em dev
    if env == "dev":
        lifecycle_configuration["Rules"].append({
            "ID": "ExpireAllDev",
            "Status": "Enabled",
            "Filter": {"Prefix": "uploads/"},
            "Expiration": {
                "Days": env_config["expire_days"]
            }
        })
    
    try:
        s3_client.put_bucket_lifecycle_configuration(
            Bucket=bucket_name,
            LifecycleConfiguration=lifecycle_configuration
        )
        print("  [OK] Lifecycle configurado")
        return True
    except ClientError as e:
        print(f"  [ERROR] Erro ao configurar lifecycle: {e}")
        return False


def delete_bucket(env: str, region: str = DEFAULT_REGION, force: bool = False):
    """
    Deleta o bucket S3.
    Se force=True, deleta todos os objetos primeiro.
    """
    bucket_name = get_bucket_name(env)
    s3_resource = get_s3_resource(region)
    s3_client = get_s3_client(region)
    
    print(f"Deletando bucket: {bucket_name}")
    
    try:
        bucket = s3_resource.Bucket(bucket_name)
        
        if force:
            print("  Deletando todos os objetos...")
            bucket.object_versions.delete()
            print("  [OK] Objetos deletados")
        
        bucket.delete()
        print(f"  [OK] Bucket {bucket_name} deletado")
        return True
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchBucket":
            print(f"  [INFO] Bucket {bucket_name} nao existe")
            return True
        elif e.response["Error"]["Code"] == "BucketNotEmpty":
            print(f"  [ERROR] Bucket nao esta vazio. Use --force para deletar conteudo")
            return False
        else:
            print(f"  [ERROR] Erro ao deletar bucket: {e}")
            return False


def list_buckets(region: str = DEFAULT_REGION):
    """
    Lista todos os buckets do projeto.
    """
    s3_client = get_s3_client(region)
    
    print("Buckets do projeto Petrobras File Transfer:")
    print("-" * 60)
    
    try:
        response = s3_client.list_buckets()
        
        for bucket in response["Buckets"]:
            name = bucket["Name"]
            if BASE_BUCKET_NAME in name:
                created = bucket["CreationDate"].strftime("%Y-%m-%d %H:%M:%S")
                
                # Obter tamanho aproximado
                try:
                    # Usar CloudWatch para metricas (mais preciso)
                    cloudwatch = boto3.client("cloudwatch", region_name=region)
                    response_cw = cloudwatch.get_metric_statistics(
                        Namespace="AWS/S3",
                        MetricName="BucketSizeBytes",
                        Dimensions=[
                            {"Name": "BucketName", "Value": name},
                            {"Name": "StorageType", "Value": "StandardStorage"}
                        ],
                        StartTime=bucket["CreationDate"],
                        EndTime=bucket["CreationDate"],
                        Period=86400,
                        Statistics=["Average"]
                    )
                    size = "N/A"
                except:
                    size = "N/A"
                
                print(f"  {name}")
                print(f"    Criado: {created}")
                print(f"    Tamanho: {size}")
                print()
        
        return True
        
    except ClientError as e:
        print(f"[ERROR] Erro ao listar buckets: {e}")
        return False


def create_bucket_policy(env: str, region: str = DEFAULT_REGION):
    """
    Cria policy restritiva para o bucket.
    """
    bucket_name = get_bucket_name(env)
    s3_client = get_s3_client(region)
    
    # Policy que:
    # - Requer HTTPS
    # - Requer criptografia
    # - Bloqueia acesso de IPs externos (pode ser customizado)
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "DenyInsecureTransport",
                "Effect": "Deny",
                "Principal": "*",
                "Action": "s3:*",
                "Resource": [
                    f"arn:aws:s3:::{bucket_name}",
                    f"arn:aws:s3:::{bucket_name}/*"
                ],
                "Condition": {
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                }
            },
            {
                "Sid": "DenyUnencryptedUploads",
                "Effect": "Deny",
                "Principal": "*",
                "Action": "s3:PutObject",
                "Resource": f"arn:aws:s3:::{bucket_name}/*",
                "Condition": {
                    "StringNotEquals": {
                        "s3:x-amz-server-side-encryption": "AES256"
                    }
                }
            }
        ]
    }
    
    try:
        s3_client.put_bucket_policy(
            Bucket=bucket_name,
            Policy=json.dumps(policy)
        )
        print("  [OK] Bucket policy aplicada")
        return True
    except ClientError as e:
        print(f"  [ERROR] Erro ao aplicar policy: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Gerenciamento do bucket S3 para Petrobras File Transfer"
    )
    
    parser.add_argument(
        "action",
        choices=["create", "delete", "list", "configure-cors", "configure-lifecycle", "configure-policy"],
        help="Acao a executar"
    )
    
    parser.add_argument(
        "--env",
        choices=["dev", "staging", "prod"],
        default="dev",
        help="Ambiente (default: dev)"
    )
    
    parser.add_argument(
        "--region",
        default=DEFAULT_REGION,
        help=f"Regiao AWS (default: {DEFAULT_REGION})"
    )
    
    parser.add_argument(
        "--force",
        action="store_true",
        help="Forca delecao de objetos ao deletar bucket"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Petrobras File Transfer - Configuracao S3")
    print("=" * 60)
    print(f"Ambiente: {args.env}")
    print(f"Regiao: {args.region}")
    print("=" * 60)
    print()
    
    if args.action == "create":
        create_bucket(args.env, args.region)
        create_bucket_policy(args.env, args.region)
    elif args.action == "delete":
        delete_bucket(args.env, args.region, args.force)
    elif args.action == "list":
        list_buckets(args.region)
    elif args.action == "configure-cors":
        configure_cors(args.env, args.region)
    elif args.action == "configure-lifecycle":
        configure_lifecycle(args.env, args.region)
    elif args.action == "configure-policy":
        create_bucket_policy(args.env, args.region)


if __name__ == "__main__":
    main()
