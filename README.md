# Sistema de Transferência de Arquivos Petrobras

Sistema corporativo de transferência segura de arquivos com aprovação supervisionada, desenvolvido para atender aos rigorosos padrões de segurança e compliance da Petrobras.

## Visão Geral

O sistema permite que usuários internos da Petrobras façam upload de arquivos para compartilhamento com destinatários externos, passando por um fluxo de aprovação supervisionada antes da disponibilização. Toda a operação é auditada e monitorada para garantir segurança e rastreabilidade completa.

## Características Principais

### Segurança
- Validação rigorosa de tipos de arquivos (bloqueia .exe, .dll, .bat, .cmd e outros executáveis)
- Aprovação obrigatória por supervisor antes da disponibilização
- Auditoria completa de todas as operações
- Controle de acesso baseado em perfis (Interno/Supervisor)
- Expiração automática de arquivos (máximo 72 horas)
- Links temporários com token único por transferência
- Autenticação Microsoft Entra ID (Azure AD) integrada ao Active Directory da Petrobras

### Fluxo de Trabalho
1. **Autenticação**: Usuário faz login com credenciais corporativas Microsoft
2. **Upload**: Usuário interno faz upload dos arquivos
3. **Aprovação Automática**: Supervisor direto do Active Directory recebe notificação
4. **Aprovação Manual**: Supervisor revisa e aprova/rejeita
5. **Acesso Externo**: Destinatário externo recebe código OTP por email (válido 3 minutos)
6. **Download**: Arquivo disponível por período limitado após verificação
7. **Auditoria**: Todo o processo é registrado

### Perfis de Usuário

#### Usuário Interno
- Login SSO com Microsoft (automático se já logado no Windows/Office)
- Fazer upload de arquivos
- Definir destinatários e tempo de disponibilidade (até 72h)
- Acompanhar status das transferências
- Visualizar histórico de uploads
- Cancelar compartilhamentos pendentes

#### Supervisor
- Login SSO com Microsoft
- Aprovar ou rejeitar transferências pendentes
- Informar motivo em caso de rejeição
- Visualizar dashboard com métricas (Pendentes, Aprovados, Rejeitados, Cancelados)
- Ajustar tempo de disponibilidade antes de aprovar
- Acessar detalhes completos de cada transferência
- Dados hierárquicos capturados automaticamente do AD (cargo, departamento, localização)

#### Usuário Externo
- Recebe email com código OTP de 6 dígitos
- Acessa página de verificação
- Insere código (válido por 3 minutos, máximo 3 tentativas)
- Faz download dos arquivos compartilhados

## Tecnologias

### Frontend
- **Next.js 16.0.10** - Framework React com App Router
- **React 19.2** - Interface de usuário
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Estilização
- **Shadcn/ui** - Componentes de interface
- **Zustand** - Gerenciamento de estado
- **React Hook Form** - Gerenciamento de formulários
- **Lucide React** - Ícones

### Autenticação e Segurança
- **Microsoft Entra ID** - SSO corporativo integrado ao Active Directory
- **Microsoft Graph API** - Captura de dados hierárquicos (foto, cargo, supervisor)
- **Rate Limiting** - Proteção contra força bruta (5 tentativas em 15min)
- **Session Hijacking Protection** - Validação de fingerprint do navegador
- **CSP Headers** - Content Security Policy completo
- **Timeout de Sessão** - Logout automático após 30min de inatividade

### Infraestrutura AWS
- **S3** - Armazenamento de arquivos
- **CloudFront** - CDN para distribuição
- **Lambda** - Processamento serverless
- **SES** - Envio de emails (notificações e OTP)
- **CloudWatch** - Monitoramento e logs
- **IAM** - Controle de acesso
- **KMS** - Criptografia de dados

## Estrutura do Projeto

