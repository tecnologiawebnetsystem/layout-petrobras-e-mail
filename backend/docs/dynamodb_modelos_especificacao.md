# Especificação DynamoDB baseada em `app/models`

Objetivo: descrever as tabelas DynamoDB **exatamente com os campos dos modelos SQLModel** da pasta `app/models`, para implementação pelo desenvolvedor.

## Regras gerais (válidas para todas as tabelas)

- Banco: Amazon DynamoDB
- Estratégia: 1 tabela DynamoDB para cada `__tablename__` dos modelos
- Toda tabela terá chave primária composta:
  - `pk` (Partition Key, tipo `S`)
  - `sk` (Sort Key, tipo `S`)
- Convenção de chave (padrão):
  - `pk = <TABLE_UPPER>#<id>`
  - `sk = METADATA`
- Campos de relacionamento (`foreign_key`) permanecem como atributos comuns (DynamoDB não aplica FK)
- Campos com `index=True` viram GSI
- Campos com `unique=True` viram GSI de busca por igualdade + regra de unicidade na aplicação (ou escrita transacional)
- Datas devem ser armazenadas como string ISO-8601 UTC (compatível com os modelos)
- Booleanos como tipo `BOOL`
- Inteiros como tipo `N`
- Strings como tipo `S`

---

## 1) Tabela `user`

- Chave primária:
  - `pk = USER#<id>`
  - `sk = METADATA`
- Campos:
  - `id` (N, opcional no create)
  - `type` (S) — enum: `externo`, `internal`, `supervisor`
  - `name` (S)
  - `email` (S)
  - `phone` (S, opcional)
  - `department` (S, opcional)
  - `job_title` (S, opcional)
  - `employee_id` (S, opcional)
  - `photo_url` (S, opcional)
  - `manager_id` (N, opcional)
  - `status` (BOOL)
  - `created_at` (S)
  - `last_login` (S, opcional)
- GSIs:
  - `gsi_user_type`: HASH `type`
  - `gsi_user_email`: HASH `email` (usado como único)

## 2) Tabela `shared_area`

- Chave primária:
  - `pk = SHARED_AREA#<id>`
  - `sk = METADATA`
- Campos:
  - `id` (N)
  - `name` (S)
  - `prefix_s3` (S)
  - `description` (S, opcional)
  - `status` (BOOL)
  - `expires_at` (S, opcional)
  - `created_at` (S, opcional)
  - `applicant_id` (N)
- GSIs:
  - `gsi_shared_area_applicant_id`: HASH `applicant_id`

## 3) Tabela `areasupervisor`

- Chave primária:
  - `pk = AREA_SUPERVISOR#<id>`
  - `sk = METADATA`
- Campos:
  - `id` (N)
  - `area_id` (N)
  - `supervisor_id` (N)
- GSIs:
  - `gsi_areasupervisor_area_id`: HASH `area_id`
  - `gsi_areasupervisor_supervisor_id`: HASH `supervisor_id`

## 4) Tabela `restricted_file`

- Chave primária:
  - `pk = RESTRICTED_FILE#<id>`
  - `sk = METADATA`
- Campos:
  - `id` (N)
  - `area_id` (N)
  - `name` (S)
  - `key_s3` (S)
  - `size_bytes` (N, opcional)
  - `mime_type` (S, opcional)
  - `checksum` (S, opcional)
  - `upload_id` (N, opcional)
  - `expires_at` (S, opcional)
  - `created_at` (S, opcional)
  - `status` (BOOL)
- GSIs:
  - `gsi_restricted_file_area_id`: HASH `area_id`

## 5) Tabela `share`

- Chave primária:
  - `pk = SHARE#<id>`
  - `sk = METADATA`
