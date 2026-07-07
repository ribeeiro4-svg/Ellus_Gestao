'use server'

import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import { verifyToken } from '@/lib/auth/rbac'

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getRbacUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('rbac_token')?.value
    if (!token) return null
    const payload = await verifyToken(token)
    return payload ? { nome: (payload as any).nome || (payload as any).name || 'Usuário', perfil: (payload as any).role || (payload as any).perfil || 'usuario' } : null
  } catch { return null }
}

async function getClientMeta() {
  try {
    const h = await headers()
    return { ip: h.get('x-forwarded-for') || h.get('x-real-ip') || '', userAgent: h.get('user-agent') || '' }
  } catch { return { ip: '', userAgent: '' } }
}

async function registrarLog(sb: any, payload: {
  tenantId: string
  nfeId?: string
  acao: string
  antes?: Record<string, any>
  depois?: Record<string, any>
  usuario?: string
  perfil?: string
  ip?: string
  userAgent?: string
  motivo?: string
}) {
  try {
    const { error } = await sb.from('fiscal_logs').insert({
      tenant_id: payload.tenantId,
      nfe_id: payload.nfeId || null,
      acao: payload.acao,
      antes: payload.antes || null,
      depois: payload.depois || null,
      usuario: payload.usuario || 'Sistema',
      perfil: payload.perfil || 'sistema',
      ip: payload.ip || null,
      user_agent: payload.userAgent || null,
      motivo: payload.motivo || null,
      versao_sistema: '2.0',
    })
    // Fallback para compatibilidade enquanto tabela fiscal_logs é criada
    if (error) {
      await sb.from('contabil_logs').insert({
        tenant_id: payload.tenantId,
        acao: `FISCAL: ${payload.acao}`,
        detalhes: `Autor: ${payload.usuario || 'Sistema'} (${payload.perfil || 'sistema'}) | ${JSON.stringify(payload.depois || {}).substring(0, 200)}`,
      })
    }
  } catch (e) {
    console.warn('[registrarLog] Erro ao registrar log fiscal:', e)
  }
}

// ─── Action: verificar duplicidade ────────────────────────────────────────────

export async function verificarDuplicidadeNFeAction(chaveAcesso: string, tenantId: string) {
  if (!chaveAcesso || !tenantId) return { duplicada: false }
  const sb = await createServerSupabase()
  const { data } = await sb
    .from('nfe_entradas')
    .select('id, numero_nf, status_escrituracao, data_escrituracao, nome_emitente, deleted_at')
    .eq('tenant_id', tenantId)
    .eq('chave_acesso', chaveAcesso)
    .limit(1)
    .maybeSingle()
  if (!data) return { duplicada: false }
  return {
    duplicada: true,
    id: data.id,
    numero_nf: data.numero_nf,
    status: data.status_escrituracao,
    data_escrituracao: data.data_escrituracao,
    nome_emitente: data.nome_emitente,
    deletada: !!data.deleted_at,
  }
}

// ─── Action: verificar status do período ──────────────────────────────────────

export async function verificarPeriodoFiscalStatusAction(competencia: string, tenantId: string) {
  if (!competencia || !tenantId) return { status: 'aberto', bloqueado: false, fechado: false }
  const sb = await createServerSupabase()
  const competenciaDate = competencia.slice(0, 7) + '-01'
  const { data } = await sb
    .from('periodos_fiscais')
    .select('status')
    .eq('tenant_id', tenantId)
    .eq('competencia', competenciaDate)
    .maybeSingle()
  const status = data?.status || 'aberto'
  return {
    status,
    bloqueado: status === 'bloqueado',
    fechado: status === 'fechado' || status === 'bloqueado',
  }
}

// ─── Action: importar NF-e (server-side com todas as camadas de segurança) ────

