#!/usr/bin/env python3
"""
Script para popular as tabelas DynamoDB com dados iniciais de desenvolvimento/teste.

Uso:
    # Local (DynamoDB Local)
    python seed_data.py --local

    # AWS
    python seed_data.py --region sa-east-1 --env development
"""

import argparse
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timedelta, UTC
import uuid
import hashlib
import secrets


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


def hash_password(password: str) -> str:
    """Hash simples para desenvolvimento. Em producao use bcrypt."""
    return hashlib.sha256(password.encode()).hexdigest()


def seed_users(dynamodb, env: str):
    """Popula tabela de usuarios."""
    table_name = f"pft_users_{env}" if env else "pft_users"
    table = dynamodb.Table(table_name)
    
    users = [
        {
            "pk": "USER#1",
            "sk": "PROFILE",
            "id": "1",
            "name": "Administrador Sistema",
            "email": "admin@petrobras.com.br",
            "type": "supervisor",
            "department": "TI - Seguranca da Informacao",
            "job_title": "Administrador de Sistemas",
            "employee_id": "PB000001",
            "phone": "+55 21 99999-0001",
            "status": True,
            "created_at": datetime.now(UTC).isoformat(),
            "gsi1pk": "TYPE#supervisor",
            "gsi1sk": "USER#1",
        },
        {
            "pk": "USER#2",
            "sk": "PROFILE",
            "id": "2",
            "name": "Maria Silva",
            "email": "maria.silva@petrobras.com.br",
            "type": "internal",
            "department": "Exploracao e Producao",
            "job_title": "Engenheira de Petroleo",
            "employee_id": "PB000002",
            "phone": "+55 21 99999-0002",
            "manager_id": "1",
            "status": True,
            "created_at": datetime.now(UTC).isoformat(),
            "gsi1pk": "TYPE#internal",
            "gsi1sk": "USER#2",
        },
        {
            "pk": "USER#3",
            "sk": "PROFILE",
            "id": "3",
            "name": "Joao Santos",
            "email": "joao.santos@petrobras.com.br",
            "type": "internal",
            "department": "Financeiro",
            "job_title": "Analista Financeiro",
            "employee_id": "PB000003",
            "phone": "+55 21 99999-0003",
            "manager_id": "1",
            "status": True,
            "created_at": datetime.now(UTC).isoformat(),
            "gsi1pk": "TYPE#internal",
            "gsi1sk": "USER#3",
        },
        {
            "pk": "USER#4",
            "sk": "PROFILE",
            "id": "4",
            "name": "Carlos Externo",
            "email": "carlos@fornecedor.com.br",
            "type": "externo",
            "department": None,
            "job_title": None,
            "employee_id": None,
            "phone": "+55 11 98888-0001",
            "status": True,
            "created_at": datetime.now(UTC).isoformat(),
            "gsi1pk": "TYPE#externo",
            "gsi1sk": "USER#4",
        },
    ]
    
    print(f"Inserindo {len(users)} usuarios em {table_name}...")
    with table.batch_writer() as batch:
        for user in users:
            batch.put_item(Item=user)
    print("  Usuarios inseridos com sucesso!")


def seed_credentials(dynamodb, env: str):
    """Popula tabela de credenciais."""
    table_name = f"pft_credentials_{env}" if env else "pft_credentials"
    table = dynamodb.Table(table_name)
    
    credentials = [
        {
            "pk": "CRED#admin@petrobras.com.br",
            "sk": "LOCAL",
            "user_id": "1",
            "password_hash": hash_password("Admin@123"),
            "created_at": datetime.now(UTC).isoformat(),
        },
        {
            "pk": "CRED#maria.silva@petrobras.com.br",
            "sk": "LOCAL",
            "user_id": "2",
            "password_hash": hash_password("Maria@123"),
            "created_at": datetime.now(UTC).isoformat(),
        },
        {
            "pk": "CRED#joao.santos@petrobras.com.br",
            "sk": "LOCAL",
            "user_id": "3",
            "password_hash": hash_password("Joao@123"),
            "created_at": datetime.now(UTC).isoformat(),
        },
    ]
    
    print(f"Inserindo {len(credentials)} credenciais em {table_name}...")
    with table.batch_writer() as batch:
        for cred in credentials:
            batch.put_item(Item=cred)
    print("  Credenciais inseridas com sucesso!")


