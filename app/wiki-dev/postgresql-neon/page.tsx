"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Home,
  Database,
  Table,
  Key,
  CheckCircle2,
  Shield,
  Layers,
  Users,
  FolderOpen,
  Mail,
  Bell,
  Activity,
  FileCode,
  Clock,
  Link2,
  Copy,
  Check,
  Server,
} from "lucide-react"
import Link from "next/link"

const tables = [
  {
    name: "user",
    icon: Users,
    color: "blue",
    category: "core",
    description: "Usuarios do sistema: internos, supervisores e externos",
    columns: [
      { name: "id", type: "integer", pk: true, description: "ID auto-incremental" },
      { name: "name", type: "varchar", description: "Nome completo" },
      { name: "email", type: "varchar", description: "Email corporativo (unico)" },
      { name: "type", type: "enum", description: "interno | supervisor | externo" },
      { name: "department", type: "varchar", description: "Departamento/area" },
      { name: "job_title", type: "varchar", description: "Cargo" },
      { name: "phone", type: "varchar", description: "Telefone" },
      { name: "employee_id", type: "varchar", description: "Matricula Petrobras" },
      { name: "photo_url", type: "varchar", description: "URL da foto de perfil" },
      { name: "manager_id", type: "integer", fk: "user.id", description: "FK gestor direto" },
      { name: "status", type: "boolean", description: "Ativo/inativo" },
      { name: "last_login", type: "timestamptz", description: "Ultimo acesso" },
      { name: "created_at", type: "timestamptz", description: "Data de criacao" },
    ],
    relations: ["credential_local (1:1)", "share (1:N como created_by_id)", "notification (1:N)", "audit (1:N)"],
  },
  {
    name: "credential_local",
    icon: Key,
    color: "red",
    category: "auth",
    description: "Credenciais locais (senha hash bcrypt) para login sem Entra ID",
    columns: [
      { name: "id", type: "integer", pk: true, description: "ID auto-incremental" },
      { name: "user_id", type: "integer", fk: "user.id", description: "FK usuario" },
      { name: "password_hash", type: "varchar", description: "Hash bcrypt da senha" },
      { name: "salt", type: "varchar", description: "Salt para o hash" },
      { name: "failed_attempts", type: "integer", description: "Tentativas falhas de login" },
      { name: "blocked_until", type: "timestamptz", description: "Bloqueio ate (anti brute-force)" },
      { name: "created_at", type: "timestamptz", description: "Data de criacao" },
      { name: "updated_at", type: "timestamptz", description: "Ultima alteracao" },
    ],
    relations: ["user (N:1)"],
  },
  {
    name: "session_token",
    icon: Shield,
    color: "purple",
    category: "auth",
    description: "Tokens de sessao (refresh e reset) persistidos com hash SHA-256",
    columns: [
      { name: "id", type: "integer", pk: true, description: "ID auto-incremental" },
      { name: "user_id", type: "integer", fk: "user.id", description: "FK usuario" },
      { name: "token_hash", type: "varchar", description: "SHA-256 do token" },
      { name: "token_type", type: "varchar", description: "refresh | reset" },
      { name: "email", type: "varchar", description: "Email associado (para reset)" },
      { name: "expires_at", type: "timestamptz", description: "Expiracao do token" },
      { name: "used", type: "boolean", description: "Token ja consumido" },
      { name: "revoked", type: "boolean", description: "Token revogado (logout)" },
      { name: "ip_address", type: "varchar", description: "IP de origem" },
      { name: "user_agent", type: "varchar", description: "User-Agent do browser" },
      { name: "created_at", type: "timestamptz", description: "Data de criacao" },
    ],
    relations: ["user (N:1)"],
  },
  {
    name: "token_access",
    icon: Key,
    color: "orange",
    category: "auth",
    description: "Tokens OTP e de acesso para usuarios externos (download)",
    columns: [
      { name: "id", type: "integer", pk: true, description: "ID auto-incremental" },
      { name: "user_id", type: "integer", fk: "user.id", description: "FK usuario externo" },
      { name: "share_id", type: "integer", fk: "share.id", description: "FK share associado" },
      { name: "token", type: "varchar", description: "Codigo OTP em texto" },
      { name: "token_hash", type: "varchar", description: "Hash do token" },
      { name: "type", type: "enum", description: "otp | access_token" },
      { name: "attempts", type: "integer", description: "Tentativas de uso" },
      { name: "used", type: "boolean", description: "Token ja consumido" },
      { name: "blocked_until", type: "timestamptz", description: "Bloqueio anti brute-force" },
      { name: "expires_at", type: "timestamptz", description: "Expiracao" },
      { name: "created_at", type: "timestamptz", description: "Data de criacao" },
    ],
    relations: ["user (N:1)", "share (N:1)"],
  },
  {
    name: "shared_area",
    icon: Layers,
    color: "teal",
    category: "core",
    description: "Areas/departamentos para organizacao de arquivos e supervisores",
    columns: [
      { name: "id", type: "integer", pk: true, description: "ID auto-incremental" },
      { name: "name", type: "varchar", description: "Nome da area" },
      { name: "description", type: "text", description: "Descricao da area" },
      { name: "prefix_s3", type: "varchar", description: "Prefixo no S3 para arquivos" },
      { name: "applicant_id", type: "integer", fk: "user.id", description: "FK solicitante" },
      { name: "status", type: "boolean", description: "Area ativa/encerrada" },
      { name: "expires_at", type: "timestamptz", description: "Data de expiracao" },
      { name: "created_at", type: "timestamptz", description: "Data de criacao" },
    ],
    relations: ["areasupervisor (1:N)", "restricted_file (1:N)", "share (1:N)"],
  },
  {
    name: "areasupervisor",
    icon: Users,
    color: "indigo",
    category: "core",
    description: "Vinculo N:N entre supervisores e areas que eles gerenciam",
    columns: [
      { name: "id", type: "integer", pk: true, description: "ID auto-incremental" },
      { name: "area_id", type: "integer", fk: "shared_area.id", description: "FK area" },
      { name: "supervisor_id", type: "integer", fk: "user.id", description: "FK supervisor" },
    ],
    relations: ["shared_area (N:1)", "user (N:1)"],
  },
  {
    name: "share",
    icon: FolderOpen,
    color: "green",
    category: "core",
    description: "Compartilhamentos - registro principal de envio de arquivos para externos",
    columns: [
      { name: "id", type: "integer", pk: true, description: "ID auto-incremental" },
      { name: "name", type: "varchar", description: "Nome do compartilhamento" },
      { name: "description", type: "varchar", description: "Descricao" },
      { name: "external_email", type: "varchar", description: "Email do destinatario externo" },
      { name: "status", type: "enum", description: "pending | approved | rejected | expired | cancelled" },
      { name: "consumption_policy", type: "enum", description: "single_use | multi_use" },
      { name: "expiration_hours", type: "integer", description: "Horas ate expirar" },
      { name: "expires_at", type: "timestamptz", description: "Data/hora de expiracao" },
      { name: "area_id", type: "integer", fk: "shared_area.id", description: "FK area" },
      { name: "created_by_id", type: "integer", fk: "user.id", description: "FK criador (interno)" },
      { name: "approver_id", type: "integer", fk: "user.id", description: "FK aprovador (supervisor)" },
      { name: "approved_at", type: "timestamptz", description: "Data de aprovacao" },
      { name: "rejected_at", type: "timestamptz", description: "Data de rejeicao" },
      { name: "rejection_reason", type: "varchar", description: "Motivo da rejeicao" },
      { name: "approval_comments", type: "varchar", description: "Comentarios do aprovador" },
      { name: "created_at", type: "timestamptz", description: "Data de criacao" },
    ],
    relations: ["share_file (1:N)", "token_access (1:N)", "user (N:1 created_by)", "user (N:1 approver)", "shared_area (N:1)"],
  },
  {
    name: "share_file",
    icon: Link2,
    color: "cyan",
    category: "core",
    description: "Tabela de juncao entre share e restricted_file (N:N)",
    columns: [
      { name: "id", type: "integer", pk: true, description: "ID auto-incremental" },
      { name: "share_id", type: "integer", fk: "share.id", description: "FK share" },
      { name: "file_id", type: "integer", fk: "restricted_file.id", description: "FK arquivo" },
      { name: "downloaded", type: "boolean", description: "Arquivo ja baixado" },
      { name: "downloaded_at", type: "timestamptz", description: "Data do download" },
    ],
    relations: ["share (N:1)", "restricted_file (N:1)"],
  },
  {
    name: "restricted_file",
    icon: FileCode,
    color: "amber",
    category: "core",
    description: "Metadados dos arquivos enviados ao S3",
    columns: [
      { name: "id", type: "integer", pk: true, description: "ID auto-incremental" },
      { name: "name", type: "varchar", description: "Nome original do arquivo" },
      { name: "key_s3", type: "varchar", description: "Chave no bucket S3" },
      { name: "mime_type", type: "varchar", description: "Tipo MIME" },
      { name: "size_bytes", type: "integer", description: "Tamanho em bytes" },
      { name: "checksum", type: "varchar", description: "Hash MD5 para integridade" },
      { name: "upload_id", type: "integer", fk: "user.id", description: "FK quem fez upload" },
      { name: "area_id", type: "integer", fk: "shared_area.id", description: "FK area" },
      { name: "status", type: "boolean", description: "Arquivo ativo" },
      { name: "expires_at", type: "timestamptz", description: "Expiracao do arquivo" },
      { name: "created_at", type: "timestamptz", description: "Data do upload" },
    ],
    relations: ["share_file (1:N)", "user (N:1)", "shared_area (N:1)"],
  },
  {
    name: "audit",
    icon: Activity,
    color: "slate",
    category: "logs",
    description: "Log de auditoria - registra TODAS as acoes do sistema",
    columns: [
      { name: "id", type: "integer", pk: true, description: "ID auto-incremental" },
      { name: "action", type: "varchar", description: "Acao realizada (LOGIN, UPLOAD_ARQUIVOS, etc)" },
      { name: "user_id", type: "integer", fk: "user.id", description: "FK usuario que executou" },
      { name: "share_id", type: "integer", fk: "share.id", description: "FK share relacionado" },
      { name: "file_id", type: "integer", fk: "restricted_file.id", description: "FK arquivo relacionado" },
      { name: "detail", type: "text", description: "Detalhes adicionais" },
      { name: "level", type: "enum", description: "info | warning | error | critical" },
      { name: "ip_address", type: "varchar", description: "IP do cliente" },
      { name: "user_agent", type: "varchar", description: "User-Agent do browser" },
      { name: "created_at", type: "timestamptz", description: "Timestamp da acao" },
    ],
    relations: ["user (N:1)", "share (N:1)", "restricted_file (N:1)"],
  },
  {
    name: "email_log",
    icon: Mail,
    color: "rose",
    category: "logs",
    description: "Historico completo de emails enviados (SES e Microsoft Graph)",
    columns: [
      { name: "id", type: "integer", pk: true, description: "ID auto-incremental" },
      { name: "message_id", type: "varchar", description: "ID da mensagem (SES/Graph)" },
      { name: "email_type", type: "enum", description: "share_notification | otp | approval | rejection | reminder" },
      { name: "from_email", type: "varchar", description: "Remetente" },
      { name: "to_email", type: "varchar", description: "Destinatario" },
      { name: "subject", type: "varchar", description: "Assunto" },
      { name: "body_preview", type: "varchar", description: "Preview do corpo" },
      { name: "status", type: "enum", description: "pending | sent | delivered | opened | bounced | failed" },
      { name: "error_code", type: "varchar", description: "Codigo de erro" },
      { name: "error_message", type: "varchar", description: "Mensagem de erro" },
      { name: "user_id", type: "integer", fk: "user.id", description: "FK remetente" },
      { name: "share_id", type: "integer", fk: "share.id", description: "FK share" },
      { name: "metadata", type: "text", description: "JSON com dados extras" },
      { name: "sent_at", type: "timestamptz", description: "Data de envio" },
      { name: "delivered_at", type: "timestamptz", description: "Data de entrega" },
      { name: "opened_at", type: "timestamptz", description: "Data de abertura" },
      { name: "clicked_at", type: "timestamptz", description: "Data de clique" },
      { name: "bounced_at", type: "timestamptz", description: "Data de bounce" },
      { name: "created_at", type: "timestamptz", description: "Criacao do registro" },
      { name: "updated_at", type: "timestamptz", description: "Ultima atualizacao" },
    ],
    relations: ["user (N:1)", "share (N:1)"],
  },
  {
    name: "notification",
    icon: Bell,
    color: "yellow",
    category: "logs",
    description: "Notificacoes in-app exibidas no painel do usuario",
    columns: [
      { name: "id", type: "integer", pk: true, description: "ID auto-incremental" },
      { name: "user_id", type: "integer", fk: "user.id", description: "FK destinatario" },
      { name: "title", type: "varchar", description: "Titulo da notificacao" },
      { name: "message", type: "varchar", description: "Corpo da mensagem" },
      { name: "type", type: "enum", description: "info | success | warning | error" },
      { name: "priority", type: "enum", description: "low | medium | high | urgent" },
      { name: "read", type: "boolean", description: "Lida ou nao" },
      { name: "action_url", type: "varchar", description: "URL de acao" },
      { name: "action_label", type: "varchar", description: "Texto do botao de acao" },
      { name: "metadata", type: "text", description: "JSON com dados extras" },
      { name: "created_at", type: "timestamptz", description: "Data de criacao" },
    ],
    relations: ["user (N:1)"],
  },
]

