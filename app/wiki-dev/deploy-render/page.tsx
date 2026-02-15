"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Server, Globe, Key, Database, Terminal, ExternalLink, CheckCircle, AlertTriangle, Copy, ArrowRight, Clock, Shield, Zap } from "lucide-react"
import { useState } from "react"

function CopyBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copiar"
      >
        {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}

export default function DeployRenderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/wiki-dev" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ArrowLeft className="h-4 w-4" /> Voltar para Wiki
          </Link>
        </div>

        <div className="mb-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <Server className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-slate-900">Deploy do Backend Python no Render.com</h1>
          <p className="text-lg text-slate-600">
            Guia completo passo a passo para hospedar a API FastAPI/Python no Render, conectada ao Neon PostgreSQL
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-violet-100 text-violet-700">Render.com</Badge>
            <Badge className="bg-blue-100 text-blue-700">Python 3.12</Badge>
            <Badge className="bg-green-100 text-green-700">FastAPI</Badge>
            <Badge className="bg-cyan-100 text-cyan-700">Neon PostgreSQL</Badge>
          </div>
        </div>

        {/* Visao geral */}
        <Alert className="border-blue-300 bg-blue-50 mb-8">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Arquitetura:</strong> O frontend (Next.js) esta na <strong>Vercel</strong>. O backend (Python/FastAPI) vai para o <strong>Render</strong>.
            O banco de dados (PostgreSQL) esta no <strong>Neon</strong>. Cada proxy route do Next.js (<code>/api/*</code>) repassa para o Render.
          </AlertDescription>
        </Alert>

        {/* ================================================ */}
        {/* PRE-REQUISITOS */}
        {/* ================================================ */}
        <Card className="mb-8 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Pre-requisitos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <ul className="list-disc list-inside space-y-2">
              <li>Conta no <a href="https://render.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">render.com</a> (pode criar com GitHub)</li>
              <li>Repositorio no GitHub com a pasta <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">backend/</code></li>
              <li>Banco Neon ja configurado (voce ja tem - <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">DATABASE_URL</code>)</li>
              <li>Python 3.12 (o Render configura automaticamente)</li>
            </ul>
          </CardContent>
        </Card>

        {/* ================================================ */}
        {/* PASSO 1 */}
        {/* ================================================ */}
        <Card className="mb-8 border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-sm">1</span>
              Criar conta no Render
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <ol className="list-decimal list-inside space-y-3">
              <li>
                Acesse <a href="https://dashboard.render.com/register" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">dashboard.render.com/register</a>
              </li>
              <li>
                Clique em <strong>{"Sign up with GitHub"}</strong> (recomendado - facilita o deploy automatico)
              </li>
              <li>
                Autorize o Render a acessar seus repositorios
              </li>
            </ol>
            <Alert className="border-amber-300 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                O plano <strong>Free</strong> do Render hiberna apos 15 min sem trafego (cold start de ~30s).
                Para producao, use o plano <strong>Starter ($7/mes)</strong> que roda 24/7.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* ================================================ */}
        {/* PASSO 2 */}
        {/* ================================================ */}
        <Card className="mb-8 border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-sm">2</span>
              Criar o Web Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <ol className="list-decimal list-inside space-y-3">
              <li>No Dashboard do Render, clique em <strong>New +</strong> (canto superior direito)</li>
              <li>Selecione <strong>Web Service</strong></li>
              <li>Escolha <strong>Build and deploy from a Git repository</strong></li>
              <li>Conecte o repositorio <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">tecnologiawebnetsystem/layout-petrobras-e-mail</code></li>
              <li>Configure conforme abaixo:</li>
            </ol>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-slate-900">Configuracoes do Service:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Name</p>
                  <p className="font-mono text-sm">petrobras-backend-api</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Region</p>
                  <p className="font-mono text-sm">Oregon (US West)</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Branch</p>
                  <p className="font-mono text-sm">main</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Runtime</p>
                  <p className="font-mono text-sm">Python 3</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Root Directory</p>
                  <p className="font-mono text-sm bg-yellow-100 px-2 py-1 rounded inline-block">backend</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Plan</p>
                  <p className="font-mono text-sm">Free (ou Starter $7/mes)</p>
                </div>
              </div>
            </div>

            <Alert className="border-red-300 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>IMPORTANTE:</strong> O campo <strong>Root Directory</strong> DEVE ser <code className="bg-red-100 px-1 rounded">backend</code>.
                Sem isso, o Render vai tentar ler o <code>package.json</code> do frontend e falhar.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* ================================================ */}
        {/* PASSO 3 */}
        {/* ================================================ */}
        <Card className="mb-8 border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-sm">3</span>
              Configurar Build e Start Commands
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="space-y-4">
              <div>
                <p className="font-medium text-slate-900 mb-2">Build Command:</p>
                <CopyBlock code="pip install -r requirements.txt" />
              </div>
              <div>
                <p className="font-medium text-slate-900 mb-2">Start Command:</p>
                <CopyBlock code="uvicorn app.main:app --host 0.0.0.0 --port $PORT" />
              </div>
            </div>

            <Alert className="border-blue-300 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                O Render define a variavel <code className="bg-blue-100 px-1 rounded">$PORT</code> automaticamente.
                <strong> NAO</strong> coloque <code>--port 8000</code> fixo. Use <code>$PORT</code>.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* ================================================ */}
        {/* PASSO 4 */}
        {/* ================================================ */}
        <Card className="mb-8 border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-sm">4</span>
              Configurar Variaveis de Ambiente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <p>Na secao <strong>Environment Variables</strong> do Render, adicione:</p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Key</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Value</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Obrigatorio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-red-50">
                    <td className="px-3 py-2 font-mono text-xs">DATABASE_URL</td>
                    <td className="px-3 py-2 text-xs">Copiar da Neon (connection string pooled)</td>
                    <td className="px-3 py-2"><Badge className="bg-red-100 text-red-700">Obrigatorio</Badge></td>
                  </tr>
                  <tr className="bg-red-50">
                    <td className="px-3 py-2 font-mono text-xs">JWT_SECRET_KEY</td>
                    <td className="px-3 py-2 text-xs">Gerar valor aleatorio seguro (64+ chars)</td>
                    <td className="px-3 py-2"><Badge className="bg-red-100 text-red-700">Obrigatorio</Badge></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-xs">PYTHON_VERSION</td>
                    <td className="px-3 py-2 text-xs">3.12.0</td>
                    <td className="px-3 py-2"><Badge className="bg-amber-100 text-amber-700">Recomendado</Badge></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-xs">STORAGE_PROVIDER</td>
                    <td className="px-3 py-2 text-xs">local (ou aws se tiver S3)</td>
                    <td className="px-3 py-2"><Badge className="bg-slate-100 text-slate-700">Opcional</Badge></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-xs">AUTH_MODE</td>
                    <td className="px-3 py-2 text-xs">local (ou entra para Entra ID)</td>
                    <td className="px-3 py-2"><Badge className="bg-slate-100 text-slate-700">Opcional</Badge></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-xs">EMAIL_PROVIDER</td>
                    <td className="px-3 py-2 text-xs">dev (ou ses para AWS SES)</td>
                    <td className="px-3 py-2"><Badge className="bg-slate-100 text-slate-700">Opcional</Badge></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-xs">FRONTEND_EXTERNAL_PORTAL_URL</td>
                    <td className="px-3 py-2 text-xs">URL do frontend Vercel (ex: https://seu-app.vercel.app)</td>
                    <td className="px-3 py-2"><Badge className="bg-slate-100 text-slate-700">Opcional</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-3">
              <p className="font-medium text-slate-900">Como pegar a DATABASE_URL do Neon:</p>
              <ol className="list-decimal list-inside space-y-2 text-slate-600">
                <li>Acesse <a href="https://console.neon.tech" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">console.neon.tech</a></li>
                <li>Selecione seu projeto</li>
                <li>Clique em <strong>Connection Details</strong></li>
                <li>Copie a <strong>Connection string</strong> (com <code className="bg-slate-100 px-1 rounded">?sslmode=require</code>)</li>
              </ol>
              <CopyBlock code="postgresql://neondb_owner:***@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require" />
            </div>

            <div className="space-y-3">
              <p className="font-medium text-slate-900">Gerar JWT_SECRET_KEY seguro:</p>
              <CopyBlock code={`python3 -c "import secrets; print(secrets.token_hex(64))"`} />
            </div>
          </CardContent>
        </Card>

        {/* ================================================ */}
        {/* PASSO 5 */}
        {/* ================================================ */}
        <Card className="mb-8 border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-sm">5</span>
              Deploy - Clicar em Create Web Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <ol className="list-decimal list-inside space-y-3">
              <li>Revise todas as configuracoes</li>
              <li>Clique em <strong>Create Web Service</strong></li>
              <li>O Render vai:
                <ul className="list-disc list-inside ml-5 mt-2 space-y-1 text-slate-600">
                  <li>Clonar o repositorio</li>
                  <li>Entrar na pasta <code className="bg-slate-100 px-1 rounded">backend/</code></li>
                  <li>Executar <code className="bg-slate-100 px-1 rounded">pip install -r requirements.txt</code></li>
                  <li>Iniciar com <code className="bg-slate-100 px-1 rounded">uvicorn app.main:app</code></li>
                </ul>
              </li>
              <li>Aguarde o build terminar (2-5 min na primeira vez)</li>
              <li>
                O Render vai gerar uma URL como:
                <code className="bg-green-100 text-green-800 px-2 py-1 rounded ml-1">https://petrobras-backend-api.onrender.com</code>
              </li>
            </ol>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="font-medium text-slate-900 mb-2">Testar se funcionou:</p>
              <CopyBlock code={`curl https://petrobras-backend-api.onrender.com/
# Deve retornar: {"status":"ok","storage":"local"}

curl https://petrobras-backend-api.onrender.com/docs
# Abre o Swagger UI da API`} />
            </div>
          </CardContent>
        </Card>

        {/* ================================================ */}
        {/* PASSO 6 */}
        {/* ================================================ */}
        <Card className="mb-8 border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-sm">6</span>
              Conectar o Frontend (Vercel) ao Backend (Render)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <p>
              O frontend Next.js na Vercel precisa saber a URL do backend no Render.
              Todas as API routes do Next.js (<code className="bg-slate-100 px-1 rounded">app/api/*/route.ts</code>) usam a
              variavel <code className="bg-slate-100 px-1 rounded">BACKEND_URL</code>.
            </p>

            <div className="space-y-3">
              <p className="font-medium text-slate-900">Na Vercel (Settings {'>'} Environment Variables), adicione:</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Key</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 font-mono text-xs">BACKEND_URL</td>
                      <td className="px-3 py-2 font-mono text-xs">https://petrobras-backend-api.onrender.com</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <Alert className="border-amber-300 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>SEM barra no final!</strong> Use <code>https://petrobras-backend-api.onrender.com</code> e
                <strong> NAO</strong> <code>https://petrobras-backend-api.onrender.com/</code>
              </AlertDescription>
            </Alert>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="font-medium text-slate-900 mb-2">Fluxo de uma requisicao:</p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded">Browser</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="bg-slate-800 text-white px-3 py-1.5 rounded">Vercel /api/auth/login</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="bg-violet-100 text-violet-800 px-3 py-1.5 rounded">Render /api/v1/auth/login</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="bg-cyan-100 text-cyan-800 px-3 py-1.5 rounded">Neon PostgreSQL</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================================================ */}
        {/* PASSO 7 */}
        {/* ================================================ */}
        <Card className="mb-8 border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-sm">7</span>
              Deploy Automatico (CI/CD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <p>
              O Render faz <strong>deploy automatico</strong> a cada push na branch <code className="bg-slate-100 px-1 rounded">main</code>.
              Sempre que voce fizer <code className="bg-slate-100 px-1 rounded">git push</code>, o Render detecta a mudanca,
              reinstala dependencias e reinicia o servidor.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <p className="font-medium text-slate-900">Fluxo CI/CD:</p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="bg-slate-800 text-white px-3 py-1.5 rounded">git push origin main</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="bg-violet-100 text-violet-800 px-3 py-1.5 rounded">Render detecta</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded">Build (2-5 min)</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded">Live</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================================================ */}
        {/* TROUBLESHOOTING */}
        {/* ================================================ */}
        <Card className="mb-8 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Problemas Comuns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="space-y-4">
              <div className="border-l-4 border-l-red-400 pl-4">
                <p className="font-semibold text-slate-900">{"Build falha com 'No module named app'"}</p>
                <p className="text-slate-600 mt-1">
                  Verifique que o <strong>Root Directory</strong> esta como <code className="bg-slate-100 px-1 rounded">backend</code>.
                  O Render precisa estar na pasta do backend para encontrar <code>app/main.py</code>.
                </p>
              </div>

              <div className="border-l-4 border-l-red-400 pl-4">
                <p className="font-semibold text-slate-900">{"Build falha com 'pip.ini' ou 'Nexus'"}</p>
                <p className="text-slate-600 mt-1">
                  O <code>pip.ini</code> aponta para o Nexus corporativo da Petrobras. No Render, o pip usa PyPI publico por padrao.
                  O <code>Dockerfile</code> ja foi atualizado para ignorar o <code>pip.ini</code> se nao existir.
                  Se usar <strong>Python runtime</strong> (nao Docker), o Render ignora o <code>pip.ini</code> automaticamente.
                </p>
              </div>

              <div className="border-l-4 border-l-red-400 pl-4">
                <p className="font-semibold text-slate-900">{"Erro 'connection refused' no banco"}</p>
                <p className="text-slate-600 mt-1">
                  Verifique que a <code>DATABASE_URL</code> esta correta e inclui <code>?sslmode=require</code>.
                  O Neon exige SSL.
                </p>
              </div>

              <div className="border-l-4 border-l-amber-400 pl-4">
                <p className="font-semibold text-slate-900">API demora para responder (30s+)</p>
                <p className="text-slate-600 mt-1">
                  No plano Free, o Render hiberna apos 15 min sem trafego. A primeira requisicao apos a hibernacao
                  demora ~30s (cold start). Para evitar, use o plano Starter ($7/mes) ou configure um
                  health check externo (ex: UptimeRobot) que faz ping a cada 14 min.
                </p>
              </div>

              <div className="border-l-4 border-l-amber-400 pl-4">
                <p className="font-semibold text-slate-900">CORS bloqueando requisicoes</p>
                <p className="text-slate-600 mt-1">
                  O <code>main.py</code> ja esta com <code>allow_origins=["*"]</code>. Para producao, troque por
                  a URL do seu frontend Vercel: <code>{`["https://seu-app.vercel.app"]`}</code>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================================================ */}
        {/* CHECKLIST FINAL */}
        {/* ================================================ */}
        <Card className="mb-8 border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-green-800">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Checklist Final
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-green-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "Web Service criado no Render",
                "Root Directory = backend",
                "Build Command = pip install -r requirements.txt",
                "Start Command = uvicorn app.main:app --host 0.0.0.0 --port $PORT",
                "DATABASE_URL configurado (Neon connection string)",
                "JWT_SECRET_KEY configurado (valor aleatorio)",
                "PYTHON_VERSION = 3.12.0",
                "Build concluido com sucesso (verde)",
                "curl / retorna {'status':'ok'}",
                "/docs abre o Swagger",
                "BACKEND_URL configurado na Vercel",
                "Frontend consegue chamar /api/* com sucesso",
              ].map((item, i) => (
                <label key={i} className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 rounded border-green-400 text-green-600 focus:ring-green-500" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Links uteis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <a href="https://docs.render.com/deploy-fastapi" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <ExternalLink className="h-4 w-4" />
            Render Docs: Deploy FastAPI
          </a>
          <a href="https://console.neon.tech" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-lg p-3">
            <Database className="h-4 w-4" />
            Neon Console
          </a>
          <a href="https://dashboard.render.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-800 bg-violet-50 border border-violet-200 rounded-lg p-3">
            <Server className="h-4 w-4" />
            Render Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
