import { NextRequest } from "next/server"
import { proxyGET, proxyJSON } from "@/lib/api/route-handler-utils"

/**
 * GET /api/support/solicitations?email=xxx@petrobras.com.br
 *
 * Proxy para GET /api/v1/support/solicitations no backend Python.
 * Retorna SupportRegistrations ativas vinculadas ao e-mail do solicitante.
 */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/support/solicitations")
}

/**
 * POST /api/support/solicitations
 *
 * Proxy para POST /api/v1/support/users no backend Python.
 * Cria um novo usuario externo e registra a SupportRegistration.
 */
export async function POST(request: NextRequest) {
  return proxyJSON("POST", request, "/api/v1/support/users", {
    successShape: "spread",
  })
}
