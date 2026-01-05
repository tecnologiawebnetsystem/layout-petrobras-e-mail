"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  CheckCircle2,
  Cloud,
  Database,
  Lightbulb,
  Lock,
  Mail,
  Network,
  Shield,
  Zap,
  AlertTriangle,
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
            <Network className="h-8 w-8 text-white" />
          </div>

          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">Integração Front-Back</h1>
          <p className="text-lg text-slate-600">
            Análise completa: Next.js 16 + Python FastAPI + AWS + ServiceNow + Entra ID
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 h-auto gap-2 bg-transparent p-0">
            <TabsTrigger
              value="arquitetura"
              className="data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:border-cyan-200 border-2 py-3"
            >
              <Network className="mr-2 h-4 w-4" />
              Arquitetura
            </TabsTrigger>
            <TabsTrigger
              value="tecnologias"
              className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-purple-200 border-2 py-3"
            >
              <Cloud className="mr-2 h-4 w-4" />
              Tecnologias
            </TabsTrigger>
            <TabsTrigger
              value="auth"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:border-indigo-200 border-2 py-3"
            >
              <Shield className="mr-2 h-4 w-4" />
              Autenticação
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 data-[state=active]:border-pink-200 border-2 py-3"
            >
              <Mail className="mr-2 h-4 w-4" />
              E-mail
            </TabsTrigger>
            <TabsTrigger
              value="banco"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 border-2 py-3"
            >
              <Database className="mr-2 h-4 w-4" />
              DynamoDB
            </TabsTrigger>
            <TabsTrigger
              value="conflitos"
              className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-red-200 border-2 py-3"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Conflitos
            </TabsTrigger>
            <TabsTrigger
              value="implementacao"
              className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200 border-2 py-3"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Implementação
            </TabsTrigger>
          </TabsList>

          {/* Tab: Arquitetura */}
          <TabsContent value="arquitetura" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Diagrama de Arquitetura Completa</CardTitle>
                <CardDescription>Como todos os sistemas se integram</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-xl border-2 border-slate-200">
                  <div className="space-y-6">
                    {/* Usuários */}
                    <div className="text-center">
                      <div className="inline-flex items-center gap-3 bg-indigo-100 px-6 py-3 rounded-lg border-2 border-indigo-300">
                        <span className="font-semibold text-indigo-900">Usuários Petrobras</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-2">
                        Kleber Gonçalves (Interno) • Wagner Gaspar Brazil (Supervisor) • Externos
                      </div>
                    </div>

                    <div className="text-center text-2xl text-slate-400">↓</div>

                    {/* Autenticação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-300">
                        <div className="font-bold text-indigo-900 mb-2">Microsoft Entra ID</div>
                        <div className="text-xs text-indigo-700 space-y-1">
                          <div>• SSO Corporativo</div>
                          <div>• Login Único Office 365</div>
                          <div>• MFA Integrado</div>
                        </div>
                      </div>
                      <div className="bg-violet-50 p-4 rounded-lg border-2 border-violet-300">
                        <div className="font-bold text-violet-900 mb-2">ServiceNow</div>
                        <div className="text-xs text-violet-700 space-y-1">
                          <div>• Table API (sys_user)</div>
                          <div>• Verificação de Perfil</div>
                          <div>• Gestão de Roles</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-2xl text-slate-400">↓</div>

                    {/* Front-end */}
                    <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-300">
                      <div className="font-bold text-blue-900 mb-3">FRONT-END: Next.js 16 + TypeScript</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="bg-white p-2 rounded border">
                          <div className="font-semibold text-blue-800">Páginas</div>
                          <div className="text-blue-600">/upload, /download, /supervisor, /auditoria</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="font-semibold text-blue-800">Stores (Zustand)</div>
                          <div className="text-blue-600">auth-store, workflow-store, audit-log-store</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="font-semibold text-blue-800">Componentes</div>
                          <div className="text-blue-600">LoginForm, UploadForm, ZipViewer</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="font-semibold text-blue-800">Libs</div>
                          <div className="text-blue-600">shadcn/ui, TailwindCSS, JSZip</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl text-slate-400">↓</div>
                      <div className="text-xs font-medium text-slate-600">HTTP REST API</div>
                    </div>

                    {/* Back-end */}
                    <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-300">
                      <div className="font-bold text-purple-900 mb-3">BACK-END: Python 3.13 + FastAPI</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="bg-white p-2 rounded border">
                          <div className="font-semibold text-purple-800">30+ Endpoints</div>
                          <div className="text-purple-600">/auth, /files, /shares, /supervisor, /audit</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="font-semibold text-purple-800">6 Serviços</div>
                          <div className="text-purple-600">token, file, email, audit, servicenow</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="font-semibold text-purple-800">6 Modelos</div>
                          <div className="text-purple-600">User, File, Share, Session, AuditLog, Notification</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="font-semibold text-purple-800">Bibliotecas</div>
                          <div className="text-purple-600">boto3, pydantic, passlib, jwt</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-2xl text-slate-400">↓</div>

                    {/* AWS */}
                    <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-300">
                      <div className="font-bold text-orange-900 mb-3">SERVIÇOS AWS</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        <div className="bg-white p-2 rounded border">
                          <div className="font-semibold text-orange-800">DynamoDB</div>
                          <div className="text-orange-600">6 tabelas NoSQL</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="font-semibold text-orange-800">S3</div>
                          <div className="text-orange-600">Arquivos ZIP</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="font-semibold text-orange-800">SES</div>
                          <div className="text-orange-600">E-mails OTP</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="font-semibold text-orange-800">Lambda</div>
                          <div className="text-orange-600">Expiração TTL</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="font-semibold text-orange-800">Secrets Manager</div>
                          <div className="text-orange-600">Credenciais</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="font-semibold text-orange-800">CloudWatch</div>
                          <div className="text-orange-600">Logs e Métricas</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-2xl text-slate-400">↓</div>

                    {/* Email */}
                    <div className="bg-pink-50 p-4 rounded-lg border-2 border-pink-300 text-center">
                      <div className="font-bold text-pink-900 mb-2">RESEND (Email Service)</div>
                      <div className="text-xs text-pink-700">
                        Notificações automáticas para kleber.goncalves.prestserv@petrobras.com.br
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Tecnologias */}
          <TabsContent value="tecnologias" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Front-end Tech Stack */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-700">Front-end Stack</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Badge className="mb-2 bg-blue-600">Next.js 16</Badge>
                    <p className="text-sm text-slate-600">App Router, Server Components, React 19.2</p>
                  </div>
                  <div>
                    <Badge className="mb-2 bg-blue-600">TypeScript</Badge>
                    <p className="text-sm text-slate-600">Type-safe, strict mode, interfaces compartilhadas</p>
                  </div>
                  <div>
                    <Badge className="mb-2 bg-blue-600">Zustand</Badge>
                    <p className="text-sm text-slate-600">State management: auth-store, workflow-store</p>
                  </div>
                  <div>
                    <Badge className="mb-2 bg-blue-600">shadcn/ui + Tailwind</Badge>
                    <p className="text-sm text-slate-600">Componentes: Button, Card, Dialog, Tabs</p>
                  </div>
                  <div>
                    <Badge className="mb-2 bg-blue-600">@azure/msal-react</Badge>
                    <p className="text-sm text-slate-600">Microsoft Entra ID SSO integration</p>
                  </div>
                  <div>
                    <Badge className="mb-2 bg-blue-600">Resend SDK</Badge>
                    <p className="text-sm text-slate-600">API key: RESEND_API_KEY</p>
                  </div>
                </CardContent>
              </Card>

              {/* Back-end Tech Stack */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-purple-700">Back-end Stack</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Badge className="mb-2 bg-purple-600">Python 3.13</Badge>
                    <p className="text-sm text-slate-600">Async/await, type hints, modern features</p>
                  </div>
                  <div>
                    <Badge className="mb-2 bg-purple-600">FastAPI</Badge>
                    <p className="text-sm text-slate-600">Auto docs (Swagger), pydantic validation</p>
                  </div>
                  <div>
                    <Badge className="mb-2 bg-purple-600">Boto3</Badge>
                    <p className="text-sm text-slate-600">AWS SDK: DynamoDB, S3, SES, Secrets Manager</p>
                  </div>
                  <div>
                    <Badge className="mb-2 bg-purple-600">PyJWT</Badge>
                    <p className="text-sm text-slate-600">JWT tokens (accessToken, refreshToken)</p>
                  </div>
                  <div>
                    <Badge className="mb-2 bg-purple-600">Passlib + bcrypt</Badge>
                    <p className="text-sm text-slate-600">Password hashing, OTP generation</p>
                  </div>
                  <div>
                    <Badge className="mb-2 bg-purple-600">Requests</Badge>
                    <p className="text-sm text-slate-600">ServiceNow Table API integration</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Autenticação */}
          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sistema de Autenticação Híbrido</CardTitle>
                <CardDescription>3 métodos de autenticação integrados com SSO e proteção de rotas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-l-4 border-blue-500 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-950/50">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Zap className="h-5 w-5" />
                    <h3 className="font-semibold">SSO Automático Ativado</h3>
                  </div>
                  <p className="mt-2 text-sm text-blue-600 dark:text-blue-300">
                    O sistema agora detecta automaticamente se o usuário está logado no Windows/Office com conta
                    Petrobras e faz login sem pedir senha. Rotas /upload e /compartilhamentos estão protegidas.
                  </p>
                </div>

                {/* Método 1: Entra ID */}
                <div className="bg-indigo-50 p-6 rounded-lg border-2 border-indigo-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-lg font-bold text-indigo-900">1. Microsoft Entra ID (SSO)</h3>
                    <Badge className="bg-green-600">Implementado</Badge>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-semibold text-indigo-800">Para quem:</div>
                      <div className="text-indigo-700">
                        Usuários Internos e Supervisores com conta Microsoft Petrobras
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-indigo-800">Como funciona:</div>
                      <div className="text-indigo-700">
                        1. Usuário acessa /upload ou /compartilhamentos
                        <br />
                        2. ProtectedRoute detecta se já está logado no Windows/Office
                        <br />
                        3. Se sim: Login AUTOMÁTICO sem pedir senha (ssoSilent)
                        <br />
                        4. Se não: Redireciona para tela de login
                        <br />
                        5. Usuário clica "Entrar com Microsoft" e faz login
                        <br />
                        6. Retorna com token OAuth2 e dados sincronizados
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-indigo-800">Componentes implementados:</div>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <code className="text-xs bg-indigo-100 px-2 py-0.5 rounded">
                            components/auth/protected-route.tsx
                          </code>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <code className="text-xs bg-indigo-100 px-2 py-0.5 rounded">
                            components/auth/entra-provider.tsx
                          </code>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <code className="text-xs bg-indigo-100 px-2 py-0.5 rounded">lib/auth/entra-config.ts</code>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-indigo-800">Rotas protegidas:</div>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-amber-600" />
                          <span className="text-indigo-700">/upload - Requer autenticação Entra ID</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-amber-600" />
                          <span className="text-indigo-700">/compartilhamentos - Requer autenticação Entra ID</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Método 2: ServiceNow */}
                <div className="bg-violet-50 p-6 rounded-lg border-2 border-violet-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-6 w-6 text-violet-600" />
                    <h3 className="text-lg font-bold text-violet-900">2. ServiceNow Table API</h3>
                    <Badge className="bg-blue-600">Produção</Badge>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-semibold text-violet-800">Para quem:</div>
                      <div className="text-violet-700">Todos os usuários com credenciais ServiceNow</div>
                    </div>
                    <div>
                      <div className="font-semibold text-violet-800">Como funciona:</div>
                      <div className="text-violet-700">
                        1. POST /api/auth/servicenow com email/senha
                        <br />
                        2. Back-end Python chama ServiceNow API
                        <br />
                        3. GET /api/now/table/sys_user?sysparm_query=email=...
                        <br />
                        4. Verifica role (supervisor vs interno)
                        <br />
                        5. Retorna JWT se válido
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-violet-800">Endpoint ServiceNow:</div>
                      <div className="text-violet-700 font-mono text-xs bg-violet-100 p-2 rounded mt-1">
                        https://petrobras.service-now.com/api/now/table/sys_user
                      </div>
                    </div>
                  </div>
                </div>

                {/* Método 3: Email + OTP */}
                <div className="bg-pink-50 p-6 rounded-lg border-2 border-pink-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Mail className="h-6 w-6 text-pink-600" />
                    <h3 className="text-lg font-bold text-pink-900">3. E-mail + OTP</h3>
                    <Badge className="bg-yellow-600">Externos</Badge>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-semibold text-pink-800">Para quem:</div>
                      <div className="text-pink-700">Usuários externos sem conta Microsoft ou ServiceNow</div>
                    </div>
                    <div>
                      <div className="font-semibold text-pink-800">Como funciona:</div>
                      <div className="text-pink-700">
                        1. Usuário digita email
                        <br />
                        2. POST /api/auth/send-otp → AWS SES envia código 6 dígitos
                        <br />
                        3. Usuário digita OTP recebido
                        <br />
                        4. POST /api/auth/verify-otp → valida e retorna JWT
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-pink-800">Validade:</div>
                      <div className="text-pink-700">OTP expira em 10 minutos (TTL no DynamoDB)</div>
                    </div>
                  </div>
                </div>

                {/* Fluxo JWT */}
                <div className="bg-slate-50 p-6 rounded-lg border-2 border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Fluxo JWT e Proteção de Rotas</h3>
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <span className="font-semibold">accessToken:</span> Válido por 1 hora, enviado em Authorization
                        Bearer
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <span className="font-semibold">refreshToken:</span> Válido por 7 dias, armazenado em HTTP-only
                        cookie
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <span className="font-semibold">ProtectedRoute:</span> Verifica auth antes de renderizar página,
                        tenta SSO silencioso
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <span className="font-semibold">Middleware Python:</span> Valida JWT em todas as rotas
                        protegidas no back-end
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <span className="font-semibold">Session Store:</span> petrobras-sessions no DynamoDB com TTL
                        automático
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Email */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sistema de E-mail (Resend)</CardTitle>
                <CardDescription>Notificações automáticas configuradas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Configuração Resend */}
                <div className="bg-pink-50 p-6 rounded-lg border-2 border-pink-200">
                  <h3 className="text-lg font-bold text-pink-900 mb-3">Configuração Atual</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-semibold text-pink-800">Serviço:</div>
                      <div className="text-pink-700">Resend (resend.com) - Plano gratuito 3.000 emails/mês</div>
                    </div>
                    <div>
                      <div className="font-semibold text-pink-800">API Key:</div>
                      <div className="text-pink-700 font-mono text-xs bg-pink-100 p-2 rounded">
                        RESEND_API_KEY (configurar no v0 Vars)
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-pink-800">Remetente padrão:</div>
                      <div className="text-pink-700">Sistema Petrobras &lt;noreply@petrobras.com.br&gt;</div>
                    </div>
                    <div>
                      <div className="font-semibold text-pink-800">Destinatário supervisor:</div>
                      <div className="text-pink-700 font-semibold">kleber.goncalves.prestserv@petrobras.com.br</div>
                    </div>
                  </div>
                </div>

                {/* Tipos de E-mail */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-2">1. Notificação de Upload (Supervisor)</h4>
                    <div className="text-xs text-blue-700 space-y-1">
                      <div>
                        <strong>Quando:</strong> Usuário interno faz upload
                      </div>
                      <div>
                        <strong>Para:</strong> kleber.goncalves.prestserv@petrobras.com.br
                      </div>
                      <div>
                        <strong>Conteúdo:</strong>
                      </div>
                      <ul className="list-disc list-inside ml-2">
                        <li>Nome do documento</li>
                        <li>Remetente (Kleber Gonçalves)</li>
                        <li>Destinatário externo</li>
                        <li>Lista de arquivos</li>
                        <li>Validade</li>
                        <li>Botão "Revisar Agora"</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                    <h4 className="font-bold text-green-900 mb-2">2. Confirmação de Envio (Remetente)</h4>
                    <div className="text-xs text-green-700 space-y-1">
                      <div>
                        <strong>Quando:</strong> Upload concluído com sucesso
                      </div>
                      <div>
                        <strong>Para:</strong> kleber.goncalves.prestserv@petrobras.com.br
                      </div>
                      <div>
                        <strong>Conteúdo:</strong>
                      </div>
                      <ul className="list-disc list-inside ml-2">
                        <li>Confirmação de envio</li>
                        <li>Lista de arquivos enviados</li>
                        <li>Destinatário</li>
                        <li>Quem vai aprovar (Wagner Gaspar Brazil)</li>
                        <li>Status: Aguardando aprovação</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                    <h4 className="font-bold text-yellow-900 mb-2">3. Link de Download (Externo)</h4>
                    <div className="text-xs text-yellow-700 space-y-1">
                      <div>
                        <strong>Quando:</strong> Supervisor aprova o compartilhamento
                      </div>
                      <div>
                        <strong>Para:</strong> E-mail do destinatário externo
                      </div>
                      <div>
                        <strong>Conteúdo:</strong>
                      </div>
                      <ul className="list-disc list-inside ml-2">
                        <li>Link seguro de download (S3 presigned URL)</li>
                        <li>Validade do link</li>
                        <li>Instruções de acesso</li>
                        <li>OTP se necessário</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                    <h4 className="font-bold text-red-900 mb-2">4. Notificação de Rejeição</h4>
                    <div className="text-xs text-red-700 space-y-1">
                      <div>
                        <strong>Quando:</strong> Supervisor rejeita o upload
                      </div>
                      <div>
                        <strong>Para:</strong> kleber.goncalves.prestserv@petrobras.com.br
                      </div>
                      <div>
                        <strong>Conteúdo:</strong>
                      </div>
                      <ul className="list-disc list-inside ml-2">
                        <li>Motivo da rejeição</li>
                        <li>Quem rejeitou (Wagner Gaspar Brazil)</li>
                        <li>Data e hora</li>
                        <li>Ações recomendadas</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Template HTML */}
                <div className="bg-slate-50 p-6 rounded-lg border-2 border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Design do Template</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>Gradiente verde e azul Petrobras (#00A859 → #003F7F)</div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>Logo Petrobras no cabeçalho</div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>Cards informativos com ícones visuais</div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>Botões CTA destacados (Call-to-Action)</div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>Responsivo (mobile-friendly)</div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>Rodapé com informações de contato</div>
                    </div>
                  </div>
                </div>

                {/* Arquivo API */}
                <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                  <h3 className="text-lg font-bold text-purple-900 mb-3">Implementação Técnica</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-semibold text-purple-800">Arquivo:</div>
                      <div className="text-purple-700 font-mono text-xs">app/api/send-email/route.ts</div>
                    </div>
                    <div>
                      <div className="font-semibold text-purple-800">Função:</div>
                      <div className="text-purple-700 font-mono text-xs">POST /api/send-email</div>
                    </div>
                    <div>
                      <div className="font-semibold text-purple-800">Parâmetros:</div>
                      <div className="text-purple-700 font-mono text-xs bg-purple-100 p-2 rounded mt-1">
                        {`{
  to: string,
  subject: string,
  type: 'supervisor-notification' | 'sender-confirmation' | 'external-download' | 'rejection',
  data: { documentName, files, sender, recipient, validity, ... }
}`}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-purple-800">Chamada do workflow-store:</div>
                      <div className="text-purple-700 font-mono text-xs bg-purple-100 p-2 rounded mt-1">
                        {`await fetch('/api/send-email', {
  method: 'POST',
  body: JSON.stringify({ to, subject, type, data })
})`}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: DynamoDB */}
          <TabsContent value="banco" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estrutura DynamoDB</CardTitle>
                <CardDescription>6 tabelas NoSQL com GSI e TTL</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tabela 1: Users */}
                <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-200">
                  <h4 className="font-bold text-emerald-900 mb-2">petrobras-users</h4>
                  <div className="text-xs space-y-1">
                    <div className="grid grid-cols-3 gap-2 font-mono bg-emerald-100 p-2 rounded">
                      <div>
                        <strong>user_id</strong> (PK)
                      </div>
                      <div>
                        <strong>email</strong> (String)
                      </div>
                      <div>
                        <strong>name</strong> (String)
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono bg-emerald-100 p-2 rounded">
                      <div>
                        <strong>role</strong> (String)
                      </div>
                      <div>
                        <strong>created_at</strong> (Number)
                      </div>
                      <div>
                        <strong>last_login</strong> (Number)
                      </div>
                    </div>
                    <div className="mt-2 text-emerald-700">
                      <strong>GSI:</strong> EmailIndex (email como PK) para busca rápida por e-mail
                    </div>
                  </div>
                </div>

                {/* Tabela 2: Files */}
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-2">petrobras-files</h4>
                  <div className="text-xs space-y-1">
                    <div className="grid grid-cols-3 gap-2 font-mono bg-blue-100 p-2 rounded">
                      <div>
                        <strong>file_id</strong> (PK)
                      </div>
                      <div>
                        <strong>user_id</strong> (String)
                      </div>
                      <div>
                        <strong>document_name</strong> (String)
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono bg-blue-100 p-2 rounded">
                      <div>
                        <strong>s3_key</strong> (String)
                      </div>
                      <div>
                        <strong>status</strong> (String)
                      </div>
                      <div>
                        <strong>expiry_date</strong> (Number)
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono bg-blue-100 p-2 rounded">
                      <div>
                        <strong>recipient_email</strong> (String)
                      </div>
                      <div>
                        <strong>files</strong> (List)
                      </div>
                      <div>
                        <strong>ttl</strong> (Number)
                      </div>
                    </div>
                    <div className="mt-2 text-blue-700">
                      <strong>GSI:</strong> StatusIndex (status como PK) + UserFilesIndex (user_id como PK)
                    </div>
                  </div>
                </div>

                {/* Tabela 3: Audit Logs */}
                <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                  <h4 className="font-bold text-purple-900 mb-2">petrobras-audit-logs</h4>
                  <div className="text-xs space-y-1">
                    <div className="grid grid-cols-3 gap-2 font-mono bg-purple-100 p-2 rounded">
                      <div>
                        <strong>log_id</strong> (PK)
                      </div>
                      <div>
                        <strong>user_id</strong> (String)
                      </div>
                      <div>
                        <strong>action</strong> (String)
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono bg-purple-100 p-2 rounded">
                      <div>
                        <strong>timestamp</strong> (Number)
                      </div>
                      <div>
                        <strong>ip_address</strong> (String)
                      </div>
                      <div>
                        <strong>details</strong> (Map)
                      </div>
                    </div>
                    <div className="mt-2 text-purple-700">
                      <strong>GSI:</strong> UserActionsIndex (user_id + timestamp) para auditoria por usuário
                    </div>
                  </div>
                </div>

                {/* Tabelas 4-6: Resumidas */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-xs">
                    <h5 className="font-bold text-yellow-900 mb-2">petrobras-sessions</h5>
                    <div className="font-mono space-y-1 text-yellow-700">
                      <div>session_id (PK)</div>
                      <div>user_id, access_token</div>
                      <div>ttl: 7 dias</div>
                    </div>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg border border-pink-200 text-xs">
                    <h5 className="font-bold text-pink-900 mb-2">petrobras-notifications</h5>
                    <div className="font-mono space-y-1 text-pink-700">
                      <div>notification_id (PK)</div>
                      <div>user_id, type, is_read</div>
                      <div>GSI: UserNotificationsIndex</div>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 text-xs">
                    <h5 className="font-bold text-orange-900 mb-2">petrobras-expiration-logs</h5>
                    <div className="font-mono space-y-1 text-orange-700">
                      <div>log_id (PK)</div>
                      <div>file_id, old_value, new_value</div>
                      <div>GSI: FileExpirationIndex</div>
                    </div>
                  </div>
                </div>

                {/* TTL Explanation */}
                <div className="bg-slate-50 p-6 rounded-lg border-2 border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">TTL (Time To Live)</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <strong>O que é:</strong> DynamoDB deleta automaticamente itens expirados
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <strong>Formato:</strong> Unix timestamp (segundos desde 1970)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <strong>Uso em files:</strong> Arquivos expirados são deletados automaticamente em até 48h
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <strong>Uso em sessions:</strong> Sessões JWT antigas são limpas automaticamente
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <strong>Custo:</strong> Zero! TTL é gratuito no DynamoDB
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Conflitos */}
          <TabsContent value="conflitos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Análise de Conflitos Front vs Back
                </CardTitle>
                <CardDescription>Campos ausentes e diferenças estruturais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Conflito 1: Status Values */}
                <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-900">1. Valores de Status Diferentes</h4>
                      <p className="text-sm text-red-700">Front-end e Back-end usam nomes diferentes para status</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <div className="font-semibold text-blue-800 mb-2">Front-end (workflow-store.ts)</div>
                      <div className="font-mono text-xs space-y-1 text-blue-700">
                        <div>"pending" (aguardando aprovação)</div>
                        <div>"approved" (aprovado)</div>
                        <div>"rejected" (rejeitado)</div>
                        <div>"downloaded" (baixado)</div>
                        <div>"expired" (expirado)</div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-purple-500">
                      <div className="font-semibold text-purple-800 mb-2">Back-end (models/file.py)</div>
                      <div className="font-mono text-xs space-y-1 text-purple-700">
                        <div>"pending_approval"</div>
                        <div>"approved"</div>
                        <div>"rejected"</div>
                        <div>"downloaded"</div>
                        <div>"expired"</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 bg-green-50 p-3 rounded border-l-4 border-green-500">
                    <div className="font-semibold text-green-800 mb-1">Solução:</div>
                    <div className="text-sm text-green-700">Padronizar para "pending_approval" em ambos os lados</div>
                  </div>
                </div>

                {/* Conflito 2: User Roles */}
                <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="h-6 w-6 text-orange-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-orange-900">2. Roles de Usuário</h4>
                      <p className="text-sm text-orange-700">Nomenclatura inconsistente para perfis</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <div className="font-semibold text-blue-800 mb-2">Front-end</div>
                      <div className="font-mono text-xs space-y-1 text-blue-700">
                        <div>"internal"</div>
                        <div>"supervisor"</div>
                        <div>"external"</div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-purple-500">
                      <div className="font-semibold text-purple-800 mb-2">Back-end</div>
                      <div className="font-mono text-xs space-y-1 text-purple-700">
                        <div>"employee"</div>
                        <div>"manager"</div>
                        <div>"external_user"</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 bg-green-50 p-3 rounded border-l-4 border-green-500">
                    <div className="font-semibold text-green-800 mb-1">Solução:</div>
                    <div className="text-sm text-green-700">Unificar para internal, supervisor, external</div>
                  </div>
                </div>

                {/* Conflito 3: Date Format */}
                <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-yellow-900">3. Formato de Datas</h4>
                      <p className="text-sm text-yellow-700">Front usa ISO string, Back usa Unix timestamp</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <div className="font-semibold text-blue-800 mb-2">Front-end</div>
                      <div className="font-mono text-xs text-blue-700">
                        "2025-12-26T12:00:00.000Z"
                        <br />
                        <span className="text-blue-600">(ISO 8601 string)</span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-purple-500">
                      <div className="font-semibold text-purple-800 mb-2">Back-end</div>
                      <div className="font-mono text-xs text-purple-700">
                        1735214400
                        <br />
                        <span className="text-purple-600">(Unix timestamp)</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 bg-green-50 p-3 rounded border-l-4 border-green-500">
                    <div className="font-semibold text-green-800 mb-1">Solução:</div>
                    <div className="text-sm text-green-700">
                      Back-end converte:{" "}
                      <code className="bg-green-100 px-1 py-0.5 rounded">int(datetime.now().timestamp())</code>
                      <br />
                      Front-end converte:{" "}
                      <code className="bg-green-100 px-1 py-0.5 rounded">new Date(timestamp * 1000).toISOString()</code>
                    </div>
                  </div>
                </div>

                {/* Campos Faltantes */}
                <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                  <h4 className="font-bold text-purple-900 mb-3">Campos Faltando no Back-end</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <AlertTriangle className="h-5 w-5 text-purple-600 shrink-0" />
                      <div>
                        <strong>description:</strong> Campo de descrição do upload presente no front mas não no modelo
                        Python
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AlertTriangle className="h-5 w-5 text-purple-600 shrink-0" />
                      <div>
                        <strong>rejection_reason:</strong> Motivo da rejeição pelo supervisor
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AlertTriangle className="h-5 w-5 text-purple-600 shrink-0" />
                      <div>
                        <strong>approved_by:</strong> ID do supervisor que aprovou
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AlertTriangle className="h-5 w-5 text-purple-600 shrink-0" />
                      <div>
                        <strong>download_count:</strong> Número de vezes que foi baixado
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Implementação */}
          <TabsContent value="implementacao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-green-600" />
                  Roteiro de Implementação
                </CardTitle>
                <CardDescription>Próximos passos para produção</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fase 1 */}
                <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                  <h3 className="text-lg font-bold text-blue-900 mb-3">Fase 1: Padronização (3-5 dias)</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-2">
                      <div className="font-bold text-blue-800 w-6">1.</div>
                      <div className="text-blue-700">
                        <strong>Alinhar nomes de campos:</strong> Unificar status, roles e timestamps entre front e back
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="font-bold text-blue-800 w-6">2.</div>
                      <div className="text-blue-700">
                        <strong>Adicionar campos faltantes:</strong> description, rejection_reason, approved_by,
                        download_count no back-end
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="font-bold text-blue-800 w-6">3.</div>
                      <div className="text-blue-700">
                        <strong>Criar schemas TypeScript:</strong> Interfaces compartilhadas entre front e back
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="font-bold text-blue-800 w-6">4.</div>
                      <div className="text-blue-700">
                        <strong>Validação centralizada:</strong> Usar Zod no front e Pydantic no back com mesmas regras
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fase 2 */}
                <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                  <h3 className="text-lg font-bold text-purple-900 mb-3">Fase 2: Integração AWS (5-7 dias)</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-2">
                      <div className="font-bold text-purple-800 w-6">1.</div>
                      <div className="text-purple-700">
                        <strong>Criar tabelas DynamoDB:</strong> Executar scripts CDK da pasta back-end/aws
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="font-bold text-purple-800 w-6">2.</div>
                      <div className="text-purple-700">
                        <strong>Configurar S3 buckets:</strong> petrobras-files-uploads e petrobras-files-approved
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="font-bold text-purple-800 w-6">3.</div>
                      <div className="text-purple-700">
                        <strong>Setup AWS SES:</strong> Verificar domínio petrobras.com.br e configurar templates
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="font-bold text-purple-800 w-6">4.</div>
                      <div className="text-purple-700">
                        <strong>Testar localmente:</strong> Usar LocalStack para desenvolvimento antes de deploy AWS
                        real
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fase 3 */}
                <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
                  <h3 className="text-lg font-bold text-orange-900 mb-3">
                    Fase 3: Autenticação Corporativa (3-5 dias)
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-2">
                      <div className="font-bold text-orange-800 w-6">1.</div>
                      <div className="text-orange-700">
                        <strong>Solicitar credenciais Entra ID:</strong> Enviar documento formal
                        (Documentacao/SOLICITACAO-ENTRA-ID.md)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="font-bold text-orange-800 w-6">2.</div>
                      <div className="text-orange-700">
                        <strong>Configurar ServiceNow API:</strong> Obter token de acesso e testar Table API
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="font-bold text-orange-800 w-6">3.</div>
                      <div className="text-orange-700">
                        <strong>Implementar middleware JWT:</strong> Validação de token em todas as rotas protegidas
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="font-bold text-orange-800 w-6">4.</div>
                      <div className="text-orange-700">
                        <strong>Testar fluxos:</strong> Login SSO, login ServiceNow, login OTP para externos
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fase 4 */}
                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                  <h3 className="text-lg font-bold text-green-900 mb-3">Fase 4: Deploy Produção (2-3 dias)</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-2">
                      <div className="font-bold text-green-800 w-6">1.</div>
                      <div className="text-green-700">
                        <strong>Deploy Back-end:</strong> FastAPI em AWS Lambda + API Gateway
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="font-bold text-green-800 w-6">2.</div>
                      <div className="text-green-700">
                        <strong>Deploy Front-end:</strong> Next.js na Vercel com variáveis de ambiente de produção
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="font-bold text-green-800 w-6">3.</div>
                      <div className="text-green-700">
                        <strong>Configurar domínio:</strong> compartilhamento.petrobras.com.br apontando para Vercel +
                        API Gateway
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="font-bold text-green-800 w-6">4.</div>
                      <div className="text-green-700">
                        <strong>Monitoramento:</strong> CloudWatch Alarms, Sentry para erros, métricas de uso
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checklist Final */}
                <div className="bg-slate-50 p-6 rounded-lg border-2 border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Checklist de Produção</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" />
                      <span>Todas as variáveis de ambiente configuradas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" />
                      <span>Testes de integração passando</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" />
                      <span>SSL/TLS configurado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" />
                      <span>Rate limiting implementado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" />
                      <span>Backup automático DynamoDB ativado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" />
                      <span>Logs centralizados no CloudWatch</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" />
                      <span>Documentação Swagger atualizada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" />
                      <span>Treinamento da equipe concluído</span>
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
