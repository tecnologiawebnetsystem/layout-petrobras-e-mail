# Credenciais de Demonstração

Este sistema possui três tipos de usuários com credenciais de demonstração:

## Usuário Interno (Upload)
- **E-mail:** admin@petrobras.com.br
- **Senha:** demo123
- **Nome:** João Silva
- **Acesso:** Página de Upload de Arquivos

## Usuário Externo (Download)
- **E-mail:** cliente@empresa.com
- **Senha:** demo123
- **Nome:** Maria Santos
- **Acesso:** Página de Download de Documentos

## Usuário Supervisor (Aprovação)
- **E-mail:** supervisor@petrobras.com.br
- **Senha:** demo123
- **Nome:** Carlos Mendes
- **Acesso:** Módulo Supervisor - Visualização e Aprovação de Documentos

## Validação em Tempo Real

O sistema detecta automaticamente o tipo de usuário baseado no e-mail:
- E-mails contendo "@petrobras" do tipo admin são direcionados para a página de **Upload**
- E-mails contendo "@petrobras" do tipo supervisor são direcionados para o **Módulo Supervisor**
- Outros e-mails são direcionados para a página de **Download**

## Funcionalidades

### Página de Upload (Interno)
- Upload de múltiplos arquivos via drag-and-drop
- Campo de destinatário com validação
- Descrição obrigatória dos arquivos
- Validações elegantes via modals
- Preview dos arquivos selecionados

### Página de Download (Externo)
- Listagem de documentos confidenciais
- Busca por nome de arquivo
- Filtros por tipo e ordenação
- Seleção múltipla para download em lote
- Download individual de documentos
- Aviso de confidencialidade

### Módulo Supervisor (Aprovação)
- Visualização detalhada de documentos enviados
- Informações completas do remetente
- Histórico de envios do usuário
- Metadados do documento (tipo, contrato, centro de custo)
- Lista de destinatários do documento
- Descrição enviada pelo remetente
- Download de arquivos originais
- Interface elegante com estatísticas

### Recursos Globais
- Modo escuro elegante e sutil
- Menu de perfil com dados do usuário
- Logout seguro
- Design system baseado nas cores da Petrobras
- Notificações modernas sem alerts JavaScript
- Breadcrumb navigation
- Responsivo e acessível
