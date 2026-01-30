import { NextResponse } from 'next/server'
import { getBurndownData, createBurndownEntry } from '@/lib/db/neon'

export async function GET() {
  try {
    const data = await getBurndownData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar dados do burndown:', error)
    return NextResponse.json({ error: 'Erro ao buscar dados do burndown' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const entry = await createBurndownEntry(data)
    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar entrada do burndown:', error)
    return NextResponse.json({ error: 'Erro ao criar entrada do burndown' }, { status: 500 })
  }
}
