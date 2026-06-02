"use client"

import {
  Activity, Search, Download, Filter, RefreshCw,
  LogIn, Upload, CheckCircle, XCircle, AlertTriangle, Info,
  Eye, Lock, Clock,
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

const LOGS = [
  { id: 1, action: "LOGIN", user: "admin@petrobras.com.br", ip: "10.15.22.101", detail: "Login via Entra ID (SSO) — sessão iniciada", time: "08:14:33", level: "Sucesso", icon: LogIn },
  { id: 2, action: "UPLOAD_ARQUIVO", user: "carlos.silva@petrobras.com.br", ip: "10.15.22.45", detail: "Contrato_Fornecedor_2025.pdf (4.2 MB) — SHA256 verificado", time: "08:22:17", level: "Sucesso", icon: Upload },
  { id: 3, action: "APROVAR_COMPARTILHAMENTO", user: "ana.santos@petrobras.com.br", ip: "10.15.23.88", detail: "Compartilhamento #122 aprovado — 3 arquivos liberados", time: "08:31:45", level: "Sucesso", icon: CheckCircle },
  { id: 4, action: "OTP_VALIDADO", user: "externo@parceiro.com", ip: "189.45.67.201", detail: "OTP validado na 1ª tentativa — Share #122", time: "08:34:22", level: "Sucesso", icon: CheckCircle },
  { id: 5, action: "DOWNLOAD_ARQUIVO", user: "externo@parceiro.com", ip: "189.45.67.201", detail: "RelatorioTecnico_Q1_2025.pdf (2.1 MB) — Share #122", time: "08:35:11", level: "Sucesso", icon: Download },
  { id: 6, action: "REJEITAR_COMPARTILHAMENTO", user: "paulo.lima@petrobras.com.br", ip: "10.15.24.33", detail: "Share #119 rejeitado — documentacao incompleta", time: "09:05:48", level: "Aviso", icon: AlertTriangle },
  { id: 7, action: "LOGIN_FALHA", user: "teste@petrobras.com.br", ip: "10.15.19.77", detail: "Token expirado ou usuario inativo no Azure AD", time: "09:17:33", level: "Erro", icon: XCircle },
  { id: 8, action: "OTP_MAX_TENTATIVAS", user: "externo3@terceiro.com", ip: "190.22.11.55", detail: "Bloqueado apos 3 tentativas invalidas de OTP", time: "10:23:31", level: "Erro", icon: Lock },
  { id: 9, action: "ARQUIVO_EXPIRADO", user: "sistema", ip: "10.15.10.1", detail: "Share #105 expirou — arquivos removidos automaticamente", time: "10:00:00", level: "Info", icon: Clock },
  { id: 10, action: "ALTERAR_EXPIRACAO", user: "ana.santos@petrobras.com.br", ip: "10.15.23.88", detail: "Share #121 estendido de 7 para 14 dias por supervisor", time: "10:45:00", level: "Info", icon: Info },
  { id: 11, action: "UPLOAD_ARQUIVO", user: "roberto.ferreira@petrobras.com.br", ip: "10.15.25.12", detail: "Plantas_Bloco_A-D.dwg (18.7 MB) — DWG validado", time: "11:02:14", level: "Sucesso", icon: Upload },
  { id: 12, action: "APROVACAO_PENDENTE", user: "maria.costa@petrobras.com.br", ip: "10.15.22.90", detail: "Compartilhamento #128 aguardando aprovacao do supervisor", time: "11:15:40", level: "Info", icon: Info },
]

const levelConfig: Record<string, { cls: string; label: string }> = {
  Sucesso: { cls: "bg-green-100 text-green-800 border-green-200", label: "Sucesso" },
  Aviso:   { cls: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Aviso" },
  Erro:    { cls: "bg-red-100 text-red-800 border-red-200", label: "Erro" },
  Info:    { cls: "bg-blue-100 text-blue-800 border-blue-200", label: "Info" },
}

export default function LogsPreview() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#009933] rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">PETROBRAS — SCAC / Admin</p>
            <h1 className="text-base font-bold text-gray-900">Logs do Sistema</h1>
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
        {/* Estatísticas de log */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total de Registros", value: "1.247", sub: "Ultimos 7 dias", color: "text-gray-700", bg: "bg-white" },
            { label: "Sucesso", value: "1.089", sub: "87,3% do total", color: "text-green-700", bg: "bg-green-50" },
            { label: "Avisos", value: "121", sub: "9,7% do total", color: "text-yellow-700", bg: "bg-yellow-50" },
            { label: "Erros", value: "37", sub: "3,0% do total", color: "text-red-700", bg: "bg-red-50" },
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
                  <Activity className="w-4 h-4 text-[#009933]" />
                  Registros de Auditoria — 02/06/2025
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Rastreamento completo de todas as acoes: logins, uploads, downloads, aprovacoes, erros e eventos automaticos.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input className="pl-7 h-8 text-xs w-48" placeholder="Buscar log..." defaultValue="" />
                </div>
                <Select defaultValue="todos">
                  <SelectTrigger className="h-8 text-xs w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sucesso">Sucesso</SelectItem>
                    <SelectItem value="aviso">Aviso</SelectItem>
                    <SelectItem value="erro">Erro</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                  <Download className="w-3 h-3" /> Exportar CSV
                </Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold">#</TableHead>
                  <TableHead className="text-xs font-semibold">Acao</TableHead>
                  <TableHead className="text-xs font-semibold">Usuario</TableHead>
                  <TableHead className="text-xs font-semibold">Endereco IP</TableHead>
                  <TableHead className="text-xs font-semibold">Detalhe</TableHead>
                  <TableHead className="text-xs font-semibold">Hora</TableHead>
                  <TableHead className="text-xs font-semibold">Nivel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LOGS.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50">
                    <TableCell className="text-xs text-gray-400 font-mono">{log.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <log.icon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <span className="text-xs font-mono font-semibold text-gray-700">{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">{log.user}</TableCell>
                    <TableCell className="text-xs font-mono text-gray-500">{log.ip}</TableCell>
                    <TableCell className="text-xs text-gray-600 max-w-xs">
                      <span className="block truncate" title={log.detail}>{log.detail}</span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-gray-500 whitespace-nowrap">{log.time}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${levelConfig[log.level]?.cls || "bg-gray-100 text-gray-600"}`}>
                        {log.level}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Paginacao */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Mostrando 12 de 1.247 registros (pagina 1 de 104)</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled>Anterior</Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-xs bg-[#009933] text-white border-[#009933]">1</Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-xs">2</Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-xs">3</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs">Proxima</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
