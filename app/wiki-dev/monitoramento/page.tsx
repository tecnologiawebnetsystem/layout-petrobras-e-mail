import Link from "next/link"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Home,
  FileText,
  Cloud,
  Server,
  Info,
  BarChart3,
  TrendingUp,
  Bell,
  AlertTriangle,
  AlertCircle,
  Bug,
  Code,
  Network,
  Terminal,
} from "lucide-react"

export default function MonitoramentoPage() {
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
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Monitoramento e Logs
          </h1>
          <p className="text-lg text-muted-foreground">Como monitorar o sistema em produção e debugar problemas</p>
        </div>

        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="metricas">Métricas</TabsTrigger>
            <TabsTrigger value="alertas">Alertas</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Onde Ver os Logs do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      Front-End (Vercel)
                    </h3>
                    <ol className="text-sm space-y-2">
                      <li>1. Acesse vercel.com/dashboard</li>
                      <li>2. Selecione projeto "layout-petro-e-mail"</li>
                      <li>3. Clique em "Logs" no menu lateral</li>
                      <li>4. Filtre por erro ou warning</li>
                    </ol>
                    <pre className="bg-muted p-2 rounded text-xs mt-3 overflow-x-auto">
                      {`Exemplo de log:
[ERROR] Failed to upload file
  at uploadFile (upload.ts:45)
  Error: Network timeout`}
                    </pre>
                  </div>

                  <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Back-End (AWS/CloudWatch)
                    </h3>
                    <ol className="text-sm space-y-2">
                      <li>1. Acesse AWS Console</li>
                      <li>2. Vá em CloudWatch → Logs</li>
                      <li>3. Procure por "/aws/lambda/petrobras-api"</li>
                      <li>4. Filtre por ERROR ou CRITICAL</li>
                    </ol>
                    <pre className="bg-muted p-2 rounded text-xs mt-3 overflow-x-auto">
                      {`Exemplo de log:
[CRITICAL] Database connection failed
  postgresql://...
  Connection timeout after 30s`}
                    </pre>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Console do Navegador (Para Debug Local)</AlertTitle>
                  <AlertDescription>
                    Abra DevTools (F12) → Console para ver logs em tempo real
                    <br />
                    Procure por <code className="bg-muted px-1 rounded">[v0]</code> para ver nossos logs customizados
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Logs Mais Importantes para Monitorar</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">🔴</span>
                      <span>
                        <strong>Erros de Autenticação:</strong> Login falhando, tokens expirados
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600">🟠</span>
                      <span>
                        <strong>Falhas de Upload:</strong> Arquivos não chegando no S3
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600">🟡</span>
                      <span>
                        <strong>Emails não enviados:</strong> Microsoft Graph API falhando
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">🔵</span>
                      <span>
                        <strong>Banco de dados:</strong> Queries lentas, timeouts
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metricas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Métricas Importantes
                </CardTitle>
                <CardDescription>O que monitorar para garantir saúde do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                    <h3 className="font-semibold text-lg mb-2">Performance</h3>
                    <ul className="space-y-2 text-sm">
                      <li>⏱️ Tempo de carregamento páginas</li>
                      <li>⏱️ Tempo de resposta API</li>
                      <li>⏱️ Tempo de upload de arquivos</li>
                      <li>🎯 Meta: &lt; 3 segundos</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                    <h3 className="font-semibold text-lg mb-2">Uso</h3>
                    <ul className="space-y-2 text-sm">
                      <li>👥 Usuários ativos por dia</li>
                      <li>📤 Total de uploads</li>
                      <li>📥 Total de downloads</li>
                      <li>✅ Taxa de aprovação</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                    <h3 className="font-semibold text-lg mb-2">Erros</h3>
                    <ul className="space-y-2 text-sm">
                      <li>❌ Taxa de erro (%)</li>
                      <li>❌ Falhas de login</li>
                      <li>❌ Falhas de upload</li>
                      <li>🎯 Meta: &lt; 1% de erro</li>
                    </ul>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Dashboard de Métricas</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Acesse o dashboard interno para ver métricas em tempo real:
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm font-mono">🔗 https://layout-petro-e-mail.vercel.app/dashboard</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">* Requer login como administrador</p>
                </div>

                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertTitle>Métricas Críticas</AlertTitle>
                  <AlertDescription>
                    Se qualquer uma dessas métricas ficar fora do normal, investigate:
                    <br />• Taxa de erro &gt; 5%
                    <br />• Tempo de resposta &gt; 5 segundos
                    <br />• Uploads falhando &gt; 10% do total
                    <br />• Usuários não conseguem logar
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alertas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  Sistema de Alertas
                </CardTitle>
                <CardDescription>Notificações automáticas quando algo der errado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Alertas são configurados no Vercel e AWS CloudWatch para notificar a equipe automaticamente
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                    <h3 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Alertas Críticos (Urgente)
                    </h3>
                    <ul className="text-sm space-y-1">
                      <li>🚨 Sistema fora do ar</li>
                      <li>🚨 Banco de dados inacessível</li>
                      <li>🚨 Taxa de erro &gt; 10%</li>
                      <li>🚨 Todos os usuários não conseguem logar</li>
                    </ul>
                    <p className="text-xs mt-2 font-medium">→ Notifica: Email + Slack + SMS</p>
                  </div>

                  <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950/20">
                    <h3 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Alertas de Aviso (Importante)
                    </h3>
                    <ul className="text-sm space-y-1">
                      <li>⚠️ Tempo de resposta lento (&gt; 5s)</li>
                      <li>⚠️ Taxa de erro entre 5-10%</li>
                      <li>⚠️ Uso de disco &gt; 80%</li>
                      <li>⚠️ Emails falhando</li>
                    </ul>
                    <p className="text-xs mt-2 font-medium">→ Notifica: Email + Slack</p>
                  </div>

                  <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                    <h3 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Alertas Informativos
                    </h3>
                    <ul className="text-sm space-y-1">
                      <li>ℹ️ Deploy bem-sucedido</li>
                      <li>ℹ️ Backup automático concluído</li>
                      <li>ℹ️ Migration executada</li>
                      <li>ℹ️ Relatório diário de uso</li>
                    </ul>
                    <p className="text-xs mt-2 font-medium">→ Notifica: Email</p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Como Configurar Alertas</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    1. Acesse Vercel → Settings → Notifications
                    <br />
                    2. Configure integração com Slack
                    <br />
                    3. Defina thresholds (limites) para cada métrica
                    <br />
                    4. Adicione emails da equipe para receber notificações
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debug" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5 text-purple-600" />
                  Como Ativar Modo Debug
                </CardTitle>
                <CardDescription>Ferramentas para investigar problemas em produção</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>CUIDADO em Produção!</AlertTitle>
                  <AlertDescription>
                    Modo debug expõe informações sensíveis. Use APENAS temporariamente e desative depois.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Ativar Debug no Front-End</h4>
                    <p className="text-sm text-muted-foreground mb-2">Adicione esta variável de ambiente no Vercel:</p>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">{`NEXT_PUBLIC_DEBUG=true`}</pre>
                    <p className="text-xs text-muted-foreground mt-2">Isso ativa console.logs detalhados em produção</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Ativar Debug no Back-End</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`LOG_LEVEL=DEBUG
DEBUG=True`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Ver Logs em Tempo Real (Local)</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`# Front-end (Next.js)
npm run dev

# Back-end (FastAPI)
cd back-end/python
uvicorn app.main:app --reload --log-level debug`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Ferramentas de Debug</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Code className="h-4 w-4 mt-0.5" />
                        <div>
                          <strong>React DevTools:</strong> Inspecionar componentes e estado
                          <br />
                          <span className="text-xs text-muted-foreground">Chrome Extension</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Network className="h-4 w-4 mt-0.5" />
                        <div>
                          <strong>Network Tab:</strong> Ver requisições HTTP
                          <br />
                          <span className="text-xs text-muted-foreground">DevTools → Network (F12)</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Terminal className="h-4 w-4 mt-0.5" />
                        <div>
                          <strong>Console:</strong> Ver erros JavaScript
                          <br />
                          <span className="text-xs text-muted-foreground">DevTools → Console (F12)</span>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-950/20">
                    <h4 className="font-semibold mb-2">Checklist de Debug</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Reproduza o erro localmente</li>
                      <li>Verifique logs do Console (F12)</li>
                      <li>Verifique Network tab (requisições falhando?)</li>
                      <li>Verifique logs do Vercel</li>
                      <li>Verifique logs do Back-End (CloudWatch)</li>
                      <li>Verifique banco de dados (dados corretos?)</li>
                      <li>Ative modo debug temporariamente</li>
                      <li>Corrija o problema</li>
                      <li>DESATIVE modo debug</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
