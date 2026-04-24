import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/download/files/[fileId]/url → GET /v1/download/files/{fileId}/url */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params
  return proxyGET(request, `/api/v1/download/files/${fileId}/url`, {
    errorCode: "DOWNLOAD_FAILED",
    errorMessage: "Erro ao gerar URL",
  })
}
