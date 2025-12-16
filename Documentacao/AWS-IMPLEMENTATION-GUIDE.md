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

```
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
```

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

### **FASE 1: Fundação (Semana 1)**

#### 1.1 Configurar Conta AWS
```bash
# Criar conta AWS
# Configurar billing alerts
# Ativar MFA no root account
# Criar IAM user administrativo
```

#### 1.2 Configurar AWS CLI
```bash
# Instalar AWS CLI
pip install awscli

# Configurar credenciais
aws configure
# AWS Access Key ID: [seu-access-key]
# AWS Secret Access Key: [seu-secret-key]
# Default region name: us-east-1
# Default output format: json
```

#### 1.3 Criar VPC e Networking
```bash
# Criar VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Criar Subnets (públicas e privadas)
# Configurar Internet Gateway
# Configurar NAT Gateway
# Configurar Route Tables
```

---

### **FASE 2: Storage e Database (Semana 1-2)**

#### 2.1 Criar S3 Buckets

**Bucket 1: Frontend (Next.js)**
```bash
aws s3 mb s3://petrobras-file-transfer-frontend --region us-east-1

# Configurar como website estático
aws s3 website s3://petrobras-file-transfer-frontend \
  --index-document index.html \
  --error-document 404.html

# Configurar CORS
aws s3api put-bucket-cors \
  --bucket petrobras-file-transfer-frontend \
  --cors-configuration file://cors-config.json
```

**Bucket 2: Arquivos Enviados**
```bash
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
```

**Bucket 3: Logs e Backups**
```bash
aws s3 mb s3://petrobras-file-transfer-logs --region us-east-1

# Bloquear acesso público
aws s3api put-public-access-block \
  --bucket petrobras-file-transfer-logs \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

#### 2.2 Criar Tabelas DynamoDB

```bash
# Executar o script Python fornecido
cd sql/
python create-tables.py

# Ou usar CloudFormation
aws cloudformation create-stack \
  --stack-name petrobras-dynamodb-tables \
  --template-body file://cloudformation-template.yaml \
  --capabilities CAPABILITY_IAM
```

**Tabelas a serem criadas:**
- ✅ `petrobras-users` (PK: userId)
- ✅ `petrobras-files` (PK: fileId, GSI: userId, uploaderId)
- ✅ `petrobras-audit-logs` (PK: logId, GSI: userId, timestamp)
- ✅ `petrobras-notifications` (PK: notificationId, GSI: userId)
- ✅ `petrobras-sessions` (PK: sessionId, TTL: expiresAt)

---

### **FASE 3: Autenticação e Segurança (Semana 2)**

#### 3.1 Configurar AWS Cognito

**Criar User Pool:**
```bash
aws cognito-idp create-user-pool \
  --pool-name petrobras-file-transfer-users \
  --policies file://cognito-policies.json \
  --auto-verified-attributes email \
  --username-attributes email \
  --schema file://cognito-schema.json
```

**Configurações do User Pool:**
- ✅ Email como username
- ✅ Senha forte obrigatória (min 12 caracteres)
- ✅ MFA opcional
- ✅ Atributos customizados: `userType` (interno/supervisor/externo)
- ✅ Verificação de email obrigatória

**Criar App Client:**
```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id [user-pool-id] \
  --client-name petrobras-web-client \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
```

**Criar Identity Pool:**
```bash
aws cognito-identity create-identity-pool \
  --identity-pool-name petrobras-identity-pool \
  --allow-unauthenticated-identities false \
  --cognito-identity-providers file://identity-providers.json
```

#### 3.2 Configurar IAM Roles

**Role para Lambda Functions:**
```json
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
```

#### 3.3 Configurar AWS Secrets Manager

```bash
# Armazenar secrets da aplicação
aws secretsmanager create-secret \
  --name petrobras/file-transfer/prod \
  --secret-string file://secrets.json

