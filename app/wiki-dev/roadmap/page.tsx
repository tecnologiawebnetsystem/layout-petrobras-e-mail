"use client"

import { useState, useMemo, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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
  FileText,
  Flag,
  TrendingUp,
  Filter,
  Download,
  AlertTriangle,
  Link2,
  MessageSquare,
  BarChart3,
  GanttChart,
  ChevronDown,
  ChevronUp,
  FileDown,
  Table
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ReferenceLine
} from "recharts"

// =============================================
// TIPOS E INTERFACES
// =============================================

interface Entrega {
  nome: string
  status: "concluido" | "em_progresso" | "pendente"
  tipo: string
  dataPrevista?: string
  dataConclusao?: string
  notas?: string
  bloqueios?: string
  dependeDe?: number[] // IDs das fases que esta entrega depende
}

interface Fase {
  id: number
  nome: string
  periodo: string
  dataInicio: string
  dataFim: string
  status: "concluido" | "em_progresso" | "pendente"
  progresso: number
  cor: string
  descricao: string
  responsavel: string
  entregas: Entrega[]
  dependeDe?: number[] // IDs das fases que esta fase depende
  risco?: "baixo" | "medio" | "alto"
}

// =============================================
// DADOS DO ROADMAP - EDITE AQUI
// =============================================

