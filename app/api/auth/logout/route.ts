import { NextRequest, NextResponse } from "next/server"
import {
  BACKEND_URL,
  proxyHeaders,
} from "@/lib/api/route-handler-utils"

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: proxyHeaders(request, { withContentType: true }),
      body: JSON.stringify({}),
    })

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Logout realizado com sucesso",
      })
    }

    return NextResponse.json({
      success: true,
      backend_success: false,
      message: "Sessão encerrada localmente",
    })
  } catch (error) {
    console.error("Logout error:", error)

    return NextResponse.json({
      success: true,
      backend_success: false,
      message: "Logout local realizado",
    })
  }
}