import { getClientEnv } from "@/lib/env"

export type FrontendUserType = "internal" | "external" | "supervisor" | "admin"

export function isCav4Mode(): boolean {
  return (getClientEnv("NEXT_PUBLIC_AUTH_MODE") || "entra") === "cav4"
}

export function getCav4DiscoveryUrl(): string {
  return getClientEnv("NEXT_PUBLIC_CAV4_DISCOVERY_URL")
}

export function getCav4LoginPath(): string {
  return "/api/auth/cav4/login"
}

export function mapRoleToUserType(role: string): FrontendUserType {
  const normalized = (role || "").toLowerCase()
  if (normalized === "admin") return "admin"
  if (normalized === "supervisor") return "supervisor"
  if (normalized === "external") return "external"
  return "internal"
}

export function resolvePostLoginRoute(userType: FrontendUserType): string {
  if (userType === "admin") return "/admin"
  if (userType === "supervisor") return "/supervisor"
  if (userType === "external") return "/download"
  return "/upload"
}

// Rotulo amigavel do perfil, usado nas mensagens de loading/redirecionamento.
export function getUserTypeLabel(userType: FrontendUserType): string {
  if (userType === "admin") return "Auditor"
  if (userType === "supervisor") return "Gestor"
  if (userType === "external") return "Usuario Externo"
  return "Remetente"
}

// Mensagem dinamica exibida enquanto o usuario e direcionado para a sua area.
export function getRedirectMessage(userType: FrontendUserType): string {
  return `Redirecionando para a area de ${getUserTypeLabel(userType)}...`
}

// Helper utilitário para cenários em que o fluxo precisar ser client-driven.
// No desenho atual do projeto, o PKCE principal é gerado no backend.
export async function generatePkcePair(): Promise<{
  codeVerifier: string
  codeChallenge: string
}> {
  const bytes = new Uint8Array(64)
  crypto.getRandomValues(bytes)
  const codeVerifier = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier))
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
  const codeChallenge = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return { codeVerifier, codeChallenge }
}
