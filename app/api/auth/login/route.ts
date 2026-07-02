import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/api/route-handler-utils";


/**
 * HELPER DE RESPONSE
 */

function jsonResponse(
  body: unknown,
  init?: ResponseInit,
) {
  const response = NextResponse.json(body, init);

  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );

  return response;
}

/**
 * Funcao auxiliar para criar delay (para visualizar o loader)
 * REMOVER APOS TESTES
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type LoginResponse = {
  detail?: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: unknown;
};

async function safeJsonParse<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * POST /api/auth/login
 */
export async function POST(request: NextRequest) {
  // REMOVER APOS TESTES
  await delay(3000);

  let body: {
    email?: string;
    password?: string;
  } | null = null;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        success: false,
        error: {
          code: "INVALID_JSON",
          message: "Payload invalido",
        },
      },
      {
        status: 400,
        headers: {
          "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        },
      },
    );
  }

  if (!body) {
    return jsonResponse(
      {
        success: false,
        error: {
          code: "INVALID_JSON",
          message: "Payload invalido",
        },
      },
      { status: 400 },
    );
  }

  const { email, password } = body;

  if (!email || !password) {
    return jsonResponse(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Email e senha sao obrigatorios",
        },
      },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await safeJsonParse<LoginResponse>(backendResponse);

    if (backendResponse.ok) {
      return jsonResponse(
        data ?? {
          success: true,
        },
      );
    }

    if (backendResponse.status === 401) {
      return jsonResponse(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: data?.detail ?? "Credenciais invalidas",
          },
        },
        { status: 401 },
      );
    }

    return jsonResponse(
      {
        success: false,
        error: {
          code: "AUTH_ERROR",
          message: data?.detail ?? "Falha na autenticacao",
        },
      },
      { status: backendResponse.status },
    );
  } catch (error) {
    console.error("[auth/login]", error);

    return jsonResponse(
      {
        success: false,
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: "Servico de autenticacao indisponivel",
        },
      },
      { status: 503 },
    );
  }
}
