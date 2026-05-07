"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useAuditLogStore } from "@/lib/stores/audit-log-store"
import { AppHeader } from "@/components/shared/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { FullPageLoader } from "@/components/ui/full-page-loader"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
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
  Upload,
  LogIn,
  LogOut,
  Eye,
  Trash2,
  Loader2,
} from "lucide-react"
import type { LogAction } from "@/lib/stores/audit-log-store"

const ACTION_ICON: Record<string, React.ElementType> = {
  login: LogIn,
  logout: LogOut,
  upload: Upload,
  approve: CheckCircle,
  reject: XCircle,
  download: Download,
  access: Eye,
  expiration_change: Clock,
  zip_validation: Shield,
  file_expired: Trash2,
  cancel: XCircle,
  generate_otp: Shield,
  otp_expired: AlertTriangle,
  otp_max_attempts: AlertTriangle,
  otp_invalid: AlertTriangle,
  otp_validated: CheckCircle,
  // labels legados do backend
  APROVACAO: CheckCircle,
  REJEICAO: XCircle,
  DOWNLOAD: Download,
  ENVIO_CODIGO: Mail,
  EXPIRACAO: Clock,
  CADASTRO: User,
  LOGIN: LogIn,
  UPLOAD: Upload,
}

const ACTION_LABEL: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  upload: "Upload",
  approve: "Aprovação",
  reject: "Rejeição",
  download: "Download",
  access: "Acesso",
  expiration_change: "Alteração de Prazo",
  zip_validation: "Validação ZIP",
  file_expired: "Arquivo Expirado",
  cancel: "Cancelamento",
  generate_otp: "Geração OTP",
  otp_expired: "OTP Expirado",
  otp_max_attempts: "Máx. Tentativas OTP",
  otp_invalid: "OTP Inválido",
  otp_validated: "OTP Validado",
  APROVACAO: "Aprovação",
  REJEICAO: "Rejeição",
  DOWNLOAD: "Download",
  ENVIO_CODIGO: "Envio de Código",
  EXPIRACAO: "Expiração",
  CADASTRO: "Cadastro",
  LOGIN: "Login",
  UPLOAD: "Upload",
}

const LEVEL_BORDER: Record<string, string> = {
  success: "border-l-green-500",
  error: "border-l-red-500",
  warning: "border-l-orange-500",
  info: "border-l-[#0066CC]",
}

const LEVEL_BADGE: Record<string, string> = {
  success: "stat-card-green text-[color:var(--card-green-icon)] border-green-200",
  error: "stat-card-red text-[color:var(--card-red-icon)] border-red-200",
  warning: "stat-card-orange text-[color:var(--card-orange-icon)] border-orange-200",
  info: "stat-card-blue text-[#0047BB] border-[#0066CC]/20",
}

const LEVEL_ICON_BG: Record<string, string> = {
  success: "stat-card-green text-[color:var(--card-green-icon)]",
  error: "stat-card-red text-[color:var(--card-red-icon)]",
  warning: "stat-card-orange text-[color:var(--card-orange-icon)]",
  info: "stat-card-blue text-[#0047BB]",
}

