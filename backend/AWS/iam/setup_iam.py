#!/usr/bin/env python3
"""
Script para criacao de IAM Roles, Policies e Users para o sistema de
transferencia segura de arquivos da Petrobras.

Uso:
    python setup_iam.py create-policies [--env dev|staging|prod]
    python setup_iam.py create-roles [--env dev|staging|prod]
    python setup_iam.py create-user --name api-user [--env dev|staging|prod]
    python setup_iam.py list
    python setup_iam.py delete-all [--env dev|staging|prod]
"""

import boto3
import json
import argparse
from botocore.exceptions import ClientError


DEFAULT_REGION = "sa-east-1"
PROJECT_PREFIX = "petrobras-file-transfer"


def get_iam_client():
    """Retorna cliente IAM."""
    return boto3.client("iam")


def get_sts_client():
    """Retorna cliente STS para obter account ID."""
    return boto3.client("sts")


def get_account_id():
    """Obtem o Account ID da conta AWS."""
    sts = get_sts_client()
    return sts.get_caller_identity()["Account"]


def create_s3_policy(env: str):
    """
    Cria policy para acesso ao S3.
    """
    iam = get_iam_client()
    account_id = get_account_id()
    
    policy_name = f"{PROJECT_PREFIX}-s3-policy-{env}"
    bucket_name = f"{PROJECT_PREFIX}-{env}"
    
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "ListBucket",
                "Effect": "Allow",
                "Action": [
                    "s3:ListBucket",
                    "s3:GetBucketLocation"
                ],
                "Resource": f"arn:aws:s3:::{bucket_name}"
            },
            {
                "Sid": "ObjectOperations",
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:GetObjectVersion",
                    "s3:DeleteObjectVersion"
                ],
                "Resource": f"arn:aws:s3:::{bucket_name}/*"
            },
            {
                "Sid": "PresignedUrls",
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                ],
                "Resource": f"arn:aws:s3:::{bucket_name}/uploads/*"
            }
        ]
    }
    
    print(f"Criando policy: {policy_name}")
    
    try:
        response = iam.create_policy(
            PolicyName=policy_name,
            PolicyDocument=json.dumps(policy_document),
            Description=f"Policy para acesso ao bucket S3 do ambiente {env}",
            Tags=[
                {"Key": "Project", "Value": "PetrobrasFileTransfer"},
                {"Key": "Environment", "Value": env}
            ]
        )
        print(f"  [OK] Policy criada: {response['Policy']['Arn']}")
        return response["Policy"]["Arn"]
    except ClientError as e:
        if e.response["Error"]["Code"] == "EntityAlreadyExists":
            print(f"  [INFO] Policy ja existe")
            return f"arn:aws:iam::{account_id}:policy/{policy_name}"
        raise


def create_ses_policy(env: str):
    """
    Cria policy para envio de emails via SES.
    """
    iam = get_iam_client()
    account_id = get_account_id()
    
    policy_name = f"{PROJECT_PREFIX}-ses-policy-{env}"
    
    # Dominios permitidos por ambiente
    allowed_domains = {
        "dev": ["*"],
        "staging": ["staging.petrobras.com.br", "petrobras.com.br"],
        "prod": ["petrobras.com.br"]
    }
    
    domain_arns = [
        f"arn:aws:ses:{DEFAULT_REGION}:{account_id}:identity/{d}"
        for d in allowed_domains.get(env, ["*"])
    ]
    
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "SendEmail",
                "Effect": "Allow",
                "Action": [
                    "ses:SendEmail",
                    "ses:SendRawEmail",
                    "ses:SendTemplatedEmail"
                ],
                "Resource": domain_arns
            },
            {
                "Sid": "GetQuota",
                "Effect": "Allow",
                "Action": [
                    "ses:GetSendQuota",
                    "ses:GetSendStatistics"
                ],
                "Resource": "*"
            },
            {
                "Sid": "ManageTemplates",
                "Effect": "Allow",
                "Action": [
                    "ses:GetTemplate",
                    "ses:ListTemplates"
                ],
                "Resource": "*"
            }
        ]
    }
    
    print(f"Criando policy: {policy_name}")
    
    try:
        response = iam.create_policy(
            PolicyName=policy_name,
            PolicyDocument=json.dumps(policy_document),
            Description=f"Policy para envio de emails SES no ambiente {env}",
            Tags=[
                {"Key": "Project", "Value": "PetrobrasFileTransfer"},
                {"Key": "Environment", "Value": env}
            ]
        )
        print(f"  [OK] Policy criada: {response['Policy']['Arn']}")
        return response["Policy"]["Arn"]
    except ClientError as e:
        if e.response["Error"]["Code"] == "EntityAlreadyExists":
            print(f"  [INFO] Policy ja existe")
            return f"arn:aws:iam::{account_id}:policy/{policy_name}"
        raise


