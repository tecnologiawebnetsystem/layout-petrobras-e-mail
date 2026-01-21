# Guia Completo do Backend - Petrobras File Transfer

## Visao Geral

Este documento detalha toda a arquitetura do backend Python/FastAPI integrado com AWS (DynamoDB, S3, SES) para o sistema de transferencia segura de arquivos.

---

## 1. PERFIS DE USUARIO

### 1.1 Usuario Interno (Petrobras)

**Identificacao:**
- Email: `*@petrobras.com.br`
- Autenticacao: Microsoft Entra ID
- Cargo: Qualquer cargo que NAO seja gerencia

**Permissoes:**
- Criar compartilhamentos
- Cancelar seus proprios compartilhamentos (apenas pendentes)
- Visualizar seus compartilhamentos
- Receber notificacoes

**Fluxo:**
1. Login via Entra ID
2. Redirecionado para `/upload`
3. Cria compartilhamento
4. Aguarda aprovacao do supervisor
5. Recebe notificacao quando aprovado/rejeitado

### 1.2 Supervisor (Petrobras)

**Identificacao:**
- Email: `*@petrobras.com.br`
- Autenticacao: Microsoft Entra ID
- Cargo: Gerente, Coordenador, Diretor, Superintendente, Chefe, Lider

**Permissoes (DUPLO PERFIL):**
- **Como Aprovador:**
  - Aprovar compartilhamentos da equipe
  - Rejeitar compartilhamentos
  - Alterar tempo de expiracao
  - Visualizar auditoria da equipe
  
- **Como Usuario:**
  - Criar compartilhamentos (aprovados pelo supervisor dele)
  - Cancelar seus proprios compartilhamentos
  - Visualizar seus compartilhamentos

**Fluxo como Aprovador:**
1. Recebe notificacao de novo compartilhamento
2. Acessa `/supervisor` aba "Aprovacoes"
3. Visualiza detalhes
4. Aprova ou rejeita

**Fluxo como Usuario:**
1. Acessa `/supervisor` aba "Compartilhar"
2. Cria compartilhamento
3. Compartilhamento vai para SEU supervisor (gerente do gerente)
4. Aguarda aprovacao

### 1.3 Usuario Externo

**Identificacao:**
- Email: Qualquer dominio que NAO seja @petrobras
- Autenticacao: Codigo OTP por email (6 digitos, 3 minutos)

**Permissoes:**
- Visualizar compartilhamentos recebidos (apenas aprovados)
- Aceitar termos de uso
- Baixar arquivos

**Fluxo:**
1. Acessa `/external-verify`
2. Informa email
3. Recebe codigo OTP
4. Valida codigo
5. Redirecionado para `/download`
6. Aceita termos
7. Baixa arquivos

---

## 2. SERVICOS AWS

### 2.1 DynamoDB (Banco de Dados)

**Por que DynamoDB?**
- Serverless (sem servidor para gerenciar)
- Escala automatica
- Pay-per-request
- Baixa latencia
- Integrado com IAM

**Tabelas:**

| Tabela | Descricao | TTL |
|--------|-----------|-----|
| `petrobras_transfer_users` | Usuarios internos, supervisores e externos | Nao |
| `petrobras_transfer_shares` | Compartilhamentos | Nao |
| `petrobras_transfer_files` | Metadados de arquivos | Nao |
| `petrobras_transfer_otp_codes` | Codigos OTP | Sim (3 min) |
| `petrobras_transfer_sessions` | Sessoes ativas | Sim (8h/3h) |
| `petrobras_transfer_audit_logs` | Logs de auditoria | Nao |
| `petrobras_transfer_notifications` | Notificacoes | Nao |
| `petrobras_transfer_email_logs` | Historico de emails | Nao |

### 2.2 S3 (Armazenamento)

**Bucket:** `petrobras-file-transfer`

**Estrutura:**
```
petrobras-file-transfer/
├── shares/
│   └── {share_id}/
│       └── {file_id}/
│           └── {filename}
```

**Configuracoes:**
- Criptografia: SSE-S3 ou SSE-KMS
- Versionamento: Desabilitado
- Lifecycle: Deleta apos 30 dias
- Public Access: Bloqueado
- CORS: Configurado para frontend

**Upload:**
- Frontend recebe URL pre-assinada (PUT)
- Upload direto ao S3 (nao passa pelo backend)
- Confirmacao de upload apos conclusao

**Download:**
- Backend gera URL pre-assinada (GET)
- Expira em 1 hora
- Content-Disposition: attachment

### 2.3 SES (Emails)

**Tipos de Email:**

1. **Confirmacao para Remetente**
   - Quando: Apos criar compartilhamento
   - Para: Remetente
   - Conteudo: Resumo do envio, link para acompanhar

