"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Mail, FileCheck, Clock, User } from "lucide-react"

interface UploadSuccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  uploadData: {
    name: string
    recipient: string
    files: Array<{ name: string; size: string; type: string }>
    expirationHours: number
    senderEmail: string
    supervisorName?: string
    supervisorEmail?: string
  }
}

export function UploadSuccessModal({ open, onOpenChange, uploadData }: UploadSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0">
        {/* Header fixo */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
              <div className="relative bg-white/10 backdrop-blur rounded-full p-3">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Upload Realizado com Sucesso!</h2>
              <p className="text-green-50 text-sm">Documento enviado para aprovação</p>
            </div>
          </div>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Resumo do documento */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-start gap-3">
              <FileCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">Documento</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{uploadData.name}</p>
              </div>
            </div>
          </div>

          {/* Grid de informações */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-gray-600" />
                <p className="font-semibold text-xs text-gray-600 dark:text-gray-400">Destinatário</p>
              </div>
              <p className="text-sm font-medium truncate">{uploadData.recipient}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-600" />
                <p className="font-semibold text-xs text-gray-600 dark:text-gray-400">Validade após aprovação</p>
              </div>
              <p className="text-sm font-medium">{uploadData.expirationHours} horas</p>
            </div>
          </div>

          {/* Notificações enviadas */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2 mb-3">
              <Mail className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">E-mails Enviados</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">Notificações automáticas foram disparadas</p>
              </div>
            </div>

            <div className="space-y-2">
              {/* E-mail para você (remetente) */}
              <div className="flex items-start gap-2 text-sm">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                    Confirmação enviada para você:
                  </p>
                  <p className="font-semibold text-amber-800 dark:text-amber-200 break-all">{uploadData.senderEmail}</p>
                </div>
              </div>

              {/* E-mail para supervisor */}
              <div className="flex items-start gap-2 text-sm">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-100">Notificação para supervisor:</p>
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    {uploadData.supervisorName || "Supervisor"}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {uploadData.supervisorEmail || "supervisor@petrobras.com.br"}
                  </p>
                </div>
              </div>

              {/* Destinatário */}
              <div className="flex items-start gap-2 text-sm pt-2 border-t border-amber-200 dark:border-amber-800">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                    Destinatário receberá após aprovação:
                  </p>
                  <p className="font-semibold text-amber-800 dark:text-amber-200">{uploadData.recipient}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    ⚠️ O link para download será enviado somente após aprovação do supervisor
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de arquivos */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border">
            <p className="font-semibold text-sm mb-2 flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Arquivos no pacote ({uploadData.files.length})
            </p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {uploadData.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white dark:bg-gray-900 rounded p-2 text-xs border"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="bg-blue-100 dark:bg-blue-900/30 rounded p-1">
                      <FileCheck className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="font-medium truncate">{file.name}</span>
                  </div>
                  <span className="text-muted-foreground ml-2">{file.size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer fixo com botão */}
        <div className="border-t p-4 bg-gray-50 dark:bg-gray-900/50">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-5"
          >
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
