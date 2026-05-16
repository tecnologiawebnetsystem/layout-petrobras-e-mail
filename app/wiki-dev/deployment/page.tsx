"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Server, ChevronLeft, Shield, LineChart, Bell, GitBranch } from "lucide-react"
import Link from "next/link"

export default function DeploymentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-3">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Voltar para Wiki
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 shadow-lg">
            <Server className="h-7 w-7 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">Guia de Deployment</h1>
          <p className="text-lg text-slate-600">
            Deploy completo em produção com segurança, monitoramento e boas práticas
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Badge variant="secondary">Produção</Badge>
            <Badge variant="secondary">AWS</Badge>
            <Badge variant="secondary">CI/CD</Badge>
          </div>
        </div>

        <Tabs defaultValue="preparation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="preparation">Preparação</TabsTrigger>
            <TabsTrigger value="production">Produção</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
            <TabsTrigger value="cicd">CI/CD</TabsTrigger>
          </TabsList>

          {/* Preparação */}
          <TabsContent value="preparation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Checklist de Pré-Deployment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      category: "Infraestrutura",
                      items: [
                        "✓ Conta AWS configurada e billing verificado",
                        "✓ Domínio registrado (Route 53 ou externo)",
                        "✓ Certificado SSL/TLS (AWS Certificate Manager)",
                        "✓ VPC e subnets configuradas",
                        "✓ Security Groups definidos",
                      ],
                    },
                    {
                      category: "Código",
                      items: [
                        "✓ Todos os testes passando (unit + integration)",
                        "✓ Code review completo",
                        "✓ Variáveis de ambiente documentadas",
                        "✓ Logs estruturados implementados",
                        "✓ Tratamento de erros robusto",
                      ],
                    },
                    {
                      category: "Banco de Dados",
                      items: [
                        "✓ Tabelas DynamoDB criadas",
                        "✓ Índices GSI configurados",
                        "✓ Backup automático habilitado",
                        "✓ Point-in-Time Recovery ativado",
                        "✓ Dados de teste limpos",
                      ],
                    },
                    {
                      category: "Segurança",
                      items: [
                        "✓ Secrets no AWS Secrets Manager",
                        "✓ IAM Roles com least privilege",
                        "✓ Encryption at rest habilitada",
                        "✓ Encryption in transit (HTTPS)",
                        "✓ WAF rules configuradas",
                      ],
                    },
                  ].map((section) => (
                    <div key={section.category} className="rounded-lg border border-slate-200 bg-white p-4">
                      <h4 className="mb-3 font-semibold text-slate-900">{section.category}</h4>
                      <ul className="space-y-2">
                        {section.items.map((item, i) => (
                          <li key={i} className="text-sm text-slate-700">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Produção */}
          <TabsContent value="production" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deploy em Produção</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-3 font-semibold">1. Deploy do Backend (AWS Lambda + API Gateway)</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-950 p-4">
                    <code className="block overflow-x-auto text-xs text-slate-100">
                      {`# Deploy via CloudFormation
aws cloudformation create-stack \\
  --stack-name petrobras-prod \\
  --template-body file://sql/cloudformation-template.yaml \\
  --parameters ParameterKey=Environment,ParameterValue=prod \\
  --capabilities CAPABILITY_IAM

# Aguardar conclusão
aws cloudformation wait stack-create-complete \\
  --stack-name petrobras-prod`}
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">2. Deploy do Frontend (Vercel)</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-950 p-4">
                    <code className="block overflow-x-auto text-xs text-slate-100">
                      {`# Conectar repositório GitHub à Vercel
vercel link

# Deploy em produção
vercel --prod

# Configurar domínio customizado
vercel domains add petrobras-transfer.com.br`}
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">3. Configurar CloudFront</h3>
                  <p className="mb-2 text-sm text-slate-600">
                    CloudFront já é criado pelo CloudFormation, mas configure:
                  </p>
                  <ul className="ml-5 space-y-1 text-sm text-slate-700">
                    <li>• Origin: S3 bucket para arquivos estáticos</li>
                    <li>• Behavior: API Gateway como origin alternativa</li>
                    <li>• SSL Certificate: Usar ACM certificate</li>
                    <li>• Cache policies: Otimizar para arquivos grandes</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">4. Configurar DNS (Route 53)</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-950 p-4">
                    <code className="block overflow-x-auto text-xs text-slate-100">
                      {`# Criar hosted zone
aws route53 create-hosted-zone \\
  --name petrobras-transfer.com.br \\
  --caller-reference $(date +%s)

# Criar record A apontando para CloudFront
aws route53 change-resource-record-sets \\
  --hosted-zone-id Z1234567890ABC \\
  --change-batch file://dns-config.json`}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segurança */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Configurações de Segurança
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 font-semibold">AWS WAF (Web Application Firewall)</h3>
                    <ul className="ml-5 space-y-2 text-sm text-slate-700">
                      <li>• Rate limiting: 1000 requisições por 5 minutos por IP</li>
                      <li>• SQL Injection protection</li>
                      <li>• XSS (Cross-Site Scripting) protection</li>
                      <li>• Geographic restrictions (se necessário)</li>
                      <li>• IP allowlist/blocklist</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold">AWS Secrets Manager</h3>
                    <p className="mb-2 text-sm text-slate-600">Armazenar credenciais sensíveis:</p>
                    <div className="rounded-lg border border-slate-200 bg-slate-950 p-4">
                      <code className="block overflow-x-auto text-xs text-slate-100">
                        {`aws secretsmanager create-secret \\
  --name petrobras/prod/db-credentials \\
  --secret-string '{"username":"admin","password":"..."}'`}
                      </code>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold">Encryption</h3>
                    <ul className="ml-5 space-y-2 text-sm text-slate-700">
                      <li>• S3: Encryption at rest com KMS</li>
                      <li>• DynamoDB: Encryption at rest habilitada</li>
                      <li>• API Gateway: TLS 1.2+</li>
                      <li>• Lambda: Environment variables encriptadas</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold">IAM Best Practices</h3>
                    <ul className="ml-5 space-y-2 text-sm text-slate-700">
                      <li>• Usar roles ao invés de access keys</li>
                      <li>• Aplicar least privilege principle</li>
                      <li>• Habilitar MFA para usuários admin</li>
                      <li>• Rotacionar credenciais regularmente</li>
                      <li>• Usar IAM policies com conditions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoramento */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-blue-600" />
                  Monitoramento e Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 font-semibold">CloudWatch Dashboards</h3>
                    <p className="mb-3 text-sm text-slate-600">Criar dashboards para métricas principais:</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        "Lambda invocations e errors",
                        "API Gateway 4xx/5xx errors",
                        "DynamoDB read/write capacity",
                        "S3 bucket size e requests",
                        "CloudFront cache hit ratio",
                        "Tempo de resposta da API",
                      ].map((metric) => (
                        <div
                          key={metric}
                          className="flex items-center gap-2 rounded border border-slate-200 p-2 text-sm"
                        >
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          {metric}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold">CloudWatch Alarms</h3>
                    <div className="space-y-3">
                      {[
                        {
                          name: "High Error Rate",
                          condition: "API Gateway 5xx > 1% em 5 minutos",
                          action: "SNS notification para equipe",
                        },
                        {
                          name: "Lambda Throttling",
                          condition: "Lambda throttles > 10 em 1 minuto",
                          action: "Aumentar concurrency limit",
                        },
                        {
                          name: "DynamoDB Throttling",
                          condition: "Read/Write throttles > 0",
                          action: "Aumentar capacidade ou usar on-demand",
                        },
                        {
                          name: "High Latency",
                          condition: "P99 latency > 2 segundos",
                          action: "Investigar performance",
                        },
                      ].map((alarm) => (
                        <div key={alarm.name} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <h4 className="mb-1 font-semibold text-amber-900">{alarm.name}</h4>
                          <p className="mb-1 text-sm text-amber-800">
                            <strong>Condição:</strong> {alarm.condition}
                          </p>
                          <p className="text-sm text-amber-800">
                            <strong>Ação:</strong> {alarm.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold">CloudWatch Logs Insights</h3>
                    <p className="mb-2 text-sm text-slate-600">Queries úteis para análise:</p>
                    <div className="rounded-lg border border-slate-200 bg-slate-950 p-4">
                      <code className="block overflow-x-auto text-xs text-slate-100">
                        {`# Erros nas últimas 24 horas
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

# Top 10 endpoints mais lentos
fields @message
| filter @type = "REPORT"
| stats avg(@duration) as avg_duration by @logStream
| sort avg_duration desc
| limit 10`}
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CI/CD */}
          <TabsContent value="cicd" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-purple-600" />
                  Pipeline CI/CD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 font-semibold">GitHub Actions Workflow</h3>
                    <p className="mb-3 text-sm text-slate-600">
                      Automatize deploy com GitHub Actions (.github/workflows/deploy.yml):
                    </p>
                    <div className="rounded-lg border border-slate-200 bg-slate-950 p-4">
                      <code className="block overflow-x-auto text-xs text-slate-100">
                        {`name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy Backend
        run: |
          aws cloudformation deploy \\
            --template-file sql/cloudformation-template.yaml \\
            --stack-name petrobras-prod \\
            --capabilities CAPABILITY_IAM
      
      - name: Deploy Frontend
        run: vercel --prod --token=\${{ secrets.VERCEL_TOKEN }}`}
                      </code>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold">Estratégia de Branches</h3>
                    <ul className="ml-5 space-y-2 text-sm text-slate-700">
                      <li>
                        • <strong>main:</strong> Produção (deploy automático)
                      </li>
                      <li>
                        • <strong>develop:</strong> Staging (deploy automático para ambiente de testes)
                      </li>
                      <li>
                        • <strong>feature/*:</strong> Novas features (PR para develop)
                      </li>
                      <li>
                        • <strong>hotfix/*:</strong> Correções urgentes (PR direto para main)
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold">Testes Automatizados</h3>
                    <p className="mb-2 text-sm text-slate-600">Executar antes do deploy:</p>
                    <ul className="ml-5 space-y-1 text-sm text-slate-700">
                      <li>• Unit tests (Jest)</li>
                      <li>• Integration tests (API endpoints)</li>
                      <li>• E2E tests (Playwright)</li>
                      <li>• Linting (ESLint)</li>
                      <li>• Type checking (TypeScript)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card className="mt-8 border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-4 p-6">
            <Bell className="h-6 w-6 shrink-0 text-red-600" />
            <div>
              <h3 className="mb-1 font-semibold text-red-900">Pós-Deploy</h3>
              <p className="text-sm leading-relaxed text-red-800">
                Após o deploy, monitore o sistema por 24-48 horas, verifique logs de erro, configure alertas no
                Slack/Email, e tenha um plano de rollback preparado em caso de problemas críticos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
