'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { PLANO_CONTAS_ITG2002 } from '../data/planoContasITG2002'

export async function sincronizarLancamentoContabil(financialId: string) {
  const sb = await createServerSupabase()
  
  // 1. Buscar o lançamento financeiro
  const { data: fin, error: finErr } = await sb.from('lancamentos').select('*').eq('id', financialId).single()
  if (finErr || !fin || fin.status !== 'pago') return { error: 'Lançamento não elegível para integração contábil' }

  // 2. Buscar o mapeamento para a categoria
  const { data: map, error: mapErr } = await sb.from('configuracoes_contabeis').select('*').eq('tenant_id', fin.tenant_id).eq('categoria_nome', fin.categoria).single()
  if (mapErr || !map) {
    console.warn(`[AccountingSync] Sem mapeamento para categoria: ${fin.categoria}`)
    return { error: `Categoria '${fin.categoria}' não mapeada no Plano de Contas ITG 2002.` }
  }

  // 3. Buscar os IDs reais das contas contábeis no banco de dados
  const { data: contaCat } = await sb.from('plano_contas').select('id').eq('tenant_id', fin.tenant_id).eq('codigo', map.conta_contabil_codigo).single()
  // Usa o Banco Cora como padrão provisório para a contrapartida de Caixa/Bancos
  const { data: contaBanco } = await sb.from('plano_contas').select('id').eq('tenant_id', fin.tenant_id).eq('codigo', '1.1.1.02.001').single()

  if (!contaCat || !contaBanco) {
    return { error: 'As contas contábeis correspondentes não foram inicializadas no banco de dados.' }
  }

  // 4. Verificar se já existe um lançamento contábil vinculado (origem_id)
  const { data: existing } = await sb.from('lancamentos_contabeis').select('id').eq('origem_id', financialId).single()
  if (existing) return { error: 'Lançamento já sincronizado' }

  // 5. Gerar número do lançamento
  const { count } = await sb.from('lancamentos_contabeis').select('*', { count: 'exact', head: true }).eq('tenant_id', fin.tenant_id)
  const seq = ((count || 0) + 1).toString().padStart(6, '0')
  const ano = fin.data.slice(0, 4)
  const numero = `${ano}/${seq}`

  // 6. Inserir Header (Livro Diário - Capa)
  const { data: lanc, error: insErr } = await sb.from('lancamentos_contabeis').insert({
    tenant_id: fin.tenant_id,
    numero_lancamento: numero,
    data_lancamento: fin.data,
    data_competencia: fin.data,
    tipo: 'normal',
    historico: `${fin.tipo === 'receita' ? 'REC' : 'PAG'} — ${fin.descricao}`,
    origem_tipo: 'financeiro',
    origem_id: financialId,
    status: 'confirmado',
  }).select('id').single()

  if (insErr || !lanc) return { error: insErr?.message || 'Erro ao criar capa do lançamento contábil' }

  // 7. Criar as Partidas (Débito e Crédito)
  const valor = Number(fin.valor)
  const partidas = []

  if (fin.tipo === 'receita') {
    partidas.push({ lancamento_id: lanc.id, conta_id: contaBanco.id, tipo_partida: 'D', valor, ordem: 1, historico_partida: `Vlr. recebido ref. ${fin.categoria}` })
    partidas.push({ lancamento_id: lanc.id, conta_id: contaCat.id, tipo_partida: 'C', valor, ordem: 2, historico_partida: `Vlr. recebido ref. ${fin.categoria}` })
  } else {
    partidas.push({ lancamento_id: lanc.id, conta_id: contaCat.id, tipo_partida: 'D', valor, ordem: 1, historico_partida: `Vlr. pago ref. ${fin.categoria}` })
    partidas.push({ lancamento_id: lanc.id, conta_id: contaBanco.id, tipo_partida: 'C', valor, ordem: 2, historico_partida: `Vlr. pago ref. ${fin.categoria}` })
  }

  const { error: partErr } = await sb.from('lancamentos_partidas').insert(partidas)

  return { error: partErr?.message || null }
}

export async function sincronizarPeriodoContabil(dataInicio: string) {
  const sb = await createServerSupabase()
  
  // 1. Buscar todos os lançamentos pagos desde a data de início
  const { data: lancs, error } = await sb
    .from('lancamentos')
    .select('id')
    .eq('status', 'pago')
    .gte('data', dataInicio)
  
  if (error) return { error: error.message }
  if (!lancs || lancs.length === 0) return { success: true, count: 0 }

  let count = 0
  let errors = []

  for (const l of lancs) {
    const res = await sincronizarLancamentoContabil(l.id)
    if (!res.error) count++
    else if (res.error !== 'Lançamento já sincronizado') {
      errors.push(`${l.id}: ${res.error}`)
    }
  }

  return { success: true, count, total: lancs.length, errors: errors.length > 0 ? errors : null }
}
