#!/usr/bin/env python3
"""
Script para criacao e configuracao de chaves KMS para o sistema de
transferencia segura de arquivos da Petrobras.

Uso:
    python setup_kms.py create-key [--env dev|staging|prod]
    python setup_kms.py create-alias [--env dev|staging|prod]
    python setup_kms.py list
    python setup_kms.py rotate [--env dev|staging|prod]
    python setup_kms.py describe [--env dev|staging|prod]
"""

import boto3
import json
import argparse
from botocore.exceptions import ClientError


DEFAULT_REGION = "sa-east-1"
PROJECT_PREFIX = "petrobras-file-transfer"


def get_kms_client(region: str = DEFAULT_REGION):
    """Retorna cliente KMS."""
    return boto3.client("kms", region_name=region)


def get_sts_client():
    """Retorna cliente STS."""
    return boto3.client("sts")


def get_account_id():
    """Obtem Account ID."""
    return get_sts_client().get_caller_identity()["Account"]


def create_key(env: str, region: str = DEFAULT_REGION):
    """
    Cria chave KMS para criptografia de dados sensiveis.
    """
    kms = get_kms_client(region)
    account_id = get_account_id()
    
    key_alias = f"alias/{PROJECT_PREFIX}-{env}"
    
    print(f"Criando chave KMS para ambiente: {env}")
    
    # Key policy
    key_policy = {
        "Version": "2012-10-17",
        "Id": f"{PROJECT_PREFIX}-key-policy-{env}",
        "Statement": [
            {
                "Sid": "Enable IAM User Permissions",
                "Effect": "Allow",
                "Principal": {
                    "AWS": f"arn:aws:iam::{account_id}:root"
                },
                "Action": "kms:*",
                "Resource": "*"
            },
            {
                "Sid": "Allow Application Role",
                "Effect": "Allow",
                "Principal": {
                    "AWS": f"arn:aws:iam::{account_id}:role/{PROJECT_PREFIX}-app-role-{env}"
                },
                "Action": [
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ],
                "Resource": "*"
            },
            {
                "Sid": "Allow S3 Service",
                "Effect": "Allow",
                "Principal": {
                    "Service": "s3.amazonaws.com"
                },
                "Action": [
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ],
                "Resource": "*",
                "Condition": {
                    "StringEquals": {
                        "kms:CallerAccount": account_id
                    }
                }
            },
            {
                "Sid": "Allow CloudWatch Logs",
                "Effect": "Allow",
                "Principal": {
                    "Service": f"logs.{region}.amazonaws.com"
                },
                "Action": [
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ],
                "Resource": "*",
                "Condition": {
                    "ArnLike": {
                        "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{region}:{account_id}:log-group:/petrobras-file-transfer/*"
                    }
                }
            }
        ]
    }
    
    try:
        # Verificar se ja existe
        try:
            existing = kms.describe_key(KeyId=key_alias)
            print(f"  [INFO] Chave ja existe: {existing['KeyMetadata']['KeyId']}")
            return existing["KeyMetadata"]["KeyId"]
        except ClientError as e:
            if e.response["Error"]["Code"] != "NotFoundException":
                raise
        
        # Criar chave
        response = kms.create_key(
            Description=f"Chave KMS para Petrobras File Transfer - {env}",
            KeyUsage="ENCRYPT_DECRYPT",
            KeySpec="SYMMETRIC_DEFAULT",
            Policy=json.dumps(key_policy),
            Tags=[
                {"TagKey": "Project", "TagValue": "PetrobrasFileTransfer"},
                {"TagKey": "Environment", "TagValue": env}
            ],
            MultiRegion=False
        )
        
        key_id = response["KeyMetadata"]["KeyId"]
        key_arn = response["KeyMetadata"]["Arn"]
        
        print(f"  [OK] Chave criada: {key_id}")
        
        # Habilitar rotacao automatica
        kms.enable_key_rotation(KeyId=key_id)
        print(f"  [OK] Rotacao automatica habilitada (anual)")
        
        # Criar alias
        try:
            kms.create_alias(
                AliasName=key_alias,
                TargetKeyId=key_id
            )
            print(f"  [OK] Alias criado: {key_alias}")
        except ClientError as e:
            if e.response["Error"]["Code"] == "AlreadyExistsException":
                print(f"  [INFO] Alias ja existe")
            else:
                raise
        
        print(f"\nPara usar no .env:")
        print(f"  KMS_KEY_ID={key_id}")
        print(f"  KMS_KEY_ALIAS={key_alias}")
        print(f"  KMS_KEY_ARN={key_arn}")
        
        return key_id
        
    except ClientError as e:
        print(f"  [ERROR] Erro ao criar chave: {e}")
        return None


