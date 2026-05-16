import { NextRequest } from "next/server"
import { proxyFormData } from "@/lib/api/route-handler-utils"

/** POST /api/shares/create → POST /v1/shares/create (multipart/form-data) */
export async function POST(request: NextRequest) {
  return proxyFormData(request, "/api/v1/shares/create", {
    errorCode: "CREATE_SHARE_FAILED",
    errorMessage: "Erro ao criar compartilhamento",
    successShape: "wrap",
  })
}