def seed_areas(dynamodb, env: str):
    """Popula tabela de areas."""
    table_name = f"pft_areas_{env}" if env else "pft_areas"
    table = dynamodb.Table(table_name)
    
    areas = [
        {
            "pk": "AREA#1",
            "sk": "METADATA",
            "id": "1",
            "name": "Exploracao e Producao",
            "description": "Area responsavel pela exploracao e producao de petroleo",
            "applicant_id": "1",
            "status": True,
            "created_at": datetime.now(UTC).isoformat(),
        },
        {
            "pk": "AREA#1",
            "sk": "SUPERVISOR#1",
            "supervisor_id": "1",
            "added_at": datetime.now(UTC).isoformat(),
        },
        {
            "pk": "AREA#2",
            "sk": "METADATA",
            "id": "2",
            "name": "Financeiro",
            "description": "Area financeira e contabil",
            "applicant_id": "1",
            "status": True,
            "created_at": datetime.now(UTC).isoformat(),
        },
        {
            "pk": "AREA#2",
            "sk": "SUPERVISOR#1",
            "supervisor_id": "1",
            "added_at": datetime.now(UTC).isoformat(),
        },
        {
            "pk": "AREA#3",
            "sk": "METADATA",
            "id": "3",
            "name": "Tecnologia da Informacao",
            "description": "Area de TI e sistemas",
            "applicant_id": "1",
            "status": True,
            "created_at": datetime.now(UTC).isoformat(),
        },
    ]
    
    print(f"Inserindo {len(areas)} registros de areas em {table_name}...")
    with table.batch_writer() as batch:
        for area in areas:
            batch.put_item(Item=area)
    print("  Areas inseridas com sucesso!")


def seed_files(dynamodb, env: str):
    """Popula tabela de arquivos."""
    table_name = f"pft_files_{env}" if env else "pft_files"
    table = dynamodb.Table(table_name)
    
    files = [
        {
            "pk": "FILE#1",
            "sk": "METADATA",
            "id": "1",
            "name": "Relatorio_Producao_Q4_2025.pdf",
            "original_name": "Relatorio_Producao_Q4_2025.pdf",
            "mime_type": "application/pdf",
            "size_bytes": 2548576,
            "hash_sha256": hashlib.sha256(b"file1content").hexdigest(),
            "key_s3": "files/2025/12/relatorio_producao_q4_2025.pdf",
            "area_id": "1",
            "upload_by_id": "2",
            "status": True,
            "created_at": datetime.now(UTC).isoformat(),
        },
        {
            "pk": "FILE#2",
            "sk": "METADATA",
            "id": "2",
            "name": "Dados_Sismicos_Bloco_X.zip",
            "original_name": "Dados_Sismicos_Bloco_X.zip",
            "mime_type": "application/zip",
            "size_bytes": 157286400,
            "hash_sha256": hashlib.sha256(b"file2content").hexdigest(),
            "key_s3": "files/2025/12/dados_sismicos_bloco_x.zip",
            "area_id": "1",
            "upload_by_id": "2",
            "status": True,
            "created_at": datetime.now(UTC).isoformat(),
        },
        {
            "pk": "FILE#3",
            "sk": "METADATA",
            "id": "3",
            "name": "Planilha_Orcamento_2026.xlsx",
            "original_name": "Planilha_Orcamento_2026.xlsx",
            "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "size_bytes": 524288,
            "hash_sha256": hashlib.sha256(b"file3content").hexdigest(),
            "key_s3": "files/2025/12/planilha_orcamento_2026.xlsx",
            "area_id": "2",
            "upload_by_id": "3",
            "status": True,
            "created_at": datetime.now(UTC).isoformat(),
        },
    ]
    
    print(f"Inserindo {len(files)} arquivos em {table_name}...")
    with table.batch_writer() as batch:
        for file in files:
            batch.put_item(Item=file)
    print("  Arquivos inseridos com sucesso!")


