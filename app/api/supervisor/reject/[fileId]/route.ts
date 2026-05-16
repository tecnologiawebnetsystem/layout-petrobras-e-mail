import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/supervisor/reject/[fileId] → POST /v1/supervisor/reject/{fileId} */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params
  return proxyJSON("POST", request, `/api/v1/supervisor/reject/${fileId}`, {
    errorCode: "REJECT_FAILED",
    errorMessage: "Erro ao rejeitar",
    successShape: "wrap",
  })
}
