import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/diagnostico/parameters → GET /api/v1/diagnostico/parameters */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/diagnostico/parameters", { withAuth: false })
}
