"use client"

import type React from "react"
import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useWorkflowStore } from "@/lib/stores/workflow-store"
import { DragDropZone } from "@/components/upload/drag-drop-zone"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { NotificationModal } from "@/components/shared/notification-modal"
import { Lock, Send, Sparkles, Clock, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UploadSuccessModal } from "@/components/upload/upload-success-modal"

export function SupervisorUploadForm() {
  const { user } = useAuthStore()
  const { addUpload } = useWorkflowStore()
  const [recipient, setRecipient] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [expirationHours, setExpirationHours] = useState<number>(168)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
  }>({
    show: false,
    type: "info",
    title: "",
    message: "",
  })

  const [uploadSuccessData, setUploadSuccessData] = useState<{
    name: string
    recipient: string
    files: Array<{ name: string; size: string; type: string }>
    expirationHours: number
    senderEmail: string
  } | null>(null)

  // O supervisor do supervisor (gerente do gerente)
  const supervisorDoSupervisor = user?.manager

  const handleFilesSelected = async (newFiles: File[]) => {
    const dangerousExtensions = [".exe", ".dll", ".bat", ".cmd", ".com", ".msi", ".scr", ".vbs", ".ps1", ".sh"]
    const blockedFiles: string[] = []

    for (const file of newFiles) {
      const extension = "." + file.name.split(".").pop()?.toLowerCase()
      if (dangerousExtensions.includes(extension)) {
        blockedFiles.push(file.name)
      }
    }

    if (blockedFiles.length > 0) {
      setNotification({
        show: true,
        type: "error",
        title: "Arquivos Bloqueados por Segurança",
        message: `Os seguintes arquivos não podem ser enviados por motivos de segurança: ${blockedFiles.join(", ")}. Extensões bloqueadas: .exe, .dll, .bat, .cmd, .com, .msi, .scr, .vbs, .ps1, .sh`,
      })
      return
    }

    setFiles((prev) => [...prev, ...newFiles])
  }

  const handleFileRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!recipient) {
      setNotification({
        show: true,
        type: "warning",
        title: "Campo obrigatório",
        message: "Por favor, informe o destinatário.",
      })
      return
    }

    if (files.length === 0) {
      setNotification({
        show: true,
        type: "warning",
        title: "Nenhum arquivo",
        message: "Por favor, selecione pelo menos um arquivo.",
      })
      return
    }

    if (!description) {
      setNotification({
        show: true,
        type: "warning",
        title: "Campo obrigatório",
        message: "Por favor, descreva o conteúdo dos arquivos.",
      })
      return
    }

    setIsLoading(true)

    try {
      const uploadData = {
        name: description.substring(0, 50),
        sender: {
          id: user!.id,
          name: user!.name,
          email: user!.email,
        },
        recipient,
        description,
        files: files.map((f) => ({
          name: f.name,
          size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
          type: f.name.split(".").pop()?.toUpperCase() || "FILE",
        })),
        expirationHours,
        // Marca que foi enviado por um supervisor
        sentBySupervisor: true,
        // O aprovador será o supervisor do supervisor
        approver: supervisorDoSupervisor ? {
          id: supervisorDoSupervisor.id,
          name: supervisorDoSupervisor.name,
          email: supervisorDoSupervisor.email,
        } : null,
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))

      addUpload({ ...uploadData, rawFiles: files })

      setUploadSuccessData({
        name: uploadData.name,
        recipient: uploadData.recipient,
        files: uploadData.files,
        expirationHours: uploadData.expirationHours,
        senderEmail: user!.email,
      })

      setShowSuccess(true)

      setTimeout(() => {
        setRecipient("")
        setDescription("")
        setFiles([])
        setExpirationHours(168)
        setShowSuccess(false)
      }, 1000)
    } catch (error) {
      setNotification({
        show: true,
        type: "error",
        title: "Erro ao enviar arquivos",
        message: "Ocorreu um erro. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-xl border p-8 space-y-6">
      <div className="flex items-center gap-4 mb-3">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#00A99D] to-[#0047BB] flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground leading-tight">Compartilhar Arquivos</h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Envie documentos para destinatários externos com segurança
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Aprovador - Supervisor do Supervisor */}
        {supervisorDoSupervisor ? (
          <div className="bg-muted/30 border border-border/50 rounded-xl p-5 space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#0047BB]" />
              Aprovador Automático
            </Label>
            <div className="bg-background/50 rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{supervisorDoSupervisor.name}</p>
                  <p className="text-sm text-muted-foreground">{supervisorDoSupervisor.email}</p>
                  {supervisorDoSupervisor.jobTitle && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Cargo:</span> {supervisorDoSupervisor.jobTitle}
                    </p>
                  )}
                </div>
                <div className="px-3 py-1.5 bg-[#0047BB]/10 text-[#0047BB] rounded-full text-xs font-medium">
                  Seu Superior
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Como você é um supervisor, este compartilhamento será enviado para aprovação do seu superior hierárquico.
            </p>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 space-y-2">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-amber-800 dark:text-amber-500">Superior não identificado</p>
                <p className="text-sm text-amber-700 dark:text-amber-600 leading-relaxed">
                  Não foi possível identificar seu superior hierárquico. Você pode continuar com o
                  compartilhamento, mas recomendamos entrar em contato com o RH ou TI para atualizar seu cadastro.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Label htmlFor="recipient" className="text-base font-medium flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#00A99D]" />
            Destinatário Externo
          </Label>
          <Input
            id="recipient"
            type="email"
            placeholder="cliente@empresa.com"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
          />
          <p className="text-sm text-muted-foreground leading-relaxed">
            O destinatário receberá um email com link seguro para download
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">Anexar Arquivos</Label>
          <DragDropZone
            onFilesSelected={handleFilesSelected}
            selectedFiles={files}
            onRemoveFile={handleFileRemove}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="expiration" className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#FDB913]" />
            Tempo de Disponibilidade
          </Label>
          <Select value={expirationHours.toString()} onValueChange={(v) => setExpirationHours(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24">24 horas (1 dia)</SelectItem>
              <SelectItem value="48">48 horas (2 dias)</SelectItem>
              <SelectItem value="168">168 horas (7 dias)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Os arquivos ficarão disponíveis para download por {expirationHours} horas após a aprovação.
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="description" className="text-base font-medium">
            Descrição do Envio (obrigatório)
          </Label>
          <Textarea
            id="description"
            placeholder="Descreva o conteúdo e a finalidade dos arquivos..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px] resize-none text-base"
            required
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isLoading || showSuccess}
            size="lg"
            className="bg-gradient-to-r from-[#00A99D] to-[#0047BB] hover:from-[#008A81] hover:to-[#003A99] text-white font-semibold px-10 text-base shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            )}
            {showSuccess && <Sparkles className="h-5 w-5 mr-2" />}
            <Send className="h-5 w-5 mr-2" />
            {isLoading ? "Enviando..." : showSuccess ? "Enviado!" : "Enviar para Aprovação"}
          </Button>
        </div>
      </form>

      <NotificationModal
        open={notification.show}
        onOpenChange={(show) => setNotification({ ...notification, show })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
      
      {uploadSuccessData && (
        <UploadSuccessModal
          open={uploadSuccessData !== null}
          onOpenChange={(open) => {
            if (!open) setUploadSuccessData(null)
          }}
          uploadData={uploadSuccessData}
        />
      )}
    </div>
  )
}