const roadmapTables = [
  {
    name: "roadmap_fases",
    description: "Fases do projeto (planejamento, desenvolvimento, etc)",
    columns: "id, nome, descricao, status, progresso, ordem, cor, risco, responsavel, periodo, data_inicio, data_fim",
  },
  {
    name: "roadmap_entregas",
    description: "Entregas dentro de cada fase",
    columns: "id, fase_id, nome, tipo, status, ordem, data_prevista, data_conclusao, notas, bloqueios",
  },
  {
    name: "roadmap_marcos",
    description: "Marcos/milestones do projeto",
    columns: "id, nome, data, status, ordem",
  },
  {
    name: "roadmap_burndown",
    description: "Dados do grafico burndown",
    columns: "id, semana, planejado, real, entregas, ordem",
  },
  {
    name: "roadmap_config",
    description: "Configuracoes gerais do roadmap",
    columns: "id, chave, valor",
  },
  {
    name: "roadmap_fase_dependencias",
    description: "Dependencias entre fases",
    columns: "id, fase_id, depende_de_fase_id",
  },
  {
    name: "roadmap_entrega_dependencias",
    description: "Dependencias entre entregas",
    columns: "id, entrega_id, depende_de_fase_id",
  },
]

const colorMap: Record<string, { bg: string; text: string; border: string; light: string }> = {
  blue: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", light: "bg-blue-50" },
  red: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", light: "bg-red-50" },
  purple: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", light: "bg-purple-50" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", light: "bg-orange-50" },
  teal: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", light: "bg-teal-50" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", light: "bg-indigo-50" },
  green: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", light: "bg-green-50" },
  cyan: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200", light: "bg-cyan-50" },
  amber: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", light: "bg-amber-50" },
  slate: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", light: "bg-slate-50" },
  rose: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", light: "bg-rose-50" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", light: "bg-yellow-50" },
}

