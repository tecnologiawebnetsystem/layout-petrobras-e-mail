const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  convertInchesToTwip,
  PageBreak,
} = require("docx");
const fs = require("fs");

// Cores Petrobras
const PETROBRAS_GREEN = "007932";
const PETROBRAS_DARK = "0b253e";

// Função para criar célula de tabela
function createCell(text, options = {}) {
  const { bold = false, header = false, width = 50 } = options;
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: header ? { fill: PETROBRAS_DARK } : undefined,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: bold || header,
            color: header ? "FFFFFF" : "333333",
            size: 22,
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
}

// Função para criar tabela de caso de uso
function createUseCaseTable(useCase) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    },
    rows: [
      new TableRow({
        children: [
          createCell("Caso de Uso", { header: true, width: 25 }),
          createCell(useCase.id, { header: true, width: 75 }),
        ],
      }),
      new TableRow({
        children: [
          createCell("Nome", { bold: true, width: 25 }),
          createCell(useCase.nome, { width: 75 }),
        ],
      }),
      new TableRow({
        children: [
          createCell("Ator", { bold: true, width: 25 }),
          createCell(useCase.ator, { width: 75 }),
        ],
      }),
      new TableRow({
        children: [
          createCell("Objetivo", { bold: true, width: 25 }),
          createCell(useCase.objetivo, { width: 75 }),
        ],
      }),
      new TableRow({
        children: [
          createCell("Pré-condições", { bold: true, width: 25 }),
          createCell(useCase.preCondicoes, { width: 75 }),
        ],
      }),
      new TableRow({
        children: [
          createCell("Fluxo Principal", { bold: true, width: 25 }),
          createCell(useCase.fluxoPrincipal, { width: 75 }),
        ],
      }),
      new TableRow({
        children: [
          createCell("Pós-condições", { bold: true, width: 25 }),
          createCell(useCase.posCondicoes, { width: 75 }),
        ],
      }),
    ],
  });
}

// Função para criar linha de metadado
function createMetadataRow(label, value) {
  return new Paragraph({
    children: [
      new TextRun({
        text: label + " ",
        bold: true,
        color: "333333",
        size: 22,
        font: "Calibri",
      }),
      new TextRun({
        text: value,
        color: "333333",
        size: 22,
        font: "Calibri",
      }),
    ],
    spacing: { after: 80 },
  });
}

// Função para criar item de FAQ
function createFAQItem(pergunta, resposta) {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: pergunta,
          bold: true,
          color: PETROBRAS_DARK,
          size: 24,
          font: "Calibri",
        }),
      ],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: resposta,
          color: "333333",
          size: 22,
          font: "Calibri",
        }),
      ],
      spacing: { after: 200 },
    }),
  ];
}

