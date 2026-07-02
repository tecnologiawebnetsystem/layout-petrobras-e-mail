"use client";

/**
 * /auth/entra-callback
 *
 * Processa o redirect do Microsoft Entra ID apos autenticacao MSAL (fluxo SPA).
 *
 * Fluxo:
 *   1. MSAL redireciona o browser para esta pagina apos login na Microsoft
 *   2. handleRedirectPromise() processa o hash/code da URL e retorna os tokens
 *   3. Frontend envia id_token + access_token para o backend (POST /api/auth/entra/token)
 *   4. Backend valida, verifica grupo e retorna JWT interno + dados do usuario
 *   5. Salva no auth store e redireciona para o dashboard
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getMsalInstance } from "@/lib/auth/msal-config";
import { Suspense } from "react";
import { FullPageLoader } from "@/components/ui/full-page-loader";

function CallbackContent() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const handleMsalCallback = async () => {
      try {
        const search = window.location.search;
        const hash = window.location.hash;

        const msal = await getMsalInstance();
        const result = await msal.handleRedirectPromise();

        if (!result) {
          const hasCode = search.includes("code=") || hash.includes("code=");
          if (hasCode) {
            // URL tem ?code= mas MSAL nao processou — estado desatualizado no sessionStorage.
            // Solucao: limpar sessionStorage ou usar aba anonima.
            console.error(
              "[EntraCallback] handleRedirectPromise retornou null com ?code= na URL. " +
                "Provavel estado MSAL expirado no sessionStorage. Tente em aba anonima.",
            );
            router.replace("/?error=msal_state_mismatch");
          } else {
            // Acesso direto a /auth/entra-callback sem redirect do MSAL
            router.replace("/");
          }
          return;
        }

        // Trocar tokens Microsoft por JWT interno via backend
        const resp = await fetch("/api/auth/entra/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_token: result.idToken,
            access_token: result.accessToken,
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          // Suporta tanto { detail: "..." } (FastAPI direto) quanto
          // { error: { message: "..." } } (formato BFF do Next.js)
          const msg =
            err.detail ||
            (err.error as { message?: string } | undefined)?.message ||
            "Servidor indisponível. Tente novamente em alguns instantes.";
          console.error("[EntraCallback] Erro do backend:", msg);
          router.replace(`/?error=${encodeURIComponent(msg)}`);
          return;
        }

        const data = await resp.json();
        const u = data.user;
        const role: string = (u.role || "").toLowerCase();

        let userType: "internal" | "external" | "supervisor" | "admin";
        if (role === "admin") userType = "admin";
        else if (role === "supervisor") userType = "supervisor";
        else if (role === "external") userType = "external";
        else userType = "internal";

        const dest =
          userType === "admin"
            ? "/admin"
            : userType === "supervisor"
              ? "/supervisor"
              : userType === "external"
                ? "/download"
                : "/upload";

        setAuth(
          {
            id: String(u.id),
            email: u.email || "",
            name: u.name || "",
            userType,
            isAdmin: role === "admin",
            jobTitle: u.job_title || undefined,
            department: u.department || undefined,
            employeeId: u.employee_id || undefined,
            photoUrl: u.photo_url || undefined,
            manager: u.manager
              ? {
                  id: String(u.manager.id),
                  name: u.manager.name,
                  email: u.manager.email,
                  jobTitle: u.manager.job_title || undefined,
                  department: u.manager.department || undefined,
                }
              : undefined,
          },
          data.access_token,
          data.refresh_token,
        );

        router.replace(dest);
      } catch (err) {
        console.error("[EntraCallback] Erro inesperado:", err);
        const isNetworkError = err instanceof TypeError;
        const msg = isNetworkError
          ? "Backend indisponível. Verifique sua conexão e tente novamente."
          : "auth_failed";
        router.replace(`/?error=${encodeURIComponent(msg)}`);
      }
    };

    handleMsalCallback();
  }, [router, setAuth]);

  return (
    <FullPageLoader
      message="Autenticando..."
      subMessage="Processando sua autenticacao"
    />
  );
}

export default function EntraCallbackPage() {
  return (
    <Suspense
      fallback={
        <FullPageLoader
          message="Carregando..."
          subMessage="Aguarde um momento"
        />
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
