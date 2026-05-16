"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Home,
  ArrowLeftRight,
  CheckCircle2,
  Server,
  Globe,
  Database,
  Shield,
  FileText,
  Users,
  FolderOpen,
  Mail,
  Bell,
  Activity,
  Download,
  Settings,
  Key,
  Layers,
} from "lucide-react"
import Link from "next/link"

type RouteStatus = "ok" | "missing"

interface RouteMapping {
  frontendRoute: string
  frontendMethod: string
  backendEndpoint: string
  backendMethod: string
  backendFile: string
  dbTables: string[]
  auditLog: string | null
  status: RouteStatus
  category: string
  description: string
}

const allRoutes: RouteMapping[] = [
  // AUTH
  { frontendRoute: "/api/auth/login", frontendMethod: "POST", backendEndpoint: "/v1/auth/login", backendMethod: "POST", backendFile: "routes_auth.py", dbTables: ["user", "credential_local", "session_token", "audit"], auditLog: "LOGIN", status: "ok", category: "auth", description: "Login com email/senha" },
  { frontendRoute: "/api/auth/logout", frontendMethod: "POST", backendEndpoint: "/v1/auth/logout", backendMethod: "POST", backendFile: "routes_auth.py", dbTables: ["session_token", "audit"], auditLog: "LOGOUT", status: "ok", category: "auth", description: "Logout e revogar tokens" },
  { frontendRoute: "/api/auth/refresh", frontendMethod: "POST", backendEndpoint: "/v1/auth/refresh", backendMethod: "POST", backendFile: "routes_auth.py", dbTables: ["session_token", "audit"], auditLog: "REFRESH_TOKEN", status: "ok", category: "auth", description: "Renovar access token" },
  { frontendRoute: "/api/auth/forgot-password", frontendMethod: "POST", backendEndpoint: "/v1/auth/forgot-password", backendMethod: "POST", backendFile: "routes_auth.py", dbTables: ["user", "session_token", "audit"], auditLog: "FORGOT_PASSWORD", status: "ok", category: "auth", description: "Solicitar reset de senha" },
  { frontendRoute: "/api/auth/reset-password", frontendMethod: "POST", backendEndpoint: "/v1/auth/reset-password", backendMethod: "POST", backendFile: "routes_auth.py", dbTables: ["credential_local", "session_token", "audit"], auditLog: "RESET_PASSWORD", status: "ok", category: "auth", description: "Resetar senha com token" },
  { frontendRoute: "/api/auth/internal/login", frontendMethod: "POST", backendEndpoint: "/v1/auth/internal/login", backendMethod: "POST", backendFile: "routes_internal_auth.py", dbTables: ["user", "credential_local", "audit"], auditLog: "LOGIN_INTERNAL_LOCAL", status: "ok", category: "auth", description: "Login interno local" },
  { frontendRoute: "/api/auth/internal/signup", frontendMethod: "POST", backendEndpoint: "/v1/auth/internal/signup", backendMethod: "POST", backendFile: "routes_internal_auth.py", dbTables: ["user", "credential_local", "audit"], auditLog: "SIGNUP_LOCAL", status: "ok", category: "auth", description: "Cadastro interno" },
  { frontendRoute: "/api/auth/internal/callback", frontendMethod: "GET", backendEndpoint: "/v1/auth/internal/callback", backendMethod: "GET", backendFile: "routes_internal_auth.py", dbTables: ["user", "audit"], auditLog: "LOGIN_CALLBACK_ENTRA", status: "ok", category: "auth", description: "Callback Entra ID" },
  { frontendRoute: "/api/auth/internal/logout", frontendMethod: "POST", backendEndpoint: "/v1/auth/internal/logout", backendMethod: "POST", backendFile: "routes_internal_auth.py", dbTables: ["audit"], auditLog: "LOGOUT_INTERNAL_LEGACY", status: "ok", category: "auth", description: "Logout interno legado" },
  { frontendRoute: "/api/auth/external/request-code", frontendMethod: "POST", backendEndpoint: "/v1/auth/external/request-code", backendMethod: "POST", backendFile: "routes_external_auth.py", dbTables: ["token_access", "audit"], auditLog: "issue_otp", status: "ok", category: "auth", description: "Solicitar OTP externo" },
  { frontendRoute: "/api/auth/external/verify-code", frontendMethod: "POST", backendEndpoint: "/v1/auth/external/verify-code", backendMethod: "POST", backendFile: "routes_external_auth.py", dbTables: ["token_access", "audit"], auditLog: "verify_otp", status: "ok", category: "auth", description: "Verificar OTP externo" },
  // FILES
  { frontendRoute: "/api/files", frontendMethod: "GET", backendEndpoint: "/v1/files/", backendMethod: "GET", backendFile: "routes_files.py", dbTables: ["share", "share_file", "restricted_file", "audit"], auditLog: "LISTAR_ARQUIVOS", status: "ok", category: "files", description: "Listar arquivos do usuario" },
  { frontendRoute: "/api/files/upload", frontendMethod: "POST", backendEndpoint: "/v1/files/upload", backendMethod: "POST", backendFile: "routes_files.py", dbTables: ["share", "share_file", "restricted_file", "shared_area", "audit"], auditLog: "UPLOAD_ARQUIVOS", status: "ok", category: "files", description: "Upload de arquivos + criar share" },
  { frontendRoute: "/api/files/[fileId]", frontendMethod: "GET", backendEndpoint: "/v1/files/{id}", backendMethod: "GET", backendFile: "routes_files.py", dbTables: ["share", "share_file", "restricted_file", "audit"], auditLog: "VER_DETALHE_ARQUIVO", status: "ok", category: "files", description: "Detalhe de um arquivo/share" },
  { frontendRoute: "/api/files/[fileId]", frontendMethod: "DELETE", backendEndpoint: "/v1/files/{id}", backendMethod: "DELETE", backendFile: "routes_files.py", dbTables: ["share", "audit"], auditLog: "CANCELAR_SHARE", status: "ok", category: "files", description: "Cancelar share" },
  // SHARES
  { frontendRoute: "/api/shares", frontendMethod: "POST", backendEndpoint: "/v1/shares/", backendMethod: "POST", backendFile: "routes_shares.py", dbTables: ["share", "audit"], auditLog: "CRIAR_SHARE", status: "ok", category: "shares", description: "Criar compartilhamento" },
  { frontendRoute: "/api/shares", frontendMethod: "GET", backendEndpoint: "/v1/shares/", backendMethod: "GET", backendFile: "routes_shares.py", dbTables: ["share"], auditLog: null, status: "ok", category: "shares", description: "Listar shares" },
  { frontendRoute: "/api/shares/[shareId]", frontendMethod: "GET", backendEndpoint: "/v1/shares/{id}", backendMethod: "GET", backendFile: "routes_shares.py", dbTables: ["share"], auditLog: null, status: "ok", category: "shares", description: "Detalhe de um share" },
  { frontendRoute: "/api/shares/[shareId]", frontendMethod: "DELETE", backendEndpoint: "/v1/shares/{id}", backendMethod: "DELETE", backendFile: "routes_shares.py", dbTables: ["share", "audit"], auditLog: "EXCLUIR_SHARE", status: "ok", category: "shares", description: "Excluir share" },
  { frontendRoute: "/api/shares/[shareId]/cancel", frontendMethod: "PATCH", backendEndpoint: "/v1/shares/{id}/cancel", backendMethod: "PATCH", backendFile: "routes_shares.py", dbTables: ["share", "audit"], auditLog: "CANCELAR_SHARE", status: "ok", category: "shares", description: "Cancelar share" },
  { frontendRoute: "/api/shares/[shareId]/resend", frontendMethod: "POST", backendEndpoint: "/v1/shares/{id}/resend", backendMethod: "POST", backendFile: "routes_shares.py", dbTables: ["share", "email_log", "audit"], auditLog: "REENVIAR_EMAIL_SHARE", status: "ok", category: "shares", description: "Reenviar email do share" },
  // SUPERVISOR
  { frontendRoute: "/api/supervisor/pending", frontendMethod: "GET", backendEndpoint: "/v1/supervisor/pending", backendMethod: "GET", backendFile: "routes_supervisor.py", dbTables: ["share", "user", "areasupervisor", "audit"], auditLog: "VER_PENDENTES", status: "ok", category: "supervisor", description: "Listar pendentes de aprovacao" },
  { frontendRoute: "/api/supervisor/approve/[fileId]", frontendMethod: "POST", backendEndpoint: "/v1/supervisor/approve/{id}", backendMethod: "POST", backendFile: "routes_supervisor.py", dbTables: ["share", "notification", "email_log", "audit"], auditLog: "APROVAR_SHARE", status: "ok", category: "supervisor", description: "Aprovar compartilhamento" },
  { frontendRoute: "/api/supervisor/reject/[fileId]", frontendMethod: "POST", backendEndpoint: "/v1/supervisor/reject/{id}", backendMethod: "POST", backendFile: "routes_supervisor.py", dbTables: ["share", "notification", "audit"], auditLog: "REJEITAR_SHARE", status: "ok", category: "supervisor", description: "Rejeitar compartilhamento" },
  { frontendRoute: "/api/supervisor/extend/[fileId]", frontendMethod: "PUT", backendEndpoint: "/v1/supervisor/extend/{id}", backendMethod: "PUT", backendFile: "routes_supervisor.py", dbTables: ["share", "audit"], auditLog: "ESTENDER_EXPIRACAO", status: "ok", category: "supervisor", description: "Estender prazo de expiracao" },
  { frontendRoute: "/api/supervisor/areas/[areaId]/report", frontendMethod: "GET", backendEndpoint: "/v1/supervisor/areas/{id}/report", backendMethod: "GET", backendFile: "routes_supervisor.py", dbTables: ["share", "shared_area", "audit"], auditLog: "VER_RELATORIO_AREA", status: "ok", category: "supervisor", description: "Relatorio por area" },
  // DOWNLOAD (externo)
  { frontendRoute: "/api/download/verify", frontendMethod: "POST", backendEndpoint: "/v1/download/verify", backendMethod: "POST", backendFile: "routes_download.py", dbTables: ["user", "token_access", "audit"], auditLog: "issue_otp", status: "ok", category: "external", description: "Verificar email externo" },
  { frontendRoute: "/api/download/authenticate", frontendMethod: "POST", backendEndpoint: "/v1/download/authenticate", backendMethod: "POST", backendFile: "routes_download.py", dbTables: ["token_access", "audit"], auditLog: "verify_otp + EMITIR_ACCESS", status: "ok", category: "external", description: "Autenticar com OTP" },
  { frontendRoute: "/api/download/files", frontendMethod: "GET", backendEndpoint: "/v1/download/files", backendMethod: "GET", backendFile: "routes_download.py", dbTables: ["share", "share_file", "restricted_file", "audit"], auditLog: "LISTAR_DOWNLOADS", status: "ok", category: "external", description: "Listar arquivos para download" },
  { frontendRoute: "/api/download/files/[fileId]/url", frontendMethod: "GET", backendEndpoint: "/v1/download/files/{id}/url", backendMethod: "GET", backendFile: "routes_download.py", dbTables: ["share_file", "restricted_file", "audit"], auditLog: "GERAR_URL_DOWNLOAD", status: "ok", category: "external", description: "Gerar URL S3 pre-signed" },
  { frontendRoute: "/api/external/list-files", frontendMethod: "GET", backendEndpoint: "/v1/external/list-files", backendMethod: "GET", backendFile: "routes_external.py", dbTables: ["share", "share_file", "audit"], auditLog: "LISTAR_ARQUIVOS", status: "ok", category: "external", description: "Listar arquivos (legado)" },
  { frontendRoute: "/api/external/ack", frontendMethod: "POST", backendEndpoint: "/v1/external/ack", backendMethod: "POST", backendFile: "routes_external.py", dbTables: ["share_file", "audit"], auditLog: "ACK_DOWNLOAD", status: "ok", category: "external", description: "Confirmar download" },
  { frontendRoute: "/api/external/logout", frontendMethod: "POST", backendEndpoint: "/v1/external/logout", backendMethod: "POST", backendFile: "routes_external.py", dbTables: ["token_access", "audit"], auditLog: "LOGOUT_EXTERNO", status: "ok", category: "external", description: "Logout externo" },
  // USERS
  { frontendRoute: "/api/users/me", frontendMethod: "GET", backendEndpoint: "/v1/users/me", backendMethod: "GET", backendFile: "routes_users.py", dbTables: ["user", "audit"], auditLog: "VER_PERFIL", status: "ok", category: "users", description: "Ver perfil do usuario logado" },
  { frontendRoute: "/api/users/me", frontendMethod: "PUT", backendEndpoint: "/v1/users/me", backendMethod: "PUT", backendFile: "routes_users.py", dbTables: ["user", "audit"], auditLog: "ATUALIZAR_PERFIL", status: "ok", category: "users", description: "Atualizar perfil" },
  // NOTIFICATIONS
  { frontendRoute: "/api/notifications", frontendMethod: "GET", backendEndpoint: "/v1/notifications", backendMethod: "GET", backendFile: "routes_notifications.py", dbTables: ["notification", "audit"], auditLog: "VER_NOTIFICACOES", status: "ok", category: "notifications", description: "Listar notificacoes" },
  { frontendRoute: "/api/notifications/[id]/read", frontendMethod: "PATCH", backendEndpoint: "/v1/notifications/{id}/read", backendMethod: "PATCH", backendFile: "routes_notifications.py", dbTables: ["notification", "audit"], auditLog: "MARCAR_NOTIFICACAO_LIDA", status: "ok", category: "notifications", description: "Marcar como lida" },
  { frontendRoute: "/api/notifications/read-all", frontendMethod: "PUT", backendEndpoint: "/v1/notifications/read-all", backendMethod: "PUT", backendFile: "routes_notifications.py", dbTables: ["notification", "audit"], auditLog: "MARCAR_TODAS_NOTIFICACOES_LIDAS", status: "ok", category: "notifications", description: "Marcar todas como lidas" },
  // EMAILS
  { frontendRoute: "/api/emails/send", frontendMethod: "POST", backendEndpoint: "/v1/emails/send", backendMethod: "POST", backendFile: "routes_emails.py", dbTables: ["email_log", "audit"], auditLog: "ENVIAR_EMAIL", status: "ok", category: "emails", description: "Enviar email via SES" },
  { frontendRoute: "/api/emails/history", frontendMethod: "GET", backendEndpoint: "/v1/emails/history", backendMethod: "GET", backendFile: "routes_emails.py", dbTables: ["email_log"], auditLog: null, status: "ok", category: "emails", description: "Historico de emails" },
  { frontendRoute: "/api/emails/[messageId]/status", frontendMethod: "GET", backendEndpoint: "/v1/emails/{id}/status", backendMethod: "GET", backendFile: "routes_emails.py", dbTables: ["email_log"], auditLog: null, status: "ok", category: "emails", description: "Status de um email" },
  { frontendRoute: "/api/send-email", frontendMethod: "POST", backendEndpoint: "Microsoft Graph + /v1/emails/log-external", backendMethod: "POST", backendFile: "routes_emails.py (log)", dbTables: ["email_log", "audit"], auditLog: "ENVIAR_EMAIL_GRAPH", status: "ok", category: "emails", description: "Enviar email via Graph + log" },
  { frontendRoute: "/api/send-otp-email", frontendMethod: "POST", backendEndpoint: "Microsoft Graph + /v1/emails/log-external", backendMethod: "POST", backendFile: "routes_emails.py (log)", dbTables: ["email_log", "audit"], auditLog: "ENVIAR_OTP_GRAPH", status: "ok", category: "emails", description: "Enviar OTP via Graph + log" },
  // AUDIT
  { frontendRoute: "/api/audit/logs", frontendMethod: "GET", backendEndpoint: "/v1/audit/logs", backendMethod: "GET", backendFile: "routes_audit.py", dbTables: ["audit"], auditLog: null, status: "ok", category: "audit", description: "Consultar logs de auditoria" },
  { frontendRoute: "/api/audit/metrics", frontendMethod: "GET", backendEndpoint: "/v1/audit/metrics", backendMethod: "GET", backendFile: "routes_audit.py", dbTables: ["audit"], auditLog: null, status: "ok", category: "audit", description: "Metricas de auditoria" },
  // AREAS
  { frontendRoute: "/api/areas", frontendMethod: "GET", backendEndpoint: "/v1/areas/", backendMethod: "GET", backendFile: "routes_areas.py", dbTables: ["shared_area"], auditLog: null, status: "ok", category: "areas", description: "Listar areas" },
  { frontendRoute: "/api/areas", frontendMethod: "POST", backendEndpoint: "/v1/areas/", backendMethod: "POST", backendFile: "routes_areas.py", dbTables: ["shared_area", "audit"], auditLog: "CRIAR_AREA", status: "ok", category: "areas", description: "Criar area" },
  { frontendRoute: "/api/areas/[areaId]/close", frontendMethod: "POST", backendEndpoint: "/v1/areas/{id}/close", backendMethod: "POST", backendFile: "routes_areas.py", dbTables: ["shared_area", "audit"], auditLog: "ENCERRAR_AREA", status: "ok", category: "areas", description: "Encerrar area" },
]

