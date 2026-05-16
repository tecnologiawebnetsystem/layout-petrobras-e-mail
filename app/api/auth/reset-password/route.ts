import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/auth/reset-password → POST /v1/auth/reset-password (público) */
export async function POST(request: NextRequest) {
  return proxyJSON("POST", request, "/api/v1/auth/reset-password", {
    withAuth: false,
    errorCode: "RESET_PASSWORD_FAILED",
    errorMessage: "Erro ao resetar senha",
    successShape: "wrap",
  })
}
