/**
 * Leitura segura de variáveis de ambiente públicas (NEXT_PUBLIC_*)
 *
 * Problema: em Client Components ("use client"), o Next.js substitui
 * `process.env.NEXT_PUBLIC_*` com valores ESTÁTICOS no momento do build.
 * Se o pipeline não passar --build-arg com os valores corretos (ex: d9i3-templates
 * não passa build-args por padrão), os valores ficam como string vazia no bundle.
 *
 * Solução: o Server Component layout.tsx injeta os valores reais do servidor
 * (lidos do process.env em runtime, populado pelo ECS Task Definition via SSM/Secrets Manager)
 * em `window.__ENV__` via <script> no <head>.
 *
 * Esta função lê de `window.__ENV__` no cliente, e de `process.env` no servidor.
 *
 * Fluxo em produção (ECS):
 *   1. CDK lê SSM /APP/frontend-dsv/ e o pointer /APP/frontend-dsv/SECRETS_MANAGER/backend_dsv_secret
 *   2. ECS Task Definition injeta os valores (NEXT_PUBLIC_* do SSM + ENTRA_* da secret)
 *      no processo Node.js como variáveis de ambiente
 *   3. layout.tsx (Server Component) lê process.env e mapeia ENTRA_* -> NEXT_PUBLIC_*,
 *      depois injeta window.__ENV__ via <script> no <head>
 *   4. Cliente carrega HTML -> window.__ENV__ já definido antes do bundle React
 *   5. getClientEnv() lê window.__ENV__ -> valores corretos disponíveis nos Client Components
 */

export type PublicEnvKey =
  | "NEXT_PUBLIC_AUTH_MODE"
  | "NEXT_PUBLIC_ENTRA_CLIENT_ID"
  | "NEXT_PUBLIC_ENTRA_TENANT_ID"
  | "NEXT_PUBLIC_ENTRA_REDIRECT_URI"
  | "NEXT_PUBLIC_APP_URL"

/**
 * Retorna o valor de uma variável pública de ambiente.
 * - No servidor (SSR/RSC): lê de `process.env` diretamente (valor injetado pelo ECS em runtime).
 * - No cliente: lê de `window.__ENV__` (injetado pelo layout.tsx via <script> no <head>).
 */
export function getClientEnv(key: PublicEnvKey): string {
  if (typeof window !== "undefined") {
    return (window as Window & { __ENV__?: Record<string, string> }).__ENV__?.[key] ?? ""
  }
  return process.env[key] ?? ""
}
