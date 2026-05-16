import { NextRequest } from "next/server"
import { proxyFormData } from "@/lib/api/route-handler-utils"

/** POST /api/external/logout → POST /v1/external/logout (FormData, público) */
export async function POST(request: NextRequest) {
  return proxyFormData(request, "/api/v1/external/logout", { withAuth: false })
}