def create_dynamodb_policy(env: str):
    """
    Cria policy para acesso ao DynamoDB.
    """
    iam = get_iam_client()
    account_id = get_account_id()
    
    policy_name = f"{PROJECT_PREFIX}-dynamodb-policy-{env}"
    
    # Tabelas do projeto (sincronizado com DynamoDB)
    tables = [
        "users", "credentials", "areas", "area_supervisors",
        "files", "shares", "share_files", "tokens",
        "audits", "notifications", "email_logs"
    ]
    
    table_arns = [
        f"arn:aws:dynamodb:{DEFAULT_REGION}:{account_id}:table/{PROJECT_PREFIX}-{env}-{t}"
        for t in tables
    ]
    
    index_arns = [f"{arn}/index/*" for arn in table_arns]
    
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "TableOperations",
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:BatchGetItem",
                    "dynamodb:BatchWriteItem"
                ],
                "Resource": table_arns + index_arns
            },
            {
                "Sid": "DescribeTables",
                "Effect": "Allow",
                "Action": [
                    "dynamodb:DescribeTable",
                    "dynamodb:DescribeTimeToLive"
                ],
                "Resource": table_arns
            }
        ]
    }
    
    print(f"Criando policy: {policy_name}")
    
    try:
        response = iam.create_policy(
            PolicyName=policy_name,
            PolicyDocument=json.dumps(policy_document),
            Description=f"Policy para acesso ao DynamoDB no ambiente {env}",
            Tags=[
                {"Key": "Project", "Value": "PetrobrasFileTransfer"},
                {"Key": "Environment", "Value": env}
            ]
        )
        print(f"  [OK] Policy criada: {response['Policy']['Arn']}")
        return response["Policy"]["Arn"]
    except ClientError as e:
        if e.response["Error"]["Code"] == "EntityAlreadyExists":
            print(f"  [INFO] Policy ja existe")
            return f"arn:aws:iam::{account_id}:policy/{policy_name}"
        raise


def create_cloudwatch_policy(env: str):
    """
    Cria policy para logs e metricas no CloudWatch.
    """
    iam = get_iam_client()
    account_id = get_account_id()
    
    policy_name = f"{PROJECT_PREFIX}-cloudwatch-policy-{env}"
    
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "Logs",
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams"
                ],
                "Resource": f"arn:aws:logs:{DEFAULT_REGION}:{account_id}:log-group:/petrobras-file-transfer/{env}/*"
            },
            {
                "Sid": "Metrics",
                "Effect": "Allow",
                "Action": [
                    "cloudwatch:PutMetricData"
                ],
                "Resource": "*",
                "Condition": {
                    "StringEquals": {
                        "cloudwatch:namespace": f"PetrobrasFileTransfer/{env}"
                    }
                }
            }
        ]
    }
    
    print(f"Criando policy: {policy_name}")
    
    try:
        response = iam.create_policy(
            PolicyName=policy_name,
            PolicyDocument=json.dumps(policy_document),
            Description=f"Policy para CloudWatch Logs e Metrics no ambiente {env}",
            Tags=[
                {"Key": "Project", "Value": "PetrobrasFileTransfer"},
                {"Key": "Environment", "Value": env}
            ]
        )
        print(f"  [OK] Policy criada: {response['Policy']['Arn']}")
        return response["Policy"]["Arn"]
    except ClientError as e:
        if e.response["Error"]["Code"] == "EntityAlreadyExists":
            print(f"  [INFO] Policy ja existe")
            return f"arn:aws:iam::{account_id}:policy/{policy_name}"
        raise


