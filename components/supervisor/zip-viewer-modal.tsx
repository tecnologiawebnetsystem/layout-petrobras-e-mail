"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Folder } from "lucide-react"

interface ZipFile {
  name: string
  size: number
  isFolder: boolean
  path: string
}

interface ZipViewerModalProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  fileUrl?: string
  fileBlob?: Blob
}

const MOCK_ZIP_CONTENTS: ZipFile[] = [
  { name: "documentos", size: 0, isFolder: true, path: "documentos/" },
  { name: "Relatorio_Anual_2023.pdf", size: 12800000, isFolder: false, path: "documentos/Relatorio_Anual_2023.pdf" },
  { name: "Contrato_Fornecedor.pdf", size: 2450000, isFolder: false, path: "documentos/Contrato_Fornecedor.pdf" },
  { name: "planilhas", size: 0, isFolder: true, path: "planilhas/" },
  { name: "Orcamento_2024.xlsx", size: 3200000, isFolder: false, path: "planilhas/Orcamento_2024.xlsx" },
  { name: "Despesas_Janeiro.xlsx", size: 1850000, isFolder: false, path: "planilhas/Despesas_Janeiro.xlsx" },
  { name: "imagens", size: 0, isFolder: true, path: "imagens/" },
  { name: "logo_petrobras.png", size: 450000, isFolder: false, path: "imagens/logo_petrobras.png" },
  { name: "grafico_producao.png", size: 850000, isFolder: false, path: "imagens/grafico_producao.png" },
]

export function ZipViewerModal({ isOpen, onClose, fileName }: ZipViewerModalProps) {
  const [files] = useState<ZipFile[]>(MOCK_ZIP_CONTENTS)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "-"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#00A99D]" />
            Conteúdo do arquivo ZIP
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{fileName}</p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="space-y-2 overflow-y-auto max-h-[calc(80vh-200px)] pr-2">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <span className="text-sm font-medium text-foreground">
                {files.filter((f) => !f.isFolder).length} arquivo(s) encontrado(s)
              </span>
            </div>

            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {file.isFolder ? (
                    <Folder className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  ) : (
                    <FileText className="h-5 w-5 text-[#00A99D] flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    {!file.isFolder && file.path !== file.name && (
                      <p className="text-xs text-muted-foreground truncate">{file.path}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground ml-4 flex-shrink-0">{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
