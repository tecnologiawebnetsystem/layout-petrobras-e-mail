"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  ChevronRight,
  Copy,
  Check,
  Database,
  Table,
  Key,
  Search,
  Clock,
  Shield,
  Terminal,
  MousePointer,
  CheckCircle,
  AlertTriangle,
  Layers,
  FileText,
  Users,
  FolderOpen,
  Mail,
  Bell,
  Activity,
} from "lucide-react"

export default function BancoDadosPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("tabelas")

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const tables = [
    {
      name: "petrobras_transfer_users",
      icon: Users,
      description: "Usuarios internos e supervisores autenticados via Entra ID",
      partitionKey: "PK (user_id)",
      sortKey: "SK (email)",
      gsi: ["GSI1: email-index", "GSI2: user_type-index"],
      fields: [
        { name: "PK", type: "String", description: "user#{user_id}", example: "user#abc123" },
        { name: "SK", type: "String", description: "email#{email}", example: "email#joao@petrobras.com.br" },
        { name: "user_id", type: "String", description: "UUID unico do usuario", example: "abc123-def456" },
        { name: "email", type: "String", description: "Email corporativo", example: "joao.silva@petrobras.com.br" },
        { name: "name", type: "String", description: "Nome completo", example: "Joao Silva" },
        { name: "user_type", type: "String", description: "internal | supervisor", example: "internal" },
        { name: "job_title", type: "String", description: "Cargo do Entra ID", example: "Analista de Sistemas" },
        { name: "department", type: "String", description: "Departamento", example: "TI - Desenvolvimento" },
        { name: "employee_id", type: "String", description: "Matricula", example: "12345678" },
        { name: "manager_id", type: "String", description: "ID do supervisor", example: "xyz789" },
        { name: "manager_email", type: "String", description: "Email do supervisor", example: "gerente@petrobras.com.br" },
        { name: "manager_name", type: "String", description: "Nome do supervisor", example: "Maria Santos" },
        { name: "photo_url", type: "String", description: "URL da foto do perfil", example: "https://..." },
        { name: "created_at", type: "String", description: "ISO 8601", example: "2026-01-21T10:30:00Z" },
        { name: "updated_at", type: "String", description: "ISO 8601", example: "2026-01-21T14:00:00Z" },
        { name: "last_login_at", type: "String", description: "Ultimo login", example: "2026-01-21T08:00:00Z" },
      ],
    },
    {
      name: "petrobras_transfer_shares",
      icon: FolderOpen,
      description: "Compartilhamentos de arquivos (pending, approved, rejected, expired)",
      partitionKey: "PK (share_id)",
      sortKey: "SK (created_at)",
      gsi: ["GSI1: sender_id-index", "GSI2: status-index", "GSI3: recipient_email-index", "GSI4: approver_id-index"],
      fields: [
        { name: "PK", type: "String", description: "share#{share_id}", example: "share#abc123" },
        { name: "SK", type: "String", description: "created#{timestamp}", example: "created#2026-01-21T10:30:00Z" },
        { name: "share_id", type: "String", description: "UUID do compartilhamento", example: "share-abc123" },
        { name: "name", type: "String", description: "Nome/titulo do envio", example: "Relatorio Financeiro Q4" },
        { name: "description", type: "String", description: "Descricao detalhada", example: "Documentos do fechamento..." },
        { name: "status", type: "String", description: "pending | approved | rejected | expired | cancelled", example: "pending" },
        { name: "sender_id", type: "String", description: "ID do remetente", example: "user-abc123" },
        { name: "sender_name", type: "String", description: "Nome do remetente", example: "Joao Silva" },
        { name: "sender_email", type: "String", description: "Email do remetente", example: "joao@petrobras.com.br" },
        { name: "recipient_email", type: "String", description: "Email do destinatario externo", example: "cliente@empresa.com" },
        { name: "approver_id", type: "String", description: "ID do aprovador (supervisor)", example: "user-xyz789" },
        { name: "approver_name", type: "String", description: "Nome do aprovador", example: "Maria Santos" },
        { name: "approver_email", type: "String", description: "Email do aprovador", example: "maria@petrobras.com.br" },
        { name: "expiration_hours", type: "Number", description: "24, 48 ou 72 horas", example: "72" },
        { name: "expires_at", type: "String", description: "Data/hora de expiracao", example: "2026-01-24T10:30:00Z" },
        { name: "approved_at", type: "String", description: "Quando foi aprovado", example: "2026-01-21T12:00:00Z" },
        { name: "rejected_at", type: "String", description: "Quando foi rejeitado", example: "" },
        { name: "rejection_reason", type: "String", description: "Motivo da rejeicao", example: "Dados confidenciais" },
        { name: "sent_by_supervisor", type: "Boolean", description: "Se enviado por supervisor", example: "false" },
        { name: "terms_accepted_at", type: "String", description: "Aceite dos termos", example: "2026-01-21T15:00:00Z" },
        { name: "download_count", type: "Number", description: "Quantas vezes baixou", example: "3" },
        { name: "last_download_at", type: "String", description: "Ultimo download", example: "2026-01-22T09:00:00Z" },
        { name: "created_at", type: "String", description: "Criacao", example: "2026-01-21T10:30:00Z" },
        { name: "updated_at", type: "String", description: "Atualizacao", example: "2026-01-21T12:00:00Z" },
      ],
    },
    {
      name: "petrobras_transfer_files",
      icon: FileText,
      description: "Arquivos associados aos compartilhamentos (S3 metadata)",
      partitionKey: "PK (file_id)",
      sortKey: "SK (share_id)",
      gsi: ["GSI1: share_id-index"],
      fields: [
        { name: "PK", type: "String", description: "file#{file_id}", example: "file#abc123" },
        { name: "SK", type: "String", description: "share#{share_id}", example: "share#xyz789" },
        { name: "file_id", type: "String", description: "UUID do arquivo", example: "file-abc123" },
        { name: "share_id", type: "String", description: "ID do compartilhamento", example: "share-xyz789" },
        { name: "file_name", type: "String", description: "Nome original", example: "relatorio.pdf" },
        { name: "file_size", type: "Number", description: "Tamanho em bytes", example: "1048576" },
        { name: "file_size_formatted", type: "String", description: "Tamanho formatado", example: "1.00 MB" },
        { name: "file_type", type: "String", description: "Extensao", example: "PDF" },
        { name: "mime_type", type: "String", description: "MIME type", example: "application/pdf" },
        { name: "s3_key", type: "String", description: "Caminho no S3", example: "uploads/2026/01/abc123.pdf" },
        { name: "s3_bucket", type: "String", description: "Nome do bucket", example: "petrobras-file-transfer" },
        { name: "checksum_sha256", type: "String", description: "Hash do arquivo", example: "abc123..." },
        { name: "upload_status", type: "String", description: "pending | completed | failed", example: "completed" },
        { name: "created_at", type: "String", description: "Upload", example: "2026-01-21T10:30:00Z" },
      ],
    },
    {
      name: "petrobras_transfer_otp_codes",
      icon: Key,
      description: "Codigos OTP para autenticacao de usuarios externos",
      partitionKey: "PK (email)",
      sortKey: "SK (created_at)",
      gsi: [],
      ttl: "expires_at",
      fields: [
        { name: "PK", type: "String", description: "otp#{email}", example: "otp#cliente@empresa.com" },
        { name: "SK", type: "String", description: "created#{timestamp}", example: "created#2026-01-21T10:30:00Z" },
        { name: "email", type: "String", description: "Email do destinatario", example: "cliente@empresa.com" },
        { name: "code", type: "String", description: "Codigo de 6 digitos", example: "123456" },
        { name: "attempts", type: "Number", description: "Tentativas de uso", example: "0" },
        { name: "max_attempts", type: "Number", description: "Maximo permitido", example: "5" },
        { name: "is_used", type: "Boolean", description: "Se ja foi usado", example: "false" },
        { name: "created_at", type: "String", description: "Geracao", example: "2026-01-21T10:30:00Z" },
        { name: "expires_at", type: "Number", description: "TTL Unix timestamp", example: "1705836600" },
      ],
    },
    {
      name: "petrobras_transfer_sessions",
      icon: Shield,
      description: "Sessoes ativas de usuarios (internos e externos)",
      partitionKey: "PK (session_id)",
      sortKey: "SK (user_identifier)",
      gsi: ["GSI1: user_id-index", "GSI2: email-index"],
      ttl: "expires_at",
      fields: [
        { name: "PK", type: "String", description: "session#{session_id}", example: "session#abc123" },
        { name: "SK", type: "String", description: "user#{identifier}", example: "user#joao@petrobras.com.br" },
        { name: "session_id", type: "String", description: "UUID da sessao", example: "sess-abc123" },
        { name: "user_id", type: "String", description: "ID do usuario (se interno)", example: "user-xyz789" },
        { name: "email", type: "String", description: "Email do usuario", example: "cliente@empresa.com" },
        { name: "user_type", type: "String", description: "internal | supervisor | external", example: "external" },
        { name: "access_token", type: "String", description: "Token JWT (se interno)", example: "eyJ..." },
        { name: "ip_address", type: "String", description: "IP de origem", example: "192.168.1.100" },
        { name: "user_agent", type: "String", description: "Browser/dispositivo", example: "Mozilla/5.0..." },
        { name: "created_at", type: "String", description: "Inicio da sessao", example: "2026-01-21T10:30:00Z" },
        { name: "last_activity_at", type: "String", description: "Ultima atividade", example: "2026-01-21T11:00:00Z" },
        { name: "expires_at", type: "Number", description: "TTL Unix timestamp", example: "1705857600" },
      ],
    },
    {
      name: "petrobras_transfer_audit_logs",
      icon: Activity,
      description: "Logs de auditoria de todas as acoes do sistema",
      partitionKey: "PK (log_id)",
      sortKey: "SK (created_at)",
      gsi: ["GSI1: user_id-index", "GSI2: action-index", "GSI3: date-index"],
      fields: [
        { name: "PK", type: "String", description: "log#{log_id}", example: "log#abc123" },
        { name: "SK", type: "String", description: "created#{timestamp}", example: "created#2026-01-21T10:30:00Z" },
        { name: "log_id", type: "String", description: "UUID do log", example: "log-abc123" },
        { name: "action", type: "String", description: "login | logout | upload | approve | reject | download | etc", example: "upload" },
        { name: "level", type: "String", description: "info | success | warning | error", example: "success" },
        { name: "user_id", type: "String", description: "ID do usuario", example: "user-xyz789" },
        { name: "user_name", type: "String", description: "Nome do usuario", example: "Joao Silva" },
        { name: "user_email", type: "String", description: "Email do usuario", example: "joao@petrobras.com.br" },
        { name: "user_type", type: "String", description: "internal | supervisor | external", example: "internal" },
        { name: "resource_type", type: "String", description: "share | file | user", example: "share" },
        { name: "resource_id", type: "String", description: "ID do recurso afetado", example: "share-abc123" },
        { name: "description", type: "String", description: "Descricao da acao", example: "Compartilhamento criado com sucesso" },
        { name: "metadata", type: "Map", description: "Dados adicionais (JSON)", example: "{\"files\": 3}" },
        { name: "ip_address", type: "String", description: "IP de origem", example: "192.168.1.100" },
        { name: "user_agent", type: "String", description: "Browser", example: "Mozilla/5.0..." },
        { name: "date_partition", type: "String", description: "YYYY-MM-DD para GSI", example: "2026-01-21" },
        { name: "created_at", type: "String", description: "Timestamp", example: "2026-01-21T10:30:00Z" },
      ],
    },
    {
      name: "petrobras_transfer_notifications",
      icon: Bell,
      description: "Notificacoes do sistema para usuarios",
      partitionKey: "PK (notification_id)",
      sortKey: "SK (user_id)",
      gsi: ["GSI1: user_id-index"],
      fields: [
        { name: "PK", type: "String", description: "notif#{notification_id}", example: "notif#abc123" },
        { name: "SK", type: "String", description: "user#{user_id}", example: "user#xyz789" },
        { name: "notification_id", type: "String", description: "UUID", example: "notif-abc123" },
        { name: "user_id", type: "String", description: "Destinatario", example: "user-xyz789" },
        { name: "type", type: "String", description: "approval_needed | approved | rejected | downloaded", example: "approval_needed" },
        { name: "title", type: "String", description: "Titulo", example: "Nova aprovacao pendente" },
        { name: "message", type: "String", description: "Mensagem", example: "Joao Silva enviou arquivos..." },
        { name: "share_id", type: "String", description: "Compartilhamento relacionado", example: "share-abc123" },
        { name: "is_read", type: "Boolean", description: "Se foi lida", example: "false" },
        { name: "read_at", type: "String", description: "Quando foi lida", example: "" },
        { name: "created_at", type: "String", description: "Criacao", example: "2026-01-21T10:30:00Z" },
      ],
    },
    {
      name: "petrobras_transfer_email_logs",
      icon: Mail,
      description: "Historico de emails enviados pelo sistema",
      partitionKey: "PK (email_id)",
      sortKey: "SK (created_at)",
      gsi: ["GSI1: recipient-index", "GSI2: type-index"],
      fields: [
        { name: "PK", type: "String", description: "email#{email_id}", example: "email#abc123" },
        { name: "SK", type: "String", description: "created#{timestamp}", example: "created#2026-01-21T10:30:00Z" },
        { name: "email_id", type: "String", description: "UUID ou SES message ID", example: "email-abc123" },
        { name: "type", type: "String", description: "otp | supervisor_notification | user_confirmation | download_ready", example: "otp" },
        { name: "recipient", type: "String", description: "Email destino", example: "cliente@empresa.com" },
        { name: "subject", type: "String", description: "Assunto", example: "Seu codigo de acesso" },
        { name: "template", type: "String", description: "Template usado", example: "otp-code" },
        { name: "status", type: "String", description: "sent | delivered | bounced | failed", example: "sent" },
        { name: "ses_message_id", type: "String", description: "ID do SES", example: "0100..." },
        { name: "share_id", type: "String", description: "Compartilhamento relacionado", example: "share-abc123" },
        { name: "error_message", type: "String", description: "Erro se houver", example: "" },
        { name: "created_at", type: "String", description: "Envio", example: "2026-01-21T10:30:00Z" },
      ],
    },
  ]

  const tabs = [
    { id: "tabelas", label: "Tabelas e Campos", icon: Table },
    { id: "criar-aws", label: "Criar na AWS", icon: Terminal },
    { id: "indices", label: "Indices (GSI)", icon: Search },
    { id: "boas-praticas", label: "Boas Praticas", icon: CheckCircle },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/wiki-dev">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Wiki Dev
              </Button>
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-xl font-bold">Banco de Dados - Guia Completo</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Intro */}
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Database className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Amazon DynamoDB</h2>
              <p className="text-muted-foreground mb-4">
                Banco de dados NoSQL serverless da AWS. Este guia mostra todas as tabelas, campos, indices e como criar
                tudo na AWS passo a passo.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-background">
                  8 Tabelas
                </Badge>
                <Badge variant="outline" className="bg-background">
                  NoSQL
                </Badge>
                <Badge variant="outline" className="bg-background">
                  Serverless
                </Badge>
                <Badge variant="outline" className="bg-background">
                  Auto-scaling
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b pb-4">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className="gap-2"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "tabelas" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-lg border bg-card text-center">
                <div className="text-3xl font-bold text-orange-600">8</div>
                <div className="text-sm text-muted-foreground">Tabelas</div>
              </div>
              <div className="p-4 rounded-lg border bg-card text-center">
                <div className="text-3xl font-bold text-blue-600">120+</div>
                <div className="text-sm text-muted-foreground">Campos</div>
              </div>
              <div className="p-4 rounded-lg border bg-card text-center">
                <div className="text-3xl font-bold text-green-600">15</div>
                <div className="text-sm text-muted-foreground">Indices GSI</div>
              </div>
              <div className="p-4 rounded-lg border bg-card text-center">
                <div className="text-3xl font-bold text-purple-600">3</div>
                <div className="text-sm text-muted-foreground">Tabelas com TTL</div>
              </div>
            </div>

            {tables.map((table) => (
              <div key={table.name} className="border rounded-xl overflow-hidden bg-card">
                {/* Table Header */}
                <div className="p-4 border-b bg-gradient-to-r from-orange-500/10 to-amber-500/10">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <table.icon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold font-mono">{table.name}</h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(table.name, `table-${table.name}`)}
                        >
                          {copiedId === `table-${table.name}` ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{table.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline" className="bg-background font-mono text-xs">
                      <Key className="h-3 w-3 mr-1" />
                      {table.partitionKey}
                    </Badge>
                    <Badge variant="outline" className="bg-background font-mono text-xs">
                      <Layers className="h-3 w-3 mr-1" />
                      {table.sortKey}
                    </Badge>
                    {table.ttl && (
                      <Badge variant="outline" className="bg-amber-500/20 text-amber-600 font-mono text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        TTL: {table.ttl}
                      </Badge>
                    )}
                  </div>
                  {table.gsi.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {table.gsi.map((gsi) => (
                        <Badge key={gsi} variant="secondary" className="text-xs">
                          {gsi}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Table Fields */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Campo</th>
                        <th className="px-4 py-3 text-left font-medium">Tipo</th>
                        <th className="px-4 py-3 text-left font-medium">Descricao</th>
                        <th className="px-4 py-3 text-left font-medium">Exemplo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.fields.map((field, idx) => (
                        <tr key={field.name} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                          <td className="px-4 py-2 font-mono text-xs font-medium">{field.name}</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{field.description}</td>
                          <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{field.example}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "criar-aws" && (
          <div className="space-y-8">
            <div className="p-6 rounded-xl border bg-card">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-blue-500" />
                Passo a Passo: Criar Tabelas na AWS Console
              </h2>

              {/* Step 1 */}
              <div className="mb-8 p-4 rounded-lg border bg-muted/30">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">
                    1
                  </span>
                  Acessar o AWS Console
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-8">
                  <li>
                    Acesse{" "}
                    <code className="bg-muted px-1 rounded">https://console.aws.amazon.com</code>
                  </li>
                  <li>Faca login com suas credenciais AWS</li>
                  <li>
                    Na barra de busca, digite <strong>DynamoDB</strong> e clique no servico
                  </li>
                  <li>
                    Verifique se esta na regiao correta (ex: <strong>us-east-1</strong>)
                  </li>
                </ol>
              </div>

              {/* Step 2 */}
              <div className="mb-8 p-4 rounded-lg border bg-muted/30">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">
                    2
                  </span>
                  Criar a Tabela de Usuarios
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-8">
                  <li>
                    Clique em <strong>Create table</strong>
                  </li>
                  <li>
                    Table name: <code className="bg-slate-800 text-slate-100 px-2 py-0.5 rounded">petrobras_transfer_users</code>
                  </li>
                  <li>
                    Partition key: <code className="bg-slate-800 text-slate-100 px-2 py-0.5 rounded">PK</code> (String)
                  </li>
                  <li>
                    Sort key: <code className="bg-slate-800 text-slate-100 px-2 py-0.5 rounded">SK</code> (String)
                  </li>
                  <li>
                    Table settings: <strong>Default settings</strong> (ou customize billing mode)
                  </li>
                  <li>
                    Clique em <strong>Create table</strong>
                  </li>
                </ol>
              </div>

              {/* Step 3 */}
              <div className="mb-8 p-4 rounded-lg border bg-muted/30">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">
                    3
                  </span>
                  Criar Indice Secundario Global (GSI)
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-8">
                  <li>Clique na tabela criada</li>
                  <li>
                    Va na aba <strong>Indexes</strong>
                  </li>
                  <li>
                    Clique em <strong>Create index</strong>
                  </li>
                  <li>
                    Partition key: <code className="bg-slate-800 text-slate-100 px-2 py-0.5 rounded">email</code> (String)
                  </li>
                  <li>
                    Index name: <code className="bg-slate-800 text-slate-100 px-2 py-0.5 rounded">email-index</code>
                  </li>
                  <li>
                    Clique em <strong>Create index</strong>
                  </li>
                </ol>
              </div>

              {/* Step 4 */}
              <div className="mb-8 p-4 rounded-lg border bg-muted/30">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">
                    4
                  </span>
                  Configurar TTL (para OTP e Sessions)
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-8">
                  <li>Va na tabela (ex: petrobras_transfer_otp_codes)</li>
                  <li>
                    Clique na aba <strong>Additional settings</strong>
                  </li>
                  <li>
                    Em Time to Live (TTL), clique em <strong>Manage TTL</strong>
                  </li>
                  <li>
                    TTL attribute: <code className="bg-slate-800 text-slate-100 px-2 py-0.5 rounded">expires_at</code>
                  </li>
                  <li>
                    Clique em <strong>Turn on TTL</strong>
                  </li>
                </ol>
                <p className="text-sm text-muted-foreground mt-3 ml-8">
                  TTL deleta automaticamente itens expirados (sem custo!)
                </p>
              </div>

              {/* Script automatico */}
              <div className="p-4 rounded-lg border bg-slate-900">
                <h3 className="font-bold mb-3 text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Script Automatico (AWS CLI)
                </h3>
                <p className="text-sm text-slate-400 mb-3">
                  Ou use este script para criar todas as tabelas de uma vez:
                </p>
                <div className="relative">
                  <pre className="text-xs text-slate-300 overflow-x-auto p-3 bg-slate-950 rounded">
                    {`# Instalar AWS CLI
pip install awscli

# Configurar credenciais
aws configure

# Criar tabela de usuarios
aws dynamodb create-table \\
  --table-name petrobras_transfer_users \\
  --attribute-definitions \\
    AttributeName=PK,AttributeType=S \\
    AttributeName=SK,AttributeType=S \\
    AttributeName=email,AttributeType=S \\
  --key-schema \\
    AttributeName=PK,KeyType=HASH \\
    AttributeName=SK,KeyType=RANGE \\
  --global-secondary-indexes \\
    "[{
      \\"IndexName\\": \\"email-index\\",
      \\"KeySchema\\": [{
        \\"AttributeName\\": \\"email\\",
        \\"KeyType\\": \\"HASH\\"
      }],
      \\"Projection\\": {\\"ProjectionType\\": \\"ALL\\"},
      \\"ProvisionedThroughput\\": {
        \\"ReadCapacityUnits\\": 5,
        \\"WriteCapacityUnits\\": 5
      }
    }]" \\
  --billing-mode PAY_PER_REQUEST \\
  --region us-east-1`}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard("aws dynamodb create-table...", "cli-script")}
                  >
                    {copiedId === "cli-script" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Python Script */}
            <div className="p-6 rounded-xl border bg-card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Terminal className="h-5 w-5 text-green-500" />
                Script Python (Automatico)
              </h2>
              <p className="text-muted-foreground mb-4">
                Temos um script Python que cria todas as tabelas automaticamente:
              </p>
              <div className="relative p-4 rounded-lg bg-slate-900">
                <pre className="text-xs text-slate-300 overflow-x-auto">
                  {`cd back-end/python

# Instalar dependencias
pip install -r requirements.txt

# Rodar script de criacao
python scripts/create_dynamodb_tables.py

# Saida esperada:
# Criando tabela petrobras_transfer_users... OK
# Criando tabela petrobras_transfer_shares... OK
# Criando tabela petrobras_transfer_files... OK
# ...
# Todas as 8 tabelas criadas com sucesso!`}
                </pre>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                O script esta em:{" "}
                <code className="bg-muted px-1 rounded">back-end/python/scripts/create_dynamodb_tables.py</code>
              </p>
            </div>
          </div>
        )}

        {activeTab === "indices" && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border bg-card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-500" />
                Indices Secundarios Globais (GSI)
              </h2>
              <p className="text-muted-foreground mb-6">
                GSIs permitem consultar a tabela por outros campos alem da chave primaria. Essenciais para performance.
              </p>

              <div className="space-y-4">
                {tables.map((table) =>
                  table.gsi.length > 0 ? (
                    <div key={table.name} className="p-4 rounded-lg border">
                      <h3 className="font-bold font-mono text-sm mb-2">{table.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {table.gsi.map((gsi) => (
                          <Badge key={gsi} variant="outline" className="font-mono text-xs">
                            {gsi}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <h4 className="font-medium mb-2 text-purple-600">Quando usar GSI?</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>* Buscar usuario por email (email-index)</li>
                  <li>* Listar shares por status (status-index)</li>
                  <li>* Buscar shares por remetente (sender_id-index)</li>
                  <li>* Listar logs por data (date-index)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "boas-praticas" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Faca Isso
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">*</span>
                    Use PK e SK com prefixos (user#, share#) para Single Table Design
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">*</span>
                    Configure TTL para dados temporarios (OTP, sessoes)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">*</span>
                    Use GSI para consultas frequentes
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">*</span>
                    Use On-Demand billing para cargas imprevisiveis
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">*</span>
                    Armazene datas em ISO 8601 (ordenavel)
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Evite Isso
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">*</span>
                    Nao use Scan em tabelas grandes (muito lento e caro)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">*</span>
                    Nao crie muitos GSIs (max 20 por tabela, custam caro)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">*</span>
                    Nao armazene arquivos grandes (max 400KB por item)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">*</span>
                    Nao faca queries sem usar indices
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">*</span>
                    Nao use chaves sequenciais (causa hot partitions)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
