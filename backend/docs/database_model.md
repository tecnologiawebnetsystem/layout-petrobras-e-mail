# Modelo de Dados - SCAC

Sistema de Compartilhamento de Arquivos Corporativos (Petrobras)

## Diagrama de Entidade-Relacionamento

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MÓDULO DE USUÁRIOS                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                              USER                                        │    │
│  │─────────────────────────────────────────────────────────────────────────│    │
│  │ PK │ id            │ SERIAL                                             │    │
│  │────┼───────────────┼────────────────────────────────────────────────────│    │
│  │    │ type          │ ENUM (externo, internal)                           │    │
│  │    │ name          │ VARCHAR(255) NOT NULL                              │    │
│  │    │ email         │ VARCHAR(255) NOT NULL UNIQUE                       │    │
│  │    │ phone         │ VARCHAR(20)                                        │    │
│  │    │ department    │ VARCHAR(255)                                       │    │
│  │    │ job_title     │ VARCHAR(255)                                       │    │
│  │    │ employee_id   │ VARCHAR(50)                                        │    │
│  │    │ photo_url     │ VARCHAR(500)                                       │    │
│  │ FK │ manager_id    │ INTEGER → user.id (auto-referência)                │    │
│  │    │ is_supervisor │ BOOLEAN DEFAULT false                              │    │
│  │    │ is_admin      │ BOOLEAN DEFAULT false                              │    │
│  │    │ status        │ BOOLEAN DEFAULT true                               │    │
│  │    │ created_at    │ TIMESTAMP WITH TIME ZONE                           │    │
│  │    │ last_login    │ TIMESTAMP WITH TIME ZONE                           │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                          │                                                      │
│                          │ 1:1                                                  │
│                          ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        CREDENTIAL_LOCAL                                  │    │
│  │─────────────────────────────────────────────────────────────────────────│    │
│  │ PK │ id             │ SERIAL                                            │    │
│  │────┼────────────────┼───────────────────────────────────────────────────│    │
│  │ FK │ user_id        │ INTEGER → user.id (UNIQUE)                        │    │
│  │    │ password_hash  │ VARCHAR(255) NOT NULL                             │    │
│  │    │ salt           │ VARCHAR(64) NOT NULL                              │    │
│  │    │ failed_attempts│ INTEGER DEFAULT 0                                 │    │
│  │    │ blocked_until  │ TIMESTAMP WITH TIME ZONE                          │    │
│  │    │ created_at     │ TIMESTAMP WITH TIME ZONE                          │    │
│  │    │ updated_at     │ TIMESTAMP WITH TIME ZONE                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                          MÓDULO DE ARQUIVOS E ÁREAS                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           SHARED_AREA                                    │    │
│  │─────────────────────────────────────────────────────────────────────────│    │
│  │ PK │ id            │ SERIAL                                             │    │
│  │────┼───────────────┼────────────────────────────────────────────────────│    │
│  │    │ name          │ VARCHAR(255) NOT NULL                              │    │
│  │    │ prefix_s3     │ VARCHAR(500) NOT NULL                              │    │
│  │    │ description   │ TEXT                                               │    │
│  │    │ status        │ BOOLEAN DEFAULT true                               │    │
│  │    │ expires_at    │ TIMESTAMP WITH TIME ZONE                           │    │
│  │    │ created_at    │ TIMESTAMP WITH TIME ZONE                           │    │
│  │ FK │ applicant_id  │ INTEGER → user.id                                  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                │                              │                                 │
│                │ 1:N                          │ N:M                             │
│                ▼                              ▼                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │       RESTRICTED_FILE       │  │            AREASUPERVISOR               │  │
│  │─────────────────────────────│  │─────────────────────────────────────────│  │
│  │ PK │ id         │ SERIAL    │  │ PK │ id            │ SERIAL             │  │
│  │────┼────────────┼───────────│  │────┼───────────────┼────────────────────│  │
│  │ FK │ area_id    │ INTEGER   │  │ FK │ area_id       │ INTEGER → area.id  │  │
│  │    │ name       │ VARCHAR   │  │ FK │ supervisor_id │ INTEGER → user.id  │  │
│  │    │ key_s3     │ VARCHAR   │  │    │               │ UNIQUE(area,sup)   │  │
│  │    │ size_bytes │ BIGINT    │  └─────────────────────────────────────────┘  │
│  │    │ mime_type  │ VARCHAR   │                                               │
│  │    │ checksum   │ VARCHAR   │                                               │
│  │ FK │ upload_id  │ INTEGER   │                                               │
│  │    │ expires_at │ TIMESTAMP │                                               │
│  │    │ created_at │ TIMESTAMP │                                               │
│  │    │ status     │ BOOLEAN   │                                               │
│  └─────────────────────────────┘                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                        MÓDULO DE COMPARTILHAMENTOS                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                              SHARE                                       │    │
│  │─────────────────────────────────────────────────────────────────────────│    │
│  │ PK │ id                 │ SERIAL                                        │    │
│  │────┼────────────────────┼───────────────────────────────────────────────│    │
│  │    │ name               │ VARCHAR(255)                                  │    │
│  │    │ description        │ VARCHAR(1000)                                 │    │
│  │ FK │ area_id            │ INTEGER → shared_area.id                      │    │
│  │    │ external_email     │ VARCHAR(255) NOT NULL                         │    │
│  │    │ status             │ ENUM (pendente, aprovado, rejeitado, ...)     │    │
│  │    │ consumption_policy │ ENUM (apos_todos, apos_primeiro)              │    │
│  │    │ expiration_hours   │ INTEGER DEFAULT 72                            │    │
│  │    │ expires_at         │ TIMESTAMP WITH TIME ZONE                      │    │
│  │    │ created_at         │ TIMESTAMP WITH TIME ZONE                      │    │
│  │ FK │ created_by_id      │ INTEGER → user.id (quem criou)                │    │
│  │ FK │ approver_id        │ INTEGER → user.id (quem aprovou/rejeitou)     │    │
│  │    │ approved_at        │ TIMESTAMP WITH TIME ZONE                      │    │
│  │    │ rejected_at        │ TIMESTAMP WITH TIME ZONE                      │    │
│  │    │ rejection_reason   │ VARCHAR(500)                                  │    │
│  │    │ approval_comments  │ VARCHAR(500)                                  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                │                              │                                 │
│                │ N:M                          │ 1:N                             │
│                ▼                              ▼                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │         SHARE_FILE          │  │             TOKEN_ACCESS                │  │
│  │─────────────────────────────│  │─────────────────────────────────────────│  │
│  │ PK │ id           │ SERIAL  │  │ PK │ id            │ SERIAL             │  │
│  │────┼──────────────┼─────────│  │────┼───────────────┼────────────────────│  │
│  │ FK │ share_id     │ INTEGER │  │    │ type          │ ENUM (otp, access) │  │
│  │ FK │ file_id      │ INTEGER │  │    │ token         │ VARCHAR(500)       │  │
│  │    │ downloaded   │ BOOLEAN │  │    │ token_hash    │ VARCHAR(128)       │  │
│  │    │ downloaded_at│ TIMESTAMP│ │ FK │ user_id       │ INTEGER → user.id  │  │
│  │    │              │ UNIQUE   │  │ FK │ share_id      │ INTEGER → share.id │  │
│  │    │              │ (sh,fi)  │  │    │ expires_at    │ TIMESTAMP NOT NULL │  │
│  └─────────────────────────────┘  │    │ created_at    │ TIMESTAMP          │  │
│                                   │    │ used          │ BOOLEAN            │  │
│                                   │    │ attempts      │ INTEGER DEFAULT 0  │  │
│                                   │    │ blocked_until │ TIMESTAMP          │  │
│                                   └─────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                       MÓDULO DE AUDITORIA E LOGS                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                              AUDIT                                       │    │
│  │─────────────────────────────────────────────────────────────────────────│    │
│  │ PK │ id         │ SERIAL                                                │    │
│  │────┼────────────┼───────────────────────────────────────────────────────│    │
│  │    │ action     │ VARCHAR(100) NOT NULL (UPLOAD, DOWNLOAD, APPROVE...)  │    │
│  │    │ level      │ ENUM (info, success, warning, error)                  │    │
│  │ FK │ user_id    │ INTEGER → user.id                                     │    │
│  │ FK │ share_id   │ INTEGER → share.id                                    │    │
│  │ FK │ file_id    │ INTEGER → restricted_file.id                          │    │
│  │    │ ip_address │ VARCHAR(45)                                           │    │
│  │    │ user_agent │ VARCHAR(500)                                          │    │
│  │    │ created_at │ TIMESTAMP WITH TIME ZONE                              │    │
│  │    │ detail     │ TEXT (JSON)                                           │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           EMAIL_LOG                                      │    │
│  │─────────────────────────────────────────────────────────────────────────│    │
│  │ PK │ id           │ SERIAL                                              │    │
│  │────┼──────────────┼─────────────────────────────────────────────────────│    │
│  │    │ message_id   │ VARCHAR(255) NOT NULL UNIQUE (SES ID)               │    │
│  │    │ email_type   │ ENUM (otp_verification, share_notification, ...)    │    │
│  │    │ from_email   │ VARCHAR(255) NOT NULL                               │    │
│  │    │ to_email     │ VARCHAR(255) NOT NULL                               │    │
│  │    │ subject      │ VARCHAR(500) NOT NULL                               │    │
│  │    │ body_preview │ VARCHAR(500)                                        │    │
│  │    │ status       │ ENUM (pending, sent, delivered, bounced, ...)       │    │
│  │    │ sent_at      │ TIMESTAMP                                           │    │
│  │    │ delivered_at │ TIMESTAMP                                           │    │
│  │    │ opened_at    │ TIMESTAMP                                           │    │
│  │    │ error_message│ VARCHAR(1000)                                       │    │
│  │ FK │ user_id      │ INTEGER → user.id                                   │    │
│  │ FK │ share_id     │ INTEGER → share.id                                  │    │
│  │    │ created_at   │ TIMESTAMP WITH TIME ZONE                            │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                      MÓDULO DE NOTIFICAÇÕES E SESSÕES                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │        NOTIFICATION         │  │            SESSION_TOKEN                │  │
│  │─────────────────────────────│  │─────────────────────────────────────────│  │
│  │ PK │ id           │ SERIAL  │  │ PK │ id           │ SERIAL              │  │
│  │────┼──────────────┼─────────│  │────┼──────────────┼─────────────────────│  │
│  │ FK │ user_id      │ INTEGER │  │ FK │ user_id      │ INTEGER → user.id   │  │
│  │    │ type         │ ENUM    │  │    │ token_hash   │ VARCHAR(255)        │  │
│  │    │ priority     │ ENUM    │  │    │ token_type   │ ENUM (refresh,reset)│  │
│  │    │ title        │ VARCHAR │  │    │ expires_at   │ TIMESTAMP NOT NULL  │  │
│  │    │ message      │ VARCHAR │  │    │ created_at   │ TIMESTAMP           │  │
│  │    │ read         │ BOOLEAN │  │    │ used         │ BOOLEAN             │  │
│  │    │ action_label │ VARCHAR │  │    │ revoked      │ BOOLEAN             │  │
│  │    │ action_url   │ VARCHAR │  │    │ ip_address   │ VARCHAR(45)         │  │
│  │    │ extra_metadata│TEXT    │  │    │ user_agent   │ VARCHAR(500)        │  │
│  │    │ created_at   │TIMESTAMP│  │    │ email        │ VARCHAR(255)        │  │
│  └─────────────────────────────┘  └─────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                          MÓDULO DE SUPORTE                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                       SUPPORT_REGISTRATION                               │    │
│  │─────────────────────────────────────────────────────────────────────────│    │
│  │ PK │ id                  │ SERIAL                                       │    │
│  │────┼─────────────────────┼──────────────────────────────────────────────│    │
│  │    │ request_number      │ VARCHAR(50) NOT NULL (Chamado ServiceNow)    │    │
│  │    │ requester_email     │ VARCHAR(255) NOT NULL (Interno solicitante)  │    │
│  │    │ external_user_email │ VARCHAR(255) NOT NULL (Externo cadastrado)   │    │
│  │ FK │ external_user_id    │ INTEGER → user.id                            │    │
│  │ FK │ registered_by_id    │ INTEGER → user.id (Atendente)                │    │
│  │    │ registered_by_name  │ VARCHAR(255) NOT NULL                        │    │
│  │    │ status              │ ENUM (ativo, pendente, inativo, cancelado)   │    │
│  │    │ notes               │ TEXT                                         │    │
│  │    │ created_at          │ TIMESTAMP WITH TIME ZONE                     │    │
│  │    │ updated_at          │ TIMESTAMP WITH TIME ZONE                     │    │
│  │    │ is_reactivation     │ BOOLEAN DEFAULT false                        │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                │                                                                │
│                │ 1:N                                                            │
│                ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         SUPPORT_AUDIT                                    │    │
│  │─────────────────────────────────────────────────────────────────────────│    │
│  │ PK │ id               │ SERIAL                                          │    │
│  │────┼──────────────────┼─────────────────────────────────────────────────│    │
│  │    │ action           │ ENUM (CADASTRO, REATIVACAO, INATIVACAO, ...)    │    │
│  │    │ description      │ VARCHAR(500) NOT NULL                           │    │
│  │    │ details          │ TEXT (JSON)                                     │    │
│  │ FK │ support_user_id  │ INTEGER → user.id (Atendente)                   │    │
│  │ FK │ registration_id  │ INTEGER → support_registration.id               │    │
│  │ FK │ affected_user_id │ INTEGER → user.id (Usuário afetado)             │    │
│  │    │ ip_address       │ VARCHAR(45)                                     │    │
│  │    │ user_agent       │ VARCHAR(500)                                    │    │
│  │    │ created_at       │ TIMESTAMP WITH TIME ZONE                        │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tipos de Usuário

