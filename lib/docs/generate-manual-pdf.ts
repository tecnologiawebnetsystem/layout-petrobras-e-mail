// Gerador do PDF do Manual do Usuario do SCAC.
// Usa jsPDF (client-side). O conteudo vem de lib/docs/manual-content.ts,
// garantindo que o PDF e a pagina online fiquem sempre em sincronia.
//
// Recursos do PDF:
//   - Cabecalho com o logo da Petrobras em todas as paginas
//   - Marca d'agua "PETROBRAS - CONFIDENCIAL" em diagonal em cada pagina
//   - Rodape com paginacao e identificacao do documento
//   - Texto selecionavel (nao e imagem)

import { jsPDF } from "jspdf"
import { MANUAL, type ManualBlock } from "./manual-content"

// Paleta (RGB)
const COLOR_PRIMARY: [number, number, number] = [0, 138, 68] // verde Petrobras
const COLOR_ACCENT: [number, number, number] = [0, 90, 158] // azul Petrobras
const COLOR_TEXT: [number, number, number] = [33, 37, 41]
const COLOR_MUTED: [number, number, number] = [107, 114, 128]
const COLOR_BORDER: [number, number, number] = [222, 226, 230]
const COLOR_TABLE_HEAD: [number, number, number] = [0, 138, 68]
const COLOR_TABLE_ZEBRA: [number, number, number] = [242, 247, 244]

// Geometria da pagina (A4 em mm)
const PAGE_W = 210
const PAGE_H = 297
const MARGIN_X = 18
const HEADER_H = 26
const FOOTER_H = 16
const CONTENT_TOP = HEADER_H + 6
const CONTENT_BOTTOM = PAGE_H - FOOTER_H - 4
const CONTENT_W = PAGE_W - MARGIN_X * 2

/** Carrega o logo da Petrobras como dataURL para embutir no PDF. */
async function loadLogoDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src)
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

type DrawState = {
  doc: jsPDF
  y: number
  page: number
  logo: string | null
}

function drawWatermark(doc: jsPDF) {
  doc.saveGraphicsState()
  // @ts-expect-error setGState existe em runtime
  doc.setGState(new doc.GState({ opacity: 0.06 }))
  doc.setTextColor(0, 138, 68)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(54)
  doc.text("PETROBRAS", PAGE_W / 2, PAGE_H / 2 - 6, {
    align: "center",
    angle: 35,
  })
  doc.setFontSize(20)
  doc.text("CONFIDENCIAL", PAGE_W / 2, PAGE_H / 2 + 18, {
    align: "center",
    angle: 35,
  })
  doc.restoreGraphicsState()
}

function drawHeader(state: DrawState) {
  const { doc, logo } = state
  // barra superior
  doc.setFillColor(...COLOR_PRIMARY)
  doc.rect(0, 0, PAGE_W, 3, "F")

  // logo
  if (logo) {
    try {
      doc.addImage(logo, "PNG", MARGIN_X, 7, 12, 12)
    } catch {
      /* ignora falha de imagem */
    }
  }

  const textX = logo ? MARGIN_X + 16 : MARGIN_X
  doc.setTextColor(...COLOR_TEXT)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("Petrobras | Manual do Usuario", textX, 13)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(MANUAL.subtitle, textX, 18)

  // linha divisoria
  doc.setDrawColor(...COLOR_BORDER)
  doc.setLineWidth(0.3)
  doc.line(MARGIN_X, HEADER_H, PAGE_W - MARGIN_X, HEADER_H)
}

function drawFooter(state: DrawState) {
  const { doc, page } = state
  const y = PAGE_H - FOOTER_H + 4
  doc.setDrawColor(...COLOR_BORDER)
  doc.setLineWidth(0.3)
  doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(
    `SCAC - Documento confidencial de uso interno Petrobras - v${MANUAL.version}`,
    MARGIN_X,
    y + 6,
  )
  doc.text(`Pagina ${page}`, PAGE_W - MARGIN_X, y + 6, { align: "right" })
}

