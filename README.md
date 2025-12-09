# Sistema de E-mail Petrobras

Sistema moderno de envio e gerenciamento de e-mails para domínios externos, desenvolvido com Next.js 16, React, TypeScript e integração preparada para backend Python.

## Tecnologias

### Frontend
- **Next.js 16** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Type-safety
- **Tailwind CSS v4** - Estilização
- **shadcn/ui** - Componentes UI de alta qualidade
- **Zustand** - Gerenciamento de estado
- **Lucide React** - Ícones

### Backend (Preparado)
- **Python/FastAPI** - API REST
- **DynamoDB** - Banco de dados NoSQL AWS
- Estrutura completa documentada em `Documentacao/BACKEND_STRUCTURE.md`
- Infraestrutura AWS documentada em `sql/`

## Estrutura do Projeto

\`\`\`
.
├── app/
│   ├── page.tsx                 # Página de login
│   ├── upload/                  # Módulo interno (upload)
│   ├── download/                # Módulo externo (download)
│   ├── supervisor/              # Módulo supervisor (aprovação)
│   ├── historico/               # Histórico de atividades
│   ├── auditoria/               # Logs de auditoria
│   ├── configuracoes/           # Configurações do sistema
│   └── wiki/                    # Central de conhecimento
├── components/
│   ├── auth/                    # Componentes de autenticação
│   ├── shared/                  # Componentes compartilhados
│   ├── upload/                  # Componentes de upload
│   ├── download/                # Componentes de download
│   ├── supervisor/              # Componentes de supervisor
│   ├── dashboard/               # Componentes de dashboard
│   └── ui/                      # Componentes UI base (shadcn)
├── lib/
│   ├── services/                # Serviços e API clients
│   ├── stores/                  # Zustand stores
│   └── utils/                   # Utilitários
├── sql/                         # Estrutura de banco DynamoDB
│   ├── dynamodb-tables.json     # Definição das tabelas
│   ├── create-tables.py         # Script Python para criar tabelas
│   └── cloudformation-template.yaml  # Template CloudFormation
├── Documentacao/                # Documentação técnica completa
│   ├── BACKEND_STRUCTURE.md     # Estrutura completa do backend Python/FastAPI
│   ├── DEMO_CREDENTIALS.md      # Todas as credenciais de demonstração
│   ├── SECURITY_VALIDATION.md   # Sistema de validação de segurança
│   ├── API-DOCUMENTATION.md     # Documentação completa da API REST
│   ├── DEPLOYMENT-GUIDE.md      # Guia detalhado de deployment AWS
│   ├── DATA-MODELS.md           # Modelos de dados e queries DynamoDB
│   ├── AWS-IMPLEMENTATION-GUIDE.md  # Guia completo de implementação AWS (23 serviços)
│   ├── QUICK-START.md           # Deploy rápido em 1 dia
│   └── SQL-README.md            # Visão geral da estrutura de dados
└── types/                       # TypeScript types
\`\`\`

## Credenciais de Demonstração

Veja todas as credenciais em `Documentacao/DEMO_CREDENTIALS.md`

### Usuário Interno (Upload)
- **E-mail:** admin@petrobras.com.br
- **Senha:** demo123

### Usuário Externo (Download)
- **E-mail:** cliente@empresa.com
- **Senha:** demo123

### Usuário Externo (Demo Vazio)
- **E-mail:** demo@exemplo.com.br
- **Senha:** demo123

### Usuário Supervisor (Aprovação)
- **E-mail:** supervisor@petrobras.com.br
- **Senha:** demo123

## Instalação

\`\`\`bash
# Instalar dependências
npm install

# Ou com pnpm
pnpm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
\`\`\`

## Funcionalidades

### Autenticação
- Login com validação em tempo real
- Detecção automática de tipo de usuário (@petrobras = interno)
- Recuperação de senha via modal elegante
- Sistema de notificações modernas
- Credenciais de demonstração para testes
- Usuário demo vazio para demonstração

### Sistema de Auditoria e Logs
- Registro completo de todas as ações do sistema
- Logs de login, upload, download, aprovação, rejeição
- Filtros avançados por tipo, usuário e data
- Busca em tempo real
- Detalhes completos de cada log com metadados
- Métricas e estatísticas visuais

### Sistema de Notificações
- Notificações em tempo real para usuários
- Alertas de arquivos expirados
- Notificações de aprovação/rejeição
- Avisos preventivos (24h antes da expiração)
- Centro de notificações no header

### Validação de Segurança
- Validação de arquivos ZIP em upload
- Detecção de extensões bloqueadas (.exe, .bat, etc.)
- Sistema de quarentena
- Logs de tentativas de upload de arquivos bloqueados
- Veja detalhes em `Documentacao/SECURITY_VALIDATION.md`

### Modo Escuro
- Toggle sutil no header da aplicação
- Transições suaves entre modos
- Cores otimizadas para ambos os modos
- Persistência da preferência do usuário

### Página de Upload (Usuário Interno)
- Upload de múltiplos arquivos simultaneamente
- Drag-and-drop intuitivo
- Preview dos arquivos selecionados
- Campo de destinatário com validação
- Descrição obrigatória dos arquivos
- Validações de segurança em tempo real
- Dashboard com métricas clicáveis
- Breadcrumb navigation

### Página de Download (Usuário Externo)
- Listagem de documentos confidenciais
- Sistema de busca avançado
- Filtros por tipo de arquivo
- Ordenação personalizada
- Seleção múltipla para download em lote
- Download individual de documentos
- Aviso de confidencialidade
- Histórico de downloads

### Sistema de Histórico de Atividades
- Timeline visual com ícones coloridos
- Filtros avançados por tipo e período
- Modal de detalhes completos
- Contadores em tempo real
- Rastreamento de todas as ações

### Página de Supervisor (Aprovação)
- Visualização detalhada de documentos
- Dashboard com métricas clicáveis
- Informações completas do arquivo
- Dados do remetente com estatísticas
- Histórico de envios anteriores
- Lista de destinatários
- Aprovação/rejeição com justificativa
- Alteração de tempo de expiração
- Breadcrumb navigation

### Central de Conhecimento (Wiki)
- Documentação completa do sistema
- Categorias organizadas
- Busca avançada
- Artigos detalhados com exemplos
- Guias passo a passo

## Infraestrutura AWS e Backend

### DynamoDB
A estrutura completa de banco de dados está na pasta `sql/`:
- 5 tabelas DynamoDB (users, files, audit-logs, notifications, sessions)
- Índices GSI otimizados para consultas
- TTL configurado para dados temporários
- Script Python automatizado para criação

### CloudFormation
Template completo com:
- DynamoDB Tables
- S3 Buckets para arquivos
- Lambda Functions
- API Gateway
- SQS Queues
- SNS Topics
- IAM Roles e Policies

### API REST
Documentação completa em `Documentacao/API-DOCUMENTATION.md`:
- Autenticação com JWT
- Endpoints de Upload/Download
- Sistema de Aprovação
- Auditoria e Logs
- Notificações

### Frontend Preparado
O cliente API está em `lib/services/api-client.ts`:
- Interceptors configurados
- Refresh token automático
- Tratamento de erros
- TypeScript types completos

## Integração Backend Python

Veja exemplos completos em `Documentacao/BACKEND_STRUCTURE.md`

### Endpoints Esperados

#### Autenticação
- `POST /api/v1/auth/login` - Login de usuário
- `POST /api/v1/auth/refresh` - Renovar access token
- `POST /api/v1/auth/logout` - Logout

#### Upload (Interno)
- `POST /api/v1/uploads` - Upload de arquivos
- `GET /api/v1/uploads` - Listar uploads
- `DELETE /api/v1/uploads/:id` - Deletar upload

#### Download (Externo)
- `GET /api/v1/files` - Listar arquivos disponíveis
- `GET /api/v1/files/:id/download` - Download de arquivo
- `POST /api/v1/files/bulk-download` - Download múltiplo

#### Supervisor (Aprovação)
- `GET /api/v1/approvals` - Listar pendentes
- `POST /api/v1/approvals/:id/approve` - Aprovar
- `POST /api/v1/approvals/:id/reject` - Rejeitar
- `PATCH /api/v1/approvals/:id/expiration` - Alterar expiração

#### Auditoria
- `GET /api/v1/audit-logs` - Listar logs
- `GET /api/v1/audit-logs/:id` - Detalhes do log
- `POST /api/v1/audit-logs` - Criar log

#### Notificações
- `GET /api/v1/notifications` - Listar notificações
- `PATCH /api/v1/notifications/:id/read` - Marcar como lida
- `DELETE /api/v1/notifications/:id` - Deletar notificação

## Design System

O projeto utiliza as cores oficiais da Petrobras com melhorias de UX/UI:
- **Teal Primário:** #00A99D
- **Azul Ação:** #0047BB
- **Gradiente Animado:** Teal → Azul → Verde

### UX/UI Profissional
- Hierarquia visual clara com espaçamento otimizado
- Tipografia escalável e acessível (16px mínimo)
- Estados de hover, focus e active bem definidos
- Feedback visual em todas as interações
- Loading states e skeleton screens
- Micro-interações suaves (300ms transitions)
- Mobile-first responsivo
- Touch targets de 44px mínimo
- Focus states visíveis para acessibilidade
- Breadcrumb navigation com ícone home
- Botão scroll to top em páginas longas

## Deployment na AWS

### Pré-requisitos
1. Conta AWS configurada
2. AWS CLI instalado
3. Python 3.9+ e boto3
4. Credenciais IAM com permissões adequadas

### Passo 1: Deploy do Backend
\`\`\`bash
cd sql/
python create-tables.py
# Ou use CloudFormation
aws cloudformation create-stack --stack-name petrobras-email-system --template-body file://cloudformation-template.yaml
\`\`\`

### Passo 2: Deploy do Frontend
\`\`\`bash
# Build Next.js
npm run build

# Deploy no Vercel ou AWS Amplify
vercel --prod
\`\`\`

Veja o guia completo em `Documentacao/DEPLOYMENT-GUIDE.md` ou o quick start em `Documentacao/QUICK-START.md`

## Próximos Passos

1. ✅ Sistema de login com validação
2. ✅ Páginas de Upload, Download e Supervisor
3. ✅ Modo escuro
4. ✅ Sistema de notificações elegante
5. ✅ Sistema de Histórico de Atividades
6. ✅ Sistema de Auditoria e Logs
7. ✅ Estrutura DynamoDB completa
8. ✅ Melhorias UX/UI profissionais
9. ✅ Mobile responsive
10. ⬜ Implementar backend Python/FastAPI
11. ⬜ Conectar endpoints reais da API
12. ⬜ Upload de arquivos real para S3
13. ⬜ Sistema de autenticação JWT completo
14. ⬜ Processamento de arquivos com Lambda
15. ⬜ Deploy completo na AWS

## Scripts Disponíveis

\`\`\`bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa ESLint
npm run type-check   # Verifica tipos TypeScript
\`\`\`

## Variáveis de Ambiente

Crie um arquivo `.env.local` com:

\`\`\`env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# AWS (para produção)
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_S3_BUCKET=petrobras-email-files
\`\`\`

Veja `.env.example` para todas as variáveis disponíveis.

## Documentação

### Documentação Técnica (Pasta `Documentacao/`)
- **BACKEND_STRUCTURE.md** - Estrutura completa do backend Python/FastAPI
- **DEMO_CREDENTIALS.md** - Todas as credenciais de demonstração
- **SECURITY_VALIDATION.md** - Sistema de validação de segurança
- **API-DOCUMENTATION.md** - Documentação completa da API REST
- **DEPLOYMENT-GUIDE.md** - Guia detalhado de deployment AWS
- **DATA-MODELS.md** - Modelos de dados e queries DynamoDB
- **AWS-IMPLEMENTATION-GUIDE.md** - Guia completo de implementação AWS (23 serviços)
- **QUICK-START.md** - Deploy rápido em 1 dia
- **SQL-README.md** - Visão geral da estrutura de dados

### Scripts SQL (Pasta `sql/`)
- **dynamodb-tables.json** - Definição completa das tabelas
- **create-tables.py** - Script automatizado de criação
- **cloudformation-template.yaml** - Infraestrutura completa AWS

## Licença

© 2025 Petrobras. Todos os direitos reservados.