| Tipo | Condição | Descrição | O que pode fazer |
|------|----------|-----------|------------------|
| **Interno** | `type='internal'` AND `is_supervisor=false` AND `is_admin=false` | Funcionário Petrobras comum | Fazer upload, criar compartilhamentos |
| **Externo** | `type='externo'` | Parceiro/fornecedor | Receber e baixar arquivos compartilhados |
| **Supervisor** | `type='internal'` AND `is_supervisor=true` | Gestor de equipe | Aprovar/rejeitar compartilhamentos dos supervisionados |
| **Admin Global** | `type='internal'` AND `is_admin=true` | Super administrador | Ver TUDO do sistema |

---

## ENUMs

| ENUM | Valores | Onde é usado |
|------|---------|--------------|
| `usertype` | `externo`, `internal` | user.type |
| `sharestatus` | `pendente`, `aprovado`, `rejeitado`, `ativo`, `concluido`, `expirado`, `cancelado` | share.status |
| `consumptionpolicy` | `apos_todos`, `apos_primeiro` | share.consumption_policy |
| `tokentype` | `otp`, `access` | token_access.type |
| `auditlevel` | `info`, `success`, `warning`, `error` | audit.level |
| `notificationtype` | `info`, `success`, `warning`, `error`, `approval`, `rejection`, `download`, `expiration` | notification.type |
| `notificationpriority` | `low`, `medium`, `high`, `urgent` | notification.priority |
| `emailstatus` | `pending`, `queued`, `sent`, `delivered`, `opened`, `clicked`, `bounced`, `complained`, `failed` | email_log.status |
| `emailtype` | `otp_verification`, `share_notification`, `share_approved`, `share_rejected`, `download_complete`, `expiration_warning`, `password_reset`, `welcome`, `support_notification` | email_log.email_type |
| `sessiontokentype` | `refresh`, `reset` | session_token.token_type |
| `supportstatus` | `ativo`, `pendente`, `inativo`, `cancelado` | support_registration.status |
| `supportaction` | `CADASTRO`, `REATIVACAO`, `INATIVACAO`, `ALTERACAO`, `CONSULTA` | support_audit.action |

---

## Relacionamentos

| De | Para | Tipo | Descrição |
|----|------|------|-----------|
| user | user | 1:N | Hierarquia gestor→subordinados (manager_id) |
| user | credential_local | 1:1 | Credenciais de externos |
| user | shared_area | 1:N | Áreas criadas pelo usuário |
| shared_area | areasupervisor | 1:N | Supervisores da área |
| shared_area | restricted_file | 1:N | Arquivos da área |
| user | restricted_file | 1:N | Arquivos enviados pelo usuário |
| share | share_file | 1:N | Arquivos do compartilhamento |
| restricted_file | share_file | 1:N | Shares que usam o arquivo |
| share | token_access | 1:N | Tokens do compartilhamento |
| user | audit | 1:N | Logs do usuário |
| user | notification | 1:N | Notificações do usuário |
| user | session_token | 1:N | Sessões do usuário |
| user | email_log | 1:N | Emails enviados para o usuário |
| support_registration | support_audit | 1:N | Histórico do registro |
