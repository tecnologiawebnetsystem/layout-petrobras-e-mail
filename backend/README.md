# SCAC — Solução de Compartilhamento Seguro de Arquivos Confidenciais · Backend

> API RESTful desenvolvida com **FastAPI** para compartilhamento seguro de arquivos confidenciais da Petrobras com usuários externos.
> Usuários internos autenticam via **CAv4** (OIDC/PKCE), fazem upload de arquivos e criam compartilhamentos que passam por aprovação de supervisores antes de serem disponibilizados ao destinatário externo via autenticação OTP.

---

## Sobre o Projeto

O **SCAC** (Solução de Compartilhamento de Arquivos Confidenciais) é o backend do sistema corporativo de transferência segura de arquivos da Petrobras. O sistema permite que colaboradores internos autenticados via **CAv4** (OIDC Authorization Code + PKCE) compartilhem arquivos com destinatários externos que recebem acesso via **OTP** (One-Time Password) por e-mail. Todo o fluxo é auditado e supervisionado.

### Autenticação

| Modo | Provider | Quando usar |
|------|----------|-------------|
| `cav4` | CAv4 (OIDC/PKCE) | **Produção** — autenticação corporativa padrão |
| `local` | Email + senha (bcrypt) | **Desenvolvimento** apenas |

> ⚠️ O suporte ao Microsoft Entra ID foi **removido** na Fase 3 da migração CAv4 (2026-06).
> Variáveis `ENTRA_*` de autenticação não são mais aceitas. Use `CA_*` para CAv4.
> As variáveis `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID` e `ENTRA_CLIENT_SECRET` ainda existem
> **opcionalmente** para integração com Microsoft Graph (enriquecimento de perfil / Fase 4).

---

## Stack Tecnológica

### Core

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Python** | 3.13 | Linguagem principal |
| **FastAPI** | 0.120.1 | Framework web de alta performance |
| **Uvicorn** | 0.38.0 | Servidor ASGI |
| **Pydantic** | 2.12.5 | Validação de dados |
| **SQLModel** | 0.0.27 | ORM — integração SQLAlchemy + Pydantic |
| **Alembic** | 1.17.0 | Migrações de banco de dados |

### Banco de Dados

| Tecnologia | Versão | Descrição |
|------------|--------|------------|
| **PostgreSQL** | Aurora | Banco de dados principal (produção) |
| **psycopg[binary]** | 3.2.12 | Driver PostgreSQL síncrono |
| **SQLite** | — | Banco local para desenvolvimento |

### Autenticação e Segurança

| Tecnologia | Versão | Descrição |
|------------|--------|------------|
| **PyJWT** | 2.10.1 | Tokens JWT internos (HS256, issuer `secure-share`) + validação JWKS CAv4 (RS256) |
| **truststore** | — | Truststore do SO para TLS corporativo |
| **bcrypt** | 4.0.1 | Hash de senhas para AUTH_MODE=local |
| **cryptography** | 46.0.3 | Operações criptográficas |

### AWS / Infraestrutura

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **boto3** | 1.40.60 | AWS SDK — S3, Secrets Manager |
| **moto** | 5.1.5 | Mock AWS para testes |

### E-mail

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **fastapi-mail** | 1.6.1 | Integração SMTP/SES |
| **Jinja2** | 3.1.6 | Templates HTML de e-mail |

### Observabilidade

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Sentry SDK** | 2.42.1 | Monitoramento de erros |
| **structlog** | 25.5.0 | Logging estruturado |

### Testes

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **pytest** | 9.0.2 | Framework de testes |
| **pytest-cov** | 6.1.0 | Cobertura de código |
| **httpx** | 0.28.1 | Cliente HTTP nos testes |

---

## Arquitetura do Sistema

```
HTTP Request
    ↓
FastAPI Router (routes_*.py)   ← sem lógica de negócio
    ↓
Service (services/)            ← implementa casos de uso
    ↓
SQLModel Session (db/session)  ← acesso ao banco
    ↓
Infraestrutura                 ← AWS S3 · SMTP/SES · CAv4 (OIDC) · Microsoft Graph (opcional) · PyJWT
```

### Infraestrutura AWS (Produção)

