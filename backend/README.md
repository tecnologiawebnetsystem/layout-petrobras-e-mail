# Petrobras File Transfer API - Backend

## Sobre o Projeto

API RESTful desenvolvida com **FastAPI** para compartilhamento seguro de arquivos da Petrobras com usuarios externos. O sistema permite que usuarios internos enviem arquivos para destinatarios externos atraves de um fluxo seguro com aprovacao de supervisores e autenticacao via OTP (One-Time Password).

---

## Stack Tecnologica

### Linguagem e Framework

| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| **Python** | 3.12+ | Linguagem principal |
| **FastAPI** | 0.120.1 | Framework web assincrono de alta performance |
| **Uvicorn** | 0.38.0 | Servidor ASGI para producao |
| **Pydantic** | 2.12.5 | Validacao de dados e serializacao |
| **SQLAlchemy** | 2.0.44 | ORM para banco de dados |
| **SQLModel** | 0.0.27 | Integracao SQLAlchemy + Pydantic |
| **Alembic** | 1.17.0 | Migrations de banco de dados |

### Banco de Dados

| Tecnologia | Descricao |
|------------|-----------|
| **PostgreSQL** | Banco de dados principal (Aurora PostgreSQL na AWS) |
| **psycopg** | 3.2.12 | Driver PostgreSQL assincrono |
| **SQLite** | Banco local para desenvolvimento |

### Autenticacao e Seguranca

| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| **MSAL** | 1.35.1 | Microsoft Authentication Library (Entra ID) |
| **PyJWT** | 2.10.1 | Tokens JWT para sessoes |
| **python-jose** | 3.5.0 | Assinatura e verificacao de tokens |
| **bcrypt** | 4.0.1 | Hash de senhas |
| **passlib** | 1.7.4 | Utilitarios de hash |
| **cryptography** | 46.0.3 | Operacoes criptograficas |

### AWS SDK e Integracao

| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| **boto3** | 1.40.60 | AWS SDK para Python |
| **botocore** | 1.40.60 | Core do SDK AWS |
| **s3transfer** | 0.14.0 | Transferencia de arquivos S3 |
| **moto** | 5.1.5 | Mock AWS para testes |

### Email

| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| **fastapi-mail** | 1.6.1 | Envio de emails |
| **aiosmtplib** | 5.0.0 | Cliente SMTP assincrono |
| **Jinja2** | 3.1.6 | Templates de email |

### Observabilidade

| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| **Sentry SDK** | 2.42.1 | Monitoramento de erros |
| **structlog** | 25.5.0 | Logging estruturado |

### Testes

| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| **pytest** | 9.0.2 | Framework de testes |
| **pytest-cov** | 6.1.0 | Cobertura de codigo |
| **pytest-anyio** | 0.0.0 | Testes assincronos |
| **httpx** | 0.28.1 | Cliente HTTP para testes |

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                             │
│                          https://app.petrobras.com.br                       │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AWS LOAD BALANCER (ALB)                          │
│                              HTTPS / TLS 1.3                                │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS ECS (Fargate)                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        BACKEND (FastAPI)                              │  │
│  │                         Porta 8080                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   Routes    │  │  Services   │  │   Models    │  │   Schemas   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└────────┬──────────────────┬──────────────────┬──────────────────┬───────────┘
         │                  │                  │                  │
         ▼                  ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Aurora PostgreSQL │ │      S3        │ │      SES       │ │  Secrets Manager │
│  (RDS)          │ │  (Arquivos)    │ │   (Emails)     │ │  (Credenciais)  │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Fluxo Principal de Compartilhamento

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Usuario Interno │───▶│  Cria Share +    │───▶│   Supervisor     │
│   (Entra ID)     │    │  Upload Arquivos │    │   Aprova/Rejeita │
└──────────────────┘    └──────────────────┘    └────────┬─────────┘
                                                         │
                        ┌────────────────────────────────┘
                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Email com Link  │───▶│  Usuario Externo │───▶│  Download com    │
