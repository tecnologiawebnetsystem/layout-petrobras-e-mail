"""
Gera o arquivo SCAC_Arquitetura.docx a partir do conteúdo do documento de arquitetura.
Execute: source /tmp/docx_env/bin/activate && python3 gerar_docx.py
"""

from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

OUTPUT = "SCAC_Arquitetura_v3.docx"

# ─── Cores ────────────────────────────────────────────────────────────────────
PETROBRAS_BLUE   = RGBColor(0x00, 0x39, 0x5E)   # azul Petrobras escuro
PETROBRAS_GREEN  = RGBColor(0x00, 0x7A, 0x3D)   # verde Petrobras
HEADER_BG        = RGBColor(0x00, 0x39, 0x5E)   # cabeçalho de tabela
ROW_ALT          = RGBColor(0xF0, 0xF4, 0xF8)   # linha alternada
WHITE            = RGBColor(0xFF, 0xFF, 0xFF)
DARK             = RGBColor(0x1A, 0x1A, 0x2E)
GRAY             = RGBColor(0x6B, 0x7A, 0x90)
CODE_BG          = RGBColor(0xF5, 0xF5, 0xF5)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def set_cell_bg(cell, rgb: RGBColor):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    # RGBColor stores as 3-tuple internally; convert via hex string
    hex_color = '%02X%02X%02X' % (rgb[0], rgb[1], rgb[2])
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)


def set_cell_border(cell, **kwargs):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for side in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        border = OxmlElement(f'w:{side}')
        border.set(qn('w:val'), kwargs.get('val', 'single'))
        border.set(qn('w:sz'), kwargs.get('sz', '4'))
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), kwargs.get('color', 'D0D7E0'))
        tcBorders.append(border)
    tcPr.append(tcBorders)


def para_border_bottom(para, color='D0D7E0'):
    pPr = para._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bot = OxmlElement('w:bottom')
    bot.set(qn('w:val'), 'single')
    bot.set(qn('w:sz'), '4')
    bot.set(qn('w:space'), '1')
    bot.set(qn('w:color'), color)
    pBdr.append(bot)
    pPr.append(pBdr)


def heading_style(doc: Document, level: int, text: str):
    style_map = {1: 'Heading 1', 2: 'Heading 2', 3: 'Heading 3', 4: 'Heading 4'}
    p = doc.add_paragraph(style=style_map.get(level, 'Heading 2'))
    run = p.add_run(text)
    if level == 1:
        run.font.size   = Pt(20)
        run.font.bold   = True
        run.font.color.rgb = PETROBRAS_BLUE
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after  = Pt(6)
        para_border_bottom(p, '003F5E')
    elif level == 2:
        run.font.size   = Pt(14)
        run.font.bold   = True
        run.font.color.rgb = PETROBRAS_BLUE
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after  = Pt(4)
    elif level == 3:
        run.font.size   = Pt(11)
        run.font.bold   = True
        run.font.color.rgb = PETROBRAS_GREEN
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after  = Pt(2)
    else:
        run.font.size   = Pt(10)
        run.font.bold   = True
        run.font.color.rgb = DARK
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after  = Pt(2)
    return p


def body_text(doc: Document, text: str, bold=False, italic=False, color=None):
    p = doc.add_paragraph(style='Normal')
    run = p.add_run(text)
    run.font.size   = Pt(10)
    run.font.bold   = bold
    run.font.italic = italic
    if color:
        run.font.color.rgb = color
    p.paragraph_format.space_after  = Pt(4)
    p.paragraph_format.space_before = Pt(0)
    return p


def bullet(doc: Document, text: str):
    p = doc.add_paragraph(style='List Bullet')
    run = p.add_run(text)
    run.font.size = Pt(10)
    p.paragraph_format.left_indent = Cm(0.8)
    p.paragraph_format.space_after = Pt(2)
    return p


def code_block(doc: Document, text: str):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.name = 'Courier New'
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(0x1A, 0x1A, 0x2E)
    p.paragraph_format.left_indent  = Cm(0.6)
    p.paragraph_format.right_indent = Cm(0.6)
    p.paragraph_format.space_after  = Pt(6)
    p.paragraph_format.space_before = Pt(6)
    # fundo cinza
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), 'F3F4F6')
    pPr.append(shd)
    return p


def divider(doc: Document):
    p = doc.add_paragraph()
    p.paragraph_format.space_after  = Pt(4)
    p.paragraph_format.space_before = Pt(4)
    para_border_bottom(p, 'B0BEC5')
    return p


def add_table(doc: Document, headers: list, rows: list, col_widths=None):
    n_cols = len(headers)
    table = doc.add_table(rows=1, cols=n_cols)
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.LEFT

    # Cabeçalho
    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        hdr_cells[i].vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        set_cell_bg(hdr_cells[i], HEADER_BG)
        set_cell_border(hdr_cells[i], val='single', sz='4', color='FFFFFF')
        for run in hdr_cells[i].paragraphs[0].runs:
            run.font.bold       = True
            run.font.color.rgb  = WHITE
            run.font.size       = Pt(9)

    # Linhas de dados
    for idx, row_data in enumerate(rows):
        row_cells = table.add_row().cells
        bg = ROW_ALT if idx % 2 == 0 else WHITE
        for i, cell_text in enumerate(row_data):
            row_cells[i].text = str(cell_text)
            row_cells[i].vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_bg(row_cells[i], bg)
            set_cell_border(row_cells[i], val='single', sz='4', color='D0D7E0')
            for run in row_cells[i].paragraphs[0].runs:
                run.font.size = Pt(9)

    # Larguras das colunas
    if col_widths:
        for row in table.rows:
            for i, cell in enumerate(row.cells):
                if i < len(col_widths):
                    cell.width = Cm(col_widths[i])

    doc.add_paragraph()  # espaço após tabela
    return table


def add_info_box(doc: Document, label: str, text: str):
    """Bloco de informação destacado (tipo nota)."""
    p = doc.add_paragraph()
    r1 = p.add_run(f"{label}  ")
    r1.font.bold = True
    r1.font.size = Pt(9)
    r1.font.color.rgb = PETROBRAS_BLUE
    r2 = p.add_run(text)
    r2.font.size = Pt(9)
    r2.font.italic = True
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), 'E8F0FE')
    pPr.append(shd)
    p.paragraph_format.left_indent  = Cm(0.4)
    p.paragraph_format.right_indent = Cm(0.4)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after  = Pt(6)


# ─── Construção do documento ──────────────────────────────────────────────────

doc = Document()

# Margens
sec = doc.sections[0]
sec.top_margin    = Cm(2.5)
sec.bottom_margin = Cm(2.5)
sec.left_margin   = Cm(3.0)
sec.right_margin  = Cm(2.5)

# Fonte padrão
doc.styles['Normal'].font.name = 'Calibri'
doc.styles['Normal'].font.size = Pt(10)

# ─── Capa ─────────────────────────────────────────────────────────────────────
capa = doc.add_paragraph()
capa.alignment = WD_ALIGN_PARAGRAPH.CENTER
capa.paragraph_format.space_before = Pt(72)
r = capa.add_run("PETROBRAS")
r.font.bold = True
r.font.size = Pt(28)
r.font.color.rgb = PETROBRAS_BLUE

doc.add_paragraph()

p2 = doc.add_paragraph()
p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
r2 = p2.add_run("SCAC — A12022")
r2.font.size = Pt(20)
r2.font.bold = True
r2.font.color.rgb = PETROBRAS_GREEN

p3 = doc.add_paragraph()
p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
r3 = p3.add_run("Solução de Compartilhamento de Arquivos Confidenciais")
r3.font.size = Pt(14)
r3.font.color.rgb = DARK

doc.add_paragraph()

p4 = doc.add_paragraph()
p4.alignment = WD_ALIGN_PARAGRAPH.CENTER
r4 = p4.add_run("Documento de Arquitetura de Sistema")
r4.font.size = Pt(12)
r4.font.italic = True
r4.font.color.rgb = GRAY

doc.add_paragraph()
doc.add_paragraph()

meta_table = doc.add_table(rows=5, cols=2)
meta_table.style = 'Table Grid'
meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_data = [
    ("Classificação", "Interno"),
    ("Versão", "3.0"),
    ("Data de Revisão", "06/08/2026"),
    ("Responsável", "Arquitetura & Engenharia SCAC"),
    ("Referência", "Código-fonte A12022_FrontEnd + A12022_BackEnd"),
]
for i, (k, v) in enumerate(meta_data):
    meta_table.rows[i].cells[0].text = k
    meta_table.rows[i].cells[1].text = v
    set_cell_bg(meta_table.rows[i].cells[0], PETROBRAS_BLUE)
    for run in meta_table.rows[i].cells[0].paragraphs[0].runs:
        run.font.bold = True
        run.font.color.rgb = WHITE
        run.font.size = Pt(9)
    for run in meta_table.rows[i].cells[1].paragraphs[0].runs:
        run.font.size = Pt(9)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 1 — OBJETIVO E ESCOPO
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "1. Objetivo e Escopo")

body_text(doc,
    "O SCAC (A12022 — Solução de Compartilhamento de Arquivos Confidenciais) é um "
    "sistema corporativo da Petrobras projetado para permitir que colaboradores "
    "internos transfiram arquivos classificados — inclusive documentos protegidos "
    "por Microsoft Purview / MIP — a destinatários externos (parceiros, "
    "fornecedores, órgãos reguladores) de forma controlada, supervisionada e auditável."
)

heading_style(doc, 2, "1.1. Problemas Resolvidos")
add_table(doc,
    ["Problema", "Solução SCAC"],
    [
        ("Envio não rastreável de arquivos via e-mail convencional",           "Compartilhamento com rastreamento completo em banco de dados"),
        ("Ausência de aprovação hierárquica para arquivos sensíveis",          "Workflow de aprovação obrigatória pelo gestor imediato (supervisor)"),
        ("Acesso irrestrito a arquivos confidenciais MIP-rotulados",           "Integração com Microsoft Purview para re-rotulagem controlada"),
        ("Falta de expiração e revogação de acesso",                           "Links com TTL configurável por compartilhamento e revogação automática"),
        ("Ausência de trilha de auditoria",                                    "Tabela audit com registro imutável de todos os eventos do sistema"),
    ],
    col_widths=[8.5, 9.5]
)

heading_style(doc, 2, "1.2. Perfis de Usuário")
add_table(doc,
    ["Perfil", "Descrição", "Fonte de Identidade"],
    [
        ("Usuário Interno",   "Colaborador Petrobras. Pode fazer upload e solicitar compartilhamentos.",       "CAv4 (OIDC) ou Entra ID (MSAL)"),
        ("Supervisor",        "Colaborador interno com permissão de aprovação sobre os compartilhamentos de seus subordinados (vínculo via manager_id).", "CAv4 / Entra ID"),
        ("Administrador",     "Super administrador global. Visibilidade total, sem restrições hierárquicas. Pode promover outros usuários.", "CAv4 / Entra ID"),
        ("Usuário Externo",   "Destinatário de fora da Petrobras. Acessa via portal público com autenticação OTP (código de 6 dígitos por e-mail). Não possui credenciais AD.", "Auth Local (OTP)"),
    ],
    col_widths=[4.0, 11.5, 4.5]
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 2 — VISÃO GERAL DA ARQUITETURA
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "2. Visão Geral da Arquitetura")

body_text(doc,
    "A solução SCAC adota arquitetura de dois serviços independentes, cada um "
    "conteinerizado e executado no Amazon ECS (Elastic Container Service) com suporte "
    "a multi-AZ. A comunicação entre o Front End e o Back End ocorre exclusivamente "
    "via API REST versionada (/api/v1/), com autenticação por JWT interno emitido "
    "pelo Back End após validação das credenciais corporativas."
)