```
├── app/                          # Páginas e rotas Next.js
│   ├── page.tsx                 # Página de login
│   ├── upload/                  # Upload de arquivos (usuário interno)
│   ├── compartilhamentos/       # Meus compartilhamentos (usuário interno)
│   ├── supervisor/              # Dashboard do supervisor
│   │   └── detalhes/[id]/      # Detalhes e aprovação
│   ├── download/                # Download de arquivos (destinatário)
│   ├── external-verify/         # Verificação OTP usuário externo
│   ├── configuracoes/           # Configurações do usuário
│   ├── wiki-dev/                # Wiki interna de desenvolvimento
│   │   ├── entra-id/           # Guia Microsoft Entra ID
│   │   ├── sincronizacao-backend/ # Guia sincronização back-end
│   │   ├── implementacoes-jan-2026/ # Implementações 04/01/2026
│   │   ├── aws-implementation/ # Guia AWS
│   │   ├── data-models/        # Modelos de dados
│   │   ├── sql-readme/         # Documentação SQL
│   │   └── servicenow/         # Integração ServiceNow
│   └── api/                     # API Routes (removidos send-email e send-otp)
│
├── components/                  # Componentes React
│   ├── auth/                   # Autenticação
│   │   ├── login-form.tsx     # Form de login com botão Microsoft
│   │   └── protected-route.tsx # Proteção de rotas
│   ├── dashboard/              # Componentes do dashboard
│   ├── shared/                 # Componentes compartilhados
│   │   └── app-header.tsx     # Header com perfil enriquecido
│   └── ui/                     # Componentes de UI (shadcn)
│
├── lib/                        # Bibliotecas e utilitários
│   ├── auth/                  # Autenticação
│   │   ├── entra-config.ts   # Configuração Entra ID
│   │   └── otp-service.ts    # Serviço de OTP
│   ├── stores/                # Stores Zustand
│   │   ├── auth-store.ts     # Autenticação com Graph API
│   │   ├── workflow-store.ts # Fluxo de aprovação e cancelamento
│   │   ├── notification-store.ts # Notificações
│   │   └── audit-log-store.ts # Auditoria
│   ├── security/              # Segurança
│   │   ├── rate-limiter.ts   # Rate limiting
│   │   ├── session-guard.ts  # Session hijacking protection
│   │   └── timeout-manager.ts # Timeout de sessão
│   ├── utils/                 # Utilitários
│   │   ├── zip-validator.ts  # Validação de arquivos
│   │   └── file-security.ts  # Segurança de arquivos
│   └── email/                 # Email templates
│       └── templates/
│           └── otp-email.ts  # Template email OTP
│
│
├── back-end/                   # Back-end Python (futuro)
│   └── python/
│
└── proxy.ts                    # Middleware (Next.js 16) com CSP headers
```

## Início Rápido

### Pré-requisitos
- Node.js 18+
- Conta AWS configurada
- Credenciais AWS (Access Key e Secret Key)
- Registro de aplicação no Microsoft Entra ID (Azure AD)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/petrobras/sistema-transferencia-arquivos.git

# Entre na pasta
cd sistema-transferencia-arquivos

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite o .env.local com suas credenciais
```

### Configuração Microsoft Entra ID

1. **Portal Azure** → **Azure Active Directory** → **App registrations**
2. Crie um novo registro com:
   - Nome: `Sistema Compartilhamento Petrobras`
   - Redirect URI: `http://localhost:3000` (dev) e `https://seu-dominio.com` (prod)
3. Copie: **Tenant ID**, **Client ID**
4. Crie um **Client Secret** e copie o valor
5. Em **API Permissions**, adicione:
   - `User.Read` - Ler perfil do usuário
   - `User.ReadBasic.All` - Ler informações de outros usuários
6. Solicite **Admin Consent** do TI da Petrobras

### Configuração AWS

1. **S3 Bucket**
   ```bash
   aws s3 mb s3://petrobras-file-transfer-prod
   ```

2. **DynamoDB Tables**
   ```bash
   # Execute os scripts SQL na ordem
   npm run db:setup
   ```

3. **SES Email Verification**
   ```bash
   aws ses verify-email-identity --email-address noreply@petrobras.com.br
   ```

4. **CloudFront Distribution**
   - Configure no console AWS ou via CLI
   - Adicione o domain no .env.local

### Executar Localmente

```bash
# Modo desenvolvimento
npm run dev

# Acesse http://localhost:3000
```

### Build e Deploy

```bash
# Build de produção
npm run build

# Deploy para Vercel
vercel --prod

# Ou deploy para AWS
npm run deploy:aws
```

## Variáveis de Ambiente

```env
# Microsoft Entra ID (Azure AD)
NEXT_PUBLIC_ENTRA_TENANT_ID=5b6f6241-9a57-4be4-8e50-1dfa72e79a57
NEXT_PUBLIC_ENTRA_CLIENT_ID=da3aaaad-619f-4bee-a434-51efd11faf7c
NEXT_PUBLIC_ENTRA_REDIRECT_URI=http://localhost:3000
ENTRA_CLIENT_SECRET=seu_client_secret_aqui

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=petrobras-file-transfer-prod
AWS_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net

# DynamoDB
DYNAMODB_USERS_TABLE=petrobras-users
DYNAMODB_FILES_TABLE=petrobras-files
DYNAMODB_SESSIONS_TABLE=petrobras-sessions
DYNAMODB_AUDIT_TABLE=petrobras-audit-logs
DYNAMODB_NOTIFICATIONS_TABLE=petrobras-notifications

# Email - AWS SES
AWS_SES_FROM_EMAIL=noreply@petrobras.com.br
AWS_SES_REPLY_TO=suporte@petrobras.com.br

# Aplicação
NEXT_PUBLIC_APP_URL=https://transfer.petrobras.com.br
NEXT_PUBLIC_MAX_FILE_SIZE=524288000
NEXT_PUBLIC_MAX_AVAILABILITY_HOURS=72
```

## Sistema de Email

### AWS SES (Simple Email Service)

O sistema utiliza AWS SES para envio de emails:

