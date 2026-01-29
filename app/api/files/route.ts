/**
 * GET /api/files - Listar arquivos do usuario
 * 
 * Query params:
 * - status: pending | approved | rejected | cancelled
 * - page: numero da pagina
 * - limit: itens por pagina
 * - sortBy: campo para ordenacao
 * - order: asc | desc
 * 
 * Integracao com backend Python: GET /v1/files
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
    const status = searchParams.get("status")
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "10"
    const sortBy = searchParams.get("sortBy") || "created_at"
    const order = searchParams.get("order") || "desc"

    // Construir URL com query params
    const queryParams = new URLSearchParams()
    if (status) queryParams.append("status", status)
    queryParams.append("page", page)
    queryParams.append("limit", limit)
    queryParams.append("sort_by", sortBy)
    queryParams.append("order", order)

    // Chamada para o backend Python
    const response = await fetch(
      `${BACKEND_URL}/v1/files?${queryParams.toString()}`,
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
            message: "Erro ao buscar arquivos",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        recipientEmail: file.recipient_email,
        description: file.description,
        files: file.files.map((f: any) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        })),
        status: file.status,
        expirationHours: file.expiration_hours,
        expiresAt: file.expires_at,
        createdAt: file.created_at,
        approvedAt: file.approved_at,
        approvedBy: file.approved_by,
        rejectionReason: file.rejection_reason,
      })),
      pagination: {
        currentPage: data.pagination.current_page,
        totalPages: data.pagination.total_pages,
        totalItems: data.pagination.total_items,
        itemsPerPage: data.pagination.items_per_page,
      },
    })
  } catch (error) {
    console.error("[API] Get files error:", error)
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
