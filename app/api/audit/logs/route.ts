/**
 * GET /api/audit/logs
 * 
 * Lista logs de auditoria do sistema
 * Apenas supervisores/admins podem acessar
 * 
 * Query params:
 * - userId: filtrar por usuario
 * - action: filtrar por acao (login, logout, upload, approve, reject, download, etc)
 * - fileId: filtrar por arquivo
 * - startDate: data inicial (ISO 8601)
 * - endDate: data final (ISO 8601)
 * - level: filtrar por nivel (info, warning, error, success)
 * - page: numero da pagina
 * - limit: itens por pagina
 * 
 * Integracao com backend Python: GET /v1/audit/logs
 */

import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

// Helper para extrair token do header
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.split(" ")[1]
}

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Token de autenticacao nao fornecido",
          },
        },
        { status: 401 }
      )
    }

    // Extrair query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const action = searchParams.get("action")
    const fileId = searchParams.get("fileId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const level = searchParams.get("level")
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "50"

    // Construir query params
    const queryParams = new URLSearchParams()
    if (userId) queryParams.append("user_id", userId)
    if (action) queryParams.append("action", action)
    if (fileId) queryParams.append("file_id", fileId)
    if (startDate) queryParams.append("start_date", startDate)
    if (endDate) queryParams.append("end_date", endDate)
    if (level) queryParams.append("level", level)
    queryParams.append("page", page)
    queryParams.append("limit", limit)

    // Chamada para o backend Python
    const response = await fetch(
      `${BACKEND_URL}/v1/audit/logs?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "FETCH_FAILED",
            message: "Erro ao buscar logs de auditoria",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: data.logs.map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp,
        action: log.action,
        level: log.level,
        user: {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email,
          type: log.user.type,
          employeeId: log.user.employee_id,
        },
        details: {
          targetId: log.details.target_id,
          targetName: log.details.target_name,
          description: log.details.description,
          ipAddress: log.details.ip_address,
          metadata: log.details.metadata,
        },
      })),
      pagination: data.pagination ? {
        currentPage: data.pagination.current_page,
        totalPages: data.pagination.total_pages,
        totalItems: data.pagination.total_items,
        itemsPerPage: data.pagination.items_per_page,
      } : null,
    })
  } catch (error) {
    console.error("[API] Get audit logs error:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Erro interno do servidor",
        },
      },
      { status: 500 }
    )
  }
}
