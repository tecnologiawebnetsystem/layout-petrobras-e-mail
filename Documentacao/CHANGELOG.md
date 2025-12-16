# Changelog - Sistema de Transferência Petrobras

## [2.1.0] - 2025-01-15

### Adicionado
- Sistema de widgets separados para supervisor (Pendentes, Aprovados, Rejeitados) com filtros clicáveis
- Modal de motivo obrigatório para rejeição de documentos
- Validação rigorosa de arquivos perigosos (.exe, .dll, .bat, .sh, .msi, .app, .deb, .rpm) com notificação detalhada
- Limite de disponibilidade máxima de 72 horas (3 dias) no formulário
- Página de detalhes simplificada com informações essenciais do remetente (nome, email, cargo)
- Filtro automático de arquivos expirados (não aparecem mais na listagem)
- Sistema de logs detalhados para debug de autenticação
- Correção do campo de autenticação de `user.type` para `user.userType`
- Wiki de desenvolvimento completa em `/wiki-dev` com 5 páginas interativas
- Upgrade Next.js de 16.0.7 para 16.0.10

### Modificado
- Removida opção "Meu Perfil" para usuários internos no header
- Removido botão "Dashboard" da navegação principal
- Removida seção "Central de Conhecimento" do menu mobile e desktop
- Removida seção "Metadados" da página de detalhes
- Simplificada exibição de múltiplos arquivos em pacotes ZIP
- Breadcrumb navigation agora usa apenas mapas sem botão Dashboard
- Banner de "Notificações em Tempo Real" removido da tela de login
- Mensagem de disponibilidade corrigida para "até 72 horas" ao invés de "168 horas"
- Informações do remetente compactadas mostrando apenas dados essenciais

### Corrigido
- Correção crítica de validação de tipo de usuário em supervisor (user.userType)
- Correção de redirecionamento após login de supervisor (não volta mais para login)
- Arquivos aprovados não mostram mais botões de ação na página de detalhes
- Botões de Aprovar/Rejeitar aparecem apenas para documentos pendentes
- Todos os cards de documentos agora têm apenas botão "Ver Detalhes" independente do status
- Campos de ação (alterar tempo, aprovar, rejeitar) desabilitados quando documento já processado

### Segurança
- Validação de arquivos perigosos implementada ANTES do upload (client-side)
- Bloqueio de extensões maliciosas com feedback visual detalhado ao usuário
- Lista de extensões bloqueadas exibida na notificação de erro
- Arquivos não são adicionados à lista se forem perigosos

### Removido
- Sistema de proteção por senha nos downloads (não é mais necessário)
- Filtro de "Expirados" removido do select de status
- Logs de debug de produção removidos após correção de bugs
- Proteção por senha de arquivos completamente removida do sistema

---

## [2.0.0] - 2025-01-10

### Adicionado
- Sistema completo de auditoria e logs com 4 níveis (info, success, warning, error)
- Sistema de notificações em tempo real com SWR
- Modo escuro com toggle no header (light/dark)
- Wiki de desenvolvimento interna em `/wiki-dev` com navegação interativa
- Documentação AWS completa explicando POR QUÊ, ONDE e COMO usar cada serviço
- Métricas dashboard com 4 widgets clicáveis (Total, Aprovados, Rejeitados, Pendentes)
- Histórico de atividades com timeline visual e filtros
- Componentes shadcn/ui completos (accordion, alert, avatar, button, card, etc.)
- Sistema de busca na Wiki de desenvolvimento

### Modificado
- Melhoria na UX/UI com design profissional nas cores da Petrobras (verde, amarelo, azul)
- Responsividade completa mobile-first em todas as páginas
- Navegação breadcrumb melhorada com ícones e links clicáveis
- Header responsivo com menu mobile hamburger
- Tipografia otimizada com Geist Sans e Geist Mono

### Segurança
- Implementação de Row Level Security (RLS) preparada para DynamoDB
- Autenticação JWT com refresh token
- Validação de sessões com TTL automático
- Logs de auditoria para todas as ações críticas

---

## [1.0.0] - 2024-12-20

### Lançamento Inicial
- Sistema de login com validação de credenciais
- Módulo de upload para usuários internos com drag & drop
- Módulo de download para usuários externos com compartilhamento
- Módulo de aprovação para supervisores com workflow completo
- Integração preparada para backend Python/FastAPI
- Estrutura DynamoDB completa com 5 tabelas
- Scripts de criação de tabelas automatizados
- CloudFormation template para deploy AWS
- Documentação técnica completa
- README.md com guia de instalação

### Tabelas Implementadas
- `petrobras-users` - Gerenciamento de usuários
- `petrobras-files` - Metadados de arquivos
- `petrobras-audit-logs` - Logs de auditoria
- `petrobras-notifications` - Sistema de notificações
- `petrobras-sessions` - Controle de sessões

### Funcionalidades Core
- Upload de arquivos únicos ou múltiplos (ZIP)
- Download seguro com validação
- Aprovação/rejeição por supervisor
- Notificações em tempo real
- Histórico de atividades
- Sistema de expiração automática (24h, 48h, 72h)
- Interface responsiva e acessível
