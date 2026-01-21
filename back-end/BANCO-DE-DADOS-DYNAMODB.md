# Banco de Dados - Amazon DynamoDB

## Visao Geral da Arquitetura

Este documento descreve a estrutura completa do banco de dados DynamoDB para o sistema de Compartilhamento Seguro de Arquivos da Petrobras.

---

## Perfis de Usuario

### 1. Usuario Interno (internal)
- Funcionarios Petrobras que fazem upload de arquivos
- Autenticados via Microsoft Entra ID
- Podem enviar arquivos para usuarios externos
- Seus compartilhamentos precisam de aprovacao do supervisor

### 2. Supervisor (supervisor)
- Gerentes/Coordenadores que aprovam compartilhamentos
- Autenticados via Microsoft Entra ID
- **DUPLA FUNCAO**: Podem aprovar E tambem compartilhar arquivos
- Quando compartilham, a aprovacao vai para o supervisor DELES (gerente do gerente)
- Identificados pelo cargo (jobTitle) contendo: gerente, coordenador, diretor, superintendente, chefe, lider

### 3. Usuario Externo (external)
- Destinatarios fora da Petrobras
- Autenticados via OTP (codigo de 6 digitos por email)
- Apenas podem visualizar e baixar arquivos aprovados
- Sessao temporaria (expira apos inatividade)

---

## Servicos AWS Utilizados

| Servico | Funcao |
|---------|--------|
| **DynamoDB** | Banco de dados NoSQL principal |
| **S3** | Armazenamento de arquivos |
| **SES** | Envio de emails (OTP, notificacoes) |
| **Cognito** | Gerenciamento de sessoes (opcional) |
| **Lambda** | Funcoes serverless para tarefas async |
| **CloudWatch** | Logs e monitoramento |
| **KMS** | Criptografia de dados sensiveis |
| **IAM** | Controle de acesso e permissoes |

---

## Tabelas DynamoDB

### 1. Tabela: `petrobras_users`

Armazena todos os usuarios do sistema (internos, supervisores e externos).

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| `PK` | String | `USER#<user_id>` | Sim |
| `SK` | String | `PROFILE` | Sim |
| `user_id` | String | UUID unico do usuario | Sim |
| `email` | String | Email do usuario (unico) | Sim |
| `name` | String | Nome completo | Sim |
| `user_type` | String | `internal`, `supervisor`, `external` | Sim |
| `job_title` | String | Cargo (do Entra ID) | Nao |
| `department` | String | Departamento | Nao |
| `office_location` | String | Localizacao do escritorio | Nao |
| `mobile_phone` | String | Telefone celular | Nao |
| `employee_id` | String | Matricula do funcionario | Nao |
| `photo_url` | String | URL da foto de perfil | Nao |
| `entra_id` | String | ID do Microsoft Entra | Nao |
| `manager_id` | String | ID do supervisor direto | Nao |
| `manager_name` | String | Nome do supervisor | Nao |
| `manager_email` | String | Email do supervisor | Nao |
| `manager_job_title` | String | Cargo do supervisor | Nao |
| `is_active` | Boolean | Usuario ativo? | Sim |
| `created_at` | String | ISO 8601 datetime | Sim |
| `updated_at` | String | ISO 8601 datetime | Sim |
| `last_login_at` | String | Ultimo acesso | Nao |

**Indices Secundarios (GSI):**
- `GSI1`: `email` (PK) - Busca por email
- `GSI2`: `user_type` (PK), `created_at` (SK) - Listar por tipo
- `GSI3`: `manager_id` (PK) - Buscar subordinados

---

### 2. Tabela: `petrobras_shares`

