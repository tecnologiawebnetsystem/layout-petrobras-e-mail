"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Rocket, ChevronLeft, Clock, CheckCircle2, Terminal, Copy, Check, AlertTriangle, Cloud } from "lucide-react"
import Link from "next/link"

export default function QuickStartPage() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCommand(id)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  const CommandBlock = ({ command, id, description }: { command: string; id: string; description?: string }) => (
    <div className="mb-4">
      {description && <p className="mb-2 text-sm text-slate-600">{description}</p>}
      <div className="group relative rounded-lg border border-slate-200 bg-slate-950 p-4">
        <code className="block overflow-x-auto text-sm text-slate-100">{command}</code>
        <Button
          size="sm"
          variant="ghost"
          className="absolute right-2 top-2 h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => copyToClipboard(command, id)}
        >
          {copiedCommand === id ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4 text-slate-400" />
          )}
        </Button>
      </div>
    </div>
  )

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
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
            <Rocket className="h-7 w-7 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">Quick Start - Deploy Rápido</h1>
          <p className="text-lg text-slate-600">
            Deploy completo do sistema em 1 dia usando CloudFormation e scripts automatizados
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Badge variant="secondary" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Tempo estimado: 6-8 horas
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <Cloud className="h-3.5 w-3.5" />
              AWS CLI requerido
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="prerequisites" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="prerequisites">Pré-requisitos</TabsTrigger>
            <TabsTrigger value="setup">Configuração</TabsTrigger>
            <TabsTrigger value="deploy">Deploy</TabsTrigger>
            <TabsTrigger value="verify">Verificação</TabsTrigger>
            <TabsTrigger value="troubleshoot">Troubleshoot</TabsTrigger>
          </TabsList>

          {/* Pré-requisitos */}
          <TabsContent value="prerequisites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Requisitos do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Conta AWS
                  </h3>
                  <ul className="ml-7 space-y-2 text-slate-700">
                    <li>• Conta AWS ativa com permissões de administrador</li>
                    <li>• Billing configurado e cartão de crédito válido</li>
                    <li>• Limites de serviço verificados (Lambda, DynamoDB, S3)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    <Terminal className="h-5 w-5 text-blue-600" />
                    Ferramentas Locais
                  </h3>
                  <CommandBlock
                    id="aws-cli-install"
                    description="Instalar AWS CLI v2:"
                    command="curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'
unzip awscliv2.zip
sudo ./aws/install"
                  />

                  <CommandBlock
                    id="python-install"
                    description="Python 3.9+ e Boto3:"
                    command="python3 --version  # Verificar versão
pip install boto3 python-dotenv"
                  />

                  <CommandBlock
                    id="node-install"
                    description="Node.js 18+ (para frontend):"
                    command="node --version  # Verificar versão
npm install -g pnpm"
                  />
                </div>

                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    <Cloud className="h-5 w-5 text-orange-600" />
                    Configurar Credenciais AWS
                  </h3>
                  <CommandBlock
                    id="aws-configure"
                    command="aws configure
# AWS Access Key ID: [SUA_ACCESS_KEY]
# AWS Secret Access Key: [SUA_SECRET_KEY]
# Default region name: us-east-1
# Default output format: json"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuração */}
          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Passo 1: Clonar Repositório e Configurar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CommandBlock
                  id="git-clone"
                  description="Clone o repositório:"
                  command="git clone https://github.com/seu-usuario/petrobras-file-transfer.git
cd petrobras-file-transfer"
                />

                <CommandBlock
                  id="env-setup"
                  description="Configure variáveis de ambiente:"
                  command="cp .env.example .env
# Edite o arquivo .env com suas configurações"
                />

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <h4 className="mb-1 font-semibold text-amber-900">Importante</h4>
                      <p className="text-sm text-amber-800">
                        Certifique-se de configurar TODAS as variáveis no arquivo .env antes de continuar
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Passo 2: Criar Tabelas DynamoDB</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CommandBlock
                  id="create-tables"
                  description="Execute o script de criação de tabelas:"
                  command="cd sql
