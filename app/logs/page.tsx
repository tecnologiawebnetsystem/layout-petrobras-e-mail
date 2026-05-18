"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { AppHeader } from "@/components/shared/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  Filter,
  RefreshCcw,
  History,
  Download,
  Mail,
  User,
  Shield,
  AlertTriangle,
  FileText,
  Calendar,
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Upload
} from "lucide-react"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
import { FullPageLoader } from "@/components/ui/full-page-loader"

interface AuditLog {
  id: number
  timestamp: string
  action: string
  level: string
  user: {
    id: number
    name: string
    email: string
    type: string
    employee_id?: string
  } | null
  details: {
    target_id: number | null
    target_name: string | null
    description: string | null
    ip_address: string | null
    metadata: Record<string, unknown> | null
  }
}

interface AuditResponse {
  logs: AuditLog[]
  pagination: {
    current_page: number
    total_pages: number
    total_items: number
    items_per_page: number
  }
}

export default function LogsPage() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated, accessToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 50
  })
  const [logFilter, setLogFilter] = useState("all")
  const [logSearch, setLogSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")

  // Carregar logs da API
  const fetchLogs = useCallback(async (page: number = 1) => {
    if (!accessToken) return

    setIsLoadingLogs(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "50")
      
      if (logFilter !== "all") {
        params.set("level", logFilter)
      }
      
      if (actionFilter !== "all") {
        params.set("action", actionFilter)
      }

      // Filtro de data
      if (dateFilter !== "all") {
        const now = new Date()
        let startDate: Date
        
        if (dateFilter === "today") {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        } else if (dateFilter === "week") {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else if (dateFilter === "month") {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        } else {
          startDate = new Date(0)
        }
        
        params.set("start_date", startDate.toISOString())
      }

      const res = await fetch(`/api/audit/logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (res.ok) {
        const data: AuditResponse = await res.json()
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar logs:", error)
    } finally {
      setIsLoadingLogs(false)
    }
  }, [accessToken, logFilter, actionFilter, dateFilter])

  useEffect(() => {
    if (!_hasHydrated) return

    const timer = setTimeout(() => {
      if (!isAuthenticated || (user?.userType !== "supervisor" && user?.userType !== "admin")) {
        router.push("/")
      } else {
        setIsLoading(false)
        fetchLogs(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [_hasHydrated, isAuthenticated, user, router, fetchLogs])

  // Recarregar quando filtros mudarem
  useEffect(() => {
    if (!isLoading && accessToken) {
      fetchLogs(1)
    }
  }, [logFilter, actionFilter, dateFilter])

  // Filtrar logs localmente pela busca
  const filteredLogs = logs.filter((log) => {
    if (!logSearch) return true
    
    const searchLower = logSearch.toLowerCase()
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.details?.description?.toLowerCase().includes(searchLower) ||
      log.user?.name?.toLowerCase().includes(searchLower) ||
      log.user?.email?.toLowerCase().includes(searchLower) ||
      String(log.details?.target_id || "").includes(searchLower)
    )
  })

  // Estatisticas (baseadas nos logs carregados)
  const stats = {
    total: pagination.total_items,
    success: logs.filter(l => l.level === "success" || l.level === "INFO").length,
    error: logs.filter(l => l.level === "error" || l.level === "ERROR").length,
    warning: logs.filter(l => l.level === "warning" || l.level === "WARNING").length,
    info: logs.filter(l => l.level === "info" || l.level === "INFO" || !l.level).length,
  }

  const getLogIcon = (action: string) => {
    const actionUpper = action.toUpperCase()
    if (actionUpper.includes("APROVAR") || actionUpper.includes("APPROVE")) return <CheckCircle className="h-4 w-4" />
    if (actionUpper.includes("REJEITAR") || actionUpper.includes("REJECT")) return <XCircle className="h-4 w-4" />
    if (actionUpper.includes("DOWNLOAD") || actionUpper.includes("BAIXAR")) return <Download className="h-4 w-4" />
    if (actionUpper.includes("EMAIL") || actionUpper.includes("OTP") || actionUpper.includes("CODIGO")) return <Mail className="h-4 w-4" />
    if (actionUpper.includes("EXPIR")) return <Clock className="h-4 w-4" />
    if (actionUpper.includes("CADASTR") || actionUpper.includes("CRIAR")) return <User className="h-4 w-4" />
    if (actionUpper.includes("LOGIN") || actionUpper.includes("AUTH")) return <Shield className="h-4 w-4" />
    if (actionUpper.includes("UPLOAD") || actionUpper.includes("ENVIAR")) return <Upload className="h-4 w-4" />
    if (actionUpper.includes("VER") || actionUpper.includes("VIEW")) return <FileText className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  const getLogLevel = (log: AuditLog): string => {
    const level = log.level?.toLowerCase() || "info"
    const action = log.action.toUpperCase()
    
    if (level === "success" || action.includes("APROVAR") || action.includes("APPROVE")) return "success"
    if (level === "error" || action.includes("REJEITAR") || action.includes("REJECT") || action.includes("ERRO")) return "error"
    if (level === "warning" || action.includes("EXPIR") || action.includes("ALERT")) return "warning"
    return "info"
  }

  const getLogStatusColor = (level: string) => {
    switch (level) {
      case "success": return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
      case "error": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
      case "warning": return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
      default: return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
    }
  }

  const getLogBorderColor = (level: string) => {
    switch (level) {
      case "success": return "border-l-emerald-500"
      case "error": return "border-l-red-500"
      case "warning": return "border-l-amber-500"
      default: return "border-l-blue-500"
    }
  }

  const formatAction = (action: string): string => {
    return action
      .replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  if (isLoading) {
    return (
      <FullPageLoader
        message="Carregando logs do sistema..."
        subMessage="Buscando registros de atividades"
      />
    )
  }

  if (!_hasHydrated || !isAuthenticated || (user?.userType !== "supervisor" && user?.userType !== "admin")) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppHeader />
      <ScrollToTop />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <BreadcrumbNav 
          items={[
            { label: "Supervisor", href: "/supervisor" }, 
            { label: "Logs e Rastreamento" }
          ]} 
          dashboardLink="/supervisor" 
        />

        {/* Header */}
        <div className="mb-8 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Logs e Rastreamento</h1>
                <p className="text-muted-foreground">Historico completo de acoes e eventos do sistema</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchLogs(pagination.current_page)}
                disabled={isLoadingLogs}
                className="gap-2"
              >
                <RefreshCcw className={`h-4 w-4 ${isLoadingLogs ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/supervisor")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Painel
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de Estatisticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${logFilter === "all" ? "ring-2 ring-secondary" : ""}`}
            onClick={() => setLogFilter("all")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 flex items-center justify-center">
                  <History className="h-5 w-5 text-secondary" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-emerald-500 ${logFilter === "success" ? "ring-2 ring-emerald-500" : ""}`}
            onClick={() => setLogFilter("success")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.success}</p>
                  <p className="text-xs text-muted-foreground">Sucesso</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-red-500 ${logFilter === "error" ? "ring-2 ring-red-500" : ""}`}
            onClick={() => setLogFilter("error")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.error}</p>
                  <p className="text-xs text-muted-foreground">Erro</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-amber-500 ${logFilter === "warning" ? "ring-2 ring-amber-500" : ""}`}
            onClick={() => setLogFilter("warning")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.warning}</p>
                  <p className="text-xs text-muted-foreground">Aviso</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-blue-500 ${logFilter === "info" ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setLogFilter("info")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.info}</p>
                  <p className="text-xs text-muted-foreground">Info</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Principal */}
        <Card className="bg-card/50 backdrop-blur-sm border shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-xl">Registros de Atividade</CardTitle>
                <CardDescription>
                  Exibindo {filteredLogs.length} de {pagination.total_items} registros
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => {
                  setLogFilter("all")
                  setLogSearch("")
                  setDateFilter("all")
                  setActionFilter("all")
                }}
              >
                <RefreshCcw className="h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Filtros de logs */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descricao, usuario, solicitacao..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-11 h-12"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full md:w-[180px] h-12">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Acao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Acoes</SelectItem>
                  <SelectItem value="APROVAR">Aprovacoes</SelectItem>
                  <SelectItem value="REJEITAR">Rejeicoes</SelectItem>
                  <SelectItem value="UPLOAD">Uploads</SelectItem>
                  <SelectItem value="DOWNLOAD">Downloads</SelectItem>
                  <SelectItem value="LOGIN">Logins</SelectItem>
                  <SelectItem value="EMAIL">E-mails</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-[180px] h-12">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo Periodo</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Ultimos 7 dias</SelectItem>
                  <SelectItem value="month">Ultimos 30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Indicadores de filtro ativo */}
            {(logSearch || logFilter !== "all" || actionFilter !== "all" || dateFilter !== "all") && (
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                {logSearch && (
                  <Badge variant="secondary" className="gap-1">
                    Busca: {logSearch}
                    <button onClick={() => setLogSearch("")} className="ml-1 hover:text-destructive">x</button>
                  </Badge>
                )}
                {logFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Nivel: {logFilter}
                    <button onClick={() => setLogFilter("all")} className="ml-1 hover:text-destructive">x</button>
                  </Badge>
                )}
                {actionFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Acao: {actionFilter}
                    <button onClick={() => setActionFilter("all")} className="ml-1 hover:text-destructive">x</button>
                  </Badge>
                )}
                {dateFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Periodo: {dateFilter === "today" ? "Hoje" : dateFilter === "week" ? "7 dias" : "30 dias"}
                    <button onClick={() => setDateFilter("all")} className="ml-1 hover:text-destructive">x</button>
                  </Badge>
                )}
              </div>
            )}

            {/* Loading */}
            {isLoadingLogs && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Carregando logs...</span>
              </div>
            )}

            {/* Timeline de logs */}
            {!isLoadingLogs && (
              <div className="space-y-3 mt-6">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">Nenhum log encontrado</p>
                    <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros de busca</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    const level = getLogLevel(log)
                    return (
                      <div
                        key={log.id}
                        className={`bg-background/50 border border-l-4 ${getLogBorderColor(level)} rounded-xl p-4 hover:bg-background/80 transition-colors`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2.5 rounded-xl ${getLogStatusColor(level)}`}>
                            {getLogIcon(log.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-foreground">{formatAction(log.action)}</span>
                              <Badge variant="outline" className={`text-xs ${getLogStatusColor(level)}`}>
                                {log.action}
                              </Badge>
                              {log.details?.target_id && (
                                <Badge variant="outline" className="text-xs font-mono">
                                  ID: {log.details.target_id}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {log.details?.description || "Sem descricao"}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {log.user?.name || log.user?.email || "Sistema"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(log.timestamp).toLocaleString("pt-BR")}
                              </span>
                              {log.details?.ip_address && (
                                <span className="flex items-center gap-1 font-mono">
                                  IP: {log.details.ip_address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* Paginacao */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Pagina {pagination.current_page} de {pagination.total_pages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLogs(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1 || isLoadingLogs}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLogs(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.total_pages || isLoadingLogs}
                  >
                    Proximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
