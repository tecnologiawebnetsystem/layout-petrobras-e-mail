/**
 * GET /api/audit/metrics
 * Metricas do sistema via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionByAccessToken, getAuditMetrics } from "@/lib/db/queries"
import { sql } from "@/lib/db/neon"

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

    // Buscar metricas de auditoria
    const auditMetrics = await getAuditMetrics()

    // Metricas de arquivos
    const uploadCounts = await sql`
      SELECT status, COUNT(*)::int as count FROM file_uploads GROUP BY status
    `
    const statusMap: Record<string, number> = {}
    for (const row of uploadCounts) {
      statusMap[row.status as string] = row.count as number
    }

    const totalUploads = Object.values(statusMap).reduce((a, b) => a + b, 0)
    const totalDownloads = await sql`SELECT COUNT(*)::int as count FROM download_logs`
    const uniqueDownloaders = await sql`SELECT COUNT(DISTINCT downloaded_by_email)::int as count FROM download_logs`
    const activeInternals = await sql`SELECT COUNT(*)::int as count FROM users WHERE user_type IN ('internal','supervisor') AND is_active = true`
    const activeExternals = await sql`SELECT COUNT(*)::int as count FROM users WHERE user_type = 'external' AND is_active = true`
    const uploadsToday = await sql`SELECT COUNT(*)::int as count FROM file_uploads WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'`
    const uploadsWeek = await sql`SELECT COUNT(*)::int as count FROM file_uploads WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'`
    const uploadsMonth = await sql`SELECT COUNT(*)::int as count FROM file_uploads WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'`

    // Top senders
    const topSenders = await sql`
      SELECT u.name, u.email, COUNT(*)::int as count
      FROM file_uploads f
      JOIN users u ON u.id = f.sender_id
      GROUP BY u.name, u.email
      ORDER BY count DESC
      LIMIT 5
    `

    // Top recipients
    const topRecipients = await sql`
      SELECT recipient_email as email, COUNT(*)::int as count
      FROM file_uploads
      GROUP BY recipient_email
      ORDER BY count DESC
      LIMIT 5
    `

    return NextResponse.json({
      success: true,
      data: {
        totalUploads,
        pendingApprovals: statusMap.pending || 0,
        approvedFiles: statusMap.approved || 0,
        rejectedFiles: statusMap.rejected || 0,
        cancelledFiles: statusMap.cancelled || 0,
        totalDownloads: totalDownloads[0]?.count || 0,
        uniqueDownloaders: uniqueDownloaders[0]?.count || 0,
        totalInternalUsers: activeInternals[0]?.count || 0,
        totalExternalUsers: activeExternals[0]?.count || 0,
        uploadsToday: uploadsToday[0]?.count || 0,
        uploadsThisWeek: uploadsWeek[0]?.count || 0,
        uploadsThisMonth: uploadsMonth[0]?.count || 0,
        auditMetrics,
        topSenders: topSenders.map((s) => ({ name: s.name, email: s.email, count: s.count })),
        topRecipients: topRecipients.map((r) => ({ email: r.email, count: r.count })),
      },
    })
  } catch (error) {
    console.error("[API] Get metrics error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
