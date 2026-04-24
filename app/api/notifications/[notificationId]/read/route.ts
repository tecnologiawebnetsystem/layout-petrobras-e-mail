import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** PUT /api/notifications/[notificationId]/read → PATCH /v1/notifications/{id}/read */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const { notificationId } = await params
  return proxyJSON("PATCH", request, `/api/v1/notifications/${notificationId}/read`, {
    errorCode: "UPDATE_FAILED",
    errorMessage: "Erro ao marcar notificação",
  })
}