function paintPageChrome(state: DrawState) {
  drawWatermark(state.doc)
  drawHeader(state)
  drawFooter(state)
}

function newPage(state: DrawState) {
  state.doc.addPage()
  state.page += 1
  paintPageChrome(state)
  state.y = CONTENT_TOP
}

/** Garante espaco vertical; se nao houver, cria nova pagina. */
function ensureSpace(state: DrawState, needed: number) {
  if (state.y + needed > CONTENT_BOTTOM) {
    newPage(state)
  }
}

function writeWrapped(
  state: DrawState,
  text: string,
  opts: {
    font?: "normal" | "bold" | "italic"
    size?: number
    color?: [number, number, number]
    lineHeight?: number
    indent?: number
    maxWidth?: number
  } = {},
) {
  const {
    font = "normal",
    size = 10,
    color = COLOR_TEXT,
    lineHeight = 5,
    indent = 0,
    maxWidth = CONTENT_W - indent,
  } = opts
  state.doc.setFont("helvetica", font)
  state.doc.setFontSize(size)
  state.doc.setTextColor(...color)
  const lines = state.doc.splitTextToSize(text, maxWidth) as string[]
  for (const line of lines) {
    ensureSpace(state, lineHeight)
    state.doc.text(line, MARGIN_X + indent, state.y)
    state.y += lineHeight
  }
}

function drawSectionTitle(state: DrawState, title: string, summary: string) {
  ensureSpace(state, 22)
  state.y += 4
  // faixa colorida
  state.doc.setFillColor(...COLOR_PRIMARY)
  state.doc.rect(MARGIN_X, state.y - 4, 3, 8, "F")
  writeWrapped(state, title, {
    font: "bold",
    size: 15,
    color: COLOR_ACCENT,
    lineHeight: 7,
    indent: 6,
  })
  if (summary) {
    writeWrapped(state, summary, {
      font: "italic",
      size: 9,
      color: COLOR_MUTED,
      lineHeight: 5,
      indent: 6,
    })
  }
  state.y += 2
  state.doc.setDrawColor(...COLOR_BORDER)
  state.doc.setLineWidth(0.2)
  state.doc.line(MARGIN_X, state.y, PAGE_W - MARGIN_X, state.y)
  state.y += 5
}

function drawBlock(state: DrawState, block: ManualBlock) {
  switch (block.type) {
    case "paragraph":
      writeWrapped(state, block.text, { size: 10, lineHeight: 5.2 })
      state.y += 3
      break

    case "subheading":
      ensureSpace(state, 9)
      state.y += 2
      writeWrapped(state, block.text, {
        font: "bold",
        size: 11,
        color: COLOR_TEXT,
        lineHeight: 6,
      })
      state.y += 1
      break

    case "bullets":
      for (const item of block.items) {
        const startY = state.y
        state.doc.setFillColor(...COLOR_PRIMARY)
        // marcador desenhado depois de sabermos que ha espaco
        ensureSpace(state, 5.2)
        state.doc.circle(MARGIN_X + 1.5, state.y - 1.4, 0.9, "F")
        writeWrapped(state, item, { size: 10, lineHeight: 5.2, indent: 6 })
        if (state.y === startY) state.y += 5.2
        state.y += 1
      }
      state.y += 2
      break

    case "steps":
      block.items.forEach((item, i) => {
        ensureSpace(state, 5.6)
        const badgeY = state.y - 1.6
        state.doc.setFillColor(...COLOR_ACCENT)
        state.doc.circle(MARGIN_X + 2, badgeY, 2.2, "F")
        state.doc.setFont("helvetica", "bold")
        state.doc.setFontSize(7.5)
        state.doc.setTextColor(255, 255, 255)
        state.doc.text(String(i + 1), MARGIN_X + 2, badgeY + 1, {
          align: "center",
        })
        writeWrapped(state, item, { size: 10, lineHeight: 5.4, indent: 8 })
        state.y += 1.5
      })
      state.y += 2
      break

    case "note":
      drawNote(state, block)
      break

    case "table":
      drawTable(state, block.headers, block.rows)
      break
  }
}

