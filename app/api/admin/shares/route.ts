import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/admin/shares → GET /api/v1/admin/shares */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/admin/shares")
}
