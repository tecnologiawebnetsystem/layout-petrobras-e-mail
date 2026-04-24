"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useAuditLogStore } from "@/lib/stores/audit-log-store"
import { AppHeader } from "@/components/shared/app-header"
import { DocumentCard } from "@/components/download/document-card"
import { MetricsDashboard } from "@/components/dashboard/metrics-dashboard"
import type { FileDetail } from "@/components/dashboard/metric-detail-modal"
import { SecurityVerificationModal } from "@/components/download/security-verification-modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Search, AlertTriangle, Clock } from "lucide-react"
import { NotificationModal } from "@/components/shared/notification-modal"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
import type { Document } from "@/types/download"

interface ShareFileResponse {
  id: number
  name: string
  size: string
  type: string
  downloaded: boolean
  downloaded_at: string | null
}

interface ShareResponse {
  id: number
  name: string
  sender: { name: string; email: string | null; department: string | null }
  files: ShareFileResponse[]
  expires_at: string | null
  remaining_time: number
}

export default function DownloadPage() {
  const { user, isAuthenticated, accessToken } = useAuthStore()
  const router = useRouter()

  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(true)
  const [filesError, setFilesError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    show: boolean
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
  }>({ show: false, type: "info", title: "", message: "" })
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [filterType, setFilterType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [securityModal, setSecurityModal] = useState({ show: false, documentId: "", documentName: "" })

  // Redireciona se não for usuário externo autenticado
  useEffect(() => {
    if (!isAuthenticated || user?.userType !== "external") {
      router.push("/")
    }
  }, [isAuthenticated, user, router])

  // Carrega os arquivos compartilhados com o usuário via API real
  useEffect(() => {
    if (!isAuthenticated || user?.userType !== "external" || !accessToken) return

    setIsLoadingFiles(true)
    setFilesError(null)

    fetch("/api/download/files", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const shares: ShareResponse[] = data.files ?? []
        const docs: Document[] = shares.flatMap((share) =>
          (share.files ?? []).map((file) => ({
            id: String(file.id),
            name: file.name,
            sender: share.sender?.name ?? "Desconhecido",
            date: share.expires_at
              ? new Date(share.expires_at).toLocaleDateString("pt-BR")
              : new Date().toLocaleDateString("pt-BR"),
            size: file.size,
            type: file.type?.split("/").pop()?.toLowerCase() ?? "unknown",
            downloaded: file.downloaded,
            downloadedAt: file.downloaded_at
              ? new Date(file.downloaded_at).toLocaleString("pt-BR")
              : undefined,
            downloadCount: file.downloaded ? 1 : 0,
            expiresAt: share.expires_at ?? undefined,
          }))
        )
        setDocuments(docs)
      })
      .catch((err) => {
        // console.error("[DownloadPage] Erro ao buscar arquivos:", err)
        setFilesError("Não foi possível carregar os arquivos. Tente novamente.")
      })
      .finally(() => setIsLoadingFiles(false))
  }, [isAuthenticated, user?.userType, accessToken])

  const availableDocuments = documents.filter((doc) => {
    const isExpired = doc.expiresAt && new Date(doc.expiresAt) < new Date()
    return !isExpired
  })

  const stats = {
    totalReceived: availableDocuments.length,
    downloaded: availableDocuments.filter((d) => d.downloaded).length,
    pending: availableDocuments.filter((d) => !d.downloaded).length,
    expired: 0,
  }

  const documentFiles: FileDetail[] = availableDocuments.map((doc) => ({
    id: doc.id,
    name: doc.name,
    size: doc.size,
    date: doc.downloadedAt ?? doc.date,
    recipient: doc.sender,
    status: doc.downloaded ? "downloaded" : "pending",
  }))

  const filteredDocuments = availableDocuments.filter((doc) => {
    if (filterStatus === "downloaded" && !doc.downloaded) return false
    if (filterStatus === "pending" && doc.downloaded) return false

    return true
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const availableDocs = filteredDocuments.filter((doc) => !doc.downloaded).map((doc) => doc.id)
      setSelectedDocs(availableDocs)
    } else {
      setSelectedDocs([])
    }
  }

  const handleSelectDoc = (docId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocs((prev) => [...prev, docId])
    } else {
      setSelectedDocs((prev) => prev.filter((id) => id !== docId))
    }
  }

  const handleDownloadSelected = async () => {
    if (selectedDocs.length === 0) {
      setNotification({
        show: true,
        type: "warning",
        title: "Nenhum documento selecionado",
        message: "Por favor, selecione pelo menos um documento para download.",
      })
      return
    }

    setNotification({
      show: true,
      type: "info",
      title: "Iniciando downloads...",
      message: `Processando ${selectedDocs.length} documento(s).`,
    })

    let successCount = 0
    let errorCount = 0

    for (const docId of selectedDocs) {
      const doc = documents.find((d) => d.id === docId)
      if (!doc) continue

      try {
        const res = await fetch(`/api/download/files/${docId}/url`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error((errorData as { message?: string }).message || "Erro ao obter URL de download")
        }

        const data = await res.json() as { download_url: string }
        const a = document.createElement("a")
        a.href = data.download_url
        a.download = doc.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        setDocuments((prev) =>
          prev.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  downloaded: true,
                  downloadedAt: new Date().toLocaleString("pt-BR"),
                  downloadCount: d.downloadCount + 1,
                }
              : d,
          ),
        )
        successCount++
      } catch (err) {
        // console.error(`[DownloadPage] Erro ao baixar arquivo ${docId}:`, err)
        errorCount++
      }
    }

    setSelectedDocs([])

    if (errorCount === 0) {
      setNotification({
        show: true,
        type: "success",
        title: "Downloads concluídos!",
        message: `${successCount} documento(s) baixado(s) com sucesso.`,
      })
    } else if (successCount === 0) {
      setNotification({
        show: true,
        type: "error",
        title: "Falha nos downloads",
        message: "Não foi possível baixar os documentos. Tente novamente.",
      })
    } else {
      setNotification({
        show: true,
        type: "warning",
        title: "Downloads parciais",
        message: `${successCount} baixado(s) com sucesso, ${errorCount} com falha.`,
      })
    }
  }

  const handleDownloadSingle = (docId: string) => {
    const doc = documents.find((d) => d.id === docId)
    if (!doc) return

    setSecurityModal({
      show: true,
      documentId: doc.id,
      documentName: doc.name,
    })
  }

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null

    const expiration = new Date(expiresAt)
    const now = new Date()
    const diff = expiration.getTime() - now.getTime()

    if (diff <= 0) return "Expirado"

    const totalHours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(totalHours / 24)
    const hours = totalHours % 24

    if (days > 0 && hours > 0)
      return `${days} dia${days > 1 ? "s" : ""} e ${hours} hora${hours > 1 ? "s" : ""} restante${days > 1 || hours > 1 ? "s" : ""}`
    if (days > 0) return `${days} dia${days > 1 ? "s" : ""} restante${days > 1 ? "s" : ""}`
    if (hours > 0) return `${hours} hora${hours > 1 ? "s" : ""} restante${hours > 1 ? "s" : ""}`
    return "Menos de 1 hora"
  }

  const handleSecurityVerified = async (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId)
    if (!doc) return

    try {
      const res = await fetch(`/api/download/files/${documentId}/url`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error((errorData as { message?: string }).message || "Erro ao obter URL de download")
      }

      const data = await res.json() as { download_url: string; file_name: string }

      // Inicia o download real via link temporário
      const a = document.createElement("a")
      a.href = data.download_url
      a.download = data.file_name ?? doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Atualiza estado somente após sucesso da API
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === documentId
            ? {
                ...d,
                downloaded: true,
                downloadedAt: new Date().toLocaleString("pt-BR"),
                downloadCount: d.downloadCount + 1,
              }
            : d,
        ),
      )

      if (user) {
        useAuditLogStore.getState().addLog({
          action: "download",
          level: "success",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            type: user.userType,
          },
          details: {
            targetId: documentId,
            targetName: doc.name,
            description: `Download do arquivo "${doc.name}" realizado com sucesso`,
            metadata: {
              sender: doc.sender,
              fileSize: doc.size,
              fileType: doc.type,
              downloadCount: doc.downloadCount + 1,
            },
          },
        })
      }

      setSecurityModal({ show: false, documentId: "", documentName: "" })
      setNotification({
        show: true,
        type: "success",
        title: "Download iniciado!",
        message: `O documento "${doc.name}" foi baixado com sucesso.`,
      })
    } catch (err) {
      // console.error("[DownloadPage] Erro ao baixar arquivo:", err)
      setSecurityModal({ show: false, documentId: "", documentName: "" })
      setNotification({
        show: true,
        type: "error",
        title: "Erro no download",
        message: err instanceof Error ? err.message : "Não foi possível realizar o download. Tente novamente.",
      })
    }
  }

  const handleNotificationClose = (show: boolean) => {
    setNotification({ ...notification, show })
  }

  if (!isAuthenticated || user?.userType !== "external") {
    return null
  }

  if (isLoadingFiles) {
    return (
      <div className="min-h-screen bg-muted/30">
        <AppHeader subtitle="Solução de Compartilhamento de Arquivos Confidenciais" />
        <main className="container max-w-7xl mx-auto px-6 py-12 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-10 w-10 border-4 border-[#0047BB] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Carregando seus arquivos...</p>
          </div>
        </main>
      </div>
    )
  }

  if (filesError) {
    return (
      <div className="min-h-screen bg-muted/30">
        <AppHeader subtitle="Solução de Compartilhamento de Arquivos Confidenciais" />
        <main className="container max-w-7xl mx-auto px-6 py-12 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-foreground font-semibold">{filesError}</p>
            <Button onClick={() => window.location.reload()} variant="outline">Tentar novamente</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader subtitle="Solução de Compartilhamento de Arquivos Confidenciais" />

      <main className="container max-w-7xl mx-auto px-6 py-12 pb-20 space-y-10">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">Documentos Aprovados para Download</h1>

          <div className="flex items-start gap-4 bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-400 p-5 rounded">
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-100 text-base">
                Aviso de Confidencialidade:
              </p>
              <p className="text-yellow-800 dark:text-yellow-200 text-base leading-relaxed">
                Os documentos listados abaixo são confidenciais e destinados exclusivamente ao destinatário. A
                reprodução ou distribuição não autorizada é estritamente proibida. Todos os downloads são registrados.
              </p>
            </div>
          </div>
        </div>

        <MetricsDashboard
          total={stats.totalReceived}
          pending={stats.pending}
          approved={stats.downloaded}
          rejected={stats.expired}
          userType="external"
          files={documentFiles}
        />

        {availableDocuments.length === 0 ? (
          <div className="bg-card rounded-lg border p-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                <Download className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Nenhum Arquivo Disponível</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                No momento, você não possui arquivos aprovados para download. Quando novos arquivos forem compartilhados
                com você e aprovados pelo supervisor, eles aparecerão aqui.
              </p>
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Atualizar Página
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-card rounded-lg border p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome do arquivo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="downloaded">Baixados</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Remetente</SelectItem>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="size">Tamanho</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de Arquivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">DOCX</SelectItem>
                    <SelectItem value="xlsx">XLSX</SelectItem>
                    <SelectItem value="pptx">PPTX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={
                      selectedDocs.length > 0 &&
                      selectedDocs.length === filteredDocuments.filter((d) => !d.downloaded).length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Selecionar Todos Disponíveis
                  </label>
                </div>

                <Button
                  onClick={handleDownloadSelected}
                  disabled={selectedDocs.length === 0}
                  className="bg-[#0047BB] hover:bg-[#003A99]"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Selecionados ({selectedDocs.length})
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredDocuments.map((doc) => {
                const timeRemaining = getTimeRemaining(doc.expiresAt)

                return (
                  <div key={doc.id} className="relative">
                    <DocumentCard
                      document={doc}
                      isSelected={selectedDocs.includes(doc.id)}
                      onSelect={(checked) => handleSelectDoc(doc.id, checked)}
                      onDownload={() => handleDownloadSingle(doc.id)}
                    />

                    {doc.expiresAt && !doc.downloaded && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 bg-yellow-100 text-yellow-800 border border-yellow-300">
                        <Clock className="h-3 w-3" />
                        {timeRemaining}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {filteredDocuments.length} de {availableDocuments.length} documentos
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Anterior
                </Button>
                <Button variant="outline" size="sm">
                  Próximo
                </Button>
              </div>
            </div>
          </>
        )}

        <div className="text-center text-sm text-muted-foreground border-t pt-12 mt-12">
          © 2025 Petrobras. Todos os direitos reservados. | Política de Privacidade
        </div>
      </main>

      <ScrollToTop />

      <SecurityVerificationModal
        open={securityModal.show}
        onOpenChange={(show) => setSecurityModal({ ...securityModal, show })}
        documentName={securityModal.documentName}
        requiresPassword={false}
        onVerified={() => handleSecurityVerified(securityModal.documentId)}
      />

      <NotificationModal
        open={notification.show}
        onOpenChange={handleNotificationClose}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  )
}
