# Documento de Arquitetura — A12022
## Solução de Compartilhamento de Arquivos Confidenciais (SCAC)

> **Classificação:** Interno  
> **Versão:** 3.0  
> **Data de revisão:** 06/08/2026  
> **Elaborado com base no código-fonte real dos repositórios A12022_FrontEnd e A12022_BackEnd**

---

## Sumário

1. [Objetivo e Escopo](#1-objetivo-e-escopo)
2. [Visão Geral da Arquitetura](#2-visão-geral-da-arquitetura)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Camadas e Componentes](#4-camadas-e-componentes)
5. [Autenticação e Autorização](#5-autenticação-e-autorização)
6. [Fluxos Funcionais Principais](#6-fluxos-funcionais-principais)
7. [API — Catálogo de Endpoints](#7-api--catálogo-de-endpoints)
8. [Modelo de Dados — Banco de Dados](#8-modelo-de-dados--banco-de-dados)
9. [Integrações Externas](#9-integrações-externas)
10. [Configurações e Gerenciamento de Segredos](#10-configurações-e-gerenciamento-de-segredos)
11. [Infraestrutura e Deploy (AWS / ECS)](#11-infraestrutura-e-deploy-aws--ecs)
12. [Segurança](#12-segurança)
13. [Regras de Negócio Críticas](#13-regras-de-negócio-críticas)
14. [Testes e Qualidade](#14-testes-e-qualidade)
15. [Ambientes](#15-ambientes)
16. [Glossário](#16-glossário)

---

## 1. Objetivo e Escopo

O **SCAC** (A12022 — Solução de Compartilhamento de Arquivos Confidenciais) é um sistema corporativo da **Petrobras** projetado para permitir que colaboradores internos transfiram arquivos classificados (inclusive documentos protegidos por Microsoft Purview / MIP) a destinatários externos — parceiros, fornecedores, órgãos reguladores — de forma controlada, supervisionada e auditável.

### 1.1. Problemas Resolvidos

| Problema | Solução SCAC |
|---|---|
| Envio não rastreável de arquivos via e-mail convencional | Compartilhamento com rastreamento completo em banco |
| Ausência de aprovação hierárquica para arquivos sensíveis | Workflow de aprovação pelo gestor imediato (supervisor) |
| Acesso irrestrito a arquivos confidenciais MIP-rotulados | Integração com Microsoft Purview para re-rotulagem controlada |
| Falta de expiração e revogação de acesso | Links com TTL configurável e revogação automática |
| Ausência de trilha de auditoria | Tabela `audit` com todos os eventos do sistema |

### 1.2. Perfis de Usuário

| Perfil | Descrição |
|---|---|
| **Usuário Interno** | Colaborador Petrobras autenticado via CAv4 (modo padrão) ou Entra ID. Pode fazer upload e solicitar compartilhamentos. |
| **Supervisor** | Colaborador interno com permissão de aprovação sobre os compartilhamentos de seus subordinados (vínculo via `manager_id`). |
| **Administrador** | Super administrador global. Visibilidade total do sistema, sem restrições hierárquicas. Pode promover outros usuários. |
| **Usuário Externo** | Destinatário de fora da Petrobras. Acessa via portal público com autenticação OTP (código de 6 dígitos enviado por e-mail). Não possui credenciais do Active Directory. |

---

## 2. Visão Geral da Arquitetura

A solução SCAC adota **arquitetura de microserviços em dois repositórios independentes**, cada um conteinerizado e executado no **Amazon ECS (Elastic Container Service)** com suporte a multi-AZ. A comunicação entre o Front End e o Back End ocorre exclusivamente via **API REST versionada** (`/api/v1/`), com autenticação por **JWT interno** emitido pelo Back End após validação das credenciais corporativas.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          REDE PETROBRAS (Intranet + Internet)            │
│                                                                          │
│  ┌───────────────────┐          ┌───────────────────┐                   │
│  │   USUÁRIO INTERNO │          │   USUÁRIO EXTERNO  │                   │
│  │  (Colaborador)    │          │  (Parceiro/Forn.)  │                   │
│  └────────┬──────────┘          └─────────┬──────────┘                   │
│           │ HTTPS                          │ HTTPS (Portal Externo)       │
│           ▼                               ▼                              │
│  ┌─────────────────────────────────────────────────────┐                │
│  │             A12022_FrontEnd  (Next.js 15 / App Router)               │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐│                │
│  │  │ /upload  │ │/supervisor│ │ /download│ │ /admin ││                │
│  │  └──────────┘ └───────────┘ └──────────┘ └────────┘│                │
│  │  ECS Fargate — registry.petrobras.com.br             │                │
│  └───────────────────────┬─────────────────────────────┘                │
│                          │ REST / JWT                                    │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────┐                │
│  │           A12022_BackEnd  (FastAPI / Python 3.12)    │                │
│  │  ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ │                │
│  │  │ /auth    │ │/files  │ │ /shares  │ │/supervisor│ │                │
│  │  │ (CAv4 +  │ │        │ │          │ │  /admin  │ │                │
│  │  │  Entra)  │ │        │ │          │ │          │ │                │
│  │  └──────────┘ └────────┘ └──────────┘ └──────────┘ │                │
│  │  ECS Fargate — registry.petrobras.com.br             │                │
│  └──────┬──────────────────────┬──────────────────────┘                │
│         │ psycopg3              │ boto3                                  │
│         ▼                      ▼                                        │
│  ┌────────────────┐   ┌───────────────────────┐                        │
│  │  Amazon Aurora  │   │     Amazon S3         │                        │
│  │  PostgreSQL     │   │  (Arquivos Restritos) │                        │
│  │  (Multi-AZ)     │   │                       │                        │
│  └────────────────┘   └───────────────────────┘                        │
│                                                                          │
│         ┌────────────────────────────────────────────────┐              │
│         │  Integrações Externas (Microsoft)               │              │
│         │  ┌──────────────┐  ┌────────────────────────┐ │              │
│         │  │  CAv4 / OIDC  │  │  Microsoft Graph API   │ │              │
│         │  │  (Petrobras   │  │  (perfil/foto/gestor)  │ │              │
│         │  │   IdP)        │  ├────────────────────────┤ │              │
│         │  └──────────────┘  │  Microsoft Purview /MIP│ │              │
│         │                    │  (rótulos MIP + SDK)   │ │              │
│         │                    └────────────────────────┘ │              │
│         └────────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Stack Tecnológica

### 3.1. Front End — A12022_FrontEnd

| Camada | Tecnologia | Versão | Observação |
|---|---|---|---|
| Framework | **Next.js** (App Router) | 15.x | `force-dynamic` no layout raiz para leitura de env ECS em runtime |
| Linguagem | **TypeScript** | 5.x | Tipagem estrita |
| Runtime Vars | `window.__ENV__` | — | Injetado pelo Server Component no `<head>` via `JSON.stringify` |
| UI Components | **shadcn/ui + Radix UI** | — | Componentes acessíveis (Dialog, Toast, etc.) |
| Estilização | **Tailwind CSS** | 4.x | Tokens via `@theme` no `globals.css` |
| Formulários | **react-hook-form + zod** | — | Validação client-side com schemas tipados |
| Estado Global | **Zustand + Immer** | — | Auth store, UI state |
| Fetching | **SWR** | — | Cache/revalidação de dados |
| Auth (Entra) | **@azure/msal-browser** | — | MSAL SPA — fluxo Authorization Code + PKCE sem client_secret |
| Fontes | **Inter** (localFont) | — | Servida do repositório, sem CDN externo |
| PDF / Evidências | **jsPDF** | — | Geração de comprovantes de compartilhamento |
| ZIP | **JSZip** | — | Empacotamento de múltiplos arquivos para download |
| Gráficos | **Recharts** | — | Dashboard administrativo |
| Testes | **Jest** | — | Testes unitários e de integração de componentes |
| Container | **Node.js 20 Alpine** | — | Dockerfile multi-stage |

### 3.2. Back End — A12022_BackEnd

| Camada | Tecnologia | Versão | Observação |
|---|---|---|---|
| Framework | **FastAPI** | 0.136.x | Async, OpenAPI automático |
| Linguagem | **Python** | 3.12 | Slim container da registry Petrobras |
| ORM / Query | **SQLModel + psycopg3** | — | Tipo-safe sobre SQLAlchemy 2.x |
| Migrations | **Alembic** | 1.18.x | Versionamento de esquema; executado no `entrypoint.sh` |
| Auth JWT | **PyJWT** | — | HS256 (interno) e RS256 (validação JWKS Entra/CAv4) |
| Hashing | **bcrypt** | 5.0 | Senhas de externos (credential_local) |
| HTTP Client | **httpx** | 0.28.x | Graph API, CAv4, MIP SDK |
| AWS SDK | **boto3 / botocore** | 1.43.x | S3, Parameter Store, Secrets Manager |
| Crypto/PKCE | **secrets + hashlib** | stdlib | PKCE SHA-256; tokens hashados com SHA-256 antes de persistir |
| Logging | **structlog** | — | JSON estruturado em produção |
| Validação | **pydantic-settings** | — | `Settings` lê env, Parameter Store e Secrets Manager |
| Testes | **pytest** | — | Unitários e de integração |
| Servidor WSGI/ASGI | **Uvicorn** | — | ASGI, multi-worker em produção |

---

## 4. Camadas e Componentes

### 4.1. Camada de Apresentação (Front End)

Responsável por toda a interface com o usuário: navegação, formulários, validações client-side, renderização de estado e comunicação com o Back End via REST.

**Páginas e Rotas (Next.js App Router):**

| Rota | Público | Descrição |
|---|---|---|
| `/` | Não | Página inicial — saudação contextual, atalhos |
| `/upload` | Não | Upload de arquivos e criação de compartilhamento |
| `/compartilhamentos` | Não | Histórico de compartilhamentos do usuário |
| `/historico` | Não | Histórico detalhado com filtros |
| `/supervisor` | Supervisor | Fila de aprovação de compartilhamentos pendentes |
| `/supervisor/detalhes/[id]` | Supervisor | Detalhes de compartilhamento para aprovação/rejeição |
| `/admin` | Admin | Dashboard administrativo global |
| `/auditoria` | Admin | Logs de auditoria completos |
| `/configuracoes` | Admin | Configurações do sistema |
| `/download` | Externo | Portal de download para usuários externos (OTP) |
| `/external-verify` | Externo | Verificação de e-mail para acesso externo |
| `/suporte` | Suporte | Cadastro e gestão de usuários externos |
| `/logs` | Admin | Visualização de logs em tempo real |
| `/docs` | Admin | Documentação interna da API |
| `/auth/cav4-callback` | Público | Callback OIDC CAv4 |
| `/auth/entra-callback` | Público | Callback MSAL Entra ID |
| `/auth/mip-redirect` | Interno | Redirect do device code flow MIP |

**Variáveis de Ambiente (Runtime via `window.__ENV__`):**

| Variável | Origem SSM | Descrição |
|---|---|---|
| `NEXT_PUBLIC_AUTH_MODE` | SSM | `cav4` (padrão) ou `entra` |
| `NEXT_PUBLIC_CAV4_DISCOVERY_URL` | SSM | URL de discovery OIDC do CAv4 |
| `NEXT_PUBLIC_APP_URL` | SSM | URL base da aplicação |
| `NEXT_PUBLIC_MIP_CLIENT_ID` | SSM | Client ID do app AIP/MIP |
| `NEXT_PUBLIC_MIP_TENANT_ID` | SSM | Tenant ID do Entra para MIP |
| `NEXT_PUBLIC_MIP_AUTH_MODE` | SSM | `device_code` (padrão) ou `popup` |

> **Nota:** O layout utiliza `process.env['VAR']` (notação de colchetes) em vez de `process.env.VAR`, garantindo que o Webpack não substitua os valores em build-time — os valores reais do ECS Task Definition são lidos em runtime.

### 4.2. Camada de Lógica de Negócio (Back End)

Responsável por regras de negócio, autenticação/autorização, validações, orquestração de operações de arquivos, integrações e exposição das APIs RESTful versionadas.

**Estrutura de Módulos:**

```
backend/app/
├── api/v1/
│   ├── routes_auth.py          # Login local (externos)
│   ├── routes_cav4_auth.py     # Login CAv4 OIDC (internos Petrobras)
│   ├── routes_entra_auth.py    # Login Entra ID MSAL (modo legado)
│   ├── routes_files.py         # Gestão de arquivos e uploads
│   ├── routes_shares.py        # Compartilhamentos (ciclo de vida completo)
│   ├── routes_supervisor.py    # Aprovação / rejeição / extensão
│   ├── routes_admin.py         # Dashboard e gestão administrativa
│   ├── routes_audit.py         # Consulta de logs de auditoria
│   ├── routes_download.py      # Portal de download externo (OTP)
│   ├── routes_external.py      # Listagem de arquivos para externos
│   ├── routes_emails.py        # Rastreamento de e-mails
│   ├── routes_areas.py         # Gestão de áreas/pastas S3
│   ├── routes_notifications.py # Notificações in-app
│   ├── routes_mip_auth.py      # Device code flow MIP SDK
│   └── routes_diagnostico.py   # Diagnóstico de parâmetros
├── core/
│   ├── config.py               # Settings (pydantic-settings); monta DATABASE_URL
│   └── aws_utils.py            # Presigned URLs S3
├── db/session.py               # Engine SQLAlchemy + get_session
├── models/                     # SQLModel ORM (user, share, file, audit…)
├── schemas/                    # Pydantic schemas de request/response
├── services/
│   ├── auth_service.py         # Helpers de sincronização de usuários
│   ├── cav4_auth_service.py    # PKCE, OIDC discovery, roles CAv4
│   ├── cav4_client.py          # Client HTTP para APIs de autorização CAv4
│   ├── graph_service.py        # Microsoft Graph (perfil, gestor, foto)
│   ├── share_service.py        # Regras de criação de compartilhamento
│   ├── token_service.py        # OTP e access tokens para externos
│   ├── email_service.py        # Envio de e-mails (SMTP Petrobras / SES)
│   ├── audit_service.py        # log_event() — persistência na tabela audit
│   ├── authorization_service.py# Resolução de permissões por perfil
│   └── task_service.py         # Jobs agendados (cleanup, expiração)
└── utils/
    ├── authz.py                # Dependências FastAPI: get_current_user, require_permission
    └── session_jwt.py          # create_session_jwt / decode_app_jwt
```

### 4.3. Camada de Persistência

**Banco de dados:** Amazon Aurora PostgreSQL (Multi-AZ), cluster gerenciado.

- Driver: `psycopg3` (psycopg — versão nativa, assíncrona quando necessário)
- Migrations gerenciadas pelo **Alembic**, executadas automaticamente no `entrypoint.sh` durante o boot do container
- Schema: `public` (configurável via `DB_SCHEMA`)
- Connection pooling: nativo do Aurora + SQLAlchemy pool interno

### 4.4. Camada de Armazenamento de Arquivos

**Serviço:** Amazon S3

- Todos os arquivos são enviados ao S3 com chave estruturada:  
  `{area_id}/{uuid}/{nome_sanitizado}`
- Para produção: uploads via `s3.put_object()` no Back End ou presigned URLs direto no S3
- Downloads servidos via `StreamingResponse` do Back End (stream do S3) ou via presigned GET URL
- Na rejeição ou cancelamento de compartilhamentos: objetos S3 são deletados automaticamente

---

## 5. Autenticação e Autorização

O SCAC suporta **três modos de autenticação**, selecionados pela variável `AUTH_MODE` no Back End. Apenas um modo fica ativo por ambiente.

### 5.1. Modo CAv4 (Padrão — Produção Petrobras)

O **CAv4** é o **Identity Provider (IdP) corporativo da Petrobras**, baseado em OIDC/OAuth 2.0. É o modo de autenticação padrão para todos os ambientes produtivos.

**Fluxo Authorization Code + PKCE (Server-Side Callback):**

```
[1] Frontend → GET /api/v1/auth/cav4/login
        ↓
[2] Backend gera state, nonce, code_verifier (PKCE) — armazena em _PENDING_AUTH (10min TTL)
        ↓
[3] Redirect 302 → CAv4 Authorization Endpoint (com code_challenge SHA-256)
        ↓
[4] Usuário autentica no CAv4 (SSO corporativo Petrobras)
        ↓
[5] CAv4 redireciona → GET /api/v1/auth/cav4/callback?code=...&state=...
     OU
     Frontend POST /api/v1/auth/cav4/token { code, state }   ← modo BFF
        ↓
[6] Backend recupera code_verifier, troca code por tokens no CAv4
        ↓
[7] Valida id_token (RS256, JWKS, nonce, exp, iss)
        ↓
[8] Extrai user_login (matrícula Petrobras) do token
        ↓
[9] GET CAv4 → consulta roles corporativos do usuário
        ↓
[10] resolve_access_from_cav4_roles() → mapeia para { role, authorized, all_roles }
        ↓
[11] Enriquecimento Microsoft Graph (by UPN/matrícula):
     - jobTitle, department, manager (email/nome/matrícula), photo
        ↓
[12] sync_user_from_access() → cria/atualiza registro na tabela `user`
        ↓
[13] issue_internal_tokens() → JWT HS256 (60min) + refresh token (SHA-256 hash no banco)
        ↓
[14] Retorna ao Frontend: { access_token, refresh_token, user, roles, permissions, allowed_modules }
```

**Mapeamento de Roles CAv4 → Perfis SCAC:**

| Role CAv4 (configurável) | Perfil SCAC | `is_admin` | `is_supervisor` |
|---|---|---|---|
| `admin` | Administrador | `true` | `true` |
| `supervisor` | Supervisor | `false` | `true` |
| `internal` | Usuário Interno | `false` | `false` |

**Endpoints CAv4 (Back End):**

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/v1/auth/cav4/login` | Inicia o fluxo OIDC (redirect) |
| `GET` | `/v1/auth/cav4/callback` | Callback server-side (code + state) |
| `POST` | `/v1/auth/cav4/token` | Alternativa BFF (JSON: code + state) |
| `POST` | `/v1/auth/cav4/refresh` | Renova sessão (rotation de refresh token) |
| `POST` | `/v1/auth/cav4/logout` | Revoga refresh tokens, encerra sessão |
| `GET` | `/v1/auth/cav4/session-check` | Verifica validade do JWT interno |
| `GET` | `/v1/auth/cav4/graph-me` | Diagnóstico de enriquecimento Graph |

**Configurações CAv4 (Parameter Store):**

| Parâmetro | Descrição |
|---|---|
| `CA_CLIENT_ID` | Client ID do app registrado no CAv4 |
| `CA_CLIENT_SECRET` | Client Secret (armazenado no Secrets Manager) |
| `CA_REDIRECT_URI` | URI de callback registrado |
| `OIDC_DISCOVERY_URL` | URL de discovery OIDC do IdP Petrobras |
| `CA_API_BASE_URL` | Base URL das APIs de autorização CAv4 |
| `CAV4_ADMIN_ROLE_NAMES` | CSV/JSON de roles que concedem perfil admin |
| `CAV4_SUPERVISOR_ROLE_NAMES` | CSV/JSON de roles que concedem perfil supervisor |
| `CAV4_INTERNAL_ROLE_NAMES` | CSV/JSON de roles que concedem perfil interno |

### 5.2. Modo Entra ID (Legado — Microsoft Azure AD)

Utilizado quando `AUTH_MODE=entra`. O frontend usa **MSAL SPA** (Authorization Code + PKCE sem client_secret). O backend apenas **valida** os tokens emitidos pela Microsoft.

**Fluxo:**

```
[1] Frontend: msal.loginRedirect(loginRequest)
[2] Microsoft redireciona → /auth/entra-callback com authorization code
[3] MSAL troca code por tokens (sem client_secret, PKCE nativo)
[4] Frontend → POST /api/v1/auth/entra/token { id_token, access_token }
[5] Backend valida id_token via JWKS (RS256, exp, iss, aud)
[6] Verifica membership no grupo GN_CLOUD_AWS_SCAC_USERS (via claims ou Graph fallback)
[7] Enriquece perfil via Microsoft Graph (/me, /me/manager, /me/photo/$value)
[8] sync_user_from_group() — cria/atualiza usuário local
[9] Emite JWT interno (480 min = 8h) + refresh token
```

**Controles adicionais:**
- Supervisor sem subordinados vinculados (`manager_id`) não recebe acesso
- Cargos em `_SUPERVISOR_TITLES` (gerente, coordenador, diretor, etc.) definem `is_supervisor=true`

**Endpoints Entra ID (Back End):**

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/v1/auth/entra/token` | Valida tokens MSAL, emite JWT interno |
| `POST` | `/v1/auth/entra/refresh` | Renova access token (rotation) |
| `POST` | `/v1/auth/entra/logout` | Revoga tokens + retorna ms_logout_url |
| `GET` | `/v1/auth/entra/me` | Dados do usuário autenticado |
| `GET` | `/v1/auth/entra/session-check` | Verifica validade da sessão |
| `POST` | `/v1/auth/entra/sync-group` | (Admin) Sincroniza membros do grupo AD |

### 5.3. Modo Local (Desenvolvimento / Externos)

Utilizado para usuários **externos** em qualquer ambiente e como fallback de desenvolvimento local (`AUTH_MODE=local`). Credenciais armazenadas na tabela `credential_local` com hash bcrypt + salt.

**Proteção contra brute-force:** bloqueio após 5 tentativas falhas consecutivas (`blocked_until` na tabela `credential_local`).

**Endpoints Auth Local:**

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/v1/auth/login` | Login email + senha |
| `POST` | `/v1/auth/logout` | Logout (revoga refresh tokens) |
| `POST` | `/v1/auth/refresh` | Renova access token |
| `POST` | `/v1/auth/forgot-password` | Solicita reset de senha |
| `POST` | `/v1/auth/reset-password` | Confirma reset com token |

### 5.4. JWT Interno — Especificação

| Campo | Valor |
|---|---|
| Algoritmo | HS256 |
| Issuer (`iss`) | `secure-share` |
| Duração access token | 60 min (CAv4) / 480 min (Entra) |
| Duração refresh token | 7 dias (hash SHA-256 em `session_token`) |
| Campos | `user_id`, `email`, `user_type`, `is_supervisor`, `exp`, `iss` |
| Refresh rotation | Sim — token antigo marcado `used=true`, novo emitido |

### 5.5. Modelo de Permissões (RBAC)

O sistema utiliza um modelo de permissões baseado em roles, resolvido pela função `resolve_permissions()`:

| Permissão | Admin | Supervisor | Internal | External |
|---|---|---|---|---|
| `shares:create` | ✓ | ✓ | ✓ | — |
| `shares:read` | ✓ | ✓ | ✓ | — |
| `shares:approve` | ✓ | ✓ | — | — |
| `shares:reject` | ✓ | ✓ | — | — |
| `shares:cancel` | ✓ | ✓ | ✓ | — |
| `shares:extend` | ✓ | ✓ | — | — |
| `file:upload` | ✓ | ✓ | ✓ | — |
| `report:read` | ✓ | ✓ | — | — |
| `admin:*` | ✓ | — | — | — |

---

## 6. Fluxos Funcionais Principais

### 6.1. Fluxo de Compartilhamento com Aprovação do Supervisor

```
Usuário Interno                Backend                    Supervisor           Usuário Externo
      │                           │                           │                      │
      │ POST /shares/create        │                           │                      │
      │ (FormData: files + meta)   │                           │                      │
      │──────────────────────────►│                           │                      │
      │                           │ 1. Cria Share (PENDING)   │                      │
      │                           │ 2. Upload S3 (key_s3)     │                      │
      │                           │ 3. Verifica cargo         │                      │
      │                           │    auto_approve? ────►────┤──(sim: ACTIVE)───►E-mail
      │                           │    NÃO → envia e-mail     │                      │
      │◄──────────────────────────│    ao supervisor          │                      │
      │ { share_id, status:PENDING}                           │                      │
      │                           │◄──────────────────────────│                      │
      │                           │  POST /supervisor/         │                      │
      │                           │  approve/{file_id}        │                      │
      │                           │ 1. Valida vínculo hierárq.│                      │
      │                           │ 2. Share → ACTIVE         │                      │
      │                           │ 3. Define expires_at      │                      │
      │                           │ 4. Reativa externo se     │                      │
      │                           │    inativo                │                      │
      │                           │ 5. E-mail ao externo ─────┼─────────────────────►│
      │◄────────────────── E-mail confirmação                 │                      │
      │                           │                           │                      │
```

### 6.2. Fluxo de Aprovação Automática por Cargo

Colaboradores com cargos elevados (Gerente, Diretor, Presidente, etc.) ou administradores têm seus compartilhamentos **auto-aprovados**, sem necessidade de intervenção do supervisor.

Lista configurável via `AUTO_APPROVE_JOB_TITLES` no Parameter Store. Padrão:
- Gerente Geral / Gerente Executivo(a)
- Ouvidor(a)-Geral da Petrobras
- Secretário(a)-Geral da Petrobras
- Chefe do Gabinete da Presidência
- Auditor(a)-Geral da Petrobras
- Diretor(a)
- Presidente
- Corregedor(a)-Geral da Petrobras

### 6.3. Fluxo de Download por Usuário Externo (OTP)

```
Externo                     Backend                      S3
   │                            │                         │
   │ POST /download/verify       │                         │
   │ { email: "p@exemplo.com" } │                         │
   │───────────────────────────►│                         │
   │                            │ Verifica shares ACTIVE   │
   │                            │ com email + não expirado │
   │                            │ Envia OTP (6 dígitos)    │
   │                            │ via SMTP Petrobras        │
   │◄───────────────────────────│                         │
   │                            │                         │
   │ POST /download/authenticate │                         │
   │ { email, code: "123456" }  │                         │
   │───────────────────────────►│                         │
   │                            │ Verifica OTP (max 5      │
   │                            │ tentativas, TTL 5min)    │
   │                            │ Emite token de acesso     │
   │◄───────────────────────────│                         │
   │ { access_token }           │                         │
   │                            │                         │
   │ GET /download/files        │                         │
   │ Authorization: Bearer ...  │                         │
   │───────────────────────────►│                         │
   │                            │ Lista arquivos do share  │
   │◄───────────────────────────│                         │
   │                            │                         │
   │ GET /download/files/{id}/url│                        │
   │───────────────────────────►│                         │
   │                            │ Gera presigned GET URL──►│
   │                            │◄────────────────────────│
   │◄───────────────────────────│                         │
   │ { url (presigned S3) }     │                         │
   │                            │                         │
   │ GET presigned URL ─────────┼────────────────────────►│
   │◄───────────────────────────┼─── stream arquivo ──────│
```

**Controles de segurança do OTP:**
- Validade: 5 minutos (configurável via `OTP_VALIDITY_MINUTES`)
- Máximo de tentativas: 5 (configurável via `OTP_MAX_ATTEMPTS`)
- Cooldown após bloqueio: 15 minutos (configurável via `OTP_COOLDOWN_MINUTES`)
- Hash SHA-256 do código armazenado na tabela `token_access`

---

## 7. API — Catálogo de Endpoints

Todos os endpoints são prefixados com `/api/v1/`. O Front End age como **BFF (Backend For Frontend)**, proxiando as chamadas para o Back End real (definido pela env `BACKEND_URL`).

### 7.1. Autenticação

#### CAv4 (Produção)
| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/auth/cav4/login` | — | Inicia fluxo OIDC (redirect) |
| `GET` | `/auth/cav4/callback` | — | Callback code/state |
| `POST` | `/auth/cav4/token` | — | Exchange BFF (JSON) |
| `POST` | `/auth/cav4/refresh` | `X-Refresh-Token` | Rotation de refresh token |
| `POST` | `/auth/cav4/logout` | Bearer JWT | Revoga sessão |
| `GET` | `/auth/cav4/session-check` | Bearer JWT | Valida JWT |
| `GET` | `/auth/cav4/graph-me` | Bearer JWT | Diagnóstico Graph |

#### Entra ID (Legado)
| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `POST` | `/auth/entra/token` | — | Valida MSAL tokens |
| `POST` | `/auth/entra/refresh` | `X-Refresh-Token` | Renova sessão |
| `POST` | `/auth/entra/logout` | Bearer JWT | Encerra sessão + logout Microsoft |
| `GET` | `/auth/entra/me` | Bearer JWT | Perfil do usuário |
| `GET` | `/auth/entra/session-check` | Bearer JWT | Valida JWT |

#### Local (Externos / Dev)
| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `POST` | `/auth/login` | — | Login email/senha |
| `POST` | `/auth/logout` | Bearer JWT | Logout |
| `POST` | `/auth/refresh` | — | Renova JWT |
| `POST` | `/auth/forgot-password` | — | Solicita reset |
| `POST` | `/auth/reset-password` | — | Confirma reset |

#### Externo (Portal OTP)
| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `POST` | `/auth/external/request-code` | — | Solicita OTP por e-mail |
| `POST` | `/auth/external/verify-code` | — | Verifica OTP e emite token |

### 7.2. Arquivos

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/files/` | Bearer JWT | Lista arquivos/shares do usuário (paginado) |
| `GET` | `/files/{file_id}` | Bearer JWT | Detalhes de um compartilhamento |
| `POST` | `/files/` | Bearer JWT | Cria metadados de arquivo |
| `POST` | `/files/upload` | Bearer JWT | Upload via FormData (cria share) |
| `DELETE` | `/files/{file_id}` | Bearer JWT | Cancela compartilhamento |
| `GET` | `/files/{file_id}/presigned-upload` | Bearer JWT | URL presignada para upload S3 (default 600s) |
| `GET` | `/files/{file_id}/presigned-download` | Bearer JWT | URL presignada para download S3 (default 300s) |

### 7.3. Compartilhamentos (Shares)

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `POST` | `/shares/` | Bearer JWT | Cria compartilhamento (file_ids existentes) |
| `POST` | `/shares/create` | Bearer JWT | Cria com upload simultâneo (FormData + JSON) |
| `GET` | `/shares/` | Bearer JWT | Lista compartilhamentos do usuário |
| `GET` | `/shares/my-shares` | Bearer JWT | Meus compartilhamentos (resumo) |
| `GET` | `/shares/{share_id}` | Bearer JWT | Detalhes completos do share |
| `PATCH` | `/shares/{share_id}/cancel` | Bearer JWT | Cancela compartilhamento |
| `GET` | `/shares/{share_id}/email-logs` | Bearer JWT | Logs de e-mails do share |
| `POST` | `/shares/{share_id}/resend` | Bearer JWT | Reenvio de notificação |

### 7.4. Supervisor

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/supervisor/pending` | Supervisor | Lista compartilhamentos pendentes dos supervisionados |
| `POST` | `/supervisor/approve/{file_id}` | Supervisor | Aprova compartilhamento |
| `POST` | `/supervisor/reject/{file_id}` | Supervisor | Rejeita compartilhamento |
| `PUT` | `/supervisor/extend/{file_id}` | Supervisor | Estende expiração (máx. +72h) |
| `GET` | `/supervisor/shares` | Supervisor | Lista todos os shares dos supervisionados |
| `GET` | `/supervisor/shares/{share_id}` | Supervisor | Detalhes completos para supervisor |
| `GET` | `/supervisor/areas/{area_id}/report` | Supervisor | Relatório de área |
| `GET` | `/supervisor/export/shares` | Supervisor | Exportação CSV dos compartilhamentos |
| `GET` | `/supervisor/shares/{share_id}/download-zip` | Supervisor | Download ZIP do compartilhamento |

### 7.5. Administrador

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/admin/dashboard` | Admin | Métricas globais |
| `GET` | `/admin/users` | Admin | Lista todos os usuários |
| `GET` | `/admin/shares` | Admin | Lista todos os compartilhamentos |
| `GET` | `/admin/logs` | Admin | Todos os logs de auditoria |
| `GET` | `/admin/tracking/by-email` | Admin | Rastreamento completo por e-mail |
| `PATCH` | `/admin/users/{id}/admin` | Admin | Promover/rebaixar admin |
| `POST` | `/admin/actions` | Admin | Ações administrativas (cleanup, etc.) |
| `GET` | `/admin/export/users` | Admin | Exportação CSV de usuários |
| `GET` | `/admin/export/shares` | Admin | Exportação CSV de compartilhamentos |
| `GET` | `/admin/export/logs` | Admin | Exportação CSV de logs |

### 7.6. Download (Portal Externo)

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `POST` | `/download/verify` | — | Verifica e-mail e envia OTP |
| `POST` | `/download/authenticate` | — | Valida OTP, emite token de acesso |
| `GET` | `/download/files` | Token Externo | Lista arquivos disponíveis |
| `GET` | `/download/files/{file_id}/url` | Token Externo | URL de download presignada |
| `GET` | `/download/files/zip` | Token Externo | Download de todos os arquivos em ZIP |

### 7.7. Demais

| Módulo | Prefixo | Descrição |
|---|---|---|
| Auditoria | `/audit/` | Consulta de logs e métricas de auditoria |
| Áreas | `/areas/` | Gestão de áreas/prefixos S3 |
| Notificações | `/notifications/` | Listagem, marcação como lida |
| E-mails | `/emails/` | Histórico e status de e-mails |
| Diagnóstico | `/diagnostico/` | Verificação de parâmetros de configuração |
| MIP Auth | `/mip/auth/` | Device code flow para autenticação MIP SDK |
| Suporte | `/support/` | Cadastro de usuários externos pelo suporte |
| SQL Explorer | `/sql-explorer/` | (Admin) Execução de queries ad-hoc |
| Roadmap | `/roadmap/` | Gerenciamento de fases, marcos e entregas |

---

## 8. Modelo de Dados — Banco de Dados

O banco de dados é **Amazon Aurora PostgreSQL**, gerenciado com migrações Alembic. Abaixo está o esquema completo com todas as tabelas e seus propósitos.

### 8.1. Diagrama de Relacionamento

```
user ◄─────────────── credential_local (1:1)
 │
 ├── manager_id ──► user (auto-referência: hierarquia)
 │
 ├──────────────► share (created_by_id)
 │                  │
 │                  ├──────────────► share_file ◄──── restricted_file
 │                  │                                       │
 │                  │                              ◄── shared_area ◄── areasupervisor ◄── user
 │                  │
 │                  ├──────────────► token_access
 │                  ├──────────────► audit
 │                  ├──────────────► email_log
 │                  └──────────────► notification (user)
 │
 └──────────────► session_token
 └──────────────► support_registration ◄── support_audit
```

### 8.2. Tabelas

#### `user`
Tabela central. Armazena todos os perfis: internos (Petrobras), externos (parceiros), supervisores e administradores.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `INTEGER PK` | Identificador único |
| `type` | `ENUM(externo, internal)` | Tipo do usuário |
| `name` | `VARCHAR(255)` | Nome completo |
| `email` | `VARCHAR(255) UNIQUE` | E-mail (chave de login) |
| `phone` | `VARCHAR(20)` | Telefone |
| `department` | `VARCHAR(255)` | Departamento / área |
| `job_title` | `VARCHAR(255)` | Cargo (usado para auto-aprovação) |
| `employee_id` | `VARCHAR(50)` | Matrícula Petrobras (= `user_login` CAv4) |
| `photo_url` | `VARCHAR(500)` | URL da foto (base64 data URI do Graph) |
| `manager_id` | `INTEGER FK → user.id` | Gestor imediato (supervisor hierárquico) |
| `is_supervisor` | `BOOLEAN` | Pode aprovar/rejeitar compartilhamentos |
| `is_admin` | `BOOLEAN` | Super administrador global |
| `status` | `BOOLEAN` | Ativo / Inativo |
| `login_cav4` | `VARCHAR(50)` | Login/matrícula do CAv4 (migration add_login_cav4) |
| `created_at` | `TIMESTAMPTZ` | Data de criação |
| `last_login` | `TIMESTAMPTZ` | Último acesso |

**Índices:** email, type, manager_id, is_supervisor, is_admin, status

#### `credential_local`
Credenciais de autenticação local exclusivamente para usuários **externos**. Usuários internos autenticam via CAv4/Entra ID e **não possuem** registro nesta tabela.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `INTEGER PK` | — |
| `user_id` | `INTEGER FK → user.id (CASCADE)` | — |
| `password_hash` | `VARCHAR(255)` | Hash SHA-256 (bcrypt) da senha |
| `salt` | `VARCHAR(64)` | Salt único por usuário |
| `failed_attempts` | `INTEGER` | Tentativas falhas consecutivas |
| `blocked_until` | `TIMESTAMPTZ` | Bloqueio temporário (brute-force) |
| `created_at` | `TIMESTAMPTZ` | — |
| `updated_at` | `TIMESTAMPTZ` | — |

#### `shared_area`
Áreas lógicas de armazenamento no S3. Cada área tem um prefixo único que organiza os arquivos no bucket.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `INTEGER PK` | — |
| `name` | `VARCHAR(255)` | Nome da área |
| `prefix_s3` | `VARCHAR(500)` | Prefixo no bucket S3 |
| `description` | `TEXT` | Descrição |
| `status` | `BOOLEAN` | Ativa/Inativa |
| `expires_at` | `TIMESTAMPTZ` | Expiração da área |
| `applicant_id` | `INTEGER FK → user.id` | Usuário criador |

#### `areasupervisor`
Tabela de associação N:N entre áreas e supervisores.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `INTEGER PK` | — |
| `area_id` | `INTEGER FK → shared_area.id (CASCADE)` | — |
| `supervisor_id` | `INTEGER FK → user.id (CASCADE)` | — |

#### `restricted_file`
Metadados de todos os arquivos enviados ao S3. O arquivo físico reside no S3; este registro guarda o mapeamento.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `INTEGER PK` | — |
| `area_id` | `INTEGER FK → shared_area.id` | Área de pertencimento |
| `name` | `VARCHAR(500)` | Nome original do arquivo |
| `key_s3` | `VARCHAR(1000)` | Chave completa no bucket S3 |
| `size_bytes` | `BIGINT` | Tamanho em bytes |
| `mime_type` | `VARCHAR(255)` | Tipo MIME |
| `checksum` | `VARCHAR(128)` | Hash MD5/SHA para verificação de integridade |
| `upload_id` | `INTEGER FK → user.id` | Usuário que fez o upload |
| `expires_at` | `TIMESTAMPTZ` | Expiração individual |
| `status` | `BOOLEAN` | Ativo / Excluído (soft delete) |

#### `share`
Entidade central de compartilhamento. Representa uma solicitação de transferência de arquivo(s) para um destinatário externo, com ciclo de vida completo.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `INTEGER PK` | — |
| `name` | `VARCHAR(255)` | Título do compartilhamento |
| `description` | `VARCHAR(1000)` | Descrição |
| `area_id` | `INTEGER FK → shared_area.id` | Área relacionada |
| `external_email` | `VARCHAR(255)` | E-mail do destinatário externo |
| `recipient_user_id` | `INTEGER FK → user.id` | Usuário externo provisionado |
| `status` | `ENUM(sharestatus)` | Estado atual (ver tabela abaixo) |
| `consumption_policy` | `ENUM(apos_todos, apos_primeiro)` | Política de expiração por download |
| `expiration_hours` | `INTEGER` | Horas de validade solicitadas |
| `expires_at` | `TIMESTAMPTZ` | Data efetiva de expiração |
| `created_by_id` | `INTEGER FK → user.id` | Solicitante interno |
| `approver_id` | `INTEGER FK → user.id` | Supervisor que aprovou/rejeitou |
| `approved_at` | `TIMESTAMPTZ` | Data de aprovação |
| `rejected_at` | `TIMESTAMPTZ` | Data de rejeição |
| `rejection_reason` | `VARCHAR(500)` | Motivo da rejeição |
| `approval_comments` | `VARCHAR(500)` | Comentários do aprovador |

**Estados (`sharestatus` ENUM):**

| Status | Descrição |
|---|---|
| `pendente` | Aguardando aprovação do supervisor |
| `aprovado` | Aprovado, aguardando notificação ao externo |
| `ativo` | Disponível para download |
| `rejeitado` | Rejeitado pelo supervisor |
| `concluido` | Todos os arquivos baixados |
| `expirado` | TTL expirado |
| `cancelado` | Cancelado pelo solicitante |

#### `share_file`
Tabela de associação N:N entre compartilhamentos e arquivos. Registra também o status de download por arquivo.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `INTEGER PK` | — |
| `share_id` | `INTEGER FK → share.id (CASCADE)` | — |
| `file_id` | `INTEGER FK → restricted_file.id (CASCADE)` | — |
| `downloaded` | `BOOLEAN` | Se o arquivo foi baixado |
| `downloaded_at` | `TIMESTAMPTZ` | Data/hora do download |

#### `token_access`
Tokens de autenticação para o portal externo: OTP (código numérico) e access token (link longo).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `INTEGER PK` | — |
| `type` | `ENUM(otp, access)` | Tipo do token |
| `token` | `VARCHAR(500)` | Token de acesso |
| `token_hash` | `VARCHAR(128)` | Hash SHA-256 do OTP |
| `user_id` | `INTEGER FK → user.id (CASCADE)` | Usuário externo |
| `share_id` | `INTEGER FK → share.id (CASCADE)` | Share relacionado |
| `expires_at` | `TIMESTAMPTZ` | Expiração |
| `used` | `BOOLEAN` | Se já foi utilizado |
| `attempts` | `INTEGER` | Tentativas de verificação |
| `blocked_until` | `TIMESTAMPTZ` | Bloqueio por excesso de tentativas |

#### `audit`
Trilha de auditoria imutável. Cada ação relevante do sistema gera um registro via `log_event()`.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `INTEGER PK` | — |
| `action` | `VARCHAR(100)` | Ex: LOGIN_CAV4, UPLOAD_ARQUIVOS, APROVAR_SHARE |
| `level` | `ENUM(info, success, warning, error)` | Severidade |
| `user_id` | `INTEGER FK → user.id` | Ator |
| `share_id` | `INTEGER FK → share.id` | Share relacionado (se aplicável) |
| `file_id` | `INTEGER FK → restricted_file.id` | Arquivo relacionado |
| `ip_address` | `VARCHAR(45)` | IP do cliente |
| `user_agent` | `VARCHAR(500)` | User-Agent do cliente |
| `detail` | `TEXT` | Detalhes em texto livre / JSON |
| `created_at` | `TIMESTAMPTZ` | Timestamp imutável |

**Ações de auditoria catalogadas:** `LOGIN`, `LOGIN_CAV4`, `LOGIN_ENTRA_MSAL`, `LOGIN_BLOCKED_NOT_IN_GROUP`, `LOGOUT`, `LOGOUT_CAV4`, `REFRESH_TOKEN`, `REFRESH_CAV4`, `UPLOAD_ARQUIVOS`, `CRIAR_SHARE`, `AUTO_APROVAR_SHARE_CARGO`, `AUTO_APROVAR_SHARE_SUPERVISOR`, `APROVAR_SHARE`, `REJEITAR_SHARE`, `ESTENDER_EXPIRACAO`, `CANCELAR_FILE`, `DOWNLOAD_FILE`, `PRESIGNED_UPLOAD`, `VER_PENDENTES`, `VER_RELATORIO_AREA`, `REATIVAR_USUARIO_EXTERNO`, `LISTAR_ARQUIVOS`

#### `notification`
Notificações in-app para usuários internos/supervisores.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `INTEGER PK` | — |
| `user_id` | `INTEGER FK → user.id (CASCADE)` | Destinatário |
| `type` | `ENUM` | info, success, warning, error, approval, rejection, download, expiration |
| `priority` | `ENUM(low, medium, high, urgent)` | Prioridade |
| `title` | `VARCHAR(255)` | Título |
| `message` | `VARCHAR(1000)` | Mensagem |
| `read` | `BOOLEAN` | Se foi lida |
| `action_label` | `VARCHAR(100)` | Texto do botão CTA |
| `action_url` | `VARCHAR(500)` | URL do CTA |
| `extra_metadata` | `TEXT` | JSON adicional |

#### `email_log`
Rastreamento completo de todos os e-mails enviados pelo sistema, com suporte a eventos de entrega (delivered, opened, clicked, bounced).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `INTEGER PK` | — |
| `message_id` | `VARCHAR(255) UNIQUE` | ID do e-mail (SES ou SMTP) |
| `email_type` | `ENUM` | otp_verification, share_notification, share_approved, share_rejected, etc. |
| `from_email` | `VARCHAR(255)` | Remetente |
| `to_email` | `VARCHAR(255)` | Destinatário |
| `subject` | `VARCHAR(500)` | Assunto |
| `status` | `ENUM` | pending → sent → delivered → opened / bounced / failed |
| `sent_at` | `TIMESTAMPTZ` | Data de envio |
| `delivered_at / opened_at / clicked_at / bounced_at` | `TIMESTAMPTZ` | Timestamps de eventos |
| `error_message / error_code` | `VARCHAR` | Detalhes de erro |
| `user_id / share_id` | `INTEGER FK` | Relacionamentos |

#### `session_token`
Tokens de sessão persistidos para refresh rotation e reset de senha.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `INTEGER PK` | — |
| `user_id` | `INTEGER FK → user.id (CASCADE)` | Proprietário |
| `token_hash` | `VARCHAR(255)` | Hash SHA-256 do token |
| `token_type` | `ENUM(refresh, reset)` | Tipo |
| `expires_at` | `TIMESTAMPTZ` | Validade |
| `used` | `BOOLEAN` | Consumido |
| `revoked` | `BOOLEAN` | Revogado (logout) |
| `ip_address` | `VARCHAR(45)` | IP de criação |
| `user_agent` | `VARCHAR(500)` | Navegador de criação |

#### `support_registration`
Registro de cadastros/reativações de usuários externos realizados pelo time de suporte via chamados ServiceNow.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `INTEGER PK` | — |
| `request_number` | `VARCHAR(50)` | Número do chamado ServiceNow |
| `requester_email` | `VARCHAR(255)` | Solicitante interno |
| `external_user_email` | `VARCHAR(255)` | E-mail do externo cadastrado |
| `registered_by_name` | `VARCHAR(255)` | Atendente responsável |
| `status` | `ENUM(ativo, pendente, inativo, cancelado)` | Status do cadastro |
| `is_reactivation` | `BOOLEAN` | Se foi reativação de conta |

#### `support_audit`
Auditoria específica das ações do time de suporte.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `INTEGER PK` | — |
| `action` | `ENUM(CADASTRO, REATIVACAO, INATIVACAO, ALTERACAO, CONSULTA)` | Ação realizada |
| `support_user_id` | `INTEGER FK → user.id` | Atendente |
| `registration_id` | `INTEGER FK → support_registration.id` | Registro relacionado |
| `affected_user_id` | `INTEGER FK → user.id` | Usuário afetado |

---

## 9. Integrações Externas

### 9.1. CAv4 — Identity Provider Corporativo Petrobras

O CAv4 é o **Identity Provider OIDC/OAuth 2.0 da Petrobras**, responsável por autenticar todos os colaboradores internos.

| Aspecto | Detalhe |
|---|---|
| Protocolo | OIDC Authorization Code + PKCE (RFC 7636) |
| Descoberta | `OIDC_DISCOVERY_URL` → recupera authorization_endpoint, token_endpoint, jwks_uri |
| Validação do token | RS256 via JWKS; verificação de exp, iss, aud, nonce |
| Extração de login | `sub`, `preferred_username` ou `email` das claims |
| Consulta de roles | `GET {CA_API_BASE_URL}/v1/users/{login}/roles` (via `cav4_client.py`) |
| Resources/Permissões | `GET {CA_API_BASE_URL}/v1/users/{login}/resources` |
| SSL / TLS | Truststore corporativo Petrobras (`CA_SSL_CERT_FILE`, `CA_SSL_USE_TRUSTSTORE`) |
| Fallback de e-mail | Se claims não tiverem e-mail: `{user_login}@petrobras.com.br` |

### 9.2. Microsoft Entra ID (Azure Active Directory)

Utilizado para dois fins distintos:

**a) Autenticação (modo `AUTH_MODE=entra` — legado):**
- Fluxo MSAL SPA no frontend (Authorization Code + PKCE)
- Verificação de pertencimento ao grupo `GN_CLOUD_AWS_SCAC_USERS` via claims ou Graph API
- Validação de id_token via JWKS: `https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys`

**b) Enriquecimento de Perfil (Microsoft Graph — usado em ambos os modos):**

| Dado | Endpoint Graph | Uso no SCAC |
|---|---|---|
| Cargo (`jobTitle`) | `GET /v1.0/me` | Aprovação automática; exibição no perfil |
| Departamento | `GET /v1.0/me` | Exibição e filtros |
| Matrícula (`employeeId`) | `GET /v1.0/me` | Correlação com `employee_id` |
| Nome do gestor | `GET /v1.0/me/manager` | Vínculo `manager_id` na tabela `user` |
| E-mail do gestor | `GET /v1.0/me/manager` | Notificações ao supervisor |
| Foto | `GET /v1.0/me/photo/$value` | Avatar em base64 no perfil |

**Postura de falha:** `GRAPH_REQUIRED=false` (padrão) — login não é bloqueado se Graph falhar. Configurável para `true` em ambientes que exijam dados organizacionais completos.

**Credenciais (Secrets Manager):**
- `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`
- App Registration separado para Purview: `ENTRA_CLIENT_ID_PURVIEW`, `ENTRA_CLIENT_SECRET_PURVIEW`

### 9.3. Microsoft Purview / MIP (Microsoft Information Protection)

Integração com o SDK MIP para operações em rótulos de confidencialidade em arquivos.

| Aspecto | Detalhe |
|---|---|
| Serviço | MIP SDK dedicado (`mip_sdk_base_url`) |
| Autenticação | Device code flow (padrão) ou popup MSAL (configurável via `NEXT_PUBLIC_MIP_AUTH_MODE`) |
| Operações | Consulta e alteração de rótulos MIP antes do compartilhamento |
| Configuração | `MIP_PROCESSING_ENABLED`, `MIP_FAIL_CLOSED`, `MIP_PROCESSING_TIMEOUT_SECONDS` |
| Falha fechada | Se `MIP_FAIL_CLOSED=true` e o SDK falhar, a operação é **bloqueada** |
| TLS | `MIP_SDK_VERIFY_TLS=false` (padrão — CA corporativa auto-assinada Petrobras) |

### 9.4. Amazon S3

| Aspecto | Detalhe |
|---|---|
| Uso | Armazenamento de todos os arquivos (metadados no PostgreSQL, binários no S3) |
| Bucket | Configurado via `AWS_S3_BUCKET` / Parameter Store `AWS_S3_BUCKET` |
| Autenticação | IAM Role do ECS Task (produção); chaves de acesso no `.env` (dev local) |
| Upload | `s3.put_object()` via Back End; presigned PUT URL para grandes arquivos |
| Download | `StreamingResponse` via Back End ou presigned GET URL (TTL padrão 300s) |
| Estrutura de chave | `{area_prefix}/{share_id}_{uuid}_{safe_filename}` |
| Cleanup | Delete automático do objeto S3 em cancelamento e rejeição |

### 9.5. SMTP Petrobras (E-mail Corporativo)

| Aspecto | Detalhe |
|---|---|
| Servidor | `smtp.petrobras.com.br` — porta 25 — STARTTLS — sem autenticação |
| Provider | `EMAIL_PROVIDER=smtp_internal` |
| Header X-Route | `MAIL_ROUTE`: valor para desvio em não-produção (ex: `TESTE_TIC` → cc-test_apps_tic) |
| Header X-Protecao | `MAIL_PROTECTION`: ex: `CONFIDENCIAL` → Exchange aplica criptografia MIP automaticamente |
| Alternativa | Amazon SES (`EMAIL_PROVIDER=ses`) |

**E-mails enviados pelo sistema:**

| Tipo | Gatilho |
|---|---|
| `otp_verification` | Externo solicita acesso ao portal de download |
| `share_notification` | Supervisor notificado sobre compartilhamento pendente |
| `share_approved` | Externo e solicitante notificados após aprovação |
| `share_rejected` | Solicitante notificado sobre rejeição |
| `download_complete` | Confirmação de download concluído |
| `expiration_warning` | Aviso de expiração próxima |
| `password_reset` | Reset de senha para externos |
| `welcome` | Boas-vindas ao novo usuário externo |

---

## 10. Configurações e Gerenciamento de Segredos

### 10.1. Hierarquia de Configuração (Maior → Menor Precedência)

1. Variável de ambiente já presente em `os.environ` (injetada pelo ECS Task Definition)
2. Secrets Manager (via ponteiro no Parameter Store)
3. Parameter Store (parâmetros não-sensíveis)
4. Defaults da classe `Settings()` (pydantic-settings)

### 10.2. Convenções de Nomenclatura — Parameter Store

| Ambiente | Path |
|---|---|
| DSV, TST, HMG | `/APP/{CdkAppServiceName}-{AMBIENTE}/{NOME_VARIAVEL}` |
| PRD | `/APP/{CdkAppServiceName}/{NOME_VARIAVEL}` (sem sufixo) |

**Exemplos (DSV):**
```
/APP/backend-dsv/DATABASE_URL
/APP/backend-dsv/STORAGE_PROVIDER
/APP/backend-dsv/AUTH_MODE
/APP/backend-dsv/EMAIL_PROVIDER
/APP/backend-dsv/AWS_REGION
/APP/backend-dsv/AWS_S3_BUCKET
/APP/backend-dsv/FRONTEND_EXTERNAL_PORTAL_URL
/APP/backend-dsv/FRONTEND_SHARE_DETAILS_URL
/APP/backend-dsv/FRONTEND_SUPERVISOR_URL
/APP/backend-dsv/SECRETS_MANAGER/backend_dsv_secret
```

### 10.3. Segredos (Secrets Manager)

Armazenados como JSON (`SecretString`) no AWS Secrets Manager. Exemplo — `backend_dsv_secret`:

```json
{
  "ENTRA_TENANT_ID": "...",
  "ENTRA_CLIENT_ID": "...",
  "ENTRA_CLIENT_SECRET": "...",
  "ENTRA_CLIENT_ID_PURVIEW": "...",
  "ENTRA_CLIENT_SECRET_PURVIEW": "...",
  "CA_CLIENT_ID": "...",
  "CA_CLIENT_SECRET": "...",
  "JWT_SECRET": "...",
  "SMTP_PASS": "..."
}
```

### 10.4. Parâmetros Não-Sensíveis (Parameter Store)

```
SMTP_SERVER, SMTP_PORT, SMTP_USER, MAIL_FROM
```

> **Diretriz:** Credenciais AWS **não devem** constar no secret quando a Task ECS utiliza IAM Role. O boto3 usa a cadeia de credenciais padrão (IAM Role → env → `~/.aws`).

### 10.5. Modo `USE_AWS_CONFIG=true`

Em execução local ou Lambda (sem pipeline CDK), a aplicação pode carregar as configurações diretamente do SSM/Secrets Manager em runtime, ativando `USE_AWS_CONFIG=true`.

---

## 11. Infraestrutura e Deploy (AWS / ECS)

### 11.1. Execução em Contêineres

Ambos os componentes (Front End e Back End) são conteinerizados com **Dockerfile multi-stage** e publicados no registry interno Petrobras (`registry.petrobras.com.br`).

**Back End — Estratégia Dockerfile:**
```
Stage 1 (builder): python3.12-slim + gcc + libpq-dev → compila wheels
Stage 2 (runtime): python3.12-slim → instala wheels pré-compilados
Entrypoint: entrypoint.sh → alembic upgrade head → uvicorn
Porta: 8080
```

**Front End — Estratégia:**
```
Build: next build (force-dynamic para leitura de env em runtime)
Runtime: Node.js 20
Porta: 3000
Variáveis runtime via window.__ENV__ injetado no Server Component
```

### 11.2. Variáveis de Ambiente ECS (Task Definition)

O pipeline CDK Petrobras injeta automaticamente os parâmetros do Parameter Store como variáveis de ambiente na Task Definition do ECS. Configuração controlada por:

- `CDK_APP_SERVICE_NAME`: nome do módulo CDK (ex: `backend`, `frontend`)
- `APP_ENV`: ambiente (`dsv`, `tst`, `hmg`, `prd`)
- `USE_AWS_CONFIG`: habilita carregamento em runtime (para cenários não-ECS)

### 11.3. Ambientes

| Ambiente | Sufixo SSM | Descrição |
|---|---|---|
| DSV | `-dsv` | Desenvolvimento e integração |
| TST | `-tst` | Testes funcionais |
| HMG | `-hmg` | Homologação (pre-produção) |
| PRD | (sem sufixo) | Produção |

### 11.4. Pipeline CI/CD

O repositório backend contém workflows GitHub Actions:

| Workflow | Arquivo | Descrição |
|---|---|---|
| Snapshot | `snapshot.yml` | Build e push de imagem de snapshot |
| Start Release | `start-release.yml` | Inicia processo de release |
| Finish Release | `finish-release.yml` | Finaliza release e tag |
| Redeploy | `redeploy.yml` | Força redeploy no ECS |

---

## 12. Segurança

### 12.1. Autenticação e Sessão

- **JWT HS256** para sessões internas, com `issuer=secure-share` validado em todos os endpoints protegidos
- **Refresh token rotation:** cada uso invalida o token anterior e emite um novo
- **Tokens nunca armazenados em texto plano:** apenas hash SHA-256 em `session_token.token_hash`
- **OTP nunca em texto plano:** hash SHA-256 em `token_access.token_hash`

### 12.2. Controle de Acesso

- **Autorização por permissão:** middleware `require_permission(permission_string)` aplicado em cada endpoint
- **Scoping hierárquico:** supervisores só veem compartilhamentos dos seus supervisionados (`manager_id == supervisor.id`)
- **PKCE obrigatório:** todos os fluxos OAuth 2.0 utilizam PKCE (RFC 7636), eliminando a necessidade de client_secret no frontend

### 12.3. Upload de Arquivos

**Extensões bloqueadas (validação no Front End):**
```
.exe .dll .bat .cmd .com .msi .scr .vbs .ps1 .sh
```

- Nomes de arquivo sanitizados antes do upload (`sanitize_filename()`)
- Validação de MIME type
- Limites práticos de tamanho: definidos por timeout de infraestrutura (proxy/ALB/gateway) e recursos do container ECS

### 12.4. Proteção de Dados Sensíveis

- Senhas de externos com **bcrypt** (salt único por usuário)
- Credenciais AWS não hardcoded — IAM Role em produção, `.env` apenas em dev local
- Comunicação entre serviços exclusivamente via HTTPS
- `PYTHONDONTWRITEBYTECODE=1` e `PYTHONUNBUFFERED=1` no container

### 12.5. Auditoria e Rastreabilidade

Toda operação sensível registra IP de origem e User-Agent. A tabela `audit` é imutável por design (sem endpoint de deleção). Eventos críticos auditados: todos os logins, logouts, uploads, aprovações, rejeições, downloads e ações administrativas.

---

## 13. Regras de Negócio Críticas

| Regra | Implementação |
|---|---|
| **Supervisor obrigatório** | `ShareNoSupervisorError` lançada se usuário não tem `manager_id` definido (exceto cargos auto-aprovados) |
| **Aprovação automática por cargo** | `has_auto_approve_job_title()` compara `job_title` (case-insensitive, sem acento) contra `AUTO_APPROVE_JOB_TITLES` |
| **Supervisor só aprova seus subordinados** | Validação `creator.manager_id == user.id` em approve/reject/extend |
| **Supervisor sem subordinados não acessa** | No fluxo Entra: verificação `supervised_count == 0` bloqueia login |
| **Refresh token rotation** | Token anterior marcado `used=true` e `revoked=true` ao emitir novo |
| **OTP com rate limiting** | 5 tentativas → bloqueio temporário de 15 minutos |
| **Expiração de compartilhamento** | `expires_at` definido no momento da aprovação: `now + timedelta(hours=expiration_hours)` |
| **Extensão máxima** | Supervisor pode estender no máximo 72h adicionais por operação |
| **Revogação de externo** | Após rejeição ou expiração: `deactivate_external_if_no_active_share()` desativa o usuário externo se não tiver outros shares ativos |
| **Reativação de externo** | Na aprovação de share: externo inativo é reativado automaticamente |
| **Cleanup de tokens** | `_cleanup_expired_tokens()` remove tokens expirados/usados periodicamente |
| **Fallback de e-mail CAv4** | Se claims não contiverem e-mail: `{user_login}@petrobras.com.br` |

---

## 14. Testes e Qualidade

### 14.1. Front End (Jest)

Testes unitários e de integração dos componentes React. Cobertura esperada em fluxos críticos: upload, formulários de compartilhamento, callbacks de autenticação.

Arquivos de teste identificados no projeto:
- `app/api/auth/external/request-code/route.test.ts`
- `app/api/auth/external/verify-code/route.test.ts`
- `app/api/auth/internal/callback/route.test.ts`
- `app/api/auth/internal/login/route.test.ts`
- `app/api/auth/internal/logout/route.test.ts`
- `app/api/auth/internal/signup/route.test.ts`
- `app/api/auth/internal/sync-entra/route.test.ts`
- `app/api/auth/forgot-password/route.test.ts`
- `app/api/auth/reset-password/route.test.ts`
- `app/api/auth/login/route.test.ts`
- `app/api/auth/logout/route.test.ts`
- `app/api/auth/refresh/route.test.ts`

### 14.2. Back End (Pytest)

Testes unitários e de integração das rotas FastAPI, serviços e models. Executados no pipeline CI antes de cada build.

### 14.3. Padrões de Qualidade

- Type hints obrigatórios em Python (Pydantic + mypy)
- TypeScript strict mode no Front End
- Pull Request template com checklist (`.github/pull_request_template.md`)
- CODEOWNERS configurado (`.github/CODEOWNERS`)

---

## 15. Ambientes

| Parâmetro | DSV | TST | HMG | PRD |
|---|---|---|---|---|
| `AUTH_MODE` | `local` ou `cav4` | `cav4` | `cav4` | `cav4` |
| `STORAGE_PROVIDER` | `local` | `aws` | `aws` | `aws` |
| `EMAIL_PROVIDER` | `dev` (log) | `smtp_internal` | `smtp_internal` | `smtp_internal` |
| `MAIL_ROUTE` | `TESTE_TIC` | `TESTE_TIC` | vazio | vazio |
| `MIP_PROCESSING_ENABLED` | `false` | `true` | `true` | `true` |
| `MIP_FAIL_CLOSED` | `false` | `false` | `true` | `true` |
| `GRAPH_REQUIRED` | `false` | `false` | `true` | `true` |
| `SEED_ON_STARTUP` | `true` | `false` | `false` | `false` |
| Banco | PostgreSQL local / Neon | Aurora DSV | Aurora HMG | Aurora PRD |
| S3 Bucket | N/A (local) | `scac-dsv` | `scac-hmg` | `scac-prd` |

---

## 16. Glossário

| Termo | Definição |
|---|---|
| **SCAC** | Solução de Compartilhamento de Arquivos Confidenciais — nome do sistema |
| **A12022** | Código interno do projeto na Petrobras |
| **CAv4** | Central de Autenticação versão 4 — IdP corporativo OIDC/OAuth 2.0 da Petrobras |
| **Entra ID** | Microsoft Azure Active Directory (modo de autenticação legado) |
| **MIP** | Microsoft Information Protection — framework de rótulos de confidencialidade |
| **Purview** | Microsoft Purview — plataforma de governança de dados que inclui o MIP |
| **PKCE** | Proof Key for Code Exchange (RFC 7636) — extensão OAuth 2.0 para SPAs |
| **JWKS** | JSON Web Key Set — conjunto de chaves públicas para validação de JWTs RS256 |
| **OTP** | One-Time Password — código numérico de uso único enviado por e-mail |
| **BFF** | Backend For Frontend — o Next.js atua como proxy entre o browser e o Back End |
| **ECS** | Amazon Elastic Container Service — orquestrador de contêineres AWS |
| **SSM** | AWS Systems Manager Parameter Store — armazenamento de configurações |
| **Aurora** | Amazon Aurora PostgreSQL — banco relacional gerenciado Multi-AZ |
| **Presigned URL** | URL pré-assinada do S3 com TTL, permitindo acesso direto sem credenciais |
| **Supervisor** | Colaborador com permissão de aprovação sobre os compartilhamentos de sua equipe |
| **share** | Entidade que representa uma solicitação de compartilhamento de arquivo(s) com um externo |
| **Auto-aprovação** | Compartilhamentos criados por cargos elevados são aprovados sem intervenção do supervisor |
| **Refresh Rotation** | Estratégia em que cada uso do refresh token gera um novo, invalidando o anterior |
| **structlog** | Biblioteca de logging estruturado em JSON, usada no Back End em produção |
| **Alembic** | Ferramenta de migração de banco de dados para SQLAlchemy/SQLModel |
| **ServiceNow** | Plataforma ITSM da Petrobras usada para abertura de chamados de cadastro de externos |
