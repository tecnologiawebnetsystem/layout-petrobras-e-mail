"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Target,
  Users,
  Server,
  Cloud,
  Shield,
  Database,
  FileText,
  Rocket,
  Flag,
  TrendingUp
} from "lucide-react"

// =============================================
// DADOS DO ROADMAP - EDITE AQUI
// =============================================

const fases = [
  {
    id: 1,
    nome: "Fase 1 - Fundacao",
    periodo: "Janeiro - Fevereiro 2025",
    status: "em_progresso", // concluido, em_progresso, pendente
    progresso: 85,
    cor: "from-blue-500 to-cyan-500",
    descricao: "Estrutura base do projeto, configuracoes iniciais e telas principais",
    responsavel: "Time Front-End",
    entregas: [
      { nome: "Setup do projeto Next.js", status: "concluido", tipo: "tecnico" },
      { nome: "Configuracao Tailwind + shadcn/ui", status: "concluido", tipo: "tecnico" },
      { nome: "Tela de Login", status: "concluido", tipo: "frontend" },
      { nome: "Tela de Upload de Arquivos", status: "concluido", tipo: "frontend" },
      { nome: "Tela do Supervisor (Aprovacoes)", status: "concluido", tipo: "frontend" },
      { nome: "Tela de Download Externo", status: "concluido", tipo: "frontend" },
      { nome: "Componentes de UI reutilizaveis", status: "concluido", tipo: "frontend" },
      { nome: "Wiki-Dev (Documentacao)", status: "em_progresso", tipo: "documentacao" },
    ]
  },
  {
    id: 2,
    nome: "Fase 2 - Back-End",
    periodo: "Marco - Abril 2025",
    status: "em_progresso",
    progresso: 30,
    cor: "from-green-500 to-emerald-500",
    descricao: "Desenvolvimento do back-end Python com FastAPI e integracao com AWS",
    responsavel: "Time Back-End",
    entregas: [
      { nome: "Setup FastAPI + estrutura de pastas", status: "concluido", tipo: "backend" },
      { nome: "Configuracao AWS (IAM, credenciais)", status: "concluido", tipo: "aws" },
      { nome: "Endpoints de Autenticacao", status: "em_progresso", tipo: "backend" },
      { nome: "Endpoints de Upload/Download", status: "pendente", tipo: "backend" },
      { nome: "Endpoints de Aprovacao", status: "pendente", tipo: "backend" },
      { nome: "Integracao com DynamoDB", status: "pendente", tipo: "aws" },
      { nome: "Integracao com S3", status: "pendente", tipo: "aws" },
      { nome: "Envio de emails (SES)", status: "pendente", tipo: "aws" },
    ]
  },
  {
    id: 3,
    nome: "Fase 3 - Integracao",
    periodo: "Maio - Junho 2025",
    status: "pendente",
    progresso: 0,
    cor: "from-purple-500 to-violet-500",
    descricao: "Integracao Front-End + Back-End, SSO e fluxos completos",
    responsavel: "Time Full-Stack",
    entregas: [
      { nome: "Conectar Front com APIs reais", status: "pendente", tipo: "integracao" },
      { nome: "Implementar Microsoft Entra ID (SSO)", status: "pendente", tipo: "seguranca" },
      { nome: "Fluxo completo de Upload", status: "pendente", tipo: "integracao" },
      { nome: "Fluxo completo de Aprovacao", status: "pendente", tipo: "integracao" },
      { nome: "Fluxo completo de Download", status: "pendente", tipo: "integracao" },
      { nome: "Sistema de Notificacoes", status: "pendente", tipo: "integracao" },
      { nome: "Auditoria e Logs", status: "pendente", tipo: "seguranca" },
      { nome: "Testes de Integracao", status: "pendente", tipo: "teste" },
    ]
  },
  {
    id: 4,
    nome: "Fase 4 - Deploy e Producao",
    periodo: "Julho - Agosto 2025",
    status: "pendente",
    progresso: 0,
    cor: "from-orange-500 to-red-500",
    descricao: "Deploy na AWS, ambiente de producao, monitoramento e go-live",
    responsavel: "Time DevOps + Todos",
    entregas: [
      { nome: "Configurar ambiente DEV na AWS", status: "pendente", tipo: "aws" },
      { nome: "Configurar ambiente HML na AWS", status: "pendente", tipo: "aws" },
      { nome: "Configurar ambiente PRD na AWS", status: "pendente", tipo: "aws" },
      { nome: "Pipeline CI/CD (CodePipeline)", status: "pendente", tipo: "devops" },
      { nome: "Configurar dominio e SSL", status: "pendente", tipo: "aws" },
      { nome: "Monitoramento (CloudWatch)", status: "pendente", tipo: "aws" },
      { nome: "Testes de Carga e Seguranca", status: "pendente", tipo: "teste" },
      { nome: "Go-Live Producao", status: "pendente", tipo: "marco" },
    ]
  },
]

