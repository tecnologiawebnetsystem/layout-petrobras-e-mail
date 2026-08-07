/**
 *
 * Configuração MSAL para autenticação de segunda etapa no upload de arquivos
 * com proteção RMS (rótulo Confidencial da Petrobras).
 *
 * App usado: AAD-DEV-A12022 (da3aaaad-...) — app principal do sistema CSA.
 * O admin habilitou "Allow public client flows" e cadastrou o redirect URI
 * /auth/mip-redirect como SPA platform neste app.
 *
 * Tokens adquiridos:
 *   aadrmToken  → https://aadrm.com/user_impersonation
 *   policyToken → https://syncservice.o365syncservice.com/UnifiedPolicy.User.Read
 *
 * REGRA FUNDAMENTAL — OAuth2 / Entra ID v2.0:
 *   Cada access token pertence a UM único recurso (campo "aud" no JWT).
 *   Solicitar escopos de recursos distintos no mesmo acquireTokenPopup() é
 *   inválido e causa invalid_resource ou redirecionamento para /reprocess.
 *
 *   Fluxo correto:
 *     1. acquireTokenPopup([AADRM_SCOPE])      → popup único para o usuário
 *     2. acquireTokenSilent([POLICY_SCOPE])    → silent usa o refresh token do cache
 *     3. Se silent falhar → acquireTokenPopup([POLICY_SCOPE])  (raro, só 1ª vez)
 */

import {
  PublicClientApplication,
  type Configuration,
  InteractionRequiredAuthError,
  BrowserAuthError,
} from "@azure/msal-browser";
import { getClientEnv } from "@/lib/env";

// ---------------------------------------------------------------------------
// Constantes — lidas de variáveis de ambiente (nunca hardcoded)
// ---------------------------------------------------------------------------

// Client ID do app AAD-DEV-A12022 (app principal do sistema CSA).
// Configurado em NEXT_PUBLIC_MIP_CLIENT_ID (SSM em produção, .env em dev).
function getMipClientId(): string {
  const id = getClientEnv("NEXT_PUBLIC_MIP_CLIENT_ID");
  if (!id) throw new Error("[msal-aip] NEXT_PUBLIC_MIP_CLIENT_ID não configurado.");
  return id;
}

// Tenant ID do Azure AD da Petrobras.
// Configurado em NEXT_PUBLIC_MIP_TENANT_ID (SSM em produção, .env em dev).
function getMipTenantId(): string {
  const id = getClientEnv("NEXT_PUBLIC_MIP_TENANT_ID");
  if (!id) throw new Error("[msal-aip] NEXT_PUBLIC_MIP_TENANT_ID não configurado.");
  return id;
}

const AADRM_SCOPE  = "https://aadrm.com/user_impersonation";
const POLICY_SCOPE = "https://syncservice.o365syncservice.com/.default";

// ---------------------------------------------------------------------------
// Instância MSAL — lazy init (evita problemas de SSR no Next.js)
// ---------------------------------------------------------------------------

let _msalInstance: PublicClientApplication | null = null;
let _initialized = false;
let _configuredClientId = "";

/**
 * Remove chaves do sessionStorage que causam interaction_in_progress.
 *
 * O MSAL grava uma flag enquanto um popup está em andamento. Se o popup
 * fechar sem completar o handshake (ex: React StrictMode re-montando o
 * componente, timeout, erro de rede), a flag fica travada e qualquer
 * chamada subsequente a acquireTokenPopup falha imediatamente com
 * interaction_in_progress sem sequer abrir o popup.
 *
 * Esta função limpa essas chaves antes de cada popup, garantindo
 * recuperação automática sem precisar dar F5 na página.
 */
function clearMsalInteractionState(): void {
  if (typeof sessionStorage === "undefined") return;
  const toRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.includes("interaction.status") ||
      key.includes("request.params")     ||
      key.includes("nonce.idtoken")      ||
      key.includes("login.request")      ||
      key.includes("token.request")      ||
      key.includes("logout.request")
    )) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((k) => sessionStorage.removeItem(k));
}

