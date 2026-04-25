'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { repararNumeracaoAction } from './documentLinkActions'

/**
 * Sincroniza um lançamento individual (Financeiro -> Contábil)
 */
export async function sincronizarLancamentoContabil(financialId: string) {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }

  const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()
  const tenantId = userData?.tenant_id

  try {
    // 1. Buscar dados do financeiro
    const { data: l, error: lErr } = await sb
      .from('lancamentos')
      .select('*, associados(nome)')
      .eq('id', financialId)
      .single()

    if (lErr || !l) throw new Error('Lançamento não encontrado')

    // 2. Verificar se já existe (para evitar duplicidade se chamado avulso)
    const { data: existing } = await sb.from('lancamentos_contabeis').select('id, numero_lancamento').eq('origem_id', financialId).maybeSingle()
    if (existing) return { success: true, numero: existing.numero_lancamento, error: 'Lançamento já sincronizado' }

    // 3. Buscar mapeamento de categoria
    const { data: map } = await sb
      .from('contabil_mapeamento_categorias')
      .select('conta_debito_id, conta_credito_id')
      .eq('tenant_id', tenantId)
      .eq('categoria_nome', l.categoria)
      .maybeSingle()

    const contaDebito = map?.conta_debito_id
    const contaCredito = map?.conta_credito_id

    if (!contaDebito || !contaCredito) {
      return { error: `Mapeamento incompleto para a categoria "${l.categoria}"` }
    }

    // 4. Gerar número sequencial para o ano
    const ano = new Date(l.data).getFullYear()
    const { data: maxSeq } = await sb.rpc('get_next_contabil_seq', { p_tenant_id: tenantId, p_ano: ano })
    const seqStr = String(maxSeq || 1).padStart(4, '0')
    const numeroLancamento = `${ano}/${seqStr}`

    // 5. Inserir Capa
    const { data: lancContabil, error: cErr } = await sb
      .from('lancamentos_contabeis')
      .insert({
        tenant_id: tenantId,
        data_lancamento: l.data,
        numero_lancamento,
        historico: `${l.tipo === 'receita' ? 'REC' : 'PAG'} - ${l.descricao}`,
        valor_total: l.valor,
        origem_id: l.id,
        origem_tipo: 'financeiro',
        usuario_id: user.id
      })
      .select()
      .single()

    if (cErr) throw cErr

    // 6. Inserir Partidas (Débito e Crédito)
    const partidas = [
      {
        tenant_id: tenantId,
        lancamento_id: lancContabil.id,
        conta_id: contaDebito,
        tipo_partida: 'D',
        valor: l.valor,
        historico: l.descricao
      },
      {
        tenant_id: tenantId,
        lancamento_id: lancContabil.id,
        conta_id: contaCredito,
        tipo_partida: 'C',
        valor: l.valor,
        historico: l.descricao
      }
    ]

    await sb.from('lancamentos_partidas').insert(partidas)

    return { success: true, numero: numeroLancamento }
  } catch (err: any) {
    return { error: err.message }
  }
}

/**
 * Sincroniza uma nota fiscal individual (Fiscal -> Contábil)
 */
