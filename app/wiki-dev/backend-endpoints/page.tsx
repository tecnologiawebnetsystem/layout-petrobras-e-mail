"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, Server, Copy, Check, ChevronDown, ChevronRight, Search, FileCode, Database, Shield, Mail, FileText } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { useSearchParams, Suspense } from "next/navigation"

const Loading = () => null;

export default function BackendEndpointsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["overview"]))
  const [searchQuery, setSearchQuery] = useState("")
  const searchParams = useSearchParams();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSections(newExpanded)
  }

  const routeFiles = [
    {
      id: "routes_auth_complete",
      file: "routes_auth_complete.py",
      path: "back-end/python/app/api/v1/routes_auth_complete.py",
      description: "Autenticacao completa: Entra ID e OTP",
      lines: 572,
      icon: Shield,
      color: "from-blue-500 to-indigo-600",
      endpoints: [
        { method: "POST", path: "/auth/entra/validate-token", summary: "Validar token Microsoft Entra ID" },
        { method: "POST", path: "/auth/entra/sync-user", summary: "Sincronizar dados do usuario Entra" },
        { method: "POST", path: "/auth/entra/create-session", summary: "Criar sessao para usuario interno" },
        { method: "POST", path: "/auth/entra/validate-session", summary: "Validar sessao ativa" },
        { method: "POST", path: "/auth/entra/logout", summary: "Encerrar sessao" },
        { method: "GET", path: "/auth/entra/user-type/{email}", summary: "Determinar tipo de usuario" },
        { method: "POST", path: "/otp/generate", summary: "Gerar codigo OTP (6 digitos, 3 min)" },
        { method: "POST", path: "/otp/verify", summary: "Verificar codigo OTP" },
        { method: "POST", path: "/otp/resend", summary: "Reenviar codigo OTP" },
        { method: "GET", path: "/otp/status/{email}", summary: "Verificar se ha codigo ativo" },
      ],
      rules: [
        "Token Entra ID validado via JWKS da Microsoft",
        "Sessao interna dura 8 horas",
        "Sessao externa dura 3 horas",
        "OTP expira em 3 minutos",
        "Maximo 5 tentativas de OTP",
        "Cooldown de 30 segundos entre reenvios"
      ]
    },
    {
      id: "routes_shares_complete",
      file: "routes_shares_complete.py",
      path: "back-end/python/app/api/v1/routes_shares_complete.py",
      description: "Compartilhamentos: criar, listar, aprovar, rejeitar",
      lines: 832,
      icon: FileCode,
      color: "from-green-500 to-emerald-600",
      endpoints: [
        { method: "POST", path: "/shares", summary: "Criar novo compartilhamento" },
        { method: "GET", path: "/shares/my-shares", summary: "Listar compartilhamentos do usuario" },
        { method: "GET", path: "/shares/{share_id}", summary: "Detalhes de um compartilhamento" },
        { method: "PATCH", path: "/shares/{share_id}/cancel", summary: "Cancelar compartilhamento pendente" },
        { method: "PUT", path: "/shares/{share_id}", summary: "Atualizar compartilhamento pendente" },
        { method: "DELETE", path: "/shares/{share_id}", summary: "Remover compartilhamento cancelado" },
        { method: "GET", path: "/shares/{share_id}/history", summary: "Historico de acoes" },
        { method: "POST", path: "/shares/upload-files", summary: "Upload de arquivos (multipart)" },
      ],
      rules: [
        "Arquivos armazenados no S3",
        "Extensoes bloqueadas: .exe, .dll, .bat, .cmd, .com, .msi, .scr, .vbs, .ps1, .sh",
        "Tamanho maximo: 500MB por arquivo",
        "Expiracao: 24, 48 ou 72 horas apos aprovacao",
        "Supervisor detectado automaticamente via Entra ID",
        "Notificacao enviada ao supervisor apos criar"
      ]
    },
    {
      id: "routes_supervisor",
      file: "routes_supervisor_full.py",
      path: "back-end/python/app/api/v1/routes_supervisor_full.py",
      description: "Supervisor: aprovacoes, rejeicoes, estatisticas",
      lines: 558,
      icon: Shield,
      color: "from-amber-500 to-orange-600",
      endpoints: [
        { method: "GET", path: "/supervisor/pending", summary: "Listar pendentes de aprovacao" },
        { method: "GET", path: "/supervisor/all", summary: "Listar todos com filtros" },
        { method: "GET", path: "/supervisor/{share_id}", summary: "Detalhes para aprovacao" },
        { method: "POST", path: "/supervisor/{share_id}/approve", summary: "Aprovar compartilhamento" },
        { method: "POST", path: "/supervisor/{share_id}/reject", summary: "Rejeitar compartilhamento" },
        { method: "PUT", path: "/supervisor/{share_id}/extend", summary: "Alterar tempo de expiracao" },
        { method: "GET", path: "/supervisor/statistics", summary: "Estatisticas do supervisor" },
        { method: "POST", path: "/supervisor/shares/create", summary: "Criar share como supervisor" },
      ],
      rules: [
        "Apenas supervisor pode aprovar/rejeitar",
        "Supervisor pode ter subordinados e tambem ser subordinado",
        "Ao aprovar, email enviado ao destinatario",
        "Ao rejeitar, motivo obrigatorio",
        "Supervisor pode alterar expiracao antes de aprovar",
        "Share criado por supervisor vai para supervisor dele"
      ]
    },
    {
      id: "routes_external",
      file: "routes_external_download.py",
      path: "back-end/python/app/api/v1/routes_external_download.py",
      description: "Download externo: acesso de usuarios externos",
      lines: 505,
      icon: FileText,
      color: "from-purple-500 to-pink-600",
      endpoints: [
        { method: "POST", path: "/external/verify", summary: "Verificar se email tem shares" },
        { method: "POST", path: "/external/authenticate", summary: "Autenticar com OTP" },
        { method: "GET", path: "/external/shares", summary: "Listar shares disponiveis" },
        { method: "GET", path: "/external/shares/{share_id}", summary: "Detalhes de um share" },
        { method: "POST", path: "/external/shares/{share_id}/accept-terms", summary: "Aceitar termos de uso" },
        { method: "GET", path: "/external/files/{file_id}/download", summary: "Gerar URL de download" },
        { method: "GET", path: "/external/files/{file_id}/preview", summary: "Gerar URL de preview" },
        { method: "POST", path: "/external/logout", summary: "Encerrar sessao externa" },
      ],
      rules: [
        "Acesso apenas via OTP por email",
        "Termos devem ser aceitos antes do download",
        "URL de download assinada (presigned URL) do S3",
        "URL expira em 1 hora",
        "Download registrado no log de auditoria",
        "Sessao externa expira em 3 horas"
      ]
    },
    {
      id: "routes_emails",
      file: "routes_emails.py",
      path: "back-end/python/app/api/v1/routes_emails.py",
      description: "Emails: notificacoes, OTP, confirmacoes",
      lines: 381,
      icon: Mail,
      color: "from-red-500 to-rose-600",
      endpoints: [
        { method: "POST", path: "/emails/send", summary: "Enviar email generico" },
        { method: "POST", path: "/emails/send-otp", summary: "Enviar email com codigo OTP" },
        { method: "POST", path: "/emails/send-supervisor-notification", summary: "Notificar supervisor" },
        { method: "POST", path: "/emails/send-recipient-notification", summary: "Notificar destinatario" },
        { method: "POST", path: "/emails/send-confirmation", summary: "Enviar confirmacao ao remetente" },
        { method: "GET", path: "/emails/{message_id}/status", summary: "Status de um email" },
        { method: "GET", path: "/emails/history", summary: "Historico de emails" },
      ],
      rules: [
        "Enviados via AWS SES",
        "Templates HTML para cada tipo de email",
        "Remetente: noreply@petrobras.com.br",
        "Logs de envio salvos no DynamoDB",
        "Retry automatico em caso de falha"
      ]
    },
    {
      id: "routes_audit",
      file: "routes_audit_full.py",
      path: "back-end/python/app/api/v1/routes_audit_full.py",
      description: "Auditoria: logs, metricas, alertas",
      lines: 531,
      icon: Database,
      color: "from-slate-500 to-slate-700",
      endpoints: [
        { method: "GET", path: "/audit/logs", summary: "Listar logs com filtros" },
        { method: "POST", path: "/audit/logs", summary: "Criar log de auditoria" },
        { method: "GET", path: "/audit/logs/{log_id}", summary: "Detalhes de um log" },
        { method: "GET", path: "/audit/metrics", summary: "Metricas gerais" },
        { method: "GET", path: "/audit/metrics/by-user", summary: "Metricas por usuario" },
        { method: "GET", path: "/audit/metrics/by-day", summary: "Metricas diarias" },
        { method: "GET", path: "/audit/export", summary: "Exportar logs (JSON/CSV)" },
        { method: "GET", path: "/audit/security-alerts", summary: "Alertas de seguranca" },
        { method: "POST", path: "/audit/security-alerts/{alert_id}/acknowledge", summary: "Reconhecer alerta" },
      ],
      rules: [
        "Todos os logs salvos no DynamoDB",
        "Retencao de 90 dias",
        "Alertas para tentativas suspeitas",
        "Export em JSON ou CSV",
        "Filtros por data, usuario, acao"
      ]
    }
  ]

  const services = [
    {
      name: "user_service.py",
      description: "Gerenciamento de usuarios",
      functions: ["get_user_by_email", "get_user_by_id", "create_user", "update_user", "get_user_type", "sync_from_entra"]
    },
    {
      name: "share_service_dynamodb.py",
      description: "Operacoes de compartilhamento",
      functions: ["create_share", "get_share", "list_user_shares", "list_pending_approvals", "approve_share", "reject_share", "cancel_share"]
    },
    {
      name: "file_service_s3.py",
      description: "Upload/download de arquivos",
      functions: ["upload_file", "get_download_url", "get_preview_url", "delete_file", "validate_file"]
    },
    {
      name: "otp_service.py",
      description: "Geracao e validacao OTP",
      functions: ["generate_otp", "verify_otp", "invalidate_otp", "check_cooldown", "check_attempts"]
    },
    {
      name: "email_service_dynamodb.py",
      description: "Envio de emails via SES",
      functions: ["send_email", "send_otp_email", "send_supervisor_notification", "send_recipient_notification"]
    },
    {
      name: "audit_service_dynamodb.py",
      description: "Logs de auditoria",
      functions: ["log_action", "get_logs", "get_metrics", "export_logs", "create_alert"]
    },
    {
      name: "notification_service.py",
      description: "Notificacoes in-app",
      functions: ["create_notification", "get_user_notifications", "mark_as_read", "delete_notification"]
    }
  ]

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-blue-500"
      case "POST": return "bg-green-500"
      case "PUT": return "bg-amber-500"
      case "PATCH": return "bg-purple-500"
      case "DELETE": return "bg-red-500"
      default: return "bg-slate-500"
    }
  }

  const filteredRouteFiles = routeFiles.filter(file => 
    !searchQuery || 
    file.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.endpoints.some(e => e.path.toLowerCase().includes(searchQuery.toLowerCase()) || e.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <Link href="/wiki-dev">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Voltar para Wiki
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                <Server className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Back-End - Endpoints Implementados</h1>
                <p className="text-muted-foreground">Todos os endpoints e servicos ja criados no back-end Python</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600">{routeFiles.reduce((acc, f) => acc + f.endpoints.length, 0)}</div>
                <div className="text-sm text-muted-foreground">Endpoints</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">{routeFiles.length}</div>
                <div className="text-sm text-muted-foreground">Arquivos de Rotas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-purple-600">{services.length}</div>
                <div className="text-sm text-muted-foreground">Services</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-amber-600">{routeFiles.reduce((acc, f) => acc + f.lines, 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Linhas de Codigo</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar endpoint ou arquivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="routes" className="space-y-6">
            <TabsList>
              <TabsTrigger value="routes">Arquivos de Rotas</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="structure">Estrutura</TabsTrigger>
            </TabsList>

            <TabsContent value="routes" className="space-y-6">
              {filteredRouteFiles.map(file => {
                const Icon = file.icon
                const isExpanded = expandedSections.has(file.id)
                
                return (
                  <Card key={file.id} className="overflow-hidden">
                    <CardHeader 
                      className={`bg-gradient-to-r ${file.color} text-white cursor-pointer`}
                      onClick={() => toggleSection(file.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="h-6 w-6" />
                          <div>
                            <CardTitle className="text-xl">{file.file}</CardTitle>
                            <p className="text-white/80 text-sm">{file.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            {file.endpoints.length} endpoints
                          </Badge>
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            {file.lines} linhas
                          </Badge>
                          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="p-6 space-y-6">
                        {/* Caminho do arquivo */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Arquivo:</span>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{file.path}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(file.path, `path-${file.id}`)}
                          >
                            {copiedId === `path-${file.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>

                        {/* Endpoints */}
                        <div>
                          <h4 className="font-semibold mb-3">Endpoints</h4>
                          <div className="space-y-2">
                            {file.endpoints.map((endpoint, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                <Badge className={`${getMethodColor(endpoint.method)} text-white font-mono min-w-[60px] justify-center`}>
                                  {endpoint.method}
                                </Badge>
                                <code className="text-sm flex-1">/api/v1{endpoint.path}</code>
                                <span className="text-sm text-muted-foreground">{endpoint.summary}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Regras */}
                        <div>
                          <h4 className="font-semibold mb-3">Regras de Negocio</h4>
                          <ul className="space-y-2">
                            {file.rules.map((rule, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <span className="text-green-500 mt-1">&#x2713;</span>
                                <span>{rule}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800 mb-6">
                <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Services</h3>
                <p className="text-sm text-purple-700 dark:text-purple-400">
                  Camada de servicos que encapsula a logica de negocio. As rotas chamam os services.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {services.map(service => (
                  <Card key={service.name}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileCode className="h-5 w-5 text-purple-500" />
                        {service.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {service.functions.map(fn => (
                          <Badge key={fn} variant="outline" className="font-mono text-xs">
                            {fn}()
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="structure" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estrutura do Back-End</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => copyToClipboard(`back-end/python/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── routes_auth_complete.py    # Autenticacao
│   │       ├── routes_shares_complete.py  # Compartilhamentos
│   │       ├── routes_supervisor_full.py  # Supervisor
│   │       ├── routes_external_download.py # Download externo
│   │       ├── routes_emails.py           # Emails
│   │       └── routes_audit_full.py       # Auditoria
│   ├── core/
│   │   ├── config.py                      # Configuracoes
│   │   ├── aws_config.py                  # Config AWS
│   │   └── dynamodb_client.py             # Cliente DynamoDB
│   ├── models/
│   │   └── dynamodb_models.py             # Modelos de dados
│   └── services/
│       ├── user_service.py
│       ├── share_service_dynamodb.py
│       ├── file_service_s3.py
│       ├── otp_service.py
│       ├── email_service_dynamodb.py
│       ├── audit_service_dynamodb.py
│       └── notification_service.py
├── scripts/
│   └── create_dynamodb_tables.py          # Criar tabelas
├── .env.example
├── requirements.txt
└── main.py`, "structure")}
                    >
                      {copiedId === "structure" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm">
{`back-end/python/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── routes_auth_complete.py    # Autenticacao
│   │       ├── routes_shares_complete.py  # Compartilhamentos
│   │       ├── routes_supervisor_full.py  # Supervisor
│   │       ├── routes_external_download.py # Download externo
│   │       ├── routes_emails.py           # Emails
│   │       └── routes_audit_full.py       # Auditoria
│   ├── core/
│   │   ├── config.py                      # Configuracoes
│   │   ├── aws_config.py                  # Config AWS
│   │   └── dynamodb_client.py             # Cliente DynamoDB
│   ├── models/
│   │   └── dynamodb_models.py             # Modelos de dados
│   └── services/
│       ├── user_service.py
│       ├── share_service_dynamodb.py
│       ├── file_service_s3.py
│       ├── otp_service.py
│       ├── email_service_dynamodb.py
│       ├── audit_service_dynamodb.py
│       └── notification_service.py
├── scripts/
│   └── create_dynamodb_tables.py          # Criar tabelas
├── .env.example
├── requirements.txt
└── main.py`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Como rodar */}
              <Card>
                <CardHeader>
                  <CardTitle>Como Rodar o Back-End</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge className="mt-0.5">1</Badge>
                      <div>
                        <p className="font-medium">Navegar para pasta</p>
                        <code className="text-sm bg-muted px-2 py-1 rounded">cd back-end/python</code>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="mt-0.5">2</Badge>
                      <div>
                        <p className="font-medium">Criar ambiente virtual</p>
                        <code className="text-sm bg-muted px-2 py-1 rounded">python -m venv venv && source venv/bin/activate</code>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="mt-0.5">3</Badge>
                      <div>
                        <p className="font-medium">Instalar dependencias</p>
                        <code className="text-sm bg-muted px-2 py-1 rounded">pip install -r requirements.txt</code>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="mt-0.5">4</Badge>
                      <div>
                        <p className="font-medium">Configurar variaveis</p>
                        <code className="text-sm bg-muted px-2 py-1 rounded">cp .env.example .env && nano .env</code>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="mt-0.5">5</Badge>
                      <div>
                        <p className="font-medium">Rodar servidor</p>
                        <code className="text-sm bg-muted px-2 py-1 rounded">uvicorn app.main:app --reload --port 8000</code>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="mt-0.5">6</Badge>
                      <div>
                        <p className="font-medium">Acessar documentacao</p>
                        <code className="text-sm bg-muted px-2 py-1 rounded">http://localhost:8000/docs</code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Suspense>
  )
}