def seed_shares(dynamodb, env: str):
    """Popula tabela de compartilhamentos."""
    table_name = f"pft_shares_{env}" if env else "pft_shares"
    table = dynamodb.Table(table_name)
    
    now = datetime.now(UTC)
    
    shares = [
        # Share pendente
        {
            "pk": "SHARE#1",
            "sk": "METADATA",
            "id": "1",
            "name": "Dados de Producao Q4",
            "description": "Envio dos dados de producao do quarto trimestre para auditoria externa",
            "external_email": "auditor@kpmg.com.br",
            "status": "pendente",
            "consumption_policy": "after_all",
            "expiration_hours": 72,
            "expires_at": None,
            "created_by_id": "2",
            "area_id": "1",
            "created_at": (now - timedelta(hours=2)).isoformat(),
        },
        {
            "pk": "SHARE#1",
            "sk": "FILE#1",
            "file_id": "1",
            "downloaded": False,
            "downloaded_at": None,
        },
        # Share aprovado
        {
            "pk": "SHARE#2",
            "sk": "METADATA",
            "id": "2",
            "name": "Dados Sismicos Bloco X",
            "description": "Compartilhamento de dados sismicos para parceiro de exploracao",
            "external_email": "carlos@fornecedor.com.br",
            "status": "aprovado",
            "consumption_policy": "per_file",
            "expiration_hours": 48,
            "expires_at": (now + timedelta(hours=46)).isoformat(),
            "created_by_id": "2",
            "approver_id": "1",
            "approved_at": (now - timedelta(hours=2)).isoformat(),
            "area_id": "1",
            "created_at": (now - timedelta(hours=5)).isoformat(),
        },
        {
            "pk": "SHARE#2",
            "sk": "FILE#2",
            "file_id": "2",
            "downloaded": False,
            "downloaded_at": None,
        },
        # Share expirado
        {
            "pk": "SHARE#3",
            "sk": "METADATA",
            "id": "3",
            "name": "Orcamento 2026",
            "description": "Planilha de orcamento para revisao",
            "external_email": "consultor@deloitte.com.br",
            "status": "expirado",
            "consumption_policy": "after_all",
            "expiration_hours": 24,
            "expires_at": (now - timedelta(hours=12)).isoformat(),
            "created_by_id": "3",
            "approver_id": "1",
            "approved_at": (now - timedelta(days=2)).isoformat(),
            "area_id": "2",
            "created_at": (now - timedelta(days=3)).isoformat(),
        },
        {
            "pk": "SHARE#3",
            "sk": "FILE#3",
            "file_id": "3",
            "downloaded": True,
            "downloaded_at": (now - timedelta(days=1)).isoformat(),
        },
    ]
    
    print(f"Inserindo {len(shares)} registros de compartilhamentos em {table_name}...")
    with table.batch_writer() as batch:
        for share in shares:
            batch.put_item(Item=share)
    print("  Compartilhamentos inseridos com sucesso!")


