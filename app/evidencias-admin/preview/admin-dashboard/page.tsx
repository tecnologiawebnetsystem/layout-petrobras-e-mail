"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import {
  Users, FileText, Activity, HardDrive, Mail, Shield,
  Eye, BarChart3, Clock, CheckCircle, XCircle, AlertTriangle,
  Download, Upload, TrendingUp, Search, Share2, FileSpreadsheet,
  Filter, LogOut, Building2, MapPin, User, FolderOpen,
  RefreshCw, Send, Loader2,
} from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/stores/auth-store"
import { ProtectedRoute } from "@/components/auth/protected-route"

// ---------- tipos ----------
interface DashboardMetrics {
  users: { total: number; internal: number; external: number; supervisors: number; admins: number; active: number }
  shares: { total: number; pending: number; approved: number; active: number; rejected: number; expired: number }
  files: { total: number; storage_mb: number }
  audit: { total_logs: number; last7d: number }
  emails: { sent: number }
}

interface LogEntry {
  id: number
  action: string
  user: string
  ip: string
  detail: string
  time: string
  level: string
  created_at?: string
}

interface UserEntry {
  id?: string
  name: string
  email: string
  type: string
  status: string
  last: string
  userType?: string
  lastLogin?: string
}

interface ShareEntry {
  id: string
  name: string
  dest: string
  files: number
  status: string
  by: string
  exp: string
  recipientEmail?: string
  fileCount?: number
  createdByName?: string
  expiresAt?: string
}

interface TrackingEntry {
  action: string
  detail: string
  ip: string
  time: string
  level: string
}

// ---------- fetcher para SWR ----------
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) throw new Error("Erro ao buscar dados")
  const data = await res.json()
  return data.data || data
}

// ---------- cores ----------
const levelColor: Record<string, string> = {
  Sucesso: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Aviso:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Erro:    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  error:   "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  Info:    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  info:    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
}

const statusColor: Record<string, string> = {
  Aprovado:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  approved:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Pendente:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  pending:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Rejeitado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  rejected:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  Cancelado: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
  Expirado:  "bg-muted text-muted-foreground",
  expired:   "bg-muted text-muted-foreground",
  Ativo:     "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  active:    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Inativo:   "bg-muted text-muted-foreground",
  inactive:  "bg-muted text-muted-foreground",
}

