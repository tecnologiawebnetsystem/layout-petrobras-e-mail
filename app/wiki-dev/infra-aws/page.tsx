"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, Copy, Check, ChevronDown, ChevronRight, Cloud, Database, Mail, Eye, Users, Lock } from "lucide-react"
import Link from "next/link"

export default function InfraAWSPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedService, setExpandedService] = useState<string | null>("dynamodb")

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const services = [
    {
      id: "iam",
      name: "IAM - Identity and Access Management",
      icon: Users,
      color: "red",
      description: "Usuarios, roles e politicas de acesso",
      steps: [
        {
          title: "1. Criar Usuario IAM para a Aplicacao",
          instructions: [
            "Acesse AWS Console > IAM > Users",
            "Clique em 'Add users'",
            "Nome: petrobras-file-transfer-app",
            "Marque 'Access key - Programmatic access'",
            "Clique 'Next: Permissions'",
          ],
          code: `# Apos criar, salve as credenciais:
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...`,
        },
        {
          title: "2. Criar Policy Personalizada",
          instructions: [
            "Acesse IAM > Policies > Create policy",
            "Selecione 'JSON' e cole a policy abaixo",
            "Nome: PetrobrasFileTransferPolicy",
          ],
          code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/petrobras_transfer_*"
    },
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::petrobras-file-transfer",
        "arn:aws:s3:::petrobras-file-transfer/*"
      ]
    },
    {
      "Sid": "SESAccess",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/petrobras/*"
    }
  ]
}`,
        },
        {
          title: "3. Anexar Policy ao Usuario",
          instructions: [
            "Volte para IAM > Users > petrobras-file-transfer-app",
            "Aba 'Permissions' > 'Add permissions'",
            "Selecione 'Attach policies directly'",
            "Busque 'PetrobrasFileTransferPolicy' e selecione",
            "Clique 'Add permissions'",
          ],
          code: null,
        },
      ],
    },
    {
      id: "dynamodb",
      name: "DynamoDB - Banco de Dados",
      icon: Database,
      color: "blue",
      description: "Tabelas NoSQL para armazenar dados",
      steps: [
        {
          title: "1. Criar Tabela de Usuarios",
          instructions: [
            "Acesse AWS Console > DynamoDB > Tables",
            "Clique em 'Create table'",
            "Preencha os campos conforme abaixo",
          ],
          code: `Nome da tabela: petrobras_transfer_users
Partition key: PK (String)
Sort key: SK (String)
Table settings: Default settings

# Indices GSI (criar depois):
# 1. email-index: PK=email, SK=created_at
# 2. userType-index: PK=userType, SK=created_at`,
        },
        {
          title: "2. Criar Tabela de Compartilhamentos",
          instructions: [
            "Clique em 'Create table'",
            "Esta e a tabela principal do sistema",
          ],
          code: `Nome da tabela: petrobras_transfer_shares
Partition key: PK (String)
Sort key: SK (String)

# Indices GSI:
# 1. status-index: PK=status, SK=created_at
# 2. sender-index: PK=sender_email, SK=created_at
# 3. approver-index: PK=approver_email, SK=created_at
# 4. recipient-index: PK=recipient_email, SK=created_at`,
        },
        {
          title: "3. Criar Tabela de Arquivos",
          instructions: [
            "Tabela para metadados dos arquivos",
          ],
          code: `Nome da tabela: petrobras_transfer_files
Partition key: PK (String)   # share_id
Sort key: SK (String)        # file_id

# Campos:
# - file_name, file_size, file_type
# - s3_key, s3_bucket
# - uploaded_at, downloaded_at, download_count`,
        },
        {
          title: "4. Criar Tabela de OTP",
          instructions: [
            "Tabela para codigos OTP com TTL",
          ],
          code: `Nome da tabela: petrobras_transfer_otp_codes
Partition key: email (String)

# IMPORTANTE: Habilitar TTL
# Acesse a tabela > Additional settings > Time to Live (TTL)
# TTL attribute: expires_at

# Campos:
# - code (6 digitos)
# - attempts (contador)
# - created_at
# - expires_at (Unix timestamp)`,
        },
        {
          title: "5. Criar Tabela de Sessoes",
          instructions: [
            "Tabela para sessoes de usuarios externos",
          ],
          code: `Nome da tabela: petrobras_transfer_sessions
Partition key: session_id (String)

# Habilitar TTL com attribute: expires_at

# Campos:
# - email
# - user_type
# - created_at
# - expires_at
# - ip_address`,
        },
        {
          title: "6. Criar Tabela de Auditoria",
          instructions: [
            "Tabela para logs de auditoria",
          ],
          code: `Nome da tabela: petrobras_transfer_audit_logs
Partition key: PK (String)   # YYYY-MM
Sort key: SK (String)        # timestamp#log_id

# Indices GSI:
# 1. user-index: PK=user_email, SK=timestamp
# 2. action-index: PK=action, SK=timestamp

# Campos:
# - action, level (success/error/warning)
# - user_id, user_email, user_type
# - description, metadata (JSON)
# - ip_address, user_agent`,
        },
        {
          title: "7. Criar Tabela de Notificacoes",
          instructions: [
            "Tabela para notificacoes in-app",
          ],
          code: `Nome da tabela: petrobras_transfer_notifications
Partition key: user_id (String)
Sort key: created_at (String)

# Campos:
# - notification_id
# - type (share_approved, share_rejected, etc)
# - title, message
# - read (boolean)
# - related_share_id`,
        },
        {
          title: "8. Criar Tabela de Emails",
          instructions: [
            "Tabela para log de emails enviados",
          ],
          code: `Nome da tabela: petrobras_transfer_email_logs
Partition key: message_id (String)

# Campos:
# - to_email, from_email
# - subject, template_type
# - status (sent, delivered, bounced, failed)
# - sent_at, delivered_at
# - error_message (se falhou)`,
        },
      ],
    },
    {
      id: "s3",
      name: "S3 - Armazenamento de Arquivos",
      icon: Cloud,
      color: "green",
      description: "Bucket para upload/download de arquivos",
      steps: [
        {
          title: "1. Criar Bucket S3",
          instructions: [
            "Acesse AWS Console > S3 > Create bucket",
            "Preencha os campos conforme abaixo",
          ],
          code: `Bucket name: petrobras-file-transfer
AWS Region: us-east-1 (ou sua regiao)

# Object Ownership: ACLs disabled
# Block Public Access: Marque TODAS as opcoes (bloquear tudo)
# Bucket Versioning: Enable (recomendado)
# Default encryption: SSE-S3 ou SSE-KMS`,
        },
        {
          title: "2. Configurar CORS",
          instructions: [
            "Acesse o bucket > Permissions > CORS",
            "Cole a configuracao abaixo",
          ],
          code: `[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://transfer.petrobras.com.br",
      "https://*.vercel.app"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]`,
        },
        {
          title: "3. Configurar Lifecycle Rules",
          instructions: [
            "Acesse o bucket > Management > Lifecycle rules",
            "Create lifecycle rule",
          ],
          code: `Rule name: delete-expired-files

# Scope: Apply to all objects in the bucket
# OU filtrar por prefix: uploads/

# Lifecycle rule actions:
# - Expire current versions of objects: 90 days
# - Permanently delete noncurrent versions: 30 days
# - Delete expired object delete markers: Enable`,
        },
        {
          title: "4. Estrutura de Pastas (Prefixos)",
          instructions: [
            "Organize os arquivos por prefixo",
          ],
          code: `petrobras-file-transfer/
├── uploads/
│   └── {share_id}/
│       └── {file_id}_{filename}
├── temp/
│   └── {upload_id}/
│       └── {chunk_number}
└── quarantine/
    └── {share_id}/
        └── {file_id}_{filename}`,
        },
      ],
    },
    {
      id: "ses",
      name: "SES - Simple Email Service",
      icon: Mail,
      color: "amber",
      description: "Servico de envio de emails",
      steps: [
        {
          title: "1. Verificar Dominio",
          instructions: [
            "Acesse AWS Console > SES > Verified identities",
            "Clique em 'Create identity'",
            "Selecione 'Domain' e digite: petrobras.com.br",
            "Copie os registros DNS e adicione no seu provedor",
          ],
          code: `# Registros DNS a adicionar:
# CNAME para DKIM (3 registros)
# TXT para SPF
# TXT para DMARC (opcional mas recomendado)

# Aguarde propagacao (pode levar ate 72h)`,
        },
        {
          title: "2. Verificar Email (para testes)",
          instructions: [
            "Enquanto aguarda verificacao do dominio",
            "Verifique um email especifico para testes",
          ],
          code: `# Acesse SES > Verified identities > Create identity
# Selecione 'Email address'
# Digite: noreply@petrobras.com.br
# Clique no link de confirmacao recebido por email`,
        },
        {
          title: "3. Sair do Sandbox",
          instructions: [
            "Por padrao, SES esta em modo sandbox",
            "So pode enviar para emails verificados",
            "Solicite saida do sandbox para producao",
          ],
          code: `# Acesse SES > Account dashboard
# Clique em "Request production access"
# Preencha o formulario:
# - Mail type: Transactional
# - Website URL: https://transfer.petrobras.com.br
# - Use case description: Sistema de transferencia...
# - Aguarde aprovacao (1-2 dias uteis)`,
        },
        {
          title: "4. Criar Configuration Set (opcional)",
          instructions: [
            "Para tracking de emails",
          ],
          code: `# Acesse SES > Configuration sets > Create
# Nome: petrobras-file-transfer
# Event destinations: CloudWatch (para metricas)

# Metricas disponiveis:
# - Sends, Deliveries, Opens, Clicks
# - Bounces, Complaints, Rejections`,
        },
      ],
    },
    {
      id: "cloudwatch",
      name: "CloudWatch - Logs e Monitoramento",
      icon: Eye,
      color: "purple",
      description: "Centralizacao de logs e metricas",
      steps: [
        {
          title: "1. Criar Log Group",
          instructions: [
            "Acesse AWS Console > CloudWatch > Log groups",
            "Clique em 'Create log group'",
          ],
          code: `Log group name: /petrobras/file-transfer/api

# Retention setting: 90 days (ou conforme compliance)

# Crie mais log groups:
# - /petrobras/file-transfer/errors
# - /petrobras/file-transfer/security`,
        },
        {
          title: "2. Criar Dashboard",
          instructions: [
            "Acesse CloudWatch > Dashboards > Create dashboard",
            "Nome: Petrobras-File-Transfer",
          ],
          code: `# Widgets sugeridos:
# 1. Numero de uploads hoje (metrica customizada)
# 2. Numero de downloads hoje
# 3. Erros nas ultimas 24h (log insights)
# 4. Latencia media da API
# 5. Emails enviados vs bounces`,
        },
        {
          title: "3. Criar Alarmes",
          instructions: [
            "Acesse CloudWatch > Alarms > Create alarm",
          ],
          code: `# Alarme 1: Muitos erros
Nome: HighErrorRate
Metrica: Errors do API Gateway ou Application
Threshold: > 10 erros em 5 minutos
Acao: Enviar para SNS topic

# Alarme 2: Muitas tentativas OTP falhas
Nome: SuspiciousOTPAttempts
Metrica: Customizada (OTP_FAILED)
Threshold: > 20 em 1 hora
Acao: Enviar para equipe de seguranca`,
        },
        {
          title: "4. Log Insights - Queries Uteis",
          instructions: [
            "Acesse CloudWatch > Logs Insights",
            "Selecione o log group e execute queries",
          ],
          code: `# Erros nas ultimas 24h
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

# Logins por hora
fields @timestamp, @message
| filter @message like /LOGIN/
| stats count() by bin(1h)

# Downloads por usuario
fields @timestamp, user_email, action
| filter action = "download"
| stats count() by user_email
| sort count desc
| limit 20`,
        },
      ],
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      red: { bg: "bg-red-100", text: "text-red-700" },
      blue: { bg: "bg-blue-100", text: "text-blue-700" },
      green: { bg: "bg-green-100", text: "text-green-700" },
      amber: { bg: "bg-amber-100", text: "text-amber-700" },
      purple: { bg: "bg-purple-100", text: "text-purple-700" },
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Infraestrutura AWS - Passo a Passo</h1>
          <p className="text-slate-600">
            Como criar todos os recursos na AWS do zero: IAM, DynamoDB, S3, SES e CloudWatch
          </p>
        </div>

        {/* Resumo */}
        <Card className="mb-8 border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-orange-800">Ordem de Criacao Recomendada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge className="bg-red-500">1. IAM</Badge>
              <span className="text-slate-400">→</span>
              <Badge className="bg-blue-500">2. DynamoDB</Badge>
              <span className="text-slate-400">→</span>
              <Badge className="bg-green-500">3. S3</Badge>
              <span className="text-slate-400">→</span>
              <Badge className="bg-amber-500">4. SES</Badge>
              <span className="text-slate-400">→</span>
              <Badge className="bg-purple-500">5. CloudWatch</Badge>
            </div>
            <p className="text-sm text-orange-700 mt-3">
              Crie nesta ordem para garantir que as permissoes IAM cubram todos os servicos.
            </p>
          </CardContent>
        </Card>

        {/* Services */}
        <div className="space-y-4">
          {services.map((service) => {
            const Icon = service.icon
            const colors = getColorClasses(service.color)
            const isExpanded = expandedService === service.id

            return (
              <Card key={service.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedService(isExpanded ? null : service.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${colors.bg}`}>
                        <Icon className={`h-6 w-6 ${colors.text}`} />
                      </div>
                      <div>
                        <CardTitle>{service.name}</CardTitle>
                        <CardDescription>{service.description}</CardDescription>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t pt-6 space-y-6">
                    {service.steps.map((step, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 mb-3">{step.title}</h4>
                        <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1 mb-4">
                          {step.instructions.map((instruction, i) => (
                            <li key={i}>{instruction}</li>
                          ))}
                        </ol>
                        {step.code && (
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => copyToClipboard(step.code!, `${service.id}-${index}`)}
                            >
                              {copiedId === `${service.id}-${index}` ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
                              <code>{step.code}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {/* Custo Estimado */}
        <Card className="mt-8 border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-green-800">Custo Estimado (Mensal)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">DynamoDB (On-Demand)</p>
                <p className="text-slate-600">~$5-20 (depende do uso)</p>
              </div>
              <div>
                <p className="font-medium">S3 (100GB armazenamento)</p>
                <p className="text-slate-600">~$2-5</p>
              </div>
              <div>
                <p className="font-medium">SES (10.000 emails)</p>
                <p className="text-slate-600">~$1</p>
              </div>
              <div>
                <p className="font-medium">CloudWatch</p>
                <p className="text-slate-600">~$3-10</p>
              </div>
            </div>
            <p className="text-sm text-green-700 mt-4">
              <strong>Total estimado:</strong> $15-50/mes para uso moderado (1.000 usuarios, 1.000 compartilhamentos/mes)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