| Serviço | Função |
|---------|--------|
| **Amazon ECS (Fargate)** | Hospedagem do container |
| **Amazon Aurora PostgreSQL** | Banco de dados relacional |
| **Amazon S3** | Armazenamento de arquivos |
| **Amazon SES** | Envio de e-mails |
| **AWS Secrets Manager** | Credenciais sensíveis |
| **AWS Systems Manager (SSM)** | Parameter Store |
| **Amazon CloudWatch** | Logs e monitoramento |

### Fluxo Principal de Compartilhamento

```
┌─────────────────┐   ┌──────────────────┐   ┌────────────────┐
│ Usuário Interno │──▶│  Cria Share +    │──▶│  Supervisor    │
│    (CAv4)       │   │  Upload Arquivos │   │  Aprova/Rejeita│
└─────────────────┘   └──────────────────┘   └───────┬────────┘
                                                     │
                      ┌──────────────────────────────┘
                      ▼
┌─────────────────┐   ┌──────────────────┐   ┌────────────────┐
│  E-mail com     │──▶│ Usuário Externo  │──▶│ Download dos   │
│  Link + OTP     │   │  Valida OTP      │   │ Arquivos (S3)  │
└─────────────────┘   └──────────────────┘   └────────────────┘
```

> **Aprovação automática**: usuários com cargos executivos (Diretor, Gerente Geral, Presidente, etc.)
> não precisam de aprovação de supervisor — o share é disponibilizado imediatamente.
> A lista de cargos é configurável via `AUTO_APPROVE_JOB_TITLES` no `.env`.

---

## Segurança

### CORS
Configurado via variável `CORS_ALLOW_ORIGINS` (CSV de origens permitidas).
Em `DEBUG=true`, aceita `localhost:3000` por padrão.
Em produção, **obrigatório** definir `CORS_ALLOW_ORIGINS` explicitamente.

```env
CORS_ALLOW_ORIGINS=https://app.petrobras.com.br,https://portal.petrobras.com.br
```

### Documentação da API (Swagger/ReDoc)
`/docs` e `/redoc` são **desabilitados automaticamente** quando `DEBUG=false`.
Nunca habilitar documentação pública em produção.

### Variáveis sensíveis
Em produção, usar **AWS Secrets Manager** para:
- `RDS_AURORA_POSTGRES_PASSWORD`
- `JWT_SECRET`
- `CA_CLIENT_SECRET`
- `MIP_SDK_API_TOKEN`

---

## Instalação e Configuração

### Pré-requisitos

- Python 3.13
- Docker e Docker Compose (opcional)
- Acesso ao Nexus Petrobras (para instalação de dependências via `pip.ini`)

### Instalação Local

```bash
# 1. Clonar o repositório
git clone ...
cd csa-backend

# 2. Criar e ativar o ambiente virtual
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Criar arquivo .env (ver tabela abaixo)

# 5. Executar migrações
alembic upgrade heads

# 6. Popular banco com dados de desenvolvimento (opcional)
python -m scripts_data.seed_dev

# 7. Iniciar a aplicação
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload --lifespan off
```

### Variáveis de Ambiente

