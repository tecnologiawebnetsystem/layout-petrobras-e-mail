#!/usr/bin/env python3
"""
Script para configuracao do Amazon Cognito para o sistema de
transferencia segura de arquivos da Petrobras.

Cognito pode ser usado como alternativa ao Microsoft Entra ID para
autenticacao de usuarios internos.

Uso:
    python setup_cognito.py create-user-pool [--env dev|staging|prod]
    python setup_cognito.py create-app-client [--env dev|staging|prod]
    python setup_cognito.py create-user --email user@example.com [--env dev|staging|prod]
    python setup_cognito.py list
    python setup_cognito.py delete [--env dev|staging|prod]
"""

import boto3
import json
import argparse
from botocore.exceptions import ClientError


DEFAULT_REGION = "sa-east-1"
PROJECT_PREFIX = "petrobras-file-transfer"


def get_cognito_client(region: str = DEFAULT_REGION):
    """Retorna cliente Cognito Identity Provider."""
    return boto3.client("cognito-idp", region_name=region)


def create_user_pool(env: str, region: str = DEFAULT_REGION):
    """
    Cria User Pool do Cognito.
    """
    cognito = get_cognito_client(region)
    pool_name = f"{PROJECT_PREFIX}-{env}"
    
    print(f"Criando User Pool: {pool_name}")
    
    # Configuracao do User Pool
    try:
        response = cognito.create_user_pool(
            PoolName=pool_name,
            Policies={
                "PasswordPolicy": {
                    "MinimumLength": 12,
                    "RequireUppercase": True,
                    "RequireLowercase": True,
                    "RequireNumbers": True,
                    "RequireSymbols": True,
                    "TemporaryPasswordValidityDays": 7
                }
            },
            AutoVerifiedAttributes=["email"],
            UsernameAttributes=["email"],
            VerificationMessageTemplate={
                "DefaultEmailOption": "CONFIRM_WITH_CODE",
                "EmailSubject": "Codigo de verificacao - Petrobras File Transfer",
                "EmailMessage": "Seu codigo de verificacao e: {####}"
            },
            MfaConfiguration="OPTIONAL",
            EnabledMfas=["SOFTWARE_TOKEN_MFA"],
            EmailConfiguration={
                "EmailSendingAccount": "COGNITO_DEFAULT"  # Usar SES em producao
            },
            AdminCreateUserConfig={
                "AllowAdminCreateUserOnly": True,  # Apenas admin pode criar usuarios
                "InviteMessageTemplate": {
                    "EmailSubject": "Bem-vindo ao Petrobras File Transfer",
                    "EmailMessage": "Seu usuario foi criado. Usuario: {username}, Senha temporaria: {####}"
                }
            },
            Schema=[
                {
                    "Name": "email",
                    "AttributeDataType": "String",
                    "Required": True,
                    "Mutable": True
                },
                {
                    "Name": "name",
                    "AttributeDataType": "String",
                    "Required": True,
                    "Mutable": True
                },
                {
                    "Name": "department",
                    "AttributeDataType": "String",
                    "Required": False,
                    "Mutable": True
                },
                {
                    "Name": "employee_id",
                    "AttributeDataType": "String",
                    "Required": False,
                    "Mutable": True
                },
                {
                    "Name": "role",
                    "AttributeDataType": "String",
                    "Required": False,
                    "Mutable": True
                },
                {
                    "Name": "area_id",
                    "AttributeDataType": "String",
                    "Required": False,
                    "Mutable": True
                },
                {
                    "Name": "is_supervisor",
                    "AttributeDataType": "String",
                    "Required": False,
                    "Mutable": True
                }
            ],
            UsernameConfiguration={
                "CaseSensitive": False
            },
            AccountRecoverySetting={
                "RecoveryMechanisms": [
                    {"Priority": 1, "Name": "verified_email"}
                ]
            },
            UserPoolTags={
                "Project": "PetrobrasFileTransfer",
                "Environment": env
            }
        )
        
        pool_id = response["UserPool"]["Id"]
        pool_arn = response["UserPool"]["Arn"]
        
        print(f"  [OK] User Pool criado")
        print(f"  Pool ID: {pool_id}")
        print(f"  ARN: {pool_arn}")
        
        # Criar grupos
        create_user_groups(pool_id, region)
        
        return pool_id
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceExistsException":
            print(f"  [INFO] User Pool ja existe")
            # Buscar pool existente
            pools = cognito.list_user_pools(MaxResults=60)
            for pool in pools["UserPools"]:
                if pool["Name"] == pool_name:
                    return pool["Id"]
        else:
            print(f"  [ERROR] Erro ao criar: {e}")
        return None


