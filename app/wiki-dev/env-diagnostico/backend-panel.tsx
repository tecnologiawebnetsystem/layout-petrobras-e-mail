"use client"

import { useEffect, useState } from "react"

interface BackendParams {
  ambiente?: Record<string, string>
  banco_de_dados?: Record<string, string>
  armazenamento?: Record<string, string>
  autenticacao?: Record<string, string>
  email?: Record<string, string>
  variaveis_brutas?: Record<string, string>
}

function StatusRow({ name, value }: { name: string; value: string }) {
  const isSecret  = value === "***definido***" || value === "***mascarado***"
  const isAbsent  = value === "(ausente)"

  let cls = "text-green-700 font-mono"
  if (isSecret) cls = "text-purple-700 font-mono"
  if (isAbsent) cls = "text-red-500 font-mono italic"

  return (
    <div className="flex items-start gap-4 px-4 py-2 hover:bg-muted/30">
      <code className="text-xs text-gray-600 w-72 shrink-0 pt-0.5">{name}</code>
      <span className={`text-xs break-all ${cls}`}>{value}</span>
    </div>
  )
}

function Section({ title, data }: { title: string; data: Record<string, string> }) {
  return (
    <div>
      <p className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-muted/40 border-b">
        {title}
      </p>
      <div className="divide-y">
        {Object.entries(data).map(([k, v]) => (
          <StatusRow key={k} name={k} value={v} />
        ))}
      </div>
    </div>
  )
}

export function BackendParametersPanel() {
  const [data, setData]     = useState<BackendParams | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/diagnostico/parameters")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<BackendParams>
      })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="border rounded-lg overflow-hidden">
      <div className="bg-orange-50 border-b px-4 py-3">
        <h2 className="font-semibold text-orange-800">⚙️ BACKEND — variáveis carregadas pelo FastAPI</h2>
        <p className="text-xs text-orange-600 mt-0.5">
          Retornado por <code className="bg-white px-1 rounded">GET /api/v1/diagnostico/parameters</code>.
          Confirma se o SSM / Secrets Manager foi carregado no container backend.
        </p>
      </div>

      {loading && (
        <p className="px-4 py-4 text-sm text-muted-foreground">Carregando...</p>
      )}

      {error && (
        <p className="px-4 py-4 text-sm text-red-500">
          Erro ao buscar parâmetros do backend: <code>{error}</code>
          <br />
          <span className="text-xs text-muted-foreground">
            Verifique se o backend está acessível via BACKEND_URL no container frontend.
          </span>
        </p>
      )}

      {data && !loading && (
        <div className="divide-y">
          {data.ambiente       && <Section title="Ambiente"         data={data.ambiente} />}
          {data.banco_de_dados && <Section title="Banco de Dados"   data={data.banco_de_dados} />}
          {data.armazenamento  && <Section title="Armazenamento"    data={data.armazenamento} />}
          {data.autenticacao   && <Section title="Autenticação"     data={data.autenticacao} />}
          {data.email          && <Section title="Email"            data={data.email} />}
          {data.variaveis_brutas && (
            <Section title="Variáveis brutas (prefixos conhecidos)" data={data.variaveis_brutas} />
          )}
        </div>
      )}
    </section>
  )
}