│  + Instrucoes    │    │  Valida OTP      │    │  Confirmacao     │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## Estrutura do Projeto

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── routes_admin.py          # Endpoints de administracao
│   │       ├── routes_areas.py          # Gerenciamento de areas
│   │       ├── routes_audit.py          # Logs de auditoria
│   │       ├── routes_auth.py           # Autenticacao unificada
│   │       ├── routes_diagnostico.py    # Health checks e diagnosticos
│   │       ├── routes_download.py       # Portal de download externo
│   │       ├── routes_emails.py         # Envio e historico de emails
│   │       ├── routes_entra_auth.py     # OAuth Microsoft Entra ID
│   │       ├── routes_external.py       # Acesso de usuarios externos
│   │       ├── routes_external_auth.py  # Autenticacao externa (OTP)
│   │       ├── routes_files.py          # Upload/download de arquivos
│   │       ├── routes_internal_auth.py  # Auth local (desenvolvimento)
│   │       ├── routes_notifications.py  # Sistema de notificacoes
│   │       ├── routes_shares.py         # Gerenciamento de compartilhamentos
│   │       ├── routes_supervisor.py     # Aprovacao de compartilhamentos
│   │       ├── routes_support.py        # Suporte tecnico
│   │       └── routes_users.py          # Gerenciamento de usuarios
│   │
│   ├── core/
│   │   ├── aws_utils.py                 # Utilitarios AWS (S3, SES)
│   │   ├── config.py                    # Configuracoes (pydantic-settings)
│   │   ├── scheduler.py                 # Tarefas agendadas
│   │   └── security.py                  # Funcoes de seguranca
│   │
│   ├── db/
│   │   ├── base.py                      # Classe base SQLAlchemy
│   │   ├── init_db.py                   # Inicializacao do banco
│   │   └── session.py                   # Gerenciamento de sessoes
│   │
│   ├── deps/
│   │   └── auth.py                      # Dependencias de autenticacao
│   │
│   ├── models/
│   │   ├── area.py                      # Modelo de areas/departamentos
│   │   ├── areasupervisors.py           # Relacao area-supervisor
│   │   ├── audit.py                     # Log de auditoria
│   │   ├── credencial_local.py          # Credenciais locais (dev)
│   │   ├── email_log.py                 # Historico de emails
│   │   ├── notification.py              # Notificacoes
│   │   ├── restricted_file.py           # Arquivos restritos
│   │   ├── session_token.py             # Tokens de sessao
│   │   ├── share.py                     # Compartilhamentos
│   │   ├── share_file.py                # Relacao share-arquivo
│   │   ├── support_audit.py             # Auditoria de suporte
│   │   ├── support_registration.py      # Registro de suporte
│   │   ├── token_access.py              # Tokens de acesso externo
│   │   └── user.py                      # Usuarios
│   │
│   ├── schemas/
│   │   ├── area_schema.py               # Schemas de areas
│   │   ├── file_schema.py               # Schemas de arquivos
│   │   ├── share_schema.py              # Schemas de compartilhamentos
│   │   ├── token_schema.py              # Schemas de tokens
│   │   └── user_schema.py               # Schemas de usuarios
│   │
│   ├── services/
│   │   ├── approval_hierarchy_service.py # Hierarquia de aprovacao
│   │   ├── audit_service.py             # Servico de auditoria
│   │   ├── auth_service.py              # Servico de autenticacao
│   │   ├── email_service.py             # Servico de email
│   │   ├── file_service.py              # Servico de arquivos
│   │   ├── group_sync_service.py        # Sincronizacao de grupos Entra
│   │   ├── local_auth_service.py        # Autenticacao local
│   │   ├── s3_service.py                # Operacoes S3
│   │   ├── share_service.py             # Logica de compartilhamentos
│   │   ├── supervisor_sync_service.py   # Sincronizacao de supervisores
│   │   ├── task_service.py              # Tarefas em background
│   │   └── token_service.py             # Gerenciamento de tokens/OTP
│   │
│   ├── utils/
│   │   ├── authz.py                     # Autorizacao
│   │   ├── logger.py                    # Configuracao de logs
│   │   └── session_jwt.py               # Utilitarios JWT
│   │
│   └── main.py                          # Ponto de entrada da aplicacao
│
├── alembic/
│   ├── versions/                        # Migrations do banco
│   └── env.py                           # Configuracao Alembic
│
├── docs/
│   ├── README.md                        # Documentacao adicional
│   ├── database_model.md                # Modelo de dados detalhado
│   ├── database_schema.sql              # Schema SQL completo
│   ├── dynamodb_modelos_especificacao.md # Especificacao DynamoDB
│   ├── openapi.yaml                     # Especificacao OpenAPI
│   └── postgresql_relationships.md      # Relacionamentos do banco
│
├── scripts_data/
│   └── seed_dev.py                      # Dados de desenvolvimento
│
├── templates/
│   └── email/                           # Templates HTML de email
│
├── tests/                               # Testes unitarios e integracao
│
├── Dockerfile                           # Imagem Docker (multi-stage)
├── docker-compose.yml                   # Orquestracao local
├── entrypoint.sh                        # Script de inicializacao
├── requirements.txt                     # Dependencias Python
├── alembic.ini                          # Configuracao Alembic
├── pytest.ini                           # Configuracao pytest
└── pip.ini                              # Configuracao pip (Nexus Petrobras)
```

---

## Instalacao e Configuracao

### Pre-requisitos

- Python 3.12 ou superior
- pip ou pipenv
- Docker e Docker Compose (opcional)
- Acesso ao Nexus Petrobras (para dependencias)

### Instalacao Local

#### 1. Clonar o Repositorio

```bash
git clone ...
```

#### 2. Criar Ambiente Virtual

```bash
python -m venv venv
```

#### 3. Ativar Ambiente Virtual

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

#### 4. Instalar Dependencias

```bash
pip install -r requirements.txt
```

> **Nota:** O arquivo `pip.ini` configura o repositorio Nexus da Petrobras como fonte de pacotes.

#### 5. Configurar Variaveis de Ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
# ============================================
# BANCO DE DADOS
# ============================================
# Desenvolvimento local (SQLite)
DATABASE_URL=sqlite:///./dev.db

# Producao (Aurora PostgreSQL)
# DATABASE_URL=postgresql+psycopg://user:pass@host/dbname?options=-csearch_path%3Dscac

# ============================================
# AUTENTICACAO
# ============================================
AUTH_MODE=local                    # local | entra
JWT_SECRET=sua-chave-secreta-aqui  # Obrigatorio em producao

# Microsoft Entra ID (Azure AD)
ENTRA_APP_NAME=SCAC Backend
ENTRA_TENANT_ID=seu-tenant-id
ENTRA_CLIENT_ID=seu-client-id
ENTRA_CLIENT_SECRET=seu-client-secret
ENTRA_REDIRECT_URI=http://localhost:3000/auth/entra-callback

# Grupo obrigatorio para acesso
ENTRA_REQUIRED_GROUP_ID=ccc28110-a7ad-45df-94ca-439cf7ff0c55
ENTRA_REQUIRED_GROUP_NAME=GN_CLOUD_AWS_SCAC_USERS

# IDs dos grupos de supervisores (JSON array)
ENTRA_SUPERVISOR_GROUP_IDS=["id-grupo-1","id-grupo-2"]

# ============================================
# OTP (One-Time Password)
# ============================================
OTP_MAX_ATTEMPTS=5
OTP_COOLDOWN_MINUTES=15
OTP_VALIDITY_MINUTES=5
ACCESS_VALID_HOURS=24

# ============================================
# ARMAZENAMENTO
# ============================================
STORAGE_PROVIDER=local             # local | aws

# AWS S3 (producao)
AWS_REGION=us-east-1
AWS_S3_BUCKET=petrobras-scac-files
AWS_ACCESS_KEY_ID=sua-access-key
AWS_SECRET_ACCESS_KEY=sua-secret-key

# ============================================
# EMAIL
# ============================================
EMAIL_PROVIDER=dev                 # dev | smtp_internal | ses
MAIL_FROM=noreply@petrobras.com.br

# SMTP Interno Petrobras
# Servidor: smtp.petrobras.com.br
# Porta: 25 (sem autenticacao, TLS via STARTTLS)
MAIL_ROUTE=TESTE_TIC              # Header X-Route (desvio em nao-producao)
MAIL_PROTECTION=CONFIDENCIAL      # Header X-Protecao (criptografia MIP)

# ============================================
# URLs DO FRONTEND
# ============================================
FRONTEND_EXTERNAL_PORTAL_URL=http://localhost:3000
FRONTEND_SHARE_DETAILS_URL=http://localhost:3000/compartilhamentos
FRONTEND_SUPERVISOR_URL=http://localhost:3000/supervisor

# ============================================
# APLICACAO
# ============================================
APP_PORT=8080
APP_NAME=Compartilhamento Seguro de Arquivos
COMPANY_NAME=Petrobras
SUPPORT_EMAIL=suporte@petrobras.com.br
```

