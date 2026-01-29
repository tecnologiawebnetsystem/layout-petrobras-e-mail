import Link from "next/link"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Home, Layers, Code, TestTube, Rocket, AlertTriangle, Info, CheckCircle } from "lucide-react"
import { Alert } from "@/components/ui/alert"

export default function DeployAmbientesPage() {
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
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Deploy e Ambientes
          </h1>
          <p className="text-lg text-muted-foreground">Como fazer deploy do sistema em DEV, HML e Produção</p>
        </div>

        <Tabs defaultValue="ambientes" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="ambientes">Ambientes</TabsTrigger>
            <TabsTrigger value="deploy">Como Fazer Deploy</TabsTrigger>
            <TabsTrigger value="checklist">Checklist PRD</TabsTrigger>
            <TabsTrigger value="rollback">Rollback</TabsTrigger>
          </TabsList>

          <TabsContent value="ambientes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-600" />
                  Três Ambientes do Sistema
                </CardTitle>
                <CardDescription>Diferenças entre DEV, HML e Produção</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      DEV (Desenvolvimento)
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>✅ Para testar novas features</li>
                      <li>✅ Pode quebrar sem problema</li>
                      <li>✅ Dados fake/mock</li>
                      <li>✅ Logs de debug ativos</li>
                      <li>🌐 URL: layout-petro-dev.vercel.app</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950/20">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <TestTube className="h-4 w-4" />
                      HML (Homologação)
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>✅ Ambiente de testes</li>
                      <li>✅ Dados similares à produção</li>
                      <li>✅ Validação antes de PRD</li>
                      <li>✅ Cliente testa aqui</li>
                      <li>🌐 URL: layout-petro-hml.vercel.app</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Rocket className="h-4 w-4" />
                      PRD (Produção)
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>✅ Ambiente REAL</li>
                      <li>✅ Usuários finais usam</li>
                      <li>✅ Dados reais (cuidado!)</li>
                      <li>✅ Monitoramento 24/7</li>
                      <li>🌐 URL: layout-petro-e-mail.vercel.app</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  Regra de Ouro
                  <p className="text-sm text-muted-foreground">
                    NUNCA faça deploy direto em produção! Sempre siga o fluxo: DEV → HML → PRD
                  </p>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deploy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Passo a Passo para Deploy</CardTitle>
                <CardDescription>Como subir suas alterações para cada ambiente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">Commit suas alterações no Git</h4>
                      <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                        {`git add .
git commit -m "feat: adiciona validação de email"
git push origin main`}
                      </pre>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">Vercel faz deploy automático</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        O Vercel detecta o push e inicia o deploy automaticamente
                      </p>
                      <Alert>
                        <Info className="h-4 w-4" />
                        <p className="text-sm text-muted-foreground">
                          Branch <code className="bg-muted px-1 rounded">main</code> → Deploy em PRD
                          <br />
                          Branch <code className="bg-muted px-1 rounded">develop</code> → Deploy em DEV
                          <br />
                          Branch <code className="bg-muted px-1 rounded">homolog</code> → Deploy em HML
                        </p>
                      </Alert>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">Aguarde o build completar</h4>
                      <p className="text-sm text-muted-foreground">
                        Tempo médio: 2-3 minutos
                        <br />
                        Você receberá um email quando terminar
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center font-bold text-green-600 dark:text-green-400">
                      4
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">Teste o ambiente</h4>
                      <p className="text-sm text-muted-foreground">
                        Acesse a URL do ambiente e teste se está funcionando
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Checklist Antes de Deploy em Produção
                </CardTitle>
                <CardDescription>Verifique tudo antes de subir para PRD</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold mb-2">Testes</h4>
                    <ul className="space-y-1 text-sm">
                      <li>☐ Testei login com Entra ID</li>
                      <li>☐ Testei upload de arquivo</li>
                      <li>☐ Testei aprovação de supervisor</li>
                      <li>☐ Testei download de arquivo externo</li>
                      <li>☐ Testei OTP de email</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <h4 className="font-semibold mb-2">Configurações</h4>
                    <ul className="space-y-1 text-sm">
                      <li>☐ Variáveis de ambiente PRD configuradas</li>
                      <li>☐ Permissões Azure AD corretas</li>
                      <li>☐ Banco de dados PRD conectado</li>
                      <li>☐ S3 Bucket PRD configurado</li>
                      <li>☐ CloudFront PRD ativo</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4 py-2">
                    <h4 className="font-semibold mb-2">Segurança</h4>
                    <ul className="space-y-1 text-sm">
                      <li>☐ Removi console.logs de debug</li>
                      <li>☐ Sem dados sensíveis no código</li>
                      <li>☐ CORS configurado corretamente</li>
                      <li>☐ Rate limiting ativo</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-red-500 pl-4 py-2">
                    <h4 className="font-semibold mb-2">Comunicação</h4>
                    <ul className="space-y-1 text-sm">
                      <li>☐ Avisei a equipe sobre o deploy</li>
                      <li>☐ Documentei as mudanças</li>
                      <li>☐ Preparei plano de rollback</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rollback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Como Fazer Rollback (Voltar Versão)
                </CardTitle>
                <CardDescription>Se algo der errado em produção, volte para versão anterior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm text-muted-foreground">
                    Quando fazer rollback?
                    <br />- Sistema está fora do ar
                    <br />- Erro crítico que afeta usuários
                    <br />- Login não funciona
                    <br />- Perda de dados
                  </p>
                </Alert>

                <div className="space-y-3">
                  <h4 className="font-semibold">Opção 1: Rollback via Vercel (Mais Rápido)</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Acesse vercel.com/dashboard</li>
                    <li>Selecione o projeto "layout-petro-e-mail"</li>
                    <li>Clique na aba "Deployments"</li>
                    <li>Encontre o deploy anterior que estava funcionando</li>
                    <li>Clique nos 3 pontinhos → "Promote to Production"</li>
                    <li>Confirme e aguarde 1 minuto</li>
                  </ol>

                  <h4 className="font-semibold mt-4">Opção 2: Rollback via Git</h4>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                    {`# Veja os últimos commits
git log --oneline

# Volte para o commit anterior (substitua abc123)
git revert abc123

# Suba a reversão
git push origin main`}
                  </pre>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <p className="text-sm text-muted-foreground">
                      Após o Rollback
                      <br />
                      1. Teste se o sistema voltou a funcionar
                      <br />
                      2. Avise a equipe
                      <br />
                      3. Investigue o que deu errado
                      <br />
                      4. Corrija em DEV antes de tentar PRD novamente
                    </p>
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