- Campos:
  - `id` (N)
  - `name` (S, opcional)
  - `description` (S, opcional)
  - `area_id` (N, opcional)
  - `external_email` (S)
  - `status` (S) — enum: `pendente`, `ativo`, `aprovado`, `rejeitado`, `concluido`, `expirado`, `cancelado`
  - `consumption_policy` (S) — enum: `apos_todos`, `apos_primeiro`
  - `expiration_hours` (N)
  - `expires_at` (S, opcional)
  - `created_at` (S)
  - `created_by_id` (N)
  - `approver_id` (N, opcional)
  - `approved_at` (S, opcional)
  - `rejected_at` (S, opcional)
  - `rejection_reason` (S, opcional)
  - `approval_comments` (S, opcional)
- GSIs:
  - `gsi_share_area_id`: HASH `area_id`
  - `gsi_share_external_email`: HASH `external_email`
  - `gsi_share_status`: HASH `status`
  - `gsi_share_created_by_id`: HASH `created_by_id`

## 6) Tabela `share_file`

- Chave primária:
  - `pk = SHARE_FILE#<id>`
  - `sk = METADATA`
- Campos:
  - `id` (N)
  - `share_id` (N)
  - `file_id` (N)
  - `downloaded` (BOOL)
  - `downloaded_at` (S, opcional)
- GSIs:
  - `gsi_share_file_share_id`: HASH `share_id`
  - `gsi_share_file_file_id`: HASH `file_id`
  - `gsi_share_file_downloaded`: HASH `downloaded`

## 7) Tabela `token_access`

- Chave primária:
  - `pk = TOKEN_ACCESS#<id>`
  - `sk = METADATA`
- Campos:
  - `id` (N)
  - `type` (S) — enum: `otp`, `access`
  - `token` (S, opcional)
  - `token_hash` (S, opcional)
  - `user_id` (N)
  - `share_id` (N)
  - `expires_at` (S)
  - `created_at` (S)
  - `used` (BOOL)
  - `attempts` (N)
  - `blocked_until` (S, opcional)
- GSIs:
  - `gsi_token_access_type`: HASH `type`
  - `gsi_token_access_token`: HASH `token` (quando preenchido, único)
  - `gsi_token_access_user_id`: HASH `user_id`
  - `gsi_token_access_share_id`: HASH `share_id`
  - `gsi_token_access_used`: HASH `used`
  - `gsi_token_access_attempts`: HASH `attempts`
  - `gsi_token_access_blocked_until`: HASH `blocked_until`

## 8) Tabela `notification`

- Chave primária:
  - `pk = NOTIFICATION#<id>`
  - `sk = METADATA`
- Campos:
  - `id` (N)
  - `user_id` (N)
  - `type` (S) — enum: `info`, `success`, `warning`, `error`, `approval`, `rejection`, `download`, `expiration`
  - `priority` (S) — enum: `low`, `medium`, `high`, `urgent`
  - `title` (S)
  - `message` (S)
  - `read` (BOOL)
  - `action_label` (S, opcional)
  - `action_url` (S, opcional)
  - `extra_metadata` (S, opcional)
  - `created_at` (S)
- GSIs:
  - `gsi_notification_user_id`: HASH `user_id`
  - `gsi_notification_type`: HASH `type`
  - `gsi_notification_read`: HASH `read`

## 9) Tabela `credential_local`

- Chave primária:
  - `pk = CREDENTIAL_LOCAL#<id>`
  - `sk = METADATA`
- Campos:
  - `id` (N)
  - `user_id` (N)
  - `password_hash` (S)
  - `salt` (S)
  - `failed_attempts` (N)
  - `blocked_until` (S, opcional)
  - `created_at` (S)
  - `updated_at` (S, opcional)
- GSIs:
  - `gsi_credential_local_user_id`: HASH `user_id`
  - `gsi_credential_local_failed_attempts`: HASH `failed_attempts`
  - `gsi_credential_local_blocked_until`: HASH `blocked_until`

## 10) Tabela `email_log`

- Chave primária:
  - `pk = EMAIL_LOG#<id>`
  - `sk = METADATA`
