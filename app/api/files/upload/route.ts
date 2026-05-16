import { NextRequest } from "next/server"
import { proxyFormData } from "@/lib/api/route-handler-utils"

/**
 * POST /api/files/upload → POST /v1/files/upload
 * Repassa FormData diretamente; workflow-store espera: { upload_id, name, files, ... }
 */
export async function POST(request: NextRequest) {
  return proxyFormData(request, "/api/v1/files/upload")
}
