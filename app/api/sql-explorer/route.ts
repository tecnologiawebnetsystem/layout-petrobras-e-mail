import { sql } from '@/lib/db/neon'
import { NextResponse } from 'next/server'

const BLOCKED_KEYWORDS = [
  'DROP', 'ALTER', 'CREATE', 'TRUNCATE',
  'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL', 'MERGE', 'UPSERT',
  'VACUUM', 'REINDEX', 'CLUSTER', 'COPY', 'LOCK', 'COMMENT',
]

function isSafeQuery(query: string): { safe: boolean; reason?: string } {
  const upper = query.toUpperCase().trim()

  // Allow SELECT, WITH, EXPLAIN, INSERT, UPDATE, DELETE
  const allowedStarts = ['SELECT', 'WITH', 'EXPLAIN', 'INSERT', 'UPDATE', 'DELETE']
  const startsWithAllowed = allowedStarts.some(keyword => upper.startsWith(keyword))
  
  if (!startsWithAllowed) {
    return { safe: false, reason: 'Apenas consultas SELECT, INSERT, UPDATE, DELETE, WITH e EXPLAIN sao permitidas' }
  }

  for (const keyword of BLOCKED_KEYWORDS) {
    const withoutStrings = upper.replace(/'[^']*'/g, '')
    const regex = new RegExp(`\\b${keyword}\\b`)
    if (regex.test(withoutStrings)) {
      return { safe: false, reason: `Comando "${keyword}" nao e permitido.` }
    }
  }

  return { safe: true }
}

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

    const tableNames = tables.map((t: Record<string, unknown>) => String(t.table_name))
    let countsMap: Record<string, number> = {}

    if (tableNames.length > 0) {
      try {
        const countParts = tableNames.map((name: string) => `SELECT '${name}' as tbl, COUNT(*)::int as cnt FROM "${name}"`)
        const countQuery = countParts.join(' UNION ALL ')
        const countResults = await sql(countQuery)
        for (const row of countResults) {
          countsMap[String(row.tbl)] = Number(row.cnt) || 0
        }
      } catch {
        // fallback: leave all counts at 0
      }
    }

    const tablesWithCounts = tables.map((t: Record<string, unknown>) => ({
      ...t,
      row_count: countsMap[String(t.table_name)] || 0,
    }))

    return NextResponse.json({ tables: tablesWithCounts })
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao listar tabelas: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    )
  }
}

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

    const validation = isSafeQuery(query)
    if (!validation.safe) {
      return NextResponse.json({ error: validation.reason }, { status: 403 })
    }

    const startTime = Date.now()
    const result = await sql(query)
    const duration = Date.now() - startTime

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
