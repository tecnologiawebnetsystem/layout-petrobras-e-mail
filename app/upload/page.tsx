"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useWorkflowStore } from "@/lib/stores/workflow-store"
import { AppHeader } from "@/components/shared/app-header"
import { DragDropZone } from "@/components/upload/drag-drop-zone"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { NotificationModal } from "@/components/shared/notification-modal"
import { TagSelector } from "@/components/tags/tag-selector"
import { Lock, Send, Sparkles } from "lucide-react"

export default function UploadPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { addUpload } = useWorkflowStore()
  const router = useRouter()
  const [recipient, setRecipient] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium")
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

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== "internal") {
      router.push("/")
    }
  }, [isAuthenticated, user, router])

  const handleFilesSelected = (newFiles: File[]) => {
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
      // Simular envio
      await new Promise((resolve) => setTimeout(resolve, 2000))

      addUpload({
        name: description.substring(0, 50),
        sender: {
          id: user!.id,
          name: user!.name,
          email: user!.email,
        },
        recipient,
        description,
        tags: selectedTags,
        files: files.map((f) => ({
          name: f.name,
          size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
          type: f.name.split(".").pop()?.toUpperCase() || "FILE",
        })),
        priority,
      })

      setShowSuccess(true)
      setNotification({
        show: true,
        type: "success",
        title: "Arquivos enviados com sucesso!",
        message: `${files.length} arquivo(s) enviado(s) para aprovação do supervisor. Você será notificado sobre a decisão.`,
      })

      // Reset form
      setTimeout(() => {
        setRecipient("")
        setDescription("")
        setFiles([])
        setSelectedTags([])
        setShowSuccess(false)
      }, 3000)
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

  if (!isAuthenticated || user?.userType !== "internal") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppHeader subtitle="Módulo de Upload" />

      <main className="container max-w-5xl mx-auto px-6 py-8">
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-xl border p-8 space-y-8 relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#00A99D]/10 to-[#0047BB]/10 rounded-full blur-3xl -z-10" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#00A99D] to-[#0047BB] flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Transferência Segura de Arquivos</h1>
                <p className="text-muted-foreground">Envie documentos para destinatários externos com segurança</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient */}
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#00A99D]" />
                Destinatário Externo
              </Label>
              <Input
                id="recipient"
                type="email"
                placeholder="cliente@empresa.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="h-12 text-base"
                required
              />
              <p className="text-xs text-muted-foreground">
                O destinatário receberá um email com link seguro para download
              </p>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Anexar Arquivos</Label>
              <DragDropZone
                onFilesSelected={handleFilesSelected}
                selectedFiles={files}
                onRemoveFile={handleFileRemove}
              />
            </div>

            {/* Tags */}
            <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} />

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prioridade</Label>
              <div className="flex gap-3">
                {(["high", "medium", "low"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`
                      flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all
                      ${priority === p ? "border-[#0047BB] bg-[#0047BB]/10 text-[#0047BB]" : "border-border hover:border-[#0047BB]/50"}
                    `}
                  >
                    {p === "high" && "Alta"}
                    {p === "medium" && "Média"}
                    {p === "low" && "Baixa"}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição do Envio (obrigatório)
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva o conteúdo e a finalidade dos arquivos..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] resize-none"
                required
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isLoading || showSuccess}
                size="lg"
                className="bg-gradient-to-r from-[#00A99D] to-[#0047BB] hover:from-[#008A81] hover:to-[#003A99] text-white font-semibold px-8"
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
        </div>
      </main>

      <NotificationModal
        open={notification.show}
        onOpenChange={(show) => setNotification({ ...notification, show })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  )
}
