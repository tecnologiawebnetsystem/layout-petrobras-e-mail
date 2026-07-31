"use client"

import { type ReactNode, cloneElement, isValidElement } from "react"
import { usePermission, useHasAnyPermission, useHasAllPermissions, useHasRole } from "@/lib/hooks/use-permission"

interface PermissionGateProps {
  /**
   * Permissão singular exigida para exibir o conteúdo.
   * Mutuamente exclusivo com `anyOf` e `allOf`.
   */
  permission?: string
  /**
   * Qualquer uma dessas permissões libera o acesso (lógica OR).
   * Útil para elementos compartilhados entre múltiplos perfis.
   */
  anyOf?: string[]
  /**
   * Todas essas permissões são exigidas (lógica AND).
   * Útil para funcionalidades críticas com múltiplos requisitos.
   */
  allOf?: string[]
  /**
   * Roles aceitos como alternativa às permissões.
   * Verificado quando nenhuma das props de permissão for satisfeita.
   * Suporta multi-role: usuário com roles=["supervisor","internal"] satisfaz ambos.
   */
  roles?: Array<"internal" | "external" | "supervisor" | "admin">
  /** Conteúdo renderizado quando o acesso é autorizado. */
  children: ReactNode
  /**
   * Conteúdo renderizado quando o acesso NÃO é autorizado.
   * Padrão: null (oculta silenciosamente — fail closed).
   */
  fallback?: ReactNode
  /**
   * Quando true, renderiza o elemento filho com `disabled` e `aria-disabled`
   * em vez de ocultá-lo. Útil para botões que precisam ser visíveis mas
   * inoperantes (ex: indicar que a funcionalidade existe mas requer permissão).
   *
   * Só funciona se o filho for um elemento React válido que aceite `disabled`.
   */
  disabled?: boolean
}

/**
 * Portão de autorização reutilizável para controle granular de UI.
 *
 * Exibe, oculta ou desabilita elementos com base nas permissões e/ou
 * roles do usuário autenticado. As permissões vêm do JWT emitido pelo
 * backend (CAv4 ou fallback local) e são armazenadas no auth-store.
 *
 * ⚠️ SEGURANÇA: este componente protege apenas a UI. Toda requisição
 * ao backend é validada independentemente via `require_permission()`.
 *
 * Exemplos de uso:
 * ```tsx
 * // Exibir botão apenas para quem pode aprovar
 * <PermissionGate permission="shares:approve">
 *   <Button>Aprovar</Button>
 * </PermissionGate>
 *
 * // Desabilitar upload para quem não tem permissão (visível mas inativo)
 * <PermissionGate permission="shares:create" disabled>
 *   <Button>Enviar Arquivo</Button>
 * </PermissionGate>
 *
 * // Visível para supervisor OU admin (qualquer permissão do set)
 * <PermissionGate anyOf={["shares:approve", "report:read"]}>
 *   <NavItem>Painel Supervisor</NavItem>
 * </PermissionGate>
 *
 * // Com fallback personalizado
 * <PermissionGate permission="report:read" fallback={<p>Sem acesso a relatórios</p>}>
 *   <Relatorio />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  anyOf,
  allOf,
  roles,
  children,
  fallback = null,
  disabled = false,
}: PermissionGateProps) {
  // — Avalia cada critério —
  const hasSinglePerm = usePermission(permission ?? "__noop__")
  const hasAnyPerm    = useHasAnyPermission(anyOf  ?? [])
  const hasAllPerms   = useHasAllPermissions(allOf ?? [])

  // Verifica roles (qualquer um satisfaz)
  const role0 = roles?.[0]
  const role1 = roles?.[1]
  const role2 = roles?.[2]
  const role3 = roles?.[3]
  const role4 = roles?.[4]
  const hasRole0 = useHasRole((role0 ?? "internal") as "internal" | "external" | "supervisor" | "admin")
  const hasRole1 = useHasRole((role1 ?? "internal") as "internal" | "external" | "supervisor" | "admin")
  const hasRole2 = useHasRole((role2 ?? "internal") as "internal" | "external" | "supervisor" | "admin")
  const hasRole3 = useHasRole((role3 ?? "internal") as "internal" | "external" | "supervisor" | "admin")
  const hasRole4 = useHasRole((role4 ?? "internal") as "internal" | "external" | "supervisor" | "admin")

  const hasMatchingRole = roles
    ? [
        role0 !== undefined && hasRole0,
        role1 !== undefined && hasRole1,
        role2 !== undefined && hasRole2,
        role3 !== undefined && hasRole3,
        role4 !== undefined && hasRole4,
      ].some(Boolean)
    : false

  // — Resolve autorização —
  // Se nenhuma prop de critério for fornecida → bloqueia (fail closed)
  const hasNoCriteria = !permission && !anyOf?.length && !allOf?.length && !roles?.length

  const isAuthorized =
    !hasNoCriteria &&
    (
      (permission != null  && hasSinglePerm) ||
      (anyOf?.length       && hasAnyPerm)    ||
      (allOf?.length       && hasAllPerms)   ||
      (roles?.length       && hasMatchingRole)
    )

  // — Renderização —
  if (!isAuthorized) {
    if (disabled && isValidElement(children)) {
      // Renderiza desabilitado em vez de ocultar
      return cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        disabled: true,
        "aria-disabled": true,
        tabIndex: -1,
      })
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}