def create_user_groups(pool_id: str, region: str = DEFAULT_REGION):
    """
    Cria grupos de usuarios no User Pool.
    """
    cognito = get_cognito_client(region)
    
    groups = [
        {
            "name": "supervisors",
            "description": "Supervisores que aprovam compartilhamentos",
            "precedence": 1
        },
        {
            "name": "internal_users",
            "description": "Usuarios internos que criam compartilhamentos",
            "precedence": 2
        },
        {
            "name": "admins",
            "description": "Administradores do sistema",
            "precedence": 0
        }
    ]
    
    print("\n  Criando grupos...")
    
    for group in groups:
        try:
            cognito.create_group(
                GroupName=group["name"],
                UserPoolId=pool_id,
                Description=group["description"],
                Precedence=group["precedence"]
            )
            print(f"    [OK] Grupo criado: {group['name']}")
        except ClientError as e:
            if e.response["Error"]["Code"] == "GroupExistsException":
                print(f"    [INFO] Grupo ja existe: {group['name']}")
            else:
                print(f"    [ERROR] Erro ao criar grupo {group['name']}: {e}")


def create_app_client(env: str, pool_id: str = None, region: str = DEFAULT_REGION):
    """
    Cria App Client para a aplicacao.
    """
    cognito = get_cognito_client(region)
    
    # Buscar pool_id se nao fornecido
    if not pool_id:
        pool_name = f"{PROJECT_PREFIX}-{env}"
        pools = cognito.list_user_pools(MaxResults=60)
        for pool in pools["UserPools"]:
            if pool["Name"] == pool_name:
                pool_id = pool["Id"]
                break
    
    if not pool_id:
        print("[ERROR] User Pool nao encontrado. Crie primeiro com create-user-pool")
        return None
    
    client_name = f"{PROJECT_PREFIX}-{env}-client"
    
    print(f"\nCriando App Client: {client_name}")
    
    # URLs de callback por ambiente
    callback_urls = {
        "dev": ["http://localhost:3000/api/auth/callback/cognito"],
        "staging": ["https://staging.petrobras-transfer.com.br/api/auth/callback/cognito"],
        "prod": ["https://transfer.petrobras.com.br/api/auth/callback/cognito"]
    }
    
    logout_urls = {
        "dev": ["http://localhost:3000"],
        "staging": ["https://staging.petrobras-transfer.com.br"],
        "prod": ["https://transfer.petrobras.com.br"]
    }
    
    try:
        response = cognito.create_user_pool_client(
            UserPoolId=pool_id,
            ClientName=client_name,
            GenerateSecret=True,
            RefreshTokenValidity=30,
            AccessTokenValidity=1,
            IdTokenValidity=1,
            TokenValidityUnits={
                "AccessToken": "hours",
                "IdToken": "hours",
                "RefreshToken": "days"
            },
            ExplicitAuthFlows=[
                "ALLOW_USER_PASSWORD_AUTH",
                "ALLOW_REFRESH_TOKEN_AUTH",
                "ALLOW_USER_SRP_AUTH"
            ],
            SupportedIdentityProviders=["COGNITO"],
            CallbackURLs=callback_urls.get(env, callback_urls["dev"]),
            LogoutURLs=logout_urls.get(env, logout_urls["dev"]),
            AllowedOAuthFlows=["code"],
            AllowedOAuthScopes=["email", "openid", "profile"],
            AllowedOAuthFlowsUserPoolClient=True,
            PreventUserExistenceErrors="ENABLED",
            EnableTokenRevocation=True
        )
        
        client_id = response["UserPoolClient"]["ClientId"]
        client_secret = response["UserPoolClient"]["ClientSecret"]
        
        print(f"  [OK] App Client criado")
        print(f"  Client ID: {client_id}")
        print(f"  Client Secret: {client_secret[:10]}...")
        
        print(f"\n  Adicione ao .env:")
        print(f"  COGNITO_USER_POOL_ID={pool_id}")
        print(f"  COGNITO_CLIENT_ID={client_id}")
        print(f"  COGNITO_CLIENT_SECRET={client_secret}")
        print(f"  COGNITO_DOMAIN=https://{PROJECT_PREFIX}-{env}.auth.{region}.amazoncognito.com")
        
        return client_id
        
    except ClientError as e:
        print(f"  [ERROR] Erro ao criar: {e}")
        return None


