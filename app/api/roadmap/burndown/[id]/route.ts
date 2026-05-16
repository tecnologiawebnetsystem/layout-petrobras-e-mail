export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server'
import { updateBurndownEntry, deleteBurndownEntry } from '@/lib/db/neon'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const entry = await updateBurndownEntry(parseInt(id), data)
    if (!entry) {
      return NextResponse.json({ error: 'Entrada nao encontrada' }, { status: 404 })
    }
    return NextResponse.json(entry)
  } catch (error) {
    // console.error('Erro ao atualizar entrada:', error)
    return NextResponse.json({ error: 'Erro ao atualizar entrada' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await deleteBurndownEntry(parseInt(id))
    if (!deleted) {
      return NextResponse.json({ error: 'Entrada nao encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    // console.error('Erro ao deletar entrada:', error)
    return NextResponse.json({ error: 'Erro ao deletar entrada' }, { status: 500 })
  }
}
