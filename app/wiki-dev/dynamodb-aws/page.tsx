"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Home,
  Copy,
  Check,
  Database,
  Table,
  Key,
  Search,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Settings,
  Clock,
  Shield,
  Layers,
  Plus,
  Eye,
  FileCode,
  Users,
  FolderOpen,
  Mail,
  Bell,
  Activity,
} from "lucide-react"
import Link from "next/link"

export default function DynamoDBAWSPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("introducao")

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedId === id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )

  const tables = [
    {
      name: "petrobras_transfer_users",
      icon: Users,
      color: "blue",
      description: "Usuarios internos e supervisores do sistema",
      pk: "PK (String)",
      sk: "SK (String)",
      gsi: ["email-index", "user_type-index"],
      ttl: null,
    },
    {
      name: "petrobras_transfer_shares",
      icon: FolderOpen,
      color: "green",
      description: "Compartilhamentos de arquivos (pendentes, aprovados, etc)",
      pk: "PK (String)",
      sk: "SK (String)",
      gsi: ["sender_id-index", "status-index", "recipient_email-index", "approver_id-index"],
      ttl: null,
    },
    {
      name: "petrobras_transfer_files",
      icon: FileCode,
      color: "purple",
      description: "Metadados dos arquivos enviados",
      pk: "PK (String)",
      sk: "SK (String)",
      gsi: ["share_id-index"],
      ttl: null,
    },
    {
      name: "petrobras_transfer_otp_codes",
      icon: Key,
      color: "orange",
      description: "Codigos OTP para autenticacao de externos",
      pk: "PK (String)",
      sk: "SK (String)",
      gsi: [],
      ttl: "expires_at",
    },
    {
      name: "petrobras_transfer_sessions",
      icon: Shield,
      color: "red",
      description: "Sessoes ativas de usuarios",
      pk: "PK (String)",
      sk: "SK (String)",
      gsi: ["user_id-index", "email-index"],
      ttl: "expires_at",
    },
    {
      name: "petrobras_transfer_audit_logs",
      icon: Activity,
      color: "slate",
      description: "Logs de auditoria de todas as acoes",
      pk: "PK (String)",
      sk: "SK (String)",
      gsi: ["user_id-index", "action-index", "date-index"],
      ttl: null,
    },
    {
      name: "petrobras_transfer_notifications",
      icon: Bell,
      color: "yellow",
      description: "Notificacoes in-app para usuarios",
      pk: "PK (String)",
      sk: "SK (String)",
      gsi: ["user_id-index"],
      ttl: null,
    },
    {
      name: "petrobras_transfer_email_logs",
      icon: Mail,
      color: "cyan",
      description: "Historico de emails enviados",
      pk: "PK (String)",
      sk: "SK (String)",
      gsi: ["recipient-index", "type-index"],
      ttl: null,
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
      green: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
      purple: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
      orange: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
      red: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
      slate: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
      yellow: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
      cyan: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200" },
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Voltar para Wiki
            </Button>
          </Link>
        </div>

        {/* Banner de contexto */}
        <Alert className="border-blue-300 bg-blue-50 mb-6">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Nota:</strong> O sistema atualmente utiliza <strong>PostgreSQL (Neon)</strong> como banco de dados principal (19 tabelas).
            Esta documentacao do DynamoDB serve como referencia para uma futura migracao AWS ou para projetos que necessitem de NoSQL.
            Consulte a pagina <Link href="/wiki-dev/postgresql-neon" className="underline font-semibold">PostgreSQL (Neon)</Link> para ver o schema atual.
          </AlertDescription>
        </Alert>

        <div className="mb-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-slate-900">DynamoDB na AWS - Guia Completo</h1>
          <p className="text-lg text-slate-600">
            Referencia para configuracao de DynamoDB na AWS - Tabelas NoSQL, indices GSI, TTL e boas praticas
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-orange-100 text-orange-700">DynamoDB</Badge>
            <Badge className="bg-blue-100 text-blue-700">8 Tabelas</Badge>
            <Badge className="bg-green-100 text-green-700">15+ GSIs</Badge>
            <Badge className="bg-slate-100 text-slate-700">Referencia AWS</Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="introducao">Introducao</TabsTrigger>
            <TabsTrigger value="criar-tabelas">Criar Tabelas</TabsTrigger>
            <TabsTrigger value="gsi">Criar Indices GSI</TabsTrigger>
            <TabsTrigger value="ttl">Configurar TTL</TabsTrigger>
            <TabsTrigger value="cli">Via AWS CLI</TabsTrigger>
            <TabsTrigger value="custos">Custos</TabsTrigger>
          </TabsList>

          {/* TAB 1: Introducao */}
          <TabsContent value="introducao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-6 w-6" />
                  O que e DynamoDB? (Explicacao para Leigos)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Analogia simples:</strong> DynamoDB e como uma planilha Excel super poderosa na nuvem. 
                    Cada "tabela" e uma aba da planilha, cada "item" e uma linha, e cada "atributo" e uma coluna.
                    A diferenca? Ele escala automaticamente para milhoes de linhas sem ficar lento!
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Conceitos Importantes:</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex gap-3 rounded-lg border p-4">
                      <Key className="h-6 w-6 shrink-0 text-blue-600" />
                      <div>
                        <strong className="text-slate-900">Partition Key (PK)</strong>
                        <p className="text-sm text-slate-600">A "chave principal" que identifica o item. Pense como o CPF - unico para cada pessoa.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <Layers className="h-6 w-6 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-slate-900">Sort Key (SK)</strong>
                        <p className="text-sm text-slate-600">Uma segunda chave para organizar. E como ordenar emails por data - mesma pessoa, varias datas.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <Search className="h-6 w-6 shrink-0 text-purple-600" />
                      <div>
                        <strong className="text-slate-900">GSI (Global Secondary Index)</strong>
                        <p className="text-sm text-slate-600">Um "atalho" para buscar por outros campos alem da PK. Tipo um indice de livro.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <Clock className="h-6 w-6 shrink-0 text-orange-600" />
                      <div>
                        <strong className="text-slate-900">TTL (Time To Live)</strong>
                        <p className="text-sm text-slate-600">Deleta items automaticamente apos X tempo. Perfeito para codigos OTP e sessoes.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Tabelas do Sistema:</h3>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {tables.map((table) => {
                      const colors = getColorClasses(table.color)
                      const Icon = table.icon
                      return (
                        <div key={table.name} className={`rounded-lg border ${colors.border} p-3`}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded ${colors.bg}`}>
                              <Icon className={`h-4 w-4 ${colors.text}`} />
                            </div>
                            <span className="text-xs font-mono font-medium truncate">{table.name.replace("petrobras_transfer_", "")}</span>
                          </div>
                          <p className="text-xs text-slate-600">{table.description}</p>
                          {table.ttl && <Badge variant="outline" className="mt-2 text-xs">TTL</Badge>}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Por que usamos DynamoDB?</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Serverless</strong>
                        <p className="text-sm text-green-700">Nao precisa gerenciar servidores de banco de dados</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Escala automatico</strong>
                        <p className="text-sm text-green-700">De 1 a milhoes de usuarios sem configuracao</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Performance</strong>
                        <p className="text-sm text-green-700">Latencia de milissegundos em qualquer escala</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Integracao AWS</strong>
                        <p className="text-sm text-green-700">Funciona perfeitamente com Lambda, ECS, etc</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Criar Tabelas */}
          <TabsContent value="criar-tabelas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-6 w-6" />
                  Criar Tabelas no Console AWS
                </CardTitle>
                <CardDescription>Siga o passo a passo para cada tabela</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Primeiro:</strong> Acesse o console do DynamoDB em: <a href="https://console.aws.amazon.com/dynamodbv2" target="_blank" rel="noopener noreferrer" className="underline">console.aws.amazon.com/dynamodbv2</a>
                  </AlertDescription>
                </Alert>

                {/* Tabela Users */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">1. Tabela: petrobras_transfer_users</h3>
                      <p className="text-sm text-slate-600">Armazena usuarios internos e supervisores</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">1</span>
                      <p>No menu lateral, clique em <strong>"Tables"</strong> e depois <strong>"Create table"</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">2</span>
                      <div>
                        <p>Preencha os campos:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Table name: <code className="bg-slate-100 px-2 py-1 rounded">petrobras_transfer_users</code></li>
                          <li>Partition key: <code className="bg-slate-100 px-2 py-1 rounded">PK</code> (String)</li>
                          <li>Sort key: <code className="bg-slate-100 px-2 py-1 rounded">SK</code> (String)</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">3</span>
                      <div>
                        <p>Em <strong>"Table settings"</strong>:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Selecione <strong>"Customize settings"</strong></li>
                          <li>Table class: <strong>DynamoDB Standard</strong></li>
                          <li>Capacity mode: <strong>On-demand</strong> (paga por uso, melhor para comecar)</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">4</span>
                      <p>Clique <strong>"Create table"</strong></p>
                    </div>
                  </div>
                </div>

                {/* Tabela Shares */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <FolderOpen className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">2. Tabela: petrobras_transfer_shares</h3>
                      <p className="text-sm text-slate-600">Compartilhamentos de arquivos - tabela principal</p>
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm font-medium mb-2">Configuracoes:</p>
                    <ul className="list-disc list-inside text-sm text-slate-600">
                      <li>Table name: <code className="bg-white px-2 py-1 rounded">petrobras_transfer_shares</code></li>
                      <li>Partition key: <code className="bg-white px-2 py-1 rounded">PK</code> (String)</li>
                      <li>Sort key: <code className="bg-white px-2 py-1 rounded">SK</code> (String)</li>
                      <li>Capacity: <strong>On-demand</strong></li>
                    </ul>
                  </div>
                </div>

                {/* Tabela Files */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <FileCode className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">3. Tabela: petrobras_transfer_files</h3>
                      <p className="text-sm text-slate-600">Metadados dos arquivos enviados</p>
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-slate-50 p-4">
                    <ul className="list-disc list-inside text-sm text-slate-600">
                      <li>Table name: <code className="bg-white px-2 py-1 rounded">petrobras_transfer_files</code></li>
                      <li>Partition key: <code className="bg-white px-2 py-1 rounded">PK</code> (String)</li>
                      <li>Sort key: <code className="bg-white px-2 py-1 rounded">SK</code> (String)</li>
                    </ul>
                  </div>
                </div>

                {/* Tabela OTP */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Key className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">4. Tabela: petrobras_transfer_otp_codes</h3>
                      <p className="text-sm text-slate-600">Codigos OTP (expira automaticamente!)</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700">TTL Necessario</Badge>
                  </div>
                  
                  <div className="rounded-lg bg-slate-50 p-4">
                    <ul className="list-disc list-inside text-sm text-slate-600">
                      <li>Table name: <code className="bg-white px-2 py-1 rounded">petrobras_transfer_otp_codes</code></li>
                      <li>Partition key: <code className="bg-white px-2 py-1 rounded">PK</code> (String)</li>
                      <li>Sort key: <code className="bg-white px-2 py-1 rounded">SK</code> (String)</li>
                    </ul>
                  </div>
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Lembrete:</strong> Apos criar, configure o TTL nesta tabela (veja aba "Configurar TTL")
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Tabela Sessions */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100">
                      <Shield className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">5. Tabela: petrobras_transfer_sessions</h3>
                      <p className="text-sm text-slate-600">Sessoes de usuarios (expira automaticamente!)</p>
                    </div>
                    <Badge className="bg-red-100 text-red-700">TTL Necessario</Badge>
                  </div>
                  
                  <div className="rounded-lg bg-slate-50 p-4">
                    <ul className="list-disc list-inside text-sm text-slate-600">
                      <li>Table name: <code className="bg-white px-2 py-1 rounded">petrobras_transfer_sessions</code></li>
                      <li>Partition key: <code className="bg-white px-2 py-1 rounded">PK</code> (String)</li>
                      <li>Sort key: <code className="bg-white px-2 py-1 rounded">SK</code> (String)</li>
                    </ul>
                  </div>
                </div>

                {/* Tabelas restantes - resumo */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">6-8. Demais Tabelas (mesmo padrao)</h3>
                  <p className="text-slate-600">Crie as tabelas restantes seguindo o mesmo padrao PK/SK:</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="font-medium text-sm">petrobras_transfer_audit_logs</p>
                      <p className="text-xs text-slate-500">Logs de auditoria</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="font-medium text-sm">petrobras_transfer_notifications</p>
                      <p className="text-xs text-slate-500">Notificacoes in-app</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="font-medium text-sm">petrobras_transfer_email_logs</p>
                      <p className="text-xs text-slate-500">Historico de emails</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: GSI */}
          <TabsContent value="gsi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-6 w-6" />
                  Criar Indices GSI (Global Secondary Index)
                </CardTitle>
                <CardDescription>GSIs permitem buscar dados por outros campos alem da PK</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-purple-200 bg-purple-50">
                  <AlertTriangle className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-800">
                    <strong>Por que GSI?</strong> Sem GSI, voce so consegue buscar pela Partition Key. 
                    Com GSI, pode buscar por email, status, data, etc. E como criar um "atalho" no indice do livro.
                  </AlertDescription>
                </Alert>

                {/* Como criar GSI */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Como criar um GSI no Console AWS</h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">1</span>
                      <p>Va em <strong>DynamoDB</strong> {"->"} <strong>Tables</strong> {"->"} Clique na tabela desejada</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">2</span>
                      <p>Clique na aba <strong>"Indexes"</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">3</span>
                      <p>Clique em <strong>"Create index"</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">4</span>
                      <div>
                        <p>Preencha:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Partition key: o campo que voce quer buscar (ex: <code>email</code>)</li>
                          <li>Sort key (opcional): campo secundario (ex: <code>created_at</code>)</li>
                          <li>Index name: nome descritivo (ex: <code>email-index</code>)</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">5</span>
                      <p>Clique <strong>"Create index"</strong> e aguarde (pode demorar alguns minutos)</p>
                    </div>
                  </div>
                </div>

                {/* GSIs por tabela */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">GSIs necessarios por tabela:</h3>
                  
                  {/* Users GSI */}
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <strong>petrobras_transfer_users</strong>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="rounded bg-slate-50 p-3">
                        <p className="font-medium text-sm">email-index</p>
                        <p className="text-xs text-slate-500">PK: email | SK: created_at</p>
                        <p className="text-xs text-slate-400">Buscar usuario por email</p>
                      </div>
                      <div className="rounded bg-slate-50 p-3">
                        <p className="font-medium text-sm">user_type-index</p>
                        <p className="text-xs text-slate-500">PK: user_type | SK: created_at</p>
                        <p className="text-xs text-slate-400">Listar todos supervisores</p>
                      </div>
                    </div>
                  </div>

                  {/* Shares GSI */}
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FolderOpen className="h-5 w-5 text-green-600" />
                      <strong>petrobras_transfer_shares</strong>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="rounded bg-slate-50 p-3">
                        <p className="font-medium text-sm">sender_id-index</p>
                        <p className="text-xs text-slate-500">PK: sender_id | SK: created_at</p>
                        <p className="text-xs text-slate-400">Buscar envios de um usuario</p>
                      </div>
                      <div className="rounded bg-slate-50 p-3">
                        <p className="font-medium text-sm">status-index</p>
                        <p className="text-xs text-slate-500">PK: status | SK: created_at</p>
                        <p className="text-xs text-slate-400">Listar pendentes, aprovados, etc</p>
                      </div>
                      <div className="rounded bg-slate-50 p-3">
                        <p className="font-medium text-sm">recipient_email-index</p>
                        <p className="text-xs text-slate-500">PK: recipient_email | SK: created_at</p>
                        <p className="text-xs text-slate-400">Buscar envios para um email externo</p>
                      </div>
                      <div className="rounded bg-slate-50 p-3">
                        <p className="font-medium text-sm">approver_id-index</p>
                        <p className="text-xs text-slate-500">PK: approver_id | SK: created_at</p>
                        <p className="text-xs text-slate-400">Pendentes de um supervisor</p>
                      </div>
                    </div>
                  </div>

                  {/* Files GSI */}
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileCode className="h-5 w-5 text-purple-600" />
                      <strong>petrobras_transfer_files</strong>
                    </div>
                    <div className="rounded bg-slate-50 p-3">
                      <p className="font-medium text-sm">share_id-index</p>
                      <p className="text-xs text-slate-500">PK: share_id</p>
                      <p className="text-xs text-slate-400">Listar arquivos de um compartilhamento</p>
                    </div>
                  </div>

                  {/* Audit Logs GSI */}
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="h-5 w-5 text-slate-600" />
                      <strong>petrobras_transfer_audit_logs</strong>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      <div className="rounded bg-slate-50 p-3">
                        <p className="font-medium text-sm">user_id-index</p>
                        <p className="text-xs text-slate-500">PK: user_id | SK: created_at</p>
                      </div>
                      <div className="rounded bg-slate-50 p-3">
                        <p className="font-medium text-sm">action-index</p>
                        <p className="text-xs text-slate-500">PK: action | SK: created_at</p>
                      </div>
                      <div className="rounded bg-slate-50 p-3">
                        <p className="font-medium text-sm">date-index</p>
                        <p className="text-xs text-slate-500">PK: date_partition | SK: created_at</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: TTL */}
          <TabsContent value="ttl" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-6 w-6" />
                  Configurar TTL (Time To Live)
                </CardTitle>
                <CardDescription>Deleta automaticamente items expirados - essencial para OTP e sessoes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>O que e TTL?</strong> E como uma "data de validade" automatica. 
                    Voce salva um codigo OTP com TTL de 10 minutos, e o DynamoDB deleta sozinho apos esse tempo!
                    Nao precisa de job, cron, ou codigo extra.
                  </AlertDescription>
                </Alert>

                {/* Tabelas que precisam de TTL */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Tabelas que PRECISAM de TTL:</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="h-5 w-5 text-orange-600" />
                        <strong className="text-orange-800">petrobras_transfer_otp_codes</strong>
                      </div>
                      <p className="text-sm text-orange-700">Codigos OTP expiram em 10 minutos</p>
                      <p className="text-xs text-orange-600 mt-1">Atributo TTL: <code>expires_at</code></p>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-red-600" />
                        <strong className="text-red-800">petrobras_transfer_sessions</strong>
                      </div>
                      <p className="text-sm text-red-700">Sessoes expiram em 24 horas</p>
                      <p className="text-xs text-red-600 mt-1">Atributo TTL: <code>expires_at</code></p>
                    </div>
                  </div>
                </div>

                {/* Como configurar TTL */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Como configurar TTL no Console AWS</h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">1</span>
                      <p>Acesse: <strong>DynamoDB</strong> {"->"} <strong>Tables</strong> {"->"} <strong>petrobras_transfer_otp_codes</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">2</span>
                      <p>Clique na aba <strong>"Additional settings"</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">3</span>
                      <p>Na secao <strong>"Time to Live (TTL)"</strong>, clique <strong>"Turn on"</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">4</span>
                      <div>
                        <p>Preencha:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>TTL attribute name: <code className="bg-slate-100 px-2 py-1 rounded">expires_at</code></li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">5</span>
                      <p>Clique <strong>"Turn on TTL"</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">6</span>
                      <p><strong>Repita</strong> para a tabela <code>petrobras_transfer_sessions</code></p>
                    </div>
                  </div>
                </div>

                {/* Como funciona */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Como usar no codigo Python:</h3>
                  <CodeBlock 
                    id="ttl-python"
                    code={`import time

# Criar codigo OTP que expira em 10 minutos
def create_otp_code(email: str, code: str):
    expires_at = int(time.time()) + (10 * 60)  # 10 minutos em segundos
    
    item = {
        "PK": f"otp#{email}",
        "SK": f"created#{datetime.now().isoformat()}",
        "email": email,
        "code": code,
        "expires_at": expires_at,  # TTL - DynamoDB deleta automaticamente!
        "attempts": 0,
    }
    
    table.put_item(Item=item)

# Criar sessao que expira em 24 horas
def create_session(user_id: str, session_id: str):
    expires_at = int(time.time()) + (24 * 60 * 60)  # 24 horas
    
    item = {
        "PK": f"session#{session_id}",
        "SK": f"user#{user_id}",
        "expires_at": expires_at,  # TTL
        # ... outros campos
    }
    
    table.put_item(Item=item)`}
                  />
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>IMPORTANTE:</strong> O valor de <code>expires_at</code> deve ser um <strong>Unix timestamp</strong> (numero de segundos desde 1970). Nao use string ISO 8601 para TTL!
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: CLI */}
          <TabsContent value="cli" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-6 w-6" />
                  Criar Tudo via AWS CLI (Mais Rapido)
                </CardTitle>
                <CardDescription>Copie e execute estes comandos no terminal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Metodo mais rapido!</strong> Execute todos os comandos abaixo de uma vez para criar todas as tabelas e indices.
                  </AlertDescription>
                </Alert>

                {/* Script completo */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Script completo para criar todas as tabelas:</h3>
                  <CodeBlock 
                    id="cli-all-tables"
                    code={`#!/bin/bash
# Criar todas as tabelas do sistema Petrobras File Transfer
# Execute: bash create_tables.sh

REGION="us-east-1"

echo "Criando tabelas DynamoDB..."

# 1. Users
aws dynamodb create-table \\
  --table-name petrobras_transfer_users \\
  --attribute-definitions \\
    AttributeName=PK,AttributeType=S \\
    AttributeName=SK,AttributeType=S \\
    AttributeName=email,AttributeType=S \\
    AttributeName=user_type,AttributeType=S \\
  --key-schema \\
    AttributeName=PK,KeyType=HASH \\
    AttributeName=SK,KeyType=RANGE \\
  --billing-mode PAY_PER_REQUEST \\
  --global-secondary-indexes \\
    "[{
      \\"IndexName\\": \\"email-index\\",
      \\"KeySchema\\": [{\\\"AttributeName\\\":\\\"email\\\",\\\"KeyType\\\":\\\"HASH\\\"}],
      \\"Projection\\": {\\\"ProjectionType\\\":\\\"ALL\\\"}
    },{
      \\"IndexName\\": \\"user_type-index\\",
      \\"KeySchema\\": [{\\\"AttributeName\\\":\\\"user_type\\\",\\\"KeyType\\\":\\\"HASH\\\"}],
      \\"Projection\\": {\\\"ProjectionType\\\":\\\"ALL\\\"}
    }]" \\
  --region $REGION

echo "Tabela users criada!"

# 2. Shares
aws dynamodb create-table \\
  --table-name petrobras_transfer_shares \\
  --attribute-definitions \\
    AttributeName=PK,AttributeType=S \\
    AttributeName=SK,AttributeType=S \\
    AttributeName=sender_id,AttributeType=S \\
    AttributeName=status,AttributeType=S \\
    AttributeName=recipient_email,AttributeType=S \\
    AttributeName=approver_id,AttributeType=S \\
  --key-schema \\
    AttributeName=PK,KeyType=HASH \\
    AttributeName=SK,KeyType=RANGE \\
  --billing-mode PAY_PER_REQUEST \\
  --global-secondary-indexes \\
    "[{
      \\"IndexName\\": \\"sender_id-index\\",
      \\"KeySchema\\": [{\\\"AttributeName\\\":\\\"sender_id\\\",\\\"KeyType\\\":\\\"HASH\\\"}],
      \\"Projection\\": {\\\"ProjectionType\\\":\\\"ALL\\\"}
    },{
      \\"IndexName\\": \\"status-index\\",
      \\"KeySchema\\": [{\\\"AttributeName\\\":\\\"status\\\",\\\"KeyType\\\":\\\"HASH\\\"}],
      \\"Projection\\": {\\\"ProjectionType\\\":\\\"ALL\\\"}
    },{
      \\"IndexName\\": \\"recipient_email-index\\",
      \\"KeySchema\\": [{\\\"AttributeName\\\":\\\"recipient_email\\\",\\\"KeyType\\\":\\\"HASH\\\"}],
      \\"Projection\\": {\\\"ProjectionType\\\":\\\"ALL\\\"}
    },{
      \\"IndexName\\": \\"approver_id-index\\",
      \\"KeySchema\\": [{\\\"AttributeName\\\":\\\"approver_id\\\",\\\"KeyType\\\":\\\"HASH\\\"}],
      \\"Projection\\": {\\\"ProjectionType\\\":\\\"ALL\\\"}
    }]" \\
  --region $REGION

echo "Tabela shares criada!"

# 3. Files
aws dynamodb create-table \\
  --table-name petrobras_transfer_files \\
  --attribute-definitions \\
    AttributeName=PK,AttributeType=S \\
    AttributeName=SK,AttributeType=S \\
    AttributeName=share_id,AttributeType=S \\
  --key-schema \\
    AttributeName=PK,KeyType=HASH \\
    AttributeName=SK,KeyType=RANGE \\
  --billing-mode PAY_PER_REQUEST \\
  --global-secondary-indexes \\
    "[{
      \\"IndexName\\": \\"share_id-index\\",
      \\"KeySchema\\": [{\\\"AttributeName\\\":\\\"share_id\\\",\\\"KeyType\\\":\\\"HASH\\\"}],
      \\"Projection\\": {\\\"ProjectionType\\\":\\\"ALL\\\"}
    }]" \\
  --region $REGION

echo "Tabela files criada!"

# 4. OTP Codes (com TTL)
aws dynamodb create-table \\
  --table-name petrobras_transfer_otp_codes \\
  --attribute-definitions \\
    AttributeName=PK,AttributeType=S \\
    AttributeName=SK,AttributeType=S \\
  --key-schema \\
    AttributeName=PK,KeyType=HASH \\
    AttributeName=SK,KeyType=RANGE \\
  --billing-mode PAY_PER_REQUEST \\
  --region $REGION

# Aguardar tabela ficar ativa
aws dynamodb wait table-exists --table-name petrobras_transfer_otp_codes --region $REGION

# Habilitar TTL
aws dynamodb update-time-to-live \\
  --table-name petrobras_transfer_otp_codes \\
  --time-to-live-specification "Enabled=true, AttributeName=expires_at" \\
  --region $REGION

echo "Tabela otp_codes criada com TTL!"

# 5. Sessions (com TTL)
aws dynamodb create-table \\
  --table-name petrobras_transfer_sessions \\
  --attribute-definitions \\
    AttributeName=PK,AttributeType=S \\
    AttributeName=SK,AttributeType=S \\
  --key-schema \\
    AttributeName=PK,KeyType=HASH \\
    AttributeName=SK,KeyType=RANGE \\
  --billing-mode PAY_PER_REQUEST \\
  --region $REGION

aws dynamodb wait table-exists --table-name petrobras_transfer_sessions --region $REGION

aws dynamodb update-time-to-live \\
  --table-name petrobras_transfer_sessions \\
  --time-to-live-specification "Enabled=true, AttributeName=expires_at" \\
  --region $REGION

echo "Tabela sessions criada com TTL!"

# 6-8. Demais tabelas
for TABLE in audit_logs notifications email_logs; do
  aws dynamodb create-table \\
    --table-name petrobras_transfer_$TABLE \\
    --attribute-definitions \\
      AttributeName=PK,AttributeType=S \\
      AttributeName=SK,AttributeType=S \\
    --key-schema \\
      AttributeName=PK,KeyType=HASH \\
      AttributeName=SK,KeyType=RANGE \\
    --billing-mode PAY_PER_REQUEST \\
    --region $REGION
  echo "Tabela $TABLE criada!"
done

echo ""
echo "========================================="
echo "Todas as tabelas foram criadas!"
echo "========================================="
aws dynamodb list-tables --region $REGION`}
                  />
                </div>

                {/* Verificar */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Verificar se criou corretamente:</h3>
                  <CodeBlock 
                    id="cli-verify"
                    code={`# Listar todas as tabelas
aws dynamodb list-tables --region us-east-1

# Ver detalhes de uma tabela
aws dynamodb describe-table --table-name petrobras_transfer_shares --region us-east-1

# Ver status do TTL
aws dynamodb describe-time-to-live --table-name petrobras_transfer_otp_codes --region us-east-1`}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: Custos */}
          <TabsContent value="custos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  Estimativa de Custos DynamoDB
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Boa noticia!</strong> Usando modo On-Demand, voce so paga pelo que usa. 
                    Para a maioria dos sistemas, DynamoDB custa menos de $20/mes.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Modelo de Precos (On-Demand):</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Eye className="h-5 w-5 text-blue-600" />
                        Leituras
                      </h4>
                      <p className="text-2xl font-bold text-blue-600">$0.25</p>
                      <p className="text-sm text-slate-600">por 1 milhao de leituras</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileCode className="h-5 w-5 text-green-600" />
                        Escritas
                      </h4>
                      <p className="text-2xl font-bold text-green-600">$1.25</p>
                      <p className="text-sm text-slate-600">por 1 milhao de escritas</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Database className="h-5 w-5 text-purple-600" />
                        Armazenamento
                      </h4>
                      <p className="text-2xl font-bold text-purple-600">$0.25</p>
                      <p className="text-sm text-slate-600">por GB por mes</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Search className="h-5 w-5 text-orange-600" />
                        GSIs
                      </h4>
                      <p className="text-2xl font-bold text-orange-600">Mesmo preco</p>
                      <p className="text-sm text-slate-600">Leituras e escritas nos indices</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Estimativa para nosso sistema:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span>100 usuarios ativos/dia</span>
                      <span className="text-slate-500">~1.000 leituras/dia</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>50 compartilhamentos/dia</span>
                      <span className="text-slate-500">~500 escritas/dia</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Armazenamento (~1GB dados)</span>
                      <span className="text-slate-500">~$0.25/mes</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>GSIs (15 indices)</span>
                      <span className="text-slate-500">Incluido nas operacoes</span>
                    </div>
                    <div className="flex justify-between py-2 font-semibold text-lg">
                      <span>TOTAL ESTIMADO</span>
                      <span className="text-green-600">~$5-15/mes</span>
                    </div>
                  </div>
                </div>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Dica de economia:</strong> O Free Tier da AWS inclui 25 GB de armazenamento e 25 unidades de capacidade gratuitas por mes. 
                    Para muitos projetos pequenos, isso significa DynamoDB GRATIS!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
