"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { FullPageLoader } from "@/components/ui/full-page-loader"
import { useAuthStore } from "@/lib/stores/auth-store"
import { mapRoleToUserType, resolvePostLoginRoute, type FrontendUserType } from "@/lib/auth/cav4-config"
import { RoleRedirectScreen } from "@/components/auth/role-redirect-screen"

function CAv4CallbackContent() {
  const router = useRouter()
  const params = useSearchParams()
  const { setAuth } = useAuthStore()
  const processed = useRef(false)
  // Perfil de destino: enquanto null, exibimos a validacao; quando definido,
  // mostramos a tela visual indicando para qual area o usuario esta indo.
  const [targetType, setTargetType] = useState<FrontendUserType | null>(null)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const run = async () => {
      const code = params.get("code") || ""
      const state = params.get("state") || ""

      if (!code || !state) {
        router.replace("/?error=callback_invalido")
        return
      }

      try {
        const resp = await fetch("/api/auth/cav4/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
        })

        const data = await resp.json().catch(() => ({}))

        if (!resp.ok) {
          const message =
            data?.detail?.message ||
            data?.detail ||
            data?.error?.message ||
            "Falha na autenticacao CAv4"
          router.replace(`/?error=${encodeURIComponent(message)}`)
          return
        }

        const user = data.user || {}
        const userType = mapRoleToUserType(String(user.role || "internal"))

        setAuth(
          {
            id: String(user.id || ""),
            email: user.email || "",
            name: user.name || "",
            userType,
            isAdmin: user.role === "admin",
            jobTitle: user.job_title || undefined,
            department: user.department || undefined,
            employeeId: user.employee_id || undefined,
            photoUrl: user.photo_url || undefined,
            // Permissoes granulares e modulos retornados pelo CAv4 via authorization_service
            permissions: data.permissions ?? [],
            allowedModules: data.allowed_modules ?? [],
            manager: user.manager
              ? {
                  id: String(user.manager.id),
                  name: user.manager.name,
                  email: user.manager.email,
                  jobTitle: user.manager.job_title || undefined,
                  department: user.manager.department || undefined,
                }
              : undefined,
          },
          data.access_token,
          data.refresh_token,
        )

        setTargetType(userType)
        router.replace(resolvePostLoginRoute(userType))
      } catch {
        router.replace("/?error=auth_failed")
      }
    }

    run()
  }, [params, router, setAuth])

  // Enquanto valida, mostra o loader; ao confirmar o papel, mostra a tela
  // visual indicando claramente para qual perfil o usuario esta sendo levado.
  if (targetType) {
    return <RoleRedirectScreen targetType={targetType} />
  }

  return (
    <FullPageLoader
      message="Validando seu acesso corporativo"
      subMessage="Estamos confirmando suas credenciais com a Petrobras. Isso leva apenas alguns segundos."
    />
  )
}

export default function CAv4CallbackPage() {
  return (
    <Suspense
      fallback={
        <FullPageLoader
          message="Preparando seu acesso"
          subMessage="Aguarde um instante enquanto iniciamos a autenticacao."
        />
      }
    >
      <CAv4CallbackContent />
    </Suspense>
  )
}
