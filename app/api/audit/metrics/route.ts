/**
 * GET /api/audit/metrics
 * 
 * Retorna metricas gerais do sistema
 * Apenas supervisores/admins podem acessar
 * 
 * Integracao com backend Python: GET /v1/audit/metrics
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

    // Extrair query params para periodo
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d" // 7d, 30d, 90d, all

    // Chamada para o backend Python
    const response = await fetch(
      `${BACKEND_URL}/v1/audit/metrics?period=${period}`,
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
            message: "Erro ao buscar metricas",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        // Metricas de arquivos
        totalUploads: data.total_uploads,
        pendingApprovals: data.pending_approvals,
        approvedFiles: data.approved_files,
        rejectedFiles: data.rejected_files,
        cancelledFiles: data.cancelled_files,
        expiredFiles: data.expired_files,
        
        // Metricas de downloads
        totalDownloads: data.total_downloads,
        uniqueDownloaders: data.unique_downloaders,
        
        // Metricas de usuarios
        activeUsers: data.active_users,
        totalInternalUsers: data.total_internal_users,
        totalExternalUsers: data.total_external_users,
        
        // Metricas de armazenamento
        storageUsed: data.storage_used,
        storageLimit: data.storage_limit,
        storagePercentage: data.storage_percentage,
        
        // Metricas de tempo
        averageApprovalTime: data.average_approval_time, // em minutos
        averageDownloadTime: data.average_download_time, // tempo ate primeiro download
        
        // Metricas por periodo
        uploadsToday: data.uploads_today,
        uploadsThisWeek: data.uploads_this_week,
        uploadsThisMonth: data.uploads_this_month,
        
        // Tendencias
        trends: data.trends ? {
          uploads: data.trends.uploads, // array de valores diarios
          downloads: data.trends.downloads,
          approvals: data.trends.approvals,
        } : null,
        
        // Top senders
        topSenders: data.top_senders ? data.top_senders.map((sender: any) => ({
          name: sender.name,
          email: sender.email,
          count: sender.count,
        })) : [],
        
        // Top recipients
        topRecipients: data.top_recipients ? data.top_recipients.map((recipient: any) => ({
          email: recipient.email,
          count: recipient.count,
        })) : [],
      },
    })
  } catch (error) {
    console.error("[API] Get metrics error:", error)
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
