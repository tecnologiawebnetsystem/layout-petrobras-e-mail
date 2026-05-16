import { NextRequest, NextResponse } from "next/server"
import { proxyJSON, BACKEND_URL } from "@/lib/api/route-handler-utils"

/**
 * Usuarios de demonstracao para testes (quando backend nao esta disponivel)
 */
const DEMO_USERS: Record<string, { password: string; user: Record<string, unknown> }> = {
  "kleber@petrobras.com.br": {
    password: "demo123",
    user: {
      id: 1,
      name: "Kleber Linux",
      email: "kleber@petrobras.com.br",
      role: "internal",
      is_supervisor: false,
      department: "TI",
      employee_id: "P12345",
      manager: null,
    },
  },
  "wagner@petrobras.com.br": {
    password: "demo123",
    user: {
      id: 2,
      name: "Wagner Silva",
      email: "wagner@petrobras.com.br",
      role: "supervisor",
      is_supervisor: true,
      department: "Seguranca",
      employee_id: "P67890",
      manager: null,
    },
  },
  "jefferson.breno.prestserv@petrobras.com.br": {
    password: "internal@123",
    user: {
      id: 3,
      name: "Jefferson Breno",
      email: "jefferson.breno.prestserv@petrobras.com.br",
      role: "internal",
      is_supervisor: false,
      department: "TI",
      employee_id: "P11111",
      manager: null,
    },
  },
  "supervisor@petrobras.com.br": {
    password: "supervisor@123",
    user: {
      id: 4,
      name: "Supervisor Dev",
      email: "supervisor@petrobras.com.br",
      role: "supervisor",
      is_supervisor: true,
      department: "Seguranca",
      employee_id: "P22222",
      manager: null,
    },
  },
  "suporte@petrobras.com.br": {
    password: "suporte@123",
    user: {
      id: 5,
      name: "Suporte Atendimento",
      email: "suporte@petrobras.com.br",
      role: "support",
      is_supervisor: false,
      department: "Atendimento",
      employee_id: "P33333",
      manager: null,
    },
  },
}

/**
 * Funcao auxiliar para criar delay (para visualizar o loader)
 * REMOVER APOS TESTES
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * POST /api/auth/login
 * 
 * Tenta primeiro o backend Python. Se falhar (backend indisponivel),
 * usa usuarios de demonstracao para permitir testes das paginas.
 */
export async function POST(request: NextRequest) {
  // DELAY PARA VISUALIZAR O LOADER - REMOVER APOS TESTES
  await delay(3000) // 3 segundos de delay
  
  const body = await request.json()
  const { email, password } = body as { email?: string; password?: string }

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_INPUT", message: "Email e senha sao obrigatorios" } },
      { status: 400 }
    )
  }

  // Tenta o backend Python primeiro
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(data)
    }

    // Se o backend retornou erro de credenciais (401), propaga o erro
    if (backendResponse.status === 401) {
      const errorData = await backendResponse.json()
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: errorData.detail || "Credenciais invalidas" } },
        { status: 401 }
      )
    }
  } catch {
    // Backend indisponivel - continua para modo demo
    console.log("[v0] Backend indisponivel, usando modo de demonstracao")
  }

  // Modo de demonstracao: verifica usuarios locais
  const demoUser = DEMO_USERS[email.toLowerCase()]
  
  if (!demoUser || demoUser.password !== password) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_CREDENTIALS", message: "Credenciais invalidas" } },
      { status: 401 }
    )
  }

  // Gera tokens de demonstracao
  const accessToken = `demo_access_${Date.now()}_${Math.random().toString(36).substring(2)}`
  const refreshToken = `demo_refresh_${Date.now()}_${Math.random().toString(36).substring(2)}`

  return NextResponse.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "bearer",
    expires_in: 3600,
    user: demoUser.user,
  })
}