def create_secrets_policy(env: str):
    """
    Cria policy para acesso ao Secrets Manager.
    """
    iam = get_iam_client()
    account_id = get_account_id()
    
    policy_name = f"{PROJECT_PREFIX}-secrets-policy-{env}"
    
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "GetSecrets",
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                ],
                "Resource": f"arn:aws:secretsmanager:{DEFAULT_REGION}:{account_id}:secret:petrobras-file-transfer/{env}/*"
            }
        ]
    }
    
    print(f"Criando policy: {policy_name}")
    
    try:
        response = iam.create_policy(
            PolicyName=policy_name,
            PolicyDocument=json.dumps(policy_document),
            Description=f"Policy para acesso ao Secrets Manager no ambiente {env}",
            Tags=[
                {"Key": "Project", "Value": "PetrobrasFileTransfer"},
                {"Key": "Environment", "Value": env}
            ]
        )
        print(f"  [OK] Policy criada: {response['Policy']['Arn']}")
        return response["Policy"]["Arn"]
    except ClientError as e:
        if e.response["Error"]["Code"] == "EntityAlreadyExists":
            print(f"  [INFO] Policy ja existe")
            return f"arn:aws:iam::{account_id}:policy/{policy_name}"
        raise


def create_kms_policy(env: str):
    """
    Cria policy para uso de chaves KMS.
    """
    iam = get_iam_client()
    account_id = get_account_id()
    
    policy_name = f"{PROJECT_PREFIX}-kms-policy-{env}"
    
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "UseKey",
                "Effect": "Allow",
                "Action": [
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:GenerateDataKey",
                    "kms:GenerateDataKeyWithoutPlaintext",
                    "kms:DescribeKey"
                ],
                "Resource": f"arn:aws:kms:{DEFAULT_REGION}:{account_id}:key/*",
                "Condition": {
                    "StringEquals": {
                        "kms:RequestAlias": f"alias/petrobras-file-transfer-{env}"
                    }
                }
            }
        ]
    }
    
    print(f"Criando policy: {policy_name}")
    
    try:
        response = iam.create_policy(
            PolicyName=policy_name,
            PolicyDocument=json.dumps(policy_document),
            Description=f"Policy para uso de KMS no ambiente {env}",
            Tags=[
                {"Key": "Project", "Value": "PetrobrasFileTransfer"},
                {"Key": "Environment", "Value": env}
            ]
        )
        print(f"  [OK] Policy criada: {response['Policy']['Arn']}")
        return response["Policy"]["Arn"]
    except ClientError as e:
        if e.response["Error"]["Code"] == "EntityAlreadyExists":
            print(f"  [INFO] Policy ja existe")
            return f"arn:aws:iam::{account_id}:policy/{policy_name}"
        raise


def create_all_policies(env: str):
    """Cria todas as policies necessarias."""
    print(f"\nCriando todas as policies para ambiente: {env}")
    print("=" * 60)
    
    policies = []
    policies.append(create_s3_policy(env))
    policies.append(create_ses_policy(env))
    policies.append(create_dynamodb_policy(env))
    policies.append(create_cloudwatch_policy(env))
    policies.append(create_secrets_policy(env))
    policies.append(create_kms_policy(env))
    
    return policies


