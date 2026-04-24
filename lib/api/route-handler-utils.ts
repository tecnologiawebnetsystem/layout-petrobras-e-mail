/**
 * Utilitários BFF – Route Handler Utils
 *
 * Centraliza o padrão de proxy para o csa-backend (FastAPI).
 * Elimina código repetido nos ~40 route handlers de `app/api/`.
 *
 * Uso típico:
 *   import { proxyGET, proxyJSON, proxyDELETE } from "@/lib/api/route-handler-utils"
 *
 *   export async function GET(request: NextRequest) {
 *     return proxyGET(request, "/api/v1/files/")
 *   }
 */

import { NextRequest, NextResponse } from "next/server"

// ─────────────────────────────────────────────────────────────────────────────
// Constante base
// ─────────────────────────────────────────────────────────────────────────────

/** URL do backend Python. Variável privada – nunca usar NEXT_PUBLIC_. */
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8080"

// ─────────────────────────────────────────────────────────────────────────────
// Headers
// ─────────────────────────────────────────────────────────────────────────────

/** Headers de rastreabilidade: X-Forwarded-For e User-Agent. */
export function forwardedHeaders(request: NextRequest): Record<string, string> {
  return {
    "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "",
    "User-Agent": request.headers.get("user-agent") ?? "",
  }
}

/**
 * Monta os headers padrão de proxy ao backend.
 *
 * Por padrão inclui:
 * - Authorization (do cliente → backend)
 * - X-Forwarded-For / User-Agent
 *
 * @param opts.withAuth      false → omite Authorization (rotas públicas)
 * @param opts.withContentType true → adiciona Content-Type: application/json
 */
export function proxyHeaders(
  request: NextRequest,
  opts: { withAuth?: boolean; withContentType?: boolean } = {}
): Record<string, string> {
  const headers: Record<string, string> = { ...forwardedHeaders(request) }

  if (opts.withAuth !== false) {
    headers["Authorization"] = request.headers.get("authorization") ?? ""
  }
  if (opts.withContentType) {
    headers["Content-Type"] = "application/json"
  }

  return headers
}

// ─────────────────────────────────────────────────────────────────────────────
// Query String
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna `?param=value&...` se houver query params, ou string vazia.
 * Pronto para concatenar em URLs: `${BACKEND_URL}/v1/files${qs(request)}`.
 */
export function qs(request: NextRequest): string {
  const s = request.nextUrl.searchParams.toString()
  return s ? `?${s}` : ""
}

// ─────────────────────────────────────────────────────────────────────────────
// Tratamento de Resposta
// ─────────────────────────────────────────────────────────────────────────────

export interface HandleResponseOpts {
  /** Código de erro para respostas HTTP não-OK */
  errorCode?: string
  /** Mensagem de fallback quando o backend não retorna `detail` */
  errorMessage?: string
  /**
   * Estratégia de formatação da resposta bem-sucedida:
   * - "passthrough" (padrão) → retorna `data` diretamente
   * - "wrap"       → `{ success: true, data }`
   * - "spread"     → `{ success: true, ...data }`
   */
  successShape?: "passthrough" | "wrap" | "spread"
}

/**
 * Lê o JSON da resposta e retorna um `NextResponse` padronizado.
 *
 * Em caso de erro HTTP retorna:
 * ```json
 * { "success": false, "error": { "code": "...", "message": "..." } }
 * ```
 */
export async function handleProxyResponse(
  response: Response,
  opts: HandleResponseOpts = {}
): Promise<NextResponse> {
  const data = (await response.json()) as Record<string, unknown>

  if (!response.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: opts.errorCode ?? "REQUEST_FAILED",
          message: (data.detail as string) ?? opts.errorMessage ?? "Erro na requisição",
        },
      },
      { status: response.status }
    )
  }

  switch (opts.successShape) {
    case "wrap":
      return NextResponse.json({ success: true, data })
    case "spread":
      return NextResponse.json({ success: true, ...data })
    default:
      return NextResponse.json(data)
  }
}

