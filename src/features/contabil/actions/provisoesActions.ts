'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { isPeriodoFechado } from './periodoActions'

/**
 * Calcula a provisão mensal (1/12 avos) para 13º e Férias + Encargos
 */
export async function processarProvisoesMensaisAction(competencia: string, baseSalarial: number) {
  const sb = await createServerSupabase()
  const { data: user } = await sb.auth.getUser()
  const { data: profile } = await sb.from('profiles').select('tenant_id').eq('id', user.user?.id).single()
  const tenantId = profile?.tenant_id || '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  
  if (!tenantId) return { error: 'Tenant não identificado' }

  // 1. Verificar trava de período
  const fechado = await isPeriodoFechado(competencia, tenantId)
  if (fechado) return { error: `O período (${competencia.slice(0, 7)}) está FECHADO.` }

  // 2. Cálculos (Simplificado: 1/12 avos)
  const cota13 = baseSalarial / 12
  const cotaFerias = (baseSalarial / 12) * 1.3333 // Incluindo 1/3 constitucional
  
  // Encargos (Simulado: 20% INSS + 8% FGTS = 28%)
  const encargos13 = cota13 * 0.28
  const encargosFerias = cotaFerias * 0.28

  const valorTotal = cota13 + cotaFerias + encargos13 + encargosFerias
  const historico = `Provisão Mensal (1/12) — 13º e Férias — Ref: ${competencia.slice(0, 7)}`

  // 3. Criar Lançamento
  const { count } = await sb.from('lancamentos_contabeis').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
  const numero = `${competencia.slice(0,4)}/PROV-${((count || 0) + 1).toString().padStart(5, '0')}`

  const { data: lanc, error: errLanc } = await sb
    .from('lancamentos_contabeis')
    .insert({
      tenant_id: tenantId,
      numero_lancamento: numero,
      data_lancamento: competencia,
      data_competencia: competencia,
      tipo: 'normal',
      historico,
      status: 'confirmado',
      origem_tipo: 'provisao'
    })
    .select('id')
    .single()

  if (errLanc || !lanc) return { error: errLanc?.message || 'Erro ao criar lançamento' }

  // 4. Partidas
  // D: Despesa com Pessoal (Resultado) -> 4.1.1.01.001
  // C: Provisão para 13º (Passivo) -> 2.1.1.01.003
  // C: Provisão para Férias (Passivo) -> 2.1.1.01.002
  
  // Buscar IDs das contas
  const { data: contas } = await sb.from('plano_contas').select('id, codigo').eq('tenant_id', tenantId).in('codigo', ['4.1.1.01.001', '2.1.1.01.003', '2.1.1.01.002'])
  const idDespesa = contas?.find(c => c.codigo === '4.1.1.01.001')?.id
  const id13 = contas?.find(c => c.codigo === '2.1.1.01.003')?.id
  const idFerias = contas?.find(c => c.codigo === '2.1.1.01.002')?.id

  if (!idDespesa || !id13 || !idFerias) return { error: 'Contas de provisão não encontradas no plano.' }

  await sb.from('lancamentos_partidas').insert([
    { lancamento_id: lanc.id, conta_id: idDespesa, tipo_partida: 'D', valor: valorTotal, ordem: 1, historico_partida: historico },
    { lancamento_id: lanc.id, conta_id: id13, tipo_partida: 'C', valor: cota13 + encargos13, ordem: 2, historico_partida: 'Cota 13º + Encargos' },
    { lancamento_id: lanc.id, conta_id: idFerias, tipo_partida: 'C', valor: cotaFerias + encargosFerias, ordem: 3, historico_partida: 'Cota Férias + Encargos' }
  ])

  return { success: true, valor: valorTotal }
}
