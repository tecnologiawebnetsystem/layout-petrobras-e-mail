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
- Estrutura completa documentada em `BACKEND_STRUCTURE.md`

## Estrutura do Projeto

\`\`\`
.
├── app/
│   ├── page.tsx                 # Página de login
│   ├── upload/                  # Módulo interno (upload)
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── download/                # Módulo externo (download)
│   │   ├── page.tsx
│   │   └── loading.tsx
│   └── supervisor/              # Módulo supervisor (aprovação)
│       ├── page.tsx
│       └── loading.tsx
├── components/
│   ├── auth/                    # Componentes de autenticação
│   │   ├── login-form.tsx
│   │   └── forgot-password-modal.tsx
│   ├── shared/                  # Componentes compartilhados
│   │   ├── app-header.tsx
│   │   └── notification-modal.tsx
│   ├── upload/                  # Componentes de upload
│   │   ├── file-upload-zone.tsx
│   │   └── file-list.tsx
│   ├── download/                # Componentes de download
│   │   └── document-card.tsx
│   ├── supervisor/              # Componentes de supervisor
│   │   └── document-approval.tsx
│   └── ui/                      # Componentes UI base (shadcn)
├── lib/
│   ├── api/                     # Cliente API
│   │   ├── auth.ts
│   │   └── emails.ts
│   └── stores/                  # Zustand stores
│       ├── auth-store.ts
│       └── theme-store.ts
└── types/                       # TypeScript types
    └── index.ts
\`\`\`

## Credenciais de Demonstração

### Usuário Interno (Upload)
- **E-mail:** admin@petrobras.com.br
- **Senha:** demo123
- **Acesso:** Página de Upload de Arquivos

### Usuário Externo (Download)
- **E-mail:** cliente@empresa.com
- **Senha:** demo123
- **Acesso:** Página de Download de Documentos

### Usuário Supervisor (Aprovação)
- **E-mail:** supervisor@petrobras.com.br
- **Senha:** demo123
- **Acesso:** Página de Visualização e Aprovação de Documentos

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
- Sistema de notificações modernas (sem alerts JavaScript)
- Credenciais de demonstração para testes

### Validação em Tempo Real
- Indicador visual do tipo de usuário baseado no e-mail
- Validações elegantes via modals personalizadas
- Feedback instantâneo para todas as ações

### Modo Escuro
- Toggle sutil no header da aplicação
- Transições suaves entre modos
- Cores otimizadas para ambos os modos
- Persistência da preferência do usuário

### Página de Upload (Usuário Interno)
- Upload de múltiplos arquivos simultaneamente
- Drag-and-drop intuitivo
- Preview dos arquivos selecionados com informações
- Campo de destinatário com validação
- Descrição obrigatória dos arquivos
- Validações em tempo real
- Feedback visual durante upload

### Página de Download (Usuário Externo)
- Listagem de documentos confidenciais
- Sistema de busca avançado por nome
- Filtros por tipo de arquivo
- Ordenação personalizada
- Seleção múltipla para download em lote
- Download individual de documentos
- Cards informativos com detalhes completos
- Aviso de confidencialidade destacado
- Paginação de resultados

### Sistema de Histórico de Atividades

Todos os perfis possuem acesso a um histórico completo e detalhado de atividades.

#### Acesso
- Disponível no menu do perfil do usuário
- Link "Histórico de Atividades"
- Acessível por todos os tipos de usuário

#### Recursos
- **Timeline visual** com ícones coloridos por tipo de atividade
- **Filtros avançados**: 
  - Por tipo de atividade (upload, download, aprovação, etc.)
  - Busca por texto livre
  - Filtro por período de datas
- **Modal de detalhes** com informações completas
- **Contadores em tempo real** do total de atividades

#### Tipos de Atividades Rastreadas
- Upload de arquivos
- Download de arquivos
- Aprovações de documentos
- Rejeições de documentos
- Compartilhamentos
- Login no sistema
- Logout do sistema
- Exclusões de arquivos

#### Informações Detalhadas
Cada atividade mostra:
- Data e hora exata da ação
- Usuário responsável (nome e-mail)
- Descrição completa da ação
- Metadados específicos:
  - Nome e tamanho do arquivo
  - Destinatários/compartilhamentos
  - Status (aprovado/rejeitado)
  - Dispositivo e endereço IP
  - E muito mais

### Página de Supervisor (Aprovação)
- Visualização detalhada de documentos enviados
- Informações completas do arquivo
- Dados do remetente com estatísticas
- Histórico de envios anteriores
- Lista de usuários com compartilhamento
- Metadados do documento
- Descrição do remetente

## Integração Backend Python

O sistema está preparado para integração com backend Python/FastAPI. Veja os exemplos completos em:
- `BACKEND_STRUCTURE.md` - Estrutura completa do backend
- `lib/api/auth.ts` - Cliente de autenticação
- `lib/api/emails.ts` - Cliente de e-mails

### Endpoints Esperados

#### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/refresh` - Renovar access token
- `POST /api/auth/forgot-password` - Recuperação de senha

#### Upload (Interno)
- `POST /api/upload` - Upload de arquivos
- `GET /api/uploads` - Listar uploads
- `DELETE /api/uploads/:id` - Deletar upload

#### Download (Externo)
- `GET /api/documents` - Listar documentos disponíveis
- `GET /api/documents/:id/download` - Download de documento
- `POST /api/documents/bulk-download` - Download múltiplo

#### Supervisor (Aprovação)
- `GET /api/documents/pending` - Listar documentos pendentes de aprovação
- `POST /api/documents/:id/approve` - Aprovar documento
- `POST /api/documents/:id/reject` - Rejeitar documento

## Design System

O projeto utiliza as cores oficiais da Petrobras:
- **Teal Primário:** #00A99D
- **Azul Ação:** #0047BB
- **Gradiente Animado:** Teal → Azul → Verde

### Componentes UI
- Baseados em shadcn/ui
- Totalmente customizados com cores Petrobras
- Suporte completo a modo escuro
- Animações suaves e elegantes
- Acessibilidade (ARIA) implementada

## Próximos Passos

1. ✅ Sistema de login com validação
2. ✅ Páginas de Upload e Download
3. ✅ Modo escuro
4. ✅ Sistema de notificações elegante
5. ✅ Página de Supervisor (Aprovação)
6. ✅ Sistema de Histórico de Atividades
7. ⬜ Implementar backend Python conforme `BACKEND_STRUCTURE.md`
8. ⬜ Conectar endpoints reais da API
9. ⬜ Adicionar upload de arquivos real com progress
10. ⬜ Implementar download de documentos real
11. ⬜ Adicionar sistema de autenticação JWT completo
12. ⬜ Implementar histórico real conectado ao backend

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
NEXT_PUBLIC_API_URL=http://localhost:8000
\`\`\`

## Licença

© 2025 Petrobras. Todos os direitos reservados.
