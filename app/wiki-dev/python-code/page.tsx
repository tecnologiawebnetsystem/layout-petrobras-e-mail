"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileCode, CheckCircle2, XCircle, AlertCircle, Folder, Code } from "lucide-react"
import Link from "next/link"

export default function PythonCodeDocPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Wiki Dev
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg">
            <FileCode className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight">Documentação do Código Python</h1>
          <p className="text-lg text-slate-600">
            Análise completa do back-end Python atual - Estrutura, arquivos implementados e o que está faltando
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="structure">Estrutura</TabsTrigger>
            <TabsTrigger value="routes">Rotas API</TabsTrigger>
            <TabsTrigger value="models">Modelos</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="missing">O que falta</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="next">Próximos Passos</TabsTrigger>
          </TabsList>

          {/* Tab: Overview */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status do Projeto Python</CardTitle>
                <CardDescription>Resumo executivo do back-end FastAPI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-900">Implementado</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-700">70%</p>
                    <p className="text-sm text-green-600">Estrutura base completa</p>
                  </div>

                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <h3 className="font-semibold text-yellow-900">Em Progresso</h3>
                    </div>
                    <p className="text-3xl font-bold text-yellow-700">20%</p>
                    <p className="text-sm text-yellow-600">Integrações AWS</p>
                  </div>

                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <h3 className="font-semibold text-red-900">Faltando</h3>
                    </div>
                    <p className="text-3xl font-bold text-red-700">10%</p>
                    <p className="text-sm text-red-600">ServiceNow e testes</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">O que temos agora:</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <p className="font-medium">FastAPI configurado</p>
                        <p className="text-sm text-slate-600">Servidor web com Swagger docs em /docs</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <p className="font-medium">70 arquivos Python</p>
                        <p className="text-sm text-slate-600">Rotas, modelos, schemas e serviços</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <p className="font-medium">SQLModel (SQLite dev)</p>
                        <p className="text-sm text-slate-600">Banco de dados local para desenvolvimento</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <p className="font-medium">Autenticação JWT</p>
                        <p className="text-sm text-slate-600">Sistema de tokens para proteger endpoints</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <p className="font-medium">Upload/Download de arquivos</p>
                        <p className="text-sm text-slate-600">Sistema local pronto, AWS preparado</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <p className="font-medium">Auditoria completa</p>
                        <p className="text-sm text-slate-600">Logs de todas as ações dos usuários</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Resumo:</strong> O back-end Python está com a estrutura base completa e funcionando
                    localmente. Falta principalmente conectar com AWS (DynamoDB e S3) e adicionar integração com
                    ServiceNow para produção.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Structure */}
          <TabsContent value="structure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estrutura de Pastas</CardTitle>
                <CardDescription>Organização completa do projeto Python</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="font-mono text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-yellow-600" />
                      <span className="font-semibold">back-end/python/</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-yellow-600" />
                        <span className="font-semibold">app/</span>
                        <Badge variant="secondary" className="text-xs">
                          Código principal
                        </Badge>
                      </div>
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-blue-600" />
                          <span>api/v1/</span>
                          <Badge className="bg-green-600 text-xs">18 arquivos</Badge>
                        </div>
                        <div className="ml-6 space-y-0.5 text-slate-600">
                          <div>→ routes_users.py - Gerenciamento de usuários</div>
                          <div>→ routes_areas.py - Gestão de áreas/departamentos</div>
                          <div>→ routes_files.py - Upload e download de arquivos</div>
                          <div>→ routes_shares.py - Compartilhamento e aprovação</div>
                          <div>→ routes_external.py - Acesso para usuários externos</div>
                          <div>→ routes_internal_auth.py - Login usuários internos</div>
                          <div>→ routes_external_auth.py - Login usuários externos com OTP</div>
                          <div>→ routes_supervisor.py - Dashboard supervisor</div>
                          <div>→ routes_audit.py - Logs de auditoria</div>
                          <div className="text-xs text-slate-400">+ 9 outros arquivos...</div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <Folder className="h-4 w-4 text-blue-600" />
                          <span>models/</span>
                          <Badge className="bg-green-600 text-xs">16 arquivos</Badge>
                        </div>
                        <div className="ml-6 space-y-0.5 text-slate-600">
                          <div>→ user.py - Modelo de usuário</div>
                          <div>→ area.py - Modelo de área/departamento</div>
                          <div>→ restricted_file.py - Modelo de arquivo</div>
                          <div>→ share.py - Modelo de compartilhamento</div>
                          <div>→ audit.py - Modelo de log de auditoria</div>
                          <div>→ token_access.py - Modelo de token OTP</div>
                          <div className="text-xs text-slate-400">+ 10 outros arquivos...</div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <Folder className="h-4 w-4 text-blue-600" />
                          <span>schemas/</span>
                          <Badge className="bg-green-600 text-xs">7 arquivos</Badge>
                        </div>
                        <div className="ml-6 space-y-0.5 text-slate-600">
                          <div>→ user_schema.py - Validação de dados de usuário</div>
                          <div>→ file_schema.py - Validação de dados de arquivo</div>
                          <div>→ share_schema.py - Validação de compartilhamento</div>
                          <div className="text-xs text-slate-400">+ 4 outros arquivos...</div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <Folder className="h-4 w-4 text-blue-600" />
                          <span>services/</span>
                          <Badge className="bg-green-600 text-xs">6 arquivos</Badge>
                        </div>
                        <div className="ml-6 space-y-0.5 text-slate-600">
                          <div>→ auth_service.py - Lógica de autenticação</div>
                          <div>→ file_service.py - Lógica de arquivos</div>
                          <div>→ audit_service.py - Lógica de auditoria</div>
                          <div>→ token_service.py - Geração de OTP</div>
                          <div className="text-xs text-slate-400">+ 2 outros arquivos...</div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <Folder className="h-4 w-4 text-blue-600" />
                          <span>core/</span>
                          <Badge className="bg-yellow-600 text-xs">5 arquivos</Badge>
                        </div>
                        <div className="ml-6 space-y-0.5 text-slate-600">
                          <div>→ config.py - Configurações do sistema</div>
                          <div>→ security.py - Hash de senhas e JWT</div>
                          <div>→ aws_utils.py - Utilitários AWS (mock para dev)</div>
                          <div className="text-xs text-slate-400">+ 2 outros arquivos...</div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <Folder className="h-4 w-4 text-blue-600" />
                          <span>db/</span>
                          <Badge className="bg-green-600 text-xs">4 arquivos</Badge>
                        </div>
                        <div className="ml-6 space-y-0.5 text-slate-600">
                          <div>→ session.py - Conexão com banco</div>
                          <div>→ init_db.py - Inicialização do banco</div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <Code className="h-4 w-4 text-green-600" />
                          <span>main.py</span>
                          <Badge className="bg-green-600 text-xs">Entrada da aplicação</Badge>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <Code className="h-4 w-4 text-green-600" />
                        <span>requirements.txt</span>
                        <Badge className="bg-blue-600 text-xs">75 dependências</Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Code className="h-4 w-4 text-green-600" />
                        <span>Dockerfile</span>
                        <Badge variant="secondary" className="text-xs">
                          Container
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
                  <p className="text-sm text-green-900">
                    <strong>Total:</strong> 70 arquivos Python organizados em 8 pastas principais com estrutura limpa e
                    escalável.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Routes */}
          <TabsContent value="routes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rotas da API (Endpoints)</CardTitle>
                <CardDescription>Todos os endpoints disponíveis organizados por categoria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    title: "Autenticação",
                    file: "routes_internal_auth.py + routes_external_auth.py",
                    status: "complete",
                    endpoints: [
                      { method: "POST", path: "/api/v1/auth/login", desc: "Login usuário interno (mock local)" },
                      {
                        method: "POST",
                        path: "/api/v1/auth/external/request-otp",
                        desc: "Solicitar código OTP por email",
                      },
                      {
                        method: "POST",
                        path: "/api/v1/auth/external/verify-otp",
                        desc: "Validar código OTP e gerar token",
                      },
                      { method: "POST", path: "/api/v1/auth/logout", desc: "Fazer logout e invalidar token" },
                    ],
                  },
                  {
                    title: "Usuários",
                    file: "routes_users.py",
                    status: "complete",
                    endpoints: [
                      { method: "POST", path: "/api/v1/users/", desc: "Criar novo usuário interno" },
                      { method: "GET", path: "/api/v1/users/", desc: "Listar todos os usuários" },
                      { method: "GET", path: "/api/v1/users/{user_id}", desc: "Buscar usuário por ID" },
                      { method: "PUT", path: "/api/v1/users/{user_id}", desc: "Atualizar dados do usuário" },
                    ],
                  },
                  {
                    title: "Áreas / Departamentos",
                    file: "routes_areas.py",
                    status: "complete",
                    endpoints: [
                      { method: "POST", path: "/api/v1/areas/", desc: "Criar nova área/departamento" },
                      { method: "GET", path: "/api/v1/areas/", desc: "Listar todas as áreas" },
                      { method: "GET", path: "/api/v1/areas/{area_id}", desc: "Buscar área por ID" },
                    ],
                  },
                  {
                    title: "Arquivos",
                    file: "routes_files.py",
                    status: "partial",
                    endpoints: [
                      { method: "POST", path: "/api/v1/files/", desc: "Criar metadados de arquivo" },
                      { method: "POST", path: "/api/v1/files/upload-local", desc: "Upload arquivo (dev local) ✅" },
                      { method: "GET", path: "/api/v1/files/", desc: "Listar arquivos (filtro por área)" },
                      { method: "GET", path: "/api/v1/files/{file_id}", desc: "Buscar arquivo por ID" },
                      {
                        method: "GET",
                        path: "/api/v1/files/{file_id}/presigned-upload",
                        desc: "URL S3 upload (AWS) ⚠️",
                      },
                      {
                        method: "GET",
                        path: "/api/v1/files/{file_id}/presigned-download",
                        desc: "URL S3 download (AWS) ⚠️",
                      },
                    ],
                  },
                  {
                    title: "Compartilhamentos",
                    file: "routes_shares.py",
                    status: "complete",
                    endpoints: [
                      { method: "POST", path: "/api/v1/shares/", desc: "Criar compartilhamento para aprovação" },
                      {
                        method: "GET",
                        path: "/api/v1/shares/",
                        desc: "Listar compartilhamentos (pendentes/aprovados)",
                      },
                      { method: "GET", path: "/api/v1/shares/{share_id}", desc: "Buscar compartilhamento por ID" },
                      {
                        method: "PUT",
                        path: "/api/v1/shares/{share_id}/approve",
                        desc: "Aprovar compartilhamento (supervisor)",
                      },
                      {
                        method: "PUT",
                        path: "/api/v1/shares/{share_id}/reject",
                        desc: "Rejeitar compartilhamento (supervisor)",
                      },
                      {
                        method: "PATCH",
                        path: "/api/v1/shares/{share_id}/cancel",
                        desc: "Cancelar compartilhamento (usuário interno) 🆕",
                      },
                      {
                        method: "POST",
                        path: "/api/v1/shares/{share_id}/token",
                        desc: "Gerar token de acesso (após aprovação)",
                      },
                    ],
                  },
                  {
                    title: "Acesso Externo",
                    file: "routes_external.py",
                    status: "complete",
                    endpoints: [
                      {
                        method: "GET",
                        path: "/api/v1/external/{token}/files",
                        desc: "Listar arquivos disponíveis com token",
                      },
                      {
                        method: "GET",
                        path: "/api/v1/external/{token}/download/{file_id}",
                        desc: "Download arquivo com token",
                      },
                    ],
                  },
                  {
                    title: "Supervisor",
                    file: "routes_supervisor.py",
                    status: "complete",
                    endpoints: [
                      { method: "GET", path: "/api/v1/supervisor/pending", desc: "Listar compartilhamentos pendentes" },
                      { method: "GET", path: "/api/v1/supervisor/dashboard", desc: "Dashboard com métricas" },
                    ],
                  },
                  {
                    title: "Auditoria",
                    file: "routes_audit.py",
                    status: "complete",
                    endpoints: [
                      { method: "GET", path: "/api/v1/audit/", desc: "Listar logs de auditoria (filtros)" },
                      { method: "GET", path: "/api/v1/audit/{event_id}", desc: "Buscar log específico" },
                    ],
                  },
                ].map((category, idx) => (
                  <div key={idx} className="rounded-lg border p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{category.title}</h3>
                        <p className="text-sm text-slate-600">{category.file}</p>
                      </div>
                      <Badge
                        variant={
                          category.status === "complete"
                            ? "default"
                            : category.status === "partial"
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          category.status === "complete"
                            ? "bg-green-600"
                            : category.status === "partial"
                              ? "bg-yellow-600"
                              : ""
                        }
                      >
                        {category.status === "complete" && "Completo"}
                        {category.status === "partial" && "Parcial"}
                        {category.status === "missing" && "Faltando"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {category.endpoints.map((endpoint, epIdx) => (
                        <div key={epIdx} className="flex items-start gap-3 rounded-md bg-slate-50 p-3">
                          <Badge
                            variant="outline"
                            className={`shrink-0 font-mono ${
                              endpoint.method === "GET"
                                ? "border-blue-500 text-blue-700"
                                : endpoint.method === "POST"
                                  ? "border-green-500 text-green-700"
                                  : endpoint.method === "PUT"
                                    ? "border-yellow-500 text-yellow-700"
                                    : endpoint.method === "PATCH"
                                      ? "border-orange-500 text-orange-700"
                                      : "border-red-500 text-red-700"
                            }`}
                          >
                            {endpoint.method}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-mono text-sm text-slate-700">{endpoint.path}</p>
                            <p className="text-xs text-slate-600">{endpoint.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="mt-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Total:</strong> 33+ endpoints REST organizados em 7 categorias. Novo endpoint PATCH
                    /shares/:id/cancel adicionado para permitir cancelamento de compartilhamentos pendentes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Models */}
          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Modelos de Dados (SQLModel)</CardTitle>
                <CardDescription>Estrutura das tabelas do banco de dados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    name: "User / Usuario",
                    file: "user.py / usuario.py",
                    fields: [
                      { name: "id", type: "int", desc: "ID único do usuário (chave primária)" },
                      { name: "email", type: "str", desc: "Email corporativo (ex: nome@petrobras.com.br)" },
                      { name: "full_name", type: "str", desc: "Nome completo do usuário" },
                      { name: "hashed_password", type: "str", desc: "Senha criptografada (bcrypt)" },
                      { name: "role", type: "str", desc: "Perfil: 'user' ou 'supervisor'" },
                      { name: "area_id", type: "int", desc: "ID da área/departamento do usuário" },
                      { name: "is_active", type: "bool", desc: "Usuário ativo ou desativado" },
                      { name: "created_at", type: "datetime", desc: "Data de criação do registro" },
                    ],
                  },
                  {
                    name: "SharedArea / Area",
                    file: "area.py",
                    fields: [
                      { name: "id", type: "int", desc: "ID único da área" },
                      { name: "name", type: "str", desc: "Nome da área (ex: TI, RH, Financeiro)" },
                      { name: "prefix_s3", type: "str", desc: "Prefixo no S3 (ex: 'areas/ti/')" },
                      { name: "description", type: "str", desc: "Descrição da área" },
                    ],
                  },
                  {
                    name: "RestrictedFile / Arquivo",
                    file: "restricted_file.py / arquivo.py",
                    fields: [
                      { name: "id", type: "int", desc: "ID único do arquivo" },
                      { name: "area_id", type: "int", desc: "ID da área proprietária" },
                      { name: "name", type: "str", desc: "Nome do arquivo (ex: documento.pdf)" },
                      { name: "key_s3", type: "str", desc: "Caminho no S3 ou local (dev)" },
                      { name: "size_bytes", type: "int", desc: "Tamanho em bytes" },
                      { name: "mime_type", type: "str", desc: "Tipo do arquivo (ex: application/pdf)" },
                      { name: "checksum", type: "str", desc: "Hash SHA256 para validação" },
                      { name: "upload_id", type: "int", desc: "ID do usuário que fez upload" },
                      { name: "status", type: "bool", desc: "Arquivo ativo ou deletado" },
                      { name: "created_at", type: "datetime", desc: "Data do upload" },
                      { name: "expires_at", type: "datetime", desc: "Data de expiração (opcional)" },
                    ],
                  },
                  {
                    name: "Share / Compartilhamento",
                    file: "share.py",
                    fields: [
                      { name: "id", type: "int", desc: "ID único do compartilhamento" },
                      { name: "area_id", type: "int", desc: "ID da área dos arquivos" },
                      { name: "created_by", type: "int", desc: "ID do usuário que criou" },
                      { name: "external_email", type: "str", desc: "Email do destinatário externo" },
                      { name: "status", type: "str", desc: "'pending', 'approved', 'rejected'" },
                      { name: "approved_by", type: "int", desc: "ID do supervisor que aprovou (opcional)" },
                      { name: "approved_at", type: "datetime", desc: "Data de aprovação (opcional)" },
                      { name: "message", type: "str", desc: "Mensagem para o destinatário" },
                      { name: "expires_at", type: "datetime", desc: "Data de expiração do link" },
                      { name: "created_at", type: "datetime", desc: "Data de criação" },
                    ],
                  },
                  {
                    name: "TokenAccess / TokenAcesso",
                    file: "token_access.py / token_acesso.py",
                    fields: [
                      { name: "id", type: "int", desc: "ID único do token" },
                      { name: "share_id", type: "int", desc: "ID do compartilhamento relacionado" },
                      { name: "token", type: "str", desc: "Token único (UUID)" },
                      { name: "otp_code", type: "str", desc: "Código OTP de 6 dígitos" },
                      { name: "otp_attempts", type: "int", desc: "Tentativas de validação (máx 5)" },
                      { name: "is_verified", type: "bool", desc: "OTP validado com sucesso" },
                      { name: "expires_at", type: "datetime", desc: "Expiração do token" },
                      { name: "created_at", type: "datetime", desc: "Data de criação" },
                    ],
                  },
                  {
                    name: "AuditLog / Auditoria",
                    file: "audit.py / auditoria.py",
                    fields: [
                      { name: "id", type: "int", desc: "ID único do log" },
                      { name: "action", type: "str", desc: "Ação realizada (ex: LOGIN, UPLOAD_FILE)" },
                      { name: "user_id", type: "int", desc: "ID do usuário (se aplicável)" },
                      { name: "file_id", type: "int", desc: "ID do arquivo (se aplicável)" },
                      { name: "share_id", type: "int", desc: "ID do compartilhamento (se aplicável)" },
                      { name: "detail", type: "str", desc: "Detalhes adicionais da ação" },
                      { name: "ip_address", type: "str", desc: "IP do usuário" },
                      { name: "user_agent", type: "str", desc: "Navegador/dispositivo" },
                      { name: "created_at", type: "datetime", desc: "Data e hora da ação" },
                    ],
                  },
                ].map((model) => (
                  <div key={model.name} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{model.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {model.file}
                      </Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="pb-2 text-left font-semibold">Campo</th>
                            <th className="pb-2 text-left font-semibold">Tipo</th>
                            <th className="pb-2 text-left font-semibold">Descrição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {model.fields.map((field, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="py-2 font-mono text-xs text-blue-600">{field.name}</td>
                              <td className="py-2">
                                <Badge variant="secondary" className="text-xs">
                                  {field.type}
                                </Badge>
                              </td>
                              <td className="py-2 text-xs text-slate-600">{field.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Nota:</strong> Existem arquivos duplicados (ex: user.py e usuario.py) porque o sistema está
                    em transição. Recomendamos manter apenas as versões em inglês para padronização.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Services */}
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Camada de Serviços (Business Logic)</CardTitle>
                <CardDescription>Lógica de negócio separada das rotas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    name: "auth_service.py",
                    status: "complete",
                    desc: "Serviço de autenticação de usuários",
                    functions: [
                      "authenticate_user() - Valida email e senha",
                      "create_access_token() - Gera token JWT",
                      "verify_token() - Valida token JWT",
                      "get_current_user() - Extrai usuário do token",
                    ],
                  },
                  {
                    name: "file_service.py",
                    status: "partial",
                    desc: "Serviço de gerenciamento de arquivos",
                    functions: [
                      "upload_file_to_s3() - Upload para AWS S3 ⚠️",
                      "download_file_from_s3() - Download de AWS S3 ⚠️",
                      "generate_presigned_url() - URL temporária S3 ⚠️",
                      "delete_file() - Remove arquivo do S3 ⚠️",
                    ],
                  },
                  {
                    name: "audit_service.py",
                    status: "complete",
                    desc: "Serviço de logs de auditoria",
                    functions: [
                      "log_event() - Registra ação no banco",
                      "get_user_actions() - Histórico de um usuário",
                      "get_file_history() - Histórico de um arquivo",
                    ],
                  },
                  {
                    name: "token_service.py",
                    status: "complete",
                    desc: "Serviço de geração de tokens OTP",
                    functions: [
                      "generate_otp() - Cria código de 6 dígitos",
                      "send_otp_email() - Envia OTP por email ⚠️",
                      "verify_otp() - Valida código OTP",
                      "check_cooldown() - Previne spam de OTP",
                    ],
                  },
                  {
                    name: "share_service.py",
                    status: "complete",
                    desc: "Serviço de compartilhamento",
                    functions: [
                      "create_share() - Cria compartilhamento",
                      "approve_share() - Aprova (supervisor)",
                      "reject_share() - Rejeita (supervisor)",
                      "check_permissions() - Valida permissões",
                    ],
                  },
                  {
                    name: "task_service.py",
                    status: "partial",
                    desc: "Serviço de tarefas agendadas",
                    functions: [
                      "cleanup_expired_files() - Remove arquivos expirados ⚠️",
                      "cleanup_expired_tokens() - Remove tokens antigos ⚠️",
                      "send_notifications() - Envia emails periódicos ⚠️",
                    ],
                  },
                ].map((service) => (
                  <div key={service.name} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-slate-600">{service.desc}</p>
                      </div>
                      <Badge
                        variant={service.status === "complete" ? "default" : "secondary"}
                        className={service.status === "complete" ? "bg-green-600" : "bg-yellow-600"}
                      >
                        {service.status === "complete" ? "Completo" : "Parcial"}
                      </Badge>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {service.functions.map((func, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 text-slate-400">→</span>
                          <span className={func.includes("⚠️") ? "text-yellow-700" : "text-slate-700"}>{func}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-900">
                    <strong>Atenção:</strong> Funções marcadas com ⚠️ estão preparadas mas precisam de integração AWS
                    real (S3, SES) para funcionar em produção.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Missing */}
          <TabsContent value="missing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>O que está faltando</CardTitle>
                <CardDescription>Itens pendentes para produção</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    {
                      priority: "Alta",
                      color: "red",
                      title: "Integração AWS S3",
                      desc: "Substituir storage local por AWS S3 para upload/download de arquivos em produção",
                      time: "2 dias",
                    },
                    {
                      priority: "Alta",
                      color: "red",
                      title: "Integração AWS DynamoDB",
                      desc: "Migrar de SQLite (dev) para DynamoDB (produção) - criar tabelas e índices GSI",
                      time: "3 dias",
                    },
                    {
                      priority: "Alta",
                      color: "red",
                      title: "Integração AWS SES",
                      desc: "Configurar envio de emails (OTP, notificações) via Amazon SES",
                      time: "1 dia",
                    },
                    {
                      priority: "Alta",
                      color: "red",
                      title: "Integração ServiceNow",
                      desc: "Autenticação via ServiceNow Table API - validar usuários corporativos",
                      time: "2 dias",
                    },
                    {
                      priority: "Média",
                      color: "yellow",
                      title: "Integração Microsoft Entra ID",
                      desc: "SSO com Azure AD/Entra ID para login corporativo",
                      time: "2 dias",
                    },
                    {
                      priority: "Média",
                      color: "yellow",
                      title: "Testes Automatizados",
                      desc: "Criar testes unitários e de integração com pytest",
                      time: "3 dias",
                    },
                    {
                      priority: "Média",
                      color: "yellow",
                      title: "CI/CD Pipeline",
                      desc: "Configurar GitHub Actions para deploy automático",
                      time: "1 dia",
                    },
                    {
                      priority: "Baixa",
                      color: "blue",
                      title: "Monitoramento e Logs",
                      desc: "Integrar com CloudWatch para logs centralizados e alertas",
                      time: "2 dias",
                    },
                    {
                      priority: "Baixa",
                      color: "blue",
                      title: "Rate Limiting",
                      desc: "Adicionar limite de requisições por IP para prevenir abuso",
                      time: "1 dia",
                    },
                    {
                      priority: "Baixa",
                      color: "blue",
                      title: "Documentação API",
                      desc: "Melhorar Swagger docs com exemplos e descrições detalhadas",
                      time: "1 dia",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-lg border p-3">
                      <Badge
                        className={`shrink-0 ${
                          item.color === "red"
                            ? "bg-red-600"
                            : item.color === "yellow"
                              ? "bg-yellow-600"
                              : "bg-blue-600"
                        }`}
                      >
                        {item.priority}
                      </Badge>
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-slate-600">{item.desc}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {item.time}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
                  <p className="text-sm text-red-900">
                    <strong>Estimativa:</strong> ~18 dias de trabalho para completar todos os itens pendentes.
                    Prioridade ALTA pode ser feita em 1 semana.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Config */}
          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração (config.py)</CardTitle>
                <CardDescription>Variáveis de ambiente e settings do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-slate-900 p-4 font-mono text-sm text-slate-100">
                  <div className="space-y-2">
                    <div className="text-green-400"># Servidor</div>
                    <div>
                      <span className="text-blue-400">app_host</span>:{" "}
                      <span className="text-yellow-400">"0.0.0.0"</span>
                    </div>
                    <div>
                      <span className="text-blue-400">app_port</span>: <span className="text-purple-400">8000</span>
                    </div>

                    <div className="mt-4 text-green-400"># Banco de Dados</div>
                    <div>
                      <span className="text-blue-400">database_url</span>:{" "}
                      <span className="text-yellow-400">"sqlite:///./dev.db"</span>{" "}
                      <span className="text-slate-500"># Dev local</span>
                    </div>
                    <div className="text-slate-500"># Prod: postgresql://... ou DynamoDB</div>

                    <div className="mt-4 text-green-400"># Armazenamento</div>
                    <div>
                      <span className="text-blue-400">storage_provider</span>:{" "}
                      <span className="text-yellow-400">"local"</span>{" "}
                      <span className="text-slate-500"># "local" ou "aws"</span>
                    </div>

                    <div className="mt-4 text-green-400"># OTP (Código de Acesso)</div>
                    <div>
                      <span className="text-blue-400">otp_max_attempts</span>:{" "}
                      <span className="text-purple-400">5</span>
                    </div>
                    <div>
                      <span className="text-blue-400">otp_cooldown_minutes</span>:{" "}
                      <span className="text-purple-400">15</span>
                    </div>
                    <div>
                      <span className="text-blue-400">otp_validity_minutes</span>:{" "}
                      <span className="text-purple-400">10</span>
                    </div>

                    <div className="mt-4 text-green-400"># Tokens de Acesso</div>
                    <div>
                      <span className="text-blue-400">access_valid_hours</span>:{" "}
                      <span className="text-purple-400">24</span>
                    </div>
                    <div>
                      <span className="text-blue-400">presigned_ttl_seconds_default</span>:{" "}
                      <span className="text-purple-400">300</span>
                    </div>

                    <div className="mt-4 text-green-400"># Autenticação</div>
                    <div>
                      <span className="text-blue-400">auth_mode</span>: <span className="text-yellow-400">"local"</span>{" "}
                      <span className="text-slate-500"># "local" ou "entra"</span>
                    </div>
                    <div>
                      <span className="text-blue-400">jwt_secret_key</span>:{" "}
                      <span className="text-yellow-400">"dev-secret-change-me"</span>
                    </div>

                    <div className="mt-4 text-green-400"># AWS (Produção)</div>
                    <div>
                      <span className="text-blue-400">aws_region</span>:{" "}
                      <span className="text-yellow-400">"us-east-1"</span>
                    </div>
                    <div>
                      <span className="text-blue-400">aws_s3_bucket</span>:{" "}
                      <span className="text-yellow-400">"petrobras-files"</span>
                    </div>
                    <div>
                      <span className="text-blue-400">aws_access_key_id</span>:{" "}
                      <span className="text-slate-500">{"<vazio em dev>"}</span>
                    </div>
                    <div>
                      <span className="text-blue-400">aws_secret_access_key</span>:{" "}
                      <span className="text-slate-500">{"<vazio em dev>"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Como funciona:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2 rounded-lg border p-3">
                      <Badge className="shrink-0 bg-blue-600">DEV</Badge>
                      <p className="text-slate-700">
                        Em desenvolvimento: SQLite local, storage no disco, sem AWS. Rápido para testar.
                      </p>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg border p-3">
                      <Badge className="shrink-0 bg-green-600">PROD</Badge>
                      <p className="text-slate-700">
                        Em produção: DynamoDB, S3, SES configurados via variáveis de ambiente (.env ou AWS Secrets
                        Manager).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Dica:</strong> Crie arquivo .env na raiz do projeto Python para sobrescrever qualquer
                    configuração padrão.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Next Steps */}
          <TabsContent value="next" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Próximos Passos</CardTitle>
                <CardDescription>Roadmap de implementação recomendado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Fase 1: Integração AWS (1 semana)</h3>
                  <ol className="space-y-2 text-sm">
                    {[
                      "Criar bucket S3 na AWS Console",
                      "Configurar IAM roles e policies para acesso S3",
                      "Atualizar config.py com credenciais AWS (via .env)",
                      "Modificar file_service.py para usar boto3 S3",
                      "Testar upload/download real no S3",
                      "Configurar AWS SES para envio de emails",
                      "Atualizar token_service.py para usar SES",
                    ].map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-semibold text-blue-600">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Fase 2: DynamoDB (3-5 dias)</h3>
                  <ol className="space-y-2 text-sm" start={8}>
                    {[
                      "Criar tabelas DynamoDB via AWS CLI ou CDK scripts",
                      "Configurar índices GSI (Global Secondary Index)",
                      "Instalar boto3 DynamoDB client",
                      "Substituir SQLModel por boto3.dynamodb.Table",
                      "Migrar dados de dev (SQLite) para DynamoDB",
                      "Testar todas as rotas com DynamoDB",
                    ].map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-semibold text-blue-600">{idx + 8}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Fase 3: ServiceNow (2-3 dias)</h3>
                  <ol className="space-y-2 text-sm" start={14}>
                    {[
                      "Solicitar credenciais ServiceNow (documento criado)",
                      "Criar servicenow_client.py com requests",
                      "Implementar auth via Table API",
                      "Atualizar routes_internal_auth.py",
                      "Testar login com usuários reais ServiceNow",
                    ].map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-semibold text-blue-600">{idx + 14}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Fase 4: Testes e Deploy (2-3 dias)</h3>
                  <ol className="space-y-2 text-sm" start={19}>
                    {[
                      "Criar testes unitários com pytest",
                      "Configurar CI/CD (GitHub Actions)",
                      "Deploy em Lambda ou EC2",
                      "Configurar API Gateway na frente do FastAPI",
                      "Testes end-to-end em produção",
                      "Monitoramento com CloudWatch",
                    ].map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-semibold text-blue-600">{idx + 19}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
                  <p className="text-sm text-green-900">
                    <strong>Resultado:</strong> Ao final dessas 4 fases (2-3 semanas), o back-end Python estará 100%
                    pronto para produção na AWS com todas as integrações funcionando.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
