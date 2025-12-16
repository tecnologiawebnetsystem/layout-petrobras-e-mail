# Guia de Deployment na AWS

## Pré-requisitos

1. **AWS CLI** instalado e configurado
2. **Python 3.11+** instalado
3. **Node.js 18+** e npm/yarn instalado
4. **Credenciais AWS** com permissões adequadas
5. **Domínio** configurado (opcional, mas recomendado)

---

## Passo 1: Configurar AWS CLI

```bash
# Instalar AWS CLI
pip install awscli

# Configurar credenciais
aws configure --profile petrobras-prod
# AWS Access Key ID: [Sua Access Key]
# AWS Secret Access Key: [Sua Secret Key]
# Default region name: us-east-1
# Default output format: json
```

---

## Passo 2: Criar Infraestrutura com CloudFormation

```bash
cd sql

# Deploy da infraestrutura
aws cloudformation create-stack \
  --stack-name petrobras-file-transfer-prod \
  --template-body file://cloudformation-template.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=ProjectName,ParameterValue=petrobras-file-transfer \
  --capabilities CAPABILITY_NAMED_IAM \
  --profile petrobras-prod

# Aguardar conclusão (pode levar 5-10 minutos)
aws cloudformation wait stack-create-complete \
  --stack-name petrobras-file-transfer-prod \
  --profile petrobras-prod

# Verificar outputs
aws cloudformation describe-stacks \
  --stack-name petrobras-file-transfer-prod \
  --query 'Stacks[0].Outputs' \
  --profile petrobras-prod
```

---

## Passo 3: Criar Tabelas DynamoDB

```bash
# Instalar dependências Python
pip install boto3

# Criar tabelas
python create-tables.py --profile petrobras-prod --region us-east-1

# Verificar tabelas criadas
aws dynamodb list-tables --profile petrobras-prod
```

---

## Passo 4: Configurar S3 Bucket

```bash
# Obter nome do bucket do CloudFormation output
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name petrobras-file-transfer-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`FileStorageBucketName`].OutputValue' \
  --output text \
  --profile petrobras-prod)

echo "Bucket criado: $BUCKET_NAME"

# Habilitar versionamento (já feito pelo CloudFormation)
# Configurar lifecycle policies (já feito pelo CloudFormation)
```

---

## Passo 5: Deploy do Backend Python (FastAPI)

### Estrutura recomendada do backend:

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Configurações
│   ├── dependencies.py      # Dependencies DI
│   ├── routers/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── files.py
│   │   ├── supervisor.py
│   │   ├── download.py
│   │   ├── notifications.py
│   │   └── audit.py
│   ├── models/
│   │   ├── user.py
│   │   ├── file.py
│   │   ├── notification.py
│   │   └── audit_log.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── file_service.py
│   │   ├── email_service.py
│   │   └── storage_service.py
│   └── utils/
│       ├── dynamodb.py
│       ├── s3.py
│       └── security.py
├── requirements.txt
├── Dockerfile
└── serverless.yml  # ou sam-template.yaml
```

### Deploy com AWS Lambda + API Gateway:

```bash
# Instalar Serverless Framework
npm install -g serverless

# Deploy
cd backend
serverless deploy --stage production --aws-profile petrobras-prod

# Ou com AWS SAM
sam build
sam deploy --guided --profile petrobras-prod
```

---

## Passo 6: Deploy do Frontend (Next.js)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer deploy
cd frontend
vercel --prod

# Ou build para hospedagem própria
npm run build
npm run start
```

### Configurar variáveis de ambiente no Vercel:

```
NEXT_PUBLIC_API_URL=https://api.petrobras-transfer.com.br/v1
```

---

## Passo 7: Configurar SES para Emails

```bash
# Verificar domínio no SES
aws ses verify-domain-identity \
  --domain petrobras-transfer.com.br \
  --profile petrobras-prod

# Verificar email individual
aws ses verify-email-identity \
  --email-address noreply@petrobras-transfer.com.br \
  --profile petrobras-prod

# Sair do sandbox (produção)
# Necessário abrir ticket no AWS Support
```

---

## Passo 8: Configurar CloudWatch Alarms

```bash
# Criar alarme para erros Lambda
aws cloudwatch put-metric-alarm \
  --alarm-name petrobras-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --profile petrobras-prod
```

---

## Passo 9: Monitoramento e Logs

```bash
# Ver logs do Lambda
aws logs tail /aws/lambda/petrobras-file-transfer-production \
  --follow \
  --profile petrobras-prod

# Ver logs do API Gateway
aws logs tail /aws/apigateway/petrobras-file-transfer-production \
  --follow \
  --profile petrobras-prod
```

---

## Passo 10: Backup e Disaster Recovery

```bash
# Habilitar Point-in-Time Recovery para DynamoDB
aws dynamodb update-continuous-backups \
  --table-name petrobras-users-production \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --profile petrobras-prod

# Configurar backup automático S3
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled \
  --profile petrobras-prod
```

---

## Manutenção

### Atualizar Stack CloudFormation

```bash
aws cloudformation update-stack \
  --stack-name petrobras-file-transfer-prod \
  --template-body file://cloudformation-template.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=production \
  --capabilities CAPABILITY_NAMED_IAM \
  --profile petrobras-prod
```

### Backup Manual DynamoDB

```bash
aws dynamodb create-backup \
  --table-name petrobras-files-production \
  --backup-name manual-backup-$(date +%Y%m%d) \
  --profile petrobras-prod
```

### Limpar Arquivos Antigos S3

```bash
# Já configurado no lifecycle policy
# Arquivos são deletados automaticamente após 30 dias
```

---

## Custos Estimados (AWS)

**Cenário: 1000 usuários, 500 uploads/dia**

- **DynamoDB**: ~$50/mês (Pay per Request)
- **S3**: ~$20/mês (100GB armazenado)
- **Lambda**: ~$30/mês (1M requisições)
- **API Gateway**: ~$35/mês (1M requests)
- **CloudWatch**: ~$10/mês
- **SES**: ~$5/mês (50k emails)

**Total estimado**: ~$150/mês

---

## Troubleshooting

### Lambda retorna 502/504

```bash
# Aumentar timeout da função Lambda
aws lambda update-function-configuration \
  --function-name petrobras-api-handler \
  --timeout 30 \
  --profile petrobras-prod
```

### DynamoDB throttling

```bash
# Verificar métricas
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=petrobras-files-production \
  --start-time 2024-01-20T00:00:00Z \
  --end-time 2024-01-20T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --profile petrobras-prod
```

### S3 upload falha

```bash
# Verificar CORS configuration
aws s3api get-bucket-cors \
  --bucket $BUCKET_NAME \
  --profile petrobras-prod
```

---

## Segurança

1. **Rotacionar credenciais** regularmente
2. **Habilitar MFA** para console AWS
3. **Usar IAM Roles** ao invés de access keys quando possível
4. **Auditar logs** no CloudTrail
5. **Encryption at rest** habilitado (já configurado)
6. **Usar VPC** para Lambda em produção (opcional)
