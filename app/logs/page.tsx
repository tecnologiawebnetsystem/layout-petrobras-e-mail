"use client"

import { useEffect, useState } from "react"
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
  ArrowLeft
} from "lucide-react"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
import { FullPageLoader } from "@/components/ui/full-page-loader"

// Dados de demonstracao para logs
const DEMO_LOGS = [
  {
    id: "1",
    action: "APROVACAO",
    description: "Compartilhamento aprovado",
    details: "Arquivo 'Relatorio_Q4_2024.pdf' aprovado para destinatario@empresa.com",
    user: "Wagner Silva",
    userEmail: "wagner@petrobras.com.br",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: "success",
    ip: "10.0.0.45",
    shareId: "SOL-2024-001234"
  },
  {
    id: "2",
    action: "REJEICAO",
    description: "Compartilhamento rejeitado",
    details: "Arquivo 'Dados_Confidenciais.xlsx' rejeitado - Motivo: Dados sensiveis nao autorizados",
    user: "Wagner Silva",
    userEmail: "wagner@petrobras.com.br",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: "error",
    ip: "10.0.0.45",
    shareId: "SOL-2024-001233"
  },
  {
    id: "3",
    action: "DOWNLOAD",
    description: "Arquivo baixado",
    details: "Destinatario cliente@parceiro.com baixou 'Contrato_2024.pdf'",
    user: "cliente@parceiro.com",
    userEmail: "cliente@parceiro.com",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: "info",
    ip: "189.45.123.78",
    shareId: "SOL-2024-001230"
  },
  {
    id: "4",
    action: "ENVIO_CODIGO",
    description: "Codigo OTP enviado",
    details: "Codigo de verificacao enviado para fornecedor@empresa.com.br",
    user: "Sistema",
    userEmail: "sistema@petrobras.com.br",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    status: "info",
    ip: "10.0.0.1",
    shareId: "SOL-2024-001228"
  },
  {
    id: "5",
    action: "EXPIRACAO",
    description: "Link expirado",
    details: "Link de compartilhamento expirou automaticamente apos 72 horas",
    user: "Sistema",
    userEmail: "sistema@petrobras.com.br",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: "warning",
    ip: "10.0.0.1",
    shareId: "SOL-2024-001200"
  },
  {
    id: "6",
    action: "CADASTRO",
    description: "Usuario externo cadastrado",
    details: "Novo usuario 'parceiro@empresa.com' cadastrado pelo suporte",
    user: "Suporte Demo",
    userEmail: "suporte@petrobras.com.br",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    status: "success",
    ip: "10.0.0.50",
    shareId: null
  },
  {
    id: "7",
    action: "LOGIN",
    description: "Login realizado",
    details: "Usuario supervisor@petrobras.com.br realizou login no sistema",
    user: "Supervisor Demo",
    userEmail: "supervisor@petrobras.com.br",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    status: "info",
    ip: "10.0.0.45",
    shareId: null
  },
  {
    id: "8",
    action: "UPLOAD",
    description: "Arquivo enviado",
    details: "Arquivo 'Proposta_Comercial.pdf' enviado para aprovacao",
    user: "Maria Santos",
    userEmail: "maria@petrobras.com.br",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: "info",
    ip: "10.0.0.55",
    shareId: "SOL-2024-001250"
  },
]

export default function LogsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [logFilter, setLogFilter] = useState("all")
  const [logSearch, setLogSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated || user?.userType !== "supervisor") {
        router.push("/")
      } else {
        setIsLoading(false)
      }
    }, 1200)

    return () => clearTimeout(timer)
  }, [isAuthenticated, user, router])

  // Filtrar logs
  const filteredLogs = DEMO_LOGS.filter((log) => {
    const matchesSearch = 
      log.description.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.user.toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.shareId?.toLowerCase().includes(logSearch.toLowerCase()) ?? false)

    const matchesFilter = logFilter === "all" || log.status === logFilter

    return matchesSearch && matchesFilter
  })

  // Estatisticas
  const stats = {
    total: DEMO_LOGS.length,
    success: DEMO_LOGS.filter(l => l.status === "success").length,
    error: DEMO_LOGS.filter(l => l.status === "error").length,
    warning: DEMO_LOGS.filter(l => l.status === "warning").length,
    info: DEMO_LOGS.filter(l => l.status === "info").length,
  }

  const getLogIcon = (action: string) => {
    switch (action) {
      case "APROVACAO": return <CheckCircle className="h-4 w-4" />
      case "REJEICAO": return <XCircle className="h-4 w-4" />
      case "DOWNLOAD": return <Download className="h-4 w-4" />
      case "ENVIO_CODIGO": return <Mail className="h-4 w-4" />
      case "EXPIRACAO": return <Clock className="h-4 w-4" />
      case "CADASTRO": return <User className="h-4 w-4" />
      case "LOGIN": return <Shield className="h-4 w-4" />
      case "UPLOAD": return <FileText className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getLogStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
      case "error": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
      case "warning": return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
      default: return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
    }
  }

  const getLogBorderColor = (status: string) => {
    switch (status) {
      case "success": return "border-l-emerald-500"
      case "error": return "border-l-red-500"
      case "warning": return "border-l-amber-500"
      default: return "border-l-blue-500"
    }
  }

  if (isLoading) {
    return (
      <FullPageLoader
        message="Carregando logs do sistema..."
        subMessage="Buscando registros de atividades"
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
            { label: "Supervisor", href: "/supervisor" }, 
            { label: "Logs e Rastreamento" }
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
                <h1 className="text-3xl font-bold text-foreground">Logs e Rastreamento</h1>
                <p className="text-muted-foreground">Historico completo de acoes e eventos do sistema</p>
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

        {/* Cards de Estatisticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${logFilter === "all" ? "ring-2 ring-[#0047BB]" : ""}`}
            onClick={() => setLogFilter("all")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0047BB]/10 to-[#0047BB]/5 flex items-center justify-center">
                  <History className="h-5 w-5 text-[#0047BB]" />
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
                  Exibindo {filteredLogs.length} de {DEMO_LOGS.length} registros
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => {
                  setLogFilter("all")
                  setLogSearch("")
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
            {(logSearch || logFilter !== "all") && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                {logSearch && (
                  <Badge variant="secondary" className="gap-1">
                    Busca: {logSearch}
                    <button onClick={() => setLogSearch("")} className="ml-1 hover:text-destructive">x</button>
                  </Badge>
                )}
                {logFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Tipo: {logFilter === "success" ? "Sucesso" : logFilter === "error" ? "Erro" : logFilter === "warning" ? "Aviso" : "Info"}
                    <button onClick={() => setLogFilter("all")} className="ml-1 hover:text-destructive">x</button>
                  </Badge>
                )}
              </div>
            )}

            {/* Timeline de logs */}
            <div className="space-y-3 mt-6">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Nenhum log encontrado</p>
                  <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros de busca</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`bg-background/50 border border-l-4 ${getLogBorderColor(log.status)} rounded-xl p-4 hover:bg-background/80 transition-colors`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl ${getLogStatusColor(log.status)}`}>
                        {getLogIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-foreground">{log.description}</span>
                          <Badge variant="outline" className={`text-xs ${getLogStatusColor(log.status)}`}>
                            {log.action}
                          </Badge>
                          {log.shareId && (
                            <Badge variant="outline" className="text-xs font-mono">
                              {log.shareId}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{log.details}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.user}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.timestamp).toLocaleString("pt-BR")}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            IP: {log.ip}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
