import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/auth/rbac'
import { requireAdmin, registrarAuditoria, AuthenticatedRequest } from '@/lib/auth/rbac'

export const PATCH = requireAdmin(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const { status } = body

  if (status !== 'ativo' && status !== 'inativo') {
    return NextResponse.json({ erro: 'Status inválido.' }, { status: 400 })
  }

  const sb = createAdminSupabase()
  
  const { data, error } = await sb.from('colaboradores').update({
    status,
    atualizado_em: new Date().toISOString()
  }).eq('id', params.id).select('id, nome, status').single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  await registrarAuditoria(req.user.id, `Alterou status do colaborador ${data.nome} para ${status}`, 'configuracoes')

  return NextResponse.json(data)
})
