/**
 * instrumentation.ts – Hook de startup do Next.js (Node.js runtime).
 *
 * Executado UMA VEZ antes do servidor processar qualquer request.
 * AWS config loader foi removido - configurações são gerenciadas via variáveis de ambiente Vercel.
 */
export async function register() {
  // Hook de instrumentação - pode ser usado para inicialização futura
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  
  console.info("[instrumentation] Next.js server starting...")
}