```env
# ─── APLICAÇÃO ──────────────────────────────────────────
APP_PORT=8080
DEBUG=false                         # true = Swagger habilitado + CORS localhost
AUTH_MODE=cav4                      # cav4 | local (local apenas para desenvolvimento)
JWT_SECRET=sua-chave-secreta-256bits

# ─── CORS ────────────────────────────────────────────────
# Lista de origens permitidas separadas por vírgula.
# Os ambientes Petrobras abaixo são sempre incluídos automaticamente.
# Em dev com DEBUG=true, localhost:3000 é incluído automaticamente.
# Defina esta variável para adicionar origens extras (ex: hmg quando disponível).
#
# Ambientes incluídos automaticamente:
#   https://scac-dsv.petrobras.com.br  (desenvolvimento)
#   https://scac-tst.petrobras.com.br  (teste)
#   https://scac.petrobras.com.br      (produção)
#
# Para adicionar hmg quando subir:
# CORS_ALLOW_ORIGINS=https://scac-hmg.petrobras.com.br

# ─── BANCO DE DADOS ─────────────────────────────────────
# Desenvolvimento (SQLite)
DATABASE_URL=sqlite:///./dev.db

# Produção (Aurora PostgreSQL — host fornecido pelo Parameter Store)
# DATABASE_URL=scac-dsv.petrobras.com.br    (apenas o host; URL montada automaticamente)
RDS_AURORA_POSTGRES_USERNAME=usuario
RDS_AURORA_POSTGRES_PASSWORD=senha
RDS_AURORA_POSTGRES_DBNAME=nome_do_banco
DB_SCHEMA=public

# ─── AUTENTICAÇÃO CAv4 (OIDC/PKCE) ─────────────────────
# Obter no portal do CAv4 / equipe de identidade corporativa
CA_CLIENT_ID=seu-client-id
CA_CLIENT_SECRET=seu-client-secret
OIDC_DISCOVERY_URL=https://caauthz.petrobras.com.br/.well-known/openid-configuration
CA_API_BASE_URL=https://fwca.petrobras.com.br
CA_SSL_USE_TRUSTSTORE=true          # usa truststore do SO (recomendado em produção)
CA_SSL_VERIFY=true

# Callback configurado no App Registration do CAv4 (um por ambiente):
CA_REDIRECT_URI=https://scac-dsv.petrobras.com.br/auth/cav4-callback
# TST: CA_REDIRECT_URI=https://scac-tst.petrobras.com.br/auth/cav4-callback
# PRD: CA_REDIRECT_URI=https://scac.petrobras.com.br/auth/cav4-callback
# DEV: CA_REDIRECT_URI=http://localhost:3000/auth/cav4-callback

# Mapeamento de roles CAv4 para perfis internos (JSON array ou CSV)
CAV4_ADMIN_ROLE_NAMES=["CD_PAPEL_AUDITOR"]
CAV4_SUPERVISOR_ROLE_NAMES=["CD_PAPEL_SUPERVISOR"]
CAV4_INTERNAL_ROLE_NAMES=["CD_PAPEL_USUARIO"]

# Cargos com aprovação automática (sem necessidade de supervisor)
# AUTO_APPROVE_JOB_TITLES=["gerente geral","diretor","presidente"]

# ─── MICROSOFT GRAPH (opcional, Fase 4) ─────────────────
# Necessário apenas para enriquecer perfil de usuário (cargo, gestor, foto).
# Não é mais usado para autenticação ou controle de acesso.
ENTRA_TENANT_ID=5b6f6241-...
ENTRA_CLIENT_ID=seu-app-registration-id
ENTRA_CLIENT_SECRET=seu-secret
# App Purview separado (para operações MIP):
# ENTRA_CLIENT_ID_PURVIEW=...
# ENTRA_CLIENT_SECRET_PURVIEW=...

# ─── OTP ────────────────────────────────────────────────
OTP_MAX_ATTEMPTS=5
OTP_COOLDOWN_MINUTES=15
OTP_VALIDITY_MINUTES=5
ACCESS_VALID_HOURS=24

# ─── ARMAZENAMENTO ──────────────────────────────────────
STORAGE_PROVIDER=aws                # aws | local
AWS_REGION=sa-east-1
AWS_S3_BUCKET=s3-a12022-dsv-...

# Em produção via AWS IAM Role — não definir chaves diretamente:
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_SESSION_TOKEN=...

# ─── MIP SDK ────────────────────────────────────────────
MIP_PROCESSING_ENABLED=false        # true em produção com MIP SDK disponível
MIP_FAIL_CLOSED=false
MIP_SDK_BASE_URL=http://localhost:5000
MIP_SDK_API_TOKEN=seu-token
MIP_SDK_VERIFY_TLS=false
MIP_PROCESSING_TIMEOUT_SECONDS=120

# ─── E-MAIL ─────────────────────────────────────────────
EMAIL_PROVIDER=smtp_internal        # smtp_internal | ses | dev
MAIL_FROM=noreply-csa@petrobras.com.br
# MAIL_ROUTE=TESTE_TIC              # desvio em não-produção
# MAIL_PROTECTION=CONFIDENCIAL      # criptografia MIP via Exchange

# ─── URLS DO FRONTEND (para e-mails) ────────────────────
FRONTEND_EXTERNAL_PORTAL_URL=https://scac-dsv.petrobras.com.br
FRONTEND_SHARE_DETAILS_URL=https://scac-dsv.petrobras.com.br/compartilhamentos/{share_id}
FRONTEND_SUPERVISOR_URL=https://scac-dsv.petrobras.com.br/supervisor

# ─── BRANDING ───────────────────────────────────────────
APP_NAME=Solução de Compartilhamento de Arquivos Confidenciais - CSAC
COMPANY_NAME=Petrobras
SUPPORT_EMAIL=suporte@petrobras.com.br
```

