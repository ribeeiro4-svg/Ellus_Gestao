import { NextResponse, NextRequest } from 'next/server'
import { createAdminSupabase } from '@/lib/auth/rbac'
import { verifyToken, hashPassword, registrarAuditoria } from '@/lib/auth/rbac'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const payload = await verifyToken(token)

  if (!payload || !payload.colaborador) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  // Apenas o próprio colaborador ou um Admin (perfil_id 1) pode alterar a senha
  if (payload.colaborador.id.toString() !== params.id && payload.colaborador.perfil_id !== 1) {
    return NextResponse.json({ erro: 'Sem permissão para alterar a senha.' }, { status: 403 })
  }

  const body = await req.json()
  const { senha_nova } = body

  if (!senha_nova || senha_nova.length < 6) {
    return NextResponse.json({ erro: 'A nova senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
  }

  const senha_hash = await hashPassword(senha_nova)

  const sb = createAdminSupabase()
  const { error } = await sb.from('colaboradores').update({
    senha_hash,
    atualizado_em: new Date().toISOString()
  }).eq('id', params.id)

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  await registrarAuditoria(payload.colaborador.id, `Alterou senha do colaborador ID ${params.id}`, 'configuracoes')

  return NextResponse.json({ sucesso: true })
}
