import { NextRequest } from "next/server"
import { proxyDownload } from "@/lib/api/route-handler-utils"

/** GET /api/admin/export/users → CSV de usuários (Monitor). */
export async function GET(request: NextRequest) {
  return proxyDownload(request, "/api/v1/admin/export/users.csv", {
    fallbackContentType: "text/csv; charset=utf-8",
    fallbackFilename: "usuarios.csv",
    errorCode: "EXPORT_USERS_FAILED",
  })
}
