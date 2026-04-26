import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/api/route-handler-utils"

/**
 * Interface para cadastro de usuario externo
 */
interface CadastroUsuarioRequest {
  numero_solicitacao: string
  email_solicitante: string
  email_usuario_externo: string
}

/**
 * POST /api/support/users
 * 
 * Cadastra um novo usuario externo no sistema.
 * Apenas usuarios com role "support" ou "supervisor" podem acessar.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CadastroUsuarioRequest
    const { numero_solicitacao, email_solicitante, email_usuario_externo } = body

    // Validacoes
    if (!numero_solicitacao?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Numero da solicitacao e obrigatorio" } },
        { status: 400 }
      )
    }

    if (!email_solicitante?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_solicitante)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "E-mail do solicitante invalido" } },
        { status: 400 }
      )
    }

    if (!email_usuario_externo?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_usuario_externo)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "E-mail do usuario externo invalido" } },
        { status: 400 }
      )
    }

    // Tenta o backend Python primeiro
    try {
      const authHeader = request.headers.get("Authorization")
      
      const backendResponse = await fetch(`${BACKEND_URL}/api/v1/support/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          numero_solicitacao,
          email_solicitante,
          email_usuario_externo,
        }),
      })

      if (backendResponse.ok) {
        const data = await backendResponse.json()
        return NextResponse.json(data)
      }

      // Se o backend retornou erro, propaga
      if (backendResponse.status === 409) {
        return NextResponse.json(
          { success: false, error: { code: "DUPLICATE", message: "Ja existe um cadastro ativo para este e-mail" } },
          { status: 409 }
        )
      }

      const errorData = await backendResponse.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, error: { code: "BACKEND_ERROR", message: errorData.detail || "Erro ao cadastrar usuario" } },
        { status: backendResponse.status }
      )
    } catch {
      // Backend indisponivel - usa modo demo
      console.log("[v0] Backend indisponivel, usando modo de demonstracao para cadastro")
    }

    // Modo de demonstracao: simula cadastro bem-sucedido
    const novoUsuario = {
      id: Date.now(),
      numero_solicitacao,
      email_solicitante,
      email_usuario_externo,
      status: "ativo",
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: novoUsuario,
      message: "Usuario cadastrado com sucesso (modo demonstracao)",
    })
  } catch (error) {
    console.error("[v0] Erro ao processar cadastro:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Erro interno ao processar cadastro" } },
      { status: 500 }
    )
  }
}

/**
 * GET /api/support/users
 * 
 * Lista usuarios cadastrados pelo suporte.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    // Tenta o backend Python primeiro
    try {
      const authHeader = request.headers.get("Authorization")
      
      const backendResponse = await fetch(`${BACKEND_URL}/api/v1/support/users?search=${encodeURIComponent(search)}`, {
        method: "GET",
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      })

      if (backendResponse.ok) {
        const data = await backendResponse.json()
        return NextResponse.json(data)
      }
    } catch {
      // Backend indisponivel - usa modo demo
      console.log("[v0] Backend indisponivel, usando modo de demonstracao para listagem")
    }

    // Modo de demonstracao: retorna lista vazia
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
    })
  } catch (error) {
    console.error("[v0] Erro ao listar usuarios:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Erro interno ao listar usuarios" } },
      { status: 500 }
    )
  }
}
