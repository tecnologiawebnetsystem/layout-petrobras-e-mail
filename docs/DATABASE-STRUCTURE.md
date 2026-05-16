# Estrutura do Banco de Dados - CSA (Compartilhamento Seguro de Arquivos)

**Atualizado em:** 25/04/2026  
**Banco:** PostgreSQL 14+ (Neon)  
**Total de Tabelas:** 21

---

## Diagrama de Relacionamentos

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USUARIOS E AUTENTICACAO                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐           │
│  │    user      │────▶│ credential_local  │     │  session_token   │           │
│  │              │     └───────────────────┘     └──────────────────┘           │
│  │ - externo    │                                                               │
│  │ - internal   │     ┌───────────────────┐                                     │
│  │ - supervisor │────▶│   notification    │                                     │
│  │ - support    │     └───────────────────┘                                     │
│  └──────────────┘                                                               │
│         │                                                                       │
└─────────┼───────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            AREAS E COMPARTILHAMENTOS                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐           │
│  │ shared_area  │◀───▶│  areasupervisor   │◀────│      user        │           │
│  │              │     └───────────────────┘     │   (supervisor)   │           │
│  └──────┬───────┘                               └──────────────────┘           │
│         │                                                                       │
│         ▼                                                                       │
│  ┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐           │
│  │    share     │────▶│    share_file     │◀────│ restricted_file  │           │
│  │              │     └───────────────────┘     └──────────────────┘           │
│  └──────┬───────┘                                                               │
│         │                                                                       │
│         ▼                                                                       │
│  ┌──────────────┐                                                               │
│  │ token_access │                                                               │
│  │  (OTP/Link)  │                                                               │
│  └──────────────┘                                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SUPORTE E CADASTROS                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌────────────────────┐     ┌───────────────────┐                               │
│  │ support_registration│────▶│   support_audit   │                               │
│  │                    │     └───────────────────┘                               │
│  │ - request_number   │                                                         │
│  │ - requester_email  │                                                         │
│  │ - external_email   │                                                         │
│  └────────────────────┘                                                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AUDITORIA E COMUNICACAO                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐     ┌───────────────────┐                                     │
│  │    audit     │     │     email_log     │                                     │
│  │              │     │                   │                                     │
│  │ - action     │     │ - message_id      │                                     │
│  │ - level      │     │ - status          │                                     │
│  │ - detail     │     │ - email_type      │                                     │
│  └──────────────┘     └───────────────────┘                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tipos Enumerados (ENUMs)

### typeuser / type_user
Tipos de usuarios do sistema:
- `externo` - Usuario externo (terceiros, parceiros)
- `internal` - Usuario interno (colaborador Petrobras)
- `supervisor` - Usuario interno com permissao de aprovacao (deprecado, usar is_supervisor)
- `support` - Atendente de suporte

### sharestatus / share_status
Status do ciclo de vida de um compartilhamento:
- `pendente` - Aguardando aprovacao do supervisor
- `ativo` - Aprovado e disponivel para download
- `aprovado` - Aprovado pelo supervisor
- `rejeitado` - Rejeitado pelo supervisor
- `concluido` - Todos os arquivos foram baixados
- `expirado` - Passou da data de expiracao
- `cancelado` - Cancelado pelo criador

### typelevel / type_level
Niveis de severidade para auditoria:
- `info` - Informativo
- `success` - Sucesso
- `warning` - Aviso
- `error` - Erro

### emailstatus / email_status
Status de entrega de e-mail (AWS SES):
- `pending` - Aguardando envio
- `queued` - Na fila de envio
- `sent` - Enviado
- `delivered` - Entregue
- `opened` - Aberto pelo destinatario
- `clicked` - Link clicado
- `bounced` - Rejeitado
- `complained` - Marcado como spam
- `failed` - Falha no envio

### emailtype / email_type_enum
Tipos de e-mail enviados:
- `file_share` - Notificacao de compartilhamento
- `otp` - Codigo de verificacao
- `approval_request` - Solicitacao de aprovacao
- `approval_granted` - Aprovacao concedida
- `approval_rejected` - Aprovacao rejeitada
- `expiration_warning` - Aviso de expiracao
- `download_confirmation` - Confirmacao de download
- `password_reset` - Reset de senha
- `welcome` - Boas-vindas
- `system` - Sistema

