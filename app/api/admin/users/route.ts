import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/admin/users → GET /api/v1/admin/users */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/admin/users")
}
