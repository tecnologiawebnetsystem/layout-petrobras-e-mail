import { EnvDiagnosticoClient } from "./client"
import { BackendParametersPanel } from "./backend-panel"

/**
 * Página de diagnóstico de variáveis de ambiente
 *
 * Server Component: lê process.env em runtime (valores reais do ECS/SSM).
 * O Client Component exibe os valores de window.__ENV__ (lado do browser).
 * BackendParametersPanel busca /api/v1/diagnostico/parameters via BFF.
 */
export default function EnvDiagnosticoPage() {
  // Lidos aqui no SERVER em runtime — o que o processo Node.js enxerga
  const serverEnv = {
    // SSM /APP/frontend-dsv/ — ou .env local
    NEXT_PUBLIC_APP_URL:    process.env.NEXT_PUBLIC_APP_URL    ?? "(ausente)",
    NEXT_PUBLIC_AUTH_MODE:  process.env.NEXT_PUBLIC_AUTH_MODE  ?? "(ausente)",
    BACKEND_URL:            process.env.BACKEND_URL            ?? "(ausente)",
    DATABASE_URL:           process.env.DATABASE_URL           ? "***definido***" : "(ausente)",
    // Entra ID: no ECS vem como ENTRA_* (da secret); no .env local vem como NEXT_PUBLIC_ENTRA_*
    "ENTRA_CLIENT_ID (ou NEXT_PUBLIC_ENTRA_CLIENT_ID)":
      process.env.ENTRA_CLIENT_ID || process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID || "(ausente)",
    "ENTRA_TENANT_ID (ou NEXT_PUBLIC_ENTRA_TENANT_ID)":
      process.env.ENTRA_TENANT_ID || process.env.NEXT_PUBLIC_ENTRA_TENANT_ID || "(ausente)",
    "ENTRA_REDIRECT_URI (ou NEXT_PUBLIC_ENTRA_REDIRECT_URI)":
      process.env.ENTRA_REDIRECT_URI || process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI || "(ausente — será derivado de APP_URL)",
    ENTRA_CLIENT_SECRET:
      process.env.ENTRA_CLIENT_SECRET ? "***definido***" : "(ausente — só obrigatório no backend)",
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Diagnóstico de Variáveis de Ambiente</h1>
        <p className="text-sm text-muted-foreground">
          Servidor vs. Cliente — compara o que o Node.js enxerga com o que o browser recebe via{" "}
          <code className="bg-muted px-1 rounded">window.__ENV__</code>
        </p>
      </div>

      {/* Lado servidor */}
      <section className="border rounded-lg overflow-hidden">
        <div className="bg-blue-50 border-b px-4 py-3">
          <h2 className="font-semibold text-blue-800">🖥️ SERVER — process.env (runtime Node.js)</h2>
          <p className="text-xs text-blue-600 mt-0.5">
            Valores injetados pelo ECS Task Definition (SSM + Secrets Manager). Se aparecer "(ausente)", a variável não chegou ao container.
          </p>
        </div>
        <div className="divide-y">
          {Object.entries(serverEnv).map(([key, value]) => (
            <EnvRow key={key} name={key} value={value} side="server" />
          ))}
        </div>
      </section>

      {/* Lado cliente — lido via window.__ENV__ pelo browser */}
      <EnvDiagnosticoClient />

      {/* Backend — variáveis carregadas pelo FastAPI (SSM/Secrets Manager) */}
      <BackendParametersPanel />

      <div className="text-xs text-muted-foreground border rounded p-4 bg-muted/30 space-y-1">
        <p><strong>Como interpretar:</strong></p>
        <p>• Server e Client devem mostrar os mesmos valores para <code>NEXT_PUBLIC_*</code>.</p>
        <p>• <code>BACKEND_URL</code> e <code>DATABASE_URL</code> aparecem apenas no servidor (nunca no browser).</p>
        <p>• <code>ENTRA_CLIENT_SECRET</code> deve aparecer apenas como <strong>***definido***</strong> — nunca o valor real.</p>
        <p>• Se o Client mostrar vazio e o Server mostrar o valor, o <code>layout.tsx</code> não está injetando corretamente.</p>
        <p className="pt-2 font-semibold">Diferença entre ambientes:</p>
        <p>• <strong>Local (.env):</strong> Entra ID usa <code>NEXT_PUBLIC_ENTRA_*</code></p>
        <p>• <strong>ECS (AWS):</strong> Entra ID chega como <code>ENTRA_*</code> (sem prefixo) via secret — <code>layout.tsx</code> faz o mapeamento para <code>NEXT_PUBLIC_*</code></p>
      </div>
    </div>
  )
}

function EnvRow({ name, value, side }: { name: string; value: string; side: "server" | "client" }) {
  const isSecret = value === "***definido***"
  const isAbsent = value.startsWith("(ausente")
  const isDerived = value.includes("será derivado")

  let valueClass = "text-green-700 font-mono"
  if (isSecret) valueClass = "text-purple-700 font-mono"
  if (isAbsent) valueClass = "text-red-500 font-mono italic"
  if (isDerived) valueClass = "text-yellow-700 font-mono italic"

  return (
    <div className="flex items-start gap-4 px-4 py-2.5 hover:bg-muted/30">
      <code className="text-xs text-gray-600 w-72 shrink-0 pt-0.5">{name}</code>
      <span className={`text-xs break-all ${valueClass}`}>{value}</span>
    </div>
  )
}
