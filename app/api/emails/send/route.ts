import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/emails/send → POST /v1/emails/send */
export async function POST(request: NextRequest) {
  return proxyJSON("POST", request, "/api/v1/emails/send")
}
