"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useWorkflowStore } from "@/lib/stores/workflow-store"
import { useAuditLogStore } from "@/lib/stores/audit-log-store"
import { AppHeader } from "@/components/shared/app-header"
import { DocumentCard } from "@/components/download/document-card"
import { MetricsDashboard } from "@/components/dashboard/metrics-dashboard"
import { SecurityVerificationModal } from "@/components/download/security-verification-modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Search, AlertTriangle, Clock } from "lucide-react"
import { NotificationModal } from "@/components/shared/notification-modal"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
import type { Document } from "@/types/download"

const MOCK_DOCUMENTS: Document[] = [
  {
    id: "1",
    name: "Relatorio_Anual_2023.pdf",
    sender: "Ana Silva",
    date: "15/07/2024",
    size: "2.5 MB",
    type: "pdf",
    downloaded: true,
    downloadedAt: "18/07/2024 14:30",
    downloadCount: 1,
  },
  {
    id: "2",
    name: "Contrato_Servicos.docx",
    sender: "Carlos Pereira",
    date: "12/07/2024",
    size: "128 KB",
    type: "docx",
    downloaded: false,
    downloadCount: 0,
  },
  {
    id: "3",
    name: "DRIVE_SHEET_CONFIDENCIAL.xlsx",
    sender: "Mariana Costa",
    date: "10/07/2024",
    size: "780 KB",
    type: "xlsx",
    downloaded: false,
    downloadCount: 0,
    expiresAt: "25/12/2024",
  },
  {
    id: "4",
    name: "Apresentacao_Projeto.pptx",
    sender: "Ricardo Lima",
    date: "08/07/2024",
    size: "15.2 MB",
    type: "pptx",
    downloaded: true,
    downloadedAt: "10/07/2024 09:15",
    downloadCount: 2,
  },
  {
    id: "5",
    name: "Planilha_Orcamento_2024.xlsx",
    sender: "Patricia Oliveira",
    date: "05/07/2024",
    size: "890 KB",
    type: "xlsx",
    downloaded: false,
    downloadCount: 0,
    expiresAt: "10/12/2024",
  },
]

export default function DownloadPage() {
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const { uploads, getUploadsByStatus } = useWorkflowStore()
  const router = useRouter()

  const isEmptyDemo = user?.id === "demo-empty-user-id"

  console.log("Total de uploads:", uploads.length)
  console.log("Email do usuário externo:", user?.email)

  const approvedUploads = uploads.filter((upload) => {
    const isApproved = upload.status === "approved"
    const isForThisUser = upload.recipient === user?.email

    console.log(
      `Upload ${upload.id}: status=${upload.status}, recipient=${upload.recipient}, match=${isApproved && isForThisUser}`,
    )

    return isApproved && isForThisUser
  })

  console.log("Uploads aprovados filtrados:", approvedUploads.length)

  const documentsFromUploads: Document[] = approvedUploads.map((upload) => ({
    id: upload.id,
    name: upload.name,
    sender: upload.sender.name,
    date: upload.uploadDate,
    size: upload.size,
    type: upload.type,
    downloaded: false,
    downloadCount: 0,
    expiresAt: upload.expiresAt,
  }))

  const [documents, setDocuments] = useState<Document[]>(isEmptyDemo ? [] : documentsFromUploads)
  const [notification, setNotification] = useState({ show: false, type: "", title: "", message: "" })
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [filterType, setFilterType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [securityModal, setSecurityModal] = useState({ show: false, documentId: "", documentName: "" })

  useEffect(() => {
    console.log("useEffect disparado - Atualizando documentos")
    console.log("Uploads no store:", uploads)
    console.log("Uploads aprovados para este usuário:", approvedUploads.length)

    if (!isEmptyDemo) {
      setDocuments(documentsFromUploads)
    }
  }, [uploads, user?.email, isEmptyDemo])

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== "external") {
      router.push("/")
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (isEmptyDemo && documents.length === 0) {
      setNotification({
        show: true,
        type: "info",
        title: "Nenhum Arquivo Disponível",
        message:
          "No momento, você não possui arquivos aprovados para download. Quando novos arquivos forem compartilhados com você e aprovados pelo supervisor, eles aparecerão nesta página.",
      })
    }
  }, [isEmptyDemo, documents.length])

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

  const handleDownloadSelected = () => {
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
      type: "success",
      title: "Download iniciado!",
      message: `${selectedDocs.length} documento(s) sendo baixado(s) de forma segura.`,
    })

    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((doc) =>
          selectedDocs.includes(doc.id)
            ? {
                ...doc,
                downloaded: true,
                downloadedAt: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"),
                downloadCount: doc.downloadCount + 1,
              }
            : doc,
        ),
      )
      setSelectedDocs([])
    }, 2000)
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

    const expiration = new Date(expiresAt.split(" - ")[0].split("/").reverse().join("-"))
    const now = new Date()
    const diff = expiration.getTime() - now.getTime()

    if (diff <= 0) return "Expirado"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} dia${days > 1 ? "s" : ""} restante${days > 1 ? "s" : ""}`
    if (hours > 0) return `${hours} hora${hours > 1 ? "s" : ""} restante${hours > 1 ? "s" : ""}`
    return "Menos de 1 hora"
  }

  const handleSecurityVerified = (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId)
    if (!doc) return

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              downloaded: true,
              downloadedAt: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"),
              downloadCount: doc.downloadCount + 1,
            }
          : doc,
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
  }

  const handleNotificationClose = (show: boolean) => {
    if (!show && isEmptyDemo && documents.length === 0) {
      clearAuth()
      router.push("/")
    } else {
      setNotification({ ...notification, show })
    }
  }

  if (!isAuthenticated || user?.userType !== "external") {
    return null
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
