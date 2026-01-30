import { NextResponse } from 'next/server'
import { getConfig, updateConfig } from '@/lib/db/neon'

export async function GET() {
  try {
    const config = await getConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao buscar config:', error)
    return NextResponse.json({ error: 'Erro ao buscar config' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    await updateConfig(data.progresso_geral)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar config:', error)
    return NextResponse.json({ error: 'Erro ao atualizar config' }, { status: 500 })
  }
}
