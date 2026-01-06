# Credenciais Microsoft Entra ID - Petrobras

## Informações Recebidas

As credenciais do Microsoft Entra ID foram fornecidas pelo time de infraestrutura da Petrobras:

### Aplicação
- **Nome:** AAD-DEV-A12022
- **Padrão:** Seguindo o padrão de nomenclatura da Petrobras

### Credenciais

```
Tenant ID: 5b6f6241-9a57-4be4-8e50-1dfa72e79a57
Client ID: da3aaaad-619f-4bee-a434-51efd11faf7c
Client Secret: Pnt8Q~0CQeLtKfv2T.jbQqRL.th5uPZwRIHfoaKM
```

## ⚠️ IMPORTANTE: Segurança

### Desenvolvimento Local
As credenciais podem ser usadas em `.env.local` para desenvolvimento:

```env
NEXT_PUBLIC_ENTRA_TENANT_ID=5b6f6241-9a57-4be4-8e50-1dfa72e79a57
NEXT_PUBLIC_ENTRA_CLIENT_ID=da3aaaad-619f-4bee-a434-51efd11faf7c
NEXT_PUBLIC_ENTRA_CLIENT_SECRET=Pnt8Q~0CQeLtKfv2T.jbQqRL.th5uPZwRIHfoaKM
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000
```

### Produção
**NUNCA coloque essas credenciais em código ou repositório Git!**

As credenciais DEVEM ser armazenadas no AWS Secrets Manager:

#### 1. Criar Secret no AWS Console

```bash
aws secretsmanager create-secret \
  --name petrobras/entra-id-credentials \
  --description "Credenciais Microsoft Entra ID para aplicação AAD-DEV-A12022" \
  --secret-string '{
    "ENTRA_TENANT_ID": "5b6f6241-9a57-4be4-8e50-1dfa72e79a57",
    "ENTRA_CLIENT_ID": "da3aaaad-619f-4bee-a434-51efd11faf7c",
    "ENTRA_CLIENT_SECRET": "Pnt8Q~0CQeLtKfv2T.jbQqRL.th5uPZwRIHfoaKM",
    "ENTRA_APP_NAME": "AAD-DEV-A12022"
  }' \
  --region us-east-1
```

#### 2. Buscar Credenciais no Back-end Python

```python
import boto3
import json
import os

def load_entra_credentials():
    """Carrega credenciais do Entra ID do AWS Secrets Manager"""
    
    # Verificar se está em desenvolvimento (usa .env)
    if os.getenv('ENV') == 'development':
        return
    
    # Produção: buscar do Secrets Manager
    client = boto3.client('secretsmanager', region_name='us-east-1')
    
    try:
        response = client.get_secret_value(
            SecretId='petrobras/entra-id-credentials'
        )
        
        secrets = json.loads(response['SecretString'])
        
        # Definir como variáveis de ambiente
        os.environ['NEXT_PUBLIC_ENTRA_TENANT_ID'] = secrets['ENTRA_TENANT_ID']
        os.environ['NEXT_PUBLIC_ENTRA_CLIENT_ID'] = secrets['ENTRA_CLIENT_ID']
        os.environ['NEXT_PUBLIC_ENTRA_CLIENT_SECRET'] = secrets['ENTRA_CLIENT_SECRET']
        
        print(f"✅ Credenciais Entra ID carregadas: {secrets['ENTRA_APP_NAME']}")
        
    except Exception as e:
        print(f"❌ Erro ao carregar credenciais Entra ID: {e}")
        raise

# Chamar no início da aplicação
load_entra_credentials()
```

#### 3. Configurar IAM Policy

A aplicação precisa de permissão para ler o secret:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:petrobras/entra-id-credentials-*"
    }
  ]
}
```

## Como Testar

### 1. Desenvolvimento Local

Adicione as credenciais no `.env.local` e execute:

```bash
npm run dev
```

Acesse `http://localhost:3000` e clique em "Entrar com Microsoft".

### 2. Verificar Configuração

O sistema automaticamente valida se as credenciais estão configuradas. Verifique o console do navegador (F12) para ver logs de autenticação.

## Troubleshooting

### Erro: "AADSTS700016: Application not found"
- Verificar se o Client ID está correto
- Confirmar que a aplicação AAD-DEV-A12022 está registrada no Entra ID

### Erro: "AADSTS7000215: Invalid client secret"
- O Client Secret pode ter expirado
- Solicitar novo Client Secret ao time de infra

### Erro: "redirect_uri mismatch"
- Adicionar a URL da aplicação no Entra ID:
  - Desenvolvimento: `http://localhost:3000`
  - Produção: `https://compartilhamento.petrobras.com.br`
