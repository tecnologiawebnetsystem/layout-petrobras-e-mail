# CSA-Backend — Mapa do Sistema Atual

> **Data de referência:** 2026-06-30  
> **Versão da API:** 2.0.0 · FastAPI 0.120 · SQLModel · Python 3.13  
> **Objetivo:** Documentar fielmente a estrutura real do projeto, sem aspirações futuras.

---

## 1. Estrutura de Pastas

```
csa-backend/
│
├── app/
│   ├── main.py                        ← App factory, CORS, startup, include_router
│   │
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── routes_admin.py        ← /admin/** (require_admin)
│   │       ├── routes_areas.py        ← /areas/**
│   │       ├── routes_audit.py        ← /audit/**
│   │       ├── routes_auth.py         ← /auth/** (login/logout/refresh/forgot/reset)
│   │       ├── routes_download.py     ← /download/** (OTP externo)
│   │       ├── routes_emails.py       ← /emails/**
│   │       ├── routes_cav4_auth.py    ← /auth/cav4/** (OIDC CAv4)
│   │       ├── routes_external.py     ← /external/** (logout + list-files externo)
│   │       ├── routes_external_auth.py← /auth/external/** (request-code + verify-code)
│   │       ├── routes_files.py        ← /files/**
│   │       ├── routes_internal_auth.py← /auth/internal/** (signup local + login local)
│   │       ├── routes_notifications.py← /notifications/**
│   │       ├── routes_shares.py       ← /shares/**
│   │       ├── routes_supervisor.py   ← /supervisor/** (require_supervisor)
│   │       ├── routes_support.py      ← /support/**
│   │       └── routes_users.py        ← /users/**
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── aws_utils.py               ← presigned upload/download S3, Secrets Manager
│   │   ├── config.py                  ← Settings via pydantic-settings (all env vars)
│   │   ├── scheduler.py               ← (arquivo vazio — não implementado)
│   │   └── security.py                ← (stub — 1 linha de comentário)
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py                    ← imports de todos os models para create_all
│   │   ├── init_db.py                 ← SQLModel.metadata.create_all(engine)
│   │   └── session.py                 ← engine + get_session() via Depends
│   │
│   ├── deps/
│   │   └── external_auth.py           ← ExternalAccessContext + get_external_access_context()
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── area.py                    ← SharedArea
│   │   ├── areasupervisors.py         ← AreaSupervisor (pivot área ↔ supervisor)
│   │   ├── audit.py                   ← Audit + TypeLevel
│   │   ├── credencial_local.py        ← CredentialLocal (bcrypt para AUTH_MODE=local)
│   │   ├── email_log.py               ← EmailLog + EmailStatus + EmailType
│   │   ├── notification.py            ← Notification + NotificationType + NotificationPriority
│   │   ├── restricted_file.py         ← RestrictedFile (arquivo armazenado no S3)
│   │   ├── session_token.py           ← SessionToken (refresh + reset — armazenados hasheados)
│   │   ├── share.py                   ← Share + ShareStatus + TokenConsumption
│   │   ├── share_file.py              ← ShareFile (pivot share ↔ arquivo)
│   │   ├── support_audit.py           ← SupportAudit + SupportAction
│   │   ├── support_registration.py    ← SupportRegistration + SupportRegistrationStatus
│   │   ├── token_access.py            ← TokenAccess + TypeToken (OTP + ACCESS)
│   │   └── user.py                    ← User + TypeUser
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── area_schema.py             ← AreaCreate, AreaRead
│   │   ├── file_schema.py             ← FileCreate, FileRead
│   │   ├── share_schema.py            ← ShareCreate, ShareRead
│   │   ├── token_schema.py            ← TokenRead
│   │   └── user_schema.py             ← UserCreate, UserRead, UserUpdate
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── audit_service.py           ← log_event(), log_action()
│   │   ├── auth_service.py            ← issue_internal_tokens, resolve_primary_role,
│   │   │                                  sync_user_from_access (provisionamento + vínculo gestor)
│   │   ├── cav4_auth_service.py       ← OIDC CAv4, roles API, add/remove role com fallback
│   │   ├── email_service.py           ← send_*_email() (SMTP interno / SES)
│   │   ├── file_service.py            ← generate_download_url()
│   │   ├── graph_service.py           ← enrich_graph_profile_by_upn (cargo/departamento/gestor/foto)
│   │   ├── local_auth_service.py      ← dev_signup, dev_set_password, login (AUTH_MODE=local)
│   │   ├── s3_service.py              ← get_s3_client, build_upload_key, sanitize_filename,
│   │   │                                  delete_object, get_s3_object_stream,
│   │   │                                  generate_presigned_get, S3_BUCKET
│   │   ├── share_service.py           ← create_share, get_or_create_external_user,
│   │   │                                  list_share_files, ShareError, S3UploadError
│   │   ├── task_service.py            ← expiração de shares, limpeza S3, desativação de usuários
│   │   └── token_service.py           ← issue_otp, verify_otp, issue_token_access,
│   │                                       get_token_access, validate_token_access,
│   │                                       consume_token, regras de desativação e remoção de role CAv4
│   │
│   └── utils/
│       ├── __init__.py
│       ├── authz.py                   ← get_current_user, require_supervisor, require_admin,
│       │                                  require_internal (todos usam decode_app_jwt)
│       ├── logger.py                  ← configuração de logging
│       └── session_jwt.py             ← create_app_jwt, create_session_jwt, decode_app_jwt
│                                          (PyJWT + HS256, issuer "secure-share")
│
├── alembic/                           ← Migrações de banco
│   ├── env.py
│   ├── script.py.mako
│   └── versions/                      ← migrations versionadas
│
├── docs/
│   ├── openapi.yaml
│   ├── README.md
│   ├── SISTEMA_ATUAL.md               ← este arquivo
│   └── solicitacao_purview_mip.md
│
├── scripts_data/
│   ├── __init__.py
│   ├── check_schema.py
│   ├── seed_dev.py
│   └── seed_local.py
│
├── sql/                               ← queries SQL avulsas
├── storage/                           ← armazenamento local (mock S3)
├── templates/
│   └── email/                         ← templates Jinja2 de e-mail
│
├── tests/
│   ├── conftest.py
│   ├── test_business_rules.py
│   ├── test_cav4_auth_service.py
│   ├── test_cav4_routes.py
│   ├── test_auth_routes.py
│   ├── test_db_secrets.py
│   ├── test_local_auth_service.py
│   ├── test_routes_download.py
│   ├── test_routes_files.py
│   ├── test_s3_integration.py
│   ├── test_s3_service.py
│   ├── test_security.py
│   ├── test_share_routes.py
│   ├── test_share_s3_e2e.py
│   ├── test_share_service.py
│   ├── test_token_service.py
│   └── README_S3_configure.md
│
├── alembic.ini
├── docker-compose.yml
├── Dockerfile
├── entrypoint.sh
├── requirements.txt
├── pytest.ini
└── render.yaml
```