const marcos = [
  { data: "15/02/2025", nome: "Front-End MVP Pronto", status: "concluido" },
  { data: "30/04/2025", nome: "Back-End APIs Funcionais", status: "pendente" },
  { data: "30/06/2025", nome: "Sistema Integrado Completo", status: "pendente" },
  { data: "31/08/2025", nome: "Go-Live Producao", status: "pendente" },
]

const metricas = {
  totalEntregas: fases.reduce((acc, fase) => acc + fase.entregas.length, 0),
  entregasConcluidas: fases.reduce((acc, fase) => acc + fase.entregas.filter(e => e.status === "concluido").length, 0),
  entregasEmProgresso: fases.reduce((acc, fase) => acc + fase.entregas.filter(e => e.status === "em_progresso").length, 0),
  entregasPendentes: fases.reduce((acc, fase) => acc + fase.entregas.filter(e => e.status === "pendente").length, 0),
}

const progressoGeral = Math.round((metricas.entregasConcluidas / metricas.totalEntregas) * 100)

// =============================================
// COMPONENTES AUXILIARES
// =============================================

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "concluido":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case "em_progresso":
      return <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
    case "pendente":
      return <Circle className="h-5 w-5 text-slate-300" />
    default:
      return <Circle className="h-5 w-5 text-slate-300" />
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "concluido":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Concluido</Badge>
    case "em_progresso":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Em Progresso</Badge>
    case "pendente":
      return <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100">Pendente</Badge>
    default:
      return <Badge variant="outline">-</Badge>
  }
}