# Secrets a serem armazenados:
# - Database connection strings
# - API keys de serviços externos
# - JWT secret key
# - Email SMTP credentials
```

#### 3.4 Configurar AWS WAF

```bash
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
```

---

### **FASE 4: Backend Lambda Functions (Semana 2-3)**

#### 4.1 Estrutura do Backend Python

```
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
```

#### 4.2 Criar Lambda Functions

**Exemplo: Upload Function**
```bash
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
```

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

```bash
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
```

**Dependências (requirements.txt):**
```txt
boto3==1.28.0
fastapi==0.104.0
pydantic==2.4.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
mangum==0.17.0
```

---

### **FASE 5: API Gateway (Semana 3)**

#### 5.1 Criar REST API

```bash
aws apigateway create-rest-api \
  --name petrobras-file-transfer-api \
  --description "API para sistema de transferência de arquivos Petrobras" \
  --endpoint-configuration types=REGIONAL
```

#### 5.2 Definir Recursos e Métodos

**Estrutura da API:**
```
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
```

#### 5.3 Configurar Authorizer

```bash
# Criar Cognito Authorizer
aws apigateway create-authorizer \
  --rest-api-id [api-id] \
  --name CognitoAuthorizer \
  --type COGNITO_USER_POOLS \
  --provider-arns arn:aws:cognito-idp:us-east-1:ACCOUNT_ID:userpool/[pool-id] \
  --identity-source method.request.header.Authorization
```

#### 5.4 Deploy API

```bash
# Criar deployment
aws apigateway create-deployment \
  --rest-api-id [api-id] \
  --stage-name prod \
  --description "Produção"

# URL da API:
# https://[api-id].execute-api.us-east-1.amazonaws.com/prod
```

---

### **FASE 6: Messaging e Notificações (Semana 3)**

#### 6.1 Criar SQS Queues

**Fila de Processamento de Upload:**
```bash
aws sqs create-queue \
  --queue-name petrobras-file-upload-queue \
  --attributes file://sqs-attributes.json
```

**Fila de Notificações:**
```bash
aws sqs create-queue \
  --queue-name petrobras-notifications-queue \
  --attributes VisibilityTimeout=300,MessageRetentionPeriod=1209600
```

**Fila Dead Letter (DLQ):**
```bash
aws sqs create-queue \
  --queue-name petrobras-dlq \
  --attributes MaximumMessageSize=262144,MessageRetentionPeriod=1209600
```

#### 6.2 Criar SNS Topics

**Tópico de Notificações:**
```bash
aws sns create-topic \
  --name petrobras-file-notifications

# Adicionar subscriptions
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:petrobras-file-notifications \
  --protocol email \
  --notification-endpoint supervisor@petrobras.com.br
```

#### 6.3 Configurar SES (Email)

```bash
# Verificar domínio
aws ses verify-domain-identity --domain petrobras.com.br

# Verificar emails individuais (sandbox)
aws ses verify-email-identity --email-address noreply@petrobras.com.br

# Criar template de email
aws ses create-template \
  --cli-input-json file://email-template.json
```

---

### **FASE 7: Agendamento e Automação (Semana 4)**

#### 7.1 Configurar EventBridge Rules

**Verificar Arquivos Expirados (Diariamente às 2h):**
```bash
aws events put-rule \
  --name petrobras-check-expiration \
  --schedule-expression "cron(0 2 * * ? *)" \
  --description "Verificar arquivos expirados diariamente"

aws events put-targets \
  --rule petrobras-check-expiration \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:ACCOUNT_ID:function:petrobras-check-expiration"
```

**Limpar Arquivos Antigos (Semanalmente aos domingos às 3h):**
```bash
aws events put-rule \
  --name petrobras-cleanup-old-files \
  --schedule-expression "cron(0 3 ? * SUN *)" \
  --description "Limpar arquivos antigos semanalmente"
```

**Gerar Relatório Semanal (Sextas às 18h):**
```bash
aws events put-rule \
  --name petrobras-weekly-report \
  --schedule-expression "cron(0 18 ? * FRI *)" \
  --description "Gerar relatório semanal"
