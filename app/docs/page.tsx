import { redirect } from "next/navigation"
import { AlertCircle } from "lucide-react"

export default function DocsPage() {
  const backendDocsUrl = process.env.BACKEND_DOCS_URL

  if (backendDocsUrl) {
    redirect(backendDocsUrl)
  }

  // Fallback UI quando a variável de ambiente não está configurada
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4">
        <div className="rounded-lg border bg-card p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Documentação da API
            </h1>
            <p className="text-muted-foreground">
              A URL da documentação do backend ainda não foi configurada.
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 text-left">
            <p className="text-sm font-medium text-foreground mb-2">
              Para configurar, adicione a variável de ambiente:
            </p>
            <code className="text-sm bg-slate-900 text-green-400 px-3 py-2 rounded block">
              BACKEND_DOCS_URL=https://seu-backend.com/docs
            </code>
          </div>

          <div className="pt-2 text-sm text-muted-foreground">
            <p>Após configurar, esta página redirecionará automaticamente para a documentação Swagger do backend.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
