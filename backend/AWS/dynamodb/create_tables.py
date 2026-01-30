#!/usr/bin/env python3
"""
Script para criacao das tabelas DynamoDB para o sistema de transferencia de arquivos.
Pode ser executado localmente (com DynamoDB Local) ou na AWS.

Uso:
    # Local (DynamoDB Local)
    python create_tables.py --local

    # AWS (requer credenciais configuradas)
    python create_tables.py --region sa-east-1

    # Com profile especifico
    python create_tables.py --region sa-east-1 --profile petrobras-dev
"""

import argparse
import boto3
from botocore.exceptions import ClientError
import json
import time


def get_dynamodb_client(local: bool = False, region: str = "sa-east-1", profile: str = None):
    """Retorna cliente DynamoDB configurado."""
    if local:
        return boto3.client(
            "dynamodb",
            endpoint_url="http://localhost:8000",
            region_name="us-east-1",
            aws_access_key_id="dummy",
            aws_secret_access_key="dummy"
        )
    
    session_kwargs = {}
    if profile:
        session_kwargs["profile_name"] = profile
    
    session = boto3.Session(**session_kwargs)
    return session.client("dynamodb", region_name=region)


def get_dynamodb_resource(local: bool = False, region: str = "sa-east-1", profile: str = None):
    """Retorna resource DynamoDB configurado."""
    if local:
        return boto3.resource(
            "dynamodb",
            endpoint_url="http://localhost:8000",
            region_name="us-east-1",
            aws_access_key_id="dummy",
            aws_secret_access_key="dummy"
        )
    
    session_kwargs = {}
    if profile:
        session_kwargs["profile_name"] = profile
    
    session = boto3.Session(**session_kwargs)
    return session.resource("dynamodb", region_name=region)


# ============================================================
# Definicoes das Tabelas
# ============================================================

