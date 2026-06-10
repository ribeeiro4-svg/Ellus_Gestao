import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/auth/rbac'
import { requireAdmin, registrarAuditoria, AuthenticatedRequest } from '@/lib/auth/rbac'

export const PUT = requireAdmin(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  if (params.id === '1') {
    return NextResponse.json({ erro: 'O perfil Administrador não pode ter suas permissões alteradas.' }, { status: 403 })
  }

  const body = await req.json()
  const { permissoes } = body

  if (!Array.isArray(permissoes)) {
    return NextResponse.json({ erro: 'O campo permissoes deve ser um array.' }, { status: 400 })
  }

  const sb = createAdminSupabase()

  // Apagar permissões existentes
  const { error: deleteError } = await sb.from('perfil_permissoes').delete().eq('perfil_id', params.id)
  if (deleteError) {
    return NextResponse.json({ erro: `Erro ao apagar permissões: ${deleteError.message}` }, { status: 500 })
  }

  // Inserir novas permissões (pular se vazio — Supabase rejeita insert de array vazio)
  if (permissoes.length > 0) {
    const rows = permissoes.map((p: any) => ({
      perfil_id: parseInt(params.id),
      modulo: p.modulo,
      pode_ver: p.pode_ver || false,
      pode_criar: p.pode_criar || false,
      pode_editar: p.pode_editar || false,
      pode_excluir: p.pode_excluir || false
    }))

    const { error } = await sb.from('perfil_permissoes').insert(rows)
    if (error) return NextResponse.json({ erro: `Erro ao salvar permissões: ${error.message}` }, { status: 500 })
  }

  await registrarAuditoria(req.user.id, `Atualizou permissões do perfil ID ${params.id}`, 'configuracoes')

  return NextResponse.json({ sucesso: true })
})