---

## 2. Endpoints da API (todos prefixados com `/api/v1`)

### 🔐 Autenticação — `/auth`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/auth/login` | Login com email+senha (modo local) | Público |
| POST | `/auth/logout` | Logout (revoga SessionToken) | Bearer |
| POST | `/auth/refresh` | Renova access_token via refresh_token | Público (refresh no body) |

### 🏢 Autenticação Interna — `/auth/internal`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/auth/internal/signup` | Cadastra usuário (apenas AUTH_MODE=local) | Público |
| POST | `/auth/internal/login` | Login local (AUTH_MODE=local) | Público |
| POST | `/auth/internal/logout` | Logout interno | Bearer |

### 🔷 Autenticação CAv4 — `/auth/cav4`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/auth/cav4/login` | Inicia fluxo OIDC (redirect CAv4 com state/nonce/PKCE) | Público |
| GET | `/auth/cav4/callback` | Callback OIDC — troca code e emite JWT interno | Público |
| POST | `/auth/cav4/token` | Alternativa BFF para concluir callback via JSON (code/state) | Público |
| POST | `/auth/cav4/refresh` | Renova token usando X-Refresh-Token | Público (header) |
| POST | `/auth/cav4/logout` | Logout CAv4 (revoga refresh tokens internos) | Bearer |
| GET | `/auth/cav4/session-check` | Valida sessão CAv4 ativa | Bearer |

### 👤 Autenticação Externa — `/auth/external`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/auth/external/request-code` | Solicita OTP por e-mail | Público |
| POST | `/auth/external/verify-code` | Valida OTP e emite TokenAccess | Público |

