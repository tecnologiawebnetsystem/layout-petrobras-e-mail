import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL, proxyHeaders, serverError } from "@/lib/api/route-handler-utils"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/support/registrations/${id}/encerrar`,
      {
        method: "PATCH",
        headers: proxyHeaders(request, { withAuth: true, withContentType: true }),
      }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: (err as Record<string, unknown>)?.detail ?? "Erro ao encerrar chamado" },
        { status: res.status }
      )
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return serverError(`PATCH /support/registrations/${id}/encerrar`, error)
  }
}
