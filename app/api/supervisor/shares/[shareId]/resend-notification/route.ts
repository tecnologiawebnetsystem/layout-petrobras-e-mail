import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/supervisor/shares/[shareId]/resend-notification → POST /v1/supervisor/shares/{shareId}/resend-notification */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  return proxyJSON("POST", request, `/api/v1/supervisor/shares/${shareId}/resend-notification`, {
    errorCode: "RESEND_NOTIFICATION_FAILED",
    errorMessage: "Erro ao reenviar notificação",
    successShape: "wrap",
  })
}
