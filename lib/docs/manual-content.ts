// Conteudo estruturado do Manual do Usuario do SCAC.
// Fonte unica de verdade usada tanto pela pagina online (/docs) quanto
// pela geracao do PDF (lib/docs/generate-manual-pdf.ts).
//
// Perfis oficiais (ver lib/auth/cav4-config.ts -> getUserTypeLabel):
//   internal   -> "Remetente"       -> rota /upload
//   supervisor -> "Gestor"          -> rota /supervisor
//   admin      -> "Monitor"         -> rota /admin
//   external   -> "Usuario Externo" -> rota /download

export type ManualBlock =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "note"; variant: "info" | "warning" | "tip" | "important"; title?: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "subheading"; text: string }

export type ManualSection = {
  id: string
  title: string
  summary: string
  blocks: ManualBlock[]
}

export type ManualDocument = {
  title: string
  subtitle: string
  version: string
  updatedAt: string
  sections: ManualSection[]
}

export const MANUAL: ManualDocument = {
  title: "Manual do Usuario",
  subtitle: "SCAC - Solucao de Compartilhamento de Arquivos Confidenciais",
  version: "2.0",
  updatedAt: "Agosto de 2026",
  sections: [
    // ------------------------------------------------------------------
    {
      id: "visao-geral",
      title: "1. Visao Geral",
      summary: "O que e o SCAC, para que serve e como o acesso e organizado.",
      blocks: [
        {
          type: "paragraph",
          text: "O SCAC (Solucao de Compartilhamento de Arquivos Confidenciais) e a plataforma da Petrobras para o envio seguro de arquivos confidenciais entre colaboradores internos e destinatarios externos (parceiros, fornecedores e terceiros). Todo compartilhamento passa por um fluxo de governanca: autenticacao corporativa, controle de permissoes, aprovacao quando necessaria, entrega com acesso temporario e registro completo em auditoria.",
        },
        {
          type: "paragraph",
          text: "A plataforma foi desenhada em torno de quatro perfis de acesso. Cada perfil enxerga apenas as funcoes que lhe dizem respeito, e o sistema direciona o usuario automaticamente para a sua area apos o login.",
        },
        { type: "subheading", text: "Os quatro perfis" },
        {
          type: "table",
          headers: ["Perfil", "Area de acesso", "Responsabilidade principal"],
          rows: [
            ["Remetente", "/upload", "Envia arquivos e cria compartilhamentos"],
            ["Gestor", "/supervisor", "Aprova ou rejeita os compartilhamentos da equipe"],
            ["Monitor", "/admin", "Audita, rastreia e acompanha metricas do sistema"],
            ["Usuario Externo", "/download", "Recebe e baixa arquivos via codigo OTP"],
          ],
        },
        {
          type: "note",
          variant: "info",
          title: "Direcionamento automatico",
          text: "Ao concluir o login, o sistema identifica o perfil do usuario e o encaminha para a area correspondente (Remetente para /upload, Gestor para /supervisor, Monitor para /admin). O usuario externo nao faz login corporativo: ele acessa diretamente a area de download com um codigo enviado por e-mail.",
        },
        { type: "subheading", text: "Ambientes" },
        {
          type: "bullets",
          items: [
            "Ambiente interno (intranet): autenticacao corporativa via CAv4, acesso restrito a rede Petrobras.",
            "Ambiente externo (internet): acesso publico apenas para download, protegido por verificacao de e-mail e codigo OTP.",
          ],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "login-cav4",
      title: "2. Login e Autenticacao (CAv4)",
      summary: "Como e feito o login corporativo pelo CAv4 e onde entra o Entra ID.",
      blocks: [
        {
          type: "paragraph",
          text: "O login dos usuarios internos (Remetente, Gestor e Monitor) e feito pelo CAv4 (Controle de Acesso Corporativo v4) da Petrobras, usando o padrao OIDC (OpenID Connect) com o fluxo Authorization Code + PKCE. O usuario nao digita senha na aplicacao: ele e redirecionado para o provedor corporativo, autentica com suas credenciais Petrobras e retorna ja autenticado.",
        },
        {
          type: "note",
          variant: "important",
          title: "O que mudou",
          text: "O login nao depende mais diretamente do Entra ID (Azure AD). A autenticacao e a definicao de perfil sao feitas pelo CAv4. O Entra ID / Microsoft Graph continua disponivel apenas como enriquecimento opcional do perfil (cargo, departamento, gestor e foto), nunca como porta de entrada da autenticacao.",
        },
        { type: "subheading", text: "Passo a passo do login" },
        {
          type: "steps",
          items: [
            "Na tela inicial, clique em 'Login Corporativo'.",
            "Voce e redirecionado ao CAv4, que valida suas credenciais Petrobras (matricula).",
            "Se houver MFA configurado, confirme o acesso no aplicativo autenticador.",
            "O CAv4 retorna o codigo de autorizacao para a aplicacao, que o troca por um token e emite a sessao interna (JWT).",
            "O sistema consulta os papeis (roles) do usuario no CAv4 e o direciona para a area do seu perfil.",
          ],
        },
        { type: "subheading", text: "Identidade do usuario" },
        {
          type: "paragraph",
          text: "O CAv4 identifica o usuario pela MATRICULA (claim user_login, por exemplo 'GFZ3'), e nao pelo e-mail. O e-mail e obtido nos detalhes cadastrais e serve de ponte para o enriquecimento opcional via Microsoft Graph.",
        },
        {
          type: "note",
          variant: "tip",
          title: "Login automatico",
          text: "Se voce ja tiver uma sessao corporativa ativa, o login pode ser concluido sem digitar credenciais novamente (SSO).",
        },
        { type: "subheading", text: "Modos de autenticacao" },
        {
          type: "table",
          headers: ["Modo", "Quando e usado", "Como funciona"],
          rows: [
            ["cav4", "Homologacao e producao", "OIDC Authorization Code + PKCE conduzido pelo backend; roles vindas do CAv4"],
            ["local", "Desenvolvimento e testes", "E-mail + senha (bcrypt), sem dependencia do CAv4"],
          ],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "perfil-remetente",
      title: "3. Perfil Remetente",
      summary: "Colaborador interno que envia arquivos e cria compartilhamentos.",
      blocks: [
        {
          type: "paragraph",
          text: "O Remetente e o colaborador Petrobras autenticado (usuario interno) responsavel por enviar arquivos confidenciais a destinatarios externos. E o perfil de entrada do fluxo: tudo comeca com um Remetente criando um compartilhamento na area /upload.",
        },
        { type: "subheading", text: "O que o Remetente pode fazer" },
        {
          type: "bullets",
          items: [
            "Fazer upload de um ou mais arquivos (armazenados de forma segura no S3).",
            "Criar um compartilhamento informando o e-mail do destinatario externo.",
            "Definir a politica de consumo (apos o primeiro download ou apos todos baixarem) e o prazo de expiracao.",
            "Acompanhar seus compartilhamentos em 'Meus Compartilhamentos' (pendentes, aprovados, rejeitados, concluidos).",
            "Cancelar solicitacoes pendentes e reenviar a notificacao ao destinatario.",
          ],
        },
        { type: "subheading", text: "Fluxo de envio" },
        {
          type: "steps",
          items: [
            "Acesse a area /upload apos o login.",
            "Selecione os arquivos e informe o e-mail do destinatario externo.",
            "Defina prazo de expiracao e politica de consumo.",
            "Envie: o sistema cria o compartilhamento (status PENDENTE) e notifica o Gestor responsavel.",
            "Apos a aprovacao do Gestor, o destinatario externo recebe o e-mail com o link de acesso.",
          ],
        },
        {
          type: "note",
          variant: "important",
          title: "Aprovacao obrigatoria por padrao",
          text: "No fluxo padrao, todo compartilhamento criado por um Remetente entra como PENDENTE e so e liberado ao destinatario apos a aprovacao de um Gestor. Isso garante a governanca sobre o que sai da organizacao.",
        },
        {
          type: "table",
          headers: ["Permissao (RBAC)", "Descricao"],
          rows: [
            ["file:upload", "Enviar arquivos"],
            ["shares:create", "Criar compartilhamentos"],
            ["shares:read", "Consultar seus proprios compartilhamentos"],
            ["shares:cancel", "Cancelar solicitacoes pendentes"],
            ["shares:resend", "Reenviar notificacao ao destinatario"],
          ],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "perfil-gestor",
      title: "4. Perfil Gestor",
      summary: "Responsavel por aprovar ou rejeitar os compartilhamentos da equipe.",
      blocks: [
        {
          type: "paragraph",
          text: "O Gestor e um usuario interno com a prerrogativa de aprovacao (identificado pela flag de supervisao / role de supervisor no CAv4, e pelo vinculo com areas na tabela AreaSupervisors). Ele e o ponto de controle: nenhum arquivo chega ao destinatario externo sem passar pela sua analise, no fluxo padrao.",
        },
        { type: "subheading", text: "O que o Gestor pode fazer" },
        {
          type: "bullets",
          items: [
            "Ver a lista de compartilhamentos PENDENTES dos colaboradores sob sua responsabilidade.",
            "Abrir os detalhes de um compartilhamento e baixar os arquivos para analise antes de decidir.",
            "Aprovar um compartilhamento: o sistema emite o token de acesso e envia o e-mail ao destinatario externo.",
            "Rejeitar um compartilhamento informando o motivo.",
            "Estender o prazo de expiracao de um compartilhamento.",
            "Consultar o historico de aprovacoes e rejeicoes e reenviar notificacoes.",
          ],
        },
        { type: "subheading", text: "Aprovar e rejeitar" },
        {
          type: "steps",
          items: [
            "Acesse o Painel do Gestor em /supervisor (o sistema detecta seu perfil automaticamente apos o login).",
            "Abra a lista de pendentes e selecione o compartilhamento.",
            "Revise os arquivos e os dados do destinatario.",
            "Clique em Aprovar (libera e notifica o externo) ou em Rejeitar (informe o motivo).",
          ],
        },
        {
          type: "note",
          variant: "info",
          title: "Auto-aprovacao por cargo (opcional)",
          text: "A plataforma preve liberacao direta para determinados cargos ou grupos, em que o compartilhamento ja nasce APROVADO sem aguardar um Gestor. Quando habilitada, essa regra vale para cargos com responsabilidade formal de envio; supervisores comuns nao recebem auto-aprovacao por padrao.",
        },
        {
          type: "table",
          headers: ["Permissao (RBAC)", "Descricao"],
          rows: [
            ["dashboard:read", "Ver o painel com indicadores da equipe"],
            ["shares:read", "Consultar compartilhamentos sob sua responsabilidade"],
            ["shares:approve", "Aprovar compartilhamentos"],
            ["shares:reject", "Rejeitar compartilhamentos"],
            ["shares:resend", "Reenviar notificacoes"],
            ["file:download", "Baixar arquivos para analise"],
            ["file:upload / shares:create", "Tambem pode criar seus proprios compartilhamentos"],
          ],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "perfil-monitor",
      title: "5. Perfil Monitor",
      summary: "Auditoria, rastreabilidade e metricas globais do sistema.",
      blocks: [
        {
          type: "paragraph",
          text: "O Monitor e o colaborador interno com acesso administrativo global (role de admin no CAv4). E o perfil de observabilidade e governanca: acompanha o que acontece em toda a plataforma, com foco em auditoria, rastreabilidade e metricas. Acessa a area /admin.",
        },
        { type: "subheading", text: "O que o Monitor pode fazer" },
        {
          type: "bullets",
          items: [
            "Visualizar o dashboard com metricas globais (compartilhamentos, aprovacoes, rejeicoes, downloads).",
            "Consultar todos os compartilhamentos do sistema, de qualquer usuario.",
            "Consultar os logs de auditoria completos (acessos, uploads, downloads, aprovacoes, envios de e-mail).",
            "Rastrear a atividade completa de um usuario especifico, por e-mail ou por identificador.",
            "Acompanhar as metricas de e-mails enviados pela plataforma.",
          ],
        },
        {
          type: "note",
          variant: "important",
          title: "Acesso sensivel",
          text: "O Monitor tem visibilidade sobre os logs e a rastreabilidade de todos os usuarios. Esse acesso deve ser usado com responsabilidade e de acordo com as politicas de seguranca da informacao da Petrobras.",
        },
        { type: "subheading", text: "Rastreamento por usuario" },
        {
          type: "paragraph",
          text: "A partir de um e-mail ou identificador, o Monitor consegue reconstruir a linha do tempo completa de um usuario: logins, uploads, compartilhamentos criados e downloads realizados, com data, hora e origem.",
        },
        {
          type: "table",
          headers: ["Permissao (RBAC)", "Descricao"],
          rows: [
            ["dashboard:read", "Metricas globais do sistema"],
            ["audit:read", "Logs e rastreamento de auditoria"],
            ["shares:read", "Todos os compartilhamentos"],
            ["emails:read", "Metricas e historico de e-mails"],
          ],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "perfil-externo",
      title: "6. Perfil Usuario Externo",
      summary: "Destinatario que recebe e baixa os arquivos via codigo OTP.",
      blocks: [
        {
          type: "paragraph",
          text: "O Usuario Externo e o destinatario do compartilhamento (parceiro, fornecedor ou terceiro). Ele nao faz login corporativo e nao tem acesso ao sistema interno: seu acesso e restrito ao download de um compartilhamento especifico, validado por um codigo temporario (OTP) enviado ao seu e-mail.",
        },
        { type: "subheading", text: "Como o externo acessa os arquivos" },
        {
          type: "steps",
          items: [
            "Recebe um e-mail informando que ha arquivos disponiveis, com um link de acesso.",
            "Acessa a area /download e informa o seu e-mail (o mesmo que recebeu o convite).",
            "Recebe um codigo OTP por e-mail e o digita para se autenticar.",
            "Visualiza a lista de arquivos e faz o download individual ou de todos em um arquivo ZIP.",
          ],
        },
        {
          type: "note",
          variant: "warning",
          title: "Acesso temporario e limitado",
          text: "O codigo OTP tem validade curta (por padrao 5 minutos) e um numero maximo de tentativas antes de bloquear. O acesso ao compartilhamento tambem expira conforme o prazo definido pelo Remetente e a politica de consumo (por exemplo, encerrar apos o primeiro download).",
        },
        { type: "subheading", text: "Problemas comuns" },
        {
          type: "table",
          headers: ["Sintoma", "Causa provavel", "O que fazer"],
          rows: [
            ["Nao recebi o codigo", "E-mail na caixa de spam ou atraso de entrega", "Verifique o spam e solicite reenvio"],
            ["Codigo invalido", "OTP expirado ou digitado errado", "Solicite um novo codigo"],
            ["Link expirado", "Prazo do compartilhamento encerrado", "Solicite ao remetente um novo envio"],
            ["Acesso bloqueado", "Excesso de tentativas de OTP", "Aguarde o desbloqueio e tente novamente"],
          ],
        },
        {
          type: "table",
          headers: ["Permissao (RBAC)", "Descricao"],
          rows: [
            ["Validar OTP", "Autenticar-se no compartilhamento"],
            ["file:download", "Baixar os arquivos disponibilizados"],
          ],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "permissoes-rbac",
      title: "7. Permissoes e Controle de Acesso (RBAC)",
      summary: "Como o sistema decide o que cada perfil pode fazer.",
      blocks: [
        {
          type: "paragraph",
          text: "O controle de acesso segue o modelo RBAC (Role-Based Access Control): o que cada usuario pode fazer e determinado pelo seu perfil (role). Os perfis internos vem do CAv4; o perfil externo e definido pelo fluxo de OTP. As permissoes sao verificadas no backend a cada requisicao.",
        },
        { type: "subheading", text: "Matriz de permissoes por perfil" },
        {
          type: "table",
          headers: ["Acao", "Remetente", "Gestor", "Monitor", "Externo"],
          rows: [
            ["Upload de arquivos", "Sim", "Sim", "-", "-"],
            ["Criar compartilhamentos", "Sim", "Sim", "-", "-"],
            ["Aprovar / rejeitar", "-", "Sim", "-", "-"],
            ["Painel de metricas globais", "-", "-", "Sim", "-"],
            ["Logs e rastreamento", "-", "Equipe", "Global", "-"],
            ["Historico de e-mails", "-", "-", "Sim", "-"],
            ["Autenticar via CAv4", "Sim", "Sim", "Sim", "-"],
            ["Validar OTP", "-", "-", "-", "Sim"],
            ["Download de arquivos", "-", "Sim (analise)", "-", "Sim"],
          ],
        },
        { type: "subheading", text: "Recursos e permissoes cadastrados no CAv4" },
        {
          type: "table",
          headers: ["Recurso", "Permissoes"],
          rows: [
            ["audit", "audit:read"],
            ["dashboard", "dashboard:read"],
            ["emails", "emails:read"],
            ["file", "file:download, file:upload"],
            ["notifications", "notifications:read"],
            ["report", "report:read"],
            ["shares", "shares:create, shares:read, shares:approve, shares:reject, shares:cancel, shares:resend, shares:delete"],
          ],
        },
        {
          type: "note",
          variant: "info",
          title: "Onde as permissoes sao aplicadas",
          text: "A verificacao esta centralizada no backend (guards de rota como require_internal, require_supervisor e require_admin). O usuario externo e validado por um contexto de acesso proprio (TokenAccess), separado do JWT interno.",
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "modulos-componentes",
      title: "8. Modulos e Componentes",
      summary: "As areas da aplicacao e o que cada uma faz.",
      blocks: [
        {
          type: "paragraph",
          text: "A aplicacao e organizada em modulos, cada um associado a um perfil e a um conjunto de permissoes. A tabela abaixo resume as principais areas da interface e a sua funcao.",
        },
        {
          type: "table",
          headers: ["Modulo / Rota", "Perfil", "Funcao"],
          rows: [
            ["/upload", "Remetente", "Envio de arquivos e criacao de compartilhamentos"],
            ["Meus Compartilhamentos", "Remetente", "Acompanhamento e gestao dos proprios envios"],
            ["/supervisor", "Gestor", "Painel de aprovacao, pendentes e historico"],
            ["/admin", "Monitor", "Dashboard, compartilhamentos, logs e rastreamento"],
            ["/download", "Externo", "Verificacao por OTP e download dos arquivos"],
            ["Notificacoes", "Interno", "Avisos de aprovacao, rejeicao e novas solicitacoes"],
          ],
        },
        { type: "subheading", text: "Componentes de apoio" },
        {
          type: "bullets",
          items: [
            "Autenticacao CAv4 (OIDC/PKCE) para os perfis internos e enriquecimento opcional via Microsoft Graph.",
            "Servico de OTP e tokens de acesso para o fluxo externo (validade e tentativas controladas).",
            "Armazenamento seguro de arquivos com URLs pre-assinadas (S3) e prazo de validade.",
            "Servico de e-mail para notificacoes de aprovacao, rejeicao, OTP e entrega ao destinatario.",
            "Trilha de auditoria que registra todas as acoes relevantes do sistema.",
          ],
        },
        {
          type: "note",
          variant: "tip",
          title: "Direcionamento por perfil",
          text: "Cada usuario ve apenas os modulos do seu perfil. Ao entrar, o sistema redireciona automaticamente para a area correta, evitando que o usuario precise procurar onde ir.",
        },
      ],
    },
  ],
}