const fases: Fase[] = [
  {
    id: 1,
    nome: "Fase 1 - Front-End",
    periodo: "Novembro - Dezembro 2025",
    dataInicio: "2025-11-01",
    dataFim: "2025-12-31",
    status: "concluido",
    progresso: 100,
    cor: "from-blue-500 to-cyan-500",
    descricao: "Desenvolvimento completo do Front-End com Next.js, telas e componentes",
    responsavel: "Time Front-End",
    risco: "baixo",
    entregas: [
      { nome: "Setup do projeto Next.js", status: "concluido", tipo: "tecnico", dataPrevista: "2025-11-05", dataConclusao: "2025-11-03", notas: "Configuracao inicial do projeto concluida com sucesso" },
      { nome: "Configuracao Tailwind + shadcn/ui", status: "concluido", tipo: "tecnico", dataPrevista: "2025-11-10", dataConclusao: "2025-11-08" },
      { nome: "Tela de Login com Microsoft Entra ID", status: "concluido", tipo: "frontend", dataPrevista: "2025-11-20", dataConclusao: "2025-11-18" },
      { nome: "Tela de Upload de Arquivos", status: "concluido", tipo: "frontend", dataPrevista: "2025-11-25", dataConclusao: "2025-11-24" },
      { nome: "Tela do Supervisor (Aprovacoes)", status: "concluido", tipo: "frontend", dataPrevista: "2025-12-05", dataConclusao: "2025-12-03" },
      { nome: "Tela de Download Externo", status: "concluido", tipo: "frontend", dataPrevista: "2025-12-10", dataConclusao: "2025-12-09" },
      { nome: "Tela de Historico", status: "concluido", tipo: "frontend", dataPrevista: "2025-12-15", dataConclusao: "2025-12-14" },
      { nome: "Tela de Auditoria", status: "concluido", tipo: "frontend", dataPrevista: "2025-12-20", dataConclusao: "2025-12-18" },
      { nome: "Tela de Configuracoes", status: "concluido", tipo: "frontend", dataPrevista: "2025-12-25", dataConclusao: "2025-12-22" },
      { nome: "Componentes de UI reutilizaveis", status: "concluido", tipo: "frontend", dataPrevista: "2025-12-28", dataConclusao: "2025-12-26" },
      { nome: "Sistema de Notificacoes (UI)", status: "concluido", tipo: "frontend", dataPrevista: "2025-12-30", dataConclusao: "2025-12-28" },
      { nome: "Wiki-Dev (Documentacao)", status: "concluido", tipo: "documentacao", dataPrevista: "2025-12-31", dataConclusao: "2025-12-30" },
    ]
  },
  {
    id: 2,
    nome: "Fase 2 - Back-End",
    periodo: "Dezembro 2025 - Janeiro 2026",
    dataInicio: "2025-12-01",
    dataFim: "2026-01-31",
    status: "concluido",
    progresso: 100,
    cor: "from-green-500 to-emerald-500",
    descricao: "Desenvolvimento completo do Back-End Python com FastAPI e servicos AWS",
    responsavel: "Time Back-End",
    dependeDe: [1],
    risco: "baixo",
    entregas: [
      { nome: "Setup FastAPI + estrutura de pastas", status: "concluido", tipo: "backend", dataPrevista: "2025-12-10", dataConclusao: "2025-12-08" },
      { nome: "Configuracao AWS (IAM, credenciais)", status: "concluido", tipo: "aws", dataPrevista: "2025-12-15", dataConclusao: "2025-12-14" },
      { nome: "Endpoints de Autenticacao", status: "concluido", tipo: "backend", dataPrevista: "2025-12-20", dataConclusao: "2025-12-19" },
      { nome: "Endpoints de Upload/Download", status: "concluido", tipo: "backend", dataPrevista: "2025-12-28", dataConclusao: "2025-12-27" },
      { nome: "Endpoints de Aprovacao", status: "concluido", tipo: "backend", dataPrevista: "2026-01-05", dataConclusao: "2026-01-04" },
      { nome: "Endpoints de Historico/Auditoria", status: "concluido", tipo: "backend", dataPrevista: "2026-01-12", dataConclusao: "2026-01-10" },
      { nome: "Integracao com DynamoDB", status: "concluido", tipo: "aws", dataPrevista: "2026-01-18", dataConclusao: "2026-01-16" },
      { nome: "Integracao com S3", status: "concluido", tipo: "aws", dataPrevista: "2026-01-22", dataConclusao: "2026-01-20" },
      { nome: "Envio de emails (SES/Graph API)", status: "concluido", tipo: "aws", dataPrevista: "2026-01-28", dataConclusao: "2026-01-26" },
      { nome: "Validacao de arquivos ZIP", status: "concluido", tipo: "backend", dataPrevista: "2026-01-31", dataConclusao: "2026-01-29" },
    ]
  },
  {
    id: 3,
    nome: "Fase 3 - Integracao Front + Back",
    periodo: "Janeiro - Fevereiro 2026",
    dataInicio: "2026-01-15",
    dataFim: "2026-02-28",
    status: "em_progresso",
    progresso: 40,
    cor: "from-purple-500 to-indigo-500",
    descricao: "Integracao entre Front-End e Back-End, fluxos completos e testes",
    responsavel: "Time Full-Stack",
    dependeDe: [1, 2],
    risco: "medio",
    entregas: [
      { nome: "Conectar Front com APIs reais", status: "em_progresso", tipo: "integracao", dataPrevista: "2026-02-05", notas: "Em andamento - 70% concluido", bloqueios: "Aguardando ajustes no endpoint de autenticacao" },
      { nome: "Fluxo completo de Login/SSO", status: "em_progresso", tipo: "integracao", dataPrevista: "2026-02-08", notas: "Integracao com Microsoft Entra em testes" },
      { nome: "Fluxo completo de Upload", status: "em_progresso", tipo: "integracao", dataPrevista: "2026-02-12" },
      { nome: "Fluxo completo de Aprovacao", status: "pendente", tipo: "integracao", dataPrevista: "2026-02-16", dependeDe: [1, 2] },
      { nome: "Fluxo completo de Download Externo", status: "pendente", tipo: "integracao", dataPrevista: "2026-02-20" },
      { nome: "Sistema de Notificacoes integrado", status: "pendente", tipo: "integracao", dataPrevista: "2026-02-24" },
      { nome: "Auditoria e Logs integrados", status: "pendente", tipo: "seguranca", dataPrevista: "2026-02-26" },
      { nome: "Testes de Integracao E2E", status: "pendente", tipo: "teste", dataPrevista: "2026-02-28" },
    ]
  },
  {
    id: 4,
    nome: "Fase 4 - Docker e Containerizacao",
    periodo: "Fevereiro - Marco 2026",
    dataInicio: "2026-02-15",
    dataFim: "2026-03-15",
    status: "pendente",
    progresso: 0,
    cor: "from-cyan-500 to-teal-500",
    descricao: "Containerizacao da aplicacao com Docker para ambientes consistentes",
    responsavel: "Time DevOps",
    dependeDe: [3],
    risco: "baixo",
    entregas: [
      { nome: "Dockerfile do Front-End (Next.js)", status: "pendente", tipo: "devops", dataPrevista: "2026-02-20" },
      { nome: "Dockerfile do Back-End (FastAPI)", status: "pendente", tipo: "devops", dataPrevista: "2026-02-25" },
      { nome: "Docker Compose para ambiente local", status: "pendente", tipo: "devops", dataPrevista: "2026-03-01" },
      { nome: "Configuracao de variaveis de ambiente", status: "pendente", tipo: "devops", dataPrevista: "2026-03-05" },
      { nome: "Otimizacao de imagens Docker", status: "pendente", tipo: "devops", dataPrevista: "2026-03-10" },
      { nome: "Testes em containers locais", status: "pendente", tipo: "teste", dataPrevista: "2026-03-15" },
    ]
  },
  {
    id: 5,
    nome: "Fase 5 - AWS e Infraestrutura",
    periodo: "Marco 2026",
    dataInicio: "2026-03-01",
    dataFim: "2026-03-31",
    status: "pendente",
    progresso: 0,
    cor: "from-orange-500 to-amber-500",
    descricao: "Configuracao da infraestrutura AWS (ECS, ECR, Load Balancer, etc.)",
    responsavel: "Time DevOps",
    dependeDe: [4],
    risco: "medio",
    entregas: [
      { nome: "Configurar Amazon ECR (Container Registry)", status: "pendente", tipo: "aws", dataPrevista: "2026-03-05" },
      { nome: "Configurar Amazon ECS (Container Service)", status: "pendente", tipo: "aws", dataPrevista: "2026-03-10" },
      { nome: "Configurar Application Load Balancer", status: "pendente", tipo: "aws", dataPrevista: "2026-03-14" },
      { nome: "Configurar VPC e Security Groups", status: "pendente", tipo: "aws", dataPrevista: "2026-03-18" },
      { nome: "Configurar dominio e SSL (Route53/ACM)", status: "pendente", tipo: "aws", dataPrevista: "2026-03-22" },
      { nome: "Configurar CloudWatch (Logs/Metricas)", status: "pendente", tipo: "aws", dataPrevista: "2026-03-26" },
      { nome: "Pipeline CI/CD (CodePipeline)", status: "pendente", tipo: "devops", dataPrevista: "2026-03-31" },
    ]
  },
  {
    id: 6,
    nome: "Fase 6 - Deploy Desenvolvimento",
    periodo: "Marco - Abril 2026",
    dataInicio: "2026-03-20",
    dataFim: "2026-04-10",
    status: "pendente",
    progresso: 0,
    cor: "from-sky-500 to-blue-500",
    descricao: "Deploy e validacao no ambiente de Desenvolvimento",
    responsavel: "Time DevOps + QA",
    dependeDe: [5],
    risco: "baixo",
    entregas: [
      { nome: "Deploy Front-End em DEV", status: "pendente", tipo: "deploy", dataPrevista: "2026-03-25" },
      { nome: "Deploy Back-End em DEV", status: "pendente", tipo: "deploy", dataPrevista: "2026-03-28" },
      { nome: "Configurar banco de dados DEV", status: "pendente", tipo: "aws", dataPrevista: "2026-04-01" },
      { nome: "Testes funcionais em DEV", status: "pendente", tipo: "teste", dataPrevista: "2026-04-04" },
      { nome: "Validacao de integracao em DEV", status: "pendente", tipo: "teste", dataPrevista: "2026-04-07" },
      { nome: "Correcao de bugs DEV", status: "pendente", tipo: "tecnico", dataPrevista: "2026-04-10" },
    ]
  },
  {
    id: 7,
    nome: "Fase 7 - Deploy Homologacao",
    periodo: "Abril 2026",
    dataInicio: "2026-04-05",
    dataFim: "2026-04-25",
    status: "pendente",
    progresso: 0,
    cor: "from-yellow-500 to-orange-500",
    descricao: "Deploy e validacao no ambiente de Homologacao com usuarios",
    responsavel: "Time DevOps + QA + Usuarios",
    dependeDe: [6],
    risco: "alto",
    entregas: [
      { nome: "Deploy Front-End em HML", status: "pendente", tipo: "deploy", dataPrevista: "2026-04-08" },
      { nome: "Deploy Back-End em HML", status: "pendente", tipo: "deploy", dataPrevista: "2026-04-10" },
      { nome: "Configurar banco de dados HML", status: "pendente", tipo: "aws", dataPrevista: "2026-04-12" },
      { nome: "Testes de aceitacao (UAT)", status: "pendente", tipo: "teste", dataPrevista: "2026-04-16" },
      { nome: "Testes de carga e performance", status: "pendente", tipo: "teste", dataPrevista: "2026-04-18" },
      { nome: "Testes de seguranca", status: "pendente", tipo: "seguranca", dataPrevista: "2026-04-21" },
      { nome: "Aprovacao dos stakeholders", status: "pendente", tipo: "marco", dataPrevista: "2026-04-25" },
    ]
  },
  {
    id: 8,
    nome: "Fase 8 - Deploy Producao",
    periodo: "Final de Abril 2026",
    dataInicio: "2026-04-20",
    dataFim: "2026-04-30",
    status: "pendente",
    progresso: 0,
    cor: "from-red-500 to-rose-500",
    descricao: "Deploy final em Producao e Go-Live do sistema",
    responsavel: "Time DevOps + Todos",
    dependeDe: [7],
    risco: "alto",
    entregas: [
      { nome: "Deploy Front-End em PRD", status: "pendente", tipo: "deploy", dataPrevista: "2026-04-22" },
      { nome: "Deploy Back-End em PRD", status: "pendente", tipo: "deploy", dataPrevista: "2026-04-24" },
      { nome: "Configurar banco de dados PRD", status: "pendente", tipo: "aws", dataPrevista: "2026-04-25" },
      { nome: "Configurar monitoramento PRD", status: "pendente", tipo: "aws", dataPrevista: "2026-04-26" },
      { nome: "Configurar alertas e notificacoes", status: "pendente", tipo: "devops", dataPrevista: "2026-04-27" },
      { nome: "Smoke tests em PRD", status: "pendente", tipo: "teste", dataPrevista: "2026-04-28" },
      { nome: "Documentacao final", status: "pendente", tipo: "documentacao", dataPrevista: "2026-04-29" },
      { nome: "Go-Live Producao", status: "pendente", tipo: "marco", dataPrevista: "2026-04-30" },
    ]
  },
]

