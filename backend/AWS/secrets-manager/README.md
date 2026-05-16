# AWS Secrets Manager

Gerenciamento seguro de credenciais e secrets da aplicacao.

## Visao Geral

O Secrets Manager e utilizado para:
- Armazenar credenciais de banco de dados
- Guardar secrets JWT
- Gerenciar chaves de API
- Armazenar credenciais de integracao (Entra ID, SMTP)

## Pre-requisitos

```bash
pip install boto3
```

## Uso

### 1. Criar Todos os Secrets

```bash
python setup_secrets.py create --env dev
```

Isso cria:
- `petrobras-file-transfer/dev/jwt-secret`
- `petrobras-file-transfer/dev/database`
- `petrobras-file-transfer/dev/smtp`
- `petrobras-file-transfer/dev/entra-id`
- `petrobras-file-transfer/dev/api-keys`
- `petrobras-file-transfer/dev/encryption`

### 2. Listar Secrets

```bash
python setup_secrets.py list
```

### 3. Recuperar Secret

```bash
python setup_secrets.py get --env prod --name jwt-secret
```

### 4. Atualizar Secret

```bash
python setup_secrets.py update --env prod --name database --key password --value "nova-senha"
```

### 5. Rotacionar Secret

```bash
python setup_secrets.py rotate --env prod --name jwt-secret
```

### 6. Exportar para .env

```bash
python setup_secrets.py export --env prod > .env.prod
```

### 7. Deletar Secrets

```bash
# Delecao com janela de recuperacao (7 dias)
python setup_secrets.py delete --env dev

# Delecao permanente
python setup_secrets.py delete --env dev --force
```

## Estrutura dos Secrets

### jwt-secret
```json
{
  "secret": "base64-encoded-secret-key"
}
```

### database
```json
{
  "host": "database.example.com",
  "port": 5432,
  "database": "petrobras_transfer",
  "username": "app_user",
  "password": "secure-password"
}
```

### smtp
```json
{
  "server": "smtp.example.com",
  "port": 587,
  "username": "smtp-user",
  "password": "smtp-password",
  "from_email": "no-reply@petrobras.com.br"
}
```

### entra-id
```json
{
  "tenant_id": "azure-tenant-id",
  "client_id": "app-client-id",
  "client_secret": "client-secret",
  "redirect_uri": "https://app.example.com/callback"
}
```

### api-keys
```json
{
  "internal_api_key": "key-for-internal-services",
  "webhook_secret": "secret-for-webhooks"
}
```

### encryption
```json
{
  "file_encryption_key": "key-for-file-encryption",
  "otp_encryption_key": "key-for-otp-encryption"
}
```

## Uso na Aplicacao

### Python (boto3)

```python
import boto3
import json

def get_secret(secret_name: str) -> dict:
    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response["SecretString"])

# Exemplo
db_config = get_secret("petrobras-file-transfer/prod/database")
connection_string = f"postgresql://{db_config['username']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}"
```

### Com Cache (Recomendado)

```python
from aws_secretsmanager_caching import SecretCache, SecretCacheConfig

cache_config = SecretCacheConfig()
cache = SecretCache(config=cache_config)

def get_cached_secret(secret_name: str) -> dict:
    return json.loads(cache.get_secret_string(secret_name))
```

## Rotacao Automatica

Para habilitar rotacao automatica com Lambda:

```bash
aws secretsmanager rotate-secret \
  --secret-id petrobras-file-transfer/prod/database \
  --rotation-lambda-arn arn:aws:lambda:sa-east-1:123456789:function:rotation-function \
  --rotation-rules AutomaticallyAfterDays=30
```

## Estimativa de Custos

| Item | Preco |
|------|-------|
| Secret armazenado | $0.40/mes |
| 10.000 chamadas API | $0.05 |

### Exemplo (6 secrets, 100k chamadas/mes)
- Storage: $2.40/mes
- API calls: $0.50/mes
- Total: ~$2.90/mes

## Boas Praticas

1. **Nunca commite secrets** no codigo
2. **Use cache** para reduzir chamadas e latencia
3. **Rotacione regularmente** secrets criticos
4. **Separe por ambiente** (dev/staging/prod)
5. **Monitore acesso** via CloudTrail
6. **Use KMS** para criptografia adicional

## Troubleshooting

### Access Denied
```
Verificar:
1. IAM policy permite secretsmanager:GetSecretValue
2. Resource policy do secret permite acesso
3. KMS key policy permite descriptografar
```

### Secret Not Found
```
Verificar:
1. Nome do secret esta correto
2. Secret existe na regiao correta
3. Secret nao foi deletado
```

### Decryption Failure
```
Verificar:
1. KMS key existe e esta habilitada
2. IAM tem permissao kms:Decrypt
3. Encryption context correto (se usado)
```
