import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/external/ack → POST /v1/external/ack */
export async function POST(request: NextRequest) {
  return proxyJSON("POST", request, "/api/v1/external/ack")
}
