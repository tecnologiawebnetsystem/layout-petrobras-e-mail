import { NextRequest } from "next/server"
import { proxyGET, proxyJSON } from "@/lib/api/route-handler-utils"

/** GET /api/areas → GET /v1/areas/ */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/areas/")
}

/** POST /api/areas → POST /v1/areas/ */
export async function POST(request: NextRequest) {
  return proxyJSON("POST", request, "/api/v1/areas/", { successShape: "wrap" })
}
