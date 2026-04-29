import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000/api/v1"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const authHeader = req.headers.get("authorization")

  try {
    const res = await fetch(`${BACKEND}/support/registrations/${id}/shares`, {
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err?.detail ?? "Erro ao buscar shares" }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({ data })
  } catch {
    // Fallback demo: retorna lista vazia
    return NextResponse.json({ data: [] })
  }
}
