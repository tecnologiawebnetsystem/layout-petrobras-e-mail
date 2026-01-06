# 🚀 Guia Completo de Implementação na AWS
## Sistema de Transferência de Arquivos Petrobras

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Serviços AWS Necessários](#serviços-aws-necessários)
3. [Ordem de Implementação](#ordem-de-implementação)
4. [Configuração Detalhada por Serviço](#configuração-detalhada-por-serviço)
5. [Segurança e Permissões](#segurança-e-permissões)
6. [Custos Estimados](#custos-estimados)
7. [Checklist de Implementação](#checklist-de-implementação)
8. [Monitoramento e Logs](#monitoramento-e-logs)
9. [Backup e Disaster Recovery](#backup-e-disaster-recovery)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ Visão Geral da Arquitetura

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIOS                                  │
│  (Internos, Supervisores, Externos)                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFRONT (CDN)                              │
│  - Cache de assets estáticos                                     │
│  - Distribuição global                                           │
│  - Certificado SSL/TLS                                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐         ┌──────────────────┐
│   S3 BUCKET  │         │   API GATEWAY    │
│   (Frontend) │         │   (REST API)     │
│   Next.js    │         │                  │
└──────────────┘         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌────────────────────┐      ┌──────────────────┐
        │   LAMBDA FUNCTIONS │      │   COGNITO        │
        │   (Python Backend) │      │   (Autenticação) │
        │   - Upload         │      │                  │
        │   - Download       │      └──────────────────┘
        │   - Aprovação      │
        │   - Notificações   │
        └─────────┬──────────┘
                  │
    ┌─────────────┼─────────────┬──────────────┐
    │             │             │              │
    ▼             ▼             ▼              ▼
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐
│DynamoDB │  │S3 Bucket│  │   SQS   │  │   SNS    │
│(Dados)  │  │(Arquivos│  │ (Fila)  │  │(Notif.)  │
└─────────┘  └─────────┘  └─────────┘  └──────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ EventBridge   │
                        │ (Agendador)   │
                        └───────────────┘
\`\`\`

---

## 🛠️ Serviços AWS Necessários

### 1. **Compute & Application**
- ✅ **AWS Lambda** - Backend Python (FastAPI)
- ✅ **API Gateway** - REST API endpoints
- ✅ **Elastic Beanstalk** (Opcional) - Para backend monolítico

### 2. **Storage**
- ✅ **Amazon S3** (3 buckets)
  - Frontend (Next.js build)
  - Arquivos enviados
  - Logs e backups
- ✅ **Amazon DynamoDB** - Banco de dados NoSQL

### 3. **Networking & Content Delivery**
- ✅ **CloudFront** - CDN global
- ✅ **Route 53** - DNS e domínio
- ✅ **VPC** - Rede privada virtual
- ✅ **Application Load Balancer** (ALB)

### 4. **Security & Identity**
- ✅ **AWS Cognito** - Autenticação de usuários
- ✅ **IAM** - Políticas e permissões
- ✅ **AWS Secrets Manager** - Gerenciamento de secrets
- ✅ **AWS WAF** - Web Application Firewall
- ✅ **AWS Certificate Manager (ACM)** - Certificados SSL

### 5. **Integration & Messaging**
- ✅ **Amazon SQS** - Fila de mensagens
- ✅ **Amazon SNS** - Notificações push
- ✅ **Amazon SES** - Envio de emails
- ✅ **EventBridge** - Agendamento de tarefas

### 6. **Monitoring & Logging**
- ✅ **CloudWatch** - Logs e métricas
- ✅ **CloudWatch Alarms** - Alertas
- ✅ **X-Ray** - Tracing distribuído
- ✅ **CloudTrail** - Auditoria de API calls

### 7. **Management & Governance**
- ✅ **CloudFormation** - Infrastructure as Code
- ✅ **Systems Manager** - Gerenciamento de parâmetros
- ✅ **AWS Backup** - Backup automatizado

---

## 📦 Ordem de Implementação

### 1: 

#### 1.1 Configurar Conta AWS
\`\`\`bash
# Criar conta AWS
# Configurar billing alerts
# Ativar MFA no root account
# Criar IAM user administrativo
\`\`\`

#### 1.2 Configurar AWS CLI
\`\`\`bash
# Instalar AWS CLI
pip install awscli

# Configurar credenciais
aws configure
# AWS Access Key ID: [seu-access-key]
# AWS Secret Access Key: [seu-secret-key]
# Default region name: us-east-1
# Default output format: json
\`\`\`

#### 1.3 Criar VPC e Networking
\`\`\`bash
# Criar VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Criar Subnets (públicas e privadas)
# Configurar Internet Gateway
# Configurar NAT Gateway
# Configurar Route Tables
\`\`\`

---

### 2: Storage e Database 

#### 2.1 Criar S3 Buckets

**Bucket 1: Frontend (Next.js)**
\`\`\`bash
aws s3 mb s3://petrobras-file-transfer-frontend --region us-east-1

# Configurar como website estático
aws s3 website s3://petrobras-file-transfer-frontend \
  --index-document index.html \
  --error-document 404.html

# Configurar CORS
aws s3api put-bucket-cors \
  --bucket petrobras-file-transfer-frontend \
  --cors-configuration file://cors-config.json
\`\`\`

**Bucket 2: Arquivos Enviados**
\`\`\`bash
aws s3 mb s3://petrobras-file-transfer-uploads --region us-east-1

# Habilitar versionamento
aws s3api put-bucket-versioning \
  --bucket petrobras-file-transfer-uploads \
  --versioning-configuration Status=Enabled

# Configurar lifecycle policies para expiração
aws s3api put-bucket-lifecycle-configuration \
  --bucket petrobras-file-transfer-uploads \
  --lifecycle-configuration file://lifecycle-config.json

# Habilitar criptografia
aws s3api put-bucket-encryption \
  --bucket petrobras-file-transfer-uploads \
  --server-side-encryption-configuration file://encryption-config.json
\`\`\`

**Bucket 3: Logs e Backups**
\`\`\`bash
aws s3 mb s3://petrobras-file-transfer-logs --region us-east-1

# Bloquear acesso público
aws s3api put-public-access-block \
  --bucket petrobras-file-transfer-logs \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
\`\`\`

#### 2.2 Criar Tabelas DynamoDB

\`\`\`bash
# Executar o script Python fornecido
cd sql/
python create-tables.py

# Ou usar CloudFormation
aws cloudformation create-stack \
  --stack-name petrobras-dynamodb-tables \
  --template-body file://cloudformation-template.yaml \
  --capabilities CAPABILITY_IAM
\`\`\`

**Tabelas a serem criadas:**
- ✅ `petrobras-users` (PK: userId)
- ✅ `petrobras-files` (PK: fileId, GSI: userId, uploaderId)
- ✅ `petrobras-audit-logs` (PK: logId, GSI: userId, timestamp)
- ✅ `petrobras-notifications` (PK: notificationId, GSI: userId)
- ✅ `petrobras-sessions` (PK: sessionId, TTL: expiresAt)

---

### 3: Autenticação e Segurança 

#### 3.1 Configurar AWS Cognito

**Criar User Pool:**
\`\`\`bash
aws cognito-idp create-user-pool \
  --pool-name petrobras-file-transfer-users \
  --policies file://cognito-policies.json \
  --auto-verified-attributes email \
  --username-attributes email \
  --schema file://cognito-schema.json
\`\`\`

**Configurações do User Pool:**
- ✅ Email como username
- ✅ Senha forte obrigatória (min 12 caracteres)
- ✅ MFA opcional
- ✅ Atributos customizados: `userType` (interno/supervisor/externo)
- ✅ Verificação de email obrigatória

**Criar App Client:**
\`\`\`bash
aws cognito-idp create-user-pool-client \
  --user-pool-id [user-pool-id] \
  --client-name petrobras-web-client \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
\`\`\`

**Criar Identity Pool:**
\`\`\`bash
aws cognito-identity create-identity-pool \
  --identity-pool-name petrobras-identity-pool \
  --allow-unauthenticated-identities false \
  --cognito-identity-providers file://identity-providers.json
\`\`\`

#### 3.2 Configurar IAM Roles

**Role para Lambda Functions:**
\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/petrobras-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::petrobras-file-transfer-uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage"
      ],
      "Resource": "arn:aws:sqs:*:*:petrobras-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:*:*:petrobras-*"
    }
  ]
}
\`\`\`

#### 3.3 Configurar AWS Secrets Manager

\`\`\`bash
# Armazenar secrets da aplicação
aws secretsmanager create-secret \
  --name petrobras/file-transfer/prod \
  --secret-string file://secrets.json

# Secrets a serem armazenados:
# - Database connection strings
# - API keys de serviços externos
# - JWT secret key
# - Email SMTP credentials
\`\`\`

#### 3.4 Configurar AWS WAF

\`\`\`bash
# Criar Web ACL
aws wafv2 create-web-acl \
  --name petrobras-file-transfer-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json

# Regras a adicionar:
# - Rate limiting (1000 req/5min por IP)
# - SQL injection protection
# - XSS protection
# - Geo-blocking (permitir apenas Brasil)
# - IP whitelist da Petrobras
\`\`\`

---

### 4: Backend Lambda Functions

#### 4.1 Estrutura do Backend Python

\`\`\`
backend/
├── requirements.txt
├── layers/
│   └── common/
│       ├── db.py
│       ├── s3.py
│       └── auth.py
├── functions/
│   ├── auth/
│   │   ├── login.py
│   │   └── register.py
│   ├── files/
│   │   ├── upload.py
│   │   ├── download.py
│   │   ├── list.py
│   │   └── delete.py
│   ├── approval/
│   │   ├── approve.py
│   │   ├── reject.py
│   │   └── pending.py
│   ├── notifications/
│   │   ├── send.py
│   │   └── mark-read.py
│   └── audit/
│       ├── log.py
│       └── query.py
└── events/
    ├── check-expiration.py
    └── cleanup-old-files.py
\`\`\`

#### 4.2 Criar Lambda Functions

**Exemplo: Upload Function**
\`\`\`bash
# Criar ZIP com código
cd backend/functions/files/
zip -r upload.zip upload.py ../../layers/common/*

# Criar Lambda
aws lambda create-function \
  --function-name petrobras-file-upload \
  --runtime python3.11 \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler upload.lambda_handler \
  --zip-file fileb://upload.zip \
  --timeout 300 \
  --memory-size 1024 \
  --environment Variables="{
    DYNAMODB_TABLE=petrobras-files,
    S3_BUCKET=petrobras-file-transfer-uploads,
    MAX_FILE_SIZE=524288000
  }"
\`\`\`

**Lambda Functions necessárias:**

1. **Autenticação (2 functions)**
   - `petrobras-auth-login`
   - `petrobras-auth-validate-token`

2. **Gestão de Arquivos (6 functions)**
   - `petrobras-file-upload` - Upload de arquivos
   - `petrobras-file-download` - Download de arquivos
   - `petrobras-file-list` - Listar arquivos do usuário
   - `petrobras-file-delete` - Deletar arquivo
   - `petrobras-file-update-expiration` - Alterar tempo de expiração
   - `petrobras-file-generate-presigned-url` - Gerar URL temporária

3. **Aprovação (3 functions)**
   - `petrobras-approval-pending` - Listar pendentes
   - `petrobras-approval-approve` - Aprovar arquivo
   - `petrobras-approval-reject` - Rejeitar arquivo

4. **Notificações (3 functions)**
   - `petrobras-notification-send` - Enviar notificação
   - `petrobras-notification-list` - Listar notificações
   - `petrobras-notification-mark-read` - Marcar como lida

5. **Auditoria (2 functions)**
   - `petrobras-audit-log` - Registrar ação
   - `petrobras-audit-query` - Consultar logs

6. **Métricas Dashboard (1 function)**
   - `petrobras-metrics-dashboard` - Calcular métricas

7. **Tarefas Agendadas (2 functions)**
   - `petrobras-check-expiration` - Verificar arquivos expirados
   - `petrobras-cleanup-old-files` - Limpar arquivos antigos

#### 4.3 Criar Lambda Layers

\`\`\`bash
# Criar layer com dependências Python
mkdir python
pip install -r requirements.txt -t python/
zip -r dependencies-layer.zip python

aws lambda publish-layer-version \
  --layer-name petrobras-dependencies \
  --zip-file fileb://dependencies-layer.zip \
  --compatible-runtimes python3.11

# Adicionar layer às functions
aws lambda update-function-configuration \
  --function-name petrobras-file-upload \
  --layers arn:aws:lambda:us-east-1:ACCOUNT_ID:layer:petrobras-dependencies:1
\`\`\`

**Dependências (requirements.txt):**
\`\`\`txt
boto3==1.28.0
fastapi==0.104.0
pydantic==2.4.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
mangum==0.17.0
\`\`\`

---

### 5: API Gateway

#### 5.1 Criar REST API

\`\`\`bash
aws apigateway create-rest-api \
  --name petrobras-file-transfer-api \
  --description "API para sistema de transferência de arquivos Petrobras" \
  --endpoint-configuration types=REGIONAL
\`\`\`

#### 5.2 Definir Recursos e Métodos

**Estrutura da API:**
\`\`\`
/
├── /auth
│   ├── POST /login
│   └── POST /validate
├── /files
│   ├── GET /files (listar)
│   ├── POST /files (upload)
│   ├── GET /files/{id} (detalhes)
│   ├── DELETE /files/{id}
│   └── PUT /files/{id}/expiration
├── /approval
│   ├── GET /approval/pending
│   ├── POST /approval/{id}/approve
│   └── POST /approval/{id}/reject
├── /notifications
│   ├── GET /notifications
│   └── PUT /notifications/{id}/read
├── /audit
│   └── GET /audit/logs
└── /metrics
    └── GET /metrics/dashboard
\`\`\`

#### 5.3 Configurar Authorizer

\`\`\`bash
# Criar Cognito Authorizer
aws apigateway create-authorizer \
  --rest-api-id [api-id] \
  --name CognitoAuthorizer \
  --type COGNITO_USER_POOLS \
  --provider-arns arn:aws:cognito-idp:us-east-1:ACCOUNT_ID:userpool/[pool-id] \
  --identity-source method.request.header.Authorization
\`\`\`

#### 5.4 Deploy API

\`\`\`bash
# Criar deployment
aws apigateway create-deployment \
  --rest-api-id [api-id] \
  --stage-name prod \
  --description "Produção"

# URL da API:
# https://[api-id].execute-api.us-east-1.amazonaws.com/prod
\`\`\`

---

### 6: Messaging e Notificações

#### 6.1 Criar SQS Queues

**Fila de Processamento de Upload:**
\`\`\`bash
aws sqs create-queue \
  --queue-name petrobras-file-upload-queue \
  --attributes file://sqs-attributes.json
\`\`\`

**Fila de Notificações:**
\`\`\`bash
aws sqs create-queue \
  --queue-name petrobras-notifications-queue \
  --attributes VisibilityTimeout=300,MessageRetentionPeriod=1209600
\`\`\`

**Fila Dead Letter (DLQ):**
\`\`\`bash
aws sqs create-queue \
  --queue-name petrobras-dlq \
  --attributes MaximumMessageSize=262144,MessageRetentionPeriod=1209600
\`\`\`

#### 6.2 Criar SNS Topics

**Tópico de Notificações:**
\`\`\`bash
aws sns create-topic \
  --name petrobras-file-notifications

# Adicionar subscriptions
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:petrobras-file-notifications \
  --protocol email \
  --notification-endpoint supervisor@petrobras.com.br
\`\`\`

#### 6.3 Configurar SES (Email)

\`\`\`bash
# Verificar domínio
aws ses verify-domain-identity --domain petrobras.com.br

# Verificar emails individuais (sandbox)
aws ses verify-email-identity --email-address noreply@petrobras.com.br

# Criar template de email
aws ses create-template \
  --cli-input-json file://email-template.json
\`\`\`

---

### 7: Agendamento e Automação

#### 7.1 Configurar EventBridge Rules

**Verificar Arquivos Expirados (Diariamente às 2h):**
\`\`\`bash
aws events put-rule \
  --name petrobras-check-expiration \
  --schedule-expression "cron(0 2 * * ? *)" \
  --description "Verificar arquivos expirados diariamente"

aws events put-targets \
  --rule petrobras-check-expiration \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:ACCOUNT_ID:function:petrobras-check-expiration"
\`\`\`

**Limpar Arquivos Antigos (Semanalmente aos domingos às 3h):**
\`\`\`bash
aws events put-rule \
  --name petrobras-cleanup-old-files \
  --schedule-expression "cron(0 3 ? * SUN *)" \
  --description "Limpar arquivos antigos semanalmente"
\`\`\`

**Gerar Relatório Semanal (Sextas às 18h):**
\`\`\`bash
aws events put-rule \
  --name petrobras-weekly-report \
  --schedule-expression "cron(0 18 ? * FRI *)" \
  --description "Gerar relatório semanal"
\`\`\`

---

### 8: Frontend Deploy

#### 8.1 Build do Next.js

\`\`\`bash
# Build estático
npm run build
npm run export  # ou next export

# Fazer upload para S3
aws s3 sync out/ s3://petrobras-file-transfer-frontend --delete

# Invalidar cache do CloudFront
aws cloudfront create-invalidation \
  --distribution-id [distribution-id] \
  --paths "/*"
\`\`\`

#### 8.2 Configurar CloudFront

\`\`\`bash
aws cloudfront create-distribution \
  --origin-domain-name petrobras-file-transfer-frontend.s3.amazonaws.com \
  --default-root-object index.html \
  --distribution-config file://cloudfront-config.json
\`\`\`

**Configurações CloudFront:**
- ✅ HTTPS obrigatório
- ✅ Certificado SSL custom (via ACM)
- ✅ Geo-restriction (apenas Brasil)
- ✅ WAF associado
- ✅ Custom error pages (404 → /404.html)
- ✅ Cache behaviors para /api/* (sem cache)
- ✅ Compress objects automatically

#### 8.3 Configurar Route 53

\`\`\`bash
# Criar hosted zone
aws route53 create-hosted-zone \
  --name files.petrobras.com.br \
  --caller-reference $(date +%s)

# Criar record set apontando para CloudFront
aws route53 change-resource-record-sets \
  --hosted-zone-id [zone-id] \
  --change-batch file://route53-changes.json
\`\`\`

---

### 9: Monitoring e Logging

#### 9.1 Configurar CloudWatch Logs

**Log Groups para cada Lambda:**
\`\`\`bash
# Criar log groups
for func in upload download approve reject notify; do
  aws logs create-log-group \
    --log-group-name /aws/lambda/petrobras-file-$func
done

# Configurar retenção (30 dias)
aws logs put-retention-policy \
  --log-group-name /aws/lambda/petrobras-file-upload \
  --retention-in-days 30
\`\`\`

**Log Insights Queries:**
\`\`\`
# Erros nas últimas 24h
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

# Top usuários por upload
fields userId, count(*) as uploads
| filter operation = "upload"
| stats count() by userId
| sort uploads desc
| limit 10
\`\`\`

#### 9.2 Configurar CloudWatch Alarms

**Alarm: Lambda Errors**
\`\`\`bash
aws cloudwatch put-metric-alarm \
  --alarm-name petrobras-lambda-errors \
  --alarm-description "Alerta quando Lambda tem muitos erros" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:petrobras-alerts
\`\`\`

**Alarm: API Gateway 5xx Errors**
\`\`\`bash
aws cloudwatch put-metric-alarm \
  --alarm-name petrobras-api-5xx-errors \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 60 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
\`\`\`

**Alarm: DynamoDB Throttling**
\`\`\`bash
aws cloudwatch put-metric-alarm \
  --alarm-name petrobras-dynamodb-throttle \
  --metric-name UserErrors \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
\`\`\`

#### 9.3 Configurar X-Ray

\`\`\`bash
# Habilitar tracing em Lambda
aws lambda update-function-configuration \
  --function-name petrobras-file-upload \
  --tracing-config Mode=Active

# Habilitar tracing em API Gateway
aws apigateway update-stage \
  --rest-api-id [api-id] \
  --stage-name prod \
  --patch-operations op=replace,path=/tracingEnabled,value=true
\`\`\`

#### 9.4 Dashboard Customizado

\`\`\`bash
aws cloudwatch put-dashboard \
  --dashboard-name petrobras-file-transfer \
  --dashboard-body file://dashboard-config.json
\`\`\`

**Métricas no Dashboard:**
- Total de uploads (últimas 24h)
- Total de downloads (últimas 24h)
- Arquivos pendentes de aprovação
- Arquivos expirados hoje
- Latência média da API
- Taxa de erro das Lambdas
- Uso de storage S3
- Custo estimado diário

---

### 10: Backup e Disaster Recovery

#### 10.1 AWS Backup

\`\`\`bash
# Criar Backup Vault
aws backup create-backup-vault \
  --backup-vault-name petrobras-backup-vault

# Criar Backup Plan
aws backup create-backup-plan \
  --backup-plan file://backup-plan.json
\`\`\`

**Backup Plan:**
\`\`\`json
{
  "BackupPlanName": "petrobras-daily-backup",
  "Rules": [
    {
      "RuleName": "DailyBackup",
      "TargetBackupVault": "petrobras-backup-vault",
      "ScheduleExpression": "cron(0 5 * * ? *)",
      "StartWindowMinutes": 60,
      "CompletionWindowMinutes": 120,
      "Lifecycle": {
        "DeleteAfterDays": 35,
        "MoveToColdStorageAfterDays": 7
      }
    }
  ]
}
\`\`\`

**Recursos para Backup:**
- ✅ Todas as tabelas DynamoDB
- ✅ S3 bucket de uploads (versionamento)
- ✅ Configurações do Cognito User Pool

#### 10.2 Replicação S3

\`\`\`bash
# Habilitar replicação cross-region
aws s3api put-bucket-replication \
  --bucket petrobras-file-transfer-uploads \
  --replication-configuration file://replication-config.json
\`\`\`

#### 10.3 Point-in-Time Recovery (DynamoDB)

\`\`\`bash
# Habilitar PITR
aws dynamodb update-continuous-backups \
  --table-name petrobras-files \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
\`\`\`

### IAM Policies Recomendadas

**Policy: S3 Upload com Limite de Tamanho**
\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::petrobras-file-transfer-uploads/*",
      "Condition": {
        "NumericLessThanEquals": {
          "s3:content-length": 524288000
        }
      }
    }
  ]
}
\`\`\`

**Policy: DynamoDB com Condition**
\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/petrobras-files",
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": ["${cognito-identity.amazonaws.com:sub}"]
        }
      }
    }
  ]
}
\`\`\`

### Logs Importantes

#### Formato de Log Estruturado (JSON)
\`\`\`json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "service": "file-upload",
  "userId": "user-123",
  "requestId": "req-abc-456",
  "action": "upload",
  "fileId": "file-789",
  "fileName": "document.pdf",
  "fileSize": 2048576,
  "duration": 1250,
  "status": "success",
  "metadata": {
    "userType": "interno",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
\`\`\`
