import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/shares/[shareId]/resend → POST /v1/shares/{shareId}/resend */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  return proxyJSON("POST", request, `/api/v1/shares/${shareId}/resend`, {
    errorCode: "RESEND_SHARE_FAILED",
    errorMessage: "Erro ao reenviar email",
    successShape: "wrap",
  })
}
