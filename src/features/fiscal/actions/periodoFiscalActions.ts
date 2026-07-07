'use server'

import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import { verifyToken } from '@/lib/auth/rbac'
import crypto from 'crypto'

async function getRbacUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('rbac_token')?.value
    if (!token) return null
    const payload = await verifyToken(token)
    return payload ? { nome: (payload as any).nome || (payload as any).name || '', perfil: (payload as any).role || (payload as any).perfil || 'usuario' } : null
  } catch { return null }
}

async function registrarLogPeriodo(sb: any, tenantId: string, acao: string, dados: Record<string, any>, usuario?: string, perfil?: string) {
  try {
    const { error } = await sb.from('fiscal_logs').insert({
      tenant_id: tenantId,
      acao,
      depois: dados,
      usuario: usuario || 'Sistema',
      perfil: perfil || 'sistema',
      versao_sistema: '2.0',
    })
    if (error) {
      await sb.from('contabil_logs').insert({
        tenant_id: tenantId,
        acao: `FISCAL: ${acao}`,
        detalhes: `${usuario || 'Sistema'} | ${JSON.stringify(dados).substring(0, 200)}`,
      })
    }
  } catch (e) { console.warn('[periodoFiscalActions] log:', e) }
}

// ─── Listar períodos (busca do banco + fallback local) ─────────────────────────

export async function getPeriodosFiscaisAction(tenantId: string) {
  if (!tenantId) return { data: [], error: 'Tenant não identificado' }
  const sb = await createServerSupabase()
  const { data, error } = await sb
    .from('periodos_fiscais')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('competencia', { ascending: false })
  if (error) {
    // Tabela ainda não existe — retorna vazio sem erro crítico
    if (error.code === '42P01') return { data: [], error: null }
    return { data: [], error: error.message }
  }
  return { data: data || [], error: null }
}

export async function getPeriodoStatusAction(competencia: string, tenantId: string) {
  if (!competencia || !tenantId) return { status: 'aberto' }
  const sb = await createServerSupabase()
  const competenciaDate = competencia.slice(0, 7) + '-01'
  const { data } = await sb
    .from('periodos_fiscais')
    .select('status, fechado_em, fechado_por')
    .eq('tenant_id', tenantId)
    .eq('competencia', competenciaDate)
    .maybeSingle()
  return { status: data?.status || 'aberto', fechado_em: data?.fechado_em, fechado_por: data?.fechado_por }
}

// ─── Fechar período ─────────────────────────────────────────────────────────

export async function fecharPeriodoFiscalAction(competencia: string, tenantId: string) {
  if (!competencia || !tenantId) return { error: 'Parâmetros inválidos' }

  const sbAdmin = await createAdminSupabase()
  const rbacUser = await getRbacUser()
  const competenciaDate = competencia.slice(0, 7) + '-01'

  // Buscar todas as notas do período
  const { data: nfes } = await sbAdmin
    .from('nfe_entradas')
    .select('id, numero_nf, status_escrituracao, chave_acesso, valor_total, cnpj_emitente, data_emissao, data_entrada, data_escrituracao, tenant_id')
    .eq('tenant_id', tenantId)
    .gte('data_emissao', competenciaDate)
    .lt('data_emissao', new Date(new Date(competenciaDate).setMonth(new Date(competenciaDate).getMonth() + 1)).toISOString().slice(0, 10))
    .is('deleted_at', null)

  const nfesPendentes = (nfes || []).filter(n => n.status_escrituracao !== 'escriturada' && n.status_escrituracao !== 'cancelada')
  if (nfesPendentes.length > 0) {
    return { error: `Existem ${nfesPendentes.length} nota(s) ainda não escrituradas: ${nfesPendentes.map(n => n.numero_nf).join(', ')}. Conclua todas antes de fechar o período.` }
  }

  // Gerar hash SHA-256 do fechamento
  const hashPayload = (nfes || []).map(n =>
    `${n.chave_acesso}|${n.valor_total}|${n.data_escrituracao}`
  ).sort().join('\n')
  const fechadoHash = crypto.createHash('sha256').update(hashPayload + tenantId + competencia).digest('hex')

  // Upsert período
  const { error } = await sbAdmin
    .from('periodos_fiscais')
    .upsert({
      tenant_id: tenantId,
      competencia: competenciaDate,
      status: 'fechado',
      fechado_em: new Date().toISOString(),
      fechado_por: rbacUser?.nome || 'Administrador',
      fechado_hash: fechadoHash,
    }, { onConflict: 'tenant_id,competencia' })

  if (error) return { error: error.message }

  // Log de auditoria
  await registrarLogPeriodo(sbAdmin, tenantId, 'FECHAMENTO_PERIODO', {
    competencia,
    total_notas: nfes?.length || 0,
    hash: fechadoHash,
    fechado_por: rbacUser?.nome,
  }, rbacUser?.nome, rbacUser?.perfil)

  return { error: null, hash: fechadoHash, total_notas: nfes?.length || 0 }
}

