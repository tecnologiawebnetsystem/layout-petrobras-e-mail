import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/**
 * POST /api/auth/refresh → POST /v1/auth/refresh (público)
 * auth-store envia { refresh_token }; resposta: { access_token, refresh_token, ... }
 */
export async function POST(request: NextRequest) {
  return proxyJSON("POST", request, "/api/v1/auth/refresh", { withAuth: false })
}
