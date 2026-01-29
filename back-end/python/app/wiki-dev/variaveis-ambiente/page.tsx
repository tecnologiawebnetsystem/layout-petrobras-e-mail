import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, Server, Globe, Database, Lock, Mail } from "lucide-react"
import Link from "next/link"

export default function VariaveisAmbientePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
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
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
              <Server className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Variáveis de Ambiente
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Todas as variáveis necessárias para o sistema funcionar. Copie e cole!
          </p>
        </div>

        <Tabs defaultValue="front" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="front" className="text-sm">
              Front-End (Vercel)
            </TabsTrigger>
            <TabsTrigger value="back" className="text-sm">
              Back-End (Python)
            </TabsTrigger>
            <TabsTrigger value="local" className="text-sm">
              Ambiente Local
            </TabsTrigger>
          </TabsList>

          <TabsContent value="front" className="space-y-6">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Variáveis do Front-End (Next.js)
                </CardTitle>
                <CardDescription>
                  Configure estas no painel do Vercel em Settings → Environment Variables
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-purple-600" />
                        <h3 className="font-semibold text-lg">Microsoft Entra ID (SSO)</h3>
                      </div>
                      <Badge variant="outline" className="bg-purple-100 text-purple-700">
                        Obrigatório
                      </Badge>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">NEXT_PUBLIC_ENTRA_TENANT_ID</p>
                        <p className="text-xs text-gray-500 mb-2">ID do inquilino (tenant) do Azure AD da Petrobras</p>
                        <code className="text-xs bg-white p-2 rounded border block">
                          xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                        </code>
                      </div>

                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">NEXT_PUBLIC_ENTRA_CLIENT_ID</p>
                        <p className="text-xs text-gray-500 mb-2">ID da aplicação registrada no Azure AD</p>
                        <code className="text-xs bg-white p-2 rounded border block">
                          xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                        </code>
                      </div>

                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">NEXT_PUBLIC_ENTRA_REDIRECT_URI</p>
                        <p className="text-xs text-gray-500 mb-2">URL de callback após login</p>
                        <code className="text-xs bg-white p-2 rounded border block">
                          https://seu-dominio.vercel.app
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-green-600" />
                        <h3 className="font-semibold text-lg">API Back-End</h3>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        Obrigatório
                      </Badge>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">NEXT_PUBLIC_API_URL</p>
                        <p className="text-xs text-gray-500 mb-2">URL do back-end Python (FastAPI)</p>
                        <code className="text-xs bg-white p-2 rounded border block">https://api.seu-backend.com</code>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-orange-600" />
                        <h3 className="font-semibold text-lg">Desenvolvimento (Opcional)</h3>
                      </div>
                      <Badge variant="outline" className="bg-orange-100 text-orange-700">
                        Desenvolvimento
                      </Badge>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL</p>
                        <p className="text-xs text-gray-500 mb-2">URL de redirect para desenvolvimento local</p>
                        <code className="text-xs bg-white p-2 rounded border block">http://localhost:3000</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">Dica Importante!</h4>
                  <p className="text-sm text-amber-800">
                    Variáveis que começam com <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_</code> são
                    expostas no navegador. NUNCA coloque chaves secretas com esse prefixo!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="back" className="space-y-6">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-green-600" />
                  Variáveis do Back-End (Python/FastAPI)
                </CardTitle>
                <CardDescription>
                  Configure estas no servidor onde o back-end está rodando (AWS, Railway, etc)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-600" />
                        <h3 className="font-semibold text-lg">Banco de Dados (PostgreSQL)</h3>
                      </div>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700">
                        Obrigatório
                      </Badge>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">DATABASE_URL</p>
                        <p className="text-xs text-gray-500 mb-2">String de conexão completa do PostgreSQL</p>
                        <code className="text-xs bg-white p-2 rounded border block break-all">
                          postgresql://user:password@host:5432/dbname
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-red-600" />
                        <h3 className="font-semibold text-lg">Segurança (JWT)</h3>
                      </div>
                      <Badge variant="outline" className="bg-red-100 text-red-700">
                        Obrigatório
                      </Badge>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">SECRET_KEY</p>
                        <p className="text-xs text-gray-500 mb-2">
                          Chave secreta para assinar tokens JWT (mínimo 32 caracteres)
                        </p>
                        <code className="text-xs bg-white p-2 rounded border block break-all">
                          sua-chave-super-secreta-aqui-minimo-32-chars
                        </code>
                        <p className="text-xs text-amber-600 mt-2">
                          ⚠️ Gere uma chave aleatória forte! Nunca use a mesma em DEV e PRD
                        </p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">ALGORITHM</p>
                        <p className="text-xs text-gray-500 mb-2">Algoritmo de criptografia JWT</p>
                        <code className="text-xs bg-white p-2 rounded border block">HS256</code>
                      </div>

                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">ACCESS_TOKEN_EXPIRE_MINUTES</p>
                        <p className="text-xs text-gray-500 mb-2">Tempo de expiração do token em minutos</p>
                        <code className="text-xs bg-white p-2 rounded border block">60</code>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-purple-600" />
                        <h3 className="font-semibold text-lg">AWS S3 (Armazenamento)</h3>
                      </div>
                      <Badge variant="outline" className="bg-purple-100 text-purple-700">
                        Obrigatório
                      </Badge>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">AWS_ACCESS_KEY_ID</p>
                        <p className="text-xs text-gray-500 mb-2">Chave de acesso da AWS</p>
                        <code className="text-xs bg-white p-2 rounded border block">AKIAIOSFODNN7EXAMPLE</code>
                      </div>

                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">AWS_SECRET_ACCESS_KEY</p>
                        <p className="text-xs text-gray-500 mb-2">Chave secreta da AWS</p>
                        <code className="text-xs bg-white p-2 rounded border block break-all">
                          wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
                        </code>
                      </div>

                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">AWS_BUCKET_NAME</p>
                        <p className="text-xs text-gray-500 mb-2">Nome do bucket S3</p>
                        <code className="text-xs bg-white p-2 rounded border block">
                          petrobras-arquivos-compartilhados
                        </code>
                      </div>

                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">AWS_REGION</p>
                        <p className="text-xs text-gray-500 mb-2">Região do S3</p>
                        <code className="text-xs bg-white p-2 rounded border block">us-east-1</code>
                      </div>

                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">CLOUDFRONT_URL</p>
                        <p className="text-xs text-gray-500 mb-2">URL do CloudFront para servir arquivos</p>
                        <code className="text-xs bg-white p-2 rounded border block">
                          https://d111111abcdef8.cloudfront.net
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-orange-600" />
                        <h3 className="font-semibold text-lg">Outros</h3>
                      </div>
                      <Badge variant="outline" className="bg-gray-100 text-gray-700">
                        Opcional
                      </Badge>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm font-mono text-gray-600 mb-1">CORS_ORIGINS</p>
                        <p className="text-xs text-gray-500 mb-2">
                          URLs permitidas para fazer requisições (separadas por vírgula)
                        </p>
                        <code className="text-xs bg-white p-2 rounded border block break-all">
                          https://seu-dominio.vercel.app,http://localhost:3000
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="local" className="space-y-6">
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-amber-600" />
                  Configuração Local (Desenvolvimento)
                </CardTitle>
                <CardDescription>Como configurar o ambiente local para desenvolvimento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-white border rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Passo 1: Criar arquivo .env.local (Front-End)</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Crie um arquivo <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> na raiz do projeto
                    Next.js:
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`# Microsoft Entra ID (SSO)
NEXT_PUBLIC_ENTRA_TENANT_ID=seu-tenant-id-aqui
NEXT_PUBLIC_ENTRA_CLIENT_ID=seu-client-id-aqui
NEXT_PUBLIC_ENTRA_REDIRECT_URI=http://localhost:3000

# Back-End API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Desenvolvimento
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000`}</pre>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Passo 2: Criar arquivo .env (Back-End Python)</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Crie um arquivo <code className="bg-gray-100 px-2 py-1 rounded">.env</code> na pasta
                    back-end/python:
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/petrobras_dev

# Segurança JWT
SECRET_KEY=chave-super-secreta-desenvolvimento-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# AWS S3
AWS_ACCESS_KEY_ID=sua-key-aqui
AWS_SECRET_ACCESS_KEY=sua-secret-aqui
AWS_BUCKET_NAME=petrobras-dev-bucket
AWS_REGION=us-east-1
CLOUDFRONT_URL=https://seu-cloudfront.cloudfront.net

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`}</pre>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Dica Pro!</h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Adicione os arquivos <code className="bg-blue-100 px-1 rounded">.env.local</code> e{" "}
                    <code className="bg-blue-100 px-1 rounded">.env</code> no{" "}
                    <code className="bg-blue-100 px-1 rounded">.gitignore</code> para não commitar credenciais!
                  </p>
                  <code className="text-xs bg-white p-2 rounded border block mt-2">
                    .env{"\n"}
                    .env.local{"\n"}
                    .env.*.local
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
