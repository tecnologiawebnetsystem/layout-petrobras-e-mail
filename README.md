# Sistema de Compartilhamento Seguro de Arquivos - Petrobras (CSA)

Sistema corporativo de transferencia segura de arquivos com aprovacao supervisionada, desenvolvido para atender aos rigorosos padroes de seguranca e compliance da Petrobras.

---

## Indice

- [Visao Geral](#visao-geral)
- [Stack Tecnologica](#stack-tecnologica)
- [Arquitetura](#arquitetura)
- [Infraestrutura AWS](#infraestrutura-aws)
- [Instalacao e Configuracao](#instalacao-e-configuracao)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Variaveis de Ambiente](#variaveis-de-ambiente)
- [Docker e Deploy](#docker-e-deploy)
- [Banco de Dados](#banco-de-dados)
- [Autenticacao](#autenticacao)
- [Seguranca](#seguranca)
- [Scripts Disponiveis](#scripts-disponiveis)

---

## Visao Geral

O **CSA (Compartilhamento Seguro de Arquivos)** permite que usuarios internos da Petrobras facam upload de arquivos para compartilhamento com destinatarios externos, passando por um fluxo de aprovacao supervisionada antes da disponibilizacao. Toda a operacao e auditada e monitorada para garantir seguranca e rastreabilidade completa.

### Principais Funcionalidades

- **Upload Seguro**: Usuarios internos enviam arquivos com validacao rigorosa
- **Aprovacao Supervisionada**: Supervisor da area aprova ou rejeita compartilhamentos
- **Acesso Externo via OTP**: Destinatarios externos recebem codigo de verificacao por email
- **Auditoria Completa**: Todo o fluxo e registrado para compliance
- **Dashboard Administrativo**: Visao gerencial de metricas e status
- **Painel Admin Global**: Acesso total a todas as funcionalidades, configuracoes e gestao do sistema

### Perfis de Usuario

| Perfil | Descricao |
|--------|-----------|
| **Interno** | Colaborador Petrobras que faz upload e compartilha arquivos |
| **Supervisor** | Aprova/rejeita compartilhamentos da sua area |
| **Externo** | Terceiros que recebem arquivos compartilhados |
| **Admin Global** | Administrador com acesso total ao sistema (todas as funcionalidades, configuracoes e dados) |

---

## Stack Tecnologica

### Frontend

| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| **Next.js** | 16.0.10 | Framework React com App Router e Server Components |
| **React** | 19.2.0 | Biblioteca de UI com hooks e concurrent features |
| **TypeScript** | 5.x | Tipagem estatica para JavaScript |
| **Tailwind CSS** | 4.1.9 | Framework CSS utility-first |
| **shadcn/ui** | Latest | Componentes de UI baseados em Radix UI |

### Gerenciamento de Estado

| Biblioteca | Versao | Uso |
|------------|--------|-----|
| **Zustand** | 5.0.2 | Gerenciamento de estado global |
| **SWR** | 2.2.5 | Data fetching e cache |
| **React Hook Form** | 7.60.0 | Formularios com validacao |
| **Zod** | 3.25.76 | Validacao de schemas |

### Componentes UI (Radix UI)

```
@radix-ui/react-accordion       @radix-ui/react-alert-dialog
@radix-ui/react-avatar          @radix-ui/react-checkbox
@radix-ui/react-dialog          @radix-ui/react-dropdown-menu
@radix-ui/react-label           @radix-ui/react-popover
@radix-ui/react-progress        @radix-ui/react-select
@radix-ui/react-tabs            @radix-ui/react-toast
@radix-ui/react-tooltip         @radix-ui/react-switch
```

### Bibliotecas Auxiliares

| Biblioteca | Uso |
|------------|-----|
| **Lucide React** | Icones vetoriais |
| **Recharts** | Graficos e visualizacoes |
| **date-fns** | Manipulacao de datas |
| **JSZip** | Compressao de arquivos |
| **cmdk** | Command palette |
| **Sonner** | Notificacoes toast |
| **Vaul** | Drawer/modal mobile |
| **Immer** | Imutabilidade de estado |

### Autenticacao Microsoft

| Pacote | Versao | Uso |
|--------|--------|-----|
| **@azure/msal-browser** | 4.0.0 | Autenticacao Microsoft Entra ID |
| **@azure/msal-react** | 3.0.0 | Hooks React para MSAL |

### Banco de Dados

| Tecnologia | Uso |
|------------|-----|
| **PostgreSQL 14+** | Banco relacional principal |
| **Neon** | Serverless PostgreSQL |
| **@neondatabase/serverless** | Driver serverless |

---

## Arquitetura

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USUARIOS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  [Interno]     [Supervisor]     [Externo]     [Admin Global]            │
│      │              │               │              │                     │
└──────┼──────────────┼───────────────┼──────────────┼─────────────────────┘
       │              │               │              │
       ▼              ▼               ▼              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 16)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  App Router │ Server Components │ API Routes │ Middleware (proxy.ts)    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                        PAGINAS PRINCIPAIS                           ││
│  │  /upload  /compartilhamentos  /supervisor  /download  /admin        ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                         WIKI DEV (Documentacao)                     ││
│  │  /wiki-dev/arquitetura  /aws-implementation  /banco-dados  ...      ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Python)                              │
├─────────────────────────────────────────────────────────────────────────┤
│  FastAPI │ Alembic │ SQLAlchemy │ Pydantic                              │
│  URL: https://scac-backend-dsv.petrobras.com.br                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              AWS CLOUD                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │     ECS      │  │      S3      │  │     SES      │                   │
│  │  (Containers)│  │  (Arquivos)  │  │   (E-mail)   │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  CloudFront  │  │  CloudWatch  │  │     IAM      │                   │
│  │    (CDN)     │  │   (Logs)     │  │  (Acesso)    │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐                                     │
│  │     SSM      │  │ Secrets Mgr  │                                     │
│  │ (Parametros) │  │  (Segredos)  │                                     │
│  └──────────────┘  └──────────────┘                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       BANCO DE DADOS (Neon PostgreSQL)                  │
├─────────────────────────────────────────────────────────────────────────┤
│  21 Tabelas │ ENUMs │ Indices │ Foreign Keys │ Constraints              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Fluxo de Compartilhamento

```
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐
│ Upload  │───▶│Pendente │───▶│ Aprovado │───▶│  OTP    │───▶│ Download │
│         │    │         │    │          │    │ Enviado │    │          │
└─────────┘    └─────────┘    └──────────┘    └─────────┘    └──────────┘
     │              │              │                              │
     │         [Rejeitado]    [Cancelado]                    [Expirado]
     │              │              │                              │
     └──────────────┴──────────────┴──────────────────────────────┘
                              (Estados Finais)
```

---

## Infraestrutura AWS

### Servicos Utilizados

| Servico | Uso no Projeto |
|---------|----------------|
| **Amazon ECS** | Hospedagem de containers Docker do frontend e backend |
| **Amazon S3** | Armazenamento de arquivos compartilhados |
| **Amazon CloudFront** | CDN para distribuicao de arquivos |
| **Amazon SES** | Envio de e-mails (notificacoes, OTP) |
| **Amazon CloudWatch** | Monitoramento, logs e alertas |
| **AWS IAM** | Controle de acesso e permissoes |
| **AWS KMS** | Criptografia de dados em repouso |
| **AWS SSM Parameter Store** | Variaveis de configuracao |
| **AWS Secrets Manager** | Credenciais sensiveis (Entra ID, DB) |

### Configuracao S3

```bash
# Bucket para arquivos
aws s3 mb s3://petrobras-csa-files-prod

# Politica de lifecycle (expiracao automatica)
aws s3api put-bucket-lifecycle-configuration \
  --bucket petrobras-csa-files-prod \
  --lifecycle-configuration file://lifecycle.json
```

### Configuracao SES

```bash
# Verificar dominio
aws ses verify-domain-identity --domain petrobras.com.br

# Verificar email (sandbox)
aws ses verify-email-identity --email-address noreply@petrobras.com.br
```

### Deploy ECS

O frontend e empacotado em container Docker e deployed no ECS com as seguintes caracteristicas:

- **Task Definition**: Configuracao de CPU, memoria e variaveis de ambiente
- **Service**: Auto-scaling baseado em metricas
- **Load Balancer**: ALB com HTTPS e certificado SSL
- **Secrets**: Injetados via AWS Secrets Manager

---

## Instalacao e Configuracao

### Pre-requisitos

- **Node.js** 18+ (recomendado 20 LTS)
- **npm** ou **pnpm** (gerenciador de pacotes)
- **Git** para versionamento
- **Docker** para containerizacao (opcional)

### Instalacao Local

```bash
# 1. Clone o repositorio
git clone https://github.com/tecnologiawebnetsystem/layout-petrobras-e-mail.git

# 2. Entre na pasta do projeto
cd layout-petrobras-e-mail

# 3. Instale as dependencias
npm install

# 4. Configure as variaveis de ambiente
cp .env.example .env.local
# Edite o .env.local com suas credenciais

# 5. Execute o servidor de desenvolvimento
npm run dev

# 6. Acesse http://localhost:3000
```

### Instalacao com Docker

```bash
# Build da imagem
docker build -t petrobras-csa-frontend .

# Executar container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  -e BACKEND_URL=https://scac-backend-dsv.petrobras.com.br \
  petrobras-csa-frontend
```

---

## Estrutura do Projeto

```
petrobras-csa-frontend/
│
├── app/                              # App Router (Next.js 16)
│   ├── page.tsx                      # Pagina de login
│   ├── layout.tsx                    # Layout raiz com providers
│   ├── globals.css                   # Estilos globais + tema Petrobras
│   │
│   ├── upload/                       # Upload de arquivos
│   ├── compartilhamentos/            # Meus compartilhamentos
│   ├── supervisor/                   # Dashboard do supervisor
│   │   └── detalhes/[id]/           # Detalhes do compartilhamento
│   ├── download/                     # Download (usuario externo)
│   ├── external-verify/              # Verificacao OTP
│   ├── historico/                    # Historico de envios
│   ├── configuracoes/                # Configuracoes do usuario
│   ├── auditoria/                    # Logs de auditoria
│   ├── suporte/                      # Painel de suporte
│   ├── logs/                         # Rastreamento de emails
│   ├── admin/                        # Painel administrativo
│   │
│   ├── wiki-dev/                     # Documentacao tecnica
│   │   ├── arquitetura/             # Arquitetura do sistema
│   │   ├── aws-implementation/      # Implementacao AWS
│   │   ├── banco-dados/             # Estrutura do banco
│   │   ├── deploy-aws/              # Deploy na AWS
│   │   ├── docker-aws/              # Docker na AWS
│   │   ├── entra-id/                # Configuracao Entra ID
│   │   ├── variaveis-ambiente/      # Variaveis de ambiente
│   │   └── ...                      # Mais paginas de documentacao
│   │
│   └── api/                          # API Routes
│       ├── auth/                    # Autenticacao
│       │   ├── internal/            # Auth interno (Entra ID)
│       │   ├── external/            # Auth externo (OTP)
│       │   └── entra/               # Endpoints Entra ID
│       ├── shares/                  # Compartilhamentos
│       ├── files/                   # Arquivos
│       ├── supervisor/              # Acoes do supervisor
│       ├── admin/                   # Acoes administrativas
│       ├── notifications/           # Notificacoes
│       ├── emails/                  # Envio de emails
│       ├── audit/                   # Auditoria
│       └── support/                 # Suporte
│
├── components/                       # Componentes React
│   ├── ui/                          # Componentes base (shadcn)
│   ├── auth/                        # Autenticacao
│   │   ├── entra-provider.tsx      # Provider MSAL
│   │   ├── login-form.tsx          # Formulario de login
│   │   └── protected-route.tsx     # Protecao de rotas
│   ├── dashboard/                   # Dashboard components
│   ├── shared/                      # Componentes compartilhados
│   │   ├── app-header.tsx          # Header da aplicacao
│   │   ├── expiration-monitor.tsx  # Monitor de expiracao
│   │   └── global-alert-provider.tsx
│   └── wiki-dev/                    # Componentes da wiki
│
├── lib/                              # Bibliotecas e utilitarios
│   ├── auth/                        # Autenticacao
│   │   ├── entra-config.ts         # Config Entra ID
│   │   └── otp-service.ts          # Servico OTP
│   ├── stores/                      # Zustand stores
│   │   ├── auth-store.ts           # Estado de autenticacao
│   │   ├── workflow-store.ts       # Fluxo de aprovacao
│   │   ├── notification-store.ts   # Notificacoes
│   │   └── audit-log-store.ts      # Auditoria
│   ├── security/                    # Seguranca
│   │   ├── rate-limiter.ts         # Rate limiting
│   │   └── session-guard.ts        # Protecao de sessao
│   ├── utils/                       # Utilitarios
│   │   ├── file-security.ts        # Validacao de arquivos
│   │   └── zip-validator.ts        # Validacao de ZIP
│   └── email/                       # Templates de email
│
├── hooks/                            # React Hooks customizados
├── types/                            # Definicoes TypeScript
├── public/                           # Arquivos estaticos
│   └── fonts/                       # Fontes Inter
│
├── backend/                          # Backend Python (separado)
│   ├── sql/                         # Scripts SQL
│   ├── docs/                        # Documentacao do backend
│   └── alembic/                     # Migracoes
│
├── docs/                             # Documentacao adicional
│   └── DATABASE-STRUCTURE.md        # Estrutura do banco
│
├── Dockerfile                        # Containerizacao
├── next.config.mjs                   # Configuracao Next.js
├── tsconfig.json                     # Configuracao TypeScript
├── package.json                      # Dependencias
├── proxy.ts                          # Middleware (CSP headers)
└── README.md                         # Este arquivo
```

---

## Variaveis de Ambiente

### Variaveis Publicas (NEXT_PUBLIC_*)

```env
# URL da aplicacao
NEXT_PUBLIC_APP_URL=https://transfer.petrobras.com.br

# Modo de autenticacao (entra | local)
NEXT_PUBLIC_AUTH_MODE=entra

# Microsoft Entra ID
NEXT_PUBLIC_ENTRA_TENANT_ID=5b6f6241-9a57-4be4-8e50-1dfa72e79a57
NEXT_PUBLIC_ENTRA_CLIENT_ID=da3aaaad-619f-4bee-a434-51efd11faf7c
NEXT_PUBLIC_ENTRA_REDIRECT_URI=https://transfer.petrobras.com.br

# Limites da aplicacao
NEXT_PUBLIC_MAX_FILE_SIZE=524288000
NEXT_PUBLIC_MAX_AVAILABILITY_HOURS=72
```

### Variaveis de Servidor

```env
# URL do Backend Python
BACKEND_URL=https://scac-backend-dsv.petrobras.com.br

# Entra ID (servidor)
ENTRA_CLIENT_SECRET=***

# Banco de Dados (Neon)
DATABASE_URL=postgres://user:pass@host/dbname

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***
AWS_S3_BUCKET=petrobras-csa-files-prod
AWS_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net

# Email (SES)
AWS_SES_FROM_EMAIL=noreply@petrobras.com.br
AWS_SES_REPLY_TO=suporte@petrobras.com.br
```

### Injecao de Variaveis no ECS

No ambiente ECS, as variaveis sao injetadas via:

1. **SSM Parameter Store**: Variaveis de configuracao
2. **Secrets Manager**: Credenciais sensiveis

O `layout.tsx` le as variaveis em runtime e injeta no `window.__ENV__` para Client Components.

---

## Docker e Deploy

### Dockerfile

O projeto utiliza multi-stage build para otimizacao:

```dockerfile
# BUILDER: Instala dependencias e faz build
FROM registry.petrobras.com.br/imagens-devops/base/petro-node22-alpine AS builder

# RUNNER: Imagem final otimizada
FROM registry.petrobras.com.br/imagens-devops/base/petro-node22-alpine AS runner
```

### Build e Deploy

```bash
# Build de producao
npm run build

# Build Docker
docker build -t petrobras-csa-frontend:latest .

# Push para registry
docker tag petrobras-csa-frontend:latest \
  registry.petrobras.com.br/csa/frontend:latest
docker push registry.petrobras.com.br/csa/frontend:latest
```

### Configuracao Next.js

```javascript
// next.config.mjs
const nextConfig = {
  output: 'standalone',        // Build otimizado para container
  images: { unoptimized: true }, // Imagens sem otimizacao (CloudFront)
  headers() {
    return [{ source: '/:path*', headers: [/* CSP Headers */] }]
  }
}
```

---

## Banco de Dados

### Tecnologia

- **PostgreSQL 14+** hospedado no **Neon** (serverless)
- **21 tabelas** com relacionamentos e constraints
- **ENUMs** para tipos de dados padronizados

### Principais Tabelas

| Tabela | Descricao |
|--------|-----------|
| `user` | Usuarios do sistema (internos, externos, admin) |
| `share` | Compartilhamentos de arquivos |
| `share_file` | Relacao N:N entre shares e arquivos |
| `restricted_file` | Arquivos armazenados no S3 |
| `shared_area` | Areas de compartilhamento |
| `token_access` | Tokens OTP e de acesso |
| `audit` | Logs de auditoria |
| `email_log` | Rastreamento de emails |
| `notification` | Notificacoes internas |
| `support_registration` | Cadastros do suporte |

### Diagrama de Relacionamentos

Consulte o arquivo `docs/DATABASE-STRUCTURE.md` para o diagrama completo.

---

## Autenticacao

### Microsoft Entra ID (SSO)

O sistema utiliza **Microsoft Entra ID** (antigo Azure AD) para autenticacao de usuarios internos:

1. Usuario clica em "Entrar com Microsoft"
2. Redirecionado para login.microsoftonline.com
3. Apos autenticacao, retorna com token
4. Frontend valida token e busca dados do usuario via Graph API
5. Sessao criada com dados hierarquicos (cargo, departamento, gestor)

### OTP para Usuarios Externos

Usuarios externos utilizam verificacao por codigo OTP:

1. Sistema envia email com codigo de 6 digitos
2. Codigo valido por 3 minutos
3. Maximo de 3 tentativas
4. Apos verificacao, acesso aos arquivos liberado

---

## Seguranca

### Headers CSP

```javascript
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  connect-src 'self' https://graph.microsoft.com 
              https://login.microsoftonline.com;
  frame-src 'self' https://login.microsoftonline.com;
```

### Validacao de Arquivos

Extensoes bloqueadas automaticamente:
- Executaveis: `.exe`, `.dll`, `.bat`, `.cmd`, `.com`, `.msi`
- Scripts: `.ps1`, `.vbs`, `.js`, `.jar`
- Outros: `.scr`, `.pif`, `.app`, `.deb`, `.rpm`

### Rate Limiting

- **Login**: 5 tentativas em 15 minutos
- **OTP**: 3 tentativas por codigo
- **API**: 100 requisicoes/minuto por IP

### Auditoria

Todos os eventos sao registrados:
- Login/Logout
- Upload/Download
- Aprovacao/Rejeicao
- Envio de OTP
- Alteracoes de configuracao

---

## Scripts Disponiveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build           # Build de producao
npm run start           # Inicia servidor de producao
npm run lint            # Verifica codigo com ESLint

# Docker
docker build -t csa .   # Build da imagem
docker run -p 3000:3000 csa  # Executa container
```

---

## Contribuicao

1. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
2. Faca commit: `git commit -m 'Adiciona nova funcionalidade'`
3. Push: `git push origin feature/nova-funcionalidade`
4. Abra um Pull Request

---

## Suporte

- **Documentacao Interna**: `/wiki-dev` na aplicacao
- **Issues**: Abra uma issue no repositorio
- **Contato**: equipe-csa@petrobras.com.br

---

## Licenca

Propriedade da Petrobras - Todos os direitos reservados.

---

**Versao**: 0.1.0  
**Ultima atualizacao**: Maio 2026
