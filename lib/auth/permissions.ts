/**
 * Utilitarios de permissao baseados no modelo RBAC do CAv4.
 *
 * O backend retorna `permissions` e `allowed_modules` apos a autenticacao.
 * Este modulo expoe helpers para verificar permissoes de forma granular
 * no frontend, eliminando a dependencia exclusiva de `userType`.
 *
 * Permissoes disponiveis (conforme mapeamento_rbac_cav4.md):
 *   audit:read, dashboard:read, emails:read
 *   file:download, file:upload
 *   notifications:read, report:read
 *   shares:approve, shares:cancel, shares:create, shares:delete,
 *   shares:read, shares:reject, shares:resend
 *
 * O valor especial "*" indica acesso total (perfil Auditor/admin).
 */

import { useAuthStore } from "@/lib/stores/auth-store"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Permission =
  | "audit:read"
  | "dashboard:read"
  | "emails:read"
  | "file:download"
  | "file:upload"
  | "notifications:read"
  | "report:read"
  | "shares:approve"
  | "shares:cancel"
  | "shares:create"
  | "shares:delete"
  | "shares:read"
  | "shares:reject"
  | "shares:resend"
  | "*"

export type Module =
  | "upload"
  | "compartilhamentos"
  | "historico"
  | "supervisor"
  | "logs"
  | "auditoria"
  | "admin"
  | "download"

// ─── Helpers puros (nao dependem de hook) ─────────────────────────────────────

/**
 * Verifica se a lista de permissoes contem a permissao solicitada.
 * O valor "*" concede acesso a qualquer permissao.
 */
export function checkPermission(
  permissions: string[] | undefined,
  permission: Permission,
): boolean {
  if (!permissions || permissions.length === 0) return false
  if (permissions.includes("*")) return true
  return permissions.includes(permission)
}

/**
 * Verifica se TODAS as permissoes solicitadas estao presentes.
 */
export function checkAllPermissions(
  permissions: string[] | undefined,
  required: Permission[],
): boolean {
  return required.every((p) => checkPermission(permissions, p))
}

/**
 * Verifica se pelo menos UMA das permissoes solicitadas esta presente.
 */
export function checkAnyPermission(
  permissions: string[] | undefined,
  required: Permission[],
): boolean {
  return required.some((p) => checkPermission(permissions, p))
}

/**
 * Verifica se um modulo esta habilitado para o usuario.
 */
export function checkModule(
  allowedModules: string[] | undefined,
  module: Module,
): boolean {
  if (!allowedModules) return false
  return allowedModules.includes(module)
}

// ─── Hook React ───────────────────────────────────────────────────────────────

/**
 * Hook que expoe helpers de permissao para uso em componentes.
 *
 * Exemplo de uso:
 *   const { hasPermission, hasModule } = usePermissions()
 *   if (hasPermission("shares:approve")) { ... }
 *   if (hasModule("logs")) { ... }
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user)
  const permissions = user?.permissions
  const allowedModules = user?.allowedModules

  return {
    permissions,
    allowedModules,

    /** Verifica uma permissao granular. "*" concede acesso total. */
    hasPermission: (permission: Permission) =>
      checkPermission(permissions, permission),

    /** Verifica se TODAS as permissoes estao presentes. */
    hasAllPermissions: (required: Permission[]) =>
      checkAllPermissions(permissions, required),

    /** Verifica se pelo menos UMA permissao esta presente. */
    hasAnyPermission: (required: Permission[]) =>
      checkAnyPermission(permissions, required),

    /** Verifica se um modulo esta habilitado. */
    hasModule: (module: Module) => checkModule(allowedModules, module),

    /** true se o usuario tem acesso total (auditor/admin). */
    isFullAccess: permissions?.includes("*") ?? false,
  }
}