#### 6. Executar Migrations

```bash
alembic upgrade heads
```

#### 7. Popular Banco com Dados de Desenvolvimento (Opcional)

```bash
python -m scripts_data.seed_dev
```

#### 8. Iniciar a Aplicacao

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload --lifespan off
```

### Instalacao com Docker

#### 1. Build da Imagem

```bash
docker-compose build
```

#### 2. Executar

**Modo interativo:**
```bash
docker-compose up
```

**Modo background:**
```bash
docker-compose up -d
```

---

## Documentacao da API

Apos iniciar a aplicacao, acesse:

| Recurso | URL | Descricao |
|---------|-----|-----------|
| **Swagger UI** | http://localhost:8080/docs | Documentacao interativa |
| **ReDoc** | http://localhost:8080/redoc | Documentacao alternativa |
| **OpenAPI JSON** | http://localhost:8080/openapi.json | Especificacao OpenAPI |
| **Health Check** | http://localhost:8080/api | Status da API |
| **Versao** | http://localhost:8080/api/v1 | Versao da API |

---

## Endpoints da API

### Autenticacao Unificada (`/api/v1/auth`)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/auth/login` | Login com email/senha |
| POST | `/auth/logout` | Logout (invalida sessao) |
| POST | `/auth/refresh` | Renova token JWT |
| POST | `/auth/forgot-password` | Solicita reset de senha |
| POST | `/auth/reset-password` | Reseta senha com token |

