import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/auth/rbac'
import { requireAuth, requireAdmin, AuthenticatedRequest } from '@/lib/auth/rbac'

// GET /api/perfis → qualquer colaborador autenticado pode listar perfis
export const GET = requireAuth(async (req: AuthenticatedRequest) => {
  const sb = createAdminSupabase()
  const { data: perfis, error: err1 } = await sb.from('perfis').select('*').order('id')
  if (err1) return NextResponse.json({ erro: err1.message }, { status: 500 })

  const { data: permissoes, error: err2 } = await sb.from('perfil_permissoes').select('*')
  if (err2) return NextResponse.json({ erro: err2.message }, { status: 500 })

  // Anexar permissões aos perfis
  const result = perfis.map(p => ({
    ...p,
    permissoes: permissoes.filter(perm => perm.perfil_id === p.id)
  }))

  return NextResponse.json(result)
})

// POST /api/perfis → apenas administradores podem criar novos perfis
export const POST = requireAdmin(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const { nome, descricao, permissoes } = body

  if (!nome) {
    return NextResponse.json({ erro: 'Nome do perfil é obrigatório.' }, { status: 400 })
  }

  const sb = createAdminSupabase()

  const { data: perfil, error: errPerfil } = await sb
    .from('perfis')
    .insert({ nome, descricao: descricao || '' })
    .select()
    .single()

  if (errPerfil || !perfil) {
    return NextResponse.json({ erro: errPerfil?.message || 'Erro ao criar perfil.' }, { status: 500 })
  }

  if (permissoes && permissoes.length > 0) {
    const rows = permissoes.map((p: any) => ({
      perfil_id: perfil.id,
      modulo: p.modulo,
      pode_ver: !!p.pode_ver,
      pode_criar: !!p.pode_criar,
      pode_editar: !!p.pode_editar,
      pode_excluir: !!p.pode_excluir,
    }))
    const { error: errPerms } = await sb.from('perfil_permissoes').insert(rows)
    if (errPerms) {
      return NextResponse.json({ erro: errPerms.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ...perfil, permissoes: permissoes || [] }, { status: 201 })
})
