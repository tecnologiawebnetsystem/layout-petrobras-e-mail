#!/usr/bin/env python3
"""
Script para configuracao do AWS Secrets Manager para o sistema de
transferencia segura de arquivos da Petrobras.

Uso:
    python setup_secrets.py create --env dev
    python setup_secrets.py get --env dev --name jwt-secret
    python setup_secrets.py update --env dev --name jwt-secret --value "new-value"
    python setup_secrets.py list
    python setup_secrets.py rotate --env dev --name jwt-secret
    python setup_secrets.py delete --env dev
"""

import boto3
import json
import secrets
import string
import argparse
from botocore.exceptions import ClientError
from datetime import datetime


DEFAULT_REGION = "sa-east-1"
PROJECT_PREFIX = "petrobras-file-transfer"


def get_secrets_client(region: str = DEFAULT_REGION):
    """Retorna cliente Secrets Manager."""
    return boto3.client("secretsmanager", region_name=region)


def generate_secure_password(length: int = 32) -> str:
    """Gera senha segura."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_jwt_secret(length: int = 64) -> str:
    """Gera secret para JWT."""
    return secrets.token_urlsafe(length)


def get_secret_name(env: str, name: str) -> str:
    """Retorna nome padronizado do secret."""
    return f"{PROJECT_PREFIX}/{env}/{name}"


def create_all_secrets(env: str, region: str = DEFAULT_REGION):
    """
    Cria todos os secrets necessarios para a aplicacao.
    """
    sm = get_secrets_client(region)
    
    print(f"Criando secrets para ambiente: {env}")
    print("=" * 60)
    
    # Secrets a criar
    secrets_config = {
        "jwt-secret": {
            "description": "Secret para assinatura de tokens JWT",
            "value": {"secret": generate_jwt_secret()}
        },
        "database": {
            "description": "Credenciais do banco de dados",
            "value": {
                "host": "localhost",
                "port": 5432,
                "database": f"petrobras_transfer_{env}",
                "username": f"app_{env}",
                "password": generate_secure_password()
            }
        },
        "smtp": {
            "description": "Credenciais SMTP para envio de email",
            "value": {
                "server": "smtp.example.com",
                "port": 587,
                "username": "",
                "password": "",
                "from_email": f"no-reply-{env}@petrobras.com.br"
            }
        },
        "entra-id": {
            "description": "Credenciais Microsoft Entra ID (Azure AD)",
            "value": {
                "tenant_id": "",
                "client_id": "",
                "client_secret": "",
                "redirect_uri": f"https://transfer-{env}.petrobras.com.br/api/v1/auth/callback"
            }
        },
        "api-keys": {
            "description": "Chaves de API externas",
            "value": {
                "internal_api_key": generate_secure_password(48),
                "webhook_secret": generate_secure_password(32)
            }
        },
        "encryption": {
            "description": "Chaves de criptografia da aplicacao",
            "value": {
                "file_encryption_key": generate_secure_password(32),
                "otp_encryption_key": generate_secure_password(32)
            }
        }
    }
    
    created_secrets = []
    
    for name, config in secrets_config.items():
        secret_name = get_secret_name(env, name)
        
        print(f"\nCriando secret: {secret_name}")
        
        try:
            response = sm.create_secret(
                Name=secret_name,
                Description=config["description"],
                SecretString=json.dumps(config["value"]),
                Tags=[
                    {"Key": "Project", "Value": "PetrobrasFileTransfer"},
                    {"Key": "Environment", "Value": env},
                    {"Key": "ManagedBy", "Value": "Script"}
                ]
            )
            print(f"  [OK] Criado: {response['ARN']}")
            created_secrets.append(secret_name)
            
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceExistsException":
                print(f"  [INFO] Secret ja existe")
                created_secrets.append(secret_name)
            else:
                print(f"  [ERROR] Erro ao criar: {e}")
    
    print("\n" + "=" * 60)
    print("Secrets criados:")
    for s in created_secrets:
        print(f"  - {s}")
    
    print("\n[IMPORTANTE] Atualize os secrets com valores reais antes de usar em producao!")
    
    return created_secrets


def get_secret(env: str, name: str, region: str = DEFAULT_REGION):
    """
    Recupera valor de um secret.
    """
    sm = get_secrets_client(region)
    secret_name = get_secret_name(env, name)
    
    print(f"Recuperando secret: {secret_name}")
    
    try:
        response = sm.get_secret_value(SecretId=secret_name)
        
        if "SecretString" in response:
            secret_value = json.loads(response["SecretString"])
            
            print(f"\n  ARN: {response['ARN']}")
            print(f"  Versao: {response['VersionId']}")
            print(f"  Criado: {response.get('CreatedDate', 'N/A')}")
            print(f"\n  Valores:")
            
            for key, value in secret_value.items():
                # Mascarar valores sensiveis
                if any(x in key.lower() for x in ["password", "secret", "key"]):
                    masked = value[:4] + "*" * (len(str(value)) - 8) + value[-4:] if len(str(value)) > 8 else "***"
                    print(f"    {key}: {masked}")
                else:
                    print(f"    {key}: {value}")
            
            return secret_value
        else:
            print("  [INFO] Secret e binario")
            return response["SecretBinary"]
            
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceNotFoundException":
            print(f"  [ERROR] Secret nao encontrado")
        else:
            print(f"  [ERROR] Erro ao recuperar: {e}")
        return None


def update_secret(env: str, name: str, key: str, value: str, region: str = DEFAULT_REGION):
    """
    Atualiza um valor especifico dentro do secret.
    """
    sm = get_secrets_client(region)
    secret_name = get_secret_name(env, name)
    
    print(f"Atualizando secret: {secret_name}")
    print(f"  Chave: {key}")
    
    try:
        # Obter valor atual
        current = sm.get_secret_value(SecretId=secret_name)
        secret_value = json.loads(current["SecretString"])
        
        # Atualizar valor
        secret_value[key] = value
        
        # Salvar
        response = sm.update_secret(
            SecretId=secret_name,
            SecretString=json.dumps(secret_value)
        )
        
        print(f"  [OK] Atualizado")
        print(f"  Nova versao: {response['VersionId']}")
        
        return True
        
    except ClientError as e:
        print(f"  [ERROR] Erro ao atualizar: {e}")
        return False


def list_secrets(region: str = DEFAULT_REGION):
    """
    Lista todos os secrets do projeto.
    """
    sm = get_secrets_client(region)
    
    print("Secrets do projeto Petrobras File Transfer:")
    print("=" * 60)
    
    try:
        paginator = sm.get_paginator("list_secrets")
        
        for page in paginator.paginate(
            Filters=[
                {"Key": "name", "Values": [PROJECT_PREFIX]}
            ]
        ):
            for secret in page["SecretList"]:
                name = secret["Name"]
                created = secret.get("CreatedDate", "N/A")
                last_changed = secret.get("LastChangedDate", "N/A")
                
                print(f"\n  {name}")
                print(f"    Descricao: {secret.get('Description', 'N/A')}")
                print(f"    Criado: {created}")
                print(f"    Ultima alteracao: {last_changed}")
                
                # Mostrar tags
                if secret.get("Tags"):
                    env_tag = next(
                        (t["Value"] for t in secret["Tags"] if t["Key"] == "Environment"),
                        "N/A"
                    )
                    print(f"    Ambiente: {env_tag}")
        
        return True
        
    except ClientError as e:
        print(f"[ERROR] Erro ao listar: {e}")
        return False


def rotate_secret(env: str, name: str, region: str = DEFAULT_REGION):
    """
    Rotaciona um secret (gera novo valor).
    """
    sm = get_secrets_client(region)
    secret_name = get_secret_name(env, name)
    
    print(f"Rotacionando secret: {secret_name}")
    
    # Mapeamento de geradores por tipo de secret
    generators = {
        "jwt-secret": lambda: {"secret": generate_jwt_secret()},
        "api-keys": lambda: {
            "internal_api_key": generate_secure_password(48),
            "webhook_secret": generate_secure_password(32)
        },
        "encryption": lambda: {
            "file_encryption_key": generate_secure_password(32),
            "otp_encryption_key": generate_secure_password(32)
        }
    }
    
    try:
        # Obter valor atual
        current = sm.get_secret_value(SecretId=secret_name)
        secret_value = json.loads(current["SecretString"])
        
        # Gerar novos valores
        if name in generators:
            new_values = generators[name]()
            secret_value.update(new_values)
            
            # Atualizar
            response = sm.update_secret(
                SecretId=secret_name,
                SecretString=json.dumps(secret_value)
            )
            
            print(f"  [OK] Secret rotacionado")
            print(f"  Nova versao: {response['VersionId']}")
            print(f"  [WARN] Reinicie a aplicacao para usar os novos valores!")
            
            return True
        else:
            print(f"  [INFO] Secret {name} requer rotacao manual")
            print(f"  Use: python setup_secrets.py update --env {env} --name {name} --key <key> --value <value>")
            return False
            
    except ClientError as e:
        print(f"  [ERROR] Erro ao rotacionar: {e}")
        return False


def delete_secrets(env: str, region: str = DEFAULT_REGION, force: bool = False):
    """
    Deleta todos os secrets de um ambiente.
    """
    sm = get_secrets_client(region)
    
    print(f"Deletando secrets do ambiente: {env}")
    print("=" * 60)
    
    try:
        paginator = sm.get_paginator("list_secrets")
        
        for page in paginator.paginate(
            Filters=[
                {"Key": "name", "Values": [f"{PROJECT_PREFIX}/{env}"]}
            ]
        ):
            for secret in page["SecretList"]:
                name = secret["Name"]
                
                try:
                    if force:
                        sm.delete_secret(
                            SecretId=name,
                            ForceDeleteWithoutRecovery=True
                        )
                        print(f"  [OK] Deletado permanentemente: {name}")
                    else:
                        sm.delete_secret(
                            SecretId=name,
                            RecoveryWindowInDays=7
                        )
                        print(f"  [OK] Agendado para delecao (7 dias): {name}")
                        
                except ClientError as e:
                    print(f"  [ERROR] Erro ao deletar {name}: {e}")
        
        return True
        
    except ClientError as e:
        print(f"[ERROR] Erro ao listar secrets: {e}")
        return False


def export_env_format(env: str, region: str = DEFAULT_REGION):
    """
    Exporta secrets no formato .env
    """
    sm = get_secrets_client(region)
    
    print(f"# Secrets para ambiente: {env}")
    print(f"# Gerado em: {datetime.now().isoformat()}")
    print("#" + "=" * 59)
    print()
    
    secrets_mapping = {
        "jwt-secret": [("secret", "AWS_SESSION_TOKEN")],
        "database": [
            ("host", "DATABASE_HOST"),
            ("port", "DATABASE_PORT"),
            ("database", "DATABASE_NAME"),
            ("username", "DATABASE_USER"),
            ("password", "DATABASE_PASSWORD")
        ],
        "smtp": [
            ("server", "SMTP_SERVER"),
            ("port", "SMTP_PORT"),
            ("username", "SMTP_USER"),
            ("password", "SMTP_PASS"),
            ("from_email", "MAIL_FROM")
        ],
        "entra-id": [
            ("tenant_id", "ENTRA_TENANT_ID"),
            ("client_id", "ENTRA_CLIENT_ID"),
            ("client_secret", "ENTRA_CLIENT_SECRET"),
            ("redirect_uri", "ENTRA_REDIRECT_URI")
        ]
    }
    
    for secret_name, mappings in secrets_mapping.items():
        full_name = get_secret_name(env, secret_name)
        
        try:
            response = sm.get_secret_value(SecretId=full_name)
            secret_value = json.loads(response["SecretString"])
            
            print(f"# {secret_name}")
            for secret_key, env_var in mappings:
                value = secret_value.get(secret_key, "")
                print(f"{env_var}={value}")
            print()
            
        except ClientError:
            print(f"# {secret_name} - NAO ENCONTRADO")
            print()


def main():
    parser = argparse.ArgumentParser(
        description="Gerenciamento de Secrets para Petrobras File Transfer"
    )
    
    parser.add_argument(
        "action",
        choices=["create", "get", "update", "list", "rotate", "delete", "export"],
        help="Acao a executar"
    )
    
    parser.add_argument("--env", choices=["dev", "staging", "prod"], default="dev")
    parser.add_argument("--name", help="Nome do secret")
    parser.add_argument("--key", help="Chave dentro do secret (para update)")
    parser.add_argument("--value", help="Novo valor (para update)")
    parser.add_argument("--region", default=DEFAULT_REGION)
    parser.add_argument("--force", action="store_true", help="Delecao permanente")
    
    args = parser.parse_args()
    
    if args.action != "export":
        print("=" * 60)
        print("Petrobras File Transfer - Secrets Manager")
        print("=" * 60)
        print(f"Ambiente: {args.env}")
        print(f"Regiao: {args.region}")
        print("=" * 60)
    
    if args.action == "create":
        create_all_secrets(args.env, args.region)
    
    elif args.action == "get":
        if not args.name:
            print("[ERROR] --name e obrigatorio")
            return
        get_secret(args.env, args.name, args.region)
    
    elif args.action == "update":
        if not all([args.name, args.key, args.value]):
            print("[ERROR] --name, --key e --value sao obrigatorios")
            return
        update_secret(args.env, args.name, args.key, args.value, args.region)
    
    elif args.action == "list":
        list_secrets(args.region)
    
    elif args.action == "rotate":
        if not args.name:
            print("[ERROR] --name e obrigatorio")
            return
        rotate_secret(args.env, args.name, args.region)
    
    elif args.action == "delete":
        confirm = input(f"Deletar todos os secrets do ambiente {args.env}? (sim/nao): ")
        if confirm.lower() == "sim":
            delete_secrets(args.env, args.region, args.force)
    
    elif args.action == "export":
        export_env_format(args.env, args.region)


if __name__ == "__main__":
    main()
