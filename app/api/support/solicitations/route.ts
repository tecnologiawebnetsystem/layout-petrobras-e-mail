import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * GET /api/support/solicitations?email=xxx@petrobras.com.br
 *
 * Retorna as solicitações ATIVAS vinculadas ao e-mail do solicitante
 * (usuário interno) para que o form de upload possa listá-las.
 *
 * Sem ?email → retorna todas as solicitações (uso administrativo do suporte).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")?.toLowerCase().trim()

    let rows: Record<string, unknown>[]

    if (email) {
      rows = await sql`
        SELECT
          id::text,
          numero_solicitacao,
          email_solicitante,
          email_usuario_externo,
          status,
          created_at,
          created_by
        FROM solicitation
        WHERE status = 'ativo'
          AND LOWER(email_solicitante) = ${email}
        ORDER BY created_at DESC
      `
    } else {
      rows = await sql`
        SELECT
          id::text,
          numero_solicitacao,
          email_solicitante,
          email_usuario_externo,
          status,
          created_at,
          created_by
        FROM solicitation
        ORDER BY created_at DESC
        LIMIT 200
      `
    }

    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error("[API] GET /api/support/solicitations:", error)
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: "Erro ao buscar solicitações" } },
      { status: 500 }
    )
  }
}

/**
 * POST /api/support/solicitations
 *
 * Cria uma nova solicitação. Chamado pelo Suporte ao cadastrar um novo usuário externo.
 *
 * Body: { numero_solicitacao, email_solicitante, email_usuario_externo, created_by? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      numero_solicitacao: string
      email_solicitante: string
      email_usuario_externo: string
      created_by?: string
    }

    const { numero_solicitacao, email_solicitante, email_usuario_externo, created_by } = body

    if (!numero_solicitacao?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Número da solicitação é obrigatório" } },
        { status: 400 }
      )
    }

    if (!email_solicitante?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_solicitante)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "E-mail do solicitante inválido" } },
        { status: 400 }
      )
    }

    if (!email_usuario_externo?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_usuario_externo)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "E-mail do usuário externo inválido" } },
        { status: 400 }
      )
    }

    const [row] = await sql`
      INSERT INTO solicitation (numero_solicitacao, email_solicitante, email_usuario_externo, created_by)
      VALUES (
        ${numero_solicitacao.trim()},
        ${email_solicitante.trim().toLowerCase()},
        ${email_usuario_externo.trim().toLowerCase()},
        ${created_by ?? null}
      )
      ON CONFLICT (numero_solicitacao) DO NOTHING
      RETURNING
        id::text,
        numero_solicitacao,
        email_solicitante,
        email_usuario_externo,
        status,
        created_at,
        created_by
    `

    if (!row) {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE", message: "Já existe uma solicitação com este número" } },
        { status: 409 }
      )
    }

    return NextResponse.json({ success: true, data: row }, { status: 201 })
  } catch (error) {
    console.error("[API] POST /api/support/solicitations:", error)
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: "Erro ao criar solicitação" } },
      { status: 500 }
    )
  }
}
