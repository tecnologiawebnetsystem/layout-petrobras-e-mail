"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, Container, AlertTriangle, CheckCircle2, Copy, ChevronDown, ChevronRight, Server, Globe, Shield, Layers } from "lucide-react"
import Link from "next/link"

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative group">
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

function CollapsibleSection({ title, icon: Icon, defaultOpen = false, children }: { title: string; icon: React.ElementType; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="border-slate-200">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-6 text-left hover:bg-slate-50 transition-colors">
        <Icon className="h-5 w-5 text-slate-600 shrink-0" />
        <span className="font-semibold text-slate-900 flex-1">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <CardContent className="pt-0 border-t border-slate-100">{children}</CardContent>}
    </Card>
  )
}

export default function DeployContainersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
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
          <h1 className="mb-3 text-4xl font-bold text-slate-900">Deploy em Containers - Front + Back na AWS</h1>
          <p className="text-lg text-slate-600">
            Guia completo passo a passo para publicar o frontend Next.js e o backend Python/FastAPI em containers Docker na AWS, contornando problemas com Nexus
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-blue-100 text-blue-700">Docker</Badge>
            <Badge className="bg-orange-100 text-orange-700">AWS ECS</Badge>
            <Badge className="bg-green-100 text-green-700">ECR</Badge>
            <Badge className="bg-red-100 text-red-700">Nexus Fix</Badge>
            <Badge className="bg-purple-100 text-purple-700">Passo a Passo</Badge>
          </div>
        </div>

        {/* Alerta principal sobre Nexus */}
        <Alert className="border-red-300 bg-red-50 mb-8">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Problema com Nexus:</strong> O pipeline da Petrobras usa o Nexus (<code>nexus.petrobras.com.br</code>) como repositorio privado para npm e pip.
            Quando o build roda na AWS (CodeBuild/ECS), pode falhar por problemas de rede, certificado SSL, ou credenciais de acesso ao Nexus.
            Este guia mostra como contornar isso usando build local + push da imagem pronta para o ECR.
          </AlertDescription>
        </Alert>

        {/* Arquitetura */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Layers className="h-5 w-5" /> Arquitetura Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-white p-6 font-mono text-sm leading-loose text-slate-700">
              <div className="space-y-2">
                <p className="font-bold text-blue-800">{'[Maquina Local / CI com acesso ao Nexus]'}</p>
                <p className="pl-4">{'|-- docker build frontend (npm install via Nexus/PyPI)'}</p>
                <p className="pl-4">{'|-- docker build backend  (pip install via Nexus/PyPI)'}</p>
                <p className="pl-4">{'|-- docker push -> AWS ECR (registry privado)'}</p>
                <p className="mt-4 font-bold text-orange-700">{'[AWS]'}</p>
                <p className="pl-4">{'|-- ECR armazena as imagens prontas'}</p>
                <p className="pl-4">{'|-- ECS/Fargate roda os containers'}</p>
                <p className="pl-4">{'|-- ALB (Load Balancer) roteia o trafego'}</p>
                <p className="pl-4">{'|-- frontend:3000 <-> backend:8000 (rede interna)'}</p>
                <p className="pl-4">{'|-- Neon PostgreSQL (banco externo)'}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-blue-800">
              <strong>Chave:</strong> O build acontece na sua maquina (onde o Nexus funciona). A AWS so recebe a imagem pronta - sem precisar do Nexus.
            </p>
          </CardContent>
        </Card>

        {/* Tabs: Local vs AWS */}
        <Tabs defaultValue="local" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="local">Fase 1: Build Local + Push ECR</TabsTrigger>
            <TabsTrigger value="aws">Fase 2: Deploy na AWS (ECS/Fargate)</TabsTrigger>
          </TabsList>

          {/* ============================================ */}
          {/* FASE 1: BUILD LOCAL */}
          {/* ============================================ */}
          <TabsContent value="local" className="space-y-6 mt-6">

            <Alert className="border-green-300 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Esta fase roda na sua maquina local (ou numa VM com acesso ao Nexus). O objetivo e gerar as imagens Docker prontas e enviar para o AWS ECR.
              </AlertDescription>
            </Alert>

            {/* Passo 1 */}
            <CollapsibleSection title="Passo 1: Instalar Docker" icon={Container} defaultOpen>
              <div className="space-y-4 pt-4">
                <p className="text-slate-600">Se ainda nao tem Docker instalado na maquina:</p>
                <CodeBlock code={`# Windows: baixar Docker Desktop
# https://www.docker.com/products/docker-desktop

# Linux (Ubuntu/Debian):
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER  # para rodar sem sudo`} />
                <p className="text-sm text-slate-500">Apos instalar, verifique: <code>docker --version</code> e <code>docker compose version</code></p>
              </div>
            </CollapsibleSection>

            {/* Passo 2 */}
            <CollapsibleSection title="Passo 2: Instalar e Configurar AWS CLI" icon={Globe}>
              <div className="space-y-4 pt-4">
                <CodeBlock code={`# Instalar AWS CLI
# Windows: baixar em https://aws.amazon.com/cli/
# Linux:
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar credenciais
aws configure
# AWS Access Key ID: SUA_ACCESS_KEY
# AWS Secret Access Key: SUA_SECRET_KEY
# Default region name: us-east-1  (ou sa-east-1 para Sao Paulo)
# Default output format: json`} />
                <Alert className="border-amber-300 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    As credenciais AWS devem ter permissao para: <strong>ecr:GetAuthorizationToken</strong>,
                    <strong> ecr:BatchCheckLayerAvailability</strong>, <strong>ecr:PutImage</strong>,
                    <strong> ecr:InitiateLayerUpload</strong>, <strong>ecr:UploadLayerPart</strong>,
                    <strong> ecr:CompleteLayerUpload</strong>. Solicite ao admin AWS da Petrobras.
                  </AlertDescription>
                </Alert>
              </div>
            </CollapsibleSection>

            {/* Passo 3 */}
            <CollapsibleSection title="Passo 3: Criar Repositorios no ECR" icon={Server}>
              <div className="space-y-4 pt-4">
                <p className="text-slate-600">O ECR (Elastic Container Registry) e o registry privado da AWS onde suas imagens ficam armazenadas.</p>
                <CodeBlock code={`# Definir variaveis (trocar pelos seus valores)
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1

# Criar repositorio para o BACKEND
aws ecr create-repository \\
  --repository-name csa-backend \\
  --region $AWS_REGION \\
  --image-scanning-configuration scanOnPush=true

# Criar repositorio para o FRONTEND
aws ecr create-repository \\
  --repository-name csa-frontend \\
  --region $AWS_REGION \\
  --image-scanning-configuration scanOnPush=true`} />
                <p className="text-sm text-slate-500">Anote a URI que retorna, tipo: <code>123456789012.dkr.ecr.us-east-1.amazonaws.com/csa-backend</code></p>
              </div>
            </CollapsibleSection>

            {/* Passo 4 */}
            <CollapsibleSection title="Passo 4: Configurar .npmrc e pip.ini para o Nexus" icon={Shield}>
              <div className="space-y-4 pt-4">
                <p className="text-slate-600">Se a sua maquina tem acesso ao Nexus, configure assim:</p>

                <h4 className="font-semibold text-slate-800 mt-4">Frontend - .npmrc (raiz do projeto)</h4>
                <CodeBlock language="ini" code={`# .npmrc - Para usar Nexus da Petrobras
legacy-peer-deps=true
registry=https://nexus.petrobras.com.br/repository/npm-group/
strict-ssl=false
# Se precisar de autenticacao:
# //nexus.petrobras.com.br/repository/npm-group/:_auth=BASE64_USER_PASS`} />

                <h4 className="font-semibold text-slate-800 mt-4">Backend - pip.ini (pasta backend/)</h4>
                <CodeBlock language="ini" code={`# backend/pip.ini - Para usar Nexus da Petrobras
[global]
timeout = 1000
index-url = https://nexus.petrobras.com.br/repository/pypi-all/simple
trusted-host = nexus.petrobras.com.br`} />

                <Alert className="border-blue-300 bg-blue-50 mt-4">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Se NAO tem Nexus:</strong> Remova ou comente esses arquivos. O Docker vai usar os registries publicos (npmjs.org e pypi.org) por padrao.
                    Os Dockerfiles do projeto ja detectam automaticamente se o pip.ini existe.
                  </AlertDescription>
                </Alert>
              </div>
            </CollapsibleSection>

            {/* Passo 5 */}
            <CollapsibleSection title="Passo 5: Build das Imagens Docker" icon={Container}>
              <div className="space-y-4 pt-4">
                <p className="text-slate-600">Este e o passo principal. O build roda na sua maquina onde o Nexus funciona.</p>

                <h4 className="font-semibold text-slate-800">Opcao A: Build com docker-compose (mais facil)</h4>
                <CodeBlock code={`# Na raiz do projeto
docker compose build`} />

                <h4 className="font-semibold text-slate-800 mt-4">Opcao B: Build individual (mais controle)</h4>
                <CodeBlock code={`# BACKEND
cd backend
docker build -t csa-backend:latest .
cd ..

# FRONTEND
docker build -t csa-frontend:latest \\
  --build-arg NEXT_PUBLIC_APP_URL=https://seu-dominio.com.br \\
  --build-arg NEXT_PUBLIC_AZURE_CLIENT_ID=SEU_CLIENT_ID \\
  --build-arg NEXT_PUBLIC_AZURE_TENANT_ID=SEU_TENANT_ID \\
  .`} />

                <h4 className="font-semibold text-slate-800 mt-4">Testar localmente antes de enviar</h4>
                <CodeBlock code={`# Subir front + back
docker compose up

# Testar
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# Swagger:  http://localhost:8000/docs

# Parar
docker compose down`} />
              </div>
            </CollapsibleSection>

            {/* Passo 6 */}
            <CollapsibleSection title="Passo 6: Push das Imagens para o ECR" icon={Globe}>
              <div className="space-y-4 pt-4">
                <p className="text-slate-600">Com as imagens buildadas e testadas, envie para o ECR da AWS:</p>
                <CodeBlock code={`# Definir variaveis
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1
export ECR_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# 1. Login no ECR
aws ecr get-login-password --region $AWS_REGION | \\
  docker login --username AWS --password-stdin $ECR_URI

# 2. Tag das imagens
docker tag csa-backend:latest  $ECR_URI/csa-backend:latest
docker tag csa-frontend:latest $ECR_URI/csa-frontend:latest

# 3. Push para o ECR
docker push $ECR_URI/csa-backend:latest
docker push $ECR_URI/csa-frontend:latest

# 4. Verificar
aws ecr list-images --repository-name csa-backend --region $AWS_REGION
aws ecr list-images --repository-name csa-frontend --region $AWS_REGION`} />

                <Alert className="border-green-300 bg-green-50 mt-4">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Pronto! As imagens estao no ECR. A AWS nao precisou acessar o Nexus em nenhum momento.
                    As dependencias ja estao instaladas dentro da imagem Docker.
                  </AlertDescription>
                </Alert>
              </div>
            </CollapsibleSection>

            {/* Script automatizado */}
            <Card className="border-slate-200 bg-slate-50">
              <CardHeader>
                <CardTitle className="text-slate-900 text-lg">Script Automatizado (copiar e colar)</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock code={`#!/bin/bash
# deploy-ecr.sh - Build local + Push para ECR
# Uso: chmod +x deploy-ecr.sh && ./deploy-ecr.sh

set -e

# ===== CONFIGURAR AQUI =====
AWS_ACCOUNT_ID="123456789012"
AWS_REGION="us-east-1"
# ============================

ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo ">>> Login no ECR..."
aws ecr get-login-password --region $AWS_REGION | \\
  docker login --username AWS --password-stdin $ECR_URI

echo ">>> Build Backend..."
docker build -t csa-backend:latest ./backend

echo ">>> Build Frontend..."
docker build -t csa-frontend:latest .

echo ">>> Tag + Push Backend..."
docker tag csa-backend:latest $ECR_URI/csa-backend:latest
docker push $ECR_URI/csa-backend:latest

echo ">>> Tag + Push Frontend..."
docker tag csa-frontend:latest $ECR_URI/csa-frontend:latest
docker push $ECR_URI/csa-frontend:latest

echo ""
echo "=== Deploy concluido ==="
echo "Backend:  $ECR_URI/csa-backend:latest"
echo "Frontend: $ECR_URI/csa-frontend:latest"`} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================ */}
          {/* FASE 2: DEPLOY AWS */}
          {/* ============================================ */}
          <TabsContent value="aws" className="space-y-6 mt-6">

            <Alert className="border-orange-300 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Esta fase e feita no Console AWS ou via CLI. Voce precisa de permissoes de admin para criar clusters ECS, task definitions, e load balancers.
              </AlertDescription>
            </Alert>

            {/* Passo 7 */}
            <CollapsibleSection title="Passo 7: Criar Cluster ECS" icon={Server} defaultOpen>
              <div className="space-y-4 pt-4">
                <h4 className="font-semibold text-slate-800">Via Console AWS:</h4>
                <ol className="space-y-2 text-slate-600 list-decimal pl-5">
                  <li>Abra o <strong>Amazon ECS</strong> no Console AWS</li>
                  <li>Clique em <strong>Create Cluster</strong></li>
                  <li>Nome: <code>csa-cluster</code></li>
                  <li>Infrastructure: selecione <strong>AWS Fargate (serverless)</strong></li>
                  <li>Clique em <strong>Create</strong></li>
                </ol>

                <h4 className="font-semibold text-slate-800 mt-4">Via CLI:</h4>
                <CodeBlock code={`aws ecs create-cluster \\
  --cluster-name csa-cluster \\
  --capacity-providers FARGATE \\
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \\
  --region us-east-1`} />
              </div>
            </CollapsibleSection>

            {/* Passo 8 */}
            <CollapsibleSection title="Passo 8: Criar Task Definitions" icon={Layers}>
              <div className="space-y-4 pt-4">
                <p className="text-slate-600">A Task Definition define como cada container roda (imagem, CPU, memoria, portas, env vars).</p>

                <h4 className="font-semibold text-slate-800">Backend Task Definition:</h4>
                <CodeBlock language="json" code={`{
  "family": "csa-backend-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "csa-backend",
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/csa-backend:latest",
      "portMappings": [
        { "containerPort": 8000, "protocol": "tcp" }
      ],
      "environment": [
        { "name": "ENV", "value": "production" },
        { "name": "DATABASE_URL", "value": "postgresql://..." },
        { "name": "JWT_SECRET_KEY", "value": "SUA_CHAVE_SEGURA" },
        { "name": "CORS_ORIGINS", "value": "https://seu-dominio.com.br" },
        { "name": "STORAGE_PROVIDER", "value": "aws" },
        { "name": "AWS_REGION", "value": "us-east-1" },
        { "name": "AWS_S3_BUCKET", "value": "seu-bucket" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/csa-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}`} />

                <h4 className="font-semibold text-slate-800 mt-6">Frontend Task Definition:</h4>
                <CodeBlock language="json" code={`{
  "family": "csa-frontend-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "csa-frontend",
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/csa-frontend:latest",
      "portMappings": [
        { "containerPort": 3000, "protocol": "tcp" }
      ],
      "environment": [
        { "name": "BACKEND_URL", "value": "http://csa-backend.csa-cluster.local:8000" },
        { "name": "DATABASE_URL", "value": "postgresql://..." },
        { "name": "NODE_ENV", "value": "production" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/csa-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}`} />

                <Alert className="border-blue-300 bg-blue-50 mt-4">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Dica:</strong> Use <strong>AWS Secrets Manager</strong> em vez de env vars inline para credenciais sensiveis (DATABASE_URL, JWT_SECRET_KEY).
                    Substitua <code>environment</code> por <code>secrets</code> na task definition.
                  </AlertDescription>
                </Alert>
              </div>
            </CollapsibleSection>

            {/* Passo 9 */}
            <CollapsibleSection title="Passo 9: Criar Services e Load Balancer" icon={Globe}>
              <div className="space-y-4 pt-4">
                <h4 className="font-semibold text-slate-800">1. Criar Application Load Balancer (ALB)</h4>
                <ol className="space-y-2 text-slate-600 list-decimal pl-5">
                  <li>EC2 {'>'} Load Balancers {'>'} Create Application Load Balancer</li>
                  <li>Nome: <code>csa-alb</code></li>
                  <li>Scheme: Internet-facing</li>
                  <li>Listeners: HTTP:80 (e HTTPS:443 se tiver certificado)</li>
                  <li>Criar 2 Target Groups:
                    <ul className="list-disc pl-5 mt-1">
                      <li><code>csa-tg-frontend</code> - porta 3000, health check <code>/</code></li>
                      <li><code>csa-tg-backend</code> - porta 8000, health check <code>/</code></li>
                    </ul>
                  </li>
                  <li>Regras do Listener:
                    <ul className="list-disc pl-5 mt-1">
                      <li><code>/api/*</code> {'-->'} csa-tg-backend (se quiser expor a API)</li>
                      <li><code>/*</code> (default) {'-->'} csa-tg-frontend</li>
                    </ul>
                  </li>
                </ol>

                <h4 className="font-semibold text-slate-800 mt-6">2. Criar ECS Services</h4>
                <CodeBlock code={`# Backend Service
aws ecs create-service \\
  --cluster csa-cluster \\
  --service-name csa-backend-svc \\
  --task-definition csa-backend-task \\
  --desired-count 1 \\
  --launch-type FARGATE \\
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \\
  --load-balancers "targetGroupArn=arn:aws:...csa-tg-backend,containerName=csa-backend,containerPort=8000" \\
  --service-connect-configuration "enabled=true,namespace=csa-cluster" \\
  --region us-east-1

# Frontend Service
aws ecs create-service \\
  --cluster csa-cluster \\
  --service-name csa-frontend-svc \\
  --task-definition csa-frontend-task \\
  --desired-count 1 \\
  --launch-type FARGATE \\
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \\
  --load-balancers "targetGroupArn=arn:aws:...csa-tg-frontend,containerName=csa-frontend,containerPort=3000" \\
  --region us-east-1`} />
              </div>
            </CollapsibleSection>

            {/* Passo 10 */}
            <CollapsibleSection title="Passo 10: Verificar e Atualizar" icon={CheckCircle2}>
              <div className="space-y-4 pt-4">
                <h4 className="font-semibold text-slate-800">Verificar se esta rodando:</h4>
                <CodeBlock code={`# Ver services
aws ecs list-services --cluster csa-cluster

# Ver tasks rodando
aws ecs list-tasks --cluster csa-cluster --service-name csa-backend-svc
aws ecs list-tasks --cluster csa-cluster --service-name csa-frontend-svc

# Ver logs
aws logs tail /ecs/csa-backend --follow
aws logs tail /ecs/csa-frontend --follow

# Pegar URL do Load Balancer
aws elbv2 describe-load-balancers --names csa-alb \\
  --query "LoadBalancers[0].DNSName" --output text`} />

                <h4 className="font-semibold text-slate-800 mt-6">Para atualizar (novo deploy):</h4>
                <CodeBlock code={`# 1. Rebuild + push (rodar na sua maquina)
./deploy-ecr.sh

# 2. Forcar novo deploy no ECS (pega a imagem :latest nova)
aws ecs update-service \\
  --cluster csa-cluster \\
  --service csa-backend-svc \\
  --force-new-deployment

aws ecs update-service \\
  --cluster csa-cluster \\
  --service csa-frontend-svc \\
  --force-new-deployment`} />
              </div>
            </CollapsibleSection>
          </TabsContent>
        </Tabs>

        {/* Troubleshooting */}
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Problemas Comuns e Solucoes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-slate-800">Erro: npm ERR! 404 Not Found no Nexus</h4>
              <p className="text-sm text-slate-600 mt-1">Pacote nao existe no Nexus. Solucao: remova o <code>.npmrc</code> com Nexus e use o registry publico, ou peca para o admin adicionar o pacote ao Nexus.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Erro: pip SSL CERTIFICATE_VERIFY_FAILED</h4>
              <p className="text-sm text-slate-600 mt-1">Certificado do Nexus nao e confiavel dentro do container. Solucao: adicione <code>trusted-host = nexus.petrobras.com.br</code> no <code>pip.ini</code> (ja esta configurado).</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Erro: CodeBuild nao consegue acessar Nexus</h4>
              <p className="text-sm text-slate-600 mt-1">O CodeBuild roda em VPC sem acesso ao Nexus. <strong>Solucao principal deste guia:</strong> faca o build local e push da imagem pronta para o ECR.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Erro: ECS task para com exit code 1</h4>
              <p className="text-sm text-slate-600 mt-1">Verifique os logs: <code>aws logs tail /ecs/csa-backend --follow</code>. Geralmente e variavel de ambiente faltando (DATABASE_URL, JWT_SECRET_KEY).</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Frontend nao consegue acessar o Backend</h4>
              <p className="text-sm text-slate-600 mt-1">Verifique se o <code>BACKEND_URL</code> do frontend aponta para o service do backend na rede interna do ECS, ou para o ALB. Verifique Security Groups.</p>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Resumo - Checklist Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Sua Maquina (build)</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Docker instalado</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> AWS CLI configurado</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> .npmrc / pip.ini configurados (se usa Nexus)</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> docker compose build funcionando</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> docker compose up testado localmente</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Imagens enviadas para ECR</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">AWS (deploy)</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> ECR repos criados</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> ECS Cluster criado</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Task Definitions registradas</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> ALB + Target Groups configurados</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Services rodando</li>
                  <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /> Variaveis de ambiente configuradas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
