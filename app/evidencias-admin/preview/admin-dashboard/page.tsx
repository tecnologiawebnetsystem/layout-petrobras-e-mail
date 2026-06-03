"use client"

import { useState } from "react"
import {
  Users, FileText, Activity, HardDrive, Mail, Shield,
  Eye, BarChart3, Clock, CheckCircle, XCircle, AlertTriangle,
  Download, Upload, TrendingUp, Search, Share2, FileSpreadsheet,
  Filter, LogOut, Building2, MapPin, User, FolderOpen,
  ChevronDown, RefreshCw,
} from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

          {/* Direita: Avatar + Nome + Cargo */}
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 bg-[#00a859]">
              <AvatarFallback className="bg-[#00a859] text-white text-sm font-bold">
                {getInitials(MOCK_USER.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-900">{MOCK_USER.name}</span>
              <span className="text-xs text-gray-500">{MOCK_USER.jobTitle}</span>
            </div>
          </div>
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
                ABA: COMPARTILHAR
            ====================================================== */}
            <TabsContent value="compartilhar" className="space-y-4">
              <Card className="border border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" /> Novo Compartilhamento
                  </CardTitle>
                  <CardDescription className="text-xs">Envie arquivos para destinatários externos de forma segura.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Zona de upload */}
                  <div
                    onClick={handleFileSelect}
                    className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
                  >
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">Arraste arquivos ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, XLSX, DWG — máximo 500 MB por arquivo</p>
                    <Button
                      size="sm"
                      className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                      onClick={e => { e.stopPropagation(); handleFileSelect() }}
                    >
                      Selecionar Arquivos
                    </Button>
                  </div>

                  {/* Lista de arquivos */}
                  <div className="space-y-2">
                    {[
                      { name: "Contrato_Fornecedor_2025.pdf", size: "4.2 MB", pct: 100 },
                      { name: "Plantas_Bloco_A-D.dwg",        size: "18.7 MB", pct: 100 },
                      { name: "Relatorio_Q1_2025.xlsx",        size: "1.1 MB",  pct: 67  },
                      ...selectedFiles.map(f => ({ name: f.name, size: `${(f.size/1024/1024).toFixed(1)} MB`, pct: 0 })),
                    ].map((f, i) => (
                      <div key={`${f.name}-${i}`} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                        <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-foreground truncate">{f.name}</p>
                            <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">{f.size}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${f.pct}%` }} />
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${f.pct === 100 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : f.pct === 0 ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {f.pct === 100 ? "Concluído" : f.pct === 0 ? "Novo" : "Enviando"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Formulário */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <Label className="text-xs font-medium">E-mail do Destinatário</Label>
                      <Input
                        className="mt-1 h-9"
                        placeholder="email@empresa.com"
                        value={destinatario}
                        onChange={e => setDestinatario(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Validade do Link</Label>
                      <Select value={validade} onValueChange={setValidade}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">24 horas</SelectItem>
                          <SelectItem value="3">3 dias</SelectItem>
                          <SelectItem value="7">7 dias</SelectItem>
                          <SelectItem value="14">14 dias</SelectItem>
                          <SelectItem value="30">30 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleCreateShare}
                    >
                      <Share2 className="w-4 h-4 mr-2" /> Criar Compartilhamento
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Modal de sucesso — compartilhamento */}
              <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-primary">
                      <CheckCircle className="w-5 h-5" /> Compartilhamento Criado!
                    </DialogTitle>
                    <DialogDescription>
                      O destinatário receberá um e-mail com o link de acesso.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Destinatário:</span><span className="font-medium">{destinatario}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Arquivos:</span><span className="font-medium">3 arquivos</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Validade:</span><span className="font-medium">{validade} dias</span></div>
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
                ABA: RELATÓRIOS
            ====================================================== */}
            <TabsContent value="relatorios" className="space-y-4">
              <Card className="border border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-primary" /> Gerar Relatórios
                  </CardTitle>
                  <CardDescription className="text-xs">Exporte dados do sistema em diferentes formatos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Cards de tipo de dado */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: "users",  label: "Usuários",             count: 48,    icon: <Users className="w-7 h-7 text-secondary" />,       color: "text-secondary" },
                      { key: "shares", label: "Compartilhamentos",    count: 127,   icon: <Share2 className="w-7 h-7 text-primary" />,         color: "text-primary" },
                      { key: "audit",  label: "Logs de Auditoria",    count: 4521,  icon: <Activity className="w-7 h-7 text-destructive" />,   color: "text-destructive" },
                    ].map(t => (
                      <div
                        key={t.key}
                        onClick={() => setExportDataType(t.key)}
                        className={`cursor-pointer rounded-xl border-2 p-5 text-center transition-all hover:shadow-md ${exportDataType === t.key ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}
                      >
                        <div className="flex justify-center mb-2">{t.icon}</div>
                        <p className={`text-sm font-semibold ${exportDataType === t.key ? "text-primary" : "text-foreground"}`}>{t.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t.count.toLocaleString()} registros</p>
                      </div>
                    ))}
                  </div>

                  {/* Configuração de exportação */}
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold text-foreground">Configurar Exportação</p>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Formato</Label>
                      <RadioGroup
                        value={exportFormat}
                        onValueChange={setExportFormat}
                        className="flex gap-4 mt-2"
                      >
                        {[
                          { value: "csv", label: "CSV (Excel)" },
                          { value: "txt", label: "TXT" },
                          { value: "pdf", label: "PDF" },
                        ].map(f => (
                          <div key={f.value} className="flex items-center gap-2">
                            <RadioGroupItem value={f.value} id={`fmt-${f.value}`} />
                            <Label htmlFor={`fmt-${f.value}`} className="text-xs cursor-pointer">{f.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => setExportModalOpen(true)}
                    >
                      <Download className="w-4 h-4 mr-2" /> Exportar Relatório
                    </Button>
                  </div>

                  {/* Histórico de exportações */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Exportações Recentes</p>
                    <div className="space-y-2">
                      {[
                        { file: "relatorio_users_2025-06-01.csv",  type: "Usuários",          size: "12 KB",  date: "01/06 14:32" },
                        { file: "relatorio_shares_2025-06-01.pdf", type: "Compartilhamentos", size: "48 KB",  date: "01/06 09:15" },
                        { file: "relatorio_audit_2025-05-31.csv",  type: "Auditoria",         size: "256 KB", date: "31/05 17:48" },
                      ].map(r => (
                        <div key={r.file} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileSpreadsheet className="w-4 h-4 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{r.file}</p>
                              <p className="text-xs text-muted-foreground">{r.type} · {r.size} · {r.date}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary flex-shrink-0">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Modal de sucesso — exportação */}
              <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-primary">
                      <CheckCircle className="w-5 h-5" /> Relatório Exportado!
                    </DialogTitle>
                    <DialogDescription>O relatório foi gerado e está pronto para download.</DialogDescription>
                  </DialogHeader>
                  <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Tipo:</span><span className="font-medium">{exportDataType === "users" ? "Usuários" : exportDataType === "shares" ? "Compartilhamentos" : "Logs de Auditoria"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Formato:</span><span className="font-medium">{exportFormat.toUpperCase()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Registros:</span><span className="font-medium">{exportDataType === "users" ? "48" : exportDataType === "shares" ? "127" : "4.521"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Arquivo:</span><span className="font-mono text-xs font-medium">relatorio_{exportDataType}_2025-06-02.{exportFormat}</span></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setExportModalOpen(false)}>Fechar</Button>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setExportModalOpen(false)}>
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
