/**
 * Definicao centralizada dos itens de navegacao do sistema.
 *
 * Cada modulo e exibido no menu somente se o usuario possuir
 * ao menos UMA das permissoes granulares listadas em `requiredPermissions`
 * (modelo RBAC CAv4). Em sessoes antigas sem o campo `permissions`,
 * o fallback `requiredUserTypes` e usado.
 *
 * Fonte: backend/docs/mapeamento_rbac_cav4.md
 */

import type { LucideIcon } from "lucide-react"
import {
  Upload,
  FolderOpen,
  History,
  ShieldCheck,
  Activity,
  Search,
  Settings,
} from "lucide-react"
import { checkAnyPermission, type Permission } from "@/lib/auth/permissions"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string
  route: string
  icon: LucideIcon
  /** Basta UMA permissao estar presente para liberar o item. */
  requiredPermissions: Permission[]
  /** Fallback para sessoes sem campo permissions (userType do backend). */
  requiredUserTypes: Array<"internal" | "external" | "supervisor" | "admin" | "support">
}

// ─── Definicao dos modulos ────────────────────────────────────────────────────

export const ALL_NAV_ITEMS: NavItem[] = [
  {
    label: "Upload",
    route: "/upload",
    icon: Upload,
    requiredPermissions: ["file:upload", "shares:create"],
    requiredUserTypes: ["internal", "supervisor"],
  },
  {
    label: "Compartilhamentos",
    route: "/compartilhamentos",
    icon: FolderOpen,
    requiredPermissions: ["shares:read"],
    requiredUserTypes: ["internal", "supervisor"],
  },
  {
    label: "Histórico",
    route: "/historico",
    icon: History,
    requiredPermissions: ["shares:read"],
    requiredUserTypes: ["internal", "supervisor"],
  },
  {
    label: "Painel do Gestor",
    route: "/supervisor",
    icon: ShieldCheck,
    requiredPermissions: ["shares:approve", "shares:reject"],
    requiredUserTypes: ["supervisor"],
  },
  {
    label: "Logs e Rastreamento",
    route: "/logs",
    icon: Activity,
    requiredPermissions: ["report:read"],
    requiredUserTypes: ["supervisor", "admin"],
  },
  {
    label: "Auditoria",
    route: "/auditoria",
    icon: Search,
    requiredPermissions: ["audit:read"],
    requiredUserTypes: ["admin", "supervisor"],
  },
  {
    label: "Administração",
    route: "/admin",
    icon: Settings,
    requiredPermissions: ["*"],
    requiredUserTypes: ["admin"],
  },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

interface UserForNav {
  userType: "internal" | "external" | "supervisor" | "admin" | "support"
  permissions?: string[]
}

/**
 * Retorna somente os itens de navegacao que o usuario tem acesso.
 *
 * Logica de decisao:
 * - Se o campo `permissions` existe e tem ao menos 1 item (sessao CAv4 atual),
 *   usa EXCLUSIVAMENTE a permissao granular. Isso garante que adicionar ou
 *   remover permissoes no CAv4 reflita imediatamente no menu, sem interferencia
 *   do userType.
 * - Se `permissions` e ausente ou vazio (sessao antiga / modo dev sem RBAC),
 *   cai no fallback por userType para manter compatibilidade.
 */
export function getNavItems(user: UserForNav | null | undefined): NavItem[] {
  if (!user) return []

  const hasGranularPermissions = Array.isArray(user.permissions) && user.permissions.length > 0

  return ALL_NAV_ITEMS.filter((item) => {
    if (hasGranularPermissions) {
      // Modo granular: apenas permissao CAv4 decide
      return checkAnyPermission(user.permissions, item.requiredPermissions)
    }
    // Modo fallback: userType decide (sessoes antigas ou dev sem RBAC)
    return item.requiredUserTypes.includes(user.userType)
  })
}
