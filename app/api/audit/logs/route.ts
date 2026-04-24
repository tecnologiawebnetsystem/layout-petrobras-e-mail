import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/**
 * GET /api/audit/logs → GET /v1/audit/logs
 * audit-log-store espera: { logs: [...], pagination: {...} }
 */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/audit/logs")
}
