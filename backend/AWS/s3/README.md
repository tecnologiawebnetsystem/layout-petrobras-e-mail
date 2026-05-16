# Amazon S3 - Armazenamento de Arquivos

Configuracao do bucket S3 para armazenamento seguro de arquivos do sistema de transferencia.

## Visao Geral

O S3 e utilizado para:
- Armazenar arquivos enviados pelos usuarios internos
- Gerar URLs pre-assinadas para upload/download seguro
- Manter versionamento dos arquivos
- Aplicar politicas de lifecycle para otimizacao de custos

## Pre-requisitos

```bash
pip install boto3
```

Configurar credenciais AWS:
```bash
aws configure
# Ou definir variaveis de ambiente:
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=sa-east-1
```

## Uso

### Criar Bucket

```bash
# Desenvolvimento
python create_bucket.py create --env dev

# Staging
python create_bucket.py create --env staging

# Producao
python create_bucket.py create --env prod --region sa-east-1
```

### Configurar CORS

```bash
python create_bucket.py configure-cors --env dev
```

### Configurar Lifecycle

```bash
python create_bucket.py configure-lifecycle --env prod
```

### Listar Buckets

```bash
python create_bucket.py list
```

### Deletar Bucket

```bash
# Deletar bucket vazio
python create_bucket.py delete --env dev

# Deletar bucket com conteudo
python create_bucket.py delete --env dev --force
```

## Estrutura do Bucket

```
petrobras-file-transfer-{env}/
├── uploads/                    # Arquivos enviados
│   ├── {area_id}/             # Organizado por area
│   │   ├── {file_id}/         # ID unico do arquivo
│   │   │   └── {filename}     # Arquivo original
│   │   └── ...
│   └── ...
├── temp/                       # Arquivos temporarios (expiram em 24h)
└── exports/                    # Relatorios exportados
```

## Configuracoes de Seguranca

### Criptografia
- **SSE-S3 (AES-256)**: Todos os arquivos sao criptografados em repouso
- **Bucket Key**: Habilitado para reduzir custos de KMS

### Acesso
- **Acesso publico**: Totalmente bloqueado
- **HTTPS obrigatorio**: Policy nega requisicoes HTTP
- **Versionamento**: Habilitado para recuperacao de arquivos

### CORS
Configurado para permitir uploads via presigned URLs apenas das origens permitidas:
- Dev: `localhost:3000`
- Staging: `staging.petrobras-transfer.com.br`
- Prod: `transfer.petrobras.com.br`

## Lifecycle Rules

| Regra | Dev | Staging | Prod |
|-------|-----|---------|------|
| Transicao para IA | 7 dias | 30 dias | 90 dias |
| Transicao para Glacier | 30 dias | 90 dias | 365 dias |
| Expiracao de versoes antigas | 30 dias | 30 dias | 30 dias |
| Abortar multipart incompleto | 7 dias | 7 dias | 7 dias |
| Expirar temp/ | 1 dia | 1 dia | 1 dia |

## Variaveis de Ambiente

Adicionar ao `.env` do backend:

```env
# AWS S3
AWS_REGION=sa-east-1
AWS_S3_BUCKET=petrobras-file-transfer-prod
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Storage provider
STORAGE_PROVIDER=aws
```

## CloudFormation

Para deploy via Infrastructure as Code, use o template em:
```
cloudformation-s3.yaml
```

Deploy:
```bash
aws cloudformation create-stack \
  --stack-name petrobras-file-transfer-s3-prod \
  --template-body file://cloudformation-s3.yaml \
  --parameters ParameterKey=Environment,ParameterValue=prod
```

## Presigned URLs

### Upload (PUT)
```python
from app.services.file_service import generate_presigned_upload

url = generate_presigned_upload(
    key="uploads/1/abc123/documento.pdf",
    expires_in=3600  # 1 hora
)
```

### Download (GET)
```python
from app.services.file_service import generate_download_url

url = generate_download_url(
    file_key="uploads/1/abc123/documento.pdf",
    expires_in=300,  # 5 minutos
    filename="documento.pdf"
)
```

## Monitoramento

### Metricas CloudWatch
- `BucketSizeBytes`: Tamanho total do bucket
- `NumberOfObjects`: Numero de objetos
- `AllRequests`: Total de requisicoes
- `4xxErrors`: Erros do cliente
- `5xxErrors`: Erros do servidor

### Alertas Recomendados
- Bucket size > 80% do limite
- 5xxErrors > 10/minuto
- Custos > threshold mensal

## Estimativa de Custos (sa-east-1)

| Item | Preco |
|------|-------|
| S3 Standard | $0.025/GB/mes |
| S3 Standard-IA | $0.0138/GB/mes |
| S3 Glacier | $0.005/GB/mes |
| PUT/COPY/POST | $0.005/1000 req |
| GET/SELECT | $0.0004/1000 req |
| Data Transfer Out | $0.09/GB |

### Exemplo (1TB armazenado, 10k uploads/mes, 50k downloads/mes)
- Storage: ~$25/mes
- Requests: ~$0.25/mes
- Transfer: Depende do volume baixado

## Troubleshooting

### Erro: Access Denied
```
Verificar:
1. Credenciais AWS configuradas
2. IAM policy permite s3:* no bucket
3. Bucket policy nao bloqueia o IP
```

### Erro: CORS
```
Verificar:
1. Origem esta na lista de AllowedOrigins
2. Metodo HTTP permitido
3. Headers necessarios expostos
```

### Erro: Presigned URL expirada
```
Verificar:
1. Clock do servidor sincronizado (NTP)
2. ExpiresIn adequado para o caso de uso
3. URL nao foi modificada
```

## Backup e Recuperacao

### Cross-Region Replication (Producao)
Para DR, configurar replicacao para outra regiao:
```bash
aws s3api put-bucket-replication \
  --bucket petrobras-file-transfer-prod \
  --replication-configuration file://replication.json
```

### Restaurar de Glacier
```bash
aws s3api restore-object \
  --bucket petrobras-file-transfer-prod \
  --key "uploads/1/abc123/arquivo.pdf" \
  --restore-request '{"Days":7,"GlacierJobParameters":{"Tier":"Standard"}}'
```