heading_style(doc, 2, "2.1. Diagrama de Componentes de Alto Nível")
code_block(doc,
"""USUÁRIO INTERNO ─────┐                     USUÁRIO EXTERNO ─────┐
(Colaborador Petrobras)│                     (Parceiro/Fornecedor) │
                       │ HTTPS                                     │ HTTPS
                       ▼                                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│        A12022_FrontEnd  (Next.js 15 / App Router)                   │
│  /upload  /supervisor  /download  /admin  /auditoria  /suporte      │
│  ECS Fargate — registry.petrobras.com.br — Porta 3000               │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ REST JSON / JWT Bearer
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│        A12022_BackEnd  (FastAPI / Python 3.12)                       │
│  /auth (CAv4 + Entra + Local)  /files  /shares  /supervisor  /admin │
│  ECS Fargate — registry.petrobras.com.br — Porta 8080               │
└───────────────┬────────────────────────────────┬─────────────────────┘
                │ psycopg3                        │ boto3
                ▼                                ▼
   ┌─────────────────────┐           ┌──────────────────────┐
   │  Amazon Aurora      │           │  Amazon S3           │
   │  PostgreSQL (Multi-AZ)          │  (Arquivos Restritos)│
   └─────────────────────┘           └──────────────────────┘
                │
                │ httpx
   ┌────────────┴──────────────────────────────────────────┐
   │  Integrações Microsoft                                 │
   │  ┌──────────────────┐  ┌─────────────────────────┐   │
   │  │  CAv4 / OIDC     │  │  Microsoft Graph API    │   │
   │  │  (IdP Petrobras) │  │  (perfil / foto / gestor│   │
   │  └──────────────────┘  ├─────────────────────────┤   │
   │                        │  Microsoft Purview / MIP│   │
   │                        └─────────────────────────┘   │
   └───────────────────────────────────────────────────────┘
""")

heading_style(doc, 2, "2.2. Padrão de Comunicação")
add_table(doc,
    ["Origem", "Destino", "Protocolo", "Autenticação"],
    [
        ("Browser (SPA)",          "Next.js Front End (BFF)",       "HTTPS / REST JSON",   "Cookie de sessão"),
        ("Next.js (BFF)",          "FastAPI Back End",               "HTTPS / REST JSON",   "JWT Bearer (interno HS256)"),
        ("FastAPI Back End",       "Amazon Aurora PostgreSQL",       "TCP / psycopg3",      "IAM RDS Auth / senha"),
        ("FastAPI Back End",       "Amazon S3",                      "HTTPS / AWS SDK",     "IAM Role ECS Task"),
        ("FastAPI Back End",       "CAv4 (OIDC)",                    "HTTPS / REST",        "client_id + PKCE"),
        ("FastAPI Back End",       "Microsoft Graph API",            "HTTPS / REST",        "OAuth 2.0 Client Credentials"),
        ("FastAPI Back End",       "Microsoft Purview MIP SDK",      "HTTPS / REST",        "OAuth 2.0 (device_code / popup)"),
        ("FastAPI Back End",       "SMTP Petrobras",                 "SMTP / STARTTLS",     "Sem autenticação"),
    ],
    col_widths=[4.0, 5.0, 4.0, 5.0]
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 3 — STACK TECNOLÓGICA
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "3. Stack Tecnológica")

heading_style(doc, 2, "3.1. Front End — A12022_FrontEnd")
add_table(doc,
    ["Camada", "Tecnologia", "Versão", "Observação"],
    [
        ("Framework",        "Next.js (App Router)",            "15.x",     "force-dynamic no layout raiz para leitura de env ECS em runtime"),
        ("Linguagem",        "TypeScript",                      "5.x",      "Tipagem estrita (strict mode)"),
        ("Runtime Vars",     "window.__ENV__",                  "—",        "Injetado pelo Server Component no <head> via JSON.stringify"),
        ("UI Components",    "shadcn/ui + Radix UI",            "—",        "Componentes acessíveis (Dialog, Toast, Sheet, etc.)"),
        ("Estilização",      "Tailwind CSS",                    "4.x",      "Tokens via @theme no globals.css"),
        ("Formulários",      "react-hook-form + zod",           "—",        "Validação client-side com schemas tipados"),
        ("Estado Global",    "Zustand + Immer",                 "—",        "Auth store, UI state"),
        ("Fetching",         "SWR",                             "—",        "Cache e revalidação de dados"),
        ("Auth (Entra)",     "@azure/msal-browser",             "—",        "MSAL SPA — Authorization Code + PKCE sem client_secret"),
        ("Fontes",           "Inter (localFont)",               "—",        "Servida do repositório, sem CDN externo"),
        ("PDF",              "jsPDF",                           "—",        "Geração de comprovantes de compartilhamento"),
        ("ZIP",              "JSZip",                           "—",        "Empacotamento de múltiplos arquivos para download"),
        ("Gráficos",         "Recharts",                        "—",        "Dashboard administrativo"),
        ("Testes",           "Jest",                            "—",        "Testes unitários e de integração de componentes"),
        ("Container",        "Node.js 20 Alpine",               "—",        "Dockerfile multi-stage"),
    ],
    col_widths=[3.5, 4.5, 2.0, 8.0]
)

heading_style(doc, 2, "3.2. Back End — A12022_BackEnd")
add_table(doc,
    ["Camada", "Tecnologia", "Versão", "Observação"],
    [
        ("Framework",        "FastAPI",                          "0.136.x",  "Async, OpenAPI automático em /docs"),
        ("Linguagem",        "Python",                          "3.12",     "Slim container da registry Petrobras"),
        ("ORM / Query",      "SQLModel + psycopg3",             "—",        "Tipo-safe sobre SQLAlchemy 2.x"),
        ("Migrations",       "Alembic",                         "1.18.x",   "Executado automaticamente no entrypoint.sh no boot"),
        ("Auth JWT",         "PyJWT",                           "—",        "HS256 (interno) + RS256 via JWKS (Entra/CAv4)"),
        ("Hashing",          "bcrypt",                          "5.0",      "Senhas de externos com salt único"),
        ("HTTP Client",      "httpx",                           "0.28.x",   "Graph API, CAv4, MIP SDK"),
        ("AWS SDK",          "boto3 / botocore",                "1.43.x",   "S3, Parameter Store, Secrets Manager"),
        ("Crypto / PKCE",    "secrets + hashlib (stdlib)",      "—",        "PKCE SHA-256; tokens hashados com SHA-256 antes de persistir"),
        ("Logging",          "structlog",                       "—",        "JSON estruturado em produção"),
        ("Validação Config", "pydantic-settings",               "—",        "Settings lê env, Parameter Store e Secrets Manager"),
        ("Servidor ASGI",    "Uvicorn",                         "—",        "Multi-worker em produção"),
        ("Testes",           "pytest",                          "—",        "Unitários e de integração"),
    ],
    col_widths=[3.5, 4.5, 2.0, 8.0]
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 4 — CAMADAS E COMPONENTES
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "4. Camadas e Componentes")

heading_style(doc, 2, "4.1. Camada de Apresentação (Front End)")

body_text(doc, "Responsável por toda a interface com o usuário: navegação, formulários, validações client-side, renderização de estado e comunicação com o Back End via REST.")

heading_style(doc, 3, "4.1.1. Páginas e Rotas (Next.js App Router)")
add_table(doc,
    ["Rota", "Público", "Perfil", "Descrição"],
    [
        ("/",                            "Não",  "Interno",    "Página inicial — saudação contextual, atalhos"),
        ("/upload",                      "Não",  "Interno",    "Upload de arquivos e criação de compartilhamento"),
        ("/compartilhamentos",           "Não",  "Interno",    "Histórico de compartilhamentos do usuário"),
        ("/historico",                   "Não",  "Interno",    "Histórico detalhado com filtros"),
        ("/supervisor",                  "Não",  "Supervisor", "Fila de aprovação de compartilhamentos pendentes"),
        ("/supervisor/detalhes/[id]",    "Não",  "Supervisor", "Detalhes do compartilhamento para aprovação/rejeição"),
        ("/admin",                       "Não",  "Admin",      "Dashboard administrativo global"),
        ("/auditoria",                   "Não",  "Admin",      "Logs de auditoria completos"),
        ("/configuracoes",               "Não",  "Admin",      "Configurações do sistema"),
        ("/download",                    "Sim",  "Externo",    "Portal de download para usuários externos (OTP)"),
        ("/external-verify",             "Sim",  "Externo",    "Verificação de e-mail para acesso externo"),
        ("/suporte",                     "Não",  "Suporte",    "Cadastro e gestão de usuários externos"),
        ("/logs",                        "Não",  "Admin",      "Visualização de logs em tempo real"),
        ("/auth/cav4-callback",          "Sim",  "—",          "Callback OIDC CAv4"),
        ("/auth/entra-callback",         "Sim",  "—",          "Callback MSAL Entra ID"),
    ],
    col_widths=[5.5, 2.0, 3.0, 7.5]
)

heading_style(doc, 3, "4.1.2. Variáveis de Ambiente Runtime (window.__ENV__)")
add_table(doc,
    ["Variável", "Origem SSM", "Descrição"],
    [
        ("NEXT_PUBLIC_AUTH_MODE",          "SSM", "cav4 (padrão) ou entra"),
        ("NEXT_PUBLIC_CAV4_DISCOVERY_URL", "SSM", "URL de discovery OIDC do CAv4 (IdP Petrobras)"),
        ("NEXT_PUBLIC_APP_URL",            "SSM", "URL base da aplicação"),
        ("NEXT_PUBLIC_MIP_CLIENT_ID",      "SSM", "Client ID do app AIP/MIP registrado no Entra"),
        ("NEXT_PUBLIC_MIP_TENANT_ID",      "SSM", "Tenant ID do Entra para MIP"),
        ("NEXT_PUBLIC_MIP_AUTH_MODE",      "SSM", "device_code (padrão) ou popup"),
    ],
    col_widths=[6.0, 2.5, 9.5]
)

add_info_box(doc, "NOTA:", "O layout utiliza process.env['VAR'] (notação de colchetes) em vez de process.env.VAR, "
    "garantindo que o Webpack não substitua os valores em build-time — "
    "os valores reais do ECS Task Definition são lidos em runtime.")

heading_style(doc, 2, "4.2. Camada de Lógica de Negócio (Back End)")

body_text(doc, "Responsável por regras de negócio, autenticação/autorização, validações, orquestração de operações de arquivos, integrações externas e exposição das APIs RESTful versionadas.")

