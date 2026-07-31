import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/mip/auth/device-code -> POST /v1/mip/auth/device-code */
export async function POST(request: NextRequest) {
  return proxyJSON("POST", request, "/api/v1/mip/auth/device-code", {
    errorCode: "MIP_AUTH_FAILED",
    errorMessage: "Falha ao iniciar autenticação MIP",
  })
}
