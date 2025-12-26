"use client"

import { useState } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"

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
          <TabsList className="grid w-full grid-cols-7 lg:w-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="solicitacao">Solicitação</TabsTrigger>
            <TabsTrigger value="frontend">Front-end</TabsTrigger>
            <TabsTrigger value="backend">Back-end</TabsTrigger>
            <TabsTrigger value="aws">AWS</TabsTrigger>
            <TabsTrigger value="database">DynamoDB</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  O que é Microsoft Entra ID?
                </CardTitle>
                <CardDescription>Entenda o sistema de autenticação corporativo da Microsoft</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
                  <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">Explicação Simples (para leigos)</h3>
                  <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-200">
                    O <strong>Microsoft Entra ID</strong> (antigo Azure Active Directory) é como uma "portaria digital" da
                    Microsoft que gerencia quem pode entrar nos sistemas da empresa. É o mesmo sistema que você usa para
                    fazer login no Windows, Outlook, Teams e outros aplicativos da Microsoft.
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
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          Login Automático (SSO)
                        </p>
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
                      <p className="text-sm text-slate-600">
                        Front-end recebe tokens JWT com dados do usuário
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="ml-4 h-5 w-5 text-slate-400" />
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-600">
                      6
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Sistema autentica usuário</p>
                      <p className="text-sm text-slate-600">
                        Dados salvos no DynamoDB e usuário redirecionado
                      </p>
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
                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">1. Instalar Bibliotecas MSAL</h3>
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
                      {copiedStates["npm-install"] ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    <strong>MSAL</strong> = Microsoft Authentication Library - biblioteca oficial da Microsoft
                  </p>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">2. Configurar Variáveis de Ambiente</h3>
                  <p className="mb-2 text-sm text-slate-600">
                    Adicione ao arquivo <code className="rounded bg-slate-100 px-1 py-0.5">.env.local</code>:
                  </p>
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-50">
                      <code>{`NEXT_PUBLIC_ENTRA_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_ENTRA_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ENTRA_CLIENT_SECRET=seu-client-secret-aqui
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000`}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-2 top-2"
                      onClick={() =>
                        copyToClipboard(
                          "NEXT_PUBLIC_ENTRA_TENANT_ID=\nNEXT_PUBLIC_ENTRA_CLIENT_ID=\nENTRA_CLIENT_SECRET=\nNEXT_PUBLIC_REDIRECT_URI=http://localhost:3000",
                          "env-vars",
                        )
                      }
                    >
                      {copiedStates["env-vars"] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Alert className="mt-3">
                    <Key className="h-4 w-4" />
                    <AlertTitle>IMPORTANTE</AlertTitle>
                    <AlertDescription>
                      Substitua os valores <code>xxxxxxxx</code> pelas credenciais reais fornecidas pelo time de
                      infra.
                    </AlertDescription>
                  </Alert>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">3. Arquivos Já Criados</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div className="flex-1">
                        <code className="text-sm">lib/auth/entra-config.ts</code>
                        <p className="text-xs text-green-700">Configuração MSAL e funções auxiliares</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div className="flex-1">
                        <code className="text-sm">components/auth/entra-provider.tsx</code>
                        <p className="text-xs text-green-700">Provider que envolve a aplicação</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div className="flex-1">
                        <code className="text-sm">components/auth/login-form.tsx</code>
                        <p className="text-xs text-green-700">Login atualizado com botão Entra ID</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div className="flex-1">
                        <code className="text-sm">app/layout.tsx</code>
                        <p className="text-xs text-green-700">Layout atualizado com EntraProvider</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Pronto para Uso!</AlertTitle>
                  <AlertDescription>
                    Assim que você receber as credenciais do time de infra e adicionar no .env.local, o botão "Login
                    com Microsoft" aparecerá automaticamente na tela de login.
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
                    Arquivo: <code className="rounded bg-slate-100 px-1 py-0.5">back-end/python/auth/entra_validator.py</code>
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
                    Com essa validação, mesmo se alguém tentar falsificar um token, o back-end vai detectar e bloquear
                    o acesso.
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
                <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-950/20">
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">Por que usar Secrets Manager?</p>
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
                      <span>Adicione os pares chave-valor:</span>
                    </div>
                  </div>
                  <div className="relative mt-3">
                    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-50">
                      <code>{`{
  "ENTRA_TENANT_ID": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "ENTRA_CLIENT_ID": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "ENTRA_CLIENT_SECRET": "seu-client-secret-aqui"
}`}</code>
                    </pre>
                  </div>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-900">e)</span>
                      <span>
                        Nome do secret: <code className="rounded bg-slate-100 px-1 py-0.5">petrobras/entra-id-credentials</code>
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
                        <span>Teste 5: Logout e novo\
