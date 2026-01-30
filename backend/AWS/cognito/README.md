# Amazon Cognito - Autenticacao de Usuarios

Alternativa ao Microsoft Entra ID para autenticacao de usuarios internos.

## Visao Geral

O Cognito pode ser utilizado para:
- Autenticacao de usuarios internos
- Gerenciamento de grupos (supervisores, admins)
- MFA (autenticacao multi-fator)
- Hosted UI para login

## Quando Usar

- **Cognito**: Quando nao ha Microsoft 365 / Azure AD disponivel
- **Entra ID**: Quando usuarios ja possuem contas Microsoft corporativas

## Pre-requisitos

```bash
pip install boto3
```

## Uso

### 1. Criar Tudo de Uma Vez

```bash
python setup_cognito.py create-all --env prod
```

### 2. Criar User Pool

```bash
python setup_cognito.py create-user-pool --env prod
```

### 3. Criar App Client

```bash
python setup_cognito.py create-app-client --env prod
```

### 4. Criar Dominio (Hosted UI)

```bash
python setup_cognito.py create-domain --env prod
```

### 5. Criar Usuario

```bash
python setup_cognito.py create-user \
  --env prod \
  --email joao.silva@petrobras.com.br \
  --name "Joao Silva" \
  --group supervisors
```

### 6. Listar Recursos

```bash
python setup_cognito.py list
```

## Grupos de Usuarios

| Grupo | Precedencia | Descricao |
|-------|-------------|-----------|
| `admins` | 0 | Administradores do sistema |
| `supervisors` | 1 | Aprovam compartilhamentos |
| `internal_users` | 2 | Criam compartilhamentos |

## Configuracao de Seguranca

### Politica de Senhas
- Minimo 12 caracteres
- Letras maiusculas e minusculas
- Numeros e simbolos
- Senha temporaria valida por 7 dias

### MFA
- Opcional por padrao
- Suporta TOTP (Google Authenticator, etc.)

### Tokens
- Access Token: 1 hora
- ID Token: 1 hora
- Refresh Token: 30 dias

## Integracao com a Aplicacao

### Variaveis de Ambiente

```env
AUTH_MODE=cognito
COGNITO_USER_POOL_ID=sa-east-1_xxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxx
COGNITO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxx
COGNITO_DOMAIN=https://petrobras-file-transfer-prod.auth.sa-east-1.amazoncognito.com
```

### Python (boto3)

```python
import boto3

cognito = boto3.client('cognito-idp')

# Autenticar usuario
response = cognito.initiate_auth(
    ClientId='your-client-id',
    AuthFlow='USER_PASSWORD_AUTH',
    AuthParameters={
        'USERNAME': 'user@example.com',
        'PASSWORD': 'password',
        'SECRET_HASH': computed_hash  # Se client secret habilitado
    }
)

access_token = response['AuthenticationResult']['AccessToken']
```

### Verificar Token

```python
# Obter usuario do token
response = cognito.get_user(
    AccessToken=access_token
)

email = next(
    attr['Value'] for attr in response['UserAttributes']
    if attr['Name'] == 'email'
)
```

## Hosted UI

URL de login:
```
https://{domain}.auth.{region}.amazoncognito.com/login?
  client_id={client_id}&
  response_type=code&
  scope=email+openid+profile&
  redirect_uri={callback_url}
```

## Estimativa de Custos

| Item | Preco |
|------|-------|
| MAU (Monthly Active Users) ate 50k | $0.0055/MAU |
| MAU acima de 50k | $0.0046/MAU |
| MFA (SMS) | $0.06/mensagem |
| MFA (TOTP) | Incluido |

### Exemplo (1.000 MAU)
- Usuarios: $5.50/mes
- Total: ~$5.50/mes

## Boas Praticas

1. **Use grupos** para controle de acesso
2. **Habilite MFA** para usuarios privilegiados
3. **Configure politica de senha forte**
4. **Use refresh tokens** para sessoes longas
5. **Monitore** com CloudWatch
6. **Revogue tokens** no logout

## Migracao de Usuarios

Para migrar usuarios de outro sistema:

```python
# Importar usuarios via CSV
for user in users:
    cognito.admin_create_user(
        UserPoolId=pool_id,
        Username=user['email'],
        UserAttributes=[
            {'Name': 'email', 'Value': user['email']},
            {'Name': 'email_verified', 'Value': 'true'},
            {'Name': 'name', 'Value': user['name']}
        ],
        MessageAction='SUPPRESS'  # Nao enviar email
    )
    
    # Definir senha permanente
    cognito.admin_set_user_password(
        UserPoolId=pool_id,
        Username=user['email'],
        Password=user['temp_password'],
        Permanent=False  # Forcara troca no primeiro login
    )
```

## Troubleshooting

### NotAuthorizedException
```
Verificar:
1. Credenciais corretas
2. Usuario confirmado
3. Usuario nao desabilitado
```

### UserNotFoundException
```
Verificar:
1. Email correto
2. User Pool correto
3. Usuario existe
```

### InvalidPasswordException
```
Verificar:
1. Senha atende politica
2. Senha nao foi usada recentemente (se rotacao habilitada)
```
