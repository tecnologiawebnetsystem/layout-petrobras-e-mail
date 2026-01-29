"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Home,
  BookOpen,
  Package,
  Server,
  Cloud,
  Lock,
  Download,
  Upload,
  Settings,
  Terminal,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  ExternalLink,
  Database,
  Container,
  Shield,
  Workflow,
  FolderOpen,
  Globe,
  Key,
  Layers,
  ArrowRight,
  Monitor,
  Cpu,
} from "lucide-react"
import Link from "next/link"

export default function NexusRepositoryPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="group relative">
      <div className="absolute right-2 top-2 z-10">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => copyToClipboard(code, id)}
        >
          {copiedCode === id ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
        <code>{code}</code>
      </pre>
      <div className="absolute bottom-2 right-2">
        <Badge variant="outline" className="bg-slate-800 text-xs text-slate-400">
          {language}
        </Badge>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/wiki-dev">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Voltar para Wiki
              </Button>
            </Link>
            <Badge variant="outline" className="gap-1">
              <BookOpen className="h-3 w-3" />
              Documentacao Tecnica
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Title Section */}
        <div className="mb-10">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-slate-900">Nexus Repository Manager</h1>
          <p className="text-lg text-slate-600">
            Guia completo para configurar e usar o Sonatype Nexus como repositorio de artefatos para Front-End, Back-End e AWS
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-orange-100 text-orange-700">npm</Badge>
            <Badge className="bg-blue-100 text-blue-700">PyPI</Badge>
            <Badge className="bg-purple-100 text-purple-700">Docker</Badge>
            <Badge className="bg-green-100 text-green-700">AWS</Badge>
          </div>
        </div>

        {/* O que e o Nexus */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Info className="h-6 w-6 text-blue-500" />
              O que e o Nexus Repository Manager?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-6">
              <h3 className="mb-4 text-lg font-semibold text-blue-900">Definicao Simples</h3>
              <p className="text-blue-800 leading-relaxed">
                O <strong>Sonatype Nexus Repository Manager</strong> e como um "supermercado privado" de pacotes e bibliotecas 
                para sua empresa. Em vez de baixar pacotes diretamente da internet (npm, PyPI, Docker Hub), voce baixa do Nexus 
                da Petrobras, que ja verificou a seguranca e armazenou em cache para ser mais rapido.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <h4 className="mb-1 font-semibold text-slate-900">Seguranca</h4>
                <p className="text-sm text-slate-600">
                  Pacotes sao verificados antes de entrar no repositorio. Evita vulnerabilidades.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Cpu className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="mb-1 font-semibold text-slate-900">Velocidade</h4>
                <p className="text-sm text-slate-600">
                  Cache local dos pacotes. Downloads muito mais rapidos dentro da rede corporativa.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Lock className="h-5 w-5 text-purple-600" />
                </div>
                <h4 className="mb-1 font-semibold text-slate-900">Governanca</h4>
                <p className="text-sm text-slate-600">
                  Controle de quais pacotes podem ser usados. Auditoria de downloads.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <FolderOpen className="h-5 w-5 text-orange-600" />
                </div>
                <h4 className="mb-1 font-semibold text-slate-900">Pacotes Internos</h4>
                <p className="text-sm text-slate-600">
                  Armazena bibliotecas internas da empresa que nao podem ser publicadas externamente.
                </p>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Por que a Petrobras usa o Nexus?</AlertTitle>
              <AlertDescription>
                Por questoes de seguranca, a rede corporativa bloqueia acesso direto ao npm, PyPI e Docker Hub.
                Todo download de pacotes DEVE passar pelo Nexus, que atua como um proxy seguro e auditavel.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Diagrama de Arquitetura */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Workflow className="h-6 w-6 text-purple-500" />
              Como Funciona - Diagrama Visual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-slate-50 p-6">
              <div className="flex flex-col items-center gap-4">
                {/* Row 1 - Desenvolvedores */}
                <div className="flex items-center gap-4">
                  <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-4 text-center">
                    <Monitor className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Desenvolvedor</span>
                    <div className="mt-1 text-xs text-blue-600">npm install / pip install</div>
                  </div>
                </div>

                <ArrowRight className="h-6 w-6 rotate-90 text-slate-400" />

                {/* Row 2 - Nexus */}
                <div className="rounded-xl border-2 border-orange-400 bg-orange-50 p-6 text-center">
                  <Package className="mx-auto mb-2 h-12 w-12 text-orange-600" />
                  <span className="text-lg font-bold text-orange-900">Nexus Repository</span>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <Badge className="bg-orange-200 text-orange-800">npm-proxy</Badge>
                    <Badge className="bg-orange-200 text-orange-800">pypi-proxy</Badge>
                    <Badge className="bg-orange-200 text-orange-800">docker-proxy</Badge>
                  </div>
                  <div className="mt-2 text-xs text-orange-600">Cache + Verificacao de Seguranca</div>
                </div>

                <ArrowRight className="h-6 w-6 rotate-90 text-slate-400" />

                {/* Row 3 - Registries Externos */}
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="rounded-lg border border-slate-300 bg-white p-3 text-center">
                    <Globe className="mx-auto mb-1 h-6 w-6 text-red-500" />
                    <span className="text-xs font-medium">npmjs.com</span>
                  </div>
                  <div className="rounded-lg border border-slate-300 bg-white p-3 text-center">
                    <Globe className="mx-auto mb-1 h-6 w-6 text-blue-500" />
                    <span className="text-xs font-medium">pypi.org</span>
                  </div>
                  <div className="rounded-lg border border-slate-300 bg-white p-3 text-center">
                    <Globe className="mx-auto mb-1 h-6 w-6 text-blue-600" />
                    <span className="text-xs font-medium">Docker Hub</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-green-900">1. Primeira Requisicao</h4>
                <p className="text-sm text-green-800">
                  Desenvolvedor pede pacote → Nexus nao tem → Baixa do registro externo → Armazena em cache → Entrega
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <h4 className="mb-2 font-semibold text-blue-900">2. Requisicoes Seguintes</h4>
                <p className="text-sm text-blue-800">
                  Desenvolvedor pede pacote → Nexus ja tem em cache → Entrega instantaneamente (muito mais rapido!)
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 p-4">
                <h4 className="mb-2 font-semibold text-purple-900">3. Pacotes Internos</h4>
                <p className="text-sm text-purple-800">
                  Desenvolvedor publica pacote interno → Nexus armazena → Outros desenvolvedores podem usar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Configuracao */}
        <Tabs defaultValue="frontend" className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="frontend" className="gap-2">
              <Monitor className="h-4 w-4" />
              Front-End
            </TabsTrigger>
            <TabsTrigger value="backend" className="gap-2">
              <Server className="h-4 w-4" />
              Back-End
            </TabsTrigger>
            <TabsTrigger value="docker" className="gap-2">
              <Container className="h-4 w-4" />
              Docker
            </TabsTrigger>
            <TabsTrigger value="aws" className="gap-2">
              <Cloud className="h-4 w-4" />
              AWS
            </TabsTrigger>
          </TabsList>

          {/* FRONT-END TAB */}
          <TabsContent value="frontend">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-blue-500" />
                  Configurar Nexus para Front-End (npm/Node.js)
                </CardTitle>
                <CardDescription>
                  Passo a passo para configurar o npm para usar o Nexus da Petrobras no projeto React/Next.js
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Passo 1 */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                      1
                    </div>
                    <h3 className="text-lg font-semibold">Obter Credenciais do Nexus</h3>
                  </div>
                  <div className="space-y-4">
                    <Alert>
                      <Key className="h-4 w-4" />
                      <AlertTitle>Credenciais Necessarias</AlertTitle>
                      <AlertDescription>
                        Voce precisa solicitar ao time de infraestrutura:
                        <ul className="mt-2 list-inside list-disc">
                          <li><strong>URL do Nexus:</strong> https://nexus.petrobras.com.br</li>
                          <li><strong>Usuario:</strong> seu login corporativo ou usuario de servico</li>
                          <li><strong>Senha/Token:</strong> token de acesso gerado no Nexus</li>
                          <li><strong>Repositorio npm:</strong> npm-group (ou npm-proxy)</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                    <div className="rounded-lg bg-amber-50 p-4">
                      <h4 className="mb-2 flex items-center gap-2 font-semibold text-amber-900">
                        <AlertTriangle className="h-4 w-4" />
                        Como solicitar acesso
                      </h4>
                      <ol className="list-inside list-decimal space-y-1 text-sm text-amber-800">
                        <li>Abra um chamado no ServiceNow</li>
                        <li>Categoria: "Acesso a Sistemas" → "Nexus Repository"</li>
                        <li>Informe: nome do projeto, repositorios necessarios (npm, pypi, docker)</li>
                        <li>Aguarde aprovacao do gestor e criacao do usuario</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                      2
                    </div>
                    <h3 className="text-lg font-semibold">Criar arquivo .npmrc no projeto</h3>
                  </div>
                  <p className="mb-4 text-slate-600">
                    Crie um arquivo chamado <code className="rounded bg-slate-100 px-1">.npmrc</code> na raiz do seu projeto 
                    (onde fica o package.json):
                  </p>
                  <CodeBlock
                    id="npmrc-project"
                    language=".npmrc"
                    code={`# Arquivo: .npmrc (na raiz do projeto)
# Configuracao do Nexus Repository para npm

# URL do registry do Nexus (substituir pela URL real)
registry=https://nexus.petrobras.com.br/repository/npm-group/

# Configuracao de autenticacao (usar variavel de ambiente)
//nexus.petrobras.com.br/repository/npm-group/:_auth=\${NPM_AUTH_TOKEN}

# Opcoes adicionais
always-auth=true
strict-ssl=true

# Timeout maior para rede corporativa
fetch-timeout=60000
fetch-retries=3`}
                  />
                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Nao commit o token!</AlertTitle>
                    <AlertDescription>
                      O arquivo .npmrc pode ser commitado, mas o token de autenticacao deve vir de variavel de ambiente.
                      Nunca coloque sua senha/token diretamente no arquivo.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Passo 3 */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                      3
                    </div>
                    <h3 className="text-lg font-semibold">Configurar variavel de ambiente</h3>
                  </div>
                  <p className="mb-4 text-slate-600">
                    O token de autenticacao deve ser configurado como variavel de ambiente:
                  </p>
                  
                  <h4 className="mb-2 font-medium text-slate-900">Windows (PowerShell):</h4>
                  <CodeBlock
                    id="npm-env-windows"
                    language="powershell"
                    code={`# Configurar temporariamente (apenas sessao atual)
$env:NPM_AUTH_TOKEN = "seu_token_base64_aqui"

# Para gerar o token em base64:
# 1. No PowerShell, execute:
$credentials = "usuario:senha"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($credentials)
$base64 = [Convert]::ToBase64String($bytes)
Write-Host $base64

# 2. Use o resultado como NPM_AUTH_TOKEN`}
                  />

                  <h4 className="mb-2 mt-4 font-medium text-slate-900">Linux/Mac (Terminal):</h4>
                  <CodeBlock
                    id="npm-env-linux"
                    language="bash"
                    code={`# Configurar temporariamente (apenas sessao atual)
export NPM_AUTH_TOKEN="seu_token_base64_aqui"

# Para gerar o token em base64:
echo -n "usuario:senha" | base64

# Para configurar permanentemente, adicione ao ~/.bashrc ou ~/.zshrc:
echo 'export NPM_AUTH_TOKEN="seu_token_base64_aqui"' >> ~/.bashrc
source ~/.bashrc`}
                  />

                  <h4 className="mb-2 mt-4 font-medium text-slate-900">Arquivo .env.local (para desenvolvimento):</h4>
                  <CodeBlock
                    id="npm-env-file"
                    language="env"
                    code={`# Arquivo: .env.local (NAO COMMITAR!)
NPM_AUTH_TOKEN=c2V1X3VzdWFyaW86c3VhX3Nlbmhh`}
                  />
                </div>

                {/* Passo 4 */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                      4
                    </div>
                    <h3 className="text-lg font-semibold">Testar a configuracao</h3>
                  </div>
                  <p className="mb-4 text-slate-600">
                    Execute os comandos abaixo para verificar se a configuracao esta funcionando:
                  </p>
                  <CodeBlock
                    id="npm-test"
                    language="bash"
                    code={`# Verificar qual registry esta configurado
npm config get registry
# Deve mostrar: https://nexus.petrobras.com.br/repository/npm-group/

# Testar autenticacao
npm whoami
# Deve mostrar seu usuario

# Testar instalacao de pacote
npm install lodash --verbose
# Deve baixar do Nexus

# Se tiver problemas, limpar cache:
npm cache clean --force`}
                  />
                </div>

                {/* Passo 5 */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                      5
                    </div>
                    <h3 className="text-lg font-semibold">Publicar pacotes internos (opcional)</h3>
                  </div>
                  <p className="mb-4 text-slate-600">
                    Se voce precisa publicar um pacote interno para outros projetos usarem:
                  </p>
                  <CodeBlock
                    id="npm-publish"
                    language="bash"
                    code={`# No package.json, adicionar:
{
  "name": "@petrobras/meu-pacote",
  "version": "1.0.0",
  "publishConfig": {
    "registry": "https://nexus.petrobras.com.br/repository/npm-hosted/"
  }
}

# Para publicar:
npm publish

# Para instalar em outro projeto:
npm install @petrobras/meu-pacote`}
                  />
                </div>

                {/* Checklist Final */}
                <div className="rounded-lg bg-green-50 p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-green-900">
                    <CheckCircle2 className="h-5 w-5" />
                    Checklist - Front-End Configurado
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {[
                      "Credenciais do Nexus obtidas",
                      "Arquivo .npmrc criado na raiz",
                      "Variavel NPM_AUTH_TOKEN configurada",
                      ".env.local no .gitignore",
                      "npm config get registry mostra Nexus",
                      "npm whoami mostra seu usuario",
                      "npm install funciona normalmente",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-green-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BACK-END TAB */}
          <TabsContent value="backend">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-green-500" />
                  Configurar Nexus para Back-End (Python/pip)
                </CardTitle>
                <CardDescription>
                  Passo a passo para configurar o pip para usar o Nexus da Petrobras no projeto Python
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Passo 1 */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                      1
                    </div>
                    <h3 className="text-lg font-semibold">Criar arquivo pip.conf</h3>
                  </div>
                  <p className="mb-4 text-slate-600">
                    Crie o arquivo de configuracao do pip no local correto do seu sistema:
                  </p>
                  
                  <h4 className="mb-2 font-medium text-slate-900">Linux/Mac:</h4>
                  <CodeBlock
                    id="pip-conf-linux"
                    language="bash"
                    code={`# Criar pasta de configuracao (se nao existir)
mkdir -p ~/.config/pip

# Criar arquivo pip.conf
nano ~/.config/pip/pip.conf`}
                  />

                  <h4 className="mb-2 mt-4 font-medium text-slate-900">Windows:</h4>
                  <CodeBlock
                    id="pip-conf-windows"
                    language="powershell"
                    code={`# Criar pasta de configuracao (se nao existir)
mkdir $env:APPDATA\\pip

# O arquivo deve ser criado em:
# C:\\Users\\SEU_USUARIO\\AppData\\Roaming\\pip\\pip.ini`}
                  />
                </div>

                {/* Passo 2 */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                      2
                    </div>
                    <h3 className="text-lg font-semibold">Conteudo do pip.conf</h3>
                  </div>
                  <p className="mb-4 text-slate-600">
                    Adicione o seguinte conteudo ao arquivo:
                  </p>
                  <CodeBlock
                    id="pip-conf-content"
                    language="ini"
                    code={`# Arquivo: pip.conf (Linux/Mac) ou pip.ini (Windows)

[global]
# URL do Nexus PyPI
index-url = https://nexus.petrobras.com.br/repository/pypi-group/simple/

# URL adicional (fallback)
extra-index-url = https://nexus.petrobras.com.br/repository/pypi-hosted/simple/

# Certificado SSL (se necessario)
# cert = /caminho/para/certificado.pem

# Timeout maior para rede corporativa
timeout = 60

# Confiar no host do Nexus
trusted-host = nexus.petrobras.com.br

[install]
# Nao usar cache (util para debug)
# no-cache-dir = false`}
                  />
                </div>

                {/* Passo 3 - Autenticacao */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                      3
                    </div>
                    <h3 className="text-lg font-semibold">Configurar autenticacao</h3>
                  </div>
                  <p className="mb-4 text-slate-600">
                    Se o Nexus exigir autenticacao, configure de uma das formas:
                  </p>
                  
                  <h4 className="mb-2 font-medium text-slate-900">Opcao A - URL com credenciais (nao recomendado para producao):</h4>
                  <CodeBlock
                    id="pip-auth-url"
                    language="ini"
                    code={`[global]
index-url = https://usuario:senha@nexus.petrobras.com.br/repository/pypi-group/simple/`}
                  />

                  <h4 className="mb-2 mt-4 font-medium text-slate-900">Opcao B - Arquivo .netrc (recomendado):</h4>
                  <CodeBlock
                    id="pip-auth-netrc"
                    language="bash"
                    code={`# Criar arquivo ~/.netrc (Linux/Mac) ou %HOME%\\_netrc (Windows)

# Conteudo do arquivo:
machine nexus.petrobras.com.br
login seu_usuario
password sua_senha_ou_token

# Proteger o arquivo (Linux/Mac):
chmod 600 ~/.netrc`}
                  />

                  <h4 className="mb-2 mt-4 font-medium text-slate-900">Opcao C - Variavel de ambiente:</h4>
                  <CodeBlock
                    id="pip-auth-env"
                    language="bash"
                    code={`# Linux/Mac
export PIP_INDEX_URL="https://usuario:token@nexus.petrobras.com.br/repository/pypi-group/simple/"

# Windows PowerShell
$env:PIP_INDEX_URL = "https://usuario:token@nexus.petrobras.com.br/repository/pypi-group/simple/"`}
                  />
                </div>

                {/* Passo 4 - Projeto */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                      4
                    </div>
                    <h3 className="text-lg font-semibold">Configuracao por projeto (requirements.txt)</h3>
                  </div>
                  <p className="mb-4 text-slate-600">
                    Para garantir que todos usem o Nexus, adicione ao topo do requirements.txt:
                  </p>
                  <CodeBlock
                    id="pip-requirements"
                    language="text"
                    code={`# Arquivo: requirements.txt

# Configurar index do Nexus
--index-url https://nexus.petrobras.com.br/repository/pypi-group/simple/
--trusted-host nexus.petrobras.com.br

# Dependencias do projeto
fastapi==0.109.0
uvicorn==0.27.0
boto3==1.34.0
python-jose==3.3.0
passlib==1.7.4
python-multipart==0.0.6
pydantic==2.5.3
httpx==0.26.0`}
                  />
                </div>

                {/* Passo 5 - Testar */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                      5
                    </div>
                    <h3 className="text-lg font-semibold">Testar a configuracao</h3>
                  </div>
                  <CodeBlock
                    id="pip-test"
                    language="bash"
                    code={`# Verificar configuracao atual
pip config list

# Verificar qual index esta sendo usado
pip config get global.index-url

# Testar instalacao (com verbose para ver de onde baixa)
pip install requests -v

# Deve mostrar algo como:
# Looking in indexes: https://nexus.petrobras.com.br/repository/pypi-group/simple/
# Downloading https://nexus.petrobras.com.br/repository/pypi-group/packages/...

# Se tiver problemas, limpar cache:
pip cache purge`}
                  />
                </div>

                {/* Passo 6 - Publicar */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                      6
                    </div>
                    <h3 className="text-lg font-semibold">Publicar pacotes internos (opcional)</h3>
                  </div>
                  <p className="mb-4 text-slate-600">
                    Para publicar um pacote Python interno no Nexus:
                  </p>
                  <CodeBlock
                    id="pip-publish"
                    language="bash"
                    code={`# Instalar twine (ferramenta de upload)
pip install twine build

# Criar distribuicao do pacote
python -m build

# Configurar ~/.pypirc para upload
cat > ~/.pypirc << EOF
[distutils]
index-servers =
    nexus

[nexus]
repository = https://nexus.petrobras.com.br/repository/pypi-hosted/
username = seu_usuario
password = seu_token
EOF

# Fazer upload
twine upload --repository nexus dist/*`}
                  />
                </div>

                {/* Checklist Final */}
                <div className="rounded-lg bg-green-50 p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-green-900">
                    <CheckCircle2 className="h-5 w-5" />
                    Checklist - Back-End Configurado
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {[
                      "pip.conf criado no local correto",
                      "index-url apontando para Nexus",
                      "Autenticacao configurada (.netrc ou env)",
                      "requirements.txt com --index-url",
                      "pip config list mostra Nexus",
                      "pip install funciona normalmente",
                      "Virtualenv usando Nexus",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-green-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCKER TAB */}
          <TabsContent value="docker">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Container className="h-5 w-5 text-purple-500" />
                  Configurar Nexus para Docker
                </CardTitle>
                <CardDescription>
                  Passo a passo para usar o Nexus como registry de imagens Docker
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Passo 1 */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
                      1
                    </div>
                    <h3 className="text-lg font-semibold">Login no Registry Docker do Nexus</h3>
                  </div>
                  <CodeBlock
                    id="docker-login"
                    language="bash"
                    code={`# Fazer login no registry Docker do Nexus
docker login nexus.petrobras.com.br:8082

# Vai pedir:
# Username: seu_usuario
# Password: seu_token

# Verificar se logou:
cat ~/.docker/config.json
# Deve mostrar as credenciais (criptografadas)`}
                  />
                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Porta do Docker Registry</AlertTitle>
                    <AlertDescription>
                      O Docker Registry do Nexus geralmente roda em uma porta separada (ex: 8082, 8083).
                      Confirme a porta correta com o time de infraestrutura.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Passo 2 */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
                      2
                    </div>
                    <h3 className="text-lg font-semibold">Baixar imagens do Nexus (Pull)</h3>
                  </div>
                  <CodeBlock
                    id="docker-pull"
                    language="bash"
                    code={`# Baixar imagem base do Nexus (proxy do Docker Hub)
docker pull nexus.petrobras.com.br:8082/library/python:3.11-slim

# Baixar imagem Node.js
docker pull nexus.petrobras.com.br:8082/library/node:20-alpine

# Para usar no Dockerfile:
# Antes (direto do Docker Hub - bloqueado):
# FROM python:3.11-slim

# Depois (via Nexus):
FROM nexus.petrobras.com.br:8082/library/python:3.11-slim`}
                  />
                </div>

                {/* Passo 3 */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
                      3
                    </div>
                    <h3 className="text-lg font-semibold">Atualizar Dockerfiles do Projeto</h3>
                  </div>
                  <p className="mb-4 text-slate-600">
                    Atualize os Dockerfiles para usar imagens do Nexus:
                  </p>
                  
                  <h4 className="mb-2 font-medium text-slate-900">Dockerfile do Front-End:</h4>
                  <CodeBlock
                    id="dockerfile-frontend-nexus"
                    language="dockerfile"
                    code={`# Arquivo: Dockerfile (Front-End)

# Imagem base do Nexus
FROM nexus.petrobras.com.br:8082/library/node:20-alpine AS base

# Instalar dependencias
FROM base AS deps
WORKDIR /app

# Configurar npm para usar Nexus
RUN npm config set registry https://nexus.petrobras.com.br/repository/npm-group/

COPY package.json package-lock.json* ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]`}
                  />

                  <h4 className="mb-2 mt-4 font-medium text-slate-900">Dockerfile do Back-End:</h4>
                  <CodeBlock
                    id="dockerfile-backend-nexus"
                    language="dockerfile"
                    code={`# Arquivo: Dockerfile (Back-End Python)

# Imagem base do Nexus
FROM nexus.petrobras.com.br:8082/library/python:3.11-slim

WORKDIR /app

# Configurar pip para usar Nexus
RUN pip config set global.index-url https://nexus.petrobras.com.br/repository/pypi-group/simple/ && \\
    pip config set global.trusted-host nexus.petrobras.com.br

# Copiar e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar codigo
COPY ./app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`}
                  />
                </div>

                {/* Passo 4 */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
                      4
                    </div>
                    <h3 className="text-lg font-semibold">Publicar imagens no Nexus (Push)</h3>
                  </div>
                  <CodeBlock
                    id="docker-push"
                    language="bash"
                    code={`# 1. Build da imagem local
docker build -t meu-app-frontend:1.0.0 .

# 2. Tag para o Nexus (hosted repository)
docker tag meu-app-frontend:1.0.0 nexus.petrobras.com.br:8083/petrobras/meu-app-frontend:1.0.0

# 3. Push para o Nexus
docker push nexus.petrobras.com.br:8083/petrobras/meu-app-frontend:1.0.0

# Nota: porta 8082 = proxy (leitura), porta 8083 = hosted (escrita)
# Confirme as portas com infraestrutura`}
                  />
                </div>

                {/* Passo 5 */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
                      5
                    </div>
                    <h3 className="text-lg font-semibold">Atualizar docker-compose.yml</h3>
                  </div>
                  <CodeBlock
                    id="docker-compose-nexus"
                    language="yaml"
                    code={`# Arquivo: docker-compose.yml

version: '3.8'

services:
  frontend:
    image: nexus.petrobras.com.br:8082/petrobras/meu-app-frontend:latest
    # ou build local:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production

  backend:
    image: nexus.petrobras.com.br:8082/petrobras/meu-app-backend:latest
    # ou build local:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production`}
                  />
                </div>

                {/* Checklist */}
                <div className="rounded-lg bg-purple-50 p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-purple-900">
                    <CheckCircle2 className="h-5 w-5" />
                    Checklist - Docker Configurado
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {[
                      "docker login no Nexus funcionando",
                      "Dockerfiles usando imagens do Nexus",
                      "npm/pip configurados dentro do Dockerfile",
                      "docker pull de imagens base OK",
                      "docker push de imagens funcionando",
                      "docker-compose atualizado",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-purple-800">
                        <CheckCircle2 className="h-4 w-4 text-purple-600" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AWS TAB */}
          <TabsContent value="aws">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-orange-500" />
                  Usar Nexus na AWS
                </CardTitle>
                <CardDescription>
                  Como configurar pipelines CI/CD na AWS para usar o Nexus Repository
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visao Geral */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Cenarios de uso do Nexus na AWS</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 list-inside list-disc">
                      <li><strong>CodeBuild:</strong> Instalar dependencias npm/pip durante o build</li>
                      <li><strong>ECS/Fargate:</strong> Baixar imagens Docker do Nexus</li>
                      <li><strong>Lambda:</strong> Usar layers com dependencias do Nexus</li>
                      <li><strong>EC2:</strong> Configurar npm/pip nas instancias</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* AWS CodeBuild */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                      <Settings className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">AWS CodeBuild com Nexus</h3>
                      <p className="text-sm text-slate-600">Configurar buildspec.yml para usar Nexus</p>
                    </div>
                  </div>

                  <h4 className="mb-2 font-medium text-slate-900">1. Criar Secrets no AWS Secrets Manager:</h4>
                  <CodeBlock
                    id="aws-secrets"
                    language="bash"
                    code={`# Criar secret para credenciais do Nexus
aws secretsmanager create-secret \\
  --name "nexus-credentials" \\
  --description "Credenciais do Nexus Repository" \\
  --secret-string '{
    "username": "usuario_nexus",
    "password": "token_nexus",
    "npm_token": "base64_token_npm"
  }'

# Verificar se criou:
aws secretsmanager get-secret-value --secret-id nexus-credentials`}
                  />

                  <h4 className="mb-2 mt-4 font-medium text-slate-900">2. buildspec.yml para Front-End (npm):</h4>
                  <CodeBlock
                    id="buildspec-frontend"
                    language="yaml"
                    code={`# Arquivo: buildspec.yml (Front-End)

version: 0.2

env:
  secrets-manager:
    NEXUS_USERNAME: "nexus-credentials:username"
    NEXUS_PASSWORD: "nexus-credentials:password"
    NPM_AUTH_TOKEN: "nexus-credentials:npm_token"

phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - echo "Configurando npm para usar Nexus..."
      - npm config set registry https://nexus.petrobras.com.br/repository/npm-group/
      - npm config set //nexus.petrobras.com.br/repository/npm-group/:_auth $NPM_AUTH_TOKEN
      - npm config set always-auth true

  pre_build:
    commands:
      - echo "Instalando dependencias do Nexus..."
      - npm ci
      - echo "Dependencias instaladas com sucesso!"

  build:
    commands:
      - echo "Iniciando build..."
      - npm run build
      - echo "Build concluido!"

  post_build:
    commands:
      - echo "Preparando artefatos..."

artifacts:
  files:
    - '**/*'
  base-directory: '.next'

cache:
  paths:
    - 'node_modules/**/*'`}
                  />

                  <h4 className="mb-2 mt-4 font-medium text-slate-900">3. buildspec.yml para Back-End (pip):</h4>
                  <CodeBlock
                    id="buildspec-backend"
                    language="yaml"
                    code={`# Arquivo: buildspec.yml (Back-End Python)

version: 0.2

env:
  secrets-manager:
    NEXUS_USERNAME: "nexus-credentials:username"
    NEXUS_PASSWORD: "nexus-credentials:password"

phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - echo "Configurando pip para usar Nexus..."
      - pip config set global.index-url https://$NEXUS_USERNAME:$NEXUS_PASSWORD@nexus.petrobras.com.br/repository/pypi-group/simple/
      - pip config set global.trusted-host nexus.petrobras.com.br

  pre_build:
    commands:
      - echo "Instalando dependencias do Nexus..."
      - pip install -r requirements.txt
      - echo "Dependencias instaladas com sucesso!"

  build:
    commands:
      - echo "Executando testes..."
      - python -m pytest tests/ -v
      - echo "Testes concluidos!"

  post_build:
    commands:
      - echo "Preparando artefatos..."

artifacts:
  files:
    - '**/*'

cache:
  paths:
    - '/root/.cache/pip/**/*'`}
                  />
                </div>

                {/* ECS com Nexus Docker */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <Container className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">ECS/Fargate com Docker Registry do Nexus</h3>
                      <p className="text-sm text-slate-600">Configurar Task Definition para puxar imagens do Nexus</p>
                    </div>
                  </div>

                  <h4 className="mb-2 font-medium text-slate-900">1. Criar Secret para Docker Registry:</h4>
                  <CodeBlock
                    id="ecs-secret"
                    language="bash"
                    code={`# Criar secret no Secrets Manager para Docker login
aws secretsmanager create-secret \\
  --name "nexus-docker-credentials" \\
  --description "Credenciais Docker Registry do Nexus" \\
  --secret-string '{
    "username": "usuario_nexus",
    "password": "token_nexus"
  }'`}
                  />

                  <h4 className="mb-2 mt-4 font-medium text-slate-900">2. Task Definition usando imagem do Nexus:</h4>
                  <CodeBlock
                    id="ecs-task-def"
                    language="json"
                    code={`{
  "family": "meu-app-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "nexus.petrobras.com.br:8082/petrobras/meu-app-frontend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "repositoryCredentials": {
        "credentialsParameter": "arn:aws:secretsmanager:us-east-1:123456789:secret:nexus-docker-credentials"
      },
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/meu-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "frontend"
        }
      }
    }
  ]
}`}
                  />

                  <h4 className="mb-2 mt-4 font-medium text-slate-900">3. IAM Role para acessar Secrets:</h4>
                  <CodeBlock
                    id="ecs-iam-role"
                    language="json"
                    code={`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:123456789:secret:nexus-docker-credentials*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}`}
                  />
                </div>

                {/* CodePipeline Completo */}
                <div className="rounded-lg border border-slate-200 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                      <Workflow className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Pipeline CI/CD Completo</h3>
                      <p className="text-sm text-slate-600">Fluxo completo: Code → Build com Nexus → Deploy</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="flex flex-col items-center gap-2 text-sm">
                      <div className="rounded bg-blue-100 px-4 py-2 text-blue-900">
                        1. GitHub/CodeCommit (Codigo)
                      </div>
                      <ArrowRight className="h-4 w-4 rotate-90 text-slate-400" />
                      <div className="rounded bg-orange-100 px-4 py-2 text-orange-900">
                        2. CodeBuild (npm ci / pip install via Nexus)
                      </div>
                      <ArrowRight className="h-4 w-4 rotate-90 text-slate-400" />
                      <div className="rounded bg-purple-100 px-4 py-2 text-purple-900">
                        3. Docker Build (imagem base do Nexus)
                      </div>
                      <ArrowRight className="h-4 w-4 rotate-90 text-slate-400" />
                      <div className="rounded bg-green-100 px-4 py-2 text-green-900">
                        4. Push para Nexus Docker Registry
                      </div>
                      <ArrowRight className="h-4 w-4 rotate-90 text-slate-400" />
                      <div className="rounded bg-teal-100 px-4 py-2 text-teal-900">
                        5. ECS Deploy (pull do Nexus)
                      </div>
                    </div>
                  </div>

                  <h4 className="mb-2 mt-4 font-medium text-slate-900">buildspec.yml completo (build + push Docker):</h4>
                  <CodeBlock
                    id="buildspec-complete"
                    language="yaml"
                    code={`# Arquivo: buildspec.yml (CI/CD Completo)

version: 0.2

env:
  secrets-manager:
    NEXUS_USERNAME: "nexus-credentials:username"
    NEXUS_PASSWORD: "nexus-credentials:password"
    NPM_AUTH_TOKEN: "nexus-credentials:npm_token"
  variables:
    NEXUS_DOCKER_REGISTRY: "nexus.petrobras.com.br:8082"
    NEXUS_DOCKER_PUSH: "nexus.petrobras.com.br:8083"
    IMAGE_NAME: "petrobras/meu-app-frontend"
    IMAGE_TAG: "latest"

phases:
  pre_build:
    commands:
      - echo "=== Configurando Nexus ==="
      # npm
      - npm config set registry https://nexus.petrobras.com.br/repository/npm-group/
      - npm config set //nexus.petrobras.com.br/repository/npm-group/:_auth $NPM_AUTH_TOKEN
      
      # Docker login
      - echo $NEXUS_PASSWORD | docker login $NEXUS_DOCKER_REGISTRY -u $NEXUS_USERNAME --password-stdin
      - echo $NEXUS_PASSWORD | docker login $NEXUS_DOCKER_PUSH -u $NEXUS_USERNAME --password-stdin

  build:
    commands:
      - echo "=== Instalando dependencias ==="
      - npm ci
      
      - echo "=== Build da aplicacao ==="
      - npm run build
      
      - echo "=== Build da imagem Docker ==="
      - docker build -t $IMAGE_NAME:$IMAGE_TAG .
      - docker tag $IMAGE_NAME:$IMAGE_TAG $NEXUS_DOCKER_PUSH/$IMAGE_NAME:$IMAGE_TAG
      - docker tag $IMAGE_NAME:$IMAGE_TAG $NEXUS_DOCKER_PUSH/$IMAGE_NAME:$CODEBUILD_BUILD_NUMBER

  post_build:
    commands:
      - echo "=== Push para Nexus ==="
      - docker push $NEXUS_DOCKER_PUSH/$IMAGE_NAME:$IMAGE_TAG
      - docker push $NEXUS_DOCKER_PUSH/$IMAGE_NAME:$CODEBUILD_BUILD_NUMBER
      
      - echo "=== Gerando imagedefinitions.json para ECS ==="
      - printf '[{"name":"frontend","imageUri":"%s"}]' $NEXUS_DOCKER_PUSH/$IMAGE_NAME:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json`}
                  />
                </div>

                {/* Conectividade */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-amber-900">
                    <AlertTriangle className="h-5 w-5" />
                    Importante: Conectividade AWS → Nexus
                  </h3>
                  <div className="space-y-3 text-sm text-amber-800">
                    <p>
                      Para a AWS acessar o Nexus da Petrobras, e necessario:
                    </p>
                    <ul className="list-inside list-disc space-y-1">
                      <li><strong>VPN Site-to-Site:</strong> Conexao VPN entre a AWS e a rede corporativa</li>
                      <li><strong>Direct Connect:</strong> Conexao dedicada AWS ↔ Datacenter Petrobras</li>
                      <li><strong>PrivateLink:</strong> Se o Nexus estiver exposto via PrivateLink</li>
                      <li><strong>NAT Gateway + Whitelist:</strong> Se acessar via internet, IP do NAT deve estar liberado no Nexus</li>
                    </ul>
                    <p className="mt-3">
                      <strong>Solicite ao time de infraestrutura:</strong> Liberacao de acesso da VPC da AWS ao Nexus 
                      (portas 443, 8082, 8083)
                    </p>
                  </div>
                </div>

                {/* Checklist */}
                <div className="rounded-lg bg-orange-50 p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-orange-900">
                    <CheckCircle2 className="h-5 w-5" />
                    Checklist - AWS Configurado
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {[
                      "Secrets Manager com credenciais Nexus",
                      "IAM Role com permissao de secrets",
                      "buildspec.yml configurado",
                      "VPC com acesso ao Nexus",
                      "Security Groups liberados",
                      "Task Definition com repositoryCredentials",
                      "Pipeline testado end-to-end",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-orange-800">
                        <CheckCircle2 className="h-4 w-4 text-orange-600" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Troubleshooting */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              Problemas Comuns e Solucoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-2 font-semibold text-red-600">Erro: UNABLE_TO_GET_ISSUER_CERT_LOCALLY</h4>
                <p className="mb-2 text-sm text-slate-600">Problema com certificado SSL do Nexus.</p>
                <CodeBlock
                  id="fix-ssl"
                  language="bash"
                  code={`# npm - desabilitar verificacao SSL (nao recomendado para producao)
npm config set strict-ssl false

# npm - adicionar certificado
npm config set cafile /caminho/para/certificado-petrobras.pem

# pip - trusted-host
pip config set global.trusted-host nexus.petrobras.com.br`}
                />
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-2 font-semibold text-red-600">Erro: 401 Unauthorized</h4>
                <p className="mb-2 text-sm text-slate-600">Credenciais invalidas ou expiradas.</p>
                <CodeBlock
                  id="fix-401"
                  language="bash"
                  code={`# Verificar se o token esta correto
npm whoami  # deve mostrar seu usuario

# Regenerar token no Nexus:
# 1. Acesse https://nexus.petrobras.com.br
# 2. Va em seu perfil → Security → User Token
# 3. Clique em "Access User Token"
# 4. Use o novo token`}
                />
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-2 font-semibold text-red-600">Erro: ETIMEDOUT / ECONNREFUSED</h4>
                <p className="mb-2 text-sm text-slate-600">Sem conexao com o Nexus.</p>
                <CodeBlock
                  id="fix-timeout"
                  language="bash"
                  code={`# Verificar se consegue acessar o Nexus
curl -v https://nexus.petrobras.com.br/service/rest/v1/status

# Verificar se esta na VPN corporativa
# Verificar proxy corporativo:
npm config set proxy http://proxy.petrobras.com.br:8080
npm config set https-proxy http://proxy.petrobras.com.br:8080`}
                />
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-2 font-semibold text-red-600">Erro: 404 Not Found (pacote nao encontrado)</h4>
                <p className="mb-2 text-sm text-slate-600">Pacote nao existe no cache do Nexus.</p>
                <CodeBlock
                  id="fix-404"
                  language="bash"
                  code={`# O Nexus pode nao ter o pacote em cache ainda
# Tente novamente - ele vai buscar do registry externo

# Se persistir, o pacote pode estar bloqueado por politica de seguranca
# Abra chamado solicitando liberacao do pacote no Nexus`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links Uteis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-blue-500" />
              Links Uteis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <a
                href="https://help.sonatype.com/repomanager3"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
              >
                <Package className="h-8 w-8 text-orange-500" />
                <div>
                  <h4 className="font-semibold text-slate-900">Documentacao Oficial Nexus</h4>
                  <p className="text-sm text-slate-600">Sonatype Nexus Repository Manager 3</p>
                </div>
              </a>
              <a
                href="https://docs.npmjs.com/cli/v10/configuring-npm/npmrc"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
              >
                <FileCode className="h-8 w-8 text-red-500" />
                <div>
                  <h4 className="font-semibold text-slate-900">Documentacao .npmrc</h4>
                  <p className="text-sm text-slate-600">Configuracao do npm registry</p>
                </div>
              </a>
              <a
                href="https://pip.pypa.io/en/stable/topics/configuration/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
              >
                <Server className="h-8 w-8 text-blue-500" />
                <div>
                  <h4 className="font-semibold text-slate-900">Documentacao pip.conf</h4>
                  <p className="text-sm text-slate-600">Configuracao do pip index</p>
                </div>
              </a>
              <a
                href="https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
              >
                <Cloud className="h-8 w-8 text-orange-500" />
                <div>
                  <h4 className="font-semibold text-slate-900">AWS CodeBuild buildspec</h4>
                  <p className="text-sm text-slate-600">Referencia do buildspec.yml</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
