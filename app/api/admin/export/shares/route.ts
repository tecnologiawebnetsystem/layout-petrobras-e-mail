import { NextRequest } from "next/server"
import { proxyDownload } from "@/lib/api/route-handler-utils"

/** GET /api/admin/export/shares → CSV de compartilhamentos (Monitor). */
export async function GET(request: NextRequest) {
  return proxyDownload(request, "/api/v1/admin/export/shares.csv", {
    fallbackContentType: "text/csv; charset=utf-8",
    fallbackFilename: "compartilhamentos.csv",
    errorCode: "EXPORT_SHARES_FAILED",
  })
}