heading_style(doc, 3, "4.2.1. Estrutura de Módulos")
code_block(doc,
"""backend/app/
├── api/v1/
│   ├── routes_auth.py           # Login local (externos)
│   ├── routes_cav4_auth.py      # Login CAv4 OIDC (internos Petrobras)
│   ├── routes_entra_auth.py     # Login Entra ID MSAL (modo legado)
│   ├── routes_files.py          # Gestão de arquivos e uploads
│   ├── routes_shares.py         # Compartilhamentos (ciclo de vida completo)
│   ├── routes_supervisor.py     # Aprovação / rejeição / extensão
│   ├── routes_admin.py          # Dashboard e gestão administrativa
│   ├── routes_audit.py          # Consulta de logs de auditoria
│   ├── routes_download.py       # Portal de download externo (OTP)
│   ├── routes_external.py       # Listagem de arquivos para externos
│   ├── routes_emails.py         # Rastreamento de e-mails
│   ├── routes_areas.py          # Gestão de áreas/pastas S3
│   ├── routes_notifications.py  # Notificações in-app
│   ├── routes_mip_auth.py       # Device code flow MIP SDK
│   └── routes_diagnostico.py    # Diagnóstico de parâmetros
├── core/
│   ├── config.py                # Settings (pydantic-settings); monta DATABASE_URL
│   └── aws_utils.py             # Presigned URLs S3
├── db/session.py                # Engine SQLAlchemy + get_session
├── models/                      # SQLModel ORM (user, share, file, audit…)
├── schemas/                     # Pydantic schemas de request/response
├── services/
│   ├── auth_service.py          # Helpers de sincronização de usuários
│   ├── cav4_auth_service.py     # PKCE, OIDC discovery, roles CAv4
│   ├── cav4_client.py           # Client HTTP para APIs de autorização CAv4
│   ├── graph_service.py         # Microsoft Graph (perfil, gestor, foto)
│   ├── share_service.py         # Regras de criação de compartilhamento
│   ├── token_service.py         # OTP e access tokens para externos
│   ├── email_service.py         # Envio de e-mails (SMTP Petrobras / SES)
│   ├── audit_service.py         # log_event() — persistência na tabela audit
│   ├── authorization_service.py # Resolução de permissões por perfil
│   └── task_service.py          # Jobs agendados (cleanup, expiração)
└── utils/
    ├── authz.py                 # Dependências FastAPI: get_current_user, require_permission
    └── session_jwt.py           # create_session_jwt / decode_app_jwt""")

heading_style(doc, 2, "4.3. Camada de Persistência")
body_text(doc, "Banco de dados: Amazon Aurora PostgreSQL (Multi-AZ), cluster gerenciado pela AWS.")
bullet(doc, "Driver: psycopg3 (psycopg — versão nativa, assíncrona quando necessário)")
bullet(doc, "Migrations gerenciadas pelo Alembic, executadas automaticamente no entrypoint.sh durante o boot do container")
bullet(doc, "Schema: public (configurável via DB_SCHEMA)")
bullet(doc, "Connection pooling: nativo do Aurora + SQLAlchemy pool interno")

heading_style(doc, 2, "4.4. Camada de Armazenamento de Arquivos")
body_text(doc, "Todos os arquivos são armazenados no Amazon S3. O banco de dados PostgreSQL guarda apenas os metadados. A chave S3 segue a convenção:")
code_block(doc, "{area_prefix}/{share_id}_{uuid}_{safe_filename}")
bullet(doc, "Uploads via s3.put_object() no Back End ou presigned PUT URL para grandes arquivos")
bullet(doc, "Downloads servidos via StreamingResponse do Back End ou presigned GET URL (TTL padrão: 300s)")
bullet(doc, "Na rejeição ou cancelamento: objetos S3 são deletados automaticamente")

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 5 — AUTENTICAÇÃO E AUTORIZAÇÃO
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "5. Autenticação e Autorização")

body_text(doc,
    "O SCAC suporta três modos de autenticação, selecionados pela variável AUTH_MODE "
    "no Back End. Apenas um modo fica ativo por ambiente. Os modos CAv4 e Entra ID "
    "são exclusivos para usuários internos; a autenticação Local é utilizada para "
    "usuários externos em qualquer ambiente."
)

heading_style(doc, 2, "5.1. Modo CAv4 — Identity Provider Corporativo Petrobras (Padrão)")

body_text(doc,
    "O CAv4 é o Identity Provider (IdP) corporativo da Petrobras, baseado em "
    "OIDC/OAuth 2.0. É o modo de autenticação padrão para todos os ambientes "
    "produtivos. O fluxo implementado é o Authorization Code + PKCE (RFC 7636), "
    "processado inteiramente no Back End (não há client_secret exposto no browser)."
)

heading_style(doc, 3, "5.1.1. Fluxo Authorization Code + PKCE (Server-Side Callback)")
code_block(doc,
"""[1]  Frontend     → GET /api/v1/auth/cav4/login
[2]  Backend        gera: state, nonce, code_verifier (PKCE)
                    armazena em _PENDING_AUTH (TTL: 10 minutos)
[3]  Redirect 302   → CAv4 Authorization Endpoint (com code_challenge SHA-256)
[4]  Usuário        autentica no CAv4 (SSO corporativo Petrobras)
[5a] CAv4           redireciona → GET /api/v1/auth/cav4/callback?code=...&state=...
 OU
[5b] Frontend       POST /api/v1/auth/cav4/token { code, state }  ← modo BFF
[6]  Backend        recupera code_verifier, troca code por tokens no endpoint CAv4
[7]  Backend        valida id_token (RS256, JWKS, nonce, exp, iss, aud)
[8]  Backend        extrai user_login (matrícula Petrobras) das claims
[9]  Backend        GET CAv4 → consulta roles corporativos do usuário
[10] Backend        resolve_access_from_cav4_roles() → { role, authorized, all_roles }
[11] Backend        Enriquecimento Microsoft Graph (by UPN/matrícula):
                    jobTitle, department, manager (email/nome/matrícula), photo
[12] Backend        sync_user_from_access() → cria/atualiza registro na tabela user
[13] Backend        issue_internal_tokens() → JWT HS256 (60min) + refresh token (SHA-256)
[14] Retorno        { access_token, refresh_token, user, roles, permissions, allowed_modules }""")

heading_style(doc, 3, "5.1.2. Mapeamento de Roles CAv4 para Perfis SCAC")
add_table(doc,
    ["Role CAv4 (configurável)", "Perfil SCAC", "is_admin", "is_supervisor"],
    [
        ("Roles em CAV4_ADMIN_ROLE_NAMES",       "Administrador",   "true",  "true"),
        ("Roles em CAV4_SUPERVISOR_ROLE_NAMES",  "Supervisor",      "false", "true"),
        ("Roles em CAV4_INTERNAL_ROLE_NAMES",    "Usuário Interno", "false", "false"),
    ],
    col_widths=[5.5, 4.5, 2.5, 3.5]
)

heading_style(doc, 3, "5.1.3. Endpoints CAv4 (Back End)")
add_table(doc,
    ["Método", "Endpoint", "Auth", "Descrição"],
    [
        ("GET",  "/v1/auth/cav4/login",         "—",                  "Inicia o fluxo OIDC (redirect para IdP)"),
        ("GET",  "/v1/auth/cav4/callback",       "—",                  "Callback server-side (code + state)"),
        ("POST", "/v1/auth/cav4/token",          "—",                  "Alternativa BFF (JSON: code + state)"),
        ("POST", "/v1/auth/cav4/refresh",        "X-Refresh-Token",    "Renova sessão com rotation de refresh token"),
        ("POST", "/v1/auth/cav4/logout",         "Bearer JWT",         "Revoga refresh tokens, encerra sessão"),
        ("GET",  "/v1/auth/cav4/session-check",  "Bearer JWT",         "Verifica validade do JWT interno"),
        ("GET",  "/v1/auth/cav4/graph-me",       "Bearer JWT",         "Diagnóstico de enriquecimento Microsoft Graph"),
    ],
    col_widths=[2.0, 5.5, 3.5, 7.0]
)

heading_style(doc, 3, "5.1.4. Parâmetros de Configuração CAv4 (Parameter Store)")
add_table(doc,
    ["Parâmetro", "Origem", "Descrição"],
    [
        ("CA_CLIENT_ID",              "Secrets Manager", "Client ID do app registrado no CAv4"),
        ("CA_CLIENT_SECRET",          "Secrets Manager", "Client Secret do app CAv4"),
        ("CA_REDIRECT_URI",           "Parameter Store", "URI de callback registrado no CAv4"),
        ("OIDC_DISCOVERY_URL",        "Parameter Store", "URL de discovery OIDC do IdP Petrobras"),
        ("CA_API_BASE_URL",           "Parameter Store", "Base URL das APIs de autorização CAv4"),
        ("CAV4_ADMIN_ROLE_NAMES",     "Parameter Store", "CSV/JSON de roles que concedem perfil admin"),
        ("CAV4_SUPERVISOR_ROLE_NAMES","Parameter Store", "CSV/JSON de roles que concedem perfil supervisor"),
        ("CAV4_INTERNAL_ROLE_NAMES",  "Parameter Store", "CSV/JSON de roles que concedem perfil interno"),
        ("CA_SSL_CERT_FILE",          "Parameter Store", "Caminho do certificado CA corporativo Petrobras"),
    ],
    col_widths=[5.5, 3.5, 9.0]
)

heading_style(doc, 2, "5.2. Modo Entra ID — Microsoft Azure Active Directory (Legado)")

body_text(doc,
    "Utilizado quando AUTH_MODE=entra. O frontend usa MSAL SPA (Authorization Code + PKCE "
    "sem client_secret). O backend apenas valida os tokens emitidos pela Microsoft via JWKS."
)

heading_style(doc, 3, "5.2.1. Fluxo MSAL SPA")
code_block(doc,
"""[1] Frontend:  msal.loginRedirect(loginRequest)
[2] Microsoft:  redireciona → /auth/entra-callback com authorization code
[3] MSAL:       troca code por tokens (sem client_secret, PKCE nativo no browser)
[4] Frontend:   POST /api/v1/auth/entra/token { id_token, access_token }
[5] Backend:    valida id_token via JWKS RS256 (exp, iss, aud)
                URL: https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys
[6] Backend:    verifica membership no grupo GN_CLOUD_AWS_SCAC_USERS
                (via claims ou Microsoft Graph API como fallback)
[7] Backend:    enriquece perfil via Microsoft Graph (/me, /me/manager, /me/photo/$value)
[8] Backend:    sync_user_from_group() → cria/atualiza usuário local
[9] Backend:    Emite JWT interno (480 min = 8h) + refresh token""")

heading_style(doc, 3, "5.2.2. Endpoints Entra ID (Back End)")
add_table(doc,
    ["Método", "Endpoint", "Auth", "Descrição"],
    [
        ("POST", "/v1/auth/entra/token",        "—",               "Valida tokens MSAL, emite JWT interno"),
        ("POST", "/v1/auth/entra/refresh",      "X-Refresh-Token", "Renova access token com rotation"),
        ("POST", "/v1/auth/entra/logout",       "Bearer JWT",      "Revoga tokens + retorna ms_logout_url"),
        ("GET",  "/v1/auth/entra/me",           "Bearer JWT",      "Dados do usuário autenticado"),
        ("GET",  "/v1/auth/entra/session-check","Bearer JWT",      "Verifica validade da sessão"),
        ("POST", "/v1/auth/entra/sync-group",   "Admin",           "(Admin) Sincroniza membros do grupo AD"),
    ],
    col_widths=[2.0, 5.5, 3.5, 7.0]
)

heading_style(doc, 2, "5.3. Modo Local — Autenticação por Credenciais (Externos / Dev)")

body_text(doc,
    "Utilizado para usuários externos em qualquer ambiente e como fallback de "
    "desenvolvimento local (AUTH_MODE=local). Credenciais armazenadas na tabela "
    "credential_local com hash bcrypt + salt único. Protegido contra brute-force: "
    "bloqueio após 5 tentativas falhas consecutivas."
)

add_table(doc,
    ["Método", "Endpoint", "Auth", "Descrição"],
    [
        ("POST", "/v1/auth/login",           "—",          "Login email + senha"),
        ("POST", "/v1/auth/logout",          "Bearer JWT", "Logout (revoga refresh tokens)"),
        ("POST", "/v1/auth/refresh",         "—",          "Renova access token"),
        ("POST", "/v1/auth/forgot-password", "—",          "Solicita reset de senha via e-mail"),
        ("POST", "/v1/auth/reset-password",  "—",          "Confirma reset com token único"),
    ],
    col_widths=[2.0, 5.0, 3.5, 7.5]
)

