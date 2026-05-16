import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Home, AlertTriangle, CheckCircle, XCircle, Search } from "lucide-react"
import Link from "next/link"

export default function TroubleshootingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
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
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Problemas Comuns e Soluções
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">Guia prático para resolver os problemas mais frequentes</p>
        </div>

        <div className="space-y-6">
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Autenticação e Login
              </CardTitle>
              <CardDescription>Problemas com Entra ID, SSO e acesso ao sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Erro</Badge>
                      <span>Login com Microsoft não funciona (redirect URI mismatch)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-4 border-l-2 border-red-300">
                      <div>
                        <p className="font-semibold text-sm mb-2">🔍 Sintomas:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>Erro AADSTS50011 após clicar em "Login com Microsoft"</li>
                          <li>Mensagem: "The redirect URI specified does not match"</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-sm mb-2">✅ Solução:</p>
                        <ol className="list-decimal list-inside text-sm space-y-2">
                          <li className="text-gray-700">
                            Verifique a variável{" "}
                            <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_ENTRA_REDIRECT_URI</code> no Vercel
                          </li>
                          <li className="text-gray-700">
                            Ela deve ser EXATAMENTE igual ao redirect URI cadastrado no Azure AD
                          </li>
                          <li className="text-gray-700">
                            Vá em: Azure Portal → App Registrations → Authentication → Redirect URIs
                          </li>
                          <li className="text-gray-700">
                            Adicione: <code className="bg-gray-100 px-1 rounded">https://seu-dominio.vercel.app</code>
                          </li>
                          <li className="text-gray-700">Salve e espere 5 minutos para propagar</li>
                        </ol>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                        <p className="text-xs text-blue-800">
                          💡 <strong>Dica:</strong> Não adicione /upload ou qualquer caminho no redirect URI. Apenas a
                          URL base!
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Erro</Badge>
                      <span>Supervisor não aparece no perfil</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-4 border-l-2 border-red-300">
                      <div>
                        <p className="font-semibold text-sm mb-2">🔍 Sintomas:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>Login funciona mas não mostra supervisor</li>
                          <li>Foto do perfil não carrega</li>
                          <li>Cargo não aparece</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-sm mb-2">✅ Solução:</p>
                        <ol className="list-decimal list-inside text-sm space-y-2">
                          <li className="text-gray-700">
                            Verifique se o Azure AD tem as permissões corretas:
                            <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                              <li>
                                <code className="bg-gray-100 px-1 rounded">User.Read</code>
                              </li>
                              <li>
                                <code className="bg-gray-100 px-1 rounded">User.ReadBasic.All</code>
                              </li>
                              <li>
                                <code className="bg-gray-100 px-1 rounded">User.Read.All</code>
                              </li>
                            </ul>
                          </li>
                          <li className="text-gray-700">Vá em: Azure Portal → App Registrations → API Permissions</li>
                          <li className="text-gray-700">Adicione as permissões acima (Microsoft Graph, Delegated)</li>
                          <li className="text-gray-700">Clique em "Grant admin consent"</li>
                          <li className="text-gray-700">Faça LOGOUT e LOGIN novamente no sistema</li>
                        </ol>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-3">
                        <p className="text-xs text-amber-800">
                          ⚠️ <strong>Importante:</strong> Após adicionar permissões, é necessário fazer logout/login para
                          obter novo token!
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Erro</Badge>
                      <span>Foto do perfil não carrega</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-4 border-l-2 border-red-300">
                      <div>
                        <p className="font-semibold text-sm mb-2">🔍 Causas comuns:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>Falta permissão User.Read.All no Azure AD</li>
                          <li>Usuário não tem foto cadastrada no Microsoft 365</li>
                          <li>Token expirado (não fez logout/login após adicionar permissões)</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-sm mb-2">✅ Solução:</p>
                        <ol className="list-decimal list-inside text-sm space-y-2">
                          <li className="text-gray-700">Adicione a permissão User.Read.All no Azure AD</li>
                          <li className="text-gray-700">Verifique se o usuário tem foto no Microsoft 365/Outlook</li>
                          <li className="text-gray-700">Faça logout e login novamente</li>
                          <li className="text-gray-700">Abra o Console (F12) e veja se há erros de requisição</li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Erro</Badge>
                      <span>OTP de usuário externo não chega por email</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-4 border-l-2 border-red-300">
                      <div>
                        <p className="font-semibold text-sm mb-2">🔍 Sintomas:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>Usuário externo não recebe código de 6 dígitos</li>
                          <li>Email não chega na caixa de entrada</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-sm mb-2">✅ Solução:</p>
                        <ol className="list-decimal list-inside text-sm space-y-2">
                          <li className="text-gray-700">
                            Verifique se a permissão <code className="bg-gray-100 px-1 rounded">Mail.Send</code> foi
                            adicionada no Azure AD
                          </li>
                          <li className="text-gray-700">Peça ao usuário verificar a caixa de SPAM</li>
                          <li className="text-gray-700">
                            Verifique os logs do servidor (F12 → Network) para ver se o endpoint foi chamado
                          </li>
                          <li className="text-gray-700">Confirme que o email do destinatário está correto</li>
                          <li className="text-gray-700">Tente reenviar o código</li>
                        </ol>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                        <p className="text-xs text-blue-800">
                          💡 <strong>Dica:</strong> O email é enviado usando a conta Microsoft 365 do usuário logado
                          através do Microsoft Graph API.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Upload e Armazenamento
              </CardTitle>
              <CardDescription>Problemas com envio de arquivos e S3/CloudFront</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="upload-1">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Erro</Badge>
                      <span>Upload de arquivo falha / não completa</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-4 border-l-2 border-orange-300">
                      <div>
                        <p className="font-semibold text-sm mb-2">🔍 Causas comuns:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>Credenciais AWS inválidas ou expiradas</li>
                          <li>Bucket S3 não existe ou nome incorreto</li>
                          <li>Falta permissão no bucket (IAM policy)</li>
                          <li>Arquivo muito grande (limite do navegador)</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-sm mb-2">✅ Solução:</p>
                        <ol className="list-decimal list-inside text-sm space-y-2">
                          <li className="text-gray-700">
                            Verifique as variáveis AWS no back-end (.env):
                            <ul className="list-disc list-inside ml-6 mt-1">
                              <li>
                                <code className="bg-gray-100 px-1 rounded">AWS_ACCESS_KEY_ID</code>
                              </li>
                              <li>
                                <code className="bg-gray-100 px-1 rounded">AWS_SECRET_ACCESS_KEY</code>
                              </li>
                              <li>
                                <code className="bg-gray-100 px-1 rounded">AWS_BUCKET_NAME</code>
                              </li>
                              <li>
                                <code className="bg-gray-100 px-1 rounded">AWS_REGION</code>
                              </li>
                            </ul>
                          </li>
                          <li className="text-gray-700">
                            Teste as credenciais AWS CLI: <code className="bg-gray-100 px-1 rounded">aws s3 ls</code>
                          </li>
                          <li className="text-gray-700">Verifique se o bucket existe e tem permissões corretas</li>
                          <li className="text-gray-700">Veja os logs do back-end Python para detalhes do erro</li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="upload-2">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Erro</Badge>
                      <span>Download não funciona / link expirado</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-4 border-l-2 border-orange-300">
                      <div>
                        <p className="font-semibold text-sm mb-2">🔍 Causas:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>URL do CloudFront incorreta ou não configurada</li>
                          <li>Link presigned expirou (validade de 1 hora padrão)</li>
                          <li>Arquivo foi deletado do S3</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-sm mb-2">✅ Solução:</p>
                        <ol className="list-decimal list-inside text-sm space-y-2">
                          <li className="text-gray-700">
                            Verifique a variável <code className="bg-gray-100 px-1 rounded">CLOUDFRONT_URL</code> no
                            back-end
                          </li>
                          <li className="text-gray-700">Gere um novo link de download</li>
                          <li className="text-gray-700">
                            Verifique se o arquivo existe no S3:{" "}
                            <code className="bg-gray-100 px-1 rounded">aws s3 ls s3://bucket/path/</code>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Banco de Dados e API
              </CardTitle>
              <CardDescription>Problemas de conexão e erros de API</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="db-1">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Erro</Badge>
                      <span>Erro de conexão com banco de dados</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-4 border-l-2 border-blue-300">
                      <div>
                        <p className="font-semibold text-sm mb-2">🔍 Mensagens comuns:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>"Connection refused"</li>
                          <li>"Password authentication failed"</li>
                          <li>"Database does not exist"</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-sm mb-2">✅ Solução:</p>
                        <ol className="list-decimal list-inside text-sm space-y-2">
                          <li className="text-gray-700">
                            Verifique a <code className="bg-gray-100 px-1 rounded">DATABASE_URL</code> no back-end
                          </li>
                          <li className="text-gray-700">
                            Formato correto:{" "}
                            <code className="bg-gray-100 px-1 rounded">postgresql://user:pass@host:5432/dbname</code>
                          </li>
                          <li className="text-gray-700">
                            Teste a conexão: <code className="bg-gray-100 px-1 rounded">psql [DATABASE_URL]</code>
                          </li>
                          <li className="text-gray-700">Verifique se o PostgreSQL está rodando</li>
                          <li className="text-gray-700">Confirme user, senha e nome do banco</li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="db-2">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Erro</Badge>
                      <span>API retorna 500 Internal Server Error</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-4 border-l-2 border-blue-300">
                      <div>
                        <p className="font-semibold text-sm mb-2">✅ Como debugar:</p>
                        <ol className="list-decimal list-inside text-sm space-y-2">
                          <li className="text-gray-700">Abra o Console do navegador (F12) → Aba Network</li>
                          <li className="text-gray-700">Refaça a ação que deu erro</li>
                          <li className="text-gray-700">Clique na requisição vermelha e veja a resposta</li>
                          <li className="text-gray-700">Verifique os logs do back-end Python para detalhes</li>
                          <li className="text-gray-700">Procure por stack trace ou mensagem de erro específica</li>
                        </ol>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-3">
                        <p className="text-xs text-amber-800">
                          💡 <strong>Dica:</strong> Erros 500 geralmente são problemas no servidor (back-end). Sempre
                          verifique os logs do Python!
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="db-3">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Erro</Badge>
                      <span>CORS error ao chamar API</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-4 border-l-2 border-blue-300">
                      <div>
                        <p className="font-semibold text-sm mb-2">🔍 Mensagem típica:</p>
                        <code className="text-xs bg-gray-100 p-2 rounded block">
                          Access to fetch has been blocked by CORS policy
                        </code>
                      </div>

                      <div>
                        <p className="font-semibold text-sm mb-2">✅ Solução:</p>
                        <ol className="list-decimal list-inside text-sm space-y-2">
                          <li className="text-gray-700">
                            No back-end Python, adicione a URL do front na variável{" "}
                            <code className="bg-gray-100 px-1 rounded">CORS_ORIGINS</code>
                          </li>
                          <li className="text-gray-700">
                            Formato:{" "}
                            <code className="bg-gray-100 px-1 rounded">
                              https://seu-front.vercel.app,http://localhost:3000
                            </code>
                          </li>
                          <li className="text-gray-700">Reinicie o servidor back-end</li>
                          <li className="text-gray-700">Limpe o cache do navegador (Ctrl+Shift+R)</li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Checklist de Debug Geral
              </CardTitle>
              <CardDescription>Siga estes passos quando algo não funcionar</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                    1
                  </span>
                  <div>
                    <p className="font-semibold">Abra o Console do navegador (F12)</p>
                    <p className="text-sm text-gray-600">Veja se há erros em vermelho na aba Console</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                    2
                  </span>
                  <div>
                    <p className="font-semibold">Verifique a aba Network</p>
                    <p className="text-sm text-gray-600">
                      Veja se as requisições estão retornando 200 OK ou erros (400, 401, 403, 500)
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                    3
                  </span>
                  <div>
                    <p className="font-semibold">Confirme as variáveis de ambiente</p>
                    <p className="text-sm text-gray-600">
                      No Vercel (front) e no servidor (back), verifique se todas as env vars estão corretas
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                    4
                  </span>
                  <div>
                    <p className="font-semibold">Teste localmente primeiro</p>
                    <p className="text-sm text-gray-600">Rode front e back localmente para isolar o problema</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                    5
                  </span>
                  <div>
                    <p className="font-semibold">Verifique os logs do servidor</p>
                    <p className="text-sm text-gray-600">Logs do Python/FastAPI geralmente mostram o erro exato</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                    6
                  </span>
                  <div>
                    <p className="font-semibold">Limpe cache e cookies</p>
                    <p className="text-sm text-gray-600">
                      Às vezes tokens antigos causam problemas - faça logout/login
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