### Autenticacao Entra ID (`/api/v1/auth/entra`)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/auth/entra/login` | Inicia fluxo OAuth |
| GET | `/auth/entra/callback` | Callback do Entra ID |
| POST | `/auth/entra/logout` | Logout do Entra ID |

### Autenticacao Interna - Dev (`/api/v1/auth/internal`)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/auth/internal/login` | Login local (desenvolvimento) |
| POST | `/auth/internal/signup` | Cadastro local (desenvolvimento) |
| POST | `/auth/internal/logout` | Logout local |

### Autenticacao Externa - OTP (`/api/v1/auth/external`)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/auth/external/request-code` | Solicita codigo OTP |
| POST | `/auth/external/verify-code` | Valida codigo OTP |

### Usuarios (`/api/v1/users`)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/users/me` | Dados do usuario autenticado |
| PUT | `/users/me` | Atualiza perfil |
| GET | `/users` | Lista usuarios (admin) |
| GET | `/users/{id}` | Detalhes do usuario |
| POST | `/users` | Cria usuario |
| PATCH | `/users/{id}` | Atualiza usuario |

### Compartilhamentos (`/api/v1/shares`)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/shares/create` | Cria compartilhamento |
| GET | `/shares/my-shares` | Lista meus compartilhamentos |
| GET | `/shares/{id}` | Detalhes do compartilhamento |
| PATCH | `/shares/{id}/cancel` | Cancela compartilhamento |

### Supervisor (`/api/v1/supervisor`)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/supervisor/pending` | Lista pendentes de aprovacao |
| POST | `/supervisor/approve/{id}` | Aprova compartilhamento |
| POST | `/supervisor/reject/{id}` | Rejeita compartilhamento |
| PUT | `/supervisor/extend/{id}` | Estende prazo |
| GET | `/supervisor/areas/{id}/report` | Relatorio da area |

### Download - Portal Externo (`/api/v1/download`)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/download/verify` | Verifica email e envia OTP |
| POST | `/download/authenticate` | Autentica com OTP |
| GET | `/download/files` | Lista arquivos disponiveis |
| GET | `/download/files/{id}/url` | Gera URL de download |

### Arquivos (`/api/v1/files`)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/files` | Cria metadata do arquivo |
| GET | `/files` | Lista arquivos |
| GET | `/files/{id}` | Detalhes do arquivo |
| POST | `/files/upload-local` | Upload local (dev) |
| GET | `/files/{id}/presigned-upload` | URL pre-assinada para upload |
| GET | `/files/{id}/presigned-download` | URL pre-assinada para download |

### Notificacoes (`/api/v1/notifications`)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/notifications` | Lista notificacoes |
| PATCH | `/notifications/{id}/read` | Marca como lida |
| PUT | `/notifications/read-all` | Marca todas como lidas |

### Auditoria (`/api/v1/audit`)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/audit/logs` | Lista logs de auditoria |
| POST | `/audit/logs` | Cria log de auditoria |
| GET | `/audit/metrics` | Metricas do sistema |

### Emails (`/api/v1/emails`)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/emails/send` | Envia email customizado |
| GET | `/emails/history` | Historico de emails |
| GET | `/emails/{messageId}/status` | Status de um email |
| POST | `/emails/otp` | Envia email com OTP |

### Areas (`/api/v1/areas`)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/areas` | Lista areas |
| GET | `/areas/{id}` | Detalhes da area |
| POST | `/areas` | Cria area |
| PATCH | `/areas/{id}` | Atualiza area |

### Admin (`/api/v1/admin`)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/admin/users` | Lista todos os usuarios |
| POST | `/admin/users/{id}/deactivate` | Desativa usuario |
| POST | `/admin/sync-groups` | Sincroniza grupos Entra |

---

## Integracao com AWS

