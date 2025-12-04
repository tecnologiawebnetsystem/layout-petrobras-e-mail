"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { AppHeader } from "@/components/shared/app-header"
import { FileUploadZone } from "@/components/upload/file-upload-zone"
import { FileList } from "@/components/upload/file-list"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { NotificationModal } from "@/components/shared/notification-modal"
import { TagSelector } from "@/components/tags/tag-selector"
import { Lock } from "lucide-react"

export default function UploadPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [recipient, setRecipient] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
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
      // TODO: Integrar com API Python
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setNotification({
        show: true,
        type: "success",
        title: "Arquivos enviados com sucesso!",
        message: `${files.length} arquivo(s) enviado(s) para ${recipient} com ${selectedTags.length} tag(s)`,
      })

      setRecipient("")
      setDescription("")
      setFiles([])
      setSelectedTags([])
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
    <div className="min-h-screen bg-background">
      <AppHeader subtitle="Módulo de Upload" />

      <main className="container max-w-4xl mx-auto px-6 py-8">
        <div className="bg-card rounded-xl shadow-sm border p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Upload de Arquivos para Clientes</h1>
            <p className="text-muted-foreground">Envie documentos de forma segura para destinatários externos.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-sm font-medium">
                Destinatário
              </Label>
              <div className="relative">
                <Input
                  id="recipient"
                  type="email"
                  placeholder="sistema.interno@petrobras.com.br"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="h-11 pr-10"
                  required
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Arquivos</Label>
              <FileUploadZone onFilesSelected={handleFilesSelected} />
            </div>

            {files.length > 0 && <FileList files={files} onRemove={handleFileRemove} />}

            <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} />

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição (obrigatório)
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

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} size="lg" className="bg-[#0047BB] hover:bg-[#003A99]">
                {isLoading ? "Enviando..." : "Enviar Arquivos"}
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