heading_style(doc, 2, "5.4. JWT Interno — Especificação")
add_table(doc,
    ["Campo", "Valor"],
    [
        ("Algoritmo",                "HS256 (HMAC-SHA-256)"),
        ("Issuer (iss)",             "secure-share"),
        ("Duração access token",     "60 min (CAv4) / 480 min (Entra ID = 8h)"),
        ("Duração refresh token",    "7 dias — hash SHA-256 persistido em session_token"),
        ("Campos do payload",        "user_id, email, user_type, is_supervisor, exp, iss"),
        ("Refresh rotation",         "Sim — token anterior marcado used=true, novo emitido"),
        ("Revogação",                "Sim — token marcado revoked=true na tabela session_token"),
    ],
    col_widths=[5.0, 13.0]
)

heading_style(doc, 2, "5.5. Modelo de Permissões RBAC")
add_table(doc,
    ["Permissão", "Admin", "Supervisor", "Internal", "External"],
    [
        ("shares:create",  "Sim", "Sim", "Sim", "—"),
        ("shares:read",    "Sim", "Sim", "Sim", "—"),
        ("shares:approve", "Sim", "Sim", "—",   "—"),
        ("shares:reject",  "Sim", "Sim", "—",   "—"),
        ("shares:cancel",  "Sim", "Sim", "Sim", "—"),
        ("shares:extend",  "Sim", "Sim", "—",   "—"),
        ("file:upload",    "Sim", "Sim", "Sim", "—"),
        ("report:read",    "Sim", "Sim", "—",   "—"),
        ("admin:*",        "Sim", "—",   "—",   "—"),
    ],
    col_widths=[5.0, 2.5, 3.0, 3.0, 3.0]
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 6 — FLUXOS FUNCIONAIS
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "6. Fluxos Funcionais Principais")

heading_style(doc, 2, "6.1. Fluxo de Compartilhamento com Aprovação do Supervisor")
code_block(doc,
"""Usuário Interno          Backend                    Supervisor         Usuário Externo
      │                       │                           │                    │
      │ POST /shares/create    │                           │                    │
      │ (FormData: files+meta) │                           │                    │
      │──────────────────────►│                           │                    │
      │                       │ 1. Cria Share (PENDENTE)  │                    │
      │                       │ 2. Upload S3 (key_s3)     │                    │
      │                       │ 3. Verifica cargo         │                    │
      │                       │    auto_approve? ─►────── ┤ (sim: ATIVO) ─────►│ E-mail
      │                       │    NÃO → e-mail supervisor│                    │
      │◄──────────────────────│                           │                    │
      │ { share_id, PENDENTE } │                           │                    │
      │                       │◄──────────────────────────│                    │
      │                       │  POST /supervisor/         │                    │
      │                       │  approve/{file_id}         │                    │
      │                       │ 1. Valida vínculo hierárq. │                   │
      │                       │ 2. Share → ATIVO           │                   │
      │                       │ 3. Define expires_at       │                   │
      │                       │ 4. Reativa externo se inativo                  │
      │                       │ 5. E-mail ao externo ──────┼───────────────────►│
      │◄──────────────── E-mail confirmação                │                    │""")

heading_style(doc, 2, "6.2. Aprovação Automática por Cargo")
body_text(doc,
    "Colaboradores com cargos elevados ou administradores têm seus compartilhamentos "
    "auto-aprovados, sem necessidade de intervenção do supervisor. A lista de cargos "
    "é configurável via AUTO_APPROVE_JOB_TITLES no Parameter Store."
)
bullet(doc, "Gerente Geral / Gerente Executivo(a)")
bullet(doc, "Ouvidor(a)-Geral da Petrobras")
bullet(doc, "Secretário(a)-Geral da Petrobras")
bullet(doc, "Chefe do Gabinete da Presidência")
bullet(doc, "Auditor(a)-Geral da Petrobras")
bullet(doc, "Diretor(a) / Presidente")
bullet(doc, "Corregedor(a)-Geral da Petrobras")

heading_style(doc, 2, "6.3. Fluxo de Download por Usuário Externo (OTP)")
code_block(doc,
"""Externo                    Backend                     S3
   │                            │                          │
   │ POST /download/verify       │                          │
   │ { email: "ext@ext.com" }   │                          │
   │───────────────────────────►│                          │
   │                            │ Verifica shares ATIVOS   │
   │                            │ com email + não expirado  │
   │                            │ Envia OTP (6 dígitos)    │
   │                            │ via SMTP Petrobras        │
   │◄───────────────────────────│                          │
   │                            │                          │
   │ POST /download/authenticate │                          │
   │ { email, code: "123456" }  │                          │
   │───────────────────────────►│                          │
   │                            │ Verifica OTP             │
   │                            │ (max 5 tentativas, TTL 5min)
   │                            │ Emite token de acesso    │
   │◄───────────────────────────│                          │
   │ { access_token }           │                          │
   │                            │                          │
   │ GET /download/files        │                          │
   │ Authorization: Bearer ...  │                          │
   │───────────────────────────►│                          │
   │                            │ Lista arquivos do share  │
   │◄───────────────────────────│                          │
   │                            │                          │
   │ GET /download/files/{id}/url│                         │
   │───────────────────────────►│                          │
   │                            │ Gera presigned GET URL ──►│
   │◄────────────────────────── │◄──────────────────────── │
   │ { url (presigned S3 300s) }│                          │""")

add_table(doc,
    ["Controle de Segurança OTP", "Valor Padrão", "Configuração (SSM)"],
    [
        ("Validade do OTP",          "5 minutos",  "OTP_VALIDITY_MINUTES"),
        ("Máximo de tentativas",     "5",          "OTP_MAX_ATTEMPTS"),
        ("Cooldown após bloqueio",   "15 minutos", "OTP_COOLDOWN_MINUTES"),
        ("Armazenamento do código",  "SHA-256",    "Tabela token_access.token_hash"),
    ],
    col_widths=[5.5, 3.5, 9.0]
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 7 — CATÁLOGO DE ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "7. API — Catálogo de Endpoints")

body_text(doc,
    "Todos os endpoints são prefixados com /api/v1/. O Front End atua como BFF "
    "(Backend For Frontend), proxiando as chamadas para o Back End real (definido "
    "pela variável de ambiente BACKEND_URL). O Back End expõe documentação interativa "
    "automática via OpenAPI em /docs (Swagger) e /redoc."
)

heading_style(doc, 2, "7.1. Módulo: Autenticação CAv4")
add_table(doc,
    ["Método", "Endpoint", "Auth", "Descrição"],
    [
        ("GET",  "/auth/cav4/login",         "—",               "Inicia fluxo OIDC (redirect para IdP CAv4)"),
        ("GET",  "/auth/cav4/callback",       "—",               "Callback code/state (server-side)"),
        ("POST", "/auth/cav4/token",          "—",               "Exchange BFF: JSON { code, state }"),
        ("POST", "/auth/cav4/refresh",        "X-Refresh-Token", "Rotation de refresh token CAv4"),
        ("POST", "/auth/cav4/logout",         "Bearer JWT",      "Revoga sessão CAv4"),
        ("GET",  "/auth/cav4/session-check",  "Bearer JWT",      "Valida JWT interno"),
        ("GET",  "/auth/cav4/graph-me",       "Bearer JWT",      "Diagnóstico de enriquecimento Graph"),
    ],
    col_widths=[2.0, 5.5, 3.5, 7.0]
)

heading_style(doc, 2, "7.2. Módulo: Autenticação Entra ID")
add_table(doc,
    ["Método", "Endpoint", "Auth", "Descrição"],
    [
        ("POST", "/auth/entra/token",         "—",               "Valida tokens MSAL, emite JWT interno"),
        ("POST", "/auth/entra/refresh",       "X-Refresh-Token", "Renova access token com rotation"),
        ("POST", "/auth/entra/logout",        "Bearer JWT",      "Encerra sessão + retorna ms_logout_url"),
        ("GET",  "/auth/entra/me",            "Bearer JWT",      "Perfil do usuário autenticado"),
        ("GET",  "/auth/entra/session-check", "Bearer JWT",      "Valida JWT interno"),
        ("POST", "/auth/entra/sync-group",    "Admin",           "(Admin) Sincroniza membros do grupo AD"),
    ],
    col_widths=[2.0, 5.5, 3.5, 7.0]
)

heading_style(doc, 2, "7.3. Módulo: Autenticação Local (Externos / Dev)")
add_table(doc,
    ["Método", "Endpoint", "Auth", "Descrição"],
    [
        ("POST", "/auth/login",             "—",          "Login email + senha"),
        ("POST", "/auth/logout",            "Bearer JWT", "Logout — revoga refresh tokens"),
        ("POST", "/auth/refresh",           "—",          "Renova JWT"),
        ("POST", "/auth/forgot-password",   "—",          "Solicita reset de senha"),
        ("POST", "/auth/reset-password",    "—",          "Confirma reset com token"),
        ("POST", "/auth/external/request-code", "—",      "Solicita OTP para portal externo"),
        ("POST", "/auth/external/verify-code",  "—",      "Verifica OTP e emite token de acesso"),
    ],
    col_widths=[2.0, 5.5, 3.5, 7.0]
)

heading_style(doc, 2, "7.4. Módulo: Arquivos")
add_table(doc,
    ["Método", "Endpoint", "Auth", "Descrição"],
    [
        ("GET",    "/files/",                        "Bearer JWT", "Lista arquivos/shares do usuário (paginado)"),
        ("GET",    "/files/{file_id}",               "Bearer JWT", "Detalhes de um compartilhamento"),
        ("POST",   "/files/",                        "Bearer JWT", "Cria metadados de arquivo"),
        ("POST",   "/files/upload",                  "Bearer JWT", "Upload via FormData (cria share)"),
        ("DELETE", "/files/{file_id}",               "Bearer JWT", "Cancela compartilhamento"),
        ("GET",    "/files/{file_id}/presigned-upload",  "Bearer JWT", "URL presignada para upload S3 (default 600s)"),
        ("GET",    "/files/{file_id}/presigned-download","Bearer JWT", "URL presignada para download S3 (default 300s)"),
    ],
    col_widths=[2.0, 6.5, 3.0, 6.5]
)

heading_style(doc, 2, "7.5. Módulo: Compartilhamentos (Shares)")
add_table(doc,
    ["Método", "Endpoint", "Auth", "Descrição"],
    [
        ("POST",  "/shares/",                    "Bearer JWT", "Cria compartilhamento (file_ids existentes)"),
        ("POST",  "/shares/create",              "Bearer JWT", "Cria com upload simultâneo (FormData + JSON)"),
        ("GET",   "/shares/",                    "Bearer JWT", "Lista compartilhamentos do usuário"),
        ("GET",   "/shares/my-shares",           "Bearer JWT", "Meus compartilhamentos (resumo)"),
        ("GET",   "/shares/{share_id}",          "Bearer JWT", "Detalhes completos do share"),
        ("PATCH", "/shares/{share_id}/cancel",   "Bearer JWT", "Cancela compartilhamento"),
        ("GET",   "/shares/{share_id}/email-logs","Bearer JWT", "Logs de e-mails do share"),
        ("POST",  "/shares/{share_id}/resend",   "Bearer JWT", "Reenvio de notificação ao externo"),
    ],
    col_widths=[2.0, 6.0, 3.0, 7.0]
)