### notificationtype / notification_type
Tipos de notificacao interna:
- `info`, `success`, `warning`, `error`
- `approval`, `rejection`, `download`, `expiration`

### notificationpriority / notification_priority
Prioridade da notificacao:
- `low`, `medium`, `high`, `urgent`

### tokenconsumption / token_consumption
Politica de consumo do token:
- `apos_todos` - Expira apos todos os arquivos baixados
- `apos_primeiro` - Expira apos o primeiro download

### typetoken / type_token
Tipo de token de acesso:
- `otp` - Codigo OTP de 6 digitos
- `access` - Token de acesso ao link

---

## Tabelas

### 1. user
Usuarios do sistema (internos e externos).

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| id | SERIAL | PK | Identificador unico |
| type | typeuser | Sim | Tipo de usuario |
| name | VARCHAR(255) | Sim | Nome completo |
| email | VARCHAR(255) | Sim | Email (unico) |
| phone | VARCHAR(20) | Nao | Telefone |
| department | VARCHAR(255) | Nao | Departamento |
| job_title | VARCHAR(255) | Nao | Cargo |
| employee_id | VARCHAR(50) | Nao | Matricula |
| photo_url | VARCHAR(500) | Nao | URL da foto |
| manager_id | INTEGER | FK | Gestor imediato |
| is_supervisor | BOOLEAN | Sim | Se e supervisor |
| status | BOOLEAN | Sim | Ativo/Inativo |
| created_at | TIMESTAMPTZ | Sim | Data de criacao |
| last_login | TIMESTAMPTZ | Nao | Ultimo login |

---

### 2. credential_local
Credenciais de senha para autenticacao local.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| id | SERIAL | PK | Identificador unico |
| user_id | INTEGER | FK | Usuario |
| password_hash | VARCHAR(64) | Sim | Hash da senha |
| salt | VARCHAR(32) | Sim | Salt para hash |
| failed_attempts | INTEGER | Sim | Tentativas falhas |
| blocked_until | TIMESTAMPTZ | Nao | Bloqueado ate |
| created_at | TIMESTAMPTZ | Sim | Data de criacao |
| updated_at | TIMESTAMPTZ | Nao | Ultima atualizacao |

---

### 3. session_token
Tokens de sessao (refresh/reset).

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| id | SERIAL | PK | Identificador unico |
| user_id | INTEGER | FK | Usuario |
| token_hash | VARCHAR(512) | Sim | Hash do token |
| token_type | VARCHAR | Sim | refresh/reset |
| expires_at | TIMESTAMPTZ | Sim | Expiracao |
| created_at | TIMESTAMPTZ | Sim | Data de criacao |
| used | BOOLEAN | Sim | Se foi usado |
| revoked | BOOLEAN | Sim | Se foi revogado |
| ip_address | VARCHAR(45) | Nao | IP de origem |
| user_agent | VARCHAR(500) | Nao | User agent |
| email | VARCHAR(255) | Nao | Email associado |

---

### 4. shared_area
Areas de compartilhamento no S3.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| id | SERIAL | PK | Identificador unico |
| name | VARCHAR(255) | Sim | Nome da area |
| prefix_s3 | VARCHAR(500) | Sim | Prefixo no S3 |
| description | TEXT | Nao | Descricao |
| status | BOOLEAN | Sim | Ativo/Inativo |
| expires_at | TIMESTAMPTZ | Nao | Expiracao |
| created_at | TIMESTAMPTZ | Sim | Data de criacao |
| applicant_id | INTEGER | FK | Solicitante |

---

### 5. areasupervisor
Relacao N:N entre areas e supervisores.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| id | SERIAL | PK | Identificador unico |
| area_id | INTEGER | FK | Area |
| supervisor_id | INTEGER | FK | Supervisor |

---

### 6. restricted_file
Arquivos restritos armazenados no S3.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| id | SERIAL | PK | Identificador unico |
| area_id | INTEGER | FK | Area |
| name | VARCHAR(255) | Sim | Nome do arquivo |
| key_s3 | VARCHAR(1000) | Sim | Chave no S3 |
| size_bytes | BIGINT | Nao | Tamanho em bytes |
| mime_type | VARCHAR(127) | Nao | Tipo MIME |
| checksum | VARCHAR(128) | Nao | Hash de verificacao |
| upload_id | INTEGER | FK | Quem fez upload |
| expires_at | TIMESTAMPTZ | Nao | Expiracao |
| created_at | TIMESTAMPTZ | Sim | Data de criacao |
| status | BOOLEAN | Sim | Ativo/Inativo |

