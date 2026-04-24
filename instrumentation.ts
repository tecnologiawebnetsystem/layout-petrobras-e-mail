/**
 * instrumentation.ts – Hook de startup do Next.js (Node.js runtime).
 *
 * Executado UMA VEZ antes do servidor processar qualquer request.
 * Chama aws-loader para popular process.env com valores do SSM e Secrets Manager,
 * exatamente como o aws_loader.py faz no backend FastAPI.
 *
 * Ativação: USE_AWS_CONFIG=true (via docker run --env-file ou ECS Task Definition)
 * Sem essa variável, esta função retorna imediatamente — inofensiva em dev local.
 */
export async function register() {
  // Roda apenas no runtime Node.js (não no Edge Runtime)
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const { loadAwsConfig } = await import("./lib/aws-loader")
  await loadAwsConfig()
}