heading_style(doc, 2, "7.6. Módulo: Supervisor")
add_table(doc,
    ["Método", "Endpoint", "Auth", "Descrição"],
    [
        ("GET",  "/supervisor/pending",                      "Supervisor", "Lista compartilhamentos pendentes dos supervisionados"),
        ("POST", "/supervisor/approve/{file_id}",            "Supervisor", "Aprova compartilhamento"),
        ("POST", "/supervisor/reject/{file_id}",             "Supervisor", "Rejeita compartilhamento"),
        ("PUT",  "/supervisor/extend/{file_id}",             "Supervisor", "Estende expiração (máx. +72h por operação)"),
        ("GET",  "/supervisor/shares",                       "Supervisor", "Lista todos os shares dos supervisionados"),
        ("GET",  "/supervisor/shares/{share_id}",            "Supervisor", "Detalhes completos para supervisor"),
        ("GET",  "/supervisor/areas/{area_id}/report",       "Supervisor", "Relatório de área"),
        ("GET",  "/supervisor/export/shares",                "Supervisor", "Exportação CSV dos compartilhamentos"),
        ("GET",  "/supervisor/shares/{share_id}/download-zip","Supervisor", "Download ZIP do compartilhamento"),
    ],
    col_widths=[2.0, 7.0, 3.0, 6.0]
)

heading_style(doc, 2, "7.7. Módulo: Administrador")
add_table(doc,
    ["Método", "Endpoint", "Auth", "Descrição"],
    [
        ("GET",   "/admin/dashboard",              "Admin", "Métricas globais do sistema"),
        ("GET",   "/admin/users",                  "Admin", "Lista todos os usuários"),
        ("GET",   "/admin/shares",                 "Admin", "Lista todos os compartilhamentos"),
        ("GET",   "/admin/logs",                   "Admin", "Todos os logs de auditoria"),
        ("GET",   "/admin/tracking/by-email",      "Admin", "Rastreamento completo por e-mail"),
        ("PATCH", "/admin/users/{id}/admin",        "Admin", "Promover/rebaixar administrador"),
        ("POST",  "/admin/actions",                "Admin", "Ações administrativas (cleanup, etc.)"),
        ("GET",   "/admin/export/users",           "Admin", "Exportação CSV de usuários"),
        ("GET",   "/admin/export/shares",          "Admin", "Exportação CSV de compartilhamentos"),
        ("GET",   "/admin/export/logs",            "Admin", "Exportação CSV de logs"),
    ],
    col_widths=[2.0, 6.0, 2.5, 7.5]
)

heading_style(doc, 2, "7.8. Módulo: Download (Portal Externo OTP)")
add_table(doc,
    ["Método", "Endpoint", "Auth", "Descrição"],
    [
        ("POST", "/download/verify",            "—",           "Verifica e-mail e envia OTP por SMTP"),
        ("POST", "/download/authenticate",      "—",           "Valida OTP e emite token de acesso"),
        ("GET",  "/download/files",             "Token Externo","Lista arquivos disponíveis para o externo"),
        ("GET",  "/download/files/{file_id}/url","Token Externo","Retorna URL presignada para download"),
        ("GET",  "/download/files/zip",         "Token Externo","Download ZIP de todos os arquivos"),
    ],
    col_widths=[2.0, 5.5, 3.5, 7.0]
)

heading_style(doc, 2, "7.9. Demais Módulos")
add_table(doc,
    ["Módulo", "Prefixo", "Descrição"],
    [
        ("Auditoria",     "/audit/",         "Consulta de logs e métricas de auditoria"),
        ("Áreas",         "/areas/",         "Gestão de áreas / prefixos S3"),
        ("Notificações",  "/notifications/", "Listagem, marcação como lida"),
        ("E-mails",       "/emails/",        "Histórico e status de envios"),
        ("Diagnóstico",   "/diagnostico/",   "Verificação de parâmetros de configuração"),
        ("MIP Auth",      "/mip/auth/",      "Device code flow para autenticação MIP SDK"),
        ("Suporte",       "/support/",       "Cadastro de usuários externos pelo time de suporte"),
        ("SQL Explorer",  "/sql-explorer/",  "(Admin) Execução de queries ad-hoc"),
        ("Roadmap",       "/roadmap/",       "Gerenciamento de fases, marcos e entregas"),
    ],
    col_widths=[4.0, 4.5, 9.5]
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 8 — MODELO DE DADOS
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "8. Modelo de Dados — Banco de Dados")

body_text(doc,
    "O banco de dados é o Amazon Aurora PostgreSQL, gerenciado com migrações Alembic. "
    "O schema contém 14 tabelas que cobrem todo o ciclo de vida do sistema: usuários, "
    "compartilhamentos, arquivos, tokens, auditoria, notificações, e-mails e suporte."
)

heading_style(doc, 2, "8.1. Diagrama de Relacionamento")
code_block(doc,
"""user ◄─────────────────── credential_local (1:1)
 │
 ├── manager_id ──► user (auto-referência: hierarquia gestor/subordinado)
 │
 ├──────────────► share (created_by_id)
 │                  │
 │                  ├──────────────► share_file ◄──── restricted_file
 │                  │                                       │
 │                  │                        ◄── shared_area ◄── areasupervisor ◄── user
 │                  │
 │                  ├──────────────► token_access (OTP + access token)
 │                  ├──────────────► audit       (trilha imutável)
 │                  ├──────────────► email_log   (rastreamento de e-mails)
 │                  └──────────────► notification (in-app para internos)
 │
 └──────────────► session_token     (refresh + reset de senha)
 └──────────────► support_registration ◄── support_audit""")

heading_style(doc, 2, "8.2. Tabela: user")
body_text(doc, "Tabela central. Armazena todos os perfis: internos (Petrobras), externos (parceiros), supervisores e administradores.")
add_table(doc,
    ["Coluna", "Tipo", "Descrição"],
    [
        ("id",          "INTEGER PK",                        "Identificador único"),
        ("type",        "ENUM(externo, internal)",           "Tipo do usuário"),
        ("name",        "VARCHAR(255)",                      "Nome completo"),
        ("email",       "VARCHAR(255) UNIQUE NOT NULL",      "E-mail — chave de login"),
        ("phone",       "VARCHAR(20)",                       "Telefone"),
        ("department",  "VARCHAR(255)",                      "Departamento / área organizacional"),
        ("job_title",   "VARCHAR(255)",                      "Cargo (usado para aprovação automática)"),
        ("employee_id", "VARCHAR(50)",                       "Matrícula Petrobras (= user_login CAv4)"),
        ("photo_url",   "VARCHAR(500)",                      "URL da foto (base64 data URI do Graph API)"),
        ("manager_id",  "INTEGER FK → user.id",              "Gestor imediato (supervisor hierárquico)"),
        ("is_supervisor","BOOLEAN",                          "Pode aprovar/rejeitar compartilhamentos"),
        ("is_admin",    "BOOLEAN",                           "Super administrador global"),
        ("status",      "BOOLEAN",                           "Ativo / Inativo"),
        ("login_cav4",  "VARCHAR(50)",                       "Login/matrícula do CAv4"),
        ("created_at",  "TIMESTAMPTZ",                       "Data de criação"),
        ("last_login",  "TIMESTAMPTZ",                       "Último acesso registrado"),
    ],
    col_widths=[3.5, 5.0, 9.5]
)

heading_style(doc, 2, "8.3. Tabela: credential_local")
body_text(doc, "Credenciais para autenticação local. Exclusiva para usuários externos. Usuários internos autenticam via CAv4/Entra ID e não possuem registro nesta tabela.")
add_table(doc,
    ["Coluna", "Tipo", "Descrição"],
    [
        ("id",              "INTEGER PK",                      "—"),
        ("user_id",         "INTEGER FK → user.id CASCADE",    "Usuário externo proprietário"),
        ("password_hash",   "VARCHAR(255)",                    "Hash bcrypt da senha"),
        ("salt",            "VARCHAR(64)",                     "Salt único por usuário"),
        ("failed_attempts", "INTEGER",                         "Tentativas de login falhas consecutivas"),
        ("blocked_until",   "TIMESTAMPTZ",                     "Bloqueio temporário (brute-force protection)"),
        ("created_at",      "TIMESTAMPTZ",                     "—"),
        ("updated_at",      "TIMESTAMPTZ",                     "—"),
    ],
    col_widths=[3.5, 5.0, 9.5]
)

heading_style(doc, 2, "8.4. Tabela: shared_area")
body_text(doc, "Áreas lógicas de armazenamento no S3. Cada área tem um prefixo único que organiza os arquivos no bucket.")
add_table(doc,
    ["Coluna", "Tipo", "Descrição"],
    [
        ("id",           "INTEGER PK",               "—"),
        ("name",         "VARCHAR(255)",              "Nome da área"),
        ("prefix_s3",    "VARCHAR(500)",              "Prefixo no bucket S3"),
        ("description",  "TEXT",                     "Descrição"),
        ("status",       "BOOLEAN",                  "Ativa / Inativa"),
        ("expires_at",   "TIMESTAMPTZ",              "Expiração da área"),
        ("applicant_id", "INTEGER FK → user.id",     "Usuário criador da área"),
    ],
    col_widths=[3.5, 4.0, 10.5]
)

heading_style(doc, 2, "8.5. Tabela: areasupervisor")
body_text(doc, "Tabela de associação N:N entre áreas e supervisores.")
add_table(doc,
    ["Coluna", "Tipo", "Descrição"],
    [
        ("id",           "INTEGER PK",                              "—"),
        ("area_id",      "INTEGER FK → shared_area.id CASCADE",     "Área"),
        ("supervisor_id","INTEGER FK → user.id CASCADE",            "Supervisor responsável pela área"),
    ],
    col_widths=[3.5, 6.0, 8.5]
)

heading_style(doc, 2, "8.6. Tabela: restricted_file")
body_text(doc, "Metadados de todos os arquivos enviados ao S3. O arquivo físico reside no S3; este registro guarda o mapeamento e controla o ciclo de vida.")
add_table(doc,
    ["Coluna", "Tipo", "Descrição"],
    [
        ("id",          "INTEGER PK",                  "—"),
        ("area_id",     "INTEGER FK → shared_area.id", "Área de pertencimento"),
        ("name",        "VARCHAR(500)",                "Nome original do arquivo"),
        ("key_s3",      "VARCHAR(1000)",               "Chave completa no bucket S3"),
        ("size_bytes",  "BIGINT",                      "Tamanho em bytes"),
        ("mime_type",   "VARCHAR(255)",                "Tipo MIME"),
        ("checksum",    "VARCHAR(128)",                "Hash MD5/SHA para verificação de integridade"),
        ("upload_id",   "INTEGER FK → user.id",        "Usuário que realizou o upload"),
        ("expires_at",  "TIMESTAMPTZ",                 "Expiração individual do arquivo"),
        ("status",      "BOOLEAN",                     "Ativo / Excluído (soft delete)"),
    ],
    col_widths=[3.5, 4.5, 10.0]
)

heading_style(doc, 2, "8.7. Tabela: share")
body_text(doc, "Entidade central de compartilhamento. Representa uma solicitação de transferência de arquivo(s) para um destinatário externo, com ciclo de vida controlado.")
add_table(doc,
    ["Coluna", "Tipo", "Descrição"],
    [
        ("id",                 "INTEGER PK",                    "—"),
        ("name",               "VARCHAR(255)",                  "Título do compartilhamento"),
        ("description",        "VARCHAR(1000)",                 "Descrição"),
        ("area_id",            "INTEGER FK → shared_area.id",   "Área relacionada"),
        ("external_email",     "VARCHAR(255)",                  "E-mail do destinatário externo"),
        ("recipient_user_id",  "INTEGER FK → user.id",          "Usuário externo provisionado"),
        ("status",             "ENUM(sharestatus)",             "Estado atual (ver tabela de estados)"),
        ("consumption_policy", "ENUM",                          "apos_todos | apos_primeiro — expiração por download"),
        ("expiration_hours",   "INTEGER",                       "Horas de validade solicitadas"),
        ("expires_at",         "TIMESTAMPTZ",                   "Data efetiva de expiração (definida na aprovação)"),
        ("created_by_id",      "INTEGER FK → user.id",          "Solicitante interno"),
        ("approver_id",        "INTEGER FK → user.id",          "Supervisor que aprovou/rejeitou"),
        ("approved_at",        "TIMESTAMPTZ",                   "Data de aprovação"),
        ("rejected_at",        "TIMESTAMPTZ",                   "Data de rejeição"),
        ("rejection_reason",   "VARCHAR(500)",                  "Motivo da rejeição"),
        ("approval_comments",  "VARCHAR(500)",                  "Comentários do aprovador"),
    ],
    col_widths=[4.0, 4.5, 9.5]
)

