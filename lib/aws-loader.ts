/**
 * aws-loader.ts – Carrega variáveis do AWS Parameter Store e Secrets Manager
 * para process.env ANTES de qualquer request ser processado.
 *
 * Espelho do csa-backend/app/core/aws_loader.py para o frontend Next.js.
 * Chamado pelo instrumentation.ts (hook de startup do Next.js).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Ativação (docker run / ECS Task Definition)
 * ─────────────────────────────────────────────────────────────────────────────
 *   USE_AWS_CONFIG=true          → ativa este módulo
 *   CDK_APP_SERVICE_NAME=frontend → nome do módulo CDK (padrão: "frontend")
 *   APP_ENV=dsv|tst|trn|hmg|prd  → sufixo do path SSM (padrão: dsv)
 *   AWS_REGION=sa-east-1
 *   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Paths SSM lidos (CdkAppServiceName=frontend, APP_ENV=dsv)
 * ─────────────────────────────────────────────────────────────────────────────
 *   /APP/frontend-dsv/BACKEND_URL
 *   /APP/frontend-dsv/NEXT_PUBLIC_APP_URL
 *   /APP/frontend-dsv/NEXT_PUBLIC_AUTH_MODE
 *   /APP/frontend-dsv/DATABASE_URL
 *   /APP/frontend-dsv/SECRETS_MANAGER/backend_dsv_secret  → ponteiro
 *
 * Secret backend_dsv_secret → { ENTRA_CLIENT_ID, ENTRA_TENANT_ID, ... }
 * O layout.tsx mapeia ENTRA_* → NEXT_PUBLIC_ENTRA_* em runtime (já existente).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Precedência (maior → menor)
 * ─────────────────────────────────────────────────────────────────────────────
 *   1. Env var já presente (docker run -e / ECS Task Definition)
 *   2. Secrets Manager (via ponteiro SSM)
 *   3. Parameter Store
 */

const appEnv        = (process.env.APP_ENV ?? "dsv").toLowerCase()
const serviceName   = process.env.CDK_APP_SERVICE_NAME ?? "frontend"
const envSuffix     = appEnv !== "prd" ? `-${appEnv}` : ""
const ssmPath       = `/APP/${serviceName}${envSuffix}/`
const secretsPrefix = `${ssmPath}SECRETS_MANAGER/`

function setIfMissing(key: string, value: string): void {
  if (!(key in process.env)) {
    process.env[key] = value
  }
}

async function loadParameterStore(
  ssm: import("@aws-sdk/client-ssm").SSMClient,
): Promise<void> {
  const { GetParametersByPathCommand } = await import("@aws-sdk/client-ssm")

  let nextToken: string | undefined
  do {
    const resp = await ssm.send(
      new GetParametersByPathCommand({
        Path:            ssmPath,
        Recursive:       false,
        WithDecryption:  true,
        NextToken:       nextToken,
      }),
    )
    for (const param of resp.Parameters ?? []) {
      const key = param.Name!.replace(ssmPath, "").toUpperCase()
      if (!key.startsWith("SECRETS_MANAGER/") && param.Value) {
        setIfMissing(key, param.Value)
      }
    }
    nextToken = resp.NextToken
  } while (nextToken)
}

async function loadSecretsViaPointers(
  ssm: import("@aws-sdk/client-ssm").SSMClient,
  sm:  import("@aws-sdk/client-secrets-manager").SecretsManagerClient,
): Promise<void> {
  const { GetParametersByPathCommand } = await import("@aws-sdk/client-ssm")
  const { GetSecretValueCommand }      = await import("@aws-sdk/client-secrets-manager")

  let nextToken: string | undefined
  const pointers: string[] = []

  do {
    const resp = await ssm.send(
      new GetParametersByPathCommand({
        Path:      secretsPrefix,
        Recursive: false,
        NextToken: nextToken,
      }),
    )
    for (const param of resp.Parameters ?? []) {
      if (param.Value) pointers.push(param.Value)
    }
    nextToken = resp.NextToken
  } while (nextToken)

  for (const secretName of pointers) {
    try {
      const resp = await sm.send(new GetSecretValueCommand({ SecretId: secretName }))
      const data = JSON.parse(resp.SecretString ?? "{}") as Record<string, string>
      for (const [k, v] of Object.entries(data)) {
        setIfMissing(k.toUpperCase(), String(v))
      }
    } catch (err) {
      console.warn(`[aws-loader] Falha ao carregar secret '${secretName}':`, err)
    }
  }
}

export async function loadAwsConfig(): Promise<void> {
  if (process.env.USE_AWS_CONFIG?.toLowerCase() !== "true") return

  const region = process.env.AWS_REGION ?? "sa-east-1"

  console.info(`[aws-loader] USE_AWS_CONFIG=true | path SSM: ${ssmPath} | região: ${region}`)

  const { SSMClient }              = await import("@aws-sdk/client-ssm")
  const { SecretsManagerClient }   = await import("@aws-sdk/client-secrets-manager")

  const ssm = new SSMClient({ region })
  const sm  = new SecretsManagerClient({ region })

  try {
    await loadParameterStore(ssm)
    console.info("[aws-loader] Parameter Store carregado")
  } catch (err) {
    console.error("[aws-loader] Falha ao carregar Parameter Store:", err)
  }

  try {
    await loadSecretsViaPointers(ssm, sm)
    console.info("[aws-loader] Secrets Manager carregado")
  } catch (err) {
    console.error("[aws-loader] Falha ao carregar Secrets Manager:", err)
  }
}
