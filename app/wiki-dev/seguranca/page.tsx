import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, Shield, Lock, Key, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function SegurancaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50">
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
            <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
              Segurança e Boas Práticas
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">Como o sistema protege os dados - Explicado de forma simples</p>
        </div>

        <Tabs defaultValue="autenticacao" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="autenticacao" className="text-sm">
              Autenticação
            </TabsTrigger>
            <TabsTrigger value="autorizacao" className="text-sm">
              Autorização
            </TabsTrigger>
            <TabsTrigger value="tokens" className="text-sm">
              Tokens
            </TabsTrigger>
            <TabsTrigger value="protecao" className="text-sm">
              Proteção Web
            </TabsTrigger>
            <TabsTrigger value="checklist" className="text-sm">
              Checklist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="autenticacao" className="space-y-6">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Autenticação: Quem você é?
                </CardTitle>
                <CardDescription>Como o sistema verifica a identidade do usuário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Badge className="bg-blue-600">Interno</Badge>
                    Microsoft Entra ID (SSO)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-2">Como funciona:</p>
                      <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                        <li>Funcionário da Petrobras clica em "Login com Microsoft"</li>
                        <li>Sistema redireciona para login do Microsoft (email corporativo)</li>
                        <li>Microsoft valida credenciais e retorna um TOKEN</li>
                        <li>Token contém: nome, email, cargo, supervisor, foto</li>
                        <li>Sistema salva o token e permite acesso</li>
                      </ol>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Por que é seguro?</p>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>✓ Não guardamos senhas (Microsoft cuida disso)</li>
                        <li>✓ Token expira em 1 hora</li>
                        <li>✓ Só funciona para emails @petrobras.com.br</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Badge className="bg-orange-600">Externo</Badge>
                    OTP (Código de 6 dígitos)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-2">Como funciona:</p>
                      <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                        <li>Destinatário externo recebe email com link + código (123456)</li>
                        <li>Clica no link e abre a página de download</li>
                        <li>Digite seu email e o código recebido</li>
                        <li>Sistema valida: email correto + código válido + não expirado</li>
                        <li>Libera o download do arquivo</li>
                      </ol>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded p-3">
                      <p className="text-xs font-semibold text-orange-900 mb-1">Proteções:</p>
                      <ul className="text-xs text-orange-800 space-y-1">
                        <li>✓ Código expira em 24 horas</li>
                        <li>✓ Máximo 5 tentativas (depois bloqueia)</li>
                        <li>✓ Link de download expira em 1 hora</li>
                        <li>✓ Cada código serve para 1 arquivo apenas</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="autorizacao" className="space-y-6">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-green-600" />
                  Autorização: O que você pode fazer?
                </CardTitle>
                <CardDescription>Quem pode ver, aprovar ou baixar cada arquivo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="font-bold text-blue-700">👤</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Usuário Interno (Petrobras)</h3>
                        <p className="text-xs text-gray-500">Funcionário logado com Entra ID</p>
                      </div>
                    </div>
                    <div className="space-y-2 pl-13">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">Fazer upload de arquivos</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">Ver seus próprios compartilhamentos</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">Ver histórico dos arquivos que enviou</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">NÃO pode ver arquivos de outros usuários</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="font-bold text-green-700">👔</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Supervisor</h3>
                        <p className="text-xs text-gray-500">Gestor do funcionário no Active Directory</p>
                      </div>
                    </div>
                    <div className="space-y-2 pl-13">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">Aprovar ou rejeitar compartilhamentos da sua equipe</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">Ver detalhes do arquivo antes de aprovar</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">Ver quem é o destinatário externo</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">NÃO pode aprovar se não for o supervisor direto</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="font-bold text-orange-700">📧</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Usuário Externo</h3>
                        <p className="text-xs text-gray-500">Destinatário do arquivo (sem conta Petrobras)</p>
                      </div>
                    </div>
                    <div className="space-y-2 pl-13">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">Baixar APENAS o arquivo enviado para ele</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">SOMENTE se tiver o código OTP correto</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">NÃO pode ver outros arquivos</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">NÃO pode fazer upload</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Princípio do "Menor Privilégio"</h4>
                  <p className="text-sm text-green-800">
                    Cada usuário tem APENAS as permissões necessárias para seu trabalho. Nada mais, nada menos. Isso
                    minimiza os riscos caso uma conta seja comprometida.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokens" className="space-y-6">
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-purple-600" />
                  Tokens JWT: Como funcionam?
                </CardTitle>
                <CardDescription>A "carteira de identidade digital" do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">O que é um JWT?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    JWT (JSON Web Token) é como uma "carteira de identidade digital". Contém informações sobre quem você
                    é e expira após um tempo.
                  </p>

                  <div className="bg-gray-50 border rounded p-4 mb-4">
                    <p className="text-xs font-mono text-gray-500 mb-2">Exemplo de JWT (simplificado):</p>
                    <code className="text-xs break-all">
                      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzIiwiZW1haWwiOiJqb2FvQHBldHJvYnJhcy5jb20uYnIiLCJyb2xlIjoiaW50ZXJuYWwiLCJleHAiOjE3MDU2NzgwMDB9.Xz3kT8nF2mP9rQ5yL4vW1bC7dG6hJ0aE9iK3sR8tU2o
                    </code>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-2">O JWT tem 3 partes:</p>
                      <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                        <li>
                          <strong>Header</strong> - Tipo do token (JWT) e algoritmo (HS256)
                        </li>
                        <li>
                          <strong>Payload</strong> - Dados do usuário (id, email, cargo, expiração)
                        </li>
                        <li>
                          <strong>Signature</strong> - Assinatura criptográfica (garante que não foi alterado)
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Como o sistema usa JWT?</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Login bem-sucedido</p>
                        <p className="text-xs text-gray-600">
                          Após login no Microsoft, o back-end cria um JWT e envia para o front-end
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Front-end guarda o token</p>
                        <p className="text-xs text-gray-600">Token é salvo no localStorage ou cookie seguro</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Toda requisição envia o token</p>
                        <p className="text-xs text-gray-600">
                          Header: <code className="bg-gray-100 px-1 rounded">Authorization: Bearer [TOKEN]</code>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                        4
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Back-end valida o token</p>
                        <p className="text-xs text-gray-600">
                          Verifica assinatura, valida expiração, extrai dados do usuário
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Por que JWT é seguro?</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>✓ Assinado com chave secreta (só o servidor conhece)</li>
                    <li>✓ Se alguém alterar, a assinatura fica inválida</li>
                    <li>✓ Expira automaticamente (60 minutos)</li>
                    <li>✓ Não precisa consultar banco a cada requisição</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="protecao" className="space-y-6">
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Proteções contra Ataques Web
                </CardTitle>
                <CardDescription>CORS, XSS, CSRF - O que são e como nos protegemos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Badge className="bg-blue-600">CORS</Badge>
                    Cross-Origin Resource Sharing
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-2">O que é?</p>
                      <p className="text-sm text-gray-600">
                        Mecanismo que impede que um site malicioso faça requisições para nossa API
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-2">Como funciona?</p>
                      <p className="text-sm text-gray-600 mb-2">
                        Nosso back-end só aceita requisições vindas de URLs autorizadas:
                      </p>
                      <code className="text-xs bg-gray-100 p-2 rounded block">
                        CORS_ORIGINS=https://seu-dominio.vercel.app,http://localhost:3000
                      </code>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-xs text-blue-800">
                        ✓ Se alguém tentar chamar nossa API de outro site, o navegador bloqueia
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Badge className="bg-orange-600">XSS</Badge>
                    Cross-Site Scripting
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-2">O que é?</p>
                      <p className="text-sm text-gray-600">
                        Ataque onde o hacker injeta código JavaScript malicioso na página
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-2">Como nos protegemos?</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>React escapa automaticamente todo HTML perigoso</li>
                        <li>NUNCA usamos dangerouslySetInnerHTML sem sanitizar</li>
                        <li>Validamos todos os inputs do usuário</li>
                        <li>Headers de segurança configurados (Content-Security-Policy)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Badge className="bg-red-600">CSRF</Badge>
                    Cross-Site Request Forgery
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-2">O que é?</p>
                      <p className="text-sm text-gray-600">
                        Ataque onde um site malicioso faz requisições em nome do usuário logado
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-2">Como nos protegemos?</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>Tokens JWT no header (não em cookies automáticos)</li>
                        <li>SameSite cookies para sessões</li>
                        <li>Validação de Origin e Referer no back-end</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Badge className="bg-purple-600">SQL Injection</Badge>
                    Injeção de SQL
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-2">O que é?</p>
                      <p className="text-sm text-gray-600">
                        Ataque onde o hacker manipula queries SQL através de inputs
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-2">Como nos protegemos?</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>Usamos SQLAlchemy ORM (queries parametrizadas)</li>
                        <li>NUNCA concatenamos strings direto na query</li>
                        <li>Validação de todos os inputs com Pydantic</li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-xs font-semibold text-red-900 mb-1">❌ ERRADO (vulnerável):</p>
                        <code className="text-xs break-all">
                          {`query = f"SELECT * FROM users WHERE id = {user_id}"`}
                        </code>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-xs font-semibold text-green-900 mb-1">✓ CORRETO (seguro):</p>
                        <code className="text-xs break-all">{`db.query(User).filter(User.id == user_id)`}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-6">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Checklist de Segurança
                </CardTitle>
                <CardDescription>Itens obrigatórios antes de ir para produção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Autenticação e Autorização</h3>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">
                          Microsoft Entra ID configurado com redirect URI correto
                        </span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Permissões Graph API adicionadas e consentidas</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">OTP expira em 24 horas máximo</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Máximo de tentativas de OTP limitado (5)</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Tokens e Sessões</h3>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">JWT expira em 60 minutos</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">
                          SECRET_KEY forte (mínimo 32 caracteres aleatórios)
                        </span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">SECRET_KEY diferente em DEV, HML e PRD</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">
                          Tokens enviados no header Authorization (não query string)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Proteção Web</h3>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">CORS configurado com domínios específicos</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">HTTPS obrigatório em produção</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">
                          Headers de segurança configurados (CSP, X-Frame-Options)
                        </span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Sanitização de todos os inputs do usuário</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Banco de Dados</h3>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Queries parametrizadas (ORM)</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Senhas hashadas com bcrypt (nunca plain text)</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Conexão SSL/TLS com banco de dados</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Backups automáticos configurados</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Armazenamento (S3)</h3>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Bucket S3 NÃO público (privado)</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">CloudFront configurado (não expor S3 direto)</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Presigned URLs com expiração curta (1 hora)</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Versionamento de arquivos habilitado</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Auditoria e Logs</h3>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Todas as ações importantes são logadas</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Logs incluem: usuário, data/hora, IP, ação</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Logs NÃO contêm senhas ou tokens</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Sistema de alertas para ações suspeitas</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Variáveis de Ambiente</h3>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">NUNCA commitar .env ou credenciais no Git</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Credenciais AWS com IAM policy restrita</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm text-gray-700">Rotação de chaves a cada 90 dias</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Princípio Final:</h4>
                  <p className="text-sm text-green-800">
                    "Segurança é um processo contínuo, não um projeto único. Revise este checklist regularmente e
                    mantenha-se atualizado com novas ameaças e melhores práticas."
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