heading_style(doc, 3, "8.7.1. Estados do Share (ENUM sharestatus)")
add_table(doc,
    ["Status", "Descrição"],
    [
        ("pendente",   "Aguardando aprovação do supervisor"),
        ("aprovado",   "Aprovado pelo supervisor, aguardando notificação ao externo"),
        ("ativo",      "Disponível para download pelo usuário externo"),
        ("rejeitado",  "Rejeitado pelo supervisor"),
        ("concluido",  "Todos os arquivos foram baixados (policy apos_todos)"),
        ("expirado",   "TTL de expiração atingido"),
        ("cancelado",  "Cancelado pelo solicitante interno"),
    ],
    col_widths=[4.0, 14.0]
)

heading_style(doc, 2, "8.8. Tabela: share_file")
body_text(doc, "Tabela de associação N:N entre compartilhamentos e arquivos. Registra o status de download por arquivo.")
add_table(doc,
    ["Coluna", "Tipo", "Descrição"],
    [
        ("id",            "INTEGER PK",                             "—"),
        ("share_id",      "INTEGER FK → share.id CASCADE",          "Compartilhamento"),
        ("file_id",       "INTEGER FK → restricted_file.id CASCADE","Arquivo"),
        ("downloaded",    "BOOLEAN",                                "Se o arquivo foi baixado"),
        ("downloaded_at", "TIMESTAMPTZ",                            "Data/hora do download"),
    ],
    col_widths=[3.5, 5.5, 9.0]
)

heading_style(doc, 2, "8.9. Tabela: token_access")
body_text(doc, "Tokens de autenticação para o portal externo: OTP (código numérico de 6 dígitos) e access token (UUID longo).")
add_table(doc,
    ["Coluna", "Tipo", "Descrição"],
    [
        ("id",           "INTEGER PK",                      "—"),
        ("type",         "ENUM(otp, access)",               "Tipo do token"),
        ("token",        "VARCHAR(500)",                    "Token de acesso (UUID)"),
        ("token_hash",   "VARCHAR(128)",                    "Hash SHA-256 do OTP — nunca armazenado em claro"),
        ("user_id",      "INTEGER FK → user.id CASCADE",    "Usuário externo"),
        ("share_id",     "INTEGER FK → share.id CASCADE",   "Share relacionado"),
        ("expires_at",   "TIMESTAMPTZ",                     "Expiração do token"),
        ("used",         "BOOLEAN",                         "Se já foi utilizado"),
        ("attempts",     "INTEGER",                         "Tentativas de verificação"),
        ("blocked_until","TIMESTAMPTZ",                     "Bloqueio por excesso de tentativas"),
    ],
    col_widths=[3.5, 4.5, 10.0]
)

heading_style(doc, 2, "8.10. Tabela: audit")
body_text(doc, "Trilha de auditoria imutável. Cada ação relevante do sistema gera um registro via log_event(). Não há endpoint de deleção desta tabela.")
add_table(doc,
    ["Coluna", "Tipo", "Descrição"],
    [
        ("id",          "INTEGER PK",                              "—"),
        ("action",      "VARCHAR(100)",                            "Ex: LOGIN_CAV4, UPLOAD_ARQUIVOS, APROVAR_SHARE"),
        ("level",       "ENUM(info, success, warning, error)",     "Severidade do evento"),
        ("user_id",     "INTEGER FK → user.id",                    "Ator que gerou o evento"),
        ("share_id",    "INTEGER FK → share.id",                   "Share relacionado (se aplicável)"),
        ("file_id",     "INTEGER FK → restricted_file.id",         "Arquivo relacionado (se aplicável)"),
        ("ip_address",  "VARCHAR(45)",                             "IP do cliente (IPv4 ou IPv6)"),
        ("user_agent",  "VARCHAR(500)",                            "User-Agent do browser/cliente"),
        ("detail",      "TEXT",                                    "Detalhes em texto livre ou JSON"),
        ("created_at",  "TIMESTAMPTZ",                             "Timestamp imutável do evento"),
    ],
    col_widths=[3.5, 5.0, 9.5]
)

heading_style(doc, 3, "8.10.1. Ações de Auditoria Catalogadas")
code_block(doc,
"""LOGIN | LOGIN_CAV4 | LOGIN_ENTRA_MSAL | LOGIN_BLOCKED_NOT_IN_GROUP | LOGOUT | LOGOUT_CAV4
REFRESH_TOKEN | REFRESH_CAV4 | UPLOAD_ARQUIVOS | CRIAR_SHARE | AUTO_APROVAR_SHARE_CARGO
AUTO_APROVAR_SHARE_SUPERVISOR | APROVAR_SHARE | REJEITAR_SHARE | ESTENDER_EXPIRACAO
CANCELAR_FILE | DOWNLOAD_FILE | PRESIGNED_UPLOAD | VER_PENDENTES | VER_RELATORIO_AREA
REATIVAR_USUARIO_EXTERNO | LISTAR_ARQUIVOS""")

heading_style(doc, 2, "8.11. Tabela: notification")
add_table(doc,
    ["Coluna", "Tipo", "Descrição"],
    [
        ("id",             "INTEGER PK",                         "—"),
        ("user_id",        "INTEGER FK → user.id CASCADE",       "Destinatário da notificação"),
        ("type",           "ENUM",                               "info | success | warning | error | approval | rejection | download | expiration"),
        ("priority",       "ENUM(low, medium, high, urgent)",    "Prioridade"),
        ("title",          "VARCHAR(255)",                       "Título da notificação"),
        ("message",        "VARCHAR(1000)",                      "Mensagem"),
        ("read",           "BOOLEAN",                            "Se foi lida"),
        ("action_label",   "VARCHAR(100)",                       "Texto do botão CTA"),
        ("action_url",     "VARCHAR(500)",                       "URL do CTA"),
        ("extra_metadata", "TEXT",                               "JSON adicional"),
    ],
    col_widths=[3.5, 5.0, 9.5]
)

heading_style(doc, 2, "8.12. Tabela: email_log")
body_text(doc, "Rastreamento completo de todos os e-mails enviados pelo sistema, com suporte a eventos de entrega (delivered, opened, clicked, bounced).")
add_table(doc,
    ["Coluna", "Tipo", "Descrição"],
    [
        ("id",           "INTEGER PK",              "—"),
        ("message_id",   "VARCHAR(255) UNIQUE",     "ID do e-mail (SES ou SMTP)"),
        ("email_type",   "ENUM",                    "otp_verification | share_notification | share_approved | share_rejected | download_complete | password_reset | welcome"),
        ("from_email",   "VARCHAR(255)",             "Remetente"),
        ("to_email",     "VARCHAR(255)",             "Destinatário"),
        ("subject",      "VARCHAR(500)",             "Assunto"),
        ("status",       "ENUM",                    "pending → sent → delivered → opened / bounced / failed"),
        ("sent_at",      "TIMESTAMPTZ",              "Data de envio"),
        ("delivered_at", "TIMESTAMPTZ",              "Data de entrega confirmada"),
        ("opened_at",    "TIMESTAMPTZ",              "Data de abertura"),
        ("error_message","VARCHAR",                  "Mensagem de erro (se houver)"),
        ("user_id",      "INTEGER FK → user.id",     "Usuário relacionado"),
        ("share_id",     "INTEGER FK → share.id",    "Share relacionado"),
    ],
    col_widths=[3.5, 4.5, 10.0]
)

heading_style(doc, 2, "8.13. Tabela: session_token")
body_text(doc, "Tokens de sessão persistidos para refresh rotation e reset de senha.")
add_table(doc,
    ["Coluna", "Tipo", "Descrição"],
    [
        ("id",          "INTEGER PK",                      "—"),
        ("user_id",     "INTEGER FK → user.id CASCADE",    "Proprietário do token"),
        ("token_hash",  "VARCHAR(255)",                    "Hash SHA-256 do token — nunca armazenado em claro"),
        ("token_type",  "ENUM(refresh, reset)",            "Tipo do token"),
        ("expires_at",  "TIMESTAMPTZ",                     "Validade"),
        ("used",        "BOOLEAN",                         "Token consumido"),
        ("revoked",     "BOOLEAN",                         "Token revogado (logout)"),
        ("ip_address",  "VARCHAR(45)",                     "IP no momento de criação"),
        ("user_agent",  "VARCHAR(500)",                    "Navegador no momento de criação"),
    ],
    col_widths=[3.5, 5.0, 9.5]
)

heading_style(doc, 2, "8.14. Tabelas: support_registration e support_audit")
body_text(doc, "Registro de cadastros e reativações de usuários externos realizados pelo time de suporte via chamados ServiceNow.")
add_table(doc,
    ["Coluna (support_registration)", "Tipo", "Descrição"],
    [
        ("id",                   "INTEGER PK",         "—"),
        ("request_number",       "VARCHAR(50)",        "Número do chamado ServiceNow"),
        ("requester_email",      "VARCHAR(255)",       "Solicitante interno"),
        ("external_user_email",  "VARCHAR(255)",       "E-mail do externo cadastrado"),
        ("registered_by_name",   "VARCHAR(255)",       "Atendente responsável"),
        ("status",               "ENUM",               "ativo | pendente | inativo | cancelado"),
        ("is_reactivation",      "BOOLEAN",            "Se foi reativação de conta existente"),
    ],
    col_widths=[5.0, 3.5, 9.5]
)
add_table(doc,
    ["Coluna (support_audit)", "Tipo", "Descrição"],
    [
        ("id",                "INTEGER PK",                              "—"),
        ("action",            "ENUM",                                    "CADASTRO | REATIVACAO | INATIVACAO | ALTERACAO | CONSULTA"),
        ("support_user_id",   "INTEGER FK → user.id",                    "Atendente"),
        ("registration_id",   "INTEGER FK → support_registration.id",    "Registro relacionado"),
        ("affected_user_id",  "INTEGER FK → user.id",                    "Usuário afetado pela ação"),
    ],
    col_widths=[5.0, 3.5, 9.5]
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 9 — INTEGRAÇÕES EXTERNAS
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "9. Integrações Externas")

heading_style(doc, 2, "9.1. CAv4 — Identity Provider Corporativo Petrobras")
body_text(doc, "O CAv4 é o Identity Provider OIDC/OAuth 2.0 da Petrobras, responsável por autenticar todos os colaboradores internos.")
add_table(doc,
    ["Aspecto", "Detalhe"],
    [
        ("Protocolo",            "OIDC Authorization Code + PKCE (RFC 7636)"),
        ("Descoberta",           "OIDC_DISCOVERY_URL → recupera authorization_endpoint, token_endpoint, jwks_uri"),
        ("Validação do token",   "RS256 via JWKS; verificação de exp, iss, aud, nonce"),
        ("Extração de login",    "sub, preferred_username ou email das claims OIDC"),
        ("Consulta de roles",    "GET {CA_API_BASE_URL}/v1/users/{login}/roles (via cav4_client.py)"),
        ("Resources",            "GET {CA_API_BASE_URL}/v1/users/{login}/resources"),
        ("SSL / TLS",            "Truststore corporativo Petrobras (CA_SSL_CERT_FILE, CA_SSL_USE_TRUSTSTORE)"),
        ("Fallback de e-mail",   "Se claims não contiverem e-mail: {user_login}@petrobras.com.br"),
    ],
    col_widths=[4.5, 13.5]
)

