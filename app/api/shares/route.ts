import { NextRequest } from "next/server"
import { proxyGET, proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/shares → POST /v1/shares/ */
export async function POST(request: NextRequest) {
  return proxyJSON("POST", request, "/api/v1/shares/", {
    errorCode: "CREATE_SHARE_FAILED",
    errorMessage: "Erro ao criar compartilhamento",
    successShape: "wrap",
  })
}

/** GET /api/shares → GET /v1/shares/ */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/shares/", {
    errorCode: "LIST_SHARES_FAILED",
    errorMessage: "Erro ao listar compartilhamentos",
  })
}
