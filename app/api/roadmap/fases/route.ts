import { NextResponse } from 'next/server'
import { getFases, createFase } from '@/lib/db/neon'

export async function GET() {
  try {
    const fases = await getFases()
    return NextResponse.json(fases)
  } catch (error) {
    // console.error('Erro ao buscar fases:', error)
    return NextResponse.json({ error: 'Erro ao buscar fases' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const fase = await createFase(data)
    return NextResponse.json(fase, { status: 201 })
  } catch (error) {
    // console.error('Erro ao criar fase:', error)
    return NextResponse.json({ error: 'Erro ao criar fase' }, { status: 500 })
  }
}