---

### 7. share
Compartilhamentos de arquivos.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| id | SERIAL | PK | Identificador unico |
| name | VARCHAR(255) | Nao | Nome |
| description | VARCHAR(1000) | Nao | Descricao |
| area_id | INTEGER | FK | Area |
| external_email | VARCHAR(255) | Sim | Email destinatario |
| status | sharestatus | Sim | Status atual |
| consumption_policy | tokenconsumption | Sim | Politica |
| expiration_hours | INTEGER | Sim | Horas de validade |
| expires_at | TIMESTAMPTZ | Nao | Data de expiracao |
| created_at | TIMESTAMPTZ | Sim | Data de criacao |
| created_by_id | INTEGER | FK | Criador |
| approver_id | INTEGER | FK | Aprovador |
| approved_at | TIMESTAMPTZ | Nao | Data aprovacao |
| rejected_at | TIMESTAMPTZ | Nao | Data rejeicao |
| rejection_reason | VARCHAR(500) | Nao | Motivo rejeicao |
| approval_comments | VARCHAR(500) | Nao | Comentarios |

---

### 8. share_file
Relacao N:N entre compartilhamentos e arquivos.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| id | SERIAL | PK | Identificador unico |
| share_id | INTEGER | FK | Compartilhamento |
| file_id | INTEGER | FK | Arquivo |
| downloaded | BOOLEAN | Sim | Se foi baixado |
| downloaded_at | TIMESTAMPTZ | Nao | Data do download |

---

### 9. token_access
Tokens de acesso (OTP e links).

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| id | SERIAL | PK | Identificador unico |
| type | typetoken | Sim | OTP ou Access |
| token | VARCHAR(512) | Nao | Token (link) |
| token_hash | VARCHAR(512) | Nao | Hash (OTP) |
| user_id | INTEGER | FK | Usuario |
| share_id | INTEGER | FK | Compartilhamento |
| expires_at | TIMESTAMPTZ | Sim | Expiracao |
| created_at | TIMESTAMPTZ | Sim | Data de criacao |
| used | BOOLEAN | Sim | Se foi usado |
| attempts | INTEGER | Sim | Tentativas |
| blocked_until | TIMESTAMPTZ | Nao | Bloqueado ate |

---

### 10. audit
Logs de auditoria do sistema.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| id | SERIAL | PK | Identificador unico |
| action | VARCHAR(100) | Sim | Acao realizada |
| level | typelevel | Sim | Nivel |
| user_id | INTEGER | FK | Usuario |
| share_id | INTEGER | FK | Compartilhamento |
| file_id | INTEGER | FK | Arquivo |
| ip_address | VARCHAR(45) | Nao | IP de origem |
| user_agent | TEXT | Nao | User agent |
| created_at | TIMESTAMPTZ | Sim | Data/hora |
| detail | TEXT | Nao | Detalhes (JSON) |

---

### 11. notification
Notificacoes internas dos usuarios.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| id | SERIAL | PK | Identificador unico |
| user_id | INTEGER | FK | Usuario |
| type | notificationtype | Sim | Tipo |
| priority | notificationpriority | Sim | Prioridade |
| title | VARCHAR(255) | Sim | Titulo |
| message | VARCHAR(1000) | Sim | Mensagem |
| read | BOOLEAN | Sim | Se foi lida |
| action_label | VARCHAR(100) | Nao | Label do botao |
| action_url | VARCHAR(500) | Nao | URL da acao |
| extra_metadata | TEXT | Nao | Metadados (JSON) |
| created_at | TIMESTAMPTZ | Sim | Data de criacao |

---