TABLES = {
    "pft_users": {
        "TableName": "pft_users",
        "KeySchema": [
            {"AttributeName": "pk", "KeyType": "HASH"},  # USER#<id>
            {"AttributeName": "sk", "KeyType": "RANGE"}  # PROFILE | AREA#<area_id>
        ],
        "AttributeDefinitions": [
            {"AttributeName": "pk", "AttributeType": "S"},
            {"AttributeName": "sk", "AttributeType": "S"},
            {"AttributeName": "email", "AttributeType": "S"},
            {"AttributeName": "type", "AttributeType": "S"},
            {"AttributeName": "gsi1pk", "AttributeType": "S"},
            {"AttributeName": "gsi1sk", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "email-index",
                "KeySchema": [
                    {"AttributeName": "email", "KeyType": "HASH"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            },
            {
                "IndexName": "type-index",
                "KeySchema": [
                    {"AttributeName": "type", "KeyType": "HASH"},
                    {"AttributeName": "sk", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            },
            {
                "IndexName": "gsi1-index",
                "KeySchema": [
                    {"AttributeName": "gsi1pk", "KeyType": "HASH"},
                    {"AttributeName": "gsi1sk", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            }
        ],
        "ProvisionedThroughput": {"ReadCapacityUnits": 10, "WriteCapacityUnits": 10},
        "Tags": [
            {"Key": "Project", "Value": "PetrobrasFileTransfer"},
            {"Key": "Environment", "Value": "production"}
        ]
    },
    
    "pft_shares": {
        "TableName": "pft_shares",
        "KeySchema": [
            {"AttributeName": "pk", "KeyType": "HASH"},  # SHARE#<id>
            {"AttributeName": "sk", "KeyType": "RANGE"}  # METADATA | FILE#<file_id>
        ],
        "AttributeDefinitions": [
            {"AttributeName": "pk", "AttributeType": "S"},
            {"AttributeName": "sk", "AttributeType": "S"},
            {"AttributeName": "status", "AttributeType": "S"},
            {"AttributeName": "created_by_id", "AttributeType": "S"},
            {"AttributeName": "external_email", "AttributeType": "S"},
            {"AttributeName": "area_id", "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "S"},
            {"AttributeName": "expires_at", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "status-created-index",
                "KeySchema": [
                    {"AttributeName": "status", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 10, "WriteCapacityUnits": 5}
            },
            {
                "IndexName": "creator-index",
                "KeySchema": [
                    {"AttributeName": "created_by_id", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            },
            {
                "IndexName": "external-email-index",
                "KeySchema": [
                    {"AttributeName": "external_email", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            },
            {
                "IndexName": "area-index",
                "KeySchema": [
                    {"AttributeName": "area_id", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            },
            {
                "IndexName": "expiration-index",
                "KeySchema": [
                    {"AttributeName": "status", "KeyType": "HASH"},
                    {"AttributeName": "expires_at", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "KEYS_ONLY"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            }
        ],
        "ProvisionedThroughput": {"ReadCapacityUnits": 20, "WriteCapacityUnits": 10},
        "Tags": [
            {"Key": "Project", "Value": "PetrobrasFileTransfer"},
            {"Key": "Environment", "Value": "production"}
        ]
    },
    
    "pft_files": {
        "TableName": "pft_files",
        "KeySchema": [
            {"AttributeName": "pk", "KeyType": "HASH"},  # FILE#<id>
            {"AttributeName": "sk", "KeyType": "RANGE"}  # METADATA
        ],
        "AttributeDefinitions": [
            {"AttributeName": "pk", "AttributeType": "S"},
            {"AttributeName": "sk", "AttributeType": "S"},
            {"AttributeName": "area_id", "AttributeType": "S"},
            {"AttributeName": "upload_by_id", "AttributeType": "S"},
            {"AttributeName": "hash_sha256", "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "area-index",
                "KeySchema": [
                    {"AttributeName": "area_id", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            },
            {
                "IndexName": "uploader-index",
                "KeySchema": [
                    {"AttributeName": "upload_by_id", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            },
            {
                "IndexName": "hash-index",
                "KeySchema": [
                    {"AttributeName": "hash_sha256", "KeyType": "HASH"}
                ],
                "Projection": {"ProjectionType": "KEYS_ONLY"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            }
        ],
        "ProvisionedThroughput": {"ReadCapacityUnits": 10, "WriteCapacityUnits": 10},
        "Tags": [
            {"Key": "Project", "Value": "PetrobrasFileTransfer"},
            {"Key": "Environment", "Value": "production"}
        ]
    },
    
    "pft_areas": {
        "TableName": "pft_areas",
        "KeySchema": [
            {"AttributeName": "pk", "KeyType": "HASH"},  # AREA#<id>
            {"AttributeName": "sk", "KeyType": "RANGE"}  # METADATA | SUPERVISOR#<user_id>
        ],
        "AttributeDefinitions": [
            {"AttributeName": "pk", "AttributeType": "S"},
            {"AttributeName": "sk", "AttributeType": "S"},
            {"AttributeName": "name", "AttributeType": "S"},
            {"AttributeName": "applicant_id", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "name-index",
                "KeySchema": [
                    {"AttributeName": "name", "KeyType": "HASH"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            },
            {
                "IndexName": "applicant-index",
                "KeySchema": [
                    {"AttributeName": "applicant_id", "KeyType": "HASH"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            }
        ],
        "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        "Tags": [
            {"Key": "Project", "Value": "PetrobrasFileTransfer"},
            {"Key": "Environment", "Value": "production"}
        ]
    },
    
    "pft_tokens": {
        "TableName": "pft_tokens",
        "KeySchema": [
            {"AttributeName": "pk", "KeyType": "HASH"},  # TOKEN#<token_hash>
            {"AttributeName": "sk", "KeyType": "RANGE"}  # METADATA
        ],
        "AttributeDefinitions": [
            {"AttributeName": "pk", "AttributeType": "S"},
            {"AttributeName": "sk", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "share_id", "AttributeType": "S"},
            {"AttributeName": "expires_at", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "user-index",
                "KeySchema": [
                    {"AttributeName": "user_id", "KeyType": "HASH"},
                    {"AttributeName": "expires_at", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            },
            {
                "IndexName": "share-index",
                "KeySchema": [
                    {"AttributeName": "share_id", "KeyType": "HASH"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            }
        ],
        "ProvisionedThroughput": {"ReadCapacityUnits": 10, "WriteCapacityUnits": 10},
        "TimeToLiveSpecification": {
            "Enabled": True,
            "AttributeName": "ttl"
        },
        "Tags": [
            {"Key": "Project", "Value": "PetrobrasFileTransfer"},
            {"Key": "Environment", "Value": "production"}
        ]
    },
    
    "pft_audit": {
        "TableName": "pft_audit",
        "KeySchema": [
            {"AttributeName": "pk", "KeyType": "HASH"},  # AUDIT#<yyyy-mm>
            {"AttributeName": "sk", "KeyType": "RANGE"}  # <timestamp>#<id>
        ],
        "AttributeDefinitions": [
            {"AttributeName": "pk", "AttributeType": "S"},
            {"AttributeName": "sk", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "action", "AttributeType": "S"},
            {"AttributeName": "level", "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "user-action-index",
                "KeySchema": [
                    {"AttributeName": "user_id", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 10, "WriteCapacityUnits": 5}
            },
            {
                "IndexName": "action-index",
                "KeySchema": [
                    {"AttributeName": "action", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            },
            {
                "IndexName": "level-index",
                "KeySchema": [
                    {"AttributeName": "level", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "KEYS_ONLY"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            }
        ],
        "ProvisionedThroughput": {"ReadCapacityUnits": 20, "WriteCapacityUnits": 20},
        "Tags": [
            {"Key": "Project", "Value": "PetrobrasFileTransfer"},
            {"Key": "Environment", "Value": "production"}
        ]
    },
    
    "pft_notifications": {
        "TableName": "pft_notifications",
        "KeySchema": [
            {"AttributeName": "pk", "KeyType": "HASH"},  # USER#<user_id>
            {"AttributeName": "sk", "KeyType": "RANGE"}  # NOTIFICATION#<timestamp>#<id>
        ],
        "AttributeDefinitions": [
            {"AttributeName": "pk", "AttributeType": "S"},
            {"AttributeName": "sk", "AttributeType": "S"},
            {"AttributeName": "read", "AttributeType": "S"},
            {"AttributeName": "type", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "unread-index",
                "KeySchema": [
                    {"AttributeName": "pk", "KeyType": "HASH"},
                    {"AttributeName": "read", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 10, "WriteCapacityUnits": 5}
            },
            {
                "IndexName": "type-index",
                "KeySchema": [
                    {"AttributeName": "type", "KeyType": "HASH"},
                    {"AttributeName": "sk", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            }
        ],
        "ProvisionedThroughput": {"ReadCapacityUnits": 10, "WriteCapacityUnits": 10},
        "TimeToLiveSpecification": {
            "Enabled": True,
            "AttributeName": "ttl"
        },
        "Tags": [
            {"Key": "Project", "Value": "PetrobrasFileTransfer"},
            {"Key": "Environment", "Value": "production"}
        ]
    },
    
    "pft_credentials": {
        "TableName": "pft_credentials",
        "KeySchema": [
            {"AttributeName": "pk", "KeyType": "HASH"},  # CRED#<email>
            {"AttributeName": "sk", "KeyType": "RANGE"}  # LOCAL | ENTRA
        ],
        "AttributeDefinitions": [
            {"AttributeName": "pk", "AttributeType": "S"},
            {"AttributeName": "sk", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "user-index",
                "KeySchema": [
                    {"AttributeName": "user_id", "KeyType": "HASH"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            }
        ],
        "ProvisionedThroughput": {"ReadCapacityUnits": 10, "WriteCapacityUnits": 5},
        "Tags": [
            {"Key": "Project", "Value": "PetrobrasFileTransfer"},
            {"Key": "Environment", "Value": "production"}
        ]
    }
}


def create_table(client, table_config: dict, wait: bool = True) -> bool:
    """Cria uma tabela no DynamoDB."""
    table_name = table_config["TableName"]
    
    try:
        # Remove TTL config para criacao (aplicado separadamente)
        ttl_config = table_config.pop("TimeToLiveSpecification", None)
        
        print(f"Criando tabela: {table_name}...")
        client.create_table(**table_config)
        
        if wait:
            print(f"  Aguardando tabela {table_name} ficar ativa...")
            waiter = client.get_waiter("table_exists")
            waiter.wait(TableName=table_name)
        
        # Aplica TTL se configurado
        if ttl_config and ttl_config.get("Enabled"):
            print(f"  Configurando TTL para {table_name}...")
            time.sleep(2)  # Aguarda tabela estabilizar
            client.update_time_to_live(
                TableName=table_name,
                TimeToLiveSpecification=ttl_config
            )
        
        print(f"  Tabela {table_name} criada com sucesso!")
        return True
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceInUseException":
            print(f"  Tabela {table_name} ja existe.")
            return True
        else:
            print(f"  Erro ao criar tabela {table_name}: {e}")
            return False


def delete_table(client, table_name: str, wait: bool = True) -> bool:
    """Deleta uma tabela do DynamoDB."""
    try:
        print(f"Deletando tabela: {table_name}...")
        client.delete_table(TableName=table_name)
        
        if wait:
            print(f"  Aguardando tabela {table_name} ser deletada...")
            waiter = client.get_waiter("table_not_exists")
            waiter.wait(TableName=table_name)
        
        print(f"  Tabela {table_name} deletada com sucesso!")
        return True
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceNotFoundException":
            print(f"  Tabela {table_name} nao existe.")
            return True
        else:
            print(f"  Erro ao deletar tabela {table_name}: {e}")
            return False


def list_tables(client) -> list:
    """Lista todas as tabelas."""
    try:
        response = client.list_tables()
        return response.get("TableNames", [])
    except ClientError as e:
        print(f"Erro ao listar tabelas: {e}")
        return []


def describe_table(client, table_name: str) -> dict:
    """Descreve uma tabela."""
    try:
        response = client.describe_table(TableName=table_name)
        return response.get("Table", {})
    except ClientError as e:
        print(f"Erro ao descrever tabela {table_name}: {e}")
        return {}


def main():
    parser = argparse.ArgumentParser(description="Gerencia tabelas DynamoDB do PFT")
    parser.add_argument("--local", action="store_true", help="Usa DynamoDB Local")
    parser.add_argument("--region", default="sa-east-1", help="Regiao AWS")
    parser.add_argument("--profile", help="AWS Profile")
    parser.add_argument("--action", choices=["create", "delete", "list", "describe"], 
                       default="create", help="Acao a executar")
    parser.add_argument("--table", help="Tabela especifica (para delete/describe)")
    parser.add_argument("--no-wait", action="store_true", help="Nao aguarda conclusao")
    
    args = parser.parse_args()
    
    client = get_dynamodb_client(
        local=args.local,
        region=args.region,
        profile=args.profile
    )
    
    if args.action == "list":
        tables = list_tables(client)
        print("\nTabelas existentes:")
        for t in tables:
            print(f"  - {t}")
        print(f"\nTotal: {len(tables)} tabelas")
        
    elif args.action == "describe":
        if args.table:
            info = describe_table(client, args.table)
            print(json.dumps(info, indent=2, default=str))
        else:
            print("Especifique --table para descrever")
            
    elif args.action == "delete":
        if args.table:
            delete_table(client, args.table, wait=not args.no_wait)
        else:
            confirm = input("Deletar TODAS as tabelas pft_*? (sim/nao): ")
            if confirm.lower() == "sim":
                for table_name in TABLES.keys():
                    delete_table(client, table_name, wait=not args.no_wait)
            else:
                print("Operacao cancelada.")
                
    elif args.action == "create":
        print("\n" + "="*60)
        print("Criando tabelas DynamoDB para Petrobras File Transfer")
        print("="*60 + "\n")
        
        success_count = 0
        for table_name, config in TABLES.items():
            # Cria copia para nao modificar original
            table_config = json.loads(json.dumps(config))
            if create_table(client, table_config, wait=not args.no_wait):
                success_count += 1
        
        print("\n" + "="*60)
        print(f"Criacao concluida: {success_count}/{len(TABLES)} tabelas")
        print("="*60 + "\n")


if __name__ == "__main__":
    main()