```

---

### **FASE 8: Frontend Deploy (Semana 4)**

#### 8.1 Build do Next.js

```bash
# Build estático
npm run build
npm run export  # ou next export

# Fazer upload para S3
aws s3 sync out/ s3://petrobras-file-transfer-frontend --delete

# Invalidar cache do CloudFront
aws cloudfront create-invalidation \
  --distribution-id [distribution-id] \
  --paths "/*"
```

#### 8.2 Configurar CloudFront

```bash
aws cloudfront create-distribution \
  --origin-domain-name petrobras-file-transfer-frontend.s3.amazonaws.com \
  --default-root-object index.html \
  --distribution-config file://cloudfront-config.json
```

**Configurações CloudFront:**
- ✅ HTTPS obrigatório
- ✅ Certificado SSL custom (via ACM)
- ✅ Geo-restriction (apenas Brasil)
- ✅ WAF associado
- ✅ Custom error pages (404 → /404.html)
- ✅ Cache behaviors para /api/* (sem cache)
- ✅ Compress objects automatically

#### 8.3 Configurar Route 53

```bash
# Criar hosted zone
aws route53 create-hosted-zone \
  --name files.petrobras.com.br \
  --caller-reference $(date +%s)

# Criar record set apontando para CloudFront
aws route53 change-resource-record-sets \
  --hosted-zone-id [zone-id] \
  --change-batch file://route53-changes.json
```

---

### **FASE 9: Monitoring e Logging (Semana 4)**

#### 9.1 Configurar CloudWatch Logs

**Log Groups para cada Lambda:**
```bash
# Criar log groups
for func in upload download approve reject notify; do
  aws logs create-log-group \
    --log-group-name /aws/lambda/petrobras-file-$func
done

# Configurar retenção (30 dias)
aws logs put-retention-policy \
  --log-group-name /aws/lambda/petrobras-file-upload \
  --retention-in-days 30
```

**Log Insights Queries:**
```
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
```

#### 9.2 Configurar CloudWatch Alarms

**Alarm: Lambda Errors**
```bash
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
```

**Alarm: API Gateway 5xx Errors**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name petrobras-api-5xx-errors \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 60 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

**Alarm: DynamoDB Throttling**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name petrobras-dynamodb-throttle \
  --metric-name UserErrors \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

#### 9.3 Configurar X-Ray

```bash
# Habilitar tracing em Lambda
aws lambda update-function-configuration \
  --function-name petrobras-file-upload \
  --tracing-config Mode=Active

# Habilitar tracing em API Gateway
aws apigateway update-stage \
  --rest-api-id [api-id] \
  --stage-name prod \
  --patch-operations op=replace,path=/tracingEnabled,value=true
```

#### 9.4 Dashboard Customizado

```bash
aws cloudwatch put-dashboard \
  --dashboard-name petrobras-file-transfer \
  --dashboard-body file://dashboard-config.json
```

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

### **FASE 10: Backup e Disaster Recovery (Semana 5)**

#### 10.1 AWS Backup

```bash
# Criar Backup Vault
aws backup create-backup-vault \
  --backup-vault-name petrobras-backup-vault

# Criar Backup Plan
aws backup create-backup-plan \
  --backup-plan file://backup-plan.json
```

**Backup Plan:**
```json
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
```

**Recursos para Backup:**
- ✅ Todas as tabelas DynamoDB
- ✅ S3 bucket de uploads (versionamento)
- ✅ Configurações do Cognito User Pool

#### 10.2 Replicação S3

```bash
# Habilitar replicação cross-region
aws s3api put-bucket-replication \
  --bucket petrobras-file-transfer-uploads \
  --replication-configuration file://replication-config.json
```

#### 10.3 Point-in-Time Recovery (DynamoDB)

```bash
# Habilitar PITR
aws dynamodb update-continuous-backups \
  --table-name petrobras-files \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

---

## 🔐 Segurança e Permissões

### Checklist de Segurança

