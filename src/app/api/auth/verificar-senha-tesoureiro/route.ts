import { NextResponse } from 'next/server'
import { requireAuth, createAdminSupabase, verifyPassword, registrarAuditoria, AuthenticatedRequest } from '@/lib/auth/rbac'

// POST /api/auth/verificar-senha-tesoureiro
// Recebe { senha } e verifica contra a senha do Tesoureiro ativo do tenant.
// Qualquer colaborador autenticado pode chamar (inclusive Admin).
// Retorna { ok: true } ou { ok: false, erro: '...' }
export const POST = requireAuth(async (req: AuthenticatedRequest) => {
  try {
    const { senha } = await req.json()

    if (!senha) {
      return NextResponse.json({ ok: false, erro: 'Senha não informada.' }, { status: 400 })
    }

    const sb = createAdminSupabase()

    // 1. Busca o tenant_id do colaborador logado (via payload do JWT)
    // requireAuth injeta req.user = payload.colaborador
    const colaborador = req.user
    if (!colaborador) {
      return NextResponse.json({ ok: false, erro: 'Sessão inválida.' }, { status: 401 })
    }

    // 2. Busca o colaborador atual para pegar o tenant_id
    const { data: colaboradorAtual } = await sb
      .from('colaboradores')
      .select('id, tenant_id')
      .eq('id', colaborador.id)
      .single()

    if (!colaboradorAtual?.tenant_id) {
      return NextResponse.json({ ok: false, erro: 'Tenant não encontrado.' }, { status: 404 })
    }

    const tenantId = colaboradorAtual.tenant_id

    // 3. Busca o perfil "Tesoureiro" — procura pelo nome do perfil
    const { data: perfilTesoureiro } = await sb
      .from('perfis')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('nome', '%tesoureiro%')
      .single()

    if (!perfilTesoureiro) {
      // Fallback: busca qualquer perfil com nome tesoureiro sem filtro de tenant
      const { data: perfilFallback } = await sb
        .from('perfis')
        .select('id')
        .ilike('nome', '%tesoureiro%')
        .single()

      if (!perfilFallback) {
        return NextResponse.json({ ok: false, erro: 'Perfil de Tesoureiro não encontrado no sistema.' }, { status: 404 })
      }

      return verificarSenhaTesoureiro(sb, req, perfilFallback.id, tenantId, senha)
    }

    return verificarSenhaTesoureiro(sb, req, perfilTesoureiro.id, tenantId, senha)

  } catch (err: any) {
    console.error('[verificar-senha-tesoureiro]', err)
    return NextResponse.json({ ok: false, erro: 'Erro interno.' }, { status: 500 })
  }
})

async function verificarSenhaTesoureiro(
  sb: any,
  req: AuthenticatedRequest,
  perfilId: number,
  tenantId: string,
  senha: string
) {
  // Busca o tesoureiro ativo do tenant
  const { data: tesoureiro } = await sb
    .from('colaboradores')
    .select('id, nome, senha_hash')
    .eq('perfil_id', perfilId)
    .eq('tenant_id', tenantId)
    .eq('status', 'ativo')
    .single()

  if (!tesoureiro) {
    return NextResponse.json({ ok: false, erro: 'Tesoureiro ativo não encontrado.' }, { status: 404 })
  }

  // Verifica a senha usando bcrypt
  const isValid = await verifyPassword(senha, tesoureiro.senha_hash)

  // Registra tentativa na auditoria
  const ip = req.headers.get('x-forwarded-for') || undefined
  const colaborador = req.user  // requireAuth injeta req.user = payload.colaborador
  await registrarAuditoria(
    colaborador?.id,
    isValid
      ? 'Confirmação de senha do Tesoureiro: SUCESSO'
      : 'Confirmação de senha do Tesoureiro: FALHA',
    'auth',
    ip
  )

  if (!isValid) {
    return NextResponse.json({ ok: false, erro: 'Senha incorreta. Verifique a senha do Tesoureiro.' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
