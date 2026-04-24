import { NextRequest } from "next/server"
import { proxyGET, proxyDELETE } from "@/lib/api/route-handler-utils"

/** GET /api/files/[fileId] → GET /v1/files/{fileId} */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params
  return proxyGET(request, `/api/v1/files/${fileId}`, {
    errorCode: "NOT_FOUND",
    errorMessage: "Arquivo não encontrado",
  })
}

/** DELETE /api/files/[fileId] → DELETE /v1/files/{fileId} */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params
  return proxyDELETE(request, `/api/v1/files/${fileId}`, {
    errorCode: "DELETE_FAILED",
    errorMessage: "Erro ao cancelar",
    successShape: "spread",
  })
}
