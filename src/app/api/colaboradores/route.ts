import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/auth/rbac'
import { requireAdmin, hashPassword, registrarAuditoria, AuthenticatedRequest } from '@/lib/auth/rbac'

export const GET = requireAdmin(async (req: AuthenticatedRequest) => {
  const sb = createAdminSupabase()
  const { data, error } = await sb
    .from('colaboradores')
    .select(`
      id, nome, email, status, criado_em, atualizado_em,
      perfis ( id, nome )
    `)
    .order('nome')

  if (error) {
    console.error('Error fetching colaboradores:', error)
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
})

export const POST = requireAdmin(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const { nome, email, senha, perfil_id, status } = body

  if (!nome || !email || !senha || !perfil_id) {
    return NextResponse.json({ erro: 'Preencha todos os campos obrigatórios.' }, { status: 400 })
  }

  const sb = createAdminSupabase()

  // Check unique email
  const { data: existing } = await sb.from('colaboradores').select('id').eq('email', email).single()
  if (existing) {
    return NextResponse.json({ erro: 'Email já cadastrado.' }, { status: 409 })
  }

  const senha_hash = await hashPassword(senha)

  const { data, error } = await sb.from('colaboradores').insert({
    nome,
    email,
    senha_hash,
    perfil_id,
    status: status || 'ativo'
  }).select('id, nome, email, status').single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  await registrarAuditoria(req.user.id, `Criou colaborador: ${nome}`, 'configuracoes')

  return NextResponse.json(data, { status: 201 })
})