### Docker

```bash
docker-compose build
docker-compose up          # interativo
docker-compose up -d       # background
```

---

## Documentação da API

Após iniciar a aplicação (**somente com `DEBUG=true`**), acesse:

| Recurso | URL | Descrição |
|---------|-----|-----------|
| **Swagger UI** | http://localhost:8080/docs | Documentação interativa |
| **ReDoc** | http://localhost:8080/redoc | Documentação alternativa |
| **OpenAPI JSON** | http://localhost:8080/openapi.json | Especificação OpenAPI |
| **Health Check** | http://localhost:8080/api/v1/status | Status da API |

> ⚠️ Em `DEBUG=false` (produção), `/docs`, `/redoc` e `/openapi.json` são desabilitados automaticamente.

---

## Endpoints da API

> Todos os prefixos abaixo são relativos a `/api/v1`.

### Autenticação — Geral (`/api/v1/auth`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/login` | Login por email/senha (fluxo local) |
| POST | `/auth/logout` | Logout (invalida sessão) |
| POST | `/auth/refresh` | Renova token JWT |

### Autenticação CAv4 — OIDC/PKCE (`/api/v1/auth/cav4`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/auth/cav4/login` | Inicia fluxo OIDC — gera PKCE e redireciona para CAv4 |
| POST | `/auth/cav4/token` | Recebe `code`+`state` do frontend e troca por JWT interno |
| POST | `/auth/cav4/refresh` | Renova token usando refresh_token |
| GET | `/auth/cav4/session-check` | Verifica se o JWT interno está válido |
| POST | `/auth/cav4/logout` | Invalida sessão interna |

**Callback URL configurada:**
- Local: `http://localhost:3000/auth/cav4-callback`
- DSV: `https://scac-dsv.petrobras.com.br/auth/cav4-callback`
- TST: `https://scac-tst.petrobras.com.br/auth/cav4-callback`
- PRD: `https://scac.petrobras.com.br/auth/cav4-callback`

### Autenticação Interna — Dev (`/api/v1/auth/internal`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/internal/login` | Login local (somente `AUTH_MODE=local`) |
| POST | `/auth/internal/signup` | Cadastro local (somente `AUTH_MODE=local`) |
| POST | `/auth/internal/logout` | Logout local |

### Autenticação Externa — OTP (`/api/v1/auth/external`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/external/request-code` | Solicita código OTP para e-mail externo |
| POST | `/auth/external/verify-code` | Valida OTP e retorna token de acesso |

### Usuários (`/api/v1/users`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/users/me` | Dados do usuário autenticado |
| PUT | `/users/me` | Atualiza perfil do usuário |
| GET | `/users/{userId}` | Dados de um usuário por ID (admin) |
| PATCH | `/users/{userId}` | Atualiza usuário por ID (admin) |

### Compartilhamentos (`/api/v1/shares`)

| Método | Endpoint | Corpo | Descrição |
|--------|----------|-------|-----------|
| POST | `/shares/create` | `multipart/form-data` | **Upload + criação** — campo `payload` (JSON) + `files[]` |
| POST | `/shares/` | JSON | Cria share com `file_ids` já existentes (sem upload) |
| GET | `/shares/` | — | Lista compartilhamentos do usuário autenticado |
| GET | `/shares/my-shares` | — | Lista simplificada dos shares do usuário |
| GET | `/shares/{shareId}` | — | Detalhes de um compartilhamento |
| DELETE | `/shares/{shareId}` | — | Remove compartilhamento |
| PATCH | `/shares/{shareId}/cancel` | JSON | Cancela compartilhamento |
| POST | `/shares/{shareId}/resend` | JSON | Reenvia e-mail ao destinatário |
| POST | `/shares/{shareId}/resend-notification` | JSON | Reenvia notificação ao supervisor |
| GET | `/shares/{shareId}/email-logs` | — | Histórico de e-mails do compartilhamento |

#### Fluxo de upload (frontend → backend)

