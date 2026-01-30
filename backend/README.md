# Petrobras File Transfer API - Backend

![Snapshot](https://github.com/petrobrasbr/a12022-backend/actions/workflows/snapshot.yml/badge.svg)
![Start Release](https://github.com/petrobrasbr/a12022-backend/actions/workflows/start-release.yml/badge.svg)
![Finish Release](https://github.com/petrobrasbr/a12022-backend/actions/workflows/finish-release.yml/badge.svg)

## Sobre o Projeto

Backend da aplicacao de transferencia segura de arquivos desenvolvido com FastAPI. Sistema que expoe uma API RESTful para:

- Criacao e gerenciamento de compartilhamentos temporarios de arquivos
- Autenticacao via Microsoft Entra ID (usuarios internos) e OTP por email (usuarios externos)
- Fluxo de aprovacao por supervisores
- Controle de downloads com ACK e auditoria completa
- Notificacoes em tempo real

**Ambiente de desenvolvimento:** SQLite e URLs mock de download sem integracao real com S3 (para testes).

## Arquitetura

```
Frontend (Next.js) --> Next.js API Routes --> Backend Python (FastAPI) --> AWS (S3, SES, DynamoDB)
```

### Fluxo Principal

```
Usuario Interno --> Cria Share --> Supervisor Aprova --> Usuario Externo Baixa (via OTP)
```

## Comecando

### Pre-requisitos

- Python 3.13+
- pip ou pipenv

### Executando Localmente

#### 1. Criar ambiente virtual

```bash
python -m venv venv
```

#### 2. Ativar ambiente virtual

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

#### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

#### 4. Executar aplicacao

```bash
uvicorn app.main:app --reload --lifespan off
```

### Executando com Docker

#### 1. Build da imagem

```bash
docker-compose build
```

#### 2. Executar containers

**Modo interativo:**
```bash
docker-compose up
```

**Modo background:**
```bash
docker-compose up -d
```

## Documentacao da API

**Apos executar a aplicacao, acesse:**

- **Swagger UI:** http://localhost:8000/docs
- **Redoc:** http://localhost:8000/redoc
- **Versao:** http://localhost:8000/api/v1

## Endpoints da API

### Autenticacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/v1/auth/internal/login` | Login usuario interno (dev) |
| POST | `/api/v1/auth/internal/signup` | Cadastro usuario interno (dev) |
| POST | `/api/v1/auth/internal/logout` | Logout |
| GET | `/api/v1/auth/internal/callback` | Callback Entra ID |
| POST | `/api/v1/auth/external/request-code` | Solicitar OTP externo |
| POST | `/api/v1/auth/external/verify-code` | Verificar OTP externo |

### Usuarios

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/v1/users/me` | Dados do usuario autenticado |
| PUT | `/api/v1/users/me` | Atualizar perfil |
| GET | `/api/v1/users` | Listar usuarios |
| GET | `/api/v1/users/{id}` | Detalhes do usuario |
| POST | `/api/v1/users` | Criar usuario |
| PATCH | `/api/v1/users/{id}` | Atualizar usuario |

### Compartilhamentos (Shares)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/v1/shares/create` | Criar compartilhamento |
| GET | `/api/v1/shares/my-shares` | Listar meus compartilhamentos |
| GET | `/api/v1/shares/{id}` | Detalhes do compartilhamento |
| PATCH | `/api/v1/shares/{id}/cancel` | Cancelar compartilhamento |

### Supervisor

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/v1/supervisor/pending` | Listar pendentes de aprovacao |
| POST | `/api/v1/supervisor/approve/{id}` | Aprovar compartilhamento |
| POST | `/api/v1/supervisor/reject/{id}` | Rejeitar compartilhamento |
| PUT | `/api/v1/supervisor/extend/{id}` | Estender prazo de expiracao |
| GET | `/api/v1/supervisor/areas/{id}/report` | Relatorio da area |

### Download (Usuario Externo)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/v1/download/verify` | Verificar email e enviar OTP |
| POST | `/api/v1/download/authenticate` | Autenticar com OTP |
| GET | `/api/v1/download/files` | Listar arquivos disponiveis |
| GET | `/api/v1/download/files/{id}/url` | Gerar URL de download |

### Arquivos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/v1/files` | Criar metadata do arquivo |
| GET | `/api/v1/files` | Listar arquivos |
| GET | `/api/v1/files/{id}` | Detalhes do arquivo |
| POST | `/api/v1/files/upload-local` | Upload local (dev) |
| GET | `/api/v1/files/{id}/presigned-upload` | URL pre-assinada para upload |
| GET | `/api/v1/files/{id}/presigned-download` | URL pre-assinada para download |

### Notificacoes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/v1/notifications` | Listar notificacoes |
| PATCH | `/api/v1/notifications/{id}/read` | Marcar como lida |
| PUT | `/api/v1/notifications/read-all` | Marcar todas como lidas |

### Auditoria

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/v1/audit/logs` | Listar logs de auditoria |
| POST | `/api/v1/audit/logs` | Criar log de auditoria |
| GET | `/api/v1/audit/metrics` | Metricas do sistema |

### Acesso Externo

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/v1/external/list-files` | Listar arquivos (via token) |
| POST | `/api/v1/external/ack` | Confirmar download |
| POST | `/api/v1/external/logout` | Encerrar sessao externa |

### Health Check

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/` | Status da API |
| GET | `/api/v1` | Versao da API |

## Variaveis de Ambiente

Crie um arquivo `.env` na raiz do backend:

```env
# Banco de dados
DATABASE_URL=sqlite:///./dev.db

# Autenticacao
AUTH_MODE=local
JWT_SECRET_KEY=sua-chave-secreta-aqui

# Microsoft Entra ID (para producao)
ENTRA_TENANT_ID=seu-tenant-id
ENTRA_CLIENT_ID=seu-client-id
ENTRA_CLIENT_SECRET=seu-client-secret
ENTRA_REDIRECT_URI=http://localhost:8000/api/v1/auth/internal/callback

# OTP
OTP_MAX_ATTEMPTS=5
OTP_COOLDOWN_MINUTES=15
OTP_VALIDITY_MINUTES=5
ACCESS_VALID_HOURS=24

# AWS (para producao)
AWS_REGION=us-east-1
AWS_S3_BUCKET=seu-bucket
AWS_ACCESS_KEY_ID=sua-access-key
AWS_SECRET_ACCESS_KEY=sua-secret-key

# Email
EMAIL_PROVIDER=dev
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email
SMTP_PASS=sua-senha
MAIL_FROM=noreply@petrobras.com.br

# Frontend URLs
FRONTEND_EXTERNAL_PORTAL_URL=http://localhost:3000
FRONTEND_SHARE_DETAILS_URL=http://localhost:3000/compartilhamentos/{share_id}
```

## Executando o Seed Inicial

O seed cria um ambiente inicial para desenvolvimento e testes:

- Um usuario interno
- Uma area
- Arquivos exemplo: relatorio.pdf, planilha.xlsx
- Um compartilhamento (Share)
- Um OTP mock (impresso no console)

```bash
python -m scripts_data.seed_dev
```

## Checklist de Testes

### 1. Verificar status da API

```bash
GET http://localhost:8000/api/v1
```

**Esperado:**
```json
{"version":"001","sytem":"active"}
```

### 2. Login interno (modo dev)

```bash
POST /api/v1/auth/internal/login
Content-Type: application/json

{
  "email": "usuario@petrobras.com.br",
  "password": "senha123"
}
```

### 3. Obter dados do usuario

```bash
GET /api/v1/users/me
Authorization: Bearer {token}
```

### 4. Listar compartilhamentos pendentes (supervisor)

```bash
GET /api/v1/supervisor/pending
Authorization: Bearer {token}
```

### 5. Aprovar compartilhamento

```bash
POST /api/v1/supervisor/approve/{share_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Aprovado"
}
```

### 6. Solicitar codigo OTP (usuario externo)

```bash
POST /api/v1/download/verify
Content-Type: application/json

{
  "email": "destinatario@empresa.com"
}
```

### 7. Verificar OTP (gera token de acesso)

```bash
POST /api/v1/download/authenticate
Content-Type: application/json

{
  "email": "destinatario@empresa.com",
  "code": "123456"
}
```

### 8. Listar arquivos para download

```bash
GET /api/v1/download/files
Authorization: Bearer {token_externo}
```

### 9. Obter URL de download

```bash
GET /api/v1/download/files/{file_id}/url
Authorization: Bearer {token_externo}
```

### 10. Obter metricas do sistema

```bash
GET /api/v1/audit/metrics
Authorization: Bearer {token}
```

## Estrutura do Projeto

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── routes_areas.py
│   │       ├── routes_audit.py
│   │       ├── routes_download.py
│   │       ├── routes_external.py
│   │       ├── routes_external_auth.py
│   │       ├── routes_files.py
│   │       ├── routes_internal_auth.py
│   │       ├── routes_notifications.py
│   │       ├── routes_shares.py
│   │       ├── routes_supervisor.py
│   │       └── routes_users.py
│   ├── core/
│   │   ├── aws_utils.py
│   │   ├── config.py
│   │   ├── scheduler.py
│   │   └── security.py
│   ├── db/
│   │   ├── base.py
│   │   ├── init_db.py
│   │   └── session.py
│   ├── models/
│   │   ├── area.py
│   │   ├── areasupervisors.py
│   │   ├── audit.py
│   │   ├── credencial_local.py
│   │   ├── notification.py
│   │   ├── restricted_file.py
│   │   ├── share.py
│   │   ├── share_file.py
│   │   ├── token_access.py
│   │   └── user.py
│   ├── schemas/
│   │   ├── area_schema.py
│   │   ├── file_schema.py
│   │   ├── share_schema.py
│   │   ├── token_schema.py
│   │   └── user_schema.py
│   ├── services/
│   │   ├── audit_service.py
│   │   ├── auth_service.py
│   │   ├── email_service.py
│   │   ├── file_service.py
│   │   ├── local_auth_service.py
│   │   ├── share_service.py
│   │   ├── task_service.py
│   │   └── token_service.py
│   ├── utils/
│   │   ├── authz.py
│   │   ├── logger.py
│   │   └── session_jwt.py
│   └── main.py
├── alembic/
├── scripts_data/
├── templates/
│   └── email/
├── tests/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Servicos

| Servico | Descricao |
|---------|-----------|
| `audit_service` | Log de eventos de auditoria |
| `auth_service` | Facade de autenticacao (local/Entra) |
| `email_service` | Envio de emails (SMTP/SES) |
| `file_service` | Gerenciamento de arquivos (local/S3) |
| `local_auth_service` | Autenticacao local (dev) |
| `share_service` | Gerenciamento de compartilhamentos |
| `token_service` | OTP e tokens de acesso |

## Status dos Compartilhamentos

| Status | Descricao |
|--------|-----------|
| `pendente` | Aguardando aprovacao do supervisor |
| `aprovado` | Aprovado, aguardando download |
| `ativo` | Disponivel para download |
| `rejeitado` | Rejeitado pelo supervisor |
| `concluido` | Todos os arquivos foram baixados |
| `expirado` | Prazo de download expirou |
| `cancelado` | Cancelado pelo remetente |

## Contribuindo

1. Fork o repositorio
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas alteracoes (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licenca

Proprietario - Petrobras
