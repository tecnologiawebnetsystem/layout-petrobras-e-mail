import { NextResponse } from 'next/server'
import { updateMarco, deleteMarco } from '@/lib/db/neon'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const marco = await updateMarco(parseInt(id), data)
    if (!marco) {
      return NextResponse.json({ error: 'Marco nao encontrado' }, { status: 404 })
    }
    return NextResponse.json(marco)
  } catch (error) {
    console.error('Erro ao atualizar marco:', error)
    return NextResponse.json({ error: 'Erro ao atualizar marco' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await deleteMarco(parseInt(id))
    if (!deleted) {
      return NextResponse.json({ error: 'Marco nao encontrado' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar marco:', error)
    return NextResponse.json({ error: 'Erro ao deletar marco' }, { status: 500 })
  }
}
