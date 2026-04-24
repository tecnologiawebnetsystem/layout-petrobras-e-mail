import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/notifications/read-all → PUT /v1/notifications/read-all */
export async function POST(request: NextRequest) {
  return proxyJSON("PUT", request, "/api/v1/notifications/read-all", {
    errorCode: "UPDATE_FAILED",
    errorMessage: "Erro ao marcar notificações",
  })
}