Armazena os compartilhamentos de arquivos.

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| `PK` | String | `SHARE#<share_id>` | Sim |
| `SK` | String | `METADATA` | Sim |
| `share_id` | String | UUID unico do compartilhamento | Sim |
| `name` | String | Nome/descricao do compartilhamento | Sim |
| `description` | String | Descricao detalhada | Nao |
| `status` | String | `pending`, `approved`, `rejected`, `cancelled`, `expired` | Sim |
| `sender_id` | String | ID do remetente | Sim |
| `sender_name` | String | Nome do remetente | Sim |
| `sender_email` | String | Email do remetente | Sim |
| `sender_employee_id` | String | Matricula do remetente | Nao |
| `recipient_email` | String | Email do destinatario externo | Sim |
| `recipient_name` | String | Nome do destinatario (opcional) | Nao |
| `approver_id` | String | ID do aprovador (supervisor) | Nao |
| `approver_name` | String | Nome do aprovador | Nao |
| `approver_email` | String | Email do aprovador | Nao |
| `sent_by_supervisor` | Boolean | Foi enviado por um supervisor? | Sim |
| `expiration_hours` | Number | Horas ate expirar (24, 48, 72) | Sim |
| `expires_at` | String | Data/hora de expiracao | Nao |
| `created_at` | String | Data de criacao | Sim |
| `approved_at` | String | Data de aprovacao | Nao |
| `rejected_at` | String | Data de rejeicao | Nao |
| `cancelled_at` | String | Data de cancelamento | Nao |
| `rejection_reason` | String | Motivo da rejeicao | Nao |
| `cancellation_reason` | String | Motivo do cancelamento | Nao |
| `cancelled_by` | String | Quem cancelou | Nao |
| `download_count` | Number | Quantidade de downloads | Sim |
| `last_download_at` | String | Ultimo download | Nao |
| `terms_accepted` | Boolean | Termos aceitos pelo externo? | Sim |
| `terms_accepted_at` | String | Quando aceitou os termos | Nao |

**Indices Secundarios (GSI):**
- `GSI1`: `sender_id` (PK), `created_at` (SK) - Shares do remetente
- `GSI2`: `recipient_email` (PK), `status` (SK) - Shares do destinatario
- `GSI3`: `approver_email` (PK), `status` (SK) - Pendentes do supervisor
- `GSI4`: `status` (PK), `created_at` (SK) - Filtrar por status

---

### 3. Tabela: `petrobras_files`

Armazena os arquivos de cada compartilhamento.

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| `PK` | String | `SHARE#<share_id>` | Sim |
| `SK` | String | `FILE#<file_id>` | Sim |
| `file_id` | String | UUID unico do arquivo | Sim |
| `share_id` | String | ID do compartilhamento | Sim |
| `file_name` | String | Nome original do arquivo | Sim |
| `file_type` | String | Extensao (PDF, DOCX, etc) | Sim |
| `file_size` | String | Tamanho formatado (ex: "2.5 MB") | Sim |
| `file_size_bytes` | Number | Tamanho em bytes | Sim |
| `mime_type` | String | MIME type do arquivo | Sim |
| `s3_bucket` | String | Nome do bucket S3 | Sim |
| `s3_key` | String | Chave do objeto no S3 | Sim |
| `s3_version_id` | String | Versao do objeto S3 | Nao |
| `checksum_sha256` | String | Hash SHA256 do arquivo | Sim |
| `is_encrypted` | Boolean | Arquivo criptografado? | Sim |
| `kms_key_id` | String | ID da chave KMS usada | Nao |
| `upload_status` | String | `pending`, `completed`, `failed` | Sim |
| `uploaded_at` | String | Data do upload | Sim |
| `scanned_at` | String | Data do scan de virus | Nao |
| `scan_result` | String | `clean`, `infected`, `pending` | Nao |

**Indices Secundarios (GSI):**
- `GSI1`: `file_id` (PK) - Busca direta por arquivo

---

### 4. Tabela: `petrobras_otp`

Armazena os codigos OTP para usuarios externos.

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| `PK` | String | `OTP#<email>` | Sim |
| `SK` | String | `CODE#<timestamp>` | Sim |
| `email` | String | Email do destinatario | Sim |
| `code` | String | Codigo de 6 digitos | Sim |
| `attempts` | Number | Tentativas de validacao | Sim |
| `max_attempts` | Number | Maximo de tentativas (3) | Sim |
| `created_at` | String | Quando foi gerado | Sim |
| `expires_at` | String | Quando expira (3 min) | Sim |
| `validated_at` | String | Quando foi validado | Nao |
| `is_valid` | Boolean | Ainda valido? | Sim |
| `ip_address` | String | IP de quem solicitou | Nao |
| `user_agent` | String | Browser/device info | Nao |

**TTL:** `expires_at` - Auto-delete apos expiracao

---

### 5. Tabela: `petrobras_sessions`

Armazena as sessoes ativas dos usuarios.

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| `PK` | String | `SESSION#<session_id>` | Sim |
| `SK` | String | `USER#<user_id>` | Sim |
| `session_id` | String | UUID da sessao | Sim |
| `user_id` | String | ID do usuario | Sim |
| `user_email` | String | Email do usuario | Sim |
| `user_type` | String | Tipo do usuario | Sim |
| `access_token` | String | Token JWT (criptografado) | Sim |
| `refresh_token` | String | Refresh token | Nao |
| `entra_id_token` | String | Token do Entra ID | Nao |
| `created_at` | String | Inicio da sessao | Sim |
| `expires_at` | String | Expiracao da sessao | Sim |
| `last_activity_at` | String | Ultima atividade | Sim |
| `ip_address` | String | IP do usuario | Nao |
| `user_agent` | String | Browser/device | Nao |
| `is_active` | Boolean | Sessao ativa? | Sim |