def create_application_role(env: str):
    """
    Cria role para a aplicacao (ECS, Lambda, EC2).
    """
    iam = get_iam_client()
    account_id = get_account_id()
    
    role_name = f"{PROJECT_PREFIX}-app-role-{env}"
    
    # Trust policy para ECS, Lambda e EC2
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": [
                        "ecs-tasks.amazonaws.com",
                        "lambda.amazonaws.com",
                        "ec2.amazonaws.com"
                    ]
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }
    
    print(f"\nCriando role: {role_name}")
    
    try:
        response = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description=f"Role para aplicacao no ambiente {env}",
            Tags=[
                {"Key": "Project", "Value": "PetrobrasFileTransfer"},
                {"Key": "Environment", "Value": env}
            ]
        )
        print(f"  [OK] Role criada: {response['Role']['Arn']}")
        
        # Anexar policies
        policy_names = [
            f"{PROJECT_PREFIX}-s3-policy-{env}",
            f"{PROJECT_PREFIX}-ses-policy-{env}",
            f"{PROJECT_PREFIX}-dynamodb-policy-{env}",
            f"{PROJECT_PREFIX}-cloudwatch-policy-{env}",
            f"{PROJECT_PREFIX}-secrets-policy-{env}",
            f"{PROJECT_PREFIX}-kms-policy-{env}"
        ]
        
        for policy_name in policy_names:
            try:
                policy_arn = f"arn:aws:iam::{account_id}:policy/{policy_name}"
                iam.attach_role_policy(RoleName=role_name, PolicyArn=policy_arn)
                print(f"  [OK] Policy anexada: {policy_name}")
            except ClientError as e:
                print(f"  [WARN] Nao foi possivel anexar {policy_name}: {e}")
        
        return response["Role"]["Arn"]
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "EntityAlreadyExists":
            print(f"  [INFO] Role ja existe")
            return f"arn:aws:iam::{account_id}:role/{role_name}"
        raise


def create_api_user(username: str, env: str):
    """
    Cria usuario IAM para acesso programatico.
    """
    iam = get_iam_client()
    account_id = get_account_id()
    
    user_name = f"{PROJECT_PREFIX}-{username}-{env}"
    
    print(f"\nCriando usuario: {user_name}")
    
    try:
        response = iam.create_user(
            UserName=user_name,
            Tags=[
                {"Key": "Project", "Value": "PetrobrasFileTransfer"},
                {"Key": "Environment", "Value": env}
            ]
        )
        print(f"  [OK] Usuario criado: {response['User']['Arn']}")
        
        # Anexar policies
        policy_names = [
            f"{PROJECT_PREFIX}-s3-policy-{env}",
            f"{PROJECT_PREFIX}-ses-policy-{env}",
            f"{PROJECT_PREFIX}-dynamodb-policy-{env}",
            f"{PROJECT_PREFIX}-cloudwatch-policy-{env}"
        ]
        
        for policy_name in policy_names:
            try:
                policy_arn = f"arn:aws:iam::{account_id}:policy/{policy_name}"
                iam.attach_user_policy(UserName=user_name, PolicyArn=policy_arn)
                print(f"  [OK] Policy anexada: {policy_name}")
            except ClientError as e:
                print(f"  [WARN] Nao foi possivel anexar {policy_name}: {e}")
        
        # Criar access key
        key_response = iam.create_access_key(UserName=user_name)
        access_key = key_response["AccessKey"]
        
        print(f"\n[IMPORTANTE] Guarde estas credenciais em local seguro!")
        print("-" * 60)
        print(f"  AWS_ACCESS_KEY_ID={access_key['AccessKeyId']}")
        print(f"  AWS_SECRET_ACCESS_KEY={access_key['SecretAccessKey']}")
        print("-" * 60)
        print("[WARN] A secret key nao podera ser recuperada novamente!")
        
        return response["User"]["Arn"]
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "EntityAlreadyExists":
            print(f"  [INFO] Usuario ja existe")
            return f"arn:aws:iam::{account_id}:user/{user_name}"
        raise


def list_resources():
    """Lista todos os recursos IAM do projeto."""
    iam = get_iam_client()
    
    print("Recursos IAM do projeto Petrobras File Transfer:")
    print("=" * 60)
    
    # Listar policies
    print("\nPolicies:")
    paginator = iam.get_paginator("list_policies")
    for page in paginator.paginate(Scope="Local"):
        for policy in page["Policies"]:
            if PROJECT_PREFIX in policy["PolicyName"]:
                print(f"  - {policy['PolicyName']}")
    
    # Listar roles
    print("\nRoles:")
    paginator = iam.get_paginator("list_roles")
    for page in paginator.paginate():
        for role in page["Roles"]:
            if PROJECT_PREFIX in role["RoleName"]:
                print(f"  - {role['RoleName']}")
    
    # Listar users
    print("\nUsers:")
    paginator = iam.get_paginator("list_users")
    for page in paginator.paginate():
        for user in page["Users"]:
            if PROJECT_PREFIX in user["UserName"]:
                print(f"  - {user['UserName']}")


