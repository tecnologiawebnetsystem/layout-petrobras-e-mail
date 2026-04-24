import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

/** GET /api/emails/[messageId]/status → GET /v1/emails/{messageId}/status */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params
  return proxyGET(request, `/api/v1/emails/${messageId}/status`)
}
