import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/auth/rbac'
import { requireAuth, requireAdmin, registrarAuditoria, AuthenticatedRequest } from '@/lib/auth/rbac'

// GET /api/perfis/[id] → qualquer autenticado pode ver
export const GET = requireAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const sb = createAdminSupabase()
  const { data: perfil, error: err1 } = await sb.from('perfis').select('*').eq('id', params.id).single()
  if (err1 || !perfil) return NextResponse.json({ erro: 'Perfil não encontrado.' }, { status: 404 })

  const { data: permissoes, error: err2 } = await sb.from('perfil_permissoes').select('*').eq('perfil_id', params.id)
  if (err2) return NextResponse.json({ erro: err2.message }, { status: 500 })

  return NextResponse.json({ ...perfil, permissoes })
})

// PUT /api/perfis/[id] → apenas admin pode editar nome/descrição
export const PUT = requireAdmin(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  if (params.id === '1') {
    return NextResponse.json({ erro: 'O perfil Administrador não pode ser editado.' }, { status: 403 })
  }

  const body = await req.json()
  const { nome, descricao } = body

  if (!nome?.trim()) {
    return NextResponse.json({ erro: 'Nome do perfil é obrigatório.' }, { status: 400 })
  }

  const sb = createAdminSupabase()
  const { data, error } = await sb
    .from('perfis')
    .update({ nome: nome.trim(), descricao: descricao?.trim() || '' })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  await registrarAuditoria(req.user.id, `Editou perfil ID ${params.id}: "${nome}"`, 'configuracoes')

  return NextResponse.json(data)
})

// DELETE /api/perfis/[id] → apenas admin pode excluir
export const DELETE = requireAdmin(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  if (params.id === '1') {
    return NextResponse.json({ erro: 'O perfil Administrador não pode ser excluído.' }, { status: 403 })
  }

  const sb = createAdminSupabase()

  // Verifica se há colaboradores com esse perfil
  const { data: colaboradores } = await sb
    .from('colaboradores')
    .select('id')
    .eq('perfil_id', params.id)
    .limit(1)

  if (colaboradores && colaboradores.length > 0) {
    return NextResponse.json({ erro: 'Não é possível excluir: existem colaboradores com este perfil. Altere o perfil deles primeiro.' }, { status: 409 })
  }

  // Apaga permissões vinculadas
  await sb.from('perfil_permissoes').delete().eq('perfil_id', params.id)

  // Apaga o perfil
  const { error } = await sb.from('perfis').delete().eq('id', params.id)
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  await registrarAuditoria(req.user.id, `Excluiu perfil ID ${params.id}`, 'configuracoes')

  return NextResponse.json({ sucesso: true })
})