def create_data_key(env: str, region: str = DEFAULT_REGION):
    """
    Gera uma data key para criptografia de envelope.
    """
    kms = get_kms_client(region)
    key_alias = f"alias/{PROJECT_PREFIX}-{env}"
    
    print(f"Gerando data key usando: {key_alias}")
    
    try:
        response = kms.generate_data_key(
            KeyId=key_alias,
            KeySpec="AES_256",
            EncryptionContext={
                "purpose": "file-encryption",
                "environment": env
            }
        )
        
        print(f"  [OK] Data key gerada")
        print(f"  Plaintext key (base64): {response['Plaintext'][:20]}... (truncado)")
        print(f"  Ciphertext blob length: {len(response['CiphertextBlob'])} bytes")
        
        return response
        
    except ClientError as e:
        print(f"  [ERROR] Erro ao gerar data key: {e}")
        return None


def list_keys(region: str = DEFAULT_REGION):
    """
    Lista todas as chaves KMS do projeto.
    """
    kms = get_kms_client(region)
    
    print("Chaves KMS do projeto Petrobras File Transfer:")
    print("=" * 60)
    
    try:
        # Listar aliases do projeto
        paginator = kms.get_paginator("list_aliases")
        
        for page in paginator.paginate():
            for alias in page["Aliases"]:
                if PROJECT_PREFIX in alias["AliasName"]:
                    alias_name = alias["AliasName"]
                    key_id = alias.get("TargetKeyId", "N/A")
                    
                    # Obter detalhes da chave
                    if key_id != "N/A":
                        try:
                            key_info = kms.describe_key(KeyId=key_id)
                            key_meta = key_info["KeyMetadata"]
                            
                            print(f"\n  Alias: {alias_name}")
                            print(f"  Key ID: {key_id}")
                            print(f"  Status: {key_meta['KeyState']}")
                            print(f"  Criada: {key_meta['CreationDate']}")
                            
                            # Verificar rotacao
                            rotation = kms.get_key_rotation_status(KeyId=key_id)
                            print(f"  Rotacao automatica: {'Sim' if rotation['KeyRotationEnabled'] else 'Nao'}")
                            
                        except ClientError as e:
                            print(f"  [WARN] Nao foi possivel obter detalhes: {e}")
        
        return True
        
    except ClientError as e:
        print(f"[ERROR] Erro ao listar chaves: {e}")
        return False


def describe_key(env: str, region: str = DEFAULT_REGION):
    """
    Mostra detalhes de uma chave especifica.
    """
    kms = get_kms_client(region)
    key_alias = f"alias/{PROJECT_PREFIX}-{env}"
    
    print(f"Detalhes da chave: {key_alias}")
    print("=" * 60)
    
    try:
        response = kms.describe_key(KeyId=key_alias)
        meta = response["KeyMetadata"]
        
        print(f"\n  Key ID: {meta['KeyId']}")
        print(f"  ARN: {meta['Arn']}")
        print(f"  Status: {meta['KeyState']}")
        print(f"  Uso: {meta['KeyUsage']}")
        print(f"  Spec: {meta['KeySpec']}")
        print(f"  Criada: {meta['CreationDate']}")
        print(f"  Descricao: {meta.get('Description', 'N/A')}")
        print(f"  Multi-Region: {meta.get('MultiRegion', False)}")
        
        # Rotacao
        rotation = kms.get_key_rotation_status(KeyId=meta["KeyId"])
        print(f"\n  Rotacao automatica: {'Habilitada' if rotation['KeyRotationEnabled'] else 'Desabilitada'}")
        
        # Policy
        policy = kms.get_key_policy(KeyId=meta["KeyId"], PolicyName="default")
        print(f"\n  Key Policy:")
        policy_json = json.loads(policy["Policy"])
        for stmt in policy_json.get("Statement", []):
            print(f"    - {stmt.get('Sid', 'N/A')}: {stmt.get('Effect')}")
        
        # Tags
        tags = kms.list_resource_tags(KeyId=meta["KeyId"])
        if tags["Tags"]:
            print(f"\n  Tags:")
            for tag in tags["Tags"]:
                print(f"    {tag['TagKey']}: {tag['TagValue']}")
        
        return True
        
    except ClientError as e:
        print(f"[ERROR] Erro ao descrever chave: {e}")
        return False