def create_domain(env: str, pool_id: str = None, region: str = DEFAULT_REGION):
    """
    Cria dominio Cognito para hosted UI.
    """
    cognito = get_cognito_client(region)
    
    if not pool_id:
        pool_name = f"{PROJECT_PREFIX}-{env}"
        pools = cognito.list_user_pools(MaxResults=60)
        for pool in pools["UserPools"]:
            if pool["Name"] == pool_name:
                pool_id = pool["Id"]
                break
    
    domain = f"{PROJECT_PREFIX}-{env}"
    
    print(f"\nCriando dominio Cognito: {domain}")
    
    try:
        cognito.create_user_pool_domain(
            Domain=domain,
            UserPoolId=pool_id
        )
        
        print(f"  [OK] Dominio criado")
        print(f"  URL: https://{domain}.auth.{region}.amazoncognito.com")
        
        return domain
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "InvalidParameterException":
            print(f"  [INFO] Dominio ja existe ou nome invalido")
        else:
            print(f"  [ERROR] Erro ao criar: {e}")
        return None


def create_user(email: str, name: str, env: str, group: str = "internal_users", region: str = DEFAULT_REGION):
    """
    Cria um usuario no User Pool.
    """
    cognito = get_cognito_client(region)
    
    # Buscar pool_id
    pool_name = f"{PROJECT_PREFIX}-{env}"
    pools = cognito.list_user_pools(MaxResults=60)
    pool_id = None
    for pool in pools["UserPools"]:
        if pool["Name"] == pool_name:
            pool_id = pool["Id"]
            break
    
    if not pool_id:
        print("[ERROR] User Pool nao encontrado")
        return None
    
    print(f"\nCriando usuario: {email}")
    
    try:
        response = cognito.admin_create_user(
            UserPoolId=pool_id,
            Username=email,
            UserAttributes=[
                {"Name": "email", "Value": email},
                {"Name": "email_verified", "Value": "true"},
                {"Name": "name", "Value": name},
                {"Name": "custom:role", "Value": group}
            ],
            DesiredDeliveryMediums=["EMAIL"]
        )
        
        print(f"  [OK] Usuario criado")
        print(f"  Status: {response['User']['UserStatus']}")
        
        # Adicionar ao grupo
        cognito.admin_add_user_to_group(
            UserPoolId=pool_id,
            Username=email,
            GroupName=group
        )
        print(f"  [OK] Adicionado ao grupo: {group}")
        
        return response["User"]
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "UsernameExistsException":
            print(f"  [INFO] Usuario ja existe")
        else:
            print(f"  [ERROR] Erro ao criar: {e}")
        return None