### Servicos Utilizados

| Servico | Funcao |
|---------|--------|
| **Amazon ECS (Fargate)** | Hospedagem de containers |
| **Amazon Aurora PostgreSQL** | Banco de dados relacional |
| **Amazon S3** | Armazenamento de arquivos |
| **Amazon SES** | Envio de emails |
| **AWS Secrets Manager** | Gerenciamento de credenciais |
| **AWS Systems Manager (SSM)** | Parameter Store para configuracoes |
| **Amazon CloudWatch** | Logs e monitoramento |
| **AWS IAM** | Controle de acesso |
| **AWS KMS** | Criptografia de dados |

### Configuracao ECS

O backend e implantado como container no Amazon ECS Fargate. As variaveis de ambiente sao injetadas automaticamente pela Task Definition a partir do:

1. **Secrets Manager**: Credenciais sensiveis (banco, Entra ID)
2. **Parameter Store (SSM)**: Configuracoes de ambiente

### Fluxo de Deploy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Git Push      │───▶│  Pipeline CDK   │───▶│  Build Docker   │
│   (main/dev)    │    │   Petrobras     │    │   (ECR)         │
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                       │
                       ┌───────────────────────────────┘
                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Task Definition│───▶│   ECS Service   │───▶│   ALB/Target    │
│  + Secrets      │    │   Fargate       │    │   Group         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Modelo de Dados

### Tabelas Principais

| Tabela | Descricao |
|--------|-----------|
| `users` | Usuarios do sistema (internos e externos) |
| `areas` | Areas/departamentos da empresa |
| `area_supervisors` | Relacao M:N entre areas e supervisores |
| `shares` | Compartilhamentos de arquivos |
| `share_files` | Relacao M:N entre shares e arquivos |
| `restricted_files` | Metadados dos arquivos |
| `token_access` | Tokens de acesso externo e OTPs |
| `session_tokens` | Sessoes de usuarios |
| `notifications` | Notificacoes do sistema |
| `audit_logs` | Logs de auditoria |
| `email_logs` | Historico de emails enviados |
| `credencial_local` | Credenciais locais (desenvolvimento) |
| `support_registrations` | Registros de suporte |
| `support_audits` | Auditoria de acoes de suporte |

### Status dos Compartilhamentos

| Status | Descricao |
|--------|-----------|
| `pendente` | Aguardando aprovacao do supervisor |
| `aprovado` | Aprovado, aguardando download |
| `ativo` | Disponivel para download |
| `rejeitado` | Rejeitado pelo supervisor |
| `concluido` | Todos os arquivos foram baixados |
| `expirado` | Prazo de download expirou |
| `cancelado` | Cancelado pelo remetente |

---

## Testes

### Executar Todos os Testes

```bash
pytest
```

### Com Cobertura

```bash
pytest --cov=app --cov-report=html
```

### Testes Especificos

```bash
# Testes de autenticacao
pytest tests/test_auth.py

# Testes de compartilhamentos
pytest tests/test_shares.py

# Testes de arquivos
pytest tests/test_files.py
```

---

## Checklist de Verificacao

### 1. Verificar Status da API

```bash
curl http://localhost:8080/api/v1
```

**Resposta esperada:**
```json
{"version": "001", "sytem": "active"}
```

### 2. Login Interno (Desenvolvimento)

```bash
curl -X POST http://localhost:8080/api/v1/auth/internal/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@petrobras.com.br", "password": "senha123"}'
```

### 3. Obter Dados do Usuario

```bash
curl http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer {token}"
```

### 4. Criar Compartilhamento

```bash
curl -X POST http://localhost:8080/api/v1/shares/create \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_email": "destinatario@empresa.com",
    "recipient_name": "Nome do Destinatario",
    "message": "Segue os arquivos solicitados",
    "file_ids": ["uuid-arquivo-1", "uuid-arquivo-2"]
  }'
```

---

## Troubleshooting

### Erro de Conexao com Banco

1. Verifique se `DATABASE_URL` esta configurado corretamente
2. Para PostgreSQL, verifique se o driver `psycopg` esta instalado
3. Execute as migrations: `alembic upgrade heads`

### Erro de Autenticacao Entra ID

1. Verifique se `AUTH_MODE=entra` esta configurado
2. Confirme as credenciais: `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`
3. Verifique se a `ENTRA_REDIRECT_URI` esta registrada no Azure AD

### Erro de Upload S3

1. Verifique se `STORAGE_PROVIDER=aws` esta configurado
2. Confirme as credenciais AWS: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
3. Verifique permissoes do bucket S3

---
