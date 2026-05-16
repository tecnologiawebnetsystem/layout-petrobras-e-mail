"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Server, Globe, Key, Database, ExternalLink, CheckCircle, AlertTriangle, Copy, ArrowRight, Clock, Zap, Eye, MousePointer, HelpCircle, Lightbulb } from "lucide-react"
import { useState } from "react"

function CopyBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative group">
      {label && <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>}
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

function ExplainBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
      <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
      <div className="text-sm text-blue-800">{children}</div>
    </div>
  )
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-lg shrink-0">
      {n}
    </span>
  )
}

export default function DeployRenderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
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
          <h1 className="mb-3 text-4xl font-bold text-slate-900">Como Publicar o Back-End</h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Passo a passo super detalhado para colocar a API Python no ar - como se voce nunca tivesse feito isso antes
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-violet-100 text-violet-700">Render.com</Badge>
            <Badge className="bg-blue-100 text-blue-700">Gratis</Badge>
            <Badge className="bg-green-100 text-green-700">Sem terminal</Badge>
            <Badge className="bg-cyan-100 text-cyan-700">~10 minutos</Badge>
          </div>
        </div>

        {/* O que e o que */}
        <Card className="mb-8 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              Antes de comecar - O que e o que?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-blue-900">
            <p className="leading-relaxed">
              Nosso sistema tem <strong>3 partes</strong>. Pense nelas como uma lanchonete:
            </p>
            <div className="grid gap-3">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="font-bold text-slate-900 mb-1">Frontend (Next.js) = O Balcao</p>
                <p className="text-slate-600">E o que o cliente ve - os botoes, as telas, os formularios. Ja esta publicado na Vercel.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-violet-300 ring-2 ring-violet-200">
                <p className="font-bold text-violet-700 mb-1">Backend (Python/FastAPI) = A Cozinha</p>
                <p className="text-slate-600">E o que trabalha por tras - processa pedidos, valida dados, envia emails. <strong>E isso que vamos publicar agora.</strong></p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="font-bold text-slate-900 mb-1">Banco de Dados (Neon PostgreSQL) = O Estoque</p>
                <p className="text-slate-600">E onde ficam guardados todos os dados - usuarios, arquivos, logs. Ja esta funcionando no Neon.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="font-bold text-slate-900 mb-2">O que e o Render?</p>
              <p className="text-slate-600">
                E um site que roda seu codigo Python na nuvem, de graca. Voce nao precisa ter um servidor fisico.
                E como se fosse um computador ligado 24 horas que roda seu programa. Voce so precisa apontar 
                para o seu codigo no GitHub e ele faz o resto.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* =========================================== */}
        {/* PASSO 1 - Criar conta */}
        {/* =========================================== */}
        <Card className="mb-6 border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <StepNumber n={1} />
              Criar sua conta no Render
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <MousePointer className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">1. Abra o site do Render</p>
                  <p className="text-slate-600 mt-1">
                    Clique neste link: <a href="https://dashboard.render.com/register" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">dashboard.render.com/register</a>
                  </p>
                  <p className="text-slate-500 mt-1">Vai abrir uma pagina de cadastro.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <MousePointer className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">2. Clique no botao "GitHub"</p>
                  <p className="text-slate-600 mt-1">
                    Na tela de cadastro, voce vai ver varios botoes: Google, GitHub, GitLab...
                    Clique no botao <strong>GitHub</strong>. Isso facilita porque o Render ja vai ter acesso ao seu codigo.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <MousePointer className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">3. Autorize o acesso</p>
                  <p className="text-slate-600 mt-1">
                    O GitHub vai perguntar se voce permite que o Render veja seus repositorios.
                    Clique em <strong>Authorize Render</strong> (botao verde).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700">Pronto! Conta criada.</p>
                  <p className="text-slate-600 mt-1">Voce vai cair no Dashboard (painel de controle) do Render. Ele vai estar vazio porque voce ainda nao criou nada.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* =========================================== */}
        {/* PASSO 2 - Criar Web Service */}
        {/* =========================================== */}
        <Card className="mb-6 border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <StepNumber n={2} />
              Criar o servico para rodar seu backend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <ExplainBox>
              <strong>O que e um "Web Service"?</strong> E como dizer pro Render: "Quero que voce rode este programa pra mim".
              Voce vai apontar para o seu codigo no GitHub e o Render cuida do resto.
            </ExplainBox>

            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <MousePointer className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">1. Clique no botao azul "New +"</p>
                  <p className="text-slate-600 mt-1">Fica no <strong>canto superior direito</strong> da tela. Vai abrir um menu.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <MousePointer className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">2. Clique em "Web Service"</p>
                  <p className="text-slate-600 mt-1">E a primeira opcao do menu que abriu.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <MousePointer className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">3. Escolha "Build and deploy from a Git repository"</p>
                  <p className="text-slate-600 mt-1">Isso diz ao Render: "Pega meu codigo do GitHub e roda".</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <MousePointer className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">4. Encontre o repositorio do projeto</p>
                  <p className="text-slate-600 mt-1">
                    Vai aparecer uma lista com seus repositorios do GitHub. Procure por:
                  </p>
                  <p className="font-mono text-xs bg-slate-200 px-2 py-1 rounded mt-2 inline-block">
                    tecnologiawebnetsystem/layout-petrobras-e-mail
                  </p>
                  <p className="text-slate-600 mt-2">
                    Clique no botao <strong>Connect</strong> ao lado dele.
                  </p>
                  <p className="text-slate-500 mt-1 text-xs">
                    Se nao aparecer, clique em "Configure account" para dar permissao ao Render de ver esse repositorio.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* =========================================== */}
        {/* PASSO 3 - Preencher os campos */}
        {/* =========================================== */}
        <Card className="mb-6 border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <StepNumber n={3} />
              Preencher os campos - COPIE EXATAMENTE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <ExplainBox>
              Agora o Render vai pedir informacoes sobre como rodar seu programa.
              E como preencher um formulario. <strong>Copie os valores exatamente como estao abaixo.</strong>
            </ExplainBox>

            <div className="space-y-4">
              {/* Name */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-1">Campo: <strong>Name</strong></p>
                <p className="text-xs text-slate-500 mb-2">O que e: O nome do seu servico. Pode ser qualquer coisa.</p>
                <CopyBlock code="petrobras-backend-api" />
              </div>

              {/* Region */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-1">Campo: <strong>Region</strong></p>
                <p className="text-xs text-slate-500 mb-2">O que e: Em qual pais o servidor vai ficar. Escolha o mais perto do banco Neon.</p>
                <p className="font-mono text-sm bg-white border px-3 py-2 rounded">Oregon (US West)</p>
              </div>

              {/* Branch */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-1">Campo: <strong>Branch</strong></p>
                <p className="text-xs text-slate-500 mb-2">O que e: Qual "versao" do codigo usar. O main e a versao principal.</p>
                <CopyBlock code="main" />
              </div>

              {/* Runtime */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-1">Campo: <strong>Runtime</strong></p>
                <p className="text-xs text-slate-500 mb-2">O que e: Qual linguagem de programacao o programa usa.</p>
                <p className="font-mono text-sm bg-white border px-3 py-2 rounded">Python 3</p>
              </div>

              {/* Root Directory - IMPORTANTE */}
              <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300">
                <p className="text-xs font-medium text-red-600 mb-1">Campo: <strong>Root Directory</strong> (MUITO IMPORTANTE)</p>
                <p className="text-xs text-red-600 mb-2">
                  O que e: Em qual pasta esta o codigo do backend. Nosso projeto tem o frontend na raiz e o backend na pasta "backend".
                  <strong> Se voce errar aqui, NADA vai funcionar.</strong>
                </p>
                <CopyBlock code="backend" />
              </div>

              {/* Build Command */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-1">Campo: <strong>Build Command</strong></p>
                <p className="text-xs text-slate-500 mb-2">
                  O que e: O comando que instala todas as bibliotecas que o programa precisa. 
                  E como instalar os ingredientes antes de comecar a cozinhar.
                </p>
                <CopyBlock code="pip install -r requirements.txt" />
              </div>

              {/* Start Command */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-1">Campo: <strong>Start Command</strong></p>
                <p className="text-xs text-slate-500 mb-2">
                  O que e: O comando que liga o programa. E como apertar o botao "Ligar" do fogao.
                </p>
                <CopyBlock code="uvicorn app.main:app --host 0.0.0.0 --port $PORT" />
                <p className="text-xs text-slate-500 mt-2">
                  O <code className="bg-slate-200 px-1 rounded">$PORT</code> e importante - o Render escolhe a porta automaticamente. Nao troque por um numero.
                </p>
              </div>

              {/* Plan */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-1">Campo: <strong>Instance Type</strong></p>
                <p className="text-xs text-slate-500 mb-2">O que e: Quanto voce quer pagar. Free = gratis. Starter = $7/mes (fica ligado 24h).</p>
                <p className="font-mono text-sm bg-white border px-3 py-2 rounded">Free (para testar) ou Starter (para producao)</p>
              </div>
            </div>

            <Alert className="border-amber-300 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>No plano Free</strong>, o servidor "dorme" depois de 15 minutos sem ninguem usar.
                Quando alguem acessa de novo, demora uns 30 segundos para "acordar". No plano Starter ($7/mes) ele fica ligado 24 horas.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* =========================================== */}
        {/* PASSO 4 - Variaveis de ambiente */}
        {/* =========================================== */}
        <Card className="mb-6 border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <StepNumber n={4} />
              Adicionar as "senhas" do sistema (Variaveis de Ambiente)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <ExplainBox>
              <strong>O que sao "Variaveis de Ambiente"?</strong> Sao como senhas e enderecos que o programa precisa para funcionar.
              Por exemplo: a senha do banco de dados, o endereco do banco, uma chave secreta para login. 
              Voce <strong>nunca</strong> coloca essas informacoes direto no codigo - coloca aqui, no Render, de forma segura.
            </ExplainBox>

            <p className="font-medium text-slate-900">
              Role a pagina para baixo ate encontrar a secao <strong>"Environment Variables"</strong>.
              Clique em <strong>"Add Environment Variable"</strong> e adicione uma de cada vez:
            </p>

            {/* Var 1 - DATABASE_URL */}
            <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300 space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-red-600" />
                <p className="font-bold text-red-800">Variavel 1 - DATABASE_URL (OBRIGATORIA)</p>
              </div>
              <p className="text-red-700">E o endereco do banco de dados. Sem isso, o backend nao consegue guardar nada.</p>
              
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">No campo "Key", digite:</p>
                <CopyBlock code="DATABASE_URL" />
              </div>
              
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">No campo "Value", cole a connection string do Neon. Para pegar:</p>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 ml-2">
                  <li>Abra outra aba e va em <a href="https://console.neon.tech" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">console.neon.tech</a></li>
                  <li>Clique no nome do seu projeto</li>
                  <li>Na tela que abrir, procure <strong>Connection Details</strong> (geralmente fica na lateral direita)</li>
                  <li>Copie toda a linha que comeca com <code className="bg-red-100 px-1 rounded">postgresql://</code></li>
                </ol>
                <p className="text-xs text-slate-500 mt-2">Exemplo de formato de connection:</p>
                <CopyBlock code="postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>/<DB_NAME>?sslmode=require" />
              </div>
            </div>

            {/* Var 2 - JWT_SECRET_KEY */}
            <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300 space-y-3">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-red-600" />
                <p className="font-bold text-red-800">Variavel 2 - JWT_SECRET_KEY (OBRIGATORIA)</p>
              </div>
              <p className="text-red-700">E uma chave secreta usada para criar os tokens de login. Tem que ser longa e aleatoria.</p>
              
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">No campo "Key", digite:</p>
                <CopyBlock code="JWT_SECRET_KEY" />
              </div>
              
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">No campo "Value", voce precisa de um texto aleatorio. Tem 2 formas de gerar:</p>
                <div className="space-y-2 ml-2">
                  <p className="text-slate-600"><strong>Forma 1</strong> - Se voce tem Python no computador, abra o terminal e digite:</p>
                  <CopyBlock code={`python3 -c "import secrets; print(secrets.token_hex(64))"`} />
                  <p className="text-slate-600"><strong>Forma 2</strong> - Se nao tem Python, acesse <a href="https://www.uuidgenerator.net/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">uuidgenerator.net</a>, gere 2 UUIDs e cole um atras do outro.</p>
                </div>
              </div>
            </div>

            {/* Var 3 - PYTHON_VERSION */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-300 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <p className="font-bold text-amber-800">Variavel 3 - PYTHON_VERSION (Recomendada)</p>
              </div>
              <p className="text-amber-700">Diz ao Render qual versao do Python usar. Sem isso, ele pode usar uma versao antiga.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">Key:</p>
                  <CopyBlock code="PYTHON_VERSION" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">Value:</p>
                  <CopyBlock code="3.12.0" />
                </div>
              </div>
            </div>

            {/* Vars opcionais */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
              <p className="font-bold text-slate-800">Variaveis opcionais (pode adicionar depois se precisar):</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-2 py-2 text-left font-semibold text-slate-700">Key</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700">Value</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700">Para que serve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-2 py-2 font-mono">STORAGE_PROVIDER</td>
                      <td className="px-2 py-2 font-mono">local</td>
                      <td className="px-2 py-2">Onde guardar arquivos (local ou aws)</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 font-mono">AUTH_MODE</td>
                      <td className="px-2 py-2 font-mono">local</td>
                      <td className="px-2 py-2">Tipo de login (local ou entra)</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 font-mono">EMAIL_PROVIDER</td>
                      <td className="px-2 py-2 font-mono">dev</td>
                      <td className="px-2 py-2">Como enviar emails (dev = so loga, ses = envia de verdade)</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 font-mono">FRONTEND_EXTERNAL_PORTAL_URL</td>
                      <td className="px-2 py-2 font-mono">https://seu-app.vercel.app</td>
                      <td className="px-2 py-2">URL do frontend (para links nos emails)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* =========================================== */}
        {/* PASSO 5 - Deploy */}
        {/* =========================================== */}
        <Card className="mb-6 border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <StepNumber n={5} />
              Apertar o botao e esperar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <MousePointer className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">1. Clique no botao "Create Web Service"</p>
                  <p className="text-slate-600 mt-1">Fica la embaixo da pagina, botao roxo/azul grande. Clique nele.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">2. Agora espere (2 a 5 minutos)</p>
                  <p className="text-slate-600 mt-1">
                    O Render vai mostrar um "log" (texto correndo na tela). E ele fazendo o seguinte:
                  </p>
                  <ul className="list-disc list-inside ml-3 mt-2 space-y-1 text-slate-500">
                    <li>Baixando seu codigo do GitHub</li>
                    <li>Entrando na pasta <code className="bg-slate-200 px-1 rounded">backend/</code></li>
                    <li>Instalando todas as bibliotecas Python (fastapi, sqlmodel, etc)</li>
                    <li>Ligando o servidor</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-green-50 rounded-lg p-3 border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700">3. Quando aparecer "Live" em verde, esta pronto!</p>
                  <p className="text-slate-600 mt-1">
                    No topo da pagina, o status vai mudar de "Deploying..." para <strong className="text-green-600">Live</strong>.
                    O Render tambem mostra a URL do seu servico, algo como:
                  </p>
                  <p className="font-mono text-sm bg-green-100 text-green-800 px-3 py-2 rounded mt-2 inline-block">
                    https://petrobras-backend-api.onrender.com
                  </p>
                </div>
              </div>
            </div>

            <Alert className="border-red-300 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Se aparecer "Deploy failed" em vermelho:</strong> Nao se desespere. 
                Va para a secao "Problemas Comuns" no final desta pagina. Os erros mais frequentes estao la com a solucao.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* =========================================== */}
        {/* PASSO 6 - Testar */}
        {/* =========================================== */}
        <Card className="mb-6 border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <StepNumber n={6} />
              Testar se o backend esta funcionando
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <ExplainBox>
              Agora voce vai abrir a URL que o Render gerou pra ver se tudo esta rodando.
              E como ir ate a lanchonete pra ver se ela abriu.
            </ExplainBox>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="font-medium text-slate-900 mb-2">Teste 1: Abrir a pagina principal</p>
                <p className="text-slate-600 mb-2">No seu navegador (Chrome, Firefox...), abra:</p>
                <CopyBlock code="https://petrobras-backend-api.onrender.com/" label="Cole na barra de endereco do navegador:" />
                <p className="text-slate-600 mt-2">Se aparecer algo assim, <strong className="text-green-600">esta funcionando</strong>:</p>
                <pre className="bg-green-50 text-green-800 p-3 rounded-lg text-sm mt-2 border border-green-200">
                  <code>{`{"status":"ok","storage":"local"}`}</code>
                </pre>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="font-medium text-slate-900 mb-2">Teste 2: Abrir o Swagger (documentacao da API)</p>
                <p className="text-slate-600 mb-2">
                  O Swagger e uma pagina bonita que mostra todos os endpoints da API. Abra:
                </p>
                <CopyBlock code="https://petrobras-backend-api.onrender.com/docs" label="Cole na barra de endereco do navegador:" />
                <p className="text-slate-600 mt-2">Deve abrir uma pagina com titulo <strong>"FastAPI"</strong> e uma lista de rotas coloridas (GET em verde, POST em azul, etc).</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* =========================================== */}
        {/* PASSO 7 - Conectar frontend */}
        {/* =========================================== */}
        <Card className="mb-6 border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <StepNumber n={7} />
              Conectar o frontend ao backend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <ExplainBox>
              <strong>O que estamos fazendo aqui?</strong> O frontend (que esta na Vercel) precisa saber o endereco do backend (que esta no Render). 
              E como dar o telefone da cozinha pro balcao, pra que eles possam fazer os pedidos.
            </ExplainBox>

            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <MousePointer className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">1. Abra o painel da Vercel</p>
                  <p className="text-slate-600 mt-1">
                    Va em <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">vercel.com/dashboard</a> e clique no nome do seu projeto.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <MousePointer className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">2. Va em Settings</p>
                  <p className="text-slate-600 mt-1">Clique na aba <strong>Settings</strong> (no menu superior da pagina do projeto).</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <MousePointer className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">3. Clique em "Environment Variables" no menu lateral</p>
                  <p className="text-slate-600 mt-1">Fica no lado esquerdo da tela.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-violet-50 rounded-lg p-4 border border-violet-200">
                <Key className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
                <div className="w-full space-y-3">
                  <p className="font-medium text-violet-900">4. Adicione esta variavel:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">No campo "Key":</p>
                      <CopyBlock code="BACKEND_URL" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">No campo "Value":</p>
                      <CopyBlock code="https://petrobras-backend-api.onrender.com" />
                    </div>
                  </div>
                  <Alert className="border-red-300 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 text-xs">
                      <strong>ATENCAO:</strong> NAO coloque barra <code>/</code> no final do endereco!
                      <br />Certo: <code>https://petrobras-backend-api.onrender.com</code>
                      <br />Errado: <code>https://petrobras-backend-api.onrender.com/</code>
                    </AlertDescription>
                  </Alert>
                  <p className="text-slate-600">Clique em <strong>Save</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <MousePointer className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">5. Faca um Redeploy</p>
                  <p className="text-slate-600 mt-1">
                    Va na aba <strong>Deployments</strong>, clique nos <strong>3 pontinhos</strong> do ultimo deploy,
                    e clique em <strong>Redeploy</strong>. Isso faz o frontend reiniciar com a nova variavel.
                  </p>
                </div>
              </div>
            </div>

            {/* Diagrama visual */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
              <p className="font-medium text-slate-900 mb-3">Como fica o caminho completo de uma requisicao:</p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg">Voce clica num botao</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="bg-slate-800 text-white px-3 py-2 rounded-lg">Vercel recebe</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="bg-violet-100 text-violet-800 px-3 py-2 rounded-lg">Render processa</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="bg-cyan-100 text-cyan-800 px-3 py-2 rounded-lg">Neon guarda/busca dados</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* =========================================== */}
        {/* PASSO 8 - Verificar tudo */}
        {/* =========================================== */}
        <Card className="mb-8 border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <StepNumber n={8} />
              Verificar se tudo esta conectado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <p className="text-slate-600">Agora que tudo esta publicado, vamos verificar se as 3 partes estao conversando entre si.</p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <Eye className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">1. Abra seu site na Vercel</p>
                  <p className="text-slate-600 mt-1">
                    O endereco e algo como <code className="bg-slate-200 px-1 rounded">https://layout-petrobras-e-mail.vercel.app</code>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <Eye className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">2. Tente fazer login</p>
                  <p className="text-slate-600 mt-1">
                    Se o login funcionar, significa que: o frontend falou com o backend (Render), 
                    que falou com o banco (Neon), que verificou o usuario. Tudo conectado!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                <Eye className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">3. Se algo der erro, abra o log do Render</p>
                  <p className="text-slate-600 mt-1">
                    No Dashboard do Render, clique no seu servico, depois em <strong>Logs</strong> (menu lateral).
                    Ali voce ve tudo que esta acontecendo. Se tiver erro, ele aparece em vermelho.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* =========================================== */}
        {/* PROBLEMAS COMUNS */}
        {/* =========================================== */}
        <Card className="mb-8 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-amber-800">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              Problemas Comuns (e como resolver)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-slate-700">

            <div className="bg-red-50 rounded-lg p-4 border border-red-200 space-y-2">
              <p className="font-bold text-red-800">{"\"No module named 'app'\""}</p>
              <p className="text-red-700"><strong>O que aconteceu:</strong> O Render esta tentando rodar o codigo na pasta errada.</p>
              <p className="text-red-700"><strong>Como resolver:</strong> Va em Settings do seu Web Service e mude o <strong>Root Directory</strong> para <code className="bg-red-100 px-1 rounded">backend</code>.</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200 space-y-2">
              <p className="font-bold text-red-800">{"\"Build failed\" com mensagem de 'pip.ini' ou 'Nexus'"}</p>
              <p className="text-red-700"><strong>O que aconteceu:</strong> O arquivo <code>pip.ini</code> aponta para o Nexus da Petrobras, que e uma rede interna. O Render nao tem acesso.</p>
              <p className="text-red-700"><strong>Como resolver:</strong> Nao precisa fazer nada! Quando voce usa Runtime "Python 3" (sem Docker), o Render ignora o pip.ini e baixa do PyPI publico. Se estiver usando Docker, o Dockerfile ja trata isso automaticamente.</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200 space-y-2">
              <p className="font-bold text-red-800">{"\"connection refused\" ou erro de banco de dados"}</p>
              <p className="text-red-700"><strong>O que aconteceu:</strong> A variavel DATABASE_URL esta errada ou faltando.</p>
              <p className="text-red-700"><strong>Como resolver:</strong> Va em Environment no Render, confira se DATABASE_URL esta la e se termina com <code className="bg-red-100 px-1 rounded">?sslmode=require</code>. O Neon exige SSL.</p>
            </div>

            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 space-y-2">
              <p className="font-bold text-amber-800">O site demora 30 segundos pra carregar</p>
              <p className="text-amber-700"><strong>O que aconteceu:</strong> No plano Free, o servidor "dorme" depois de 15 min sem uso. E normal.</p>
              <p className="text-amber-700"><strong>Como resolver:</strong> Ou use o plano Starter ($7/mes), ou crie um health check gratuito no <a href="https://uptimerobot.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">UptimeRobot</a> para fazer ping a cada 14 minutos (assim ele nunca dorme).</p>
            </div>

            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 space-y-2">
              <p className="font-bold text-amber-800">Frontend mostra erro 500 ou "Failed to fetch"</p>
              <p className="text-amber-700"><strong>O que aconteceu:</strong> O frontend nao esta conseguindo falar com o backend.</p>
              <p className="text-amber-700"><strong>Como resolver:</strong> Verifique na Vercel se a variavel <code className="bg-amber-100 px-1 rounded">BACKEND_URL</code> esta correta (sem barra no final). Depois faca um Redeploy.</p>
            </div>

            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 space-y-2">
              <p className="font-bold text-amber-800">Erro de CORS no console do navegador</p>
              <p className="text-amber-700"><strong>O que aconteceu:</strong> O backend esta bloqueando requisicoes do frontend.</p>
              <p className="text-amber-700"><strong>Como resolver:</strong> Isso nao deveria acontecer porque as requisicoes vao de Vercel (servidor) para Render (servidor), nao do navegador direto. Se acontecer, verifique se voce nao esta chamando o Render direto do frontend em vez de usar os proxies <code className="bg-amber-100 px-1 rounded">/api/*</code>.</p>
            </div>
          </CardContent>
        </Card>

        {/* =========================================== */}
        {/* ATUALIZACOES FUTURAS */}
        {/* =========================================== */}
        <Card className="mb-8 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-blue-600" />
              E quando eu atualizar o codigo?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p className="leading-relaxed">
              O Render faz deploy automatico. Isso quer dizer que toda vez que voce (ou o v0) fizer um <code className="bg-slate-100 px-1 rounded">push</code> para 
              a branch <code className="bg-slate-100 px-1 rounded">main</code> no GitHub, o Render detecta a mudanca e atualiza sozinho. Voce nao precisa fazer nada.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono bg-slate-50 p-3 rounded-lg">
              <span className="bg-slate-800 text-white px-3 py-1.5 rounded">Voce muda o codigo</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="bg-slate-200 text-slate-800 px-3 py-1.5 rounded">Push pro GitHub</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="bg-violet-100 text-violet-800 px-3 py-1.5 rounded">Render detecta (1 min)</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded">Instala (2-5 min)</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded">No ar!</span>
            </div>
          </CardContent>
        </Card>

        {/* =========================================== */}
        {/* CHECKLIST */}
        {/* =========================================== */}
        <Card className="mb-8 border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-green-800">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Checklist - Marque cada item que voce completou
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-green-800">
            <div className="grid grid-cols-1 gap-2">
              {[
                "Criei minha conta no Render (com GitHub)",
                "Criei um Web Service",
                "Conectei o repositorio correto",
                "Root Directory = backend",
                "Build Command = pip install -r requirements.txt",
                "Start Command = uvicorn app.main:app --host 0.0.0.0 --port $PORT",
                "Adicionei DATABASE_URL (copiada do Neon)",
                "Adicionei JWT_SECRET_KEY (valor aleatorio longo)",
                "Adicionei PYTHON_VERSION = 3.12.0",
                "Cliquei em Create Web Service",
                "Aguardei e apareceu \"Live\" em verde",
                "Abri a URL no navegador e vi {\"status\":\"ok\"}",
                "Abri /docs e vi o Swagger",
                "Na Vercel, adicionei BACKEND_URL com a URL do Render",
                "Fiz Redeploy na Vercel",
                "Testei o login no frontend e funcionou",
              ].map((item, i) => (
                <label key={i} className="flex items-start gap-3 cursor-pointer hover:bg-green-100/50 rounded p-2 transition-colors">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-green-400 text-green-600 focus:ring-green-500" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Links uteis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <a href="https://docs.render.com/deploy-fastapi" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 rounded-lg p-4 transition-colors hover:bg-blue-100">
            <ExternalLink className="h-4 w-4 shrink-0" />
            Documentacao oficial do Render para FastAPI
          </a>
          <a href="https://console.neon.tech" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-lg p-4 transition-colors hover:bg-cyan-100">
            <Database className="h-4 w-4 shrink-0" />
            Painel do Banco de Dados (Neon)
          </a>
          <a href="https://dashboard.render.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-800 bg-violet-50 border border-violet-200 rounded-lg p-4 transition-colors hover:bg-violet-100">
            <Server className="h-4 w-4 shrink-0" />
            Painel do Render
          </a>
        </div>
      </div>
    </div>
  )
}
