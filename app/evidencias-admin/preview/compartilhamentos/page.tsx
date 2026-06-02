"use client"

import {
  Share2, Search, Download, Eye, X, RefreshCw,
  CheckCircle, Clock, XCircle, Ban, FileText,
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

const SHARES = [
  { id: "#122", name: "Relatorio Q1 2025", dest: "externo@parceiro.com", files: 3, status: "Aprovado", by: "C. Silva", created: "01/06/2025", exp: "08/06/2025", downloads: 1, otp: "Validado" },
  { id: "#123", name: "Plantas Bloco A-D", dest: "eng@construtora.com", files: 7, status: "Pendente", by: "M. Costa", created: "01/06/2025", exp: "09/06/2025", downloads: 0, otp: "Aguardando" },
  { id: "#124", name: "Contrato Fornecimento", dest: "juridico@fornecedor.com", files: 2, status: "Aprovado", by: "R. Ferreira", created: "02/06/2025", exp: "06/06/2025", downloads: 0, otp: "Aguardando" },
  { id: "#128", name: "Relatorio Consultoria", dest: "auditoria@consultoria.com", files: 6, status: "Pendente", by: "M. Costa", created: "02/06/2025", exp: "09/06/2025", downloads: 0, otp: "Aguardando" },
  { id: "#125", name: "NF Servicos Junho", dest: "financeiro@empresa.com", files: 1, status: "Aprovado", by: "C. Silva", created: "28/05/2025", exp: "04/06/2025", downloads: 1, otp: "Validado" },
  { id: "#120", name: "Memorial Descritivo", dest: "obras@empresa.com", files: 1, status: "Cancelado", by: "C. Silva", created: "27/05/2025", exp: "-", downloads: 0, otp: "-" },
  { id: "#119", name: "Documentos Auditoria", dest: "auditoria@parceiro.com", files: 4, status: "Rejeitado", by: "J. Alves", created: "26/05/2025", exp: "-", downloads: 0, otp: "-" },
  { id: "#115", name: "Ata Reuniao Mai/2025", dest: "gestor@terceiro.com", files: 2, status: "Aprovado", by: "P. Lima", created: "22/05/2025", exp: "29/05/2025", downloads: 2, otp: "Validado" },
]

const statusConfig: Record<string, { cls: string; icon: React.ElementType }> = {
  Aprovado:  { cls: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  Pendente:  { cls: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  Rejeitado: { cls: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
  Cancelado: { cls: "bg-gray-100 text-gray-700 border-gray-200", icon: Ban },
}

export default function MeusCompartilhamentosPreview() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#009933] rounded-lg flex items-center justify-center">
            <Share2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">PETROBRAS — SCAC / Admin</p>
            <h1 className="text-base font-bold text-gray-900">Meus Compartilhamentos</h1>
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
        {/* Estatísticas */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total de Envios", value: "8", sub: "Todos os meus compartilhamentos", color: "text-gray-700", bg: "bg-white" },
            { label: "Aprovados", value: "4", sub: "50% do total", color: "text-green-700", bg: "bg-green-50" },
            { label: "Pendentes", value: "2", sub: "Aguardando supervisor", color: "text-yellow-700", bg: "bg-yellow-50" },
            { label: "Downloads Realizados", value: "4", sub: "Por destinatarios externos", color: "text-blue-700", bg: "bg-blue-50" },
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
                  <Share2 className="w-4 h-4 text-[#009933]" />
                  Listagem de Compartilhamentos
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Listagem, filtros, cancelamento de envios e reenvio de notificacao ao supervisor.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input className="pl-7 h-8 text-xs w-48" placeholder="Buscar compartilhamento..." />
                </div>
                <Select defaultValue="todos">
                  <SelectTrigger className="h-8 text-xs w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos status</SelectItem>
                    <SelectItem value="aprovado">Aprovados</SelectItem>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="rejeitado">Rejeitados</SelectItem>
                    <SelectItem value="cancelado">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
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
                  <TableHead className="text-xs font-semibold">ID</TableHead>
                  <TableHead className="text-xs font-semibold">Nome</TableHead>
                  <TableHead className="text-xs font-semibold">Destinatario</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Arquivos</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Criado por</TableHead>
                  <TableHead className="text-xs font-semibold">Criado em</TableHead>
                  <TableHead className="text-xs font-semibold">Expira em</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Downloads</TableHead>
                  <TableHead className="text-xs font-semibold">OTP</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SHARES.map((s) => {
                  const cfg = statusConfig[s.status] || { cls: "bg-gray-100 text-gray-600", icon: FileText }
                  const Icon = cfg.icon
                  return (
                    <TableRow key={s.id} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-mono font-semibold text-gray-600">{s.id}</TableCell>
                      <TableCell className="text-xs font-medium text-gray-800">{s.name}</TableCell>
                      <TableCell className="text-xs text-gray-500">{s.dest}</TableCell>
                      <TableCell className="text-xs text-center text-gray-600">{s.files}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${cfg.cls}`}>
                          <Icon className="w-3 h-3" /> {s.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">{s.by}</TableCell>
                      <TableCell className="text-xs text-gray-500">{s.created}</TableCell>
                      <TableCell className="text-xs text-gray-500">{s.exp}</TableCell>
                      <TableCell className="text-xs text-center text-gray-600">{s.downloads}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          s.otp === "Validado" ? "bg-green-100 text-green-700" :
                          s.otp === "Aguardando" ? "bg-yellow-100 text-yellow-700" : "text-gray-400"
                        }`}>{s.otp}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-[#009933]" title="Ver detalhes">
                            <Eye className="w-3 h-3" />
                          </Button>
                          {s.status === "Pendente" && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500" title="Cancelar">
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {/* Rodapé */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">8 compartilhamentos no total — pagina 1 de 1</p>
              <Badge variant="outline" className="text-xs">Atualizacao automatica a cada 30s</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