#### Nível de Infraestrutura
- [ ] MFA ativado em todas as contas privilegiadas
- [ ] Políticas de senha forte implementadas
- [ ] Rotação de chaves de acesso a cada 90 dias
- [ ] CloudTrail habilitado em todas as regiões
- [ ] VPC Flow Logs habilitado
- [ ] Security Groups com least privilege
- [ ] NACLs configuradas
- [ ] AWS Config Rules ativas

#### Nível de Aplicação
- [ ] Criptografia em trânsito (TLS 1.2+)
- [ ] Criptografia em repouso (S3, DynamoDB)
- [ ] Validação de input em todas as APIs
- [ ] Rate limiting implementado
- [ ] CORS configurado corretamente
- [ ] Headers de segurança (HSTS, CSP, X-Frame-Options)
- [ ] Tokens JWT com expiração curta (15 min)
- [ ] Refresh tokens com rotação

#### Nível de Dados
- [ ] Backup automatizado diário
- [ ] Versionamento habilitado no S3
- [ ] Retenção de logs adequada
- [ ] Dados sensíveis criptografados
- [ ] PII (Personally Identifiable Information) mascarado em logs
- [ ] GDPR/LGPD compliance

### IAM Policies Recomendadas

**Policy: S3 Upload com Limite de Tamanho**
```json
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
```

**Policy: DynamoDB com Condition**
```json
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
```

---

## 💰 Custos Estimados

### Estimativa Mensal (Região us-east-1)

#### Cenário: 100 usuários ativos, 500 uploads/dia

| Serviço | Uso | Custo Mensal (USD) |
|---------|-----|-------------------|
| **Compute** | | |
| Lambda (15M requests/mês) | 1GB RAM, 500ms avg | $20.00 |
| API Gateway (15M requests) | REST API | $52.50 |
| **Storage** | | |
| S3 Standard (500 GB) | Uploads | $11.50 |
| S3 Static Website (10 GB) | Frontend | $0.23 |
| DynamoDB (On-Demand) | 5M reads, 2M writes | $15.00 |
| **Networking** | | |
| CloudFront (100 GB) | CDN transfer | $8.50 |
| Data Transfer Out (50 GB) | Downloads | $4.50 |
| **Security** | | |
| Cognito (100 MAU) | Primeiros 50k grátis | $0.00 |
| WAF (5M requests) | Web ACL + Rules | $10.00 |
| Certificate Manager | SSL/TLS | $0.00 |
| **Messaging** | | |
| SQS (2M requests) | Queues | $0.80 |
| SNS (100k notifications) | Push/Email | $0.50 |
| SES (10k emails) | Primeiros 62k grátis | $0.00 |
| **Monitoring** | | |
| CloudWatch Logs (10 GB) | Ingest + Storage | $5.00 |
| CloudWatch Alarms (10) | Métricas | $1.00 |
| X-Ray (1M traces) | Primeiro 1M grátis | $0.00 |
| **Backup** | | |
| AWS Backup (500 GB) | Backup diário | $25.00 |
| **Outros** | | |
| Route 53 (1 hosted zone) | DNS | $0.50 |
| Secrets Manager (5 secrets) | Rotação automática | $2.00 |
| Systems Manager | Parâmetros grátis | $0.00 |
| **TOTAL** | | **~$157/mês** |

### Otimizações de Custo

#### Curto Prazo
- ✅ Usar Lambda com Graviton2 (ARM) - 20% mais barato
- ✅ Reserved Capacity no DynamoDB - economizar 50%
- ✅ S3 Intelligent-Tiering para uploads antigos
- ✅ CloudFront com preço regional (Class 100)

#### Médio Prazo
- ✅ Compute Savings Plans (Lambda + API Gateway) - 17% desconto
- ✅ S3 Lifecycle policies agressivas
- ✅ Comprimir responses da API (Gzip/Brotli)
- ✅ Cache agressivo no CloudFront

