"use client";

/**
 * Auth Provider — Entra ID (fluxo MSAL SPA).
 *
 * Responsabilidades:
 * - Processa o redirect do Microsoft Entra ID (handleRedirectPromise)
 * - Valida sessao existente ao carregar a app (via backend)
 * - Logout sincronizado entre abas (via localStorage)
 *
 * Como o redirectUri e a homepage (window.location.origin), o MSAL redireciona
 * aqui apos autenticacao. Este provider detecta e processa o redirect em qualquer
 * pagina, sem precisar de uma rota /auth/entra-callback dedicada.
 */

import { type ReactNode, useEffect, useRef, useState } from "react";
import { setupCrossTabLogout } from "@/lib/auth/entra-security";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRouter, usePathname } from "next/navigation";
import { getClientEnv } from "@/lib/env";

interface EntraProviderProps {
  children: ReactNode;
}

// Rotas publicas que nao exigem autenticacao
const PUBLIC_ROUTES = ["/", "/auth/entra-callback", "/download"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/** Detecta se a URL atual carrega uma resposta de redirect do MSAL. */
function hasMsalResponseInUrl(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("code") && params.has("state");
}

export function EntraProvider({ children }: EntraProviderProps) {
  const { isAuthenticated, validateSession, setAuth, _hasHydrated } =
    useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const hasValidated = useRef(false);
  const hasMsalProcessed = useRef(false);

  // Inicia como true se a URL já tiver ?code=&state= para evitar flash da tela de login
  const [isMsalProcessing, setIsMsalProcessing] = useState<boolean>(() =>
    hasMsalResponseInUrl(),
  );

  useEffect(() => {
    setupCrossTabLogout();
  }, []);

  // Processa redirect do Microsoft Entra ID (MSAL SPA flow)
  useEffect(() => {
    if (hasMsalProcessed.current) return;
    hasMsalProcessed.current = true;

    const authMode = getClientEnv("NEXT_PUBLIC_AUTH_MODE");
    if (authMode !== "entra") return;

    const processMsalRedirect = async () => {
      try {
        const { getMsalInstance } = await import("@/lib/auth/msal-config");
        const msal = await getMsalInstance();
        const result = await msal.handleRedirectPromise();

        if (!result) {
          setIsMsalProcessing(false);
          return;
        }

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
          setIsMsalProcessing(false);
          router.replace(
            `/?error=${encodeURIComponent(err.detail || "Falha na autenticacao")}`,
          );
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
        console.error("[EntraProvider] Erro ao processar redirect MSAL:", err);
        setIsMsalProcessing(false);
      }
    };

    processMsalRedirect();
  }, [router, setAuth]);

  // Exibe loading enquanto o MSAL processa o redirect da Microsoft
  if (isMsalProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-foreground font-medium">Autenticando...</p>
          <p className="text-muted-foreground text-sm">
            Verificando suas credenciais com a Microsoft
          </p>
        </div>
      </div>
    );
  }

  // Valida sessao com o backend ao carregar
  useEffect(() => {
    if (!_hasHydrated || hasValidated.current) return;

    // So valida se usuario parece autenticado (tem token no localStorage)
    if (!isAuthenticated) return;

    // Nao valida em rotas publicas (evita loop)
    if (isPublicRoute(pathname)) return;

    hasValidated.current = true;

    validateSession().then((valid) => {
      if (!valid) {
        // Sessao invalida — redireciona para login
        router.replace("/");
      }
    });
  }, [_hasHydrated, isAuthenticated, validateSession, router, pathname]);

  return <>{children}</>;
}
