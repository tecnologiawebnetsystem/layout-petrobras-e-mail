"use client"

import { useState } from "react"
import {
  Users, FileText, Activity, HardDrive, Mail, Shield,
  Eye, BarChart3, Clock, CheckCircle, XCircle, AlertTriangle,
  Download, Upload, TrendingUp, Search, Share2, FileSpreadsheet,
  Filter, LogOut, Building2, MapPin, User, FolderOpen,
  ChevronDown, RefreshCw, Send,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// ---------- dados mockados ----------
const MOCK_USER = {
  name: "Admin SCAC",
  email: "admin@petrobras.com.br",
  jobTitle: "Administrador do Sistema",
  department: "TI — Sistemas Corporativos",
  userType: "admin",
  manager: { name: "Diretor Geral", email: "diretor@petrobras.com.br", jobTitle: "Diretor de TI" },
}

const METRICS = {
  users:  { total: 48,  internal: 32, external: 12, supervisors: 3, admins: 1,  active: 45 },
  shares: { total: 127, pending: 8,   approved: 89, active: 42,    rejected: 12, expired: 18 },
  files:  { total: 342, storage_mb: 1200.12 },
  audit:  { total_logs: 4521, last7d: 312 },
  emails: { sent: 89 },
}

const LOGS = [
  { id: 1, action: "LOGIN",                    user: "admin@petrobras.com.br",          ip: "10.15.22.101", detail: "Login via Entra ID (SSO)",                     time: "08:14:33", level: "Sucesso" },
  { id: 2, action: "UPLOAD_ARQUIVO",           user: "carlos.silva@petrobras.com.br",   ip: "10.15.22.45",  detail: "Contrato_Fornecedor_2025.pdf (4.2 MB)",         time: "08:22:17", level: "Sucesso" },
  { id: 3, action: "APROVAR_COMPARTILHAMENTO", user: "ana.santos@petrobras.com.br",     ip: "10.15.23.88",  detail: "Compartilhamento #122 aprovado",                 time: "08:31:45", level: "Sucesso" },
  { id: 4, action: "OTP_VALIDADO",             user: "externo@parceiro.com",            ip: "189.45.67.201",detail: "OTP validado — 1ª tentativa — Share #122",       time: "08:34:22", level: "Sucesso" },
  { id: 5, action: "DOWNLOAD_ARQUIVO",         user: "externo@parceiro.com",            ip: "189.45.67.201",detail: "RelatorioTecnico_Q1_2025.pdf — Share #122",      time: "08:35:11", level: "Sucesso" },
  { id: 6, action: "REJEITAR_COMPARTILHAMENTO",user: "paulo.lima@petrobras.com.br",     ip: "10.15.24.33",  detail: "Share #119 — documentação incompleta",           time: "09:05:48", level: "Aviso"   },
  { id: 7, action: "LOGIN_FALHA",              user: "teste@petrobras.com.br",          ip: "10.15.19.77",  detail: "Token expirado ou usuário inativo",               time: "09:17:33", level: "Erro"    },
  { id: 8, action: "OTP_MAX_TENTATIVAS",       user: "externo3@terceiro.com",           ip: "190.22.11.55", detail: "Acesso bloqueado após 3 tentativas inválidas",   time: "10:23:31", level: "Erro"    },
]

const SHARES = [
  { id: "#122", name: "Relatório Q1 2025",       dest: "externo@parceiro.com",      files: 3,  status: "Aprovado",  by: "C. Silva",    exp: "08/06/2025" },
  { id: "#123", name: "Plantas Bloco A-D",        dest: "eng@construtora.com",       files: 7,  status: "Pendente",  by: "M. Costa",    exp: "09/06/2025" },
  { id: "#124", name: "Contrato Fornecimento",    dest: "juridico@fornecedor.com",   files: 2,  status: "Aprovado",  by: "R. Ferreira", exp: "06/06/2025" },
  { id: "#119", name: "Documentos Auditoria",     dest: "auditoria@parceiro.com",    files: 4,  status: "Rejeitado", by: "J. Alves",    exp: "—"          },
  { id: "#128", name: "Relatório Consultoria",    dest: "auditoria@consultoria.com", files: 6,  status: "Pendente",  by: "M. Costa",    exp: "09/06/2025" },
]

const USERS = [
  { name: "Admin SCAC",         email: "admin@petrobras.com.br",          type: "Admin",     status: "Ativo", last: "Hoje 08:14" },
  { name: "Carlos Silva",       email: "carlos.silva@petrobras.com.br",   type: "Interno",   status: "Ativo", last: "Hoje 08:22" },
  { name: "Ana Santos",         email: "ana.santos@petrobras.com.br",     type: "Supervisor",status: "Ativo", last: "Hoje 08:31" },
  { name: "Paulo Lima",         email: "paulo.lima@petrobras.com.br",     type: "Interno",   status: "Ativo", last: "Hoje 09:05" },
  { name: "Maria Costa",        email: "maria.costa@petrobras.com.br",    type: "Interno",   status: "Ativo", last: "Ontem"      },
  { name: "Externo Parceiro",   email: "externo@parceiro.com",            type: "Externo",   status: "Ativo", last: "Hoje 08:35" },
]

const MEUS_SHARES = [
  { id: "#130", name: "Documentos Fiscais 2025",  dest: "contabil@parceiro.com",      files: 5,  status: "Aprovado", created: "02/06/2025", exp: "16/06/2025", downloads: 2 },
  { id: "#131", name: "Projeto Expansão Norte",   dest: "engenharia@construtora.com", files: 12, status: "Pendente", created: "02/06/2025", exp: "09/06/2025", downloads: 0 },
  { id: "#118", name: "Relatório Mensal Maio",    dest: "diretoria@parceiro.com",     files: 3,  status: "Aprovado", created: "28/05/2025", exp: "04/06/2025", downloads: 5 },
  { id: "#115", name: "Plantas Arquitetônicas",   dest: "arquitetura@empresa.com",    files: 8,  status: "Expirado", created: "20/05/2025", exp: "27/05/2025", downloads: 3 },
]

const levelColor: Record<string, string> = {
  Sucesso: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Aviso:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Erro:    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  Info:    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
}

const statusColor: Record<string, string> = {
  Aprovado: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Pendente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Rejeitado:"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  Cancelado:"bg-muted text-muted-foreground",
  Expirado: "bg-muted text-muted-foreground",
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

// ---------- componente principal ----------
export default function AdminDashboardPreview() {
  const [activeTab,       setActiveTab]       = useState("dashboard")
  const [selectedFiles,   setSelectedFiles]   = useState<File[]>([])
  const [destinatario,    setDestinatario]    = useState("")
  const [validade,        setValidade]        = useState("7")
  const [shareModalOpen,  setShareModalOpen]  = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportDataType,  setExportDataType]  = useState("users")
  const [exportFormat,    setExportFormat]    = useState("csv")
  const [logSearch,       setLogSearch]       = useState("")
  const [userSearch,      setUserSearch]      = useState("")

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

  const handleCreateShare = () => {
    if (!destinatario) { alert("Informe o e-mail do destinatário."); return }
    setShareModalOpen(true)
  }

  const filteredLogs  = LOGS.filter(l  => logSearch  === "" || l.action.includes(logSearch.toUpperCase())  || l.user.includes(logSearch))
  const filteredUsers = USERS.filter(u => userSearch === "" || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.includes(userSearch))

  return (
    <div className="min-h-screen bg-[#f8f9fa]">

      {/* ============================================================
          CABEÇALHO — padrão exato da imagem (logo BR + breadcrumb + avatar)
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
                    {getInitials(MOCK_USER.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-semibold text-gray-900">{MOCK_USER.name}</span>
                  <span className="text-xs text-gray-500">{MOCK_USER.jobTitle}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 shadow-xl">
              {/* Info do usuario */}
              <DropdownMenuLabel className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-[#00a859]/20">
                    <AvatarFallback className="bg-[#00a859] text-white text-sm font-bold">
                      {getInitials(MOCK_USER.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{MOCK_USER.name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{MOCK_USER.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500">{MOCK_USER.jobTitle}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500">{MOCK_USER.department}</p>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>

              {/* Supervisor */}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="py-2">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-400">Supervisor</p>
                    <p className="text-sm font-semibold text-gray-900">{MOCK_USER.manager.name}</p>
                    <p className="text-xs text-gray-500 truncate">{MOCK_USER.manager.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>

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
                onClick={() => window.location.href = "/"}
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
          TITULO DA PÁGINA — ícone + título + descrição + botão Atualizar
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
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.location.reload()}>
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
              <TabsTrigger value="dashboard"              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <BarChart3 className="w-3.5 h-3.5" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="usuarios"               className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <Users className="w-3.5 h-3.5" /> Usuários
              </TabsTrigger>
              <TabsTrigger value="shares"                 className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <FileText className="w-3.5 h-3.5" /> Gestão Global
              </TabsTrigger>
              <TabsTrigger value="logs"                   className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <Activity className="w-3.5 h-3.5" /> Logs
              </TabsTrigger>
              <TabsTrigger value="rastreamento"           className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <Eye className="w-3.5 h-3.5" /> Rastreamento
              </TabsTrigger>
              <TabsTrigger value="compartilhar"           className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <Upload className="w-3.5 h-3.5" /> Compartilhar
              </TabsTrigger>
              <TabsTrigger value="relatorios"             className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Relatórios
              </TabsTrigger>
              {/* aba oculta para meus compartilhamentos (acessada via dropdown) */}
              <TabsTrigger value="meus-compartilhamentos" className="hidden">
                Meus Compartilhamentos
              </TabsTrigger>
            </TabsList>

            {/* ======================================================
                ABA: DASHBOARD
            ====================================================== */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Métricas de Usuários */}
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Métricas de Usuários
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: "Total",       value: METRICS.users.total,       icon: <Users className="w-5 h-5" />,    color: "text-primary" },
                    { label: "Internos",    value: METRICS.users.internal,    icon: <Building2 className="w-5 h-5" />, color: "text-secondary" },
                    { label: "Externos",    value: METRICS.users.external,    icon: <User className="w-5 h-5" />,     color: "text-accent-foreground" },
                    { label: "Supervisores",value: METRICS.users.supervisors, icon: <Shield className="w-5 h-5" />,   color: "text-primary" },
                    { label: "Admins",      value: METRICS.users.admins,      icon: <Shield className="w-5 h-5" />,   color: "text-destructive" },
                    { label: "Ativos",      value: METRICS.users.active,      icon: <CheckCircle className="w-5 h-5" />, color: "text-primary" },
                  ].map(m => (
                    <Card key={m.label} className="border border-border shadow-sm">
                      <CardContent className="p-4 flex flex-col items-center text-center">
                        <div className={`mb-1 ${m.color}`}>{m.icon}</div>
                        <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Métricas de Compartilhamentos */}
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-primary" /> Métricas de Compartilhamentos
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: "Total",     value: METRICS.shares.total,    color: "text-foreground" },
                    { label: "Pendentes", value: METRICS.shares.pending,  color: "text-yellow-600 dark:text-yellow-400" },
                    { label: "Aprovados", value: METRICS.shares.approved, color: "text-primary" },
                    { label: "Ativos",    value: METRICS.shares.active,   color: "text-primary" },
                    { label: "Rejeitados",value: METRICS.shares.rejected, color: "text-destructive" },
                    { label: "Expirados", value: METRICS.shares.expired,  color: "text-muted-foreground" },
                  ].map(m => (
                    <Card key={m.label} className="border border-border shadow-sm">
                      <CardContent className="p-4 text-center">
                        <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Arquivos & Auditoria */}
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-primary" /> Arquivos & Auditoria
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Arquivos", value: METRICS.files.total,        icon: <FileText className="w-5 h-5" />,   color: "text-primary" },
                    { label: "Storage Usado",  value: `${METRICS.files.storage_mb.toFixed(0)} MB`, icon: <HardDrive className="w-5 h-5" />, color: "text-secondary" },
                    { label: "Total Logs",     value: METRICS.audit.total_logs,   icon: <Activity className="w-5 h-5" />,   color: "text-foreground" },
                    { label: "E-mails Enviados",value: METRICS.emails.sent,       icon: <Mail className="w-5 h-5" />,       color: "text-primary" },
                  ].map(m => (
                    <Card key={m.label} className="border border-border shadow-sm">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`flex-shrink-0 ${m.color}`}>{m.icon}</div>
                        <div>
                          <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                          <p className="text-xs text-muted-foreground">{m.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ======================================================
                ABA: USUÁRIOS
            ====================================================== */}
            <TabsContent value="usuarios">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Gerenciamento de Usuários
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Visualize e gerencie todos os usuários cadastrados no sistema.
                  </CardDescription>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-9 h-9 text-sm"
                      placeholder="Buscar usuário..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold">Nome</TableHead>
                        <TableHead className="text-xs font-semibold">E-mail</TableHead>
                        <TableHead className="text-xs font-semibold">Perfil</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Último Acesso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(u => (
                        <TableRow key={u.email} className="hover:bg-muted/30">
                          <TableCell className="text-xs font-medium">{u.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{u.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-medium">{u.status}</span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{u.last}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ======================================================
                ABA: GESTÃO GLOBAL
            ====================================================== */}
            <TabsContent value="shares">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-primary" /> Gestão Global de Compartilhamentos
                  </CardTitle>
                  <CardDescription className="text-xs">Todos os compartilhamentos do sistema.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold">ID</TableHead>
                        <TableHead className="text-xs font-semibold">Nome</TableHead>
                        <TableHead className="text-xs font-semibold">Destinatário</TableHead>
                        <TableHead className="text-xs font-semibold">Arquivos</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Criado por</TableHead>
                        <TableHead className="text-xs font-semibold">Expiração</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {SHARES.map(s => (
                        <TableRow key={s.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs font-mono text-muted-foreground">{s.id}</TableCell>
                          <TableCell className="text-xs font-medium">{s.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{s.dest}</TableCell>
                          <TableCell className="text-xs text-center">{s.files}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status] ?? "bg-muted text-muted-foreground"}`}>
                              {s.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">{s.by}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{s.exp}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ======================================================
                ABA: LOGS
            ====================================================== */}
            <TabsContent value="logs">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" /> Logs do Sistema
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {METRICS.audit.total_logs.toLocaleString()} registros — últimos 7 dias: {METRICS.audit.last7d}
                  </CardDescription>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-9 h-9 text-sm"
                      placeholder="Filtrar por ação ou usuário..."
                      value={logSearch}
                      onChange={e => setLogSearch(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold">Hora</TableHead>
                        <TableHead className="text-xs font-semibold">Ação</TableHead>
                        <TableHead className="text-xs font-semibold">Usuário</TableHead>
                        <TableHead className="text-xs font-semibold">IP</TableHead>
                        <TableHead className="text-xs font-semibold">Detalhe</TableHead>
                        <TableHead className="text-xs font-semibold">Nível</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map(l => (
                        <TableRow key={l.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">{l.time}</TableCell>
                          <TableCell className="text-xs font-medium">{l.action}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{l.user}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{l.ip}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{l.detail}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColor[l.level] ?? "bg-muted text-muted-foreground"}`}>
                              {l.level}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ======================================================
                ABA: RASTREAMENTO
            ====================================================== */}
            <TabsContent value="rastreamento">
              <Card className="border border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" /> Rastreamento de Atividades
                  </CardTitle>
                  <CardDescription className="text-xs">Busque atividades por usuário ou e-mail.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input className="flex-1 h-9 text-sm" placeholder="Digite o e-mail ou nome para rastrear..." />
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 gap-2">
                      <Search className="w-4 h-4" /> Rastrear
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {LOGS.slice(0, 5).map(l => (
                      <div key={l.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${l.level === "Erro" ? "bg-destructive" : l.level === "Aviso" ? "bg-yellow-500" : "bg-primary"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-foreground truncate">{l.action}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{l.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{l.user} — {l.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ======================================================
                ABA: COMPARTILHAR — padrão igual às outras páginas
            ====================================================== */}
            <TabsContent value="compartilhar" className="space-y-6">
              {/* Aviso de aprovação automática (admin) */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-green-800 dark:text-green-400">Aprovacao automatica</p>
                    <p className="text-sm text-green-700 dark:text-green-500 leading-relaxed">
                      Como administrador, seus compartilhamentos serao aprovados imediatamente e o destinatario recebera acesso aos arquivos assim que o envio for concluido.
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
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      O destinatario recebera um e-mail com link seguro para download
                    </p>
                  </div>

                  {/* Zona de upload — visual igual ao DragDropZone */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Anexar Arquivos</Label>
                    <div
                      onClick={handleFileSelect}
                      className="relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-500 cursor-pointer border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-lg"
                    >
                      <div className="space-y-4">
                        <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <Upload className="h-12 w-12 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-2">Arraste e solte os arquivos</h3>
                          <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar do seu computador</p>
                          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> PDF</span>
                            <span className="flex items-center gap-1"><FileSpreadsheet className="h-4 w-4" /> Excel</span>
                            <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> DWG</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="lg"
                          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg"
                          onClick={e => { e.stopPropagation(); handleFileSelect() }}
                        >
                          <Upload className="h-5 w-5 mr-2" /> Selecionar Arquivos
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Lista de arquivos selecionados */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          Arquivos Prontos ({selectedFiles.length})
                        </h4>
                        <p className="text-sm text-muted-foreground font-medium">
                          Total: {(selectedFiles.reduce((a, f) => a + f.size, 0) / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <div className="grid gap-3">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-4 bg-gradient-to-r from-card to-card/50 border rounded-xl hover:shadow-lg transition-all duration-300 group">
                            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                              <FileText className="h-8 w-8 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-foreground truncate">{file.name}</p>
                                <p className="text-sm text-muted-foreground flex-shrink-0 ml-2">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Pronto</span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                              className="flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
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
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Os arquivos ficarao disponiveis para download por {validade} horas apos a aprovacao.
                    </p>
                  </div>

                  {/* Descricao */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Descricao do Envio (obrigatorio)</Label>
                    <Textarea
                      placeholder="Descreva o conteudo e a finalidade dos arquivos..."
                      className="min-h-[120px] resize-none text-base"
                    />
                  </div>

                  {/* Botao de envio */}
                  <div className="flex justify-end pt-4">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold px-10 text-base shadow-lg hover:shadow-xl"
                      onClick={handleCreateShare}
                    >
                      <Send className="h-5 w-5 mr-2" /> Enviar para Aprovacao
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
                    <div className="flex justify-between"><span className="text-muted-foreground">Destinatario:</span><span className="font-medium">{destinatario}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Arquivos:</span><span className="font-medium">{selectedFiles.length} arquivos</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Validade:</span><span className="font-medium">{validade} horas</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">ID:</span><span className="font-mono font-medium">#132</span></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShareModalOpen(false)}>Fechar</Button>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => { setShareModalOpen(false); setActiveTab("meus-compartilhamentos") }}>
                      Ver Meus Compartilhamentos
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* ======================================================
                ABA: RELATÓRIOS — Design moderno e bonito
            ====================================================== */}
            <TabsContent value="relatorios" className="space-y-6">
              {/* Header da seção */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Central de Relatorios</h2>
                    <p className="text-sm text-muted-foreground">Exporte dados do sistema em diferentes formatos</p>
                  </div>
                </div>
              </div>

              {/* Cards de seleção de tipo de relatório */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { 
                    key: "users", 
                    label: "Usuarios", 
                    desc: "Lista completa de usuarios do sistema",
                    count: 48, 
                    icon: <Users className="w-8 h-8" />,
                    gradient: "from-blue-500 to-blue-600",
                    lightBg: "bg-blue-50 dark:bg-blue-950/30",
                    iconColor: "text-blue-600 dark:text-blue-400"
                  },
                  { 
                    key: "shares", 
                    label: "Compartilhamentos", 
                    desc: "Historico de todos os compartilhamentos",
                    count: 127, 
                    icon: <Share2 className="w-8 h-8" />,
                    gradient: "from-emerald-500 to-emerald-600",
                    lightBg: "bg-emerald-50 dark:bg-emerald-950/30",
                    iconColor: "text-emerald-600 dark:text-emerald-400"
                  },
                  { 
                    key: "audit", 
                    label: "Logs de Auditoria", 
                    desc: "Registro de todas as acoes do sistema",
                    count: 4521, 
                    icon: <Activity className="w-8 h-8" />,
                    gradient: "from-purple-500 to-purple-600",
                    lightBg: "bg-purple-50 dark:bg-purple-950/30",
                    iconColor: "text-purple-600 dark:text-purple-400"
                  },
                ].map(t => (
                  <div
                    key={t.key}
                    onClick={() => setExportDataType(t.key)}
                    className={`group cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      exportDataType === t.key 
                        ? `border-primary bg-gradient-to-br ${t.gradient} text-white shadow-lg` 
                        : `border-border bg-card hover:border-primary/50 ${t.lightBg}`
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                      exportDataType === t.key 
                        ? "bg-white/20" 
                        : "bg-white dark:bg-gray-800 shadow-sm"
                    }`}>
                      <div className={exportDataType === t.key ? "text-white" : t.iconColor}>
                        {t.icon}
                      </div>
                    </div>
                    <h3 className={`text-lg font-bold mb-1 ${exportDataType === t.key ? "text-white" : "text-foreground"}`}>
                      {t.label}
                    </h3>
                    <p className={`text-sm mb-3 ${exportDataType === t.key ? "text-white/80" : "text-muted-foreground"}`}>
                      {t.desc}
                    </p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                      exportDataType === t.key 
                        ? "bg-white/20 text-white" 
                        : "bg-white dark:bg-gray-800 text-foreground shadow-sm"
                    }`}>
                      <HardDrive className="w-4 h-4" />
                      {t.count.toLocaleString()} registros
                    </div>
                  </div>
                ))}
              </div>

              {/* Configuração de exportação */}
              <Card className="border border-border shadow-sm bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Filter className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Configurar Exportacao</h3>
                      <p className="text-sm text-muted-foreground">Escolha o formato e personalize o relatorio</p>
                    </div>
                  </div>

                  {/* Seleção de formato com cards visuais */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Formato do Arquivo</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "csv", label: "CSV", desc: "Excel / Planilhas", icon: <FileSpreadsheet className="w-6 h-6" />, color: "text-green-600" },
                        { value: "pdf", label: "PDF", desc: "Documento formatado", icon: <FileText className="w-6 h-6" />, color: "text-red-600" },
                        { value: "txt", label: "TXT", desc: "Texto simples", icon: <FileText className="w-6 h-6" />, color: "text-gray-600" },
                      ].map(f => (
                        <div
                          key={f.value}
                          onClick={() => setExportFormat(f.value)}
                          className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all duration-200 hover:shadow-md ${
                            exportFormat === f.value 
                              ? "border-primary bg-primary/5" 
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          <div className={`${f.color} mb-2 flex justify-center`}>{f.icon}</div>
                          <p className="font-semibold text-foreground">{f.label}</p>
                          <p className="text-xs text-muted-foreground">{f.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Período (opcional) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Data Inicial</Label>
                      <Input type="date" className="h-11" defaultValue="2025-01-01" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Data Final</Label>
                      <Input type="date" className="h-11" defaultValue="2025-06-02" />
                    </div>
                  </div>

                  {/* Botão de exportação */}
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => setExportModalOpen(true)}
                  >
                    <Download className="w-5 h-5 mr-2" /> Gerar e Baixar Relatorio
                  </Button>
                </CardContent>
              </Card>

              {/* Histórico de exportações */}
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold">Exportacoes Recentes</CardTitle>
                        <CardDescription className="text-sm">Ultimos relatorios gerados</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">Ultimos 7 dias</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { file: "relatorio_users_2025-06-01.csv",  type: "Usuarios",          size: "12 KB",  date: "Hoje, 14:32", status: "success", icon: <Users className="w-4 h-4" />, color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
                    { file: "relatorio_shares_2025-06-01.pdf", type: "Compartilhamentos", size: "48 KB",  date: "Hoje, 09:15", status: "success", icon: <Share2 className="w-4 h-4" />, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
                    { file: "relatorio_audit_2025-05-31.csv",  type: "Auditoria",         size: "256 KB", date: "Ontem, 17:48", status: "success", icon: <Activity className="w-4 h-4" />, color: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
                    { file: "relatorio_users_2025-05-30.pdf",  type: "Usuarios",          size: "15 KB",  date: "30/05, 11:20", status: "success", icon: <Users className="w-4 h-4" />, color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
                  ].map((r, idx) => (
                    <div 
                      key={`${r.file}-${idx}`} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-card to-card/50 border border-border rounded-xl hover:shadow-lg hover:border-primary/30 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.color}`}>
                          {r.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{r.file}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{r.type}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{r.size}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{r.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" /> Pronto
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Download className="w-4 h-4 mr-1" /> Baixar
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Modal de sucesso — exportação */}
              <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl">Relatorio Gerado com Sucesso!</DialogTitle>
                    <DialogDescription className="text-center">Seu arquivo esta pronto para download.</DialogDescription>
                  </DialogHeader>
                  <div className="bg-gradient-to-r from-muted to-muted/50 rounded-xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tipo de Dados</span>
                      <span className="font-semibold text-foreground">{exportDataType === "users" ? "Usuarios" : exportDataType === "shares" ? "Compartilhamentos" : "Logs de Auditoria"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Formato</span>
                      <Badge variant="secondary">{exportFormat.toUpperCase()}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total de Registros</span>
                      <span className="font-semibold text-foreground">{exportDataType === "users" ? "48" : exportDataType === "shares" ? "127" : "4.521"}</span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
                        <FileSpreadsheet className="w-8 h-8 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">relatorio_{exportDataType}_2025-06-02.{exportFormat}</p>
                          <p className="text-xs text-muted-foreground">Pronto para download</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="flex gap-2 sm:gap-2">
                    <Button variant="outline" onClick={() => setExportModalOpen(false)} className="flex-1">Fechar</Button>
                    <Button 
                      className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white" 
                      onClick={() => setExportModalOpen(false)}
                    >
                      <Download className="w-4 h-4 mr-2" /> Baixar Arquivo
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* ======================================================
                ABA: MEUS COMPARTILHAMENTOS (acessada pelo dropdown)
            ====================================================== */}
            <TabsContent value="meus-compartilhamentos">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-primary" /> Meus Compartilhamentos
                  </CardTitle>
                  <CardDescription className="text-xs">Compartilhamentos criados por você.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold">ID</TableHead>
                        <TableHead className="text-xs font-semibold">Nome</TableHead>
                        <TableHead className="text-xs font-semibold">Destinatário</TableHead>
                        <TableHead className="text-xs font-semibold">Arquivos</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Criado em</TableHead>
                        <TableHead className="text-xs font-semibold">Expiração</TableHead>
                        <TableHead className="text-xs font-semibold">Downloads</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MEUS_SHARES.map(s => (
                        <TableRow key={s.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs font-mono text-muted-foreground">{s.id}</TableCell>
                          <TableCell className="text-xs font-medium">{s.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{s.dest}</TableCell>
                          <TableCell className="text-xs text-center">{s.files}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status] ?? "bg-muted text-muted-foreground"}`}>
                              {s.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{s.created}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{s.exp}</TableCell>
                          <TableCell className="text-xs text-center">{s.downloads}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
  )
}