#### Longo Prazo
- ✅ Migrar para Serverless v2 (quando disponível)
- ✅ Avaliar migração para DynamoDB Provisioned
- ✅ Considerar Aurora Serverless v2 se precisar SQL

### Custos Estimados por Cenário

| Cenário | Usuários | Uploads/dia | Custo/mês |
|---------|----------|-------------|-----------|
| **Desenvolvimento** | 10 | 50 | $30 |
| **Homologação** | 30 | 150 | $75 |
| **Produção Small** | 100 | 500 | $157 |
| **Produção Medium** | 500 | 2500 | $450 |
| **Produção Large** | 1000 | 5000 | $890 |
| **Enterprise** | 5000 | 25000 | $3,200 |

---

## ✅ Checklist de Implementação

### Pré-Deploy

#### Ambiente de Desenvolvimento
- [ ] Conta AWS criada e configurada
- [ ] AWS CLI instalado e configurado
- [ ] Terraform/CloudFormation preparado
- [ ] Repositório Git configurado
- [ ] CI/CD pipeline configurado (GitHub Actions/GitLab CI)
- [ ] Ambiente de staging criado

#### Domínio e DNS
- [ ] Domínio registrado ou transferido
- [ ] Hosted Zone criada no Route 53
- [ ] NS records atualizados no registrar
- [ ] Certificado SSL solicitado no ACM
- [ ] Validação do certificado concluída

### Deploy Fase 1: Infraestrutura Base

- [ ] VPC criada com subnets públicas e privadas
- [ ] Internet Gateway e NAT Gateway configurados
- [ ] Security Groups criados
- [ ] S3 buckets criados (frontend, uploads, logs)
- [ ] Tabelas DynamoDB criadas
- [ ] IAM roles e policies criadas

### Deploy Fase 2: Segurança

- [ ] Cognito User Pool criado
- [ ] Cognito App Client configurado
- [ ] Cognito Identity Pool criado
- [ ] IAM roles para usuários criadas
- [ ] AWS WAF configurado
- [ ] Secrets Manager com secrets da aplicação
- [ ] CloudTrail habilitado

### Deploy Fase 3: Backend

- [ ] Lambda functions criadas (todas as 17)
- [ ] Lambda layers criadas
- [ ] Variáveis de ambiente configuradas
- [ ] Permissões IAM vinculadas
- [ ] Dead Letter Queues configuradas
- [ ] Timeouts e memory configurados

### Deploy Fase 4: API

- [ ] API Gateway criado
- [ ] Recursos e métodos configurados
- [ ] Authorizer do Cognito vinculado
- [ ] Request/Response models definidos
- [ ] CORS configurado
- [ ] API deployada no stage prod
- [ ] Custom domain configurado

### Deploy Fase 5: Mensagens

- [ ] SQS queues criadas
- [ ] SNS topics criados
- [ ] SES configurado e verificado
- [ ] Email templates criados
- [ ] Lambda triggers configurados

### Deploy Fase 6: Agendamento

- [ ] EventBridge rules criadas
- [ ] Targets configurados
- [ ] Permissões de invocação configuradas
- [ ] Schedule expressions testadas

### Deploy Fase 7: Frontend

- [ ] Build do Next.js gerado
- [ ] Upload para S3 concluído
- [ ] CloudFront distribution criada
- [ ] Custom domain vinculado
- [ ] SSL/TLS configurado
- [ ] Cache behaviors configurados
- [ ] Error pages configuradas

### Deploy Fase 8: Monitoring

- [ ] CloudWatch Logs configurado
- [ ] CloudWatch Alarms criados
- [ ] X-Ray habilitado
- [ ] Dashboard customizado criado
- [ ] SNS topic para alertas criado
- [ ] Assinaturas de email configuradas

### Deploy Fase 9: Backup

- [ ] AWS Backup vault criado
- [ ] Backup plan configurado
- [ ] Recursos adicionados ao plano
- [ ] Point-in-Time Recovery habilitado no DynamoDB
- [ ] S3 versioning habilitado
- [ ] Cross-region replication configurada

