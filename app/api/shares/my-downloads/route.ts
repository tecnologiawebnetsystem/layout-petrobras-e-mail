import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000/api/v1"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")

  try {
    const res = await fetch(`${BACKEND}/shares/my-downloads`, {
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err?.detail ?? "Erro ao buscar downloads" }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    // Fallback modo demo para desenvolvimento
    return NextResponse.json({
      downloads: [],
      total: 0,
    })
  }
}
