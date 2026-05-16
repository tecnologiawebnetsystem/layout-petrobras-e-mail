import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/files → GET /v1/files/ */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/files/", {
    errorCode: "FETCH_FAILED",
    errorMessage: "Erro ao buscar arquivos",
  })
}
