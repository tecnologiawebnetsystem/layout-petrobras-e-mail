import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/**
 * GET /api/emails/history → GET /v1/emails/history
 * Retorna: { emails: [...], total_pages, total_items }
 */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/emails/history")
}
