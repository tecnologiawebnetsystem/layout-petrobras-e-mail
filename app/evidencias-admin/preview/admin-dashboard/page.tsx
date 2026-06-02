"use client"

import { useState } from "react"
import {
  Users, FileText, Activity, HardDrive, Mail, Shield,
  ChevronLeft, ChevronRight, Eye, RefreshCw, BarChart3,
  Clock, CheckCircle, XCircle, AlertTriangle, User,
  Download, Upload, TrendingUp, Calendar, Search,
  Share2, FileSpreadsheet, FileType, Filter,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Dados mockados
const METRICS_MOCK = {
  users: { total: 48, internal: 32, external: 12, supervisors: 3, admins: 1, active: 45 },
  shares: { total: 127, pending: 8, approved: 89, active: 42, rejected: 12, expired: 18 },
  files: { total: 342, storage_bytes: 1258291200, storage_mb: 1200.12 },
  audit: { total_logs: 4521, logs_last_7_days: 312 },
  emails: { total_sent: 89 },
}

const LOGS_MOCK = [
  { id: 1, action: "LOGIN", user: "admin@petrobras.com.br", ip: "10.15.22.101", detail: "Login via Entra ID (SSO)", time: "08:14:33", level: "Sucesso" },
  { id: 2, action: "UPLOAD_ARQUIVO", user: "carlos.silva@petrobras.com.br", ip: "10.15.22.45", detail: "Contrato_Fornecedor_2025.pdf (4.2 MB)", time: "08:22:17", level: "Sucesso" },
  { id: 3, action: "APROVAR_COMPARTILHAMENTO", user: "ana.santos@petrobras.com.br", ip: "10.15.23.88", detail: "Compartilhamento #122 aprovado", time: "08:31:45", level: "Sucesso" },
  { id: 4, action: "OTP_VALIDADO", user: "externo@parceiro.com", ip: "189.45.67.201", detail: "OTP validado — 1a tentativa — Share #122", time: "08:34:22", level: "Sucesso" },
  { id: 5, action: "DOWNLOAD_ARQUIVO", user: "externo@parceiro.com", ip: "189.45.67.201", detail: "RelatorioTecnico_Q1_2025.pdf — Share #122", time: "08:35:11", level: "Sucesso" },
  { id: 6, action: "REJEITAR_COMPARTILHAMENTO", user: "paulo.lima@petrobras.com.br", ip: "10.15.24.33", detail: "Share #119 — documentacao incompleta", time: "09:05:48", level: "Aviso" },
  { id: 7, action: "LOGIN_FALHA", user: "teste@petrobras.com.br", ip: "10.15.19.77", detail: "Token expirado ou usuario inativo", time: "09:17:33", level: "Erro" },
  { id: 8, action: "OTP_MAX_TENTATIVAS", user: "externo3@terceiro.com", ip: "190.22.11.55", detail: "Acesso bloqueado apos 3 tentativas invalidas", time: "10:23:31", level: "Erro" },
]

const SHARES_MOCK = [
  { id: "#122", name: "Relatorio Q1 2025", dest: "externo@parceiro.com", files: 3, status: "Aprovado", by: "C. Silva", exp: "08/06/2025" },
  { id: "#123", name: "Plantas Bloco A-D", dest: "eng@construtora.com", files: 7, status: "Pendente", by: "M. Costa", exp: "09/06/2025" },
  { id: "#124", name: "Contrato Fornecimento", dest: "juridico@fornecedor.com", files: 2, status: "Aprovado", by: "R. Ferreira", exp: "06/06/2025" },
  { id: "#119", name: "Documentos Auditoria", dest: "auditoria@parceiro.com", files: 4, status: "Rejeitado", by: "J. Alves", exp: "-" },
  { id: "#120", name: "Memorial Descritivo", dest: "obras@empresa.com", files: 1, status: "Cancelado", by: "C. Silva", exp: "-" },
  { id: "#128", name: "Relatorio Consultoria", dest: "auditoria@consultoria.com", files: 6, status: "Pendente", by: "M. Costa", exp: "09/06/2025" },
]

const USERS_MOCK = [
  { name: "Admin SCAC", email: "admin@petrobras.com.br", type: "Admin", status: "Ativo", last: "Hoje 08:14" },
  { name: "Carlos Silva", email: "carlos.silva@petrobras.com.br", type: "Interno", status: "Ativo", last: "Hoje 08:22" },
  { name: "Ana Santos", email: "ana.santos@petrobras.com.br", type: "Supervisor", status: "Ativo", last: "Hoje 08:31" },
  { name: "Paulo Lima", email: "paulo.lima@petrobras.com.br", type: "Interno", status: "Ativo", last: "Hoje 09:05" },
  { name: "Maria Costa", email: "maria.costa@petrobras.com.br", type: "Interno", status: "Ativo", last: "Ontem" },
  { name: "Roberto Ferreira", email: "roberto.ferreira@petrobras.com.br", type: "Interno", status: "Ativo", last: "Ontem" },
  { name: "Externo Parceiro", email: "externo@parceiro.com", type: "Externo", status: "Ativo", last: "Hoje 08:35" },
  { name: "Externo Construtora", email: "eng@construtora.com", type: "Externo", status: "Ativo", last: "02/06/2025" },
]

const MEUS_SHARES_MOCK = [
  { id: "#130", name: "Documentos Fiscais 2025", dest: "contabil@parceiro.com", files: 5, status: "Aprovado", created: "02/06/2025", exp: "16/06/2025", downloads: 2 },
  { id: "#131", name: "Projeto Expansao Norte", dest: "engenharia@construtora.com", files: 12, status: "Pendente", created: "02/06/2025", exp: "09/06/2025", downloads: 0 },
  { id: "#118", name: "Relatorio Mensal Maio", dest: "diretoria@parceiro.com", files: 3, status: "Aprovado", created: "28/05/2025", exp: "04/06/2025", downloads: 5 },
  { id: "#115", name: "Plantas Arquitetonicas", dest: "arquitetura@empresa.com", files: 8, status: "Expirado", created: "20/05/2025", exp: "27/05/2025", downloads: 3 },
]

const levelColor: Record<string, string> = {
  Sucesso: "bg-green-100 text-green-800",
  Aviso: "bg-yellow-100 text-yellow-800",
  Erro: "bg-red-100 text-red-800",
  Info: "bg-blue-100 text-blue-800",
}

const statusColor: Record<string, string> = {
  Aprovado: "bg-green-100 text-green-800",
  Pendente: "bg-yellow-100 text-yellow-800",
  Rejeitado: "bg-red-100 text-red-800",
  Cancelado: "bg-gray-100 text-gray-700",
  Expirado: "bg-gray-100 text-gray-500",
}

export default function AdminDashboardPreview() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState("csv")
  const [exportDataType, setExportDataType] = useState("users")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [destinatario, setDestinatario] = useState("")
  const [validade, setValidade] = useState("7")
  const metrics = METRICS_MOCK

  // Handler para selecionar arquivos
  const handleFileSelect = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.accept = ".pdf,.xlsx,.xls,.dwg,.doc,.docx,.zip"
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        setSelectedFiles(prev => [...prev, ...Array.from(files)])
      }
    }
    input.click()
  }

  // Handler para criar compartilhamento
  const handleCreateShare = () => {
    if (!destinatario) {
      alert("Por favor, informe o e-mail do destinatario.")
      return
    }
    setShareModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#009933] rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">PETROBRAS — SCAC</p>
              <h1 className="text-base font-bold text-gray-900">Painel Administrativo</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-[#009933] text-white text-xs px-2 py-0.5">Admin</Badge>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">Admin SCAC</p>
              <p className="text-xs text-gray-500">admin@petrobras.com.br</p>
            </div>
            <div className="w-8 h-8 bg-[#009933] rounded-full flex items-center justify-center text-white text-sm font-bold">A</div>
          </div>
        </div>
        
        {/* Info do usuario e Meus Compartilhamentos */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Supervisor */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-xs font-medium text-blue-700 mb-1">Supervisor Responsavel</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">D</div>
              <div>
                <p className="text-sm font-medium text-gray-800">Diretor Geral</p>
                <p className="text-xs text-gray-500">diretor@petrobras.com.br</p>
              </div>
            </div>
          </div>
          
          {/* Subordinados */}
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <p className="text-xs font-medium text-green-700 mb-1">Subordinados Diretos</p>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">A</div>
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">C</div>
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">M</div>
              </div>
              <p className="text-xs text-gray-600">Ana Santos, Carlos Silva, Maria Costa <span className="text-gray-400">+44 usuarios</span></p>
            </div>
          </div>
          
          {/* Meus Compartilhamentos - Resumo */}
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <p className="text-xs font-medium text-amber-700 mb-1">Meus Compartilhamentos</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">4</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-600">1</p>
                  <p className="text-xs text-gray-500">Pendente</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">2</p>
                  <p className="text-xs text-gray-500">Aprovados</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setActiveTab("meus-compartilhamentos")}>
                <Eye className="w-3 h-3 mr-1" /> Ver Todos
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-200 mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" /> Usuarios
            </TabsTrigger>
            <TabsTrigger value="shares" className="flex items-center gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" /> Gestao Global
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1.5 text-xs">
              <Activity className="w-3.5 h-3.5" /> Logs
            </TabsTrigger>
            <TabsTrigger value="rastreamento" className="flex items-center gap-1.5 text-xs">
              <Eye className="w-3.5 h-3.5" /> Rastreamento
            </TabsTrigger>
            <TabsTrigger value="compartilhar" className="flex items-center gap-1.5 text-xs">
              <Upload className="w-3.5 h-3.5" /> Compartilhar
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center gap-1.5 text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Relatorios
            </TabsTrigger>
          </TabsList>

          {/* Tab: Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
              </Button>
            </div>

            {/* Users Metrics - 6 cards */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#009933]" /> Metricas de Usuarios
              </h3>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Total Usuarios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.users.total}</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Internos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{metrics.users.internal}</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Externos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{metrics.users.external}</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Supervisores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{metrics.users.supervisors}</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Admins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{metrics.users.admins}</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{metrics.users.active}</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Shares Metrics - 6 cards */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#009933]" /> Metricas de Compartilhamentos
              </h3>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Total Shares</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.shares.total}</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Pendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{metrics.shares.pending}</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Aprovados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{metrics.shares.approved}</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{metrics.shares.active}</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Rejeitados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{metrics.shares.rejected}</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Expirados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-500">{metrics.shares.expired}</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Files & Audit Metrics - 4 cards */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#009933]" /> Arquivos e Auditoria
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Total Arquivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.files.total}</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <HardDrive className="h-3 w-3" /> Storage Usado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.files.storage_mb.toFixed(2)} MB</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Activity className="h-3 w-3" /> Total Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.audit.total_logs}</div>
                    <p className="text-xs text-muted-foreground">{metrics.audit.logs_last_7_days} nos ultimos 7 dias</p>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Emails Enviados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.emails.total_sent}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Compartilhar */}
          <TabsContent value="compartilhar" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#009933]" /> Novo Compartilhamento
                </CardTitle>
                <CardDescription className="text-xs">Envie arquivos para destinatarios externos de forma segura.</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center mb-4 bg-gray-50 hover:bg-gray-100 hover:border-[#009933] cursor-pointer transition-colors"
                  onClick={handleFileSelect}
                >
                  <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600">Arraste arquivos ou clique para selecionar</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, XLSX, DWG — maximo 500 MB por arquivo</p>
                  <Button size="sm" className="mt-3 bg-[#009933] hover:bg-[#007a2a] text-white text-xs" onClick={(e) => { e.stopPropagation(); handleFileSelect(); }}>
                    Selecionar Arquivos
                  </Button>
                </div>
                
                {/* Lista de arquivos mockados + arquivos selecionados */}
                <div className="space-y-3">
                  {[
                    { name: "Contrato_Fornecedor_2025.pdf", size: "4.2 MB", status: "Concluido", pct: 100 },
                    { name: "Plantas_Bloco_A-D.dwg", size: "18.7 MB", status: "Concluido", pct: 100 },
                    { name: "Relatorio_Q1_2025.xlsx", size: "1.1 MB", status: "Enviando", pct: 67 },
                    ...selectedFiles.map(f => ({ name: f.name, size: `${(f.size / 1024 / 1024).toFixed(1)} MB`, status: "Novo", pct: 0 }))
                  ].map((f, idx) => (
                    <div key={`${f.name}-${idx}`} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg">
                      <FileText className="w-5 h-5 text-[#009933] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-gray-800 truncate">{f.name}</p>
                          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{f.size}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-[#009933]" style={{ width: `${f.pct}%` }} />
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                        f.status === "Concluido" ? "bg-green-100 text-green-800" : 
                        f.status === "Novo" ? "bg-purple-100 text-purple-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>{f.status}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 space-y-4">
                  <div>
                    <Label className="text-xs font-medium">E-mail do Destinatario</Label>
                    <Input 
                      className="mt-1" 
                      placeholder="email@empresa.com" 
                      value={destinatario}
                      onChange={(e) => setDestinatario(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Validade do Link</Label>
                    <Select value={validade} onValueChange={setValidade}>
                      <SelectTrigger className="mt-1">
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
                  <Button className="w-full bg-[#009933] hover:bg-[#007a2a] text-white" onClick={handleCreateShare}>
                    <Share2 className="w-4 h-4 mr-2" /> Criar Compartilhamento
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Modal de sucesso */}
            <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" /> Compartilhamento Criado!
                  </DialogTitle>
                  <DialogDescription>
                    O compartilhamento foi criado com sucesso e o destinatario recebera um e-mail com o link de acesso.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Destinatario:</span>
                    <span className="font-medium">{destinatario || "email@empresa.com"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Arquivos:</span>
                    <span className="font-medium">3 arquivos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Validade:</span>
                    <span className="font-medium">{validade} dias</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID:</span>
                    <span className="font-mono font-medium">#132</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShareModalOpen(false)}>Fechar</Button>
                  <Button className="bg-[#009933] hover:bg-[#007a2a] text-white" onClick={() => { setShareModalOpen(false); setActiveTab("meus-compartilhamentos"); }}>
                    Ver Meus Compartilhamentos
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Tab: Meus Compartilhamentos */}
          <TabsContent value="meus-compartilhamentos" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-[#009933]" /> Meus Compartilhamentos
                    </CardTitle>
                    <CardDescription className="text-xs">Acompanhe todos os compartilhamentos que voce criou.</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">{MEUS_SHARES_MOCK.length} compartilhamentos</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Destinatario</TableHead>
                      <TableHead className="text-xs">Arquivos</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Downloads</TableHead>
                      <TableHead className="text-xs">Expira em</TableHead>
                      <TableHead className="text-xs">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MEUS_SHARES_MOCK.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs font-mono font-medium">{s.id}</TableCell>
                        <TableCell className="text-xs font-medium text-gray-800">{s.name}</TableCell>
                        <TableCell className="text-xs text-gray-500">{s.dest}</TableCell>
                        <TableCell className="text-xs text-center">{s.files}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status] || "bg-gray-100 text-gray-600"}`}>{s.status}</span>
                        </TableCell>
                        <TableCell className="text-xs text-center">{s.downloads}</TableCell>
                        <TableCell className="text-xs text-gray-500">{s.exp}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Mail className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Usuarios */}
          <TabsContent value="usuarios">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Gestao de Usuarios</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input className="pl-7 h-7 text-xs w-48" placeholder="Buscar usuario..." />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">E-mail</TableHead>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Ultimo Acesso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {USERS_MOCK.map((u) => (
                      <TableRow key={u.email}>
                        <TableCell className="text-xs font-medium">{u.name}</TableCell>
                        <TableCell className="text-xs text-gray-500">{u.email}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.type === "Admin" ? "bg-purple-100 text-purple-800" :
                            u.type === "Supervisor" ? "bg-blue-100 text-blue-800" :
                            u.type === "Externo" ? "bg-orange-100 text-orange-800" :
                            "bg-green-100 text-green-800"
                          }`}>{u.type}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">{u.status}</span>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{u.last}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Gestao Global */}
          <TabsContent value="shares">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#009933]" /> Gestao Global de Compartilhamentos
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">127 compartilhamentos</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Destinatario</TableHead>
                      <TableHead className="text-xs">Arquivos</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Criado por</TableHead>
                      <TableHead className="text-xs">Expira em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SHARES_MOCK.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs font-mono font-medium">{s.id}</TableCell>
                        <TableCell className="text-xs font-medium text-gray-800">{s.name}</TableCell>
                        <TableCell className="text-xs text-gray-500">{s.dest}</TableCell>
                        <TableCell className="text-xs text-center">{s.files}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status] || "bg-gray-100 text-gray-600"}`}>{s.status}</span>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{s.by}</TableCell>
                        <TableCell className="text-xs text-gray-500">{s.exp}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Logs */}
          <TabsContent value="logs">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#009933]" /> Logs do Sistema
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">4.521 registros</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">Acao</TableHead>
                      <TableHead className="text-xs">Usuario</TableHead>
                      <TableHead className="text-xs">IP</TableHead>
                      <TableHead className="text-xs">Detalhe</TableHead>
                      <TableHead className="text-xs">Hora</TableHead>
                      <TableHead className="text-xs">Nivel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {LOGS_MOCK.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs font-mono font-medium text-gray-700">{log.action}</TableCell>
                        <TableCell className="text-xs text-gray-600">{log.user}</TableCell>
                        <TableCell className="text-xs font-mono text-gray-500">{log.ip}</TableCell>
                        <TableCell className="text-xs text-gray-600 max-w-xs truncate">{log.detail}</TableCell>
                        <TableCell className="text-xs text-gray-500">{log.time}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColor[log.level] || "bg-gray-100 text-gray-600"}`}>{log.level}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Rastreamento */}
          <TabsContent value="rastreamento">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#009933]" /> Rastreamento de Atividades
                </CardTitle>
                <CardDescription className="text-xs">Historico completo de acoes por compartilhamento.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Destinatario</TableHead>
                      <TableHead className="text-xs">Arquivos</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Criado por</TableHead>
                      <TableHead className="text-xs">Expira em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SHARES_MOCK.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs font-mono font-medium">{s.id}</TableCell>
                        <TableCell className="text-xs font-medium text-gray-800">{s.name}</TableCell>
                        <TableCell className="text-xs text-gray-500">{s.dest}</TableCell>
                        <TableCell className="text-xs text-center">{s.files}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status] || "bg-gray-100 text-gray-600"}`}>{s.status}</span>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{s.by}</TableCell>
                        <TableCell className="text-xs text-gray-500">{s.exp}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Relatorios */}
          <TabsContent value="relatorios">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#009933]" /> Gerar Relatorios
                </CardTitle>
                <CardDescription className="text-xs">Exporte dados do sistema em diferentes formatos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border cursor-pointer hover:border-[#009933] transition-colors">
                    <CardContent className="p-4 text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm font-medium">Usuarios</p>
                      <p className="text-xs text-muted-foreground">48 registros</p>
                    </CardContent>
                  </Card>
                  <Card className="border cursor-pointer hover:border-[#009933] transition-colors">
                    <CardContent className="p-4 text-center">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="text-sm font-medium">Compartilhamentos</p>
                      <p className="text-xs text-muted-foreground">127 registros</p>
                    </CardContent>
                  </Card>
                  <Card className="border cursor-pointer hover:border-[#009933] transition-colors">
                    <CardContent className="p-4 text-center">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <p className="text-sm font-medium">Logs de Auditoria</p>
                      <p className="text-xs text-muted-foreground">4.521 registros</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-medium mb-4">Configurar Exportacao</h4>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium">Tipo de Dados</Label>
                      <Select defaultValue="users">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="users">Usuarios</SelectItem>
                          <SelectItem value="shares">Compartilhamentos</SelectItem>
                          <SelectItem value="logs">Logs de Auditoria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Formato de Exportacao</Label>
                      <RadioGroup defaultValue="csv" className="flex gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="csv" id="csv" />
                          <Label htmlFor="csv" className="text-sm">CSV</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="txt" id="txt" />
                          <Label htmlFor="txt" className="text-sm">TXT</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pdf" id="pdf" />
                          <Label htmlFor="pdf" className="text-sm">PDF</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <Button className="w-full bg-[#009933] hover:bg-[#007a2a] text-white">
                      <Download className="w-4 h-4 mr-2" /> Exportar Relatorio
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Exportacoes Recentes</h4>
                  <div className="space-y-2">
                    {[
                      { name: "relatorio_usuarios_2025-06-02.csv", date: "02/06/2025 08:45", size: "12 KB" },
                      { name: "relatorio_compartilhamentos_2025-06-01.pdf", date: "01/06/2025 16:22", size: "89 KB" },
                      { name: "relatorio_logs_2025-05-30.txt", date: "30/05/2025 14:10", size: "234 KB" },
                    ].map((exp) => (
                      <div key={exp.name} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileType className="w-4 h-4 text-[#009933]" />
                          <div>
                            <p className="text-xs font-medium">{exp.name}</p>
                            <p className="text-xs text-muted-foreground">{exp.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{exp.size}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
