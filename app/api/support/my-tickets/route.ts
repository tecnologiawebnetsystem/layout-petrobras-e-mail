import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL, proxyHeaders, serverError } from "@/lib/api/route-handler-utils"

export interface MyTicket {
  id: number
  numero_solicitacao: string
  email_usuario_externo: string
  created_at: string
  cadastrado_por: string
}

/**
 * GET /api/support/my-tickets
 *
 * Retorna os chamados ativos do suporte onde o requester_email
 * bate com o e-mail do usuario interno autenticado.
 *
 * Quando o backend nao estiver disponivel, retorna lista vazia
 * para nao bloquear o ambiente de desenvolvimento.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/support/my-tickets`, {
      headers: proxyHeaders(request, { withAuth: true }),
    })

    if (!response.ok) {
      // Backend indisponivel ou erro: retorna lista vazia para nao bloquear
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "Nao autorizado" } },
          { status: response.status }
        )
      }

      return NextResponse.json({ success: true, data: [] as MyTicket[] })
    }

    const data = (await response.json()) as MyTicket[]
    return NextResponse.json({ success: true, data })
  } catch {
    // Backend offline (desenvolvimento local sem backend) → lista vazia
    return NextResponse.json({ success: true, data: [] as MyTicket[] })
  }
}
