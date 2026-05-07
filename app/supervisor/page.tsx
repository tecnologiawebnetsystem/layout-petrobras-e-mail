"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useWorkflowStore } from "@/lib/stores/workflow-store"
import { AppHeader } from "@/components/shared/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload, 
  ClipboardCheck,
  Filter,
  RefreshCcw,
  Shield,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  BarChart3,
  User,
  Mail,
  Calendar
} from "lucide-react"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
import { SupervisorUploadForm } from "@/components/supervisor/supervisor-upload-form"
import { FullPageLoader } from "@/components/ui/full-page-loader"

export default function SupervisorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()
  const { uploads, loadAllSupervisorShares } = useWorkflowStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("aprovacoes")

  // Verifica parametro tab na URL
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && ["aprovacoes", "compartilhar"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated || user?.userType !== "supervisor") {
        router.push("/")
      } else {
        loadAllSupervisorShares()
        setIsLoading(false)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [isAuthenticated, user, router, loadAllSupervisorShares])

  const pendingCount = uploads.filter((u) => u.status === "pending").length
  const approvedCount = uploads.filter((u) => u.status === "approved").length
  const rejectedCount = uploads.filter((u) => u.status === "rejected").length
  const totalCount = uploads.length

  const filteredUploads = uploads.filter((upload) => {
    const matchesSearch =
      upload.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.sender?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.sender?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.recipient?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || upload.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-[color:var(--card-red-icon)] border-red-200 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <FullPageLoader
        message="Carregando painel do supervisor..."
        subMessage="Buscando compartilhamentos e dados"
      />
    )
  }

  if (!isAuthenticated || user?.userType !== "supervisor") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppHeader />
      <ScrollToTop />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <BreadcrumbNav 
          items={[
            { label: "Inicio", href: "/supervisor" }, 
            { label: "Painel do Supervisor" }
          ]} 
          dashboardLink="/supervisor" 
        />

        {/* Header com gradiente */}
        <div className="mb-8 mt-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#0047BB] to-[#00A99D] flex items-center justify-center shadow-lg">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Painel do Supervisor</h1>
              <p className="text-muted-foreground">Gerencie aprovacoes, compartilhamentos e visualize logs do sistema</p>
            </div>
          </div>
        </div>

        {/* Cards de Metricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total */}
          <div
            className={`stat-card-blue rounded-2xl p-6 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow ${statusFilter === "all" ? "ring-2 ring-[color:var(--card-blue-ring)]" : ""}`}
            onClick={() => { setStatusFilter("all"); setActiveTab("aprovacoes") }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && (setStatusFilter("all"), setActiveTab("aprovacoes"))}
          >
            <div className="h-14 w-14 rounded-2xl stat-icon-blue flex items-center justify-center">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground leading-none mb-1">{totalCount}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>

          {/* Aguardando */}
          <div
            className={`stat-card-orange rounded-2xl p-6 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow ${statusFilter === "pending" ? "ring-2 ring-[color:var(--card-orange-ring)]" : ""}`}
            onClick={() => { setStatusFilter("pending"); setActiveTab("aprovacoes") }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && (setStatusFilter("pending"), setActiveTab("aprovacoes"))}
          >
            <div className="h-14 w-14 rounded-2xl stat-card-orange0 flex items-center justify-center">
              <Clock className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground leading-none mb-1">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Aguardando Aprovação</p>
            </div>
          </div>

          {/* Aprovados */}
          <div
            className={`stat-card-green rounded-2xl p-6 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow ${statusFilter === "approved" ? "ring-2 ring-[color:var(--card-green-ring)]" : ""}`}
            onClick={() => { setStatusFilter("approved"); setActiveTab("aprovacoes") }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && (setStatusFilter("approved"), setActiveTab("aprovacoes"))}
          >
            <div className="h-14 w-14 rounded-2xl stat-card-green0 flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground leading-none mb-1">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Aprovados</p>
            </div>
          </div>

          {/* Rejeitados */}
          <div
            className={`stat-card-red rounded-2xl p-6 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow ${statusFilter === "rejected" ? "ring-2 ring-[color:var(--card-red-ring)]" : ""}`}
            onClick={() => { setStatusFilter("rejected"); setActiveTab("aprovacoes") }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && (setStatusFilter("rejected"), setActiveTab("aprovacoes"))}
          >
            <div className="h-14 w-14 rounded-2xl stat-card-red0 flex items-center justify-center">
              <XCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground leading-none mb-1">{rejectedCount}</p>
              <p className="text-sm text-muted-foreground">Rejeitados</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-14 p-1 bg-muted/50">
            <TabsTrigger value="aprovacoes" className="gap-2 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <ClipboardCheck className="h-5 w-5" />
              Aprovacoes
              {pendingCount > 0 && (
                <Badge className="ml-1 stat-card-orange0 text-white text-xs px-2">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="compartilhar" className="gap-2 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Upload className="h-5 w-5" />
              Compartilhar
            </TabsTrigger>
          </TabsList>

          {/* Tab Aprovacoes */}
          <TabsContent value="aprovacoes" className="space-y-6">
            {/* Barra de busca e filtros */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, remetente, destinatario..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11 h-12 text-base"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-[180px] h-12">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                        <SelectItem value="approved">Aprovados</SelectItem>
                        <SelectItem value="rejected">Rejeitados</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-12 w-12"
                      onClick={() => { setSearchQuery(""); setStatusFilter("all") }}
                    >
                      <RefreshCcw className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Indicadores de filtro ativo */}
                {(searchQuery || statusFilter !== "all") && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                    {searchQuery && (
                      <Badge variant="secondary" className="gap-1">
                        Busca: {searchQuery}
                        <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">x</button>
                      </Badge>
                    )}
                    {statusFilter !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        Status: {statusFilter === "pending" ? "Pendentes" : statusFilter === "approved" ? "Aprovados" : "Rejeitados"}
                        <button onClick={() => setStatusFilter("all")} className="ml-1 hover:text-destructive">x</button>
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lista de compartilhamentos */}
            <div className="space-y-4">
              {filteredUploads.length === 0 ? (
                <Card className="p-12 text-center bg-card/50">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-medium text-foreground mb-2">Nenhum documento encontrado</p>
                  <p className="text-muted-foreground mb-6">Tente ajustar os filtros de busca</p>
                  <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all") }}>
                    Limpar Filtros
                  </Button>
                </Card>
              ) : (
                filteredUploads.map((upload) => (
                  <Card 
                    key={upload.id} 
                    className={`overflow-hidden transition-all hover:shadow-lg border-l-4 ${
                      upload.status === "pending" ? "border-l-amber-500" :
                      upload.status === "approved" ? "border-l-emerald-500" :
                      "border-l-red-500"
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-3 rounded-xl ${
                            upload.status === "pending" ? "bg-amber-100" :
                            upload.status === "approved" ? "bg-emerald-100" :
                            "bg-red-100"
                          }`}>
                            <FileCheck className={`h-6 w-6 ${
                              upload.status === "pending" ? "text-amber-600" :
                              upload.status === "approved" ? "text-emerald-600" :
                              "text-red-600"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-foreground truncate">{upload.name}</h3>
                              {getStatusBadge(upload.status)}
                              {upload.numeroSolicitacao && (
                                <span className="inline-flex items-center gap-1 text-xs font-mono stat-card-blue text-[#0047BB] px-2 py-0.5 rounded-full border border-[#0066CC]/20">
                                  <FileText className="h-3 w-3" />
                                  {upload.numeroSolicitacao}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">
                                  <span className="font-medium">Remetente:</span> {upload.sender?.name || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">
                                  <span className="font-medium">Destinatario:</span> {upload.recipient || "N/A"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(upload.uploadDate).toLocaleDateString("pt-BR")}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {upload.files?.length || 0} arquivo(s)
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="default"
                          size="sm"
                          className="bg-[#0047BB] hover:bg-[#003399] gap-2"
                          onClick={() => router.push(`/supervisor/detalhes/${upload.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab Compartilhar */}
          <TabsContent value="compartilhar" className="space-y-6">
            <SupervisorUploadForm />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
