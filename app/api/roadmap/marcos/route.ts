import { NextResponse } from 'next/server'
import { getMarcos, createMarco } from '@/lib/db/neon'

export async function GET() {
  try {
    const marcos = await getMarcos()
    return NextResponse.json(marcos)
  } catch (error) {
    // console.error('Erro ao buscar marcos:', error)
    return NextResponse.json({ error: 'Erro ao buscar marcos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const marco = await createMarco(data)
    return NextResponse.json(marco, { status: 201 })
  } catch (error) {
    // console.error('Erro ao criar marco:', error)
    return NextResponse.json({ error: 'Erro ao criar marco' }, { status: 500 })
  }
}
