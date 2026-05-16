import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/auth/external/verify-code → POST /v1/auth/external/verify-code (público) */
export async function POST(request: NextRequest) {
  return proxyJSON("POST", request, "/api/v1/auth/external/verify-code", { withAuth: false })
}