const marcos = [
  { data: "31/12/2025", nome: "Front-End Concluido", status: "concluido" },
  { data: "31/01/2026", nome: "Back-End Concluido", status: "concluido" },
  { data: "28/02/2026", nome: "Integracao Completa", status: "pendente" },
  { data: "30/04/2026", nome: "Go-Live Producao", status: "pendente" },
]

// Dados historicos para o Burndown (simulando progresso semanal)
const dadosBurndown = [
  { semana: "Nov S1", planejado: 100, real: 100, entregas: 57 },
  { semana: "Nov S2", planejado: 95, real: 96, entregas: 55 },
  { semana: "Nov S3", planejado: 90, real: 91, entregas: 52 },
  { semana: "Nov S4", planejado: 85, real: 86, entregas: 49 },
  { semana: "Dez S1", planejado: 80, real: 80, entregas: 46 },
  { semana: "Dez S2", planejado: 75, real: 74, entregas: 42 },
  { semana: "Dez S3", planejado: 70, real: 68, entregas: 39 },
  { semana: "Dez S4", planejado: 65, real: 62, entregas: 35 },
  { semana: "Jan S1", planejado: 60, real: 57, entregas: 32 },
  { semana: "Jan S2", planejado: 55, real: 52, entregas: 29 },
  { semana: "Jan S3", planejado: 50, real: 47, entregas: 27 },
  { semana: "Jan S4", planejado: 45, real: 43, entregas: 24 },
  { semana: "Fev S1", planejado: 40, real: 40, entregas: 22 },
  { semana: "Fev S2", planejado: 35, real: null, entregas: null },
  { semana: "Fev S3", planejado: 30, real: null, entregas: null },
  { semana: "Fev S4", planejado: 25, real: null, entregas: null },
  { semana: "Mar S1", planejado: 20, real: null, entregas: null },
  { semana: "Mar S2", planejado: 15, real: null, entregas: null },
  { semana: "Mar S3", planejado: 10, real: null, entregas: null },
  { semana: "Mar S4", planejado: 5, real: null, entregas: null },
  { semana: "Abr S1", planejado: 0, real: null, entregas: null },
]