// Casos de uso por perfil
const useCases = {
  interno: [
    {
      id: "UC-INT-01",
      nome: "Realizar Autenticação Corporativa",
      ator: "Usuário Interno",
      objetivo: "Acessar o sistema SCAC utilizando credenciais corporativas.",
      preCondicoes: "Usuário possui conta ativa no Entra ID.",
      fluxoPrincipal:
        "1. Acessar o portal SCAC → 2. Inserir credenciais corporativas → 3. Sistema valida no Entra ID → 4. Acesso concedido ao dashboard.",
      posCondicoes: "Usuário autenticado com sessão ativa.",
    },
    {
      id: "UC-INT-02",
      nome: "Criar Solicitação de Compartilhamento",
      ator: "Usuário Interno",
      objetivo: "Iniciar uma solicitação para compartilhar arquivos com usuários externos.",
      preCondicoes: "Usuário autenticado no sistema.",
      fluxoPrincipal:
        "1. Acessar 'Nova Solicitação' → 2. Informar dados do destinatário (nome, e-mail) → 3. Definir período de validade → 4. Salvar solicitação.",
      posCondicoes: "Solicitação criada com status 'Aguardando Upload'.",
    },
    {
      id: "UC-INT-03",
      nome: "Realizar Upload de Arquivos",
      ator: "Usuário Interno",
      objetivo: "Anexar arquivos à solicitação de compartilhamento.",
      preCondicoes: "Solicitação criada e em edição.",
      fluxoPrincipal:
        "1. Selecionar solicitação → 2. Clicar em 'Anexar Arquivos' → 3. Selecionar arquivos locais → 4. Confirmar upload → 5. Enviar para aprovação.",
      posCondicoes: "Arquivos anexados; solicitação enviada ao Supervisor.",
    },
    {
      id: "UC-INT-04",
      nome: "Acompanhar Status da Solicitação",
      ator: "Usuário Interno",
      objetivo: "Verificar o andamento das solicitações criadas.",
      preCondicoes: "Usuário autenticado; possui solicitações registradas.",
      fluxoPrincipal:
        "1. Acessar 'Minhas Solicitações' → 2. Visualizar lista com status → 3. Filtrar por status/data → 4. Consultar detalhes.",
      posCondicoes: "Usuário informado sobre o status atual.",
    },
  ],
  supervisor: [
    {
      id: "UC-SUP-01",
      nome: "Aprovar Solicitação de Compartilhamento",
      ator: "Supervisor",
      objetivo: "Autorizar o compartilhamento de arquivos solicitado por usuário interno.",
      preCondicoes: "Solicitação pendente de aprovação; Supervisor autenticado.",
      fluxoPrincipal:
        "1. Acessar 'Aprovações Pendentes' → 2. Selecionar solicitação → 3. Revisar arquivos e destinatário → 4. Clicar em 'Aprovar'.",
      posCondicoes: "Solicitação aprovada; link de acesso gerado e enviado ao externo.",
    },
    {
      id: "UC-SUP-02",
      nome: "Rejeitar Solicitação de Compartilhamento",
      ator: "Supervisor",
      objetivo: "Negar uma solicitação de compartilhamento com justificativa.",
      preCondicoes: "Solicitação pendente de aprovação; Supervisor autenticado.",
      fluxoPrincipal:
        "1. Acessar 'Aprovações Pendentes' → 2. Selecionar solicitação → 3. Informar motivo da rejeição → 4. Clicar em 'Rejeitar'.",
      posCondicoes: "Solicitação rejeitada; solicitante notificado com justificativa.",
    },
    {
      id: "UC-SUP-03",
      nome: "Compartilhar Arquivos Diretamente",
      ator: "Supervisor",
      objetivo: "Realizar compartilhamento próprio sem necessidade de aprovação.",
      preCondicoes: "Supervisor autenticado no sistema.",
      fluxoPrincipal:
        "1. Acessar 'Novo Compartilhamento' → 2. Informar destinatário → 3. Anexar arquivos → 4. Definir validade → 5. Confirmar envio.",
      posCondicoes: "Compartilhamento ativo; link enviado automaticamente ao externo.",
    },
    {
      id: "UC-SUP-04",
      nome: "Visualizar Histórico de Aprovações",
      ator: "Supervisor",
      objetivo: "Consultar o histórico de solicitações aprovadas/rejeitadas.",
      preCondicoes: "Supervisor autenticado.",
      fluxoPrincipal:
        "1. Acessar 'Histórico' → 2. Filtrar por período/status → 3. Visualizar detalhes de cada decisão.",
      posCondicoes: "Supervisor com visão completa das decisões tomadas.",
    },
  ],
  externo: [
    {
      id: "UC-EXT-01",
      nome: "Acessar Link de Compartilhamento",
      ator: "Usuário Externo",
      objetivo: "Acessar a página de download através do link recebido.",
      preCondicoes: "Link válido recebido por e-mail; dentro do prazo de validade.",
      fluxoPrincipal:
        "1. Clicar no link recebido → 2. Sistema valida token → 3. Página de autenticação exibida.",
      posCondicoes: "Usuário direcionado para autenticação OTP.",
    },
    {
      id: "UC-EXT-02",
      nome: "Realizar Autenticação OTP",
      ator: "Usuário Externo",
      objetivo: "Validar identidade através de código enviado por e-mail.",
      preCondicoes: "Link acessado; e-mail cadastrado válido.",
      fluxoPrincipal:
        "1. Solicitar código OTP → 2. Receber código por e-mail → 3. Inserir código na tela → 4. Sistema valida.",
      posCondicoes: "Usuário autenticado; acesso aos arquivos liberado.",
    },
    {
      id: "UC-EXT-03",
      nome: "Visualizar Arquivos Disponíveis",
      ator: "Usuário Externo",
      objetivo: "Consultar a lista de arquivos compartilhados.",
      preCondicoes: "Autenticação OTP realizada com sucesso.",
      fluxoPrincipal:
        "1. Sistema exibe lista de arquivos → 2. Usuário visualiza nome, tamanho e tipo → 3. Seleciona arquivo desejado.",
      posCondicoes: "Arquivo selecionado pronto para download.",
    },
    {
      id: "UC-EXT-04",
      nome: "Realizar Download de Arquivo",
      ator: "Usuário Externo",
      objetivo: "Baixar o arquivo compartilhado para dispositivo local.",
      preCondicoes: "Arquivo selecionado; sessão autenticada válida.",
      fluxoPrincipal:
        "1. Clicar em 'Download' → 2. Sistema gera link temporário → 3. Download iniciado → 4. Acesso registrado em auditoria.",
      posCondicoes: "Arquivo baixado; evento registrado no log.",
    },
  ],
  admin: [
    {
      id: "UC-ADM-01",
      nome: "Consultar Logs de Auditoria",
      ator: "Administrador",
      objetivo: "Verificar registros de atividades do sistema.",
      preCondicoes: "Administrador autenticado.",
      fluxoPrincipal:
        "1. Acessar 'Auditoria' → 2. Definir filtros (período, usuário, ação) → 3. Executar consulta → 4. Visualizar resultados.",
      posCondicoes: "Logs exibidos conforme critérios selecionados.",
    },
    {
      id: "UC-ADM-02",
      nome: "Gerar Relatório de Compartilhamentos",
      ator: "Administrador",
      objetivo: "Produzir relatório consolidado de compartilhamentos realizados.",
      preCondicoes: "Administrador autenticado.",
      fluxoPrincipal:
        "1. Acessar 'Relatórios' → 2. Selecionar tipo 'Compartilhamentos' → 3. Definir período → 4. Gerar e exportar (PDF/Excel).",
      posCondicoes: "Relatório gerado e disponível para download.",
    },
    {
      id: "UC-ADM-03",
      nome: "Analisar Acessos Externos",
      ator: "Administrador",
      objetivo: "Monitorar padrões de acesso de usuários externos aos arquivos.",
      preCondicoes: "Administrador autenticado; dados de acesso disponíveis.",
      fluxoPrincipal:
        "1. Acessar 'Dashboard de Acessos' → 2. Visualizar métricas (total, por período) → 3. Identificar acessos por destinatário → 4. Exportar dados.",
      posCondicoes: "Visão analítica dos acessos externos obtida.",
    },
    {
      id: "UC-ADM-04",
      nome: "Identificar Inconsistências",
      ator: "Administrador",
      objetivo: "Detectar e investigar comportamentos anômalos ou falhas no sistema.",
      preCondicoes: "Administrador autenticado.",
      fluxoPrincipal:
        "1. Acessar 'Monitoramento' → 2. Revisar alertas de inconsistências → 3. Analisar detalhes do evento → 4. Registrar observações.",
      posCondicoes: "Inconsistência documentada para tratamento.",
    },
  ],
};

