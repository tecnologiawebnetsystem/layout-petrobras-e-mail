import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/supervisor/pending → GET /v1/supervisor/pending */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/supervisor/pending", {
    errorCode: "FETCH_FAILED",
    errorMessage: "Erro ao buscar pendentes",
  })
}
