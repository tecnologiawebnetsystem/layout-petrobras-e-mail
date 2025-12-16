"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Database,
  Cloud,
  Lightbulb,
  Code2,
  GitCompare,
  Network,
} from "lucide-react"
import Link from "next/link"

export default function IntegracaoPage() {
  const [activeTab, setActiveTab] = useState("arquitetura")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" className="mb-4 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Wiki
            </Button>
          </Link>

          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
            <GitCompare className="h-8 w-8 text-white" />
          </div>

          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">Integração Front-Back</h1>
          <p className="text-lg text-slate-600">
            Análise completa: Next.js (Front) + Python FastAPI (Back) + Amazon DynamoDB
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto gap-2 bg-transparent p-0">
            <TabsTrigger
              value="arquitetura"
              className="data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:border-cyan-200 border-2 py-3"
            >
              <Network className="mr-2 h-4 w-4" />
              Arquitetura
            </TabsTrigger>
            <TabsTrigger
              value="conflitos"
              className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-red-200 border-2 py-3"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Conflitos
            </TabsTrigger>
            <TabsTrigger
              value="campos"
              className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200 border-2 py-3"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Campos Comuns
            </TabsTrigger>
            <TabsTrigger
              value="banco"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 border-2 py-3"
            >
              <Database className="mr-2 h-4 w-4" />
              DynamoDB
            </TabsTrigger>
            <TabsTrigger
              value="aws"
              className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-orange-200 border-2 py-3"
            >
              <Cloud className="mr-2 h-4 w-4" />
              Serviços AWS
            </TabsTrigger>
            <TabsTrigger
              value="estrategia"
              className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-purple-200 border-2 py-3"
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              Estratégia
            </TabsTrigger>
          </TabsList>

          {/* Arquitetura */}
          <TabsContent value="arquitetura" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-cyan-600" />
                  Diagrama de Arquitetura Completa
                </CardTitle>
                <CardDescription>Visão geral de como Front-end, Back-end, AWS e DynamoDB se conectam</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Diagrama Visual */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-xl border-2 border-slate-200">
                  <div className="space-y-6">
                    {/* Camada 1: Usuários */}
                    <div className="text-center">
                      <div className="inline-flex items-center gap-3 bg-indigo-100 px-6 py-3 rounded-lg border-2 border-indigo-300">
                        <div className="flex gap-2">
                          <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                            I
                          </div>
                          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                            S
                          </div>
                          <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                            E
                          </div>
                        </div>
                        <span className="font-semibold text-indigo-900">Usuários (Internal, Supervisor, External)</span>
                      </div>
                    </div>

                    {/* Seta */}
                    <div className="text-center">
                      <div className="inline-block text-4xl text-slate-400">↓</div>
                    </div>

                    {/* Camada 2: Front-end */}
                    <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-300">
                      <div className="font-bold text-blue-900 mb-3 text-lg">
                        FRONT-END: Next.js 16 + TypeScript + Zustand
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="bg-white p-3 rounded border border-blue-200">
                          <div className="font-semibold text-blue-800">Páginas</div>
                          <div className="text-blue-600 text-xs mt-1">
                            /upload
                            <br />
                            /download
                            <br />
                            /supervisor
                            <br />
                            /auditoria
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-blue-200">
                          <div className="font-semibold text-blue-800">Stores</div>
                          <div className="text-blue-600 text-xs mt-1">
                            auth-store
                            <br />
                            workflow-store
                            <br />
                            audit-log-store
                            <br />
                            notification-store
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-blue-200">
                          <div className="font-semibold text-blue-800">Componentes</div>
                          <div className="text-blue-600 text-xs mt-1">
                            LoginForm
                            <br />
                            UploadForm
                            <br />
                            FileCard
                            <br />
                            ApprovalDialog
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-blue-200">
                          <div className="font-semibold text-blue-800">Validação</div>
                          <div className="text-blue-600 text-xs mt-1">
                            zip-validator
                            <br />
                            file-types
                            <br />
                            schemas
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seta */}
                    <div className="text-center">
                      <div className="inline-block text-4xl text-slate-400">↓</div>
                      <div className="text-sm text-slate-600 font-medium mt-2">HTTP REST API (axios/fetch)</div>
                    </div>

                    {/* Camada 3: Back-end */}
                    <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-300">
                      <div className="font-bold text-purple-900 mb-3 text-lg">
                        BACK-END: Python 3.13 + FastAPI + Boto3
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="bg-white p-3 rounded border border-purple-200">
                          <div className="font-semibold text-purple-800">Rotas</div>
                          <div className="text-purple-600 text-xs mt-1">
                            /auth/...
                            <br />
                            /files/...
                            <br />
                            /supervisor/...
                            <br />
                            /audit/...
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-purple-200">
                          <div className="font-semibold text-purple-800">Serviços</div>
                          <div className="text-purple-600 text-xs mt-1">
                            token_service
                            <br />
                            file_service
                            <br />
                            share_service
                            <br />
                            audit_service
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-purple-200">
                          <div className="font-semibold text-purple-800">Modelos</div>
                          <div className="text-purple-600 text-xs mt-1">
                            User
                            <br />
                            File
                            <br />
                            Share
                            <br />
                            AuditLog
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-purple-200">
                          <div className="font-semibold text-purple-800">Auth</div>
                          <div className="text-purple-600 text-xs mt-1">
                            JWT
                            <br />
                            OTP
                            <br />
                            Password Hash
                            <br />
                            Middleware
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seta */}
                    <div className="text-center">
                      <div className="inline-block text-4xl text-slate-400">↓</div>
                      <div className="text-sm text-slate-600 font-medium mt-2">AWS SDK (boto3)</div>
                    </div>

                    {/* Camada 4: Serviços AWS */}
                    <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-300">
                      <div className="font-bold text-orange-900 mb-3 text-lg">SERVIÇOS AWS</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div className="bg-white p-3 rounded border border-orange-200">
                          <div className="font-semibold text-orange-800">S3</div>
                          <div className="text-orange-600 text-xs mt-1">
                            Armazenamento
                            <br />
                            Upload/Download
                            <br />
                            URLs Presignadas
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-orange-200">
                          <div className="font-semibold text-orange-800">SES</div>
                          <div className="text-orange-600 text-xs mt-1">
                            Envio de Emails
                            <br />
                            OTP
                            <br />
                            Notificações
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-orange-200">
                          <div className="font-semibold text-orange-800">CloudWatch</div>
                          <div className="text-orange-600 text-xs mt-1">
                            Logs
                            <br />
                            Métricas
                            <br />
                            Alarmes
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-orange-200">
                          <div className="font-semibold text-orange-800">Lambda</div>
                          <div className="text-orange-600 text-xs mt-1">
                            Expiração
                            <br />
                            Limpeza TTL
                            <br />
                            Processamento
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-orange-200">
                          <div className="font-semibold text-orange-800">API Gateway</div>
                          <div className="text-orange-600 text-xs mt-1">
                            Roteamento
                            <br />
                            Rate Limiting
                            <br />
                            CORS
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-orange-200">
                          <div className="font-semibold text-orange-800">Secrets Manager</div>
                          <div className="text-orange-600 text-xs mt-1">
                            JWT Secret
                            <br />
                            AWS Credentials
                            <br />
                            Tokens
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seta */}
                    <div className="text-center">
                      <div className="inline-block text-4xl text-slate-400">↓</div>
                    </div>

                    {/* Camada 5: Banco de Dados */}
                    <div className="bg-emerald-50 p-6 rounded-lg border-2 border-emerald-300">
                      <div className="font-bold text-emerald-900 mb-3 text-lg">BANCO DE DADOS: Amazon DynamoDB</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div className="bg-white p-3 rounded border border-emerald-200">
                          <div className="font-semibold text-emerald-800">petrobras-users</div>
                          <div className="text-emerald-600 text-xs mt-1">
                            userId (PK)
                            <br />
                            email, name, role
                            <br />+ GSI: EmailIndex
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-emerald-200">
                          <div className="font-semibold text-emerald-800">petrobras-files</div>
                          <div className="text-emerald-600 text-xs mt-1">
                            fileId (PK)
                            <br />
                            status, s3Key, ttl
                            <br />+ GSI: StatusIndex
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-emerald-200">
                          <div className="font-semibold text-emerald-800">petrobras-audit-logs</div>
                          <div className="text-emerald-600 text-xs mt-1">
                            logId (PK)
                            <br />
                            userId, action, timestamp
                            <br />+ GSI: UserIndex
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-emerald-200">
                          <div className="font-semibold text-emerald-800">petrobras-notifications</div>
                          <div className="text-emerald-600 text-xs mt-1">
                            notificationId (PK)
                            <br />
                            userId, type, isRead
                            <br />+ GSI: UserNotificationsIndex
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-emerald-200">
                          <div className="font-semibold text-emerald-800">petrobras-sessions</div>
                          <div className="text-emerald-600 text-xs mt-1">
                            sessionId (PK)
                            <br />
                            userId, accessToken, ttl
                            <br />+ GSI: UserSessionsIndex
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-emerald-200">
                          <div className="font-semibold text-emerald-800">petrobras-expiration-logs</div>
                          <div className="text-emerald-600 text-xs mt-1">
                            logId (PK)
                            <br />
                            fileId, previousValue, newValue
                            <br />+ GSI: FileExpirationIndex
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fluxos de Dados */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900">Fluxos de Dados por Perfil</h3>

                  {/* Fluxo Interno */}
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="font-semibold text-blue-900 mb-2">Usuário Interno (Upload)</div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>
                        1. Login → POST <code className="bg-blue-100 px-1.5 py-0.5 rounded">/auth/login</code> → JWT
                        accessToken
                      </div>
                      <div>
                        2. Upload → POST <code className="bg-blue-100 px-1.5 py-0.5 rounded">/files/upload</code> → S3 +
                        DynamoDB (status: pending)
                      </div>
                      <div>
                        3. Notificação criada em{" "}
                        <code className="bg-blue-100 px-1.5 py-0.5 rounded">petrobras-notifications</code>
                      </div>
                      <div>4. Aguarda aprovação do supervisor</div>
                    </div>
                  </div>

                  {/* Fluxo Supervisor */}
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                    <div className="font-semibold text-green-900 mb-2">Supervisor (Aprovação)</div>
                    <div className="text-sm text-green-700 space-y-1">
                      <div>
                        1. Login → POST <code className="bg-green-100 px-1.5 py-0.5 rounded">/auth/login</code> → JWT
                        accessToken
                      </div>
                      <div>
                        2. Lista pendentes → GET{" "}
                        <code className="bg-green-100 px-1.5 py-0.5 rounded">/supervisor/pending</code>
                      </div>
                      <div>
                        3. Aprovar → POST{" "}
                        <code className="bg-green-100 px-1.5 py-0.5 rounded">/supervisor/approve/:id</code> → Atualiza
                        DynamoDB (status: approved)
                      </div>
                      <div>4. Gera OTP → SES envia email ao destinatário externo</div>
                      <div>5. Audit log registrado automaticamente</div>
                    </div>
                  </div>

                  {/* Fluxo Externo */}
                  <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                    <div className="font-semibold text-orange-900 mb-2">Usuário Externo (Download)</div>
                    <div className="text-sm text-orange-700 space-y-1">
                      <div>
                        1. Solicita OTP → POST{" "}
                        <code className="bg-orange-100 px-1.5 py-0.5 rounded">/auth/otp/request</code>
                      </div>
                      <div>2. Recebe código por email (SES)</div>
                      <div>
                        3. Verifica OTP → POST{" "}
                        <code className="bg-orange-100 px-1.5 py-0.5 rounded">/auth/otp/verify</code> → ACCESS_TOKEN
                        temporário
                      </div>
                      <div>
                        4. Lista arquivos → GET{" "}
                        <code className="bg-orange-100 px-1.5 py-0.5 rounded">/external/files?token=xxx</code>
                      </div>
                      <div>5. Download → URL presignada do S3</div>
                      <div>
                        6. ACK → POST <code className="bg-orange-100 px-1.5 py-0.5 rounded">/external/ack</code> →
                        Registra download
                      </div>
                    </div>
                  </div>
                </div>

                {/* Integrações AWS Detalhadas */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900">Integrações AWS Necessárias</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-slate-200">
                      <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Badge className="bg-orange-500">S3</Badge>
                        Armazenamento de Arquivos
                      </div>
                      <div className="text-sm text-slate-700 space-y-2">
                        <div>
                          <span className="font-medium">Biblioteca:</span> boto3
                        </div>
                        <div>
                          <span className="font-medium">Operações:</span>
                          <ul className="list-disc list-inside text-xs mt-1 pl-2">
                            <li>put_object() - Upload</li>
                            <li>generate_presigned_url() - Download seguro</li>
                            <li>delete_object() - Limpeza TTL</li>
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium">Config:</span>
                          <code className="block bg-slate-100 p-2 rounded text-xs mt-1">
                            s3 = boto3.client('s3')
                            <br />
                            bucket = 'petrobras-files'
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-slate-200">
                      <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Badge className="bg-orange-500">DynamoDB</Badge>
                        Banco NoSQL
                      </div>
                      <div className="text-sm text-slate-700 space-y-2">
                        <div>
                          <span className="font-medium">Biblioteca:</span> boto3
                        </div>
                        <div>
                          <span className="font-medium">Operações:</span>
                          <ul className="list-disc list-inside text-xs mt-1 pl-2">
                            <li>put_item() - Criar</li>
                            <li>get_item() - Buscar por PK</li>
                            <li>query() - Buscar por GSI</li>
                            <li>update_item() - Atualizar</li>
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium">Config:</span>
                          <code className="block bg-slate-100 p-2 rounded text-xs mt-1">
                            dynamodb = boto3.resource('dynamodb')
                            <br />
                            table = dynamodb.Table('petrobras-files')
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-slate-200">
                      <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Badge className="bg-orange-500">SES</Badge>
                        Envio de Emails
                      </div>
                      <div className="text-sm text-slate-700 space-y-2">
                        <div>
                          <span className="font-medium">Biblioteca:</span> boto3
                        </div>
                        <div>
                          <span className="font-medium">Operações:</span>
                          <ul className="list-disc list-inside text-xs mt-1 pl-2">
                            <li>send_email() - OTP</li>
                            <li>send_templated_email() - Notificações</li>
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium">Config:</span>
                          <code className="block bg-slate-100 p-2 rounded text-xs mt-1">
                            ses = boto3.client('ses')
                            <br />
                            sender = 'noreply@petrobras.com.br'
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-slate-200">
                      <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Badge className="bg-orange-500">Lambda</Badge>
                        Funções Serverless
                      </div>
                      <div className="text-sm text-slate-700 space-y-2">
                        <div>
                          <span className="font-medium">Uso:</span> Automações
                        </div>
                        <div>
                          <span className="font-medium">Funções:</span>
                          <ul className="list-disc list-inside text-xs mt-1 pl-2">
                            <li>TTL Cleanup - Remove arquivos expirados do S3</li>
                            <li>Notification Sender - Envia notificações agendadas</li>
                            <li>Audit Aggregator - Gera relatórios</li>
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium">Trigger:</span> CloudWatch Events (cron)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conflitos */}
          <TabsContent value="conflitos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Análise de Conflitos e Incompatibilidades
                </CardTitle>
                <CardDescription>
                  Campos e funcionalidades que existem no front-end mas ainda não estão implementados no back-end Python
                  FastAPI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Conflito 1: Autenticação */}
                <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    1. Sistema de Autenticação JWT
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-red-800 mb-1">Front-end (Next.js + Zustand):</p>
                      <ul className="list-disc list-inside text-red-700 space-y-1 pl-4">
                        <li>
                          <code className="bg-red-100 px-2 py-0.5 rounded">user.userType</code>: "internal" | "external"
                          | "supervisor"
                        </li>
                        <li>
                          Campos:{" "}
                          <code className="bg-red-100 px-2 py-0.5 rounded">id, name, email, department, phone</code>
                        </li>
                        <li>
                          <code className="bg-red-100 px-2 py-0.5 rounded">accessToken</code> e{" "}
                          <code className="bg-red-100 px-2 py-0.5 rounded">refreshToken</code> JWT com refresh
                          automático
                        </li>
                        <li>Login com email/senha para internal e supervisor</li>
                        <li>
                          Usado em: <code className="bg-red-100 px-2 py-0.5 rounded">lib/stores/auth-store.ts</code>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-red-800 mb-1">Back-end (Python FastAPI):</p>
                      <ul className="list-disc list-inside text-red-700 space-y-1 pl-4">
                        <li>Apenas autenticação OTP para usuários externos via email</li>
                        <li>
                          <code className="bg-red-100 px-2 py-0.5 rounded">ACCESS_TOKEN</code> temporário sem JWT
                        </li>
                        <li>Não tem tabela de usuários internos/supervisores no DynamoDB</li>
                        <li>Não tem login com senha nem hash de senha</li>
                        <li>Não tem refresh token</li>
                      </ul>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg mt-2">
                      <p className="font-semibold text-red-900 mb-1">Ação Necessária:</p>
                      <p className="text-red-800">
                        Criar tabela <code className="bg-red-200 px-1.5 py-0.5 rounded">petrobras-users</code> no
                        DynamoDB. Implementar endpoints{" "}
                        <code className="bg-red-200 px-1.5 py-0.5 rounded">POST /auth/login</code>,{" "}
                        <code className="bg-red-200 px-1.5 py-0.5 rounded">POST /auth/refresh</code> e{" "}
                        <code className="bg-red-200 px-1.5 py-0.5 rounded">POST /auth/logout</code> com PyJWT. Usar
                        bcrypt para hash de senhas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conflito 2: Workflow */}
                <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    2. Workflow de Aprovação/Rejeição
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-red-800 mb-1">Front-end (Next.js):</p>
                      <ul className="list-disc list-inside text-red-700 space-y-1 pl-4">
                        <li>
                          Status:{" "}
                          <code className="bg-red-100 px-2 py-0.5 rounded">"pending" | "approved" | "rejected"</code>
                        </li>
                        <li>
                          Campo <code className="bg-red-100 px-2 py-0.5 rounded">rejectionReason</code> obrigatório via
                          modal
                        </li>
                        <li>
                          Campo <code className="bg-red-100 px-2 py-0.5 rounded">expirationHours</code> ajustável: 24,
                          48, 72h
                        </li>
                        <li>
                          Campos{" "}
                          <code className="bg-red-100 px-2 py-0.5 rounded">approvedBy, approverName, approvalDate</code>
                        </li>
                        <li>
                          Widgets separados por status na página{" "}
                          <code className="bg-red-100 px-2 py-0.5 rounded">app/supervisor/page.tsx</code>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-red-800 mb-1">Back-end (Python):</p>
                      <ul className="list-disc list-inside text-red-700 space-y-1 pl-4">
                        <li>Compartilhamentos criados diretamente como ativos</li>
                        <li>Não tem fluxo de aprovação/rejeição</li>
                        <li>Não tem campo de motivo de rejeição</li>
                        <li>Expiração fixa sem ajuste dinâmico</li>
                        <li>Não registra quem aprovou</li>
                      </ul>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg mt-2">
                      <p className="font-semibold text-red-900 mb-1">Ação Necessária:</p>
                      <p className="text-red-800">
                        Adicionar campos na tabela{" "}
                        <code className="bg-red-200 px-1.5 py-0.5 rounded">petrobras-files</code>: status, approved_by,
                        approval_date, rejection_reason, expiration_hours. Criar endpoints{" "}
                        <code className="bg-red-200 px-1.5 py-0.5 rounded">POST /supervisor/approve/:id</code>,{" "}
                        <code className="bg-red-200 px-1.5 py-0.5 rounded">POST /supervisor/reject/:id</code> (com
                        reason obrigatório),{" "}
                        <code className="bg-red-200 px-1.5 py-0.5 rounded">GET /supervisor/pending</code>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conflito 3: Auditoria */}
                <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    3. Sistema de Auditoria Completo
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-red-800 mb-1">Front-end (Next.js):</p>
                      <ul className="list-disc list-inside text-red-700 space-y-1 pl-4">
                        <li>
                          Ações: "login", "logout", "upload", "approve", "reject", "download", "expiration_change",
                          "delete"
                        </li>
                        <li>
                          Níveis:{" "}
                          <code className="bg-red-100 px-2 py-0.5 rounded">
                            "info" | "success" | "warning" | "error"
                          </code>
                        </li>
                        <li>Metadados completos: targetId, targetName, description, metadata JSON customizável</li>
                        <li>Registra IP do usuário automaticamente</li>
                        <li>
                          Store: <code className="bg-red-100 px-2 py-0.5 rounded">lib/stores/audit-log-store.ts</code>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-red-800 mb-1">Back-end (Python):</p>
                      <ul className="list-disc list-inside text-red-700 space-y-1 pl-4">
                        <li>Auditoria apenas de ACK de downloads</li>
                        <li>Não registra login, upload, aprovação, rejeição</li>
                        <li>Não tem níveis de log</li>
                        <li>Metadados limitados</li>
                      </ul>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg mt-2">
                      <p className="font-semibold text-red-900 mb-1">Ação Necessária:</p>
                      <p className="text-red-800">
                        Criar tabela <code className="bg-red-200 px-1.5 py-0.5 rounded">petrobras-audit-logs</code> com
                        campos: logId (PK), timestamp, userId, action, level, fileId, description, ip_address,
                        metadata_json. Implementar middleware FastAPI para registrar automaticamente todas as rotas
                        protegidas. Endpoint <code className="bg-red-200 px-1.5 py-0.5 rounded">GET /audit/logs</code>{" "}
                        com filtros.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conflito 4: Notificações */}
                <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    4. Sistema de Notificações em Tempo Real
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-red-800 mb-1">Front-end (Next.js):</p>
                      <ul className="list-disc list-inside text-red-700 space-y-1 pl-4">
                        <li>
                          Tipos:{" "}
                          <code className="bg-red-100 px-2 py-0.5 rounded">
                            "approval" | "success" | "error" | "info" | "expiration"
                          </code>
                        </li>
                        <li>
                          Prioridades: <code className="bg-red-100 px-2 py-0.5 rounded">"low" | "medium" | "high"</code>
                        </li>
                        <li>Sistema completo com título, mensagem, ações (actionLabel, actionUrl)</li>
                        <li>Marcação de lidas/não lidas</li>
                        <li>
                          Store:{" "}
                          <code className="bg-red-100 px-2 py-0.5 rounded">lib/stores/notification-store.ts</code>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-red-800 mb-1">Back-end (Python):</p>
                      <ul className="list-disc list-inside text-red-700 space-y-1 pl-4">
                        <li>Não tem sistema de notificações</li>
                        <li>Apenas mock de envio de OTP por email</li>
                      </ul>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg mt-2">
                      <p className="font-semibold text-red-900 mb-1">Ação Necessária:</p>
                      <p className="text-red-800">
                        Criar tabela <code className="bg-red-200 px-1.5 py-0.5 rounded">petrobras-notifications</code>{" "}
                        com TTL de 30 dias. Implementar endpoints{" "}
                        <code className="bg-red-200 px-1.5 py-0.5 rounded">GET /notifications</code>,{" "}
                        <code className="bg-red-200 px-1.5 py-0.5 rounded">PUT /notifications/:id/read</code>. Integrar
                        AWS SES para envio de emails reais (substituir mock). Opcional: WebSockets com FastAPI para
                        notificações em tempo real.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conflito 5: Validação de Arquivos */}
                <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    5. Validação de Arquivos Perigosos
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-red-800 mb-1">Front-end (Next.js):</p>
                      <ul className="list-disc list-inside text-red-700 space-y-1 pl-4">
                        <li>Bloqueio de extensões: .exe, .dll, .bat, .cmd, .scr, .vbs, .js, .jar, .app, .deb, .rpm</li>
                        <li>
                          Validação em{" "}
                          <code className="bg-red-100 px-2 py-0.5 rounded">lib/utils/zip-validator.ts</code>
                        </li>
                        <li>Bloqueio antes do upload com notificação clara</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-red-800 mb-1">Back-end (Python):</p>
                      <ul className="list-disc list-inside text-red-700 space-y-1 pl-4">
                        <li>Não tem validação de extensões perigosas</li>
                        <li>Aceita qualquer arquivo</li>
                      </ul>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg mt-2">
                      <p className="font-semibold text-red-900 mb-1">Ação Necessária:</p>
                      <p className="text-red-800">
                        Criar validador em Python que espelhe a lógica do front-end. Rejeitar uploads com extensões
                        perigosas retornando HTTP 400. Adicionar validação de conteúdo MIME type além da extensão.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campos Comuns */}
          <TabsContent value="campos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Campos e Estruturas Comuns
                </CardTitle>
                <CardDescription>
                  Funcionalidades já compatíveis entre front-end e back-end que podem ser aproveitadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Campo Comum 1: OTP */}
                <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    1. Autenticação OTP para Usuários Externos
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-green-800 mb-1">Campos Compatíveis:</p>
                      <ul className="list-disc list-inside text-green-700 space-y-1 pl-4">
                        <li>
                          <code className="bg-green-100 px-2 py-0.5 rounded">email</code> - Destinatário externo
                        </li>
                        <li>
                          <code className="bg-green-100 px-2 py-0.5 rounded">codigo</code> - Código OTP de 6 dígitos
                        </li>
                        <li>
                          <code className="bg-green-100 px-2 py-0.5 rounded">validade_minutos</code> - Tempo de
                          expiração do OTP
                        </li>
                        <li>
                          <code className="bg-green-100 px-2 py-0.5 rounded">tentativas</code> - Controle de tentativas
                          inválidas
                        </li>
                      </ul>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <p className="font-semibold text-green-900 mb-1">Status:</p>
                      <Badge className="bg-green-600">Pronto para Integração</Badge>
                      <p className="text-green-800 mt-2">
                        Este fluxo já está completamente implementado no back-end e pode ser conectado ao front-end.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Campo Comum 2: Arquivos */}
                <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    2. Estrutura de Arquivos
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-green-800 mb-1">Campos Compatíveis:</p>
                      <ul className="list-disc list-inside text-green-700 space-y-1 pl-4">
                        <li>
                          <code className="bg-green-100 px-2 py-0.5 rounded">nome</code> /{" "}
                          <code className="bg-green-100 px-2 py-0.5 rounded">name</code> - Nome do arquivo
                        </li>
                        <li>
                          <code className="bg-green-100 px-2 py-0.5 rounded">tamanho_bytes</code> /{" "}
                          <code className="bg-green-100 px-2 py-0.5 rounded">size</code> - Tamanho em bytes/MB
                        </li>
                        <li>
                          <code className="bg-green-100 px-2 py-0.5 rounded">tipo</code> /{" "}
                          <code className="bg-green-100 px-2 py-0.5 rounded">type</code> - Extensão do arquivo
                        </li>
                        <li>
                          <code className="bg-green-100 px-2 py-0.5 rounded">s3_key</code> - Caminho no S3 (back-end)
                        </li>
                      </ul>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <p className="font-semibold text-green-900 mb-1">Mapeamento:</p>
                      <code className="text-xs bg-green-200 px-2 py-1 rounded block">
                        Front-end: files[].name, files[].size, files[].type
                        <br />
                        Back-end: arquivos.nome, arquivos.tamanho_bytes, extensão derivada do nome
                      </code>
                    </div>
                  </div>
                </div>

                {/* Campo Comum 3: Compartilhamento */}
                <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    3. Compartilhamento (Share)
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-green-800 mb-1">Campos Compatíveis:</p>
                      <ul className="list-disc list-inside text-green-700 space-y-1 pl-4">
                        <li>
                          <code className="bg-green-100 px-2 py-0.5 rounded">recipient</code> /{" "}
                          <code className="bg-green-100 px-2 py-0.5 rounded">email_destinatario</code>
                        </li>
                        <li>
                          <code className="bg-green-100 px-2 py-0.5 rounded">description</code> /{" "}
                          <code className="bg-green-100 px-2 py-0.5 rounded">descricao</code>
                        </li>
                        <li>
                          <code className="bg-green-100 px-2 py-0.5 rounded">expirationHours</code> /{" "}
                          <code className="bg-green-100 px-2 py-0.5 rounded">expira_em</code> (calculado)
                        </li>
                        <li>
                          <code className="bg-green-100 px-2 py-0.5 rounded">uploadDate</code> /{" "}
                          <code className="bg-green-100 px-2 py-0.5 rounded">criado_em</code>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <p className="font-semibold text-green-900 mb-1">Adaptação Necessária:</p>
                      <p className="text-green-800 text-xs">
                        Apenas renomear campos para padronizar (usar snake_case no back-end e camelCase no front-end com
                        conversão automática).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Campo Comum 4: Tokens */}
                <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    4. Sistema de Tokens
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-green-800 mb-1">Campos Compatíveis:</p>
                      <ul className="list-disc list-inside text-green-700 space-y-1 pl-4">
                        <li>
                          <code className="bg-green-100 px-2 py-0.5 rounded">accessToken</code> /{" "}
                          <code className="bg-green-100 px-2 py-0.5 rounded">token</code> - Token JWT
                        </li>
                        <li>
                          <code className="bg-green-100 px-2 py-0.5 rounded">expiresAt</code> /{" "}
                          <code className="bg-green-100 px-2 py-0.5 rounded">expira_em</code>
                        </li>
                        <li>Validação de expiração em ambos os lados</li>
                      </ul>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <p className="font-semibold text-green-900 mb-1">Expansão Necessária:</p>
                      <p className="text-green-800 text-xs">
                        Adicionar <code className="bg-green-200 px-1.5 py-0.5 rounded">refreshToken</code> no back-end
                        para permitir renovação automática de sessão.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banco de Dados */}
          <TabsContent value="banco" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Estrutura de Banco de Dados Unificada
                </CardTitle>
                <CardDescription>
                  Proposta de estrutura de banco de dados que atende front-end e back-end simultaneamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border-2 border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-4 text-lg">Decisão de Arquitetura</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Badge className="bg-blue-600 mt-1">Opção 1</Badge>
                      <div>
                        <p className="font-semibold text-blue-900">PostgreSQL (Relacional)</p>
                        <p className="text-blue-700">
                          Melhor para transações complexas, relacionamentos fortes e auditoria detalhada. Já usado no
                          back-end FastAPI com SQLAlchemy.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-orange-600 mt-1">Opção 2</Badge>
                      <div>
                        <p className="font-semibold text-blue-900">DynamoDB (NoSQL)</p>
                        <p className="text-blue-700">
                          Melhor para escalabilidade massiva e baixa latência. Requer adaptação do back-end atual.
                        </p>
                      </div>
                    </div>
                    <div className="bg-blue-100 p-3 rounded mt-3">
                      <p className="font-semibold text-blue-900 mb-1">Recomendação:</p>
                      <p className="text-blue-800">
                        Usar <strong>PostgreSQL no RDS</strong> pela compatibilidade com o back-end FastAPI existente e
                        requisitos de auditoria rigorosa da Petrobras.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabela: users */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-blue-100 p-4 border-b">
                    <h4 className="font-bold text-blue-900 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Tabela: users
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">Usuários internos, externos e supervisores</p>
                  </div>
                  <div className="p-4 bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2 border">Campo</th>
                          <th className="text-left p-2 border">Tipo</th>
                          <th className="text-left p-2 border">Descrição</th>
                          <th className="text-left p-2 border">Origem</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border font-mono text-xs">id</td>
                          <td className="p-2 border">UUID</td>
                          <td className="p-2 border">Chave primária</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">email</td>
                          <td className="p-2 border">VARCHAR(255)</td>
                          <td className="p-2 border">Email único do usuário</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">password_hash</td>
                          <td className="p-2 border">VARCHAR(255)</td>
                          <td className="p-2 border">Hash bcrypt da senha (apenas internos/supervisores)</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              Novo (Front)
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">name</td>
                          <td className="p-2 border">VARCHAR(255)</td>
                          <td className="p-2 border">Nome completo</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">user_type</td>
                          <td className="p-2 border">ENUM</td>
                          <td className="p-2 border">'internal', 'external', 'supervisor'</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              Novo (Front)
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">created_at</td>
                          <td className="p-2 border">TIMESTAMP</td>
                          <td className="p-2 border">Data de criação</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">last_login</td>
                          <td className="p-2 border">TIMESTAMP</td>
                          <td className="p-2 border">Último acesso</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              Novo (Front)
                            </Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabela: shares */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-blue-100 p-4 border-b">
                    <h4 className="font-bold text-blue-900 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Tabela: shares
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">Compartilhamentos/Uploads de arquivos</p>
                  </div>
                  <div className="p-4 bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2 border">Campo</th>
                          <th className="text-left p-2 border">Tipo</th>
                          <th className="text-left p-2 border">Descrição</th>
                          <th className="text-left p-2 border">Origem</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border font-mono text-xs">id</td>
                          <td className="p-2 border">UUID</td>
                          <td className="p-2 border">Chave primária</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">name</td>
                          <td className="p-2 border">VARCHAR(255)</td>
                          <td className="p-2 border">Nome/Título do compartilhamento</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              Novo (Front)
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">sender_id</td>
                          <td className="p-2 border">UUID</td>
                          <td className="p-2 border">FK → users.id (remetente)</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              Novo (Front)
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">recipient_email</td>
                          <td className="p-2 border">VARCHAR(255)</td>
                          <td className="p-2 border">Email do destinatário externo</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">description</td>
                          <td className="p-2 border">TEXT</td>
                          <td className="p-2 border">Descrição do envio</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">status</td>
                          <td className="p-2 border">ENUM</td>
                          <td className="p-2 border">'pending', 'approved', 'rejected'</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              Novo (Front)
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">created_at</td>
                          <td className="p-2 border">TIMESTAMP</td>
                          <td className="p-2 border">Data do upload</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">approved_by</td>
                          <td className="p-2 border">UUID</td>
                          <td className="p-2 border">FK → users.id (supervisor que aprovou)</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              Novo (Front)
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">approval_date</td>
                          <td className="p-2 border">TIMESTAMP</td>
                          <td className="p-2 border">Data da aprovação/rejeição</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              Novo (Front)
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">rejection_reason</td>
                          <td className="p-2 border">TEXT</td>
                          <td className="p-2 border">Motivo da rejeição</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              Novo (Front)
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">expiration_hours</td>
                          <td className="p-2 border">INTEGER</td>
                          <td className="p-2 border">Horas de validade (24, 48, 72)</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              Novo (Front)
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">expires_at</td>
                          <td className="p-2 border">TIMESTAMP</td>
                          <td className="p-2 border">Data/hora de expiração calculada</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabela: files */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-blue-100 p-4 border-b">
                    <h4 className="font-bold text-blue-900 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Tabela: files
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">Arquivos individuais dos compartilhamentos</p>
                  </div>
                  <div className="p-4 bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2 border">Campo</th>
                          <th className="text-left p-2 border">Tipo</th>
                          <th className="text-left p-2 border">Descrição</th>
                          <th className="text-left p-2 border">Origem</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border font-mono text-xs">id</td>
                          <td className="p-2 border">UUID</td>
                          <td className="p-2 border">Chave primária</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">share_id</td>
                          <td className="p-2 border">UUID</td>
                          <td className="p-2 border">FK → shares.id</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">name</td>
                          <td className="p-2 border">VARCHAR(255)</td>
                          <td className="p-2 border">Nome do arquivo</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">size_bytes</td>
                          <td className="p-2 border">BIGINT</td>
                          <td className="p-2 border">Tamanho em bytes</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">file_type</td>
                          <td className="p-2 border">VARCHAR(50)</td>
                          <td className="p-2 border">Extensão/tipo (PDF, XLSX, etc)</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">s3_key</td>
                          <td className="p-2 border">VARCHAR(512)</td>
                          <td className="p-2 border">Caminho no S3</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">downloaded</td>
                          <td className="p-2 border">BOOLEAN</td>
                          <td className="p-2 border">Se já foi baixado</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-mono text-xs">downloaded_at</td>
                          <td className="p-2 border">TIMESTAMP</td>
                          <td className="p-2 border">Data do download</td>
                          <td className="p-2 border">
                            <Badge variant="outline" className="text-xs">
                              Front + Back
                            </Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabelas Adicionais */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      audit_logs
                    </h4>
                    <ul className="text-sm space-y-1 text-slate-700">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                          Novo
                        </Badge>
                        <span>
                          id, timestamp, user_id, action, level, target_id, description, metadata_json, ip_address
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      notifications
                    </h4>
                    <ul className="text-sm space-y-1 text-slate-700">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                          Novo
                        </Badge>
                        <span>
                          id, user_id, type, priority, title, message, read, action_label, action_url, created_at
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      expiration_logs
                    </h4>
                    <ul className="text-sm space-y-1 text-slate-700">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                          Novo
                        </Badge>
                        <span>id, share_id, changed_by, previous_value, new_value, reason, timestamp</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      otp_codes
                    </h4>
                    <ul className="text-sm space-y-1 text-slate-700">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Existente
                        </Badge>
                        <span>id, email, codigo, tentativas, expira_em, share_id</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AWS */}
          <TabsContent value="aws" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-orange-600" />
                  Serviços AWS para Integração Completa
                </CardTitle>
                <CardDescription>
                  Arquitetura AWS recomendada para suportar front-end Next.js e back-end FastAPI juntos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Serviço 1: S3 */}
                <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    1. Amazon S3 - Armazenamento de Arquivos
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Por quê usar:</p>
                      <p className="text-orange-700">
                        Armazenamento seguro, escalável e durável para todos os arquivos enviados pelos usuários
                        internos. Suporta URLs pré-assinadas para download seguro temporário.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Como implementar:</p>
                      <ul className="list-disc list-inside text-orange-700 space-y-1 pl-4">
                        <li>Front-end: Upload direto para S3 usando presigned URLs do back-end</li>
                        <li>
                          Back-end FastAPI: Gera presigned URL com{" "}
                          <code className="bg-orange-100 px-1.5 py-0.5 rounded">boto3.generate_presigned_url()</code>
                        </li>
                        <li>
                          Estrutura de pastas:{" "}
                          <code className="bg-orange-100 px-1.5 py-0.5 rounded">
                            /uploads/{"<"}year{">/"}
                            {"<"}share_id{">"}/arquivo.pdf
                          </code>
                        </li>
                        <li>Lifecycle policy: Deletar arquivos expirados automaticamente</li>
                      </ul>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <p className="font-semibold text-orange-900 mb-1">Integração Front-Back:</p>
                      <code className="text-xs bg-orange-200 px-2 py-1 rounded block">
                        1. Front POST /api/uploads/presigned → Back gera URL
                        <br />
                        2. Front PUT direto no S3 com URL
                        <br />
                        3. Front POST /api/uploads/confirm → Back salva metadados no BD
                      </code>
                    </div>
                  </div>
                </div>

                {/* Serviço 2: RDS PostgreSQL */}
                <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    2. Amazon RDS PostgreSQL - Banco de Dados
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Por quê usar:</p>
                      <p className="text-orange-700">
                        Banco relacional gerenciado, compatível com SQLAlchemy do FastAPI. Backups automáticos,
                        replicação multi-AZ para alta disponibilidade e performance consistente.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Como implementar:</p>
                      <ul className="list-disc list-inside text-orange-700 space-y-1 pl-4">
                        <li>Criar RDS PostgreSQL 15+ com instância db.t3.medium</li>
                        <li>
                          Back-end: Conectar via{" "}
                          <code className="bg-orange-100 px-1.5 py-0.5 rounded">
                            postgresql://user:pass@rds-endpoint:5432/dbname
                          </code>
                        </li>
                        <li>Front-end: Nunca acessa diretamente, apenas via API REST do back-end</li>
                        <li>Migrations com Alembic para versionamento de schema</li>
                      </ul>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <p className="font-semibold text-orange-900 mb-1">Integração Front-Back:</p>
                      <code className="text-xs bg-orange-200 px-2 py-1 rounded block">
                        Front (Next.js) → API Gateway → Back (FastAPI) → RDS PostgreSQL
                      </code>
                    </div>
                  </div>
                </div>

                {/* Serviço 3: Lambda + API Gateway */}
                <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    3. AWS Lambda + API Gateway - Back-end Serverless
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Por quê usar:</p>
                      <p className="text-orange-700">
                        Deploy do FastAPI como função Lambda com Mangum adapter. Escala automaticamente, paga apenas
                        pelo uso, sem gerenciamento de servidores.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Como implementar:</p>
                      <ul className="list-disc list-inside text-orange-700 space-y-1 pl-4">
                        <li>
                          Empacotar FastAPI com <code className="bg-orange-100 px-1.5 py-0.5 rounded">mangum</code>{" "}
                          adapter
                        </li>
                        <li>Deploy via SAM ou Serverless Framework</li>
                        <li>API Gateway expõe endpoints REST públicos</li>
                        <li>
                          Front-end chama:{" "}
                          <code className="bg-orange-100 px-1.5 py-0.5 rounded">
                            https://api-id.execute-api.us-east-1.amazonaws.com/prod
                          </code>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Serviço 4: CloudFront */}
                <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    4. Amazon CloudFront - CDN e Cache
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Por quê usar:</p>
                      <p className="text-orange-700">
                        CDN global para distribuir front-end Next.js e assets estáticos com baixa latência. Cache de API
                        responses para reduzir carga no back-end.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Como implementar:</p>
                      <ul className="list-disc list-inside text-orange-700 space-y-1 pl-4">
                        <li>
                          Origin 1: S3 bucket com build estático do Next.js (
                          <code className="bg-orange-100 px-1.5 py-0.5 rounded">next export</code>)
                        </li>
                        <li>Origin 2: API Gateway (back-end FastAPI)</li>
                        <li>Cache policy: Static assets 1 dia, API responses 5 minutos</li>
                        <li>
                          SSL/TLS com certificado ACM para{" "}
                          <code className="bg-orange-100 px-1.5 py-0.5 rounded">app.petrobras.com.br</code>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Serviço 5: SES */}
                <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    5. Amazon SES - Envio de Emails
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Por quê usar:</p>
                      <p className="text-orange-700">
                        Envio de emails transacionais (OTP, notificações de aprovação/rejeição) com alta entregabilidade
                        e baixo custo.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Como implementar:</p>
                      <ul className="list-disc list-inside text-orange-700 space-y-1 pl-4">
                        <li>
                          Back-end FastAPI usa{" "}
                          <code className="bg-orange-100 px-1.5 py-0.5 rounded">boto3.client('ses')</code>
                        </li>
                        <li>Verificar domínio petrobras.com.br no SES</li>
                        <li>Templates HTML para emails de OTP, aprovação, rejeição</li>
                        <li>Tracking de bounces e complaints</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Serviço 6: Cognito */}
                <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    6. Amazon Cognito (Opcional) - Autenticação Gerenciada
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Por quê usar:</p>
                      <p className="text-orange-700">
                        Alternativa para gerenciar autenticação, tokens JWT e refresh tokens sem código customizado.
                        Suporta MFA, OAuth, SAML.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Como implementar:</p>
                      <ul className="list-disc list-inside text-orange-700 space-y-1 pl-4">
                        <li>Criar User Pool para usuários internos e supervisores</li>
                        <li>Front-end Next.js usa amplify-js ou cognito-identity-js</li>
                        <li>Back-end FastAPI valida tokens JWT do Cognito</li>
                        <li>Alternativa: Implementação custom com PyJWT (mais controle, mais código)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Arquitetura Completa */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-lg border-2 border-orange-200">
                  <h3 className="font-bold text-orange-900 mb-4 text-lg">Arquitetura AWS Completa</h3>
                  <div className="space-y-2 text-sm text-orange-800 font-mono bg-white p-4 rounded border border-orange-200">
                    <p>┌─────────────────────────────────────────────────┐</p>
                    <p>│ Usuário Interno/Supervisor → CloudFront │</p>
                    <p>│ (Next.js SSG/ISR hospedado no S3) │</p>
                    <p>└──────────────────┬──────────────────────────────┘</p>
                    <p> ↓</p>
                    <p>┌──────────────────┴──────────────────────────────┐</p>
                    <p>│ API Gateway │</p>
                    <p>│ /auth/*, /uploads/*, /supervisor/* │</p>
                    <p>└──────────────────┬──────────────────────────────┘</p>
                    <p> ↓</p>
                    <p>┌──────────────────┴──────────────────────────────┐</p>
                    <p>│ AWS Lambda (FastAPI + Mangum) │</p>
                    <p>│ - Autenticação JWT │</p>
                    <p>│ - Upload/Approval workflow │</p>
                    <p>│ - Geração presigned URLs S3 │</p>
                    <p>└────┬─────────────────┬──────────────────────────┘</p>
                    <p> ↓ ↓</p>
                    <p> ┌────────┴─────┐ ┌────┴──────┐</p>
                    <p> │ RDS PostgreSQL│ │ S3 Bucket │</p>
                    <p> │ - users │ │ - Arquivos │</p>
                    <p> │ - shares │ │ │</p>
                    <p> │ - files │ │ │</p>
                    <p> │ - audit_logs │ └───────────┘</p>
                    <p> └──────────────┘</p>
                    <p> ↓</p>
                    <p> ┌──────────────┐</p>
                    <p> │ Amazon SES │</p>
                    <p> │ (Emails OTP) │</p>
                    <p> └──────────────┘</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="arquitetura" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-cyan-600" />
                  Arquitetura Completa do Sistema
                </CardTitle>
                <CardDescription>
                  Diagrama visual e soluções práticas para integrar Front-end, Back-end, AWS e Banco de Dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Diagrama Visual */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-xl">
                  <h3 className="font-bold text-white mb-6 text-xl text-center">Fluxo Completo do Sistema</h3>

                  <div className="space-y-6">
                    {/* Camada 1: Usuários */}
                    <div className="bg-slate-800/50 border-2 border-cyan-400 rounded-lg p-4">
                      <p className="text-cyan-300 font-semibold mb-3 text-center">CAMADA 1: USUÁRIOS</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-cyan-900/50 p-3 rounded text-center">
                          <p className="text-cyan-200 font-medium">👤 Interno</p>
                          <p className="text-cyan-400 text-xs mt-1">Upload de arquivos</p>
                        </div>
                        <div className="bg-purple-900/50 p-3 rounded text-center">
                          <p className="text-purple-200 font-medium">👨‍💼 Supervisor</p>
                          <p className="text-purple-400 text-xs mt-1">Aprovação/Rejeição</p>
                        </div>
                        <div className="bg-green-900/50 p-3 rounded text-center">
                          <p className="text-green-200 font-medium">🌐 Externo</p>
                          <p className="text-green-400 text-xs mt-1">Download via OTP</p>
                        </div>
                      </div>
                    </div>

                    {/* Seta */}
                    <div className="text-center text-cyan-400 text-2xl">↓</div>

                    {/* Camada 2: Front-end */}
                    <div className="bg-slate-800/50 border-2 border-blue-400 rounded-lg p-4">
                      <p className="text-blue-300 font-semibold mb-3 text-center">CAMADA 2: FRONT-END (Next.js 16)</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <p className="text-blue-200 font-medium">Páginas:</p>
                          <ul className="text-blue-400 space-y-1">
                            <li>• /login - Autenticação</li>
                            <li>• /upload - Upload de arquivos</li>
                            <li>• /supervisor - Aprovação</li>
                            <li>• /download - Download externo</li>
                            <li>• /auditoria - Logs</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="text-blue-200 font-medium">Stores (Zustand):</p>
                          <ul className="text-blue-400 space-y-1">
                            <li>• auth-store.ts</li>
                            <li>• workflow-store.ts</li>
                            <li>• audit-log-store.ts</li>
                            <li>• notification-store.ts</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Seta */}
                    <div className="text-center text-blue-400 text-2xl">↓ API REST (fetch)</div>

                    {/* Camada 3: Back-end */}
                    <div className="bg-slate-800/50 border-2 border-orange-400 rounded-lg p-4">
                      <p className="text-orange-300 font-semibold mb-3 text-center">
                        CAMADA 3: BACK-END (FastAPI Python)
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2">
                          <p className="text-orange-200 font-medium">Auth:</p>
                          <ul className="text-orange-400 space-y-1 text-xs">
                            <li>POST /auth/login</li>
                            <li>POST /auth/refresh</li>
                            <li>POST /auth/otp/solicitar</li>
                            <li>POST /auth/otp/verificar</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="text-orange-200 font-medium">Upload/Supervisor:</p>
                          <ul className="text-orange-400 space-y-1 text-xs">
                            <li>POST /uploads</li>
                            <li>GET /uploads/pending</li>
                            <li>POST /uploads/:id/approve</li>
                            <li>POST /uploads/:id/reject</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="text-orange-200 font-medium">Download/Audit:</p>
                          <ul className="text-orange-400 space-y-1 text-xs">
                            <li>GET /externo/lista</li>
                            <li>POST /externo/ack</li>
                            <li>GET /audit-logs</li>
                            <li>GET /notifications</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Seta */}
                    <div className="text-center text-orange-400 text-2xl">↓ SQL / SDK</div>

                    {/* Camada 4: AWS Services */}
                    <div className="bg-slate-800/50 border-2 border-yellow-400 rounded-lg p-4">
                      <p className="text-yellow-300 font-semibold mb-3 text-center">CAMADA 4: SERVIÇOS AWS</p>
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div className="bg-yellow-900/30 p-2 rounded text-center">
                          <p className="text-yellow-200 font-medium text-xs">RDS PostgreSQL</p>
                          <p className="text-yellow-400 text-xs mt-1">Dados estruturados</p>
                        </div>
                        <div className="bg-yellow-900/30 p-2 rounded text-center">
                          <p className="text-yellow-200 font-medium text-xs">S3</p>
                          <p className="text-yellow-400 text-xs mt-1">Arquivos ZIP</p>
                        </div>
                        <div className="bg-yellow-900/30 p-2 rounded text-center">
                          <p className="text-yellow-200 font-medium text-xs">SES</p>
                          <p className="text-yellow-400 text-xs mt-1">Envio de OTP</p>
                        </div>
                        <div className="bg-yellow-900/30 p-2 rounded text-center">
                          <p className="text-yellow-200 font-medium text-xs">CloudWatch</p>
                          <p className="text-yellow-400 text-xs mt-1">Logs e métricas</p>
                        </div>
                      </div>
                    </div>

                    {/* Seta */}
                    <div className="text-center text-yellow-400 text-2xl">↓ Persistência</div>

                    {/* Camada 5: Banco de Dados */}
                    <div className="bg-slate-800/50 border-2 border-emerald-400 rounded-lg p-4">
                      <p className="text-emerald-300 font-semibold mb-3 text-center">
                        CAMADA 5: BANCO DE DADOS (PostgreSQL)
                      </p>
                      <div className="grid grid-cols-4 gap-3 text-xs">
                        <div className="bg-emerald-900/30 p-2 rounded">
                          <p className="text-emerald-200 font-medium">users</p>
                          <p className="text-emerald-400 text-xs">Autenticação</p>
                        </div>
                        <div className="bg-emerald-900/30 p-2 rounded">
                          <p className="text-emerald-200 font-medium">uploads</p>
                          <p className="text-emerald-400 text-xs">Arquivos enviados</p>
                        </div>
                        <div className="bg-emerald-900/30 p-2 rounded">
                          <p className="text-emerald-200 font-medium">shares</p>
                          <p className="text-emerald-400 text-xs">Compartilhamentos</p>
                        </div>
                        <div className="bg-emerald-900/30 p-2 rounded">
                          <p className="text-emerald-200 font-medium">audit_logs</p>
                          <p className="text-emerald-400 text-xs">Auditoria completa</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Soluções Práticas */}
                <div className="space-y-6">
                  <h3 className="font-bold text-slate-900 text-lg">Soluções Práticas de Integração</h3>

                  {/* Solução 1: API Client */}
                  <div className="bg-cyan-50 p-5 rounded-lg border-l-4 border-cyan-500">
                    <h4 className="font-semibold text-cyan-900 mb-3 flex items-center gap-2">
                      <Code2 className="h-4 w-4" />
                      1. Criar API Client Centralizado no Front-end
                    </h4>
                    <div className="space-y-3 text-sm">
                      <p className="text-cyan-800">
                        <strong>ONDE:</strong>{" "}
                        <code className="bg-cyan-100 px-2 py-0.5 rounded">lib/api/client.ts</code>
                      </p>
                      <div className="bg-white p-3 rounded border border-cyan-200">
                        <pre className="text-xs text-cyan-900 overflow-x-auto">
                          {`// lib/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class ApiClient {
  async request(endpoint: string, options?: RequestInit) {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(\`\${API_URL}\${endpoint}\`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': \`Bearer \${token}\` }),
        ...options?.headers,
      },
    })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  // Upload
  async uploadFiles(formData: FormData) {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(\`\${API_URL}/uploads\`, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${token}\` },
      body: formData,
    })
    return response.json()
  }

  // Supervisor
  async getPendingUploads() {
    return this.request('/uploads/pending')
  }

  async approveUpload(id: string, expirationHours: number) {
    return this.request(\`/uploads/\${id}/approve\`, {
      method: 'POST',
      body: JSON.stringify({ expiration_hours: expirationHours }),
    })
  }

  async rejectUpload(id: string, reason: string) {
    return this.request(\`/uploads/\${id}/reject\`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: reason }),
    })
  }
}

export const apiClient = new ApiClient()`}
                        </pre>
                      </div>
                      <p className="text-cyan-700">
                        <strong>BENEFÍCIO:</strong> Centraliza todas as chamadas de API, gerencia tokens automaticamente
                        e facilita manutenção.
                      </p>
                    </div>
                  </div>

                  {/* Solução 2: Atualizar Stores */}
                  <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      2. Conectar Stores Zustand com API Real
                    </h4>
                    <div className="space-y-3 text-sm">
                      <p className="text-blue-800">
                        <strong>ONDE:</strong> Substituir dados mock nos stores por chamadas reais
                      </p>
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <pre className="text-xs text-blue-900 overflow-x-auto">
                          {`// lib/stores/auth-store.ts
import { apiClient } from '@/lib/api/client'

export const useAuthStore = create<AuthStore>((set) => ({

  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)
      localStorage.setItem('accessToken', response.access_token)
      localStorage.setItem('refreshToken', response.refresh_token)
      set({
        user: {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          userType: response.user.user_type,
        },
        isAuthenticated: true,
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Credenciais inválidas' }
    }
  },

}))`}
                        </pre>
                      </div>
                      <p className="text-blue-700">
                        <strong>AÇÃO:</strong> Repetir para workflow-store, audit-log-store e notification-store.
                      </p>
                    </div>
                  </div>

                  {/* Solução 3: Variáveis de Ambiente */}
                  <div className="bg-purple-50 p-5 rounded-lg border-l-4 border-purple-500">
                    <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      3. Configurar Variáveis de Ambiente
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-purple-800 font-medium mb-2">Front-end (.env.local):</p>
                          <div className="bg-white p-3 rounded border border-purple-200">
                            <pre className="text-xs text-purple-900">
                              {`NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development`}
                            </pre>
                          </div>
                        </div>
                        <div>
                          <p className="text-purple-800 font-medium mb-2">Back-end (.env):</p>
                          <div className="bg-white p-3 rounded border border-purple-200">
                            <pre className="text-xs text-purple-900">
                              {`DATABASE_URL=postgresql://user:pass@localhost:5432/petrobras
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=petrobras-files
AWS_REGION=us-east-1
JWT_SECRET=your_secret_key
SMTP_HOST=email-smtp.us-east-1.amazonaws.com`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Solução 4: Deploy na AWS */}
                  <div className="bg-orange-50 p-5 rounded-lg border-l-4 border-orange-500">
                    <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      4. Estratégia de Deploy na AWS
                    </h4>
                    <div className="space-y-4 text-sm">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded border border-orange-200">
                          <p className="font-semibold text-orange-900 mb-2">Front-end (Vercel):</p>
                          <ul className="list-disc list-inside text-orange-700 space-y-1">
                            <li>Deploy automático via Git</li>
                            <li>Variável: NEXT_PUBLIC_API_URL aponta para API Gateway</li>
                            <li>CDN global automático</li>
                            <li>SSL/HTTPS incluído</li>
                          </ul>
                        </div>
                        <div className="bg-white p-4 rounded border border-orange-200">
                          <p className="font-semibold text-orange-900 mb-2">Back-end (AWS):</p>
                          <ul className="list-disc list-inside text-orange-700 space-y-1">
                            <li>ECS Fargate: Container FastAPI</li>
                            <li>API Gateway: Endpoint público</li>
                            <li>RDS PostgreSQL: Multi-AZ</li>
                            <li>S3: Arquivos com lifecycle policy</li>
                            <li>CloudWatch: Logs e alertas</li>
                          </ul>
                        </div>
                      </div>
                      <div className="bg-orange-100 p-3 rounded">
                        <p className="font-semibold text-orange-900 mb-1">Comandos de Deploy:</p>
                        <pre className="text-xs text-orange-800 bg-white p-2 rounded mt-2">
                          {`# 1. Build da imagem Docker
cd back-end/python
docker build -t petrobras-api .

# 2. Push para ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag petrobras-api:latest <account>.dkr.ecr.us-east-1.amazonaws.com/petrobras-api:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/petrobras-api:latest

# 3. Atualizar serviço ECS
aws ecs update-service --cluster petrobras-cluster --service petrobras-api --force-new-deployment`}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Solução 5: Monitoramento */}
                  <div className="bg-emerald-50 p-5 rounded-lg border-l-4 border-emerald-500">
                    <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      5. Monitoramento e Logs
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded border border-emerald-200">
                          <p className="font-semibold text-emerald-900 mb-2">CloudWatch Logs:</p>
                          <ul className="text-emerald-700 space-y-1 text-xs">
                            <li>• Log group: /aws/ecs/petrobras-api</li>
                            <li>• Retenção: 30 dias</li>
                            <li>• Filtros: ERROR, WARNING</li>
                          </ul>
                        </div>
                        <div className="bg-white p-3 rounded border border-emerald-200">
                          <p className="font-semibold text-emerald-900 mb-2">CloudWatch Metrics:</p>
                          <ul className="text-emerald-700 space-y-1 text-xs">
                            <li>• CPU/Memory do ECS</li>
                            <li>• Latência da API</li>
                            <li>• Taxa de erros 4xx/5xx</li>
                          </ul>
                        </div>
                        <div className="bg-white p-3 rounded border border-emerald-200">
                          <p className="font-semibold text-emerald-900 mb-2">Alarmes:</p>
                          <ul className="text-emerald-700 space-y-1 text-xs">
                            <li>• CPU &gt; 80%</li>
                            <li>• Erro 5xx &gt; 10/min</li>
                            <li>• Latência &gt; 2s</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumo Final */}
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-xl border-2 border-cyan-300">
                  <h3 className="font-bold text-cyan-900 mb-4 text-lg">Resumo da Integração Completa</h3>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <p className="font-semibold text-cyan-900">O que precisamos implementar:</p>
                      <ul className="space-y-2 text-cyan-700">
                        <li className="flex items-start gap-2">
                          <Badge className="bg-red-600 mt-0.5">Crítico</Badge>
                          <span>Tabela users e endpoints de autenticação JWT</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge className="bg-red-600 mt-0.5">Crítico</Badge>
                          <span>Sistema de aprovação/rejeição no back-end</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge className="bg-orange-600 mt-0.5">Importante</Badge>
                          <span>Sistema completo de auditoria e notificações</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge className="bg-orange-600 mt-0.5">Importante</Badge>
                          <span>API Client no front-end conectando aos stores</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge className="bg-yellow-600 mt-0.5">Desejável</Badge>
                          <span>WebSockets para notificações em tempo real</span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <p className="font-semibold text-cyan-900">O que já está pronto:</p>
                      <ul className="space-y-2 text-cyan-700">
                        <li className="flex items-start gap-2">
                          <Badge className="bg-green-600 mt-0.5">OK</Badge>
                          <span>Autenticação OTP para usuários externos</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge className="bg-green-600 mt-0.5">OK</Badge>
                          <span>Download com ACK de confirmação</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge className="bg-green-600 mt-0.5">OK</Badge>
                          <span>Estrutura de arquivos compatível</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge className="bg-green-600 mt-0.5">OK</Badge>
                          <span>UI completa no front-end Next.js</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge className="bg-green-600 mt-0.5">OK</Badge>
                          <span>Documentação completa na Wiki</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estratégia */}
          <TabsContent value="estrategia" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  Estratégia de Integração Completa
                </CardTitle>
                <CardDescription>
                  Passo a passo detalhado para conectar front-end Next.js e back-end FastAPI em todas as páginas e
                  perfis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fase 1 */}
                <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2 text-lg">
                    <Badge className="bg-purple-600">Fase 1</Badge>
                    Preparação do Back-end
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">1.1. Criar estrutura de banco de dados</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          Criar migrations com Alembic para todas as tabelas (users, shares, files, audit_logs, etc)
                        </li>
                        <li>
                          Adicionar campos <code className="bg-purple-100 px-1.5 py-0.5 rounded">status</code>,{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">rejection_reason</code>,{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">approved_by</code> na tabela shares
                        </li>
                        <li>Executar migrations no PostgreSQL RDS</li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">1.2. Implementar autenticação JWT</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          Criar endpoint <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /auth/login</code>{" "}
                          (email/password)
                        </li>
                        <li>
                          Criar endpoint <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /auth/refresh</code>{" "}
                          (renovar token)
                        </li>
                        <li>Retornar accessToken + refreshToken + user object</li>
                        <li>Implementar middleware de validação JWT em todas as rotas protegidas</li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">1.3. Criar endpoints de upload</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /uploads/presigned</code> - Gerar
                          URL pré-assinada S3
                        </li>
                        <li>
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /uploads</code> - Confirmar upload
                          e criar share (status: pending)
                        </li>
                        <li>
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">GET /uploads</code> - Listar uploads do
                          usuário
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">1.4. Criar endpoints de supervisor</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">GET /supervisor/pending</code> - Listar
                          pendentes
                        </li>
                        <li>
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">GET /supervisor/all</code> - Listar
                          todos (com filtro status)
                        </li>
                        <li>
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /supervisor/approve/:id</code> -
                          Aprovar
                        </li>
                        <li>
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /supervisor/reject/:id</code> -
                          Rejeitar (com motivo)
                        </li>
                        <li>
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">PATCH /supervisor/expiration/:id</code>{" "}
                          - Ajustar tempo
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Fase 2 */}
                <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2 text-lg">
                    <Badge className="bg-purple-600">Fase 2</Badge>
                    Adaptação do Front-end
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">2.1. Criar serviço de API</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          Criar <code className="bg-purple-100 px-1.5 py-0.5 rounded">lib/api/client.ts</code> com fetch
                          wrapper
                        </li>
                        <li>Adicionar interceptor para incluir accessToken em headers</li>
                        <li>Implementar refresh automático quando token expira (401)</li>
                        <li>Converter snake_case (back-end) ↔ camelCase (front-end) automaticamente</li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">2.2. Conectar auth-store</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          Função <code className="bg-purple-100 px-1.5 py-0.5 rounded">login()</code> chama{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /auth/login</code>
                        </li>
                        <li>Salvar tokens e user no Zustand persist (mesmo schema atual)</li>
                        <li>
                          Função <code className="bg-purple-100 px-1.5 py-0.5 rounded">logout()</code> limpa store e
                          redireciona
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">2.3. Conectar workflow-store</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          Função <code className="bg-purple-100 px-1.5 py-0.5 rounded">addUpload()</code> chama{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /uploads/presigned</code> + S3 +{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /uploads</code>
                        </li>
                        <li>
                          Função <code className="bg-purple-100 px-1.5 py-0.5 rounded">approveUpload()</code> chama{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /supervisor/approve/:id</code>
                        </li>
                        <li>
                          Função <code className="bg-purple-100 px-1.5 py-0.5 rounded">rejectUpload()</code> chama{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /supervisor/reject/:id</code>
                        </li>
                        <li>
                          Carregar dados iniciais com{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">GET /uploads</code> ou{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">GET /supervisor/all</code>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Fase 3 */}
                <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2 text-lg">
                    <Badge className="bg-purple-600">Fase 3</Badge>
                    Integração por Página/Perfil
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">3.1. Página de Login (app/page.tsx)</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          <strong>Status Atual:</strong> Mock local com usuários hardcoded
                        </li>
                        <li>
                          <strong>Mudança:</strong> Chamar{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /auth/login</code> ao submeter
                        </li>
                        <li>
                          <strong>Validação:</strong> Mensagens de erro do back-end (credenciais inválidas, usuário não
                          existe)
                        </li>
                        <li>
                          <strong>Redirecionamento:</strong> Conforme userType retornado (/upload, /supervisor,
                          /download)
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">3.2. Upload (app/upload/page.tsx)</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          <strong>Status Atual:</strong> Adiciona no Zustand local (mock)
                        </li>
                        <li>
                          <strong>Mudança:</strong> Fluxo completo S3 + API
                          <ol className="list-decimal list-inside ml-4 mt-1">
                            <li>Solicitar presigned URL</li>
                            <li>Upload direto para S3</li>
                            <li>Confirmar upload com metadados</li>
                          </ol>
                        </li>
                        <li>
                          <strong>Validação:</strong> Arquivos perigosos já implementada (manter)
                        </li>
                        <li>
                          <strong>Feedback:</strong> Progress bar real do upload S3
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">3.3. Supervisor (app/supervisor/page.tsx)</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          <strong>Status Atual:</strong> Lista uploads do Zustand local
                        </li>
                        <li>
                          <strong>Mudança:</strong> Carregar com{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">GET /supervisor/all</code>
                        </li>
                        <li>
                          <strong>Widgets:</strong> Contadores (pendentes, aprovados, rejeitados) vêm do back-end
                        </li>
                        <li>
                          <strong>Filtros:</strong> Enviar parâmetros status, search para API
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">
                        3.4. Detalhes (app/supervisor/detalhes/[id]/page.tsx)
                      </p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          <strong>Status Atual:</strong> Busca upload por ID no Zustand
                        </li>
                        <li>
                          <strong>Mudança:</strong> Chamar{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">GET /supervisor/:id</code>
                        </li>
                        <li>
                          <strong>Aprovar:</strong>{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /supervisor/approve/:id</code> +
                          recarregar dados
                        </li>
                        <li>
                          <strong>Rejeitar:</strong> Modal com motivo →{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /supervisor/reject/:id</code>
                        </li>
                        <li>
                          <strong>Ajustar Expiração:</strong>{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">PATCH /supervisor/expiration/:id</code>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">
                        3.5. Download Externo (app/download/page.tsx)
                      </p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          <strong>Status Atual:</strong> Lista do Zustand apenas aprovados
                        </li>
                        <li>
                          <strong>Mudança:</strong> Autenticação OTP mantém fluxo atual (já compatível!)
                        </li>
                        <li>
                          <strong>Listar:</strong>{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">GET /externo/lista?token=...</code>
                        </li>
                        <li>
                          <strong>Download:</strong> Usar presigned URL do back-end
                        </li>
                        <li>
                          <strong>ACK:</strong>{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">POST /externo/ack</code> ao clicar
                          download
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">3.6. Auditoria (app/auditoria/page.tsx)</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          <strong>Status Atual:</strong> Lista do audit-log-store (Zustand)
                        </li>
                        <li>
                          <strong>Mudança:</strong> Carregar com{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">GET /audit-logs</code> (com paginação)
                        </li>
                        <li>
                          <strong>Filtros:</strong> Por usuário, ação, nível, data (query params)
                        </li>
                        <li>
                          <strong>Exportar:</strong>{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">GET /audit-logs/export?format=csv</code>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">3.7. Histórico (app/historico/page.tsx)</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          <strong>Status Atual:</strong> Lista todos uploads do Zustand
                        </li>
                        <li>
                          <strong>Mudança:</strong> Carregar com{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">GET /uploads?user_id=current</code>
                        </li>
                        <li>
                          <strong>Filtros:</strong> Status, data, destinatário
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Fase 4 */}
                <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2 text-lg">
                    <Badge className="bg-purple-600">Fase 4</Badge>
                    Deploy e Testes
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">4.1. Deploy Back-end</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>Empacotar FastAPI com Docker ou SAM</li>
                        <li>Deploy no Lambda + API Gateway</li>
                        <li>Configurar variáveis de ambiente (DATABASE_URL, JWT_SECRET, S3_BUCKET, SES_SENDER)</li>
                        <li>Executar migrations no RDS PostgreSQL</li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">4.2. Deploy Front-end</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>
                          Build estático Next.js:{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">next build</code>
                        </li>
                        <li>Upload para S3 bucket</li>
                        <li>Configurar CloudFront para servir S3 + API Gateway</li>
                        <li>
                          Adicionar variável{" "}
                          <code className="bg-purple-100 px-1.5 py-0.5 rounded">NEXT_PUBLIC_API_URL</code> apontando
                          para API Gateway
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">4.3. Testes de Integração</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>Login como interno → Upload → Aguardar aprovação</li>
                        <li>Login como supervisor → Aprovar/Rejeitar</li>
                        <li>Download externo com OTP → Verificar ACK</li>
                        <li>Auditoria → Verificar todos logs registrados</li>
                        <li>Testar expiração de tokens e refresh automático</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Checklist Final */}
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-lg border-2 border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-4 text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Checklist de Integração
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p className="font-semibold text-purple-900">Back-end</p>
                      <ul className="space-y-1 text-purple-700">
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Banco de dados PostgreSQL criado</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Migrations executadas</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Endpoints de auth implementados</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Endpoints de upload implementados</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Endpoints de supervisor implementados</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Sistema de auditoria implementado</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Integração S3 funcionando</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Envio de emails SES configurado</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="font-semibold text-purple-900">Front-end</p>
                      <ul className="space-y-1 text-purple-700">
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>API client criado</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Auth store conectado</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Workflow store conectado</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Página de login integrada</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Página de upload integrada</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Página de supervisor integrada</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Página de download integrada</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span>Página de auditoria integrada</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