- Campos:
  - `id` (N)
  - `message_id` (S)
  - `email_type` (S) — enum: `file_share`, `otp`, `approval_request`, `approval_granted`, `approval_rejected`, `expiration_warning`, `download_confirmation`, `password_reset`, `welcome`, `system`
  - `from_email` (S)
  - `to_email` (S)
  - `subject` (S)
  - `body_preview` (S, opcional)
  - `status` (S) — enum: `pending`, `queued`, `sent`, `delivered`, `opened`, `clicked`, `bounced`, `complained`, `failed`
  - `sent_at` (S, opcional)
  - `delivered_at` (S, opcional)
  - `opened_at` (S, opcional)
  - `clicked_at` (S, opcional)
  - `bounced_at` (S, opcional)
  - `error_message` (S, opcional)
  - `error_code` (S, opcional)
  - `user_id` (N, opcional)
  - `share_id` (N, opcional)
  - `created_at` (S)
  - `updated_at` (S, opcional)
  - `extra_metadata` (S, opcional)
- GSIs:
  - `gsi_email_log_message_id`: HASH `message_id` (único)
  - `gsi_email_log_email_type`: HASH `email_type`
  - `gsi_email_log_to_email`: HASH `to_email`
  - `gsi_email_log_status`: HASH `status`
  - `gsi_email_log_user_id`: HASH `user_id`
  - `gsi_email_log_share_id`: HASH `share_id`

## 11) Tabela `audit`

- Chave primária:
  - `pk = AUDIT#<id>`
  - `sk = METADATA`
- Campos:
  - `id` (N)
  - `action` (S)
  - `level` (S) — enum: `info`, `success`, `warning`, `error`
  - `user_id` (N, opcional)
  - `share_id` (N, opcional)
  - `file_id` (N, opcional)
  - `ip_address` (S, opcional)
  - `user_agent` (S, opcional)
  - `created_at` (S)
  - `detail` (S, opcional)
- GSIs:
  - `gsi_audit_level`: HASH `level`
  - `gsi_audit_user_id`: HASH `user_id`
  - `gsi_audit_share_id`: HASH `share_id`
  - `gsi_audit_file_id`: HASH `file_id`

## 12) Tabela `session_token`

- Chave primária:
  - `pk = SESSION_TOKEN#<id>`
  - `sk = METADATA`
- Campos:
  - `id` (N)
  - `user_id` (N)
  - `token_hash` (S)
  - `token_type` (S) — enum: `refresh`, `reset`
  - `expires_at` (S)
  - `created_at` (S)
  - `used` (BOOL)
  - `revoked` (BOOL)
  - `ip_address` (S, opcional)
  - `user_agent` (S, opcional)
  - `email` (S, opcional)
- GSIs:
  - `gsi_session_token_user_id`: HASH `user_id`
  - `gsi_session_token_token_hash`: HASH `token_hash`
  - `gsi_session_token_token_type`: HASH `token_type`

---

## Relações entre tabelas (referências lógicas)

- `shared_area.applicant_id -> user.id`
- `areasupervisor.area_id -> shared_area.id`
- `areasupervisor.supervisor_id -> user.id`
- `restricted_file.area_id -> shared_area.id`
- `restricted_file.upload_id -> user.id`
- `share.area_id -> shared_area.id`
- `share.created_by_id -> user.id`
- `share.approver_id -> user.id`
- `share_file.share_id -> share.id`
- `share_file.file_id -> restricted_file.id`
- `token_access.user_id -> user.id`
- `token_access.share_id -> share.id`
- `notification.user_id -> user.id`
- `credential_local.user_id -> user.id`
- `email_log.user_id -> user.id`
- `email_log.share_id -> share.id`
- `audit.user_id -> user.id`
- `audit.share_id -> share.id`
- `audit.file_id -> restricted_file.id`
- `session_token.user_id -> user.id`

## Observações finais para implementação

- Este documento **não** replica os nomes/campos dos scripts atuais de `AWS/dynamodb`; ele segue estritamente os modelos em `app/models`.
- Se quiser alta performance por padrão de consulta (ex.: timeline por usuário, listas por área com ordenação temporal), pode-se evoluir para chaves compostas orientadas a acesso, mantendo os mesmos campos de domínio acima.
