"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  Filter,
  Users,
  Activity,
  CheckCircle2,
  Calendar,
  Shield,
  BarChart3,
} from "lucide-react"

export default function RelatoriosPreviewPage() {
  const [exportFormat, setExportFormat] = useState<"csv" | "txt" | "pdf">("csv")
  const [exportDataType, setExportDataType] = useState<"users" | "shares" | "logs">("users")
  const [showSuccess, setShowSuccess] = useState(false)

  const mockExport = () => {
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#004d25] to-[#007a3d] text-white px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SCAC Petrobras</h1>
              <p className="text-sm text-white/80">Painel Administrativo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              Admin SCAC
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Titulo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#004d25] to-[#007a3d] flex items-center justify-center shadow-lg">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gerar Relatorios</h2>
              <p className="text-gray-500">Exporte dados do sistema em diferentes formatos</p>
            </div>
          </div>
        </div>

        {/* Grid de opcoes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card de Configuracao */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="h-5 w-5 text-[#004d25]" />
                Configurar Exportacao
              </CardTitle>
              <CardDescription>Selecione o formato e o tipo de dados</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Formato */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <FileType className="h-4 w-4" />
                  Formato de Exportacao
                </Label>
                <RadioGroup
                  value={exportFormat}
                  onValueChange={(v) => setExportFormat(v as "csv" | "txt" | "pdf")}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="format-csv" />
                    <Label htmlFor="format-csv" className="font-normal cursor-pointer">
                      CSV (Excel)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="txt" id="format-txt" />
                    <Label htmlFor="format-txt" className="font-normal cursor-pointer">
                      TXT (Texto)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="format-pdf" />
                    <Label htmlFor="format-pdf" className="font-normal cursor-pointer">
                      PDF
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Tipo de Dados */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Tipo de Dados
                </Label>
                <RadioGroup
                  value={exportDataType}
                  onValueChange={(v) => setExportDataType(v as "users" | "shares" | "logs")}
                  className="grid gap-3"
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="users" id="data-users" />
                    <Label htmlFor="data-users" className="font-normal cursor-pointer flex items-center gap-2 flex-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      Usuarios do Sistema
                      <Badge variant="secondary" className="ml-auto">247 registros</Badge>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="shares" id="data-shares" />
                    <Label htmlFor="data-shares" className="font-normal cursor-pointer flex items-center gap-2 flex-1">
                      <FileText className="h-4 w-4 text-green-600" />
                      Compartilhamentos
                      <Badge variant="secondary" className="ml-auto">1.842 registros</Badge>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="logs" id="data-logs" />
                    <Label htmlFor="data-logs" className="font-normal cursor-pointer flex items-center gap-2 flex-1">
                      <Activity className="h-4 w-4 text-purple-600" />
                      Logs de Auditoria
                      <Badge variant="secondary" className="ml-auto">15.390 registros</Badge>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Periodo */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Periodo
                </Label>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1">Hoje</Button>
                  <Button variant="outline" size="sm" className="flex-1">7 dias</Button>
                  <Button variant="default" size="sm" className="flex-1 bg-[#004d25] hover:bg-[#003d1d]">30 dias</Button>
                  <Button variant="outline" size="sm" className="flex-1">Personalizado</Button>
                </div>
              </div>

              {/* Botao Exportar */}
              <Button 
                onClick={mockExport}
                className="w-full bg-[#004d25] hover:bg-[#003d1d] gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar Relatorio
              </Button>
            </CardContent>
          </Card>

          {/* Card de Preview */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-[#004d25]" />
                Preview do Relatorio
              </CardTitle>
              <CardDescription>Visualizacao dos dados a serem exportados</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Usuarios do Sistema - Ultimos 30 dias
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-gray-600">Nome</th>
                      <th className="text-left py-2 font-medium text-gray-600">Email</th>
                      <th className="text-left py-2 font-medium text-gray-600">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-dashed">
                      <td className="py-2">Admin SCAC</td>
                      <td className="py-2 text-gray-500">admin@petrobras.com.br</td>
                      <td className="py-2"><Badge variant="secondary" className="text-xs">Admin</Badge></td>
                    </tr>
                    <tr className="border-b border-dashed">
                      <td className="py-2">Maria Silva</td>
                      <td className="py-2 text-gray-500">maria.silva@petrobras.com.br</td>
                      <td className="py-2"><Badge variant="outline" className="text-xs">Interno</Badge></td>
                    </tr>
                    <tr className="border-b border-dashed">
                      <td className="py-2">Carlos Santos</td>
                      <td className="py-2 text-gray-500">carlos.santos@petrobras.com.br</td>
                      <td className="py-2"><Badge variant="outline" className="text-xs">Supervisor</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-400" colSpan={3}>... e mais 244 registros</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Estatisticas */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">247</div>
                  <div className="text-xs text-blue-600">Total Usuarios</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">1.842</div>
                  <div className="text-xs text-green-600">Compartilhamentos</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-700">15.3K</div>
                  <div className="text-xs text-purple-600">Logs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historico de Exportacoes */}
        <Card className="border-0 shadow-lg mt-6">
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="text-lg">Historico de Exportacoes Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Arquivo</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Formato</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Data</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Tamanho</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">relatorio_usuarios_2025-05-30.csv</td>
                  <td className="px-6 py-4"><Badge variant="secondary">Usuarios</Badge></td>
                  <td className="px-6 py-4">CSV</td>
                  <td className="px-6 py-4 text-gray-500">30/05/2025 14:32</td>
                  <td className="px-6 py-4 text-gray-500">124 KB</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-700 border-0">Concluido</Badge></td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">relatorio_logs_auditoria_2025-05-29.pdf</td>
                  <td className="px-6 py-4"><Badge variant="secondary">Logs</Badge></td>
                  <td className="px-6 py-4">PDF</td>
                  <td className="px-6 py-4 text-gray-500">29/05/2025 09:15</td>
                  <td className="px-6 py-4 text-gray-500">2.3 MB</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-700 border-0">Concluido</Badge></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">relatorio_compartilhamentos_2025-05-28.csv</td>
                  <td className="px-6 py-4"><Badge variant="secondary">Compartilhamentos</Badge></td>
                  <td className="px-6 py-4">CSV</td>
                  <td className="px-6 py-4 text-gray-500">28/05/2025 16:45</td>
                  <td className="px-6 py-4 text-gray-500">856 KB</td>
                  <td className="px-6 py-4"><Badge className="bg-green-100 text-green-700 border-0">Concluido</Badge></td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5" />
          <div>
            <div className="font-medium">Exportacao Concluida!</div>
            <div className="text-sm text-green-100">relatorio_usuarios_2025-05-30.csv</div>
          </div>
        </div>
      )}
    </div>
  )
}
