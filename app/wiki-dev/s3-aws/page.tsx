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
  FolderOpen,
  Lock,
  Shield,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Settings,
  Clock,
  Upload,
  Download,
  Trash2,
  Globe,
  FileCode,
  RefreshCw,
  Eye,
  XCircle,
} from "lucide-react"
import Link from "next/link"

export default function S3AWSPage() {
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
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
            <Cloud className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-slate-900">Amazon S3 - Guia Completo para Leigos</h1>
          <p className="text-lg text-slate-600">
            Como configurar o Amazon S3 para armazenar os arquivos do sistema de transferencia
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-green-100 text-green-700">Amazon S3</Badge>
            <Badge className="bg-blue-100 text-blue-700">Armazenamento</Badge>
            <Badge className="bg-purple-100 text-purple-700">Seguranca</Badge>
            <Badge className="bg-orange-100 text-orange-700">Passo a Passo</Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="introducao">Introducao</TabsTrigger>
            <TabsTrigger value="criar-bucket">Criar Bucket</TabsTrigger>
            <TabsTrigger value="seguranca">Seguranca</TabsTrigger>
            <TabsTrigger value="cors">Configurar CORS</TabsTrigger>
            <TabsTrigger value="lifecycle">Lifecycle Rules</TabsTrigger>
            <TabsTrigger value="codigo">Codigo Python</TabsTrigger>
          </TabsList>

          {/* TAB 1: Introducao */}
          <TabsContent value="introducao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-6 w-6" />
                  O que e Amazon S3? (Explicacao para Leigos)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-green-200 bg-green-50">
                  <AlertTriangle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Analogia simples:</strong> S3 e como um Google Drive super poderoso para empresas. 
                    Voce cria "pastas" (buckets), coloca arquivos dentro, e eles ficam disponiveis na nuvem.
                    A diferenca? Escala infinita, integracao com outros servicos AWS e seguranca de nivel corporativo!
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Conceitos Importantes:</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex gap-3 rounded-lg border p-4">
                      <FolderOpen className="h-6 w-6 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-slate-900">Bucket</strong>
                        <p className="text-sm text-slate-600">E como uma "pasta raiz" no S3. Cada bucket tem um nome UNICO no mundo todo. Ex: petrobras-file-transfer</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <FileCode className="h-6 w-6 shrink-0 text-blue-600" />
                      <div>
                        <strong className="text-slate-900">Object / Key</strong>
                        <p className="text-sm text-slate-600">Cada arquivo e um "objeto" com uma "chave" (caminho). Ex: uploads/2026/01/relatorio.pdf</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <Lock className="h-6 w-6 shrink-0 text-red-600" />
                      <div>
                        <strong className="text-slate-900">Bucket Policy</strong>
                        <p className="text-sm text-slate-600">Regras de quem pode acessar o bucket. Por padrao, NINGUEM pode (nem voce sem credenciais!).</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border p-4">
                      <Clock className="h-6 w-6 shrink-0 text-orange-600" />
                      <div>
                        <strong className="text-slate-900">Lifecycle Rules</strong>
                        <p className="text-sm text-slate-600">Regras automaticas como "deletar arquivos depois de 90 dias" ou "mover para armazenamento mais barato".</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Como usamos S3 no sistema:</h3>
                  <div className="rounded-lg border bg-slate-50 p-6">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                      <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-3 text-center">
                        <Upload className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                        <span>Usuario faz Upload</span>
                      </div>
                      <span className="text-2xl text-slate-300">-&gt;</span>
                      <div className="rounded-lg border-2 border-green-300 bg-green-50 p-3 text-center">
                        <Cloud className="h-6 w-6 mx-auto text-green-600 mb-1" />
                        <span>Arquivo vai pro S3</span>
                        <p className="text-xs text-slate-500">uploads/share_id/arquivo.pdf</p>
                      </div>
                      <span className="text-2xl text-slate-300">-&gt;</span>
                      <div className="rounded-lg border-2 border-purple-300 bg-purple-50 p-3 text-center">
                        <Shield className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                        <span>Supervisor Aprova</span>
                      </div>
                      <span className="text-2xl text-slate-300">-&gt;</span>
                      <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-3 text-center">
                        <Download className="h-6 w-6 mx-auto text-orange-600 mb-1" />
                        <span>Externo baixa</span>
                        <p className="text-xs text-slate-500">URL assinada temporaria</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Estrutura de pastas no S3:</h3>
                  <CodeBlock 
                    id="s3-structure"
                    code={`petrobras-file-transfer/        (bucket)
├── uploads/                    (arquivos aprovados)
│   └── {share_id}/
│       └── {file_id}_{nome_original.pdf}
├── temp/                       (uploads em progresso)
│   └── {upload_id}/
│       └── part_{numero}
└── quarantine/                 (arquivos rejeitados/suspeitos)
    └── {share_id}/
        └── {file_id}_{nome_original.pdf}`}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Criar Bucket */}
          <TabsContent value="criar-bucket" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-6 w-6" />
                  Criar Bucket S3 - Passo a Passo
                </CardTitle>
                <CardDescription>Siga EXATAMENTE estes passos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Primeiro:</strong> Acesse o console S3 em: <a href="https://s3.console.aws.amazon.com/s3" target="_blank" rel="noopener noreferrer" className="underline">s3.console.aws.amazon.com/s3</a>
                  </AlertDescription>
                </Alert>

                {/* Passo a passo */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Criar bucket pelo Console AWS</h3>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-white font-bold">1</span>
                      <div>
                        <p className="font-medium">Clique em "Create bucket"</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-white font-bold">2</span>
                      <div>
                        <p className="font-medium">General configuration:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600 mt-2">
                          <li>Bucket name: <code className="bg-slate-100 px-2 py-1 rounded">petrobras-file-transfer</code></li>
                          <li>AWS Region: <code className="bg-slate-100 px-2 py-1 rounded">us-east-1</code> (ou sua regiao preferida)</li>
                        </ul>
                        <Alert className="mt-2 border-yellow-200 bg-yellow-50">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800 text-xs">
                            O nome do bucket deve ser UNICO no mundo todo! Se ja existir, adicione um sufixo como -hml ou -prd
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-white font-bold">3</span>
                      <div>
                        <p className="font-medium">Object Ownership:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600 mt-2">
                          <li>Selecione: <strong>ACLs disabled (recommended)</strong></li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-white font-bold">4</span>
                      <div>
                        <p className="font-medium">Block Public Access settings:</p>
                        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-4">
                          <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            MUITO IMPORTANTE - Marque TODAS as opcoes:
                          </p>
                          <ul className="list-disc list-inside ml-4 text-sm text-red-700 mt-2">
                            <li>Block all public access: <strong>MARCADO</strong></li>
                          </ul>
                          <p className="text-xs text-red-600 mt-2">Isso garante que NINGUEM na internet pode acessar seus arquivos diretamente!</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-white font-bold">5</span>
                      <div>
                        <p className="font-medium">Bucket Versioning:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600 mt-2">
                          <li>Selecione: <strong>Enable</strong></li>
                        </ul>
                        <p className="text-xs text-slate-500 mt-1">Versioning guarda historico de alteracoes - util para recuperar arquivos deletados</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-white font-bold">6</span>
                      <div>
                        <p className="font-medium">Default encryption:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600 mt-2">
                          <li>Encryption type: <strong>Server-side encryption with Amazon S3 managed keys (SSE-S3)</strong></li>
                          <li>Bucket Key: <strong>Enable</strong></li>
                        </ul>
                        <p className="text-xs text-slate-500 mt-1">Todos os arquivos serao criptografados automaticamente!</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-white font-bold">7</span>
                      <div>
                        <p className="font-medium">Clique "Create bucket"</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Via CLI */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">OU criar via AWS CLI (mais rapido)</h3>
                  <CodeBlock 
                    id="s3-create-cli"
                    code={`# Criar bucket
aws s3api create-bucket \\
  --bucket petrobras-file-transfer \\
  --region us-east-1

# Habilitar versionamento
aws s3api put-bucket-versioning \\
  --bucket petrobras-file-transfer \\
  --versioning-configuration Status=Enabled

# Habilitar criptografia padrao
aws s3api put-bucket-encryption \\
  --bucket petrobras-file-transfer \\
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      },
      "BucketKeyEnabled": true
    }]
  }'

# Bloquear acesso publico
aws s3api put-public-access-block \\
  --bucket petrobras-file-transfer \\
  --public-access-block-configuration '{
    "BlockPublicAcls": true,
    "IgnorePublicAcls": true,
    "BlockPublicPolicy": true,
    "RestrictPublicBuckets": true
  }'

echo "Bucket criado com sucesso!"`}
                  />
                </div>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 className="h-5 w-5" />
                      <strong>Bucket criado!</strong>
                    </div>
                    <p className="text-sm text-green-700 mt-1">Agora vamos configurar as permissoes e CORS para o sistema funcionar.</p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Seguranca */}
          <TabsContent value="seguranca" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  Configurar Seguranca e Permissoes
                </CardTitle>
                <CardDescription>Quem pode acessar o bucket e como</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>SEGURANCA E CRITICO!</strong> Arquivos da Petrobras nao podem vazar. 
                    O bucket deve ficar 100% privado, e o acesso so via URLs assinadas temporarias.
                  </AlertDescription>
                </Alert>

                {/* Bucket Policy */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">1. Bucket Policy (Quem pode acessar)</h3>
                  <p className="text-slate-600">Va em: S3 -&gt; petrobras-file-transfer -&gt; Permissions -&gt; Bucket policy -&gt; Edit</p>
                  <CodeBlock 
                    id="bucket-policy"
                    code={`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::SEU_ACCOUNT_ID:role/petrobras-app-role"
      },
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
    }
  ]
}`}
                  />
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-600"><strong>O que essa policy faz:</strong></p>
                    <ul className="list-disc list-inside text-slate-600">
                      <li><strong>AllowAppAccess:</strong> Permite que sua aplicacao (ECS/Lambda) acesse o bucket</li>
                      <li><strong>DenyInsecureTransport:</strong> Bloqueia qualquer acesso sem HTTPS</li>
                    </ul>
                  </div>
                </div>

                {/* URLs Assinadas */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">2. URLs Assinadas (Presigned URLs)</h3>
                  <p className="text-slate-600">Para usuarios baixarem arquivos de forma segura:</p>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
                      <strong className="text-green-900">Como funciona:</strong>
                      <ol className="list-decimal list-inside text-sm text-green-700 mt-2">
                        <li>Usuario externo clica em "Baixar"</li>
                        <li>Back-end gera uma URL temporaria (ex: 1 hora)</li>
                        <li>URL contem uma assinatura criptografada</li>
                        <li>Usuario baixa o arquivo direto do S3</li>
                        <li>Apos 1 hora, URL para de funcionar</li>
                      </ol>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <XCircle className="h-5 w-5 text-red-600 mb-2" />
                      <strong className="text-red-900">Seguranca garantida:</strong>
                      <ul className="list-disc list-inside text-sm text-red-700 mt-2">
                        <li>URL so funciona por tempo limitado</li>
                        <li>URL so funciona para aquele arquivo especifico</li>
                        <li>Nao da para adivinhar ou "hackear" a URL</li>
                        <li>Se vazou, expira sozinha</li>
                      </ul>
                    </div>
                  </div>

                  <CodeBlock 
                    id="presigned-url"
                    code={`# Python - Gerar URL assinada para download
import boto3
from botocore.config import Config

s3_client = boto3.client(
    's3',
    region_name='us-east-1',
    config=Config(signature_version='s3v4')
)

def generate_download_url(bucket: str, key: str, expires_in: int = 3600):
    """
    Gera URL temporaria para download
    
    Args:
        bucket: Nome do bucket (ex: petrobras-file-transfer)
        key: Caminho do arquivo (ex: uploads/share123/relatorio.pdf)
        expires_in: Segundos ate expirar (padrao: 1 hora)
    
    Returns:
        URL assinada para download
    """
    url = s3_client.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': bucket,
            'Key': key,
        },
        ExpiresIn=expires_in
    )
    return url

# Exemplo de uso
url = generate_download_url(
    bucket='petrobras-file-transfer',
    key='uploads/share123/relatorio.pdf',
    expires_in=3600  # 1 hora
)
print(url)
# https://petrobras-file-transfer.s3.amazonaws.com/uploads/share123/relatorio.pdf?X-Amz-Algorithm=...`}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: CORS */}
          <TabsContent value="cors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-6 w-6" />
                  Configurar CORS
                </CardTitle>
                <CardDescription>Permite que o front-end (navegador) acesse o S3</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>O que e CORS?</strong> E uma regra de seguranca dos navegadores. 
                    Por padrao, JavaScript no site A nao pode acessar o site B.
                    CORS permite que seu front-end em vercel.app acesse arquivos no S3.
                  </AlertDescription>
                </Alert>

                {/* Configurar CORS */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Configurar CORS no Console</h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">1</span>
                      <p>Va em: S3 -&gt; petrobras-file-transfer -&gt; <strong>Permissions</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">2</span>
                      <p>Role ate <strong>Cross-origin resource sharing (CORS)</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">3</span>
                      <p>Clique <strong>Edit</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">4</span>
                      <p>Cole a configuracao abaixo:</p>
                    </div>
                  </div>
                  
                  <CodeBlock 
                    id="cors-config"
                    code={`[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://petrobras-file-transfer.vercel.app",
      "https://*.vercel.app",
      "https://transfer.petrobras.com.br"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type",
      "x-amz-meta-*"
    ],
    "MaxAgeSeconds": 3600
  }
]`}
                  />
                  
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-600"><strong>O que cada campo significa:</strong></p>
                    <ul className="list-disc list-inside text-slate-600">
                      <li><strong>AllowedOrigins:</strong> De quais sites o S3 aceita requisicoes (coloque seus dominios)</li>
                      <li><strong>AllowedMethods:</strong> Quais operacoes sao permitidas</li>
                      <li><strong>AllowedHeaders:</strong> Quais headers podem ser enviados</li>
                      <li><strong>ExposeHeaders:</strong> Quais headers o navegador pode ler na resposta</li>
                      <li><strong>MaxAgeSeconds:</strong> Por quanto tempo o navegador cacheia as regras CORS</li>
                    </ul>
                  </div>
                </div>

                {/* Via CLI */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">OU via AWS CLI</h3>
                  <p className="text-slate-600">Salve a configuracao em um arquivo <code>cors.json</code> e execute:</p>
                  <CodeBlock 
                    id="cors-cli"
                    code={`# Salvar em cors.json e executar:
aws s3api put-bucket-cors \\
  --bucket petrobras-file-transfer \\
  --cors-configuration file://cors.json

# Verificar se aplicou
aws s3api get-bucket-cors --bucket petrobras-file-transfer`}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: Lifecycle */}
          <TabsContent value="lifecycle" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-6 w-6" />
                  Lifecycle Rules (Limpeza Automatica)
                </CardTitle>
                <CardDescription>Deletar arquivos antigos automaticamente para economizar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Por que usar Lifecycle?</strong> Compartilhamentos expiram em 24-72 horas. 
                    Nao faz sentido guardar arquivos para sempre. Lifecycle deleta automaticamente apos X dias.
                  </AlertDescription>
                </Alert>

                {/* Configurar Lifecycle */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Criar regra de Lifecycle</h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">1</span>
                      <p>Va em: S3 -&gt; petrobras-file-transfer -&gt; <strong>Management</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">2</span>
                      <p>Clique em <strong>Create lifecycle rule</strong></p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">3</span>
                      <div>
                        <p>Preencha:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600 mt-2">
                          <li>Lifecycle rule name: <code className="bg-slate-100 px-2 py-1 rounded">delete-expired-shares</code></li>
                          <li>Rule scope: <strong>Limit the scope using filters</strong></li>
                          <li>Prefix: <code className="bg-slate-100 px-2 py-1 rounded">uploads/</code></li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">4</span>
                      <div>
                        <p>Em "Lifecycle rule actions", marque:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600 mt-2">
                          <li><strong>Expire current versions of objects</strong>: 30 dias</li>
                          <li><strong>Permanently delete noncurrent versions</strong>: 7 dias</li>
                          <li><strong>Delete expired object delete markers</strong>: Habilitado</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Regras recomendadas */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Regras recomendadas para o sistema:</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Upload className="h-5 w-5 text-blue-600" />
                        <strong>uploads/</strong>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">Arquivos aprovados</p>
                      <Badge className="bg-blue-100 text-blue-700">Deletar apos 30 dias</Badge>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <RefreshCw className="h-5 w-5 text-orange-600" />
                        <strong>temp/</strong>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">Uploads incompletos</p>
                      <Badge className="bg-orange-100 text-orange-700">Deletar apos 1 dia</Badge>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Trash2 className="h-5 w-5 text-red-600" />
                        <strong>quarantine/</strong>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">Arquivos suspeitos</p>
                      <Badge className="bg-red-100 text-red-700">Deletar apos 90 dias</Badge>
                    </div>
                  </div>
                </div>

                {/* Via CLI */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Configurar via AWS CLI</h3>
                  <CodeBlock 
                    id="lifecycle-cli"
                    code={`# Criar arquivo lifecycle.json
cat > lifecycle.json << 'EOF'
{
  "Rules": [
    {
      "ID": "delete-uploads-30-days",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "uploads/"
      },
      "Expiration": {
        "Days": 30
      },
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 7
      }
    },
    {
      "ID": "delete-temp-1-day",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "temp/"
      },
      "Expiration": {
        "Days": 1
      }
    },
    {
      "ID": "delete-quarantine-90-days",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "quarantine/"
      },
      "Expiration": {
        "Days": 90
      }
    }
  ]
}
EOF

# Aplicar regras
aws s3api put-bucket-lifecycle-configuration \\
  --bucket petrobras-file-transfer \\
  --lifecycle-configuration file://lifecycle.json

# Verificar
aws s3api get-bucket-lifecycle-configuration \\
  --bucket petrobras-file-transfer`}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: Codigo Python */}
          <TabsContent value="codigo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-6 w-6" />
                  Codigo Python para S3
                </CardTitle>
                <CardDescription>Como fazer upload, download e outras operacoes no codigo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Upload */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-600" />
                    Upload de arquivo
                  </h3>
                  <CodeBlock 
                    id="python-upload"
                    code={`import boto3
from botocore.exceptions import ClientError
import os

# Configuracao do cliente S3
s3_client = boto3.client(
    's3',
    region_name=os.getenv('AWS_REGION', 'us-east-1'),
    # Em producao, use IAM Role do ECS ao inves de credenciais
    # aws_access_key_id='...',
    # aws_secret_access_key='...'
)

BUCKET_NAME = 'petrobras-file-transfer'

def upload_file(file_path: str, share_id: str, file_id: str, original_name: str) -> dict:
    """
    Faz upload de um arquivo para o S3
    
    Args:
        file_path: Caminho local do arquivo
        share_id: ID do compartilhamento
        file_id: ID unico do arquivo
        original_name: Nome original do arquivo
    
    Returns:
        Dict com informacoes do upload
    """
    # Montar a chave (caminho no S3)
    s3_key = f"uploads/{share_id}/{file_id}_{original_name}"
    
    try:
        # Upload com metadados
        s3_client.upload_file(
            file_path,
            BUCKET_NAME,
            s3_key,
            ExtraArgs={
                'ContentType': 'application/octet-stream',
                'Metadata': {
                    'share_id': share_id,
                    'file_id': file_id,
                    'original_name': original_name
                }
            }
        )
        
        return {
            'success': True,
            's3_key': s3_key,
            'bucket': BUCKET_NAME
        }
        
    except ClientError as e:
        return {
            'success': False,
            'error': str(e)
        }

# Exemplo de uso
result = upload_file(
    file_path='/tmp/relatorio.pdf',
    share_id='share-abc123',
    file_id='file-xyz789',
    original_name='Relatorio_Financeiro.pdf'
)`}
                  />
                </div>

                {/* Download URL */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Download className="h-5 w-5 text-green-600" />
                    Gerar URL de Download (Presigned URL)
                  </h3>
                  <CodeBlock 
                    id="python-download"
                    code={`from botocore.config import Config

# Cliente com assinatura v4 (necessario para presigned URLs)
s3_client_presigned = boto3.client(
    's3',
    region_name='us-east-1',
    config=Config(signature_version='s3v4')
)

def get_download_url(s3_key: str, expires_in: int = 3600, filename: str = None) -> str:
    """
    Gera URL temporaria para download
    
    Args:
        s3_key: Caminho do arquivo no S3
        expires_in: Segundos ate a URL expirar (padrao: 1 hora)
        filename: Nome do arquivo no download (opcional)
    
    Returns:
        URL assinada
    """
    params = {
        'Bucket': BUCKET_NAME,
        'Key': s3_key,
    }
    
    # Se quiser forcar um nome no download
    if filename:
        params['ResponseContentDisposition'] = f'attachment; filename="{filename}"'
    
    url = s3_client_presigned.generate_presigned_url(
        'get_object',
        Params=params,
        ExpiresIn=expires_in
    )
    
    return url

# Exemplo de uso
download_url = get_download_url(
    s3_key='uploads/share-abc123/file-xyz789_Relatorio.pdf',
    expires_in=3600,  # 1 hora
    filename='Relatorio_Financeiro.pdf'
)
print(download_url)`}
                  />
                </div>

                {/* Deletar arquivo */}
                <div className="rounded-lg border p-6 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-red-600" />
                    Deletar arquivo
                  </h3>
                  <CodeBlock 
                    id="python-delete"
                    code={`def delete_file(s3_key: str) -> bool:
    """Deleta um arquivo do S3"""
    try:
        s3_client.delete_object(
            Bucket=BUCKET_NAME,
            Key=s3_key
        )
        return True
    except ClientError:
        return False

def delete_share_files(share_id: str) -> int:
    """Deleta todos os arquivos de um compartilhamento"""
    prefix = f"uploads/{share_id}/"
    
    # Listar arquivos do share
    response = s3_client.list_objects_v2(
        Bucket=BUCKET_NAME,
        Prefix=prefix
    )
    
    deleted = 0
    if 'Contents' in response:
        for obj in response['Contents']:
            s3_client.delete_object(
                Bucket=BUCKET_NAME,
                Key=obj['Key']
            )
            deleted += 1
    
    return deleted`}
                  />
                </div>

                {/* Estimativa de custos */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Estimativa de Custos S3
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg bg-white p-3">
                        <p className="font-medium">Armazenamento</p>
                        <p className="text-2xl font-bold text-green-600">$0.023</p>
                        <p className="text-xs text-slate-500">por GB/mes</p>
                      </div>
                      <div className="rounded-lg bg-white p-3">
                        <p className="font-medium">Uploads (PUT)</p>
                        <p className="text-2xl font-bold text-green-600">$0.005</p>
                        <p className="text-xs text-slate-500">por 1.000 requisicoes</p>
                      </div>
                      <div className="rounded-lg bg-white p-3">
                        <p className="font-medium">Downloads (GET)</p>
                        <p className="text-2xl font-bold text-green-600">$0.0004</p>
                        <p className="text-xs text-slate-500">por 1.000 requisicoes</p>
                      </div>
                    </div>
                    <p className="text-sm text-green-700 mt-4">
                      <strong>Estimativa:</strong> Com 100GB armazenados e 10.000 operacoes/mes = ~$3-5/mes
                    </p>
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
