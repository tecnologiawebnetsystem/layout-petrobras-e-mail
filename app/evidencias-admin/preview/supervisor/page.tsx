"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload, 
  ClipboardCheck,
  Filter,
  RefreshCcw,
  Shield,
  User,
  Mail,
  Calendar,
  ChevronRight
} from "lucide-react"

// Dados mockados para preview
const mockPendingShares = [
  {
    id: "share-001",
    name: "Relatorio_Financeiro_Q2_2025.xlsx",
    sender: { name: "Joao Silva", email: "joao.silva@petrobras.com.br" },
    recipient: "parceiro@empresa.com",
    createdAt: "2025-06-02T10:30:00",
    expiresAt: "2025-06-09T10:30:00",
    status: "pending",
    size: "2.4 MB",
    files: 1
  },
  {
    id: "share-002",
    name: "Projeto_Expansao_Norte.pdf",
    sender: { name: "Maria Costa", email: "maria.costa@petrobras.com.br" },
    recipient: "consultor@external.com",
    createdAt: "2025-06-01T14:15:00",
    expiresAt: "2025-06-08T14:15:00",
    status: "pending",
    size: "15.8 MB",
    files: 3
  },
  {
    id: "share-003",
    name: "Analise_Tecnica_Pocos.dwg",
    sender: { name: "Carlos Santos", email: "carlos.santos@petrobras.com.br" },
    recipient: "engenheiro@consultoria.com",
    createdAt: "2025-05-31T09:00:00",
    expiresAt: "2025-06-07T09:00:00",
    status: "pending",
    size: "45.2 MB",
    files: 5
  }
]

const mockApprovedShares = [
  {
    id: "share-004",
    name: "Contrato_Servicos_2025.pdf",
    sender: { name: "Ana Oliveira", email: "ana.oliveira@petrobras.com.br" },
    recipient: "juridico@fornecedor.com",
    createdAt: "2025-05-30T11:00:00",
    expiresAt: "2025-06-06T11:00:00",
    status: "approved",
    approvedAt: "2025-05-30T14:30:00",
    size: "1.2 MB",
    files: 1
  },
  {
    id: "share-005",
    name: "Especificacoes_Equipamento.xlsx",
    sender: { name: "Pedro Lima", email: "pedro.lima@petrobras.com.br" },
    recipient: "compras@empresa.com",
    createdAt: "2025-05-29T16:45:00",
    expiresAt: "2025-06-05T16:45:00",
    status: "approved",
    approvedAt: "2025-05-30T09:00:00",
    size: "856 KB",
    files: 2
  }
]

const mockRejectedShares = [
  {
    id: "share-006",
    name: "Dados_Sensíveis_Internos.pdf",
    sender: { name: "Lucas Ferreira", email: "lucas.ferreira@petrobras.com.br" },
    recipient: "externo@desconhecido.com",
    createdAt: "2025-05-28T10:00:00",
    status: "rejected",
    rejectedAt: "2025-05-28T15:00:00",
    rejectReason: "Destinatario nao autorizado para receber este tipo de documento",
    size: "3.5 MB",
    files: 1
  }
]

export default function SupervisorPreviewPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("aprovacoes")

  const pendingCount = mockPendingShares.length
  const approvedCount = mockApprovedShares.length
  const rejectedCount = mockRejectedShares.length
  const totalCount = pendingCount + approvedCount + rejectedCount

  return (
    <div className="min-h-screen bg-background">
      {/* Header mockado */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/images/petrobras-logo.png" alt="Petrobras" className="h-8 w-auto" />
            <span className="text-sm text-muted-foreground">Inicio &gt; Supervisao</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">MS</div>
              <div className="text-sm">
                <p className="font-medium">Maria Supervisora</p>
                <p className="text-xs text-muted-foreground">Supervisora de Projetos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Titulo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Painel do Supervisor</h1>
              <p className="text-muted-foreground">Gerencie aprovacoes de compartilhamentos da sua equipe</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Cards de estatisticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aprovados</p>
                  <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejeitados</p>
                  <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold">{totalCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="aprovacoes" className="gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Aprovacoes
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="compartilhar" className="gap-2">
                <Upload className="h-4 w-4" />
                Compartilhar
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="aprovacoes" className="space-y-4">
            {/* Compartilhamentos Pendentes */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-lg">Aguardando Aprovacao</CardTitle>
                </div>
                <CardDescription>Compartilhamentos que precisam da sua analise</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockPendingShares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">{share.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {share.sender.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {share.recipient}
                          </span>
                          <span>{share.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                      <Button variant="destructive" size="sm">
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Aprovados Recentemente */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">Aprovados Recentemente</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockApprovedShares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{share.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{share.sender.name}</span>
                          <span>→</span>
                          <span>{share.recipient}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                      Aprovado
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Rejeitados */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-lg">Rejeitados</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockRejectedShares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">{share.name}</p>
                        <p className="text-sm text-red-600">{share.rejectReason}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                      Rejeitado
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compartilhar">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <CardTitle>Novo Compartilhamento</CardTitle>
                </div>
                <CardDescription>Envie arquivos diretamente para destinatarios externos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Arraste arquivos aqui</p>
                  <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
                  <Button>Selecionar Arquivos</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Aviso de preview */}
        <div className="fixed bottom-4 right-4 bg-amber-100 border border-amber-300 rounded-lg px-4 py-2 text-sm text-amber-800 shadow-lg">
          <Shield className="inline h-4 w-4 mr-2" />
          Preview de Teste — Dados Simulados
        </div>
      </main>
    </div>
  )
}
