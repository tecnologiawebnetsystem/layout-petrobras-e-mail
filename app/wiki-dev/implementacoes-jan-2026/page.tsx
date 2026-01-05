"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  ArrowLeft,
  CheckCircle2,
  Shield,
  Lock,
  UserCheck,
  FolderX,
  Mail,
  FileText,
  Code,
  TrendingUp,
  Zap,
} from "lucide-react"
import Link from "next/link"

export default function ImplementacoesJan2026Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Wiki
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">Implementações - 04/01/2026</h1>
          <p className="text-lg text-slate-600">
            Resumo completo de todas as 14 funcionalidades implementadas com estimativas de tempo
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-green-600">14 Funcionalidades</Badge>
            <Badge className="bg-blue-600">146-199 horas estimadas</Badge>
            <Badge className="bg-purple-600">18-25 dias úteis</Badge>
            <Badge className="bg-orange-600">Enterprise-grade Security</Badge>
          </div>
        </div>

        {/* Summary Alert */}
        <Alert className="mb-8 border-green-200 bg-green-50">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-900">Resumo Executivo</AlertTitle>
          <AlertDescription className="text-green-800">
            Sistema completo de compartilhamento seguro de arquivos confidenciais com SSO Petrobras, autenticação
            Microsoft Entra ID, múltiplas camadas de segurança (Rate Limiting, CSP, Session Hijacking Protection),
            workflow completo de aprovação com cancelamento, autenticação OTP para externos, e captura automática de
            hierarquia organizacional via Graph API.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="visao-geral" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="detalhes">Detalhes Técnicos</TabsTrigger>
            <TabsTrigger value="metricas">Métricas</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="visao-geral" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Funcionalidade 1 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                        <FolderX className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">1. Cancelamento de Compartilhamento</CardTitle>
                        <Badge className="mt-1 bg-red-600">12-16 horas</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Usuário interno pode cancelar compartilhamentos pendentes antes da aprovação
                  </p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>• Novo status "cancelled"</p>
                    <p>• Botão com modal de confirmação</p>
                    <p>• Endpoint PATCH /shares/id/cancel</p>
                    <p>• Campos: cancelled_by, cancellation_date, cancellation_reason</p>
                    <p>• Logs de auditoria completos</p>
                  </div>
                </CardContent>
              </Card>

              {/* Funcionalidade 2 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">2. Menu Meus Compartilhamentos</CardTitle>
                        <Badge className="mt-1 bg-blue-600">8-10 horas</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Nova página exclusiva para visualizar todos os compartilhamentos realizados
                  </p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>• Rota /compartilhamentos</p>
                    <p>• Cards por status (pendente, aprovado, rejeitado, cancelado)</p>
                    <p>• Estatísticas no topo</p>
                    <p>• Botão cancelar apenas para pendentes</p>
                    <p>• Breadcrumb de navegação</p>
                  </div>
                </CardContent>
              </Card>

              {/* Funcionalidade 3 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                        <img src="/images/petrobras-logo.png" alt="Petrobras" className="h-6 w-6 object-contain" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">3. Logo e Título Petrobras</CardTitle>
                        <Badge className="mt-1 bg-green-600">2-3 horas</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">Branding oficial da Petrobras em todo o sistema</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>• Logo oficial no header</p>
                    <p>• Favicon Petrobras no navegador</p>
                    <p>• Título: "Solução de Compartilhamento de Arquivos Confidenciais"</p>
                    <p>• Padronização em todas as páginas</p>
                  </div>
                </CardContent>
              </Card>

              {/* Funcionalidade 4 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                        <Shield className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">4. Microsoft Entra ID (SSO)</CardTitle>
                        <Badge className="mt-1 bg-indigo-600">16-20 horas</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">Autenticação corporativa com Active Directory da Petrobras</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>• Credenciais reais configuradas (AAD-DEV-A12022)</p>
                    <p>• Tenant ID: 5b6f6241-9a57-4be4-8e50-1dfa72e79a57</p>
                    <p>• Botão "Login com Microsoft"</p>
                    <p>• Provider Entra ID integrado</p>
                    <p>• Documentação AWS Secrets Manager</p>
                  </div>
                </CardContent>
              </Card>

              {/* Funcionalidade 5 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                        <Lock className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">5. Proteção de Rotas e SSO Automático</CardTitle>
                        <Badge className="mt-1 bg-purple-600">10-12 horas</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">Segurança e login automático quando já logado no Windows</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>• Componente ProtectedRoute</p>
                    <p>• Proteção /upload e /compartilhamentos</p>
                    <p>• SSO silencioso (sem pedir senha)</p>
                    <p>• Redirecionamento automático</p>
                    <p>• Verificação em tempo real</p>
                  </div>
                </CardContent>
              </Card>

              {/* Funcionalidade 6 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                        <UserCheck className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">6. Validação de Domínio e Timeout</CardTitle>
                        <Badge className="mt-1 bg-yellow-600">14-18 horas</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">Apenas @petrobras.com.br + logout por inatividade</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>• Validação domínio corporativo</p>
                    <p>• Logout automático domínios inválidos</p>
                    <p>• Timeout 30 min inatividade</p>
                    <p>• Renovação automática tokens</p>
                    <p>• Logout sincronizado entre abas</p>
                  </div>
                </CardContent>
              </Card>

              {/* Funcionalidade 7 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                        <Shield className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">7. Rate Limiting</CardTitle>
                        <Badge className="mt-1 bg-red-600">8-10 horas</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">Proteção contra ataques de força bruta</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>• Bloqueio após 5 tentativas em 15 min</p>
                    <p>• Bloqueio de IP por 30 minutos</p>
                    <p>• Logs de tentativas bloqueadas</p>
                    <p>• Mensagens amigáveis ao usuário</p>
                  </div>
                </CardContent>
              </Card>

              {/* Funcionalidade 8 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100">
                        <Code className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">8. Content Security Policy (CSP)</CardTitle>
                        <Badge className="mt-1 bg-cyan-600">6-8 horas</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">Headers HTTP para prevenir XSS e clickjacking</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>• Middleware proxy.ts (Next.js 16)</p>
                    <p>• Headers CSP completos</p>
                    <p>• X-Frame-Options, X-Content-Type-Options</p>
                    <p>• Referrer-Policy, Permissions-Policy</p>
                  </div>
                </CardContent>
              </Card>

              {/* Funcionalidade 9 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
                        <Lock className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">9. Session Hijacking Protection</CardTitle>
                        <Badge className="mt-1 bg-pink-600">12-16 horas</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">Detecta roubo de sessão por fingerprint</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>• Fingerprint do navegador</p>
                    <p>• Validação a cada 30 segundos</p>
                    <p>• Logout se contexto mudar</p>
                    <p>• Binding com dispositivo</p>
                    <p>• Logs de sessões suspeitas</p>
                  </div>
                </CardContent>
              </Card>

              {/* Funcionalidade 10 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                        <UserCheck className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">10. Perfil Enriquecido Graph API</CardTitle>
                        <Badge className="mt-1 bg-teal-600">16-20 horas</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">Dados corporativos do Active Directory automáticos</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>• Microsoft Graph API integrado</p>
                    <p>• Foto corporativa</p>
                    <p>• Cargo, departamento, localização</p>
                    <p>• Dados do supervisor (nome, email, cargo)</p>
                    <p>• Campo automático de aprovador</p>
                  </div>
                </CardContent>
              </Card>

              {/* Funcionalidade 11 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                        <Mail className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">11. Autenticação OTP Externo</CardTitle>
                        <Badge className="mt-1 bg-orange-600">18-24 horas</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">Código 6 dígitos por email com validade 3 minutos</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>• Geração código 6 dígitos</p>
                    <p>• Validade 3 minutos, máx 3 tentativas</p>
                    <p>• Página verificação com timer visual</p>
                    <p>• Template email HTML Petrobras</p>
                    <p>• Integração Resend API</p>
                  </div>
                </CardContent>
              </Card>

              {/* Funcionalidade 12 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                        <Zap className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">12. Fluxo Completo Interno-Externo</CardTitle>
                        <Badge className="mt-1 bg-violet-600">10-12 horas</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">Conexão de ponta a ponta com dados persistidos</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>• Workflow store conectado</p>
                    <p>• Aparece após aprovação</p>
                    <p>• Filtro por email destinatário</p>
                    <p>• Logs de debug</p>
                    <p>• Sincronização em tempo real</p>
                  </div>
                </CardContent>
              </Card>

              {/* Funcionalidade 13 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                        <FileText className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">13. Documentação Wiki-Dev Completa</CardTitle>
                        <Badge className="mt-1 bg-emerald-600">8-12 horas</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">Atualização de todas as páginas com novas funcionalidades</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>• Data Models atualizado</p>
                    <p>• SQL & DynamoDB atualizado</p>
                    <p>• Integração Front-Back atualizado</p>
                    <p>• Microsoft Entra ID com seção segurança</p>
                    <p>• Remoção páginas obsoletas</p>
                  </div>
                </CardContent>
              </Card>

              {/* Funcionalidade 14 */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                        <CheckCircle2 className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">14. Correções e Melhorias UX</CardTitle>
                        <Badge className="mt-1 bg-slate-600">6-8 horas</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600">Ajustes de interface e experiência do usuário</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>• Correção variáveis CSS</p>
                    <p>• Tratamento amigável cancelamento login</p>
                    <p>• Breadcrumb em todas páginas</p>
                    <p>• Mensagens erro contextuais</p>
                    <p>• Loading states, favicon correto</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Detalhes Técnicos */}
          <TabsContent value="detalhes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Arquivos Modificados</CardTitle>
                <CardDescription>Lista completa de todos os arquivos criados e modificados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 font-semibold text-slate-900">Front-end (Next.js)</h4>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>• lib/stores/workflow-store.ts</p>
                      <p>• lib/stores/audit-log-store.ts</p>
                      <p>• lib/stores/auth-store.ts</p>
                      <p>• lib/auth/entra-config.ts</p>
                      <p>• lib/auth/entra-security.ts</p>
                      <p>• lib/auth/rate-limiter.ts</p>
                      <p>• lib/auth/session-binding.ts</p>
                      <p>• lib/auth/graph-api.ts</p>
                      <p>• lib/auth/otp-service.ts</p>
                      <p>• lib/email/templates/otp-email.ts</p>
                      <p>• components/auth/entra-provider.tsx</p>
                      <p>• components/auth/protected-route.tsx</p>
                      <p>• components/auth/login-form.tsx</p>
                      <p>• components/shared/app-header.tsx</p>
                      <p>• components/ui/petrobras-logo.tsx</p>
                      <p>• app/compartilhamentos/page.tsx</p>
                      <p>• app/external-verify/page.tsx</p>
                      <p>• app/upload/page.tsx</p>
                      <p>• app/download/page.tsx</p>
                      <p>• app/historico/page.tsx</p>
                      <p>• app/layout.tsx</p>
                      <p>• app/globals.css</p>
                      <p>• proxy.ts</p>
                      <p>• .env.local.example</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-3 font-semibold text-slate-900">Back-end (Python)</h4>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>• back-end/python/app/api/v1/routes_shares.py</p>
                      <p>• back-end/python/app/models/shared_area.py</p>
                      <p>• back-end/python/app/api/send-otp-email/route.ts</p>
                    </div>
                    <h4 className="mb-3 mt-6 font-semibold text-slate-900">Assets</h4>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>• public/images/petrobras-logo.png</p>
                      <p>• public/favicon.ico</p>
                      <p>• public/icon-light-32x32.png</p>
                      <p>• public/icon-dark-32x32.png</p>
                      <p>• public/apple-icon.png</p>
                    </div>
                    <h4 className="mb-3 mt-6 font-semibold text-slate-900">Documentação</h4>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>• Documentacao/ENTRA-ID-CREDENTIALS.md</p>
                      <p>• Documentacao/IMPLEMENTACOES-04-01-2026.md</p>
                      <p>• app/wiki-dev/* (todas páginas atualizadas)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Arquitetura Final do Sistema</CardTitle>
                <CardDescription>Diagrama completo de como tudo se conecta</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
                  {`┌─────────────────────────────────────────────────────────────────────┐
│                        USUÁRIO INTERNO                              │
│  (Login SSO Microsoft Entra ID - @petrobras.com.br)                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ├─→ Microsoft Graph API (foto, cargo, supervisor)
                              ├─→ Rate Limiting (5 tentativas/15min)
                              ├─→ Session Hijacking Protection
                              ├─→ Domain Validation
                              ├─→ Timeout 30min
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    APP NEXT.JS 16 (Front-end)                       │
│  • ProtectedRoute: /upload, /compartilhamentos                      │
│  • EntraProvider: SSO automático                                    │
│  • CSP Headers via proxy.ts                                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ├─→ Upload arquivo confidencial
                              ├─→ Destinatário externo (email)
                              ├─→ Supervisor automático (Graph API)
                              ├─→ Pode CANCELAR se pending
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          SUPERVISOR                                 │
│  (Login SSO Microsoft - Aprovação/Rejeição)                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                  ┌───────────┴───────────┐
                  │                       │
            [APROVAR]               [REJEITAR]
                  │                       │
                  ▼                       ▼
    ┌─────────────────────────┐  ┌──────────────────┐
    │ Gerar OTP 6 dígitos     │  │ Notificar Interno│
    │ Validade: 3 minutos     │  │ Email + Motivo   │
    │ Enviar email via Resend │  └──────────────────┘
    └─────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      USUÁRIO EXTERNO                                │
│  • Recebe email com código OTP                                      │
│  • Acessa /external-verify                                          │
│  • Insere código (3 tentativas, 3 min)                             │
│  • Acesso à página /download                                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   BANCO DE DADOS (DynamoDB)                         │
│  • Users: perfil + manager info                                     │
│  • Files/Shares: status (pending/approved/rejected/cancelled)       │
│  • AuditLogs: todas ações rastreadas                               │
│  • Sessions: tokens + fingerprint                                   │
│  • OTP: códigos temporários                                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACK-END PYTHON (FastAPI)                        │
│  • PATCH /shares/{id}/cancel                                        │
│  • POST /send-otp-email                                             │
│  • GET /users/profile (Graph API proxy)                             │
│  • Rate limiting no middleware                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS SERVICES                                │
│  • S3: arquivos confidenciais                                       │
│  • DynamoDB: dados estruturados                                     │
│  • Secrets Manager: credenciais Entra ID                            │
│  • SES: emails transacionais                                        │
│  • CloudWatch: logs e métricas                                      │
└─────────────────────────────────────────────────────────────────────┘`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Métricas */}
          <TabsContent value="metricas" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">146-199h</CardTitle>
                  <CardDescription>Tempo total estimado sem IA</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Equivalente a 18-25 dias úteis de trabalho full-time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">14</CardTitle>
                  <CardDescription>Funcionalidades implementadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Da segurança avançada ao fluxo completo de workflow</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">50+</CardTitle>
                  <CardDescription>Arquivos modificados/criados</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Front-end, back-end, documentação e assets</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Tempo por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Segurança (6 funcionalidades)</span>
                      <span className="text-sm text-slate-600">66-82 horas</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full w-[45%] bg-red-500"></div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Workflow e UX (4 funcionalidades)</span>
                      <span className="text-sm text-slate-600">36-46 horas</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full w-[25%] bg-blue-500"></div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Integrações (3 funcionalidades)</span>
                      <span className="text-sm text-slate-600">44-64 horas</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full w-[30%] bg-purple-500"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Próximos Passos Recomendados</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm text-slate-600">
                  <li className="flex gap-3">
                    <span className="font-semibold text-slate-900">1.</span>
                    <span>
                      <strong>Configurar Conditional Access no Azure:</strong> Solicitar ao time de infra para
                      configurar MFA obrigatório e bloqueio de dispositivos não gerenciados
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-slate-900">2.</span>
                    <span>
                      <strong>Deploy na AWS:</strong> Implementar toda infraestrutura AWS descrita na wiki-dev (S3,
                      DynamoDB, Lambda, API Gateway, etc)
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-slate-900">3.</span>
                    <span>
                      <strong>Testes de Segurança:</strong> Realizar penetration testing e audit de segurança antes de
                      produção
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-slate-900">4.</span>
                    <span>
                      <strong>Monitoramento:</strong> Configurar CloudWatch Alarms, SNS notifications e dashboard de
                      métricas
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-slate-900">5.</span>
                    <span>
                      <strong>Treinamento:</strong> Criar guia do usuário final e sessões de treinamento para usuários e
                      supervisores
                    </span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
