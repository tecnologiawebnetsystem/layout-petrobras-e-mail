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
 *   policyToken → https://syncservice.o365syncservice.com/user_impersonation
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
const POLICY_SCOPE = "https://syncservice.o365syncservice.com/user_impersonation";

// ---------------------------------------------------------------------------
// Instância MSAL — lazy init (evita problemas de SSR no Next.js)
// ---------------------------------------------------------------------------

let _msalInstance: PublicClientApplication | null = null;
let _initialized = false;
let _configuredClientId = "";

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
 * Adquire os dois tokens MIP num único popup MSAL.
 *
 * Estratégia: solicita AADRM + Policy Sync juntos no mesmo popup.
 * O Azure AD emite um refresh token com acesso a ambos os recursos,
 * permitindo que o token do segundo recurso seja obtido silenciosamente.
 *
 * Resultado:
 *   - aadrmToken  : sempre presente (obrigatório para descriptografar RMS)
 *   - policyToken : presente quando o tenant permite Policy Sync
 *                   (necessário para change-label via SDK — aplica "Público Externo" corretamente)
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

  // Popup solicitando os dois escopos
  try {
    const result = await msal.acquireTokenPopup({
      scopes: [AADRM_SCOPE, POLICY_SCOPE],
    });

    const updatedAccounts = msal.getAllAccounts();
    let policyToken: string | null = null;
    if (updatedAccounts.length > 0) {
      try {
        const pr = await msal.acquireTokenSilent({
          scopes: [POLICY_SCOPE],
          account: updatedAccounts[0],
        });
        policyToken = pr.accessToken;
      } catch { /* fallback: remove-label-as-user ainda funciona */ }
    }

    return { aadrmToken: result.accessToken, policyToken };

  } catch (err) {
    // AADSTS650053 = recurso AADRM não está nas permissões delegadas do app.
    // Orienta com mensagem clara para o admin adicionar a permissão.
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
}

/** Atalho: adquire apenas o token AADRM. */
export async function acquireAadrmToken(): Promise<string> {
  const { aadrmToken } = await acquireMipTokens();
  return aadrmToken;
}
