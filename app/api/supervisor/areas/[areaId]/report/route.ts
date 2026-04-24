import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/supervisor/areas/[areaId]/report → GET /v1/supervisor/areas/{areaId}/report */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ areaId: string }> }
) {
  const { areaId } = await params
  return proxyGET(request, `/api/v1/supervisor/areas/${areaId}/report`, {
    errorCode: "REPORT_FAILED",
    errorMessage: "Erro ao buscar relatório",
    successShape: "wrap",
  })
}
