"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Server,
  Database,
  Mail,
  CloudCog,
  Terminal,
  CheckCircle2,
  XCircle,
  DollarSign,
  FileCode,
  Boxes,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

export default function LocalDevelopmentPage() {
  const [activeTab, setActiveTab] = useState("intro")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Wiki
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
            <Server className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-slate-900">Desenvolvimento Local AWS</h1>
          <p className="text-lg text-slate-600">
            Como rodar DynamoDB, S3, SES, Lambda e outros serviços AWS no seu computador SEM CUSTO
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="intro">Introdução</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="docker">Docker Setup</TabsTrigger>
            <TabsTrigger value="python">Python Config</TabsTrigger>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
            <TabsTrigger value="testing">Testes</TabsTrigger>
            <TabsTrigger value="vs-prod">Local vs AWS</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          </TabsList>

          {/* TAB 1: Introdução */}
          <TabsContent value="intro" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-6 w-6" />O que é Desenvolvimento Local AWS?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Desenvolvimento local = Zero custo!</strong> Você roda os serviços AWS no seu computador sem
                    pagar nada enquanto desenvolve e testa.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Analogia simples:</h3>
                  <p className="leading-relaxed text-slate-700">
                    Imagine que a AWS é como um shopping gigante com várias lojas (DynamoDB, S3, SES, etc). Ao invés de
                    alugar uma loja de verdade para testar seu negócio (o que custa dinheiro), você monta uma{" "}
                    <strong>maquete do shopping na sua mesa</strong> para testar tudo antes.
                  </p>
                  <p className="leading-relaxed text-slate-700">
                    Desenvolvimento local é essa maquete: você simula a AWS inteira no seu computador, testa tudo, e
                    quando estiver pronto, aí sim você implanta na AWS real.
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold text-slate-900">Por que usar desenvolvimento local?</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Economia</strong>
                        <p className="text-sm text-green-700">Zero custo durante desenvolvimento e testes</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Velocidade</strong>
                        <p className="text-sm text-green-700">Testa mudanças instantaneamente sem deploy</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Offline</strong>
                        <p className="text-sm text-green-700">Desenvolve mesmo sem internet</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Segurança</strong>
                        <p className="text-sm text-green-700">Testa sem risco de bagunçar dados de produção</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Serviços AWS */}
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Serviços AWS que usamos no Sistema</CardTitle>
                <CardDescription>Quais podem rodar localmente e quais não podem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    {
                      name: "DynamoDB",
                      icon: Database,
                      description: "Banco de dados NoSQL onde salvamos uploads, usuários, aprovações",
                      local: true,
                      why: "Existe DynamoDB Local oficial da AWS",
                    },
                    {
                      name: "S3",
                      icon: Boxes,
                      description: "Armazenamento de arquivos (PDFs, ZIPs, documentos)",
                      local: true,
                      why: "LocalStack simula S3 perfeitamente",
                    },
                    {
                      name: "SES (Simple Email Service)",
                      icon: Mail,
                      description: "Envio de e-mails de notificação",
                      local: true,
                      why: "LocalStack pode simular envio (não envia e-mail real, só registra)",
                    },
                    {
                      name: "Lambda",
                      icon: CloudCog,
                      description: "Funções serverless para processamento assíncrono",
                      local: true,
                      why: "LocalStack executa Lambdas localmente",
                    },
                    {
                      name: "Secrets Manager",
                      icon: FileCode,
                      description: "Armazena senhas e chaves secretas",
                      local: true,
                      why: "LocalStack simula secrets",
                    },
                    {
                      name: "CloudWatch",
                      icon: Terminal,
                      description: "Logs e monitoramento",
                      local: true,
                      why: "LocalStack captura logs básicos",
                    },
                  ].map((service) => (
                    <div key={service.name} className="flex gap-4 rounded-lg border p-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                          service.local ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        <service.icon className={`h-6 w-6 ${service.local ? "text-green-600" : "text-red-600"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{service.name}</h3>
                          {service.local ? (
                            <Badge className="bg-green-100 text-green-700">Roda Local</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700">Apenas AWS Real</Badge>
                          )}
                        </div>
                        <p className="mb-2 text-sm text-slate-600">{service.description}</p>
                        <p className="text-xs text-slate-500">
                          <strong>Por quê:</strong> {service.why}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Resumo:</strong> TODOS os serviços que usamos podem rodar localmente! Nossa squad pode
                    desenvolver 100% offline.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Docker Setup */}
          <TabsContent value="docker" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração com Docker (Mais Fácil)</CardTitle>
                <CardDescription>Use Docker para rodar tudo com 1 comando</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertDescription>
                    <strong>O que é Docker?</strong> É como uma máquina virtual leve que roda programas isolados. Aqui
                    usamos para rodar os serviços AWS sem instalar nada no seu computador.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Passo 1: Instalar Docker</h3>
                  <div className="rounded-lg bg-slate-900 p-4">
                    <p className="mb-2 text-sm text-slate-400">Windows / Mac / Linux:</p>
                    <p className="text-sm text-white">
                      Baixe em: <span className="text-blue-400">https://www.docker.com/get-started</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Passo 2: Criar arquivo docker-compose.yml</h3>
                  <p className="text-sm text-slate-600">Crie este arquivo na raiz do projeto back-end:</p>
                  <div className="rounded-lg bg-slate-900 p-4">
                    <pre className="overflow-x-auto text-xs text-white">
                      {`# docker-compose.yml
version: '3.8'

services:
  # LocalStack - Simula TODOS os serviços AWS
  localstack:
    image: localstack/localstack:latest
    container_name: localstack_petrobras
    ports:
      - "4566:4566"  # Gateway principal
      - "4571:4571"  # Porta adicional
    environment:
      - SERVICES=dynamodb,s3,ses,lambda,secretsmanager,cloudwatch
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "./localstack_data:/tmp/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"

  # DynamoDB Admin - Interface visual para ver tabelas
  dynamodb-admin:
    image: aaronshaf/dynamodb-admin:latest
    container_name: dynamodb_admin_petrobras
    ports:
      - "8001:8001"
    environment:
      - DYNAMO_ENDPOINT=http://localstack:4566
    depends_on:
      - localstack`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Passo 3: Iniciar os serviços</h3>
                  <div className="rounded-lg bg-slate-900 p-4">
                    <pre className="text-sm text-white">{`# Iniciar tudo
docker-compose up -d

# Ver se está rodando
docker-compose ps

# Ver logs
docker-compose logs -f localstack`}</pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Passo 4: Testar se está funcionando</h3>
                  <div className="rounded-lg bg-slate-900 p-4">
                    <pre className="text-sm text-white">{`# Testar DynamoDB
aws dynamodb list-tables --endpoint-url=http://localhost:4566

# Testar S3
aws s3 ls --endpoint-url=http://localhost:4566`}</pre>
                  </div>
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Se retornar lista vazia está OK! Significa que está funcionando mas ainda não criamos nada.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Interfaces visuais disponíveis:</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <strong className="text-slate-900">LocalStack Dashboard</strong>
                      <p className="text-sm text-slate-600">http://localhost:4566/_localstack/health</p>
                      <p className="mt-1 text-xs text-slate-500">Status de todos os serviços</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <strong className="text-slate-900">DynamoDB Admin</strong>
                      <p className="text-sm text-slate-600">http://localhost:8001</p>
                      <p className="mt-1 text-xs text-slate-500">Ver tabelas e dados visualmente</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: Python Config */}
          <TabsContent value="python" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Python para Local/Produção</CardTitle>
                <CardDescription>Como fazer o código detectar automaticamente onde está rodando</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <FileCode className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Estratégia:</strong> Usamos variáveis de ambiente. Se a variável DYNAMODB_ENDPOINT existir,
                    roda local. Se não existir, roda na AWS real.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">1. Criar arquivo de configuração</h3>
                  <p className="text-sm text-slate-600">Crie: back-end/python/app/config.py</p>
                  <div className="rounded-lg bg-slate-900 p-4">
                    <pre className="overflow-x-auto text-xs text-white">
                      {`# app/config.py
import os
from typing import Optional

class Settings:
    # Detecta se está em desenvolvimento local
    IS_LOCAL: bool = os.getenv("ENV", "production") == "local"
    
    # Endpoints locais (só usa se IS_LOCAL = True)
    DYNAMODB_ENDPOINT: Optional[str] = "http://localhost:4566" if IS_LOCAL else None
    S3_ENDPOINT: Optional[str] = "http://localhost:4566" if IS_LOCAL else None
    SES_ENDPOINT: Optional[str] = "http://localhost:4566" if IS_LOCAL else None
    
    # Região AWS
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    
    # Credenciais fake para local (LocalStack ignora)
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "test") if IS_LOCAL else None
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "test") if IS_LOCAL else None

settings = Settings()`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">2. Cliente DynamoDB que funciona em ambos</h3>
                  <p className="text-sm text-slate-600">Crie: back-end/python/app/database.py</p>
                  <div className="rounded-lg bg-slate-900 p-4">
                    <pre className="overflow-x-auto text-xs text-white">
                      {`# app/database.py
import boto3
from app.config import settings

def get_dynamodb_client():
    """
    Retorna cliente DynamoDB que funciona local e produção
    """
    if settings.IS_LOCAL:
        # MODO LOCAL
        return boto3.client(
            'dynamodb',
            endpoint_url=settings.DYNAMODB_ENDPOINT,
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
    else:
        # MODO PRODUÇÃO (AWS real)
        return boto3.client('dynamodb', region_name=settings.AWS_REGION)

def get_dynamodb_resource():
    """
    Retorna resource DynamoDB (interface mais amigável)
    """
    if settings.IS_LOCAL:
        return boto3.resource(
            'dynamodb',
            endpoint_url=settings.DYNAMODB_ENDPOINT,
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
    else:
        return boto3.resource('dynamodb', region_name=settings.AWS_REGION)

# Exemplo de uso
dynamodb = get_dynamodb_resource()
table = dynamodb.Table('uploads')`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">3. Cliente S3</h3>
                  <div className="rounded-lg bg-slate-900 p-4">
                    <pre className="overflow-x-auto text-xs text-white">
                      {`# app/storage.py
import boto3
from app.config import settings

def get_s3_client():
    if settings.IS_LOCAL:
        return boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT,
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
    else:
        return boto3.client('s3', region_name=settings.AWS_REGION)

# Upload de arquivo
s3 = get_s3_client()
s3.upload_file('local.pdf', 'petrobras-uploads', 'documento.pdf')`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">4. Arquivo .env para desenvolvimento local</h3>
                  <p className="text-sm text-slate-600">Crie: back-end/python/.env.local</p>
                  <div className="rounded-lg bg-slate-900 p-4">
                    <pre className="text-sm text-white">
                      {`# .env.local (para desenvolvimento)
ENV=local
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">5. Arquivo .env para produção</h3>
                  <p className="text-sm text-slate-600">.env.production (na AWS real)</p>
                  <div className="rounded-lg bg-slate-900 p-4">
                    <pre className="text-sm text-white">
                      {`# .env.production (na AWS)
ENV=production
AWS_REGION=us-east-1
# Credenciais reais virão do IAM Role, não precisa especificar`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: Scripts */}
          <TabsContent value="scripts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scripts para Criar Tabelas Localmente</CardTitle>
                <CardDescription>Automatize a criação da estrutura do banco de dados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Script: Criar todas as tabelas</h3>
                  <p className="text-sm text-slate-600">Crie: back-end/python/scripts/create_tables_local.py</p>
                  <div className="rounded-lg bg-slate-900 p-4">
                    <pre className="overflow-x-auto text-xs text-white">
                      {`# scripts/create_tables_local.py
import boto3
import os

# Força modo local
os.environ['ENV'] = 'local'

from app.database import get_dynamodb_client

def create_all_tables():
    """Cria todas as 5 tabelas do sistema"""
    dynamodb = get_dynamodb_client()
    
    tables = [
        {
            'TableName': 'uploads',
            'KeySchema': [
                {'AttributeName': 'upload_id', 'KeyType': 'HASH'}
            ],
            'AttributeDefinitions': [
                {'AttributeName': 'upload_id', 'AttributeType': 'S'},
                {'AttributeName': 'sender_email', 'AttributeType': 'S'},
                {'AttributeName': 'status', 'AttributeType': 'S'},
            ],
            'GlobalSecondaryIndexes': [
                {
                    'IndexName': 'sender-index',
                    'KeySchema': [{'AttributeName': 'sender_email', 'KeyType': 'HASH'}],
                    'Projection': {'ProjectionType': 'ALL'},
                    'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
                },
                {
                    'IndexName': 'status-index',
                    'KeySchema': [{'AttributeName': 'status', 'KeyType': 'HASH'}],
                    'Projection': {'ProjectionType': 'ALL'},
                    'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
                }
            ],
            'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        },
        {
            'TableName': 'users',
            'KeySchema': [
                {'AttributeName': 'user_id', 'KeyType': 'HASH'}
            ],
            'AttributeDefinitions': [
                {'AttributeName': 'user_id', 'AttributeType': 'S'},
                {'AttributeName': 'email', 'AttributeType': 'S'},
            ],
            'GlobalSecondaryIndexes': [
                {
                    'IndexName': 'email-index',
                    'KeySchema': [{'AttributeName': 'email', 'KeyType': 'HASH'}],
                    'Projection': {'ProjectionType': 'ALL'},
                    'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
                }
            ],
            'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        },
        # ... mais 3 tabelas
    ]
    
    for table_config in tables:
        try:
            dynamodb.create_table(**table_config)
            print(f"✅ Tabela {table_config['TableName']} criada com sucesso!")
        except Exception as e:
            if 'ResourceInUseException' in str(e):
                print(f"ℹ️  Tabela {table_config['TableName']} já existe")
            else:
                print(f"❌ Erro ao criar {table_config['TableName']}: {e}")

if __name__ == "__main__":
    print("🚀 Criando tabelas no DynamoDB Local...")
    create_all_tables()
    print("✨ Processo concluído!")`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Como executar:</h3>
                  <div className="rounded-lg bg-slate-900 p-4">
                    <pre className="text-sm text-white">
                      {`# 1. Certifique-se que LocalStack está rodando
docker-compose ps

# 2. Execute o script
python scripts/create_tables_local.py

# 3. Verifique se as tabelas foram criadas
aws dynamodb list-tables --endpoint-url=http://localhost:4566`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Script: Popular com dados de teste</h3>
                  <p className="text-sm text-slate-600">Crie: scripts/seed_local_data.py</p>
                  <div className="rounded-lg bg-slate-900 p-4">
                    <pre className="overflow-x-auto text-xs text-white">
                      {`# scripts/seed_local_data.py
import os
os.environ['ENV'] = 'local'

from app.database import get_dynamodb_resource
from datetime import datetime, timedelta

def seed_data():
    dynamodb = get_dynamodb_resource()
    
    # Adicionar usuários de teste
    users_table = dynamodb.Table('users')
    users_table.put_item(Item={
        'user_id': 'user-1',
        'email': 'kleber.goncalves.prestserv@petrobras.com.br',
        'name': 'Kleber Gonçalves',
        'role': 'internal',
        'created_at': datetime.now().isoformat()
    })
    
    users_table.put_item(Item={
        'user_id': 'user-2',
        'email': 'wagner.brazil@petrobras.com.br',
        'name': 'Wagner Gaspar Brazil',
        'role': 'supervisor',
        'created_at': datetime.now().isoformat()
    })
    
    # Adicionar upload de teste
    uploads_table = dynamodb.Table('uploads')
    uploads_table.put_item(Item={
        'upload_id': 'upload-test-1',
        'sender_email': 'kleber.goncalves.prestserv@petrobras.com.br',
        'recipient_email': 'externo@empresa.com',
        'status': 'pending',
        'files': ['documento.pdf', 'planilha.xlsx'],
        'created_at': datetime.now().isoformat(),
        'expires_at': (datetime.now() + timedelta(days=7)).isoformat()
    })
    
    print("✅ Dados de teste inseridos com sucesso!")

if __name__ == "__main__":
    seed_data()`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: Testes */}
          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Como Testar Localmente</CardTitle>
                <CardDescription>Checklist completo para validar que está tudo funcionando</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Checklist de Testes</h3>

                  <div className="space-y-3">
                    <div className="flex gap-3 rounded-lg border p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div className="flex-1">
                        <strong className="text-slate-900">1. LocalStack está rodando</strong>
                        <div className="mt-2 rounded bg-slate-900 p-2">
                          <code className="text-xs text-white">docker-compose ps</code>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Deve mostrar localstack como UP</p>
                      </div>
                    </div>

                    <div className="flex gap-3 rounded-lg border p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div className="flex-1">
                        <strong className="text-slate-900">2. Tabelas foram criadas</strong>
                        <div className="mt-2 rounded bg-slate-900 p-2">
                          <code className="text-xs text-white">python scripts/create_tables_local.py</code>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 rounded-lg border p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div className="flex-1">
                        <strong className="text-slate-900">3. FastAPI conecta no DynamoDB local</strong>
                        <div className="mt-2 rounded bg-slate-900 p-2">
                          <code className="text-xs text-white">ENV=local uvicorn app.main:app --reload</code>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Acesse: http://localhost:8080/docs</p>
                      </div>
                    </div>

                    <div className="flex gap-3 rounded-lg border p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div className="flex-1">
                        <strong className="text-slate-900">4. Criar upload via API</strong>
                        <div className="mt-2 rounded bg-slate-900 p-2">
                          <code className="text-xs text-white">POST /api/uploads</code>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Teste criar um upload e verifique no DynamoDB Admin
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 rounded-lg border p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div className="flex-1">
                        <strong className="text-slate-900">5. Ver dados no DynamoDB Admin</strong>
                        <div className="mt-2 rounded bg-slate-900 p-2">
                          <code className="text-xs text-white">http://localhost:8001</code>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Interface visual para ver as tabelas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 7: Local vs Produção */}
          <TabsContent value="vs-prod" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Diferenças entre Local e Produção AWS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="p-3">Aspecto</th>
                        <th className="p-3">Local (LocalStack)</th>
                        <th className="p-3">Produção (AWS Real)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-3 font-medium">Custo</td>
                        <td className="p-3 text-green-600">R$ 0,00</td>
                        <td className="p-3 text-orange-600">Pago por uso</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Internet</td>
                        <td className="p-3 text-green-600">Não precisa</td>
                        <td className="p-3 text-orange-600">Precisa sempre</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Dados</td>
                        <td className="p-3">Temporários (perde ao parar)</td>
                        <td className="p-3">Permanentes</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Performance</td>
                        <td className="p-3">Limitada pelo PC</td>
                        <td className="p-3">Alta disponibilidade AWS</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">E-mails</td>
                        <td className="p-3">Não envia (só simula)</td>
                        <td className="p-3">Envia e-mails reais</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Credenciais</td>
                        <td className="p-3">Fake (test/test)</td>
                        <td className="p-3">IAM real da Petrobras</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 8: Troubleshooting */}
          <TabsContent value="troubleshooting" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Problemas Comuns e Soluções</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    problem: "LocalStack não inicia",
                    solution: "Verifique se Docker está rodando: docker ps. Reinicie: docker-compose restart",
                  },
                  {
                    problem: "Tabelas não aparecem",
                    solution:
                      "Execute o script novamente: python scripts/create_tables_local.py. Verifique endpoint: http://localhost:4566",
                  },
                  {
                    problem: 'Python dá erro "connection refused"',
                    solution: "Certifique-se que ENV=local no .env e LocalStack está rodando na porta 4566",
                  },
                  {
                    problem: "Dados somem ao reiniciar",
                    solution:
                      "Normal! Local é temporário. Use docker volume para persistir ou re-execute o seed: python scripts/seed_local_data.py",
                  },
                  {
                    problem: "DynamoDB Admin não carrega",
                    solution:
                      "Acesse http://localhost:8001. Se não funcionar, reinicie: docker-compose restart dynamodb-admin",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 shrink-0 text-orange-600" />
                      <div>
                        <strong className="text-orange-900">{item.problem}</strong>
                        <p className="mt-1 text-sm text-orange-700">
                          <strong>Solução:</strong> {item.solution}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
