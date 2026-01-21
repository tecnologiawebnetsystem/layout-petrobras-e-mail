"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, Monitor, Copy, Check, ChevronDown, ChevronRight, Search } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

export default function FrontendEndpointsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const searchParams = useSearchParams()

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleEndpoint = (id: string) => {
    const newExpanded = new Set(expandedEndpoints)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedEndpoints(newExpanded)
  }

  const endpoints = {
    autenticacao: [
      {
        id: "auth-entra-validate",
        method: "POST",
        path: "/api/v1/auth/entra/validate-token",
        summary: "Validar Token Microsoft Entra ID",
        description: "Valida o token JWT do Microsoft Entra ID e retorna dados do usuario. Usado apos login SSO.",
        whenToUse: "Chamar imediatamente apos o usuario fazer login pelo Entra ID para validar o token no backend.",
        requestBody: {
          access_token: "string - Token JWT obtido do MSAL",
          id_token: "string (opcional) - ID Token do MSAL"
        },
        requestExample: `{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...",
  "id_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs..."
}`,
        responseBody: {
          success: "boolean - Se a validacao foi bem sucedida",
          user: "object - Dados do usuario",
          session_token: "string - Token de sessao do backend"
        },
        responseExample: `{
  "success": true,
  "user": {
    "id": "user_abc123",
    "email": "joao.silva@petrobras.com.br",
    "name": "Joao Silva",
    "user_type": "internal",
    "job_title": "Analista de Sistemas",
    "department": "TI",
    "manager": {
      "id": "user_xyz789",
      "name": "Maria Santos",
      "email": "maria.santos@petrobras.com.br"
    }
  },
  "session_token": "sess_abc123xyz..."
}`,
        errors: [
          { code: 401, message: "Token invalido ou expirado" },
          { code: 403, message: "Usuario nao autorizado (dominio invalido)" }
        ]
      },
      {
        id: "auth-otp-generate",
        method: "POST",
        path: "/api/v1/otp/generate",
        summary: "Gerar Codigo OTP para Usuario Externo",
        description: "Gera e envia codigo OTP de 6 digitos por email. Valido por 3 minutos.",
        whenToUse: "Quando usuario externo informa seu email na pagina de verificacao para acessar arquivos compartilhados.",
        requestBody: {
          email: "string - Email do usuario externo"
        },
        requestExample: `{
  "email": "cliente@empresa.com"
}`,
        responseBody: {
          success: "boolean",
          message: "string - Mensagem de confirmacao",
          expires_in_seconds: "number - Tempo de expiracao em segundos"
        },
        responseExample: `{
  "success": true,
  "message": "Codigo enviado para cliente@empresa.com",
  "expires_in_seconds": 180
}`,
        errors: [
          { code: 400, message: "Email invalido" },
          { code: 404, message: "Email nao tem compartilhamentos pendentes" },
          { code: 429, message: "Aguarde 30 segundos para reenviar" }
        ]
      },
      {
        id: "auth-otp-verify",
        method: "POST",
        path: "/api/v1/otp/verify",
        summary: "Verificar Codigo OTP",
        description: "Valida o codigo OTP informado pelo usuario externo.",
        whenToUse: "Quando usuario externo digita o codigo de 6 digitos recebido por email.",
        requestBody: {
          email: "string - Email do usuario",
          code: "string - Codigo OTP de 6 digitos"
        },
        requestExample: `{
  "email": "cliente@empresa.com",
  "code": "482916"
}`,
        responseBody: {
          success: "boolean",
          session_token: "string - Token de sessao para download",
          shares_available: "number - Quantidade de compartilhamentos"
        },
        responseExample: `{
  "success": true,
  "session_token": "ext_sess_abc123...",
  "shares_available": 2
}`,
        errors: [
          { code: 400, message: "Codigo invalido" },
          { code: 401, message: "Codigo expirado" },
          { code: 429, message: "Maximo de tentativas excedido" }
        ]
      }
    ],
    compartilhamentos: [
      {
        id: "shares-create",
        method: "POST",
        path: "/api/v1/shares",
        summary: "Criar Novo Compartilhamento",
        description: "Cria um novo compartilhamento de arquivos para destinatario externo. Requer aprovacao do supervisor.",
        whenToUse: "Quando usuario interno submete o formulario de upload com arquivos e destinatario.",
        headers: {
          Authorization: "Bearer {session_token}"
        },
        requestBody: {
          recipient_email: "string - Email do destinatario externo",
          description: "string - Descricao do compartilhamento",
          expiration_hours: "number - Horas de validade (24, 48 ou 72)",
          files: "array - Lista de arquivos (enviados via multipart)"
        },
        requestExample: `{
  "recipient_email": "cliente@empresa.com",
  "description": "Relatorios financeiros Q4 2025",
  "expiration_hours": 72,
  "files": [
    {
      "name": "relatorio_q4.pdf",
      "size": 2048576,
      "type": "application/pdf"
    }
  ]
}`,
        responseBody: {
          success: "boolean",
          share: "object - Dados do compartilhamento criado"
        },
        responseExample: `{
  "success": true,
  "share": {
    "id": "share_abc123",
    "status": "pending",
    "recipient_email": "cliente@empresa.com",
    "description": "Relatorios financeiros Q4 2025",
    "expiration_hours": 72,
    "created_at": "2026-01-21T10:30:00Z",
    "sender": {
      "id": "user_xyz",
      "name": "Joao Silva",
      "email": "joao.silva@petrobras.com.br"
    },
    "approver": {
      "id": "user_sup",
      "name": "Maria Santos",
      "email": "maria.santos@petrobras.com.br"
    },
    "files": [
      {
        "id": "file_001",
        "name": "relatorio_q4.pdf",
        "size": "2.0 MB",
        "type": "PDF"
      }
    ]
  }
}`,
        errors: [
          { code: 400, message: "Dados invalidos ou arquivo bloqueado" },
          { code: 401, message: "Nao autenticado" },
          { code: 413, message: "Arquivo muito grande (max 500MB)" }
        ]
      },
      {
        id: "shares-my-list",
        method: "GET",
        path: "/api/v1/shares/my-shares",
        summary: "Listar Meus Compartilhamentos",
        description: "Retorna todos os compartilhamentos criados pelo usuario logado.",
        whenToUse: "Para exibir a lista 'Meus Compartilhamentos' do usuario interno.",
        headers: {
          Authorization: "Bearer {session_token}"
        },
        queryParams: {
          status: "string (opcional) - Filtrar por status: pending, approved, rejected, cancelled",
          page: "number (opcional) - Pagina (default: 1)",
          limit: "number (opcional) - Itens por pagina (default: 20)"
        },
        responseExample: `{
  "success": true,
  "shares": [
    {
      "id": "share_abc123",
      "status": "approved",
      "recipient_email": "cliente@empresa.com",
      "description": "Relatorios Q4",
      "created_at": "2026-01-20T10:00:00Z",
      "approved_at": "2026-01-20T14:30:00Z",
      "expires_at": "2026-01-23T14:30:00Z",
      "files_count": 2,
      "download_count": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}`,
        errors: [
          { code: 401, message: "Nao autenticado" }
        ]
      },
      {
        id: "shares-cancel",
        method: "PATCH",
        path: "/api/v1/shares/{share_id}/cancel",
        summary: "Cancelar Compartilhamento Pendente",
        description: "Cancela um compartilhamento que ainda esta pendente de aprovacao.",
        whenToUse: "Quando usuario clica em 'Cancelar' em um compartilhamento pendente.",
        headers: {
          Authorization: "Bearer {session_token}"
        },
        pathParams: {
          share_id: "string - ID do compartilhamento"
        },
        responseExample: `{
  "success": true,
  "message": "Compartilhamento cancelado",
  "share": {
    "id": "share_abc123",
    "status": "cancelled",
    "cancelled_at": "2026-01-21T11:00:00Z"
  }
}`,
        errors: [
          { code: 400, message: "Compartilhamento ja foi aprovado/rejeitado" },
          { code: 403, message: "Voce nao e o dono deste compartilhamento" },
          { code: 404, message: "Compartilhamento nao encontrado" }
        ]
      }
    ],
    supervisor: [
      {
        id: "supervisor-pending",
        method: "GET",
        path: "/api/v1/supervisor/pending",
        summary: "Listar Compartilhamentos Pendentes",
        description: "Retorna compartilhamentos aguardando aprovacao do supervisor logado.",
        whenToUse: "Para exibir a aba 'Aprovacoes' na pagina do supervisor.",
        headers: {
          Authorization: "Bearer {session_token}"
        },
        responseExample: `{
  "success": true,
  "pending_count": 3,
  "shares": [
    {
      "id": "share_abc123",
      "status": "pending",
      "sender": {
        "id": "user_xyz",
        "name": "Joao Silva",
        "email": "joao.silva@petrobras.com.br",
        "department": "Financeiro"
      },
      "recipient_email": "cliente@empresa.com",
      "description": "Relatorios Q4 2025",
      "expiration_hours": 72,
      "created_at": "2026-01-21T09:00:00Z",
      "files": [
        {
          "id": "file_001",
          "name": "relatorio.pdf",
          "size": "2.5 MB",
          "type": "PDF"
        }
      ]
    }
  ]
}`,
        errors: [
          { code: 401, message: "Nao autenticado" },
          { code: 403, message: "Usuario nao e supervisor" }
        ]
      },
      {
        id: "supervisor-approve",
        method: "POST",
        path: "/api/v1/supervisor/{share_id}/approve",
        summary: "Aprovar Compartilhamento",
        description: "Aprova um compartilhamento pendente. Dispara email para destinatario.",
        whenToUse: "Quando supervisor clica em 'Aprovar' em um compartilhamento.",
        headers: {
          Authorization: "Bearer {session_token}"
        },
        pathParams: {
          share_id: "string - ID do compartilhamento"
        },
        requestBody: {
          comments: "string (opcional) - Comentarios do supervisor"
        },
        requestExample: `{
  "comments": "Aprovado conforme solicitacao"
}`,
        responseExample: `{
  "success": true,
  "message": "Compartilhamento aprovado",
  "share": {
    "id": "share_abc123",
    "status": "approved",
    "approved_at": "2026-01-21T14:30:00Z",
    "approved_by": {
      "id": "user_sup",
      "name": "Maria Santos"
    },
    "expires_at": "2026-01-24T14:30:00Z",
    "download_link": "https://transfer.petrobras.com.br/download/abc123"
  },
  "notifications_sent": {
    "recipient": true,
    "sender": true
  }
}`,
        errors: [
          { code: 400, message: "Compartilhamento ja processado" },
          { code: 403, message: "Voce nao e o aprovador" },
          { code: 404, message: "Compartilhamento nao encontrado" }
        ]
      },
      {
        id: "supervisor-reject",
        method: "POST",
        path: "/api/v1/supervisor/{share_id}/reject",
        summary: "Rejeitar Compartilhamento",
        description: "Rejeita um compartilhamento pendente. Notifica o remetente.",
        whenToUse: "Quando supervisor clica em 'Rejeitar' e informa o motivo.",
        headers: {
          Authorization: "Bearer {session_token}"
        },
        pathParams: {
          share_id: "string - ID do compartilhamento"
        },
        requestBody: {
          reason: "string (obrigatorio) - Motivo da rejeicao"
        },
        requestExample: `{
  "reason": "Documentos confidenciais nao podem ser compartilhados externamente"
}`,
        responseExample: `{
  "success": true,
  "message": "Compartilhamento rejeitado",
  "share": {
    "id": "share_abc123",
    "status": "rejected",
    "rejected_at": "2026-01-21T14:30:00Z",
    "rejected_by": {
      "id": "user_sup",
      "name": "Maria Santos"
    },
    "rejection_reason": "Documentos confidenciais..."
  }
}`,
        errors: [
          { code: 400, message: "Motivo e obrigatorio" },
          { code: 403, message: "Voce nao e o aprovador" }
        ]
      },
      {
        id: "supervisor-stats",
        method: "GET",
        path: "/api/v1/supervisor/statistics",
        summary: "Estatisticas do Supervisor",
        description: "Retorna estatisticas de compartilhamentos para o dashboard.",
        whenToUse: "Para exibir os cards de estatisticas na pagina do supervisor.",
        headers: {
          Authorization: "Bearer {session_token}"
        },
        responseExample: `{
  "success": true,
  "statistics": {
    "pending_count": 5,
    "approved_today": 12,
    "rejected_today": 2,
    "total_approved": 156,
    "total_rejected": 23,
    "avg_approval_time_hours": 2.5
  }
}`
      }
    ],
    externo: [
      {
        id: "external-shares",
        method: "GET",
        path: "/api/v1/external/shares",
        summary: "Listar Compartilhamentos Disponiveis",
        description: "Retorna compartilhamentos aprovados disponiveis para o usuario externo.",
        whenToUse: "Apos autenticacao OTP, para exibir arquivos disponiveis para download.",
        headers: {
          Authorization: "Bearer {external_session_token}"
        },
        responseExample: `{
  "success": true,
  "shares": [
    {
      "id": "share_abc123",
      "sender": {
        "name": "Joao Silva",
        "email": "joao.silva@petrobras.com.br",
        "department": "Financeiro"
      },
      "description": "Relatorios Q4 2025",
      "created_at": "2026-01-20T10:00:00Z",
      "expires_at": "2026-01-23T14:30:00Z",
      "terms_accepted": false,
      "files": [
        {
          "id": "file_001",
          "name": "relatorio_q4.pdf",
          "size": "2.5 MB",
          "type": "PDF",
          "downloaded": false
        }
      ]
    }
  ]
}`,
        errors: [
          { code: 401, message: "Sessao expirada" }
        ]
      },
      {
        id: "external-accept-terms",
        method: "POST",
        path: "/api/v1/external/shares/{share_id}/accept-terms",
        summary: "Aceitar Termos de Uso",
        description: "Usuario externo aceita os termos antes de baixar arquivos.",
        whenToUse: "Quando usuario externo clica em 'Aceito os termos' no modal.",
        headers: {
          Authorization: "Bearer {external_session_token}"
        },
        requestBody: {
          accepted: "boolean - Deve ser true",
          ip_address: "string (opcional) - IP do usuario"
        },
        requestExample: `{
  "accepted": true
}`,
        responseExample: `{
  "success": true,
  "message": "Termos aceitos",
  "accepted_at": "2026-01-21T15:00:00Z"
}`
      },
      {
        id: "external-download",
        method: "GET",
        path: "/api/v1/external/files/{file_id}/download",
        summary: "Baixar Arquivo",
        description: "Gera URL assinada para download do arquivo.",
        whenToUse: "Quando usuario externo clica em 'Baixar' em um arquivo.",
        headers: {
          Authorization: "Bearer {external_session_token}"
        },
        pathParams: {
          file_id: "string - ID do arquivo"
        },
        responseExample: `{
  "success": true,
  "download_url": "https://s3.amazonaws.com/bucket/file.pdf?signature=...",
  "expires_in_seconds": 3600,
  "file": {
    "name": "relatorio_q4.pdf",
    "size": "2.5 MB",
    "type": "PDF"
  }
}`,
        errors: [
          { code: 401, message: "Sessao expirada" },
          { code: 403, message: "Termos nao aceitos" },
          { code: 404, message: "Arquivo nao encontrado" },
          { code: 410, message: "Compartilhamento expirado" }
        ]
      }
    ],
    emails: [
      {
        id: "email-send-supervisor",
        method: "POST",
        path: "/api/v1/emails/send-supervisor-notification",
        summary: "Notificar Supervisor",
        description: "Envia email ao supervisor sobre novo compartilhamento pendente.",
        whenToUse: "Chamado automaticamente pelo backend apos criar compartilhamento.",
        requestBody: {
          share_id: "string - ID do compartilhamento",
          supervisor_email: "string - Email do supervisor"
        },
        responseExample: `{
  "success": true,
  "message_id": "msg_abc123",
  "sent_to": "maria.santos@petrobras.com.br"
}`
      },
      {
        id: "email-send-recipient",
        method: "POST",
        path: "/api/v1/emails/send-recipient-notification",
        summary: "Notificar Destinatario",
        description: "Envia email ao destinatario externo com link de download.",
        whenToUse: "Chamado automaticamente apos supervisor aprovar compartilhamento.",
        requestBody: {
          share_id: "string - ID do compartilhamento"
        },
        responseExample: `{
  "success": true,
  "message_id": "msg_xyz789",
  "sent_to": "cliente@empresa.com",
  "download_link": "https://transfer.petrobras.com.br/download/abc123"
}`
      }
    ],
    auditoria: [
      {
        id: "audit-log",
        method: "POST",
        path: "/api/v1/audit/logs",
        summary: "Registrar Log de Auditoria",
        description: "Registra acao no log de auditoria.",
        whenToUse: "Chamado pelo frontend em acoes importantes (login, logout, download, etc).",
        requestBody: {
          action: "string - Tipo da acao (login, logout, download, upload, approve, reject)",
          level: "string - Nivel (info, warning, error, success)",
          user_id: "string - ID do usuario",
          details: "object - Detalhes adicionais"
        },
        requestExample: `{
  "action": "download",
  "level": "success",
  "user_id": "user_ext_123",
  "details": {
    "file_id": "file_001",
    "file_name": "relatorio.pdf",
    "share_id": "share_abc123",
    "ip_address": "200.150.100.50"
  }
}`,
        responseExample: `{
  "success": true,
  "log_id": "log_abc123",
  "timestamp": "2026-01-21T15:30:00Z"
}`
      },
      {
        id: "audit-list",
        method: "GET",
        path: "/api/v1/audit/logs",
        summary: "Listar Logs de Auditoria",
        description: "Retorna logs de auditoria com filtros.",
        whenToUse: "Para exibir historico de acoes e relatorios.",
        headers: {
          Authorization: "Bearer {session_token}"
        },
        queryParams: {
          action: "string (opcional) - Filtrar por tipo de acao",
          user_id: "string (opcional) - Filtrar por usuario",
          start_date: "string (opcional) - Data inicial (ISO 8601)",
          end_date: "string (opcional) - Data final (ISO 8601)",
          page: "number (opcional) - Pagina",
          limit: "number (opcional) - Itens por pagina"
        },
        responseExample: `{
  "success": true,
  "logs": [
    {
      "id": "log_001",
      "action": "download",
      "level": "success",
      "timestamp": "2026-01-21T15:30:00Z",
      "user": {
        "id": "user_ext_123",
        "email": "cliente@empresa.com",
        "type": "external"
      },
      "details": {
        "file_name": "relatorio.pdf",
        "ip_address": "200.150.100.50"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250
  }
}`
      }
    ]
  }

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

  const filterEndpoints = (endpointsList: typeof endpoints.autenticacao) => {
    if (!searchQuery) return endpointsList
    const query = searchQuery.toLowerCase()
    return endpointsList.filter(e => 
      e.summary.toLowerCase().includes(query) ||
      e.path.toLowerCase().includes(query) ||
      e.description.toLowerCase().includes(query)
    )
  }

  const EndpointCard = ({ endpoint }: { endpoint: typeof endpoints.autenticacao[0] }) => {
    const isExpanded = expandedEndpoints.has(endpoint.id)
    
    return (
      <Card className="border-l-4" style={{ borderLeftColor: endpoint.method === "GET" ? "#3b82f6" : endpoint.method === "POST" ? "#22c55e" : endpoint.method === "PATCH" ? "#a855f7" : "#f59e0b" }}>
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleEndpoint(endpoint.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={`${getMethodColor(endpoint.method)} text-white font-mono`}>
                {endpoint.method}
              </Badge>
              <code className="text-sm bg-muted px-2 py-1 rounded">{endpoint.path}</code>
            </div>
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </div>
          <CardTitle className="text-lg mt-2">{endpoint.summary}</CardTitle>
          <p className="text-sm text-muted-foreground">{endpoint.description}</p>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-6 border-t pt-6">
            {/* Quando Usar */}
            {endpoint.whenToUse && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Quando usar:</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">{endpoint.whenToUse}</p>
              </div>
            )}

            {/* Headers */}
            {endpoint.headers && (
              <div>
                <h4 className="font-semibold mb-2">Headers</h4>
                <div className="bg-muted rounded-lg p-4">
                  {Object.entries(endpoint.headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-sm font-mono">
                      <span className="text-purple-600 dark:text-purple-400">{key}:</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Path Params */}
            {endpoint.pathParams && (
              <div>
                <h4 className="font-semibold mb-2">Path Parameters</h4>
                <div className="space-y-2">
                  {Object.entries(endpoint.pathParams).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-sm">
                      <code className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">{`{${key}}`}</code>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Query Params */}
            {endpoint.queryParams && (
              <div>
                <h4 className="font-semibold mb-2">Query Parameters</h4>
                <div className="space-y-2">
                  {Object.entries(endpoint.queryParams).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-sm">
                      <code className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded">?{key}</code>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Body */}
            {endpoint.requestBody && (
              <div>
                <h4 className="font-semibold mb-2">Request Body</h4>
                <div className="space-y-2 mb-4">
                  {Object.entries(endpoint.requestBody).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-sm">
                      <code className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">{key}</code>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
                {endpoint.requestExample && (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => copyToClipboard(endpoint.requestExample!, `req-${endpoint.id}`)}
                    >
                      {copiedId === `req-${endpoint.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm">
                      <code>{endpoint.requestExample}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Response Body */}
            {endpoint.responseBody && (
              <div>
                <h4 className="font-semibold mb-2">Response Body</h4>
                <div className="space-y-2 mb-4">
                  {Object.entries(endpoint.responseBody).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-sm">
                      <code className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">{key}</code>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response Example */}
            {endpoint.responseExample && (
              <div>
                <h4 className="font-semibold mb-2">Response Example</h4>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => copyToClipboard(endpoint.responseExample, `res-${endpoint.id}`)}
                  >
                    {copiedId === `res-${endpoint.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm">
                    <code>{endpoint.responseExample}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Errors */}
            {endpoint.errors && endpoint.errors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Possiveis Erros</h4>
                <div className="space-y-2">
                  {endpoint.errors.map((error, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <Badge variant="destructive">{error.code}</Badge>
                      <span className="text-red-700 dark:text-red-300">{error.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  return (
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
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
              <Monitor className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Front-End - Endpoints Necessarios</h1>
              <p className="text-muted-foreground">Todos os endpoints que o front-end precisa chamar no back-end</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar endpoint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Suspense fallback={null}>
          <Tabs defaultValue="autenticacao" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
              <TabsTrigger value="autenticacao" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                Autenticacao ({endpoints.autenticacao.length})
              </TabsTrigger>
              <TabsTrigger value="compartilhamentos" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                Compartilhamentos ({endpoints.compartilhamentos.length})
              </TabsTrigger>
              <TabsTrigger value="supervisor" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
                Supervisor ({endpoints.supervisor.length})
              </TabsTrigger>
              <TabsTrigger value="externo" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                Usuario Externo ({endpoints.externo.length})
              </TabsTrigger>
              <TabsTrigger value="emails" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
                Emails ({endpoints.emails.length})
              </TabsTrigger>
              <TabsTrigger value="auditoria" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-700">
                Auditoria ({endpoints.auditoria.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="autenticacao" className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Autenticacao</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Endpoints para autenticacao de usuarios internos (Entra ID) e externos (OTP por email).
                </p>
              </div>
              {filterEndpoints(endpoints.autenticacao).map(endpoint => (
                <EndpointCard key={endpoint.id} endpoint={endpoint} />
              ))}
            </TabsContent>

            <TabsContent value="compartilhamentos" className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 mb-6">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">Compartilhamentos</h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Endpoints para criar, listar e gerenciar compartilhamentos de arquivos.
                </p>
              </div>
              {filterEndpoints(endpoints.compartilhamentos).map(endpoint => (
                <EndpointCard key={endpoint.id} endpoint={endpoint} />
              ))}
            </TabsContent>

            <TabsContent value="supervisor" className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 mb-6">
                <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Supervisor</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Endpoints para aprovacao, rejeicao e gestao de compartilhamentos pelo supervisor.
                </p>
              </div>
              {filterEndpoints(endpoints.supervisor).map(endpoint => (
                <EndpointCard key={endpoint.id} endpoint={endpoint} />
              ))}
            </TabsContent>

            <TabsContent value="externo" className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800 mb-6">
                <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Usuario Externo</h3>
                <p className="text-sm text-purple-700 dark:text-purple-400">
                  Endpoints para usuarios externos acessarem e baixarem arquivos compartilhados.
                </p>
              </div>
              {filterEndpoints(endpoints.externo).map(endpoint => (
                <EndpointCard key={endpoint.id} endpoint={endpoint} />
              ))}
            </TabsContent>

            <TabsContent value="emails" className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 mb-6">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">Emails</h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Endpoints para envio de notificacoes por email (geralmente chamados pelo backend automaticamente).
                </p>
              </div>
              {filterEndpoints(endpoints.emails).map(endpoint => (
                <EndpointCard key={endpoint.id} endpoint={endpoint} />
              ))}
            </TabsContent>

            <TabsContent value="auditoria" className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
                <h3 className="font-semibold text-slate-800 dark:text-slate-300 mb-2">Auditoria</h3>
                <p className="text-sm text-slate-700 dark:text-slate-400">
                  Endpoints para registro e consulta de logs de auditoria.
                </p>
              </div>
              {filterEndpoints(endpoints.auditoria).map(endpoint => (
                <EndpointCard key={endpoint.id} endpoint={endpoint} />
              ))}
            </TabsContent>
          </Tabs>
        </Suspense>
      </div>
    </div>
  )
}
