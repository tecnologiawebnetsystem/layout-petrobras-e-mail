# AWS Infrastructure - Petrobras File Transfer

Scripts de configuracao e instalacao de todos os servicos AWS necessarios para o sistema de transferencia segura de arquivos.

## Estrutura de Pastas

```
AWS/
├── README.md                    # Este arquivo
├── cloudwatch/                  # Monitoramento e logs
│   ├── setup_cloudwatch.py
│   └── README.md
├── cognito/                     # Autenticacao (alternativa ao Entra ID)
│   ├── setup_cognito.py
│   └── README.md
├── dynamodb/                    # Banco de dados NoSQL
│   ├── create_tables.py
│   ├── cloudformation-dynamodb.yaml
│   ├── seed_data.py
│   └── README.md
├── iam/                         # Gerenciamento de identidade e acesso
│   ├── setup_iam.py
│   └── README.md
├── kms/                         # Gerenciamento de chaves de criptografia
│   ├── setup_kms.py
│   └── README.md
├── s3/                          # Armazenamento de arquivos
│   ├── create_bucket.py
│   └── README.md
├── secrets-manager/             # Gerenciamento de credenciais
│   ├── setup_secrets.py
│   └── README.md
└── ses/                         # Envio de emails
    ├── setup_ses.py
    └── README.md
```

## Ordem de Instalacao

Execute os scripts na seguinte ordem para configurar a infraestrutura completa:

### 1. IAM (Identidade e Acesso)
```bash
cd iam
python setup_iam.py create-policies --env prod
python setup_iam.py create-roles --env prod
```

### 2. KMS (Criptografia)
```bash
cd kms
python setup_kms.py create-key --env prod
```

### 3. Secrets Manager (Credenciais)
```bash
cd secrets-manager
python setup_secrets.py create --env prod
# Atualize os secrets com valores reais!
```

### 4. S3 (Armazenamento)
```bash
cd s3
python setup_s3.py create --env prod
```

### 5. DynamoDB (Banco de Dados)
```bash
cd dynamodb
python create_tables.py create --env prod
# Opcional: popular com dados de teste
python seed_data.py --env dev
```

### 6. SES (Email)
```bash
cd ses
python setup_ses.py verify-domain --domain petrobras.com.br
python setup_ses.py create-template --name all
python setup_ses.py request-production  # Ver instrucoes
```

### 7. CloudWatch (Monitoramento)
```bash
cd cloudwatch
python setup_cloudwatch.py create-all --env prod
```

### 8. Cognito (Opcional - se nao usar Entra ID)
```bash
cd cognito
python setup_cognito.py create-all --env prod
```

## Pre-requisitos

### Instalacao
```bash
pip install boto3 pyyaml
```

### Credenciais AWS
```bash
# Opcao 1: AWS CLI
aws configure

# Opcao 2: Variaveis de ambiente
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=sa-east-1
```

### Permissoes Necessarias

O usuario/role que executa os scripts precisa das seguintes permissoes:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:*",
        "s3:*",
        "dynamodb:*",
        "ses:*",
        "kms:*",
        "secretsmanager:*",
        "logs:*",
        "cloudwatch:*",
        "cognito-idp:*"
      ],
      "Resource": "*"
    }
  ]
}
```

**Nota**: Em producao, restrinja as permissoes ao minimo necessario.

## Ambientes

| Ambiente | Uso | Regiao |
|----------|-----|--------|
| `dev` | Desenvolvimento local | sa-east-1 |
| `staging` | Testes e homologacao | sa-east-1 |
| `prod` | Producao | sa-east-1 |

## Variaveis de Ambiente da Aplicacao

Apos executar todos os scripts, configure estas variaveis no `.env`:

```env
# AWS Geral
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# S3
STORAGE_PROVIDER=aws
AWS_S3_BUCKET=petrobras-file-transfer-prod

# DynamoDB
DATABASE_URL=dynamodb://sa-east-1

# SES
EMAIL_PROVIDER=ses
MAIL_FROM=no-reply@petrobras.com.br

# KMS
KMS_KEY_ALIAS=alias/petrobras-file-transfer-prod

# Cognito (se usado)
AUTH_MODE=cognito
COGNITO_USER_POOL_ID=sa-east-1_xxxxx
COGNITO_CLIENT_ID=xxxxx
COGNITO_CLIENT_SECRET=xxxxx

# Ou Entra ID
AUTH_MODE=entra
ENTRA_TENANT_ID=xxxxx
ENTRA_CLIENT_ID=xxxxx
ENTRA_CLIENT_SECRET=xxxxx
```

## Estimativa de Custos

### Ambiente de Desenvolvimento (uso minimo)
| Servico | Custo Mensal |
|---------|--------------|
| DynamoDB | ~$1 (sob demanda) |
| S3 | ~$1 |
| SES | ~$0.50 |
| Secrets Manager | ~$2.40 |
| CloudWatch | ~$5 |
| KMS | ~$1 |
| **Total** | **~$11/mes** |

### Ambiente de Producao (1000 usuarios, 10GB storage)
| Servico | Custo Mensal |
|---------|--------------|
| DynamoDB | ~$25 |
| S3 | ~$5 |
| SES | ~$5 |
| Secrets Manager | ~$3 |
| CloudWatch | ~$15 |
| KMS | ~$2 |
| Cognito | ~$5.50 |
| **Total** | **~$60/mes** |

## Scripts Uteis

### Listar todos os recursos
```bash
for dir in */; do
  echo "=== $dir ==="
  cd "$dir"
  python setup_*.py list 2>/dev/null || python create_*.py list 2>/dev/null
  cd ..
done
```

### Deletar ambiente de dev
```bash
for dir in cloudwatch cognito dynamodb s3 secrets-manager; do
  cd "$dir"
  python setup_*.py delete --env dev 2>/dev/null || python create_*.py delete --env dev 2>/dev/null
  cd ..
done
```

### Exportar configuracao para .env
```bash
cd secrets-manager
python setup_secrets.py export --env prod > ../.env.prod
```

## Seguranca

### Checklist de Seguranca

- [ ] IAM policies com principio de menor privilegio
- [ ] KMS keys com rotacao automatica
- [ ] S3 buckets com acesso publico bloqueado
- [ ] S3 buckets com criptografia SSE-KMS
- [ ] Secrets Manager para todas as credenciais
- [ ] CloudTrail habilitado para auditoria
- [ ] VPC Endpoints para servicos AWS (opcional)
- [ ] MFA habilitado para usuarios privilegiados

### Auditoria

Todos os acessos sao registrados via:
- **CloudTrail**: Chamadas de API AWS
- **CloudWatch Logs**: Logs da aplicacao
- **S3 Access Logs**: Acessos ao bucket

## Troubleshooting

### Erro de Credenciais
```bash
# Verificar credenciais
aws sts get-caller-identity

# Verificar regiao
aws configure get region
```

### Erro de Permissao
```bash
# Verificar policies anexadas
aws iam list-attached-user-policies --user-name seu-usuario
aws iam list-attached-role-policies --role-name sua-role
```

### Recursos nao encontrados
```bash
# Verificar regiao correta
aws dynamodb list-tables --region sa-east-1
aws s3 ls
```

## Suporte

Para duvidas ou problemas:
1. Verifique o README.md de cada servico
2. Consulte a documentacao AWS oficial
3. Abra um issue no repositorio
