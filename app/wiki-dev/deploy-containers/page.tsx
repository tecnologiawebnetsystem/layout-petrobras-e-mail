"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, Container, AlertTriangle, CheckCircle2, Copy, ChevronDown, ChevronRight, Info } from "lucide-react"
import Link from "next/link"

function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative group mt-3">
      {title && <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{title}</p>}
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        className="absolute right-3 top-3 rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 opacity-0 transition group-hover:opacity-100"
      >
        {copied ? "Copiado!" : <Copy className="h-3 w-3" />}
      </button>
      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(number <= 2)
  return (
    <Card className="border-slate-200 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg">
          {number}
        </div>
        <span className="font-semibold text-slate-900 flex-1 text-lg">{title}</span>
        {open ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
      </button>
      {open && <CardContent className="pt-0 pb-6 border-t border-slate-100"><div className="pt-4 space-y-4">{children}</div></CardContent>}
    </Card>
  )
}

function Explain({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg bg-blue-50 border border-blue-200 p-4">
      <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
      <div className="text-sm text-blue-800 leading-relaxed">{children}</div>
    </div>
  )
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-sm text-amber-800 leading-relaxed">{children}</div>
    </div>
  )
}

export default function DeployContainersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" /> Voltar para Wiki
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg">
            <Container className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-slate-900">Como Publicar o Sistema na AWS com Docker</h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Guia passo a passo completo - do zero ate o sistema rodando na nuvem.
            Escrito para quem nunca fez deploy antes.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-blue-100 text-blue-700">Docker</Badge>
            <Badge className="bg-orange-100 text-orange-700">AWS</Badge>
            <Badge className="bg-green-100 text-green-700">Passo a Passo</Badge>
            <Badge className="bg-red-100 text-red-700">Resolve Nexus</Badge>
          </div>
        </div>

        {/* O que vamos fazer */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Antes de comecar: o que vamos fazer?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-blue-800 text-sm leading-relaxed">
            <p>
              Nosso sistema tem <strong>duas partes</strong>: o <strong>Frontend</strong> (o site que o usuario ve, feito em Next.js)
              e o <strong>Backend</strong> (a API que processa dados, feita em Python/FastAPI).
            </p>
            <p>
              Vamos colocar cada parte dentro de um <strong>container Docker</strong> (pense nele como uma "caixa" que contem tudo que o programa precisa para rodar)
              e enviar essas caixas para a <strong>AWS</strong> (a nuvem da Amazon), onde elas vao ficar rodando 24 horas por dia.
            </p>
            <p className="font-semibold">
              Por que fazer assim? Porque o Nexus (repositorio interno da Petrobras) causa problemas quando a AWS tenta baixar
              as dependencias diretamente. Entao nos baixamos tudo na nossa maquina (onde o Nexus funciona) e enviamos a
              caixa ja pronta para a AWS.
            </p>

            <div className="rounded-lg bg-white p-5 font-mono text-xs leading-loose text-slate-700 mt-4">
              <p className="font-bold text-blue-700 mb-2">{'RESUMO DO FLUXO:'}</p>
              <p>{'1. Sua maquina (tem acesso ao Nexus)'}</p>
              <p className="pl-4">{'-> Baixa todas as dependencias (npm install, pip install)'}</p>
              <p className="pl-4">{'-> Empacota tudo dentro de uma imagem Docker'}</p>
              <p className="pl-4">{'-> Envia a imagem pronta para a AWS'}</p>
              <p className="mt-2">{'2. AWS (NAO precisa do Nexus)'}</p>
              <p className="pl-4">{'-> Recebe a imagem ja pronta'}</p>
              <p className="pl-4">{'-> Roda o container 24h'}</p>
              <p className="pl-4">{'-> Usuarios acessam pelo navegador'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Pre-requisitos */}
        <Card className="mb-8 border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">O que voce precisa ter ANTES de comecar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <span><strong>Um computador</strong> com Windows 10/11, macOS ou Linux</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <span><strong>O codigo do projeto</strong> baixado na sua maquina (clone do GitHub)</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <span><strong>Acesso a internet</strong> (e acesso ao Nexus da Petrobras, se estiver na rede interna)</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <span><strong>Uma conta AWS</strong> com permissoes (pecar ao administrador de infra da Petrobras)</span>
            </div>
          </CardContent>
        </Card>

        {/* ============================================= */}
        {/* PASSOS */}
        {/* ============================================= */}
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Fase 1: Preparar na sua maquina</h2>
        <div className="space-y-4 mb-10">

          {/* PASSO 1 */}
          <Step number={1} title="Instalar o Docker na sua maquina">
            <Explain>
              <strong>O que e o Docker?</strong> E um programa que cria "caixas isoladas" (containers) para rodar aplicacoes.
              Cada caixa tem tudo que o programa precisa: codigo, bibliotecas, configuracoes. Assim voce garante que
              o programa vai rodar igual na sua maquina e na AWS.
            </Explain>

            <h4 className="font-semibold text-slate-800">Se voce usa Windows:</h4>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal pl-5">
              <li>Abra o navegador e va em: <strong>docker.com/products/docker-desktop</strong></li>
              <li>Clique no botao azul <strong>"Download for Windows"</strong></li>
              <li>Abra o arquivo baixado e siga o instalador (Next, Next, Install)</li>
              <li>Quando pedir para reiniciar o computador, <strong>reinicie</strong></li>
              <li>Depois de reiniciar, abra o <strong>Docker Desktop</strong> - ele aparece na barra de tarefas (icone de baleia)</li>
              <li>Espere ate o icone ficar <strong>verde</strong> (significa que o Docker esta pronto)</li>
            </ol>

            <h4 className="font-semibold text-slate-800">Se voce usa Linux (Ubuntu):</h4>
            <p className="text-sm text-slate-600">Abra o Terminal (Ctrl+Alt+T) e cole esses comandos um por um:</p>
            <CodeBlock code={`sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER`} />
            <p className="text-sm text-slate-500">Depois de rodar, <strong>feche o terminal e abra de novo</strong> (ou reinicie o computador).</p>

            <h4 className="font-semibold text-slate-800">Verificar se funcionou:</h4>
            <p className="text-sm text-slate-600">Abra o Terminal (ou PowerShell no Windows) e digite:</p>
            <CodeBlock code={`docker --version`} />
            <p className="text-sm text-slate-600">Se aparecer algo como <code>Docker version 24.x.x</code>, esta tudo certo.</p>
          </Step>

          {/* PASSO 2 */}
          <Step number={2} title="Instalar o AWS CLI (ferramenta de linha de comando da Amazon)">
            <Explain>
              <strong>O que e o AWS CLI?</strong> E uma ferramenta que permite conversar com a Amazon (AWS) pelo terminal.
              Vamos usar ela para enviar nossas imagens Docker para la e gerenciar o deploy.
            </Explain>

            <h4 className="font-semibold text-slate-800">Se voce usa Windows:</h4>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal pl-5">
              <li>Abra o navegador e va em: <strong>aws.amazon.com/cli</strong></li>
              <li>Clique em <strong>"Download and install AWS CLI"</strong> - escolha Windows (64-bit)</li>
              <li>Abra o arquivo .msi e siga o instalador (Next, Next, Install)</li>
              <li><strong>Feche e abra o PowerShell</strong> novamente</li>
            </ol>

            <h4 className="font-semibold text-slate-800">Se voce usa Linux:</h4>
            <CodeBlock code={`curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install`} />

            <h4 className="font-semibold text-slate-800">Verificar se funcionou:</h4>
            <CodeBlock code={`aws --version`} />
            <p className="text-sm text-slate-600">Se aparecer algo como <code>aws-cli/2.x.x</code>, esta funcionando.</p>

            <h4 className="font-semibold text-slate-800">Configurar suas credenciais AWS:</h4>
            <p className="text-sm text-slate-600">
              Voce vai precisar de 2 chaves que o administrador AWS da Petrobras fornece.
              No terminal, digite:
            </p>
            <CodeBlock code={`aws configure`} />
            <p className="text-sm text-slate-600">O programa vai perguntar 4 coisas. Responda assim:</p>
            <div className="rounded-lg bg-slate-100 p-4 text-sm font-mono space-y-1">
              <p><span className="text-slate-500">AWS Access Key ID:</span> <span className="text-blue-700">cole a chave que recebeu</span></p>
              <p><span className="text-slate-500">AWS Secret Access Key:</span> <span className="text-blue-700">cole a chave secreta que recebeu</span></p>
              <p><span className="text-slate-500">Default region name:</span> <span className="text-blue-700">us-east-1</span></p>
              <p><span className="text-slate-500">Default output format:</span> <span className="text-blue-700">json</span></p>
            </div>
            <Warn>
              <strong>Nao tem as chaves?</strong> Peca ao administrador de infraestrutura AWS da Petrobras.
              Diga que voce precisa de credenciais com permissao para ECR (enviar imagens Docker) e ECS (rodar containers).
            </Warn>
          </Step>

          {/* PASSO 3 */}
          <Step number={3} title="Criar os repositorios de imagens na AWS (ECR)">
            <Explain>
              <strong>O que e o ECR?</strong> E como um "Google Drive para imagens Docker". Voce sobe a imagem la
              e a AWS consegue puxar de la para rodar. Precisamos criar 2 repositorios: um para o frontend e outro para o backend.
            </Explain>

            <p className="text-sm text-slate-600">No terminal, copie e cole os comandos abaixo. <strong>Troque o 123456789012 pelo ID da conta AWS da Petrobras</strong> (pergunte ao admin se nao souber):</p>

            <CodeBlock title="Criar repositorio do backend" code={`aws ecr create-repository --repository-name csa-backend --region us-east-1`} />
            <CodeBlock title="Criar repositorio do frontend" code={`aws ecr create-repository --repository-name csa-frontend --region us-east-1`} />

            <p className="text-sm text-slate-600">
              Vai aparecer um resultado com uma linha <code>repositoryUri</code>. <strong>Anote esse valor</strong>, vamos usar depois.
              Exemplo: <code>123456789012.dkr.ecr.us-east-1.amazonaws.com/csa-backend</code>
            </p>

            <Warn>
              <strong>Deu erro "already exists"?</strong> Nao se preocupe, significa que o repositorio ja foi criado antes. Pode seguir para o proximo passo.
            </Warn>
          </Step>

          {/* PASSO 4 */}
          <Step number={4} title="Construir as imagens Docker (o famoso 'build')">
            <Explain>
              <strong>O que e um build?</strong> E o processo de pegar o codigo do projeto e criar a "caixa" Docker.
              Durante o build, o Docker baixa todas as bibliotecas necessarias (usando o Nexus se estiver disponivel)
              e empacota tudo junto.
            </Explain>

            <p className="text-sm text-slate-600">
              <strong>Abra o terminal</strong> e navegue ate a pasta do projeto:
            </p>
            <CodeBlock code={`cd caminho/para/layout-petrobras-e-mail`} />
            <p className="text-sm text-slate-500">Exemplo: <code>cd C:\\Projetos\\layout-petrobras-e-mail</code> (Windows) ou <code>cd ~/projetos/layout-petrobras-e-mail</code> (Linux)</p>

            <h4 className="font-semibold text-slate-800">Construir as duas imagens de uma vez:</h4>
            <p className="text-sm text-slate-600">Este comando le os arquivos <code>Dockerfile</code> e <code>docker-compose.yml</code> e cria as duas imagens:</p>
            <CodeBlock code={`docker compose build`} />

            <Warn>
              <strong>Este passo demora!</strong> Na primeira vez pode levar de 5 a 15 minutos dependendo da sua internet,
              porque precisa baixar todas as bibliotecas. As proximas vezes sao mais rapidas.
            </Warn>

            <p className="text-sm text-slate-600">Quando terminar sem erros, voce vai ver algo como:</p>
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm font-mono text-green-800">
              <p>{'=> => exporting layers'}</p>
              <p>{'=> => writing image sha256:abc123...'}</p>
              <p>{'=> => naming to docker.io/library/layout-petrobras-e-mail-frontend'}</p>
            </div>
          </Step>

          {/* PASSO 5 */}
          <Step number={5} title="Testar localmente (opcional mas recomendado)">
            <Explain>
              <strong>Por que testar?</strong> Antes de enviar para a AWS, e bom verificar se tudo funciona na sua maquina.
              Se funcionar aqui, vai funcionar la.
            </Explain>

            <p className="text-sm text-slate-600">No mesmo terminal, rode:</p>
            <CodeBlock code={`docker compose up`} />

            <p className="text-sm text-slate-600">Espere ate aparecer mensagens como "Uvicorn running on 0.0.0.0:8000" e "Ready on http://0.0.0.0:3000". Entao abra no navegador:</p>
            <div className="rounded-lg bg-slate-100 p-4 text-sm space-y-2">
              <p><strong>Frontend:</strong> <code>http://localhost:3000</code> (deve mostrar o site)</p>
              <p><strong>Backend:</strong> <code>http://localhost:8000</code> (deve mostrar {"{'\"status\": \"ok\"'}"} ou similar)</p>
              <p><strong>Swagger (documentacao da API):</strong> <code>http://localhost:8000/docs</code></p>
            </div>

            <p className="text-sm text-slate-600 mt-2">Para parar, pressione <strong>Ctrl+C</strong> no terminal. Depois rode:</p>
            <CodeBlock code={`docker compose down`} />
          </Step>

          {/* PASSO 6 */}
          <Step number={6} title="Enviar as imagens para a AWS (push para ECR)">
            <Explain>
              <strong>O que estamos fazendo?</strong> Vamos enviar as imagens Docker que criamos para o ECR da AWS.
              E como fazer upload de um arquivo para o Google Drive - so que estamos fazendo upload de todo o sistema empacotado.
            </Explain>

            <p className="text-sm text-slate-600">
              Copie o bloco abaixo <strong>inteiro</strong>, <strong>troque os 2 valores</strong> e cole no terminal:
            </p>
            <CodeBlock code={`# ============================================
# TROQUE ESSES 2 VALORES ANTES DE COLAR:
# ============================================
AWS_ACCOUNT_ID="123456789012"
AWS_REGION="us-east-1"
# ============================================

# A partir daqui NAO mude nada, so cole:
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo ">>> Fazendo login no ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI

echo ">>> Enviando Backend..."
docker tag layout-petrobras-e-mail-backend:latest $ECR_URI/csa-backend:latest
docker push $ECR_URI/csa-backend:latest

echo ">>> Enviando Frontend..."
docker tag layout-petrobras-e-mail-frontend:latest $ECR_URI/csa-frontend:latest
docker push $ECR_URI/csa-frontend:latest

echo ""
echo "=== PRONTO! Imagens enviadas para a AWS ==="
echo "Backend:  $ECR_URI/csa-backend:latest"
echo "Frontend: $ECR_URI/csa-frontend:latest"`} />

            <Warn>
              <strong>O push tambem demora!</strong> As imagens tem varios MB. Pode levar 5-10 minutos no primeiro envio.
              Envios seguintes sao mais rapidos porque so envia o que mudou.
            </Warn>

            <div className="flex gap-3 rounded-lg bg-green-50 border border-green-200 p-4 mt-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm text-green-800 leading-relaxed">
                <strong>Se apareceu "PRONTO!" sem erros, parabens!</strong> Suas imagens estao na AWS.
                O Nexus NAO foi necessario na AWS - tudo ja esta dentro da imagem.
              </div>
            </div>
          </Step>
        </div>

        {/* ============================================= */}
        {/* FASE 2 */}
        {/* ============================================= */}
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Fase 2: Colocar para rodar na AWS</h2>
        <Alert className="border-orange-300 bg-orange-50 mb-6">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Importante:</strong> Esta fase geralmente e feita pelo time de infraestrutura da Petrobras.
            Se voce nao tem acesso ao Console AWS, envie este guia para o admin de infra.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 mb-10">

          {/* PASSO 7 */}
          <Step number={7} title="Criar um Cluster no ECS (onde os containers vao rodar)">
            <Explain>
              <strong>O que e o ECS?</strong> E o servico da Amazon que roda containers Docker na nuvem.
              Um "Cluster" e como uma sala de servidores virtual onde seus containers vao morar.
            </Explain>

            <h4 className="font-semibold text-slate-800">Pelo site da AWS (Console):</h4>
            <ol className="text-sm text-slate-600 space-y-3 list-decimal pl-5">
              <li>Abra o navegador e va em: <strong>console.aws.amazon.com</strong></li>
              <li>Faca login com sua conta AWS</li>
              <li>Na barra de busca no topo, digite <strong>ECS</strong> e clique em "Elastic Container Service"</li>
              <li>No menu lateral, clique em <strong>Clusters</strong></li>
              <li>Clique no botao laranja <strong>"Create Cluster"</strong></li>
              <li>Em "Cluster name", digite: <code>csa-cluster</code></li>
              <li>Em "Infrastructure", marque <strong>AWS Fargate (serverless)</strong></li>
              <li>Clique em <strong>"Create"</strong></li>
              <li>Espere ate o status ficar <strong>ACTIVE</strong> (demora 1-2 minutos)</li>
            </ol>

            <h4 className="font-semibold text-slate-800 mt-4">Ou pelo terminal:</h4>
            <CodeBlock code={`aws ecs create-cluster --cluster-name csa-cluster --capacity-providers FARGATE --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 --region us-east-1`} />
          </Step>

          {/* PASSO 8 */}
          <Step number={8} title="Criar as Task Definitions (receita de como rodar cada container)">
            <Explain>
              <strong>O que e uma Task Definition?</strong> E como uma "receita" que diz para a AWS:
              qual imagem Docker usar, quanta memoria e CPU dar, quais portas abrir, e quais variaveis de ambiente configurar.
              Precisamos de 2 receitas: uma para o backend e outra para o frontend.
            </Explain>

            <h4 className="font-semibold text-slate-800">Backend Task Definition:</h4>
            <p className="text-sm text-slate-600">Salve o texto abaixo em um arquivo chamado <code>task-backend.json</code> na sua maquina. <strong>Troque os valores em MAIUSCULO pelos seus</strong>:</p>
            <CodeBlock code={`{
  "family": "csa-backend-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::SEU_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "csa-backend",
      "image": "SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/csa-backend:latest",
      "portMappings": [
        { "containerPort": 8000, "protocol": "tcp" }
      ],
      "environment": [
        { "name": "ENV", "value": "production" },
        { "name": "DATABASE_URL", "value": "SUA_URL_DO_NEON_POSTGRESQL" },
        { "name": "JWT_SECRET_KEY", "value": "CHAVE_SECRETA_QUALQUER_LONGA" },
        { "name": "CORS_ORIGINS", "value": "https://SEU_DOMINIO.com.br" },
        { "name": "STORAGE_PROVIDER", "value": "aws" },
        { "name": "AWS_REGION", "value": "us-east-1" },
        { "name": "AWS_S3_BUCKET", "value": "SEU_BUCKET_S3" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/csa-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      }
    }
  ]
}`} />

            <h4 className="font-semibold text-slate-800 mt-6">Frontend Task Definition:</h4>
            <p className="text-sm text-slate-600">Salve como <code>task-frontend.json</code>. Troque os valores em MAIUSCULO:</p>
            <CodeBlock code={`{
  "family": "csa-frontend-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::SEU_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "csa-frontend",
      "image": "SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/csa-frontend:latest",
      "portMappings": [
        { "containerPort": 3000, "protocol": "tcp" }
      ],
      "environment": [
        { "name": "BACKEND_URL", "value": "http://csa-backend-svc.csa-cluster.local:8000" },
        { "name": "DATABASE_URL", "value": "SUA_URL_DO_NEON_POSTGRESQL" },
        { "name": "NEXT_PUBLIC_AZURE_CLIENT_ID", "value": "SEU_CLIENT_ID_ENTRA" },
        { "name": "NEXT_PUBLIC_AZURE_TENANT_ID", "value": "SEU_TENANT_ID_ENTRA" },
        { "name": "NODE_ENV", "value": "production" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/csa-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      }
    }
  ]
}`} />

            <h4 className="font-semibold text-slate-800 mt-6">Registrar as receitas na AWS:</h4>
            <p className="text-sm text-slate-600">No terminal, rode (na pasta onde salvou os arquivos JSON):</p>
            <CodeBlock code={`aws ecs register-task-definition --cli-input-json file://task-backend.json --region us-east-1
aws ecs register-task-definition --cli-input-json file://task-frontend.json --region us-east-1`} />
          </Step>

          {/* PASSO 9 */}
          <Step number={9} title="Criar o Load Balancer e os Services">
            <Explain>
              <strong>O que e um Load Balancer?</strong> E como um "porteiro" que recebe as requisicoes dos usuarios
              e direciona para o container correto. Se alguem acessa <code>/api/...</code>, manda para o backend.
              Se acessa qualquer outra coisa, manda para o frontend.
            </Explain>

            <h4 className="font-semibold text-slate-800">Pelo Console AWS (recomendado para iniciantes):</h4>
            <ol className="text-sm text-slate-600 space-y-3 list-decimal pl-5">
              <li>Na barra de busca, digite <strong>EC2</strong> e clique</li>
              <li>No menu lateral, clique em <strong>Load Balancers</strong></li>
              <li>Clique em <strong>"Create Load Balancer"</strong></li>
              <li>Escolha <strong>"Application Load Balancer"</strong> e clique Create</li>
              <li>Nome: <code>csa-alb</code></li>
              <li>Scheme: <strong>Internet-facing</strong> (para ser acessivel pela internet)</li>
              <li>Listener: <strong>HTTP : 80</strong></li>
              <li>Selecione pelo menos 2 Availability Zones</li>
              <li>Crie 2 Target Groups:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><code>csa-tg-backend</code> - tipo IP, porta <strong>8000</strong>, health check: <code>/</code></li>
                  <li><code>csa-tg-frontend</code> - tipo IP, porta <strong>3000</strong>, health check: <code>/</code></li>
                </ul>
              </li>
              <li>Nas regras do Listener, configure:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Se o path comeca com <code>/api/v1/*</code> {'-->'} direciona para <code>csa-tg-backend</code></li>
                  <li>Tudo o resto (default) {'-->'} direciona para <code>csa-tg-frontend</code></li>
                </ul>
              </li>
            </ol>

            <h4 className="font-semibold text-slate-800 mt-6">Criar os Services no ECS:</h4>
            <p className="text-sm text-slate-600">Volte ao ECS {'>'} Clusters {'>'} csa-cluster {'>'} Services {'>'} Create:</p>
            <ol className="text-sm text-slate-600 space-y-3 list-decimal pl-5">
              <li>
                <strong>Backend Service:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Service name: <code>csa-backend-svc</code></li>
                  <li>Task definition: <code>csa-backend-task</code></li>
                  <li>Desired tasks: <code>1</code></li>
                  <li>Load balancer: selecione <code>csa-alb</code> e target group <code>csa-tg-backend</code></li>
                </ul>
              </li>
              <li>
                <strong>Frontend Service:</strong> (repita o processo)
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Service name: <code>csa-frontend-svc</code></li>
                  <li>Task definition: <code>csa-frontend-task</code></li>
                  <li>Desired tasks: <code>1</code></li>
                  <li>Load balancer: selecione <code>csa-alb</code> e target group <code>csa-tg-frontend</code></li>
                </ul>
              </li>
            </ol>
          </Step>

          {/* PASSO 10 */}
          <Step number={10} title="Verificar se esta funcionando">
            <Explain>
              Agora vamos verificar se tudo subiu corretamente e pegar a URL onde o sistema esta rodando.
            </Explain>

            <h4 className="font-semibold text-slate-800">Pegar a URL do sistema:</h4>
            <p className="text-sm text-slate-600">No Console AWS, va em EC2 {'>'} Load Balancers {'>'} csa-alb e copie o <strong>DNS name</strong>. Exemplo:</p>
            <div className="rounded-lg bg-slate-100 p-3 text-sm font-mono">
              csa-alb-1234567890.us-east-1.elb.amazonaws.com
            </div>

            <p className="text-sm text-slate-600 mt-3">Abra no navegador:</p>
            <div className="rounded-lg bg-slate-100 p-4 text-sm space-y-2">
              <p><strong>Site:</strong> <code>http://csa-alb-XXXXX.us-east-1.elb.amazonaws.com</code></p>
              <p><strong>API:</strong> <code>http://csa-alb-XXXXX.us-east-1.elb.amazonaws.com/api/v1/health</code></p>
              <p><strong>Swagger:</strong> <code>http://csa-alb-XXXXX.us-east-1.elb.amazonaws.com/api/v1/docs</code></p>
            </div>

            <h4 className="font-semibold text-slate-800 mt-6">Se algo nao funcionar, veja os logs:</h4>
            <p className="text-sm text-slate-600">No Console AWS, va em CloudWatch {'>'} Log groups:</p>
            <div className="rounded-lg bg-slate-100 p-4 text-sm space-y-2">
              <p><code>/ecs/csa-backend</code> - logs do backend Python</p>
              <p><code>/ecs/csa-frontend</code> - logs do frontend Next.js</p>
            </div>
            <p className="text-sm text-slate-600 mt-2">Ou pelo terminal:</p>
            <CodeBlock code={`aws logs tail /ecs/csa-backend --follow --region us-east-1
aws logs tail /ecs/csa-frontend --follow --region us-east-1`} />
          </Step>
        </div>

        {/* ============================================= */}
        {/* COMO ATUALIZAR */}
        {/* ============================================= */}
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Como atualizar o sistema depois</h2>
        <Card className="mb-8 border-slate-200">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Quando voce fizer mudancas no codigo e quiser atualizar o sistema na AWS, basta repetir os passos 4 e 6,
              e depois mandar a AWS pegar a nova versao:
            </p>
            <CodeBlock title="Cole tudo de uma vez no terminal" code={`# ===== TROQUE ESSES VALORES =====
AWS_ACCOUNT_ID="123456789012"
AWS_REGION="us-east-1"
# =================================

ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo "1/5 - Login no ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI

echo "2/5 - Rebuild do backend..."
docker compose build backend

echo "3/5 - Rebuild do frontend..."
docker compose build frontend

echo "4/5 - Enviando para AWS..."
docker tag layout-petrobras-e-mail-backend:latest $ECR_URI/csa-backend:latest
docker tag layout-petrobras-e-mail-frontend:latest $ECR_URI/csa-frontend:latest
docker push $ECR_URI/csa-backend:latest
docker push $ECR_URI/csa-frontend:latest

echo "5/5 - Mandando AWS atualizar os containers..."
aws ecs update-service --cluster csa-cluster --service csa-backend-svc --force-new-deployment --region $AWS_REGION
aws ecs update-service --cluster csa-cluster --service csa-frontend-svc --force-new-deployment --region $AWS_REGION

echo ""
echo "=== ATUALIZACAO ENVIADA ==="
echo "A AWS vai trocar os containers em 2-5 minutos."`} />
          </CardContent>
        </Card>

        {/* ============================================= */}
        {/* PROBLEMAS COMUNS */}
        {/* ============================================= */}
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Problemas comuns e como resolver</h2>
        <div className="space-y-4 mb-8">
          <Card className="border-red-200">
            <CardContent className="pt-6 space-y-2">
              <h4 className="font-semibold text-red-800">{"\"npm ERR! 404 Not Found\""} durante o build</h4>
              <p className="text-sm text-slate-600"><strong>Causa:</strong> O Nexus da Petrobras nao tem o pacote solicitado.</p>
              <p className="text-sm text-slate-600"><strong>Solucao:</strong> Edite o arquivo <code>.npmrc</code> na raiz do projeto. Se estiver fora da rede Petrobras, remova a linha do <code>registry</code>. Se estiver dentro, peca ao admin do Nexus para sincronizar o pacote.</p>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardContent className="pt-6 space-y-2">
              <h4 className="font-semibold text-red-800">{"\"pip SSL CERTIFICATE_VERIFY_FAILED\""} durante o build</h4>
              <p className="text-sm text-slate-600"><strong>Causa:</strong> O certificado SSL do Nexus nao e reconhecido dentro do Docker.</p>
              <p className="text-sm text-slate-600"><strong>Solucao:</strong> O arquivo <code>backend/pip.ini</code> ja tem <code>trusted-host = nexus.petrobras.com.br</code> que resolve isso. Se mesmo assim falhar, remova o pip.ini e use o PyPI publico.</p>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardContent className="pt-6 space-y-2">
              <h4 className="font-semibold text-red-800">Container para logo depois de iniciar (exit code 1)</h4>
              <p className="text-sm text-slate-600"><strong>Causa:</strong> Geralmente e variavel de ambiente faltando.</p>
              <p className="text-sm text-slate-600"><strong>Solucao:</strong> Veja os logs no CloudWatch ({'/ecs/csa-backend'} ou {'/ecs/csa-frontend'}). Quase sempre o erro diz qual variavel esta faltando. Volte ao Passo 8 e confira se todas as variaveis estao preenchidas.</p>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardContent className="pt-6 space-y-2">
              <h4 className="font-semibold text-red-800">{"\"denied: Your authorization token has expired\""} no push</h4>
              <p className="text-sm text-slate-600"><strong>Causa:</strong> O login no ECR expira a cada 12 horas.</p>
              <p className="text-sm text-slate-600"><strong>Solucao:</strong> Rode o login novamente antes do push:</p>
              <CodeBlock code={`aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com`} />
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardContent className="pt-6 space-y-2">
              <h4 className="font-semibold text-red-800">Frontend abre mas da erro ao carregar dados</h4>
              <p className="text-sm text-slate-600"><strong>Causa:</strong> O frontend nao esta conseguindo se comunicar com o backend.</p>
              <p className="text-sm text-slate-600"><strong>Solucao:</strong> Verifique se a variavel <code>BACKEND_URL</code> na task definition do frontend aponta para o endereco correto do backend. Se estiver usando Service Connect do ECS, o endereco e <code>http://csa-backend-svc.csa-cluster.local:8000</code>.</p>
            </CardContent>
          </Card>
        </div>

        {/* Checklist final */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Checklist Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Na sua maquina</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Docker instalado e funcionando</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> AWS CLI instalado e configurado</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> docker compose build sem erros</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> docker compose up testado localmente</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Imagens enviadas para o ECR</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Na AWS</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Repositorios ECR criados</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Cluster ECS criado</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Task Definitions registradas</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Load Balancer configurado</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Services rodando e saudaveis</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Sistema acessivel pelo navegador</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
