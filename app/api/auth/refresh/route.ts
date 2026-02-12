/**
 * POST /api/auth/refresh
 * Renovar tokens de autenticacao via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionByRefreshToken, deleteSession, createSession, getUserById } from "@/lib/db/queries"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_TOKEN", message: "Refresh token e obrigatorio" } },
        { status: 400 }
      )
    }

    const session = await getSessionByRefreshToken(refreshToken)
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_TOKEN", message: "Token expirado ou invalido" } },
        { status: 401 }
      )
    }

    if (new Date(session.expires_at) < new Date()) {
      await deleteSession(session.access_token)
      return NextResponse.json(
        { success: false, error: { code: "TOKEN_EXPIRED", message: "Sessao expirada. Faca login novamente." } },
        { status: 401 }
      )
    }

    const user = await getUserById(session.user_id)
    if (!user) {
      await deleteSession(session.access_token)
      return NextResponse.json(
        { success: false, error: { code: "USER_NOT_FOUND", message: "Usuario nao encontrado" } },
        { status: 401 }
      )
    }

    await deleteSession(session.access_token)
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined
    const userAgent = request.headers.get("user-agent") || undefined
    const newSession = await createSession(user.id, ipAddress, userAgent)

    return NextResponse.json({
      success: true,
      data: {
        token: newSession.access_token,
        refreshToken: newSession.refresh_token,
        expiresIn: 86400,
      },
    })
  } catch (error) {
    console.error("[API] Refresh token error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
