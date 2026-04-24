import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, GitBranch, Upload, Check, Mail, Download, Database } from "lucide-react"
import Link from "next/link"

export default function FluxoDadosPage() {
  const user_id = "12345" // Declare user_id variable
  const filename = "example.txt" // Declare filename variable

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Link href="/wiki-dev">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Home className="h-4 w-4" />
              Voltar para Wiki-Dev
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <GitBranch className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Fluxo de Dados End-to-End
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">Como os dados trafegam pelo sistema, passo a passo</p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="upload" className="text-sm">
              Upload
            </TabsTrigger>
            <TabsTrigger value="aprovacao" className="text-sm">
              Aprovação
            </TabsTrigger>
            <TabsTrigger value="externo" className="text-sm">
              Acesso Externo
            </TabsTrigger>
            <TabsTrigger value="download" className="text-sm">
              Download
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-purple-600" />
                  Fluxo de Upload de Arquivo
                </CardTitle>
                <CardDescription>Desde o upload até salvar no banco</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Usuário seleciona arquivo</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        No front-end (página /upload), o usuário arrasta ou seleciona um arquivo
                      </p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs font-mono text-gray-700">
                          Componente:{" "}
                          <code className="bg-gray-100 px-1 rounded">components/upload/file-upload-zone.tsx</code>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Arquivo é validado (tamanho, tipo, etc)</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-purple-300"></div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Front-end envia para Back-end</h3>
                      <p className="text-sm text-gray-600 mb-3">Requisição POST para API do Python com o arquivo</p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs font-mono text-gray-700">
                          Endpoint: <code className="bg-gray-100 px-1 rounded">POST /api/v1/files/upload</code>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Body: FormData com arquivo + metadados (destinatário, mensagem, etc)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-purple-300"></div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Back-end salva no S3</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Python usa boto3 para fazer upload do arquivo para AWS S3
                      </p>
                      <div className="bg-white border rounded-lg p-3 space-y-2">
                        <p className="text-xs font-mono text-gray-700">Serviço: AWS S3 → Bucket configurado</p>
                        <p className="text-xs text-gray-500">
                          Path:{" "}
                          <code className="bg-gray-100 px-1 rounded">
                            uploads/2025/01/{user_id}/{filename}
                          </code>
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            boto3
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            s3.upload_fileobj()
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-purple-300"></div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Salva registro no banco</h3>
                      <p className="text-sm text-gray-600 mb-3">Cria registros nas tabelas: arquivo, share, audit</p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs font-mono text-gray-700 mb-2">Tabelas afetadas:</p>
                        <ul className="space-y-1">
                          <li className="text-xs text-gray-600">
                            • <code className="bg-gray-100 px-1 rounded">arquivo</code> - Metadados do arquivo
                          </li>
                          <li className="text-xs text-gray-600">
                            • <code className="bg-gray-100 px-1 rounded">share</code> - Compartilhamento (status:
                            PENDENTE)
                          </li>
                          <li className="text-xs text-gray-600">
                            • <code className="bg-gray-100 px-1 rounded">audit</code> - Log de auditoria
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-purple-300"></div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Envia email para supervisor</h3>
                      <p className="text-sm text-gray-600 mb-3">Front-end chama API de email (Microsoft Graph API)</p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs font-mono text-gray-700">
                          Endpoint: <code className="bg-gray-100 px-1 rounded">POST /api/send-email</code>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Email enviado com link para aprovação: /supervisor/detalhes/[id]
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            Microsoft Graph
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Mail.Send
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Resumo do Fluxo:</h4>
                  <p className="text-sm text-blue-800">
                    Front-End → API Python → S3 (arquivo) → PostgreSQL (metadata) → Email (supervisor)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aprovacao" className="space-y-6">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  Fluxo de Aprovação do Supervisor
                </CardTitle>
                <CardDescription>Como o supervisor aprova ou rejeita um compartilhamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Supervisor recebe email</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Email contém detalhes do compartilhamento e link para aprovar
                      </p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          Template HTML profissional com botão "Aprovar Compartilhamento"
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-green-300"></div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Supervisor faz login</h3>
                      <p className="text-sm text-gray-600 mb-3">Clica no link e faz login com Microsoft Entra ID</p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs font-mono text-gray-700">
                          Página: <code className="bg-gray-100 px-1 rounded">/supervisor/detalhes/[id]</code>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-green-300"></div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Visualiza detalhes e decide</h3>
                      <p className="text-sm text-gray-600 mb-3">Vê informações do arquivo, destinatário, mensagem</p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs text-gray-500">Botões: "Aprovar" (verde) ou "Rejeitar" (vermelho)</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-green-300"></div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Front-end atualiza status</h3>
                      <p className="text-sm text-gray-600 mb-3">Requisição para API atualizar o compartilhamento</p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs font-mono text-gray-700">
                          Endpoint:{" "}
                          <code className="bg-gray-100 px-1 rounded">PATCH /api/v1/shares/{"{id}"}/approve</code>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Atualiza status na tabela share: APROVADO ou REJEITADO
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-green-300"></div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Email enviado ao destinatário</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Se APROVADO: Destinatário externo recebe email com link e OTP
                      </p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs text-gray-500">Email contém: Link para download + Código de 6 dígitos</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Registro de auditoria criado com ação de aprovação/rejeição
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="externo" className="space-y-6">
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-orange-600" />
                  Fluxo de Acesso Externo (OTP)
                </CardTitle>
                <CardDescription>Como usuário externo acessa o arquivo compartilhado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Recebe email com OTP</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Após aprovação do supervisor, destinatário recebe email
                      </p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          Email contém: Link para /download/[token] + Código de 6 dígitos
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-orange-300"></div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Clica no link</h3>
                      <p className="text-sm text-gray-600 mb-3">Abre a página de download no navegador</p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs font-mono text-gray-700">
                          Página: <code className="bg-gray-100 px-1 rounded">/download/[token]</code>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-orange-300"></div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Insere email e OTP</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Formulário pede: Email do destinatário + Código de 6 dígitos
                      </p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          Sistema valida se email corresponde ao destinatário cadastrado
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-orange-300"></div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">API valida OTP</h3>
                      <p className="text-sm text-gray-600 mb-3">Requisição POST para validar OTP no back-end</p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs font-mono text-gray-700">
                          Endpoint: <code className="bg-gray-100 px-1 rounded">POST /api/v1/external/validate-otp</code>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Verifica: Token válido + OTP correto + Email corresponde
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-orange-300"></div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Libera download</h3>
                      <p className="text-sm text-gray-600 mb-3">Se tudo válido, gera link presigned do S3</p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs text-gray-500">CloudFront URL temporária (válida por 1 hora)</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Registro de auditoria: Download realizado por email externo
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">Segurança:</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• OTP expira em 24 horas</li>
                    <li>• Máximo 5 tentativas de validação</li>
                    <li>• Link de download expira em 1 hora</li>
                    <li>• Tudo registrado em auditoria</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="download" className="space-y-6">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-600" />
                  Fluxo de Download
                </CardTitle>
                <CardDescription>Como o arquivo é baixado do S3 via CloudFront</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Usuário clica em "Download"</h3>
                      <p className="text-sm text-gray-600 mb-3">Após validação bem-sucedida</p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs text-gray-500">Front-end chama API para gerar link de download</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-blue-300"></div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Back-end gera presigned URL</h3>
                      <p className="text-sm text-gray-600 mb-3">Python usa boto3 para gerar URL temporária do S3</p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs font-mono text-gray-700">
                          Método: <code className="bg-gray-100 px-1 rounded">s3.generate_presigned_url()</code>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Validade: 3600 segundos (1 hora)</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-blue-300"></div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Retorna URL do CloudFront</h3>
                      <p className="text-sm text-gray-600 mb-3">API retorna URL para o front-end</p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          URL usa CloudFront para entregar arquivo mais rápido (CDN global)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-blue-300"></div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Download inicia</h3>
                      <p className="text-sm text-gray-600 mb-3">Navegador baixa arquivo diretamente do CloudFront</p>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs text-gray-500">Registro de auditoria criado: Download concluído</p>
                        <p className="text-xs text-gray-500 mt-1">Metadados salvos: IP, user-agent, data/hora</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Por que CloudFront?</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Mais rápido (CDN com cache global)</li>
                    <li>• Reduz custo de transferência do S3</li>
                    <li>• Protege o bucket S3 (não exposto diretamente)</li>
                    <li>• Suporta HTTPS obrigatório</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8 border-gray-200 bg-gradient-to-br from-gray-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-gray-600" />
              Estados dos Dados
            </CardTitle>
            <CardDescription>Como o status muda ao longo do fluxo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-yellow-500">PENDENTE</Badge>
                <span className="text-sm text-gray-600">→ Upload realizado, aguardando aprovação do supervisor</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-600">APROVADO</Badge>
                <span className="text-sm text-gray-600">
                  → Supervisor aprovou, email enviado ao destinatário externo
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-red-600">REJEITADO</Badge>
                <span className="text-sm text-gray-600">→ Supervisor rejeitou, compartilhamento cancelado</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-600">ACESSADO</Badge>
                <span className="text-sm text-gray-600">→ Destinatário validou OTP e fez download</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-gray-600">EXPIRADO</Badge>
                <span className="text-sm text-gray-600">→ Prazo de validade passou (OTP ou link expirou)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
