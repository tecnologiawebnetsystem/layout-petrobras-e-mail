# SCAC — Compartilhamento Seguro de Arquivos · Frontend

> Interface web desenvolvida com **Next.js 16** para o sistema corporativo de compartilhamento seguro de arquivos da Petrobras.
> Usuários internos autenticados via **Microsoft Entra ID** fazem upload, criam compartilhamentos e acompanham aprovações. Supervisores aprovam/rejeitam. Destinatários externos recebem acesso via **OTP por e-mail**.

---

## Sobre o Projeto

O frontend do **SCAC** (Solução de Compartilhamento de Arquivos Confidenciais) é uma aplicação Next.js com **App Router** e um padrão BFF (Backend-For-Frontend) via **Route Handlers** para toda comunicação com o `csa-backend`. Nenhuma chamada HTTP é feita diretamente do browser para o backend — toda requisição passa pelos Route Handlers do Next.js, que injetam autenticação e repassam ao serviço Python.

---

## Stack Tecnológica

### Core

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Next.js** | 16.2.6 | Framework React — App Router, Route Handlers, output standalone |
| **React** | 19.2.0 | Biblioteca de UI |
| **TypeScript** | 5.x | Tipagem estática |
| **Tailwind CSS** | 4.x | Framework CSS via `@tailwindcss/postcss` |
| **shadcn/ui + Radix UI** | — | Componentes acessíveis de baixo nível |

### Estado e Dados

| Biblioteca | Versão | Uso |
|------------|--------|-----|
| **Zustand** | ^5.0.2 | Estado global com `persist` middleware |
| **SWR** | 2.2.5 | Data fetching e cache declarativo |
| **React Hook Form** | 7.60 | Formulários com validação performática |
| **Zod** | 3.25 | Validação e parsing de schemas |
| **Immer** | — | Imutabilidade em reducers Zustand |

### Autenticação

| Biblioteca | Versão | Descrição |
|------------|--------|-----------|
| **@azure/msal-browser** | v4 | MSAL — fluxo OAuth redirect para Entra ID |
| **@azure/msal-react** | v3 | Bindings React (MsalProvider) |

### UI / Utilitários

| Biblioteca | Descrição |
|------------|-----------|
| **Lucide React** | Ícones vetoriais |
| **Recharts** | Gráficos e visualizações |
| **date-fns** | Manipulação de datas |
| **JSZip** | Download de múltiplos arquivos em ZIP |
| **Sonner** | Notificações toast |
| **cmdk** | Command palette |
| **Vaul** | Drawer/modal mobile |

---

## Arquitetura

```
Browser
  └─ Next.js App Router (app/)
        ├─ Páginas (page.tsx) — React Server Components / Client Components
        ├─ Route Handlers (app/api/**) — BFF, injeta BACKEND_URL + auth
        └─ Zustand Stores — estado global persistido no localStorage
              │
              ▼
        Route Handlers (server-side)
              │  BACKEND_URL (env privada, nunca exposta ao browser)
              ▼
        csa-backend (FastAPI :8080)
```

### Padrão BFF — Route Handlers

Todo acesso ao backend é feito via Route Handlers (`app/api/`). O browser nunca conhece o endereço real do `csa-backend`.

```ts
// lib/api/apiFetch.ts — cliente do browser
// Faz fetch para /api/... (Route Handler local)
// Trata 401 com retry automático após refresh de token

// lib/api/proxy.ts — utilitários do Route Handler
proxyGET(req, "/users/me")          // GET sem body
proxyJSON(req, "/shares/create")    // POST/PUT com JSON body
proxyDELETE(req, "/shares/{id}")    // DELETE
```

### Variáveis de Ambiente