/**
 * Retorna erro 500 padronizado e registra no log do servidor.
 *
 * ```ts
 * } catch (error) {
 *   return serverError("GET /api/v1/files", error)
 * }
 * ```
 */
export function serverError(tag: string, error: unknown): NextResponse {
  console.error(`[API] ${tag}:`, error)
  return NextResponse.json(
    { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
    { status: 500 }
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de alto nível  (proxy por método HTTP)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProxyOpts extends HandleResponseOpts {
  /** false → omite Authorization (rotas públicas, e.g. login, download auth) */
  withAuth?: boolean
  /** Sobrescreve o método HTTP enviado ao backend (ex: frontend POST → backend PUT) */
  backendMethod?: string
}

/**
 * Proxy **GET** – inclui query string automaticamente.
 *
 * ```ts
 * export async function GET(request: NextRequest) {
 *   return proxyGET(request, "/api/v1/files/")
 * }
 * ```
 */
export async function proxyGET(
  request: NextRequest,
  backendPath: string,
  opts: ProxyOpts = {}
): Promise<NextResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}${backendPath}${qs(request)}`, {
      headers: proxyHeaders(request, { withAuth: opts.withAuth }),
    })
    return handleProxyResponse(response, opts)
  } catch (error) {
    return serverError(`GET ${backendPath}`, error)
  }
}

/**
 * Proxy **POST / PUT / PATCH** com JSON body.
 * Body vazio (ausente ou inválido) é normalizado para `{}`.
 *
 * ```ts
 * export async function POST(request: NextRequest) {
 *   return proxyJSON("POST", request, "/api/v1/shares/", { successShape: "wrap" })
 * }
 * ```
 */
export async function proxyJSON(
  method: "POST" | "PUT" | "PATCH",
  request: NextRequest,
  backendPath: string,
  opts: ProxyOpts = {}
): Promise<NextResponse> {
  try {
    let body: unknown = {}
    try {
      body = await request.json()
    } catch {
      // body ausente ou não-JSON – usa {}
    }

    const response = await fetch(`${BACKEND_URL}${backendPath}`, {
      method: opts.backendMethod ?? method,
      headers: proxyHeaders(request, { withAuth: opts.withAuth, withContentType: true }),
      body: JSON.stringify(body),
    })
    return handleProxyResponse(response, opts)
  } catch (error) {
    return serverError(`${method} ${backendPath}`, error)
  }
}

/**
 * Proxy **DELETE** (sem body).
 *
 * ```ts
 * export async function DELETE(request: NextRequest, { params }) {
 *   const { fileId } = await params
 *   return proxyDELETE(request, `/api/v1/files/${fileId}`, { successShape: "spread" })
 * }
 * ```
 */
export async function proxyDELETE(
  request: NextRequest,
  backendPath: string,
  opts: ProxyOpts = {}
): Promise<NextResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}${backendPath}`, {
      method: "DELETE",
      headers: proxyHeaders(request, { withAuth: opts.withAuth }),
    })
    return handleProxyResponse(response, opts)
  } catch (error) {
    return serverError(`DELETE ${backendPath}`, error)
  }
}

/**
 * Proxy **POST** com FormData (multipart).
 * Não define Content-Type – o browser/runtime inclui o boundary automaticamente.
 *
 * ```ts
 * export async function POST(request: NextRequest) {
 *   return proxyFormData(request, "/api/v1/files/upload")
 * }
 * ```
 */
export async function proxyFormData(
  request: NextRequest,
  backendPath: string,
  opts: ProxyOpts = {}
): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const response = await fetch(`${BACKEND_URL}${backendPath}`, {
      method: "POST",
      // Sem Content-Type → Node/fetch define o boundary do multipart automaticamente
      headers: proxyHeaders(request, { withAuth: opts.withAuth }),
      body: formData,
    })
    return handleProxyResponse(response, opts)
  } catch (error) {
    return serverError(`FormData POST ${backendPath}`, error)
  }
}
