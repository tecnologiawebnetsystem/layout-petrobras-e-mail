import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/auth/cav4/session-check -> GET /api/v1/auth/cav4/session-check */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/auth/cav4/session-check")
}
