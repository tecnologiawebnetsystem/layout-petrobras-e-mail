import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/download/authenticate → POST /v1/download/authenticate (público) */
export async function POST(request: NextRequest) {
  return proxyJSON("POST", request, "/api/v1/download/authenticate", {
    withAuth: false,
    errorCode: "AUTH_FAILED",
    errorMessage: "Código inválido",
  })
}
