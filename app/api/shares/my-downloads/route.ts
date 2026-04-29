import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL, proxyHeaders, serverError } from "@/lib/api/route-handler-utils"

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/shares/my-downloads`,
      { headers: proxyHeaders(request, { withAuth: true }) }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: (err as Record<string, unknown>)?.detail ?? "Erro ao buscar downloads" },
        { status: res.status }
      )
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    // Fallback modo demo para desenvolvimento local sem backend
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ downloads: [], total: 0 })
    }
    return serverError("GET /shares/my-downloads", error)
  }
}
