import { NextRequest } from "next/server"
import { proxyGET, proxyDELETE } from "@/lib/api/route-handler-utils"

/** GET /api/shares/[shareId] → GET /v1/shares/{shareId} */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  return proxyGET(request, `/api/v1/shares/${shareId}`, {
    errorCode: "GET_SHARE_FAILED",
    errorMessage: "Erro ao buscar compartilhamento",
    successShape: "wrap",
  })
}

/** DELETE /api/shares/[shareId] → DELETE /v1/shares/{shareId} */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  return proxyDELETE(request, `/api/v1/shares/${shareId}`, {
    errorCode: "DELETE_SHARE_FAILED",
    errorMessage: "Erro ao excluir compartilhamento",
    successShape: "wrap",
  })
}
