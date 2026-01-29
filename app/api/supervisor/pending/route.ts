/**
 * GET /api/supervisor/pending
 * 
 * Lista todos os arquivos pendentes de aprovacao
 * Apenas supervisores podem acessar este endpoint
 * 
 * Integracao com backend Python: GET /v1/supervisor/pending
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

    // Extrair query params para paginacao
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "20"

    // Chamada para o backend Python
    const response = await fetch(
      `${BACKEND_URL}/v1/supervisor/pending?page=${page}&limit=${limit}`,
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
            message: "Erro ao buscar arquivos pendentes",
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
        sender: {
          id: file.sender.id,
          name: file.sender.name,
          email: file.sender.email,
          department: file.sender.department,
          employeeId: file.sender.employee_id,
        },
        files: file.files.map((f: any) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        })),
        expirationHours: file.expiration_hours,
        createdAt: file.created_at,
        workflow: {
          currentStep: file.workflow.current_step,
          totalSteps: file.workflow.total_steps,
          steps: file.workflow.steps,
        },
      })),
      pagination: data.pagination ? {
        currentPage: data.pagination.current_page,
        totalPages: data.pagination.total_pages,
        totalItems: data.pagination.total_items,
      } : null,
    })
  } catch (error) {
    console.error("[API] Get pending files error:", error)
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
