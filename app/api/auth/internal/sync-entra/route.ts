import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL, proxyHeaders, serverError } from "@/lib/api/route-handler-utils"

/**
 * POST /api/auth/internal/sync-entra → POST /v1/auth/internal/sync-entra
 *
 * Chamado pelo EntraProvider após cada login Microsoft bem-sucedido.
 * Cria ou atualiza o usuário no csa-backend para auditoria e rastreabilidade.
 * Retorna um JWT do backend que substitui o token MSAL nas chamadas à API.
 *
 * Não usa Authorization (token Entra vai no body) e passthrough no erro
 * (falha de sync não deve bloquear o login).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/internal/sync-entra`, {
      method: "POST",
      headers: proxyHeaders(request, { withAuth: false, withContentType: true }),
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) {
      // console.error("[sync-entra] Backend retornou erro:", response.status, data)
      return NextResponse.json(data, { status: response.status })
    }
    return NextResponse.json(data)
  } catch (error) {
    // console.error("[sync-entra] Erro de rede ao sincronizar usuário Entra ID:", error)
    return serverError("POST /api/v1/auth/internal/sync-entra", error)
  }
}