export async function sincronizarNotaFiscalContabil(docId: string, type: 'nfse' | 'nfe') {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }
  const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()
  const tenantId = userData?.tenant_id

  try {
    const table = type === 'nfse' ? 'nfse_entradas' : 'nfe_entradas'
    const { data: doc } = await sb.from(table).select('*').eq('id', docId).single()
    if (!doc) throw new Error('Documento não encontrado')

    // Verificar se já existe
    const { data: existing } = await sb.from('lancamentos_contabeis').select('id').eq('origem_id', docId).maybeSingle()
    if (existing) return { success: true, error: 'Documento já sincronizado' }

    // No fiscal, geralmente usamos categorias fixas ou mapeadas por CFOP/Serviço
    // Para simplificar, buscaremos se há um mapeamento para "FISCAL_NFSE" ou "FISCAL_NFE"
    const catNome = type === 'nfse' ? 'SERVIÇOS PRESTADOS' : 'COMPRA DE MERCADORIAS'
    const { data: map } = await sb.from('contabil_mapeamento_categorias')
      .select('conta_debito_id, conta_credito_id')
      .eq('tenant_id', tenantId)
      .eq('categoria_nome', catNome)
      .maybeSingle()

    if (!map) return { error: `Mapeamento contábil para "${catNome}" não configurado.` }

    const ano = new Date(doc.data_emissao).getFullYear()
    const { data: maxSeq } = await sb.rpc('get_next_contabil_seq', { p_tenant_id: tenantId, p_ano: ano })
    const seqStr = String(maxSeq || 1).padStart(4, '0')
    const numeroLancamento = `${ano}/${seqStr}`

    const { data: lancContabil, error: cErr } = await sb.from('lancamentos_contabeis').insert({
      tenant_id: tenantId,
      data_lancamento: doc.data_emissao,
      numero_lancamento,
      historico: `FISCAL - ${type.toUpperCase()} ${doc.numero_nfse || doc.numero_nfe || ''} - ${doc.prestador_nome || doc.emitente_nome || ''}`,
      valor_total: doc.valor_servicos || doc.valor_total || 0,
      origem_id: doc.id,
      origem_tipo: type,
      usuario_id: user.id
    }).select().single()

    if (cErr) throw cErr

    const v = doc.valor_servicos || doc.valor_total || 0
    await sb.from('lancamentos_partidas').insert([
      { tenant_id: tenantId, lancamento_id: lancContabil.id, conta_id: map.conta_debito_id, tipo_partida: 'D', valor: v, historico: 'Vlr ref. nota fiscal' },
      { tenant_id: tenantId, lancamento_id: lancContabil.id, conta_id: map.conta_credito_id, tipo_partida: 'C', valor: v, historico: 'Vlr ref. nota fiscal' }
    ])

    return { success: true, numero: numeroLancamento }
  } catch (err: any) {
    return { error: err.message }
  }
}

/**
 * Sincroniza todos os lançamentos de um período (Financeiro -> Contábil)
 * Agora com diagnóstico detalhado.
 */
export async function sincronizarPeriodoContabil(dataInicio: string) {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }

  const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()
  const tenantId = userData?.tenant_id

  // Buscar todos os lançamentos do período (ORDENADO CRONOLOGICAMENTE)
  let query = sb
    .from('lancamentos')
    .select('id, data, status, descricao, categoria')
    .gte('data', dataInicio)
    .order('data', { ascending: true })
    .order('created_at', { ascending: true })
  
  if (tenantId) query = query.eq('tenant_id', tenantId)
  
  const { data: items, error } = await query
  
  if (error) return { error: error.message }
  if (!items || items.length === 0) return { success: true, count: 0, total: 0 }

  const results = {
    total: 0,
    success: 0,
    alreadySync: 0,
    skippedStatus: 0,
    skippedMapping: 0,
    errors: [] as string[]
  }

  for (const l of items) {
    results.total++
    
    // 1. Verificar se já existe
    const { data: existing } = await sb
      .from('lancamentos_contabeis')
      .select('id')
      .eq('origem_id', l.id)
      .maybeSingle()

    if (existing) {
      results.alreadySync++
      continue
    }

    // 2. Verificar Status (Trava solicitada pelo usuário)
    const status = (l.status || '').toLowerCase()
    if (status !== 'pago' && status !== 'conciliado') {
      results.skippedStatus++
      continue
    }

    // 3. Sincronizar
    const res = await sincronizarLancamentoContabil(l.id)
    if (res.error) {
      if (res.error.includes('Mapeamento incompleto')) {
        results.skippedMapping++
      } else {
        results.errors.push(`${l.descricao}: ${res.error}`)
      }
    } else {
      results.success++
    }
  }

  // 4. Auto-reparo de numeração (Garante a sequência correta após inserções)
  try {
    await repararNumeracaoAction()
  } catch (err) {
    console.error('Erro no auto-reparo:', err)
  }

  // 5. Registrar Log Detalhado
  await sb.from('contabil_logs').insert({
    tenant_id: tenantId,
    acao: 'SINCRONIZAÇÃO FINANCEIRO',
    detalhes: `Período desde ${dataInicio}. Total: ${results.total} | Sucesso: ${results.success} | Já Sinc: ${results.alreadySync} | Pulados (Status): ${results.skippedStatus} | Pulados (Mapeamento): ${results.skippedMapping}.`,
    usuario_id: user.id
  })

  return { 
    success: true, 
    ...results
  }
}

