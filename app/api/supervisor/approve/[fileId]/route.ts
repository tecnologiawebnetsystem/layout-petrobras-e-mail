import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/supervisor/approve/[fileId] → POST /v1/supervisor/approve/{fileId} */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params
  return proxyJSON("POST", request, `/api/v1/supervisor/approve/${fileId}`, {
    errorCode: "APPROVE_FAILED",
    errorMessage: "Erro ao aprovar",
    successShape: "wrap",
  })
}
