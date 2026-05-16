# AWS KMS - Servico de Gerenciamento de Chaves

Configuracao de chaves de criptografia para protecao de dados sensiveis.

## Visao Geral

O KMS e utilizado para:
- Criptografia de arquivos no S3 (SSE-KMS)
- Criptografia de segredos no Secrets Manager
- Criptografia de logs no CloudWatch
- Geracao de data keys para criptografia client-side

## Pre-requisitos

```bash
pip install boto3
```

## Uso

### 1. Criar Chave KMS

```bash
# Desenvolvimento
python setup_kms.py create-key --env dev

# Producao
python setup_kms.py create-key --env prod
```

### 2. Listar Chaves

```bash
python setup_kms.py list
```

### 3. Descrever Chave

```bash
python setup_kms.py describe --env prod
```

### 4. Gerar Data Key

```bash
python setup_kms.py generate-data-key --env prod
```

### 5. Habilitar Rotacao

```bash
python setup_kms.py rotate --env prod
```

## Arquitetura de Criptografia

```
┌─────────────────────────────────────────────────────────┐
│                    KMS Master Key                        │
│              (Gerenciada pela AWS)                       │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     Data Key                             │
│            (Gerada pelo KMS, criptografada)             │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌───────────┐
    │   S3    │    │ Secrets │    │CloudWatch │
    │ (files) │    │ Manager │    │  (logs)   │
    └─────────┘    └─────────┘    └───────────┘
```

## Tipos de Criptografia

### SSE-KMS (S3)
Criptografia server-side com chave gerenciada pelo KMS.

```python
# Upload com SSE-KMS
s3.put_object(
    Bucket=bucket,
    Key=key,
    Body=data,
    ServerSideEncryption='aws:kms',
    SSEKMSKeyId='alias/petrobras-file-transfer-prod'
)
```

### Envelope Encryption
Criptografia client-side usando data keys.

```python
# 1. Gerar data key
response = kms.generate_data_key(
    KeyId='alias/petrobras-file-transfer-prod',
    KeySpec='AES_256'
)
plaintext_key = response['Plaintext']
encrypted_key = response['CiphertextBlob']

# 2. Criptografar dados com plaintext key
encrypted_data = encrypt_with_aes(data, plaintext_key)

# 3. Armazenar encrypted_key junto com encrypted_data
# 4. Descartar plaintext_key da memoria
```

## Rotacao de Chaves

### Automatica (Recomendado)
- AWS rotaciona o material da chave anualmente
- Chaves antigas sao mantidas para descriptografar dados antigos
- Novos dados usam o material mais recente

### Manual
- Criar nova chave
- Re-criptografar dados com nova chave
- Agendar delecao da chave antiga

## Key Policy

A key policy controla quem pode usar a chave:

```json
{
  "Statement": [
    {
      "Sid": "Allow Application Role",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/app-role"
      },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:GenerateDataKey*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Variaveis de Ambiente

```env
KMS_KEY_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
KMS_KEY_ALIAS=alias/petrobras-file-transfer-prod
```

## Estimativa de Custos

| Item | Preco |
|------|-------|
| Chave KMS | $1.00/mes |
| Requests (primeiras 20k) | Gratis |
| Requests adicionais | $0.03/10.000 |

### Exemplo (100k requests/mes)
- Chave: $1.00
- Requests: $0.24
- Total: ~$1.24/mes

## Boas Praticas

1. **Usar aliases** em vez de key IDs no codigo
2. **Habilitar rotacao automatica**
3. **Separar chaves por ambiente**
4. **Aplicar principio de menor privilegio na key policy**
5. **Monitorar uso via CloudTrail**
6. **Nunca armazenar plaintext keys**

## Troubleshooting

### Access Denied
```
Verificar:
1. Key policy permite a acao
2. IAM policy permite uso da chave
3. Encryption context correto
```

### Key is disabled
```
Verificar:
1. Estado da chave (kms:DescribeKey)
2. Habilitar chave se necessario
```

### Invalid ciphertext
```
Verificar:
1. Usando a chave correta para descriptografar
2. Encryption context igual ao usado na criptografia
3. Dados nao foram corrompidos
```

## Compliance

- **PCI DSS**: KMS ajuda a atender requisitos de criptografia
- **LGPD**: Criptografia de dados pessoais
- **SOC 2**: Controles de acesso e auditoria