def seed_notifications(dynamodb, env: str):
    """Popula tabela de notificacoes."""
    table_name = f"pft_notifications_{env}" if env else "pft_notifications"
    table = dynamodb.Table(table_name)
    
    now = datetime.now(UTC)
    
    notifications = [
        {
            "pk": "USER#1",
            "sk": f"NOTIFICATION#{(now - timedelta(hours=1)).isoformat()}#1",
            "id": "1",
            "type": "approval_request",
            "title": "Nova solicitacao de aprovacao",
            "message": "Maria Silva solicitou aprovacao para compartilhar 'Dados de Producao Q4'",
            "read": "false",
            "action_url": "/supervisor?tab=pending",
            "reference_id": "1",
            "reference_type": "share",
            "created_at": (now - timedelta(hours=1)).isoformat(),
            "ttl": int((now + timedelta(days=30)).timestamp()),
        },
        {
            "pk": "USER#2",
            "sk": f"NOTIFICATION#{(now - timedelta(hours=3)).isoformat()}#2",
            "id": "2",
            "type": "share_approved",
            "title": "Compartilhamento aprovado",
            "message": "Seu compartilhamento 'Dados Sismicos Bloco X' foi aprovado",
            "read": "true",
            "action_url": "/compartilhamentos/2",
            "reference_id": "2",
            "reference_type": "share",
            "created_at": (now - timedelta(hours=3)).isoformat(),
            "ttl": int((now + timedelta(days=30)).timestamp()),
        },
        {
            "pk": "USER#3",
            "sk": f"NOTIFICATION#{(now - timedelta(hours=12)).isoformat()}#3",
            "id": "3",
            "type": "share_expired",
            "title": "Compartilhamento expirado",
            "message": "O compartilhamento 'Orcamento 2026' expirou",
            "read": "false",
            "action_url": "/compartilhamentos/3",
            "reference_id": "3",
            "reference_type": "share",
            "created_at": (now - timedelta(hours=12)).isoformat(),
            "ttl": int((now + timedelta(days=30)).timestamp()),
        },
    ]
    
    print(f"Inserindo {len(notifications)} notificacoes em {table_name}...")
    with table.batch_writer() as batch:
        for notif in notifications:
            batch.put_item(Item=notif)
    print("  Notificacoes inseridas com sucesso!")


def seed_audit(dynamodb, env: str):
    """Popula tabela de auditoria."""
    table_name = f"pft_audit_{env}" if env else "pft_audit"
    table = dynamodb.Table(table_name)
    
    now = datetime.now(UTC)
    month_key = now.strftime("%Y-%m")
    
    audit_logs = [
        {
            "pk": f"AUDIT#{month_key}",
            "sk": f"{(now - timedelta(hours=5)).isoformat()}#1",
            "id": "1",
            "action": "LOGIN",
            "level": "info",
            "user_id": "2",
            "detail": "Login realizado com sucesso",
            "ip_address": "10.0.0.50",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
            "created_at": (now - timedelta(hours=5)).isoformat(),
        },
        {
            "pk": f"AUDIT#{month_key}",
            "sk": f"{(now - timedelta(hours=4)).isoformat()}#2",
            "id": "2",
            "action": "UPLOAD_ARQUIVO",
            "level": "info",
            "user_id": "2",
            "file_id": "1",
            "detail": "Upload de Relatorio_Producao_Q4_2025.pdf",
            "ip_address": "10.0.0.50",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
            "created_at": (now - timedelta(hours=4)).isoformat(),
        },
        {
            "pk": f"AUDIT#{month_key}",
            "sk": f"{(now - timedelta(hours=3)).isoformat()}#3",
            "id": "3",
            "action": "CRIAR_SHARE",
            "level": "info",
            "user_id": "2",
            "share_id": "1",
            "detail": "Criacao de compartilhamento para auditor@kpmg.com.br",
            "ip_address": "10.0.0.50",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
            "created_at": (now - timedelta(hours=3)).isoformat(),
        },
        {
            "pk": f"AUDIT#{month_key}",
            "sk": f"{(now - timedelta(hours=2)).isoformat()}#4",
            "id": "4",
            "action": "APROVAR_SHARE",
            "level": "info",
            "user_id": "1",
            "share_id": "2",
            "detail": "Aprovacao de compartilhamento por Administrador Sistema",
            "ip_address": "10.0.0.10",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
            "created_at": (now - timedelta(hours=2)).isoformat(),
        },
        {
            "pk": f"AUDIT#{month_key}",
            "sk": f"{(now - timedelta(days=1)).isoformat()}#5",
            "id": "5",
            "action": "DOWNLOAD_ARQUIVO",
            "level": "info",
            "user_id": "4",
            "file_id": "3",
            "share_id": "3",
            "detail": "Download de Planilha_Orcamento_2026.xlsx por usuario externo",
            "ip_address": "200.150.100.50",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
            "created_at": (now - timedelta(days=1)).isoformat(),
        },
    ]
    
    print(f"Inserindo {len(audit_logs)} logs de auditoria em {table_name}...")
    with table.batch_writer() as batch:
        for log in audit_logs:
            batch.put_item(Item=log)
    print("  Logs de auditoria inseridos com sucesso!")


