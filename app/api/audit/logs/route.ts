/**
 * GET /api/audit/logs
 * Listar logs de auditoria via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionByAccessToken, getAuditLogs } from "@/lib/db/queries"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null
  return authHeader.split(" ")[1]
}

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Token de autenticacao nao fornecido" } },
        { status: 401 }
      )
    }

    const session = await getSessionByAccessToken(token)
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sessao invalida ou expirada" } },
        { status: 401 }
      )
    }

    if (session.user_type !== "supervisor") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Acesso restrito a supervisores" } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || undefined
    const level = searchParams.get("level") || undefined
    const user_email = searchParams.get("userId") || searchParams.get("userEmail") || undefined
    const search = searchParams.get("search") || undefined
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const offset = (page - 1) * limit

    const { logs, total } = await getAuditLogs({
      action,
      level,
      user_email,
      search,
      startDate,
      endDate,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        timestamp: log.created_at,
        action: log.action,
        level: log.level,
        user: {
          id: log.user_id,
          name: log.user_name,
          email: log.user_email,
          type: log.user_type,
          employeeId: log.user_employee_id,
        },
        details: {
          targetId: log.target_id,
          targetName: log.target_name,
          description: log.description,
          ipAddress: log.ip_address,
          metadata: log.metadata,
        },
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    })
  } catch (error) {
    console.error("[API] Get audit logs error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