| Variável | Escopo | Descrição |
|----------|--------|-----------|
| `BACKEND_URL` | **Servidor** | URL do csa-backend — nunca `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_AUTH_MODE` | Cliente | `dev` = login local; `entra` = Entra ID |
| `NEXT_PUBLIC_ENTRA_CLIENT_ID` | Cliente | Client ID do app Entra ID |
| `NEXT_PUBLIC_ENTRA_TENANT_ID` | Cliente | Tenant ID Entra ID |
| `NEXT_PUBLIC_ENTRA_REDIRECT_URI` | Cliente | URI de callback OAuth |

> `getClientEnv()` em `lib/env.ts` lê `window.__ENV__` no browser e `process.env` no servidor.

---

## Autenticação

### Modo Entra ID (`NEXT_PUBLIC_AUTH_MODE=entra`)

1. Usuário clica em "Entrar com Microsoft"
2. `@azure/msal-browser` inicia fluxo **redirect** para `login.microsoftonline.com`
3. Callback capturado em `/auth/entra-callback`
4. Tokens armazenados no `auth-store` (Zustand + persist)
5. Usuário sincronizado via `POST /api/v1/users/sync-user`

### Modo Dev (`NEXT_PUBLIC_AUTH_MODE=dev`)

- Formulário de login local aparece em `/auth/login`
- Chama `POST /api/v1/auth/internal/login` via Route Handler
- Tokens JWT armazenados no `auth-store`

---

## Stores Zustand

| Store | Arquivo | Responsabilidade |
|-------|---------|-----------------|
| `auth-store` | `lib/stores/auth-store.ts` | Tokens, dados do usuário, perfil |
| `workflow-store` | `lib/stores/workflow-store.ts` | Estado do fluxo de upload/share |
| `notification-store` | `lib/stores/notification-store.ts` | Notificações em tempo real |
| `audit-log-store` | `lib/stores/audit-log-store.ts` | Cache de logs de auditoria |
| `alert-store` | `lib/stores/alert-store.ts` | Alertas globais da UI |
| `theme-store` | `lib/stores/theme-store.ts` | Tema claro/escuro |

---

## Estrutura do Projeto

```
csa-frontend/
├── app/
│   ├── layout.tsx              # Layout raiz (force-dynamic, ThemeProvider)
│   ├── page.tsx                # Página inicial / redirect
│   ├── globals.css
│   ├── api/                    # Route Handlers (BFF)
│   │   ├── auth/               # /api/auth/* — login, refresh, logout
│   │   ├── users/              # /api/users/*
│   │   ├── shares/             # /api/shares/*
│   │   ├── files/              # /api/files/*
│   │   ├── notifications/      # /api/notifications/*
│   │   ├── audit/              # /api/audit/*
│   │   ├── supervisor/         # /api/supervisor/*
│   │   ├── admin/              # /api/admin/*
│   │   ├── areas/              # /api/areas/*
│   │   ├── emails/             # /api/emails/*
│   │   └── download/           # /api/download/*
│   ├── auth/
│   │   ├── login/              # Página de login (modo dev)
│   │   └── entra-callback/     # Callback OAuth Entra ID
│   ├── upload/                 # Upload de arquivos
│   ├── compartilhamentos/      # Lista e detalhes de shares
│   ├── supervisor/             # Aprovação/rejeição de shares
│   ├── admin/                  # Painel administrativo global
│   ├── auditoria/              # Logs de auditoria
│   ├── historico/              # Histórico de ações
│   ├── configuracoes/          # Configurações do usuário
│   ├── logs/                   # Logs do sistema
│   ├── download/               # Portal externo de download (OTP)
│   ├── external-verify/        # Verificação de token externo
│   └── suporte/                # Área de suporte
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── auth/                   # LoginForm, EntraButton
│   ├── dashboard/              # Dashboard e métricas
│   ├── upload/                 # DropZone, FileList, ProgressBar
│   ├── workflow/               # Stepper de criação de share
│   ├── supervisor/             # PendingList, ApprovalCard
│   ├── download/               # OTPForm, FileDownloadCard
│   ├── history/                # HistoryTable, Filters
│   ├── notifications/          # NotificationBell, NotificationList
│   ├── search/                 # SearchBar global
│   ├── settings/               # SettingsForm
│   └── shared/                 # Header, Sidebar, Breadcrumb
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
├── lib/
│   ├── env.ts                  # getClientEnv() — window.__ENV__ / process.env
│   ├── utils.ts
│   ├── api/
│   │   ├── apiFetch.ts         # Cliente HTTP do browser com retry 401
│   │   └── proxy.ts            # proxyGET / proxyJSON / proxyDELETE
│   ├── auth/                   # MSAL config, token helpers
│   ├── stores/                 # Zustand stores
│   └── services/               # Camada de serviço (abstração sobre apiFetch)
├── types/                      # Tipos TypeScript globais
│   ├── index.ts
│   ├── workflow.ts
│   ├── notification.ts
│   ├── activity.ts
│   └── download.ts
└── public/
    ├── openapi.yaml
    ├── fonts/
    └── images/
```

