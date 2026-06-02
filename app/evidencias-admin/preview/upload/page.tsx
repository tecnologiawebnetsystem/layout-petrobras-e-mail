"use client"

import { useState } from "react"
import {
  Upload, FileText, CheckCircle, XCircle, AlertTriangle,
  FolderOpen, Paperclip, Trash2, Eye,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const FILES = [
  { name: "Contrato_Fornecedor_2025.pdf", size: "4.2 MB", type: "PDF", status: "Concluido", pct: 100, ok: true },
  { name: "Plantas_Bloco_A-D.dwg", size: "18.7 MB", type: "DWG", status: "Concluido", pct: 100, ok: true },
  { name: "Relatorio_Q1_2025.xlsx", size: "1.1 MB", type: "XLSX", status: "Concluido", pct: 100, ok: true },
  { name: "Especificacoes_Tecnicas_v3.pdf", size: "6.8 MB", type: "PDF", status: "Concluido", pct: 100, ok: true },
  { name: "Memorial_Descritivo_v2.pdf", size: "2.9 MB", type: "PDF", status: "Enviando", pct: 67, ok: true },
  { name: "arquivo_suspeito.exe", size: "1.2 MB", type: "EXE", status: "Bloqueado", pct: 0, ok: false },
]

export default function UploadPreview() {
  const [drag, setDrag] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#009933] rounded-lg flex items-center justify-center">
            <Upload className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">PETROBRAS — SCAC / Admin</p>
            <h1 className="text-base font-bold text-gray-900">Upload de Arquivos</h1>
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

      <div className="p-6 max-w-4xl mx-auto">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Arquivos Enviados Hoje", value: "12", sub: "342 total no sistema", color: "text-gray-700" },
            { label: "Volume Total", value: "34.7 MB", sub: "4 arquivos concluidos", color: "text-green-700" },
            { label: "Bloqueados", value: "1", sub: ".exe bloqueado automaticamente", color: "text-red-700" },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Zona de Drop */}
        <Card className="border-0 shadow-sm mb-4">
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${drag ? "border-[#009933] bg-green-50" : "border-gray-200 bg-gray-50"}`}
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
            >
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">Arraste arquivos aqui ou clique para selecionar</p>
              <p className="text-xs text-gray-400 mt-1">Formatos aceitos: PDF, XLSX, DWG, DOC, DOCX — maximo 500 MB por arquivo</p>
              <p className="text-xs text-red-500 mt-1 font-medium">Arquivos .exe, .bat, .cmd, .sh bloqueados automaticamente por seguranca</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button size="sm" className="bg-[#009933] hover:bg-[#007a29] text-white text-xs gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Selecionar Arquivos
                </Button>
                <Button size="sm" variant="outline" className="text-xs gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" /> Selecionar Pasta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de arquivos */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#009933]" />
              Arquivos em Processamento
            </CardTitle>
            <CardDescription className="text-xs">
              Validacao de tipo, barra de progresso em tempo real e verificacao de arquivos ZIP suspeitos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {FILES.map((f) => (
                <div
                  key={f.name}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    !f.ok ? "border-red-200 bg-red-50" :
                    f.status === "Enviando" ? "border-blue-200 bg-blue-50" :
                    "border-gray-100 bg-white"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    !f.ok ? "bg-red-100" :
                    f.type === "PDF" ? "bg-red-50" :
                    f.type === "XLSX" ? "bg-green-50" :
                    "bg-blue-50"
                  }`}>
                    {!f.ok ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <FileText className={`w-4 h-4 ${
                        f.type === "PDF" ? "text-red-500" :
                        f.type === "XLSX" ? "text-green-600" :
                        "text-blue-500"
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{f.name}</p>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">{f.size}</span>
                        <span className="text-xs text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded font-mono">{f.type}</span>
                      </div>
                    </div>
                    {f.ok && (
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${f.pct === 100 ? "bg-[#009933]" : "bg-blue-500"}`}
                          style={{ width: `${f.pct}%` }}
                        />
                      </div>
                    )}
                    {!f.ok && (
                      <p className="text-xs text-red-600 font-medium mt-0.5">
                        Extensao .exe bloqueada — arquivo perigoso nao permitido no sistema
                      </p>
                    )}
                    {f.status === "Enviando" && (
                      <p className="text-xs text-blue-600 mt-0.5">{f.pct}% — aguardando conclusao...</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      !f.ok ? "bg-red-100 text-red-800" :
                      f.status === "Concluido" ? "bg-green-100 text-green-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>{!f.ok ? "Bloqueado" : f.status}</span>
                    {f.ok && f.status === "Concluido" && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Alerta de arquivo bloqueado */}
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-800">Arquivo bloqueado por seguranca</p>
                <p className="text-xs text-red-600 mt-0.5">
                  O arquivo &quot;arquivo_suspeito.exe&quot; foi bloqueado automaticamente. Extensoes .exe, .bat, .sh e scripts nao sao permitidos no sistema SCAC. 
                  Este evento foi registrado na trilha de auditoria.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
