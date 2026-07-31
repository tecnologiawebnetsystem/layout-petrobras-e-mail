/**
 * Hooks de controle de acesso baseado em permissões.
 *
 * As permissões são resolvidas pelo backend (CAv4 ou fallback local) e
 * armazenadas no auth-store após o login. O frontend nunca calcula permissões —
 * apenas consulta o que o backend já emitiu no JWT.
 *
 * Regra de segurança: backend é a fonte da verdade. Estes hooks servem
 * apenas para exibição/ocultação de UI. Toda requisição é validada
 * pelo `require_permission()` no FastAPI.
 */

import { useAuthStore } from "@/lib/stores/auth-store"

// Array vazio estável — evita criar nova referência a cada render,
// o que causaria loop infinito no useSyncExternalStore do Zustand.
const EMPTY: string[] = []

/**
 * Retorna true se o usuário possui a permissão informada.
 * A permissão especial "*" concede acesso irrestrito (admin/auditor).
 */
export function usePermission(permission: string): boolean {
  // Seleciona o array diretamente; se null/undefined, usa referência estável.
  const permissions = useAuthStore((s) => s.user?.permissions) ?? EMPTY
  return permissions.includes("*") || permissions.includes(permission)
}

/**
 * Retorna true se o usuário possui pelo menos UMA das permissões listadas.
 * Útil para elementos visíveis a múltiplos perfis com permissões distintas.
 */
export function useHasAnyPermission(perms: string[]): boolean {
  const permissions = useAuthStore((s) => s.user?.permissions) ?? EMPTY
  if (permissions.includes("*")) return true
  return perms.some((p) => permissions.includes(p))
}

/**
 * Retorna true se o usuário possui TODAS as permissões listadas.
 * Útil para funcionalidades que exigem conjunto completo de permissões.
 */
export function useHasAllPermissions(perms: string[]): boolean {
  const permissions = useAuthStore((s) => s.user?.permissions) ?? EMPTY
  if (permissions.includes("*")) return true
  return perms.every((p) => permissions.includes(p))
}

/**
 * Retorna true se o usuário possui o role informado.
 * Verifica tanto `user.roles[]` (multi-role) quanto `user.userType` (compatibilidade).
 */
export function useHasRole(
  role: "internal" | "external" | "supervisor" | "support" | "admin",
): boolean {
  const userType = useAuthStore((s) => s.user?.userType)
  return userType === role
}
