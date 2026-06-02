"use client"

import {
  Shield, Search, Download, RefreshCw, Filter,
  LogIn, Upload, CheckCircle, XCircle, AlertTriangle, Eye, Lock, Clock, Info, User,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const AUDIT = [
  { id: "AUD-001", timestamp: "02/06/2025 08:14:33", user: "admin@petrobras.com.br", name: "Admin SCAC", action: "LOGIN", resource: "Sistema SCAC", detail: "Autenticacao via Entra ID SSO. Session ID: A3F291. IP: 10.15.22.101.", level: "Sucesso", changed: "-" },
  { id: "AUD-002", timestamp: "02/06/2025 08:22:17", user: "carlos.silva@petrobras.com.br", name: "Carlos Silva", action: "UPLOAD_ARQUIVO", resource: "Arquivo #341", detail: "Upload: Contrato_Fornecedor_2025.pdf (4.2 MB). Hash SHA-256: a3f9b12c. Tipo validado.", level: "Sucesso", changed: "Novo arquivo criado" },
  { id: "AUD-003", timestamp: "02/06/2025 08:31:45", user: "ana.santos@petrobras.com.br", name: "Ana Santos", action: "APROVAR_COMPARTILHAMENTO", resource: "Share #122", detail: "Supervisor aprovou envio para externo@parceiro.com. 3 arquivos. Expira: 08/06/2025.", level: "Sucesso", changed: "Status: Pendente → Aprovado" },
  { id: "AUD-004", timestamp: "02/06/2025 08:34:22", user: "externo@parceiro.com", name: "Externo Parceiro", action: "OTP_VALIDADO", resource: "Share #122", detail: "Codigo OTP verificado na 1ª tentativa. Acesso concedido a 3 arquivos.", level: "Sucesso", changed: "Acesso liberado" },
  { id: "AUD-005", timestamp: "02/06/2025 08:35:11", user: "externo@parceiro.com", name: "Externo Parceiro", action: "DOWNLOAD_ARQUIVO", resource: "Arquivo #339", detail: "Download: RelatorioTecnico_Q1_2025.pdf (2.1 MB). Share #122. IP: 189.45.67.201.", level: "Sucesso", changed: "Contador downloads: 0 → 1" },
  { id: "AUD-006", timestamp: "02/06/2025 09:05:48", user: "paulo.lima@petrobras.com.br", name: "Paulo Lima", action: "REJEITAR_COMPARTILHAMENTO", resource: "Share #119", detail: "Rejeitado: documentacao incompleta. Notificacao enviada a j.alves@petrobras.com.br.", level: "Aviso", changed: "Status: Pendente → Rejeitado" },
  { id: "AUD-007", timestamp: "02/06/2025 09:17:33", user: "teste@petrobras.com.br", name: "Usuario Teste", action: "LOGIN_FALHA", resource: "Sistema SCAC", detail: "Falha de autenticacao: token Entra ID expirado. Usuario inativo ha 90 dias.", level: "Erro", changed: "-" },
  { id: "AUD-008", timestamp: "02/06/2025 10:23:31", user: "externo3@terceiro.com", name: "Externo Terceiro", action: "OTP_MAX_TENTATIVAS", resource: "Share #118", detail: "3 tentativas invalidas de OTP. Acesso bloqueado por 30 minutos. IP: 190.22.11.55.", level: "Erro", changed: "Acesso bloqueado" },
  { id: "AUD-009", timestamp: "02/06/2025 10:45:00", user: "ana.santos@petrobras.com.br", name: "Ana Santos", action: "ALTERAR_EXPIRACAO", resource: "Share #121", detail: "Prazo estendido de 7 para 14 dias. Justificativa: negociacao em andamento.", level: "Info", changed: "Expiracao: 03/06 → 10/06/2025" },
  { id: "AUD-010", timestamp: "02/06/2025 11:15:40", user: "maria.costa@petrobras.com.br", name: "Maria Costa", action: "CRIAR_COMPARTILHAMENTO", resource: "Share #128", detail: "Novo compartilhamento criado: 6 arquivos para auditoria@consultoria.com. Aguardando aprovacao.", level: "Sucesso", changed: "Share #128 criado" },
]

const levelConfig: Record<string, string> = {
  Sucesso: "bg-green-100 text-green-800 border-green-200",
  Aviso:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  Erro:    "bg-red-100 text-red-800 border-red-200",
  Info:    "bg-blue-100 text-blue-800 border-blue-200",
}

export default function AuditoriaPreview() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#009933] rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">PETROBRAS — SCAC / Admin</p>
            <h1 className="text-base font-bold text-gray-900">Auditoria e Rastreabilidade</h1>
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
        {/* Resumo */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total de Eventos", value: "10", sub: "02/06/2025", color: "text-gray-700", bg: "bg-white" },
            { label: "Acoes Criticas", value: "2", sub: "Falhas de login e OTP", color: "text-red-700", bg: "bg-red-50" },
            { label: "Aprovacoes Auditadas", value: "2", sub: "100% rastreadas", color: "text-green-700", bg: "bg-green-50" },
            { label: "Exportacao JSON", value: "Disponivel", sub: "Formato de auditoria", color: "text-blue-700", bg: "bg-blue-50" },
          ].map((s) => (
            <Card key={s.label} className={`border-0 shadow-sm ${s.bg}`}>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#009933]" />
                  Trilha de Auditoria — Acoes Criticas e Sensiveis
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Registro imutavel de todas as acoes criticas com usuario, timestamp, IP, recurso afetado e mudancas realizadas.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input className="pl-7 h-8 text-xs w-48" placeholder="Buscar auditoria..." />
                </div>
                <Select defaultValue="todos">
                  <SelectTrigger className="h-8 text-xs w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas acoes</SelectItem>
                    <SelectItem value="login">Login/Logout</SelectItem>
                    <SelectItem value="upload">Upload</SelectItem>
                    <SelectItem value="aprovacao">Aprovacoes</SelectItem>
                    <SelectItem value="erro">Erros</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                  <Download className="w-3 h-3" /> Exportar JSON
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold w-24">ID</TableHead>
                  <TableHead className="text-xs font-semibold w-40">Timestamp</TableHead>
                  <TableHead className="text-xs font-semibold">Usuario</TableHead>
                  <TableHead className="text-xs font-semibold">Acao</TableHead>
                  <TableHead className="text-xs font-semibold">Recurso</TableHead>
                  <TableHead className="text-xs font-semibold">Detalhe</TableHead>
                  <TableHead className="text-xs font-semibold">Mudanca</TableHead>
                  <TableHead className="text-xs font-semibold">Nivel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {AUDIT.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50 align-top">
                    <TableCell className="text-xs font-mono text-gray-500 py-2">{row.id}</TableCell>
                    <TableCell className="text-xs font-mono text-gray-500 py-2 whitespace-nowrap">{row.timestamp}</TableCell>
                    <TableCell className="py-2">
                      <p className="text-xs font-medium text-gray-800">{row.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[140px]">{row.user}</p>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-gray-700 py-2 whitespace-nowrap">{row.action}</TableCell>
                    <TableCell className="text-xs text-gray-600 py-2 whitespace-nowrap">{row.resource}</TableCell>
                    <TableCell className="py-2 max-w-xs">
                      <span className="text-xs text-gray-600 block" style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.detail}>{row.detail}</span>
                    </TableCell>
                    <TableCell className="py-2 max-w-[140px]">
                      <span className="text-xs text-gray-500 italic">{row.changed}</span>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${levelConfig[row.level] || "bg-gray-100 text-gray-600"}`}>
                        {row.level}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Paginacao */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Mostrando 10 de 1.247 registros auditados</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled>Anterior</Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-xs bg-[#009933] text-white border-[#009933]">1</Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-xs">2</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs">Proxima</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