**TTL:** `expires_at` - Auto-delete apos expiracao

**Indices Secundarios (GSI):**
- `GSI1`: `user_id` (PK) - Sessoes do usuario

---

### 6. Tabela: `petrobras_audit_logs`

Armazena logs de auditoria de todas as acoes.

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| `PK` | String | `LOG#<YYYY-MM-DD>` | Sim |
| `SK` | String | `<timestamp>#<log_id>` | Sim |
| `log_id` | String | UUID do log | Sim |
| `timestamp` | String | ISO 8601 datetime | Sim |
| `action` | String | Tipo da acao (ver lista abaixo) | Sim |
| `level` | String | `info`, `warning`, `error`, `success` | Sim |
| `user_id` | String | ID do usuario | Sim |
| `user_name` | String | Nome do usuario | Sim |
| `user_email` | String | Email do usuario | Sim |
| `user_type` | String | Tipo do usuario | Sim |
| `user_employee_id` | String | Matricula (se interno) | Nao |
| `target_id` | String | ID do objeto afetado | Nao |
| `target_name` | String | Nome do objeto | Nao |
| `target_type` | String | `share`, `file`, `user`, `session` | Nao |
| `description` | String | Descricao da acao | Sim |
| `ip_address` | String | IP do usuario | Nao |
| `user_agent` | String | Browser/device | Nao |
| `metadata` | Map | Dados adicionais em JSON | Nao |

**Acoes possiveis:**
- `login`, `logout`, `login_failed`
- `upload`, `download`
- `approve`, `reject`, `cancel`
- `expiration_change`
- `otp_generate`, `otp_validate`, `otp_expired`, `otp_max_attempts`
- `terms_accepted`
- `file_expired`
- `session_created`, `session_expired`

**Indices Secundarios (GSI):**
- `GSI1`: `user_id` (PK), `timestamp` (SK) - Logs do usuario
- `GSI2`: `action` (PK), `timestamp` (SK) - Filtrar por acao
- `GSI3`: `target_id` (PK), `timestamp` (SK) - Logs do objeto

---

### 7. Tabela: `petrobras_notifications`

Armazena notificacoes dos usuarios.

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| `PK` | String | `USER#<user_id>` | Sim |
| `SK` | String | `NOTIF#<timestamp>#<notif_id>` | Sim |
| `notification_id` | String | UUID da notificacao | Sim |
| `user_id` | String | ID do destinatario | Sim |
| `type` | String | `approval`, `success`, `error`, `info`, `warning` | Sim |
| `priority` | String | `low`, `medium`, `high` | Sim |
| `title` | String | Titulo da notificacao | Sim |
| `message` | String | Mensagem completa | Sim |
| `action_label` | String | Texto do botao de acao | Nao |
| `action_url` | String | URL do botao de acao | Nao |
| `read` | Boolean | Foi lida? | Sim |
| `read_at` | String | Quando foi lida | Nao |
| `created_at` | String | Data de criacao | Sim |

**Indices Secundarios (GSI):**
- `GSI1`: `user_id` (PK), `read` (SK) - Nao lidas do usuario

---

### 8. Tabela: `petrobras_expiration_logs`

Historico de alteracoes de expiracao.

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| `PK` | String | `SHARE#<share_id>` | Sim |
| `SK` | String | `EXPLOG#<timestamp>` | Sim |
| `share_id` | String | ID do compartilhamento | Sim |
| `changed_by` | String | Quem alterou | Sim |
| `changed_by_email` | String | Email de quem alterou | Sim |
| `previous_value` | Number | Valor anterior (horas) | Nao |
| `new_value` | Number | Novo valor (horas) | Sim |
| `reason` | String | Motivo da alteracao | Nao |
| `timestamp` | String | Data/hora da alteracao | Sim |

---

### 9. Tabela: `petrobras_emails`

Historico de emails enviados.