**Configuração:**
```bash
# 1. Verificar domínio no SES
aws ses verify-domain-identity --domain petrobras.com.br

# 2. Ou verificar email individual (sandbox)
aws ses verify-email-identity --email-address noreply@petrobras.com.br

# 3. Configurar variáveis no .env.local
AWS_SES_FROM_EMAIL=noreply@petrobras.com.br
AWS_SES_REPLY_TO=suporte@petrobras.com.br
```

**Tipos de Email Enviados:**
- **Notificação ao Supervisor**: Quando upload é realizado
- **Confirmação ao Remetente**: Upload confirmado
- **Código OTP para Externo**: Verificação de acesso
- **Aprovação/Rejeição**: Status final do compartilhamento

## Wiki de Desenvolvimento

O sistema possui uma wiki interna completa acessível em `/wiki-dev` com:

- **Microsoft Entra ID**: Guia completo de autenticação SSO com Azure AD
- **Sincronização Back-end**: Guia passo a passo para implementar back-end Python
- **Implementações 04/01/2026**: Documentação de todas as 14 funcionalidades implementadas
- **Implementação AWS**: Guia detalhado de todos os serviços AWS utilizados
- **Modelos de Dados**: Estrutura completa das 5 tabelas DynamoDB
- **SQL & DynamoDB**: Documentação completa do banco de dados
- **ServiceNow**: Integração com sistema de tickets

## Banco de Dados

O sistema utiliza 5 tabelas DynamoDB:

### 1. Users
Armazena dados dos usuários (internos e supervisores)
- Partition Key: `userId` (String)
- Campos: email, name, userType, jobTitle, department, manager, photoUrl, createdAt

### 2. Files
Metadados dos arquivos transferidos
- Partition Key: `fileId` (String)
- GSI: `uploaderUserId`, `recipientEmail`, `status`
- Novos campos: `cancelled_by`, `cancellation_date`, `cancellation_reason`
- 8 índices secundários globais para queries otimizadas

### 3. Sessions
Sessões de autenticação dos usuários
- Partition Key: `sessionId` (String)
- GSI: `userId`
- TTL automático após expiração
- Campos de segurança: `fingerprint`, `userAgent`, `lastActivity`

### 4. Audit Logs
Registro completo de todas as operações
- Partition Key: `logId` (String)
- GSI: `userId`, `action`, `timestamp`
- Novos eventos: `SHARE_CANCELLED`, `LOGIN_SSO`, `OTP_SENT`, `OTP_VERIFIED`

### 5. OTP Codes (Nova)
Códigos de verificação para usuários externos
- Partition Key: `otpId` (String)
- GSI: `email`
- Campos: `code`, `expiresAt`, `attempts`, `used`
- TTL automático após 3 minutos

## Segurança

### Autenticação
- **SSO Microsoft**: Login único integrado ao Office 365
- **Graph API**: Captura automática de hierarquia organizacional
- **Rate Limiting**: Máximo 5 tentativas de login em 15 minutos
- **Session Hijacking**: Validação de fingerprint (User-Agent, screen, timezone)
- **Timeout**: Logout automático após 30 minutos de inatividade

### Validação de Arquivos
Extensões bloqueadas automaticamente:
- Executáveis: .exe, .dll, .bat, .cmd, .com, .msi
- Scripts: .ps1, .vbs, .js, .jar
- Outros: .scr, .pif, .app, .deb, .rpm

### Controle de Acesso
- Autenticação obrigatória para todas as operações
- Perfis separados (Interno/Supervisor/Externo)
- Validação de permissões em cada endpoint
- Tokens únicos e temporários para downloads
- OTP com validade de 3 minutos

### Headers de Segurança (CSP)
- `Content-Security-Policy`: Bloqueia scripts inline e XSS
- `X-Frame-Options`: Previne clickjacking
- `X-Content-Type-Options`: Previne MIME sniffing
- `Referrer-Policy`: Controla informações de referência
- `Permissions-Policy`: Restringe APIs do navegador

### Auditoria
Todos os eventos são registrados:
- Login/Logout (SSO e tradicional)
- Upload de arquivos
- Aprovação/Rejeição/Cancelamento
- Envio e verificação de OTP
- Downloads
- Tentativas de acesso bloqueadas
- Alterações de configuração

## Monitoramento

### Métricas Disponíveis
- Total de transferências por status
- Taxa de aprovação/rejeição/cancelamento
- Tempo médio de aprovação
- Volume de dados transferidos
- Erros e exceções
- Tentativas de login bloqueadas
- Códigos OTP enviados vs verificados

### Logs
- CloudWatch Logs para todos os serviços
- Logs estruturados em JSON
- Retenção configurável (90 dias padrão)
- Alertas automáticos para anomalias

## Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2E

# Cobertura
npm run test:coverage
```

## Scripts Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build           # Build de produção
npm run start           # Inicia servidor de produção
npm run lint            # Verifica código com ESLint
npm run format          # Formata código com Prettier

# Banco de Dados
npm run db:setup        # Cria todas as tabelas
npm run db:seed         # Popula dados de demonstração
npm run db:reset        # Apaga e recria tudo

# Deploy
npm run deploy:staging  # Deploy para staging
npm run deploy:prod     # Deploy para produção
```
