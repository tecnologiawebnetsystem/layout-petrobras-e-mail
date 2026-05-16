import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/shares/[shareId]/email-logs → GET /v1/shares/{shareId}/email-logs */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  return proxyGET(request, `/api/v1/shares/${shareId}/email-logs`, {
    errorCode: "GET_EMAIL_LOGS_FAILED",
    errorMessage: "Erro ao buscar histórico de e-mails",
  })
}
