'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { isPeriodoFechado } from './periodoActions'

export async function getAtivosAction() {
  const sb = await createServerSupabase()
  const { data, error } = await sb
    .from('ativos_imobilizados')
    .select('*, conta_imobilizado:conta_imobilizado_id(codigo, descricao)')
    .order('created_at', { ascending: false })
  
  return { data, error: error?.message }
}

export async function getParametrosAction() {
  const sb = await createServerSupabase()
  const { data, error } = await sb
    .from('parametros_contabeis')
    .select('*')
    .maybeSingle()
  
  return { data: data || { regime_tributario: 'imune' }, error: error?.message }
}

export async function upsertParametrosAction(dados: any) {
  const sb = await createServerSupabase()
  const { data: user } = await sb.auth.getUser()
  const { data: profile } = await sb.from('profiles').select('tenant_id').eq('id', user.user?.id).single()
  const tenantId = profile?.tenant_id || '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  
  const { data, error } = await sb
    .from('parametros_contabeis')
    .upsert({ ...dados, tenant_id: profile?.tenant_id })
    .select()
    .single()

  return { data, error: error?.message }
}

export async function upsertAtivoAction(dados: any) {
  const sb = await createServerSupabase()
  
  // Se for novo, garantir o tenant_id
  if (!dados.id) {
    const { data: user } = await sb.auth.getUser()
    const { data: profile } = await sb.from('usuarios').select('tenant_id').eq('id', user.user?.id).single()
    dados.tenant_id = profile?.tenant_id
  }

  const { data, error } = await sb
    .from('ativos_imobilizados')
    .upsert(dados)
    .select()
    .single()

  return { data, error: error?.message }
}

/**
 * Processa a depreciação mensal de todos os ativos vigentes
 * @param competencia Formato 'YYYY-MM-01'
 */
export async function processarDepreciacaoMensalAction(competencia: string) {
  const sb = await createServerSupabase()
  
  // 1. Identificar o tenant
  const { data: user } = await sb.auth.getUser()
  const { data: profile } = await sb.from('profiles').select('tenant_id').eq('id', user.user?.id).single()
  const tenantId = profile?.tenant_id || '971f92af-a72b-4bc4-a8e0-333d712ce6a7'

  if (!tenantId) return { error: 'Tenant não identificado' }

  // 1.1 Verificar se o período está fechado
  const fechado = await isPeriodoFechado(competencia, tenantId)
  if (fechado) return { error: `O período (${competencia.slice(0, 7)}) está FECHADO. Reabra o período para processar depreciação.` }

  // 2. Buscar ativos elegíveis (status 'ativo' e data aquisição <= competencia)
  const { data: ativos, error: errAtivos } = await sb
    .from('ativos_imobilizados')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'ativo')
    .lte('data_aquisicao', competencia)

  if (errAtivos || !ativos) return { error: errAtivos?.message || 'Erro ao buscar ativos' }

  // 3. Buscar logs já processados para esta competência para evitar duplicidade
  const { data: logs } = await sb
    .from('ativos_depreciacoes_logs')
    .select('ativo_id')
    .eq('tenant_id', tenantId)
    .eq('competencia', competencia)

  const ativosJaProcessados = new Set(logs?.map(l => l.ativo_id) || [])
  const ativosParaProcessar = ativos.filter(a => !ativosJaProcessados.has(a.id))

  if (ativosParaProcessar.length === 0) return { success: true, count: 0, message: 'Todos os ativos já foram depreciados para este mês.' }

  let processados = 0
  let erros = []

  for (const ativo of ativosParaProcessar) {
    try {
      // Cálculo da cota linear (Quota Constante)
      // Cota = (Valor Aquisição - Valor Residual) / Vida Útil Meses
      const baseCalculo = Number(ativo.valor_aquisicao) - Number(ativo.valor_residual || 0)
      const cotaMensal = baseCalculo / Number(ativo.vida_util_meses)
      const valorCota = Math.round(cotaMensal * 100) / 100

      if (valorCota <= 0) continue

      // Verificar se o valor total depreciado já atingiu o valor de mercado (residual)
      const { data: totalDeprec } = await sb
        .from('ativos_depreciacoes_logs')
        .select('valor_cota')
        .eq('ativo_id', ativo.id)
      
      const jaDepreciado = totalDeprec?.reduce((acc, curr) => acc + Number(curr.valor_cota), 0) || 0
      
      if (jaDepreciado >= baseCalculo) {
        // Bem totalmente depreciado, pular
        continue
      }

      // Ajustar última cota se necessário para não ultrapassar a base
      const valorFinal = (jaDepreciado + valorCota > baseCalculo) 
        ? Math.round((baseCalculo - jaDepreciado) * 100) / 100
        : valorCota

      if (valorFinal <= 0) continue

      // 4. Criar Lançamento Contábil
      // D: Despesa de Depreciação (Resultado)
      // C: Depreciação Acumulada (Ativo Redutora)
      const historico = `Depreciação Mensal — Ref: ${competencia.slice(0, 7)} — Bem: ${ativo.codigo_patrimonio}`
      
      const { count } = await sb.from('lancamentos_contabeis').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
      const numero = `${competencia.slice(0,4)}/DEP-${((count || 0) + 1).toString().padStart(5, '0')}`

      const { data: lanc, error: errLanc } = await sb
        .from('lancamentos_contabeis')
        .insert({
          tenant_id: tenantId,
          numero_lancamento: numero,
          data_lancamento: competencia, // Final do mês ou data da competência
          data_competencia: competencia,
          tipo: 'normal',
          historico,
          status: 'confirmado',
          origem_tipo: 'depreciacao',
          origem_id: ativo.id
        })
        .select('id')
        .single()

      if (errLanc || !lanc) {
        erros.push(`Ativo ${ativo.codigo_patrimonio}: ${errLanc?.message}`)
        continue
      }

      // Inserir Partidas
      await sb.from('lancamentos_partidas').insert([
        {
          lancamento_id: lanc.id,
          conta_id: ativo.conta_despesa_deprec_id,
          tipo_partida: 'D',
          valor: valorFinal,
          ordem: 1,
          historico_partida: historico
        },
        {
          lancamento_id: lanc.id,
          conta_id: ativo.conta_depreciacao_acum_id,
          tipo_partida: 'C',
          valor: valorFinal,
          ordem: 2,
          historico_partida: historico
        }
      ])

      // 5. Registrar no Log
      await sb.from('ativos_depreciacoes_logs').insert({
        tenant_id: tenantId,
        ativo_id: ativo.id,
        competencia,
        valor_cota: valorFinal,
        lancamento_id: lanc.id
      })

      processados++
    } catch (e: any) {
      erros.push(`Ativo ${ativo.codigo_patrimonio}: ${e.message}`)
    }
  }

  return { success: true, count: processados, errors: erros.length > 0 ? erros : null }
}
