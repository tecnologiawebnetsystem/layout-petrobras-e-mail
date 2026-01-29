"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Cloud,
  DollarSign,
  Zap,
  Shield,
  Clock,
  Server,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DeployAWSPage() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCommand(id)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <Link href="/wiki-dev">
          <Button variant="ghost" size="sm" className="gap-2">
            <Home className="h-4 w-4" />
            Voltar para Wiki-Dev
          </Button>
        </Link>
      </div>

      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/wiki-dev">Wiki Dev</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Deploy AWS com Domínio Provisório</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Deploy Completo na AWS</h1>
        <p className="text-lg text-muted-foreground">
          Guia passo a passo para publicar a aplicação Next.js na AWS com domínio provisório para HML e Produção
        </p>
      </div>

      <Alert className="mb-6 border-blue-500 bg-blue-50">
        <Cloud className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Recomendação:</strong> Use AWS Amplify para HML (domínio provisório gratuito) e ECS Fargate para
          Produção (escalável e confiável)
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="amplify" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="amplify">
            <Zap className="w-4 h-4 mr-2" />
            Amplify (Fácil)
          </TabsTrigger>
          <TabsTrigger value="s3-cloudfront">
            <Globe className="w-4 h-4 mr-2" />
            S3 + CloudFront
          </TabsTrigger>
          <TabsTrigger value="ecs">
            <Server className="w-4 h-4 mr-2" />
            ECS Fargate
          </TabsTrigger>
        </TabsList>

        {/* Amplify */}
        <TabsContent value="amplify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                Deploy com AWS Amplify
              </CardTitle>
              <CardDescription>Método mais rápido - Domínio provisório gratuito incluído</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="bg-green-50">
                  ✅ CI/CD Automático
                </Badge>
                <Badge variant="outline" className="bg-green-50">
                  ✅ SSL Grátis
                </Badge>
                <Badge variant="outline" className="bg-green-50">
                  ✅ Deploy em 5min
                </Badge>
                <Badge variant="outline" className="bg-green-50">
                  ✅ Domínio Provisório
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">
                      1
                    </span>
                    Instalar e Configurar AWS CLI
                  </h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <pre className="text-sm overflow-x-auto">
                      {`# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar credenciais
aws configure`}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        copyToClipboard(
                          'curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"\nunzip awscliv2.zip\nsudo ./aws/install\naws configure',
                          "aws-cli",
                        )
                      }
                    >
                      {copiedCommand === "aws-cli" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">
                      2
                    </span>
                    Conectar GitHub no Console AWS
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      Acesse:{" "}
                      <a
                        href="https://console.aws.amazon.com/amplify"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        AWS Amplify Console
                      </a>
                    </li>
                    <li>Clique em "New app" → "Host web app"</li>
                    <li>Selecione "GitHub" e autorize</li>
                    <li>
                      Escolha repositório <code className="bg-gray-100 px-2 py-1 rounded">Layout_Petrobras_E_mail</code>
                    </li>
                    <li>
                      Branch: <code className="bg-gray-100 px-2 py-1 rounded">main</code>
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">
                      3
                    </span>
                    Criar amplify.yml na raiz do projeto
                  </h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <pre className="text-sm overflow-x-auto">
                      {`version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">
                      4
                    </span>
                    Adicionar Variáveis de Ambiente
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">No console Amplify → Environment variables:</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div>
                      <code>NEXT_PUBLIC_ENTRA_CLIENT_ID</code> = da3aaaad-619f-4bee-a434-51efd11faf7c
                    </div>
                    <div>
                      <code>NEXT_PUBLIC_ENTRA_TENANT_ID</code> = 5b6f6241-9a57-4be4-8e50-1dfa72e79a57
                    </div>
                    <div>
                      <code>NEXT_PUBLIC_ENTRA_REDIRECT_URI</code> = https://main.d3abc123.amplifyapp.com
                    </div>
                    <div>
                      <code>DATABASE_URL</code> = postgresql://...
                    </div>
                    <div>
                      <code>AWS_REGION</code> = us-east-1
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">
                      5
                    </span>
                    Fazer Push e Deploy Automático
                  </h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <pre className="text-sm overflow-x-auto">
                      {`git add .
git commit -m "Deploy para AWS Amplify HML"
git push origin main`}
                    </pre>
                  </div>
                </div>

                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <strong>Seu Domínio Provisório:</strong> https://main.d3abc123.amplifyapp.com
                    <br />
                    Deploy leva 3-5 minutos. SSL automático incluído!
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* S3 + CloudFront */}
        <TabsContent value="s3-cloudfront" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Deploy com S3 + CloudFront
              </CardTitle>
              <CardDescription>Controle total da infraestrutura - Custos mais baixos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="bg-blue-50">
                  📦 S3 Storage
                </Badge>
                <Badge variant="outline" className="bg-blue-50">
                  🌍 CloudFront CDN
                </Badge>
                <Badge variant="outline" className="bg-blue-50">
                  💰 $1-5/mês
                </Badge>
                <Badge variant="outline" className="bg-yellow-50">
                  ⚠️ Sem SSR
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">
                      1
                    </span>
                    Build da Aplicação (Static Export)
                  </h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <pre className="text-sm overflow-x-auto">
                      {`npm run build
npm run export  # Gera pasta /out`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">
                      2
                    </span>
                    Criar e Configurar Bucket S3
                  </h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <pre className="text-sm overflow-x-auto">
                      {`# Criar bucket
BUCKET_NAME="petrobras-compartilhamento-hml"
aws s3 mb s3://$BUCKET_NAME --region us-east-1

# Configurar como site
aws s3 website s3://$BUCKET_NAME \\
  --index-document index.html \\
  --error-document 404.html`}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        copyToClipboard(
                          'BUCKET_NAME="petrobras-compartilhamento-hml"\naws s3 mb s3://$BUCKET_NAME --region us-east-1',
                          "s3-create",
                        )
                      }
                    >
                      {copiedCommand === "s3-create" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">
                      3
                    </span>
                    Upload dos Arquivos
                  </h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <pre className="text-sm overflow-x-auto">
                      {`aws s3 sync ./out s3://$BUCKET_NAME \\
  --delete \\
  --acl public-read`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">
                      4
                    </span>
                    Criar Distribuição CloudFront
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      Acesse:{" "}
                      <a
                        href="https://console.aws.amazon.com/cloudfront"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        CloudFront Console
                      </a>
                    </li>
                    <li>Clique "Create Distribution"</li>
                    <li>Origin domain: Selecione seu bucket S3</li>
                    <li>Viewer protocol: Redirect HTTP to HTTPS</li>
                    <li>
                      Default root object: <code className="bg-gray-100 px-2 py-1 rounded">index.html</code>
                    </li>
                    <li>Clique "Create"</li>
                  </ol>
                </div>

                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <strong>Seu Domínio CloudFront:</strong> https://d111111abcdef8.cloudfront.net
                    <br />
                    Deploy leva 10-15 minutos para propagar globalmente.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ECS Fargate */}
        <TabsContent value="ecs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-500" />
                Deploy com ECS Fargate
              </CardTitle>
              <CardDescription>Produção completa - Suporta SSR e API Routes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="bg-green-50">
                  ✅ SSR Suportado
                </Badge>
                <Badge variant="outline" className="bg-green-50">
                  ✅ API Routes
                </Badge>
                <Badge variant="outline" className="bg-green-50">
                  ✅ Escalável
                </Badge>
                <Badge variant="outline" className="bg-yellow-50">
                  💰 $15-30/mês
                </Badge>
              </div>

              <Alert className="border-purple-500 bg-purple-50">
                <Shield className="h-5 w-5 text-purple-600" />
                <AlertDescription className="text-purple-900">
                  Essa opção é recomendada para <strong>PRODUÇÃO</strong> - Suporta todas as funcionalidades Next.js
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-sm">
                      1
                    </span>
                    Criar Dockerfile
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Criar arquivo <code>Dockerfile</code> na raiz do projeto:
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative max-h-96 overflow-y-auto">
                    <pre className="text-sm">
                      {`FROM node:18-alpine AS base

# Instalar dependências
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Produção
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-sm">
                      2
                    </span>
                    Configurar next.config.js para Docker
                  </h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <pre className="text-sm">
                      {`// next.config.mjs
const nextConfig = {
  output: 'standalone', // ← IMPORTANTE!
  // ... resto da config
}

export default nextConfig`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-sm">
                      3
                    </span>
                    Build e Push para ECR
                  </h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      {`# Criar repositório
aws ecr create-repository \\
  --repository-name petrobras-compartilhamento \\
  --region us-east-1

# Login no ECR
aws ecr get-login-password --region us-east-1 | \\
  docker login --username AWS --password-stdin \\
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build e Push
docker build -t petrobras-compartilhamento .
docker tag petrobras-compartilhamento:latest \\
  123456789012.dkr.ecr.us-east-1.amazonaws.com/petrobras-compartilhamento:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/petrobras-compartilhamento:latest`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-sm">
                      4
                    </span>
                    Criar Cluster e Service ECS
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Usar Console AWS ECS é mais fácil para configurar:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      Acesse{" "}
                      <a
                        href="https://console.aws.amazon.com/ecs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        ECS Console
                      </a>
                    </li>
                    <li>Create Cluster → Networking only (Fargate)</li>
                    <li>Create Task Definition → Fargate → Configure container (porta 3000)</li>
                    <li>Create Service → Selecione task → Configure ALB</li>
                  </ol>
                </div>

                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <strong>Seu Domínio ALB:</strong> http://petrobras-alb-123.us-east-1.elb.amazonaws.com
                    <br />
                    Adicione CloudFront na frente para HTTPS e domínio provisório melhor.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Comparação de Custos */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Comparação de Custos e Facilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3">Opção</th>
                  <th className="text-left p-3">Custo HML</th>
                  <th className="text-left p-3">Custo Produção</th>
                  <th className="text-left p-3">Facilidade</th>
                  <th className="text-left p-3">SSR</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 font-medium">AWS Amplify</td>
                  <td className="p-3">$5-15/mês</td>
                  <td className="p-3">$15-50/mês</td>
                  <td className="p-3">⭐⭐⭐⭐⭐</td>
                  <td className="p-3">✅ Sim</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">S3 + CloudFront</td>
                  <td className="p-3">$1-5/mês</td>
                  <td className="p-3">$5-20/mês</td>
                  <td className="p-3">⭐⭐⭐⭐</td>
                  <td className="p-3">❌ Não</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">ECS Fargate</td>
                  <td className="p-3">$15-30/mês</td>
                  <td className="p-3">$50-200/mês</td>
                  <td className="p-3">⭐⭐⭐</td>
                  <td className="p-3">✅ Sim</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Recomendações por Ambiente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-24 text-center">
              <Badge className="bg-yellow-500">HML</Badge>
            </div>
            <div>
              <p className="font-semibold">AWS Amplify</p>
              <p className="text-sm text-muted-foreground">
                Domínio provisório gratuito, CI/CD automático, ideal para homologação rápida
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-24 text-center">
              <Badge className="bg-green-500">PRODUÇÃO</Badge>
            </div>
            <div>
              <p className="font-semibold">ECS Fargate + CloudFront</p>
              <p className="text-sm text-muted-foreground">
                Escalável, confiável, suporta SSR e todas as funcionalidades Next.js
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Atualizar Azure AD */}
      <Alert className="mt-6 border-orange-500 bg-orange-50">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <AlertDescription className="text-orange-900">
          <strong>Importante:</strong> Após obter seu domínio provisório, não esqueça de:
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>
              Atualizar variável <code>NEXT_PUBLIC_ENTRA_REDIRECT_URI</code>
            </li>
            <li>Solicitar ao admin do Azure AD adicionar a nova URL nas Redirect URIs</li>
            <li>Testar SSO com o novo domínio</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  )
}
