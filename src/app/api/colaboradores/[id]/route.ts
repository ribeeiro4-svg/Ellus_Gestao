import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/auth/rbac'
import { requireAdmin, registrarAuditoria, AuthenticatedRequest } from '@/lib/auth/rbac'

export const GET = requireAdmin(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const sb = createAdminSupabase()
  const { data, error } = await sb
    .from('colaboradores')
    .select('id, nome, email, perfil_id, status, criado_em, atualizado_em')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ erro: 'Colaborador não encontrado.' }, { status: 404 })
  return NextResponse.json(data)
})

export const PUT = requireAdmin(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const { nome, email, perfil_id, status } = body

  if (!nome || !email || !perfil_id) {
    return NextResponse.json({ erro: 'Preencha todos os campos obrigatórios.' }, { status: 400 })
  }

  const sb = createAdminSupabase()

  // Check unique email
  const { data: existing } = await sb.from('colaboradores').select('id').eq('email', email).neq('id', params.id).single()
  if (existing) {
    return NextResponse.json({ erro: 'Email já cadastrado para outro usuário.' }, { status: 409 })
  }

  const { data, error } = await sb.from('colaboradores').update({
    nome,
    email,
    perfil_id,
    status,
    atualizado_em: new Date().toISOString()
  }).eq('id', params.id).select('id, nome, email, status').single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  await registrarAuditoria(req.user.id, `Atualizou colaborador: ${nome}`, 'configuracoes')

  return NextResponse.json(data)
})

export const DELETE = requireAdmin(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const sb = createAdminSupabase()

  // Buscar nome para auditoria
  const { data: colab } = await sb.from('colaboradores').select('nome, email').eq('id', params.id).single()
  
  if (!colab) {
    return NextResponse.json({ erro: 'Colaborador não encontrado.' }, { status: 404 })
  }

  const { error } = await sb.from('colaboradores').delete().eq('id', params.id)

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  await registrarAuditoria(req.user.id, `Excluiu colaborador: ${colab.nome} (${colab.email})`, 'configuracoes')

  return NextResponse.json({ sucesso: true })
})
