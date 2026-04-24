"use client"

import Link from "next/link"
import { Home, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Copy, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"

function CodeBlock({ code, title }: { code: string; title: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-slate-800 text-white px-4 py-2 rounded-t-lg">
        <span className="text-sm font-medium">{title}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <pre className="bg-slate-900 text-green-400 p-4 rounded-b-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function EndpointContract({
  method,
  path,
  title,
  description,
  frontendSends,
  backendReturns,
  frontendSendsCode,
  backendReturnsCode,
  notes,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE"
  path: string
  title: string
  description: string
  frontendSends: string[]
  backendReturns: string[]
  frontendSendsCode: string
  backendReturnsCode: string
  notes?: string[]
}) {
  const methodColors = {
    GET: "bg-blue-500",
    POST: "bg-green-500",
    PATCH: "bg-yellow-500",
    DELETE: "bg-red-500",
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-slate-50 border-b">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={`${methodColors[method]} text-white font-mono`}>{method}</Badge>
          <code className="text-sm font-mono text-slate-700 bg-white px-2 py-1 rounded border">{path}</code>
        </div>
        <CardTitle className="text-lg mt-2">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* O que o Front-End envia */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-blue-700 font-semibold">
            <ArrowRight className="w-5 h-5" />
            <span>O que o FRONT-END envia</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 ml-2">
            {frontendSends.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <CodeBlock code={frontendSendsCode} title="Request (Front-End envia)" />
        </div>

        {/* O que o Back-End retorna */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <ArrowLeft className="w-5 h-5" />
            <span>O que o BACK-END retorna</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 ml-2">
            {backendReturns.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <CodeBlock code={backendReturnsCode} title="Response (Back-End retorna)" />
        </div>

        {/* Notas importantes */}
        {notes && notes.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
              <AlertCircle className="w-4 h-4" />
              <span>Notas Importantes</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
              {notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ContratosAPIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <Link
          href="/wiki-dev"
          className="inline-flex items-center gap-2 text-green-700 hover:text-green-900 mb-6 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span className="text-sm font-medium">Voltar para Wiki-Dev</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent mb-2">
            Contratos Front-End / Back-End
          </h1>
          <p className="text-gray-600 text-lg">
            Documentacao clara: o que o front-end envia e o que recebe do back-end em cada endpoint
          </p>
        </div>

        {/* Resumo */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Como usar esta documentacao</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>Cada endpoint mostra exatamente o JSON que o front-end deve enviar</li>
                  <li>E exatamente o JSON que o back-end vai retornar</li>
                  <li>Use o botao Copiar para copiar os exemplos direto no seu codigo</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Categorias */}
        <Tabs defaultValue="auth" className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 bg-white p-2 rounded-lg shadow-sm h-auto">
            <TabsTrigger value="auth">1. Autenticacao</TabsTrigger>
            <TabsTrigger value="upload">2. Upload/Compartilhar</TabsTrigger>
            <TabsTrigger value="supervisor">3. Supervisor</TabsTrigger>
            <TabsTrigger value="external">4. Usuario Externo</TabsTrigger>
            <TabsTrigger value="email">5. Emails</TabsTrigger>
          </TabsList>

          {/* 1. AUTENTICACAO */}
          <TabsContent value="auth" className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Fluxo de Autenticacao</h3>
              <p className="text-sm text-blue-800">
                Usuario interno: Login via Microsoft Entra ID (SSO). Usuario externo: Validacao por codigo OTP enviado por email.
              </p>
            </div>

            <EndpointContract
              method="POST"
              path="/api/v1/auth/entra-callback"
              title="Callback do Entra ID (Usuario Interno)"
              description="Apos login no Microsoft, o front-end envia o token recebido para validacao no back-end"
              frontendSends={[
                "accessToken: Token de acesso recebido do Microsoft Entra ID",
                "idToken: Token de identidade com claims do usuario",
                "account: Dados da conta Microsoft (email, nome, tenant)",
              ]}
              backendReturns={[
                "user: Dados completos do usuario (id, nome, email, cargo, departamento)",
                "manager: Dados do supervisor direto (se existir)",
                "sessionToken: Token de sessao para usar nas proximas requisicoes",
                "userType: Tipo do usuario (internal, supervisor, external)",
              ]}
              frontendSendsCode={`// Front-End envia (POST /api/v1/auth/entra-callback)
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "account": {
    "homeAccountId": "011a34a0-fd81-46c4-8104-b9c266ca6ce8",
    "localAccountId": "011a34a0-fd81-46c4-8104-b9c266ca6ce8",
    "username": "kleber.goncalves@petrobras.com.br",
    "name": "Kleber de Oliveira Goncalves",
    "tenantId": ""
  }
}`}
              backendReturnsCode={`// Back-End retorna (200 OK)
{
  "user": {
    "id": 123,
    "email": "kleber.goncalves@petrobras.com.br",
    "name": "Kleber de Oliveira Goncalves",
    "employeeId": "12345",
    "jobTitle": "Analista de Sistemas",
    "department": "TI - Desenvolvimento",
    "userType": "internal"
  },
  "manager": {
    "id": 456,
    "name": "Sabrina Araujo dos Santos",
    "email": "sabrina.araujo@petrobras.com.br",
    "jobTitle": "Gerente Setorial"
  },
  "sessionToken": "sess_abc123xyz456...",
  "expiresAt": "2025-01-20T10:00:00Z"
}`}
              notes={[
                "O front-end deve armazenar o sessionToken para enviar no header Authorization das proximas requisicoes",
                "Se o usuario nao existir no banco, o back-end deve criar automaticamente",
              ]}
            />

            <EndpointContract
              method="POST"
              path="/api/v1/auth/external/request-otp"
              title="Solicitar Codigo OTP (Usuario Externo)"
              description="Usuario externo solicita codigo de 6 digitos que sera enviado por email"
              frontendSends={[
                "email: Email do usuario externo",
                "shareId: ID do compartilhamento que ele quer acessar (opcional)",
              ]}
              backendReturns={[
                "message: Confirmacao de envio",
                "expiresInMinutes: Tempo de validade do codigo",
                "attemptsRemaining: Tentativas restantes antes de bloquear",
              ]}
              frontendSendsCode={`// Front-End envia (POST /api/v1/auth/external/request-otp)
{
  "email": "fornecedor@empresa.com",
  "shareId": 42
}`}
              backendReturnsCode={`// Back-End retorna (200 OK)
{
  "message": "Codigo enviado para fornecedor@empresa.com",
  "expiresInMinutes": 10,
  "attemptsRemaining": 5
}

// Erro: Email nao tem compartilhamento (404)
{
  "error": "EMAIL_NOT_FOUND",
  "message": "Nenhum compartilhamento encontrado para este email"
}`}
              notes={[
                "O back-end deve verificar se existe compartilhamento ativo para este email antes de enviar o codigo",
                "Limite de 5 tentativas por hora para evitar spam",
              ]}
            />

            <EndpointContract
              method="POST"
              path="/api/v1/auth/external/verify-otp"
              title="Validar Codigo OTP (Usuario Externo)"
              description="Valida o codigo de 6 digitos e retorna token de acesso"
              frontendSends={[
                "email: Email do usuario externo",
                "code: Codigo de 6 digitos recebido por email",
              ]}
              backendReturns={[
                "accessToken: Token para acessar os arquivos compartilhados",
                "expiresAt: Data/hora de expiracao do token",
                "shareId: ID do compartilhamento vinculado",
                "files: Lista de arquivos disponiveis para download",
              ]}
              frontendSendsCode={`// Front-End envia (POST /api/v1/auth/external/verify-otp)
{
  "email": "fornecedor@empresa.com",
  "code": "123456"
}`}
              backendReturnsCode={`// Back-End retorna (200 OK)
{
  "accessToken": "ext_abc123xyz456...",
  "expiresAt": "2025-01-15T10:00:00Z",
  "shareId": 42,
  "sender": {
    "name": "Kleber Goncalves",
    "email": "kleber.goncalves@petrobras.com.br"
  },
  "files": [
    {
      "id": 101,
      "name": "contrato.pdf",
      "size": 2048576,
      "mimeType": "application/pdf"
    },
    {
      "id": 102,
      "name": "anexo.xlsx",
      "size": 512000,
      "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  ]
}

// Erro: Codigo invalido (401)
{
  "error": "INVALID_CODE",
  "message": "Codigo incorreto ou expirado",
  "attemptsRemaining": 4
}

// Erro: Bloqueado (429)
{
  "error": "BLOCKED",
  "message": "Muitas tentativas. Tente novamente em 15 minutos",
  "retryAfterMinutes": 15
}`}
              notes={[
                "Apos 5 tentativas incorretas, bloquear por 15 minutos",
                "O token de acesso deve ser enviado no header Authorization nas proximas requisicoes",
              ]}
            />
          </TabsContent>

          {/* 2. UPLOAD/COMPARTILHAR */}
          <TabsContent value="upload" className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">Fluxo de Upload e Compartilhamento</h3>
              <p className="text-sm text-green-800">
                Usuario interno faz upload dos arquivos, preenche dados do destinatario, e o sistema envia para aprovacao do supervisor.
              </p>
            </div>

            <EndpointContract
              method="POST"
              path="/api/v1/shares"
              title="Criar Compartilhamento"
              description="Usuario interno cria um novo compartilhamento de arquivos para destinatario externo"
              frontendSends={[
                "recipientEmail: Email do destinatario externo",
                "recipientName: Nome do destinatario (opcional)",
                "description: Descricao do envio",
                "expirationHours: Tempo de disponibilidade (24, 48 ou 72 horas)",
                "files: Lista de arquivos com nome, tamanho e conteudo base64",
                "sender: Dados do remetente (id, nome, email)",
                "supervisor: Dados do supervisor que vai aprovar",
              ]}
              backendReturns={[
                "shareId: ID unico do compartilhamento",
                "status: Status inicial (pending_approval)",
                "createdAt: Data/hora de criacao",
                "supervisorNotified: Se o supervisor foi notificado por email",
              ]}
              frontendSendsCode={`// Front-End envia (POST /api/v1/shares)
// Header: Authorization: Bearer {sessionToken}
{
  "recipientEmail": "fornecedor@empresa.com",
  "recipientName": "Carlos Silva",
  "description": "Documentos do contrato 2025",
  "expirationHours": 72,
  "files": [
    {
      "name": "contrato.pdf",
      "size": 2048576,
      "mimeType": "application/pdf",
      "content": "JVBERi0xLjQKJeLjz9MKMSAwIG9i..." // Base64
    },
    {
      "name": "anexo.xlsx",
      "size": 512000,
      "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content": "UEsDBBQAAAAIAH1..." // Base64
    }
  ],
  "sender": {
    "id": 123,
    "name": "Kleber Goncalves",
    "email": "kleber.goncalves@petrobras.com.br"
  },
  "supervisor": {
    "id": 456,
    "name": "Sabrina Araujo dos Santos",
    "email": "sabrina.araujo@petrobras.com.br"
  }
}`}
              backendReturnsCode={`// Back-End retorna (201 Created)
{
  "shareId": 42,
  "status": "pending_approval",
  "createdAt": "2025-01-13T10:00:00Z",
  "expiresAt": "2025-01-16T10:00:00Z",
  "supervisorNotified": true,
  "files": [
    {
      "id": 101,
      "name": "contrato.pdf",
      "uploadedToS3": true
    },
    {
      "id": 102,
      "name": "anexo.xlsx",
      "uploadedToS3": true
    }
  ]
}

// Erro: Arquivo muito grande (413)
{
  "error": "FILE_TOO_LARGE",
  "message": "Arquivo contrato.pdf excede o limite de 50MB",
  "maxSizeBytes": 52428800
}

// Erro: Tipo de arquivo bloqueado (400)
{
  "error": "FILE_TYPE_BLOCKED",
  "message": "Tipo de arquivo .exe nao permitido por seguranca"
}`}
              notes={[
                "Tamanho maximo por arquivo: 50MB",
                "Tipos bloqueados: .exe, .dll, .bat, .cmd, .com, .msi, .scr, .vbs, .ps1, .sh",
                "O back-end deve enviar email para o supervisor automaticamente",
                "Arquivos devem ser salvos no S3 com chave unica",
              ]}
            />

            <EndpointContract
              method="GET"
              path="/api/v1/shares/my-shares"
              title="Listar Meus Compartilhamentos"
              description="Usuario interno lista todos os compartilhamentos que ele criou"
              frontendSends={[
                "Header Authorization com sessionToken",
                "Query params opcionais: status, page, limit",
              ]}
              backendReturns={[
                "shares: Lista de compartilhamentos com status atualizado",
                "pagination: Dados de paginacao",
              ]}
              frontendSendsCode={`// Front-End envia (GET /api/v1/shares/my-shares?status=pending&page=1&limit=10)
// Header: Authorization: Bearer {sessionToken}

// Nenhum body - apenas query params opcionais`}
              backendReturnsCode={`// Back-End retorna (200 OK)
{
  "shares": [
    {
      "id": 42,
      "recipientEmail": "fornecedor@empresa.com",
      "recipientName": "Carlos Silva",
      "description": "Documentos do contrato 2025",
      "status": "pending_approval",
      "createdAt": "2025-01-13T10:00:00Z",
      "expiresAt": "2025-01-16T10:00:00Z",
      "filesCount": 2,
      "totalSize": 2560576,
      "supervisor": {
        "name": "Sabrina Araujo",
        "email": "sabrina.araujo@petrobras.com.br"
      }
    },
    {
      "id": 41,
      "recipientEmail": "cliente@outraempresa.com",
      "status": "approved",
      "downloadedAt": "2025-01-12T15:30:00Z",
      "filesCount": 1,
      "totalSize": 1024000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}`}
            />

            <EndpointContract
              method="DELETE"
              path="/api/v1/shares/{shareId}"
              title="Cancelar Compartilhamento"
              description="Usuario interno cancela um compartilhamento pendente"
              frontendSends={[
                "shareId: ID do compartilhamento na URL",
                "reason: Motivo do cancelamento (opcional)",
              ]}
              backendReturns={[
                "message: Confirmacao de cancelamento",
                "shareId: ID do compartilhamento cancelado",
              ]}
              frontendSendsCode={`// Front-End envia (DELETE /api/v1/shares/42)
// Header: Authorization: Bearer {sessionToken}
{
  "reason": "Arquivo enviado incorretamente"
}`}
              backendReturnsCode={`// Back-End retorna (200 OK)
{
  "message": "Compartilhamento cancelado com sucesso",
  "shareId": 42,
  "cancelledAt": "2025-01-13T11:00:00Z"
}

// Erro: Ja foi aprovado (400)
{
  "error": "CANNOT_CANCEL",
  "message": "Compartilhamento ja foi aprovado e nao pode ser cancelado"
}`}
              notes={[
                "Somente compartilhamentos com status pending_approval podem ser cancelados",
                "O back-end deve deletar os arquivos do S3 ao cancelar",
              ]}
            />
          </TabsContent>

          {/* 3. SUPERVISOR */}
          <TabsContent value="supervisor" className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-purple-900 mb-2">Fluxo do Supervisor</h3>
              <p className="text-sm text-purple-800">
                Supervisor recebe notificacao, visualiza detalhes e aprova ou rejeita o compartilhamento.
              </p>
            </div>

            <EndpointContract
              method="GET"
              path="/api/v1/supervisor/pending"
              title="Listar Pendencias"
              description="Supervisor lista todos os compartilhamentos pendentes de aprovacao"
              frontendSends={[
                "Header Authorization com sessionToken do supervisor",
              ]}
              backendReturns={[
                "pending: Lista de compartilhamentos aguardando aprovacao",
                "count: Total de pendencias",
              ]}
              frontendSendsCode={`// Front-End envia (GET /api/v1/supervisor/pending)
// Header: Authorization: Bearer {sessionToken}

// Nenhum body`}
              backendReturnsCode={`// Back-End retorna (200 OK)
{
  "pending": [
    {
      "id": 42,
      "sender": {
        "id": 123,
        "name": "Kleber Goncalves",
        "email": "kleber.goncalves@petrobras.com.br",
        "department": "TI - Desenvolvimento"
      },
      "recipient": {
        "email": "fornecedor@empresa.com",
        "name": "Carlos Silva"
      },
      "description": "Documentos do contrato 2025",
      "createdAt": "2025-01-13T10:00:00Z",
      "expiresAt": "2025-01-16T10:00:00Z",
      "files": [
        {
          "id": 101,
          "name": "contrato.pdf",
          "size": 2048576,
          "mimeType": "application/pdf"
        },
        {
          "id": 102,
          "name": "anexo.xlsx",
          "size": 512000
        }
      ],
      "totalSize": 2560576
    }
  ],
  "count": 1
}`}
            />

            <EndpointContract
              method="POST"
              path="/api/v1/supervisor/approve/{shareId}"
              title="Aprovar Compartilhamento"
              description="Supervisor aprova o compartilhamento - dispara email para destinatario externo"
              frontendSends={[
                "shareId: ID do compartilhamento na URL",
                "comments: Comentarios opcionais do supervisor",
              ]}
              backendReturns={[
                "message: Confirmacao de aprovacao",
                "shareId: ID do compartilhamento aprovado",
                "recipientNotified: Se o destinatario foi notificado por email",
                "otpSent: Se o codigo OTP foi enviado",
              ]}
              frontendSendsCode={`// Front-End envia (POST /api/v1/supervisor/approve/42)
// Header: Authorization: Bearer {sessionToken}
{
  "comments": "Aprovado conforme solicitado"
}`}
              backendReturnsCode={`// Back-End retorna (200 OK)
{
  "message": "Compartilhamento aprovado com sucesso",
  "shareId": 42,
  "approvedAt": "2025-01-13T14:00:00Z",
  "recipientNotified": true,
  "otpSent": true,
  "expiresAt": "2025-01-16T14:00:00Z"
}`}
              notes={[
                "Apos aprovacao, o back-end deve enviar email para o destinatario com o link e codigo OTP",
                "O link deve apontar para /external-verify?email={recipientEmail}",
                "O tempo de expiracao comeca a contar a partir da aprovacao",
              ]}
            />

            <EndpointContract
              method="POST"
              path="/api/v1/supervisor/reject/{shareId}"
              title="Rejeitar Compartilhamento"
              description="Supervisor rejeita o compartilhamento - notifica o remetente"
              frontendSends={[
                "shareId: ID do compartilhamento na URL",
                "reason: Motivo da rejeicao (obrigatorio)",
              ]}
              backendReturns={[
                "message: Confirmacao de rejeicao",
                "shareId: ID do compartilhamento rejeitado",
                "senderNotified: Se o remetente foi notificado por email",
              ]}
              frontendSendsCode={`// Front-End envia (POST /api/v1/supervisor/reject/42)
// Header: Authorization: Bearer {sessionToken}
{
  "reason": "Destinatario nao autorizado para receber este tipo de documento"
}`}
              backendReturnsCode={`// Back-End retorna (200 OK)
{
  "message": "Compartilhamento rejeitado",
  "shareId": 42,
  "rejectedAt": "2025-01-13T14:00:00Z",
  "senderNotified": true,
  "reason": "Destinatario nao autorizado para receber este tipo de documento"
}`}
              notes={[
                "O back-end deve enviar email para o remetente informando a rejeicao e o motivo",
                "Os arquivos devem ser mantidos no S3 por 30 dias para auditoria antes de serem deletados",
              ]}
            />
          </TabsContent>

          {/* 4. USUARIO EXTERNO */}
          <TabsContent value="external" className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-orange-900 mb-2">Fluxo do Usuario Externo</h3>
              <p className="text-sm text-orange-800">
                Usuario externo recebe email com link, valida codigo OTP, visualiza arquivos e faz download.
              </p>
            </div>

            <EndpointContract
              method="GET"
              path="/api/v1/external/files"
              title="Listar Arquivos Disponiveis"
              description="Usuario externo lista os arquivos disponiveis para download"
              frontendSends={[
                "Header Authorization com accessToken do usuario externo",
              ]}
              backendReturns={[
                "files: Lista de arquivos com URLs pre-assinadas para download",
                "sender: Dados do remetente",
                "expiresAt: Quando o acesso expira",
              ]}
              frontendSendsCode={`// Front-End envia (GET /api/v1/external/files)
// Header: Authorization: Bearer {accessToken}

// Nenhum body`}
              backendReturnsCode={`// Back-End retorna (200 OK)
{
  "shareId": 42,
  "sender": {
    "name": "Kleber Goncalves",
    "email": "kleber.goncalves@petrobras.com.br",
    "company": "Petrobras"
  },
  "description": "Documentos do contrato 2025",
  "expiresAt": "2025-01-16T14:00:00Z",
  "files": [
    {
      "id": 101,
      "name": "contrato.pdf",
      "size": 2048576,
      "mimeType": "application/pdf",
      "downloadUrl": "https://s3.amazonaws.com/bucket/files/contrato.pdf?X-Amz-Signature=...",
      "downloadUrlExpiresIn": 300,
      "downloaded": false
    },
    {
      "id": 102,
      "name": "anexo.xlsx",
      "size": 512000,
      "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "downloadUrl": "https://s3.amazonaws.com/bucket/files/anexo.xlsx?X-Amz-Signature=...",
      "downloadUrlExpiresIn": 300,
      "downloaded": true,
      "downloadedAt": "2025-01-14T09:00:00Z"
    }
  ]
}

// Erro: Token expirado (401)
{
  "error": "TOKEN_EXPIRED",
  "message": "Seu acesso expirou. Solicite novo codigo."
}`}
              notes={[
                "As URLs pre-assinadas do S3 expiram em 5 minutos (300 segundos)",
                "O front-end deve renovar as URLs se o usuario demorar para baixar",
              ]}
            />

            <EndpointContract
              method="POST"
              path="/api/v1/external/download/{fileId}"
              title="Registrar Download"
              description="Registra que o usuario externo baixou um arquivo (para auditoria)"
              frontendSends={[
                "fileId: ID do arquivo na URL",
                "Header Authorization com accessToken",
              ]}
              backendReturns={[
                "message: Confirmacao de registro",
                "downloadedAt: Data/hora do download",
              ]}
              frontendSendsCode={`// Front-End envia (POST /api/v1/external/download/101)
// Header: Authorization: Bearer {accessToken}

// Nenhum body - o fileId vai na URL`}
              backendReturnsCode={`// Back-End retorna (200 OK)
{
  "message": "Download registrado",
  "fileId": 101,
  "fileName": "contrato.pdf",
  "downloadedAt": "2025-01-14T10:30:00Z"
}`}
              notes={[
                "Este endpoint deve ser chamado DEPOIS que o arquivo foi baixado com sucesso",
                "Usar para auditoria e para mostrar status 'baixado' na lista de arquivos",
              ]}
            />

            <EndpointContract
              method="POST"
              path="/api/v1/external/logout"
              title="Encerrar Sessao"
              description="Usuario externo encerra sua sessao"
              frontendSends={[
                "Header Authorization com accessToken",
              ]}
              backendReturns={[
                "message: Confirmacao de logout",
              ]}
              frontendSendsCode={`// Front-End envia (POST /api/v1/external/logout)
// Header: Authorization: Bearer {accessToken}

// Nenhum body`}
              backendReturnsCode={`// Back-End retorna (200 OK)
{
  "message": "Sessao encerrada com sucesso"
}`}
              notes={[
                "O back-end deve invalidar o accessToken",
                "O usuario precisara solicitar novo codigo OTP para acessar novamente",
              ]}
            />
          </TabsContent>

          {/* 5. EMAILS */}
          <TabsContent value="email" className="space-y-6">
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-pink-900 mb-2">Emails Enviados pelo Sistema</h3>
              <p className="text-sm text-pink-800">
                O back-end deve enviar emails automaticamente em determinados momentos. O front-end pode solicitar reenvio.
              </p>
            </div>

            <EndpointContract
              method="POST"
              path="/api/v1/email/resend-supervisor"
              title="Reenviar Email para Supervisor"
              description="Reenvia email de notificacao para o supervisor aprovar"
              frontendSends={[
                "shareId: ID do compartilhamento",
              ]}
              backendReturns={[
                "message: Confirmacao de reenvio",
                "sentTo: Email do supervisor",
              ]}
              frontendSendsCode={`// Front-End envia (POST /api/v1/email/resend-supervisor)
// Header: Authorization: Bearer {sessionToken}
{
  "shareId": 42
}`}
              backendReturnsCode={`// Back-End retorna (200 OK)
{
  "message": "Email reenviado com sucesso",
  "sentTo": "sabrina.araujo@petrobras.com.br",
  "sentAt": "2025-01-13T15:00:00Z"
}

// Erro: Limite de reenvios (429)
{
  "error": "RESEND_LIMIT",
  "message": "Limite de 3 reenvios por hora atingido",
  "retryAfterMinutes": 45
}`}
              notes={[
                "Limite de 3 reenvios por hora por compartilhamento",
                "Nao reenviar se ja foi aprovado ou rejeitado",
              ]}
            />

            <EndpointContract
              method="POST"
              path="/api/v1/email/resend-external"
              title="Reenviar Email para Externo"
              description="Reenvia email com link e codigo OTP para o destinatario externo"
              frontendSends={[
                "shareId: ID do compartilhamento",
              ]}
              backendReturns={[
                "message: Confirmacao de reenvio",
                "sentTo: Email do destinatario",
                "newOtpGenerated: Se um novo codigo foi gerado",
              ]}
              frontendSendsCode={`// Front-End envia (POST /api/v1/email/resend-external)
// Header: Authorization: Bearer {sessionToken}
{
  "shareId": 42
}`}
              backendReturnsCode={`// Back-End retorna (200 OK)
{
  "message": "Email reenviado com sucesso",
  "sentTo": "fornecedor@empresa.com",
  "sentAt": "2025-01-14T10:00:00Z",
  "newOtpGenerated": true,
  "otpExpiresInMinutes": 10
}

// Erro: Compartilhamento nao aprovado (400)
{
  "error": "NOT_APPROVED",
  "message": "Compartilhamento ainda nao foi aprovado pelo supervisor"
}`}
              notes={[
                "Somente pode ser reenviado se o compartilhamento ja foi aprovado",
                "Gera novo codigo OTP a cada reenvio (invalida o anterior)",
              ]}
            />

            <Card className="bg-slate-50">
              <CardHeader>
                <CardTitle className="text-lg">Emails que o Back-End envia automaticamente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">1</Badge>
                    <span className="font-medium">Ao criar compartilhamento</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-slate-600 ml-8">
                    <li>Email para o remetente confirmando o envio</li>
                    <li>Email para o supervisor solicitando aprovacao</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">2</Badge>
                    <span className="font-medium">Ao aprovar compartilhamento</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-slate-600 ml-8">
                    <li>Email para o destinatario externo com link + codigo OTP</li>
                    <li>Email para o remetente informando a aprovacao</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">3</Badge>
                    <span className="font-medium">Ao rejeitar compartilhamento</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-slate-600 ml-8">
                    <li>Email para o remetente informando a rejeicao e o motivo</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">4</Badge>
                    <span className="font-medium">Ao usuario externo baixar arquivos</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-slate-600 ml-8">
                    <li>Email para o remetente informando que os arquivos foram baixados</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-500">
          <p>Documentacao gerada automaticamente. Ultima atualizacao: Janeiro 2025</p>
        </div>
      </div>
    </div>
  )
}