// FAQ - Perguntas Frequentes
const faq = [
  {
    pergunta: "1. O que é o SCAC?",
    resposta:
      "O SCAC (Sistema de Compartilhamento de Arquivos Confidenciais) é uma plataforma segura desenvolvida para permitir o compartilhamento controlado de documentos confidenciais com usuários externos autorizados, garantindo rastreabilidade, auditoria e conformidade com as políticas de segurança da Petrobras.",
  },
  {
    pergunta: "2. Quem pode utilizar o sistema?",
    resposta:
      "O sistema possui quatro perfis de usuário: Usuário Interno (funcionários que iniciam compartilhamentos), Supervisor (responsável por aprovar solicitações), Usuário Externo (destinatário que recebe os arquivos) e Administrador (responsável por auditoria e monitoramento).",
  },
  {
    pergunta: "3. Como funciona a autenticação para usuários internos?",
    resposta:
      "Usuários internos (funcionários Petrobras) realizam autenticação através do Entra ID (Microsoft), utilizando suas credenciais corporativas. O sistema valida automaticamente as permissões baseadas nos grupos do diretório corporativo.",
  },
  {
    pergunta: "4. Como o usuário externo acessa os arquivos?",
    resposta:
      "O usuário externo recebe um link seguro por e-mail. Ao clicar, é direcionado para uma página de autenticação onde deve informar um código OTP (One-Time Password) enviado para seu e-mail cadastrado. Após validação, os arquivos ficam disponíveis para download.",
  },
  {
    pergunta: "5. Por quanto tempo o link de compartilhamento fica válido?",
    resposta:
      "O período de validade é definido pelo usuário interno no momento da criação da solicitação. Após expirar, o link torna-se inválido e o usuário externo não conseguirá mais acessar os arquivos.",
  },
  {
    pergunta: "6. O Supervisor precisa aprovar todos os compartilhamentos?",
    resposta:
      "Sim, todas as solicitações criadas por usuários internos passam por aprovação do Supervisor. Porém, quando o próprio Supervisor realiza um compartilhamento direto, não é necessária aprovação adicional.",
  },
  {
    pergunta: "7. O sistema registra todas as atividades?",
    resposta:
      "Sim. O SCAC possui recursos completos de auditoria e rastreabilidade. Todas as ações são registradas, incluindo: criação de solicitações, uploads, aprovações, rejeições, acessos externos e downloads. O Administrador pode consultar esses logs a qualquer momento.",
  },
  {
    pergunta: "8. Quais relatórios estão disponíveis?",
    resposta:
      "O sistema oferece relatórios de compartilhamentos realizados, acessos externos, histórico de aprovações e análise de inconsistências. Os relatórios podem ser exportados em formato PDF ou Excel.",
  },
  {
    pergunta: "9. O que acontece se minha solicitação for rejeitada?",
    resposta:
      "Quando o Supervisor rejeita uma solicitação, o usuário interno que a criou recebe uma notificação com a justificativa da rejeição. O usuário pode então criar uma nova solicitação corrigindo os pontos indicados.",
  },
  {
    pergunta: "10. Qual infraestrutura é utilizada pelo sistema?",
    resposta:
      "O SCAC utiliza infraestrutura em nuvem AWS com arquitetura containerizada por Amazon ECS, garantindo alta disponibilidade, escalabilidade e segurança dos dados.",
  },
];

