import { NextRequest } from "next/server"
import { proxyGET, proxyDELETE } from "@/lib/api/route-handler-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  return proxyGET(request, `/api/v1/mip/auth/token/${sessionId}`, {
    errorCode: "MIP_AUTH_POLL_FAILED",
    errorMessage: "Falha ao verificar autenticação MIP",
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  return proxyDELETE(request, `/api/v1/mip/auth/${sessionId}`)
}