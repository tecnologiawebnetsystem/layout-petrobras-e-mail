# AWS IAM - Gerenciamento de Identidade e Acesso

Configuracao de Roles, Policies e Users para o sistema de transferencia de arquivos.

## Visao Geral

O IAM e utilizado para:
- Controlar acesso aos recursos AWS (S3, SES, DynamoDB, etc.)
- Fornecer credenciais para a aplicacao
- Implementar principio de menor privilegio

## Pre-requisitos

```bash
pip install boto3
```

Credenciais com permissoes IAM:
```bash
aws configure
```

## Uso

### 1. Criar Todas as Policies

```bash
# Desenvolvimento
python setup_iam.py create-policies --env dev

# Producao
python setup_iam.py create-policies --env prod
```

### 2. Criar Role para Aplicacao

```bash
python setup_iam.py create-roles --env prod
```

### 3. Criar Usuario para API

```bash
python setup_iam.py create-user --name api-backend --env prod
```

### 4. Listar Recursos

```bash
python setup_iam.py list
```

### 5. Deletar Recursos

```bash
python setup_iam.py delete-all --env dev
```

## Policies Criadas

| Policy | Descricao |
|--------|-----------|
| `petrobras-file-transfer-s3-policy-{env}` | Acesso ao bucket S3 |
| `petrobras-file-transfer-ses-policy-{env}` | Envio de emails via SES |
| `petrobras-file-transfer-dynamodb-policy-{env}` | Acesso as tabelas DynamoDB |
| `petrobras-file-transfer-cloudwatch-policy-{env}` | Logs e metricas CloudWatch |
| `petrobras-file-transfer-secrets-policy-{env}` | Acesso ao Secrets Manager |
| `petrobras-file-transfer-kms-policy-{env}` | Uso de chaves KMS |

## Roles Criadas

| Role | Uso |
|------|-----|
| `petrobras-file-transfer-app-role-{env}` | Role para ECS/Lambda/EC2 |

## Permissoes por Servico

### S3
- ListBucket
- GetObject, PutObject, DeleteObject
- GetObjectVersion, DeleteObjectVersion

### SES
- SendEmail, SendRawEmail, SendTemplatedEmail
- GetSendQuota, GetSendStatistics
- GetTemplate, ListTemplates

### DynamoDB
- GetItem, PutItem, UpdateItem, DeleteItem
- Query, Scan
- BatchGetItem, BatchWriteItem
- DescribeTable

### CloudWatch
- CreateLogGroup, CreateLogStream
- PutLogEvents, DescribeLogStreams
- PutMetricData

### Secrets Manager
- GetSecretValue, DescribeSecret

### KMS
- Encrypt, Decrypt
- GenerateDataKey
- DescribeKey

## Variaveis de Ambiente

Apos criar usuario, adicionar ao `.env`:

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=sa-east-1
```

## Boas Praticas

1. **Principio de Menor Privilegio**
   - Cada policy tem apenas as permissoes necessarias
   - Recursos especificados explicitamente (nao usar `*`)

2. **Separacao por Ambiente**
   - Policies separadas para dev/staging/prod
   - Impede acesso cruzado entre ambientes

3. **Rotacao de Credenciais**
   - Rotacionar access keys a cada 90 dias
   - Usar roles sempre que possivel

4. **Auditoria**
   - Habilitar CloudTrail para registrar acoes IAM
   - Revisar permissoes periodicamente

## Diagrama de Acesso

```
┌─────────────────────────────────────────────────────────┐
│                    Aplicacao                             │
│                 (ECS/Lambda/EC2)                        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              IAM Role (app-role)                        │
│   Assume: ecs-tasks, lambda, ec2                        │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬────────────────┐
         ▼               ▼               ▼                ▼
    ┌─────────┐    ┌─────────┐    ┌───────────┐    ┌──────────┐
    │   S3    │    │   SES   │    │ DynamoDB  │    │CloudWatch│
    └─────────┘    └─────────┘    └───────────┘    └──────────┘
```

## Troubleshooting

### Access Denied
```
Verificar:
1. Policy esta anexada a role/user
2. Resource ARN esta correto
3. Regiao correta no ARN
```

### Invalid Policy
```
Verificar:
1. Sintaxe JSON valida
2. ARNs existem
3. Acoes sao validas para o servico
```

### Cannot Assume Role
```
Verificar:
1. Trust policy permite o servico
2. Servico esta na lista de principals
```
