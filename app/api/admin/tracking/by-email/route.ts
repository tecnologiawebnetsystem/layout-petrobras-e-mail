import { NextRequest } from "next/server"
import { proxyGET } from "@/lib/api/route-handler-utils"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")
  
  if (!email) {
    return new Response(JSON.stringify({ detail: "Email é obrigatório" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
  
  return proxyGET(request, `/admin/tracking/by-email?email=${encodeURIComponent(email)}`)
}
