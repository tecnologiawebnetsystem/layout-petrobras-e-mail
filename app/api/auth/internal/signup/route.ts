import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/auth/internal/signup → POST /v1/auth/internal/signup (público) */
export async function POST(request: NextRequest) {
  return proxyJSON("POST", request, "/api/v1/auth/internal/signup", { withAuth: false })
}
