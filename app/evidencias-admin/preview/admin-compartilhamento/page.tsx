"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Upload,
  Send,
  Shield,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  X,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  CloudUpload,
} from "lucide-react"

export default function AdminCompartilhamentoPreviewPage() {
  const [files, setFiles] = useState<Array<{ name: string; size: string; type: string }>>([
    { name: "Relatorio_Tecnico_2025.pdf", size: "2.4 MB", type: "pdf" },
    { name: "Planilha_Dados.xlsx", size: "856 KB", type: "xlsx" },
    { name: "Desenho_CAD.dwg", size: "12.3 MB", type: "dwg" },
  ])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const mockUpload = () => {
    setIsUploading(true)
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        setIsUploading(false)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 4000)
      }
    }, 200)
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf": return <FileText className="h-5 w-5 text-red-500" />
      case "xlsx": return <FileSpreadsheet className="h-5 w-5 text-green-600" />
      case "dwg": return <File className="h-5 w-5 text-blue-600" />
      case "jpg":
      case "png": return <FileImage className="h-5 w-5 text-purple-500" />
      default: return <File className="h-5 w-5 text-gray-500" />
    }
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Titulo */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#004d25] to-[#007a3d] flex items-center justify-center shadow-lg">
            <CloudUpload className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Novo Compartilhamento</h2>
            <p className="text-gray-500">Envie arquivos de forma segura para destinatarios externos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de Upload */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="h-5 w-5 text-[#004d25]" />
                  Arquivos para Envio
                </CardTitle>
                <CardDescription>Arraste arquivos ou clique para selecionar</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Drag & Drop Zone */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#004d25] hover:bg-green-50/30 transition-all cursor-pointer mb-6">
                  <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Arraste arquivos aqui</p>
                  <p className="text-sm text-gray-400 mt-1">ou clique para selecionar</p>
                  <p className="text-xs text-gray-400 mt-3">
                    PDF, XLSX, DOC, DWG, JPG, PNG (max. 100MB por arquivo)
                  </p>
                </div>

                {/* Lista de Arquivos */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Arquivos Selecionados ({files.length})</Label>
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.size}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs uppercase">{file.type}</Badge>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Card de Destinatario */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Send className="h-5 w-5 text-[#004d25]" />
                  Informacoes do Compartilhamento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="destinatario">E-mail do Destinatario *</Label>
                    <Input
                      id="destinatario"
                      type="email"
                      placeholder="email@empresa.com.br"
                      defaultValue="fornecedor@empresa.com.br"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiracao">Expiracao do Link</Label>
                    <Select defaultValue="168">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 horas</SelectItem>
                        <SelectItem value="72">3 dias</SelectItem>
                        <SelectItem value="168">7 dias</SelectItem>
                        <SelectItem value="336">14 dias</SelectItem>
                        <SelectItem value="720">30 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descricao / Mensagem</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Adicione uma descricao ou mensagem para o destinatario..."
                    rows={3}
                    defaultValue="Segue em anexo a documentacao tecnica solicitada referente ao projeto de expansao da unidade. Por favor, confirme o recebimento."
                  />
                </div>

                {/* Progresso de Upload */}
                {isUploading && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700">Enviando arquivos...</span>
                      <span className="text-sm font-bold text-blue-700">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {/* Botao Enviar */}
                <Button 
                  onClick={mockUpload}
                  disabled={isUploading}
                  className="w-full bg-[#004d25] hover:bg-[#003d1d] gap-2 h-12 text-base"
                >
                  <Send className="h-5 w-5" />
                  {isUploading ? "Enviando..." : "Enviar Compartilhamento"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar com Info */}
          <div className="space-y-6">
            {/* Card de Seguranca */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-[#004d25] to-[#007a3d] text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="h-6 w-6" />
                  <span className="font-semibold">Envio Seguro</span>
                </div>
                <ul className="space-y-3 text-sm text-white/90">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Criptografia AES-256 em transito e repouso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Links expiram automaticamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Auditoria completa de acessos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Validacao de arquivos maliciosos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Card de Resumo */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gray-50/50 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Resumo do Envio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Arquivos:</span>
                  <span className="font-medium">3 arquivos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tamanho total:</span>
                  <span className="font-medium">15.6 MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Destinatario:</span>
                  <span className="font-medium truncate max-w-[140px]">fornecedor@empresa.com.br</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Expiracao:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    7 dias
                  </span>
                </div>
                <hr className="my-2" />
                <div className="text-xs text-gray-400">
                  Remetente: admin@petrobras.com.br
                </div>
              </CardContent>
            </Card>

            {/* Ultimos Compartilhamentos */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gray-50/50 pb-3">
                <CardTitle className="text-base">Ultimos Envios</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">Documentacao_Projeto.zip</p>
                    <p className="text-xs text-gray-500">Há 2 horas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">Contrato_Fornecedor.pdf</p>
                    <p className="text-xs text-gray-500">Há 5 horas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">Plantas_CAD.dwg</p>
                    <p className="text-xs text-gray-500">Ontem</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 max-w-md">
          <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
          <div>
            <div className="font-semibold">Compartilhamento Enviado!</div>
            <div className="text-sm text-green-100">3 arquivos enviados para fornecedor@empresa.com.br</div>
            <div className="text-xs text-green-200 mt-1">Link expira em 7 dias</div>
          </div>
        </div>
      )}
    </div>
  )
}