// Criar o documento
const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
          },
        },
      },
      children: [
        // ==================== CABEÇALHO ====================
        new Paragraph({
          children: [
            new TextRun({
              text: "PETROBRAS",
              bold: true,
              color: PETROBRAS_GREEN,
              size: 36,
              font: "Calibri",
            }),
          ],
          spacing: { after: 300 },
        }),

        // Título principal
        new Paragraph({
          children: [
            new TextRun({
              text: "SCAC - Solução de Compartilhamento de Arquivos Confidenciais",
              bold: true,
              color: PETROBRAS_DARK,
              size: 36,
              font: "Calibri",
            }),
          ],
          spacing: { after: 300 },
        }),

        // Metadados do projeto
        createMetadataRow("Código:", "12022"),
        createMetadataRow("Sigla:", "SCAC / SI-CSA"),
        createMetadataRow("Líder Técnico:", "Isaac Henriques Francisco Pereira"),
        createMetadataRow("Área Responsável:", "TIC/ARQTIC/ARQNUV"),
        createMetadataRow("PO / Cliente:", "Wagner Gaspar Brazil"),
        createMetadataRow("Área Cliente:", "SI/SDAA/SEGDA"),
        createMetadataRow("Tipo Infraestrutura:", "Cloud AWS utilizando arquitetura containerizada por Amazon ECS"),

        new Paragraph({ text: "", spacing: { after: 400 } }),

        // ==================== DESCRIÇÃO DO SISTEMA ====================
        new Paragraph({
          children: [
            new TextRun({
              text: "1. Descrição do Sistema",
              bold: true,
              color: PETROBRAS_DARK,
              size: 28,
              font: "Calibri",
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "O SCAC (Sistema de Compartilhamento de Arquivos Confidenciais) é uma plataforma segura para compartilhamento de arquivos confidenciais com usuários externos autorizados. A solução contempla autenticação corporativa, autorização baseada em grupos, upload de arquivos, compartilhamento seguro, fluxo de aprovação gerencial, autenticação externa via OTP, auditoria, rastreabilidade e geração de relatórios.",
              color: "333333",
              size: 22,
              font: "Calibri",
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Limites do escopo: ",
              bold: true,
              color: "333333",
              size: 22,
              font: "Calibri",
            }),
            new TextRun({
              text: "O sistema não contempla gerenciamento administrativo de usuários, gerenciamento de grupos do Entra ID, gerenciamento direto de políticas Purview e administração da infraestrutura AWS.",
              color: "333333",
              size: 22,
              font: "Calibri",
            }),
          ],
          spacing: { after: 400 },
        }),

        // ==================== CASOS DE USO ====================
        new Paragraph({
          children: [
            new TextRun({
              text: "2. Casos de Uso",
              bold: true,
              color: PETROBRAS_DARK,
              size: 28,
              font: "Calibri",
            }),
          ],
          spacing: { before: 200, after: 300 },
        }),

        // 2.1 Usuário Interno
        new Paragraph({
          children: [
            new TextRun({
              text: "2.1 Usuário Interno",
              bold: true,
              color: PETROBRAS_DARK,
              size: 26,
              font: "Calibri",
            }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Objetivo: ",
              bold: true,
              size: 22,
              font: "Calibri",
            }),
            new TextRun({
              text: "Iniciar processos de compartilhamento de arquivos.",
              size: 22,
              font: "Calibri",
            }),
          ],
          spacing: { after: 200 },
        }),
        ...useCases.interno.flatMap((uc) => [
          createUseCaseTable(uc),
          new Paragraph({ text: "", spacing: { after: 200 } }),
        ]),

        // 2.2 Supervisor
        new Paragraph({
          children: [
            new TextRun({
              text: "2.2 Supervisor",
              bold: true,
              color: PETROBRAS_DARK,
              size: 26,
              font: "Calibri",
            }),
          ],
          spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Objetivo: ",
              bold: true,
              size: 22,
              font: "Calibri",
            }),
            new TextRun({
              text: "Realizar governança do compartilhamento.",
              size: 22,
              font: "Calibri",
            }),
          ],
          spacing: { after: 200 },
        }),
        ...useCases.supervisor.flatMap((uc) => [
          createUseCaseTable(uc),
          new Paragraph({ text: "", spacing: { after: 200 } }),
        ]),

        // 2.3 Usuário Externo
        new Paragraph({
          children: [
            new TextRun({
              text: "2.3 Usuário Externo",
              bold: true,
              color: PETROBRAS_DARK,
              size: 26,
              font: "Calibri",
            }),
          ],
          spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Objetivo: ",
              bold: true,
              size: 22,
              font: "Calibri",
            }),
            new TextRun({
              text: "Acessar arquivos autorizados de forma segura.",
              size: 22,
              font: "Calibri",
            }),
          ],
          spacing: { after: 200 },
        }),
        ...useCases.externo.flatMap((uc) => [
          createUseCaseTable(uc),
          new Paragraph({ text: "", spacing: { after: 200 } }),
        ]),

        // 2.4 Administrador
        new Paragraph({
          children: [
            new TextRun({
              text: "2.4 Administrador",
              bold: true,
              color: PETROBRAS_DARK,
              size: 26,
              font: "Calibri",
            }),
          ],
          spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Objetivo: ",
              bold: true,
              size: 22,
              font: "Calibri",
            }),
            new TextRun({
              text: "Auditoria e monitoramento do sistema.",
              size: 22,
              font: "Calibri",
            }),
          ],
          spacing: { after: 200 },
        }),
        ...useCases.admin.flatMap((uc) => [
          createUseCaseTable(uc),
          new Paragraph({ text: "", spacing: { after: 200 } }),
        ]),

        // ==================== FAQ ====================
        new Paragraph({
          children: [new PageBreak()],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "3. Perguntas Frequentes (FAQ)",
              bold: true,
              color: PETROBRAS_DARK,
              size: 28,
              font: "Calibri",
            }),
          ],
          spacing: { before: 200, after: 300 },
        }),
        ...faq.flatMap((item) => createFAQItem(item.pergunta, item.resposta)),
      ],
    },
  ],
});

// Gerar o arquivo
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("public/SCAC-Casos-de-Uso.docx", buffer);
  console.log("Documento gerado com sucesso: public/SCAC-Casos-de-Uso.docx");
});
