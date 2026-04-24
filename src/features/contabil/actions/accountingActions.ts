'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { PLANO_CONTAS_ITG2002 } from '../data/planoContasITG2002'

export async function sincronizarLancamentoContabil(financialId: string) {
  const sb = await createServerSupabase()
  
  // 1. Buscar o lançamento financeiro
  const { data: fin, error: finErr } = await sb
    .from('lancamentos')
    .select('*')
    .eq('id', financialId)
    .single()
  
  if (finErr || !fin || fin.status !== 'pago') return { error: 'Lançamento não elegível para integração contábil' }

  // 2. Buscar o mapeamento para a categoria
  const { data: map, error: mapErr } = await sb
    .from('configuracoes_contabeis')
    .select('*')
    .eq('tenant_id', fin.tenant_id)
    .eq('categoria_nome', fin.categoria)
    .single()
  
  if (mapErr || !map) {
    console.warn(`[AccountingSync] Sem mapeamento para categoria: ${fin.categoria}`)
    return { error: `Categoria '${fin.categoria}' não mapeada no Plano de Contas ITG 2002.` }
  }

  // 3. Verificar se já existe um lançamento contábil vinculado
  const { data: existing } = await sb
    .from('livro_diario')
    .select('id')
    .eq('referencia_financeiro_id', financialId)
    .single()
  
  if (existing) return { error: 'Lançamento já sincronizado' }

  // 4. Criar o lançamento no Livro Diário (Partidas Dobradas)
  // De acordo com a ITG 2002:
  // Se Receita (Ingresso): Débito no Ativo (Banco/Caixa) e Crédito no Ingresso
  // Se Despesa (Dispêndio): Débito no Dispêndio e Crédito no Ativo (Banco/Caixa)

  const entries = []
  const valor = Number(fin.valor)

  if (fin.tipo === 'receita') {
    // Débito: Ativo (Banco/Caixa)
    // Buscamos a conta contábil vinculada ao banco_id do lançamento financeiro
    // Por enquanto, usaremos uma conta padrão de 'Bancos' se não houver mapeamento de conta
    entries.push({
      tenant_id: fin.tenant_id,
      data: fin.data,
      conta_contabil_codigo: '1.1.1.02.001', // Placeholder: Banco Cora
      descricao: `REC. ${fin.descricao}`,
      debito: valor,
      credito: 0,
      referencia_financeiro_id: financialId
    })
    // Crédito: Ingresso (Mapeado)
    entries.push({
      tenant_id: fin.tenant_id,
      data: fin.data,
      conta_contabil_codigo: map.conta_contabil_codigo,
      descricao: `REC. ${fin.descricao}`,
      debito: 0,
      credito: valor,
      referencia_financeiro_id: financialId
    })
  } else {
    // Débito: Dispêndio (Mapeado)
    entries.push({
      tenant_id: fin.tenant_id,
      data: fin.data,
      conta_contabil_codigo: map.conta_contabil_codigo,
      descricao: `PAG. ${fin.descricao}`,
      debito: valor,
      credito: 0,
      referencia_financeiro_id: financialId
    })
    // Crédito: Ativo (Banco/Caixa)
    entries.push({
      tenant_id: fin.tenant_id,
      data: fin.data,
      conta_contabil_codigo: '1.1.1.02.001', // Placeholder
      descricao: `PAG. ${fin.descricao}`,
      debito: 0,
      credito: valor,
      referencia_financeiro_id: financialId
    })
  }

  const { error: insErr } = await sb.from('livro_diario').insert(entries)
  
  return { error: insErr?.message || null }
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