/**
 * Exclui lançamentos contábeis em lote e registra no log
 */
export async function excluirLancamentosLoteAction(ids: string[], senha: string) {
  if (senha !== '19072425') return { error: 'Senha de exclusão incorreta.' }
  
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }

  // 1. Buscar tenant_id do usuário
  const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()
  const tenantId = userData?.tenant_id

  try {
    // 2. Excluir partidas primeiro (Importante para integridade)
    await sb.from('lancamentos_partidas').delete().in('lancamento_id', ids)

    // 3. Excluir capas
    const { error: delErr } = await sb.from('lancamentos_contabeis').delete().in('id', ids)
    if (delErr) throw delErr

    // 4. Registrar LOG
    await sb.from('contabil_logs').insert({
      tenant_id: tenantId,
      acao: 'EXCLUSÃO EM LOTE',
      detalhes: `Usuário excluiu permanentemente ${ids.length} lançamentos do Livro Diário.`,
      usuario_id: user.id
    })

    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

/**
 * Sincroniza todas as notas fiscais (NFSe e NFe) do período
 */
export async function sincronizarFiscalContabilLote(dataInicio: string) {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }
  const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()
  const tenantId = userData?.tenant_id

  // 1. NFSe (ORDENADO POR DATA)
  const { data: nfses } = await sb.from('nfse_entradas')
    .select('id, data_emissao')
    .eq('tenant_id', tenantId)
    .gte('data_emissao', dataInicio)
    .order('data_emissao', { ascending: true })
  
  let nfseCount = 0
  if (nfses) {
    for (const n of nfses) {
      const res = await sincronizarNotaFiscalContabil(n.id, 'nfse')
      if (!res.error) nfseCount++
    }
  }

  // 2. NFe (ORDENADO POR DATA)
  const { data: nfes } = await sb.from('nfe_entradas')
    .select('id, data_emissao')
    .eq('tenant_id', tenantId)
    .gte('data_emissao', dataInicio)
    .order('data_emissao', { ascending: true })
  let nfeCount = 0
  if (nfes) {
    for (const n of nfes) {
      const res = await sincronizarNotaFiscalContabil(n.id, 'nfe')
      if (!res.error) nfeCount++
    }
  }

  return { nfseCount, nfeCount }
}

/**
 * AÇÃO COMBINADA: Integração Fiscal + Contábil
 */
export async function integracaoFiscalContabilTotalAction(dataInicio: string = '2026-01-01') {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }
  const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()
  const tenantId = userData?.tenant_id

  // 1. Integrar Financeiro (Lançamentos Pagos)
  const resFin = await sincronizarPeriodoContabil(dataInicio)
  
  // 2. Integrar Fiscal (Notas Fiscais)
  const resFis = await sincronizarFiscalContabilLote(dataInicio)

  // 3. Registrar no LOG Central
  await sb.from('contabil_logs').insert({
    tenant_id: tenantId,
    acao: 'INTEGRAÇÃO TOTAL (FISCAL+CONTÁBIL)',
    detalhes: `Sincronização total desde ${dataInicio}. Resumo: ${resFin.success} financeiros e ${resFis.nfseCount + resFis.nfeCount} fiscais integrados.`,
    usuario_id: user.id
  })

  return {
    success: true,
    financeiro: resFin,
    fiscal: resFis,
    resumo: `Financeiro: ${resFin.success} novos, ${resFin.skippedStatus} pulados por status, ${resFin.skippedMapping} sem mapeamento. Fiscal: ${resFis.nfseCount + resFis.nfeCount} notas.`
  }
}
