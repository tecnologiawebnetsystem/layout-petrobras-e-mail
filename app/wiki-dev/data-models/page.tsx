"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Database, Key, Zap } from "lucide-react"
import Link from "next/link"

export default function DataModelsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Wiki
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
            <Database className="h-7 w-7 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">Modelos de Dados</h1>
          <p className="text-lg text-slate-600">Estrutura completa das tabelas DynamoDB e relacionamentos</p>
        </div>

        {/* Tables Overview */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          {/* Users Table */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Users Table</CardTitle>
                    <CardDescription>Armazena informações de usuários do sistema</CardDescription>
                  </div>
                  <Badge>5 índices</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Key */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-slate-900">Chave Primária</h4>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-sm font-medium text-slate-600">Partition Key</div>
                        <div className="mt-1 font-mono text-sm text-slate-900">userId (String)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attributes */}
                <div>
                  <h4 className="mb-3 font-semibold text-slate-900">Atributos</h4>
                  <div className="space-y-2">
                    {[
                      { name: "userId", type: "String", desc: "ID único do usuário (UUID)" },
                      { name: "email", type: "String", desc: "Email do usuário (único)" },
                      { name: "name", type: "String", desc: "Nome completo do usuário" },
                      { name: "role", type: "String", desc: "Papel: internal, external, supervisor" },
                      { name: "department", type: "String", desc: "Departamento (opcional)" },
                      { name: "status", type: "String", desc: "Status: active, inactive, suspended" },
                      { name: "createdAt", type: "String", desc: "Data de criação (ISO 8601)" },
                      { name: "updatedAt", type: "String", desc: "Última atualização (ISO 8601)" },
                      { name: "lastLogin", type: "String", desc: "Último login (ISO 8601)" },
                    ].map((attr, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex-1">
                          <div className="font-mono text-sm font-medium text-slate-900">{attr.name}</div>
                          <div className="text-sm text-slate-600">{attr.desc}</div>
                        </div>
                        <Badge variant="outline">{attr.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GSI */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <h4 className="font-semibold text-slate-900">Índices Secundários (GSI)</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="mb-2 font-medium text-slate-900">EmailIndex</div>
                      <div className="text-sm text-slate-600">
                        PK: <span className="font-mono">email</span> - Busca por email
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="mb-2 font-medium text-slate-900">RoleIndex</div>
                      <div className="text-sm text-slate-600">
                        PK: <span className="font-mono">role</span>, SK: <span className="font-mono">createdAt</span> -
                        Busca por papel
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Table */}
          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Files Table</CardTitle>
                    <CardDescription>Armazena metadados de arquivos transferidos</CardDescription>
                  </div>
                  <Badge>8 índices</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Key */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-slate-900">Chave Primária</h4>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-sm font-medium text-slate-600">Partition Key</div>
                        <div className="mt-1 font-mono text-sm text-slate-900">fileId (String)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attributes */}
                <div>
                  <h4 className="mb-3 font-semibold text-slate-900">Atributos</h4>
                  <div className="space-y-2">
                    {[
                      { name: "fileId", type: "String", desc: "ID único do arquivo (UUID)" },
                      { name: "fileName", type: "String", desc: "Nome original do arquivo" },
                      { name: "fileSize", type: "Number", desc: "Tamanho em bytes" },
                      { name: "fileType", type: "String", desc: "MIME type do arquivo" },
                      { name: "s3Key", type: "String", desc: "Chave do objeto no S3" },
                      { name: "s3Bucket", type: "String", desc: "Nome do bucket S3" },
                      { name: "uploadedBy", type: "String", desc: "ID do usuário que fez upload" },
                      { name: "destinationUser", type: "String", desc: "ID do usuário de destino" },
                      { name: "status", type: "String", desc: "pending, approved, rejected, downloaded" },
                      { name: "expiresAt", type: "String", desc: "Data de expiração (ISO 8601)" },
                      { name: "description", type: "String", desc: "Descrição opcional" },
                      { name: "downloadCount", type: "Number", desc: "Número de downloads" },
                      { name: "validationType", type: "String", desc: "Tipo de validação realizada" },
                      { name: "validationResult", type: "Map", desc: "Resultado da validação ZIP" },
                      { name: "createdAt", type: "String", desc: "Data de criação" },
                      { name: "updatedAt", type: "String", desc: "Última atualização" },
                    ].map((attr, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex-1">
                          <div className="font-mono text-sm font-medium text-slate-900">{attr.name}</div>
                          <div className="text-sm text-slate-600">{attr.desc}</div>
                        </div>
                        <Badge variant="outline">{attr.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GSI */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <h4 className="font-semibold text-slate-900">Índices Secundários (GSI)</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        name: "UploadedByIndex",
                        pk: "uploadedBy",
                        sk: "createdAt",
                        desc: "Busca por usuário que fez upload",
                      },
                      {
                        name: "DestinationUserIndex",
                        pk: "destinationUser",
                        sk: "createdAt",
                        desc: "Busca por usuário de destino",
                      },
                      { name: "StatusIndex", pk: "status", sk: "createdAt", desc: "Busca por status do arquivo" },
                      { name: "ExpirationIndex", pk: "status", sk: "expiresAt", desc: "Busca por data de expiração" },
                    ].map((index, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 p-4">
                        <div className="mb-2 font-medium text-slate-900">{index.name}</div>
                        <div className="mb-1 text-sm text-slate-600">
                          PK: <span className="font-mono">{index.pk}</span>
                          {index.sk && (
                            <>
                              , SK: <span className="font-mono">{index.sk}</span>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">{index.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Table */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Audit Logs Table</CardTitle>
                    <CardDescription>Registra todas as ações do sistema para auditoria</CardDescription>
                  </div>
                  <Badge>4 índices</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Key */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-slate-900">Chave Primária</h4>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-sm font-medium text-slate-600">Partition Key</div>
                        <div className="mt-1 font-mono text-sm text-slate-900">logId (String)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attributes */}
                <div>
                  <h4 className="mb-3 font-semibold text-slate-900">Atributos</h4>
                  <div className="space-y-2">
                    {[
                      { name: "logId", type: "String", desc: "ID único do log (UUID)" },
                      { name: "timestamp", type: "String", desc: "Data/hora da ação (ISO 8601)" },
                      { name: "userId", type: "String", desc: "ID do usuário que executou a ação" },
                      { name: "userName", type: "String", desc: "Nome completo do usuário" },
                      { name: "userEmail", type: "String", desc: "Email do usuário" },
                      { name: "userType", type: "String", desc: "Tipo: internal, external, supervisor" },
                      { name: "action", type: "String", desc: "upload, download, approve, reject, login, logout" },
                      { name: "level", type: "String", desc: "Nível: info, success, warning, error" },
                      { name: "fileId", type: "String", desc: "ID do arquivo relacionado (opcional)" },
                      { name: "fileName", type: "String", desc: "Nome do arquivo (opcional)" },
                      { name: "description", type: "String", desc: "Descrição detalhada da ação" },
                      { name: "ipAddress", type: "String", desc: "Endereço IP do usuário" },
                      { name: "userAgent", type: "String", desc: "User agent do navegador" },
                      { name: "metadata", type: "Map", desc: "Dados adicionais da ação" },
                    ].map((attr, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex-1">
                          <div className="font-mono text-sm font-medium text-slate-900">{attr.name}</div>
                          <div className="text-sm text-slate-600">{attr.desc}</div>
                        </div>
                        <Badge variant="outline">{attr.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GSI */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <h4 className="font-semibold text-slate-900">Índices Secundários (GSI)</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "UserIndex", pk: "userId", sk: "timestamp", desc: "Busca logs por usuário" },
                      { name: "ActionIndex", pk: "action", sk: "timestamp", desc: "Busca logs por tipo de ação" },
                      { name: "FileIndex", pk: "fileId", sk: "timestamp", desc: "Busca logs por arquivo" },
                      { name: "LevelIndex", pk: "level", sk: "timestamp", desc: "Busca logs por nível de severidade" },
                    ].map((index, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 p-4">
                        <div className="mb-2 font-medium text-slate-900">{index.name}</div>
                        <div className="mb-1 text-sm text-slate-600">
                          PK: <span className="font-mono">{index.pk}</span>, SK:{" "}
                          <span className="font-mono">{index.sk}</span>
                        </div>
                        <div className="text-sm text-slate-500">{index.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Table */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Notifications Table</CardTitle>
                    <CardDescription>Gerencia notificações em tempo real para usuários</CardDescription>
                  </div>
                  <Badge>3 índices</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Key */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-slate-900">Chave Primária</h4>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-sm font-medium text-slate-600">Partition Key</div>
                        <div className="mt-1 font-mono text-sm text-slate-900">notificationId (String)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attributes */}
                <div>
                  <h4 className="mb-3 font-semibold text-slate-900">Atributos</h4>
                  <div className="space-y-2">
                    {[
                      { name: "notificationId", type: "String", desc: "ID único da notificação (UUID)" },
                      { name: "userId", type: "String", desc: "ID do usuário destinatário" },
                      { name: "type", type: "String", desc: "success, error, info, warning, approval, expiration" },
                      { name: "priority", type: "String", desc: "Prioridade: low, medium, high, critical" },
                      { name: "title", type: "String", desc: "Título da notificação" },
                      { name: "message", type: "String", desc: "Mensagem detalhada" },
                      { name: "isRead", type: "Boolean", desc: "Se foi lida pelo usuário" },
                      { name: "actionLabel", type: "String", desc: "Texto do botão de ação (opcional)" },
                      { name: "actionUrl", type: "String", desc: "URL para redirecionamento (opcional)" },
                      { name: "createdAt", type: "String", desc: "Data de criação (ISO 8601)" },
                      { name: "readAt", type: "String", desc: "Data da leitura (ISO 8601, opcional)" },
                      { name: "metadata", type: "Map", desc: "Dados adicionais da notificação" },
                      { name: "ttl", type: "Number", desc: "Timestamp Unix para expiração (30 dias)" },
                    ].map((attr, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex-1">
                          <div className="font-mono text-sm font-medium text-slate-900">{attr.name}</div>
                          <div className="text-sm text-slate-600">{attr.desc}</div>
                        </div>
                        <Badge variant="outline">{attr.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GSI */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <h4 className="font-semibold text-slate-900">Índices Secundários (GSI)</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        name: "UserNotificationsIndex",
                        pk: "userId",
                        sk: "createdAt",
                        desc: "Busca notificações por usuário",
                      },
                      {
                        name: "UnreadNotificationsIndex",
                        pk: "userId",
                        sk: "isRead",
                        desc: "Busca notificações não lidas",
                      },
                      { name: "PriorityIndex", pk: "priority", sk: "createdAt", desc: "Busca por prioridade" },
                    ].map((index, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 p-4">
                        <div className="mb-2 font-medium text-slate-900">{index.name}</div>
                        <div className="mb-1 text-sm text-slate-600">
                          PK: <span className="font-mono">{index.pk}</span>, SK:{" "}
                          <span className="font-mono">{index.sk}</span>
                        </div>
                        <div className="text-sm text-slate-500">{index.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TTL */}
                <div className="rounded-lg bg-amber-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline">TTL Automático</Badge>
                  </div>
                  <p className="text-sm text-slate-700">
                    Notificações são automaticamente excluídas após 30 dias usando o campo{" "}
                    <span className="font-mono">ttl</span>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Table */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sessions Table</CardTitle>
                    <CardDescription>Gerencia sessões de usuário e tokens JWT</CardDescription>
                  </div>
                  <Badge>1 índice</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Key */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-slate-900">Chave Primária</h4>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-sm font-medium text-slate-600">Partition Key</div>
                        <div className="mt-1 font-mono text-sm text-slate-900">sessionId (String)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attributes */}
                <div>
                  <h4 className="mb-3 font-semibold text-slate-900">Atributos</h4>
                  <div className="space-y-2">
                    {[
                      { name: "sessionId", type: "String", desc: "ID único da sessão (UUID)" },
                      { name: "userId", type: "String", desc: "ID do usuário proprietário da sessão" },
                      { name: "accessToken", type: "String", desc: "JWT access token (curta duração)" },
                      { name: "refreshToken", type: "String", desc: "JWT refresh token (longa duração)" },
                      { name: "ipAddress", type: "String", desc: "Endereço IP do cliente" },
                      { name: "userAgent", type: "String", desc: "User agent do navegador" },
                      { name: "isActive", type: "Boolean", desc: "Se a sessão está ativa" },
                      { name: "createdAt", type: "String", desc: "Data de criação da sessão (ISO 8601)" },
                      { name: "lastActivityAt", type: "String", desc: "Última atividade (ISO 8601)" },
                      { name: "expiresAt", type: "String", desc: "Data de expiração (ISO 8601)" },
                      { name: "ttl", type: "Number", desc: "Timestamp Unix para expiração (24 horas)" },
                    ].map((attr, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex-1">
                          <div className="font-mono text-sm font-medium text-slate-900">{attr.name}</div>
                          <div className="text-sm text-slate-600">{attr.desc}</div>
                        </div>
                        <Badge variant="outline">{attr.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GSI */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <h4 className="font-semibold text-slate-900">Índices Secundários (GSI)</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="mb-2 font-medium text-slate-900">UserSessionsIndex</div>
                      <div className="mb-1 text-sm text-slate-600">
                        PK: <span className="font-mono">userId</span>, SK: <span className="font-mono">createdAt</span>
                      </div>
                      <div className="text-sm text-slate-500">Busca todas as sessões de um usuário</div>
                    </div>
                  </div>
                </div>

                {/* TTL */}
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline">TTL Automático</Badge>
                  </div>
                  <p className="text-sm text-slate-700">
                    Sessões são automaticamente excluídas após 24 horas de inatividade usando o campo{" "}
                    <span className="font-mono">ttl</span>. O refresh token permite renovar sessões válidas.
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
