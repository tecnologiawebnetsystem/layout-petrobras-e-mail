import { NextResponse } from 'next/server'
import { updateEntrega, deleteEntrega } from '@/lib/db/neon'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const entrega = await updateEntrega(parseInt(id), data)
    if (!entrega) {
      return NextResponse.json({ error: 'Entrega nao encontrada' }, { status: 404 })
    }
    return NextResponse.json(entrega)
  } catch (error) {
    // console.error('Erro ao atualizar entrega:', error)
    return NextResponse.json({ error: 'Erro ao atualizar entrega' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await deleteEntrega(parseInt(id))
    if (!deleted) {
      return NextResponse.json({ error: 'Entrega nao encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    // console.error('Erro ao deletar entrega:', error)
    return NextResponse.json({ error: 'Erro ao deletar entrega' }, { status: 500 })
  }
}
