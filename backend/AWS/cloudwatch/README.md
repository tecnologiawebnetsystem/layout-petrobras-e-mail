# Amazon CloudWatch - Monitoramento e Logs

Configuracao de logs, metricas, alarms e dashboards para monitoramento da aplicacao.

## Visao Geral

O CloudWatch e utilizado para:
- Centralizar logs da aplicacao
- Criar metricas customizadas
- Configurar alertas
- Visualizar dashboards

## Pre-requisitos

```bash
pip install boto3
```

## Uso

### 1. Criar Tudo de Uma Vez

```bash
python setup_cloudwatch.py create-all --env prod
```

### 2. Criar Log Groups

```bash
python setup_cloudwatch.py create-log-groups --env prod
```

### 3. Criar Metric Filters

```bash
python setup_cloudwatch.py create-metric-filters --env prod
```

### 4. Criar Alarms

```bash
# Sem notificacao
python setup_cloudwatch.py create-alarms --env prod

# Com notificacao SNS
python setup_cloudwatch.py create-alarms --env prod --sns-topic arn:aws:sns:sa-east-1:123456789:alerts
```

### 5. Criar Dashboard

```bash
python setup_cloudwatch.py create-dashboard --env prod
```

### 6. Listar Recursos

```bash
python setup_cloudwatch.py list
```

### 7. Deletar Recursos

```bash
python setup_cloudwatch.py delete --env dev
```

## Log Groups

| Log Group | Retencao | Uso |
|-----------|----------|-----|
| `/petrobras-file-transfer/{env}/application` | 30-90 dias | Logs gerais da aplicacao |
| `/petrobras-file-transfer/{env}/api` | 30-90 dias | Requisicoes HTTP |
| `/petrobras-file-transfer/{env}/audit` | 365 dias | Auditoria (compliance) |
| `/petrobras-file-transfer/{env}/security` | 365 dias | Eventos de seguranca |
| `/petrobras-file-transfer/{env}/errors` | 90 dias | Erros e excecoes |

## Metricas Customizadas

Namespace: `PetrobrasFileTransfer/{env}`

| Metrica | Descricao |
|---------|-----------|
| `4xxErrors` | Erros HTTP 4xx |
| `5xxErrors` | Erros HTTP 5xx |
| `FileUploads` | Arquivos enviados |
| `FileDownloads` | Arquivos baixados |
| `AuthFailures` | Falhas de autenticacao |
| `OTPFailures` | Falhas de OTP |

## Alarms

| Alarm | Threshold | Descricao |
|-------|-----------|-----------|
| `high-5xx-errors` | 3-10 | Alta taxa de erros 5xx |
| `high-4xx-errors` | 6-20 | Alta taxa de erros 4xx |
| `auth-failures` | 5-20 | Muitas falhas de auth |
| `otp-brute-force` | 10/min | Possivel brute force |

## Uso na Aplicacao

### Python Logging

```python
import logging
import watchtower

# Configurar handler CloudWatch
handler = watchtower.CloudWatchLogHandler(
    log_group='/petrobras-file-transfer/prod/application',
    stream_name='api-{strftime:%Y-%m-%d}'
)

logger = logging.getLogger(__name__)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Usar
logger.info("Arquivo enviado", extra={
    "action": "UPLOAD_FILE",
    "user_id": 123,
    "file_id": 456
})
```

### Metricas Customizadas

```python
import boto3

cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_data(
    Namespace='PetrobrasFileTransfer/prod',
    MetricData=[
        {
            'MetricName': 'FileUploads',
            'Value': 1,
            'Unit': 'Count',
            'Dimensions': [
                {'Name': 'FileType', 'Value': 'pdf'}
            ]
        }
    ]
)
```

## Logs Insights Queries

### Erros por hora
```sql
filter @message like /ERROR/
| stats count(*) as errors by bin(1h)
```

### Top usuarios com falhas de auth
```sql
filter event = "AUTH_FAILURE"
| stats count(*) as failures by user_email
| sort failures desc
| limit 10
```

### Latencia de API
```sql
filter @type = "REQUEST"
| stats avg(response_time) as avg_latency, 
        max(response_time) as max_latency 
        by endpoint
| sort avg_latency desc
```

### Downloads por usuario externo
```sql
filter action = "DOWNLOAD_FILE"
| stats count(*) as downloads by external_email
| sort downloads desc
```

## Estimativa de Custos

| Item | Preco |
|------|-------|
| Ingestao de logs | $0.50/GB |
| Armazenamento | $0.03/GB/mes |
| Queries (Logs Insights) | $0.005/GB escaneado |
| Metricas customizadas | $0.30/metrica/mes |
| Alarms (standard) | $0.10/alarm/mes |
| Dashboard | $3.00/dashboard/mes |

### Exemplo (10GB logs/mes, 6 metricas, 4 alarms, 1 dashboard)
- Ingestao: $5.00
- Storage: $0.30
- Metricas: $1.80
- Alarms: $0.40
- Dashboard: $3.00
- Total: ~$10.50/mes

## Boas Praticas

1. **Estruture logs como JSON** para facilitar queries
2. **Use dimensoes** nas metricas para filtrar
3. **Configure retencao** adequada por tipo de log
4. **Crie alarms** para metricas criticas
5. **Use Logs Insights** em vez de filtros regex
6. **Monitore custos** com Budget Alerts

## Troubleshooting

### Logs nao aparecem
```
Verificar:
1. IAM permite logs:CreateLogStream e logs:PutLogEvents
2. Log group existe
3. Aplicacao esta usando o handler correto
```

### Metricas zeradas
```
Verificar:
1. Metric filter pattern esta correto
2. Logs estao no formato esperado
3. Namespace correto no dashboard
```

### Alarm nao dispara
```
Verificar:
1. Threshold adequado
2. Periodo de avaliacao
3. Metricas estao sendo geradas
4. SNS topic configurado (se aplicavel)
```
