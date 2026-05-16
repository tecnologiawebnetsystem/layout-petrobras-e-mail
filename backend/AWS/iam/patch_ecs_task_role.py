#!/usr/bin/env python3
"""
Adiciona as permissões faltantes à IAM Role da task ECS do backend.

Problema identificado no deploy:
  - s3:PutObject / GetObject / DeleteObject bloqueados → uploads falham
  - ssm:GetParametersByPath bloqueado → aws_loader não carrega Parameter Store
  - secretsmanager:GetSecretValue bloqueado → secrets não carregam

Uso (com suas credenciais SSO ativas):
    python -m AWS.iam.patch_ecs_task_role --env dsv
    python -m AWS.iam.patch_ecs_task_role --env dsv --dry-run
"""
from __future__ import annotations

import argparse
import json
import sys

import boto3
from botocore.exceptions import ClientError


# ─────────────────────────────────────────────────────────────────────────────
# Configuração do projeto (AppSpace Petrobras – App a12022)
# ─────────────────────────────────────────────────────────────────────────────
APP_CODE    = "a12022"
ACCOUNT_ID  = "119392112451"
REGION      = "sa-east-1"

# Nome do bucket por ambiente (ajuste se houver variação entre envs)
BUCKET_MAP = {
    "dsv": f"s3-{APP_CODE}-dsv-{APP_CODE}-s3-{ACCOUNT_ID}-{REGION}",
    "tst": f"s3-{APP_CODE}-tst-{APP_CODE}-s3-{ACCOUNT_ID}-{REGION}",
    "hmg": f"s3-{APP_CODE}-hmg-{APP_CODE}-s3-{ACCOUNT_ID}-{REGION}",
    "prd": f"s3-{APP_CODE}-prd-{APP_CODE}-s3-{ACCOUNT_ID}-{REGION}",
}

# Prefixo do SSM por ambiente (padrão AppSpace)
def ssm_path(env: str) -> str:
    return f"/APP/backend-{env}/*" if env != "prd" else "/APP/backend/*"

# Nome da secret por ambiente
def secret_name(env: str) -> str:
    return f"backend_{env}_secret"


def build_policy(env: str) -> dict:
    bucket = BUCKET_MAP.get(env)
    if not bucket:
        print(f"[ERRO] Ambiente '{env}' não mapeado. Use: {list(BUCKET_MAP.keys())}")
        sys.exit(1)

    return {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "S3BucketList",
                "Effect": "Allow",
                "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
                "Resource": f"arn:aws:s3:::{bucket}",
            },
            {
                "Sid": "S3ObjectOperations",
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:GetObjectVersion",
                ],
                "Resource": f"arn:aws:s3:::{bucket}/*",
            },
            {
                "Sid": "SSMParameterStore",
                "Effect": "Allow",
                "Action": [
                    "ssm:GetParametersByPath",
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                ],
                "Resource": f"arn:aws:ssm:{REGION}:{ACCOUNT_ID}:parameter{ssm_path(env)}",
            },
            {
                "Sid": "SecretsManager",
                "Effect": "Allow",
                "Action": ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
                "Resource": (
                    f"arn:aws:secretsmanager:{REGION}:{ACCOUNT_ID}:"
                    f"secret:{secret_name(env)}*"
                ),
            },
        ],
    }


def find_task_role(iam, env: str) -> str | None:
    """Busca a Role ECS cujo nome contenha o app code e o ambiente."""
    paginator = iam.get_paginator("list_roles")
    for page in paginator.paginate():
        for role in page["Roles"]:
            name = role["RoleName"].lower()
            if APP_CODE in name and env in name and "task" in name:
                return role["RoleName"]
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Corrige permissões da IAM Role ECS do backend")
    parser.add_argument("--env", required=True, choices=list(BUCKET_MAP.keys()),
                        help="Ambiente alvo: dsv | tst | hmg | prd")
    parser.add_argument("--role-name", default=None,
                        help="Nome exato da Role (opcional — detectado automaticamente)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Apenas exibe o que seria feito, sem alterar nada")
    args = parser.parse_args()

    import urllib3; urllib3.disable_warnings()
    iam = boto3.client("iam", region_name=REGION, verify=False)
    policy_name = f"csa-backend-{args.env}-runtime-policy"

    # ── Localiza a Role ──────────────────────────────────────────────────────
    role_name = args.role_name
    if not role_name:
        print(f"[1/3] Buscando IAM Role para ambiente '{args.env}'...")
        role_name = find_task_role(iam, args.env)
        if not role_name:
            print(
                f"[ERRO] Role não encontrada automaticamente. "
                f"Use --role-name com o nome exato da role no console IAM."
            )
            return 1
    print(f"       Role: {role_name}")

    # ── Exibe policy que será aplicada ───────────────────────────────────────
    policy_doc = build_policy(args.env)
    print(f"\n[2/3] Policy '{policy_name}' a ser aplicada:")
    print(json.dumps(policy_doc, indent=2, ensure_ascii=False))

    if args.dry_run:
        print("\n[DRY-RUN] Nenhuma alteração realizada.")
        return 0

    # ── Aplica a inline policy na Role ───────────────────────────────────────
    print(f"\n[3/3] Aplicando inline policy na role '{role_name}'...")
    try:
        iam.put_role_policy(
            RoleName=role_name,
            PolicyName=policy_name,
            PolicyDocument=json.dumps(policy_doc),
        )
        print(f"  [OK] Policy '{policy_name}' aplicada com sucesso.")
    except ClientError as e:
        print(f"  [ERRO] {e}")
        return 1

    print("\n" + "=" * 70)
    print(f" Permissões corrigidas para o ambiente '{args.env}'.")
    print(f" Faça um novo deploy para validar.")
    print("=" * 70)
    return 0


if __name__ == "__main__":
    sys.exit(main())