async function getMsalInstance(): Promise<PublicClientApplication> {
  const clientId = getMipClientId();

  if (_msalInstance && _initialized && _configuredClientId === clientId) return _msalInstance;

  const config: Configuration = {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${getMipTenantId()}`,
      // URI dedicada para o popup — página mínima que executa handleRedirectPromise().
      // Deve coincidir EXATAMENTE com o redirect URI cadastrado no portal Azure AD.
      redirectUri: typeof window !== "undefined"
        ? `${window.location.origin}/auth/mip-redirect`
        : "/auth/mip-redirect",
    },
    cache: { cacheLocation: "sessionStorage" },
  };

  _msalInstance = new PublicClientApplication(config);
  await _msalInstance.initialize();
  _initialized = true;
  _configuredClientId = clientId;
  return _msalInstance;
}

// ---------------------------------------------------------------------------
// Helper interno
// ---------------------------------------------------------------------------

async function acquireForScope(
  msal: PublicClientApplication,
  scope: string,
  interactive: boolean,
): Promise<string | null> {
  const accounts = msal.getAllAccounts();

  if (accounts.length > 0) {
    try {
      const r = await msal.acquireTokenSilent({ scopes: [scope], account: accounts[0] });
      return r.accessToken;
    } catch (err) {
      if (!(err instanceof InteractionRequiredAuthError)) throw err;
    }
  }

  if (!interactive) return null;

  // Popup
  try {
    const r = await msal.acquireTokenPopup({ scopes: [scope] });
    return r.accessToken;
  } catch (err) {
    if (err instanceof BrowserAuthError && err.errorCode === "user_cancelled")
      throw new Error("Autenticação cancelada pelo usuário.");
    throw err;
  }
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export interface MipTokens {
  /** Token para recurso AADRM — remove proteção RMS. */
  aadrmToken: string;
  /**
   * Token para Policy Sync — muda rótulo via SDK completo.
   * null se a aquisição silenciosa falhar (remove-label-as-user ainda funciona).
   */
  policyToken: string | null;
}

/**
 * Adquire os dois tokens MIP.
 *
 * Passo 1 — popup apenas para AADRM:
 *   Um popup = um recurso. Solicitar dois recursos distintos no mesmo popup
 *   viola o protocolo OAuth2 e causa invalid_resource / reprocess no Entra ID.
 *
 * Passo 2 — silent para Policy Sync:
 *   Após o popup o MSAL armazena um refresh token no cache. O silent usa esse
 *   refresh token para emitir o token do segundo recurso sem interação.
 *
 * Passo 3 — fallback (raro):
 *   Se o silent lançar InteractionRequiredAuthError (ex: recurso nunca
 *   consentido antes), abre um segundo popup apenas para POLICY_SCOPE.
 *   Se esse também falhar, policyToken = null e o sistema usa o fallback
 *   OOXML injection (remove-label-as-user) que não precisa desse token.
 */
export async function acquireMipTokens(): Promise<MipTokens> {
  const msal = await getMsalInstance();
  const accounts = msal.getAllAccounts();

  // Tenta silencioso primeiro (sessão já autenticada)
  if (accounts.length > 0) {
    try {
      const [aadrm, policy] = await Promise.all([
        msal.acquireTokenSilent({ scopes: [AADRM_SCOPE],  account: accounts[0] }),
        msal.acquireTokenSilent({ scopes: [POLICY_SCOPE], account: accounts[0] }).catch(() => null),
      ]);
      return {
        aadrmToken:  aadrm.accessToken,
        policyToken: policy?.accessToken ?? null,
      };
    } catch (err) {
      if (!(err instanceof InteractionRequiredAuthError)) throw err;
      // Tokens expiraram → popup interativo abaixo
    }
  }

  // Limpa estado travado de tentativas anteriores antes de abrir o popup.
  // Sem isso, um popup que fechou sem completar o handshake deixa a flag
  // interaction_in_progress no sessionStorage e a próxima tentativa falha
  // imediatamente sem abrir nenhuma janela.
  clearMsalInteractionState();

  // ── Passo 1: popup APENAS para AADRM ──────────────────────────────────────
  let aadrmToken: string;
  try {
    const aadrm = await msal.acquireTokenPopup({ scopes: [AADRM_SCOPE] });
    aadrmToken = aadrm.accessToken;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("650053") || msg.includes("invalid_client")) {
      throw new Error(
        "O app de autenticação não tem permissão para acessar o Microsoft Rights Management Services (AADRM). " +
        "Solicite ao administrador do Azure AD que adicione a permissão delegada 'user_impersonation' " +
        "do recurso 'Microsoft Rights Management Services' no app AAD-DEV-A12022, " +
        "e conceda o admin consent."
      );
    }
    if (err instanceof BrowserAuthError && err.errorCode === "user_cancelled")
      throw new Error("Autenticação cancelada pelo usuário.");
    throw err;
  }

  // ── Passo 2: silent para Policy Sync (usa refresh token gravado pelo popup) ─
  let policyToken: string | null = null;
  const updatedAccounts = msal.getAllAccounts();
  if (updatedAccounts.length > 0) {
    try {
      const pr = await msal.acquireTokenSilent({
        scopes: [POLICY_SCOPE],
        account: updatedAccounts[0],
      });
      policyToken = pr.accessToken;
    } catch (err) {
      // ── Passo 3: fallback — segundo popup apenas para Policy Sync ───────────
      if (err instanceof InteractionRequiredAuthError) {
        try {
          const pr = await msal.acquireTokenPopup({
            scopes:  [POLICY_SCOPE],
            account: updatedAccounts[0],
          });
          policyToken = pr.accessToken;
        } catch {
          // Falhou: segue sem policyToken — remove-label-as-user (OOXML) funciona
          policyToken = null;
        }
      }
      // Qualquer outro erro: segue com policyToken = null (fallback automático)
    }
  }

  return { aadrmToken, policyToken };
}

/** Atalho: adquire apenas o token AADRM. */
export async function acquireAadrmToken(): Promise<string> {
  const { aadrmToken } = await acquireMipTokens();
  return aadrmToken;
}
