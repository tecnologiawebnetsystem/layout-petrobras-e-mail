import Link from "next/link"
import { Home, Database, Lock, Upload, Download, UserCheck, FileText, Shield } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

export default function EndpointsAPIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header com botão voltar */}
        <Link
          href="/wiki-dev"
          className="inline-flex items-center gap-2 text-green-700 hover:text-green-900 mb-6 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span className="text-sm font-medium">Voltar para Wiki-Dev</span>
        </Link>

        {/* Título */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                Endpoints API - Referência Completa
              </h1>
              <p className="text-gray-600 mt-1">
                Documentação detalhada de todos os 30+ endpoints do back-end Python com exemplos de JSON
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/wiki-dev" className="hover:text-green-600 transition-colors">
              Wiki-Dev
            </Link>
            <span>/</span>
            <span className="text-gray-900">Endpoints API</span>
          </div>
        </div>

        {/* Tabs de Categorias */}
        <Tabs defaultValue="auth" className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2 bg-white p-2 rounded-lg shadow-sm">
            <TabsTrigger value="auth" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Autenticação</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Arquivos</span>
            </TabsTrigger>
            <TabsTrigger value="shares" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Compartilhamentos</span>
            </TabsTrigger>
            <TabsTrigger value="external" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Externo</span>
            </TabsTrigger>
            <TabsTrigger value="supervisor" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Supervisor</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Auditoria</span>
            </TabsTrigger>
            <TabsTrigger value="areas" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Áreas</span>
            </TabsTrigger>
          </TabsList>

          {/* AUTENTICAÇÃO */}
          <TabsContent value="auth" className="space-y-6">
            <EndpointCard
              method="POST"
              path="/api/v1/auth/internal/signup"
              title="Cadastro Local (Dev)"
              description="Cria novo usuário interno com email e senha (apenas em desenvolvimento)"
              requestExample={{
                email: "usuario@petrobras.com.br",
                name: "João Silva",
                type: "INTERNAL",
                password: "senha123",
              }}
              responseExample={{
                usuario_id: 1,
                tipo: "INTERNAL",
              }}
            />

            <EndpointCard
              method="POST"
              path="/api/v1/auth/internal/login"
              title="Login Interno"
              description="Login com email+senha (dev) ou redirect para Microsoft Entra ID (produção)"
              requestExample={{
                email: "usuario@petrobras.com.br",
                password: "senha123",
              }}
              responseExample={{
                access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                token_type: "bearer",
                user: {
                  id: 1,
                  name: "João Silva",
                  email: "usuario@petrobras.com.br",
                  type: "INTERNAL",
                  employeeId: "12345",
                },
              }}
            />

            <EndpointCard
              method="GET"
              path="/api/v1/auth/internal/callback"
              title="Callback Entra ID"
              description="Processa código de autenticação do Microsoft Entra ID"
              queryParams={{ code: "authorization_code_from_azure" }}
              responseExample={{
                access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                user: {
                  id: 1,
                  name: "João Silva",
                  email: "usuario@petrobras.com.br",
                  type: "INTERNAL",
                  manager: "Maria Santos",
                  jobTitle: "Analista",
                  employeeId: "12345",
                },
              }}
            />

            <EndpointCard
              method="POST"
              path="/api/v1/auth/external/request-code"
              title="Solicitar Código OTP (Externo)"
              description="Usuário externo solicita código de 6 dígitos por email"
              requestExample={{
                email: "externo@empresa.com",
                validity_minutes: 10,
              }}
              responseExample={{
                message: "Código enviado para externo@empresa.com",
                expires_in_minutes: 10,
              }}
            />

            <EndpointCard
              method="POST"
              path="/api/v1/auth/external/verify-code"
              title="Validar Código OTP (Externo)"
              description="Valida código de 6 dígitos e retorna token de acesso"
              requestExample={{
                email: "externo@empresa.com",
                code: "123456",
                max_attempts: 5,
                cooldown_minutes: 15,
                access_valid_hours: 24,
              }}
              responseExample={{
                access_token: "abc123xyz456",
                token_type: "external",
                expires_at: "2025-01-15T10:00:00Z",
                share_id: 42,
              }}
            />
          </TabsContent>

          {/* USUÁRIOS */}
          <TabsContent value="users" className="space-y-6">
            <EndpointCard
              method="POST"
              path="/api/v1/users/"
              title="Criar Usuário"
              description="Cria novo usuário no sistema"
              requestExample={{
                name: "Maria Santos",
                email: "maria.santos@petrobras.com.br",
                type: "INTERNAL",
              }}
              responseExample={{
                id: 2,
                name: "Maria Santos",
                email: "maria.santos@petrobras.com.br",
                type: "INTERNAL",
                status: true,
                created_at: "2025-01-13T10:00:00Z",
              }}
            />

            <EndpointCard
              method="GET"
              path="/api/v1/users/"
              title="Listar Usuários"
              description="Retorna lista de todos os usuários"
              responseExample={[
                {
                  id: 1,
                  name: "João Silva",
                  email: "joao@petrobras.com.br",
                  type: "INTERNAL",
                  status: true,
                },
                {
                  id: 2,
                  name: "Maria Santos",
                  email: "maria@petrobras.com.br",
                  type: "SUPERVISOR",
                  status: true,
                },
              ]}
            />

            <EndpointCard
              method="GET"
              path="/api/v1/users/{user_id}"
              title="Buscar Usuário por ID"
              description="Retorna dados de um usuário específico"
              pathParams={{ user_id: 1 }}
              responseExample={{
                id: 1,
                name: "João Silva",
                email: "joao@petrobras.com.br",
                type: "INTERNAL",
                status: true,
                employeeId: "12345",
                created_at: "2025-01-10T10:00:00Z",
              }}
            />

            <EndpointCard
              method="PATCH"
              path="/api/v1/users/{user_id}"
              title="Atualizar Usuário"
              description="Atualiza dados de um usuário"
              pathParams={{ user_id: 1 }}
              requestExample={{
                name: "João Silva Santos",
                status: true,
              }}
              responseExample={{
                id: 1,
                name: "João Silva Santos",
                email: "joao@petrobras.com.br",
                type: "INTERNAL",
                status: true,
              }}
            />
          </TabsContent>

          {/* ARQUIVOS */}
          <TabsContent value="files" className="space-y-6">
            <EndpointCard
              method="POST"
              path="/api/v1/files/"
              title="Criar Metadados de Arquivo"
              description="Registra metadados de arquivo antes do upload"
              requestExample={{
                area_id: 1,
                name: "documento.pdf",
                key_s3: "areas/petrobras-ti/documento.pdf",
                size_bytes: 2048576,
                mime_type: "application/pdf",
                checksum: "sha256:abc123...",
                upload_id: 1,
              }}
              responseExample={{
                id: 10,
                area_id: 1,
                name: "documento.pdf",
                key_s3: "areas/petrobras-ti/documento.pdf",
                size_bytes: 2048576,
                mime_type: "application/pdf",
                status: true,
                created_at: "2025-01-13T10:00:00Z",
              }}
            />

            <EndpointCard
              method="GET"
              path="/api/v1/files/"
              title="Listar Arquivos"
              description="Lista arquivos, opcionalmente filtrados por área"
              queryParams={{ area_id: 1 }}
              responseExample={[
                {
                  id: 10,
                  name: "documento.pdf",
                  size_bytes: 2048576,
                  mime_type: "application/pdf",
                  area_id: 1,
                  created_at: "2025-01-13T10:00:00Z",
                },
              ]}
            />

            <EndpointCard
              method="POST"
              path="/api/v1/files/upload-local"
              title="Upload Local (Dev)"
              description="Faz upload de arquivo direto no servidor (apenas desenvolvimento)"
              formData={{
                area_id: 1,
                name: "documento.pdf",
                upload_id: 1,
                file: "[binary file data]",
              }}
              responseExample={{
                id: 11,
                name: "documento.pdf",
                key_s3: "./storage/petrobras-ti/documento.pdf",
                size_bytes: 2048576,
                mime_type: "application/pdf",
              }}
            />

            <EndpointCard
              method="GET"
              path="/api/v1/files/{file_id}/presigned-upload"
              title="Gerar URL de Upload (S3)"
              description="Gera URL pré-assinada para upload direto no S3"
              pathParams={{ file_id: 10 }}
              queryParams={{ expires_in: 600 }}
              responseExample={{
                url: "https://s3.amazonaws.com/bucket/file?signature=...",
                expires_in: 600,
              }}
            />

            <EndpointCard
              method="GET"
              path="/api/v1/files/{file_id}/presigned-download"
              title="Gerar URL de Download (S3)"
              description="Gera URL pré-assinada para download do S3"
              pathParams={{ file_id: 10 }}
              queryParams={{ expires_in: 300 }}
              responseExample={{
                url: "https://s3.amazonaws.com/bucket/file?signature=...",
                expires_in: 300,
              }}
            />
          </TabsContent>

          {/* COMPARTILHAMENTOS */}
          <TabsContent value="shares" className="space-y-6">
            <EndpointCard
              method="POST"
              path="/api/v1/shares/"
              title="Criar Compartilhamento"
              description="Cria novo compartilhamento de arquivos com destinatário externo"
              requestExample={{
                area_id: 1,
                external_email: "fornecedor@empresa.com",
                created_by_id: 1,
                expira_at: "2025-02-13T23:59:59Z",
                consumption_policy: "MULTIPLE",
                file_ids: [10, 11, 12],
                new_uploads: [],
              }}
              responseExample={{
                id: 42,
                area_id: 1,
                external_email: "fornecedor@empresa.com",
                status: "pending",
                created_at: "2025-01-13T10:00:00Z",
                expira_at: "2025-02-13T23:59:59Z",
                supervisor_approval_required: true,
              }}
            />

            <EndpointCard
              method="POST"
              path="/api/v1/shares/{share_id}/token"
              title="Gerar Token de Acesso"
              description="Gera token de acesso para compartilhamento após aprovação"
              pathParams={{ share_id: 42 }}
              requestExample={{
                validity_hours: 24,
              }}
              responseExample={{
                token: "abc123xyz456",
                expira_at: "2025-01-14T10:00:00Z",
              }}
            />

            <EndpointCard
              method="PATCH"
              path="/api/v1/shares/{share_id}/cancel"
              title="Cancelar Compartilhamento"
              description="Cancela compartilhamento pendente"
              pathParams={{ share_id: 42 }}
              requestExample={{
                cancelled_by: "joao@petrobras.com.br",
                cancellation_reason: "Arquivo enviado incorretamente",
              }}
              responseExample={{
                id: 42,
                status: "cancelled",
                cancelled_by: "joao@petrobras.com.br",
                cancellation_date: "2025-01-13T11:00:00Z",
                cancellation_reason: "Arquivo enviado incorretamente",
              }}
            />
          </TabsContent>

          {/* EXTERNO */}
          <TabsContent value="external" className="space-y-6">
            <EndpointCard
              method="GET"
              path="/api/v1/external/list-files"
              title="Listar Arquivos (Externo)"
              description="Usuário externo lista arquivos compartilhados com ele"
              queryParams={{ token: "abc123xyz456" }}
              responseExample={{
                files: [
                  {
                    share_file_id: 1,
                    name: "documento.pdf",
                    size_bytes: 2048576,
                    downloaded: false,
                    url: "https://s3.amazonaws.com/...",
                    url_expires_in_seconds: 300,
                  },
                ],
                token_expira_at: "2025-01-14T10:00:00Z",
              }}
            />

            <EndpointCard
              method="POST"
              path="/api/v1/external/ack"
              title="Confirmar Download (Externo)"
              description="Marca arquivo como baixado pelo usuário externo"
              requestExample={{
                token: "abc123xyz456",
                share_file_id: 1,
              }}
              responseExample={{
                status: "ok",
              }}
            />

            <EndpointCard
              method="POST"
              path="/api/v1/external/logout"
              title="Logout Externo"
              description="Encerra sessão do usuário externo"
              formData={{
                token: "abc123xyz456",
              }}
              responseExample={{
                message: "Sessão encerrada",
              }}
            />
          </TabsContent>

          {/* SUPERVISOR */}
          <TabsContent value="supervisor" className="space-y-6">
            <EndpointCard
              method="GET"
              path="/api/v1/supervisor/areas/{area_id}/report"
              title="Relatório de Área"
              description="Supervisor visualiza relatório de compartilhamentos da área"
              pathParams={{ area_id: 1 }}
              requiresAuth="SUPERVISOR"
              responseExample={{
                area_id: 1,
                nome_area: "TI - Petrobras",
                shares: [
                  {
                    share_id: 42,
                    externo_email: "fornecedor@empresa.com",
                    criado_em: "2025-01-13T10:00:00Z",
                    expira_em: "2025-02-13T23:59:59Z",
                    status: "active",
                    tot_arquivos: 3,
                    baixados: 1,
                    pendentes: 2,
                  },
                ],
              }}
            />
          </TabsContent>

          {/* AUDITORIA */}
          <TabsContent value="audit" className="space-y-6">
            <EndpointCard
              method="GET"
              path="/api/v1/audit/"
              title="Consultar Logs de Auditoria"
              description="Busca logs de auditoria com filtros opcionais"
              queryParams={{
                user_id: 1,
                share_id: 42,
                file_id: 10,
                limit: 100,
              }}
              responseExample={[
                {
                  id: 1,
                  action: "CRIAR_COMPARTILHAMENTO",
                  user_id: 1,
                  share_id: 42,
                  file_id: null,
                  detail: "Compartilhamento criado para fornecedor@empresa.com",
                  ip: "192.168.1.100",
                  user_agent: "Mozilla/5.0...",
                  timestamp: "2025-01-13T10:00:00Z",
                },
                {
                  id: 2,
                  action: "UPLOAD_ARQUIVO",
                  user_id: 1,
                  file_id: 10,
                  detail: "documento.pdf - 2MB",
                  ip: "192.168.1.100",
                  timestamp: "2025-01-13T10:05:00Z",
                },
              ]}
            />
          </TabsContent>

          {/* ÁREAS */}
          <TabsContent value="areas" className="space-y-6">
            <EndpointCard
              method="GET"
              path="/api/v1/areas/"
              title="Listar Áreas"
              description="Lista todas as áreas compartilhadas"
              responseExample={[
                {
                  id: 1,
                  name: "TI - Petrobras",
                  prefix_s3: "petrobras-ti",
                  active: true,
                },
              ]}
            />

            <EndpointCard
              method="POST"
              path="/api/v1/areas/"
              title="Criar Área"
              description="Cria nova área compartilhada"
              requestExample={{
                name: "Financeiro - Petrobras",
                prefix_s3: "petrobras-financeiro",
              }}
              responseExample={{
                id: 2,
                name: "Financeiro - Petrobras",
                prefix_s3: "petrobras-financeiro",
                active: true,
                created_at: "2025-01-13T10:00:00Z",
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Seção de Notas */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Notas Importantes:</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Base URL:</strong>{" "}
                <code className="bg-blue-100 px-2 py-0.5 rounded">https://api.petrobras.com.br</code> (produção) ou{" "}
                <code className="bg-blue-100 px-2 py-0.5 rounded">http://localhost:8080</code> (dev)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Autenticação Interna:</strong> Bearer token no header{" "}
                <code className="bg-blue-100 px-2 py-0.5 rounded">Authorization: Bearer eyJhbGci...</code>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Autenticação Externa:</strong> Token de acesso como query param{" "}
                <code className="bg-blue-100 px-2 py-0.5 rounded">?token=abc123</code>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Tipos de Usuário:</strong> INTERNAL (funcionário Petrobras), EXTERNAL (fornecedor/parceiro),
                SUPERVISOR (aprova compartilhamentos)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Status de Compartilhamento:</strong> pending (aguardando aprovação), active (aprovado e ativo),
                expired (expirado), cancelled (cancelado)
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

// Componente auxiliar para documentar cada endpoint
function EndpointCard({
  method,
  path,
  title,
  description,
  requestExample,
  responseExample,
  pathParams,
  queryParams,
  formData,
  requiresAuth,
}: {
  method: string
  path: string
  title: string
  description: string
  requestExample?: any
  responseExample?: any
  pathParams?: Record<string, any>
  queryParams?: Record<string, any>
  formData?: Record<string, any>
  requiresAuth?: string
}) {
  const methodColors: Record<string, string> = {
    GET: "bg-green-100 text-green-800 border-green-200",
    POST: "bg-blue-100 text-blue-800 border-blue-200",
    PATCH: "bg-yellow-100 text-yellow-800 border-yellow-200",
    DELETE: "bg-red-100 text-red-800 border-red-200",
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <span className={`px-3 py-1 rounded-md font-mono text-sm font-semibold border ${methodColors[method]}`}>
          {method}
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <code className="text-sm text-green-700 bg-green-50 px-2 py-1 rounded">{path}</code>
          {requiresAuth && (
            <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded border border-orange-200">
              🔒 Requer: {requiresAuth}
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-600 mb-4">{description}</p>

      <div className="space-y-4">
        {pathParams && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Path Parameters:</h4>
            <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto border border-gray-200">
              {JSON.stringify(pathParams, null, 2)}
            </pre>
          </div>
        )}

        {queryParams && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Query Parameters:</h4>
            <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto border border-gray-200">
              {JSON.stringify(queryParams, null, 2)}
            </pre>
          </div>
        )}

        {formData && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Form Data:</h4>
            <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto border border-gray-200">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        )}

        {requestExample && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Request Body (JSON):</h4>
            <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto border border-gray-200">
              {JSON.stringify(requestExample, null, 2)}
            </pre>
          </div>
        )}

        {responseExample && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Response (JSON):</h4>
            <pre className="bg-green-50 p-3 rounded-lg text-xs overflow-x-auto border border-green-200">
              {JSON.stringify(responseExample, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  )
}