### 📁 Arquivos — `/files`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/files/` | Lista arquivos/shares do usuário | Bearer |
| POST | `/files/` | Cria metadados de arquivo | Bearer |
| POST | `/files/upload` | Upload multipart ao S3 | Bearer |
| GET | `/files/{id}` | Detalhes de um arquivo | Bearer |
| DELETE | `/files/{id}` | Cancela/remove arquivo | Bearer |
| GET | `/files/{id}/presigned-upload` | URL pré-assinada para upload | Bearer |
| GET | `/files/{id}/presigned-download` | URL pré-assinada para download | Bearer |

### 📤 Compartilhamentos — `/shares`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/shares/create` | Upload + criação de share em uma chamada (`multipart/form-data` com `payload` + `files`) | Bearer |
| POST | `/shares/` | Cria novo share (provisiona destinatário) | Bearer |
| GET | `/shares/` | Lista shares do usuário | Bearer |
| GET | `/shares/{id}` | Detalhe de um share | Bearer |
| PATCH | `/shares/{id}` | Atualiza share (ex: adicionar arquivos) | Bearer |
| DELETE | `/shares/{id}` | Cancela share | Bearer |
| POST | `/shares/{id}/cancel` | Cancela share com motivo | Bearer |
| POST | `/shares/{id}/resend-email` | Reenvia e-mail ao destinatário | Bearer |

#### Mapeamento de upload usado pelo frontend

| Camada | Método | Rota |
|--------|--------|------|
| Next.js Client Component | POST | `/api/shares/create` |
| Next.js Route Handler (BFF) | POST | `/api/v1/shares/create` |
| FastAPI | POST | `/api/v1/shares/create` |

### 👔 Supervisor — `/supervisor`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/supervisor/pending` | Lista shares pendentes dos supervisionados | require_supervisor |
| POST | `/supervisor/{id}/approve` | Aprova share e emite TokenAccess + envia e-mail | require_supervisor |
| POST | `/supervisor/{id}/reject` | Rejeita share com motivo | require_supervisor |
| PATCH | `/supervisor/{id}/extend` | Estende prazo de expiração | require_supervisor |
| GET | `/supervisor/history` | Histórico de aprovações/rejeições | require_supervisor |
| GET | `/supervisor/{id}/download/{file_id}` | Download direto de arquivo pelo supervisor | require_supervisor |
| GET | `/supervisor/{id}/download-all` | Download ZIP de todos os arquivos do share | require_supervisor |

### 📬 Download Externo — `/download`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/download/verify` | Verifica e-mail externo e envia OTP | Público |
| POST | `/download/authenticate` | Valida OTP e emite TokenAccess | Público |
| GET | `/download/files` | Lista arquivos com TokenAccess | ExternalAccessContext |
| GET | `/download/files/{id}` | Baixa arquivo pelo ID | ExternalAccessContext |
| GET | `/download/zip` | Baixa todos os arquivos em ZIP | ExternalAccessContext |

### 🔗 Externo — `/external`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/external/logout` | Encerra sessão do usuário externo | Token (Form) |
| GET | `/external/list-files` | Lista arquivos com token externo (query param) | Token (query) |

### 👥 Usuários — `/users`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/users/me` | Perfil do usuário autenticado | Bearer |
| PUT | `/users/me` | Atualiza perfil próprio | Bearer |

### 🗂️ Áreas — `/areas`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/areas/` | Cria nova área compartilhada | Bearer (sem guard de role) |
| GET | `/areas/` | Lista todas as áreas | Bearer |
| GET | `/areas/{id}` | Detalhe de uma área | Bearer |
| POST | `/areas/{id}/close` | Encerra área | Bearer |

### 🔔 Notificações — `/notifications`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/notifications` | Lista notificações do usuário | Bearer |
| PATCH | `/notifications/{id}/read` | Marca notificação como lida | Bearer |
| PATCH | `/notifications/read-all` | Marca todas como lidas | Bearer |

### 📊 Auditoria — `/audit`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/audit/logs` | Lista logs com filtros (user_id, action, datas) | Bearer |
| GET | `/audit/metrics` | Métricas de auditoria | Bearer |

### 📧 Emails — `/emails`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/emails/send` | Envia e-mail customizado | Bearer |
| GET | `/emails/history` | Histórico de e-mails | Bearer |
| GET | `/emails/{message_id}/status` | Status de um e-mail específico | Bearer |
| POST | `/emails/otp` | Envia e-mail OTP | Bearer |
| POST | `/emails/log-external` | Registra e-mail enviado via Graph API | Bearer |