function drawNote(
  state: DrawState,
  block: Extract<ManualBlock, { type: "note" }>,
) {
  const labels: Record<string, string> = {
    info: "Informacao",
    warning: "Atencao",
    tip: "Dica",
    important: "Importante",
  }
  const tints: Record<string, [number, number, number]> = {
    info: [232, 240, 254],
    warning: [255, 244, 229],
    tip: [230, 247, 236],
    important: [235, 233, 250],
  }
  const accents: Record<string, [number, number, number]> = {
    info: [0, 90, 158],
    warning: [176, 106, 0],
    tip: [0, 138, 68],
    important: [90, 60, 170],
  }

  const title = block.title ?? labels[block.variant]
  const tint = tints[block.variant]
  const accent = accents[block.variant]

  // pre-calcula altura
  state.doc.setFont("helvetica", "normal")
  state.doc.setFontSize(9.5)
  const innerW = CONTENT_W - 10
  const bodyLines = state.doc.splitTextToSize(block.text, innerW) as string[]
  const boxH = 8 + bodyLines.length * 4.8 + 4

  ensureSpace(state, boxH + 2)

  const boxY = state.y
  state.doc.setFillColor(...tint)
  state.doc.setDrawColor(...accent)
  state.doc.setLineWidth(0.2)
  state.doc.roundedRect(MARGIN_X, boxY, CONTENT_W, boxH, 1.5, 1.5, "FD")
  // barra lateral
  state.doc.setFillColor(...accent)
  state.doc.rect(MARGIN_X, boxY, 1.5, boxH, "F")

  state.doc.setFont("helvetica", "bold")
  state.doc.setFontSize(9.5)
  state.doc.setTextColor(...accent)
  state.doc.text(title, MARGIN_X + 5, boxY + 6)

  state.doc.setFont("helvetica", "normal")
  state.doc.setFontSize(9.5)
  state.doc.setTextColor(...COLOR_TEXT)
  let ty = boxY + 11.5
  for (const line of bodyLines) {
    state.doc.text(line, MARGIN_X + 5, ty)
    ty += 4.8
  }
  state.y = boxY + boxH + 4
}

function drawTable(state: DrawState, headers: string[], rows: string[][]) {
  const cols = headers.length
  const colW = CONTENT_W / cols
  const padX = 2
  const lineH = 4.4

  const rowHeight = (cells: string[], font: "bold" | "normal") => {
    state.doc.setFont("helvetica", font)
    state.doc.setFontSize(8.5)
    let maxLines = 1
    cells.forEach((c) => {
      const l = state.doc.splitTextToSize(c, colW - padX * 2) as string[]
      maxLines = Math.max(maxLines, l.length)
    })
    return maxLines * lineH + 3
  }

  const drawRow = (
    cells: string[],
    font: "bold" | "normal",
    fill: [number, number, number] | null,
    textColor: [number, number, number],
  ) => {
    const h = rowHeight(cells, font)
    ensureSpace(state, h)
    const rowY = state.y
    if (fill) {
      state.doc.setFillColor(...fill)
      state.doc.rect(MARGIN_X, rowY, CONTENT_W, h, "F")
    }
    state.doc.setDrawColor(...COLOR_BORDER)
    state.doc.setLineWidth(0.2)
    state.doc.rect(MARGIN_X, rowY, CONTENT_W, h, "S")
    state.doc.setFont("helvetica", font)
    state.doc.setFontSize(8.5)
    state.doc.setTextColor(...textColor)
    cells.forEach((c, i) => {
      const cx = MARGIN_X + i * colW
      if (i > 0) {
        state.doc.setDrawColor(...COLOR_BORDER)
        state.doc.line(cx, rowY, cx, rowY + h)
      }
      const lines = state.doc.splitTextToSize(c, colW - padX * 2) as string[]
      let cy = rowY + 4
      for (const ln of lines) {
        state.doc.text(ln, cx + padX, cy)
        cy += lineH
      }
    })
    state.y = rowY + h
  }

  ensureSpace(state, 14)
  // cabecalho (repete se a tabela quebrar de pagina seria ideal; aqui mantemos simples)
  drawRow(headers, "bold", COLOR_TABLE_HEAD, [255, 255, 255])
  rows.forEach((r, i) => {
    drawRow(r, "normal", i % 2 === 1 ? COLOR_TABLE_ZEBRA : null, COLOR_TEXT)
  })
  state.y += 5
}

