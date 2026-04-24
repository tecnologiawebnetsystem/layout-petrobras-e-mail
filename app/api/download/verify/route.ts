import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/download/verify → POST /v1/download/verify (público) */
export async function POST(request: NextRequest) {
  return proxyJSON("POST", request, "/api/v1/download/verify", {
    withAuth: false,
    errorCode: "VERIFY_FAILED",
    errorMessage: "Erro na verificação",
  })
}