### Pós-Deploy

- [ ] Smoke tests executados
- [ ] Testes end-to-end concluídos
- [ ] Testes de carga realizados
- [ ] Documentação atualizada
- [ ] Credenciais de acesso distribuídas
- [ ] Treinamento da equipe realizado
- [ ] Monitoramento ativo 24/7
- [ ] Runbook de incidentes criado

---

## 📊 Monitoramento e Logs

### Dashboards Recomendados

#### Dashboard 1: Visão Geral do Sistema
- Total de uploads (24h, 7d, 30d)
- Total de downloads (24h, 7d, 30d)
- Arquivos aguardando aprovação
- Taxa de aprovação vs rejeição
- Usuários ativos (MAU, DAU)
- Storage utilizado (GB)
- Custo acumulado do mês

#### Dashboard 2: Performance
- Latência média da API (p50, p95, p99)
- Tempo de resposta das Lambdas
- CloudFront cache hit rate
- DynamoDB read/write capacity
- Taxa de throttling
- Erros 4xx e 5xx

#### Dashboard 3: Segurança
- Tentativas de login falhas
- Tokens expirados
- Requests bloqueados pelo WAF
- Acessos de IPs suspeitos
- Alterações de permissões (CloudTrail)
- Arquivos marcados como suspeitos

### Alertas Críticos

#### Prioridade P1 (Resposta Imediata)
- API Gateway com > 10% de erros 5xx
- Lambda com > 20% de erros
- DynamoDB throttling > 5%
- CloudFront 100% de cache miss
- Custos 200% acima do esperado

#### Prioridade P2 (Resposta em 1h)
- Latência da API > 3s (p95)
- Storage S3 > 90% do limite
- Fila SQS com backlog > 1000 mensagens
- Mais de 100 arquivos pendentes há > 7 dias

#### Prioridade P3 (Resposta em 24h)
- Taxa de aprovação < 50%
- CloudWatch logs com warnings frequentes
- Certificado SSL expira em < 30 dias
- Backup falhou nas últimas 24h

### Logs Importantes

#### Formato de Log Estruturado (JSON)
```json
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
```

#### Queries Úteis do CloudWatch Insights

**Top 10 usuários mais ativos:**
```
fields userId, count(*) as actions
| stats count() by userId
| sort actions desc
| limit 10
```

**Arquivos grandes (>100MB):**
```
fields fileName, fileSize, userId, timestamp
| filter fileSize > 104857600
| sort timestamp desc
```

**Erros nos últimos 7 dias:**
```
fields @timestamp, level, service, message
| filter level = "ERROR"
| filter @timestamp > ago(7d)
| sort @timestamp desc
```

**Latência por endpoint:**
```
fields endpoint, avg(duration) as avgLatency, max(duration) as maxLatency
| stats avg(duration), max(duration) by endpoint
| sort avgLatency desc
```

---

## 🔄 Backup e Disaster Recovery

### RPO (Recovery Point Objective): 1 hora
### RTO (Recovery Time Objective): 4 horas

### Estratégia de Backup

#### Backup Diário (Retenção: 35 dias)
- ✅ Todas as tabelas DynamoDB (5h UTC)
- ✅ Configurações do Cognito
- ✅ Políticas IAM e Security Groups
- ✅ Configurações do API Gateway

#### Backup Contínuo
- ✅ S3 versioning (retenção: 90 dias)
- ✅ DynamoDB Point-in-Time Recovery (35 dias)
- ✅ CloudTrail logs (12 meses)
- ✅ CloudWatch Logs (30 dias)

#### Backup Semanal (Retenção: 12 meses)
- ✅ Snapshot completo do sistema
- ✅ Export de todos os dados DynamoDB para S3
- ✅ Backup de código Lambda
- ✅ Configurações completas (Infrastructure as Code)

### Plano de Disaster Recovery