def seed_email_logs(dynamodb, env_suffix: str = ""):
    """Popula tabela de logs de email."""
    table_name = f"pft_email_logs_{env_suffix}" if env_suffix else "pft_email_logs"
    table = dynamodb.Table(table_name)
    
    now = datetime.now(UTC)
    
    email_logs = [
        {
            "pk": "EMAIL#msg-001-share-notification",
            "sk": "METADATA",
            "message_id": "msg-001-share-notification",
            "email_type": "file_share",
            "from_email": "noreply@petrobras.com.br",
            "to_email": "auditor@kpmg.com.br",
            "subject": "Arquivos compartilhados com voce",
            "body_preview": "Voce recebeu arquivos compartilhados...",
            "status": "delivered",
            "user_id": "2",
            "share_id": "1",
            "sent_at": (now - timedelta(hours=3)).isoformat(),
            "delivered_at": (now - timedelta(hours=3, minutes=-1)).isoformat(),
            "created_at": (now - timedelta(hours=3)).isoformat(),
        },
        {
            "pk": "EMAIL#msg-002-otp",
            "sk": "METADATA",
            "message_id": "msg-002-otp",
            "email_type": "otp",
            "from_email": "noreply@petrobras.com.br",
            "to_email": "auditor@kpmg.com.br",
            "subject": "Seu codigo de acesso",
            "body_preview": "Seu codigo de acesso e: 123456...",
            "status": "delivered",
            "user_id": "4",
            "sent_at": (now - timedelta(hours=2)).isoformat(),
            "delivered_at": (now - timedelta(hours=2, minutes=-1)).isoformat(),
            "opened_at": (now - timedelta(hours=2, minutes=-5)).isoformat(),
            "created_at": (now - timedelta(hours=2)).isoformat(),
        },
        {
            "pk": "EMAIL#msg-003-approval",
            "sk": "METADATA",
            "message_id": "msg-003-approval",
            "email_type": "approval_request",
            "from_email": "noreply@petrobras.com.br",
            "to_email": "admin@petrobras.com.br",
            "subject": "Solicitacao de aprovacao de compartilhamento",
            "body_preview": "Um novo compartilhamento aguarda sua aprovacao...",
            "status": "opened",
            "user_id": "1",
            "share_id": "2",
            "sent_at": (now - timedelta(hours=4)).isoformat(),
            "delivered_at": (now - timedelta(hours=4, minutes=-1)).isoformat(),
            "opened_at": (now - timedelta(hours=3, minutes=30)).isoformat(),
            "created_at": (now - timedelta(hours=4)).isoformat(),
        },
        {
            "pk": "EMAIL#msg-004-bounce",
            "sk": "METADATA",
            "message_id": "msg-004-bounce",
            "email_type": "file_share",
            "from_email": "noreply@petrobras.com.br",
            "to_email": "email-invalido@teste.com",
            "subject": "Arquivos compartilhados com voce",
            "body_preview": "Voce recebeu arquivos compartilhados...",
            "status": "bounced",
            "user_id": "2",
            "share_id": "4",
            "sent_at": (now - timedelta(days=1)).isoformat(),
            "bounced_at": (now - timedelta(days=1, minutes=-5)).isoformat(),
            "error_message": "Recipient address rejected: User unknown",
            "error_code": "550",
            "created_at": (now - timedelta(days=1)).isoformat(),
        },
    ]
    
    print(f"Inserindo {len(email_logs)} logs de email em {table_name}...")
    with table.batch_writer() as batch:
        for log in email_logs:
            batch.put_item(Item=log)
    print("  Logs de email inseridos com sucesso!")


