"use client"

import { AlertTriangle, FileWarning, Shield, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { getBlockedExtensionCategory } from "@/lib/utils/zip-validator"

interface ZipValidationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileName: string
  blockedFiles: string[]
  totalFiles: number
}

export function ZipValidationModal({
  open,
  onOpenChange,
  fileName,
  blockedFiles,
  totalFiles,
}: ZipValidationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl">Arquivo Bloqueado por Segurança</DialogTitle>
              <DialogDescription>Extensões perigosas detectadas no arquivo ZIP</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-destructive mb-1">Validação de Segurança Falhou</h4>
                <p className="text-sm text-muted-foreground">
                  O arquivo <span className="font-medium text-foreground">{fileName}</span> contém{" "}
                  <span className="font-bold text-destructive">{blockedFiles.length}</span> arquivo(s) com extensões
                  bloqueadas de um total de {totalFiles} arquivo(s).
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <FileWarning className="h-4 w-4" />
                Arquivos Bloqueados
              </h4>
              <Badge variant="destructive">{blockedFiles.length}</Badge>
            </div>

            <ScrollArea className="h-[200px] rounded-lg border bg-muted/30 p-4">
              <div className="space-y-2">
                {blockedFiles.map((file, index) => {
                  const extension = "." + file.split(".").pop()?.toLowerCase()
                  const category = getBlockedExtensionCategory(extension)

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-background rounded-lg border border-destructive/20"
                    >
                      <X className="h-4 w-4 text-destructive flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file}</p>
                        <p className="text-xs text-muted-foreground">Categoria: {category}</p>
                      </div>
                      <Badge variant="destructive" className="flex-shrink-0">
                        {extension}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Por que isso acontece?
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-6 list-disc">
              <li>Arquivos executáveis (.exe, .bat, .cmd) representam risco de segurança</li>
              <li>Scripts (.sh, .js, .py) podem conter código malicioso</li>
              <li>Esta validação protege tanto remetentes quanto destinatários</li>
              <li>Remova os arquivos bloqueados do ZIP e tente novamente</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)} className="bg-gradient-to-r from-[#00A99D] to-[#0047BB]">
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
