"""
Script Python para criar todas as tabelas DynamoDB na AWS
Uso: python create-tables.py --profile seu-profile-aws
"""

import boto3
import json
import argparse
from botocore.exceptions import ClientError

def create_tables(profile_name='default', region='us-east-1'):
    """
    Cria todas as tabelas DynamoDB definidas no arquivo dynamodb-tables.json
    """
    session = boto3.Session(profile_name=profile_name, region_name=region)
    dynamodb = session.client('dynamodb')
    
    # Carregar definições das tabelas
    with open('dynamodb-tables.json', 'r') as f:
        config = json.load(f)
    
    tables_created = []
    tables_skipped = []
    
    for table_def in config['tables']:
        table_name = table_def['TableName']
        
        try:
            # Verificar se a tabela já existe
            dynamodb.describe_table(TableName=table_name)
            print(f"⚠️  Tabela '{table_name}' já existe. Pulando...")
            tables_skipped.append(table_name)
            continue
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                # Tabela não existe, criar
                try:
                    print(f"📝 Criando tabela '{table_name}'...")
                    dynamodb.create_table(**table_def)
                    print(f"✅ Tabela '{table_name}' criada com sucesso!")
                    tables_created.append(table_name)
                except ClientError as create_error:
                    print(f"❌ Erro ao criar tabela '{table_name}': {create_error}")
            else:
                print(f"❌ Erro ao verificar tabela '{table_name}': {e}")
    
    # Aguardar que todas as tabelas fiquem ativas
    if tables_created:
        print("\n⏳ Aguardando tabelas ficarem ativas...")
        waiter = dynamodb.get_waiter('table_exists')
        for table_name in tables_created:
            print(f"   Esperando {table_name}...")
            waiter.wait(TableName=table_name)
        print("✅ Todas as tabelas estão ativas!")
    
    # Relatório final
    print("\n" + "="*60)
    print("📊 RELATÓRIO DE CRIAÇÃO")
    print("="*60)
    print(f"✅ Tabelas criadas: {len(tables_created)}")
    for table in tables_created:
        print(f"   - {table}")
    print(f"\n⚠️  Tabelas já existentes: {len(tables_skipped)}")
    for table in tables_skipped:
        print(f"   - {table}")
    print("="*60)

def delete_all_tables(profile_name='default', region='us-east-1'):
    """
    CUIDADO: Deleta todas as tabelas do projeto
    Uso apenas para desenvolvimento/testes
    """
    session = boto3.Session(profile_name=profile_name, region_name=region)
    dynamodb = session.client('dynamodb')
    
    with open('dynamodb-tables.json', 'r') as f:
        config = json.load(f)
    
    confirmation = input("⚠️  ATENÇÃO: Isso vai DELETAR todas as tabelas. Digite 'CONFIRMAR' para prosseguir: ")
    if confirmation != 'CONFIRMAR':
        print("❌ Operação cancelada.")
        return
    
    for table_def in config['tables']:
        table_name = table_def['TableName']
        try:
            print(f"🗑️  Deletando tabela '{table_name}'...")
            dynamodb.delete_table(TableName=table_name)
            print(f"✅ Tabela '{table_name}' deletada!")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                print(f"⚠️  Tabela '{table_name}' não existe.")
            else:
                print(f"❌ Erro ao deletar tabela '{table_name}': {e}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Gerenciar tabelas DynamoDB')
    parser.add_argument('--profile', default='default', help='AWS CLI profile')
    parser.add_argument('--region', default='us-east-1', help='AWS Region')
    parser.add_argument('--delete', action='store_true', help='Deletar todas as tabelas (USE COM CUIDADO)')
    
    args = parser.parse_args()
    
    if args.delete:
        delete_all_tables(args.profile, args.region)
    else:
        create_tables(args.profile, args.region)