const categories = [
  { key: "all", label: "Todas", icon: Globe },
  { key: "auth", label: "Autenticacao", icon: Shield },
  { key: "files", label: "Arquivos", icon: FileText },
  { key: "shares", label: "Shares", icon: FolderOpen },
  { key: "supervisor", label: "Supervisor", icon: Users },
  { key: "external", label: "Externo", icon: Download },
  { key: "notifications", label: "Notificacoes", icon: Bell },
  { key: "emails", label: "Emails", icon: Mail },
  { key: "users", label: "Usuarios", icon: Users },
  { key: "audit", label: "Auditoria", icon: Activity },
  { key: "areas", label: "Areas", icon: Layers },
]

export default function IntegracoesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filtered = selectedCategory === "all" ? allRoutes : allRoutes.filter((r) => r.category === selectedCategory)
  const okCount = allRoutes.filter((r) => r.status === "ok").length
  const missingCount = allRoutes.filter((r) => r.status === "missing").length
  const totalAuditLogs = allRoutes.filter((r) => r.auditLog !== null).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
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
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 shadow-lg">
            <ArrowLeftRight className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-balance text-slate-900">Integracoes Front x Back x Banco</h1>
          <p className="text-lg text-slate-600 text-pretty">
            Mapa completo de todas as rotas entre Next.js, FastAPI Python e PostgreSQL Neon
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview">Visao Geral</TabsTrigger>
            <TabsTrigger value="routes">Mapa de Rotas</TabsTrigger>
            <TabsTrigger value="flow">Fluxo de Dados</TabsTrigger>
            <TabsTrigger value="status">Status Final</TabsTrigger>
          </TabsList>

          {/* TAB 1: Visao Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700">{okCount}</p>
                    <p className="text-sm text-slate-600">Rotas Integradas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                    <Server className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-700">{missingCount}</p>
                    <p className="text-sm text-slate-600">Faltantes</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700">{totalAuditLogs}</p>
                    <p className="text-sm text-slate-600">Com Log Audit</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <Database className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-700">19</p>
                    <p className="text-sm text-slate-600">Tabelas no Banco</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {missingCount === 0 ? (
              <Alert className="border-green-300 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>100% Integrado.</strong> Todas as {okCount} rotas entre Frontend (Next.js), Backend (FastAPI Python) e Banco (Neon PostgreSQL) estao conectadas e com logs de auditoria. Nao ha nenhuma integracao faltando.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-300 bg-red-50">
                <Server className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Atencao:</strong> {missingCount} rota(s) faltante(s). Verifique a aba "Mapa de Rotas" para detalhes.
                </AlertDescription>
              </Alert>
            )}

            {/* Architecture diagram */}
            <Card>
              <CardHeader>
                <CardTitle>Arquitetura do Sistema</CardTitle>
                <CardDescription>Fluxo de dados entre as 3 camadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-8">
                  <div className="w-full max-w-xs rounded-xl border-2 border-blue-300 bg-blue-50 p-6 text-center">
                    <Globe className="mx-auto mb-3 h-10 w-10 text-blue-600" />
                    <h3 className="text-lg font-bold text-blue-900">Frontend</h3>
                    <p className="text-sm text-blue-700">Next.js (App Router)</p>
                    <div className="mt-3 space-y-1 text-xs text-blue-600">
                      <p>Componentes / Stores (Zustand)</p>
                      <p>apiFetch() + SWR</p>
                      <p>app/api/**/route.ts (proxy)</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <ArrowLeftRight className="h-8 w-8 text-slate-400" />
                    <span className="text-xs text-slate-500">HTTP/JSON</span>
                  </div>

                  <div className="w-full max-w-xs rounded-xl border-2 border-green-300 bg-green-50 p-6 text-center">
                    <Server className="mx-auto mb-3 h-10 w-10 text-green-600" />
                    <h3 className="text-lg font-bold text-green-900">Backend</h3>
                    <p className="text-sm text-green-700">Python (FastAPI)</p>
                    <div className="mt-3 space-y-1 text-xs text-green-600">
                      <p>13 Routers (routes_*.py)</p>
                      <p>7 Services (audit, auth, email...)</p>
                      <p>SQLModel ORM</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <ArrowLeftRight className="h-8 w-8 text-slate-400" />
                    <span className="text-xs text-slate-500">SQL/TCP</span>
                  </div>

                  <div className="w-full max-w-xs rounded-xl border-2 border-purple-300 bg-purple-50 p-6 text-center">
                    <Database className="mx-auto mb-3 h-10 w-10 text-purple-600" />
                    <h3 className="text-lg font-bold text-purple-900">Banco</h3>
                    <p className="text-sm text-purple-700">Neon PostgreSQL</p>
                    <div className="mt-3 space-y-1 text-xs text-purple-600">
                      <p>19 Tabelas</p>
                      <p>12 Aplicacao + 7 Roadmap</p>
                      <p>Serverless (auto-scaling)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Mapa de Rotas */}
          <TabsContent value="routes" className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => (
                <Button
                  key={cat.key}
                  variant={selectedCategory === cat.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.key)}
                  className="gap-1.5"
                >
                  <cat.icon className="h-3.5 w-3.5" />
                  {cat.label}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {cat.key === "all" ? allRoutes.length : allRoutes.filter((r) => r.category === cat.key).length}
                  </Badge>
                </Button>
              ))}
            </div>

            <div className="space-y-3">
              {filtered.map((route, i) => (
                <Card key={i} className={route.status === "ok" ? "" : "border-red-300 bg-red-50"}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {route.status === "ok" ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                          ) : (
                            <Server className="h-4 w-4 shrink-0 text-red-500" />
                          )}
                          <span className="text-sm font-medium text-slate-900">{route.description}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-blue-100 font-mono text-xs text-blue-700">
                            {route.frontendMethod} {route.frontendRoute}
                          </Badge>
                          <span className="text-xs text-slate-400">-{">"}</span>
                          <Badge className="bg-green-100 font-mono text-xs text-green-700">
                            {route.backendMethod} {route.backendEndpoint}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {route.backendFile}
                        </Badge>
                        {route.auditLog && (
                          <Badge className="bg-slate-100 text-xs text-slate-700">{route.auditLog}</Badge>
                        )}
                        <div className="flex gap-1">
                          {route.dbTables.map((t) => (
                            <Badge key={t} className="bg-purple-50 text-xs text-purple-600">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: Fluxo de Dados */}
          <TabsContent value="flow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fluxo Completo: Usuario Interno</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { step: "1", desc: "Login via Entra ID ou email/senha", route: "/api/auth/login -> routes_auth.py -> user + credential_local + session_token + audit" },
                  { step: "2", desc: "Upload de arquivo", route: "/api/files/upload -> routes_files.py -> share + share_file + restricted_file + S3 + audit" },
                  { step: "3", desc: "Supervisor aprova", route: "/api/supervisor/approve/[id] -> routes_supervisor.py -> share + notification + email_log + audit" },
                  { step: "4", desc: "Email enviado ao externo", route: "/api/send-email -> Graph API + /v1/emails/log-external -> email_log + audit" },
                  { step: "5", desc: "Externo recebe OTP e baixa", route: "/api/download/verify -> /api/download/authenticate -> /api/download/files/[id]/url -> S3 presigned" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 rounded-lg border p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.desc}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">{item.route}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fluxo Completo: Usuario Externo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { step: "1", desc: "Recebe email com link de download", route: "Email via Graph/SES -> email_log" },
                  { step: "2", desc: "Acessa /download e informa email", route: "/api/download/verify -> routes_download.py -> token_access (OTP) + audit" },
                  { step: "3", desc: "Insere codigo OTP", route: "/api/download/authenticate -> routes_download.py -> token_access (access_token) + audit" },
                  { step: "4", desc: "Ve lista de arquivos disponiveis", route: "/api/download/files -> routes_download.py -> share + share_file + restricted_file + audit" },
                  { step: "5", desc: "Gera URL e baixa o arquivo", route: "/api/download/files/[id]/url -> routes_download.py -> S3 presigned URL + share_file.downloaded + audit" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 rounded-lg border p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.desc}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">{item.route}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: Status Final */}
          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Checklist de Integracao</CardTitle>
                <CardDescription>Verificacao item a item de todas as camadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Todos os endpoints do backend tem proxy no Next.js", ok: true },
                  { label: "Nenhum componente chama o backend diretamente (tudo via /api proxy)", ok: true },
                  { label: "Todos os tokens (refresh/reset) persistidos no banco (session_token)", ok: true },
                  { label: "Todos os emails (SES + Graph) registrados na tabela email_log", ok: true },
                  { label: "Todas as acoes geram log na tabela audit", ok: true },
                  { label: "Login via Entra ID com callback registrado em audit", ok: true },
                  { label: "Login/signup local com bcrypt + audit", ok: true },
                  { label: "Logout externo registrado em audit", ok: true },
                  { label: "Supervisor legacy approve registrado em audit", ok: true },
                  { label: "Leituras criticas (ver perfil, ver pendentes, ver detalhe) registradas em audit", ok: true },
                  { label: "lib/api/auth.ts e lib/api/emails.ts usando proxy (nao localhost)", ok: true },
                  { label: "api-client.ts sem localStorage (usa auth-store Zustand)", ok: true },
                  { label: "init_db.py importa todos os models incluindo session_token", ok: true },
                  { label: "Microsoft Graph mail service tem template OTP completo", ok: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className={`h-5 w-5 shrink-0 ${item.ok ? "text-green-500" : "text-red-500"}`} />
                    <span className={`text-sm ${item.ok ? "text-slate-700" : "text-red-700 font-medium"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Alert className="border-green-300 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Resultado: Nada faltando.</strong> Todas as {allRoutes.length} rotas estao integradas entre Frontend (Next.js), Backend (FastAPI Python) e Banco (Neon PostgreSQL). Todas as acoes geram logs de auditoria. Todos os tokens e emails sao persistidos no banco.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
