import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** PUT /api/supervisor/extend/[fileId] → PUT /v1/supervisor/extend/{fileId} */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params
  return proxyJSON("PUT", request, `/api/v1/supervisor/extend/${fileId}`, {
    errorCode: "EXTEND_FAILED",
    errorMessage: "Erro ao estender",
    successShape: "wrap",
  })
}
