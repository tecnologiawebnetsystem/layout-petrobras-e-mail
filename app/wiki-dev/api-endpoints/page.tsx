"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Home, 
  Search, 
  Copy, 
  Check, 
  AlertCircle,
  ArrowLeft,
  Lock,
  User,
  FileUp,
  Shield,
  Download,
  Bell,
  ClipboardList,
  Mail,
  Server,
  Database,
  Code,
  Info
} from "lucide-react"

// ===========================================
// DEFINICAO DE TODOS OS ENDPOINTS DA API
// ===========================================

interface EndpointField {
  name: string
  type: string
  required: boolean
  description: string
  example?: string
}

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  path: string
  pythonPath: string
  title: string
  description: string
  auth: boolean
  roles?: string[]
  headers?: EndpointField[]
  queryParams?: EndpointField[]
  requestBody?: EndpointField[]
  responseFields: EndpointField[]
  requestExample?: string
  responseExample: string
  errorCodes: { code: string; status: number; description: string }[]
  notes?: string[]
}

interface EndpointCategory {
  id: string
  title: string
  description: string
  icon: any
  color: string
  endpoints: Endpoint[]
}

const API_CATEGORIES: EndpointCategory[] = [
  // =============================================
  // AUTENTICACAO
  // =============================================
  {
    id: "auth",
    title: "Autenticacao",
    description: "Endpoints para login, logout, refresh de tokens e recuperacao de senha",
    icon: Lock,
    color: "bg-red-500",
    endpoints: [
      {
        method: "POST",
        path: "/api/auth/login",
        pythonPath: "/v1/auth/login",
        title: "Login",
        description: "Autentica um usuario com email e senha. Retorna tokens JWT (access e refresh) e dados do usuario.",
        auth: false,
        requestBody: [
          { name: "email", type: "string", required: true, description: "Email corporativo do usuario", example: "joao.silva@petrobras.com.br" },
          { name: "password", type: "string", required: true, description: "Senha do usuario", example: "SenhaSegura123!" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "data.token", type: "string", required: true, description: "JWT access token para autenticacao" },
          { name: "data.refreshToken", type: "string", required: true, description: "JWT refresh token para renovar o access token" },
          { name: "data.expiresIn", type: "number", required: true, description: "Tempo em segundos ate o token expirar (padrao: 3600)" },
          { name: "data.user.userId", type: "string", required: true, description: "ID unico do usuario no sistema" },
          { name: "data.user.name", type: "string", required: true, description: "Nome completo do usuario" },
          { name: "data.user.email", type: "string", required: true, description: "Email do usuario" },
          { name: "data.user.role", type: "string", required: true, description: "Papel do usuario: 'employee' | 'supervisor' | 'admin'" },
          { name: "data.user.department", type: "string", required: true, description: "Departamento do usuario" },
          { name: "data.user.employeeId", type: "string", required: true, description: "Matricula do funcionario" },
          { name: "data.user.manager", type: "string", required: false, description: "Nome do gestor imediato (se houver)" },
        ],
        requestExample: `{
  "email": "joao.silva@petrobras.com.br",
  "password": "SenhaSegura123!"
}`,
        responseExample: `{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "userId": "usr_abc123",
      "name": "Joao da Silva",
      "email": "joao.silva@petrobras.com.br",
      "role": "employee",
      "department": "Engenharia de Producao",
      "employeeId": "123456",
      "manager": "Maria Santos"
    }
  }
}`,
        errorCodes: [
          { code: "VALIDATION_ERROR", status: 400, description: "Email ou senha nao fornecidos" },
          { code: "INVALID_EMAIL", status: 400, description: "Formato de email invalido" },
          { code: "AUTH_FAILED", status: 401, description: "Credenciais invalidas" },
          { code: "USER_DISABLED", status: 403, description: "Usuario desabilitado" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
        notes: [
          "O token JWT deve ser incluido em todas as requisicoes autenticadas no header Authorization: Bearer {token}",
          "O access token expira em 1 hora (3600 segundos)",
          "O refresh token expira em 7 dias",
          "Apos 3 tentativas de login falhas, a conta e bloqueada por 15 minutos",
        ],
      },
      {
        method: "POST",
        path: "/api/auth/logout",
        pythonPath: "/v1/auth/logout",
        title: "Logout",
        description: "Invalida os tokens do usuario e encerra a sessao.",
        auth: true,
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}", example: "Bearer eyJhbGciOiJIUzI1NiIs..." },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "message", type: "string", required: true, description: "Mensagem de confirmacao" },
        ],
        responseExample: `{
  "success": true,
  "message": "Logout realizado com sucesso"
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token nao fornecido ou invalido" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
        notes: [
          "O token deve ser invalidado no backend (adicionar a uma blacklist)",
          "Registrar o logout nos logs de auditoria",
        ],
      },
      {
        method: "POST",
        path: "/api/auth/refresh",
        pythonPath: "/v1/auth/refresh",
        title: "Refresh Token",
        description: "Renova o access token usando o refresh token.",
        auth: false,
        requestBody: [
          { name: "refreshToken", type: "string", required: true, description: "Refresh token obtido no login", example: "eyJhbGciOiJIUzI1NiIs..." },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "data.token", type: "string", required: true, description: "Novo JWT access token" },
          { name: "data.expiresIn", type: "number", required: true, description: "Tempo em segundos ate expirar" },
        ],
        requestExample: `{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}`,
        responseExample: `{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}`,
        errorCodes: [
          { code: "VALIDATION_ERROR", status: 400, description: "Refresh token nao fornecido" },
          { code: "INVALID_TOKEN", status: 401, description: "Refresh token invalido ou expirado" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
      },
      {
        method: "POST",
        path: "/api/auth/forgot-password",
        pythonPath: "/v1/auth/forgot-password",
        title: "Recuperar Senha",
        description: "Envia email de recuperacao de senha para o usuario.",
        auth: false,
        requestBody: [
          { name: "email", type: "string", required: true, description: "Email corporativo do usuario", example: "joao.silva@petrobras.com.br" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Sempre true (nao revelar se email existe)" },
          { name: "message", type: "string", required: true, description: "Mensagem generica de confirmacao" },
        ],
        requestExample: `{
  "email": "joao.silva@petrobras.com.br"
}`,
        responseExample: `{
  "success": true,
  "message": "Se o email existir em nossa base, voce recebera instrucoes para redefinir a senha"
}`,
        errorCodes: [
          { code: "VALIDATION_ERROR", status: 400, description: "Email nao fornecido" },
          { code: "INVALID_EMAIL", status: 400, description: "Formato de email invalido" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
        notes: [
          "IMPORTANTE: Por seguranca, sempre retornar sucesso mesmo que o email nao exista",
          "O link de recuperacao deve expirar em 1 hora",
          "Enviar email usando AWS SES",
        ],
      },
    ],
  },
  // =============================================
  // USUARIO
  // =============================================
  {
    id: "users",
    title: "Usuarios",
    description: "Endpoints para gerenciar perfil do usuario",
    icon: User,
    color: "bg-blue-500",
    endpoints: [
      {
        method: "GET",
        path: "/api/users/me",
        pythonPath: "/v1/users/me",
        title: "Obter Perfil",
        description: "Retorna os dados do usuario autenticado.",
        auth: true,
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "data.userId", type: "string", required: true, description: "ID unico do usuario" },
          { name: "data.name", type: "string", required: true, description: "Nome completo" },
          { name: "data.email", type: "string", required: true, description: "Email corporativo" },
          { name: "data.role", type: "string", required: true, description: "Papel: employee | supervisor | admin" },
          { name: "data.department", type: "string", required: true, description: "Departamento" },
          { name: "data.employeeId", type: "string", required: true, description: "Matricula" },
          { name: "data.manager", type: "string", required: false, description: "Nome do gestor" },
          { name: "data.createdAt", type: "string", required: true, description: "Data de criacao (ISO 8601)" },
          { name: "data.stats.uploadCount", type: "number", required: true, description: "Total de uploads realizados" },
          { name: "data.stats.pendingCount", type: "number", required: true, description: "Uploads pendentes de aprovacao" },
          { name: "data.stats.approvedCount", type: "number", required: true, description: "Uploads aprovados" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "userId": "usr_abc123",
    "name": "Joao da Silva",
    "email": "joao.silva@petrobras.com.br",
    "role": "employee",
    "department": "Engenharia de Producao",
    "employeeId": "123456",
    "manager": "Maria Santos",
    "createdAt": "2024-01-15T10:30:00Z",
    "stats": {
      "uploadCount": 45,
      "pendingCount": 3,
      "approvedCount": 40
    }
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido ou expirado" },
          { code: "USER_NOT_FOUND", status: 404, description: "Usuario nao encontrado" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
      },
      {
        method: "PUT",
        path: "/api/users/me",
        pythonPath: "/v1/users/me",
        title: "Atualizar Perfil",
        description: "Atualiza dados do perfil do usuario autenticado.",
        auth: true,
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        requestBody: [
          { name: "name", type: "string", required: false, description: "Novo nome" },
          { name: "department", type: "string", required: false, description: "Novo departamento" },
          { name: "password", type: "string", required: false, description: "Nova senha (minimo 8 caracteres)" },
          { name: "currentPassword", type: "string", required: false, description: "Senha atual (obrigatorio se mudar senha)" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "message", type: "string", required: true, description: "Mensagem de confirmacao" },
          { name: "data", type: "object", required: true, description: "Dados atualizados do usuario" },
        ],
        requestExample: `{
  "name": "Joao da Silva Junior",
  "department": "Engenharia de Projetos"
}`,
        responseExample: `{
  "success": true,
  "message": "Perfil atualizado com sucesso",
  "data": {
    "userId": "usr_abc123",
    "name": "Joao da Silva Junior",
    "email": "joao.silva@petrobras.com.br",
    "role": "employee",
    "department": "Engenharia de Projetos",
    "employeeId": "123456"
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "INVALID_PASSWORD", status: 400, description: "Senha atual incorreta" },
          { code: "WEAK_PASSWORD", status: 400, description: "Nova senha muito fraca" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
      },
    ],
  },
  // =============================================
  // ARQUIVOS
  // =============================================
  {
    id: "files",
    title: "Arquivos",
    description: "Endpoints para upload, listagem e gerenciamento de arquivos",
    icon: FileUp,
    color: "bg-green-500",
    endpoints: [
      {
        method: "POST",
        path: "/api/files/upload",
        pythonPath: "/v1/files/upload",
        title: "Upload de Arquivos",
        description: "Faz upload de um ou mais arquivos para compartilhamento externo. Usa FormData para enviar arquivos.",
        auth: true,
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
          { name: "Content-Type", type: "string", required: true, description: "multipart/form-data (automatico)" },
        ],
        requestBody: [
          { name: "files", type: "File[]", required: true, description: "Arquivos para upload (multiplos permitidos)" },
          { name: "name", type: "string", required: true, description: "Nome/titulo do compartilhamento", example: "Relatorio Mensal Janeiro" },
          { name: "recipientEmail", type: "string", required: true, description: "Email do destinatario externo", example: "fornecedor@empresa.com" },
          { name: "description", type: "string", required: false, description: "Descricao do compartilhamento" },
          { name: "expirationHours", type: "number", required: false, description: "Horas ate expirar (padrao: 48, max: 168)" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se o upload foi bem sucedido" },
          { name: "message", type: "string", required: true, description: "Mensagem de confirmacao" },
          { name: "data.uploadId", type: "string", required: true, description: "ID unico do upload/compartilhamento" },
          { name: "data.name", type: "string", required: true, description: "Nome do compartilhamento" },
          { name: "data.recipientEmail", type: "string", required: true, description: "Email do destinatario" },
          { name: "data.files", type: "array", required: true, description: "Lista de arquivos enviados" },
          { name: "data.files[].name", type: "string", required: true, description: "Nome do arquivo" },
          { name: "data.files[].size", type: "number", required: true, description: "Tamanho em bytes" },
          { name: "data.files[].type", type: "string", required: true, description: "MIME type do arquivo" },
          { name: "data.files[].s3Key", type: "string", required: true, description: "Chave do arquivo no S3" },
          { name: "data.status", type: "string", required: true, description: "Status: pending_approval" },
          { name: "data.expirationHours", type: "number", required: true, description: "Horas para expirar" },
          { name: "data.createdAt", type: "string", required: true, description: "Data de criacao (ISO 8601)" },
        ],
        requestExample: `// FormData
const formData = new FormData()
formData.append('files', file1)
formData.append('files', file2)
formData.append('name', 'Relatorio Mensal Janeiro')
formData.append('recipientEmail', 'fornecedor@empresa.com')
formData.append('description', 'Relatorio de producao do mes')
formData.append('expirationHours', '72')`,
        responseExample: `{
  "success": true,
  "message": "Upload realizado com sucesso",
  "data": {
    "uploadId": "upl_xyz789",
    "name": "Relatorio Mensal Janeiro",
    "recipientEmail": "fornecedor@empresa.com",
    "files": [
      {
        "name": "relatorio.pdf",
        "size": 2457600,
        "type": "application/pdf",
        "s3Key": "uploads/2024/01/upl_xyz789/relatorio.pdf"
      }
    ],
    "status": "pending_approval",
    "expirationHours": 72,
    "createdAt": "2024-01-20T14:30:00Z"
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "NO_FILES", status: 400, description: "Nenhum arquivo enviado" },
          { code: "VALIDATION_ERROR", status: 400, description: "Campos obrigatorios faltando" },
          { code: "FILE_TOO_LARGE", status: 400, description: "Arquivo excede limite de 100MB" },
          { code: "INVALID_FILE_TYPE", status: 400, description: "Tipo de arquivo nao permitido" },
          { code: "STORAGE_ERROR", status: 500, description: "Erro ao salvar no S3" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
        notes: [
          "Limite maximo por arquivo: 100MB",
          "Limite maximo total: 500MB por upload",
          "Tipos permitidos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, ZIP, RAR, JPG, PNG",
          "Arquivos sao salvos no S3 com criptografia AES-256",
          "O upload fica com status 'pending_approval' ate o supervisor aprovar",
        ],
      },
      {
        method: "GET",
        path: "/api/files",
        pythonPath: "/v1/files",
        title: "Listar Arquivos",
        description: "Lista todos os uploads/compartilhamentos do usuario autenticado.",
        auth: true,
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        queryParams: [
          { name: "status", type: "string", required: false, description: "Filtrar por status: pending_approval | approved | rejected | expired | cancelled" },
          { name: "page", type: "number", required: false, description: "Pagina (padrao: 1)" },
          { name: "limit", type: "number", required: false, description: "Itens por pagina (padrao: 20, max: 100)" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "data", type: "array", required: true, description: "Lista de uploads" },
          { name: "data[].id", type: "string", required: true, description: "ID do upload" },
          { name: "data[].name", type: "string", required: true, description: "Nome do compartilhamento" },
          { name: "data[].recipientEmail", type: "string", required: true, description: "Email do destinatario" },
          { name: "data[].description", type: "string", required: false, description: "Descricao" },
          { name: "data[].status", type: "string", required: true, description: "Status atual" },
          { name: "data[].files", type: "array", required: true, description: "Arquivos do upload" },
          { name: "data[].expirationHours", type: "number", required: true, description: "Horas para expirar" },
          { name: "data[].expiresAt", type: "string", required: false, description: "Data de expiracao (se aprovado)" },
          { name: "data[].createdAt", type: "string", required: true, description: "Data de criacao" },
          { name: "data[].workflow", type: "object", required: true, description: "Status do fluxo de aprovacao" },
          { name: "pagination", type: "object", required: true, description: "Informacoes de paginacao" },
        ],
        responseExample: `{
  "success": true,
  "data": [
    {
      "id": "upl_xyz789",
      "name": "Relatorio Mensal Janeiro",
      "recipientEmail": "fornecedor@empresa.com",
      "description": "Relatorio de producao",
      "status": "approved",
      "files": [
        { "name": "relatorio.pdf", "size": 2457600, "type": "application/pdf" }
      ],
      "expirationHours": 72,
      "expiresAt": "2024-01-23T14:30:00Z",
      "createdAt": "2024-01-20T14:30:00Z",
      "workflow": {
        "currentStep": 2,
        "totalSteps": 2,
        "status": "approved"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 45
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
      },
      {
        method: "GET",
        path: "/api/files/[fileId]",
        pythonPath: "/v1/files/{file_id}",
        title: "Detalhes do Arquivo",
        description: "Retorna detalhes completos de um upload especifico.",
        auth: true,
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "data.id", type: "string", required: true, description: "ID do upload" },
          { name: "data.name", type: "string", required: true, description: "Nome do compartilhamento" },
          { name: "data.recipientEmail", type: "string", required: true, description: "Email do destinatario" },
          { name: "data.description", type: "string", required: false, description: "Descricao" },
          { name: "data.status", type: "string", required: true, description: "Status atual" },
          { name: "data.files", type: "array", required: true, description: "Lista completa de arquivos" },
          { name: "data.sender", type: "object", required: true, description: "Dados do remetente" },
          { name: "data.workflow", type: "object", required: true, description: "Fluxo de aprovacao completo" },
          { name: "data.workflow.steps", type: "array", required: true, description: "Etapas do workflow" },
          { name: "data.downloadCount", type: "number", required: true, description: "Numero de downloads realizados" },
          { name: "data.lastDownloadAt", type: "string", required: false, description: "Data do ultimo download" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "id": "upl_xyz789",
    "name": "Relatorio Mensal Janeiro",
    "recipientEmail": "fornecedor@empresa.com",
    "description": "Relatorio de producao do mes",
    "status": "approved",
    "files": [
      {
        "name": "relatorio.pdf",
        "size": 2457600,
        "type": "application/pdf",
        "s3Key": "uploads/2024/01/upl_xyz789/relatorio.pdf"
      }
    ],
    "sender": {
      "id": "usr_abc123",
      "name": "Joao da Silva",
      "email": "joao.silva@petrobras.com.br",
      "department": "Engenharia"
    },
    "workflow": {
      "currentStep": 2,
      "totalSteps": 2,
      "status": "approved",
      "steps": [
        {
          "id": "step_1",
          "name": "Aprovacao Supervisor",
          "approver": "Maria Santos",
          "role": "supervisor",
          "status": "approved",
          "date": "2024-01-20T16:00:00Z",
          "comments": "Aprovado"
        }
      ]
    },
    "downloadCount": 3,
    "lastDownloadAt": "2024-01-21T10:00:00Z",
    "expirationHours": 72,
    "expiresAt": "2024-01-23T14:30:00Z",
    "createdAt": "2024-01-20T14:30:00Z"
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "NOT_FOUND", status: 404, description: "Upload nao encontrado" },
          { code: "FORBIDDEN", status: 403, description: "Sem permissao para ver este upload" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
      },
      {
        method: "DELETE",
        path: "/api/files/[fileId]",
        pythonPath: "/v1/files/{file_id}",
        title: "Cancelar/Excluir Upload",
        description: "Cancela um upload pendente ou exclui um upload aprovado (antes de ser baixado).",
        auth: true,
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "message", type: "string", required: true, description: "Mensagem de confirmacao" },
        ],
        responseExample: `{
  "success": true,
  "message": "Upload cancelado com sucesso"
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "NOT_FOUND", status: 404, description: "Upload nao encontrado" },
          { code: "FORBIDDEN", status: 403, description: "Sem permissao ou arquivo ja foi baixado" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
        notes: [
          "Usuario so pode cancelar seus proprios uploads",
          "Nao e possivel cancelar se o arquivo ja foi baixado",
          "Ao cancelar, os arquivos sao removidos do S3",
        ],
      },
    ],
  },
  // =============================================
  // SUPERVISOR
  // =============================================
  {
    id: "supervisor",
    title: "Supervisor",
    description: "Endpoints para aprovacao, rejeicao e gerenciamento de uploads pendentes",
    icon: Shield,
    color: "bg-purple-500",
    endpoints: [
      {
        method: "GET",
        path: "/api/supervisor/pending",
        pythonPath: "/v1/supervisor/pending",
        title: "Listar Pendentes",
        description: "Lista todos os uploads pendentes de aprovacao para o supervisor.",
        auth: true,
        roles: ["supervisor", "admin"],
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        queryParams: [
          { name: "page", type: "number", required: false, description: "Pagina (padrao: 1)" },
          { name: "limit", type: "number", required: false, description: "Itens por pagina (padrao: 20)" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "data", type: "array", required: true, description: "Lista de uploads pendentes" },
          { name: "data[].id", type: "string", required: true, description: "ID do upload" },
          { name: "data[].name", type: "string", required: true, description: "Nome do compartilhamento" },
          { name: "data[].recipientEmail", type: "string", required: true, description: "Email do destinatario" },
          { name: "data[].sender", type: "object", required: true, description: "Dados do remetente" },
          { name: "data[].sender.id", type: "string", required: true, description: "ID do remetente" },
          { name: "data[].sender.name", type: "string", required: true, description: "Nome do remetente" },
          { name: "data[].sender.email", type: "string", required: true, description: "Email do remetente" },
          { name: "data[].sender.department", type: "string", required: true, description: "Departamento" },
          { name: "data[].sender.employeeId", type: "string", required: true, description: "Matricula" },
          { name: "data[].files", type: "array", required: true, description: "Arquivos do upload" },
          { name: "data[].createdAt", type: "string", required: true, description: "Data de criacao" },
          { name: "pagination", type: "object", required: true, description: "Informacoes de paginacao" },
        ],
        responseExample: `{
  "success": true,
  "data": [
    {
      "id": "upl_xyz789",
      "name": "Relatorio Mensal Janeiro",
      "recipientEmail": "fornecedor@empresa.com",
      "description": "Relatorio de producao",
      "sender": {
        "id": "usr_abc123",
        "name": "Joao da Silva",
        "email": "joao.silva@petrobras.com.br",
        "department": "Engenharia de Producao",
        "employeeId": "123456"
      },
      "files": [
        { "name": "relatorio.pdf", "size": 2457600, "type": "application/pdf" }
      ],
      "expirationHours": 72,
      "createdAt": "2024-01-20T14:30:00Z",
      "workflow": {
        "currentStep": 1,
        "totalSteps": 2,
        "steps": []
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "FORBIDDEN", status: 403, description: "Usuario nao e supervisor" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
      },
      {
        method: "POST",
        path: "/api/supervisor/approve/[fileId]",
        pythonPath: "/v1/supervisor/approve/{file_id}",
        title: "Aprovar Upload",
        description: "Aprova um upload pendente. Envia email de notificacao ao destinatario.",
        auth: true,
        roles: ["supervisor", "admin"],
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        requestBody: [
          { name: "comments", type: "string", required: false, description: "Comentarios da aprovacao" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "message", type: "string", required: true, description: "Mensagem de confirmacao" },
          { name: "data.status", type: "string", required: true, description: "Novo status: approved" },
          { name: "data.approvedAt", type: "string", required: true, description: "Data da aprovacao" },
          { name: "data.approvedBy", type: "string", required: true, description: "Nome do aprovador" },
          { name: "data.expiresAt", type: "string", required: true, description: "Data de expiracao calculada" },
        ],
        requestExample: `{
  "comments": "Aprovado conforme solicitacao"
}`,
        responseExample: `{
  "success": true,
  "message": "Upload aprovado com sucesso. Email enviado ao destinatario.",
  "data": {
    "status": "approved",
    "approvedAt": "2024-01-20T16:00:00Z",
    "approvedBy": "Maria Santos",
    "expiresAt": "2024-01-23T16:00:00Z"
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "FORBIDDEN", status: 403, description: "Sem permissao para aprovar" },
          { code: "NOT_FOUND", status: 404, description: "Upload nao encontrado" },
          { code: "INVALID_STATUS", status: 400, description: "Upload nao esta pendente" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
        notes: [
          "Ao aprovar, o sistema deve enviar email ao destinatario com link para download",
          "O link de download contem um token unico de acesso",
          "Registrar a aprovacao nos logs de auditoria",
          "A data de expiracao e calculada a partir da aprovacao",
        ],
      },
      {
        method: "POST",
        path: "/api/supervisor/reject/[fileId]",
        pythonPath: "/v1/supervisor/reject/{file_id}",
        title: "Rejeitar Upload",
        description: "Rejeita um upload pendente. Notifica o remetente.",
        auth: true,
        roles: ["supervisor", "admin"],
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        requestBody: [
          { name: "reason", type: "string", required: true, description: "Motivo da rejeicao (obrigatorio)" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "message", type: "string", required: true, description: "Mensagem de confirmacao" },
          { name: "data.status", type: "string", required: true, description: "Novo status: rejected" },
          { name: "data.rejectedAt", type: "string", required: true, description: "Data da rejeicao" },
          { name: "data.rejectedBy", type: "string", required: true, description: "Nome do supervisor" },
          { name: "data.reason", type: "string", required: true, description: "Motivo da rejeicao" },
        ],
        requestExample: `{
  "reason": "Arquivo confidencial nao pode ser compartilhado externamente"
}`,
        responseExample: `{
  "success": true,
  "message": "Upload rejeitado. Remetente notificado.",
  "data": {
    "status": "rejected",
    "rejectedAt": "2024-01-20T16:00:00Z",
    "rejectedBy": "Maria Santos",
    "reason": "Arquivo confidencial nao pode ser compartilhado externamente"
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "FORBIDDEN", status: 403, description: "Sem permissao para rejeitar" },
          { code: "NOT_FOUND", status: 404, description: "Upload nao encontrado" },
          { code: "VALIDATION_ERROR", status: 400, description: "Motivo e obrigatorio" },
          { code: "INVALID_STATUS", status: 400, description: "Upload nao esta pendente" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
        notes: [
          "O motivo da rejeicao e OBRIGATORIO",
          "Enviar email ao remetente informando a rejeicao",
          "Os arquivos devem ser removidos do S3 apos rejeicao",
        ],
      },
      {
        method: "PUT",
        path: "/api/supervisor/extend/[fileId]",
        pythonPath: "/v1/supervisor/extend/{file_id}",
        title: "Estender Expiracao",
        description: "Estende o prazo de expiracao de um upload aprovado.",
        auth: true,
        roles: ["supervisor", "admin"],
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        requestBody: [
          { name: "additionalHours", type: "number", required: true, description: "Horas adicionais (max: 168)" },
          { name: "reason", type: "string", required: false, description: "Motivo da extensao" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "message", type: "string", required: true, description: "Mensagem de confirmacao" },
          { name: "data.newExpiresAt", type: "string", required: true, description: "Nova data de expiracao" },
          { name: "data.totalHours", type: "number", required: true, description: "Total de horas de expiracao" },
        ],
        requestExample: `{
  "additionalHours": 48,
  "reason": "Destinatario solicitou mais tempo"
}`,
        responseExample: `{
  "success": true,
  "message": "Prazo estendido com sucesso",
  "data": {
    "newExpiresAt": "2024-01-25T16:00:00Z",
    "totalHours": 120
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "FORBIDDEN", status: 403, description: "Sem permissao" },
          { code: "NOT_FOUND", status: 404, description: "Upload nao encontrado" },
          { code: "INVALID_STATUS", status: 400, description: "Upload nao esta aprovado" },
          { code: "MAX_EXTENSION", status: 400, description: "Limite maximo de extensao atingido" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
        notes: [
          "Extensao maxima total: 168 horas (7 dias)",
          "Somente uploads aprovados podem ter prazo estendido",
          "Registrar extensao nos logs de auditoria",
        ],
      },
    ],
  },
  // =============================================
  // DOWNLOAD EXTERNO
  // =============================================
  {
    id: "download",
    title: "Download Externo",
    description: "Endpoints para usuarios externos baixarem arquivos compartilhados",
    icon: Download,
    color: "bg-orange-500",
    endpoints: [
      {
        method: "POST",
        path: "/api/download/verify",
        pythonPath: "/v1/download/verify",
        title: "Verificar Email",
        description: "Verifica se existem arquivos para o email e envia codigo OTP.",
        auth: false,
        requestBody: [
          { name: "email", type: "string", required: true, description: "Email do destinatario", example: "fornecedor@empresa.com" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "message", type: "string", required: true, description: "Mensagem informativa" },
          { name: "data.hasFiles", type: "boolean", required: true, description: "Se existem arquivos disponiveis" },
          { name: "data.fileCount", type: "number", required: true, description: "Quantidade de arquivos" },
          { name: "data.otpSent", type: "boolean", required: true, description: "Se o OTP foi enviado" },
          { name: "data.expiresIn", type: "number", required: true, description: "Segundos ate o OTP expirar" },
        ],
        requestExample: `{
  "email": "fornecedor@empresa.com"
}`,
        responseExample: `{
  "success": true,
  "message": "Codigo de verificacao enviado para o email",
  "data": {
    "hasFiles": true,
    "fileCount": 3,
    "otpSent": true,
    "expiresIn": 300
  }
}`,
        errorCodes: [
          { code: "VALIDATION_ERROR", status: 400, description: "Email nao fornecido" },
          { code: "INVALID_EMAIL", status: 400, description: "Formato de email invalido" },
          { code: "NO_FILES", status: 404, description: "Nenhum arquivo disponivel para este email" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
        notes: [
          "O codigo OTP tem 6 digitos numericos",
          "OTP expira em 5 minutos (300 segundos)",
          "Maximo de 3 tentativas de envio por hora",
          "Enviar OTP via AWS SES",
        ],
      },
      {
        method: "POST",
        path: "/api/download/authenticate",
        pythonPath: "/v1/download/authenticate",
        title: "Autenticar com OTP",
        description: "Autentica o usuario externo com o codigo OTP recebido por email.",
        auth: false,
        requestBody: [
          { name: "email", type: "string", required: true, description: "Email do destinatario" },
          { name: "code", type: "string", required: true, description: "Codigo OTP de 6 digitos", example: "123456" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a autenticacao foi bem sucedida" },
          { name: "message", type: "string", required: true, description: "Mensagem de confirmacao" },
          { name: "data.token", type: "string", required: true, description: "Token de acesso temporario" },
          { name: "data.expiresIn", type: "number", required: true, description: "Segundos ate o token expirar" },
          { name: "data.email", type: "string", required: true, description: "Email autenticado" },
          { name: "data.fileCount", type: "number", required: true, description: "Quantidade de arquivos disponiveis" },
        ],
        requestExample: `{
  "email": "fornecedor@empresa.com",
  "code": "123456"
}`,
        responseExample: `{
  "success": true,
  "message": "Autenticacao realizada com sucesso",
  "data": {
    "token": "ext_token_abc123...",
    "expiresIn": 3600,
    "email": "fornecedor@empresa.com",
    "fileCount": 3
  }
}`,
        errorCodes: [
          { code: "VALIDATION_ERROR", status: 400, description: "Campos obrigatorios faltando" },
          { code: "INVALID_CODE", status: 400, description: "Codigo deve ter 6 digitos" },
          { code: "AUTH_FAILED", status: 401, description: "Codigo invalido ou expirado" },
          { code: "MAX_ATTEMPTS", status: 429, description: "Muitas tentativas, aguarde 15 minutos" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
        notes: [
          "Maximo de 5 tentativas de codigo por sessao",
          "Token de acesso expira em 1 hora",
          "Registrar autenticacao nos logs de auditoria",
        ],
      },
      {
        method: "GET",
        path: "/api/download/files",
        pythonPath: "/v1/download/files",
        title: "Listar Arquivos Disponiveis",
        description: "Lista todos os arquivos disponiveis para download do usuario externo.",
        auth: true,
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {ext_token}" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "data", type: "array", required: true, description: "Lista de uploads disponiveis" },
          { name: "data[].uploadId", type: "string", required: true, description: "ID do upload" },
          { name: "data[].name", type: "string", required: true, description: "Nome do compartilhamento" },
          { name: "data[].sender", type: "object", required: true, description: "Dados do remetente" },
          { name: "data[].sender.name", type: "string", required: true, description: "Nome do remetente" },
          { name: "data[].sender.email", type: "string", required: true, description: "Email do remetente" },
          { name: "data[].files", type: "array", required: true, description: "Lista de arquivos" },
          { name: "data[].expiresAt", type: "string", required: true, description: "Data de expiracao" },
          { name: "data[].createdAt", type: "string", required: true, description: "Data de criacao" },
        ],
        responseExample: `{
  "success": true,
  "data": [
    {
      "uploadId": "upl_xyz789",
      "name": "Relatorio Mensal Janeiro",
      "sender": {
        "name": "Joao da Silva",
        "email": "joao.silva@petrobras.com.br"
      },
      "files": [
        {
          "id": "file_001",
          "name": "relatorio.pdf",
          "size": 2457600,
          "type": "application/pdf"
        }
      ],
      "expiresAt": "2024-01-23T16:00:00Z",
      "createdAt": "2024-01-20T14:30:00Z"
    }
  ]
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido ou expirado" },
          { code: "NO_FILES", status: 404, description: "Nenhum arquivo disponivel" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
      },
      {
        method: "GET",
        path: "/api/download/files/[fileId]/url",
        pythonPath: "/v1/download/files/{file_id}/url",
        title: "Obter URL de Download",
        description: "Gera URL pre-assinada do S3 para download do arquivo.",
        auth: true,
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {ext_token}" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "data.downloadUrl", type: "string", required: true, description: "URL pre-assinada do S3" },
          { name: "data.expiresIn", type: "number", required: true, description: "Segundos ate a URL expirar" },
          { name: "data.fileName", type: "string", required: true, description: "Nome do arquivo" },
          { name: "data.fileSize", type: "number", required: true, description: "Tamanho em bytes" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "downloadUrl": "https://bucket.s3.amazonaws.com/uploads/...?X-Amz-Signature=...",
    "expiresIn": 300,
    "fileName": "relatorio.pdf",
    "fileSize": 2457600
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "NOT_FOUND", status: 404, description: "Arquivo nao encontrado" },
          { code: "EXPIRED", status: 410, description: "Arquivo expirado" },
          { code: "FORBIDDEN", status: 403, description: "Sem permissao para este arquivo" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
        notes: [
          "URL pre-assinada expira em 5 minutos (300 segundos)",
          "Cada download deve ser registrado nos logs de auditoria",
          "Incrementar contador de downloads do upload",
        ],
      },
    ],
  },
  // =============================================
  // NOTIFICACOES
  // =============================================
  {
    id: "notifications",
    title: "Notificacoes",
    description: "Endpoints para gerenciar notificacoes do usuario",
    icon: Bell,
    color: "bg-yellow-500",
    endpoints: [
      {
        method: "GET",
        path: "/api/notifications",
        pythonPath: "/v1/notifications",
        title: "Listar Notificacoes",
        description: "Lista as notificacoes do usuario autenticado.",
        auth: true,
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        queryParams: [
          { name: "unreadOnly", type: "boolean", required: false, description: "Filtrar apenas nao lidas" },
          { name: "page", type: "number", required: false, description: "Pagina (padrao: 1)" },
          { name: "limit", type: "number", required: false, description: "Itens por pagina (padrao: 20)" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "data", type: "array", required: true, description: "Lista de notificacoes" },
          { name: "data[].id", type: "string", required: true, description: "ID da notificacao" },
          { name: "data[].type", type: "string", required: true, description: "Tipo: approval | rejection | download | expiration | system" },
          { name: "data[].priority", type: "string", required: true, description: "Prioridade: low | medium | high | urgent" },
          { name: "data[].title", type: "string", required: true, description: "Titulo da notificacao" },
          { name: "data[].message", type: "string", required: true, description: "Mensagem completa" },
          { name: "data[].read", type: "boolean", required: true, description: "Se foi lida" },
          { name: "data[].timestamp", type: "string", required: true, description: "Data da notificacao" },
          { name: "data[].actionLabel", type: "string", required: false, description: "Label do botao de acao" },
          { name: "data[].actionUrl", type: "string", required: false, description: "URL da acao" },
          { name: "unreadCount", type: "number", required: true, description: "Total de notificacoes nao lidas" },
        ],
        responseExample: `{
  "success": true,
  "data": [
    {
      "id": "notif_001",
      "type": "approval",
      "priority": "high",
      "title": "Upload Aprovado",
      "message": "Seu compartilhamento 'Relatorio Mensal' foi aprovado",
      "read": false,
      "timestamp": "2024-01-20T16:00:00Z",
      "actionLabel": "Ver detalhes",
      "actionUrl": "/uploads/upl_xyz789"
    }
  ],
  "unreadCount": 5,
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 25
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
      },
      {
        method: "PUT",
        path: "/api/notifications/[notificationId]/read",
        pythonPath: "/v1/notifications/{notification_id}/read",
        title: "Marcar como Lida",
        description: "Marca uma notificacao especifica como lida.",
        auth: true,
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "message", type: "string", required: true, description: "Mensagem de confirmacao" },
        ],
        responseExample: `{
  "success": true,
  "message": "Notificacao marcada como lida"
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "NOT_FOUND", status: 404, description: "Notificacao nao encontrada" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
      },
      {
        method: "PUT",
        path: "/api/notifications/read-all",
        pythonPath: "/v1/notifications/read-all",
        title: "Marcar Todas como Lidas",
        description: "Marca todas as notificacoes do usuario como lidas.",
        auth: true,
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "message", type: "string", required: true, description: "Mensagem de confirmacao" },
          { name: "data.markedCount", type: "number", required: true, description: "Quantidade marcada como lida" },
        ],
        responseExample: `{
  "success": true,
  "message": "Todas as notificacoes marcadas como lidas",
  "data": {
    "markedCount": 5
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
      },
    ],
  },
  // =============================================
  // AUDITORIA
  // =============================================
  {
    id: "audit",
    title: "Auditoria",
    description: "Endpoints para logs de auditoria e metricas do sistema",
    icon: ClipboardList,
    color: "bg-slate-500",
    endpoints: [
      {
        method: "GET",
        path: "/api/audit/logs",
        pythonPath: "/v1/audit/logs",
        title: "Listar Logs",
        description: "Lista logs de auditoria do sistema. Apenas supervisores/admins.",
        auth: true,
        roles: ["supervisor", "admin"],
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        queryParams: [
          { name: "userId", type: "string", required: false, description: "Filtrar por usuario" },
          { name: "action", type: "string", required: false, description: "Filtrar por acao: login, logout, upload, approve, reject, download, extend, cancel" },
          { name: "fileId", type: "string", required: false, description: "Filtrar por arquivo" },
          { name: "startDate", type: "string", required: false, description: "Data inicial (ISO 8601)" },
          { name: "endDate", type: "string", required: false, description: "Data final (ISO 8601)" },
          { name: "level", type: "string", required: false, description: "Nivel: info, warning, error, success" },
          { name: "page", type: "number", required: false, description: "Pagina (padrao: 1)" },
          { name: "limit", type: "number", required: false, description: "Itens por pagina (padrao: 50)" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "data", type: "array", required: true, description: "Lista de logs" },
          { name: "data[].id", type: "string", required: true, description: "ID do log" },
          { name: "data[].timestamp", type: "string", required: true, description: "Data/hora do evento" },
          { name: "data[].action", type: "string", required: true, description: "Acao realizada" },
          { name: "data[].level", type: "string", required: true, description: "Nivel do log" },
          { name: "data[].user", type: "object", required: true, description: "Usuario que realizou a acao" },
          { name: "data[].user.id", type: "string", required: true, description: "ID do usuario" },
          { name: "data[].user.name", type: "string", required: true, description: "Nome do usuario" },
          { name: "data[].user.email", type: "string", required: true, description: "Email" },
          { name: "data[].user.type", type: "string", required: true, description: "Tipo: internal | external" },
          { name: "data[].details", type: "object", required: true, description: "Detalhes da acao" },
          { name: "data[].details.targetId", type: "string", required: false, description: "ID do alvo (arquivo, etc)" },
          { name: "data[].details.description", type: "string", required: true, description: "Descricao da acao" },
          { name: "data[].details.ipAddress", type: "string", required: true, description: "IP do usuario" },
          { name: "pagination", type: "object", required: true, description: "Informacoes de paginacao" },
        ],
        responseExample: `{
  "success": true,
  "data": [
    {
      "id": "log_001",
      "timestamp": "2024-01-20T16:00:00Z",
      "action": "approve",
      "level": "success",
      "user": {
        "id": "usr_sup001",
        "name": "Maria Santos",
        "email": "maria.santos@petrobras.com.br",
        "type": "internal",
        "employeeId": "654321"
      },
      "details": {
        "targetId": "upl_xyz789",
        "targetName": "Relatorio Mensal Janeiro",
        "description": "Upload aprovado pelo supervisor",
        "ipAddress": "10.0.0.50",
        "metadata": {
          "recipientEmail": "fornecedor@empresa.com"
        }
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 487,
    "itemsPerPage": 50
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "FORBIDDEN", status: 403, description: "Sem permissao para ver logs" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
        notes: [
          "Logs devem ser armazenados por no minimo 1 ano",
          "Dados sensiveis (senhas) nunca devem aparecer nos logs",
          "Registrar IP, User-Agent e timestamp de todas as acoes",
        ],
      },
      {
        method: "GET",
        path: "/api/audit/metrics",
        pythonPath: "/v1/audit/metrics",
        title: "Metricas do Sistema",
        description: "Retorna metricas e estatisticas do sistema. Apenas admins.",
        auth: true,
        roles: ["admin"],
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        queryParams: [
          { name: "period", type: "string", required: false, description: "Periodo: today, week, month, year (padrao: month)" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "data.uploads", type: "object", required: true, description: "Metricas de uploads" },
          { name: "data.uploads.total", type: "number", required: true, description: "Total de uploads" },
          { name: "data.uploads.pending", type: "number", required: true, description: "Uploads pendentes" },
          { name: "data.uploads.approved", type: "number", required: true, description: "Uploads aprovados" },
          { name: "data.uploads.rejected", type: "number", required: true, description: "Uploads rejeitados" },
          { name: "data.uploads.expired", type: "number", required: true, description: "Uploads expirados" },
          { name: "data.downloads", type: "object", required: true, description: "Metricas de downloads" },
          { name: "data.downloads.total", type: "number", required: true, description: "Total de downloads" },
          { name: "data.downloads.uniqueUsers", type: "number", required: true, description: "Usuarios unicos" },
          { name: "data.storage", type: "object", required: true, description: "Uso de armazenamento" },
          { name: "data.storage.totalBytes", type: "number", required: true, description: "Total em bytes" },
          { name: "data.storage.fileCount", type: "number", required: true, description: "Quantidade de arquivos" },
          { name: "data.users", type: "object", required: true, description: "Metricas de usuarios" },
          { name: "data.users.active", type: "number", required: true, description: "Usuarios ativos no periodo" },
          { name: "data.users.newLogins", type: "number", required: true, description: "Novos logins" },
          { name: "data.approvalTime", type: "object", required: true, description: "Tempo medio de aprovacao" },
          { name: "data.approvalTime.avgHours", type: "number", required: true, description: "Media em horas" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "period": "month",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "uploads": {
      "total": 156,
      "pending": 12,
      "approved": 130,
      "rejected": 8,
      "expired": 6,
      "cancelled": 0
    },
    "downloads": {
      "total": 245,
      "uniqueUsers": 89,
      "avgPerFile": 1.88
    },
    "storage": {
      "totalBytes": 5368709120,
      "totalFormatted": "5 GB",
      "fileCount": 312
    },
    "users": {
      "total": 150,
      "active": 78,
      "newLogins": 12,
      "byRole": {
        "employee": 140,
        "supervisor": 8,
        "admin": 2
      }
    },
    "approvalTime": {
      "avgHours": 4.5,
      "minHours": 0.5,
      "maxHours": 24
    }
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "FORBIDDEN", status: 403, description: "Apenas admins podem ver metricas" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
      },
    ],
  },
  // =============================================
  // EMAILS
  // =============================================
  {
    id: "emails",
    title: "Emails",
    description: "Endpoints para envio e gerenciamento de emails",
    icon: Mail,
    color: "bg-cyan-500",
    endpoints: [
      {
        method: "POST",
        path: "/api/emails/send",
        pythonPath: "/v1/emails/send",
        title: "Enviar Email",
        description: "Envia email de notificacao usando AWS SES.",
        auth: true,
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        requestBody: [
          { name: "to", type: "array", required: true, description: "Lista de destinatarios" },
          { name: "to[].email", type: "string", required: true, description: "Email do destinatario" },
          { name: "to[].name", type: "string", required: false, description: "Nome do destinatario" },
          { name: "cc", type: "array", required: false, description: "Lista de copia" },
          { name: "subject", type: "string", required: true, description: "Assunto do email" },
          { name: "body", type: "string", required: true, description: "Corpo do email em texto" },
          { name: "htmlBody", type: "string", required: false, description: "Corpo do email em HTML" },
          { name: "templateId", type: "string", required: false, description: "ID do template de email" },
          { name: "templateData", type: "object", required: false, description: "Dados para o template" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se o envio foi bem sucedido" },
          { name: "data.messageId", type: "string", required: true, description: "ID da mensagem no SES" },
          { name: "data.status", type: "string", required: true, description: "Status: sent" },
        ],
        requestExample: `{
  "to": [
    { "email": "fornecedor@empresa.com", "name": "Fornecedor" }
  ],
  "subject": "Arquivos disponiveis para download",
  "body": "Voce tem arquivos disponiveis...",
  "htmlBody": "<h1>Voce tem arquivos disponiveis</h1>..."
}`,
        responseExample: `{
  "success": true,
  "data": {
    "messageId": "0102018d1234abcd-12345678-1234-1234-1234-123456789012-000000",
    "status": "sent"
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "VALIDATION_ERROR", status: 400, description: "Campos obrigatorios faltando" },
          { code: "INVALID_EMAIL", status: 400, description: "Email invalido na lista" },
          { code: "EMAIL_SEND_ERROR", status: 500, description: "Erro ao enviar email via SES" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
        notes: [
          "Usar AWS SES para envio",
          "Dominio de envio: @petrobras.com.br (deve estar verificado no SES)",
          "Templates de email devem ser definidos no SES",
        ],
      },
      {
        method: "GET",
        path: "/api/emails/history",
        pythonPath: "/v1/emails/history",
        title: "Historico de Emails",
        description: "Lista historico de emails enviados.",
        auth: true,
        roles: ["supervisor", "admin"],
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        queryParams: [
          { name: "recipientEmail", type: "string", required: false, description: "Filtrar por destinatario" },
          { name: "status", type: "string", required: false, description: "Filtrar por status" },
          { name: "page", type: "number", required: false, description: "Pagina" },
          { name: "limit", type: "number", required: false, description: "Itens por pagina" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "data", type: "array", required: true, description: "Lista de emails" },
          { name: "data[].messageId", type: "string", required: true, description: "ID da mensagem" },
          { name: "data[].to", type: "array", required: true, description: "Destinatarios" },
          { name: "data[].subject", type: "string", required: true, description: "Assunto" },
          { name: "data[].status", type: "string", required: true, description: "Status do envio" },
          { name: "data[].sentAt", type: "string", required: true, description: "Data de envio" },
        ],
        responseExample: `{
  "success": true,
  "data": [
    {
      "messageId": "msg_001",
      "to": [{ "email": "fornecedor@empresa.com" }],
      "subject": "Arquivos disponiveis para download",
      "status": "delivered",
      "sentAt": "2024-01-20T16:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 45
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "FORBIDDEN", status: 403, description: "Sem permissao" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
      },
      {
        method: "GET",
        path: "/api/emails/[messageId]/status",
        pythonPath: "/v1/emails/{message_id}/status",
        title: "Status do Email",
        description: "Verifica status de entrega de um email especifico.",
        auth: true,
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer {token}" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se a operacao foi bem sucedida" },
          { name: "data.messageId", type: "string", required: true, description: "ID da mensagem" },
          { name: "data.status", type: "string", required: true, description: "Status: sent | delivered | bounced | failed" },
          { name: "data.sentAt", type: "string", required: true, description: "Data de envio" },
          { name: "data.deliveredAt", type: "string", required: false, description: "Data de entrega" },
          { name: "data.error", type: "string", required: false, description: "Mensagem de erro (se falhou)" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "messageId": "msg_001",
    "status": "delivered",
    "sentAt": "2024-01-20T16:00:00Z",
    "deliveredAt": "2024-01-20T16:00:05Z"
  }
}`,
        errorCodes: [
          { code: "UNAUTHORIZED", status: 401, description: "Token invalido" },
          { code: "NOT_FOUND", status: 404, description: "Email nao encontrado" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
      },
      {
        method: "POST",
        path: "/api/send-otp-email",
        pythonPath: "/v1/otp/send",
        title: "Enviar Email OTP",
        description: "Envia codigo OTP para usuario externo fazer download.",
        auth: false,
        requestBody: [
          { name: "email", type: "string", required: true, description: "Email do destinatario externo" },
          { name: "type", type: "string", required: false, description: "Tipo: download (padrao)" },
        ],
        responseFields: [
          { name: "success", type: "boolean", required: true, description: "Indica se o OTP foi enviado" },
          { name: "message", type: "string", required: true, description: "Mensagem informativa" },
          { name: "data.expiresIn", type: "number", required: true, description: "Segundos ate expirar" },
        ],
        requestExample: `{
  "email": "fornecedor@empresa.com",
  "type": "download"
}`,
        responseExample: `{
  "success": true,
  "message": "Codigo enviado com sucesso",
  "data": {
    "expiresIn": 300
  }
}`,
        errorCodes: [
          { code: "VALIDATION_ERROR", status: 400, description: "Email nao fornecido" },
          { code: "NO_FILES", status: 404, description: "Nenhum arquivo para este email" },
          { code: "RATE_LIMIT", status: 429, description: "Muitas solicitacoes, aguarde" },
          { code: "SERVER_ERROR", status: 500, description: "Erro interno do servidor" },
        ],
        notes: [
          "OTP de 6 digitos numericos",
          "Expira em 5 minutos",
          "Maximo 3 envios por hora por email",
        ],
      },
    ],
  },
]

// Componente para badge de metodo HTTP
function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-green-100 text-green-800 border-green-300",
    POST: "bg-blue-100 text-blue-800 border-blue-300",
    PUT: "bg-yellow-100 text-yellow-800 border-yellow-300",
    DELETE: "bg-red-100 text-red-800 border-red-300",
    PATCH: "bg-purple-100 text-purple-800 border-purple-300",
  }
  return (
    <Badge className={`${colors[method]} font-mono text-xs px-2 py-0.5 border`}>
      {method}
    </Badge>
  )
}

// Componente para copiar codigo
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 w-6 p-0">
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  )
}

// Componente para exibir bloco de codigo
function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  return (
    <div className="relative mt-2 rounded-md bg-slate-900 p-3">
      <div className="absolute right-2 top-2">
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto text-xs text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// Componente para tabela de campos
function FieldsTable({ fields, title }: { fields: EndpointField[]; title: string }) {
  return (
    <div className="mt-4">
      <h5 className="mb-2 font-semibold text-slate-700">{title}</h5>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Campo</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Tipo</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Obrigatorio</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Descricao</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {fields.map((field, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-xs text-blue-600">{field.name}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {field.type}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  {field.required ? (
                    <Badge className="bg-red-100 text-red-700 text-xs">Sim</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Nao</Badge>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {field.description}
                  {field.example && (
                    <span className="ml-2 text-xs text-slate-400">Ex: {field.example}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Componente para exibir um endpoint
function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  return (
    <AccordionItem value={endpoint.path} className="border rounded-lg mb-3 overflow-hidden">
      <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <MethodBadge method={endpoint.method} />
          <span className="font-mono text-sm text-slate-700">{endpoint.path}</span>
          <span className="text-sm text-slate-500">- {endpoint.title}</span>
          {endpoint.auth && (
            <Lock className="h-3 w-3 text-amber-500" />
          )}
          {endpoint.roles && (
            <Badge variant="outline" className="text-xs">
              {endpoint.roles.join(", ")}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-4">
          {/* Descricao */}
          <div>
            <p className="text-sm text-slate-600">{endpoint.description}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                Backend: {endpoint.pythonPath}
              </Badge>
            </div>
          </div>

          {/* Headers */}
          {endpoint.headers && endpoint.headers.length > 0 && (
            <FieldsTable fields={endpoint.headers} title="Headers" />
          )}

          {/* Query Params */}
          {endpoint.queryParams && endpoint.queryParams.length > 0 && (
            <FieldsTable fields={endpoint.queryParams} title="Query Parameters" />
          )}

          {/* Request Body */}
          {endpoint.requestBody && endpoint.requestBody.length > 0 && (
            <FieldsTable fields={endpoint.requestBody} title="Request Body" />
          )}

          {/* Request Example */}
          {endpoint.requestExample && (
            <div>
              <h5 className="mb-2 font-semibold text-slate-700">Exemplo de Request</h5>
              <CodeBlock code={endpoint.requestExample} />
            </div>
          )}

          {/* Response Fields */}
          <FieldsTable fields={endpoint.responseFields} title="Response Fields" />

          {/* Response Example */}
          <div>
            <h5 className="mb-2 font-semibold text-slate-700">Exemplo de Response (Sucesso)</h5>
            <CodeBlock code={endpoint.responseExample} />
          </div>

          {/* Error Codes */}
          <div>
            <h5 className="mb-2 font-semibold text-slate-700">Codigos de Erro</h5>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Codigo</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Descricao</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {endpoint.errorCodes.map((error, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <Badge 
                          variant="outline" 
                          className={`font-mono text-xs ${
                            error.status >= 500 ? "border-red-300 text-red-600" :
                            error.status >= 400 ? "border-yellow-300 text-yellow-600" :
                            "border-green-300 text-green-600"
                          }`}
                        >
                          {error.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-700">{error.code}</td>
                      <td className="px-3 py-2 text-slate-600">{error.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {endpoint.notes && endpoint.notes.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Notas Importantes</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-disc pl-4 space-y-1">
                  {endpoint.notes.map((note, idx) => (
                    <li key={idx} className="text-sm">{note}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

// Pagina principal
export default function ApiEndpointsWikiPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Filtrar endpoints baseado na busca
  const filteredCategories = API_CATEGORIES.map(category => ({
    ...category,
    endpoints: category.endpoints.filter(endpoint =>
      endpoint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => 
    selectedCategory === "all" || category.id === selectedCategory
  ).filter(category => category.endpoints.length > 0)

  // Contar total de endpoints
  const totalEndpoints = API_CATEGORIES.reduce((acc, cat) => acc + cat.endpoints.length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/wiki-dev" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Voltar</span>
              </Link>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-slate-900">API Endpoints</span>
              </div>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Titulo e Descricao */}
        <div className="mb-8">
          <h1 className="mb-3 text-4xl font-bold text-slate-900">
            Documentacao de API para o Back-End
          </h1>
          <p className="text-lg text-slate-600">
            Guia completo de todos os endpoints que o Back-End Python precisa implementar para integrar com o Front-End.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <Badge className="bg-blue-100 text-blue-800">
              {totalEndpoints} Endpoints
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              {API_CATEGORIES.length} Categorias
            </Badge>
            <Badge className="bg-purple-100 text-purple-800">
              REST API
            </Badge>
          </div>
        </div>

        {/* Alerta Importante */}
        <Alert className="mb-8 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Informacao para o Desenvolvedor Back-End</AlertTitle>
          <AlertDescription className="text-amber-700">
            Esta documentacao contem todos os endpoints que o Front-End espera do Back-End Python.
            Cada endpoint lista os campos obrigatorios, tipos de dados, exemplos de request/response e codigos de erro.
            <strong className="block mt-2">Base URL do Backend: http://localhost:8000 (desenvolvimento)</strong>
          </AlertDescription>
        </Alert>

        {/* Filtros */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full sm:w-auto">
            <TabsList className="flex flex-wrap gap-1">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {API_CATEGORIES.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id} className="gap-1">
                  <cat.icon className="h-3 w-3" />
                  {cat.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Sumario Rapido */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sumario dos Endpoints
            </CardTitle>
            <CardDescription>
              Visao geral rapida de todos os endpoints por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {API_CATEGORIES.map(category => (
                <div 
                  key={category.id}
                  className="rounded-lg border p-4 hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`${category.color} rounded-lg p-2 text-white`}>
                      <category.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{category.title}</h4>
                      <p className="text-xs text-slate-500">{category.endpoints.length} endpoints</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {category.endpoints.slice(0, 3).map((ep, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <MethodBadge method={ep.method} />
                        <span className="font-mono text-slate-600 truncate">{ep.path}</span>
                      </div>
                    ))}
                    {category.endpoints.length > 3 && (
                      <p className="text-xs text-slate-400">+{category.endpoints.length - 3} mais...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Endpoints por Categoria */}
        <div className="space-y-8">
          {filteredCategories.map(category => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`${category.color} rounded-lg p-2 text-white`}>
                    <category.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {category.endpoints.map(endpoint => (
                    <EndpointCard key={endpoint.path} endpoint={endpoint} />
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Estrutura de Erro Padrao */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Estrutura de Resposta Padrao
            </CardTitle>
            <CardDescription>
              Todas as respostas devem seguir este formato padrao
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Resposta de Sucesso</h4>
              <CodeBlock code={`{
  "success": true,
  "message": "Operacao realizada com sucesso", // opcional
  "data": { ... } // dados da resposta
}`} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Resposta de Erro</h4>
              <CodeBlock code={`{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descricao do erro para o usuario"
  }
}`} />
            </div>
          </CardContent>
        </Card>

        {/* Autenticacao */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Autenticacao
            </CardTitle>
            <CardDescription>
              Como funciona a autenticacao nos endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Endpoints marcados com <Lock className="inline h-3 w-3 text-amber-500" /> requerem autenticacao.
              O token JWT deve ser enviado no header Authorization:
            </p>
            <CodeBlock code={`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-slate-700 mb-2">Usuarios Internos</h4>
                <p className="text-sm text-slate-600">
                  Funcionarios autenticados via login com email/senha corporativo.
                  Token expira em 1 hora, renovavel com refresh token.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-slate-700 mb-2">Usuarios Externos</h4>
                <p className="text-sm text-slate-600">
                  Destinatarios autenticados via codigo OTP enviado por email.
                  Token temporario expira em 1 hora, sem refresh.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
