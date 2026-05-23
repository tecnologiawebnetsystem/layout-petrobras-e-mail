import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/admin/dashboard → GET /api/v1/admin/dashboard */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/admin/dashboard")
}
