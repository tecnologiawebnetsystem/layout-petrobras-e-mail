import { Home, Users, Shield, CheckCircle, Mail, Upload, CheckSquare, Info, Download, Terminal } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

export default function TestesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Link
          href="/wiki-dev"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
          Voltar para Wiki-Dev
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Como Testar o Sistema
          </h1>
          <p className="text-lg text-muted-foreground">Guia prático para testar todas as funcionalidades</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="aprovacao">Aprovação</TabsTrigger>
            <TabsTrigger value="download">Download</TabsTrigger>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Testar Login e Autenticação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Teste 1: Login com Microsoft (Interno)
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Acesse a página inicial</li>
                      <li>Clique em "Login com Microsoft"</li>
                      <li>Entre com email @petrobras.com.br</li>
                      <li>Verifique se seu nome aparece no header</li>
                      <li>Verifique se sua foto aparece (se tiver)</li>
                      <li>Clique no perfil e veja se o supervisor está correto</li>
                    </ol>
                    <Alert className="mt-3">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Sucesso:</strong> Nome, email e supervisor aparecem corretamente
                      </AlertDescription>
                    </Alert>
                  </div>

                  <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Teste 2: Login com OTP (Externo)
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Acesse a página inicial</li>
                      <li>Digite um email externo (ex: teste@gmail.com)</li>
                      <li>Digite uma senha qualquer</li>
                      <li>Clique em "Entrar"</li>
                      <li>Verifique se recebeu email com código OTP de 6 dígitos</li>
                      <li>Digite o código e entre</li>
                    </ol>
                    <Alert className="mt-3">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Sucesso:</strong> Recebeu email e conseguiu entrar com OTP
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-green-600" />
                  Testar Upload de Arquivos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <ol className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-sm font-bold text-green-600 dark:text-green-400">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Faça login como usuário interno</p>
                        <p className="text-sm text-muted-foreground">Use conta Microsoft @petrobras.com.br</p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-sm font-bold text-green-600 dark:text-green-400">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Vá para página de Upload</p>
                        <p className="text-sm text-muted-foreground">Menu lateral → "Enviar Arquivo"</p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-sm font-bold text-green-600 dark:text-green-400">
                        3
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Preencha o formulário</p>
                        <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                          <li>• Título: "Teste de Upload"</li>
                          <li>• Descrição: "Testando sistema"</li>
                          <li>• Email destinatário: teste@gmail.com</li>
                          <li>• Selecione um arquivo PDF (máx 10MB)</li>
                        </ul>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-sm font-bold text-green-600 dark:text-green-400">
                        4
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Clique em "Compartilhar Arquivo"</p>
                        <p className="text-sm text-muted-foreground">Aguarde o upload (barra de progresso)</p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-sm font-bold text-green-600 dark:text-green-400">
                        5
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Verifique modal de sucesso</p>
                        <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                          <li>✓ Nome do arquivo aparece</li>
                          <li>✓ Email do destinatário está correto</li>
                          <li>✓ Status: "Aguardando Aprovação"</li>
                        </ul>
                      </div>
                    </li>
                  </ol>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Upload bem-sucedido quando:</AlertTitle>
                    <AlertDescription>
                      • Modal de sucesso aparece
                      <br />• Arquivo vai para "Meus Compartilhamentos"
                      <br />• Supervisor recebe email de aprovação
                      <br />• Log de auditoria é criado
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aprovacao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-yellow-600" />
                  Testar Aprovação de Supervisor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Para testar aprovação, você precisa de 2 contas:
                      <br />
                      <strong>Conta 1:</strong> Usuário que faz upload
                      <br />
                      <strong>Conta 2:</strong> Supervisor do usuário (do Active Directory)
                    </AlertDescription>
                  </Alert>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Passo a Passo</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Faça upload de arquivo (como usuário normal)</li>
                      <li>Abra o email do supervisor</li>
                      <li>Clique no link "Ver Detalhes da Solicitação"</li>
                      <li>Faça login como supervisor</li>
                      <li>Veja os detalhes do arquivo na tela</li>
                      <li>Clique em "Aprovar" ou "Rejeitar"</li>
                      <li>Adicione um comentário (opcional)</li>
                      <li>Confirme a ação</li>
                    </ol>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                      <h4 className="font-semibold mb-2 text-green-600">Se Aprovar:</h4>
                      <ul className="text-sm space-y-1">
                        <li>✓ Status muda para "Aprovado"</li>
                        <li>✓ Destinatário externo recebe email</li>
                        <li>✓ Email tem link + OTP de 6 dígitos</li>
                        <li>✓ Log de aprovação é criado</li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                      <h4 className="font-semibold mb-2 text-red-600">Se Rejeitar:</h4>
                      <ul className="text-sm space-y-1">
                        <li>✓ Status muda para "Rejeitado"</li>
                        <li>✓ Remetente recebe notificação</li>
                        <li>✓ Arquivo não fica disponível</li>
                        <li>✓ Log de rejeição é criado</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="download" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-purple-600" />
                  Testar Download de Arquivo (Externo)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>Este teste só funciona APÓS o supervisor aprovar o arquivo</AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <ol className="list-decimal list-inside space-y-3">
                    <li>
                      <strong>Abra o email do destinatário externo</strong>
                      <p className="text-sm text-muted-foreground ml-5">(email que você colocou no upload)</p>
                    </li>
                    <li>
                      <strong>Copie o código OTP de 6 dígitos</strong>
                      <p className="text-sm text-muted-foreground ml-5">Ex: 123456</p>
                    </li>
                    <li>
                      <strong>Clique no link do email</strong>
                      <p className="text-sm text-muted-foreground ml-5">Vai abrir a página de login externo</p>
                    </li>
                    <li>
                      <strong>Digite o email do destinatário</strong>
                      <p className="text-sm text-muted-foreground ml-5">Tem que ser o MESMO email do upload</p>
                    </li>
                    <li>
                      <strong>Digite o código OTP</strong>
                      <p className="text-sm text-muted-foreground ml-5">Os 6 dígitos que você copiou</p>
                    </li>
                    <li>
                      <strong>Clique em "Entrar"</strong>
                      <p className="text-sm text-muted-foreground ml-5">Sistema valida o OTP</p>
                    </li>
                    <li>
                      <strong>Veja o arquivo disponível</strong>
                      <p className="text-sm text-muted-foreground ml-5">Nome, tamanho e descrição aparecem</p>
                    </li>
                    <li>
                      <strong>Clique em "Baixar Arquivo"</strong>
                      <p className="text-sm text-muted-foreground ml-5">Download inicia automaticamente</p>
                    </li>
                  </ol>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Download bem-sucedido quando:</AlertTitle>
                    <AlertDescription>
                      • OTP é validado corretamente
                      <br />• Arquivo é baixado completo
                      <br />• Tamanho do arquivo está correto
                      <br />• Log de download é criado
                      <br />• OTP expira após uso
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scripts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-orange-600" />
                  Scripts de Teste Automático
                </CardTitle>
                <CardDescription>Use estes scripts para testar rapidamente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Script: Testar Endpoints do Back-End</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`# Testar se API está no ar
curl https://api.petrobras.com/health

# Testar login interno
curl -X POST https://api.petrobras.com/api/v1/auth/internal/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "teste@petrobras.com.br", "password": "senha123"}'

# Testar lista de arquivos (precisa de token)
curl https://api.petrobras.com/api/v1/files \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI"`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Script: Popular Banco com Dados de Teste</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`# Rodar seed do banco (cria usuários e dados fake)
cd back-end/python
python -m app.scripts.seed_dev`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Script: Limpar Cache e Cookies</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`# No navegador, abra Console (F12) e rode:
localStorage.clear()
sessionStorage.clear()
location.reload()`}
                    </pre>
                  </div>

                  <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Dica Pro</AlertTitle>
                    <AlertDescription>
                      Use Postman ou Insomnia para salvar coleções de testes e rodar automaticamente
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