---

## Perfis de Acesso

| Perfil | Condição | Páginas acessíveis |
|--------|----------|--------------------|
| **Externo** | `type=EXTERNAL` | `/download`, `/external-verify` |
| **Interno** | `type=INTERNAL` | `/upload`, `/compartilhamentos`, `/historico`, `/configuracoes` |
| **Supervisor** | `INTERNAL + is_supervisor=True` | + `/supervisor` |
| **Admin** | `INTERNAL + is_admin=True` | + `/admin`, `/auditoria`, `/logs` |

---

## Instalação e Configuração

### Pré-requisitos

- **Node.js** 20 LTS
- **npm** (não use pnpm)

### Instalação Local

```bash
# 1. Clone e entre na pasta
cd csa-frontend

# 2. Instale as dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local:
```

```env
# .env.local
BACKEND_URL=http://127.0.0.1:8080
NEXT_PUBLIC_AUTH_MODE=dev
NEXT_PUBLIC_ENTRA_CLIENT_ID=seu-client-id
NEXT_PUBLIC_ENTRA_TENANT_ID=seu-tenant-id
NEXT_PUBLIC_ENTRA_REDIRECT_URI=http://localhost:3000/auth/entra-callback
```

```bash
# 4. Execute em modo desenvolvimento
npm run dev

# Acesse http://localhost:3000
```

### Docker

```bash
docker build -t csa-frontend .
docker run -p 3000:3000 --env-file .env.local csa-frontend
```

---

## Scripts Disponíveis

```bash
npm run dev        # Servidor de desenvolvimento (porta 3000)
npm run build      # Build de produção (output: standalone)
npm run start      # Servidor de produção
npm run lint       # ESLint
npm test           # Jest (testes unitários)
npm run test:cov   # Jest com cobertura
```

---

## Troubleshooting

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| Erro 401 em todas as rotas | Token expirado ou `auth-store` desatualizado | Limpar localStorage e fazer login novamente |
| `BACKEND_URL` undefined | Variável não definida no `.env.local` | Adicionar `BACKEND_URL=http://127.0.0.1:8080` |
| Callback Entra ID não funciona | `ENTRA_REDIRECT_URI` diverge do registro no portal | Confirmar URI exata no Azure App Registration |
| Modo dev não aparece o formulário | `NEXT_PUBLIC_AUTH_MODE` não é `dev` | Definir `NEXT_PUBLIC_AUTH_MODE=dev` |
| Erro `window is not defined` | Código cliente executando no servidor | Usar `"use client"` ou verificar `typeof window` |

---

## Documentação Interna

| Documento | Descrição |
|-----------|-----------|
| [../csa-backend/docs/SISTEMA_ATUAL.md](../csa-backend/docs/SISTEMA_ATUAL.md) | Mapa completo do sistema — endpoints, modelos, serviços |
| [../csa-backend/docs/MELHORIAS_E_PERFIS.md](../csa-backend/docs/MELHORIAS_E_PERFIS.md) | Diagnósticos, melhorias e perfis de acesso propostos |
| [public/openapi.yaml](public/openapi.yaml) | Especificação OpenAPI do backend |

---