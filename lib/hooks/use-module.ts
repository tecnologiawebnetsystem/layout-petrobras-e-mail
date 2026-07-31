/**
 * Hook para verificação de acesso por módulo da aplicação.
 *
 * `allowedModules` é calculado pelo backend no momento do login
 * (função `get_allowed_modules` em `authorization_service.py`) e
 * armazenado no auth-store. Um módulo é acessível quando o usuário
 * possui pelo menos uma das permissões listadas em MODULE_PERMISSIONS.
 */

import { useAuthStore } from "@/lib/stores/auth-store"

const EMPTY: string[] = []

/**
 * Retorna true se o módulo informado está na lista de módulos
 * autorizados para o usuário atual.
 *
 * @param module - Nome do módulo conforme definido em MODULE_PERMISSIONS
 *   no backend: "upload" | "compartilhamentos" | "supervisor" |
 *   "historico" | "logs" | "admin" | "download"
 */
export function useModuleAccess(module: string): boolean {
  const allowedModules = useAuthStore((s) => s.user?.allowedModules) ?? EMPTY
  const permissions = useAuthStore((s) => s.user?.permissions) ?? EMPTY

  if (permissions.includes("*")) return true
  return allowedModules.includes(module)
}

/**
 * Retorna a lista completa de módulos que o usuário pode acessar.
 * Útil para renderizar menus de navegação dinamicamente.
 */
export function useAllowedModules(): string[] {
  const allowedModules = useAuthStore((s) => s.user?.allowedModules) ?? EMPTY
  const permissions = useAuthStore((s) => s.user?.permissions) ?? EMPTY

  if (permissions.includes("*")) {
    return [
      "upload",
      "compartilhamentos",
      "supervisor",
      "historico",
      "logs",
      "admin",
      "download",
    ]
  }

  return allowedModules
}
