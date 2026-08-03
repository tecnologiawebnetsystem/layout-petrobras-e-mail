import { NextRequest } from "next/server"
import { proxyDownload } from "@/lib/api/route-handler-utils"

/** GET /api/supervisor/export/shares → CSV de compartilhamentos (Gestor). */
export async function GET(request: NextRequest) {
  return proxyDownload(request, "/api/v1/supervisor/export/shares.csv", {
    fallbackContentType: "text/csv; charset=utf-8",
    fallbackFilename: "compartilhamentos_gestor.csv",
    errorCode: "EXPORT_SUPERVISOR_SHARES_FAILED",
  })
}
