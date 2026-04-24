"use client"

import { getClientEnv } from "@/lib/env"

/**
 * Client Component: lê window.__ENV__ (injetado pelo layout.tsx).
 * Mostra o que o browser realmente enxerga após o layout injetar o script.
 */
export function EnvDiagnosticoClient() {
  const clientEnv = {
    NEXT_PUBLIC_APP_URL: getClientEnv("NEXT_PUBLIC_APP_URL") || "(ausente)",
    NEXT_PUBLIC_AUTH_MODE: getClientEnv("NEXT_PUBLIC_AUTH_MODE") || "(ausente)",
    NEXT_PUBLIC_ENTRA_CLIENT_ID: getClientEnv("NEXT_PUBLIC_ENTRA_CLIENT_ID") || "(ausente)",
    NEXT_PUBLIC_ENTRA_TENANT_ID: getClientEnv("NEXT_PUBLIC_ENTRA_TENANT_ID") || "(ausente)",
    NEXT_PUBLIC_ENTRA_REDIRECT_URI: getClientEnv("NEXT_PUBLIC_ENTRA_REDIRECT_URI") || "(ausente)",
  }

  return (
    <section className="border rounded-lg overflow-hidden">
      <div className="bg-green-50 border-b px-4 py-3">
        <h2 className="font-semibold text-green-800">🌐 CLIENT — window.__ENV__ (browser)</h2>
        <p className="text-xs text-green-600 mt-0.5">
          Valores injetados pelo <code>layout.tsx</code> via{" "}
          <code className="bg-white px-1 rounded">{`<script>window.__ENV__ = {...}</script>`}</code>. Lidos pelo{" "}
          <code>getClientEnv()</code>.
        </p>
      </div>
      <div className="divide-y">
        {Object.entries(clientEnv).map(([key, value]) => {
          const isAbsent = value.startsWith("(ausente")
          return (
            <div key={key} className="flex items-start gap-4 px-4 py-2.5 hover:bg-muted/30">
              <code className="text-xs text-gray-600 w-72 shrink-0 pt-0.5">{key}</code>
              <span className={`text-xs break-all font-mono ${isAbsent ? "text-red-500 italic" : "text-green-700"}`}>
                {value}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