2. **Notificacao para Supervisor**
   - Quando: Apos criar compartilhamento
   - Para: Supervisor
   - Conteudo: Solicitacao de aprovacao, link direto

3. **Compartilhamento Aprovado**
   - Quando: Supervisor aprova
   - Para: Remetente
   - Conteudo: Confirmacao de aprovacao

4. **Compartilhamento Rejeitado**
   - Quando: Supervisor rejeita
   - Para: Remetente
   - Conteudo: Motivo da rejeicao

5. **Acesso para Destinatario**
   - Quando: Supervisor aprova
   - Para: Destinatario externo
   - Conteudo: Link de acesso, instrucoes

6. **Codigo OTP**
   - Quando: Usuario externo solicita acesso
   - Para: Destinatario externo
   - Conteudo: Codigo de 6 digitos

---

## 3. TABELAS DYNAMODB - DETALHAMENTO

### 3.1 Tabela: users

**Chaves:**
- PK: `USER#{user_id}`
- SK: `PROFILE`

**GSI1 (busca por email):**
- GSI1PK: `EMAIL#{email}`
- GSI1SK: `USER#{user_id}`

**Campos:**

| Campo | Tipo | Descricao |
|-------|------|-----------|
| user_id | String | UUID unico |
| email | String | Email do usuario |
| name | String | Nome completo |
| user_type | String | "internal", "supervisor", "external" |
| job_title | String | Cargo (do Entra ID) |
| department | String | Departamento |
| employee_id | String | Matricula |
| photo_url | String | URL da foto do perfil |
| manager | Map | Dados do supervisor |
| manager.id | String | ID do supervisor |
| manager.name | String | Nome do supervisor |
| manager.email | String | Email do supervisor |
| manager.job_title | String | Cargo do supervisor |
| auth_provider | String | "entra_id" ou "otp" |
| created_at | String | ISO 8601 |
| last_login | String | ISO 8601 |
| is_active | Boolean | Ativo/Inativo |

### 3.2 Tabela: shares

**Chaves:**
- PK: `SHARE#{share_id}`
- SK: `METADATA`

**GSI1 (busca por remetente):**
- GSI1PK: `SENDER#{sender_id}`
- GSI1SK: `CREATED#{created_at}`

**GSI2 (busca por destinatario):**
- GSI2PK: `RECIPIENT#{recipient_email}`
- GSI2SK: `STATUS#{status}`

**GSI3 (busca por supervisor):**
- GSI3PK: `APPROVER#{approver_email}`
- GSI3SK: `STATUS#{status}`

**Campos:**

| Campo | Tipo | Descricao |
|-------|------|-----------|
| share_id | String | UUID unico |
| name | String | Titulo/descricao curta |
| description | String | Descricao completa |
| status | String | "pending", "approved", "rejected", "cancelled", "expired" |
| sender | Map | Dados do remetente |
| sender.id | String | ID do remetente |
| sender.name | String | Nome |
| sender.email | String | Email |
| recipient | String | Email do destinatario externo |
| files | List | Lista de arquivos |
| files[].id | String | ID do arquivo |
| files[].name | String | Nome do arquivo |
| files[].size | String | Tamanho formatado |
| files[].type | String | Extensao |
| expiration_hours | Number | 24, 48 ou 72 |
| sent_by_supervisor | Boolean | Se remetente e supervisor |
| approver | Map | Dados do aprovador |
| approver.id | String | ID |
| approver.name | String | Nome |
| approver.email | String | Email |
| approver.job_title | String | Cargo |
| created_at | String | ISO 8601 |
| approved_at | String | ISO 8601 |
| approved_by | Map | Quem aprovou |
| rejected_at | String | ISO 8601 |
| rejected_by | Map | Quem rejeitou |
| rejection_reason | String | Motivo da rejeicao |
| cancelled_at | String | ISO 8601 |
| expires_at | String | ISO 8601 |
| download_count | Number | Quantidade de downloads |
| terms_accepted | Boolean | Se termos foram aceitos |
| terms_accepted_at | String | ISO 8601 |

### 3.3 Tabela: files

**Chaves:**
- PK: `FILE#{file_id}`
- SK: `SHARE#{share_id}`

**GSI1 (busca por share):**
- GSI1PK: `SHARE#{share_id}`
- GSI1SK: `FILE#{file_id}`

**Campos:**

| Campo | Tipo | Descricao |
|-------|------|-----------|
| file_id | String | UUID unico |
| share_id | String | ID do compartilhamento |
| filename | String | Nome do arquivo |
| original_filename | String | Nome original |
| content_type | String | MIME type |
| size_bytes | Number | Tamanho em bytes |
| size_formatted | String | "1.5 MB" |
| extension | String | "PDF", "XLSX" |
| s3_key | String | Caminho no S3 |
| s3_bucket | String | Nome do bucket |
| upload_status | String | "pending", "completed", "failed" |
| uploaded_by | String | ID do usuario |
| created_at | String | ISO 8601 |
| completed_at | String | ISO 8601 |