export default function PostgreSQLNeonPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = selectedCategory === "all" ? tables : tables.filter((t) => t.category === selectedCategory)

  const totalColumns = tables.reduce((acc, t) => acc + t.columns.length, 0)

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

        <div className="mb-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-balance text-slate-900">PostgreSQL (Neon) - Schema Completo</h1>
          <p className="text-lg text-slate-600 text-pretty">
            Documentacao de todas as tabelas do banco de dados Neon PostgreSQL utilizado pelo sistema
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-blue-100 text-blue-700">PostgreSQL 16</Badge>
            <Badge className="bg-cyan-100 text-cyan-700">Neon Serverless</Badge>
            <Badge className="bg-green-100 text-green-700">19 Tabelas</Badge>
            <Badge className="bg-purple-100 text-purple-700">{totalColumns} Colunas</Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview">Visao Geral</TabsTrigger>
            <TabsTrigger value="tables">Tabelas Detalhadas</TabsTrigger>
            <TabsTrigger value="roadmap">Tabelas Roadmap</TabsTrigger>
            <TabsTrigger value="connection">Conexao</TabsTrigger>
          </TabsList>

          {/* TAB 1: Visao Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Table className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">19</p>
                    <p className="text-sm text-slate-600">Tabelas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <Layers className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{totalColumns}</p>
                    <p className="text-sm text-slate-600">Colunas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <Key className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">12</p>
                    <p className="text-sm text-slate-600">Tabelas Aplicacao</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">7</p>
                    <p className="text-sm text-slate-600">Tabelas Roadmap</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Organizacao por Categoria</CardTitle>
                <CardDescription>12 tabelas da aplicacao + 7 tabelas do roadmap</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Core (Negocio)</h3>
                  <div className="grid gap-3 md:grid-cols-3">
                    {tables
                      .filter((t) => t.category === "core")
                      .map((t) => {
                        const c = colorMap[t.color]
                        const Icon = t.icon
                        return (
                          <div key={t.name} className={`rounded-lg border ${c.border} p-3`}>
                            <div className="mb-2 flex items-center gap-2">
                              <div className={`rounded p-1.5 ${c.bg}`}>
                                <Icon className={`h-4 w-4 ${c.text}`} />
                              </div>
                              <span className="truncate font-mono text-sm font-medium">{t.name}</span>
                            </div>
                            <p className="text-xs text-slate-600">{t.description}</p>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {t.columns.length} colunas
                            </Badge>
                          </div>
                        )
                      })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Autenticacao e Seguranca</h3>
                  <div className="grid gap-3 md:grid-cols-3">
                    {tables
                      .filter((t) => t.category === "auth")
                      .map((t) => {
                        const c = colorMap[t.color]
                        const Icon = t.icon
                        return (
                          <div key={t.name} className={`rounded-lg border ${c.border} p-3`}>
                            <div className="mb-2 flex items-center gap-2">
                              <div className={`rounded p-1.5 ${c.bg}`}>
                                <Icon className={`h-4 w-4 ${c.text}`} />
                              </div>
                              <span className="truncate font-mono text-sm font-medium">{t.name}</span>
                            </div>
                            <p className="text-xs text-slate-600">{t.description}</p>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {t.columns.length} colunas
                            </Badge>
                          </div>
                        )
                      })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Logs e Auditoria</h3>
                  <div className="grid gap-3 md:grid-cols-3">
                    {tables
                      .filter((t) => t.category === "logs")
                      .map((t) => {
                        const c = colorMap[t.color]
                        const Icon = t.icon
                        return (
                          <div key={t.name} className={`rounded-lg border ${c.border} p-3`}>
                            <div className="mb-2 flex items-center gap-2">
                              <div className={`rounded p-1.5 ${c.bg}`}>
                                <Icon className={`h-4 w-4 ${c.text}`} />
                              </div>
                              <span className="truncate font-mono text-sm font-medium">{t.name}</span>
                            </div>
                            <p className="text-xs text-slate-600">{t.description}</p>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {t.columns.length} colunas
                            </Badge>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Tabelas Detalhadas */}
          <TabsContent value="tables" className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {["all", "core", "auth", "logs"].map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === "all" ? "Todas" : cat === "core" ? "Core" : cat === "auth" ? "Auth" : "Logs"}
                </Button>
              ))}
            </div>

            {filtered.map((table) => {
              const c = colorMap[table.color]
              const Icon = table.icon
              return (
                <Card key={table.name}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${c.bg}`}>
                        <Icon className={`h-5 w-5 ${c.text}`} />
                      </div>
                      <div>
                        <CardTitle className="font-mono text-lg">{table.name}</CardTitle>
                        <CardDescription>{table.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-slate-50">
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Coluna</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Tipo</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Chave</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Descricao</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map((col) => (
                            <tr key={col.name} className="border-b last:border-0">
                              <td className="px-3 py-2 font-mono text-sm font-medium text-slate-900">{col.name}</td>
                              <td className="px-3 py-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {col.type}
                                </Badge>
                              </td>
                              <td className="px-3 py-2">
                                {col.pk && <Badge className="bg-blue-100 text-blue-700 text-xs">PK</Badge>}
                                {col.fk && (
                                  <Badge className="bg-orange-100 text-orange-700 text-xs">FK {col.fk}</Badge>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{col.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {table.relations.length > 0 && (
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Relacionamentos</p>
                        <div className="flex flex-wrap gap-2">
                          {table.relations.map((rel) => (
                            <Badge key={rel} variant="secondary" className="text-xs">
                              {rel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          {/* TAB 3: Tabelas Roadmap */}
          <TabsContent value="roadmap" className="space-y-6">
            <Alert className="border-indigo-200 bg-indigo-50">
              <Server className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="text-indigo-800">
                As tabelas do roadmap sao acessadas diretamente pelo frontend Next.js via <code className="rounded bg-indigo-100 px-1.5 py-0.5">@neondatabase/serverless</code>, sem
                passar pelo backend Python. Sao usadas exclusivamente na pagina <strong>/wiki-dev/roadmap</strong>.
              </AlertDescription>
            </Alert>

            {roadmapTables.map((table) => (
              <Card key={table.name}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-100 p-2">
                      <Table className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="font-mono text-lg">{table.name}</CardTitle>
                      <CardDescription>{table.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Colunas</p>
                    <p className="font-mono text-sm text-slate-700">{table.columns}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* TAB 4: Conexao */}
          <TabsContent value="connection" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuracao de Conexao</CardTitle>
                <CardDescription>Como o sistema se conecta ao Neon PostgreSQL</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Backend Python (FastAPI + SQLModel)</h3>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-8 w-8 p-0"
                      onClick={() =>
                        copyToClipboard(
                          `# backend/app/db/session.py\nfrom sqlmodel import create_engine, Session\nfrom app.core.config import settings\n\nengine = create_engine(settings.DATABASE_URL, echo=False)\n\ndef get_session():\n    with Session(engine) as session:\n        yield session`,
                          "python-conn",
                        )
                      }
                    >
                      {copiedId === "python-conn" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
                      <code>{`# backend/app/db/session.py
from sqlmodel import create_engine, Session
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=False)

def get_session():
    with Session(engine) as session:
        yield session`}</code>
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Frontend Next.js (Roadmap apenas)</h3>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-8 w-8 p-0"
                      onClick={() =>
                        copyToClipboard(
                          `// lib/db/neon.ts\nimport { neon } from "@neondatabase/serverless"\n\nexport function getSQL() {\n  return neon(process.env.DATABASE_URL!)\n}`,
                          "next-conn",
                        )
                      }
                    >
                      {copiedId === "next-conn" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
                      <code>{`// lib/db/neon.ts
import { neon } from "@neondatabase/serverless"

export function getSQL() {
  return neon(process.env.DATABASE_URL!)
}`}</code>
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Variavel de Ambiente</h3>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-900">DATABASE_URL</span>
                    </div>
                    <p className="font-mono text-sm text-green-700">
                      {"postgresql://<user>:<password>@<host>.neon.tech/<dbname>?sslmode=require"}
                    </p>
                    <p className="mt-2 text-xs text-green-600">Configurada automaticamente pela integracao Neon no Vercel.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
