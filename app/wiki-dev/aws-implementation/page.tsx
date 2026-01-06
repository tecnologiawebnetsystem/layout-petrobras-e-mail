"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Cloud, HelpCircle, CheckCircle2, Globe } from "lucide-react"
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

          <TabsContent value="provisorio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-6 w-6" />
                  Domínios Provisórios AWS para Testes (HML)
                </CardTitle>
                <CardDescription>
                  Como criar URLs temporárias na AWS para testar o sistema antes de usar o domínio oficial da Petrobras
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* O que são domínios provisórios */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="mb-2 font-bold text-blue-900">Por que usar domínio provisório?</h4>
                  <p className="text-sm text-blue-800">
                    Antes de colocar o sistema no domínio oficial da Petrobras (ex: <code>files.petrobras.com.br</code>
                    ), é fundamental testar em um <strong>ambiente de homologação (HML)</strong> com URL temporária.
                    Assim você valida tudo funciona antes de ir para produção.
                  </p>
                </div>

                {/* Opções de domínios temporários */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900">4 Opções de Domínios Provisórios na AWS</h3>

                  {/* Opção 1: CloudFront URL */}
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-green-900">
                        ✅ Opção 1: URL do CloudFront (RECOMENDADA)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded bg-white p-3">
                        <p className="mb-2 font-semibold text-slate-900">URL Gerada:</p>
                        <code className="text-sm text-blue-600">https://d1234abcd5678.cloudfront.net</code>
                      </div>

                      <div className="space-y-2">
                        <p className="font-semibold text-green-900">✅ Vantagens:</p>
                        <ul className="space-y-1 text-sm text-slate-700">
                          <li>
                            • <strong>HTTPS gratuito</strong> - Já vem com certificado SSL da AWS
                          </li>
                          <li>
                            • <strong>CDN global</strong> - Rápido em qualquer lugar do mundo
                          </li>
                          <li>
                            • <strong>Produção-ready</strong> - Mesma infraestrutura que vai usar em PRD
                          </li>
                          <li>
                            • <strong>Fácil de criar</strong> - Automático ao criar distribuição CloudFront
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <p className="font-semibold text-red-900">❌ Desvantagens:</p>
                        <ul className="space-y-1 text-sm text-slate-700">
                          <li>• URL feia e difícil de lembrar</li>
                          <li>• Precisa reconfigurar variáveis de ambiente depois para PRD</li>
                        </ul>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-2 font-semibold text-slate-900">Como criar:</p>
                        <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-sm text-green-400">
                          {`# 1. Criar distribuição CloudFront
aws cloudfront create-distribution \\
  --origin-domain-name petrobras-files-hml.s3.amazonaws.com \\
  --default-root-object index.html

# 2. Aguardar deploy (~15 minutos)
aws cloudfront list-distributions

# 3. Copiar a URL gerada
# Exemplo: https://d1a2b3c4d5e6f7.cloudfront.net`}
                        </pre>
                      </div>

                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="mb-2 text-sm font-semibold text-blue-900">Configurar no projeto:</p>
                        <pre className="overflow-x-auto text-xs text-blue-800">
                          {`# .env.hml
NEXT_PUBLIC_API_URL=https://d1a2b3c4d5e6f7.cloudfront.net
NEXT_PUBLIC_ENTRA_REDIRECT_URI=https://d1a2b3c4d5e6f7.cloudfront.net`}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Opção 2: S3 Static Website */}
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-yellow-900">⚠️ Opção 2: S3 Static Website URL</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded bg-white p-3">
                        <p className="mb-2 font-semibold text-slate-900">URL Gerada:</p>
                        <code className="text-sm text-blue-600">
                          http://petrobras-files-hml.s3-website-us-east-1.amazonaws.com
                        </code>
                      </div>

                      <div className="space-y-2">
                        <p className="font-semibold text-yellow-900">✅ Vantagens:</p>
                        <ul className="space-y-1 text-sm text-slate-700">
                          <li>
                            • <strong>Muito simples</strong> - 1 comando para criar
                          </li>
                          <li>
                            • <strong>Gratuito</strong> - Sem custos adicionais
                          </li>
                          <li>
                            • <strong>Bom para testes rápidos</strong>
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <p className="font-semibold text-red-900">❌ Desvantagens:</p>
                        <ul className="space-y-1 text-sm text-slate-700">
                          <li>
                            • <strong>SEM HTTPS</strong> - Apenas HTTP (inseguro)
                          </li>
                          <li>• Lento - Sem CDN</li>
                          <li>• Não recomendado para HML oficial</li>
                        </ul>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-2 font-semibold text-slate-900">Como criar:</p>
                        <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-sm text-green-400">
                          {`# 1. Criar bucket S3
aws s3 mb s3://petrobras-files-hml

# 2. Configurar como website
aws s3 website s3://petrobras-files-hml \\
  --index-document index.html \\
  --error-document 404.html

# 3. Tornar público
aws s3api put-bucket-policy \\
  --bucket petrobras-files-hml \\
  --policy file://public-policy.json

# URL gerada automaticamente:
# http://petrobras-files-hml.s3-website-us-east-1.amazonaws.com`}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Opção 3: API Gateway Custom Domain */}
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-purple-900">💡 Opção 3: API Gateway URL</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded bg-white p-3">
                        <p className="mb-2 font-semibold text-slate-900">URL Gerada:</p>
                        <code className="text-sm text-blue-600">
                          https://abc123xyz.execute-api.us-east-1.amazonaws.com/hml
                        </code>
                      </div>

                      <div className="space-y-2">
                        <p className="font-semibold text-purple-900">✅ Vantagens:</p>
                        <ul className="space-y-1 text-sm text-slate-700">
                          <li>
                            • <strong>HTTPS gratuito</strong>
                          </li>
                          <li>
                            • <strong>Bom para API backend</strong>
                          </li>
                          <li>• Stages separados (dev/hml/prd)</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <p className="font-semibold text-red-900">❌ Desvantagens:</p>
                        <ul className="space-y-1 text-sm text-slate-700">
                          <li>• Apenas para backend API (não frontend)</li>
                          <li>• URL muda se recriar API Gateway</li>
                        </ul>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-2 font-semibold text-slate-900">Como criar:</p>
                        <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-sm text-green-400">
                          {`# Criar API Gateway
aws apigateway create-rest-api \\
  --name petrobras-files-api-hml \\
  --description "API HML"

# Deploy em stage 'hml'
aws apigateway create-deployment \\
  --rest-api-id abc123xyz \\
  --stage-name hml

# URL gerada:
# https://abc123xyz.execute-api.us-east-1.amazonaws.com/hml`}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Opção 4: Route 53 Subdomínio */}
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-900">
                        🎯 Opção 4: Route 53 com Subdomínio (IDEAL PARA HML)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded bg-white p-3">
                        <p className="mb-2 font-semibold text-slate-900">URL Personalizada:</p>
                        <code className="text-sm text-blue-600">https://files-hml.petrobras.com.br</code>
                      </div>

                      <div className="space-y-2">
                        <p className="font-semibold text-blue-900">✅ Vantagens:</p>
                        <ul className="space-y-1 text-sm text-slate-700">
                          <li>
                            • <strong>URL profissional</strong> - Parece domínio real
                          </li>
                          <li>
                            • <strong>Fácil de lembrar</strong> - files-hml.petrobras.com.br
                          </li>
                          <li>
                            • <strong>Separação clara</strong> - HML vs PRD
                          </li>
                          <li>
                            • <strong>Certificado SSL</strong> - Via AWS Certificate Manager
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <p className="font-semibold text-red-900">❌ Desvantagens:</p>
                        <ul className="space-y-1 text-sm text-slate-700">
                          <li>• Precisa ter acesso ao DNS da Petrobras</li>
                          <li>• Mais complexo de configurar</li>
                          <li>• Certificado SSL leva ~30 minutos para emitir</li>
                        </ul>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-2 font-semibold text-slate-900">Como criar (Passo a passo):</p>

                        <div className="space-y-4 text-sm">
                          <div>
                            <p className="font-semibold text-slate-900">1️⃣ Criar Certificado SSL (ACM):</p>
                            <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-3 text-green-400">
                              {`aws acm request-certificate \\
  --domain-name files-hml.petrobras.com.br \\
  --validation-method DNS \\
  --region us-east-1

# Copiar o CNAME para validação
aws acm describe-certificate \\
  --certificate-arn arn:aws:acm:...`}
                            </pre>
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">2️⃣ Validar Certificado no DNS:</p>
                            <ul className="ml-4 mt-2 list-disc space-y-1 text-slate-700">
                              <li>Pedir ao administrador DNS da Petrobras</li>
                              <li>Adicionar registro CNAME fornecido pela AWS</li>
                              <li>Aguardar ~5-30 minutos para validação</li>
                            </ul>
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              3️⃣ Criar Distribuição CloudFront com domínio custom:
                            </p>
                            <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-3 text-green-400">
                              {`aws cloudfront create-distribution \\
  --origin-domain-name petrobras-files-hml.s3.amazonaws.com \\
  --default-root-object index.html \\
  --viewer-certificate ACMCertificateArn=arn:aws:acm:...,\\
SSLSupportMethod=sni-only,\\
MinimumProtocolVersion=TLSv1.2_2021 \\
  --aliases files-hml.petrobras.com.br`}
                            </pre>
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">4️⃣ Criar Record Set no Route 53:</p>
                            <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-3 text-green-400">
                              {`aws route53 change-resource-record-sets \\
  --hosted-zone-id Z1234567890ABC \\
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "files-hml.petrobras.com.br",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d1234abcd.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'`}
                            </pre>
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">5️⃣ Testar:</p>
                            <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-3 text-green-400">
                              {`# Aguardar propagação DNS (~15 minutos)
nslookup files-hml.petrobras.com.br

# Testar HTTPS
curl -I https://files-hml.petrobras.com.br`}
                            </pre>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                        <p className="mb-2 text-sm font-semibold text-green-900">📋 Checklist Final:</p>
                        <ul className="space-y-1 text-sm text-green-800">
                          <li>✅ Certificado SSL validado e ativo</li>
                          <li>✅ CloudFront distribution criada com domínio custom</li>
                          <li>✅ Record A apontando para CloudFront</li>
                          <li>✅ HTTPS funcionando (sem aviso de segurança)</li>
                          <li>✅ Variáveis de ambiente atualizadas no Vercel</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Comparação das opções */}
                <Card>
                  <CardHeader>
                    <CardTitle>Comparação: Qual Escolher?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-300 bg-slate-100">
                            <th className="p-3 text-left">Opção</th>
                            <th className="p-3 text-left">HTTPS</th>
                            <th className="p-3 text-left">Facilidade</th>
                            <th className="p-3 text-left">Custo</th>
                            <th className="p-3 text-left">Recomendado Para</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          <tr className="border-b border-slate-200">
                            <td className="p-3 font-semibold">CloudFront URL</td>
                            <td className="p-3">✅ Sim</td>
                            <td className="p-3">⭐⭐⭐⭐⭐</td>
                            <td className="p-3">~$5/mês</td>
                            <td className="p-3">Testes rápidos, demos</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 font-semibold">S3 Static Website</td>
                            <td className="p-3">❌ Não</td>
                            <td className="p-3">⭐⭐⭐⭐⭐</td>
                            <td className="p-3">Grátis</td>
                            <td className="p-3">Dev local apenas</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 font-semibold">API Gateway URL</td>
                            <td className="p-3">✅ Sim</td>
                            <td className="p-3">⭐⭐⭐</td>
                            <td className="p-3">~$3/mês</td>
                            <td className="p-3">Backend API</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="p-3 font-semibold">Route 53 Subdomínio</td>
                            <td className="p-3">✅ Sim</td>
                            <td className="p-3">⭐⭐</td>
                            <td className="p-3">~$10/mês</td>
                            <td className="p-3">
                              <strong>HML OFICIAL</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                      <p className="font-bold text-green-900">💡 Recomendação:</p>
                      <ul className="mt-2 space-y-1 text-sm text-green-800">
                        <li>
                          • <strong>Desenvolvimento/Testes</strong>: Usar CloudFront URL (Opção 1)
                        </li>
                        <li>
                          • <strong>Homologação Oficial</strong>: Usar Route 53 com subdomínio (Opção 4)
                        </li>
                        <li>
                          • <strong>Produção</strong>: Domínio oficial files.petrobras.com.br
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Migração de HML para PRD */}
                <Card>
                  <CardHeader>
                    <CardTitle>Migração de HML para Produção</CardTitle>
                    <CardDescription>O que muda ao sair do domínio provisório para o oficial</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900">1️⃣ Atualizar Variáveis de Ambiente:</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
                          <p className="mb-2 text-sm font-semibold text-yellow-900">HML (Antes):</p>
                          <pre className="text-xs text-yellow-800">
                            {`NEXT_PUBLIC_API_URL=
https://files-hml.petrobras.com.br

NEXT_PUBLIC_ENTRA_REDIRECT_URI=
https://files-hml.petrobras.com.br`}
                          </pre>
                        </div>
                        <div className="rounded border border-green-200 bg-green-50 p-3">
                          <p className="mb-2 text-sm font-semibold text-green-900">PRD (Depois):</p>
                          <pre className="text-xs text-green-800">
                            {`NEXT_PUBLIC_API_URL=
https://files.petrobras.com.br

NEXT_PUBLIC_ENTRA_REDIRECT_URI=
https://files.petrobras.com.br`}
                          </pre>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900">2️⃣ Atualizar Azure AD Redirect URI:</h4>
                      <p className="text-sm text-slate-700">
                        No Portal Azure, adicionar o novo redirect URI de produção:
                      </p>
                      <code className="block rounded bg-slate-900 p-3 text-sm text-green-400">
                        https://files.petrobras.com.br
                      </code>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900">3️⃣ Criar Nova Distribuição CloudFront para PRD:</h4>
                      <ul className="ml-4 list-disc space-y-1 text-sm text-slate-700">
                        <li>Bucket S3 de produção separado</li>
                        <li>Certificado SSL para files.petrobras.com.br</li>
                        <li>WAF ativado</li>
                        <li>Logging habilitado</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900">4️⃣ Apontar DNS de Produção:</h4>
                      <p className="text-sm text-slate-700">
                        Pedir ao administrador DNS da Petrobras para criar record A apontando para o CloudFront de PRD.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
