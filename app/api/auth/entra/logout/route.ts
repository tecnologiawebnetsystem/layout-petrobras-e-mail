import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/auth/entra/logout → POST /api/v1/auth/entra/logout */
export async function POST(request: NextRequest) {
  return proxyJSON("POST", request, "/api/v1/auth/entra/logout")
}