def seed_share_files(dynamodb, env_suffix: str = ""):
    """Popula tabela de relacao share-arquivo."""
    table_name = f"pft_share_files_{env_suffix}" if env_suffix else "pft_share_files"
    table = dynamodb.Table(table_name)
    
    now = datetime.now(UTC)
    
    share_files = [
        # Share 1 - Arquivos para auditoria
        {
            "pk": "SHARE#1",
            "sk": "FILE#1",
            "share_id": "1",
            "file_id": "1",
            "downloaded": "true",
            "downloaded_at": (now - timedelta(hours=1)).isoformat(),
            "download_count": 1,
        },
        {
            "pk": "SHARE#1",
            "sk": "FILE#2",
            "share_id": "1",
            "file_id": "2",
            "downloaded": "false",
            "download_count": 0,
        },
        # Share 2 - Contrato PDF
        {
            "pk": "SHARE#2",
            "sk": "FILE#3",
            "share_id": "2",
            "file_id": "3",
            "downloaded": "true",
            "downloaded_at": (now - timedelta(days=1)).isoformat(),
            "download_count": 2,
        },
        # Share 3 - Apresentacao
        {
            "pk": "SHARE#3",
            "sk": "FILE#4",
            "share_id": "3",
            "file_id": "4",
            "downloaded": "false",
            "download_count": 0,
        },
    ]
    
    print(f"Inserindo {len(share_files)} relacoes share-arquivo em {table_name}...")
    with table.batch_writer() as batch:
        for sf in share_files:
            batch.put_item(Item=sf)
    print("  Relacoes share-arquivo inseridas com sucesso!")


def main():
    parser = argparse.ArgumentParser(description="Popula tabelas DynamoDB com dados de teste")
    parser.add_argument("--local", action="store_true", help="Usa DynamoDB Local")
    parser.add_argument("--region", default="sa-east-1", help="Regiao AWS")
    parser.add_argument("--profile", help="AWS Profile")
    parser.add_argument("--env", default="", help="Sufixo do ambiente (development, staging, production)")
    
    args = parser.parse_args()
    
    dynamodb = get_dynamodb_resource(
        local=args.local,
        region=args.region,
        profile=args.profile
    )
    
    print("\n" + "="*60)
    print("Populando tabelas DynamoDB com dados de teste")
    print("="*60 + "\n")
    
    try:
        seed_users(dynamodb, args.env)
        seed_credentials(dynamodb, args.env)
        seed_areas(dynamodb, args.env)
        seed_files(dynamodb, args.env)
        seed_shares(dynamodb, args.env)
        seed_share_files(dynamodb, args.env)
        seed_notifications(dynamodb, args.env)
        seed_audit(dynamodb, args.env)
        seed_email_logs(dynamodb, args.env)
        
        print("\n" + "="*60)
        print("Dados de teste inseridos com sucesso!")
        print("="*60 + "\n")
        
        print("Credenciais de teste:")
        print("  - admin@petrobras.com.br / Admin@123 (supervisor)")
        print("  - maria.silva@petrobras.com.br / Maria@123 (internal)")
        print("  - joao.santos@petrobras.com.br / Joao@123 (internal)")
        print()
        
    except ClientError as e:
        print(f"\nErro ao inserir dados: {e}")
        print("Verifique se as tabelas foram criadas corretamente.")


if __name__ == "__main__":
    main()
