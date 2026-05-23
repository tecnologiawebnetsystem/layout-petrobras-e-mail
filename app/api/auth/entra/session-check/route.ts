import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/auth/entra/session-check → GET /api/v1/auth/entra/session-check */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/auth/entra/session-check")
}
