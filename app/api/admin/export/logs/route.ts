import { NextRequest } from "next/server"
import { proxyDownload } from "@/lib/api/route-handler-utils"

/** GET /api/admin/export/logs → CSV de logs de auditoria (Monitor). */
export async function GET(request: NextRequest) {
  return proxyDownload(request, "/api/v1/admin/export/logs.csv", {
    fallbackContentType: "text/csv; charset=utf-8",
    fallbackFilename: "logs_auditoria.csv",
    errorCode: "EXPORT_LOGS_FAILED",
  })
}
