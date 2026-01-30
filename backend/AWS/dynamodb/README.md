# DynamoDB - Petrobras File Transfer

Scripts e templates para criacao e gerenciamento das tabelas DynamoDB do sistema de transferencia de arquivos.

## Estrutura de Tabelas

O sistema utiliza 8 tabelas DynamoDB com o prefixo `pft_`:

| Tabela | Descricao | Partition Key | Sort Key |
|--------|-----------|---------------|----------|
| `pft_users` | Usuarios do sistema | `USER#<id>` | `PROFILE` ou `AREA#<area_id>` |
| `pft_shares` | Compartilhamentos | `SHARE#<id>` | `METADATA` ou `FILE#<file_id>` |
| `pft_files` | Arquivos enviados | `FILE#<id>` | `METADATA` |
| `pft_areas` | Areas/departamentos | `AREA#<id>` | `METADATA` ou `SUPERVISOR#<user_id>` |
| `pft_tokens` | Tokens de acesso | `TOKEN#<hash>` | `METADATA` |
| `pft_audit` | Logs de auditoria | `AUDIT#<yyyy-mm>` | `<timestamp>#<id>` |
| `pft_notifications` | Notificacoes | `USER#<user_id>` | `NOTIFICATION#<timestamp>#<id>` |
| `pft_credentials` | Credenciais locais | `CRED#<email>` | `LOCAL` ou `ENTRA` |

## Pre-requisitos

```bash
# Instalar boto3
pip install boto3

# Configurar credenciais AWS (se usar AWS)
aws configure
```

## Opcao 1: Script Python

### Criar Tabelas

```bash
# DynamoDB Local (desenvolvimento)
python create_tables.py --local

# AWS (producao)
python create_tables.py --region sa-east-1

# Com profile especifico
python create_tables.py --region sa-east-1 --profile petrobras-prod
```

### Listar Tabelas

```bash
python create_tables.py --local --action list
python create_tables.py --region sa-east-1 --action list
```

### Deletar Tabelas

```bash
# Deletar tabela especifica
python create_tables.py --local --action delete --table pft_users

# Deletar todas (requer confirmacao)
python create_tables.py --local --action delete
```

### Popular com Dados de Teste

```bash
# DynamoDB Local
python seed_data.py --local

# AWS com sufixo de ambiente
python seed_data.py --region sa-east-1 --env development
```

## Opcao 2: CloudFormation

### Deploy da Stack

```bash
# Criar stack
aws cloudformation create-stack \
  --stack-name pft-dynamodb \
  --template-body file://cloudformation-dynamodb.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=BillingMode,ParameterValue=PAY_PER_REQUEST \
  --region sa-east-1

# Verificar status
aws cloudformation describe-stacks \
  --stack-name pft-dynamodb \
  --region sa-east-1

# Atualizar stack
aws cloudformation update-stack \
  --stack-name pft-dynamodb \
  --template-body file://cloudformation-dynamodb.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=production \
  --region sa-east-1

# Deletar stack
aws cloudformation delete-stack \
  --stack-name pft-dynamodb \
  --region sa-east-1
```

### Parametros CloudFormation

| Parametro | Default | Descricao |
|-----------|---------|-----------|
| `Environment` | production | Ambiente (development, staging, production) |
| `BillingMode` | PROVISIONED | Modo de cobranca (PROVISIONED ou PAY_PER_REQUEST) |
| `DefaultReadCapacity` | 10 | RCUs padrao (ignorado se PAY_PER_REQUEST) |
| `DefaultWriteCapacity` | 10 | WCUs padrao (ignorado se PAY_PER_REQUEST) |

## Opcao 3: AWS CLI Direto

### Criar Tabela de Usuarios

```bash
aws dynamodb create-table \
  --table-name pft_users \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --global-secondary-indexes \
    '[{
      "IndexName": "email-index",
      "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"},
      "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
    }]' \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10 \
  --region sa-east-1
```

## DynamoDB Local (Desenvolvimento)

### Instalacao

```bash
# Via Docker (recomendado)
docker run -d -p 8000:8000 amazon/dynamodb-local

# Via JAR
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
```

### Uso com Scripts

```bash
# Todos os scripts aceitam --local
python create_tables.py --local
python seed_data.py --local
```

## Indices Secundarios Globais (GSIs)

### pft_users
- `email-index`: Busca por email
- `type-index`: Busca por tipo de usuario
- `gsi1-index`: Indice generico para queries complexas

### pft_shares
- `status-created-index`: Busca por status ordenado por data
- `creator-index`: Busca por criador
- `external-email-index`: Busca por email externo
- `area-index`: Busca por area
- `expiration-index`: Busca por status/expiracao (para jobs de expiracao)

### pft_files
- `area-index`: Busca por area
- `uploader-index`: Busca por quem fez upload
- `hash-index`: Busca por hash SHA256 (deduplicacao)

### pft_audit
- `user-action-index`: Busca por usuario
- `action-index`: Busca por tipo de acao
- `level-index`: Busca por nivel (info, warning, error)

## TTL (Time To Live)

As seguintes tabelas tem TTL habilitado:

- `pft_tokens`: Tokens expiram automaticamente
- `pft_notifications`: Notificacoes expiram apos 30 dias

O atributo `ttl` deve conter um timestamp Unix (segundos).

## Boas Praticas

### Nomenclatura de Chaves

```
Partition Key (pk):
  - USER#<id>
  - SHARE#<id>
  - FILE#<id>
  - AREA#<id>
  - TOKEN#<hash>
  - AUDIT#<yyyy-mm>
  - CRED#<email>

Sort Key (sk):
  - PROFILE
  - METADATA
  - FILE#<file_id>
  - SUPERVISOR#<user_id>
  - NOTIFICATION#<timestamp>#<id>
  - LOCAL | ENTRA
```

### Capacidade Provisionada vs On-Demand

- **Desenvolvimento**: Use `PAY_PER_REQUEST` (mais flexivel)
- **Producao com carga previsivel**: Use `PROVISIONED` com Auto Scaling
- **Producao com carga variavel**: Use `PAY_PER_REQUEST`

### Backup

```bash
# Habilitar backup continuo
aws dynamodb update-continuous-backups \
  --table-name pft_users \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region sa-east-1
```

## Estimativa de Custos (sa-east-1)

### On-Demand (PAY_PER_REQUEST)
- Leitura: $0.25 por milhao de unidades
- Escrita: $1.25 por milhao de unidades
- Armazenamento: $0.25 por GB/mes

### Provisioned
- RCU: $0.00013 por hora
- WCU: $0.00065 por hora
- Armazenamento: $0.25 por GB/mes

## Troubleshooting

### Erro: Table already exists
A tabela ja existe. Use `--action delete` para remover antes de recriar.

### Erro: ValidationException
Verifique se todos os atributos nos GSIs estao definidos em `AttributeDefinitions`.

### Erro: ProvisionedThroughputExceededException
Aumente a capacidade provisionada ou mude para `PAY_PER_REQUEST`.

### Erro: ResourceNotFoundException
A tabela nao existe. Execute `create_tables.py` primeiro.