heading_style(doc, 2, "9.2. Microsoft Entra ID (Azure Active Directory)")
body_text(doc, "Utilizado para dois fins distintos no sistema:")

body_text(doc, "a) Autenticação (modo AUTH_MODE=entra — legado):", bold=True)
bullet(doc, "Fluxo MSAL SPA no frontend (Authorization Code + PKCE)")
bullet(doc, "Verificação de pertencimento ao grupo GN_CLOUD_AWS_SCAC_USERS via claims ou Graph API")
bullet(doc, "Validação de id_token via JWKS: https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys")

body_text(doc, "b) Enriquecimento de Perfil — Microsoft Graph (usado em ambos os modos):", bold=True)
add_table(doc,
    ["Dado", "Endpoint Graph", "Uso no SCAC"],
    [
        ("Cargo (jobTitle)",     "GET /v1.0/me",          "Aprovação automática e exibição no perfil"),
        ("Departamento",         "GET /v1.0/me",          "Exibição e filtros"),
        ("Matrícula (employeeId)","GET /v1.0/me",         "Correlação com employee_id"),
        ("Nome do gestor",       "GET /v1.0/me/manager",  "Vínculo manager_id na tabela user"),
        ("E-mail do gestor",     "GET /v1.0/me/manager",  "Notificações ao supervisor"),
        ("Foto",                 "GET /v1.0/me/photo/$value","Avatar em base64 no perfil"),
    ],
    col_widths=[4.5, 5.5, 8.0]
)

add_info_box(doc, "Postura de falha:",
    "GRAPH_REQUIRED=false (padrão) — login não é bloqueado se Graph falhar. "
    "Configurável para true em ambientes que exijam dados organizacionais completos.")

heading_style(doc, 2, "9.3. Microsoft Purview / MIP (Microsoft Information Protection)")
add_table(doc,
    ["Aspecto", "Detalhe"],
    [
        ("Serviço",        "MIP SDK dedicado (mip_sdk_base_url)"),
        ("Autenticação",   "Device code flow (padrão) ou popup MSAL (configurável via NEXT_PUBLIC_MIP_AUTH_MODE)"),
        ("Operações",      "Consulta e alteração de rótulos MIP antes do compartilhamento"),
        ("Habilitação",    "MIP_PROCESSING_ENABLED (true/false por ambiente)"),
        ("Falha fechada",  "MIP_FAIL_CLOSED=true: se SDK falhar, a operação é bloqueada"),
        ("Timeout",        "MIP_PROCESSING_TIMEOUT_SECONDS"),
        ("TLS",            "MIP_SDK_VERIFY_TLS=false (padrão — CA corporativa auto-assinada Petrobras)"),
    ],
    col_widths=[4.5, 13.5]
)

heading_style(doc, 2, "9.4. Amazon S3")
add_table(doc,
    ["Aspecto", "Detalhe"],
    [
        ("Uso",              "Armazenamento binário de todos os arquivos (metadados no PostgreSQL)"),
        ("Bucket",           "Configurado via AWS_S3_BUCKET / Parameter Store"),
        ("Autenticação",     "IAM Role do ECS Task (produção); chaves de acesso no .env (dev local)"),
        ("Upload",           "s3.put_object() via Back End ou presigned PUT URL"),
        ("Download",         "StreamingResponse via Back End ou presigned GET URL (TTL padrão: 300s)"),
        ("Estrutura de chave","area_prefix/share_id_uuid_safe_filename"),
        ("Cleanup",          "Delete automático em cancelamento e rejeição de compartilhamentos"),
    ],
    col_widths=[4.5, 13.5]
)

heading_style(doc, 2, "9.5. SMTP Petrobras (E-mail Corporativo)")
add_table(doc,
    ["Aspecto", "Detalhe"],
    [
        ("Servidor",         "smtp.petrobras.com.br — Porta 25 — STARTTLS — sem autenticação"),
        ("Provider",         "EMAIL_PROVIDER=smtp_internal"),
        ("Header X-Route",   "MAIL_ROUTE: desvio em não-produção (ex: TESTE_TIC → cc-test_apps_tic)"),
        ("Header X-Protecao","MAIL_PROTECTION: ex: CONFIDENCIAL → Exchange aplica criptografia MIP"),
        ("Alternativa AWS",  "EMAIL_PROVIDER=ses — Amazon Simple Email Service"),
    ],
    col_widths=[4.5, 13.5]
)

heading_style(doc, 3, "9.5.1. E-mails Enviados pelo Sistema")
add_table(doc,
    ["Tipo", "Gatilho"],
    [
        ("otp_verification",   "Externo solicita acesso ao portal de download"),
        ("share_notification", "Supervisor notificado sobre compartilhamento pendente"),
        ("share_approved",     "Externo e solicitante notificados após aprovação"),
        ("share_rejected",     "Solicitante notificado sobre rejeição"),
        ("download_complete",  "Confirmação de download concluído"),
        ("expiration_warning", "Aviso de expiração próxima"),
        ("password_reset",     "Reset de senha para usuários externos"),
        ("welcome",            "Boas-vindas ao novo usuário externo"),
    ],
    col_widths=[5.0, 13.0]
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 10 — CONFIGURAÇÕES E SEGREDOS
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "10. Configurações e Gerenciamento de Segredos")

heading_style(doc, 2, "10.1. Hierarquia de Configuração")
body_text(doc, "A classe Settings() (pydantic-settings) aplica a seguinte hierarquia de precedência, da maior para a menor:")
add_table(doc,
    ["Prioridade", "Fonte", "Descrição"],
    [
        ("1 (maior)", "Variável de ambiente (os.environ)", "Injetada diretamente pelo ECS Task Definition"),
        ("2",         "AWS Secrets Manager",               "Via ponteiro configurado no Parameter Store"),
        ("3",         "AWS Parameter Store (SSM)",         "Parâmetros não-sensíveis por ambiente"),
        ("4 (menor)", "Defaults da classe Settings()",     "Valores padrão em código (pydantic-settings)"),
    ],
    col_widths=[2.5, 5.5, 10.0]
)

heading_style(doc, 2, "10.2. Convenções de Nomenclatura — Parameter Store")
add_table(doc,
    ["Ambiente", "Path SSM", "Exemplo"],
    [
        ("DSV", "/APP/{CdkAppServiceName}-dsv/{VARIAVEL}",    "/APP/backend-dsv/DATABASE_URL"),
        ("TST", "/APP/{CdkAppServiceName}-tst/{VARIAVEL}",    "/APP/backend-tst/AUTH_MODE"),
        ("HMG", "/APP/{CdkAppServiceName}-hmg/{VARIAVEL}",    "/APP/backend-hmg/AWS_S3_BUCKET"),
        ("PRD", "/APP/{CdkAppServiceName}/{VARIAVEL}",         "/APP/backend/JWT_SECRET"),
    ],
    col_widths=[2.0, 7.5, 8.5]
)

heading_style(doc, 2, "10.3. Parâmetros Principais (Parameter Store)")
add_table(doc,
    ["Parâmetro", "Tipo", "Descrição"],
    [
        ("DATABASE_URL",                 "String",  "Connection string PostgreSQL"),
        ("STORAGE_PROVIDER",             "String",  "aws | local"),
        ("AUTH_MODE",                    "String",  "cav4 | entra | local"),
        ("EMAIL_PROVIDER",               "String",  "smtp_internal | ses | dev"),
        ("AWS_REGION",                   "String",  "Região AWS (ex: sa-east-1)"),
        ("AWS_S3_BUCKET",                "String",  "Nome do bucket S3"),
        ("FRONTEND_EXTERNAL_PORTAL_URL", "String",  "URL do portal de download externo"),
        ("FRONTEND_SHARE_DETAILS_URL",   "String",  "URL da página de detalhes do share"),
        ("FRONTEND_SUPERVISOR_URL",      "String",  "URL do portal supervisor"),
        ("SMTP_SERVER",                  "String",  "Servidor SMTP"),
        ("SMTP_PORT",                    "Integer", "Porta SMTP"),
        ("MAIL_FROM",                    "String",  "E-mail remetente"),
        ("OIDC_DISCOVERY_URL",           "String",  "URL de discovery OIDC do CAv4"),
        ("CA_API_BASE_URL",              "String",  "Base URL das APIs de autorização CAv4"),
        ("CA_REDIRECT_URI",              "String",  "URI de callback do OIDC"),
        ("SECRETS_MANAGER/...",          "Pointer", "Ponteiro para o secret no Secrets Manager"),
    ],
    col_widths=[5.5, 2.0, 10.5]
)

heading_style(doc, 2, "10.4. Segredos (AWS Secrets Manager)")
body_text(doc, "Armazenados como JSON (SecretString) no AWS Secrets Manager. Exemplo de estrutura — backend_dsv_secret:")
code_block(doc,
"""{
  "ENTRA_TENANT_ID":             "...",
  "ENTRA_CLIENT_ID":             "...",
  "ENTRA_CLIENT_SECRET":         "...",
  "ENTRA_CLIENT_ID_PURVIEW":     "...",
  "ENTRA_CLIENT_SECRET_PURVIEW": "...",
  "CA_CLIENT_ID":                "...",
  "CA_CLIENT_SECRET":            "...",
  "JWT_SECRET":                  "...",
  "SMTP_PASS":                   "..."
}""")
add_info_box(doc, "DIRETRIZ:",
    "Credenciais AWS (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) NÃO devem constar "
    "no secret quando a Task ECS utiliza IAM Role. O boto3 usa a cadeia de "
    "credenciais padrão (IAM Role → env → ~/.aws).")

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 11 — INFRAESTRUTURA E DEPLOY
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "11. Infraestrutura e Deploy (AWS / ECS)")

heading_style(doc, 2, "11.1. Containerização")
body_text(doc, "Ambos os componentes (Front End e Back End) são conteinerizados com Dockerfile multi-stage e publicados no registry interno Petrobras (registry.petrobras.com.br).")

heading_style(doc, 3, "11.1.1. Back End — Estratégia Dockerfile")
code_block(doc,
"""Stage 1 (builder):
  FROM python3.12-slim
  RUN apt-get install gcc libpq-dev
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt (compila wheels)

Stage 2 (runtime):
  FROM python3.12-slim
  RUN apt-get install libpq-dev
  COPY --from=builder /usr/local/lib/python3.12/site-packages .
  COPY . .
  ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
  EXPOSE 8080
  ENTRYPOINT ["./entrypoint.sh"]
  # entrypoint.sh: alembic upgrade head → uvicorn main:app --host 0.0.0.0 --port 8080""")

heading_style(doc, 3, "11.1.2. Front End — Estratégia")
code_block(doc,
"""Build:   next build (output: standalone)
         force-dynamic no layout raiz para leitura de env em runtime ECS
Runtime: Node.js 20
Porta:   3000
Vars:    process.env['VAR'] (notação de colchetes) → leitura em runtime, não em build-time
         window.__ENV__ → injetado pelo Server Component para uso no browser (client-side)""")

