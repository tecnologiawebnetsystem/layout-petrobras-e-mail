"use client"

import { useState } from "react"
import {
  Users, FileText, Activity, HardDrive, Mail, Shield,
  ChevronLeft, ChevronRight, Eye, RefreshCw, BarChart3,
  Clock, CheckCircle, XCircle, AlertTriangle, User,
  Download, Upload, TrendingUp, Calendar, Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

const LOGS_MOCK = [
  { id: 1, action: "LOGIN", user: "admin@petrobras.com.br", ip: "10.15.22.101", detail: "Login via Entra ID (SSO)", time: "08:14:33", level: "Sucesso" },
  { id: 2, action: "UPLOAD_ARQUIVO", user: "carlos.silva@petrobras.com.br", ip: "10.15.22.45", detail: "Contrato_Fornecedor_2025.pdf (4.2 MB)", time: "08:22:17", level: "Sucesso" },
  { id: 3, action: "APROVAR_COMPARTILHAMENTO", user: "ana.santos@petrobras.com.br", ip: "10.15.23.88", detail: "Compartilhamento #122 aprovado", time: "08:31:45", level: "Sucesso" },
  { id: 4, action: "OTP_VALIDADO", user: "externo@parceiro.com", ip: "189.45.67.201", detail: "OTP validado — 1ª tentativa — Share #122", time: "08:34:22", level: "Sucesso" },
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
}

export default function AdminDashboardPreview() {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
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
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Usuarios Totais", value: "48", sub: "+3 esta semana", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Compartilhamentos", value: "127", sub: "8 pendentes aprovacao", icon: FileText, color: "text-green-600", bg: "bg-green-50" },
            { label: "Arquivos no Sistema", value: "342", sub: "12 enviados hoje", icon: HardDrive, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "E-mails Enviados", value: "89", sub: "Ultimos 7 dias", icon: Mail, color: "text-orange-600", bg: "bg-orange-50" },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                  </div>
                  <div className={`${stat.bg} p-2 rounded-lg`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-200 mb-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="upload">Upload de Arquivos</TabsTrigger>
            <TabsTrigger value="logs">Logs do Sistema</TabsTrigger>
            <TabsTrigger value="rastreamento">Rastreamento</TabsTrigger>
          </TabsList>

          {/* Tab: Dashboard */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-2 gap-4">
              {/* Atividade recente */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#009933]" /> Atividade Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {LOGS_MOCK.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColor[log.level] || "bg-gray-100 text-gray-600"}`}>{log.level}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{log.action}</p>
                          <p className="text-xs text-gray-500 truncate">{log.user}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Compartilhamentos recentes */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#009933]" /> Compartilhamentos Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {SHARES_MOCK.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-xs font-mono text-gray-400 w-10">{s.id}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{s.name}</p>
                          <p className="text-xs text-gray-500 truncate">{s.dest}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status] || "bg-gray-100 text-gray-600"}`}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                      <Input className="pl-7 h-7 text-xs w-48" placeholder="Buscar usuario..." defaultValue="" />
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

          {/* Tab: Upload */}
          <TabsContent value="upload">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#009933]" /> Upload de Arquivos
                </CardTitle>
                <CardDescription className="text-xs">Envio de documentos com validacao de tipo, barra de progresso e validacao de arquivos ZIP.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center mb-4 bg-gray-50">
                  <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600">Arraste arquivos ou clique para selecionar</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, XLSX, DWG — maximo 500 MB por arquivo</p>
                  <Button size="sm" className="mt-3 bg-[#009933] text-white text-xs">Selecionar Arquivos</Button>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Contrato_Fornecedor_2025.pdf", size: "4.2 MB", status: "Concluido", pct: 100 },
                    { name: "Plantas_Bloco_A-D.dwg", size: "18.7 MB", status: "Concluido", pct: 100 },
                    { name: "Relatorio_Q1_2025.xlsx", size: "1.1 MB", status: "Concluido", pct: 100 },
                    { name: "Memorial_Descritivo_v2.pdf", size: "2.9 MB", status: "Enviando", pct: 67 },
                  ].map((f) => (
                    <div key={f.name} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg">
                      <FileText className="w-5 h-5 text-[#009933] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-gray-800 truncate">{f.name}</p>
                          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{f.size}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-[#009933]"
                            style={{ width: `${f.pct}%` }}
                          />
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                        f.status === "Concluido" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}>{f.status}</span>
                    </div>
                  ))}
                </div>
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
                  <Badge variant="outline" className="text-xs">1.247 registros</Badge>
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
                  <Eye className="w-4 h-4 text-[#009933]" /> Rastreamento de Compartilhamentos
                </CardTitle>
                <CardDescription className="text-xs">Historico completo de acoes por compartilhamento — quem acessou, quando e de qual IP.</CardDescription>
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
                        <TableCell className="text-xs text-gray-600">{s.by}</TableCell>
                        <TableCell className="text-xs text-gray-500">{s.exp}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
