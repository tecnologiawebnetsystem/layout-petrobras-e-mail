import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/notifications → GET /v1/notifications */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/notifications", {
    errorCode: "FETCH_FAILED",
    errorMessage: "Erro ao buscar notificações",
  })
}
