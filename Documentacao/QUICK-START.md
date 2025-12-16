# 🚀 Quick Start - Deploy Rápido na AWS

Este guia simplificado permite fazer o deploy básico do sistema em **1 dia** usando CloudFormation.

## Pré-requisitos

- [ ] Conta AWS criada
- [ ] AWS CLI instalado
- [ ] Domínio registrado (opcional)
- [ ] 4-6 horas disponíveis

## Passo 1: Configurar AWS CLI (10 min)

```bash
# Instalar AWS CLI
pip install awscli

# Configurar credenciais
aws configure
# AWS Access Key ID: [sua-key]
# AWS Secret Access Key: [seu-secret]
# Default region: us-east-1
# Output format: json
```

## Passo 2: Deploy com CloudFormation (30 min)

```bash
# Clone o repositório
cd sql/

# Deploy da stack completa
aws cloudformation create-stack \
  --stack-name petrobras-file-transfer \
  --template-body file://cloudformation-template.yaml \
  --capabilities CAPABILITY_IAM \
  --parameters \
    ParameterKey=ProjectName,ParameterValue=petrobras-file-transfer \
    ParameterKey=Environment,ParameterValue=prod

# Aguardar conclusão (20-30 min)
aws cloudformation wait stack-create-complete \
  --stack-name petrobras-file-transfer

# Obter outputs
aws cloudformation describe-stacks \
  --stack-name petrobras-file-transfer \
  --query 'Stacks[0].Outputs'
```

## Passo 3: Deploy do Backend (1 hora)

```bash
# Criar Lambda functions
cd ../backend/

# Instalar dependências
pip install -r requirements.txt -t python/
zip -r lambda-layer.zip python/

# Criar layer
aws lambda publish-layer-version \
  --layer-name petrobras-dependencies \
  --zip-file fileb://lambda-layer.zip \
  --compatible-runtimes python3.11

# Deploy de todas as functions
for func in functions/*/*.py; do
  funcname=$(basename $func .py)
  cd $(dirname $func)
  zip ${funcname}.zip ${funcname}.py
  
  aws lambda create-function \
    --function-name petrobras-${funcname} \
    --runtime python3.11 \
    --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
    --handler ${funcname}.lambda_handler \
    --zip-file fileb://${funcname}.zip \
    --timeout 300 \
    --memory-size 512
    
  cd -
done
```

## Passo 4: Deploy do Frontend (30 min)

```bash
# Build do Next.js
cd ../../
npm install
npm run build

# Upload para S3
aws s3 sync out/ s3://petrobras-file-transfer-frontend --delete

# Obter URL do CloudFront
aws cloudformation describe-stacks \
  --stack-name petrobras-file-transfer \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' \
  --output text
```

## Passo 5: Configurar Cognito (20 min)

```bash
# Criar usuário admin de teste
aws cognito-idp admin-create-user \
  --user-pool-id [USER_POOL_ID] \
  --username admin@petrobras.com.br \
  --user-attributes Name=email,Value=admin@petrobras.com.br \
  --temporary-password TempPass123! \
  --message-action SUPPRESS

# Confirmar usuário
aws cognito-idp admin-set-user-password \
  --user-pool-id [USER_POOL_ID] \
  --username admin@petrobras.com.br \
  --password AdminPass123! \
  --permanent
```

## Passo 6: Testar o Sistema (30 min)

1. Acessar URL do CloudFront
2. Fazer login com credenciais criadas
3. Testar upload de arquivo
4. Verificar notificações
5. Testar download

## Configurações Adicionais (Opcional)

### Domínio Customizado
```bash
# Solicitar certificado SSL
aws acm request-certificate \
  --domain-name files.petrobras.com.br \
  --validation-method DNS

# Configurar Route 53 (após validação)
aws route53 change-resource-record-sets \
  --hosted-zone-id [ZONE_ID] \
  --change-batch file://route53-changes.json
```

### Monitoramento Básico
```bash
# Criar dashboard CloudWatch
aws cloudwatch put-dashboard \
  --dashboard-name petrobras-monitoring \
  --dashboard-body file://dashboard-basic.json
```

## Verificação Final

- [ ] Sistema acessível via CloudFront URL
- [ ] Login funcionando
- [ ] Upload de arquivo bem-sucedido
- [ ] Download funcionando
- [ ] Notificações sendo geradas
- [ ] Logs aparecendo no CloudWatch

## Custo Estimado

**Primeiros 12 meses:** ~$50/mês (Free Tier)
**Após Free Tier:** ~$150/mês (100 usuários)

## Próximos Passos

1. Configurar domínio customizado
2. Adicionar mais usuários
3. Configurar backups automáticos
4. Implementar alertas
5. Revisar [AWS-IMPLEMENTATION-GUIDE.md](./AWS-IMPLEMENTATION-GUIDE.md) para otimizações

## Suporte

Dúvidas? Consulte o guia completo: [AWS-IMPLEMENTATION-GUIDE.md](./AWS-IMPLEMENTATION-GUIDE.md)
