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

### Fluxo de Trabalho
1. **Upload**: Usuário interno faz upload dos arquivos
2. **Aprovação**: Supervisor revisa e aprova/rejeita
3. **Notificação**: Destinatário recebe link de download (via e-mail automático)
4. **Download**: Arquivo disponível por período limitado
5. **Auditoria**: Todo o processo é registrado

### Perfis de Usuário

#### Usuário Interno
- Fazer upload de arquivos
- Definir destinatários e tempo de disponibilidade (até 72h)
- Acompanhar status das transferências
- Visualizar histórico de uploads

#### Supervisor
- Aprovar ou rejeitar transferências pendentes
- Informar motivo em caso de rejeição
- Visualizar dashboard com métricas (Pendentes, Aprovados, Rejeitados)
- Ajustar tempo de disponibilidade antes de aprovar
- Acessar detalhes completos de cada transferência
- Receber notificações automáticas por e-mail quando houver novos uploads

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

### Backend
- **Next.js API Routes** - Endpoints REST
- **Server Actions** - Ações do servidor
- **DynamoDB** - Banco de dados NoSQL (5 tabelas)
- **Resend** - Envio de e-mails transacionais

### Infraestrutura AWS
- **S3** - Armazenamento de arquivos
- **CloudFront** - CDN para distribuição
- **Lambda** - Processamento serverless
- **SES** - Envio de emails (alternativa ao Resend)
- **CloudWatch** - Monitoramento e logs
- **IAM** - Controle de acesso
- **KMS** - Criptografia de dados

## Estrutura do Projeto