#### Cenário 1: Falha de Região AWS
1. Detectar falha via Route 53 Health Checks
2. Ativar failover automático para região secundária
3. CloudFront automaticamente roteia tráfego
4. DynamoDB Global Tables sincronizam dados
5. Lambda@Edge serve conteúdo da região ativa
6. **Tempo estimado: 5-15 minutos**

#### Cenário 2: Corrupção de Dados
1. Identificar timestamp da corrupção
2. Pausar writes na tabela afetada
3. Restaurar do Point-in-Time Recovery
4. Validar integridade dos dados
5. Reprocessar transações perdidas
6. **Tempo estimado: 1-2 horas**

#### Cenário 3: Perda de Bucket S3
1. Ativar replicação cross-region (se não ativa)
2. Restaurar do AWS Backup Vault
3. Validar integridade dos arquivos
4. Reconstruir índices de metadados no DynamoDB
5. **Tempo estimado: 2-4 horas**

#### Cenário 4: Ataque de Ransomware
1. Isolar recursos afetados via Security Groups
2. Analisar logs do CloudTrail
3. Revogar credenciais comprometidas
4. Restaurar do backup imutável
5. Implementar patches de segurança
6. **Tempo estimado: 4-8 horas**

### Testes de DR (Disaster Recovery)

#### Teste Trimestral (Obrigatório)
- [ ] Restaurar DynamoDB de backup
- [ ] Validar integridade dos dados
- [ ] Testar failover de região
- [ ] Verificar RPO/RTO reais
- [ ] Documentar lições aprendidas
- [ ] Atualizar runbooks

---

## 🐛 Troubleshooting

### Problemas Comuns e Soluções

#### Problema 1: Lambda Timeout
**Sintoma:** Requests falhando com erro 502 Bad Gateway

**Diagnóstico:**
```bash
aws logs tail /aws/lambda/petrobras-file-upload --follow
```

**Soluções:**
1. Aumentar timeout da Lambda (máx 15 min)
2. Otimizar código Python (profiling)
3. Aumentar memory (melhora CPU proporcionalmente)
4. Considerar processamento assíncrono via SQS

#### Problema 2: DynamoDB Throttling
**Sintoma:** Erros 400 "ProvisionedThroughputExceededException"

**Diagnóstico:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=petrobras-files \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

**Soluções:**
1. Habilitar Auto Scaling
2. Mudar para On-Demand billing
3. Adicionar caching com ElastiCache
4. Otimizar queries (usar índices secundários)

#### Problema 3: S3 Upload Lento
**Sintoma:** Upload de arquivos grandes > 2min

**Soluções:**
1. Implementar multipart upload
2. Usar S3 Transfer Acceleration
3. Compressão no cliente antes de enviar
4. Gerar presigned URL direto do frontend

```python
# Multipart Upload
s3_client.upload_fileobj(
    file_obj,
    bucket,
    key,
    Config=TransferConfig(
        multipart_threshold=1024 * 25,
        max_concurrency=10,
        multipart_chunksize=1024 * 25,
        use_threads=True
    )
)
```

#### Problema 4: CloudFront Cache Inválido
**Sintoma:** Frontend mostrando versão antiga após deploy

**Solução:**
```bash
# Invalidar cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"

# Verificar status
aws cloudfront get-invalidation \
  --distribution-id E1234567890ABC \
  --id I1234567890ABC
```

#### Problema 5: Cognito Token Expirado
**Sintoma:** Usuário deslogado frequentemente

**Solução:**
```javascript
// Implementar refresh token automático
const refreshSession = async () => {
  const user = await Auth.currentAuthenticatedUser();
  const session = user.getSignInUserSession();
  const refreshToken = session.getRefreshToken();
  
  user.refreshSession(refreshToken, (err, session) => {
    if (err) {
      console.error('Erro ao renovar sessão:', err);
    } else {
      console.log('Sessão renovada com sucesso');
    }
  });
};

// Chamar a cada 14 minutos (tokens expiram em 15min)
setInterval(refreshSession, 14 * 60 * 1000);
```

