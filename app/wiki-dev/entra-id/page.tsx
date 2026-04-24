"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Shield,
  Key,
  Cloud,
  Code,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Lock,
  Server,
  Database,
  ArrowRight,
  Copy,
  Check,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

export default function EntraIdWikiPage() {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStates({ ...copiedStates, [id]: true })
    setTimeout(() => {
      setCopiedStates({ ...copiedStates, [id]: false })
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Wiki
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">Microsoft Entra ID Integration</h1>
          <p className="text-lg text-slate-600">
            Autenticação corporativa com Single Sign-On (SSO) para usuários da Petrobras
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-10 lg:w-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="solicitacao">Solicitação</TabsTrigger>
            <TabsTrigger value="frontend">Front-end</TabsTrigger>
            <TabsTrigger value="backend">Back-end</TabsTrigger>
            <TabsTrigger value="aws">AWS</TabsTrigger>
            <TabsTrigger value="database">DynamoDB</TabsTrigger>
            <TabsTrigger value="seguranca">Segurança</TabsTrigger>
            <TabsTrigger value="dados">Dados Disponíveis</TabsTrigger>
            <TabsTrigger value="teste">Como Testar</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />O que é Microsoft Entra ID?
                </CardTitle>
                <CardDescription>Entenda o sistema de autenticação corporativo da Microsoft</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
                  <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                    Explicação Simples (para leigos)
                  </h3>
                  <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-200">
                    O <strong>Microsoft Entra ID</strong> (antigo Azure Active Directory) é como uma "portaria digital"
                    da Microsoft que gerencia quem pode entrar nos sistemas da empresa. É o mesmo sistema que você usa
                    para fazer login no Windows, Outlook, Teams e outros aplicativos da Microsoft.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-blue-800 dark:text-blue-200">
                    Quando integramos nosso sistema com o Entra ID, os usuários da Petrobras podem fazer login usando
                    suas credenciais corporativas (as mesmas do Windows), sem precisar criar uma nova senha. Isso é
                    chamado de <strong>Single Sign-On (SSO)</strong>.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Benefícios da Integração:</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">Login Automático (SSO)</p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Se já estiver logado no Windows, entra automaticamente
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">Segurança Corporativa</p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          MFA (autenticação em 2 etapas) já configurado
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">Sem Gerenciar Senhas</p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Sistema não armazena ou valida senhas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          Sincronização Automática
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Dados atualizados com AD corporativo
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-purple-500" />
                  Como Funciona o Fluxo de Autenticação?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Usuário clica em "Login com Microsoft"</p>
                      <p className="text-sm text-slate-600">No front-end (Next.js)</p>
                    </div>
                  </div>
                  <ArrowRight className="ml-4 h-5 w-5 text-slate-400" />
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Redireciona para login.microsoftonline.com</p>
                      <p className="text-sm text-slate-600">Tela de login da Microsoft aparece</p>
                    </div>
                  </div>
                  <ArrowRight className="ml-4 h-5 w-5 text-slate-400" />
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Usuário digita credenciais corporativas</p>
                      <p className="text-sm text-slate-600">Email @petrobras.com.br e senha do Windows</p>
                    </div>
                  </div>
                  <ArrowRight className="ml-4 h-5 w-5 text-slate-400" />
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Microsoft valida credenciais e MFA</p>
                      <p className="text-sm text-slate-600">Pode pedir código do celular se MFA ativo</p>
                    </div>
                  </div>
                  <ArrowRight className="ml-4 h-5 w-5 text-slate-400" />
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-600">
                      5
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Retorna Access Token e ID Token</p>
                      <p className="text-sm text-slate-600">Front-end recebe tokens JWT com dados do usuário</p>
                    </div>
                  </div>
                  <ArrowRight className="ml-4 h-5 w-5 text-slate-400" />
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-600">
                      6
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Sistema autentica usuário</p>
                      <p className="text-sm text-slate-600">Dados salvos no DynamoDB e usuário redirecionado</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Solicitacao Tab */}
          <TabsContent value="solicitacao" className="space-y-6">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertTitle>Documento Formal Criado</AlertTitle>
              <AlertDescription>
                Um documento formal de solicitação foi criado em{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">Documentacao/SOLICITACAO-ENTRA-ID.md</code>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  Passo 1: Enviar Solicitação ao Time de Infra
                </CardTitle>
                <CardDescription>O que fazer para conseguir as credenciais do Entra ID</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-950/20">
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                    Você NÃO precisa ter acesso ao Azure Portal
                  </p>
                  <p className="mt-2 text-sm text-orange-800 dark:text-orange-200">
                    Basta enviar o documento formal para o time de infraestrutura e eles farão todo o processo de
                    registro da aplicação no Entra ID.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Quem Contatar:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>Time de Infraestrutura / Cloud</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>Administradores de TI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>Equipe de Segurança da Informação</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>Arquitetos de Soluções</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">O que Solicitar:</h3>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">1. Tenant ID</span>
                        <Badge variant="secondary">UUID</Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        ID do inquilino da Petrobras no Entra ID (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">2. Client ID</span>
                        <Badge variant="secondary">UUID</Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        ID da aplicação criada no Entra ID (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">3. Client Secret</span>
                        <Badge variant="destructive">Sensível</Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        Chave secreta da aplicação (só é exibida UMA VEZ durante criação - anotar!)
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Prazo Estimado</AlertTitle>
                  <AlertDescription>
                    Normalmente o time de infra leva de <strong>3 a 5 dias úteis</strong> para processar a solicitação e
                    fornecer as credenciais.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Frontend Tab */}
          <TabsContent value="frontend" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-500" />
                  Passo 2: Configurar Front-end (Next.js)
                </CardTitle>
                <CardDescription>Como integrar o Entra ID no front-end React/Next.js</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-900 dark:text-green-100">Implementação Completa</AlertTitle>
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <p className="mb-2">O Entra ID já está totalmente implementado no sistema:</p>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      <li>SSO automático (login sem senha se já estiver logado no Windows)</li>
                      <li>Proteção de rotas /upload e /compartilhamentos</li>
                      <li>Componente ProtectedRoute criado</li>
                      <li>Integração com auth-store para sincronizar dados</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">1. Arquivos Já Implementados</h3>
                  <div className="space-y-2">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                      <div className="flex items-center justify-between">
                        <code className="text-sm text-green-900 dark:text-green-100">lib/auth/entra-config.ts</code>
                        <Badge className="bg-green-600">Configurado</Badge>
                      </div>
                      <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                        Configuração MSAL com credenciais da Petrobras
                      </p>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                      <div className="flex items-center justify-between">
                        <code className="text-sm text-green-900 dark:text-green-100">
                          components/auth/entra-provider.tsx
                        </code>
                        <Badge className="bg-green-600">Integrado</Badge>
                      </div>
                      <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                        Provider MSAL integrado ao app/layout.tsx
                      </p>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                      <div className="flex items-center justify-between">
                        <code className="text-sm text-green-900 dark:text-green-100">
                          components/auth/protected-route.tsx
                        </code>
                        <Badge className="bg-blue-600">Novo</Badge>
                      </div>
                      <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                        Componente de proteção de rotas com SSO automático
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">2. Como Funciona o SSO Automático</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Detecção de Sessão</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Quando usuário acessa /upload, o ProtectedRoute verifica se há token Entra ID ativo
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Login Silencioso</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Se usuário está logado no Windows/Office, tenta ssoSilent() para login automático
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Sincronização</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Dados do Microsoft (nome, email, foto) são sincronizados com auth-store automaticamente
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">3. Rotas Protegidas</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-600" />
                      <code className="rounded bg-slate-100 px-2 py-0.5">/upload</code>
                      <span className="text-slate-600">- Apenas usuários internos autenticados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-600" />
                      <code className="rounded bg-slate-100 px-2 py-0.5">/compartilhamentos</code>
                      <span className="text-slate-600">- Apenas usuários internos autenticados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <code className="rounded bg-slate-100 px-2 py-0.5">/download</code>
                      <span className="text-slate-600">- Acesso público (externos)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">4. Instalar Bibliotecas MSAL (se necessário)</h3>
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-50">
                      <code>npm install @azure/msal-browser @azure/msal-react</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-2 top-2"
                      onClick={() =>
                        copyToClipboard("npm install @azure/msal-browser @azure/msal-react", "npm-install")
                      }
                    >
                      {copiedStates["npm-install"] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    <strong>MSAL</strong> = Microsoft Authentication Library - biblioteca oficial da Microsoft
                  </p>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">5. Configurar Variáveis de Ambiente</h3>
                  <p className="mb-2 text-sm text-slate-600">
                    Adicione as seguintes variáveis ao arquivo{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5">.env.local</code>:
                  </p>
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertTitle>Variáveis Necessárias</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>
                          <code>NEXT_PUBLIC_ENTRA_TENANT_ID</code> - ID do inquilino
                        </li>
                        <li>
                          <code>NEXT_PUBLIC_ENTRA_CLIENT_ID</code> - ID da aplicação
                        </li>
                        <li>Client Secret - Chave secreta (configurar apenas no servidor)</li>
                        <li>
                          <code>NEXT_PUBLIC_REDIRECT_URI</code> - URL de redirecionamento
                        </li>
                      </ul>
                      <p className="mt-2 text-sm">
                        As credenciais reais serão fornecidas pelo time de infra da Petrobras.
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Pronto para Uso!</AlertTitle>
                  <AlertDescription>
                    Assim que você receber as credenciais do time de infra e adicionar no .env.local, o botão "Login com
                    Microsoft" aparecerá automaticamente na tela de login.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backend Tab */}
          <TabsContent value="backend" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-green-500" />
                  Passo 3: Integrar Back-end Python (FastAPI)
                </CardTitle>
                <CardDescription>Como validar tokens do Entra ID no back-end</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Por que validar no back-end?</p>
                  <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                    Mesmo que o front-end receba tokens do Entra ID, precisamos validar esses tokens no back-end para
                    garantir que são autênticos e não foram falsificados. Isso garante segurança total.
                  </p>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">1. Instalar Biblioteca MSAL Python</h3>
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-50">
                      <code>pip install msal PyJWT cryptography</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-2 top-2"
                      onClick={() => copyToClipboard("pip install msal PyJWT cryptography", "pip-install")}
                    >
                      {copiedStates["pip-install"] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">2. Criar Validador de Token</h3>
                  <p className="mb-2 text-sm text-slate-600">
                    Arquivo:{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5">back-end/python/auth/entra_validator.py</code>
                  </p>
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-50">
                      <code>{`import jwt
from jwt import PyJWKClient
import os

TENANT_ID = os.getenv("ENTRA_TENANT_ID")
CLIENT_ID = os.getenv("ENTRA_CLIENT_ID")

def validate_entra_token(token: str) -> dict:
    """Valida token JWT do Entra ID"""
    
    # URL das chaves públicas Microsoft
    jwks_url = f"https://login.microsoftonline.com/{TENANT_ID}/discovery/v2.0/keys"
    
    # Cliente para buscar chaves
    jwks_client = PyJWKClient(jwks_url)
    
    # Decodificar e validar token
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    
    payload = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        audience=CLIENT_ID,
        issuer=f"https://login.microsoftonline.com/{TENANT_ID}/v2.0"
    )
    
    return {
        "user_id": payload.get("oid"),  # Object ID do usuário
        "email": payload.get("email") or payload.get("preferred_username"),
        "name": payload.get("name"),
        "tenant_id": payload.get("tid")
    }`}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">3. Usar no Endpoint FastAPI</h3>
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-50">
                      <code>{`from fastapi import FastAPI, Header, HTTPException
from auth.entra_validator import validate_entra_token

app = FastAPI()

@app.post("/api/upload")
async def create_upload(
    authorization: str = Header(None)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token não fornecido")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Validar token do Entra ID
        user_data = validate_entra_token(token)
        
        # Usuário autenticado!
        # Continuar com lógica do upload...
        
        return {
            "message": "Upload criado",
            "user": user_data
        }
    except Exception as e:
        raise HTTPException(401, f"Token inválido: {str(e)}")`}</code>
                    </pre>
                  </div>
                </div>

                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertTitle>Segurança Garantida</AlertTitle>
                  <AlertDescription>
                    Com essa validação, mesmo se alguém tentar falsificar um token, o back-end vai detectar e bloquear o
                    acesso.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AWS Tab */}
          <TabsContent value="aws" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-orange-500" />
                  Passo 4: Configurar AWS Secrets Manager
                </CardTitle>
                <CardDescription>Onde armazenar as credenciais do Entra ID com segurança</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-900 dark:text-green-100">Credenciais Configuradas</AlertTitle>
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <p className="mb-2">As credenciais do Entra ID da Petrobras já foram fornecidas:</p>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      <li>
                        Aplicação: <strong></strong>
                      </li>
                      <li>
                        Tenant ID:{" "}
                        <code className="rounded bg-green-100 px-1 py-0.5 dark:bg-green-900">
                          
                        </code>
                      </li>
                      <li>
                        Client ID:{" "}
                        <code className="rounded bg-green-100 px-1 py-0.5 dark:bg-green-900">
                          
                        </code>
                      </li>
                      <li>
                        Client Secret:{" "}
                        <code className="rounded bg-green-100 px-1 py-0.5 dark:bg-green-900">Pnt8Q~0CQeLtKfv2T...</code>
                      </li>
                    </ul>
                    <p className="mt-2 font-semibold">
                      ⚠️ ATENÇÃO: Salvar no AWS Secrets Manager antes de ir para produção!
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-950/20">
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                    Por que usar Secrets Manager?
                  </p>
                  <p className="mt-2 text-sm text-orange-800 dark:text-orange-200">
                    As credenciais do Entra ID (Client ID, Client Secret, Tenant ID) são sensíveis e NÃO devem estar em
                    arquivos .env no código. O AWS Secrets Manager armazena essas credenciais de forma segura e
                    criptografada.
                  </p>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">1. Criar Secret no AWS Console</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-900">a)</span>
                      <span>Acesse AWS Console → Secrets Manager</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-900">b)</span>
                      <span>Clique em "Store a new secret"</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-900">c)</span>
                      <span>Selecione "Other type of secret"</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-900">d)</span>
                      <span>Adicione os pares chave-valor (usar as credenciais reais acima):</span>
                    </div>
                  </div>
                  <div className="relative mt-3">
                    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-50">
                      <code>{`{
  "ENTRA_TENANT_ID": "seu-tenant-id",
  "ENTRA_CLIENT_ID": "seu-client-id",
  "ENTRA_CLIENT_SECRET": "seu-client-secret",
  "ENTRA_APP_NAME": "seu-app-name"
}`}</code>
                    </pre>
                  </div>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-900">e)</span>
                      <span>
                        Nome do secret:{" "}
                        <code className="rounded bg-slate-100 px-1 py-0.5">petrobras/entra-id-credentials</code>
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-900">f)</span>
                      <span>Clique em "Next" até finalizar</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">2. Buscar Credenciais no Python</h3>
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-50">
                      <code>{`import boto3
import json

def get_entra_credentials():
    """Busca credenciais do Entra ID no Secrets Manager"""
    
    client = boto3.client('secretsmanager', region_name='us-east-1')
    
    response = client.get_secret_value(
        SecretId='petrobras/entra-id-credentials'
    )
    
    secrets = json.loads(response['SecretString'])
    
    return {
        'tenant_id': secrets['ENTRA_TENANT_ID'],
        'client_id': secrets['ENTRA_CLIENT_ID'],
        'client_secret': secrets['ENTRA_CLIENT_SECRET']
    }

# Usar nas variáveis de ambiente
credentials = get_entra_credentials()
os.environ['ENTRA_TENANT_ID'] = credentials['tenant_id']`}</code>
                    </pre>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Segurança Total</AlertTitle>
                  <AlertDescription>
                    Com Secrets Manager, as credenciais ficam criptografadas e apenas aplicações autorizadas (via IAM)
                    podem acessá-las.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-500" />
                  Passo 5: Armazenar Usuários no DynamoDB
                </CardTitle>
                <CardDescription>Como sincronizar dados do Entra ID com o banco de dados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-950/20">
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Por que armazenar no DynamoDB?
                  </p>
                  <p className="mt-2 text-sm text-purple-800 dark:text-purple-200">
                    Precisamos salvar informações do usuário autenticado (nome, email, tipo) no DynamoDB para usar em
                    outras partes do sistema (auditoria, uploads, downloads).
                  </p>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">Estrutura da Tabela users (já existe)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="p-2 text-left font-semibold">Campo</th>
                          <th className="p-2 text-left font-semibold">Tipo</th>
                          <th className="p-2 text-left font-semibold">Descrição</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-2">
                            <code className="rounded bg-slate-100 px-1 py-0.5">user_id</code>
                          </td>
                          <td className="p-2">String (PK)</td>
                          <td className="p-2">Object ID do Entra ID</td>
                        </tr>
                        <tr>
                          <td className="p-2">
                            <code className="rounded bg-slate-100 px-1 py-0.5">email</code>
                          </td>
                          <td className="p-2">String</td>
                          <td className="p-2">Email corporativo @petrobras</td>
                        </tr>
                        <tr>
                          <td className="p-2">
                            <code className="rounded bg-slate-100 px-1 py-0.5">name</code>
                          </td>
                          <td className="p-2">String</td>
                          <td className="p-2">Nome completo do usuário</td>
                        </tr>
                        <tr>
                          <td className="p-2">
                            <code className="rounded bg-slate-100 px-1 py-0.5">user_type</code>
                          </td>
                          <td className="p-2">String</td>
                          <td className="p-2">internal / supervisor / external</td>
                        </tr>
                        <tr>
                          <td className="p-2">
                            <code className="rounded bg-slate-100 px-1 py-0.5">auth_provider</code>
                          </td>
                          <td className="p-2">String</td>
                          <td className="p-2">"entra-id" ou "demo"</td>
                        </tr>
                        <tr>
                          <td className="p-2">
                            <code className="rounded bg-slate-100 px-1 py-0.5">last_login</code>
                          </td>
                          <td className="p-2">String (ISO)</td>
                          <td className="p-2">Data/hora do último login</td>
                        </tr>
                        <tr>
                          <td className="p-2">
                            <code className="rounded bg-slate-100 px-1 py-0.5">created_at</code>
                          </td>
                          <td className="p-2">String (ISO)</td>
                          <td className="p-2">Data/hora de criação</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">Código Python para Salvar Usuário</h3>
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-50">
                      <code>{`import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
users_table = dynamodb.Table('users')

def save_entra_user(user_data: dict):
    """Salva ou atualiza usuário do Entra ID no DynamoDB"""
    
    # Determinar tipo de usuário
    email = user_data['email']
    user_type = 'internal' if '@petrobras' in email else 'external'
    
    # Supervisores específicos
    if email in ['wagner.brazil@petrobras.com.br']:
        user_type = 'supervisor'
    
    now = datetime.utcnow().isoformat()
    
    users_table.put_item(
        Item={
            'user_id': user_data['user_id'],  # Object ID do Entra ID
            'email': email,
            'name': user_data['name'],
            'user_type': user_type,
            'auth_provider': 'entra-id',
            'last_login': now,
            'created_at': now
        }
    )
    
    return {
        'user_id': user_data['user_id'],
        'email': email,
        'name': user_data['name'],
        'user_type': user_type
    }`}</code>
                    </pre>
                  </div>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Sincronização Automática</AlertTitle>
                  <AlertDescription>
                    Toda vez que um usuário fizer login via Entra ID, suas informações serão automaticamente salvas ou
                    atualizadas no DynamoDB.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segurança Tab */}
          <TabsContent value="seguranca" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-500" />
                  Camada de Segurança Avançada
                </CardTitle>
                <CardDescription>Proteções e validações de segurança implementadas no SSO</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900">Todas as Proteções Implementadas</AlertTitle>
                  <AlertDescription className="text-green-800">
                    O sistema possui camada completa de segurança conforme melhores práticas
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">1. Validação de Domínio</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="bg-green-600">Implementado</Badge>
                      <code className="text-sm">entra-security.ts</code>
                    </div>
                    <p className="mb-3 text-sm text-slate-700">
                      <strong>O QUÊ:</strong> Apenas emails @petrobras.com.br podem fazer login
                    </p>
                    <p className="mb-3 text-sm text-slate-700">
                      <strong>POR QUÊ:</strong> Prevenir acesso não autorizado de contas externas
                    </p>
                    <p className="text-sm text-slate-700">
                      <strong>COMO:</strong> Função <code>validateEmailDomain()</code> verifica domínio após login. Se
                      domínio inválido, faz logout automático e registra tentativa nos logs de auditoria.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">2. Timeout de Sessão por Inatividade</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="bg-green-600">Implementado</Badge>
                      <code className="text-sm">SessionMonitor</code>
                    </div>
                    <p className="mb-3 text-sm text-slate-700">
                      <strong>O QUÊ:</strong> Logout automático após 30 minutos de inatividade
                    </p>
                    <p className="mb-3 text-sm text-slate-700">
                      <strong>POR QUÊ:</strong> Prevenir acesso não autorizado se usuário deixar sessão aberta
                    </p>
                    <p className="text-sm text-slate-700">
                      <strong>COMO:</strong> Monitor detecta eventos (mouse, teclado, scroll). Sem atividade por 30min =
                      logout automático com registro em auditoria.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">3. Renovação Automática de Token</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="bg-green-600">Implementado</Badge>
                      <code className="text-sm">refreshToken()</code>
                    </div>
                    <p className="mb-3 text-sm text-slate-700">
                      <strong>O QUÊ:</strong> Tokens renovados automaticamente antes de expirar
                    </p>
                    <p className="mb-3 text-sm text-slate-700">
                      <strong>POR QUÊ:</strong> Manter sessão ativa sem interromper usuário com tela de login
                    </p>
                    <p className="text-sm text-slate-700">
                      <strong>COMO:</strong> Monitor verifica tokens a cada 1 minuto. Se token expira em menos de 5min,
                      chama <code>acquireTokenSilent()</code> para renovar sem popup.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">4. Validação de Expiração de Token</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="bg-green-600">Implementado</Badge>
                      <code className="text-sm">isTokenValid()</code>
                    </div>
                    <p className="mb-3 text-sm text-slate-700">
                      <strong>O QUÊ:</strong> Verificação constante se token ainda é válido
                    </p>
                    <p className="mb-3 text-sm text-slate-700">
                      <strong>POR QUÊ:</strong> Prevenir uso de tokens expirados que podem ser comprometidos
                    </p>
                    <p className="text-sm text-slate-700">
                      <strong>COMO:</strong> Compara timestamp de expiração com horário atual. Token expirado = logout
                      automático com log de auditoria.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">5. Logout Sincronizado (Cross-Tab)</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="bg-green-600">Implementado</Badge>
                      <code className="text-sm">setupCrossTabLogout()</code>
                    </div>
                    <p className="mb-3 text-sm text-slate-700">
                      <strong>O QUÊ:</strong> Logout em uma aba desloga todas as outras abas abertas
                    </p>
                    <p className="mb-3 text-sm text-slate-700">
                      <strong>POR QUÊ:</strong> Prevenir sessões residuais em múltiplas abas após logout
                    </p>
                    <p className="text-sm text-slate-700">
                      <strong>COMO:</strong> Usa localStorage para comunicação entre abas. Ao fazer logout, envia sinal
                      para todas as abas via storage event.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">6. Auditoria Completa</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="bg-green-600">Implementado</Badge>
                      <code className="text-sm">audit-log-store.ts</code>
                    </div>
                    <p className="mb-3 text-sm text-slate-700">
                      <strong>O QUÊ:</strong> Todos os eventos de segurança são registrados
                    </p>
                    <p className="mb-3 text-sm text-slate-700">
                      <strong>POR QUÊ:</strong> Rastreabilidade e conformidade com políticas de segurança
                    </p>
                    <p className="text-sm text-slate-700">
                      <strong>EVENTOS REGISTRADOS:</strong>
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      <li>• Login bem-sucedido (com tenant ID e método)</li>
                      <li>• Tentativas de login com domínio inválido</li>
                      <li>• Logout por inatividade (com tempo de inatividade)</li>
                      <li>• Logout por expiração de token</li>
                      <li>• Erros de autenticação</li>
                      <li>• Renovação de tokens</li>
                    </ul>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900">Configurações Ajustáveis</AlertTitle>
                  <AlertDescription className="text-blue-800">
                    <p className="mb-2">
                      As seguintes configurações podem ser ajustadas em <code>entra-security.ts</code>:
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      <li>
                        <code>SESSION_TIMEOUT</code> - Tempo de inatividade (padrão: 30min)
                      </li>
                      <li>
                        <code>TOKEN_CHECK_INTERVAL</code> - Frequência de verificação (padrão: 1min)
                      </li>
                      <li>
                        <code>ALLOWED_DOMAINS</code> - Domínios permitidos (padrão: @petrobras.com.br)
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teste" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Como Testar o Entra ID
                </CardTitle>
                <CardDescription>
                  Guia passo a passo para testar assim que receber as credenciais do time de infra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Tudo está pronto!</AlertTitle>
                  <AlertDescription>
                    O código está 100% configurado e funcionando. Você só precisa adicionar as 3 variáveis de ambiente.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Passo 1: Receba as Credenciais</h3>
                  <p className="text-sm text-muted-foreground">
                    O time de infra da Petrobras vai te enviar um email com 3 informações:
                  </p>
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline">1</Badge>
                      <div>
                        <p className="font-medium">Tenant ID</p>
                        <p className="text-sm text-muted-foreground">
                          ID do inquilino da Petrobras (ex: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline">2</Badge>
                      <div>
                        <p className="font-medium">Client ID (Application ID)</p>
                        <p className="text-sm text-muted-foreground">
                          ID da aplicação criada (ex: 98765fedc-ba09-8765-4321-0fedcba98765)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline">3</Badge>
                      <div>
                        <p className="font-medium">Client Secret</p>
                        <p className="text-sm text-muted-foreground">
                          Chave secreta (ex: AbC~1dEf2GhI3jKl4MnO5pQr6StU7vWx8YzA9bCd0)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Passo 2: Configure as Variáveis de Ambiente</h3>
                  <ol className="space-y-3 list-decimal list-inside">
                    <li className="text-sm">
                      Acesse a seção de <strong>Variáveis de Ambiente</strong> do projeto
                    </li>
                    <li className="text-sm">Adicione as 3 variáveis necessárias para autenticação:</li>
                  </ol>

                  <div className="space-y-3 ml-6">
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-mono">NEXT_PUBLIC_ENTRA_TENANT_ID</code>
                      </div>
                      <p className="text-xs text-muted-foreground">Cole o Tenant ID que você recebeu</p>
                    </div>

                    <div className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-mono">NEXT_PUBLIC_ENTRA_CLIENT_ID</code>
                      </div>
                      <p className="text-xs text-muted-foreground">Cole o Client ID que você recebeu</p>
                    </div>

                    <div className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-2">Client Secret</div>
                      <p className="text-xs text-muted-foreground">
                        Cole o Client Secret fornecido (apenas no servidor)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Passo 3: Teste o Login</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge className="mt-1">1</Badge>
                      <div className="flex-1">
                        <p className="font-medium">Abra a página de login</p>
                        <p className="text-sm text-muted-foreground">Acesse a URL do seu sistema</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Badge className="mt-1">2</Badge>
                      <div className="flex-1">
                        <p className="font-medium">Clique no botão azul da Microsoft</p>
                        <p className="text-sm text-muted-foreground">
                          Você verá um botão escrito Entrar com Microsoft com o logo da Microsoft
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Badge className="mt-1">3</Badge>
                      <div className="flex-1">
                        <p className="font-medium">Faça login com sua conta Petrobras</p>
                        <p className="text-sm text-muted-foreground">
                          Use seu email @petrobras.com.br e senha corporativa
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Badge className="mt-1">4</Badge>
                      <div className="flex-1">
                        <p className="font-medium">Autorize o aplicativo</p>
                        <p className="text-sm text-muted-foreground">
                          A Microsoft vai pedir para você autorizar o acesso (apenas na primeira vez)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Badge className="mt-1">5</Badge>
                      <div className="flex-1">
                        <p className="font-medium">Pronto!</p>
                        <p className="text-sm text-muted-foreground">
                          Você será redirecionado para o dashboard e estará logado automaticamente
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Checklist de Testes Completo</h3>
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Botão Microsoft aparece na tela de login</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Clique no botão abre popup de login Microsoft</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Login com email @petrobras.com.br funciona</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Após login, redireciona para dashboard correto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Nome e email do usuário aparecem no header</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Sistema detecta se é supervisor ou usuário interno</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Logout funciona e limpa sessão</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Login é registrado na auditoria</span>
                    </div>
                  </div>
                </div>

                <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle>Problemas comuns e soluções</AlertTitle>
                  <AlertDescription className="space-y-2 mt-2">
                    <div>
                      <p className="font-medium">Erro: redirect_uri mismatch</p>
                      <p className="text-sm">
                        Solução: Peça ao time de infra para adicionar sua URL exata nas configurações do Azure
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Erro: AADSTS50105 (usuário não atribuído)</p>
                      <p className="text-sm">
                        Solução: Peça ao time de infra para adicionar você como usuário autorizado no aplicativo
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Popup bloqueado</p>
                      <p className="text-sm">Solução: Permita popups para este site nas configurações do navegador</p>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4 dark:bg-green-950/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        Tempo estimado de teste: 5 minutos
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Após adicionar as variáveis de ambiente, todo o sistema funcionará automaticamente com login
                        Microsoft corporativo da Petrobras.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Checklist Completo de Implementação
                </CardTitle>
                <CardDescription>Siga estes passos para implementar o Entra ID do zero</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-100">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                        1
                      </span>
                      Solicitação ao Time de Infra (Prazo: 3-5 dias)
                    </h3>
                    <div className="space-y-2 pl-8">
                      <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Enviar documento Documentacao/SOLICITACAO-ENTRA-ID.md para time de infra</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Aguardar retorno com Tenant ID, Client ID e Client Secret</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Confirmar que URLs de redirect foram configuradas</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/20">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-purple-900 dark:text-purple-100">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs text-white">
                        2
                      </span>
                      Configuração Front-end (Prazo: 30 minutos)
                    </h3>
                    <div className="space-y-2 pl-8">
                      <div className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Instalar bibliotecas: npm install @azure/msal-browser @azure/msal-react</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Adicionar credenciais no .env.local</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Verificar se arquivos já estão criados (entra-config.ts, entra-provider.tsx)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Testar login com botão "Login com Microsoft"</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-green-900 dark:text-green-100">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                        3
                      </span>
                      Configuração Back-end Python (Prazo: 1 hora)
                    </h3>
                    <div className="space-y-2 pl-8">
                      <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Instalar bibliotecas: pip install msal PyJWT cryptography</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Criar arquivo auth/entra_validator.py</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Adicionar validação de token nos endpoints</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Testar validação com token real</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/20">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-orange-900 dark:text-orange-100">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-xs text-white">
                        4
                      </span>
                      Configuração AWS (Prazo: 30 minutos)
                    </h3>
                    <div className="space-y-2 pl-8">
                      <div className="flex items-center gap-2 text-sm text-orange-800 dark:text-orange-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Criar secret no Secrets Manager: petrobras/entra-id-credentials</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-orange-800 dark:text-orange-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Configurar IAM role para Lambda acessar Secrets Manager</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-orange-800 dark:text-orange-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Atualizar funções Lambda para buscar credenciais do Secrets Manager</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-red-900 dark:text-red-100">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                        5
                      </span>
                      Configuração DynamoDB (Prazo: 30 minutos)
                    </h3>
                    <div className="space-y-2 pl-8">
                      <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Verificar se tabela users já existe (já deve existir)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Adicionar campo auth_provider na tabela users</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Criar função save_entra_user() no back-end</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Testar salvamento de usuário após login</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-600 text-xs text-white">
                        6
                      </span>
                      Testes Finais (Prazo: 1 hora)
                    </h3>
                    <div className="space-y-2 pl-8">
                      <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Teste 1: Login com usuário @petrobras.com.br</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Teste 2: Validação de token no back-end</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Teste 3: Salvar usuário no DynamoDB</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Teste 4: Fazer upload de arquivo após login Entra ID</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                        <input type="checkbox" className="h-4 w-4" />
                        <span>Teste 5: Logout e novo login</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dados" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados Disponíveis do Microsoft Entra ID</CardTitle>
                <CardDescription>
                  Todos os dados que você pode obter através do Microsoft Graph API após autenticação, com exemplos em
                  React e Python
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Tabela de Dados Básicos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Dados Básicos do Usuário (User.Read)</h3>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Campo</th>
                          <th className="px-4 py-3 text-left font-medium">Tipo</th>
                          <th className="px-4 py-3 text-left font-medium">Descrição</th>
                          <th className="px-4 py-3 text-left font-medium">Exemplo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">id</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">ID único do usuário no Azure AD</td>
                          <td className="px-4 py-3 font-mono text-xs">12345678-abcd-...</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">displayName</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">Nome completo para exibição</td>
                          <td className="px-4 py-3">Kleber Gonçalves</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">mail</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">Email corporativo</td>
                          <td className="px-4 py-3">kleber.goncalves@petrobras.com.br</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">userPrincipalName</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">Nome principal do usuário (login)</td>
                          <td className="px-4 py-3">kleber.goncalves@petrobras.com.br</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">jobTitle</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">Cargo/função do usuário</td>
                          <td className="px-4 py-3">Desenvolvedor Sênior</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">department</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">Departamento/área</td>
                          <td className="px-4 py-3">Tecnologia da Informação</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">officeLocation</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">Localização do escritório</td>
                          <td className="px-4 py-3">Rio de Janeiro - RJ</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">mobilePhone</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">Telefone celular</td>
                          <td className="px-4 py-3">+55 21 98765-4321</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">businessPhones</td>
                          <td className="px-4 py-3">string[]</td>
                          <td className="px-4 py-3">Telefones comerciais</td>
                          <td className="px-4 py-3 font-mono text-xs">["21 3456-7890"]</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">preferredLanguage</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">Idioma preferido</td>
                          <td className="px-4 py-3">pt-BR</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">employeeId</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">Matrícula do funcionário</td>
                          <td className="px-4 py-3">123456</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">companyName</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">Nome da empresa</td>
                          <td className="px-4 py-3">Petrobras</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dados do Supervisor */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Dados do Supervisor (User.Read)</h3>
                  <p className="text-sm text-muted-foreground">Endpoint: GET /me/manager</p>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Campo</th>
                          <th className="px-4 py-3 text-left font-medium">Tipo</th>
                          <th className="px-4 py-3 text-left font-medium">Descrição</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">id</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">ID do supervisor</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">displayName</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">Nome completo do supervisor</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">mail</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">Email do supervisor</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">jobTitle</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">Cargo do supervisor</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">department</td>
                          <td className="px-4 py-3">string</td>
                          <td className="px-4 py-3">Departamento do supervisor</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Foto do Perfil */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Foto do Perfil (User.Read)</h3>
                  <p className="text-sm text-muted-foreground">Endpoint: GET /me/photo/$value</p>
                  <p className="text-sm">
                    Retorna a foto do perfil como blob binário (JPEG/PNG). Converta para URL usando
                    URL.createObjectURL().
                  </p>
                </div>

                {/* Exemplos em React */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Como Usar em React/TypeScript</h3>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">1. Buscar Perfil Completo</h4>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      {`import { getUserProfile } from '@/lib/auth/graph-api'

// Dentro de um componente React
const [userProfile, setUserProfile] = useState(null)

useEffect(() => {
  async function loadProfile() {
    const profile = await getUserProfile()
    if (profile) {
      setUserProfile(profile)
      // console.log('Nome:', profile.displayName)
      // console.log('Email:', profile.mail)
      // console.log('Cargo:', profile.jobTitle)
      // console.log('Departamento:', profile.department)
      // console.log('Telefone:', profile.mobilePhone)
    }
  }
  loadProfile()
}, [])

// Exibir dados
<div>
  <p>Nome: {userProfile?.displayName}</p>
  <p>Cargo: {userProfile?.jobTitle}</p>
  <p>Departamento: {userProfile?.department}</p>
</div>`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">2. Buscar Supervisor</h4>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      {`import { getUserManager } from '@/lib/auth/graph-api'

const [manager, setManager] = useState(null)

useEffect(() => {
  async function loadManager() {
    const managerData = await getUserManager()
    // if (managerData) {
    //   setManager(managerData)
    //   // console.log('Supervisor:', managerData.displayName)
    //   // console.log('Email do supervisor:', managerData.mail)
    // } else {
    //   // console.log('Usuário não possui supervisor configurado')
    // }
  }
  loadManager()
}, [])

// Exibir supervisor
{manager && (
  <div>
    <p>Supervisor: {manager.displayName}</p>
    <p>Email: {manager.mail}</p>
  </div>
)}`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">3. Buscar Foto do Perfil</h4>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      {`import { getUserPhoto } from '@/lib/auth/graph-api'

const [photoUrl, setPhotoUrl] = useState(null)

useEffect(() => {
  async function loadPhoto() {
    const photo = await getUserPhoto()
    if (photo) {
      setPhotoUrl(photo)
    }
  }
  loadPhoto()
}, [])

// Exibir foto
{photoUrl ? (
  <img src={photoUrl || "/placeholder.svg"} alt="Foto do perfil" className="w-10 h-10 rounded-full" />
) : (
  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
    <UserIcon />
  </div>
)}`}
                    </pre>
                  </div>
                </div>

                {/* Exemplos em Python */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Como Usar em Python (Backend/Lambda)</h3>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">1. Validar Token e Buscar Dados do Usuário</h4>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      {`import requests
import jwt
from jwt import PyJWKClient

# Configurações do Entra ID
TENANT_ID = ""
CLIENT_ID = ""
GRAPH_API_URL = "https://graph.microsoft.com/v1.0"

def validate_token(access_token):
    """Valida o token JWT do Entra ID"""
    try:
        # Buscar chaves públicas do Azure AD
        jwks_url = f"https://login.microsoftonline.com/{TENANT_ID}/discovery/v2.0/keys"
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(access_token)
        
        # Decodificar e validar token
        decoded_token = jwt.decode(
            access_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=CLIENT_ID,
            issuer=f"https://login.microsoftonline.com/{TENANT_ID}/v2.0"
        )
        return decoded_token
    except Exception as e:
        print(f"Erro ao validar token: {e}")
        return None

def get_user_profile(access_token):
    """Busca perfil completo do usuário"""
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{GRAPH_API_URL}/me", headers=headers)
    
    if response.status_code == 200:
        profile = response.json()
        return {
            "id": profile.get("id"),
            "name": profile.get("displayName"),
            "email": profile.get("mail"),
            "job_title": profile.get("jobTitle"),
            "department": profile.get("department"),
            "office": profile.get("officeLocation"),
            "mobile": profile.get("mobilePhone"),
            "employee_id": profile.get("employeeId"),
            "company": profile.get("companyName")
        }
    return None`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">2. Buscar Supervisor</h4>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      {`def get_user_manager(access_token):
    """Busca informações do supervisor"""
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{GRAPH_API_URL}/me/manager", headers=headers)
    
    if response.status_code == 200:
        manager = response.json()
        return {
            "id": manager.get("id"),
            "name": manager.get("displayName"),
            "email": manager.get("mail"),
            "job_title": manager.get("jobTitle")
        }
    elif response.status_code == 404:
        print("Usuário não possui supervisor configurado")
        return None
    return None`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">3. Buscar Foto do Perfil</h4>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      {`import base64

def get_user_photo(access_token):
    """Busca foto do perfil como base64"""
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{GRAPH_API_URL}/me/photo/$value", headers=headers)
    
    if response.status_code == 200:
        # Converter para base64 para armazenar ou enviar
        photo_base64 = base64.b64encode(response.content).decode('utf-8')
        return f"data:image/jpeg;base64,{photo_base64}"
    return None`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">4. Exemplo Completo em Lambda AWS</h4>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      {`def lambda_handler(event, context):
    """Handler principal da Lambda"""
    try:
        # Token recebido no header Authorization
        auth_header = event['headers'].get('Authorization', '')
        access_token = auth_header.replace('Bearer ', '')
        
        # Validar token
        decoded = validate_token(access_token)
        if not decoded:
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Token inválido'})
            }
        
        # Buscar dados do usuário
        profile = get_user_profile(access_token)
        manager = get_user_manager(access_token)
        photo = get_user_photo(access_token)
        
        # Retornar todos os dados
        return {
            'statusCode': 200,
            'body': json.dumps({
                'user': profile,
                'manager': manager,
                'photo': photo
            })
        }`}
                    </pre>
                  </div>
                </div>

                {/* Permissões Necessárias */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Permissões Necessárias no Azure AD</h3>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Permissão</th>
                          <th className="px-4 py-3 text-left font-medium">Tipo</th>
                          <th className="px-4 py-3 text-left font-medium">O que permite</th>
                          <th className="px-4 py-3 text-left font-medium">Admin Consent?</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">User.Read</td>
                          <td className="px-4 py-3">Delegated</td>
                          <td className="px-4 py-3">Ler perfil do próprio usuário, supervisor e foto</td>
                          <td className="px-4 py-3 text-green-600">Não</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">User.ReadBasic.All</td>
                          <td className="px-4 py-3">Delegated</td>
                          <td className="px-4 py-3">Ler perfil básico de outros usuários</td>
                          <td className="px-4 py-3 text-amber-600">Sim</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs">User.Read.All</td>
                          <td className="px-4 py-3">Application</td>
                          <td className="px-4 py-3">Ler perfil completo de qualquer usuário (backend)</td>
                          <td className="px-4 py-3 text-amber-600">Sim</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Para esta aplicação, a permissão <strong>User.Read</strong> é suficiente para buscar perfil,
                    supervisor e foto do usuário logado.
                  </p>
                </div>

                {/* Troubleshooting */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Troubleshooting</h3>
                  <div className="space-y-3">
                    <div className="rounded-lg border p-4">
                      <h4 className="font-medium text-sm mb-2">Problema: Todos os campos retornam false/null</h4>
                      <p className="text-sm text-muted-foreground">
                        Solução: Verifique se as permissões User.Read, User.ReadBasic.All e User.Read.All foram
                        adicionadas no Azure AD e se o admin consent foi concedido.
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h4 className="font-medium text-sm mb-2">Problema: Supervisor retorna null</h4>
                      <p className="text-sm text-muted-foreground">
                        Solução: O usuário pode não ter um supervisor configurado no Active Directory. Isso é normal e
                        esperado para alguns usuários.
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h4 className="font-medium text-sm mb-2">Problema: Foto não aparece</h4>
                      <p className="text-sm text-muted-foreground">
                        Solução: O usuário pode não ter foto configurada no perfil do Microsoft 365. Sempre forneça um
                        fallback visual (avatar com iniciais).
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h4 className="font-medium text-sm mb-2">Problema: Erro 401 Unauthorized</h4>
                      <p className="text-sm text-muted-foreground">
                        Solução: O token de acesso pode estar expirado. Use acquireTokenSilent() para renovar
                        automaticamente ou acquireTokenPopup() para forçar novo login.
                      </p>
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