```
Tela Web  POST /api/shares/create (Next.js BFF)
             ↓
  Route Handler: app/api/shares/create/route.ts
             ↓
  Backend FastAPI  POST /api/v1/shares/create
```

### Supervisor (`/api/v1/supervisor`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/supervisor/pending` | Lista compartilhamentos pendentes |
| GET | `/supervisor/shares` | Lista todos os shares dos supervisionados |
| POST | `/supervisor/approve/{shareId}` | Aprova compartilhamento |
| POST | `/supervisor/reject/{shareId}` | Rejeita compartilhamento |
| PUT | `/supervisor/extend/{shareId}` | Estende prazo |
| GET | `/supervisor/areas/{areaId}/report` | Relatório de uma área |
| GET | `/supervisor/shares/{shareId}/download-zip` | ZIP de arquivos do share (PENDING) |
| GET | `/supervisor/shares/{shareId}/email-logs` | Histórico de e-mails |
| DELETE | `/supervisor/shares/{shareId}/files/{fileId}` | Remove arquivo de share pendente |
| POST | `/supervisor/shares/{shareId}/resend-notification` | Reenvia notificação de aprovação |

### Arquivos (`/api/v1/files`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/files/` | Lista arquivos do usuário autenticado |
| POST | `/files/` | Cria registro de arquivo |
| POST | `/files/upload` | Upload via `multipart/form-data` |
| POST | `/files/upload-local` | Upload local (dev sem S3) |
| GET | `/files/{fileId}` | Detalhes de um arquivo |
| DELETE | `/files/{fileId}` | Remove arquivo |
| GET | `/files/{fileId}/presigned-download` | URL presignada de download S3 |
| GET | `/files/{fileId}/presigned-upload` | URL presignada de upload S3 |

### Download — Acesso Externo (`/api/v1/download`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/download/verify` | Verifica token e inicia sessão externa |
| POST | `/download/authenticate` | Autentica com OTP |
| GET | `/download/files` | Lista arquivos disponíveis |
| GET | `/download/files/zip` | Download ZIP de todos os arquivos |
| GET | `/download/files/{fileId}/url` | URL de download de arquivo específico |

### Portal Externo (`/api/v1/external`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/external/list-files` | Lista arquivos do externo autenticado |
| POST | `/external/ack` | Confirma download dos arquivos |
| POST | `/external/logout` | Logout do usuário externo |

### Notificações (`/api/v1/notifications`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/notifications` | Lista notificações do usuário |
| PUT | `/notifications/read-all` | Marca todas como lidas |
| PATCH | `/notifications/{notificationId}/read` | Marca uma notificação como lida |

### Auditoria (`/api/v1/audit`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/audit/` | Lista logs de auditoria |
| GET | `/audit/logs` | Lista logs (alias) |
| POST | `/audit/logs` | Registra evento de auditoria |
| GET | `/audit/metrics` | Métricas consolidadas |

### E-mails (`/api/v1/emails`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/emails/send` | Envia e-mail |
| GET | `/emails/history` | Histórico de e-mails |
| GET | `/emails/{messageId}/status` | Status de um e-mail |
| POST | `/emails/log-external` | Registra e-mail externo |
| POST | `/emails/otp` | Envia OTP por e-mail |

### Áreas (`/api/v1/areas`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/areas/` | Lista áreas do usuário |
| POST | `/areas/` | Cria nova área |
| GET | `/areas/{areaId}` | Detalhes de uma área |
| POST | `/areas/{areaId}/close` | Fecha uma área |

### Admin (`/api/v1/admin`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/admin/dashboard` | Métricas globais completas |
| GET | `/admin/users` | Lista todos os usuários |
| PATCH | `/admin/users/{userId}/admin` | Promover/rebaixar admin |
| GET | `/admin/shares` | Lista todos os compartilhamentos |
| GET | `/admin/logs` | Logs do sistema |
| GET | `/admin/actions` | Ações administrativas registradas |
| GET | `/admin/tracking/by-email` | Rastreamento por e-mail |
| GET | `/admin/tracking/{userId}` | Rastreamento por ID |
| GET | `/admin/mip-diagnostico` | Diagnóstico da integração MIP SDK |
| POST | `/admin/run-cleanup` | Executa job de limpeza (expiração, desativação) |

---

