"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Home,
  Copy,
  Check,
  Cloud,
  Server,
  Database,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Shield,
  Settings,
  Globe,
  Layers,
  Container,
  Network,
  FileCode,
  RefreshCw,
  Eye,
  Lock,
  Cpu,
  HardDrive,
} from "lucide-react"
import Link from "next/link"

export default function DockerAWSPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("introducao")

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedId === id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Voltar para Wiki
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
            <Cloud className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-slate-900">Docker na AWS - Guia Completo para Leigos</h1>
          <p className="text-lg text-slate-600">
            Como configurar o Docker na AWS (ECS Fargate) para rodar o Front-End e Back-End em producao
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-orange-100 text-orange-700">AWS</Badge>
            <Badge className="bg-blue-100 text-blue-700">ECS Fargate</Badge>
            <Badge className="bg-green-100 text-green-700">ECR</Badge>
            <Badge className="bg-purple-100 text-purple-700">Passo a Passo</Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
            <TabsTrigger value="introducao">Introducao</TabsTrigger>
            <TabsTrigger value="pre-requisitos">Pre-Requisitos</TabsTrigger>
            <TabsTrigger value="ecr">1. ECR</TabsTrigger>
            <TabsTrigger value="ecs-cluster">2. Cluster ECS</TabsTrigger>
            <TabsTrigger value="task-def">3. Task Definition</TabsTrigger>
            <TabsTrigger value="servico">4. Servico</TabsTrigger>
            <TabsTrigger value="custos">Custos</TabsTrigger>
          </TabsList>

          {/* TAB 1: Introducao */}
          <TabsContent value="introducao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-6 w-6" />
                  O que e Docker na AWS? (Explicacao para Leigos)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Analogia simples:</strong> Se o Docker e uma "caixa" com seu programa, a AWS ECS e um "deposito gigante" 
                    que guarda e roda essas caixas automaticamente. A AWS cuida de ligar/desligar os computadores, 
                    reiniciar se der problema, e escalar se tiver muito acesso!
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Servicos AWS que vamos usar:</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex gap-3 rounded-lg border p-4">
                      <Container className="h-6 w-6 shrink-0 text-blue-600" />
                      <div>
                        <strong className="text-slate-900">ECR (Elastic Container Registry)</strong>
                        <p className="text-sm text-slate-600">E como um "Google Drive" para suas imagens Docker. Guarda todas as versoes do seu app.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <Server className="h-6 w-6 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-slate-900">ECS (Elastic Container Service)</strong>
                        <p className="text-sm text-slate-600">O servico que RODA seus containers. Ele gerencia, monitora e reinicia se necessario.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <Cpu className="h-6 w-6 shrink-0 text-purple-600" />
                      <div>
                        <strong className="text-slate-900">Fargate</strong>
                        <p className="text-sm text-slate-600">Modo "sem servidor" do ECS. Voce nao gerencia computadores, so diz quanto de CPU/memoria precisa.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <Network className="h-6 w-6 shrink-0 text-orange-600" />
                      <div>
                        <strong className="text-slate-900">ALB (Application Load Balancer)</strong>
                        <p className="text-sm text-slate-600">Distribui o trafego entre varios containers e da um endereco bonito (URL).</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Arquitetura Final:</h3>
                  <div className="rounded-lg border bg-slate-50 p-6">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                      <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-3 text-center">
                        <Globe className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                        <span>Usuario</span>
                      </div>
                      <span className="text-2xl text-slate-300">→</span>
                      <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-3 text-center">
                        <Network className="h-6 w-6 mx-auto text-orange-600 mb-1" />
                        <span>ALB</span>
                      </div>
                      <span className="text-2xl text-slate-300">→</span>
                      <div className="rounded-lg border-2 border-green-300 bg-green-50 p-3 text-center">
                        <Container className="h-6 w-6 mx-auto text-green-600 mb-1" />
                        <span>ECS Fargate</span>
                        <p className="text-xs text-slate-500">Front + Back</p>
                      </div>
                      <span className="text-2xl text-slate-300">→</span>
                      <div className="rounded-lg border-2 border-purple-300 bg-purple-50 p-3 text-center">
                        <Database className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                        <span>DynamoDB</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Por que Fargate ao inves de EC2?</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Sem gerenciar servidores</strong>
                        <p className="text-sm text-green-700">Nao precisa atualizar, reiniciar ou monitorar maquinas</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Paga so o que usa</strong>
                        <p className="text-sm text-green-700">Cobranca por segundo de execucao</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Escala automatico</strong>
                        <p className="text-sm text-green-700">Se tiver muito acesso, cria mais containers</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Mais seguro</strong>
                        <p className="text-sm text-green-700">Cada task e isolada, sem compartilhar recursos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Pre-Requisitos */}
          <TabsContent value="pre-requisitos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  Pre-Requisitos (Fazer ANTES de comecar)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* AWS CLI */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white font-bold">1</span>
                    <h3 className="font-semibold text-lg">Instalar AWS CLI no seu computador</h3>
                  </div>
                  <p className="text-slate-600">O AWS CLI permite controlar a AWS pelo terminal:</p>
                  <CodeBlock 
                    id="aws-cli-install"
                    code={`# Windows (PowerShell como Administrador)
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Mac
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verificar instalacao
aws --version`}
                  />
                </div>

                {/* Configurar Credenciais */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white font-bold">2</span>
                    <h3 className="font-semibold text-lg">Configurar Credenciais AWS</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">a</span>
                      <p>Acesse: <a href="https://console.aws.amazon.com/iam" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">AWS Console - IAM</a></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">b</span>
                      <p>Va em <strong>Users</strong> {"->"} <strong>Add users</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">c</span>
                      <p>Nome: <code className="bg-slate-100 px-2 py-1 rounded">petrobras-deploy</code></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">d</span>
                      <p>Selecione <strong>Attach policies directly</strong> e adicione: <code className="bg-slate-100 px-2 py-1 rounded">AdministratorAccess</code></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">e</span>
                      <p>Crie o usuario e depois va em <strong>Security credentials</strong> {"->"} <strong>Create access key</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">f</span>
                      <p>Selecione <strong>Command Line Interface (CLI)</strong> e crie</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">g</span>
                      <p><strong>ANOTE O ACCESS KEY E SECRET KEY</strong> - voce so ve uma vez!</p>
                    </div>
                  </div>
                  <CodeBlock 
                    id="aws-configure"
                    code={`# Configure suas credenciais
aws configure

# Vai pedir:
AWS Access Key ID: AKIA... (cole aqui)
AWS Secret Access Key: ... (cole aqui)
Default region name: us-east-1
Default output format: json

# Testar se funcionou
aws sts get-caller-identity`}
                  />
                </div>

                {/* Dockerfile de Producao */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white font-bold">3</span>
                    <h3 className="font-semibold text-lg">Criar Dockerfiles de Producao</h3>
                  </div>
                  
                  <p className="text-slate-600 font-medium">Dockerfile para o Front-End (producao):</p>
                  <CodeBlock 
                    id="frontend-prod-dockerfile"
                    code={`# Dockerfile.prod (Front-End Next.js)
# Multi-stage build para producao

# Stage 1: Instalar dependencias
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Producao
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]`}
                  />

                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>IMPORTANTE:</strong> No <code className="bg-yellow-100 px-1 rounded">next.config.mjs</code>, adicione: <code className="bg-yellow-100 px-1 rounded">output: 'standalone'</code>
                    </AlertDescription>
                  </Alert>

                  <p className="text-slate-600 font-medium mt-6">Dockerfile para o Back-End (producao):</p>
                  <CodeBlock 
                    id="backend-prod-dockerfile"
                    code={`# Dockerfile.prod (Back-End Python)
# Otimizado para producao

FROM python:3.10-slim

WORKDIR /app

# Instalar dependencias do sistema
RUN apt-get update && apt-get install -y \\
    gcc \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar codigo
COPY . .

# Criar usuario nao-root
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

# Rodar com Gunicorn em producao (mais robusto que uvicorn)
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8080"]`}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: ECR */}
          <TabsContent value="ecr" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Container className="h-6 w-6 text-blue-600" />
                  Passo 1: Criar Repositorios ECR
                </CardTitle>
                <CardDescription>ECR guarda suas imagens Docker na nuvem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>O que e ECR?</strong> E o "Docker Hub" da AWS. Guarda suas imagens Docker de forma segura e privada.
                    O ECS vai buscar as imagens daqui para rodar.
                  </AlertDescription>
                </Alert>

                {/* Criar via Console */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Opcao A: Criar pelo Console AWS (mais facil)</h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">1</span>
                      <p>Acesse: <a href="https://console.aws.amazon.com/ecr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">AWS Console - ECR</a></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">2</span>
                      <p>Clique em <strong>"Create repository"</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">3</span>
                      <div>
                        <p>Crie o repositorio do Front-End:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Repository name: <code className="bg-slate-100 px-2 py-1 rounded">petrobras-frontend</code></li>
                          <li>Image tag mutability: <strong>Immutable</strong></li>
                          <li>Scan on push: <strong>Enabled</strong></li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">4</span>
                      <div>
                        <p>Crie o repositorio do Back-End:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Repository name: <code className="bg-slate-100 px-2 py-1 rounded">petrobras-backend</code></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Criar via CLI */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Opcao B: Criar via Terminal (mais rapido)</h3>
                  <CodeBlock 
                    id="ecr-create"
                    code={`# Criar repositorio para o Front-End
aws ecr create-repository \\
  --repository-name petrobras-frontend \\
  --image-scanning-configuration scanOnPush=true \\
  --image-tag-mutability IMMUTABLE \\
  --region us-east-1

# Criar repositorio para o Back-End
aws ecr create-repository \\
  --repository-name petrobras-backend \\
  --image-scanning-configuration scanOnPush=true \\
  --image-tag-mutability IMMUTABLE \\
  --region us-east-1

# Listar repositorios criados
aws ecr describe-repositories`}
                  />
                </div>

                {/* Enviar Imagens */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Enviar imagens Docker para o ECR</h3>
                  <p className="text-slate-600">Agora vamos "subir" suas imagens Docker para a AWS:</p>
                  <CodeBlock 
                    id="ecr-push"
                    code={`# 1. Fazer login no ECR (substitua SEU_ACCOUNT_ID)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# 2. Descobrir seu Account ID se nao souber
aws sts get-caller-identity --query Account --output text

# =============================================
# FRONT-END
# =============================================

# 3. Construir imagem do Front-End
docker build -t petrobras-frontend -f Dockerfile.prod .

# 4. Taguear com o endereco do ECR
docker tag petrobras-frontend:latest SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/petrobras-frontend:latest

# 5. Enviar para o ECR
docker push SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/petrobras-frontend:latest

# =============================================
# BACK-END
# =============================================

# 6. Navegar para pasta do back-end
cd back-end/python

# 7. Construir imagem do Back-End
docker build -t petrobras-backend -f Dockerfile.prod .

# 8. Taguear
docker tag petrobras-backend:latest SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/petrobras-backend:latest

# 9. Enviar
docker push SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/petrobras-backend:latest`}
                  />

                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Sucesso!</strong> Suas imagens agora estao na AWS. Voce pode ver em ECR {"->"} Repositories {"->"} petrobras-frontend {"->"} Images
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: ECS Cluster */}
          <TabsContent value="ecs-cluster" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-6 w-6 text-green-600" />
                  Passo 2: Criar Cluster ECS
                </CardTitle>
                <CardDescription>O Cluster e o "ambiente" onde seus containers vao rodar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-green-200 bg-green-50">
                  <AlertTriangle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>O que e Cluster?</strong> Pense como um "terreno" onde voce vai construir suas casas (containers).
                    Voce primeiro cria o terreno (cluster), depois constroi as casas (services).
                  </AlertDescription>
                </Alert>

                {/* Criar Cluster */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Criar Cluster pelo Console AWS</h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">1</span>
                      <p>Acesse: <a href="https://console.aws.amazon.com/ecs" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">AWS Console - ECS</a></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">2</span>
                      <p>No menu lateral, clique em <strong>"Clusters"</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">3</span>
                      <p>Clique em <strong>"Create cluster"</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">4</span>
                      <div>
                        <p>Preencha:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Cluster name: <code className="bg-slate-100 px-2 py-1 rounded">petrobras-cluster</code></li>
                          <li>Infrastructure: <strong>AWS Fargate (serverless)</strong></li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">5</span>
                      <p>Em "Monitoring", marque <strong>"Use Container Insights"</strong> (para ver metricas)</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">6</span>
                      <p>Clique <strong>"Create"</strong></p>
                    </div>
                  </div>
                </div>

                {/* Via CLI */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">OU criar via Terminal</h3>
                  <CodeBlock 
                    id="ecs-cluster-create"
                    code={`# Criar cluster ECS com Fargate
aws ecs create-cluster \\
  --cluster-name petrobras-cluster \\
  --capacity-providers FARGATE FARGATE_SPOT \\
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \\
  --settings name=containerInsights,value=enabled \\
  --region us-east-1

# Verificar se criou
aws ecs describe-clusters --clusters petrobras-cluster`}
                  />
                </div>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 className="h-5 w-5" />
                      <strong>Cluster criado!</strong>
                    </div>
                    <p className="text-sm text-green-700 mt-1">Agora voce tem um "terreno" para colocar seus containers. Proximo passo: definir como os containers vao ser.</p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: Task Definition */}
          <TabsContent value="task-def" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-6 w-6 text-purple-600" />
                  Passo 3: Criar Task Definitions
                </CardTitle>
                <CardDescription>Task Definition e a "receita" do seu container - quanto de CPU, memoria, imagem, etc.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-purple-200 bg-purple-50">
                  <AlertTriangle className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-800">
                    <strong>O que e Task Definition?</strong> E como uma "receita de bolo" que diz: 
                    "Use essa imagem Docker, de tantos GB de memoria, tantas CPUs, nessa porta, com essas variaveis de ambiente".
                  </AlertDescription>
                </Alert>

                {/* Task Definition Front-End */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Task Definition do Front-End
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">1</span>
                      <p>Acesse: <a href="https://console.aws.amazon.com/ecs" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ECS Console</a> {"->"} <strong>Task definitions</strong> {"->"} <strong>Create new task definition</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">2</span>
                      <div>
                        <p>Configuracao da Task:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Task definition family: <code className="bg-slate-100 px-2 py-1 rounded">petrobras-frontend-task</code></li>
                          <li>Launch type: <strong>AWS Fargate</strong></li>
                          <li>Operating system: <strong>Linux/X86_64</strong></li>
                          <li>Task size - CPU: <strong>0.5 vCPU</strong></li>
                          <li>Task size - Memory: <strong>1 GB</strong></li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">3</span>
                      <div>
                        <p>Em <strong>"Container - 1"</strong>:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Name: <code className="bg-slate-100 px-2 py-1 rounded">frontend</code></li>
                          <li>Image URI: <code className="bg-slate-100 px-2 py-1 rounded text-xs">SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/petrobras-frontend:latest</code></li>
                          <li>Container port: <strong>3000</strong></li>
                          <li>Protocol: <strong>TCP</strong></li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">4</span>
                      <div>
                        <p>Em <strong>"Environment variables"</strong> adicione:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Key: <code>NEXT_PUBLIC_API_URL</code> Value: <code>https://api.petrobras.com.br</code></li>
                          <li>Key: <code>NODE_ENV</code> Value: <code>production</code></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Definition Back-End */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Server className="h-5 w-5 text-green-600" />
                    Task Definition do Back-End
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">1</span>
                      <p>Crie outra Task Definition para o back-end</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">2</span>
                      <div>
                        <p>Configuracoes:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Task definition family: <code className="bg-slate-100 px-2 py-1 rounded">petrobras-backend-task</code></li>
                          <li>CPU: <strong>0.5 vCPU</strong></li>
                          <li>Memory: <strong>1 GB</strong></li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">3</span>
                      <div>
                        <p>Container:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Name: <code className="bg-slate-100 px-2 py-1 rounded">backend</code></li>
                          <li>Image URI: <code className="bg-slate-100 px-2 py-1 rounded text-xs">SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/petrobras-backend:latest</code></li>
                          <li>Container port: <strong>8080</strong></li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">4</span>
                      <div>
                        <p>Environment variables:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li><code>ENV</code> = <code>production</code></li>
                          <li><code>AWS_REGION</code> = <code>us-east-1</code></li>
                          <li><code>DEBUG</code> = <code>false</code></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Via JSON */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Criar via JSON (mais rapido para copiar)</h3>
                  <p className="text-slate-600">Salve como <code className="bg-slate-100 px-2 py-1 rounded">task-definition-frontend.json</code>:</p>
                  <CodeBlock 
                    id="task-def-json"
                    code={`{
  "family": "petrobras-frontend-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::SEU_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/petrobras-frontend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "NEXT_PUBLIC_API_URL", "value": "https://api.petrobras.com.br"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/petrobras-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}`}
                  />
                  <CodeBlock 
                    id="register-task"
                    code={`# Registrar a task definition
aws ecs register-task-definition --cli-input-json file://task-definition-frontend.json`}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: Servico */}
          <TabsContent value="servico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-6 w-6 text-orange-600" />
                  Passo 4: Criar Servicos ECS
                </CardTitle>
                <CardDescription>Servico e o que mantem seus containers rodando e distribui o trafego</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>O que e Service?</strong> Se a Task Definition e a "receita", o Service e o "chef" que 
                    fica garantindo que sempre tenha N instancias do seu container rodando. Se um cair, ele cria outro automaticamente!
                  </AlertDescription>
                </Alert>

                {/* Criar ALB primeiro */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">4.1 - Criar Load Balancer (ALB)</h3>
                  <p className="text-slate-600">Primeiro, precisamos de um ALB para distribuir o trafego:</p>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">1</span>
                      <p>Acesse: <a href="https://console.aws.amazon.com/ec2/v2/home#LoadBalancers" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">EC2 Console - Load Balancers</a></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">2</span>
                      <p>Clique <strong>"Create load balancer"</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">3</span>
                      <p>Selecione <strong>"Application Load Balancer"</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">4</span>
                      <div>
                        <p>Configuracao basica:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Name: <code className="bg-slate-100 px-2 py-1 rounded">petrobras-alb</code></li>
                          <li>Scheme: <strong>Internet-facing</strong></li>
                          <li>IP address type: <strong>IPv4</strong></li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">5</span>
                      <div>
                        <p>Network mapping:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>VPC: selecione a VPC padrao</li>
                          <li>Subnets: selecione pelo menos 2 subnets em AZs diferentes</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">6</span>
                      <div>
                        <p>Security group: crie um novo ou use existente com regras:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Inbound: HTTP (80) e HTTPS (443) de 0.0.0.0/0</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">7</span>
                      <div>
                        <p>Listeners and routing - crie Target Groups:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Frontend TG: porta 3000, health check path: <code>/</code></li>
                          <li>Backend TG: porta 8080, health check path: <code>/docs</code></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Criar Service */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">4.2 - Criar Service para o Front-End</h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">1</span>
                      <p>Volte para <a href="https://console.aws.amazon.com/ecs" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ECS Console</a> {"->"} <strong>Clusters</strong> {"->"} <strong>petrobras-cluster</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">2</span>
                      <p>Na aba <strong>"Services"</strong>, clique <strong>"Create"</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">3</span>
                      <div>
                        <p>Compute configuration:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Compute options: <strong>Launch type</strong></li>
                          <li>Launch type: <strong>FARGATE</strong></li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">4</span>
                      <div>
                        <p>Deployment configuration:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Application type: <strong>Service</strong></li>
                          <li>Family: <code className="bg-slate-100 px-2 py-1 rounded">petrobras-frontend-task</code></li>
                          <li>Service name: <code className="bg-slate-100 px-2 py-1 rounded">petrobras-frontend-service</code></li>
                          <li>Desired tasks: <strong>2</strong> (para alta disponibilidade)</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">5</span>
                      <div>
                        <p>Networking:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>VPC: sua VPC</li>
                          <li>Subnets: selecione as mesmas do ALB</li>
                          <li>Security group: crie um permitindo porta 3000</li>
                          <li>Public IP: <strong>Turned on</strong></li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">6</span>
                      <div>
                        <p>Load balancing:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Load balancer type: <strong>Application Load Balancer</strong></li>
                          <li>Container: <strong>frontend 3000:3000</strong></li>
                          <li>Load balancer: <strong>petrobras-alb</strong></li>
                          <li>Target group: o que voce criou para frontend</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* URL Final */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Sua aplicacao esta no ar!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-green-700">Apos alguns minutos, sua aplicacao estara acessivel em:</p>
                    <div className="rounded-lg border border-green-300 bg-white p-4">
                      <p className="font-mono text-sm">http://petrobras-alb-XXXXX.us-east-1.elb.amazonaws.com</p>
                      <p className="text-xs text-slate-500 mt-1">A URL exata aparece em EC2 {"->"} Load Balancers {"->"} petrobras-alb {"->"} DNS name</p>
                    </div>
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Para usar um dominio bonito como <strong>app.petrobras.com.br</strong>, configure um CNAME no DNS apontando para essa URL do ALB.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 7: Custos */}
          <TabsContent value="custos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  Estimativa de Custos
                </CardTitle>
                <CardDescription>Quanto vai custar por mes rodar na AWS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Valores aproximados!</strong> Os custos reais dependem do uso. Estes sao valores de referencia para us-east-1 em janeiro/2026.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Frontend */}
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      Front-End
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Fargate (0.5 vCPU, 1GB, 2 tasks)</span>
                        <span className="font-medium">~$30/mes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ECR (armazenamento de imagens)</span>
                        <span className="font-medium">~$1/mes</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Subtotal Front-End</span>
                        <span className="font-semibold text-blue-600">~$31/mes</span>
                      </div>
                    </div>
                  </div>

                  {/* Backend */}
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Server className="h-5 w-5 text-green-600" />
                      Back-End
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Fargate (0.5 vCPU, 1GB, 2 tasks)</span>
                        <span className="font-medium">~$30/mes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ECR (armazenamento de imagens)</span>
                        <span className="font-medium">~$1/mes</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Subtotal Back-End</span>
                        <span className="font-semibold text-green-600">~$31/mes</span>
                      </div>
                    </div>
                  </div>

                  {/* Rede */}
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Network className="h-5 w-5 text-orange-600" />
                      Rede
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>ALB (Application Load Balancer)</span>
                        <span className="font-medium">~$20/mes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transferencia de dados (~50GB)</span>
                        <span className="font-medium">~$5/mes</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Subtotal Rede</span>
                        <span className="font-semibold text-orange-600">~$25/mes</span>
                      </div>
                    </div>
                  </div>

                  {/* Monitoramento */}
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Eye className="h-5 w-5 text-purple-600" />
                      Monitoramento
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>CloudWatch Logs</span>
                        <span className="font-medium">~$5/mes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Container Insights</span>
                        <span className="font-medium">~$3/mes</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Subtotal Monitoramento</span>
                        <span className="font-semibold text-purple-600">~$8/mes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold text-green-800">TOTAL ESTIMADO</h3>
                        <p className="text-sm text-green-700">Front + Back + Infra completa</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-green-800">~$95/mes</p>
                        <p className="text-sm text-green-600">~R$ 500/mes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dicas de economia */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Dicas para economizar:</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex gap-3 rounded-lg border p-4">
                      <DollarSign className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-slate-900">Use Fargate Spot</strong>
                        <p className="text-sm text-slate-600">Ate 70% mais barato para cargas tolerantes a interrupcao</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <DollarSign className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-slate-900">Savings Plans</strong>
                        <p className="text-sm text-slate-600">Comprometa uso de 1-3 anos para ate 40% desconto</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <DollarSign className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-slate-900">Reduza em HML</strong>
                        <p className="text-sm text-slate-600">Use 1 task e menos recursos em ambientes de teste</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <DollarSign className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-slate-900">Auto-scaling</strong>
                        <p className="text-sm text-slate-600">Escale para baixo em horarios de pouco uso</p>
                      </div>
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