### 3.4 Tabela: otp_codes

**Chaves:**
- PK: `OTP#{email}`
- SK: `CODE#{timestamp}`

**TTL:** `ttl` (expira em 3 minutos)

**Campos:**

| Campo | Tipo | Descricao |
|-------|------|-----------|
| email | String | Email do destinatario |
| code | String | Codigo de 6 digitos |
| created_at | String | ISO 8601 |
| expires_at | String | ISO 8601 |
| attempts | Number | Tentativas de verificacao |
| verified | Boolean | Se foi verificado |
| ttl | Number | Timestamp de expiracao |

### 3.5 Tabela: sessions

**Chaves:**
- PK: `SESSION#{session_token}`
- SK: `USER#{user_id}`

**GSI1 (busca por usuario):**
- GSI1PK: `USER#{user_id}`
- GSI1SK: `SESSION#{created_at}`

**TTL:** `ttl` (8h interno, 3h externo)

**Campos:**

| Campo | Tipo | Descricao |
|-------|------|-----------|
| session_token | String | JWT token |
| user_id | String | ID do usuario |
| email | String | Email |
| user_type | String | Tipo de usuario |
| created_at | String | ISO 8601 |
| expires_at | String | ISO 8601 |
| ip_address | String | IP do cliente |
| user_agent | String | Browser/dispositivo |
| ttl | Number | Timestamp de expiracao |

### 3.6 Tabela: audit_logs

**Chaves:**
- PK: `AUDIT#{year}-{month}`
- SK: `{timestamp}#{log_id}`

**GSI1 (busca por usuario):**
- GSI1PK: `USER#{user_id}`
- GSI1SK: `{timestamp}`

**GSI2 (busca por acao):**
- GSI2PK: `ACTION#{action}`
- GSI2SK: `{timestamp}`

**Campos:**

| Campo | Tipo | Descricao |
|-------|------|-----------|
| log_id | String | UUID unico |
| action | String | "login", "share_created", etc |
| level | String | "info", "warning", "error", "success" |
| user_id | String | ID do usuario |
| user_type | String | Tipo de usuario |
| user_email | String | Email |
| timestamp | String | ISO 8601 |
| details | Map | Dados adicionais |
| ip_address | String | IP do cliente |
| user_agent | String | Browser |

### 3.7 Tabela: notifications

**Chaves:**
- PK: `NOTIFICATION#{notification_id}`
- SK: `USER#{user_id}`

**GSI1 (busca por usuario):**
- GSI1PK: `USER#{user_id}`
- GSI1SK: `CREATED#{created_at}`

**Campos:**

| Campo | Tipo | Descricao |
|-------|------|-----------|
| notification_id | String | UUID unico |
| user_id | String | Destinatario |
| type | String | Tipo de notificacao |
| title | String | Titulo |
| message | String | Mensagem |
| data | Map | Dados adicionais |
| read | Boolean | Se foi lida |
| created_at | String | ISO 8601 |
| read_at | String | ISO 8601 |

---

## 4. ENDPOINTS API

### 4.1 Autenticacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/v1/auth/entra/validate` | Valida token Entra ID |
| POST | `/api/v1/auth/external/verify` | Verifica email externo |
| POST | `/api/v1/auth/external/verify-otp` | Valida codigo OTP |
| POST | `/api/v1/auth/external/resend-otp` | Reenvia OTP |
| POST | `/api/v1/auth/session/validate` | Valida sessao |
| POST | `/api/v1/auth/logout` | Encerra sessao |

### 4.2 Compartilhamentos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/v1/shares/create` | Cria compartilhamento |
| GET | `/api/v1/shares/my-shares` | Lista meus compartilhamentos |
| GET | `/api/v1/shares/{id}` | Detalhes de um share |
| PATCH | `/api/v1/shares/{id}/cancel` | Cancela share |

### 4.3 Supervisor

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/v1/shares/supervisor/pending` | Pendentes para aprovar |
| GET | `/api/v1/shares/supervisor/all` | Todos do supervisor |
| POST | `/api/v1/shares/supervisor/approve` | Aprova share |
| POST | `/api/v1/shares/supervisor/reject` | Rejeita share |
| PUT | `/api/v1/shares/supervisor/{id}/extend` | Altera expiracao |
| GET | `/api/v1/shares/supervisor/statistics` | Estatisticas |

### 4.4 Usuario Externo

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/v1/shares/external/available` | Shares disponiveis |
| POST | `/api/v1/shares/external/accept-terms` | Aceita termos |
| GET | `/api/v1/shares/external/{share_id}/files/{file_id}/download` | Download |

