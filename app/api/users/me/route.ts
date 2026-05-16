import { NextRequest } from "next/server"
import { proxyGET, proxyJSON } from "@/lib/api/route-handler-utils"

/** GET /api/users/me → GET /v1/users/me */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/users/me", {
    errorCode: "AUTH_FAILED",
    errorMessage: "Não autorizado",
    successShape: "wrap",
  })
}

/** PUT /api/users/me → PUT /v1/users/me */
export async function PUT(request: NextRequest) {
  return proxyJSON("PUT", request, "/api/v1/users/me", {
    errorCode: "UPDATE_FAILED",
    errorMessage: "Erro ao atualizar",
    successShape: "wrap",
  })
}