#### Problema 6: WAF Bloqueando Requests Legítimos
**Sintoma:** Erro 403 Forbidden em requests válidos

**Diagnóstico:**
```bash
# Ver logs do WAF
aws wafv2 get-sampled-requests \
  --web-acl-arn [web-acl-arn] \
  --rule-metric-name [rule-name] \
  --scope REGIONAL \
  --time-window StartTime=1640000000,EndTime=1640086400 \
  --max-items 100
```

**Solução:**
1. Adicionar IP à whitelist
2. Ajustar rate limiting
3. Refinar regex patterns das regras

#### Problema 7: SES Email não Chegando
**Sintoma:** Notificações por email não sendo recebidas

**Diagnóstico:**
```bash
aws ses get-send-statistics
```

**Soluções:**
1. Verificar se está no sandbox (limita para emails verificados)
2. Sair do sandbox (request produção)
3. Configurar SPF/DKIM no DNS
4. Verificar bounce rate (max 5%)

---

## 📚 Recursos Adicionais

### Documentação AWS
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [S3 Performance Guidelines](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html)
- [API Gateway Throttling](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html)

### Ferramentas Úteis
- **AWS CLI** - Interface de linha de comando
- **AWS SAM** - Serverless Application Model
- **Terraform** - Infrastructure as Code
- **Serverless Framework** - Deploy simplificado
- **LocalStack** - Testes locais de serviços AWS
- **AWS Copilot** - Container deployment simplificado

### Treinamento Recomendado
- AWS Certified Solutions Architect - Associate
- AWS Certified Developer - Associate
- AWS Certified Security - Specialty
- Serverless on AWS (Coursera)

### Comunidade
- [r/aws](https://reddit.com/r/aws) - Reddit AWS
- [AWS re:Post](https://repost.aws) - Q&A oficial
- [Serverless Stack](https://serverless-stack.com) - Tutoriais
- [AWS Samples GitHub](https://github.com/aws-samples)

---

## 🎯 Próximos Passos

### Após Deploy Inicial

1. **Semana 1-2: Monitoramento Intensivo**
   - Acompanhar métricas diariamente
   - Ajustar alarmes conforme comportamento real
   - Identificar gargalos de performance
   - Otimizar custos iniciais

2. **Semana 3-4: Otimizações**
   - Implementar cache onde apropriado
   - Ajustar tamanhos de Lambda (memory/timeout)
   - Otimizar queries DynamoDB
   - Refinar regras WAF

3. **Mês 2: Melhorias**
   - Adicionar mais métricas customizadas
   - Implementar feature flags
   - Configurar blue/green deployments
   - Automatizar rollback em caso de erro

4. **Mês 3+: Evolução**
   - Considerar multi-região active-active
   - Implementar machine learning para detecção de anomalias
   - Adicionar CDN edge computing
   - Explorar Savings Plans para reduzir custos

---

## 📞 Suporte

### Contatos de Emergência
- **AWS Support:** [Console AWS Support](https://console.aws.amazon.com/support)
- **Telefone AWS:** +55 11 2500-2000 (Brasil)
- **Email da Equipe:** devops@petrobras.com.br
- **Plantão 24/7:** +55 21 9xxxx-xxxx

### SLA AWS
- **Compute (Lambda):** 99.95%
- **API Gateway:** 99.95%
- **DynamoDB:** 99.99% (Global Tables: 99.999%)
- **S3:** 99.99%
- **CloudFront:** 99.9%

---

## ✅ Conclusão

Este guia fornece um roteiro completo para implementar o sistema de transferência de arquivos Petrobras na AWS. Siga as fases em ordem, use os checklists, e não hesite em ajustar conforme necessidades específicas da sua organização.

**Tempo estimado total de implementação:** 4-5 semanas com 1 pessoa dedicada full-time.

**Boa sorte com o deploy! 🚀**

---

*Última atualização: Janeiro 2025*
*Versão: 1.0*
*Autor: v0 AI Assistant*
