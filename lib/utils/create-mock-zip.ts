import JSZip from "jszip"

export async function createMockZipFile(): Promise<{ url: string; blob: Blob }> {
  const zip = new JSZip()

  // Adicionar pasta "documentos"
  const docsFolder = zip.folder("documentos")
  if (docsFolder) {
    docsFolder.file(
      "especificacoes_tecnicas.pdf",
      "Conteúdo simulado do PDF de especificações técnicas.\n\nEste é um documento de exemplo.",
    )
    docsFolder.file(
      "requisitos_funcionais.docx",
      "Conteúdo simulado do DOCX de requisitos.\n\nRequisito 1: Sistema deve...\nRequisito 2: Interface deve...",
    )
  }

  // Adicionar pasta "planilhas"
  const sheetFolder = zip.folder("planilhas")
  if (sheetFolder) {
    sheetFolder.file(
      "orcamento_2024.xlsx",
      "Conteúdo simulado da planilha de orçamento.\n\nItem 1, Valor 1\nItem 2, Valor 2",
    )
    sheetFolder.file("cronograma.xlsx", "Conteúdo simulado do cronograma.\n\nFase 1: Jan-Mar\nFase 2: Abr-Jun")
  }

  // Adicionar arquivos na raiz
  zip.file(
    "README.txt",
    "DOCUMENTAÇÃO TÉCNICA Q4 2024\n\nEste pacote contém:\n- Especificações técnicas\n- Requisitos funcionais\n- Orçamento e cronograma\n\nPetrobras © 2025",
  )
  zip.file(
    "INSTRUCOES.txt",
    "INSTRUÇÕES DE USO\n\n1. Leia o README primeiro\n2. Revise as especificações em /documentos\n3. Valide os orçamentos em /planilhas",
  )

  // Gerar o ZIP em formato blob
  const blob = await zip.generateAsync({ type: "blob" })

  // Criar URL do blob
  const url = URL.createObjectURL(blob)

  return { url, blob }
}
