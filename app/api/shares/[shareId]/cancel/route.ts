import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** PATCH /api/shares/[shareId]/cancel → PATCH /v1/shares/{shareId}/cancel */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  return proxyJSON("PATCH", request, `/api/v1/shares/${shareId}/cancel`, {
    errorCode: "CANCEL_SHARE_FAILED",
    errorMessage: "Erro ao cancelar compartilhamento",
    successShape: "wrap",
  })
}