def list_resources(region: str = DEFAULT_REGION):
    """
    Lista recursos Cognito do projeto.
    """
    cognito = get_cognito_client(region)
    
    print("Recursos Cognito do projeto:")
    print("=" * 60)
    
    try:
        pools = cognito.list_user_pools(MaxResults=60)
        
        for pool in pools["UserPools"]:
            if PROJECT_PREFIX in pool["Name"]:
                print(f"\nUser Pool: {pool['Name']}")
                print(f"  ID: {pool['Id']}")
                print(f"  Status: {pool.get('Status', 'N/A')}")
                print(f"  Criado: {pool.get('CreationDate', 'N/A')}")
                
                # Listar clientes
                clients = cognito.list_user_pool_clients(
                    UserPoolId=pool["Id"],
                    MaxResults=10
                )
                
                print(f"\n  App Clients:")
                for client in clients.get("UserPoolClients", []):
                    print(f"    - {client['ClientName']} ({client['ClientId']})")
                
                # Listar grupos
                groups = cognito.list_groups(
                    UserPoolId=pool["Id"],
                    Limit=10
                )
                
                print(f"\n  Grupos:")
                for group in groups.get("Groups", []):
                    print(f"    - {group['GroupName']}: {group.get('Description', '')}")
                
                # Contar usuarios
                try:
                    users = cognito.list_users(
                        UserPoolId=pool["Id"],
                        Limit=1
                    )
                    # Isso e uma estimativa, para contagem real use CloudWatch
                    print(f"\n  Usuarios: Use AWS Console para contagem exata")
                except:
                    pass
        
        return True
        
    except ClientError as e:
        print(f"[ERROR] Erro ao listar: {e}")
        return False


def delete_resources(env: str, region: str = DEFAULT_REGION):
    """
    Deleta recursos Cognito de um ambiente.
    """
    cognito = get_cognito_client(region)
    
    print(f"Deletando recursos Cognito do ambiente: {env}")
    print("=" * 60)
    
    pool_name = f"{PROJECT_PREFIX}-{env}"
    
    try:
        pools = cognito.list_user_pools(MaxResults=60)
        
        for pool in pools["UserPools"]:
            if pool["Name"] == pool_name:
                pool_id = pool["Id"]
                
                # Deletar dominio primeiro
                try:
                    cognito.delete_user_pool_domain(
                        Domain=f"{PROJECT_PREFIX}-{env}",
                        UserPoolId=pool_id
                    )
                    print(f"  [OK] Dominio deletado")
                except ClientError:
                    pass
                
                # Deletar pool
                cognito.delete_user_pool(UserPoolId=pool_id)
                print(f"  [OK] User Pool deletado: {pool_name}")
                
                return True
        
        print(f"  [INFO] User Pool nao encontrado: {pool_name}")
        return True
        
    except ClientError as e:
        print(f"[ERROR] Erro ao deletar: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Configuracao Cognito para Petrobras File Transfer"
    )
    
    parser.add_argument(
        "action",
        choices=[
            "create-user-pool", "create-app-client", "create-domain",
            "create-user", "create-all", "list", "delete"
        ],
        help="Acao a executar"
    )
    
    parser.add_argument("--env", choices=["dev", "staging", "prod"], default="dev")
    parser.add_argument("--region", default=DEFAULT_REGION)
    parser.add_argument("--email", help="Email do usuario (para create-user)")
    parser.add_argument("--name", help="Nome do usuario (para create-user)")
    parser.add_argument("--group", default="internal_users", 
                       choices=["internal_users", "supervisors", "admins"])
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Petrobras File Transfer - Configuracao Cognito")
    print("=" * 60)
    print(f"Ambiente: {args.env}")
    print(f"Regiao: {args.region}")
    print("=" * 60)
    
    if args.action == "create-user-pool":
        create_user_pool(args.env, args.region)
    
    elif args.action == "create-app-client":
        create_app_client(args.env, region=args.region)
    
    elif args.action == "create-domain":
        create_domain(args.env, region=args.region)
    
    elif args.action == "create-user":
        if not args.email or not args.name:
            print("[ERROR] --email e --name sao obrigatorios")
            return
        create_user(args.email, args.name, args.env, args.group, args.region)
    
    elif args.action == "create-all":
        pool_id = create_user_pool(args.env, args.region)
        if pool_id:
            create_app_client(args.env, pool_id, args.region)
            create_domain(args.env, pool_id, args.region)
    
    elif args.action == "list":
        list_resources(args.region)
    
    elif args.action == "delete":
        confirm = input(f"Deletar recursos Cognito do ambiente {args.env}? (sim/nao): ")
        if confirm.lower() == "sim":
            delete_resources(args.env, args.region)


if __name__ == "__main__":
    main()
