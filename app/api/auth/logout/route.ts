/**
 * POST /api/auth/logout
 * Logout via Neon PostgreSQL - invalida sessao
 */

import { NextRequest, NextResponse } from "next/server"
import { deleteSession, getSessionByAccessToken, createAuditLog } from "@/lib/db/queries"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Token de autenticacao nao fornecido" } },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]

    // Buscar sessao para log
    const session = await getSessionByAccessToken(token)
    if (session) {
      await createAuditLog({
        action: "logout",
        level: "info",
        user_id: session.user_id,
        user_name: session.user_name,
        user_email: session.user_email,
        user_type: session.user_type,
        description: "Logout realizado com sucesso",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      })
    }

    // Deletar sessao
    await deleteSession(token)

    return NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso",
    })
  } catch (error) {
    console.error("[API] Logout error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