heading_style(doc, 2, "11.2. Amazon ECS (Elastic Container Service)")
add_table(doc,
    ["Aspecto", "Detalhe"],
    [
        ("Tipo de execução",  "Fargate (serverless)"),
        ("Multi-AZ",          "Sim — Task distribuída entre zonas de disponibilidade"),
        ("Registry",          "registry.petrobras.com.br (privado)"),
        ("Variáveis de env",  "Injetadas pelo pipeline CDK via Parameter Store"),
        ("IAM Role",          "Task Role com permissões mínimas para S3, SSM, Secrets Manager"),
        ("Health check",      "GET /health → HTTP 200"),
        ("Porta Back End",    "8080"),
        ("Porta Front End",   "3000"),
    ],
    col_widths=[4.5, 13.5]
)

heading_style(doc, 2, "11.3. Pipeline CI/CD (GitHub Actions)")
add_table(doc,
    ["Workflow", "Arquivo", "Descrição"],
    [
        ("Snapshot",       "snapshot.yml",        "Build e push de imagem de snapshot para dev"),
        ("Start Release",  "start-release.yml",   "Inicia processo de release (cria branch release/)"),
        ("Finish Release", "finish-release.yml",  "Finaliza release, gera tag de versão"),
        ("Redeploy",       "redeploy.yml",         "Força redeploy no ECS sem novo build"),
    ],
    col_widths=[4.0, 5.0, 9.0]
)

heading_style(doc, 2, "11.4. Banco de Dados — Aurora PostgreSQL")
add_table(doc,
    ["Aspecto", "Detalhe"],
    [
        ("Serviço",          "Amazon Aurora PostgreSQL (Multi-AZ)"),
        ("Driver",           "psycopg3 (nativo, assíncrono)"),
        ("Migrations",       "Alembic — executado automaticamente no boot do container"),
        ("Schema",           "public (configurável via DB_SCHEMA)"),
        ("Pool",             "Nativo Aurora + SQLAlchemy pool interno"),
        ("Backup",           "Gerenciado pela AWS — retenção configurável por ambiente"),
    ],
    col_widths=[4.5, 13.5]
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 12 — SEGURANÇA
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "12. Segurança")

heading_style(doc, 2, "12.1. Autenticação e Sessão")
bullet(doc, "JWT HS256 para sessões internas, com issuer=secure-share validado em todos os endpoints protegidos")
bullet(doc, "Refresh token rotation: cada uso invalida o token anterior e emite um novo")
bullet(doc, "Tokens nunca armazenados em texto plano: apenas hash SHA-256 em session_token.token_hash")
bullet(doc, "OTP nunca em texto plano: hash SHA-256 em token_access.token_hash")

heading_style(doc, 2, "12.2. Controle de Acesso")
bullet(doc, "Autorização por permissão: middleware require_permission(permission_string) aplicado em cada endpoint protegido")
bullet(doc, "Scoping hierárquico: supervisores só visualizam e atuam sobre os compartilhamentos de seus subordinados (manager_id == supervisor.id)")
bullet(doc, "PKCE obrigatório: todos os fluxos OAuth 2.0 utilizam PKCE (RFC 7636), eliminando a necessidade de client_secret no browser")

heading_style(doc, 2, "12.3. Upload de Arquivos — Validações")
add_table(doc,
    ["Controle", "Detalhes"],
    [
        ("Extensões bloqueadas",  ".exe .dll .bat .cmd .com .msi .scr .vbs .ps1 .sh"),
        ("Sanitização de nome",   "sanitize_filename() remove caracteres especiais antes do upload ao S3"),
        ("Validação MIME",        "Tipo MIME verificado contra extensão declarada"),
        ("Limites de tamanho",    "Definidos por timeout de infraestrutura (ALB/Gateway) e recursos ECS"),
    ],
    col_widths=[4.5, 13.5]
)

heading_style(doc, 2, "12.4. Proteção de Dados Sensíveis")
bullet(doc, "Senhas de externos com bcrypt (salt único por usuário, fator de custo padrão)")
bullet(doc, "Credenciais AWS nunca hardcoded: IAM Role em produção, .env apenas em dev local")
bullet(doc, "Comunicação entre serviços exclusivamente via HTTPS/TLS")
bullet(doc, "PYTHONDONTWRITEBYTECODE=1 e PYTHONUNBUFFERED=1 no container (sem bytecache, logs em tempo real)")

heading_style(doc, 2, "12.5. Auditoria e Rastreabilidade")
body_text(doc,
    "Toda operação sensível registra IP de origem e User-Agent do cliente. "
    "A tabela audit é imutável por design (sem endpoint de deleção). "
    "Eventos críticos auditados incluem: todos os logins, logouts, uploads, "
    "aprovações, rejeições, downloads e ações administrativas."
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 13 — REGRAS DE NEGÓCIO
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "13. Regras de Negócio Críticas")

add_table(doc,
    ["Regra", "Implementação"],
    [
        ("Supervisor obrigatório",             "ShareNoSupervisorError lançada se usuário não tem manager_id (exceto cargos auto-aprovados)"),
        ("Aprovação automática por cargo",     "has_auto_approve_job_title() compara job_title (case-insensitive, sem acento) contra AUTO_APPROVE_JOB_TITLES"),
        ("Supervisor só aprova subordinados",  "Validação creator.manager_id == user.id em approve/reject/extend"),
        ("Supervisor sem subordinados bloqueado","No fluxo Entra: supervised_count == 0 bloqueia o login"),
        ("Refresh token rotation",             "Token anterior marcado used=true e revoked=true ao emitir novo"),
        ("OTP com rate limiting",              "5 tentativas → bloqueio temporário de 15 minutos (configurável)"),
        ("Expiração de compartilhamento",      "expires_at definido na aprovação: now + timedelta(hours=expiration_hours)"),
        ("Extensão máxima",                    "Supervisor pode estender no máximo 72h adicionais por operação"),
        ("Revogação de externo",               "deactivate_external_if_no_active_share(): inativa externo sem outros shares ativos"),
        ("Reativação de externo",              "Na aprovação: externo inativo é reativado automaticamente"),
        ("Cleanup de tokens",                  "_cleanup_expired_tokens(): remove tokens expirados/usados periodicamente"),
        ("Fallback de e-mail CAv4",            "Se claims não contiverem e-mail: {user_login}@petrobras.com.br"),
    ],
    col_widths=[6.0, 12.0]
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 14 — TESTES E QUALIDADE
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "14. Testes e Qualidade")

heading_style(doc, 2, "14.1. Front End (Jest)")
body_text(doc, "Testes unitários e de integração dos componentes React e rotas de API (Next.js Route Handlers). Arquivos de teste identificados:")
code_block(doc,
"""app/api/auth/external/request-code/route.test.ts
app/api/auth/external/verify-code/route.test.ts
app/api/auth/internal/callback/route.test.ts
app/api/auth/internal/login/route.test.ts
app/api/auth/internal/logout/route.test.ts
app/api/auth/internal/signup/route.test.ts
app/api/auth/internal/sync-entra/route.test.ts
app/api/auth/forgot-password/route.test.ts
app/api/auth/reset-password/route.test.ts
app/api/auth/login/route.test.ts
app/api/auth/logout/route.test.ts
app/api/auth/refresh/route.test.ts""")

heading_style(doc, 2, "14.2. Back End (Pytest)")
body_text(doc, "Testes unitários e de integração das rotas FastAPI, serviços e models. Executados no pipeline CI antes de cada build de imagem Docker.")

heading_style(doc, 2, "14.3. Padrões de Qualidade")
bullet(doc, "Type hints obrigatórios em Python (Pydantic + mypy)")
bullet(doc, "TypeScript strict mode no Front End")
bullet(doc, "Pull Request template com checklist (.github/pull_request_template.md)")
bullet(doc, "CODEOWNERS configurado (.github/CODEOWNERS)")

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 15 — AMBIENTES
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "15. Ambientes")

add_table(doc,
    ["Parâmetro", "DSV", "TST", "HMG", "PRD"],
    [
        ("AUTH_MODE",                 "local ou cav4",    "cav4",         "cav4",         "cav4"),
        ("STORAGE_PROVIDER",          "local",            "aws",          "aws",           "aws"),
        ("EMAIL_PROVIDER",            "dev (log)",        "smtp_internal","smtp_internal", "smtp_internal"),
        ("MAIL_ROUTE",                "TESTE_TIC",        "TESTE_TIC",    "vazio",         "vazio"),
        ("MIP_PROCESSING_ENABLED",    "false",            "true",         "true",          "true"),
        ("MIP_FAIL_CLOSED",           "false",            "false",        "true",          "true"),
        ("GRAPH_REQUIRED",            "false",            "false",        "true",          "true"),
        ("SEED_ON_STARTUP",           "true",             "false",        "false",         "false"),
        ("Banco de Dados",            "PostgreSQL local / Neon","Aurora DSV","Aurora HMG", "Aurora PRD"),
        ("S3 Bucket",                 "N/A (local)",      "scac-dsv",     "scac-hmg",      "scac-prd"),
    ],
    col_widths=[5.0, 3.0, 3.0, 3.0, 4.0]
)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════════
# SEÇÃO 16 — GLOSSÁRIO
# ══════════════════════════════════════════════════════════════════════════════

heading_style(doc, 1, "16. Glossário")

add_table(doc,
    ["Termo", "Definição"],
    [
        ("SCAC",              "Solução de Compartilhamento de Arquivos Confidenciais — nome do sistema"),
        ("A12022",            "Código interno do projeto na Petrobras"),
        ("CAv4",              "Central de Autenticação versão 4 — IdP corporativo OIDC/OAuth 2.0 da Petrobras"),
        ("Entra ID",          "Microsoft Azure Active Directory (modo de autenticação legado)"),
        ("MIP",               "Microsoft Information Protection — framework de rótulos de confidencialidade"),
        ("Purview",           "Microsoft Purview — plataforma de governança de dados que inclui o MIP"),
        ("PKCE",              "Proof Key for Code Exchange (RFC 7636) — extensão OAuth 2.0 para SPAs"),
        ("JWKS",              "JSON Web Key Set — conjunto de chaves públicas para validação de JWTs RS256"),
        ("OTP",               "One-Time Password — código numérico de uso único enviado por e-mail"),
        ("BFF",               "Backend For Frontend — o Next.js atua como proxy entre o browser e o Back End"),
        ("ECS",               "Amazon Elastic Container Service — orquestrador de contêineres AWS"),
        ("SSM",               "AWS Systems Manager Parameter Store — armazenamento de configurações"),
        ("Aurora",            "Amazon Aurora PostgreSQL — banco relacional gerenciado Multi-AZ"),
        ("Presigned URL",     "URL pré-assinada do S3 com TTL, permitindo acesso direto sem credenciais"),
        ("Supervisor",        "Colaborador com permissão de aprovação sobre os compartilhamentos de sua equipe"),
        ("Share",             "Entidade que representa uma solicitação de compartilhamento com um externo"),
        ("Auto-aprovação",    "Compartilhamentos criados por cargos elevados são aprovados sem intervenção"),
        ("Refresh Rotation",  "Estratégia em que cada uso do refresh token gera um novo, invalidando o anterior"),
        ("structlog",         "Biblioteca de logging estruturado em JSON, usada no Back End em produção"),
        ("Alembic",           "Ferramenta de migração de banco de dados para SQLAlchemy/SQLModel"),
        ("ServiceNow",        "Plataforma ITSM da Petrobras para abertura de chamados de cadastro de externos"),
        ("RBAC",              "Role-Based Access Control — controle de acesso baseado em perfis/papéis"),
        ("IAM Role",          "AWS Identity and Access Management Role — permissões da Task ECS no AWS"),
        ("Fargate",           "Modo serverless do ECS — sem necessidade de gerenciar servidores EC2"),
    ],
    col_widths=[4.5, 13.5]
)

# ─── Salva o arquivo ──────────────────────────────────────────────────────────
doc.save(OUTPUT)
print(f"Documento gerado com sucesso: {OUTPUT}")
