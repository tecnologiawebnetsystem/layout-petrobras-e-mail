import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL, proxyHeaders, serverError } from "@/lib/api/route-handler-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/support/registrations/${id}/shares`,
      { headers: proxyHeaders(request, { withAuth: true }) }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: (err as Record<string, unknown>)?.detail ?? "Erro ao buscar shares" },
        { status: res.status }
      )
    }
    const data = await res.json()
    return NextResponse.json({ data })
  } catch (error) {
    // Fallback modo demo: retorna lista vazia para nao bloquear desenvolvimento
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ data: [] })
    }
    return serverError(`GET /support/registrations/${id}/shares`, error)
  }
}