def rotate_key(env: str, region: str = DEFAULT_REGION):
    """
    Inicia rotacao manual da chave (cria novo material de chave).
    """
    kms = get_kms_client(region)
    key_alias = f"alias/{PROJECT_PREFIX}-{env}"
    
    print(f"Rotacionando chave: {key_alias}")
    
    try:
        # Obter key ID
        key_info = kms.describe_key(KeyId=key_alias)
        key_id = key_info["KeyMetadata"]["KeyId"]
        
        # Verificar se rotacao automatica esta habilitada
        rotation = kms.get_key_rotation_status(KeyId=key_id)
        
        if rotation["KeyRotationEnabled"]:
            print(f"  [INFO] Rotacao automatica ja esta habilitada")
            print(f"  [INFO] AWS rotaciona automaticamente a cada 365 dias")
            print(f"  [INFO] Para rotacao imediata, desabilite a automatica primeiro")
        else:
            # Habilitar rotacao
            kms.enable_key_rotation(KeyId=key_id)
            print(f"  [OK] Rotacao automatica habilitada")
        
        return True
        
    except ClientError as e:
        print(f"[ERROR] Erro ao rotacionar chave: {e}")
        return False


def disable_key(env: str, region: str = DEFAULT_REGION):
    """
    Desabilita uma chave KMS.
    """
    kms = get_kms_client(region)
    key_alias = f"alias/{PROJECT_PREFIX}-{env}"
    
    print(f"Desabilitando chave: {key_alias}")
    
    try:
        key_info = kms.describe_key(KeyId=key_alias)
        key_id = key_info["KeyMetadata"]["KeyId"]
        
        kms.disable_key(KeyId=key_id)
        print(f"  [OK] Chave desabilitada")
        print(f"  [WARN] Dados criptografados com esta chave nao poderao ser descriptografados!")
        
        return True
        
    except ClientError as e:
        print(f"[ERROR] Erro ao desabilitar chave: {e}")
        return False


def schedule_key_deletion(env: str, days: int = 30, region: str = DEFAULT_REGION):
    """
    Agenda delecao de uma chave KMS.
    """
    kms = get_kms_client(region)
    key_alias = f"alias/{PROJECT_PREFIX}-{env}"
    
    print(f"Agendando delecao da chave: {key_alias}")
    print(f"[WARN] A chave sera deletada em {days} dias!")
    
    try:
        key_info = kms.describe_key(KeyId=key_alias)
        key_id = key_info["KeyMetadata"]["KeyId"]
        
        # Deletar alias primeiro
        try:
            kms.delete_alias(AliasName=key_alias)
            print(f"  [OK] Alias deletado")
        except ClientError:
            pass
        
        # Agendar delecao
        response = kms.schedule_key_deletion(
            KeyId=key_id,
            PendingWindowInDays=days
        )
        
        print(f"  [OK] Delecao agendada para: {response['DeletionDate']}")
        print(f"  [INFO] Use 'cancel-key-deletion' para cancelar antes do prazo")
        
        return True
        
    except ClientError as e:
        print(f"[ERROR] Erro ao agendar delecao: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Gerenciamento KMS para Petrobras File Transfer"
    )
    
    parser.add_argument(
        "action",
        choices=[
            "create-key", "generate-data-key", "list", "describe",
            "rotate", "disable", "schedule-deletion"
        ],
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
        "--days",
        type=int,
        default=30,
        help="Dias para delecao agendada (default: 30)"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Petrobras File Transfer - Configuracao KMS")
    print("=" * 60)
    print(f"Ambiente: {args.env}")
    print(f"Regiao: {args.region}")
    print("=" * 60)
    print()
    
    if args.action == "create-key":
        create_key(args.env, args.region)
    
    elif args.action == "generate-data-key":
        create_data_key(args.env, args.region)
    
    elif args.action == "list":
        list_keys(args.region)
    
    elif args.action == "describe":
        describe_key(args.env, args.region)
    
    elif args.action == "rotate":
        rotate_key(args.env, args.region)
    
    elif args.action == "disable":
        confirm = input(f"Tem certeza que deseja desabilitar a chave do ambiente {args.env}? (sim/nao): ")
        if confirm.lower() == "sim":
            disable_key(args.env, args.region)
    
    elif args.action == "schedule-deletion":
        confirm = input(f"Tem certeza que deseja agendar delecao da chave do ambiente {args.env}? (sim/nao): ")
        if confirm.lower() == "sim":
            schedule_key_deletion(args.env, args.days, args.region)


if __name__ == "__main__":
    main()
