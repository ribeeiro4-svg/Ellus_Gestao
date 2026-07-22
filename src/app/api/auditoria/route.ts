import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/auth/rbac'
import { requireAdmin, AuthenticatedRequest } from '@/lib/auth/rbac'

export const dynamic = 'force-dynamic'

export const GET = requireAdmin(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url)
  const colaborador_id = url.searchParams.get('colaborador_id')
  const modulo = url.searchParams.get('modulo')
  const data_inicio = url.searchParams.get('data_inicio')
  const data_fim = url.searchParams.get('data_fim')
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')

  const sb = createAdminSupabase()
  let query = sb.from('auditoria_acessos').select(`
    id, acao, modulo, ip, timestamp,
    colaboradores ( id, nome )
  `, { count: 'exact' })

  if (colaborador_id) query = query.eq('colaborador_id', colaborador_id)
  if (modulo) query = query.eq('modulo', modulo)
  if (data_inicio) query = query.gte('timestamp', data_inicio)
  if (data_fim) query = query.lte('timestamp', data_fim)

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await query.order('timestamp', { ascending: false }).range(from, to)

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  const registros = data.map((d: any) => ({
    id: d.id,
    colaborador: d.colaboradores?.nome || 'Desconhecido',
    acao: d.acao,
    modulo: d.modulo,
    ip: d.ip,
    timestamp: d.timestamp
  }))

  return NextResponse.json({
    total: count || 0,
    pagina: page,
    registros
  })
})