### 12. email_log
Rastreamento de e-mails enviados.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| id | SERIAL | PK | Identificador unico |
| message_id | VARCHAR(255) | Sim | ID do SES |
| email_type | emailtype | Sim | Tipo de email |
| from_email | VARCHAR(255) | Sim | Remetente |
| to_email | VARCHAR(255) | Sim | Destinatario |
| subject | VARCHAR(500) | Sim | Assunto |
| body_preview | VARCHAR(500) | Nao | Preview do corpo |
| status | emailstatus | Sim | Status atual |
| sent_at | TIMESTAMPTZ | Nao | Data envio |
| delivered_at | TIMESTAMPTZ | Nao | Data entrega |
| opened_at | TIMESTAMPTZ | Nao | Data abertura |
| clicked_at | TIMESTAMPTZ | Nao | Data clique |
| bounced_at | TIMESTAMPTZ | Nao | Data bounce |
| error_message | VARCHAR(1000) | Nao | Msg de erro |
| error_code | VARCHAR(50) | Nao | Codigo de erro |
| user_id | INTEGER | FK | Usuario |
| share_id | INTEGER | FK | Compartilhamento |
| created_at | TIMESTAMPTZ | Sim | Data de criacao |
| updated_at | TIMESTAMPTZ | Nao | Ultima atualizacao |
| extra_metadata | TEXT | Nao | Metadados (JSON) |

---

### 13. support_registration (NOVA)
Registros de cadastros feitos pelo suporte.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| id | SERIAL | PK | Identificador unico |
| request_number | VARCHAR(50) | Sim | Numero da solicitacao |
| requester_email | VARCHAR(255) | Sim | Email do solicitante |
| external_user_email | VARCHAR(255) | Sim | Email do usuario externo |
| external_user_id | INTEGER | FK | Usuario criado |
| registered_by_id | INTEGER | FK | Atendente |
| registered_by_name | VARCHAR(255) | Sim | Nome do atendente |
| status | VARCHAR(20) | Sim | ativo/pendente/inativo/cancelado |
| notes | TEXT | Nao | Observacoes |
| created_at | TIMESTAMPTZ | Sim | Data de criacao |
| updated_at | TIMESTAMPTZ | Nao | Ultima atualizacao |
| is_reactivation | BOOLEAN | Sim | Se foi reativacao |

---

### 14. support_audit (NOVA)
Auditoria de acoes do suporte.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| id | SERIAL | PK | Identificador unico |
| action | VARCHAR(50) | Sim | CADASTRO/REATIVACAO/INATIVACAO/ALTERACAO/CONSULTA |
| description | VARCHAR(500) | Sim | Descricao da acao |
| details | TEXT | Nao | Detalhes (JSON) |
| support_user_id | INTEGER | FK | Atendente |
| registration_id | INTEGER | FK | Registro relacionado |
| affected_user_id | INTEGER | FK | Usuario afetado |
| ip_address | VARCHAR(45) | Nao | IP de origem |
| user_agent | VARCHAR(500) | Nao | User agent |
| created_at | TIMESTAMPTZ | Sim | Data/hora |

---

### Tabelas de Roadmap (Auxiliares)

- **roadmap_fases** - Fases do roadmap do projeto
- **roadmap_entregas** - Entregas dentro de cada fase
- **roadmap_marcos** - Marcos importantes
- **roadmap_burndown** - Dados do burndown chart
- **roadmap_config** - Configuracoes do roadmap
- **roadmap_fase_dependencias** - Dependencias entre fases
- **roadmap_entrega_dependencias** - Dependencias entre entregas

---

## Scripts de Migracao

| Script | Descricao |
|--------|-----------|
| 001-create-tables.sql | Tabelas iniciais do frontend |
| 001_create_session_token.sql | Tabela de tokens de sessao |
| 002-create-indexes.sql | Indices para performance |
| 003-seed-data.sql | Dados iniciais |
| 004-drop-incompatible-tables.sql | Limpeza de tabelas incompativeis |
| 005-create-python-tables.sql | Tabelas do backend Python |
| 006-seed-python-data.sql | Dados do backend Python |
| 007-add-support-tables.sql | **NOVA** - Tabelas de suporte |
| roadmap-migration.sql | Migracao das tabelas de roadmap |
| roadmap-seed.sql | Dados do roadmap |

---

## Arquivo Principal

O arquivo `backend/sql/create_database.sql` contem o schema completo e atualizado, podendo ser usado para criar um banco do zero.

---

## Comandos Uteis

```sql
-- Listar todas as tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Verificar estrutura de uma tabela
\d+ nome_da_tabela

-- Verificar usuarios por tipo
SELECT type, COUNT(*) FROM "user" GROUP BY type;

-- Verificar compartilhamentos por status
SELECT status, COUNT(*) FROM share GROUP BY status;

-- Verificar registros de suporte
SELECT * FROM support_registration ORDER BY created_at DESC LIMIT 10;
```