| Campo | Tipo | Descricao | Obrigatorio |
|-------|------|-----------|-------------|
| `PK` | String | `EMAIL#<YYYY-MM-DD>` | Sim |
| `SK` | String | `<timestamp>#<email_id>` | Sim |
| `email_id` | String | UUID do email | Sim |
| `message_id` | String | ID do SES | Nao |
| `type` | String | `otp`, `supervisor`, `confirmation`, `recipient` | Sim |
| `to_email` | String | Destinatario | Sim |
| `to_name` | String | Nome do destinatario | Nao |
| `from_email` | String | Remetente | Sim |
| `subject` | String | Assunto | Sim |
| `status` | String | `pending`, `sent`, `delivered`, `failed`, `bounced` | Sim |
| `sent_at` | String | Quando foi enviado | Nao |
| `delivered_at` | String | Quando foi entregue | Nao |
| `error_message` | String | Mensagem de erro | Nao |
| `related_share_id` | String | ID do share relacionado | Nao |
| `metadata` | Map | Dados adicionais | Nao |

---

## Configuracao AWS

### Arquivo: `back-end/python/app/core/aws_config.py`

```python
# Configuracoes AWS para DynamoDB
AWS_REGION = "sa-east-1"  # Sao Paulo

# Nomes das tabelas
DYNAMODB_TABLES = {
    "users": "petrobras_users",
    "shares": "petrobras_shares",
    "files": "petrobras_files",
    "otp": "petrobras_otp",
    "sessions": "petrobras_sessions",
    "audit_logs": "petrobras_audit_logs",
    "notifications": "petrobras_notifications",
    "expiration_logs": "petrobras_expiration_logs",
    "emails": "petrobras_emails",
}

# Bucket S3 para arquivos
S3_BUCKET = "petrobras-secure-files"
S3_BUCKET_REGION = "sa-east-1"

# Configuracoes SES
SES_SENDER_EMAIL = "noreply@petrobras.com.br"
SES_SENDER_NAME = "Petrobras - Compartilhamento Seguro"

# Configuracoes de expiracao
OTP_EXPIRATION_SECONDS = 180  # 3 minutos
OTP_MAX_ATTEMPTS = 3
SESSION_EXPIRATION_HOURS = 8  # Interno/Supervisor
EXTERNAL_SESSION_EXPIRATION_HOURS = 2  # Externo
```

### Variaves de Ambiente Necessarias

```bash
# AWS
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=<sua_chave>
AWS_SECRET_ACCESS_KEY=<sua_secret>

# DynamoDB (opcional se usar IAM roles)
DYNAMODB_ENDPOINT=<local ou vazio para AWS>

# S3
S3_BUCKET=petrobras-secure-files

# SES
SES_SENDER_EMAIL=noreply@petrobras.com.br

# Microsoft Entra ID
ENTRA_TENANT_ID=<tenant_id>
ENTRA_CLIENT_ID=<client_id>
ENTRA_CLIENT_SECRET=<client_secret>

# JWT
JWT_SECRET_KEY=<chave_secreta_forte>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=8

# Aplicacao
APP_URL=https://compartilhamento.petrobras.com.br
API_URL=https://api.compartilhamento.petrobras.com.br
```

---

## Correspondencia Frontend -> Backend

| Componente Frontend | Tabela DynamoDB | Operacao |
|--------------------|-----------------|----------|
| `auth-store.ts` (setAuth) | `petrobras_users`, `petrobras_sessions` | Create/Update |
| `auth-store.ts` (clearAuth) | `petrobras_sessions` | Delete |
| `workflow-store.ts` (addUpload) | `petrobras_shares`, `petrobras_files` | Create |
| `workflow-store.ts` (approveUpload) | `petrobras_shares` | Update |
| `workflow-store.ts` (rejectUpload) | `petrobras_shares` | Update |
| `workflow-store.ts` (cancelUpload) | `petrobras_shares` | Update |
| `workflow-store.ts` (updateExpiration) | `petrobras_shares`, `petrobras_expiration_logs` | Update/Create |
| `otp-service.ts` (generateOTP) | `petrobras_otp` | Create |
| `otp-service.ts` (validateOTP) | `petrobras_otp` | Update |
| `audit-log-store.ts` (addLog) | `petrobras_audit_logs` | Create |
| `notification-store.ts` (addNotification) | `petrobras_notifications` | Create |

---

## Proximos Passos

1. **Criar tabelas no DynamoDB** - Script de criacao em `back-end/python/scripts/create_tables.py`
2. **Configurar IAM Roles** - Permissoes para acesso seguro
3. **Configurar S3** - Bucket com lifecycle policies
4. **Configurar SES** - Verificar dominio para envio de emails
5. **Implementar servicos** - DynamoDB client, S3 client, SES client

---

**Versao:** 1.0
**Atualizado:** 20/01/2026
**Autor:** Sistema v0 AI
