"use client";

/**
 * /auth/mip-redirect
 *
 * Página mínima que serve como redirectUri do popup MSAL para autenticação MIP.
 *
 * Fluxo:
 *  1. acquireTokenPopup() abre popup → Microsoft → redireciona aqui com ?code=...
 *  2. MSAL nesta página chama handleRedirectPromise()
 *  3. Token é armazenado no sessionStorage
 *  4. MSAL fecha o popup e resolve a Promise na janela pai
 *  5. O usuário nunca vê esta página — ela abre e fecha em frações de segundo
 */

import { useEffect } from "react";

export default function MipRedirectPage() {
  useEffect(() => {
    const handle = async () => {
      try {
        // Import dinâmico para garantir execução apenas no cliente
        const [{ PublicClientApplication }, { getClientEnv }] = await Promise.all([
          import("@azure/msal-browser"),
          import("@/lib/env"),
        ]);

        const clientId = getClientEnv("NEXT_PUBLIC_MIP_CLIENT_ID");
        const tenantId = getClientEnv("NEXT_PUBLIC_MIP_TENANT_ID");

        if (!clientId || !tenantId) return;

        // Instância local apenas para processar o redirect — não é o singleton do msal-aip.ts
        const app = new PublicClientApplication({
          auth: {
            clientId,
            authority: `https://login.microsoftonline.com/${tenantId}`,
            // Deve coincidir EXATAMENTE com o redirectUri configurado em msal-aip.ts
            redirectUri: `${window.location.origin}/auth/mip-redirect`,
          },
          cache: { cacheLocation: "sessionStorage" },
        });

        await app.initialize();

        // handleRedirectPromise detecta o ?code= na URL, troca pelo token,
        // armazena no cache e fecha o popup automaticamente.
        await app.handleRedirectPromise();
      } catch {
        // Erros aqui são silenciosos — o popup fecha normalmente
        // e a janela pai receberá o erro via acquireTokenPopup rejection
      }
    };

    handle();
  }, []);

  // Página intencionalmente em branco — usuário nunca a vê
  return null;
}