\`\`\`
├── app/                          # Páginas e rotas Next.js
│   ├── page.tsx                 # Página de login
│   ├── upload/                  # Upload de arquivos (usuário interno)
│   ├── supervisor/              # Dashboard do supervisor
│   │   └── detalhes/[id]/      # Detalhes e aprovação
│   ├── download/                # Download de arquivos (destinatário)
│   ├── historico/               # Histórico de transferências
│   ├── configuracoes/           # Configurações do usuário
│   ├── wiki-dev/                # Wiki interna de desenvolvimento
│   │   ├── aws-implementation/ # Guia AWS
│   │   ├── data-models/        # Modelos de dados
│   │   ├── quick-start/        # Início rápido
│   │   ├── sql-readme/         # Documentação SQL
│   │   └── deployment/         # Guia de deploy
│   └── api/                     # API Routes
│       ├── upload/             # Endpoints de upload
│       ├── files/              # Gerenciamento de arquivos
│       └── notifications/      # Sistema de notificações
│
├── components/                  # Componentes React
│   ├── auth/                   # Autenticação
│   ├── dashboard/              # Componentes do dashboard
│   ├── shared/                 # Componentes compartilhados
│   └── ui/                     # Componentes de UI (shadcn)
│
├── lib/                        # Bibliotecas e utilitários
│   ├── stores/                # Stores Zustand
│   │   ├── auth-store.ts     # Autenticação
│   │   ├── workflow-store.ts # Fluxo de aprovação
│   │   ├── notification-store.ts # Notificações
│   │   └── audit-log-store.ts # Auditoria
│   ├── utils/                 # Utilitários
│   │   ├── zip-validator.ts  # Validação de arquivos
│   │   └── file-security.ts  # Segurança de arquivos
│   └── aws/                   # Integrações AWS
│
├── Documentacao/               # Documentação técnica
│   ├── AWS-IMPLEMENTATION-GUIDE.md
│   ├── DATA-MODELS.md
│   ├── DEPLOYMENT-GUIDE.md
│   ├── QUICK-START.md
│   ├── SQL-README.md
│   └── CHANGELOG.md
│
└── sql/                        # Scripts SQL/DynamoDB
    ├── 001_create_users_table.sql
    ├── 002_create_files_table.sql
    ├── 003_create_sessions_table.sql
    ├── 004_create_audit_logs_table.sql
    ├── 005_create_notifications_table.sql
    └── seed_demo_data.sql
\`\`\`

## Início Rápido

### Pré-requisitos
- Node.js 18+
- Conta AWS configurada
- Credenciais AWS (Access Key e Secret Key)

### Instalação

\`\`\`bash
# Clone o repositório
git clone https://github.com/petrobras/sistema-transferencia-arquivos.git

# Entre na pasta
cd sistema-transferencia-arquivos

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite o .env.local com suas credenciais AWS
\`\`\`

### Configuração AWS

1. **S3 Bucket**
   \`\`\`bash
   aws s3 mb s3://petrobras-file-transfer-prod
   \`\`\`

2. **DynamoDB Tables**
   \`\`\`bash
   # Execute os scripts SQL na ordem
   npm run db:setup
   \`\`\`

3. **CloudFront Distribution**
   - Configure no console AWS ou via CLI
   - Adicione o domain no .env.local

### Executar Localmente

\`\`\`bash
# Modo desenvolvimento
npm run dev

# Acesse http://localhost:3000
\`\`\`

### Build e Deploy

\`\`\`bash
# Build de produção
npm run build

# Deploy para Vercel
vercel --prod

# Ou deploy para AWS
npm run deploy:aws
\`\`\`

## Variáveis de Ambiente

\`\`\`env
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

# Email - Resend (Recomendado)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email - AWS SES (Alternativa)
AWS_SES_FROM_EMAIL=noreply@petrobras.com.br
AWS_SES_REPLY_TO=suporte@petrobras.com.br

# Aplicação
NEXT_PUBLIC_APP_URL=https://transfer.petrobras.com.br
NEXT_PUBLIC_MAX_FILE_SIZE=524288000
NEXT_PUBLIC_MAX_AVAILABILITY_HOURS=72
\`\`\`

## Configuração de E-mail

O sistema envia e-mails automáticos para o supervisor quando há novos uploads pendentes de aprovação. 

### Opção 1: Resend (Recomendado)

**Vantagens:**
- Setup rápido e simples
- Plano gratuito: 3.000 e-mails/mês
- Interface moderna e API fácil
- Templates HTML prontos

**Como configurar:**

1. Acesse [resend.com](https://resend.com) e crie uma conta gratuita
2. No dashboard, vá em **API Keys**
3. Clique em **Create API Key**
4. Copie a chave gerada (começa com `re_`)
5. Adicione no arquivo `.env.local`:
   \`\`\`env
   RESEND_API_KEY=re_sua_chave_aqui
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   \`\`\`

6. No v0 (Vercel), adicione as variáveis:
   - Clique em **Vars** na sidebar esquerda
   - Adicione `RESEND_API_KEY` com sua chave
   - Adicione `NEXT_PUBLIC_APP_URL` com sua URL

**E-mail configurado:** kleber.goncalves.prestserv@petrobras.com.br

### Opção 2: AWS SES

Se preferir usar AWS SES:

\`\`\`bash
# Configure via AWS CLI
aws ses verify-email-identity --email-address noreply@petrobras.com.br

# Adicione no .env.local
AWS_SES_FROM_EMAIL=noreply@petrobras.com.br
AWS_SES_REPLY_TO=suporte@petrobras.com.br
\`\`\`

## Usuários de Demonstração

### Usuário Interno
- **Email**: joao.silva@petrobras.com.br
- **Senha**: demo123
- **Perfil**: Usuário interno que faz upload de arquivos

### Supervisor
- **Nome**: Wagner Gaspar Brazil
- **Email**: wagner.brazil@petrobras.com.br
- **Senha**: supervisor123
- **Perfil**: Supervisor que aprova/rejeita transferências
- **Notificações**: kleber.goncalves.prestserv@petrobras.com.br

## Wiki de Desenvolvimento

O sistema possui uma wiki interna completa acessível em `/wiki-dev` com:

- **Implementação AWS**: Guia detalhado de todos os serviços AWS utilizados, com justificativas técnicas e exemplos
- **Modelos de Dados**: Estrutura completa das 5 tabelas DynamoDB com campos, tipos e onde são usados
- **Quick Start**: Guia passo a passo para deploy rápido em 1 dia
- **SQL & DynamoDB**: Documentação completa do banco de dados
- **Deployment**: Guia completo de produção com segurança, monitoramento e CI/CD

## Banco de Dados

O sistema utiliza 5 tabelas DynamoDB:

### 1. Users
Armazena dados dos usuários (internos e supervisores)
- Partition Key: `userId` (String)
- Campos: email, name, userType, createdAt

### 2. Files
Metadados dos arquivos transferidos
- Partition Key: `fileId` (String)
- GSI: `uploaderUserId`, `recipientEmail`
- 8 índices secundários globais para queries otimizadas

### 3. Sessions
Sessões de autenticação dos usuários
- Partition Key: `sessionId` (String)
- GSI: `userId`
- TTL automático após expiração

### 4. Audit Logs
Registro completo de todas as operações
- Partition Key: `logId` (String)
- GSI: `userId`, `action`, `timestamp`

### 5. Notifications
Notificações enviadas aos usuários
- Partition Key: `notificationId` (String)
- GSI: `recipientEmail`, `sentAt`

## Segurança

### Validação de Arquivos
Extensões bloqueadas automaticamente:
- Executáveis: .exe, .dll, .bat, .cmd, .com, .msi
- Scripts: .ps1, .vbs, .js, .jar
- Outros: .scr, .pif, .app, .deb, .rpm

### Controle de Acesso
- Autenticação obrigatória para todas as operações
- Perfis separados (Interno/Supervisor)
- Validação de permissões em cada endpoint
- Tokens únicos e temporários para downloads

### Auditoria
Todos os eventos são registrados:
- Login/Logout
- Upload de arquivos
- Aprovação/Rejeição
- Downloads
- Alterações de configuração

## Monitoramento

### Métricas Disponíveis
- Total de transferências
- Taxa de aprovação/rejeição
- Tempo médio de aprovação
- Volume de dados transferidos
- Erros e exceções

### Logs
- CloudWatch Logs para todos os serviços
- Logs estruturados em JSON
- Retenção configurável (90 dias padrão)

## Testes

\`\`\`bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Cobertura
npm run test:coverage
\`\`\`

## Scripts Úteis

\`\`\`bash
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
\`\`\`

## Documentação

Para documentação técnica detalhada, consulte:

- [Guia de Implementação AWS](Documentacao/AWS-IMPLEMENTATION-GUIDE.md)
- [Modelos de Dados](Documentacao/DATA-MODELS.md)
- [Guia de Deployment](Documentacao/DEPLOYMENT-GUIDE.md)
- [Quick Start](Documentacao/QUICK-START.md)
- [SQL README](Documentacao/SQL-README.md)

## Suporte

Para suporte técnico ou dúvidas:
- Email: suporte-dev@petrobras.com.br
- Wiki Interna: `/wiki-dev`
- Documentação: `/Documentacao`

## Licença

Copyright © 2025 Petrobras. Todos os direitos reservados.

Sistema de uso interno corporativo.

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2025  
**Next.js**: 16.0.10  
**React**: 19.2
