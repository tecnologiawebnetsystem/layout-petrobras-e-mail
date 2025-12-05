"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { AppHeader } from "@/components/shared/app-header"
import { DocumentCard } from "@/components/download/document-card"
import { MetricsDashboard } from "@/components/dashboard/metrics-dashboard"
import { SecurityVerificationModal } from "@/components/download/security-verification-modal"
import { TagFilter } from "@/components/tags/tag-filter"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Search, AlertTriangle } from "lucide-react"
import { NotificationModal } from "@/components/shared/notification-modal"
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
    requiresPassword: false,
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
    requiresPassword: true,
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
    requiresPassword: false,
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
    requiresPassword: false,
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
    requiresPassword: true,
  },
  {
    id: "6",
    name: "Manual_Operacional.pdf",
    sender: "Fernando Santos",
    date: "01/07/2024",
    size: "5.8 MB",
    type: "pdf",
    downloaded: false,
    downloadCount: 0,
    expiresAt: "01/06/2024",
    requiresPassword: false,
  },
]

export default function DownloadPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("recent")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [securityModal, setSecurityModal] = useState<{
    show: boolean
    documentId: string
    documentName: string
    requiresPassword: boolean
  }>({
    show: false,
    documentId: "",
    documentName: "",
    requiresPassword: false,
  })
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
    if (!isAuthenticated || user?.userType !== "external") {
      router.push("/")
    }
  }, [isAuthenticated, user, router])

  const stats = {
    totalReceived: documents.length,
    downloaded: documents.filter((d) => d.downloaded).length,
    pending: documents.filter((d) => !d.downloaded && (!d.expiresAt || new Date(d.expiresAt) >= new Date())).length,
    expired: documents.filter((d) => d.expiresAt && new Date(d.expiresAt) < new Date()).length,
  }

  const filteredDocuments = documents.filter((doc) => {
    const isExpired = doc.expiresAt && new Date(doc.expiresAt) < new Date()

    if (filterStatus === "downloaded" && !doc.downloaded) return false
    if (filterStatus === "pending" && (doc.downloaded || isExpired)) return false
    if (filterStatus === "expired" && !isExpired) return false

    return true
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const availableDocs = filteredDocuments
        .filter((doc) => !doc.downloaded && (!doc.expiresAt || new Date(doc.expiresAt) >= new Date()))
        .map((doc) => doc.id)
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

    const docsToDownload = documents.filter((d) => selectedDocs.includes(d.id))
    const requiresPassword = docsToDownload.some((d) => d.requiresPassword)

    if (requiresPassword) {
      setNotification({
        show: true,
        type: "warning",
        title: "Documentos protegidos selecionados",
        message: "Alguns documentos requerem senha. Por favor, baixe-os individualmente.",
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
      requiresPassword: doc.requiresPassword || false,
    })
  }

  const handleSecurityVerified = () => {
    const doc = documents.find((d) => d.id === securityModal.documentId)
    if (!doc) return

    setNotification({
      show: true,
      type: "success",
      title: "Download seguro iniciado!",
      message: `Baixando ${doc.name} de forma criptografada.`,
    })

    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                downloaded: true,
                downloadedAt: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"),
                downloadCount: d.downloadCount + 1,
              }
            : d,
        ),
      )
    }, 1500)
  }

  if (!isAuthenticated || user?.userType !== "external") {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader subtitle="Módulo de Download" />

      <main className="container max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-3">Documentos Aprovados para Download</h1>

          <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-400 p-4 rounded">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-100 text-sm">Aviso de Confidencialidade:</p>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
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

        <div className="bg-card rounded-lg border p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <SelectItem value="expired">Expirados</SelectItem>
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

          <TagFilter selectedTags={filterTags} onTagsChange={setFilterTags} />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={
                  selectedDocs.length > 0 &&
                  selectedDocs.length ===
                    filteredDocuments.filter(
                      (d) => !d.downloaded && (!d.expiresAt || new Date(d.expiresAt) >= new Date()),
                    ).length
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              isSelected={selectedDocs.includes(doc.id)}
              onSelect={(checked) => handleSelectDoc(doc.id, checked)}
              onDownload={() => handleDownloadSingle(doc.id)}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredDocuments.length} de {documents.length} documentos
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

        <div className="text-center text-sm text-muted-foreground border-t pt-8">
          © 2025 Petrobras. Todos os direitos reservados. | Política de Privacidade
        </div>
      </main>

      <SecurityVerificationModal
        open={securityModal.show}
        onOpenChange={(show) => setSecurityModal({ ...securityModal, show })}
        documentName={securityModal.documentName}
        requiresPassword={securityModal.requiresPassword}
        onVerified={handleSecurityVerified}
      />

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
