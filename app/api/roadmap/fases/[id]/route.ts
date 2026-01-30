import { NextResponse } from 'next/server'
import { getFaseById, updateFase, deleteFase } from '@/lib/db/neon'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const fase = await getFaseById(parseInt(id))
    if (!fase) {
      return NextResponse.json({ error: 'Fase nao encontrada' }, { status: 404 })
    }
    return NextResponse.json(fase)
  } catch (error) {
    console.error('Erro ao buscar fase:', error)
    return NextResponse.json({ error: 'Erro ao buscar fase' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const fase = await updateFase(parseInt(id), data)
    if (!fase) {
      return NextResponse.json({ error: 'Fase nao encontrada' }, { status: 404 })
    }
    return NextResponse.json(fase)
  } catch (error) {
    console.error('Erro ao atualizar fase:', error)
    return NextResponse.json({ error: 'Erro ao atualizar fase' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await deleteFase(parseInt(id))
    if (!deleted) {
      return NextResponse.json({ error: 'Fase nao encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar fase:', error)
    return NextResponse.json({ error: 'Erro ao deletar fase' }, { status: 500 })
  }
}
