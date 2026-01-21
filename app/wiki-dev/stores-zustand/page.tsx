"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, Copy, Check, ChevronDown, ChevronRight, Database, User, Bell, FileText, Shield } from "lucide-react"
import Link from "next/link"

export default function StoresZustandPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedStore, setExpandedStore] = useState<string | null>("auth-store")

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const stores = [
    {
      name: "useAuthStore",
      file: "lib/stores/auth-store.ts",
      description: "Gerencia estado de autenticacao do usuario logado",
      icon: User,
      color: "blue",
      state: [
        { name: "user", type: "User | null", description: "Dados do usuario logado" },
        { name: "accessToken", type: "string | null", description: "Token de acesso (Entra ID)" },
        { name: "idToken", type: "string | null", description: "ID Token (Entra ID)" },
        { name: "isAuthenticated", type: "boolean", description: "Se esta autenticado" },
        { name: "isLoading", type: "boolean", description: "Se esta carregando" },
      ],
      methods: [
        {
          name: "setAuth",
          params: "(user: User, accessToken?: string, idToken?: string)",
          description: "Define usuario autenticado",
          example: `const { setAuth } = useAuthStore()

setAuth({
  id: "user-123",
  email: "joao@petrobras.com.br",
  name: "Joao Silva",
  userType: "internal",
  jobTitle: "Analista",
  department: "TI",
  manager: {
    id: "mgr-456",
    name: "Maria Santos",
    email: "maria.santos@petrobras.com.br"
  }
}, accessToken, idToken)`,
        },
        {
          name: "logout",
          params: "()",
          description: "Faz logout e limpa o estado",
          example: `const { logout } = useAuthStore()

const handleLogout = () => {
  logout()
  router.push("/")
}`,
        },
        {
          name: "enrichUserProfile",
          params: "(data: Partial<User>)",
          description: "Atualiza dados adicionais do usuario (foto, cargo, etc)",
          example: `const { enrichUserProfile } = useAuthStore()

// Apos buscar dados do Graph API
enrichUserProfile({
  photoUrl: "blob:...",
  jobTitle: "Gerente de Projetos",
  department: "Engenharia"
})`,
        },
      ],
      usage: `// Em qualquer componente
import { useAuthStore } from "@/lib/stores/auth-store"

export function MyComponent() {
  const { user, isAuthenticated, logout } = useAuthStore()
  
  if (!isAuthenticated) {
    return <LoginForm />
  }
  
  return (
    <div>
      <p>Ola, {user?.name}</p>
      <p>Tipo: {user?.userType}</p>
      <p>Supervisor: {user?.manager?.name}</p>
      <Button onClick={logout}>Sair</Button>
    </div>
  )
}`,
      integration: "O front-end usa localStorage para persistencia. Quando integrar com back-end, atualizar setAuth para tambem chamar POST /api/v1/auth/entra/create-session",
    },
    {
      name: "useWorkflowStore",
      file: "lib/stores/workflow-store.ts",
      description: "Gerencia compartilhamentos (criar, aprovar, rejeitar, listar)",
      icon: Database,
      color: "green",
      state: [
        { name: "uploads", type: "Upload[]", description: "Lista de todos os compartilhamentos" },
        { name: "isLoading", type: "boolean", description: "Se esta carregando" },
      ],
      methods: [
        {
          name: "addUpload",
          params: "(data: CreateUploadData)",
          description: "Cria novo compartilhamento (status: pending)",
          example: `const { addUpload } = useWorkflowStore()

const handleSubmit = async () => {
  await addUpload({
    senderName: user.name,
    senderEmail: user.email,
    recipientEmails: ["externo@empresa.com"],
    reason: "Documentos do projeto X",
    expirationHours: 48,
    files: selectedFiles.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type
    }))
  })
  toast.success("Compartilhamento criado!")
}`,
        },
        {
          name: "approveUpload",
          params: "(id: string, approverName: string, approverEmail: string)",
          description: "Aprova compartilhamento (supervisor)",
          example: `const { approveUpload } = useWorkflowStore()

const handleApprove = async (shareId: string) => {
  await approveUpload(shareId, user.name, user.email)
  toast.success("Aprovado com sucesso!")
  // Email sera enviado automaticamente ao destinatario
}`,
        },
        {
          name: "rejectUpload",
          params: "(id: string, approverName: string, approverEmail: string, rejectionReason: string)",
          description: "Rejeita compartilhamento (supervisor)",
          example: `const { rejectUpload } = useWorkflowStore()

const handleReject = async (shareId: string, reason: string) => {
  await rejectUpload(shareId, user.name, user.email, reason)
  toast.info("Compartilhamento rejeitado")
}`,
        },
        {
          name: "cancelUpload",
          params: "(id: string)",
          description: "Cancela compartilhamento pendente (remetente)",
          example: `const { cancelUpload } = useWorkflowStore()

const handleCancel = async (shareId: string) => {
  await cancelUpload(shareId)
  toast.info("Compartilhamento cancelado")
}`,
        },
        {
          name: "updateExpiration",
          params: "(id: string, newExpirationHours: number)",
          description: "Altera tempo de expiracao (supervisor)",
          example: `const { updateExpiration } = useWorkflowStore()

const handleExtend = async (shareId: string, hours: number) => {
  await updateExpiration(shareId, hours)
  toast.success(\`Expiracao alterada para \${hours}h\`)
}`,
        },
        {
          name: "getUploadsByStatus",
          params: "(status: string)",
          description: "Filtra compartilhamentos por status",
          example: `const { getUploadsByStatus } = useWorkflowStore()

// Listar pendentes do supervisor
const pendentes = getUploadsByStatus("pending")

// Listar aprovados
const aprovados = getUploadsByStatus("approved")`,
        },
        {
          name: "getUploadsBySender",
          params: "(email: string)",
          description: "Filtra compartilhamentos por remetente",
          example: `const { getUploadsBySender } = useWorkflowStore()

// Meus compartilhamentos
const meus = getUploadsBySender(user.email)`,
        },
      ],
      usage: `import { useWorkflowStore } from "@/lib/stores/workflow-store"

// Pagina do Supervisor
export function SupervisorPage() {
  const { uploads, approveUpload, rejectUpload } = useWorkflowStore()
  
  const pendentes = uploads.filter(u => u.status === "pending")
  
  return (
    <div>
      <h1>Pendentes: {pendentes.length}</h1>
      {pendentes.map(upload => (
        <Card key={upload.id}>
          <p>{upload.senderName} enviou {upload.files.length} arquivo(s)</p>
          <p>Para: {upload.recipientEmails.join(", ")}</p>
          <Button onClick={() => approveUpload(upload.id, user.name, user.email)}>
            Aprovar
          </Button>
        </Card>
      ))}
    </div>
  )
}`,
      integration: "Substituir chamadas locais por: POST /api/v1/shares/create, POST /api/v1/supervisor/{id}/approve, POST /api/v1/supervisor/{id}/reject",
    },
    {
      name: "useNotificationStore",
      file: "lib/stores/notification-store.ts",
      description: "Gerencia notificacoes in-app e contadores",
      icon: Bell,
      color: "amber",
      state: [
        { name: "notifications", type: "Notification[]", description: "Lista de notificacoes" },
        { name: "unreadCount", type: "number", description: "Contador de nao lidas" },
      ],
      methods: [
        {
          name: "addNotification",
          params: "(notification: Omit<Notification, 'id' | 'createdAt'>)",
          description: "Adiciona nova notificacao",
          example: `const { addNotification } = useNotificationStore()

addNotification({
  type: "share_approved",
  title: "Compartilhamento aprovado",
  message: "Seu arquivo foi aprovado por Maria Santos",
  read: false
})`,
        },
        {
          name: "markAsRead",
          params: "(id: string)",
          description: "Marca notificacao como lida",
          example: `const { markAsRead } = useNotificationStore()

const handleClick = (notificationId: string) => {
  markAsRead(notificationId)
  // Navegar para o item relacionado
}`,
        },
        {
          name: "markAllAsRead",
          params: "()",
          description: "Marca todas como lidas",
          example: `const { markAllAsRead } = useNotificationStore()

<Button onClick={markAllAsRead}>
  Marcar todas como lidas
</Button>`,
        },
        {
          name: "clearAll",
          params: "()",
          description: "Remove todas as notificacoes",
          example: `const { clearAll } = useNotificationStore()

<Button variant="destructive" onClick={clearAll}>
  Limpar todas
</Button>`,
        },
      ],
      usage: `import { useNotificationStore } from "@/lib/stores/notification-store"

// No header
export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotificationStore()
  
  return (
    <Popover>
      <PopoverTrigger>
        <Bell />
        {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
      </PopoverTrigger>
      <PopoverContent>
        {notifications.map(n => (
          <div key={n.id} onClick={() => markAsRead(n.id)}>
            <p>{n.title}</p>
            <p>{n.message}</p>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}`,
      integration: "Integrar com GET /api/v1/notifications e WebSocket para notificacoes em tempo real",
    },
    {
      name: "useAuditLogStore",
      file: "lib/stores/audit-log-store.ts",
      description: "Registra todas as acoes para auditoria e compliance",
      icon: FileText,
      color: "red",
      state: [
        { name: "logs", type: "AuditLog[]", description: "Lista de logs de auditoria" },
      ],
      methods: [
        {
          name: "addLog",
          params: "(log: Omit<AuditLog, 'id' | 'timestamp'>)",
          description: "Registra nova acao de auditoria",
          example: `const { addLog } = useAuditLogStore()

// Registrar login
addLog({
  action: "login",
  level: "success",
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.userType
  },
  details: {
    description: "Login via Microsoft Entra ID",
    metadata: {
      authMethod: "entra-id",
      ipAddress: "10.0.0.1"
    }
  }
})

// Registrar upload
addLog({
  action: "upload",
  level: "success",
  user: { ... },
  details: {
    description: "Compartilhamento criado",
    shareId: "share-123",
    metadata: {
      filesCount: 3,
      totalSize: 15000000
    }
  }
})`,
        },
        {
          name: "getLogsByAction",
          params: "(action: string)",
          description: "Filtra logs por tipo de acao",
          example: `const { getLogsByAction } = useAuditLogStore()

const loginLogs = getLogsByAction("login")
const uploadLogs = getLogsByAction("upload")`,
        },
        {
          name: "getLogsByDateRange",
          params: "(startDate: Date, endDate: Date)",
          description: "Filtra logs por periodo",
          example: `const { getLogsByDateRange } = useAuditLogStore()

const hoje = new Date()
const semanaPassada = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)
const logsUltimaSemana = getLogsByDateRange(semanaPassada, hoje)`,
        },
        {
          name: "exportLogs",
          params: "(format: 'json' | 'csv')",
          description: "Exporta logs para arquivo",
          example: `const { exportLogs } = useAuditLogStore()

<Button onClick={() => exportLogs("csv")}>
  Exportar CSV
</Button>`,
        },
      ],
      usage: `// O store e usado automaticamente pelos outros componentes
// Exemplo: ao aprovar um compartilhamento

const handleApprove = async (shareId: string) => {
  await approveUpload(shareId, user.name, user.email)
  
  // Log automatico
  addLog({
    action: "approve",
    level: "success",
    user: { id: user.id, name: user.name, email: user.email, type: "supervisor" },
    details: {
      description: "Compartilhamento aprovado",
      shareId,
      metadata: { approvedAt: new Date().toISOString() }
    }
  })
}`,
      integration: "Enviar logs para POST /api/v1/audit/logs. Buscar historico de GET /api/v1/audit/logs",
    },
    {
      name: "useExternalUserStore",
      file: "lib/stores/external-user-store.ts",
      description: "Gerencia sessao do usuario externo (OTP)",
      icon: Shield,
      color: "purple",
      state: [
        { name: "email", type: "string | null", description: "Email do usuario externo" },
        { name: "isVerified", type: "boolean", description: "Se passou pela verificacao OTP" },
        { name: "sessionExpiry", type: "Date | null", description: "Quando a sessao expira" },
        { name: "availableShares", type: "Share[]", description: "Compartilhamentos disponiveis" },
      ],
      methods: [
        {
          name: "setEmail",
          params: "(email: string)",
          description: "Define email do usuario externo",
          example: `const { setEmail } = useExternalUserStore()

const handleEmailSubmit = (email: string) => {
  setEmail(email)
  // Enviar OTP
}`,
        },
        {
          name: "setVerified",
          params: "(verified: boolean)",
          description: "Marca como verificado apos OTP correto",
          example: `const { setVerified } = useExternalUserStore()

const handleOtpSuccess = () => {
  setVerified(true)
  router.push("/download")
}`,
        },
        {
          name: "setAvailableShares",
          params: "(shares: Share[])",
          description: "Define compartilhamentos disponiveis",
          example: `const { setAvailableShares } = useExternalUserStore()

// Apos buscar do backend
const shares = await fetchShares(email)
setAvailableShares(shares)`,
        },
        {
          name: "logout",
          params: "()",
          description: "Encerra sessao do usuario externo",
          example: `const { logout } = useExternalUserStore()

const handleLogout = () => {
  logout()
  router.push("/external-verify")
}`,
        },
      ],
      usage: `import { useExternalUserStore } from "@/lib/stores/external-user-store"

// Pagina de download externo
export function DownloadPage() {
  const { email, isVerified, availableShares, logout } = useExternalUserStore()
  
  if (!isVerified) {
    return <Navigate to="/external-verify" />
  }
  
  return (
    <div>
      <p>Bem-vindo, {email}</p>
      <h2>Arquivos disponiveis:</h2>
      {availableShares.map(share => (
        <DownloadCard key={share.id} share={share} />
      ))}
      <Button onClick={logout}>Sair</Button>
    </div>
  )
}`,
      integration: "Integrar com POST /api/v1/external/verify e POST /api/v1/external/authenticate",
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
      green: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
      amber: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
      red: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
      purple: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Stores Zustand - Como Usar</h1>
          <p className="text-slate-600">
            Todas as stores do sistema com estados, metodos e como integrar com a API do back-end
          </p>
        </div>

        {/* Resumo */}
        <Card className="mb-8 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-800">O que e Zustand?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700 space-y-2">
            <p>Zustand e uma biblioteca de gerenciamento de estado para React, simples e sem boilerplate.</p>
            <p>Neste projeto, usamos Zustand para:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Persistir dados</strong> entre paginas (usuario logado, compartilhamentos)</li>
              <li><strong>Compartilhar estado</strong> entre componentes sem prop drilling</li>
              <li><strong>Simular backend</strong> durante desenvolvimento (depois sera substituido por API calls)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Stores */}
        <div className="space-y-6">
          {stores.map((store) => {
            const Icon = store.icon
            const colors = getColorClasses(store.color)
            const isExpanded = expandedStore === store.name

            return (
              <Card key={store.name} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedStore(isExpanded ? null : store.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${colors.bg}`}>
                        <Icon className={`h-6 w-6 ${colors.text}`} />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <code className={`${colors.bg} ${colors.text} px-2 py-0.5 rounded text-base`}>
                            {store.name}
                          </code>
                        </CardTitle>
                        <CardDescription>{store.description}</CardDescription>
                        <p className="text-xs text-slate-400 font-mono mt-1">{store.file}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t space-y-6 pt-6">
                    {/* Estado */}
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-3">Estado (State)</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium">Propriedade</th>
                              <th className="px-4 py-2 text-left font-medium">Tipo</th>
                              <th className="px-4 py-2 text-left font-medium">Descricao</th>
                            </tr>
                          </thead>
                          <tbody>
                            {store.state.map((item) => (
                              <tr key={item.name} className="border-t">
                                <td className="px-4 py-2 font-mono text-blue-600">{item.name}</td>
                                <td className="px-4 py-2 font-mono text-xs text-slate-600">{item.type}</td>
                                <td className="px-4 py-2 text-slate-600">{item.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Metodos */}
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-3">Metodos (Actions)</h4>
                      <div className="space-y-4">
                        {store.methods.map((method) => (
                          <div key={method.name} className="border rounded-lg p-4 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-2">
                              <code className="text-sm bg-slate-200 px-2 py-1 rounded">
                                {method.name}{method.params}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(method.example, `${store.name}-${method.name}`)}
                              >
                                {copiedId === `${store.name}-${method.name}` ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{method.description}</p>
                            <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-x-auto">
                              <code>{method.example}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exemplo de Uso */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-700">Exemplo Completo</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(store.usage, `${store.name}-usage`)}
                        >
                          {copiedId === `${store.name}-usage` ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{store.usage}</code>
                      </pre>
                    </div>

                    {/* Integracao com Backend */}
                    <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                      <h4 className={`font-semibold ${colors.text} mb-2`}>Integracao com Back-End</h4>
                      <p className="text-sm text-slate-700">{store.integration}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
