import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/supervisor/shares → GET /v1/supervisor/shares
 *
 * Retorna todos os compartilhamentos dos supervisionados (pending + active + rejected).
 * Suporta query param ?status=pending|active|rejected
 */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/supervisor/shares", {
    errorCode: "FETCH_FAILED",
    errorMessage: "Erro ao buscar compartilhamentos",
  })
}
