"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, Wrench, Info, CheckCircle2, AlertTriangle, Copy } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

function CopyBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="group relative">
      {label && <p className="mb-1 text-sm font-medium text-slate-600">{label}</p>}
      <div className="flex items-start gap-2 rounded-lg bg-slate-900 p-4 font-mono text-sm text-green-400">
        <pre className="flex-1 overflow-x-auto whitespace-pre-wrap">{code}</pre>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
        >
          {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function ExplainBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription>
        <strong className="text-blue-800">{title}</strong>
        <p className="mt-1 text-blue-700">{children}</p>
      </AlertDescription>
    </Alert>
  )
}

function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">{children}</AlertDescription>
    </Alert>
  )
}

export default function InstalarBackendPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Voltar */}
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Voltar para Wiki
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
            <Wrench className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-slate-900">Instalar e Rodar o Backend</h1>
          <p className="text-lg text-slate-600">
            Passo a passo para quem nunca fez isso antes - do zero ate ver a API rodando
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-green-100 text-green-700">Python</Badge>
            <Badge className="bg-blue-100 text-blue-700">FastAPI</Badge>
            <Badge className="bg-amber-100 text-amber-700">Passo a Passo</Badge>
            <Badge className="bg-slate-100 text-slate-700">Para Iniciantes</Badge>
          </div>
        </div>

        {/* O que voce vai precisar */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">O que voce vai precisar antes de comecar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-green-700">
            <p>1. Um computador com Windows, Mac ou Linux</p>
            <p>2. Internet funcionando</p>
            <p>3. Acesso ao repositorio do projeto no GitHub</p>
            <p>4. Cerca de 20 minutos de calma e paciencia</p>
          </CardContent>
        </Card>

        <div className="space-y-8">

          {/* ====================================== */}
          {/* PASSO 1 - INSTALAR PYTHON */}
          {/* ====================================== */}
          <Card>
            <CardHeader>
              <Badge className="mb-2 w-fit bg-blue-600 text-white">Passo 1 de 8</Badge>
              <CardTitle className="text-2xl">Instalar o Python</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExplainBox title="O que e o Python?">
                Python e a linguagem de programacao que o nosso backend usa. E como se fosse o
                idioma que o computador precisa entender para rodar a nossa API.
                Sem ele instalado, nada funciona.
              </ExplainBox>

              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-semibold text-slate-800">No Windows:</h4>
                <ol className="list-inside list-decimal space-y-2 text-slate-600">
                  <li>Abra o navegador e va em: <strong>python.org/downloads</strong></li>
                  <li>Clique no botao amarelo grande {"\"Download Python 3.12\""}
                  </li>
                  <li>Quando baixar, clique duas vezes no arquivo para abrir o instalador</li>
                  <li>
                    <strong className="text-red-600">MUITO IMPORTANTE:</strong> Na primeira tela do instalador,
                    marque a caixinha que diz {'"Add Python to PATH"'} (fica embaixo, na parte de baixo da tela)
                  </li>
                  <li>Clique em {'"Install Now"'}</li>
                  <li>Espere terminar e clique em {'"Close"'}</li>
                </ol>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-semibold text-slate-800">No Mac:</h4>
                <ol className="list-inside list-decimal space-y-2 text-slate-600">
                  <li>Abra o <strong>Terminal</strong> (aperte Command + Espaco, digite {'"Terminal"'} e aperte Enter)</li>
                  <li>Digite este comando e aperte Enter:</li>
                </ol>
                <div className="mt-2">
                  <CopyBlock code="brew install python@3.12" />
                </div>
                <p className="mt-2 text-sm text-slate-500">Se nao tiver o brew, va em brew.sh e siga as instrucoes de la primeiro.</p>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-semibold text-slate-800">No Linux (Ubuntu/Debian):</h4>
                <CopyBlock code="sudo apt update && sudo apt install python3.12 python3.12-venv python3-pip -y" />
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-green-800">Como saber se deu certo?</h4>
                <p className="mb-2 text-green-700">Abra o terminal/prompt e digite:</p>
                <CopyBlock code="python --version" />
                <p className="mt-2 text-green-700">
                  Deve aparecer algo como: <code className="rounded bg-green-200 px-2 py-1">Python 3.12.x</code>
                </p>
                <p className="mt-1 text-sm text-green-600">No Mac/Linux, talvez precise digitar <code>python3 --version</code></p>
              </div>
            </CardContent>
          </Card>

          {/* ====================================== */}
          {/* PASSO 2 - INSTALAR GIT */}
          {/* ====================================== */}
          <Card>
            <CardHeader>
              <Badge className="mb-2 w-fit bg-blue-600 text-white">Passo 2 de 8</Badge>
              <CardTitle className="text-2xl">Instalar o Git</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExplainBox title="O que e o Git?">
                Git e um programa que baixa e gerencia o codigo do projeto.
                Pense nele como um aplicativo que faz download do projeto e mantem tudo organizado.
              </ExplainBox>

              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-semibold text-slate-800">No Windows:</h4>
                <ol className="list-inside list-decimal space-y-2 text-slate-600">
                  <li>Va em: <strong>git-scm.com</strong></li>
                  <li>Clique em {'"Download for Windows"'}</li>
                  <li>Instale clicando {'"Next"'} em tudo (pode manter tudo padrao)</li>
                </ol>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-semibold text-slate-800">No Mac:</h4>
                <CopyBlock code="brew install git" />
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-semibold text-slate-800">No Linux:</h4>
                <CopyBlock code="sudo apt install git -y" />
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-green-800">Como saber se deu certo?</h4>
                <CopyBlock code="git --version" />
                <p className="mt-2 text-green-700">
                  Deve aparecer algo como: <code className="rounded bg-green-200 px-2 py-1">git version 2.x.x</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ====================================== */}
          {/* PASSO 3 - BAIXAR O PROJETO */}
          {/* ====================================== */}
          <Card>
            <CardHeader>
              <Badge className="mb-2 w-fit bg-blue-600 text-white">Passo 3 de 8</Badge>
              <CardTitle className="text-2xl">Baixar o Projeto para o seu Computador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExplainBox title="O que vamos fazer aqui?">
                Vamos usar o Git para baixar todo o codigo do projeto do GitHub para o seu computador.
                E como fazer download de uma pasta compartilhada, so que usando o terminal.
              </ExplainBox>

              <p className="text-slate-600">
                Abra o terminal (no Windows: aperte a tecla Windows, digite {'"cmd"'} e aperte Enter).
              </p>

              <div className="space-y-3">
                <CopyBlock
                  label="Primeiro, va para a pasta onde quer guardar o projeto (ex: Documentos):"
                  code="cd ~/Documents"
                />

                <CopyBlock
                  label="Agora, baixe o projeto:"
                  code="git clone https://github.com/tecnologiawebnetsystem/layout-petrobras-e-mail.git"
                />

                <CopyBlock
                  label="Entre na pasta do projeto:"
                  code="cd layout-petrobras-e-mail"
                />

                <CopyBlock
                  label="Agora entre na pasta do backend:"
                  code="cd backend"
                />
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-green-800">Como saber se deu certo?</h4>
                <p className="text-green-700">
                  Se voce digitar <code className="rounded bg-green-200 px-2 py-1">dir</code> (Windows) ou{" "}
                  <code className="rounded bg-green-200 px-2 py-1">ls</code> (Mac/Linux), deve ver arquivos como:
                  <code className="ml-1 rounded bg-green-200 px-2 py-1">requirements.txt</code>,{" "}
                  <code className="rounded bg-green-200 px-2 py-1">Dockerfile</code> e a pasta{" "}
                  <code className="rounded bg-green-200 px-2 py-1">app/</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ====================================== */}
          {/* PASSO 4 - CRIAR AMBIENTE VIRTUAL */}
          {/* ====================================== */}
          <Card>
            <CardHeader>
              <Badge className="mb-2 w-fit bg-blue-600 text-white">Passo 4 de 8</Badge>
              <CardTitle className="text-2xl">Criar o Ambiente Virtual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExplainBox title="O que e um ambiente virtual?">
                Imagina que seu computador e uma casa grande. O ambiente virtual e como criar
                um quartinho separado so para este projeto, com suas proprias ferramentas.
                Isso evita que as ferramentas de um projeto atrapalhem outro.
              </ExplainBox>

              <WarnBox>
                Voce precisa estar dentro da pasta <code>backend/</code> para estes comandos funcionarem.
                Se nao estiver, digite: <code>cd backend</code>
              </WarnBox>

              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-semibold text-slate-800">No Windows:</h4>
                <div className="space-y-3">
                  <CopyBlock label="Criar o ambiente virtual:" code="python -m venv venv" />
                  <CopyBlock label="Ativar o ambiente virtual:" code="venv\Scripts\activate" />
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-semibold text-slate-800">No Mac / Linux:</h4>
                <div className="space-y-3">
                  <CopyBlock label="Criar o ambiente virtual:" code="python3 -m venv venv" />
                  <CopyBlock label="Ativar o ambiente virtual:" code="source venv/bin/activate" />
                </div>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-green-800">Como saber se deu certo?</h4>
                <p className="text-green-700">
                  Voce vai ver <code className="rounded bg-green-200 px-2 py-1">(venv)</code> no comeco da linha do terminal.
                  Isso significa que o ambiente virtual esta ativo.
                </p>
                <p className="mt-1 text-sm text-green-600">
                  Exemplo: <code className="rounded bg-green-100 px-2 py-1">(venv) C:\Users\kleber\backend&gt;</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ====================================== */}
          {/* PASSO 5 - INSTALAR DEPENDENCIAS */}
          {/* ====================================== */}
          <Card>
            <CardHeader>
              <Badge className="mb-2 w-fit bg-blue-600 text-white">Passo 5 de 8</Badge>
              <CardTitle className="text-2xl">Instalar as Dependencias (bibliotecas)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExplainBox title="O que sao dependencias?">
                Sao como ingredientes de uma receita. O nosso backend precisa de varias
                bibliotecas (ferramentas prontas) para funcionar - banco de dados, seguranca,
                envio de email, etc. O arquivo requirements.txt e a lista de ingredientes.
              </ExplainBox>

              <WarnBox>
                Certifique-se de que o ambiente virtual esta ativo (voce ve <code>(venv)</code> no terminal).
                Se nao estiver, volte ao Passo 4 e ative.
              </WarnBox>

              <CopyBlock
                label="Instale tudo de uma vez com este comando:"
                code="pip install -r requirements.txt"
              />

              <p className="text-slate-600">
                Isso vai demorar de 1 a 3 minutos. Vai aparecer um monte de texto na tela -
                e normal. Espere ate aparecer uma linha vazia de novo.
              </p>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-green-800">Como saber se deu certo?</h4>
                <p className="mb-2 text-green-700">No final, nao pode ter mensagem em vermelho com a palavra {'"ERROR"'}.</p>
                <p className="text-green-700">Para confirmar, digite:</p>
                <CopyBlock code="pip list | head -5" />
                <p className="mt-2 text-green-700">
                  Deve aparecer uma lista de pacotes instalados como <code className="rounded bg-green-200 px-2 py-1">fastapi</code>,{" "}
                  <code className="rounded bg-green-200 px-2 py-1">uvicorn</code>,{" "}
                  <code className="rounded bg-green-200 px-2 py-1">sqlmodel</code>, etc.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ====================================== */}
          {/* PASSO 6 - CONFIGURAR .ENV */}
          {/* ====================================== */}
          <Card>
            <CardHeader>
              <Badge className="mb-2 w-fit bg-blue-600 text-white">Passo 6 de 8</Badge>
              <CardTitle className="text-2xl">Configurar o Arquivo .env (variaveis secretas)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExplainBox title="O que e o arquivo .env?">
                E um arquivo com informacoes secretas que o backend precisa para funcionar - como a senha
                do banco de dados, chaves de seguranca, etc. E como um cofre de senhas que so
                o seu computador conhece. NUNCA compartilhe este arquivo com ninguem.
              </ExplainBox>

              <div className="space-y-3">
                <CopyBlock
                  label="Copie o arquivo de exemplo para criar o seu .env:"
                  code={`cp .env.example .env`}
                />
                <p className="text-sm text-slate-500">No Windows, use: <code>copy .env.example .env</code></p>
              </div>

              <p className="font-medium text-slate-700">
                Agora abra o arquivo <code>.env</code> em qualquer editor de texto (Bloco de Notas, VS Code, etc.)
                e preencha:
              </p>

              <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h4 className="mb-2 font-semibold text-red-800">OBRIGATORIO - Banco de Dados:</h4>
                  <CopyBlock code="DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require" />
                  <p className="mt-2 text-sm text-red-700">
                    <strong>Onde encontrar:</strong> Abra o Neon Dashboard (console.neon.tech) {">"} seu projeto {">"} Connection Details {">"} copie a Connection String.
                  </p>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h4 className="mb-2 font-semibold text-red-800">OBRIGATORIO - Chave de Seguranca:</h4>
                  <CopyBlock code="JWT_SECRET_KEY=cole-aqui-uma-chave-aleatoria-grande" />
                  <p className="mt-2 text-sm text-red-700">
                    <strong>Como gerar:</strong> No terminal (com venv ativo), rode:
                  </p>
                  <div className="mt-1">
                    <CopyBlock code='python -c "import secrets; print(secrets.token_hex(32))"' />
                  </div>
                  <p className="mt-1 text-sm text-red-700">Copie o resultado e cole no lugar.</p>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold text-slate-800">Os demais podem ficar como estao (valores padrao para desenvolvimento):</h4>
                  <CopyBlock code={`STORAGE_PROVIDER=local
AUTH_MODE=local
EMAIL_PROVIDER=dev
FRONTEND_EXTERNAL_PORTAL_URL=http://localhost:3000`} />
                </div>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-green-800">Como saber se deu certo?</h4>
                <p className="text-green-700">
                  O arquivo <code className="rounded bg-green-200 px-2 py-1">.env</code> deve existir na pasta{" "}
                  <code className="rounded bg-green-200 px-2 py-1">backend/</code> e ter pelo menos as linhas{" "}
                  <code className="rounded bg-green-200 px-2 py-1">DATABASE_URL=...</code> e{" "}
                  <code className="rounded bg-green-200 px-2 py-1">JWT_SECRET_KEY=...</code> preenchidas.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ====================================== */}
          {/* PASSO 7 - RODAR O BACKEND */}
          {/* ====================================== */}
          <Card className="border-green-200">
            <CardHeader>
              <Badge className="mb-2 w-fit bg-green-600 text-white">Passo 7 de 8 - O GRANDE MOMENTO</Badge>
              <CardTitle className="text-2xl">Rodar o Backend!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExplainBox title="O que vai acontecer?">
                Voce vai ligar o servidor. A partir deste momento, o backend vai estar rodando
                no seu computador e esperando requisicoes na porta 8000.
                E como ligar o motor de um carro.
              </ExplainBox>

              <CopyBlock
                label="Digite este comando e aperte Enter:"
                code="uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
              />

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-green-800">O que deve aparecer na tela:</h4>
                <div className="rounded bg-slate-900 p-3 font-mono text-sm text-green-400">
                  <p>INFO:     Uvicorn running on http://0.0.0.0:8000</p>
                  <p>INFO:     Started reloader process</p>
                  <p>INFO:     Started server process</p>
                  <p>INFO:     Application startup complete.</p>
                </div>
                <p className="mt-2 text-green-700">
                  Se voce viu <strong>{"\"Application startup complete\""}</strong>, deu tudo certo!
                </p>
              </div>

              <WarnBox>
                Nao feche este terminal! Se fechar, o backend para. Deixe ele aberto enquanto estiver trabalhando.
                Para parar o backend quando quiser, aperte <code>Ctrl + C</code> neste terminal.
              </WarnBox>

              <p className="text-slate-600">
                O <code>--reload</code> faz com que, se voce alterar qualquer arquivo do backend,
                ele reinicie automaticamente. Muito util durante o desenvolvimento.
              </p>
            </CardContent>
          </Card>

          {/* ====================================== */}
          {/* PASSO 8 - TESTAR */}
          {/* ====================================== */}
          <Card>
            <CardHeader>
              <Badge className="mb-2 w-fit bg-blue-600 text-white">Passo 8 de 8</Badge>
              <CardTitle className="text-2xl">Testar se esta Funcionando</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExplainBox title="Como testar?">
                Vamos abrir o navegador e acessar o backend. Se ele responder, esta tudo certo.
                E como ligar para um restaurante para ver se estao abertos.
              </ExplainBox>

              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold text-slate-800">Teste 1 - Health Check (esta vivo?)</h4>
                  <p className="mb-2 text-slate-600">Abra o navegador e acesse:</p>
                  <CopyBlock code="http://localhost:8000/" />
                  <p className="mt-2 text-slate-600">
                    Deve aparecer:{" "}
                    <code className="rounded bg-green-100 px-2 py-1 text-green-800">{`{"status":"ok","storage":"local"}`}</code>
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold text-slate-800">Teste 2 - Versao da API</h4>
                  <p className="mb-2 text-slate-600">Acesse:</p>
                  <CopyBlock code="http://localhost:8000/api/v1" />
                  <p className="mt-2 text-slate-600">
                    Deve aparecer:{" "}
                    <code className="rounded bg-green-100 px-2 py-1 text-green-800">{`{"version":"001","sytem":"active"}`}</code>
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="mb-2 font-semibold text-blue-800">Teste 3 - Swagger (documentacao interativa da API)</h4>
                  <p className="mb-2 text-blue-700">Acesse:</p>
                  <CopyBlock code="http://localhost:8000/docs" />
                  <p className="mt-2 text-blue-700">
                    Vai abrir uma pagina bonita com todos os endpoints da API listados.
                    Voce pode clicar em cada um e testar direto pelo navegador.
                    E a documentacao automatica do FastAPI.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ====================================== */}
          {/* PROBLEMAS COMUNS */}
          {/* ====================================== */}
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-xl text-amber-800">Problemas Comuns e Solucoes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold text-slate-800">
                  {'"python" nao e reconhecido como comando'}
                </h4>
                <p className="text-slate-600">
                  <strong>Causa:</strong> Python nao foi adicionado ao PATH durante a instalacao.
                </p>
                <p className="text-slate-600">
                  <strong>Solucao:</strong> Desinstale o Python, instale de novo e dessa vez <strong>marque a caixinha
                  {' "Add Python to PATH"'}</strong> na primeira tela do instalador.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold text-slate-800">
                  {'"pip install" da erro de permissao'}
                </h4>
                <p className="text-slate-600">
                  <strong>Causa:</strong> Voce nao ativou o ambiente virtual.
                </p>
                <p className="text-slate-600">
                  <strong>Solucao:</strong> Volte ao Passo 4 e ative o ambiente virtual. Voce deve ver <code>(venv)</code> no terminal.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold text-slate-800">
                  {'"Error: Could not build wheels for psycopg"'}
                </h4>
                <p className="text-slate-600">
                  <strong>Causa:</strong> Falta o driver do PostgreSQL no sistema.
                </p>
                <p className="mb-2 text-slate-600"><strong>Solucao Windows:</strong></p>
                <CopyBlock code="pip install psycopg[binary]" />
                <p className="mt-2 mb-2 text-slate-600"><strong>Solucao Mac:</strong></p>
                <CopyBlock code="brew install libpq && pip install psycopg[binary]" />
                <p className="mt-2 mb-2 text-slate-600"><strong>Solucao Linux:</strong></p>
                <CopyBlock code="sudo apt install libpq-dev && pip install psycopg[binary]" />
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold text-slate-800">
                  {'O backend inicia mas da erro "could not translate host name" ou "connection refused"'}
                </h4>
                <p className="text-slate-600">
                  <strong>Causa:</strong> O DATABASE_URL esta errado ou o Neon esta fora do ar.
                </p>
                <p className="text-slate-600">
                  <strong>Solucao:</strong> Abra o arquivo <code>.env</code> e confira se o DATABASE_URL esta correto.
                  Va no Neon Dashboard (console.neon.tech), copie a Connection String novamente e cole.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold text-slate-800">
                  {'A porta 8000 ja esta em uso ("Address already in use")'}
                </h4>
                <p className="mb-2 text-slate-600">
                  <strong>Causa:</strong> Outro programa ja esta usando a porta 8000.
                </p>
                <p className="mb-2 text-slate-600"><strong>Solucao 1:</strong> Use outra porta:</p>
                <CopyBlock code="uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload" />
                <p className="mt-2 mb-2 text-slate-600"><strong>Solucao 2:</strong> Mate o processo que esta usando a porta:</p>
                <CopyBlock code={`# Windows\nnetstat -ano | findstr :8000\ntaskkill /PID NUMERO_DO_PID /F\n\n# Mac/Linux\nlsof -i :8000\nkill -9 NUMERO_DO_PID`} />
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold text-slate-800">
                  {'"ModuleNotFoundError: No module named app"'}
                </h4>
                <p className="text-slate-600">
                  <strong>Causa:</strong> Voce nao esta na pasta <code>backend/</code>.
                </p>
                <p className="text-slate-600">
                  <strong>Solucao:</strong> Confira que esta dentro da pasta certa: <code>cd backend</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ====================================== */}
          {/* RESUMO RAPIDO */}
          {/* ====================================== */}
          <Card className="border-slate-300 bg-slate-50">
            <CardHeader>
              <CardTitle className="text-xl">Resumo Rapido (cola aqui na parede)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-slate-600">Depois de configurado, da proxima vez que quiser rodar o backend, sao so 3 comandos:</p>
              <CopyBlock code={`cd backend\n${typeof window !== "undefined" && navigator.platform?.includes("Win") ? "venv\\Scripts\\activate" : "source venv/bin/activate"}\nuvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`} />
              <p className="mt-3 text-slate-600">
                Depois acesse <code className="rounded bg-slate-200 px-2 py-1">http://localhost:8000/docs</code> para ver o Swagger.
              </p>
            </CardContent>
          </Card>

          {/* ====================================== */}
          {/* PROXIMOS PASSOS */}
          {/* ====================================== */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-xl text-blue-800">Proximos Passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-blue-700">
              <p>Com o backend rodando localmente, voce pode:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Rodar o frontend Next.js (<code>npm run dev</code> na raiz do projeto) - ele vai se conectar ao backend em <code>localhost:8000</code></li>
                <li>Testar endpoints pelo Swagger em <code>localhost:8000/docs</code></li>
                <li>Publicar na internet via <Link href="/wiki-dev/deploy-render" className="underline font-semibold">Render.com</Link></li>
                <li>Publicar em container via <Link href="/wiki-dev/deploy-containers" className="underline font-semibold">Docker + AWS</Link></li>
              </ul>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