function getInitials(name: string) {
  return name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??"
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return `Hoje ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    if (diffDays === 1) return "Ontem"
    return d.toLocaleDateString("pt-BR")
  } catch {
    return dateStr
  }
}

// ---------- componente principal ----------
function AdminDashboardContent() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [destinatario, setDestinatario] = useState("")
  const [descricao, setDescricao] = useState("")
  const [validade, setValidade] = useState("168")
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportDataType, setExportDataType] = useState("users")
  const [exportFormat, setExportFormat] = useState("csv")
  const [logSearch, setLogSearch] = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [trackingEmail, setTrackingEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shareSuccess, setShareSuccess] = useState<{ id: string } | null>(null)

  // ---------- SWR: dados reais das APIs ----------
  const { data: dashboardData, error: dashboardError, isLoading: dashboardLoading, mutate: mutateDashboard } = 
    useSWR<DashboardMetrics>("/api/admin/dashboard", fetcher, { refreshInterval: 30000 })

  const { data: logsData, error: logsError, isLoading: logsLoading, mutate: mutateLogs } = 
    useSWR<LogEntry[]>("/api/admin/logs", fetcher, { refreshInterval: 15000 })

  const { data: usersData, error: usersError, isLoading: usersLoading, mutate: mutateUsers } = 
    useSWR<UserEntry[]>("/api/admin/users", fetcher, { refreshInterval: 30000 })

  const { data: sharesData, error: sharesError, isLoading: sharesLoading, mutate: mutateShares } = 
    useSWR<ShareEntry[]>("/api/admin/shares", fetcher, { refreshInterval: 15000 })

  const { data: trackingData, error: trackingError, isLoading: trackingLoading, mutate: mutateTracking } = 
    useSWR<TrackingEntry[]>(
      trackingEmail ? `/api/admin/tracking/by-email?email=${encodeURIComponent(trackingEmail)}` : null,
      fetcher
    )

  // Metricas com fallback
  const metrics: DashboardMetrics = dashboardData || {
    users: { total: 0, internal: 0, external: 0, supervisors: 0, admins: 0, active: 0 },
    shares: { total: 0, pending: 0, approved: 0, active: 0, rejected: 0, expired: 0 },
    files: { total: 0, storage_mb: 0 },
    audit: { total_logs: 0, last7d: 0 },
    emails: { sent: 0 },
  }

  const logs = logsData || []
  const users = usersData || []
  const shares = sharesData || []
  const tracking = trackingData || []

  // Filtragem local
  const filteredLogs = logs.filter(l => 
    logSearch === "" || 
    l.action?.toLowerCase().includes(logSearch.toLowerCase()) || 
    l.user?.toLowerCase().includes(logSearch.toLowerCase())
  )
  
  const filteredUsers = users.filter(u => 
    userSearch === "" || 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  // ---------- handlers ----------
  const handleFileSelect = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.accept = ".pdf,.xlsx,.xls,.dwg,.doc,.docx,.zip"
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files
      if (f) setSelectedFiles(prev => [...prev, ...Array.from(f)])
    }
    input.click()
  }

  const handleCreateShare = async () => {
    if (!destinatario) {
      return
    }
    if (selectedFiles.length === 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("recipientEmail", destinatario)
      formData.append("description", descricao || "Compartilhamento via Admin")
      formData.append("expirationHours", validade)
      selectedFiles.forEach(file => formData.append("files", file))

      const res = await fetch("/api/shares/create", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Erro ao criar compartilhamento")
      }

      const data = await res.json()
      setShareSuccess({ id: data.data?.id || data.id || "N/A" })
      setShareModalOpen(true)
      setSelectedFiles([])
      setDestinatario("")
      setDescricao("")
      mutateShares()
      mutateDashboard()
    } catch (err) {
      console.error("[v0] Erro ao criar compartilhamento:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = async () => {
    setExportModalOpen(true)
    // A exportacao real seria feita aqui chamando uma API
    // Por enquanto apenas mostra o modal de sucesso
  }

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const handleRefresh = () => {
    mutateDashboard()
    mutateLogs()
    mutateUsers()
    mutateShares()
  }

  const handleTrackingSearch = () => {
    if (trackingEmail) {
      mutateTracking()
    }
  }

  // Loading state
  const isPageLoading = dashboardLoading && !dashboardData

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">

      {/* ============================================================
          CABECALHO
      ============================================================ */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Esquerda: Logo BR + Breadcrumb */}
          <div className="flex items-center gap-3">
            <Image
              src="/images/petrobras-logo.png"
              alt="Petrobras"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            <span className="text-sm text-gray-600">
              Inicio &gt; <span className="text-gray-800 font-medium">Administracao</span>
            </span>
          </div>

          {/* Direita: Avatar + Nome + Cargo — com Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors cursor-pointer">
                <Avatar className="h-9 w-9 bg-[#00a859]">
                  <AvatarFallback className="bg-[#00a859] text-white text-sm font-bold">
                    {getInitials(user?.name || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-semibold text-gray-900">{user?.name || "Admin"}</span>
                  <span className="text-xs text-gray-500">{user?.jobTitle || "Administrador"}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 shadow-xl">
              <DropdownMenuLabel className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-[#00a859]/20">
                    <AvatarFallback className="bg-[#00a859] text-white text-sm font-bold">
                      {getInitials(user?.name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500">{user?.jobTitle || "Administrador"}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500">{user?.department || "TI"}</p>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>

              {user?.manager && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="py-2">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-400">Supervisor</p>
                        <p className="text-sm font-semibold text-gray-900">{user.manager.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.manager.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActiveTab("meus-compartilhamentos")}
                className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 min-h-[44px]"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Meus Compartilhamentos</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 cursor-pointer text-red-600 hover:bg-red-50 min-h-[44px]"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ============================================================
          TITULO DA PAGINA
      ============================================================ */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#00a859]/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#00a859]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-sm text-gray-500">Gerencie usuarios, compartilhamentos e configuracoes do sistema</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" /> Atualizar
          </Button>
        </div>
      </div>

      {/* ============================================================
          CONTEUDO PRINCIPAL
      ============================================================ */}
      <main className="container px-4 sm:px-6 py-6">

        {/* Badge de perfil */}
        <div className="flex items-center gap-3 mb-6">
          <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <Shield className="w-3 h-3 mr-1" /> Administrador
          </Badge>
          <span className="text-sm text-muted-foreground">
            Sistema de Acesso e Controle — SCAC
          </span>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Lista de abas */}
          <TabsList className="bg-muted border border-border mb-6 flex-wrap h-auto gap-1 p-1 w-full sm:w-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <BarChart3 className="w-3.5 h-3.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Users className="w-3.5 h-3.5" /> Usuarios
            </TabsTrigger>
            <TabsTrigger value="shares" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <FileText className="w-3.5 h-3.5" /> Gestao Global
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Activity className="w-3.5 h-3.5" /> Logs
            </TabsTrigger>
            <TabsTrigger value="rastreamento" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Eye className="w-3.5 h-3.5" /> Rastreamento
            </TabsTrigger>
            <TabsTrigger value="compartilhar" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Upload className="w-3.5 h-3.5" /> Compartilhar
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Relatorios
            </TabsTrigger>
            <TabsTrigger value="meus-compartilhamentos" className="hidden">
              Meus Compartilhamentos
            </TabsTrigger>
          </TabsList>

          {/* ======================================================
              ABA: DASHBOARD
          ====================================================== */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Metricas de Usuarios */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Metricas de Usuarios
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Total", value: metrics.users.total, icon: <Users className="w-5 h-5" />, color: "text-primary" },
                  { label: "Internos", value: metrics.users.internal, icon: <Building2 className="w-5 h-5" />, color: "text-secondary" },
                  { label: "Externos", value: metrics.users.external, icon: <User className="w-5 h-5" />, color: "text-accent-foreground" },
                  { label: "Supervisores", value: metrics.users.supervisors, icon: <Shield className="w-5 h-5" />, color: "text-primary" },
                  { label: "Admins", value: metrics.users.admins, icon: <Shield className="w-5 h-5" />, color: "text-destructive" },
                  { label: "Ativos", value: metrics.users.active, icon: <CheckCircle className="w-5 h-5" />, color: "text-primary" },
                ].map(m => (
                  <Card key={m.label} className="border border-border shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className={`mb-1 ${m.color}`}>{m.icon}</div>
                      <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Metricas de Compartilhamentos */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary" /> Metricas de Compartilhamentos
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Total", value: metrics.shares.total, color: "text-foreground" },
                  { label: "Pendentes", value: metrics.shares.pending, color: "text-yellow-600" },
                  { label: "Aprovados", value: metrics.shares.approved, color: "text-primary" },
                  { label: "Ativos", value: metrics.shares.active, color: "text-primary" },
                  { label: "Rejeitados", value: metrics.shares.rejected, color: "text-destructive" },
                  { label: "Expirados", value: metrics.shares.expired, color: "text-muted-foreground" },
                ].map(m => (
                  <Card key={m.label} className="border border-border shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Metricas de Sistema */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{metrics.files.total}</p>
                      <p className="text-xs text-muted-foreground">Arquivos ({(metrics.files.storage_mb / 1024).toFixed(2)} GB)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{metrics.audit.total_logs}</p>
                      <p className="text-xs text-muted-foreground">Logs de Auditoria ({metrics.audit.last7d} ultimos 7 dias)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{metrics.emails.sent}</p>
                      <p className="text-xs text-muted-foreground">E-mails Enviados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ======================================================
              ABA: USUARIOS
          ====================================================== */}
          <TabsContent value="usuarios" className="space-y-4">
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Usuarios do Sistema
                  </CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      className="pl-8 h-9 text-sm"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading && !users.length ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : usersError ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Erro ao carregar usuarios
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ultimo Acesso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u, idx) => (
                        <TableRow key={u.id || idx}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {u.type || u.userType || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColor[u.status] || "bg-muted"}>
                              {u.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {formatDate(u.lastLogin) || u.last || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======================================================
              ABA: GESTAO GLOBAL (shares)
          ====================================================== */}
          <TabsContent value="shares" className="space-y-4">
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Todos os Compartilhamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sharesLoading && !shares.length ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : sharesError ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Erro ao carregar compartilhamentos
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Destinatario</TableHead>
                        <TableHead>Arquivos</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado Por</TableHead>
                        <TableHead>Expira</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shares.map((s, idx) => (
                        <TableRow key={s.id || idx}>
                          <TableCell className="font-mono text-xs">{s.id}</TableCell>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-muted-foreground">{s.recipientEmail || s.dest}</TableCell>
                          <TableCell>{s.fileCount || s.files}</TableCell>
                          <TableCell>
                            <Badge className={statusColor[s.status] || "bg-muted"}>
                              {s.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{s.createdByName || s.by}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {formatDate(s.expiresAt) || s.exp}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======================================================
              ABA: LOGS
          ====================================================== */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" /> Logs de Auditoria
                  </CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por acao ou usuario..."
                      className="pl-8 h-9 text-sm"
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {logsLoading && !logs.length ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : logsError ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Erro ao carregar logs
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Horario</TableHead>
                          <TableHead>Acao</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>IP</TableHead>
                          <TableHead>Detalhes</TableHead>
                          <TableHead>Nivel</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.map((l, idx) => (
                          <TableRow key={l.id || idx}>
                            <TableCell className="font-mono text-xs whitespace-nowrap">{l.time}</TableCell>
                            <TableCell className="font-medium text-xs">{l.action}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{l.user}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{l.ip}</TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate">{l.detail}</TableCell>
                            <TableCell>
                              <Badge className={levelColor[l.level] || "bg-muted"}>
                                {l.level}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======================================================
              ABA: RASTREAMENTO
          ====================================================== */}
          <TabsContent value="rastreamento" className="space-y-4">
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" /> Rastreamento por Usuario
                </CardTitle>
                <CardDescription className="text-xs">
                  Busque todas as atividades de um usuario especifico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Digite o e-mail do usuario..."
                      className="pl-8"
                      value={trackingEmail}
                      onChange={(e) => setTrackingEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleTrackingSearch()}
                    />
                  </div>
                  <Button onClick={handleTrackingSearch} disabled={!trackingEmail || trackingLoading}>
                    {trackingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
                    Buscar
                  </Button>
                </div>

                {trackingEmail && trackingData && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Atividades de: <span className="text-primary">{trackingEmail}</span></p>
                    {tracking.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma atividade encontrada.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Horario</TableHead>
                            <TableHead>Acao</TableHead>
                            <TableHead>IP</TableHead>
                            <TableHead>Detalhes</TableHead>
                            <TableHead>Nivel</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tracking.map((t, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-xs">{t.time}</TableCell>
                              <TableCell className="font-medium text-xs">{t.action}</TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">{t.ip}</TableCell>
                              <TableCell className="text-xs">{t.detail}</TableCell>
                              <TableCell>
                                <Badge className={levelColor[t.level] || "bg-muted"}>{t.level}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======================================================
              ABA: COMPARTILHAR
          ====================================================== */}
          <TabsContent value="compartilhar" className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-green-800 dark:text-green-400">Aprovacao automatica</p>
                  <p className="text-sm text-green-700 dark:text-green-500 leading-relaxed">
                    Como administrador, seus compartilhamentos serao aprovados imediatamente.
                  </p>
                </div>
              </div>
            </div>

            <Card className="border border-border shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8 space-y-7">
                {/* Destinatario */}
                <div className="space-y-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Destinatario Externo
                  </Label>
                  <Input
                    type="email"
                    placeholder="cliente@empresa.com"
                    value={destinatario}
                    onChange={e => setDestinatario(e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Zona de upload */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Anexar Arquivos</Label>
                  <div
                    onClick={handleFileSelect}
                    className="relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-500 cursor-pointer border-border hover:border-primary/50 hover:bg-muted/30"
                  >
                    <div className="space-y-4">
                      <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <Upload className="h-12 w-12 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Arraste e solte os arquivos</h3>
                        <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
                      </div>
                      <Button type="button" size="lg" className="bg-gradient-to-r from-primary to-secondary text-white">
                        <Upload className="h-5 w-5 mr-2" /> Selecionar Arquivos
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lista de arquivos */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Arquivos Prontos ({selectedFiles.length})
                    </h4>
                    <div className="grid gap-3">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-card border rounded-xl group">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <XCircle className="h-5 w-5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tempo de disponibilidade */}
                <div className="space-y-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Tempo de Disponibilidade
                  </Label>
                  <Select value={validade} onValueChange={setValidade}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 horas (1 dia)</SelectItem>
                      <SelectItem value="48">48 horas (2 dias)</SelectItem>
                      <SelectItem value="72">72 horas (3 dias)</SelectItem>
                      <SelectItem value="168">168 horas (7 dias)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Descricao */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Descricao do Envio</Label>
                  <Textarea
                    placeholder="Descreva o conteudo dos arquivos..."
                    className="min-h-[100px]"
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                  />
                </div>

                {/* Botao de envio */}
                <div className="flex justify-end pt-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-secondary text-white px-10"
                    onClick={handleCreateShare}
                    disabled={isSubmitting || !destinatario || selectedFiles.length === 0}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5 mr-2" />
                    )}
                    Criar Compartilhamento
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Modal de sucesso */}
            <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-primary">
                    <CheckCircle className="w-5 h-5" /> Compartilhamento Criado!
                  </DialogTitle>
                  <DialogDescription>
                    O destinatario recebera um e-mail com o link de acesso.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Destinatario:</span>
                    <span className="font-medium">{destinatario}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Validade:</span>
                    <span className="font-medium">{validade} horas</span>
                  </div>
                  {shareSuccess && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-mono font-medium">{shareSuccess.id}</span>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShareModalOpen(false)}>Fechar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ======================================================
              ABA: RELATORIOS
          ====================================================== */}
          <TabsContent value="relatorios" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Central de Relatorios</h2>
                <p className="text-sm text-muted-foreground">Exporte dados do sistema</p>
              </div>
            </div>

            {/* Cards de tipo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: "users", label: "Usuarios", count: metrics.users.total, icon: <Users className="w-8 h-8" />, color: "blue" },
                { key: "shares", label: "Compartilhamentos", count: metrics.shares.total, icon: <Share2 className="w-8 h-8" />, color: "green" },
                { key: "audit", label: "Logs de Auditoria", count: metrics.audit.total_logs, icon: <Activity className="w-8 h-8" />, color: "purple" },
              ].map(t => (
                <div
                  key={t.key}
                  onClick={() => setExportDataType(t.key)}
                  className={`cursor-pointer rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${
                    exportDataType === t.key 
                      ? "border-primary bg-primary/5" 
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl bg-${t.color}-500/10 flex items-center justify-center mb-4 text-${t.color}-600`}>
                    {t.icon}
                  </div>
                  <h3 className="text-lg font-bold">{t.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t.count.toLocaleString()} registros</p>
                </div>
              ))}
            </div>

            {/* Configuracao */}
            <Card className="border border-border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Formato</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "csv", label: "CSV" },
                      { value: "pdf", label: "PDF" },
                      { value: "txt", label: "TXT" },
                    ].map(f => (
                      <div
                        key={f.value}
                        onClick={() => setExportFormat(f.value)}
                        className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all ${
                          exportFormat === f.value ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <p className="font-medium">{f.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-primary text-primary-foreground" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" /> Exportar Relatorio
                </Button>
              </CardContent>
            </Card>

            {/* Modal de exportacao */}
            <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-primary">
                    <CheckCircle className="w-5 h-5" /> Relatorio Gerado!
                  </DialogTitle>
                </DialogHeader>
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium">{exportDataType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Formato:</span>
                    <span className="font-medium">{exportFormat.toUpperCase()}</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setExportModalOpen(false)}>Fechar</Button>
                  <Button className="bg-primary text-primary-foreground">
                    <Download className="w-4 h-4 mr-2" /> Baixar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ======================================================
              ABA: MEUS COMPARTILHAMENTOS
          ====================================================== */}
          <TabsContent value="meus-compartilhamentos" className="space-y-4">
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-primary" /> Meus Compartilhamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sharesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Destinatario</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expira</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shares.filter(s => s.createdByName === user?.name || s.by === user?.name).slice(0, 10).map((s, idx) => (
                        <TableRow key={s.id || idx}>
                          <TableCell className="font-mono text-xs">{s.id}</TableCell>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-muted-foreground">{s.recipientEmail || s.dest}</TableCell>
                          <TableCell>
                            <Badge className={statusColor[s.status] || "bg-muted"}>{s.status}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{formatDate(s.expiresAt) || s.exp}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  )
}

// ---------- componente exportado com protecao ----------
export default function AdminDashboardPreview() {
  return (
    <ProtectedRoute allowedUserTypes={["admin"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