### 🛡️ Admin — `/admin`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/admin/dashboard` | Métricas globais do sistema | require_admin |
| GET | `/admin/users` | Lista todos os usuários | require_admin |
| GET | `/admin/shares` | Lista todos os shares | require_admin |
| GET | `/admin/logs` | Lista todos os logs de auditoria | require_admin |
| GET | `/admin/tracking/by-email` | Rastreamento completo por e-mail | require_admin |
| GET | `/admin/tracking/{id}` | Rastreamento completo por ID | require_admin |
| PATCH | `/admin/users/{id}/admin` | Promove/rebaixa usuário a admin | require_admin |

### 🎧 Suporte — `/support`

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/support/users` | Cadastra usuário externo (via chamado) | Bearer (TypeUser.SUPPORT ou supervisor) |
| GET | `/support/users` | Lista usuários externos cadastrados pelo suporte | Bearer |

---

## 3. Modelos de Dados

### `User`
```
id, type (EXTERNAL|INTERNAL), name, email, phone, department,
job_title, employee_id, login_cav4, photo_url, manager_id (FK→user),
is_supervisor, is_admin, status, created_at, last_login
```

### `Share`
```
id, name, description, area_id (FK→shared_area),
external_email, status (pendente|ativo|aprovado|rejeitado|concluido|expirado|cancelado),
consumption_policy (apos_todos|apos_primeiro), expiration_hours, expires_at,
created_at, created_by_id (FK→user), recipient_user_id (FK→user),
approver_id (FK→user), approved_at, rejected_at, rejection_reason, approval_comments
```

### `SharedArea`
```
id, name, prefix_s3, description, status (bool),
expires_at, created_at, applicant_id (FK→user)
```

### `RestrictedFile`
```
id, area_id (FK→shared_area), name, key_s3, size_bytes,
mime_type, checksum, upload_id (FK→user), expires_at, created_at, status
```

### `ShareFile` _(pivot)_
```
share_id (FK→share), file_id (FK→restricted_file)
```

### `TokenAccess`
```
id, type (otp|access), token (url-safe), token_hash (hash OTP),
user_id (FK→user), share_id (FK→share),
expires_at, created_at, used, attempts, blocked_until
```

### `SessionToken`
```
id, user_id (FK→user), token_hash (SHA-256), token_type (refresh|reset),
expires_at, created_at, used, revoked, ip_address, user_agent, email
```

### `CredentialLocal`
```
Armazena senha bcrypt do usuário no modo AUTH_MODE=local
```

### `Audit`
```
id, action, level (info|success|warning|error),
user_id, share_id, file_id, ip_address, user_agent, created_at, detail
```

### `Notification`
```
id, user_id (FK→user), type, priority, title, message, read,
action_label, action_url, extra_metadata, created_at
```

### `EmailLog`
```
id, message_id (único), email_type, from_email, to_email,
subject, status, share_id, user_id, created_at
```

### `AreaSupervisor` _(pivot)_
```
id, area_id (FK→shared_area), supervisor_id (FK→user)
```

### `SupportRegistration`
```
id, request_number, requester_email, external_user_email,
external_user_id, registered_by_id, registered_by_name,
status, notes, created_at, updated_at
```

### `SupportAudit`
```
Log de ações do time de suporte sobre usuários externos
```

---

## 4. Autorização (Guards de Rota)

Todos os guards estão em `app/utils/authz.py` e decodificam o JWT interno (issuer `secure-share`, HS256):

| Função | Critério |
|--------|----------|
| `get_current_user` | Bearer válido → usuário ativo |
| `require_internal` | `get_current_user` + `user.type == INTERNAL` |
| `require_supervisor` | `get_current_user` + `user.is_supervisor == True` |
| `require_admin` | `get_current_user` + `user.is_admin == True` |

O `ExternalAccessContext` (em `deps/external_auth.py`) valida o `TokenAccess` de usuário externo (não é JWT).

---

## 5. Modos de Autenticação

| `AUTH_MODE` | Fluxo |
|-------------|-------|
| `local` | Email + senha bcrypt. Usado em dev/testes. Signup disponível. |
| `cav4` | OIDC Authorization Code + PKCE. Backend conduz login/callback, consulta roles no CAv4, emite JWT interno e enriquece perfil via Graph quando disponível. |

---

## 6. Provedores de Infra

| Recurso | Provider dev | Provider prod |
|---------|-------------|---------------|
| Banco de dados | SQLite (arquivo local) | Aurora PostgreSQL (psycopg3) |
| Armazenamento de arquivos | Local (`./storage/`) | AWS S3 |
| E-mail | SMTP Petrobras (porta 25) ou desabilitado | SMTP interno (`smtp.petrobras.com.br`) ou AWS SES |
| Segredos | `.env` | AWS Secrets Manager + SSM Parameter Store |

---

## 7. Variáveis de Ambiente Principais (`Settings`)

| Variável | Default | Descrição |
|----------|---------|-----------|
| `AUTH_MODE` | `local` | `local` ou `cav4` |
| `DATABASE_URL` | SQLite | URL de conexão ao banco |
| `STORAGE_PROVIDER` | `local` | `local` ou `aws` |
| `EMAIL_PROVIDER` | `smtp_internal` | `smtp_internal` ou `ses` |
| `JWT_SECRET` | obrigatório | Chave HS256 dos JWTs internos |
| `OTP_MAX_ATTEMPTS` | `5` | Tentativas antes de bloquear OTP |
| `OTP_VALIDITY_MINUTES` | `5` | Validade do código OTP |
| `ACCESS_VALID_HOURS` | `24` | Validade do TokenAccess externo |
| `PRESIGNED_TTL_SECONDS_DEFAULT` | `300` | Validade de URLs pré-assinadas S3 |
| `CA_CLIENT_ID` | — | Client ID OIDC CAv4 |
| `CA_CLIENT_SECRET` | — | Client Secret OIDC CAv4 |
| `CA_REDIRECT_URI` | — | Redirect URI do callback CAv4 |
| `OIDC_DISCOVERY_URL` | — | URL de discovery OIDC do CAv4 |
| `CA_API_BASE_URL` | — | Base URL da API administrativa CAv4 |
| `CAV4_ADMIN_ROLE_NAMES` | `[]` | Lista de role codes para perfil admin |
| `CAV4_SUPERVISOR_ROLE_NAMES` | `[]` | Lista de role codes para perfil supervisor |
| `CAV4_INTERNAL_ROLE_NAMES` | `[]` | Lista de role codes para perfil internal |
| `ENTRA_TENANT_ID` | — | Azure Tenant ID |
| `ENTRA_CLIENT_ID` | — | Azure App Registration Client ID |
| `ENTRA_CLIENT_SECRET` | — | Azure App Registration Secret |
| `MAIL_FROM` | — | Remetente dos e-mails |

---

## 8. Fluxo Principal do Sistema

```
[Usuário Interno]
      │
      ├─ Login CAv4 (AUTH_MODE=cav4)
      │     GET /auth/cav4/login → redirect CAv4
      │     GET /auth/cav4/callback (ou POST /auth/cav4/token) → JWT interno emitido
      │     + consulta roles no CAv4
      │     + enrich opcional via Graph (cargo/departamento/gestor/foto)
      │
      ├─ Upload + criação de compartilhamento (fluxo principal da UI)
      │     POST /api/shares/create (frontend BFF)
      │       → POST /api/v1/shares/create (backend)
      │       → provisiona User externo + upload S3 + Share(PENDING)
      │       → e-mail ao Supervisor
      │
      ├─ Provisionamento de gestor no login
      │     sync_user_from_access() vincula manager_id no banco
      │     e tenta atribuir CD_PAPEL_SUPERVISOR no CAv4 (fallback token técnico)
      │
      ├─ Fluxo alternativo (API direta em duas etapas)
      │     POST /files/upload
      │     POST /shares/
      │
[Supervisor]
      │
      ├─ Visualiza pendentes
      │     GET /supervisor/pending
      │
      └─ Aprova
            POST /supervisor/{id}/approve
            → Share(APPROVED) → emite TokenAccess + e-mail ao externo
            → quando não houver pendências, supervisor pode ser desativado
              e removido do vínculo de papel no CAv4

[Usuário Externo]
      │
      ├─ Recebe e-mail com link
      │
      ├─ Solicita OTP
      │     POST /download/verify (ou /auth/external/request-code)
      │
      ├─ Valida OTP → TokenAccess emitido
      │     POST /download/authenticate (ou /auth/external/verify-code)
      │
      └─ Baixa arquivos
            GET /download/files + GET /download/zip
            (autenticado por ExternalAccessContext / TokenAccess)

[Rotinas de manutenção]
      │
      ├─ run_cleanup_job (via /admin/run-cleanup)
      │     expira shares vencidos, remove arquivos do S3 e envia notificações
      │
      └─ desativa usuários sem atividade pendente
            (job mantém desativação local; remoção de vínculo de papel CAv4 é transacional)
```
