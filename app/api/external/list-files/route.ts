import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/external/list-files → GET /v1/external/list-files */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/external/list-files")
}
