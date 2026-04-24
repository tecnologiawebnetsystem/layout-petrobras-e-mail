import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL, proxyHeaders, serverError } from "@/lib/api/route-handler-utils"

/**
 * POST /api/auth/forgot-password → POST /v1/auth/forgot-password (público)
 * Sempre retorna 200 independente do backend (não vaza existência de e-mail).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: proxyHeaders(request, { withAuth: false, withContentType: true }),
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return NextResponse.json({
      success: true,
      message: (data as { message?: string }).message ?? "Se o email estiver cadastrado, você receberá instruções",
    })
  } catch (error) {
    return serverError("POST /api/v1/auth/forgot-password", error)
  }
}