export async function importarNFeAction(
  nfeData: Record<string, any>,
  itens: Record<string, any>[],
  tenantId: string
) {
  if (!tenantId) return { error: 'Tenant não identificado', ja_existia: false }

  const sb = await createServerSupabase()
  const sbAdmin = await createAdminSupabase()
  const rbacUser = await getRbacUser()
  const meta = await getClientMeta()

  // Camada 2: verificar duplicidade no servidor
  if (nfeData.chave_acesso) {
    const { data: existing } = await sb
      .from('nfe_entradas')
      .select('id, numero_nf, status_escrituracao, data_escrituracao, deleted_at')
      .eq('tenant_id', tenantId)
      .eq('chave_acesso', nfeData.chave_acesso)
      .maybeSingle()

    if (existing) {
      await registrarLog(sbAdmin, {
        tenantId,
        acao: 'REIMPORTACAO_REJEITADA',
        depois: {
          chave_acesso: nfeData.chave_acesso,
          numero_nf: nfeData.numero_nf,
          status_existente: existing.status_escrituracao,
        },
        usuario: rbacUser?.nome,
        perfil: rbacUser?.perfil,
        ip: meta.ip,
        userAgent: meta.userAgent,
        motivo: 'Tentativa de reimportação de NF-e já cadastrada no banco',
      })
      return {
        error: `NF-e ${nfeData.numero_nf} já foi importada (status: ${existing.status_escrituracao}). Chave ...${nfeData.chave_acesso.slice(-8)}.`,
        ja_existia: true,
        status_existente: existing.status_escrituracao,
        data_escrituracao: existing.data_escrituracao,
      }
    }
  }

  // Verificar período fiscal fechado
  const competencia = nfeData.periodo_apuracao || (nfeData.data_emissao ? nfeData.data_emissao.slice(0, 7) + '-01' : null)
  if (competencia) {
    const { data: periodo } = await sb
      .from('periodos_fiscais')
      .select('status')
      .eq('tenant_id', tenantId)
      .eq('competencia', competencia)
      .maybeSingle()

    if (periodo?.status === 'fechado' || periodo?.status === 'bloqueado') {
      await registrarLog(sbAdmin, {
        tenantId,
        acao: 'IMPORTACAO_REJEITADA_PERIODO_FECHADO',
        depois: { competencia, status_periodo: periodo.status },
        usuario: rbacUser?.nome,
        perfil: rbacUser?.perfil,
        ip: meta.ip,
        userAgent: meta.userAgent,
      })
      return {
        error: `Período ${competencia} está ${periodo.status === 'bloqueado' ? 'BLOQUEADO (SPED transmitido)' : 'FECHADO'}. Não é possível importar notas nesta competência.`,
        ja_existia: false,
        periodo_fechado: true,
      }
    }
  }

  // Inserir nota — Constraint UNIQUE no banco (Camada 1) rejeita se duplicata concorrente
  const { data: nfeInserted, error: nfeError } = await sbAdmin
    .from('nfe_entradas')
    .insert({ ...nfeData, tenant_id: tenantId, versao: 1 })
    .select()
    .single()

  if (nfeError) {
    if (nfeError.code === '23505') {
      return { error: `NF-e com essa chave de acesso já existe no banco. Chave: ...${nfeData.chave_acesso?.slice(-8)}`, ja_existia: true }
    }
    return { error: nfeError.message, ja_existia: false }
  }

  // Inserir itens
  if (itens.length > 0) {
    const itensComId = itens.map(item => ({ ...item, nfe_entrada_id: nfeInserted.id }))
    const { error: itensError } = await sbAdmin.from('nfe_entradas_itens').insert(itensComId)
    if (itensError) {
      await sbAdmin.from('nfe_entradas').delete().eq('id', nfeInserted.id)
      return { error: `Erro ao inserir itens: ${itensError.message}`, ja_existia: false }
    }
  }

  // Snapshot v1 no histórico
  try {
    await sbAdmin.from('nfe_historico').insert({
      nfe_id: nfeInserted.id,
      tenant_id: tenantId,
      versao: 1,
      snapshot: nfeInserted,
      alterado_por: rbacUser?.nome || 'Sistema',
    })
  } catch (e) { console.warn('[importarNFeAction] historico v1:', e) }

  // Log de sucesso
  await registrarLog(sbAdmin, {
    tenantId,
    nfeId: nfeInserted.id,
    acao: 'IMPORTACAO_NFE',
    depois: { numero_nf: nfeInserted.numero_nf, chave_acesso: nfeInserted.chave_acesso, valor_total: nfeInserted.valor_total, nome_emitente: nfeInserted.nome_emitente },
    usuario: rbacUser?.nome,
    perfil: rbacUser?.perfil,
    ip: meta.ip,
    userAgent: meta.userAgent,
  })

  return { error: null, id: nfeInserted.id, ja_existia: false }
}
