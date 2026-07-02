import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/api/route-handler-utils"

interface CadastroUsuarioRequest {
  numero_solicitacao: string
  email_solicitante: string
  email_usuario_externo: string
}

type BackendResponse = {
  detail?: string
  success?: boolean
  data?: unknown
}

async function safeJsonParse<T>(
  response: Response
): Promise<T | null> {
  const contentType =
    response.headers.get("content-type")

  if (!contentType?.includes("application/json")) {
    return null
  }

  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * POST /api/support/users
 */
export async function POST(request: NextRequest) {
  try {
    let body: CadastroUsuarioRequest | null = null

    try {
      body =
        await request.json() as CadastroUsuarioRequest
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_JSON",
            message: "Payload invalido",
          },
        },
        { status: 400 }
      )
    }

    const {
      numero_solicitacao,
      email_solicitante,
      email_usuario_externo,
    } = body

    if (!numero_solicitacao?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message:
              "Numero da solicitacao e obrigatorio",
          },
        },
        { status: 400 }
      )
    }

    if (
      !email_solicitante?.trim() ||
      !isValidEmail(email_solicitante)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message:
              "E-mail do solicitante invalido",
          },
        },
        { status: 400 }
      )
    }

    if (
      !email_usuario_externo?.trim() ||
      !isValidEmail(email_usuario_externo)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message:
              "E-mail do usuario externo invalido",
          },
        },
        { status: 400 }
      )
    }

    const authHeader =
      request.headers.get("Authorization")

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/support/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader
            ? {
                Authorization: authHeader,
              }
            : {}),
        },
        body: JSON.stringify({
          numero_solicitacao,
          email_solicitante,
          email_usuario_externo,
        }),
      }
    )

    const responseData =
      await safeJsonParse<BackendResponse>(
        backendResponse
      )

    if (backendResponse.ok) {
      return NextResponse.json(
        responseData ?? {
          success: true,
        }
      )
    }

    if (backendResponse.status === 409) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE",
            message:
              "Ja existe um cadastro ativo para este e-mail",
          },
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BACKEND_ERROR",
          message:
            responseData?.detail ??
            "Erro ao cadastrar usuario",
        },
      },
      { status: backendResponse.status }
    )
  } catch (error) {
    console.error(
      "[support/users][POST]",
      error
    )

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            "Erro interno ao processar cadastro",
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/support/users
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const search =
      searchParams.get("search") ?? ""

    const authHeader =
      request.headers.get("Authorization")

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/support/users?search=${encodeURIComponent(search)}`,
      {
        method: "GET",
        headers: {
          ...(authHeader
            ? {
                Authorization: authHeader,
              }
            : {}),
        },
      }
    )

    const responseData =
      await safeJsonParse<BackendResponse>(
        backendResponse
      )

    if (backendResponse.ok) {
      return NextResponse.json(
        responseData ?? {
          success: true,
          data: [],
        }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BACKEND_ERROR",
          message:
            responseData?.detail ??
            "Erro ao listar usuarios",
        },
      },
      { status: backendResponse.status }
    )
  } catch (error) {
    console.error(
      "[support/users][GET]",
      error
    )

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            "Erro interno ao listar usuarios",
        },
      },
      { status: 500 }
    )
  }
}