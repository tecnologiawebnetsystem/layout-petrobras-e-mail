# Estrutura de Banco de Dados - DynamoDB

Este diretório contém toda a infraestrutura de banco de dados e configuração AWS para o Sistema de Transferência de Arquivos Petrobras.

## Arquivos

- **dynamodb-tables.json**: Definição completa de todas as tabelas DynamoDB
- **create-tables.py**: Script Python para criar tabelas automaticamente
- **cloudformation-template.yaml**: Infraestrutura completa AWS (S3, Lambda, API Gateway, SQS, SNS)
- **API-DOCUMENTATION.md**: Documentação completa da API REST
- **DEPLOYMENT-GUIDE.md**: Guia passo-a-passo para deploy na AWS

## Tabelas DynamoDB

### 1. petrobras-users
**Armazena usuários do sistema**

- **PK**: userId (String)
- **Atributos**: name, email, password, role, department, createdAt, lastLogin
- **GSI**: EmailIndex (email), RoleIndex (role)

### 2. petrobras-files
**Armazena arquivos enviados**

- **PK**: fileId (String)
- **Atributos**: uploadedBy, recipientEmail, recipientName, files[], status, approvedBy, approvedAt, rejectedBy, rejectedAt, rejectionReason, expiresAt, createdAt, message
- **GSI**: UploaderIndex (uploadedBy + createdAt), RecipientIndex (recipientEmail + createdAt), StatusIndex (status + createdAt)
- **TTL**: ttl (timestamp Unix)

### 3. petrobras-audit-logs
**Logs de auditoria**

- **PK**: logId (String)
- **SK**: timestamp (String)
- **Atributos**: userId, userName, action, details, ipAddress, metadata, fileId
- **GSI**: UserIndex (userId + timestamp), ActionIndex (action + timestamp), FileIndex (fileId + timestamp)

### 4. petrobras-notifications
**Notificações do sistema**

- **PK**: notificationId (String)
- **Atributos**: userId, type, title, message, isRead, createdAt, metadata
- **GSI**: UserNotificationsIndex (userId + createdAt), UnreadNotificationsIndex (userId + isRead)
- **TTL**: ttl (90 dias)

### 5. petrobras-sessions
**Sessões de usuários**

- **PK**: sessionId (String)
- **Atributos**: userId, token, refreshToken, ipAddress, userAgent, createdAt, expiresAt
- **GSI**: UserSessionsIndex (userId)
- **TTL**: ttl (7 dias)

## Quick Start

### 1. Criar Infraestrutura AWS

\`\`\`bash
cd sql
aws cloudformation create-stack \
  --stack-name petrobras-file-transfer-prod \
  --template-body file://cloudformation-template.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production \
  --capabilities CAPABILITY_NAMED_IAM
\`\`\`

### 2. Criar Tabelas DynamoDB

\`\`\`bash
python create-tables.py --profile default --region us-east-1
\`\`\`

### 3. Verificar Criação

\`\`\`bash
aws dynamodb list-tables
aws s3 ls
\`\`\`

## Integração Frontend → Backend

O frontend já está preparado para integração com o backend Python:

### 1. Usar o API Client

\`\`\`typescript
import { apiClient } from '@/lib/services/api-client'

// Login
const response = await apiClient.login(email, password)

// Upload
const formData = new FormData()
formData.append('file', file)
const response = await apiClient.uploadFiles(formData)
\`\`\`

### 2. Configurar Variável de Ambiente

\`\`\`env
NEXT_PUBLIC_API_URL=https://api.petrobras-transfer.com.br/v1
\`\`\`

### 3. O API Client já implementa:

- Autenticação JWT automática
- Refresh token
- Tratamento de erros
- Retry logic
- Rate limiting
- Todas as rotas da API documentadas

## Desenvolvimento Local

### Backend Local (Python FastAPI)

\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
\`\`\`

### Frontend Local

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

### Configurar DynamoDB Local (opcional)

\`\`\`bash
docker run -p 8000:8000 amazon/dynamodb-local
\`\`\`

## Próximos Passos

1. ✅ Infraestrutura AWS criada (CloudFormation)
2. ✅ Tabelas DynamoDB definidas
3. ✅ API documentada
4. ✅ Frontend preparado para integração
5. ⏳ **Implementar Backend Python** (próxima etapa)
6. ⏳ Deploy completo na AWS

## Suporte

Para dúvidas sobre deployment ou integração, consulte:
- DEPLOYMENT-GUIDE.md
- API-DOCUMENTATION.md