python create-tables.py"
                />

                <p className="text-sm text-slate-600">
                  Este script criará automaticamente todas as 5 tabelas DynamoDB com índices e configurações corretas.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deploy */}
          <TabsContent value="deploy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Passo 3: Deploy com CloudFormation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CommandBlock
                  id="cloudformation-deploy"
                  description="Deploy da infraestrutura completa:"
                  command="aws cloudformation create-stack \
  --stack-name petrobras-file-transfer \
  --template-body file://sql/cloudformation-template.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=ProjectName,ParameterValue=petrobras-transfer \
  --capabilities CAPABILITY_IAM"
                />

                <CommandBlock
                  id="stack-status"
                  description="Monitorar status do deploy:"
                  command="aws cloudformation describe-stacks \
  --stack-name petrobras-file-transfer \
  --query 'Stacks[0].StackStatus'"
                />

                <p className="text-sm text-slate-600">
                  O deploy pode levar de 10 a 20 minutos. Aguarde até o status ser CREATE_COMPLETE.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Passo 4: Deploy do Frontend (Vercel)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CommandBlock
                  id="vercel-deploy"
                  description="Deploy do Next.js na Vercel:"
                  command="npm install -g vercel
vercel login
vercel --prod"
                />

                <p className="text-sm text-slate-600">
                  Configure as variáveis de ambiente na Vercel com os valores do CloudFormation outputs.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verificação */}
          <TabsContent value="verify" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Verificar Deploy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-3 font-semibold">1. Verificar Tabelas DynamoDB</h3>
                  <CommandBlock id="verify-tables" command="aws dynamodb list-tables" />
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">2. Verificar S3 Bucket</h3>
                  <CommandBlock id="verify-s3" command="aws s3 ls" />
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">3. Verificar API Gateway</h3>
                  <CommandBlock id="verify-api" command="aws apigateway get-rest-apis" />
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">4. Testar API</h3>
                  <CommandBlock
                    id="test-api"
                    command="curl -X GET https://seu-api-id.execute-api.us-east-1.amazonaws.com/prod/health"
                  />
                  <p className="mt-2 text-sm text-slate-600">
                    Resposta esperada: {"{"}"status": "healthy"{"}"}
                  </p>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">5. Testar Frontend</h3>
                  <p className="text-sm text-slate-600">
                    Acesse seu domínio Vercel e teste o login com as credenciais demo
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Troubleshooting */}
          <TabsContent value="troubleshoot" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Problemas Comuns e Soluções</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-2 font-semibold text-red-600">❌ Erro: CREATE_FAILED no CloudFormation</h3>
                  <p className="mb-2 text-sm text-slate-700">Solução:</p>
                  <ul className="ml-5 space-y-1 text-sm text-slate-600">
                    <li>• Verifique limites de serviço da sua conta AWS</li>
                    <li>• Confirme que a região suporta todos os serviços</li>
                    <li>• Delete a stack e tente novamente</li>
                  </ul>
                  <CommandBlock
                    id="delete-stack"
                    command="aws cloudformation delete-stack --stack-name petrobras-file-transfer"
                  />
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-red-600">❌ Erro: Permissões insuficientes</h3>
                  <p className="mb-2 text-sm text-slate-700">Solução:</p>
                  <ul className="ml-5 space-y-1 text-sm text-slate-600">
                    <li>• Verifique se o usuário IAM tem permissões de AdministratorAccess</li>
                    <li>• Ou adicione políticas específicas para cada serviço</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-red-600">❌ Erro: Tabelas DynamoDB já existem</h3>
                  <p className="mb-2 text-sm text-slate-700">Solução:</p>
                  <CommandBlock
                    id="delete-tables"
                    command="aws dynamodb delete-table --table-name petrobras-users
aws dynamodb delete-table --table-name petrobras-files
# Repita para todas as tabelas"
                  />
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-red-600">❌ API retorna 403 Forbidden</h3>
                  <p className="mb-2 text-sm text-slate-700">Solução:</p>
                  <ul className="ml-5 space-y-1 text-sm text-slate-600">
                    <li>• Verifique as permissões IAM da função Lambda</li>
                    <li>• Confirme que o API Gateway está configurado corretamente</li>
                    <li>• Verifique CORS na configuração do API Gateway</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card className="mt-8 border-green-200 bg-green-50">
          <CardContent className="flex items-start gap-4 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-600">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-green-900">Deploy Completo!</h3>
              <p className="text-sm leading-relaxed text-green-800">
                Após seguir todos os passos, seu sistema estará rodando na AWS. Para mais detalhes sobre monitoramento e
                manutenção, consulte o Deployment Guide completo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
