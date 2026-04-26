"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useWorkflowStore } from "@/lib/stores/workflow-store"
import { AppHeader } from "@/components/shared/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  User, 
  Mail, 
  Ban, 
  AlertCircle,
  Search,
  Filter,
  Eye,
  Download,
  RefreshCcw,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Share2,
  Copy,
  ExternalLink,
  ChevronRight,
  Plus
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { FullPageLoader } from "@/components/ui/full-page-loader"
import { NotificationModal } from "@/components/shared/notification-modal"

export default function CompartilhamentosPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { uploads, isLoadingUploads, loadUploads, cancelUpload } = useWorkflowStore()
  const router = useRouter()

  // Estados
  const [pageLoading, setPageLoading] = useState(true)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedUpload, setSelectedUpload] = useState<typeof uploads[0] | null>(null)
  const [selectedUploadId, setSelectedUploadId] = useState<string>("")
  const [cancellationReason, setCancellationReason] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("todos")
  const [notification, setNotification] = useState({
    show: false,
    type: "success" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  })

  // Carrega compartilhamentos do backend ao montar a página
  useEffect(() => {
    loadUploads()
    const timer = setTimeout(() => setPageLoading(false), 1200)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filtragem de compartilhamentos
  const userUploads = uploads

  const filteredUploads = useMemo(() => {
    let filtered = userUploads

    // Filtro por status (tab)
    if (activeTab !== "todos") {
      filtered = filtered.filter(u => u.status === activeTab)
    }

    // Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.recipient.toLowerCase().includes(term) ||
        u.description?.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [userUploads, activeTab, searchTerm])

  // Estatísticas
  const stats = useMemo(() => ({
    total: userUploads.length,
    pending: userUploads.filter(u => u.status === "pending").length,
    approved: userUploads.filter(u => u.status === "approved").length,
    rejected: userUploads.filter(u => u.status === "rejected").length,
    cancelled: userUploads.filter(u => u.status === "cancelled").length,
  }), [userUploads])

  const handleCancelClick = (uploadId: string) => {
    setSelectedUploadId(uploadId)
    setCancellationReason("")
    setIsCancelModalOpen(true)
  }

  const handleConfirmCancel = () => {
    if (selectedUploadId && user) {
      cancelUpload(selectedUploadId, user.name, cancellationReason)
      setIsCancelModalOpen(false)
      setSelectedUploadId("")
      setCancellationReason("")
      setNotification({
        show: true,
        type: "success",
        title: "Compartilhamento cancelado",
        message: "O compartilhamento foi cancelado com sucesso.",
      })
    }
  }

  const handleViewDetails = (upload: typeof uploads[0]) => {
    setSelectedUpload(upload)
    setIsDetailModalOpen(true)
  }

  const handleCopyLink = (uploadId: string) => {
    const link = `${window.location.origin}/download?share=${uploadId}`
    navigator.clipboard.writeText(link)
    setNotification({
      show: true,
      type: "success",
      title: "Link copiado",
      message: "Link de compartilhamento copiado para a area de transferencia.",
    })
  }

  const handleFilterByStatus = (status: string) => {
    setActiveTab(status)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Aguardando
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-gray-500/10 text-gray-700 border-gray-500/20 hover:bg-gray-500/20">
            <Ban className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        )
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "border-l-amber-500"
      case "approved": return "border-l-emerald-500"
      case "rejected": return "border-l-red-500"
      case "cancelled": return "border-l-gray-400"
      default: return "border-l-gray-300"
    }
  }

  // Loader inicial
  if (pageLoading) {
    return (
      <FullPageLoader
        message="Carregando compartilhamentos..."
        subMessage="Buscando seus envios e status"
      />
    )
  }

  return (
    <ProtectedRoute allowedUserTypes={["internal"]}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <AppHeader subtitle="Meus Compartilhamentos" />

        <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
          <BreadcrumbNav
            items={[{ label: "Inicio", href: "/upload" }, { label: "Meus Compartilhamentos" }]}
            dashboardLink="/upload"
          />

          {/* Header com titulo e acao */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#00A99D] to-[#0047BB] flex items-center justify-center shadow-lg">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                Meus Compartilhamentos
              </h1>
              <p className="text-muted-foreground text-lg">
                Gerencie e acompanhe todos os seus envios de arquivos
              </p>
            </div>
            <Button
              onClick={() => router.push("/upload")}
              className="bg-gradient-to-r from-[#00A99D] to-[#0047BB] hover:opacity-90 text-white shadow-lg gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Compartilhamento
            </Button>
          </div>

          {/* Cards de Metricas - Clicaveis */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card 
              className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${activeTab === "todos" ? "ring-2 ring-[#0047BB] shadow-lg" : ""}`}
              onClick={() => handleFilterByStatus("todos")}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0047BB]/10 to-[#0047BB]/5 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-[#0047BB]" />
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${activeTab === "pending" ? "ring-2 ring-amber-500 shadow-lg" : ""}`}
              onClick={() => handleFilterByStatus("pending")}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.pending}</p>
                    <p className="text-sm text-muted-foreground">Aguardando</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${activeTab === "approved" ? "ring-2 ring-emerald-500 shadow-lg" : ""}`}
              onClick={() => handleFilterByStatus("approved")}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.approved}</p>
                    <p className="text-sm text-muted-foreground">Aprovados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${activeTab === "rejected" ? "ring-2 ring-red-500 shadow-lg" : ""}`}
              onClick={() => handleFilterByStatus("rejected")}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.rejected}</p>
                    <p className="text-sm text-muted-foreground">Rejeitados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${activeTab === "cancelled" ? "ring-2 ring-gray-500 shadow-lg" : ""}`}
              onClick={() => handleFilterByStatus("cancelled")}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-500/10 to-gray-500/5 flex items-center justify-center">
                    <Ban className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.cancelled}</p>
                    <p className="text-sm text-muted-foreground">Cancelados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barra de busca e filtros */}
          <Card className="mb-6 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por nome, destinatario ou descricao..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    loadUploads()
                    setNotification({
                      show: true,
                      type: "info",
                      title: "Atualizando",
                      message: "Lista de compartilhamentos atualizada.",
                    })
                  }}
                  className="gap-2 h-12"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Atualizar
                </Button>
              </div>

              {/* Indicador de filtro ativo */}
              {(activeTab !== "todos" || searchTerm) && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                  {activeTab !== "todos" && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {activeTab === "pending" ? "Aguardando" : activeTab === "approved" ? "Aprovados" : activeTab === "rejected" ? "Rejeitados" : "Cancelados"}
                      <button onClick={() => setActiveTab("todos")} className="ml-1 hover:text-foreground">×</button>
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      Busca: {searchTerm}
                      <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-foreground">×</button>
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contador de resultados */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Exibindo <span className="font-semibold text-foreground">{filteredUploads.length}</span> de{" "}
              <span className="font-semibold text-foreground">{userUploads.length}</span> compartilhamentos
            </p>
          </div>

          {/* Lista de Compartilhamentos */}
          {filteredUploads.length === 0 ? (
            <Card className="p-12 text-center bg-card/50 backdrop-blur-sm">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum compartilhamento encontrado</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm || activeTab !== "todos" 
                  ? "Nenhum resultado para os filtros selecionados. Tente ajustar sua busca."
                  : "Voce ainda nao realizou nenhum compartilhamento. Comece enviando seus arquivos de forma segura."}
              </p>
              {!searchTerm && activeTab === "todos" && (
                <Button 
                  onClick={() => router.push("/upload")}
                  className="bg-gradient-to-r from-[#00A99D] to-[#0047BB] hover:opacity-90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Fazer Primeiro Compartilhamento
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredUploads.map((upload) => (
                <Card 
                  key={upload.id} 
                  className={`border-l-4 ${getStatusColor(upload.status)} hover:shadow-lg transition-all bg-card/50 backdrop-blur-sm group`}
                >
                  <CardContent className="p-5 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Info Principal */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`hidden md:flex p-3 rounded-xl ${
                          upload.status === "pending" ? "bg-amber-500/10" :
                          upload.status === "approved" ? "bg-emerald-500/10" :
                          upload.status === "rejected" ? "bg-red-500/10" :
                          "bg-gray-500/10"
                        }`}>
                          <FileText className={`h-6 w-6 ${
                            upload.status === "pending" ? "text-amber-600" :
                            upload.status === "approved" ? "text-emerald-600" :
                            upload.status === "rejected" ? "text-red-600" :
                            "text-gray-600"
                          }`} />
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-lg text-foreground group-hover:text-[#0047BB] transition-colors">
                                {upload.name}
                              </h3>
                              {upload.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {upload.description}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              {getStatusBadge(upload.status)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{upload.recipient}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>{upload.uploadDate}</span>
                            </div>
                          </div>

                          {/* Info adicional baseada no status */}
                          {upload.status === "pending" && (
                            <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                              <p className="text-sm text-amber-700">
                                Aguardando aprovacao do supervisor
                              </p>
                            </div>
                          )}

                          {upload.status === "approved" && upload.approvedBy && (
                            <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                              <User className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                              <p className="text-sm text-emerald-700">
                                Aprovado por <span className="font-medium">{upload.approvedBy}</span>
                                {upload.approvalDate && ` em ${upload.approvalDate}`}
                              </p>
                            </div>
                          )}

                          {upload.status === "rejected" && upload.rejectionReason && (
                            <div className="flex items-start gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-red-700">
                                <span className="font-medium">Motivo:</span> {upload.rejectionReason}
                              </p>
                            </div>
                          )}

                          {upload.status === "cancelled" && (
                            <div className="flex items-start gap-2 p-3 bg-gray-500/5 border border-gray-500/20 rounded-lg">
                              <Ban className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-gray-700">
                                <p>Cancelado por <span className="font-medium">{upload.cancelledBy}</span>
                                {upload.cancellationDate && ` em ${upload.cancellationDate}`}</p>
                                {upload.cancellationReason && (
                                  <p className="mt-1"><span className="font-medium">Motivo:</span> {upload.cancellationReason}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Acoes */}
                      <div className="flex items-center gap-2 md:flex-col md:items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(upload)}
                          className="gap-2 hover:bg-[#0047BB]/10"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Detalhes</span>
                        </Button>

                        {upload.status === "approved" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(upload.id)}
                            className="gap-2 hover:bg-[#00A99D]/10"
                          >
                            <Copy className="h-4 w-4" />
                            <span className="hidden sm:inline">Copiar Link</span>
                          </Button>
                        )}

                        {upload.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelClick(upload.id)}
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                          >
                            <Ban className="h-4 w-4" />
                            <span className="hidden sm:inline">Cancelar</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* Modal de Cancelamento */}
        <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Ban className="h-5 w-5 text-red-600" />
                </div>
                Cancelar Compartilhamento
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja cancelar este compartilhamento? Esta acao nao pode ser desfeita.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo do cancelamento (opcional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: Arquivo errado, preciso enviar uma versao atualizada..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  Informar o motivo ajuda o supervisor a entender melhor sua decisao.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
                Voltar
              </Button>
              <Button variant="destructive" onClick={handleConfirmCancel} className="gap-2">
                <Ban className="h-4 w-4" />
                Confirmar Cancelamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0047BB] to-[#00A99D] flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                Detalhes do Compartilhamento
              </DialogTitle>
            </DialogHeader>

            {selectedUpload && (
              <div className="space-y-6 py-4">
                {/* Status e Nome */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedUpload.name}</h3>
                    {selectedUpload.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedUpload.description}</p>
                    )}
                  </div>
                  {getStatusBadge(selectedUpload.status)}
                </div>

                {/* Informacoes */}
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Destinatario
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-[#00A99D]" />
                        <span className="font-medium">{selectedUpload.recipient}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedUpload.recipient)
                          setNotification({
                            show: true,
                            type: "success",
                            title: "Copiado",
                            message: "E-mail copiado para a area de transferencia.",
                          })
                        }}
                        className="h-8 w-8"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Data de Envio
                      </h4>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{selectedUpload.uploadDate}</span>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Arquivos
                      </h4>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{selectedUpload.files?.length || 0} arquivo(s)</span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de arquivos se houver */}
                  {selectedUpload.files && selectedUpload.files.length > 0 && (
                    <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Arquivos Enviados
                      </h4>
                      <div className="space-y-2">
                        {selectedUpload.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-background rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-[#0047BB]" />
                              <span className="text-sm">{file.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{file.size}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Acoes */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                    Fechar
                  </Button>
                  {selectedUpload.status === "approved" && (
                    <Button 
                      onClick={() => handleCopyLink(selectedUpload.id)}
                      className="gap-2 bg-gradient-to-r from-[#00A99D] to-[#0047BB] text-white"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar Link
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Notificacao */}
        <NotificationModal
          open={notification.show}
          onOpenChange={(show) => setNotification({ ...notification, show })}
          type={notification.type}
          title={notification.title}
          message={notification.message}
        />
      </div>
    </ProtectedRoute>
  )
}
