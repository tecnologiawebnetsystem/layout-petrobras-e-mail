import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/**
 * GET /api/audit/metrics → GET /v1/audit/metrics
 * audit-log-store espera: { total_uploads, pending_approvals, ... } (AuditMetrics)
 */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/audit/metrics")
}
