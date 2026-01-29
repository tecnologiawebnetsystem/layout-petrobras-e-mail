/**
 * GET /api/emails/history
 * Endpoint para listar historico de emails enviados
 * Faz proxy para o backend Python
 */

import { NextRequest, NextResponse } from "next/server"

// URL do backend Python
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET(request: NextRequest) {
  try {
    // Extrair token do header
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader) {
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
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "20"
    const status = searchParams.get("status")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Construir query string
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(status && { status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    })

    // Fazer request para o backend Python
    const backendResponse = await fetch(
      `${BACKEND_URL}/v1/emails/history?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      }
    )

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "HISTORY_FETCH_FAILED",
            message: "Falha ao buscar historico de emails",
          },
        },
        { status: backendResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        emails: data.emails || [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: data.totalPages || 1,
          totalItems: data.totalItems || 0,
          itemsPerPage: parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error("[API] Erro ao buscar historico:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Erro interno do servidor",
        },
      },
      { status: 500 }
    )
  }
}