### 4.5 Arquivos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/v1/files/upload-url` | Gera URL pre-assinada upload |
| POST | `/api/v1/files/confirm-upload` | Confirma upload |
| GET | `/api/v1/files/{id}/preview` | Preview do arquivo |

### 4.6 Notificacoes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/v1/notifications` | Lista notificacoes |
| PATCH | `/api/v1/notifications/{id}/read` | Marca como lida |
| POST | `/api/v1/notifications/read-all` | Marca todas como lidas |

### 4.7 Auditoria

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/v1/audit/logs` | Lista logs |
| GET | `/api/v1/audit/metrics` | Metricas gerais |
| GET | `/api/v1/audit/export` | Exporta logs |

---

## 5. CORRESPONDENCIA FRONTEND -> BACKEND

| Componente Frontend | Arquivo | Endpoint Backend |
|--------------------|---------|------------------|
| `entra-provider.tsx` | processLoginResponse() | POST `/auth/entra/validate` |
| `external-verify/page.tsx` | handleEmailSubmit() | POST `/auth/external/verify` |
| `external-verify/page.tsx` | handleOtpSubmit() | POST `/auth/external/verify-otp` |
| `auth-store.ts` | logout() | POST `/auth/logout` |
| `upload/page.tsx` | handleSubmit() | POST `/shares/create` |
| `upload/page.tsx` | lista | GET `/shares/my-shares` |
| `workflow-store.ts` | cancelUpload() | PATCH `/shares/{id}/cancel` |
| `supervisor/page.tsx` | aba Aprovacoes | GET `/shares/supervisor/pending` |
| `approval-modal.tsx` | handleApprove() | POST `/shares/supervisor/approve` |
| `rejection-modal.tsx` | handleReject() | POST `/shares/supervisor/reject` |
| `download/page.tsx` | lista | GET `/shares/external/available` |
| `download/page.tsx` | aceitar termos | POST `/shares/external/accept-terms` |
| `download/page.tsx` | baixar | GET `/shares/external/.../download` |
| `DragDropZone` | upload | POST `/files/upload-url` + S3 PUT |
| `notification-store.ts` | lista | GET `/notifications` |
| `audit-log-store.ts` | logs | GET `/audit/logs` |

---

## 6. COMO CONFIGURAR

### 6.1 Desenvolvimento Local

```bash
# 1. Navegar para pasta do backend
cd back-end/python

# 2. Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variaveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais AWS

# 5. (Opcional) Rodar DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# 6. Criar tabelas
python scripts/create_dynamodb_tables.py

# 7. Rodar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 8. Acessar documentacao
# Swagger: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

### 6.2 AWS - Producao

1. **IAM Role** com permissoes:
   - DynamoDB: Read/Write nas tabelas
   - S3: Read/Write no bucket
   - SES: Send emails

2. **DynamoDB:**
   - Criar tabelas com script
   - Configurar TTL
   - Habilitar Point-in-Time Recovery

3. **S3:**
   - Criar bucket
   - Configurar CORS
   - Configurar Lifecycle
   - Bloquear acesso publico

4. **SES:**
   - Verificar dominio
   - Configurar DKIM
   - Sair do sandbox (producao)

5. **API Gateway + Lambda** ou **ECS/Fargate:**
   - Deploy da aplicacao FastAPI

---

## 7. ESTRUTURA DE ARQUIVOS

```
back-end/python/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── routes_auth_complete.py      # Autenticacao
│   │       ├── routes_shares_complete.py    # Compartilhamentos
│   │       ├── routes_files.py              # Arquivos
│   │       ├── routes_notifications.py      # Notificacoes
│   │       └── routes_audit.py              # Auditoria
│   ├── core/
│   │   ├── config.py                        # Configuracoes
│   │   ├── aws_config.py                    # Clientes AWS
│   │   └── dynamodb_client.py               # Cliente DynamoDB
│   ├── models/
│   │   └── dynamodb_models.py               # Modelos Pydantic
│   ├── services/
│   │   ├── user_service.py                  # Usuarios
│   │   ├── share_service_dynamodb.py        # Compartilhamentos
│   │   ├── file_service_s3.py               # Arquivos S3
│   │   ├── otp_service.py                   # Codigos OTP
│   │   ├── email_service_dynamodb.py        # Emails
│   │   ├── audit_service_dynamodb.py        # Auditoria
│   │   └── notification_service.py          # Notificacoes
│   └── main.py                              # Ponto de entrada
├── scripts/
│   └── create_dynamodb_tables.py            # Criar tabelas
├── .env.example                              # Exemplo de config
├── requirements.txt                          # Dependencias
└── Dockerfile                                # Container
```