export default function LogsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { logs, isLoadingLogs, loadLogs } = useAuditLogStore()

  const [logFilter, setLogFilter] = useState("all")
  const [logSearch, setLogSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("all")

  // Carrega logs reais da API Python na montagem e a cada troca de filtro de data
  useEffect(() => {
    const filters: Record<string, string> = {}
    if (dateFilter === "today") filters.period = "1d"
    else if (dateFilter === "week") filters.period = "7d"
    else if (dateFilter === "month") filters.period = "30d"
    loadLogs(filters)
  }, [loadLogs, dateFilter])

  // Filtragem local (busca + tipo)
  const filteredLogs = logs.filter((log) => {
    const search = logSearch.toLowerCase()
    const matchesSearch =
      !search ||
      log.details.description.toLowerCase().includes(search) ||
      log.user.name.toLowerCase().includes(search) ||
      log.user.email.toLowerCase().includes(search) ||
      (log.details.targetName ?? "").toLowerCase().includes(search) ||
      (log.details.targetId ?? "").toLowerCase().includes(search)

    const matchesFilter = logFilter === "all" || log.level === logFilter
    return matchesSearch && matchesFilter
  })

  // Contadores calculados sobre dados reais
  const stats = {
    total: logs.length,
    success: logs.filter((l) => l.level === "success").length,
    error: logs.filter((l) => l.level === "error").length,
    warning: logs.filter((l) => l.level === "warning").length,
    info: logs.filter((l) => l.level === "info").length,
  }

  const handleRefresh = () => {
    const filters: Record<string, string> = {}
    if (dateFilter === "today") filters.period = "1d"
    else if (dateFilter === "week") filters.period = "7d"
    else if (dateFilter === "month") filters.period = "30d"
    loadLogs(filters)
    setLogFilter("all")
    setLogSearch("")
  }

  if (!isAuthenticated) return null

  return (
    <ProtectedRoute allowedUserTypes={["supervisor", "support"]}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <AppHeader />
        <ScrollToTop />

        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <BreadcrumbNav
            items={[
              { label: "Supervisor", href: "/supervisor" },
              { label: "Logs e Rastreamento" },
            ]}
            dashboardLink="/supervisor"
          />

          {/* Header */}
          <div className="mb-8 mt-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#0047BB] to-[#00A99D] flex items-center justify-center shadow-lg">
                  <Activity className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground text-balance">Logs e Rastreamento</h1>
                  <p className="text-muted-foreground">Histórico completo de ações e eventos do sistema</p>
                </div>
              </div>
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

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div
              className={`stat-card-blue rounded-2xl p-5 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow ${logFilter === "all" ? "ring-2 ring-[color:var(--card-blue-ring)]" : ""}`}
              onClick={() => setLogFilter("all")}
              role="button" tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setLogFilter("all")}
            >
              <div className="h-14 w-14 rounded-2xl stat-icon-blue flex items-center justify-center">
                <History className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground leading-none mb-1">
                  {isLoadingLogs ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
                </p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>

            <div
              className={`stat-card-green rounded-2xl p-5 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow ${logFilter === "success" ? "ring-2 ring-[color:var(--card-green-ring)]" : ""}`}
              onClick={() => setLogFilter("success")}
              role="button" tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setLogFilter("success")}
            >
              <div className="h-14 w-14 rounded-2xl stat-card-green0 flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground leading-none mb-1">{stats.success}</p>
                <p className="text-sm text-muted-foreground">Sucesso</p>
              </div>
            </div>

            <div
              className={`stat-card-red rounded-2xl p-5 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow ${logFilter === "error" ? "ring-2 ring-[color:var(--card-red-ring)]" : ""}`}
              onClick={() => setLogFilter("error")}
              role="button" tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setLogFilter("error")}
            >
              <div className="h-14 w-14 rounded-2xl stat-card-red0 flex items-center justify-center">
                <XCircle className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground leading-none mb-1">{stats.error}</p>
                <p className="text-sm text-muted-foreground">Erro</p>
              </div>
            </div>

            <div
              className={`stat-card-orange rounded-2xl p-5 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow ${logFilter === "warning" ? "ring-2 ring-[color:var(--card-orange-ring)]" : ""}`}
              onClick={() => setLogFilter("warning")}
              role="button" tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setLogFilter("warning")}
            >
              <div className="h-14 w-14 rounded-2xl stat-card-orange0 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground leading-none mb-1">{stats.warning}</p>
                <p className="text-sm text-muted-foreground">Aviso</p>
              </div>
            </div>

            <div
              className={`stat-card-blue rounded-2xl p-5 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow ${logFilter === "info" ? "ring-2 ring-[color:var(--card-blue-ring)]" : ""}`}
              onClick={() => setLogFilter("info")}
              role="button" tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setLogFilter("info")}
            >
              <div className="h-14 w-14 rounded-2xl stat-icon-blue flex items-center justify-center">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground leading-none mb-1">{stats.info}</p>
                <p className="text-sm text-muted-foreground">Info</p>
              </div>
            </div>
          </div>

          {/* Card Principal */}
          <Card className="bg-card/50 backdrop-blur-sm border shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-xl">Registros de Atividade</CardTitle>
                  <CardDescription>
                    {isLoadingLogs
                      ? "Buscando registros na API..."
                      : `Exibindo ${filteredLogs.length} de ${logs.length} registros`}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleRefresh}
                  disabled={isLoadingLogs}
                >
                  {isLoadingLogs
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <RefreshCcw className="h-4 w-4" />}
                  {isLoadingLogs ? "Atualizando..." : "Atualizar"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descrição, usuário, solicitação..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="pl-11 h-12"
                  />
                </div>
                <Select value={logFilter} onValueChange={setLogFilter}>
                  <SelectTrigger className="w-full md:w-[180px] h-12">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full md:w-[180px] h-12">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo Período</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Últimos 7 dias</SelectItem>
                    <SelectItem value="month">Últimos 30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Badges de filtros ativos */}
              {(logSearch || logFilter !== "all") && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                  {logSearch && (
                    <Badge variant="secondary" className="gap-1">
                      Busca: {logSearch}
                      <button onClick={() => setLogSearch("")} className="ml-1 hover:text-destructive" aria-label="Remover filtro de busca">x</button>
                    </Badge>
                  )}
                  {logFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Tipo: {logFilter === "success" ? "Sucesso" : logFilter === "error" ? "Erro" : logFilter === "warning" ? "Aviso" : "Info"}
                      <button onClick={() => setLogFilter("all")} className="ml-1 hover:text-destructive" aria-label="Remover filtro de tipo">x</button>
                    </Badge>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-3 mt-2">
                {isLoadingLogs ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#0047BB]" />
                    <p className="text-muted-foreground text-sm">Buscando registros na API Python...</p>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">Nenhum log encontrado</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {logs.length === 0
                        ? "Nenhum registro retornado pela API. Verifique se o backend está disponível."
                        : "Tente ajustar os filtros de busca."}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 gap-2"
                      onClick={handleRefresh}
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Tentar novamente
                    </Button>
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    const Icon = ACTION_ICON[log.action] ?? Activity
                    return (
                      <div
                        key={log.id}
                        className={`bg-background/50 border border-l-4 ${LEVEL_BORDER[log.level] ?? "border-l-muted"} rounded-xl p-4 hover:bg-background/80 transition-colors`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2.5 rounded-xl flex-shrink-0 ${LEVEL_ICON_BG[log.level] ?? ""}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-foreground text-sm">
                                {log.details.description || ACTION_LABEL[log.action] || log.action}
                              </span>
                              <Badge variant="outline" className={`text-xs ${LEVEL_BADGE[log.level] ?? ""}`}>
                                {ACTION_LABEL[log.action] ?? log.action}
                              </Badge>
                              {log.details.targetId && (
                                <Badge variant="outline" className="text-xs font-mono">
                                  {log.details.targetId}
                                </Badge>
                              )}
                            </div>
                            {log.details.targetName && (
                              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                <FileText className="h-3 w-3 flex-shrink-0" />
                                {log.details.targetName}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap mt-2">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {log.user.name}
                                {log.user.email ? ` (${log.user.email})` : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(log.timestamp).toLocaleString("pt-BR")}
                              </span>
                              {log.details.ipAddress && (
                                <span className="font-mono">
                                  IP: {log.details.ipAddress}
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
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