def delete_all_resources(env: str):
    """Deleta todos os recursos IAM do ambiente."""
    iam = get_iam_client()
    account_id = get_account_id()
    
    print(f"\nDeletando recursos IAM do ambiente: {env}")
    print("=" * 60)
    
    # Deletar roles
    role_name = f"{PROJECT_PREFIX}-app-role-{env}"
    try:
        # Desanexar policies primeiro
        attached = iam.list_attached_role_policies(RoleName=role_name)
        for policy in attached["AttachedPolicies"]:
            iam.detach_role_policy(RoleName=role_name, PolicyArn=policy["PolicyArn"])
            print(f"  [OK] Policy desanexada da role: {policy['PolicyName']}")
        
        iam.delete_role(RoleName=role_name)
        print(f"  [OK] Role deletada: {role_name}")
    except ClientError as e:
        if e.response["Error"]["Code"] != "NoSuchEntity":
            print(f"  [WARN] Erro ao deletar role: {e}")
    
    # Deletar users
    user_prefix = f"{PROJECT_PREFIX}-"
    paginator = iam.get_paginator("list_users")
    for page in paginator.paginate():
        for user in page["Users"]:
            if user_prefix in user["UserName"] and env in user["UserName"]:
                try:
                    # Deletar access keys
                    keys = iam.list_access_keys(UserName=user["UserName"])
                    for key in keys["AccessKeyMetadata"]:
                        iam.delete_access_key(
                            UserName=user["UserName"],
                            AccessKeyId=key["AccessKeyId"]
                        )
                    
                    # Desanexar policies
                    attached = iam.list_attached_user_policies(UserName=user["UserName"])
                    for policy in attached["AttachedPolicies"]:
                        iam.detach_user_policy(
                            UserName=user["UserName"],
                            PolicyArn=policy["PolicyArn"]
                        )
                    
                    iam.delete_user(UserName=user["UserName"])
                    print(f"  [OK] User deletado: {user['UserName']}")
                except ClientError as e:
                    print(f"  [WARN] Erro ao deletar user: {e}")
    
    # Deletar policies
    policy_prefix = f"{PROJECT_PREFIX}-"
    paginator = iam.get_paginator("list_policies")
    for page in paginator.paginate(Scope="Local"):
        for policy in page["Policies"]:
            if policy_prefix in policy["PolicyName"] and env in policy["PolicyName"]:
                try:
                    iam.delete_policy(PolicyArn=policy["Arn"])
                    print(f"  [OK] Policy deletada: {policy['PolicyName']}")
                except ClientError as e:
                    print(f"  [WARN] Erro ao deletar policy: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Gerenciamento IAM para Petrobras File Transfer"
    )
    
    parser.add_argument(
        "action",
        choices=["create-policies", "create-roles", "create-user", "list", "delete-all"],
        help="Acao a executar"
    )
    
    parser.add_argument(
        "--env",
        choices=["dev", "staging", "prod"],
        default="dev",
        help="Ambiente (default: dev)"
    )
    
    parser.add_argument("--name", help="Nome do usuario (para create-user)")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Petrobras File Transfer - Configuracao IAM")
    print("=" * 60)
    print(f"Ambiente: {args.env}")
    print("=" * 60)
    
    if args.action == "create-policies":
        create_all_policies(args.env)
    
    elif args.action == "create-roles":
        create_all_policies(args.env)  # Criar policies primeiro
        create_application_role(args.env)
    
    elif args.action == "create-user":
        if not args.name:
            print("[ERROR] --name e obrigatorio para create-user")
            return
        create_all_policies(args.env)  # Criar policies primeiro
        create_api_user(args.name, args.env)
    
    elif args.action == "list":
        list_resources()
    
    elif args.action == "delete-all":
        confirm = input(f"Tem certeza que deseja deletar todos os recursos do ambiente {args.env}? (sim/nao): ")
        if confirm.lower() == "sim":
            delete_all_resources(args.env)
        else:
            print("Operacao cancelada")


if __name__ == "__main__":
    main()
