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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Mail, 
  Ban, 
  Search,
  Filter,
  Eye,
  RefreshCcw,
  History,
  ArrowLeft,
  Download
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { FullPageLoader } from "@/components/ui/full-page-loader"

export default function HistoricoPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { uploads, loadUploads } = useWorkflowStore()
  const router = useRouter()

  const [pageLoading, setPageLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUpload, setSelectedUpload] = useState<typeof uploads[0] | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    loadUploads()
    const timer = setTimeout(() => setPageLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [loadUploads])

  // Filtra apenas compartilhamentos finalizados (aprovados, rejeitados, cancelados)
  const historicalUploads = useMemo(() => {
    return uploads.filter(u => 
      u.status === "approved" || 
      u.status === "rejected" || 
      u.status === "cancelled"
    )
  }, [uploads])

  const filteredUploads = useMemo(() => {
    let filtered = historicalUploads

    if (statusFilter !== "all") {
      filtered = filtered.filter(u => u.status === statusFilter)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.recipient.toLowerCase().includes(term) ||
        u.description?.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [historicalUploads, statusFilter, searchTerm])

  const stats = useMemo(() => ({
    total: historicalUploads.length,
    approved: historicalUploads.filter(u => u.status === "approved").length,
    rejected: historicalUploads.filter(u => u.status === "rejected").length,
    cancelled: historicalUploads.filter(u => u.status === "cancelled").length,
  }), [historicalUploads])

  const handleViewDetails = (upload: typeof uploads[0]) => {
    setSelectedUpload(upload)
    setIsDetailModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-700 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-gray-500/10 text-gray-700 border-gray-500/20">
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
      case "approved": return "border-l-emerald-500"
      case "rejected": return "border-l-red-500"
      case "cancelled": return "border-l-gray-400"
      default: return "border-l-gray-300"
    }
  }

  if (pageLoading) {
    return (
      <FullPageLoader
        message="Carregando historico..."
        subMessage="Buscando registros anteriores"
      />
    )
  }

  return (
    <ProtectedRoute allowedUserTypes={["internal", "supervisor"]}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <AppHeader subtitle="Historico de Compartilhamentos" />
        <ScrollToTop />

        <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
          <BreadcrumbNav
            items={[
              { label: "Inicio", href: user?.userType === "supervisor" ? "/supervisor" : "/upload" }, 
              { label: "Historico" }
            ]}
            dashboardLink={user?.userType === "supervisor" ? "/supervisor" : "/upload"}
          />

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#0047BB] to-[#00A99D] flex items-center justify-center shadow-lg">
                <History className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Historico de Compartilhamentos</h1>
                <p className="text-muted-foreground">Visualize todos os compartilhamentos finalizados</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(user?.userType === "supervisor" ? "/supervisor" : "/upload")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>

          {/* Cards de Estatisticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card 
              className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${statusFilter === "all" ? "ring-2 ring-[#0047BB]" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0047BB]/10 to-[#0047BB]/5 flex items-center justify-center">
                    <History className="h-6 w-6 text-[#0047BB]" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border-l-4 border-l-emerald-500 ${statusFilter === "approved" ? "ring-2 ring-emerald-500" : ""}`}
              onClick={() => setStatusFilter("approved")}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600">{stats.approved}</p>
                    <p className="text-sm text-muted-foreground">Aprovados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border-l-4 border-l-red-500 ${statusFilter === "rejected" ? "ring-2 ring-red-500" : ""}`}
              onClick={() => setStatusFilter("rejected")}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                    <p className="text-sm text-muted-foreground">Rejeitados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border-l-4 border-l-gray-400 ${statusFilter === "cancelled" ? "ring-2 ring-gray-500" : ""}`}
              onClick={() => setStatusFilter("cancelled")}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Ban className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-600">{stats.cancelled}</p>
                    <p className="text-sm text-muted-foreground">Cancelados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barra de Busca e Filtros */}
          <Card className="mb-6 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, destinatario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px] h-12">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="rejected">Rejeitados</SelectItem>
                    <SelectItem value="cancelled">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                  }}
                  className="gap-2 h-12"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Limpar
                </Button>
              </div>

              {(searchTerm || statusFilter !== "all") && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">Filtros:</span>
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {statusFilter === "approved" ? "Aprovados" : statusFilter === "rejected" ? "Rejeitados" : "Cancelados"}
                      <button onClick={() => setStatusFilter("all")} className="ml-1 hover:text-foreground">×</button>
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

          {/* Contador */}
          <p className="text-sm text-muted-foreground mb-4">
            Exibindo <span className="font-semibold text-foreground">{filteredUploads.length}</span> de{" "}
            <span className="font-semibold text-foreground">{historicalUploads.length}</span> registros
          </p>

          {/* Lista */}
          {filteredUploads.length === 0 ? (
            <Card className="p-12 text-center bg-card/50">
              <History className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Nenhum registro encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "Tente ajustar os filtros de busca."
                  : "O historico de compartilhamentos aparecera aqui."}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredUploads.map((upload) => (
                <Card 
                  key={upload.id} 
                  className={`border-l-4 ${getStatusColor(upload.status)} hover:shadow-lg transition-all`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-xl ${
                          upload.status === "approved" ? "bg-emerald-100" :
                          upload.status === "rejected" ? "bg-red-100" :
                          "bg-gray-100"
                        }`}>
                          <FileText className={`h-6 w-6 ${
                            upload.status === "approved" ? "text-emerald-600" :
                            upload.status === "rejected" ? "text-red-600" :
                            "text-gray-600"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-foreground truncate">{upload.name}</h3>
                            {getStatusBadge(upload.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{upload.recipient}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>{upload.uploadDate}</span>
                            </div>
                          </div>
                          {upload.files && upload.files.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              <span>{upload.files.length} arquivo(s)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(upload)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

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
              <DialogDescription>
                Informacoes completas do registro
              </DialogDescription>
            </DialogHeader>

            {selectedUpload && (
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">{selectedUpload.name}</h4>
                  {getStatusBadge(selectedUpload.status)}
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Destinatario:</span>
                      <span className="font-medium text-foreground">{selectedUpload.recipient}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Data:</span>
                      <span className="font-medium text-foreground">{selectedUpload.uploadDate}</span>
                    </div>
                  </div>

                  {selectedUpload.description && (
                    <div className="bg-muted/50 rounded-xl p-4">
                      <h5 className="text-sm font-semibold text-muted-foreground mb-2">Descricao</h5>
                      <p className="text-sm text-foreground">{selectedUpload.description}</p>
                    </div>
                  )}

                  {selectedUpload.files && selectedUpload.files.length > 0 && (
                    <div className="bg-muted/50 rounded-xl p-4">
                      <h5 className="text-sm font-semibold text-muted-foreground mb-3">Arquivos ({selectedUpload.files.length})</h5>
                      <div className="space-y-2">
                        {selectedUpload.files.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-background rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-[#0047BB]" />
                              <span className="text-sm font-medium truncate">{file.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{file.size}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
