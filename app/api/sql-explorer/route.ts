import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

// Palavras bloqueadas para seguranca - apenas SELECT permitido
const BLOCKED_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE',
  'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL', 'MERGE', 'UPSERT',
  'VACUUM', 'REINDEX', 'CLUSTER', 'COPY', 'LOCK', 'COMMENT',
]

function isSafeQuery(query: string): { safe: boolean; reason?: string } {
  const upper = query.toUpperCase().trim()
  
  // Deve comecar com SELECT ou WITH (para CTEs)
  if (!upper.startsWith('SELECT') && !upper.startsWith('WITH') && !upper.startsWith('EXPLAIN')) {
    return { safe: false, reason: 'Apenas consultas SELECT, WITH e EXPLAIN sao permitidas' }
  }

  // Verificar palavras bloqueadas
  for (const keyword of BLOCKED_KEYWORDS) {
    // Verifica se a palavra aparece fora de aspas simples (strings)
    const withoutStrings = upper.replace(/'[^']*'/g, '')
    const regex = new RegExp(`\\b${keyword}\\b`)
    if (regex.test(withoutStrings)) {
      return { safe: false, reason: `Comando "${keyword}" nao e permitido. Apenas leitura (SELECT).` }
    }
  }

  return { safe: true }
}

// GET - Lista todas as tabelas e suas colunas
export async function GET() {
  try {
    const tables = await sql`
      SELECT 
        t.table_name,
        t.table_type,
        (
          SELECT json_agg(json_build_object(
            'column_name', c.column_name,
            'data_type', c.data_type,
            'is_nullable', c.is_nullable,
            'column_default', c.column_default,
            'character_maximum_length', c.character_maximum_length
          ) ORDER BY c.ordinal_position)
          FROM information_schema.columns c
          WHERE c.table_schema = 'public' AND c.table_name = t.table_name
        ) as columns,
        (
          SELECT COUNT(*)::int
          FROM information_schema.columns c
          WHERE c.table_schema = 'public' AND c.table_name = t.table_name
        ) as column_count
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
      ORDER BY t.table_name
    `

    // Contar registros de cada tabela
    const counts = await Promise.all(
      tables.map(async (t: { table_name: string }) => {
        try {
          const result = await sql(`SELECT COUNT(*)::int as count FROM "${t.table_name}"`)
          return { table: t.table_name, count: result[0]?.count || 0 }
        } catch {
          return { table: t.table_name, count: -1 }
        }
      })
    )

    const tablesWithCounts = tables.map((t: { table_name: string }) => ({
      ...t,
      row_count: counts.find((c: { table: string }) => c.table === t.table_name)?.count || 0,
    }))

    return NextResponse.json({ tables: tablesWithCounts })
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao listar tabelas: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    )
  }
}

// POST - Executa uma query SELECT
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query e obrigatoria' }, { status: 400 })
    }

    if (query.trim().length < 6) {
      return NextResponse.json({ error: 'Query muito curta' }, { status: 400 })
    }

    // Validar seguranca
    const validation = isSafeQuery(query)
    if (!validation.safe) {
      return NextResponse.json({ error: validation.reason }, { status: 403 })
    }

    const startTime = Date.now()
    const result = await sql(query)
    const duration = Date.now() - startTime

    // Extrair nomes das colunas
    const columns = result.length > 0 ? Object.keys(result[0]) : []

    return NextResponse.json({
      columns,
      rows: result,
      rowCount: result.length,
      duration,
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Erro SQL: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 400 }
    )
  }
}
