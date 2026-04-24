"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileCode, ChevronLeft, Database, Layers, FolderTree } from "lucide-react"
import Link from "next/link"

export default function SqlReadmePage() {
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
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <FileCode className="h-7 w-7 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">SQL & DynamoDB</h1>
          <p className="text-lg text-slate-600">
            Documentação completa da estrutura de banco de dados e scripts de inicialização
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Badge variant="secondary">DynamoDB</Badge>
            <Badge variant="secondary">Python</Badge>
            <Badge variant="secondary">CloudFormation</Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="structure">Estrutura</TabsTrigger>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
            <TabsTrigger value="usage">Como Usar</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sobre a Pasta SQL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="leading-relaxed text-slate-700">
                  A pasta <code className="rounded bg-slate-100 px-2 py-1 text-sm">/sql</code> contém toda a
                  infraestrutura de banco de dados necessária para o sistema de transferência de arquivos da Petrobras.
                  Apesar do nome "SQL", utilizamos <strong>DynamoDB</strong> como banco de dados NoSQL devido às suas
                  vantagens de escalabilidade, performance e integração nativa com serviços AWS.
                </p>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="mb-2 font-semibold text-blue-900">Por que DynamoDB?</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>✓ Escalabilidade automática para milhões de requisições</li>
                    <li>✓ Latência de milissegundos garantida</li>
                    <li>✓ Custo baseado em uso (pay-per-request)</li>
                    <li>✓ Backup automático e recuperação point-in-time</li>
                    <li>✓ Integração nativa com Lambda, API Gateway e outros serviços AWS</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Arquivos na Pasta SQL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 rounded-lg border border-slate-200 p-4">
                    <Database className="h-6 w-6 shrink-0 text-blue-600" />
                    <div>
                      <h4 className="mb-1 font-semibold">dynamodb-tables.json</h4>
                      <p className="text-sm text-slate-600">
                        Definições completas das 5 tabelas DynamoDB com esquemas, índices e configurações
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-lg border border-slate-200 p-4">
                    <FileCode className="h-6 w-6 shrink-0 text-purple-600" />
                    <div>
                      <h4 className="mb-1 font-semibold">create-tables.py</h4>
                      <p className="text-sm text-slate-600">
                        Script Python automatizado para criar todas as tabelas DynamoDB com índices GSI
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-lg border border-slate-200 p-4">
                    <Layers className="h-6 w-6 shrink-0 text-orange-600" />
                    <div>
                      <h4 className="mb-1 font-semibold">cloudformation-template.yaml</h4>
                      <p className="text-sm text-slate-600">
                        Template Infrastructure as Code para deploy completo na AWS (DynamoDB + S3 + Lambda + API
                        Gateway)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estrutura */}
          <TabsContent value="structure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estrutura de Tabelas DynamoDB</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    {
                      name: "petrobras-users",
                      pk: "userId (String)",
                      description: "Armazena usuários do sistema com autenticação e perfis",
                      fields: ["userId", "email", "name", "role", "passwordHash", "createdAt", "lastLogin"],
                    },
                    {
                      name: "petrobras-files",
                      pk: "fileId (String)",
                      description: "Registros de arquivos enviados e seu status de aprovação",
                      fields: ["fileId", "fileName", "uploadedBy", "status", "s3Key", "expiresAt", "approvedBy"],
                      gsi: ["GSI: status-uploadedAt-index, expiresAt-index"],
                    },
                    {
                      name: "petrobras-audit-logs",
                      pk: "logId (String)",
                      description: "Logs de auditoria de todas as ações do sistema",
                      fields: ["logId", "userId", "action", "details", "ipAddress", "timestamp"],
                      gsi: ["GSI: userId-timestamp-index, action-timestamp-index"],
                    },
                    {
                      name: "petrobras-notifications",
                      pk: "notificationId (String)",
                      description: "Notificações em tempo real para usuários",
                      fields: ["notificationId", "userId", "type", "title", "message", "read", "createdAt"],
                      gsi: ["GSI: userId-createdAt-index"],
                    },
                    {
                      name: "petrobras-expiration-logs",
                      pk: "logId (String)",
                      description: "Histórico de mudanças no tempo de expiração de arquivos",
                      fields: ["logId", "fileId", "changedBy", "oldExpiration", "newExpiration", "reason", "timestamp"],
                      gsi: ["GSI: fileId-timestamp-index"],
                    },
                  ].map((table) => (
                    <div key={table.name} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h4 className="font-mono text-sm font-semibold text-blue-600">{table.name}</h4>
                          <p className="mt-1 text-sm text-slate-600">{table.description}</p>
                        </div>
                        <Badge variant="outline">PK: {table.pk}</Badge>
                      </div>
                      <div className="mb-2">
                        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Campos:</p>
                        <div className="flex flex-wrap gap-2">
                          {table.fields.map((field) => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {table.gsi && (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Índices Secundários:</p>
                          {table.gsi.map((index, i) => (
                            <p key={i} className="text-xs text-slate-600">
                              {index}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scripts */}
          <TabsContent value="scripts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>create-tables.py</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-700">
                  Script Python que automatiza a criação de todas as tabelas DynamoDB com configurações corretas
                </p>

                <div className="rounded-lg border border-slate-200 bg-slate-950 p-4">
                  <code className="block overflow-x-auto text-xs text-slate-100">
                    {`# Exemplo de uso
python create-tables.py

# O script irá:
# 1. Conectar na AWS usando suas credenciais
# 2. Criar 5 tabelas DynamoDB
# 3. Configurar índices GSI
# 4. Definir billing mode como PAY_PER_REQUEST
# 5. Habilitar Point-in-Time Recovery
# 6. Configurar TTL nos campos apropriados`}
                  </code>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <h4 className="mb-2 font-semibold text-amber-900">Atenção</h4>
                  <ul className="space-y-1 text-sm text-amber-800">
                    <li>• Certifique-se de ter o AWS CLI configurado</li>
                    <li>• Usuário IAM precisa de permissões dynamodb:CreateTable</li>
                    <li>• O script verifica se as tabelas já existem antes de criar</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>cloudformation-template.yaml</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-700">
                  Template CloudFormation que cria toda a infraestrutura AWS necessária
                </p>

                <div className="space-y-3">
                  <h4 className="font-semibold">Recursos Criados:</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      "5 Tabelas DynamoDB",
                      "S3 Bucket para arquivos",
                      "Lambda Functions (6)",
                      "API Gateway REST API",
                      "CloudFront Distribution",
                      "Cognito User Pool",
                      "IAM Roles e Policies",
                      "CloudWatch Alarms",
                      "SQS Queues",
                      "SNS Topics",
                    ].map((resource) => (
                      <div key={resource} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        {resource}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Como Usar */}
          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Passo a Passo para Inicializar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        1
                      </div>
                      <h4 className="font-semibold">Configurar AWS CLI</h4>
                    </div>
                    <div className="ml-11 rounded-lg border border-slate-200 bg-slate-950 p-4">
                      <code className="text-xs text-slate-100">aws configure</code>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        2
                      </div>
                      <h4 className="font-semibold">Criar Tabelas DynamoDB</h4>
                    </div>
                    <div className="ml-11 rounded-lg border border-slate-200 bg-slate-950 p-4">
                      <code className="text-xs text-slate-100">
                        cd sql
                        <br />
                        python create-tables.py
                      </code>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        3
                      </div>
                      <h4 className="font-semibold">Deploy com CloudFormation</h4>
                    </div>
                    <div className="ml-11 rounded-lg border border-slate-200 bg-slate-950 p-4">
                      <code className="text-xs text-slate-100">
                        aws cloudformation create-stack \<br />
                        &nbsp;&nbsp;--stack-name petrobras-file-transfer \<br />
                        &nbsp;&nbsp;--template-body file://cloudformation-template.yaml \<br />
                        &nbsp;&nbsp;--capabilities CAPABILITY_IAM
                      </code>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        4
                      </div>
                      <h4 className="font-semibold">Verificar Deploy</h4>
                    </div>
                    <div className="ml-11 rounded-lg border border-slate-200 bg-slate-950 p-4">
                      <code className="text-xs text-slate-100">aws dynamodb list-tables</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="flex items-start gap-4 p-6">
                <FolderTree className="h-6 w-6 shrink-0 text-green-600" />
                <div>
                  <h3 className="mb-1 font-semibold text-green-900">Próximos Passos</h3>
                  <p className="text-sm leading-relaxed text-green-800">
                    Após criar a infraestrutura de banco de dados, consulte o Quick Start para fazer o deploy completo
                    do sistema incluindo backend Python e frontend Next.js.
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
