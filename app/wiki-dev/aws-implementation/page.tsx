"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Cloud, HelpCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function AWSImplementationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Wiki
            </Button>
          </Link>
        </div>

        <div className="mb-10">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
            <Cloud className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-slate-900">Implementação AWS - Guia Completo</h1>
          <p className="text-xl leading-relaxed text-slate-600">
            Entenda o <strong>PORQUÊ</strong> de cada serviço AWS, <strong>ONDE</strong> é usado no sistema e{" "}
            <strong>COMO</strong> implementar passo a passo
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="services">Serviços Detalhados</TabsTrigger>
            <TabsTrigger value="implementation">Implementação</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <HelpCircle className="h-6 w-6" />
                  Por que usamos AWS neste projeto?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-blue-900">
                <p className="text-base leading-relaxed">
                  O sistema de transferência de arquivos da Petrobras tem requisitos específicos que tornam a AWS a
                  escolha ideal:
                </p>
                <ul className="ml-6 space-y-3 text-base">
                  <li>
                    <strong>1. Escalabilidade Automática:</strong> O sistema precisa lidar com picos de uso (ex: final
                    de mês quando todos enviam relatórios). A AWS escala automaticamente sem intervenção manual.
                  </li>
                  <li>
                    <strong>2. Segurança Corporativa:</strong> Arquivos da Petrobras precisam de criptografia, auditoria
                    completa e controle de acesso rigoroso - AWS oferece isso nativamente.
                  </li>
                  <li>
                    <strong>3. Custo por Uso:</strong> Pagamos apenas pelo que usamos. Nos fins de semana com pouco
                    acesso, o custo é mínimo.
                  </li>
                  <li>
                    <strong>4. Alta Disponibilidade:</strong> AWS garante 99.99% de uptime. O sistema fica disponível
                    24/7 sem preocupação com manutenção de servidores.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Arquitetura do Sistema</CardTitle>
                <CardDescription>Como os serviços AWS se conectam no nosso projeto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border-2 border-slate-300 p-6">
                  <pre className="text-sm leading-relaxed text-slate-700">
                    {`┌─────────────┐
│   Usuário   │ (Navegador - app/page.tsx, app/upload/page.tsx)
│  (Browser)  │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────┐
│  CloudFront     │ ◄── Entrega rápida de arquivos (S3)
│  (CDN)          │     Usado em: components/download/download-button.tsx
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │ ◄── Recebe todas as chamadas HTTP
│  (REST API)     │     Conecta com: lib/services/api-client.ts
└────────┬────────┘
         │
    ┌────┴────┬─────────┐
    │         │         │
    ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌──────────┐
│Lambda  │ │Lambda  │ │ Lambda   │ ◄── Backend Python (FastAPI)
│Upload  │ │Download│ │ Approval │     Processa lógica de negócio
└───┬────┘ └───┬────┘ └────┬─────┘
    │          │           │
    │    ┌─────┴─────┬─────┘
    │    │           │
    ▼    ▼           ▼
┌──────────────────────┐
│     DynamoDB         │ ◄── Armazena metadados
│  (5 tabelas)         │     Usado em: lib/stores/*.ts
└──────────────────────┘
    │
    ▼
┌──────────────────────┐
│   CloudWatch Logs    │ ◄── Registra tudo
│   (Auditoria)        │     Visto em: app/auditoria/page.tsx
└──────────────────────┘

    Arquivos grandes ↓
┌──────────────────────┐
│        S3            │ ◄── Armazena arquivos físicos
│   (Bucket)           │     Usado em: app/download/page.tsx
└──────────────────────┘`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-8">
            {[
              {
                name: "AWS Lambda",
                icon: "⚡",
                why: "Por que precisamos?",
                whyText:
                  "Nosso backend Python (FastAPI) precisa processar uploads, validar arquivos ZIP, aprovar/rejeitar, e enviar notificações. Lambda executa esse código SEM precisar gerenciar servidores.",
                where: "Onde é usado no nosso sistema?",
                whereItems: [
                  "📤 Upload de arquivos → Recebe arquivo do frontend (app/upload/page.tsx), valida se é ZIP, verifica tamanho, salva no S3, cria registro no DynamoDB",
                  "📥 Download → Busca arquivo no S3, verifica permissões do usuário, incrementa contador de downloads (app/download/page.tsx)",
                  "✅ Aprovação/Rejeição → Supervisor aprova arquivo (app/supervisor/page.tsx), Lambda atualiza status no DynamoDB, envia notificação",
                  "🔔 Notificações → Quando arquivo expira ou é aprovado, Lambda envia notificação (components/shared/notification-dropdown.tsx)",
                  "📊 Métricas → Calcula estatísticas do dashboard (app/upload/page.tsx - metrics)",
                ],
                cost: "$20/mês para 100 usuários",
                howItWorks:
                  "Quando você clica em 'Upload' no frontend, a requisição vai para API Gateway que chama uma função Lambda. O código Python valida o arquivo e salva no S3.",
              },
              {
                name: "API Gateway",
                icon: "🌐",
                why: "Por que precisamos?",
                whyText:
                  "Precisamos de uma 'porta de entrada' única para todas as requisições HTTP. API Gateway gerencia autenticação, rate limiting, e roteia cada chamada para a Lambda correta.",
                where: "Onde é usado no nosso sistema?",
                whereItems: [
                  "🔐 /api/auth/login → Login de usuários (components/auth/login-form.tsx)",
                  "📤 /api/files/upload → Upload de arquivos (app/upload/page.tsx)",
                  "📥 /api/files/download/:id → Download (app/download/page.tsx)",
                  "✅ /api/files/approve/:id → Aprovar arquivo (app/supervisor/page.tsx)",
                  "🔔 /api/notifications → Buscar notificações (components/shared/notification-dropdown.tsx)",
                  "📊 /api/metrics → Estatísticas do dashboard (components/dashboard/metrics-dashboard.tsx)",
                ],
                cost: "$3.50/mês",
                howItWorks:
                  "Todas as chamadas 'fetch()' no frontend (lib/services/api-client.ts) passam pelo API Gateway antes de chegar no Lambda.",
              },
              {
                name: "DynamoDB",
                icon: "🗄️",
                why: "Por que precisamos?",
                whyText:
                  "Precisamos armazenar METADADOS (não os arquivos): quem enviou, para quem, status, data de expiração. DynamoDB é extremamente rápido e escala automaticamente.",
                where: "Onde é usado no nosso sistema?",
                whereItems: [
                  "👤 Tabela USERS → Armazena usuários (interno, externo, supervisor) usado em: lib/stores/auth-store.ts",
                  "📁 Tabela FILES → Lista de todos os arquivos enviados, status, expiração usado em: lib/stores/workflow-store.ts",
                  "📋 Tabela AUDIT_LOGS → Todos os logs de auditoria vistos em: app/auditoria/page.tsx",
                  "🔔 Tabela NOTIFICATIONS → Notificações do sistema em: lib/stores/notification-store.ts",
                  "🔑 Tabela SESSIONS → Sessões ativas de usuários para controle de login",
                ],
                cost: "$25/mês",
                howItWorks:
                  "Quando você faz upload, Lambda salva o arquivo no S3 E cria um registro no DynamoDB com {fileId, fileName, uploadedBy, status, expiresAt}.",
              },
              {
                name: "S3 (Simple Storage Service)",
                icon: "📦",
                why: "Por que precisamos?",
                whyText:
                  "S3 é o 'HD na nuvem'. Arquivos ZIP de até 5GB precisam ser armazenados com segurança, criptografia e disponibilidade garantida.",
                where: "Onde é usado no nosso sistema?",
                whereItems: [
                  "📤 Upload → Arquivo enviado vai para S3 bucket 'petrobras-files-prod'",
                  "📥 Download → Frontend busca arquivo do S3 via URL assinada (24h de validade)",
                  "🗑️ Expiration → Arquivos expirados são movidos para S3 Glacier (armazenamento barato) ou deletados",
                  "📸 Thumbnails → Preview de imagens armazenado no S3 (se implementado)",
                ],
                cost: "$23/mês para ~500GB",
                howItWorks:
                  "Lambda gera uma 'URL assinada' do S3 que expira em 24h. Você clica em Download e recebe essa URL segura.",
              },
              {
                name: "CloudFront (CDN)",
                icon: "🚀",
                why: "Por que precisamos?",
                whyText:
                  "Usuários da Petrobras podem estar no Brasil, EUA, Europa. CloudFront mantém cópias dos arquivos em servidores ao redor do mundo para download RÁPIDO.",
                where: "Onde é usado no nosso sistema?",
                whereItems: [
                  "📥 Download de arquivos → Em vez de buscar no S3 (Virginia), CloudFront entrega de São Paulo (mais rápido)",
                  "🖼️ Imagens e assets → Logo da Petrobras, ícones carregam via CloudFront",
                  "📄 Frontend estático → HTML/CSS/JS do Next.js servido via CloudFront",
                ],
                cost: "$10/mês",
                howItWorks:
                  "Primeira vez que alguém baixa um arquivo, vem do S3. Depois, CloudFront guarda cópia e entrega mais rápido para próximos usuários.",
              },
              {
                name: "AWS Cognito",
                icon: "🔐",
                why: "Por que precisamos?",
                whyText:
                  "Autenticação segura com JWT, recuperação de senha, MFA opcional. Não precisamos construir sistema de login do zero.",
                where: "Onde é usado no nosso sistema?",
                whereItems: [
                  "🔐 Login → components/auth/login-form.tsx chama Cognito",
                  "👤 Cadastro → Novos usuários externos são criados no Cognito",
                  "🔑 Recuperação de senha → components/auth/forgot-password-modal.tsx",
                  "🛡️ JWT Tokens → Armazenados em lib/stores/auth-store.ts",
                  "🚪 Logout → Invalida token no Cognito",
                ],
                cost: "$50/mês para 100 usuários ativos",
                howItWorks:
                  "Usuário digita email/senha → Cognito valida → Retorna JWT token → Frontend usa token em todas requisições → API Gateway valida token.",
              },
            ].map((service, idx) => (
              <Card key={idx} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="mb-2 flex items-center gap-3 text-2xl">
                        <span className="text-3xl">{service.icon}</span>
                        {service.name}
                      </CardTitle>
                      <Badge variant="secondary" className="text-sm">
                        {service.cost}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Why */}
                  <div className="rounded-lg bg-amber-50 p-5">
                    <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-900">
                      <HelpCircle className="h-5 w-5" />
                      {service.why}
                    </h4>
                    <p className="leading-relaxed text-amber-900">{service.whyText}</p>
                  </div>

                  {/* Where */}
                  <div className="rounded-lg bg-green-50 p-5">
                    <h4 className="mb-3 text-lg font-semibold text-green-900">{service.where}</h4>
                    <ul className="space-y-2">
                      {service.whereItems.map((item, i) => (
                        <li key={i} className="text-sm leading-relaxed text-green-900">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* How it works */}
                  <div className="rounded-lg bg-blue-50 p-5">
                    <h4 className="mb-2 text-lg font-semibold text-blue-900">Como funciona na prática?</h4>
                    <p className="leading-relaxed text-blue-900">{service.howItWorks}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="implementation" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Implementação Passo a Passo</CardTitle>
                <CardDescription>Guia completo para colocar o sistema no ar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {[
                    {
                      phase: "FASE 1: Preparação (1 hora)",
                      steps: [
                        {
                          title: "1.1 - Criar conta AWS",
                          what: "Acesse aws.amazon.com e crie uma conta",
                          why: "Precisamos de uma conta para usar os serviços",
                          how: "Cadastre email, cartão de crédito, escolha plano free tier",
                        },
                        {
                          title: "1.2 - Instalar AWS CLI",
                          what: "Ferramenta de linha de comando para gerenciar AWS",
                          why: "Vamos criar recursos via terminal (mais rápido que console web)",
                          how: "curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'",
                        },
                        {
                          title: "1.3 - Configurar credenciais",
                          what: "Conectar seu terminal à sua conta AWS",
                          why: "AWS CLI precisa saber QUAL conta usar",
                          how: "aws configure (digite Access Key, Secret Key, region us-east-1)",
                        },
                      ],
                    },
                    {
                      phase: "FASE 2: Banco de Dados (2 horas)",
                      steps: [
                        {
                          title: "2.1 - Criar tabelas DynamoDB",
                          what: "5 tabelas: users, files, audit-logs, notifications, sessions",
                          why: "Armazenar metadados do sistema",
                          how: "cd sql && python create-tables.py (script automatizado)",
                        },
                        {
                          title: "2.2 - Configurar índices GSI",
                          what: "Índices secundários para buscas rápidas",
                          why: "Buscar arquivos por status, por usuário, por data de expiração",
                          how: "Script create-tables.py já cria os GSIs automaticamente",
                        },
                        {
                          title: "2.3 - Habilitar backup",
                          what: "Point-in-Time Recovery para recuperação de dados",
                          why: "Se algo der errado, podemos voltar no tempo",
                          how: "aws dynamodb update-continuous-backups --table-name petrobras-files --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true",
                        },
                      ],
                    },
                    {
                      phase: "FASE 3: Armazenamento S3 (1 hora)",
                      steps: [
                        {
                          title: "3.1 - Criar bucket S3",
                          what: "Bucket chamado 'petrobras-files-prod'",
                          why: "Armazenar arquivos ZIP enviados pelos usuários",
                          how: "aws s3 mb s3://petrobras-files-prod --region us-east-1",
                        },
                        {
                          title: "3.2 - Configurar criptografia",
                          what: "AES-256 encryption at rest",
                          why: "Segurança: arquivos sensíveis da Petrobras",
                          how: "aws s3api put-bucket-encryption --bucket petrobras-files-prod --server-side-encryption-configuration file://encryption.json",
                        },
                        {
                          title: "3.3 - Configurar lifecycle",
                          what: "Mover arquivos antigos para Glacier após 90 dias",
                          why: "Reduzir custos: arquivos antigos custam 10x menos no Glacier",
                          how: "aws s3api put-bucket-lifecycle-configuration --bucket petrobras-files-prod --lifecycle-configuration file://lifecycle.json",
                        },
                      ],
                    },
                    {
                      phase: "FASE 4: Backend Lambda (3 horas)",
                      steps: [
                        {
                          title: "4.1 - Preparar código Python",
                          what: "Backend FastAPI com funções: upload, download, approval, notifications",
                          why: "Lógica de negócio que processa as requisições",
                          how: "cd backend && pip install -r requirements.txt && python -m pytest tests/",
                        },
                        {
                          title: "4.2 - Criar função Lambda",
                          what: "4 funções Lambda: uploadHandler, downloadHandler, approvalHandler, notificationHandler",
                          why: "Cada função processa um tipo de requisição",
                          how: "cd backend && ./deploy-lambda.sh (script cria funções, faz upload do código zipado)",
                        },
                        {
                          title: "4.3 - Configurar variáveis de ambiente",
                          what: "DYNAMODB_TABLE, S3_BUCKET, COGNITO_POOL_ID, etc.",
                          why: "Lambda precisa saber onde estão DynamoDB, S3 e Cognito",
                          how: "aws lambda update-function-configuration --function-name uploadHandler --environment Variables={S3_BUCKET=petrobras-files-prod}",
                        },
                        {
                          title: "4.4 - Configurar permissões IAM",
                          what: "Role com permissões: S3 read/write, DynamoDB read/write, CloudWatch logs",
                          why: "Lambda precisa de permissão para acessar outros serviços AWS",
                          how: "aws iam create-role --role-name PetrobrasLambdaRole --assume-role-policy-document file://trust-policy.json",
                        },
                      ],
                    },
                    {
                      phase: "FASE 5: API Gateway (2 horas)",
                      steps: [
                        {
                          title: "5.1 - Criar API REST",
                          what: "API Gateway com nome 'petrobras-file-api'",
                          why: "Porta de entrada única para todas as requisições HTTP",
                          how: "aws apigateway create-rest-api --name petrobras-file-api --endpoint-configuration types=REGIONAL",
                        },
                        {
                          title: "5.2 - Criar recursos e métodos",
                          what: "Rotas: /auth/login (POST), /files/upload (POST), /files/download/:id (GET), /files/approve/:id (PUT)",
                          why: "Cada rota mapeia para uma função Lambda específica",
                          how: "aws apigateway create-resource --rest-api-id abc123 --parent-id xyz789 --path-part files",
                        },
                        {
                          title: "5.3 - Integrar com Lambda",
                          what: "Conectar cada rota do API Gateway com sua função Lambda correspondente",
                          why: "Quando requisição chega em /files/upload, API Gateway chama uploadHandler Lambda",
                          how: "aws apigateway put-integration --rest-api-id abc123 --resource-id xyz --http-method POST --type AWS_PROXY --integration-http-method POST --uri arn:aws:lambda:...",
                        },
                        {
                          title: "5.4 - Deploy API",
                          what: "Criar stage 'prod' e publicar API",
                          why: "API só fica acessível após deploy",
                          how: "aws apigateway create-deployment --rest-api-id abc123 --stage-name prod",
                        },
                        {
                          title: "5.5 - Configurar CORS",
                          what: "Permitir requisições do frontend (localhost:3000 em dev, domínio em prod)",
                          why: "Browsers bloqueiam requisições cross-origin sem CORS configurado",
                          how: "aws apigateway put-method-response --rest-api-id abc123 --resource-id xyz --http-method OPTIONS --status-code 200 --response-parameters method.response.header.Access-Control-Allow-Origin=true",
                        },
                      ],
                    },
                    {
                      phase: "FASE 6: Autenticação Cognito (2 horas)",
                      steps: [
                        {
                          title: "6.1 - Criar User Pool",
                          what: "Cognito User Pool 'petrobras-users'",
                          why: "Gerenciar usuários, senhas, tokens JWT",
                          how: "aws cognito-idp create-user-pool --pool-name petrobras-users --policies file://password-policy.json",
                        },
                        {
                          title: "6.2 - Criar App Client",
                          what: "App client para frontend Next.js se comunicar com Cognito",
                          why: "Frontend precisa de client_id para fazer login/signup",
                          how: "aws cognito-idp create-user-pool-client --user-pool-id us-east-1_ABC123 --client-name petrobras-web-app",
                        },
                        {
                          title: "6.3 - Configurar grupos de usuários",
                          what: "3 grupos: INTERNAL, EXTERNAL, SUPERVISOR",
                          why: "Controlar permissões: supervisor pode aprovar, externo só pode baixar",
                          how: "aws cognito-idp create-group --user-pool-id us-east-1_ABC123 --group-name SUPERVISOR --description 'Supervisores que aprovam arquivos'",
                        },
                        {
                          title: "6.4 - Criar usuário admin inicial",
                          what: "Primeiro usuário supervisor para acessar o sistema",
                          why: "Precisa de alguém para criar outros usuários",
                          how: "aws cognito-idp admin-create-user --user-pool-id us-east-1_ABC123 --username admin@petrobras.com --user-attributes Name=email,Value=admin@petrobras.com",
                        },
                        {
                          title: "6.5 - Integrar API Gateway com Cognito",
                          what: "Autorização: toda requisição deve ter token JWT válido",
                          why: "Bloquear acesso não autorizado às APIs",
                          how: "aws apigateway create-authorizer --rest-api-id abc123 --name CognitoAuth --type COGNITO_USER_POOLS --provider-arns arn:aws:cognito-idp:us-east-1:...",
                        },
                      ],
                    },
                  ].map((phase, phaseIdx) => (
                    <div key={phaseIdx} className="rounded-lg border-2 border-slate-200 p-6">
                      <h3 className="mb-6 text-2xl font-bold text-slate-900">{phase.phase}</h3>
                      <div className="space-y-6">
                        {phase.steps.map((step, stepIdx) => (
                          <div key={stepIdx} className="rounded-lg bg-slate-50 p-5">
                            <h4 className="mb-3 font-semibold text-slate-900">{step.title}</h4>
                            <div className="space-y-2">
                              <p className="text-sm text-slate-700">
                                <strong className="text-blue-600">O QUE:</strong> {step.what}
                              </p>
                              <p className="text-sm text-slate-700">
                                <strong className="text-green-600">POR QUÊ:</strong> {step.why}
                              </p>
                              <p className="text-sm text-slate-700">
                                <strong className="text-purple-600">COMO:</strong>{" "}
                                <code className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-100">
                                  {step.how}
                                </code>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="flex items-start gap-4 p-6">
                <CheckCircle2 className="h-8 w-8 shrink-0 text-green-600" />
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-green-900">Próximos Passos</h3>
                  <p className="leading-relaxed text-green-800">
                    Após completar essas 6 fases, consulte as outras páginas da Wiki para:
                    <br />• <strong>Data Models</strong> - Entender estrutura das tabelas
                    <br />• <strong>Quick Start</strong> - Deploy automatizado completo
                    <br />• <strong>Deployment Guide</strong> - Configurações de produção
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
