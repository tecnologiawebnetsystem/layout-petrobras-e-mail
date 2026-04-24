"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, Copy, Check, ChevronDown, ChevronRight, Shield, Key, Lock, Eye, AlertTriangle, Server } from "lucide-react"
import Link from "next/link"

export default function SegurancaAWSPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>("iam")

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const sections = [
    {
      id: "iam",
      name: "Politicas IAM - Principio do Menor Privilegio",
      icon: Shield,
      color: "red",
      description: "Dar apenas as permissoes necessarias para cada funcao",
      content: [
        {
          title: "Policy para Aplicacao (Backend)",
          description: "Permissoes minimas para a API funcionar",
          code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBReadWrite",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/petrobras_transfer_*",
        "arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/petrobras_transfer_*/index/*"
      ]
    },
    {
      "Sid": "S3ObjectOperations",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::petrobras-file-transfer/uploads/*"
    },
    {
      "Sid": "S3ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::petrobras-file-transfer",
      "Condition": {
        "StringLike": {
          "s3:prefix": "uploads/*"
        }
      }
    },
    {
      "Sid": "SESSendEmail",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ses:FromAddress": "noreply@petrobras.com.br"
        }
      }
    }
  ]
}`,
        },
        {
          title: "Policy para Desenvolvedor",
          description: "Acesso somente leitura em producao",
          code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOnlyDynamoDB",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:DescribeTable"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/petrobras_transfer_*"
    },
    {
      "Sid": "ReadOnlyS3",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::petrobras-file-transfer",
        "arn:aws:s3:::petrobras-file-transfer/*"
      ]
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:GetLogEvents",
        "logs:FilterLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/petrobras/*"
    },
    {
      "Sid": "DenyDelete",
      "Effect": "Deny",
      "Action": [
        "dynamodb:DeleteTable",
        "s3:DeleteBucket",
        "logs:DeleteLogGroup"
      ],
      "Resource": "*"
    }
  ]
}`,
        },
        {
          title: "Policy para CI/CD (Deploy)",
          description: "Permissoes para pipeline de deploy automatizado",
          code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRPush",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECSUpdate",
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTasks"
      ],
      "Resource": "arn:aws:ecs:*:*:service/petrobras-cluster/*"
    },
    {
      "Sid": "SecretsManagerRead",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:petrobras-*"
    }
  ]
}`,
        },
      ],
    },
    {
      id: "kms",
      name: "KMS - Criptografia de Dados",
      icon: Key,
      color: "amber",
      description: "Chaves de criptografia gerenciadas pela AWS",
      content: [
        {
          title: "1. Criar Chave KMS",
          description: "Acesse AWS Console > KMS > Create key",
          code: `# Configuracao da chave:
Key type: Symmetric
Key usage: Encrypt and decrypt
Key material origin: KMS

# Alias (nome amigavel):
alias/petrobras-file-transfer

# Key policy - Quem pode usar:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowRootAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "AllowAppEncryptDecrypt",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:role/petrobras-app-role"
      },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "*"
    }
  ]
}`,
        },
        {
          title: "2. Configurar S3 com KMS",
          description: "Criptografia server-side com KMS",
          code: `# Acesse S3 > Bucket > Properties > Default encryption
# Selecione: SSE-KMS
# Escolha a chave: alias/petrobras-file-transfer

# OU via CLI:
aws s3api put-bucket-encryption \\
  --bucket petrobras-file-transfer \\
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "alias/petrobras-file-transfer"
      },
      "BucketKeyEnabled": true
    }]
  }'`,
        },
        {
          title: "3. Configurar DynamoDB com KMS",
          description: "Criptografia de tabelas",
          code: `# Por padrao, DynamoDB usa criptografia AWS owned key (gratuita)
# Para usar sua propria chave KMS:

aws dynamodb update-table \\
  --table-name petrobras_transfer_shares \\
  --sse-specification '{
    "Enabled": true,
    "SSEType": "KMS",
    "KMSMasterKeyId": "alias/petrobras-file-transfer"
  }'

# NOTA: Isso tem custo adicional (~$1/mes por tabela)
# Recomendado para dados sensiveis (audit_logs, users)`,
        },
      ],
    },
    {
      id: "s3security",
      name: "S3 - Configuracoes de Seguranca",
      icon: Lock,
      color: "green",
      description: "Proteger o bucket S3 contra acessos indevidos",
      content: [
        {
          title: "1. Block Public Access",
          description: "OBRIGATORIO: Bloquear todo acesso publico",
          code: `# Acesse S3 > Bucket > Permissions > Block public access
# Marque TODAS as opcoes:

✓ Block all public access
  ✓ Block public access to buckets and objects granted through new ACLs
  ✓ Block public access to buckets and objects granted through any ACLs
  ✓ Block public access to buckets and objects granted through new public bucket policies
  ✓ Block public access granted through any public bucket policies`,
        },
        {
          title: "2. Bucket Policy Restritiva",
          description: "Permitir apenas acesso autenticado",
          code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::petrobras-file-transfer",
        "arn:aws:s3:::petrobras-file-transfer/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "RestrictToAccount",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::petrobras-file-transfer",
        "arn:aws:s3:::petrobras-file-transfer/*"
      ],
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalAccount": "ACCOUNT_ID"
        }
      }
    }
  ]
}`,
        },
        {
          title: "3. Presigned URLs para Download",
          description: "Gerar URLs temporarias para download seguro",
          code: `# No codigo Python/FastAPI:

import boto3
from datetime import datetime, timedelta

s3_client = boto3.client('s3')

def generate_download_url(s3_key: str, expiration_minutes: int = 15):
    """
    Gera URL temporaria para download seguro
    """
    url = s3_client.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': 'petrobras-file-transfer',
            'Key': s3_key,
            'ResponseContentDisposition': f'attachment; filename="{filename}"'
        },
        ExpiresIn=expiration_minutes * 60  # Em segundos
    )
    return url

# Uso:
download_url = generate_download_url(
    s3_key="uploads/share-123/file-456_documento.pdf",
    expiration_minutes=15
)`,
        },
        {
          title: "4. Habilitar Logging de Acesso",
          description: "Registrar todos os acessos ao bucket",
          code: `# 1. Criar bucket para logs:
aws s3 mb s3://petrobras-file-transfer-logs

# 2. Habilitar logging:
aws s3api put-bucket-logging \\
  --bucket petrobras-file-transfer \\
  --bucket-logging-status '{
    "LoggingEnabled": {
      "TargetBucket": "petrobras-file-transfer-logs",
      "TargetPrefix": "access-logs/"
    }
  }'`,
        },
      ],
    },
    {
      id: "secrets",
      name: "Secrets Manager - Gerenciamento de Segredos",
      icon: Eye,
      color: "purple",
      description: "Armazenar credenciais de forma segura",
      content: [
        {
          title: "1. Criar Secret para Variaveis de Ambiente",
          description: "Armazenar todas as credenciais em um unico secret",
          code: `# Acesse AWS Console > Secrets Manager > Store a new secret
# Tipo: Other type of secret

# Chave-valor:
{
  "ENTRA_CLIENT_ID": "seu-client-id",
  "ENTRA_CLIENT_SECRET": "seu-client-secret",
  "ENTRA_TENANT_ID": "seu-tenant-id",
  "JWT_SECRET_KEY": "chave-secreta-256-bits-ou-mais",
  "DATABASE_ENCRYPTION_KEY": "outra-chave-secreta"
}

# Nome do secret:
petrobras-file-transfer/env

# Rotacao automatica: Configure se necessario`,
        },
        {
          title: "2. Buscar Secrets no Codigo",
          description: "Como usar no Python/FastAPI",
          code: `import boto3
import json
from functools import lru_cache

def get_secret(secret_name: str, region: str = "us-east-1") -> dict:
    """
    Busca secrets do AWS Secrets Manager
    """
    client = boto3.client('secretsmanager', region_name=region)
    
    response = client.get_secret_value(SecretId=secret_name)
    
    if 'SecretString' in response:
        return json.loads(response['SecretString'])
    
    raise ValueError("Secret nao encontrado")

# Uso (com cache para nao buscar toda vez):
@lru_cache()
def get_env_secrets():
    return get_secret("petrobras-file-transfer/env")

# No codigo:
secrets = get_env_secrets()
entra_client_id = secrets["ENTRA_CLIENT_ID"]`,
        },
        {
          title: "3. Policy IAM para Secrets Manager",
          description: "Permitir aplicacao acessar o secret",
          code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowGetSecret",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:petrobras-file-transfer/*"
      ]
    }
  ]
}`,
        },
      ],
    },
    {
      id: "monitoring",
      name: "CloudTrail - Auditoria de Acoes AWS",
      icon: AlertTriangle,
      color: "blue",
      description: "Registrar todas as acoes na conta AWS",
      content: [
        {
          title: "1. Criar Trail",
          description: "Registrar todas as chamadas de API",
          code: `# Acesse AWS Console > CloudTrail > Trails > Create trail

Nome: petrobras-all-events
Storage location: Create new S3 bucket
Bucket name: petrobras-cloudtrail-logs

# Event types:
✓ Management events (Read/Write)
✓ Data events:
  - S3: petrobras-file-transfer (Read/Write)
  - DynamoDB: All tables starting with petrobras_transfer_

# Habilitar Log file validation: Yes
# Enable CloudWatch Logs: Yes`,
        },
        {
          title: "2. Alertas de Seguranca",
          description: "Criar alarmes para acoes suspeitas",
          code: `# Acesse CloudWatch > Alarms > Create alarm

# Alarme 1: Console Login sem MFA
Metric: ConsoleLoginWithoutMFA
Threshold: >= 1 em 5 minutos
Acao: SNS para equipe de seguranca

# Alarme 2: Alteracao de IAM Policy
Metric: IAMPolicyChanges
Threshold: >= 1 em 5 minutos
Acao: SNS para equipe de seguranca

# Alarme 3: Tentativa de acesso negado
Metric: AccessDeniedEvents
Threshold: >= 10 em 5 minutos
Acao: SNS para equipe de seguranca`,
        },
        {
          title: "3. Retencao de Logs",
          description: "Definir politica de retencao conforme compliance",
          code: `# S3 Lifecycle para logs do CloudTrail:
# Acesse S3 > petrobras-cloudtrail-logs > Management > Lifecycle rules

{
  "Rules": [
    {
      "ID": "MoveToGlacierAfter90Days",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 2555  // 7 anos para compliance
      }
    }
  ]
}`,
        },
      ],
    },
    {
      id: "waf",
      name: "WAF - Web Application Firewall",
      icon: Server,
      color: "slate",
      description: "Proteger API contra ataques web",
      content: [
        {
          title: "1. Criar Web ACL",
          description: "Configurar regras de protecao",
          code: `# Acesse AWS Console > WAF > Web ACLs > Create web ACL

Nome: petrobras-file-transfer-waf
Resource type: Regional (se usar ALB) ou CloudFront

# Regras recomendadas (AWS Managed Rules):
1. AWSManagedRulesCommonRuleSet
   - Protege contra ataques comuns (SQL injection, XSS)
   
2. AWSManagedRulesKnownBadInputsRuleSet
   - Bloqueia inputs maliciosos conhecidos

3. AWSManagedRulesSQLiRuleSet
   - Protecao especifica contra SQL injection

4. AWSManagedRulesLinuxRuleSet
   - Se servidor Linux (protege contra exploits)`,
        },
        {
          title: "2. Rate Limiting",
          description: "Limitar requisicoes por IP",
          code: `# Criar regra customizada de Rate Limiting:

{
  "Name": "RateLimitRule",
  "Priority": 1,
  "Statement": {
    "RateBasedStatement": {
      "Limit": 2000,  // Max requisicoes em 5 min
      "AggregateKeyType": "IP"
    }
  },
  "Action": {
    "Block": {}
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "RateLimitRule"
  }
}

# Regra mais restritiva para endpoint de OTP:
{
  "Name": "OTPRateLimit",
  "Statement": {
    "RateBasedStatement": {
      "Limit": 20,  // Max 20 requisicoes em 5 min
      "AggregateKeyType": "IP",
      "ScopeDownStatement": {
        "ByteMatchStatement": {
          "FieldToMatch": { "UriPath": {} },
          "TextTransformations": [{"Priority": 0, "Type": "NONE"}],
          "PositionalConstraint": "CONTAINS",
          "SearchString": "/otp"
        }
      }
    }
  },
  "Action": { "Block": {} }
}`,
        },
        {
          title: "3. Geo Blocking (Opcional)",
          description: "Bloquear paises especificos",
          code: `# Se precisar restringir acesso por pais:

{
  "Name": "GeoBlockRule",
  "Statement": {
    "GeoMatchStatement": {
      "CountryCodes": ["CN", "RU", "KP", "IR"]  // Bloquear
    }
  },
  "Action": {
    "Block": {}
  }
}

# OU permitir apenas Brasil:
{
  "Name": "AllowOnlyBrazil",
  "Statement": {
    "NotStatement": {
      "Statement": {
        "GeoMatchStatement": {
          "CountryCodes": ["BR"]
        }
      }
    }
  },
  "Action": {
    "Block": {}
  }
}`,
        },
      ],
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      red: { bg: "bg-red-100", text: "text-red-700" },
      amber: { bg: "bg-amber-100", text: "text-amber-700" },
      green: { bg: "bg-green-100", text: "text-green-700" },
      purple: { bg: "bg-purple-100", text: "text-purple-700" },
      blue: { bg: "bg-blue-100", text: "text-blue-700" },
      slate: { bg: "bg-slate-100", text: "text-slate-700" },
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Seguranca AWS</h1>
          <p className="text-slate-600">
            Politicas IAM, KMS, configuracoes de S3, Secrets Manager, CloudTrail e WAF
          </p>
        </div>

        {/* Alerta */}
        <Card className="mb-8 border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Seguranca e Prioridade Maxima
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-700">
            <ul className="space-y-1">
              <li>• NUNCA commite credenciais AWS no codigo fonte</li>
              <li>• SEMPRE use o principio do menor privilegio</li>
              <li>• SEMPRE habilite MFA para usuarios IAM</li>
              <li>• SEMPRE criptografe dados em repouso e em transito</li>
              <li>• SEMPRE monitore logs e configure alertas</li>
            </ul>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon
            const colors = getColorClasses(section.color)
            const isExpanded = expandedSection === section.id

            return (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${colors.bg}`}>
                        <Icon className={`h-6 w-6 ${colors.text}`} />
                      </div>
                      <div>
                        <CardTitle>{section.name}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
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
                    {section.content.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-slate-800">{item.title}</h4>
                            <p className="text-sm text-slate-600">{item.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(item.code, `${section.id}-${index}`)}
                          >
                            {copiedId === `${section.id}-${index}` ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
                          <code>{item.code}</code>
                        </pre>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