function drawCoverPage(state: DrawState) {
  const { doc, logo } = state
  // fundo superior
  doc.setFillColor(...COLOR_PRIMARY)
  doc.rect(0, 0, PAGE_W, 70, "F")
  doc.setFillColor(...COLOR_ACCENT)
  doc.rect(0, 70, PAGE_W, 4, "F")

  if (logo) {
    try {
      doc.addImage(logo, "PNG", PAGE_W / 2 - 14, 18, 28, 28)
    } catch {
      /* ignora */
    }
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("PETROBRAS", PAGE_W / 2, 58, { align: "center" })

  doc.setTextColor(...COLOR_ACCENT)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(26)
  doc.text(MANUAL.title, PAGE_W / 2, 110, { align: "center" })

  doc.setTextColor(...COLOR_TEXT)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  const sub = doc.splitTextToSize(MANUAL.subtitle, CONTENT_W - 20) as string[]
  let sy = 122
  sub.forEach((l) => {
    doc.text(l, PAGE_W / 2, sy, { align: "center" })
    sy += 7
  })

  // caixa de metadados
  const boxY = 150
  doc.setDrawColor(...COLOR_BORDER)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN_X + 20, boxY, CONTENT_W - 40, 34, 2, 2, "S")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_PRIMARY)
  doc.text(`Versao ${MANUAL.version}`, PAGE_W / 2, boxY + 12, {
    align: "center",
  })
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...COLOR_MUTED)
  doc.setFontSize(9.5)
  doc.text(`Atualizado em ${MANUAL.updatedAt}`, PAGE_W / 2, boxY + 20, {
    align: "center",
  })
  doc.text("Documento confidencial - uso interno", PAGE_W / 2, boxY + 27, {
    align: "center",
  })

  // marca d'agua tambem na capa
  drawWatermark(doc)

  // rodape da capa
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(
    "Petrobras S.A. - Todos os direitos reservados",
    PAGE_W / 2,
    PAGE_H - 14,
    { align: "center" },
  )
}

function drawSummary(state: DrawState) {
  newPage(state)
  writeWrapped(state, "Sumario", {
    font: "bold",
    size: 16,
    color: COLOR_ACCENT,
    lineHeight: 9,
  })
  state.y += 2
  MANUAL.sections.forEach((s) => {
    ensureSpace(state, 6)
    state.doc.setFont("helvetica", "normal")
    state.doc.setFontSize(10.5)
    state.doc.setTextColor(...COLOR_TEXT)
    state.doc.text(s.title, MARGIN_X + 2, state.y)
    state.y += 6
  })
}

/** Gera e dispara o download do PDF do manual. */
export async function generateManualPdf() {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true })
  const logo = await loadLogoDataUrl("/images/petrobras-logo.png")

  const state: DrawState = { doc, y: CONTENT_TOP, page: 1, logo }

  // Capa (pagina 1, sem cabecalho/rodape padrao)
  drawCoverPage(state)

  // Sumario
  drawSummary(state)

  // Conteudo
  MANUAL.sections.forEach((section) => {
    // cada secao comeca em nova pagina para leitura limpa
    newPage(state)
    drawSectionTitle(state, section.title, section.summary)
    section.blocks.forEach((block) => drawBlock(state, block))
  })

  const fileName = `Manual-do-Usuario-SCAC-Petrobras-v${MANUAL.version}.pdf`
  doc.save(fileName)
}
