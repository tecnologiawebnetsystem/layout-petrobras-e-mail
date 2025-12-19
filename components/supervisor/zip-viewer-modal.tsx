"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Folder, AlertCircle, Loader2 } from "lucide-react"
import JSZip from "jszip"

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

export function ZipViewerModal({ isOpen, onClose, fileName, fileUrl, fileBlob }: ZipViewerModalProps) {
  const [files, setFiles] = useState<ZipFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const loadZipContents = async () => {
      setLoading(true)
      setError(null)

      try {
        console.log("[v0] Carregando ZIP real:", { fileName, hasBlob: !!fileBlob, hasUrl: !!fileUrl })

        let zipData: Blob | null = null

        if (fileBlob) {
          zipData = fileBlob
          console.log("[v0] Usando blob fornecido")
        } else if (fileUrl) {
          console.log("[v0] Buscando ZIP da URL:", fileUrl)
          const response = await fetch(fileUrl)
          if (!response.ok) throw new Error(`Falha ao buscar arquivo: ${response.statusText}`)
          zipData = await response.blob()
        }

        if (!zipData) {
          throw new Error("Nenhum arquivo ZIP disponível")
        }

        const zip = await JSZip.loadAsync(zipData)
        const zipFiles: ZipFile[] = []

        zip.forEach((relativePath, zipEntry) => {
          zipFiles.push({
            name: zipEntry.name.split("/").pop() || zipEntry.name,
            size: zipEntry.dir ? 0 : zipEntry._data?.uncompressedSize || 0,
            isFolder: zipEntry.dir,
            path: relativePath,
          })
        })

        console.log("[v0] Arquivos encontrados no ZIP:", zipFiles.length)
        setFiles(zipFiles)
      } catch (err) {
        console.error("[v0] Erro ao ler ZIP:", err)
        setError(err instanceof Error ? err.message : "Erro ao ler arquivo ZIP")
      } finally {
        setLoading(false)
      }
    }

    loadZipContents()
  }, [isOpen, fileName, fileUrl, fileBlob])

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
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#00A99D]" />
              <span className="ml-3 text-muted-foreground">Lendo conteúdo do ZIP...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">Erro ao ler arquivo ZIP</p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && files.length > 0 && (
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
          )}

          {!loading && !error && files.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Nenhum arquivo encontrado no ZIP</p>
            </div>
          )}
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
