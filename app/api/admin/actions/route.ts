import { NextRequest } from "next/server";
import { proxyGET } from "@/lib/api/route-handler-utils";

/** GET /api/admin/actions → GET /api/v1/admin/actions */
export async function GET(request: NextRequest) {
  return proxyGET(request, "/api/v1/admin/actions");
}
