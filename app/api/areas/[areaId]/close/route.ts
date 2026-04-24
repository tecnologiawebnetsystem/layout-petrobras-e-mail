import { NextRequest } from "next/server"
import { proxyJSON } from "@/lib/api/route-handler-utils"

/** POST /api/areas/[areaId]/close → POST /v1/areas/{areaId}/close */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ areaId: string }> }
) {
  const { areaId } = await params
  return proxyJSON("POST", request, `/api/v1/areas/${areaId}/close`, { successShape: "wrap" })
}
