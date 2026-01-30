import { NextResponse } from 'next/server'
import { createEntrega, getEntregasByFase } from '@/lib/db/neon'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const faseId = searchParams.get('faseId')
    
    if (!faseId) {
      return NextResponse.json({ error: 'faseId e obrigatorio' }, { status: 400 })
    }
    
    const entregas = await getEntregasByFase(parseInt(faseId))
    return NextResponse.json(entregas)
  } catch (error) {
    console.error('Erro ao buscar entregas:', error)
    return NextResponse.json({ error: 'Erro ao buscar entregas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const entrega = await createEntrega(data)
    return NextResponse.json(entrega, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar entrega:', error)
    return NextResponse.json({ error: 'Erro ao criar entrega' }, { status: 500 })
  }
}
