"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { AppHeader } from "@/components/shared/app-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Search, Eye, CheckCircle, XCircle, Clock, Filter } from "lucide-react"

// Mock data - arquivos pendentes de aprovação
const pendingFiles = [
  {
    id: "1",
    name: "Relatorio_Anual_Contratos_2023_Final.pdf",
    type: "PDF",
    sender: { name: "Ana Clara Santos", role: "Analista Financeira, Fornecedor XYZ" },
    uploadDate: "15/07/2024 - 14:32",
    size: "12.8 MB",
    status: "pending",
    priority: "high",
    description: "Relatório anual consolidado de contratos 2023",
  },
  {
    id: "2",
    name: "Contrato_Servicos_2024.docx",
    type: "DOCX",
    sender: { name: "Carlos Pereira", role: "Gerente Comercial, Empresa ABC" },
    uploadDate: "14/07/2024 - 10:15",
    size: "2.4 MB",
    status: "pending",
    priority: "medium",
    description: "Contrato de prestação de serviços",
  },
  {
    id: "3",
    name: "Proposta_Tecnica_Projeto_X.pdf",
    type: "PDF",
    sender: { name: "Mariana Costa", role: "Engenheira, Consultoria Tech" },
    uploadDate: "13/07/2024 - 16:45",
    size: "8.5 MB",
    status: "approved",
    priority: "high",
    description: "Proposta técnica para projeto X",
  },
  {
    id: "4",
    name: "Orcamento_Q3_2024.xlsx",
    type: "XLS",
    sender: { name: "Ricardo Lima", role: "Analista Financeiro, Fornecedor Beta" },
    uploadDate: "12/07/2024 - 09:20",
    size: "4.2 MB",
    status: "pending",
    priority: "low",
    description: "Orçamento trimestral Q3",
  },
  {
    id: "5",
    name: "Apresentacao_Resultado_Anual.pptx",
    type: "PPT",
    sender: { name: "Patricia Oliveira", role: "Diretora Executiva, Parceiro Gold" },
    uploadDate: "11/07/2024 - 14:00",
    size: "15.2 MB",
    status: "rejected",
    priority: "medium",
    description: "Apresentação de resultados anuais",
  },
  {
    id: "6",
    name: "Nota_Fiscal_Servicos_JUN.xml",
    type: "XML",
    sender: { name: "João Santos", role: "Contador, Empresa Gamma" },
    uploadDate: "10/07/2024 - 11:30",
    size: "128 KB",
    status: "pending",
    priority: "high",
    description: "Nota fiscal de serviços - Junho/2024",
  },
]

export default function SupervisorPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== "supervisor") {
      router.push("/")
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, user, router])

  if (isLoading) {
    return null
  }

  const getFileIcon = (type: string) => {
    const iconClass = "h-12 w-12"
    switch (type) {
      case "PDF":
        return <FileText className={`${iconClass} text-red-500`} />
      case "DOCX":
        return <FileText className={`${iconClass} text-blue-500`} />
      case "XLS":
        return <FileText className={`${iconClass} text-green-600`} />
      case "PPT":
        return <FileText className={`${iconClass} text-orange-500`} />
      case "XML":
        return <FileText className={`${iconClass} text-purple-500`} />
      default:
        return <FileText className={`${iconClass} text-gray-500`} />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        )
      default:
        return null
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Alta</Badge>
      case "medium":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100">Média</Badge>
      case "low":
        return <Badge variant="secondary">Baixa</Badge>
      default:
        return null
    }
  }

  const handleApprove = (fileId: string) => {
    console.log("[v0] Aprovando arquivo:", fileId)
    // Aqui seria a chamada à API
  }

  const handleReject = (fileId: string) => {
    console.log("[v0] Rejeitando arquivo:", fileId)
    // Aqui seria a chamada à API
  }

  const filteredFiles = pendingFiles.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.sender.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || file.status === statusFilter
    const matchesPriority = priorityFilter === "all" || file.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const pendingCount = pendingFiles.filter((f) => f.status === "pending").length
  const approvedCount = pendingFiles.filter((f) => f.status === "approved").length
  const rejectedCount = pendingFiles.filter((f) => f.status === "rejected").length

  return (
    <div className="min-h-screen bg-background">
      <AppHeader subtitle="Módulo Supervisor" />

      <div className="container max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Arquivos para Aprovação</h1>
          <p className="text-muted-foreground text-lg">
            Gerencie e aprove os documentos enviados pelos usuários externos.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total de Arquivos</p>
                <p className="text-3xl font-bold text-foreground">{pendingFiles.length}</p>
              </div>
              <FileText className="h-10 w-10 text-[#00A99D]" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Aprovados</p>
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rejeitados</p>
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do arquivo ou remetente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Files Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex gap-4">
                {/* File Icon */}
                <div className="flex-shrink-0">{getFileIcon(file.type)}</div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-foreground text-lg truncate">{file.name}</h3>
                    {getPriorityBadge(file.priority)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Remetente:</span>
                      <span className="text-sm font-medium text-foreground">{file.sender.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{file.sender.role}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Data: {file.uploadDate}</span>
                      <span>Tamanho: {file.size}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{file.description}</p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {getStatusBadge(file.status)}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/supervisor/detalhes/${file.id}`)}
                        className="text-[#0047BB] border-[#0047BB] hover:bg-[#0047BB] hover:text-white"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>

                      {file.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(file.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(file.id)}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredFiles.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum arquivo encontrado</h3>
            <p className="text-muted-foreground">Tente ajustar os filtros ou buscar por outros termos.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