// ─── Reabrir período (requer senha Tesoureiro + motivo) ──────────────────────

export async function reabrirPeriodoFiscalAction(competencia: string, tenantId: string, motivo: string) {
  if (!competencia || !tenantId) return { error: 'Parâmetros inválidos' }
  if (!motivo || motivo.trim().length < 20) return { error: 'Motivo obrigatório (mínimo 20 caracteres).' }

  const sbAdmin = await createAdminSupabase()
  const rbacUser = await getRbacUser()
  const competenciaDate = competencia.slice(0, 7) + '-01'
  const protocolo = crypto.randomUUID()

  const { error } = await sbAdmin
    .from('periodos_fiscais')
    .upsert({
      tenant_id: tenantId,
      competencia: competenciaDate,
      status: 'em_escrituracao',
      reaberto_em: new Date().toISOString(),
      reaberto_por: rbacUser?.nome || 'Tesoureiro',
      reaberto_motivo: motivo.trim(),
      reaberto_protocolo: protocolo,
    }, { onConflict: 'tenant_id,competencia' })

  if (error) return { error: error.message }

  await registrarLogPeriodo(sbAdmin, tenantId, 'REABERTURA_PERIODO', {
    competencia,
    motivo: motivo.trim(),
    protocolo,
    reaberto_por: rbacUser?.nome,
  }, rbacUser?.nome, rbacUser?.perfil)

  return { error: null, protocolo }
}

// ─── Bloquear período (pós-SPED transmitido — irreversível via sistema) ───────

export async function bloquearPeriodoFiscalAction(competencia: string, tenantId: string) {
  if (!competencia || !tenantId) return { error: 'Parâmetros inválidos' }

  const sbAdmin = await createAdminSupabase()
  const rbacUser = await getRbacUser()
  const competenciaDate = competencia.slice(0, 7) + '-01'

  // Somente Admin Mestre pode bloquear
  if (rbacUser?.perfil !== 'admin' && rbacUser?.perfil !== 'administrador' && rbacUser?.perfil !== 'master') {
    return { error: 'Somente o Administrador Mestre pode bloquear períodos (pós-SPED).' }
  }

  const { error } = await sbAdmin
    .from('periodos_fiscais')
    .upsert({
      tenant_id: tenantId,
      competencia: competenciaDate,
      status: 'bloqueado',
      bloqueado_em: new Date().toISOString(),
      bloqueado_por: rbacUser?.nome,
    }, { onConflict: 'tenant_id,competencia' })

  if (error) return { error: error.message }

  await registrarLogPeriodo(sbAdmin, tenantId, 'BLOQUEIO_PERIODO', {
    competencia,
    bloqueado_por: rbacUser?.nome,
    motivo: 'SPED/EFD transmitido — período bloqueado permanentemente',
  }, rbacUser?.nome, rbacUser?.perfil)

  return { error: null }
}