function TipoBadge({ tipo }: { tipo: string }) {
  const cores: Record<string, string> = {
    tecnico: "bg-blue-100 text-blue-700",
    frontend: "bg-cyan-100 text-cyan-700",
    backend: "bg-green-100 text-green-700",
    aws: "bg-orange-100 text-orange-700",
    integracao: "bg-purple-100 text-purple-700",
    seguranca: "bg-red-100 text-red-700",
    teste: "bg-pink-100 text-pink-700",
    devops: "bg-indigo-100 text-indigo-700",
    documentacao: "bg-slate-100 text-slate-700",
    marco: "bg-amber-100 text-amber-700",
  }
  
  return (
    <Badge className={`${cores[tipo] || "bg-slate-100 text-slate-700"} hover:opacity-80 text-xs`}>
      {tipo}
    </Badge>
  )
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export default function RoadmapPage() {
  const [faseAtiva, setFaseAtiva] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/wiki-dev">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-300" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Roadmap do Projeto</h1>
                  <p className="text-sm text-slate-500">Sistema de Transferencia de Arquivos - Petrobras</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                Atualizado em {new Date().toLocaleDateString("pt-BR")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Metricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-indigo-100 text-sm">Progresso Geral</p>
                  <p className="text-4xl font-bold">{progressoGeral}%</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
              <Progress value={progressoGeral} className="h-2 bg-white/30" />
              <p className="text-indigo-100 text-sm mt-2">
                {metricas.entregasConcluidas} de {metricas.totalEntregas} entregas concluidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center h-full">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-3xl font-bold text-slate-900">{metricas.entregasConcluidas}</p>
              <p className="text-sm text-slate-500">Concluidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center h-full">
              <Clock className="h-8 w-8 text-amber-500 mb-2" />
              <p className="text-3xl font-bold text-slate-900">{metricas.entregasEmProgresso}</p>
              <p className="text-sm text-slate-500">Em Progresso</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center h-full">
              <Circle className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-3xl font-bold text-slate-900">{metricas.entregasPendentes}</p>
              <p className="text-sm text-slate-500">Pendentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Marcos Principais */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flag className="h-5 w-5 text-amber-500" />
              Marcos Principais (Milestones)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {marcos.map((marco, index) => (
                <div key={index} className="flex items-center gap-4 flex-1">
                  <div className={`flex flex-col items-center ${index < marcos.length - 1 ? "flex-1" : ""}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      marco.status === "concluido" 
                        ? "bg-green-100 text-green-600" 
                        : "bg-slate-100 text-slate-400"
                    }`}>
                      {marco.status === "concluido" ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Flag className="h-5 w-5" />
                      )}
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-xs text-slate-500">{marco.data}</p>
                      <p className={`text-sm font-medium ${
                        marco.status === "concluido" ? "text-green-600" : "text-slate-700"
                      }`}>
                        {marco.nome}
                      </p>
                    </div>
                  </div>
                  {index < marcos.length - 1 && (
                    <div className={`hidden md:block flex-1 h-1 rounded ${
                      marco.status === "concluido" ? "bg-green-300" : "bg-slate-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Visualizacao */}
        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="timeline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <FileText className="h-4 w-4" />
              Por Fase
            </TabsTrigger>
            <TabsTrigger value="equipe" className="gap-2">
              <Users className="h-4 w-4" />
              Por Equipe
            </TabsTrigger>
          </TabsList>

          {/* Timeline View */}
          <TabsContent value="timeline" className="space-y-6">
            {fases.map((fase, index) => (
              <Card 
                key={fase.id} 
                className={`overflow-hidden transition-all ${
                  faseAtiva === fase.id ? "ring-2 ring-indigo-500" : ""
                }`}
              >
                <div className={`h-2 bg-gradient-to-r ${fase.cor}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${fase.cor} flex items-center justify-center text-white font-bold`}>
                        {fase.id}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{fase.nome}</CardTitle>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          {fase.periodo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={fase.status} />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setFaseAtiva(faseAtiva === fase.id ? null : fase.id)}
                      >
                        {faseAtiva === fase.id ? "Recolher" : "Expandir"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">{fase.descricao}</p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Users className="h-4 w-4" />
                      {fase.responsavel}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-500">Progresso</span>
                        <span className="font-medium">{fase.progresso}%</span>
                      </div>
                      <Progress value={fase.progresso} className="h-2" />
                    </div>
                  </div>

                  {/* Lista de Entregas */}
                  <div className={`space-y-2 transition-all ${
                    faseAtiva === fase.id ? "block" : "hidden"
                  }`}>
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium text-slate-700 mb-3">Entregas desta fase:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {fase.entregas.map((entrega, i) => (
                          <div 
                            key={i}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              entrega.status === "concluido" 
                                ? "bg-green-50 border-green-200" 
                                : entrega.status === "em_progresso"
                                ? "bg-amber-50 border-amber-200"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <StatusIcon status={entrega.status} />
                              <span className={`text-sm ${
                                entrega.status === "concluido" ? "line-through text-slate-500" : ""
                              }`}>
                                {entrega.nome}
                              </span>
                            </div>
                            <TipoBadge tipo={entrega.tipo} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preview das entregas quando recolhido */}
                  {faseAtiva !== fase.id && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {fase.entregas.filter(e => e.status === "concluido").length} concluidas
                      <span className="mx-1">|</span>
                      <Clock className="h-4 w-4 text-amber-500" />
                      {fase.entregas.filter(e => e.status === "em_progresso").length} em progresso
                      <span className="mx-1">|</span>
                      <Circle className="h-4 w-4 text-slate-300" />
                      {fase.entregas.filter(e => e.status === "pendente").length} pendentes
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Kanban View */}
          <TabsContent value="kanban">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {fases.map((fase) => (
                <Card key={fase.id} className="overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${fase.cor}`} />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      {fase.nome.split(" - ")[0]}
                      <Badge variant="outline">{fase.entregas.length}</Badge>
                    </CardTitle>
                    <p className="text-xs text-slate-500">{fase.periodo}</p>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {fase.entregas.map((entrega, i) => (
                      <div 
                        key={i}
                        className={`p-2 rounded border text-sm ${
                          entrega.status === "concluido" 
                            ? "bg-green-50 border-green-200" 
                            : entrega.status === "em_progresso"
                            ? "bg-amber-50 border-amber-200"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <StatusIcon status={entrega.status} />
                          <div className="flex-1">
                            <p className={entrega.status === "concluido" ? "line-through text-slate-500" : ""}>
                              {entrega.nome}
                            </p>
                            <TipoBadge tipo={entrega.tipo} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Equipe View */}
          <TabsContent value="equipe">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Front-End */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <FileText className="h-5 w-5 text-cyan-600" />
                    </div>
                    Time Front-End
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {fases.flatMap(f => f.entregas)
                    .filter(e => e.tipo === "frontend" || e.tipo === "tecnico")
                    .map((entrega, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={entrega.status} />
                          <span className="text-sm">{entrega.nome}</span>
                        </div>
                        <StatusBadge status={entrega.status} />
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Back-End */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Server className="h-5 w-5 text-green-600" />
                    </div>
                    Time Back-End
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {fases.flatMap(f => f.entregas)
                    .filter(e => e.tipo === "backend")
                    .map((entrega, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={entrega.status} />
                          <span className="text-sm">{entrega.nome}</span>
                        </div>
                        <StatusBadge status={entrega.status} />
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* AWS/DevOps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Cloud className="h-5 w-5 text-orange-600" />
                    </div>
                    Time AWS/DevOps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {fases.flatMap(f => f.entregas)
                    .filter(e => e.tipo === "aws" || e.tipo === "devops")
                    .map((entrega, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={entrega.status} />
                          <span className="text-sm">{entrega.nome}</span>
                        </div>
                        <StatusBadge status={entrega.status} />
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Seguranca/QA */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Shield className="h-5 w-5 text-red-600" />
                    </div>
                    Seguranca / QA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {fases.flatMap(f => f.entregas)
                    .filter(e => e.tipo === "seguranca" || e.tipo === "teste")
                    .map((entrega, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={entrega.status} />
                          <span className="text-sm">{entrega.nome}</span>
                        </div>
                        <StatusBadge status={entrega.status} />
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Legenda */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-sm">Legenda de Status e Tipos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-slate-500 mb-2">Status:</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Concluido</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">Em Progresso</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Circle className="h-4 w-4 text-slate-300" />
                    <span className="text-sm">Pendente</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Tipos:</p>
                <div className="flex flex-wrap items-center gap-2">
                  <TipoBadge tipo="frontend" />
                  <TipoBadge tipo="backend" />
                  <TipoBadge tipo="aws" />
                  <TipoBadge tipo="integracao" />
                  <TipoBadge tipo="seguranca" />
                  <TipoBadge tipo="teste" />
                  <TipoBadge tipo="devops" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Como Editar */}
        <Card className="mt-4 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Como atualizar o Roadmap?</p>
                <p className="text-sm text-amber-700 mt-1">
                  Para atualizar o roadmap, edite o arquivo <code className="bg-amber-200 px-1 rounded">/app/wiki-dev/roadmap/page.tsx</code>.
                  No inicio do arquivo voce encontra os arrays <code className="bg-amber-200 px-1 rounded">fases</code> e <code className="bg-amber-200 px-1 rounded">marcos</code> com todos os dados.
                  Altere o status de cada entrega para <code className="bg-amber-200 px-1 rounded">concluido</code>, <code className="bg-amber-200 px-1 rounded">em_progresso</code> ou <code className="bg-amber-200 px-1 rounded">pendente</code>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