## Perfis de Acesso

| Perfil | Critério no banco | CAv4 Role | Permissões |
|--------|-------------------|-----------|------------|
| **Externo** | `type=EXTERNAL` | — | Download via OTP |
| **Interno** | `type=INTERNAL` | `CD_PAPEL_USUARIO` | Upload, criar shares |
| **Supervisor** | `INTERNAL + is_supervisor=True` | `CD_PAPEL_SUPERVISOR` | Aprovar/rejeitar shares dos supervisionados |
| **Admin** | `INTERNAL + is_admin=True` | `CD_PAPEL_AUDITOR` | Painel global, administrar usuários |

**Aprovação automática de shares** (sem necessidade de supervisor):
Usuários com cargos executivos (Diretor, Gerente Geral, Presidente, etc.) têm seus compartilhamentos aprovados imediatamente.
A lista de cargos elegíveis é configurável via `AUTO_APPROVE_JOB_TITLES` no `.env` ou `app/core/config.py`.

> **Autorização baseada em roles CAv4** — não são mais utilizados grupos do Azure AD.
> O mapeamento de roles para perfis internos é configurado via `CAV4_*_ROLE_NAMES` no `.env`.

---

## Modelo de Dados

### Tabelas Principais

| Tabela SQLModel | Descrição |
|-----------------|-----------|
| `user` | Usuários internos e externos |
| `shared_area` | Áreas de compartilhamento S3 por usuário |
| `area_supervisor` | Pivot M:N área ↔ supervisor |
| `share` | Compartilhamentos de arquivos |
| `share_file` | Pivot M:N share ↔ arquivo |
| `restricted_file` | Arquivo armazenado no S3 |
| `token_access` | OTPs e tokens de acesso externo |
| `session_token` | Tokens de sessão (hasheados) |
| `notification` | Notificações internas |
| `audit` | Logs de auditoria de todas as ações |
| `email_log` | Histórico de e-mails enviados |
| `credential_local` | Senhas bcrypt (AUTH_MODE=local) |
| `support_registration` | Registros criados pelo suporte |
| `support_audit` | Auditoria de ações de suporte |

### Ciclo de Vida de um Share

```
pendente → aprovado → ativo → concluído
         ↘ rejeitado          ↘ expirado
                               ↘ cancelado
```

---

## Testes

```bash
# Todos os testes
pytest

# Com cobertura
pytest --cov=app --cov-report=html

# Testes por módulo
pytest tests/test_auth_routes.py
pytest tests/test_share_routes.py
pytest tests/test_routes_download.py
pytest tests/test_s3_service.py
```

---

## Checklist de Verificação

```bash
# 1. Verificar status da API
curl http://localhost:8080/api/v1
# → {"version": "001", "sytem": "active"}

# 2. Login local (AUTH_MODE=local)
curl -X POST http://localhost:8080/api/v1/auth/internal/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@petrobras.com.br", "password": "senha123"}'

# 3. Dados do usuário
curl http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer {token}"
```

---

## Troubleshooting

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| Erro de conexão com banco | `DATABASE_URL` incorreto | Verificar .env e rodar `alembic upgrade heads` |
| `ImportError` em `/support` | `core/security.py` está vazio | Ver [MELHORIAS_E_PERFIS.md](docs/MELHORIAS_E_PERFIS.md) item 1.3 |
| Erro no Entra ID callback | Credenciais ou redirect_uri incorretos | Confirmar `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_REDIRECT_URI` |
| Upload S3 com erro | `STORAGE_PROVIDER=local` em dev | Definir `STORAGE_PROVIDER=local` para mock local |
| OTP não chega por e-mail | `EMAIL_PROVIDER=dev` | Checar logs — em dev o e-mail é apenas logado, não enviado |

---

## Documentação Interna

| Documento | Descrição |
|-----------|-----------|
| [docs/SISTEMA_ATUAL.md](docs/SISTEMA_ATUAL.md) | Mapa completo do sistema — pastas, endpoints, modelos, serviços |
| [docs/MELHORIAS_E_PERFIS.md](docs/MELHORIAS_E_PERFIS.md) | Diagnósticos, melhorias e proposta de perfis de acesso com Entra ID |
| [docs/openapi.yaml](docs/openapi.yaml) | Especificação OpenAPI |

---