// =============================================
// PROGRESSO GERAL DO PROJETO
// =============================================
const progressoGeral = 75

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
    deploy: "bg-emerald-100 text-emerald-700",
  }
  
  return (
    <Badge className={`${cores[tipo] || "bg-slate-100 text-slate-700"} hover:opacity-80 text-xs`}>
      {tipo}
    </Badge>
  )
}

function RiscoBadge({ risco }: { risco?: string }) {
  if (!risco) return null
  
  const config: Record<string, { cor: string; icone: React.ReactNode }> = {
    baixo: { cor: "bg-green-100 text-green-700", icone: <CheckCircle2 className="h-3 w-3" /> },
    medio: { cor: "bg-amber-100 text-amber-700", icone: <AlertTriangle className="h-3 w-3" /> },
    alto: { cor: "bg-red-100 text-red-700", icone: <AlertCircle className="h-3 w-3" /> },
  }
  
  const { cor, icone } = config[risco] || config.baixo
  
  return (
    <Badge className={`${cor} hover:opacity-80 text-xs gap-1`}>
      {icone}
      Risco {risco}
    </Badge>
  )
}

function DiasRestantes({ dataPrevista, status }: { dataPrevista?: string; status: string }) {
  if (!dataPrevista || status === "concluido") return null
  
  const hoje = new Date()
  const previsao = new Date(dataPrevista)
  const diff = Math.ceil((previsao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diff < 0) {
    return (
      <span className="text-xs text-red-600 font-medium flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        {Math.abs(diff)} dias em atraso
      </span>
    )
  } else if (diff <= 7) {
    return (
      <span className="text-xs text-amber-600 font-medium">
        {diff} dias restantes
      </span>
    )
  }
  
  return (
    <span className="text-xs text-slate-500">
      {diff} dias restantes
    </span>
  )
}

function DependenciasIndicador({ dependencias, fases }: { dependencias?: number[]; fases: Fase[] }) {
  if (!dependencias || dependencias.length === 0) return null
  
  const fasesDepende = fases.filter(f => dependencias.includes(f.id))
  const todasConcluidas = fasesDepende.every(f => f.status === "concluido")
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 text-xs ${todasConcluidas ? "text-green-600" : "text-amber-600"}`}>
            <Link2 className="h-3 w-3" />
            {dependencias.length} dep.
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium mb-1">Depende de:</p>
          <ul className="text-xs space-y-1">
            {fasesDepende.map(f => (
              <li key={f.id} className="flex items-center gap-1">
                <StatusIcon status={f.status} />
                {f.nome.split(" - ")[0]}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// =============================================
// COMPONENTE DE GANTT CHART
// =============================================

function GanttChartView({ fases }: { fases: Fase[] }) {
  const dataInicioProjeto = new Date("2025-11-01")
  const dataFimProjeto = new Date("2026-04-30")
  const totalDias = Math.ceil((dataFimProjeto.getTime() - dataInicioProjeto.getTime()) / (1000 * 60 * 60 * 24))
  
  const meses = ["Nov 25", "Dez 25", "Jan 26", "Fev 26", "Mar 26", "Abr 26"]
  
  const calcularPosicao = (dataStr: string) => {
    const data = new Date(dataStr)
    const diasDesdeInicio = Math.ceil((data.getTime() - dataInicioProjeto.getTime()) / (1000 * 60 * 60 * 24))
    return (diasDesdeInicio / totalDias) * 100
  }
  
  const calcularLargura = (dataInicioStr: string, dataFimStr: string) => {
    const inicio = new Date(dataInicioStr)
    const fim = new Date(dataFimStr)
    const duracao = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    return (duracao / totalDias) * 100
  }
  
  const hoje = new Date()
  const posicaoHoje = calcularPosicao(hoje.toISOString().split('T')[0])
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GanttChart className="h-5 w-5 text-indigo-500" />
          Gantt Chart - Visao Temporal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header com meses */}
            <div className="flex border-b pb-2 mb-4">
              <div className="w-48 flex-shrink-0 font-medium text-sm text-slate-600">Fase</div>
              <div className="flex-1 flex">
                {meses.map((mes, i) => (
                  <div key={i} className="flex-1 text-center text-sm text-slate-500 border-l border-slate-200 first:border-l-0">
                    {mes}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Linhas do Gantt */}
            <div className="space-y-3 relative">
              {/* Linha vertical do dia atual */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: `calc(192px + ${posicaoHoje}% * (100% - 192px) / 100)` }}
              >
                <div className="absolute -top-6 -left-3 text-xs text-red-500 font-medium whitespace-nowrap">
                  Hoje
                </div>
              </div>
              
              {fases.map((fase) => {
                const posicaoInicio = calcularPosicao(fase.dataInicio)
                const largura = calcularLargura(fase.dataInicio, fase.dataFim)
                
                return (
                  <div key={fase.id} className="flex items-center">
                    <div className="w-48 flex-shrink-0 pr-4">
                      <p className="text-sm font-medium truncate">{fase.nome.split(" - ")[1] || fase.nome}</p>
                      <p className="text-xs text-slate-500">{fase.responsavel}</p>
                    </div>
                    <div className="flex-1 relative h-10 bg-slate-50 rounded">
                      {/* Grid de meses */}
                      <div className="absolute inset-0 flex">
                        {meses.map((_, i) => (
                          <div key={i} className="flex-1 border-l border-slate-200 first:border-l-0" />
                        ))}
                      </div>
                      
                      {/* Barra da fase */}
                      <div
                        className={`absolute top-1 bottom-1 rounded bg-gradient-to-r ${fase.cor} shadow-sm flex items-center justify-center transition-all hover:scale-y-110`}
                        style={{
                          left: `${posicaoInicio}%`,
                          width: `${largura}%`,
                        }}
                      >
                        <span className="text-xs text-white font-medium px-2 truncate">
                          {fase.progresso}%
                        </span>
                      </div>
                      
                      {/* Barra de progresso real */}
                      {fase.progresso > 0 && fase.progresso < 100 && (
                        <div
                          className="absolute top-1 bottom-1 rounded-l bg-white/30"
                          style={{
                            left: `${posicaoInicio}%`,
                            width: `${(largura * fase.progresso) / 100}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Legenda */}
            <div className="flex items-center gap-6 mt-6 pt-4 border-t text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-emerald-500" />
                <span>Concluido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-indigo-500" />
                <span>Em Progresso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-slate-300 to-slate-400" />
                <span>Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-4 bg-red-500" />
                <span>Data Atual</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================
// COMPONENTE DE BURNDOWN CHART
// =============================================

function BurndownChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          Grafico Burndown / Burnup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dadosBurndown} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPlanejado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00a859" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00a859" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="semana" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 100]} />
              <Legend />
              <ReferenceLine y={0} stroke="#000" />
              <Area
                type="monotone"
                dataKey="planejado"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPlanejado)"
                name="Planejado"
                strokeDasharray="5 5"
              />
              <Area
                type="monotone"
                dataKey="real"
                stroke="#00a859"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorReal)"
                name="Real"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">40%</p>
            <p className="text-sm text-slate-500">Pendente Planejado</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">40%</p>
            <p className="text-sm text-slate-500">Pendente Real</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">0%</p>
            <p className="text-sm text-slate-500">Desvio</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export default function RoadmapPage() {
  const [faseAtiva, setFaseAtiva] = useState<number | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string[]>(["concluido", "em_progresso", "pendente"])
  const [filtroTipo, setFiltroTipo] = useState<string[]>([])
  const [notasEntrega, setNotasEntrega] = useState<Record<string, string>>({})
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Todos os tipos disponiveis
  const todosTipos = useMemo(() => {
    const tipos = new Set<string>()
    fases.forEach(fase => {
      fase.entregas.forEach(entrega => {
        tipos.add(entrega.tipo)
      })
    })
    return Array.from(tipos).sort()
  }, [])
  
  // Metricas calculadas
  const metricas = useMemo(() => {
    const totalEntregas = fases.reduce((acc, fase) => acc + fase.entregas.length, 0)
    const entregasConcluidas = fases.reduce((acc, fase) => acc + fase.entregas.filter(e => e.status === "concluido").length, 0)
    const entregasEmProgresso = fases.reduce((acc, fase) => acc + fase.entregas.filter(e => e.status === "em_progresso").length, 0)
    const entregasPendentes = fases.reduce((acc, fase) => acc + fase.entregas.filter(e => e.status === "pendente").length, 0)
    
    // Entregas em atraso
    const hoje = new Date()
    const entregasAtrasadas = fases.reduce((acc, fase) => {
      return acc + fase.entregas.filter(e => {
        if (e.status === "concluido" || !e.dataPrevista) return false
        return new Date(e.dataPrevista) < hoje
      }).length
    }, 0)
    
    // Fases de alto risco
    const fasesAltoRisco = fases.filter(f => f.risco === "alto" && f.status !== "concluido").length
    
    return {
      totalEntregas,
      entregasConcluidas,
      entregasEmProgresso,
      entregasPendentes,
      entregasAtrasadas,
      fasesAltoRisco,
    }
  }, [])
  
  // Fases filtradas
  const fasesFiltradas = useMemo(() => {
    return fases.map(fase => {
      const entregasFiltradas = fase.entregas.filter(entrega => {
        const statusMatch = filtroStatus.includes(entrega.status)
        const tipoMatch = filtroTipo.length === 0 || filtroTipo.includes(entrega.tipo)
        return statusMatch && tipoMatch
      })
      return { ...fase, entregas: entregasFiltradas }
    }).filter(fase => {
      // Mostrar fase se tem entregas filtradas OU se o status da fase corresponde ao filtro
      return fase.entregas.length > 0 || filtroStatus.includes(fase.status)
    })
  }, [filtroStatus, filtroTipo])
  
  // Funcao de exportar PDF
  const exportarPDF = () => {
    window.print()
  }
  
  // Funcao de exportar CSV
  const exportarCSV = () => {
    const headers = ["Fase", "Entrega", "Status", "Tipo", "Data Prevista", "Data Conclusao", "Notas"]
    const rows = fases.flatMap(fase =>
      fase.entregas.map(entrega => [
        fase.nome,
        entrega.nome,
        entrega.status,
        entrega.tipo,
        entrega.dataPrevista || "",
        entrega.dataConclusao || "",
        entrega.notas || ""
      ])
    )
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `roadmap-petrobras-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 print:bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 print:static">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/wiki-dev" className="print:hidden">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-300 print:hidden" />
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
            <div className="flex items-center gap-3 print:hidden">
              {/* Filtros */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                    {(filtroStatus.length < 3 || filtroTipo.length > 0) && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                        {3 - filtroStatus.length + filtroTipo.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={filtroStatus.includes("concluido")}
                    onCheckedChange={(checked) => {
                      setFiltroStatus(prev =>
                        checked ? [...prev, "concluido"] : prev.filter(s => s !== "concluido")
                      )
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Concluido
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filtroStatus.includes("em_progresso")}
                    onCheckedChange={(checked) => {
                      setFiltroStatus(prev =>
                        checked ? [...prev, "em_progresso"] : prev.filter(s => s !== "em_progresso")
                      )
                    }}
                  >
                    <Clock className="h-4 w-4 text-amber-500 mr-2" />
                    Em Progresso
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filtroStatus.includes("pendente")}
                    onCheckedChange={(checked) => {
                      setFiltroStatus(prev =>
                        checked ? [...prev, "pendente"] : prev.filter(s => s !== "pendente")
                      )
                    }}
                  >
                    <Circle className="h-4 w-4 text-slate-300 mr-2" />
                    Pendente
                  </DropdownMenuCheckboxItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filtrar por Tipo</DropdownMenuLabel>
                  {todosTipos.map(tipo => (
                    <DropdownMenuCheckboxItem
                      key={tipo}
                      checked={filtroTipo.includes(tipo)}
                      onCheckedChange={(checked) => {
                        setFiltroTipo(prev =>
                          checked ? [...prev, tipo] : prev.filter(t => t !== tipo)
                        )
                      }}
                    >
                      <TipoBadge tipo={tipo} />
                    </DropdownMenuCheckboxItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setFiltroStatus(["concluido", "em_progresso", "pendente"])
                      setFiltroTipo([])
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Exportar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem onClick={exportarPDF}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem onClick={exportarCSV}>
                    <Table className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                Atualizado em {new Date().toLocaleDateString("pt-BR")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8" ref={contentRef}>
        {/* Alertas de Risco */}
        {(metricas.entregasAtrasadas > 0 || metricas.fasesAltoRisco > 0) && (
          <div className="mb-6 space-y-2">
            {metricas.entregasAtrasadas > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Atencao: {metricas.entregasAtrasadas} entrega(s) em atraso</p>
                      <p className="text-sm text-red-700">Revise as entregas pendentes com data prevista ultrapassada.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {metricas.fasesAltoRisco > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800">{metricas.fasesAltoRisco} fase(s) com alto risco</p>
                      <p className="text-sm text-amber-700">Fases criticas que requerem atencao especial.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Metricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
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
          
          <Card className={metricas.entregasAtrasadas > 0 ? "border-red-200" : ""}>
            <CardContent className="p-6 flex flex-col items-center justify-center h-full">
              <AlertTriangle className={`h-8 w-8 mb-2 ${metricas.entregasAtrasadas > 0 ? "text-red-500" : "text-slate-300"}`} />
              <p className={`text-3xl font-bold ${metricas.entregasAtrasadas > 0 ? "text-red-600" : "text-slate-900"}`}>
                {metricas.entregasAtrasadas}
              </p>
              <p className="text-sm text-slate-500">Em Atraso</p>
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
          <TabsList className="bg-white border print:hidden">
            <TabsTrigger value="timeline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="gantt" className="gap-2">
              <GanttChart className="h-4 w-4" />
              Gantt
            </TabsTrigger>
            <TabsTrigger value="burndown" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Burndown
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
            {fasesFiltradas.map((fase) => (
              <Card 
                key={fase.id} 
                className={`overflow-hidden transition-all ${
                  faseAtiva === fase.id ? "ring-2 ring-indigo-500" : ""
                } ${fase.risco === "alto" && fase.status !== "concluido" ? "border-red-200" : ""}`}
              >
                <div className={`h-2 bg-gradient-to-r ${fase.cor}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${fase.cor} flex items-center justify-center text-white font-bold`}>
                        {fase.id}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {fase.nome}
                          <RiscoBadge risco={fase.risco} />
                        </CardTitle>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          {fase.periodo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DependenciasIndicador dependencias={fase.dependeDe} fases={fases} />
                      <StatusBadge status={fase.status} />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setFaseAtiva(faseAtiva === fase.id ? null : fase.id)}
                        className="print:hidden"
                      >
                        {faseAtiva === fase.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
                  } print:block`}>
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium text-slate-700 mb-3">Entregas desta fase:</p>
                      <div className="grid grid-cols-1 gap-3">
                        {fase.entregas.map((entrega, i) => (
                          <div 
                            key={i}
                            className={`p-4 rounded-lg border ${
                              entrega.status === "concluido" 
                                ? "bg-green-50 border-green-200" 
                                : entrega.status === "em_progresso"
                                ? "bg-amber-50 border-amber-200"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <StatusIcon status={entrega.status} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-medium ${
                                      entrega.status === "concluido" ? "line-through text-slate-500" : ""
                                    }`}>
                                      {entrega.nome}
                                    </span>
                                    <TipoBadge tipo={entrega.tipo} />
                                  </div>
                                  
                                  {/* Datas e dias restantes */}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                    {entrega.dataPrevista && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Previsto: {new Date(entrega.dataPrevista).toLocaleDateString("pt-BR")}
                                      </span>
                                    )}
                                    {entrega.dataConclusao && (
                                      <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Concluido: {new Date(entrega.dataConclusao).toLocaleDateString("pt-BR")}
                                      </span>
                                    )}
                                    <DiasRestantes dataPrevista={entrega.dataPrevista} status={entrega.status} />
                                  </div>
                                  
                                  {/* Dependencias da entrega */}
                                  {entrega.dependeDe && entrega.dependeDe.length > 0 && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                                      <Link2 className="h-3 w-3" />
                                      Depende das fases: {entrega.dependeDe.join(", ")}
                                    </div>
                                  )}
                                  
                                  {/* Notas */}
                                  {entrega.notas && (
                                    <div className="mt-2 p-2 bg-white/50 rounded text-sm text-slate-600">
                                      <MessageSquare className="h-3 w-3 inline mr-1" />
                                      {entrega.notas}
                                    </div>
                                  )}
                                  
                                  {/* Bloqueios */}
                                  {entrega.bloqueios && (
                                    <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
                                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                                      <strong>Bloqueio:</strong> {entrega.bloqueios}
                                    </div>
                                  )}
                                  
                                  {/* Campo para adicionar notas */}
                                  <div className="mt-3 print:hidden">
                                    <Textarea
                                      placeholder="Adicionar nota ou comentario..."
                                      className="text-sm h-20 bg-white"
                                      value={notasEntrega[`${fase.id}-${i}`] || ""}
                                      onChange={(e) => setNotasEntrega(prev => ({
                                        ...prev,
                                        [`${fase.id}-${i}`]: e.target.value
                                      }))}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preview das entregas quando recolhido */}
                  {faseAtiva !== fase.id && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 print:hidden">
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
          
          {/* Gantt View */}
          <TabsContent value="gantt">
            <GanttChartView fases={fases} />
          </TabsContent>
          
          {/* Burndown View */}
          <TabsContent value="burndown">
            <BurndownChart />
          </TabsContent>

          {/* Kanban View */}
          <TabsContent value="kanban">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {fasesFiltradas.map((fase) => (
                <Card key={fase.id} className="overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${fase.cor}`} />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {fase.nome.split(" - ")[0]}
                        <RiscoBadge risco={fase.risco} />
                      </span>
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
                            <div className="flex items-center gap-2 mt-1">
                              <TipoBadge tipo={entrega.tipo} />
                              <DiasRestantes dataPrevista={entrega.dataPrevista} status={entrega.status} />
                            </div>
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
                    .filter(e => filtroStatus.includes(e.status))
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
                    .filter(e => filtroStatus.includes(e.status))
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
                    .filter(e => e.tipo === "aws" || e.tipo === "devops" || e.tipo === "deploy")
                    .filter(e => filtroStatus.includes(e.status))
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
                    .filter(e => filtroStatus.includes(e.status))
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
        <Card className="mt-8 print:hidden">
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
                <p className="text-xs text-slate-500 mb-2">Risco:</p>
                <div className="flex items-center gap-2">
                  <RiscoBadge risco="baixo" />
                  <RiscoBadge risco="medio" />
                  <RiscoBadge risco="alto" />
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
                  <TipoBadge tipo="deploy" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Como Editar */}
        <Card className="mt-4 border-amber-200 bg-amber-50 print:hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Como atualizar o Roadmap?</p>
                <p className="text-sm text-amber-700 mt-1">
                  Para atualizar o roadmap, edite o arquivo <code className="bg-amber-200 px-1 rounded">/app/wiki-dev/roadmap/page.tsx</code>.
                  No inicio do arquivo voce encontra os arrays <code className="bg-amber-200 px-1 rounded">fases</code> e <code className="bg-amber-200 px-1 rounded">marcos</code> com todos os dados.
                  Altere o status de cada entrega para <code className="bg-amber-200 px-1 rounded">concluido</code>, <code className="bg-amber-200 px-1 rounded">em_progresso</code> ou <code className="bg-amber-200 px-1 rounded">pendente</code>.
                  Adicione <code className="bg-amber-200 px-1 rounded">notas</code>, <code className="bg-amber-200 px-1 rounded">bloqueios</code> e <code className="bg-amber-200 px-1 rounded">dependeDe</code> conforme necessario.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
