'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { repararNumeracaoAction } from './documentLinkActions'
import { getMyTenantIdAction } from '@/app/actions/tenantActions'

/**
 * Sincroniza um lançamento individual (Financeiro -> Contábil)
 */
export async function sincronizarLancamentoContabil(financialId: string) {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }

  const tenantId = await getMyTenantIdAction()

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

    // 3. Buscar mapeamento de categoria na tabela correta
    const { data: config } = await sb
      .from('configuracoes_contabeis')
      .select('conta_contabil_codigo, tipo')
      .eq('tenant_id', tenantId)
      .eq('categoria_nome', l.categoria)
      .maybeSingle()

    if (!config) {
      return { error: `Mapeamento não encontrado para a categoria "${l.categoria}". Configure no menu Contabilidade > Configurações.` }
    }

    // 4. Resolver IDs das contas a partir dos códigos
    const { data: plano } = await sb.from('plano_contas').select('id, codigo, aceita_lancamentos').eq('tenant_id', tenantId)
    
    const mappedAccount = plano?.find(p => p.codigo === config.conta_contabil_codigo)
    if (!mappedAccount) {
      return { error: `Conta contábil "${config.conta_contabil_codigo}" (mapeada para "${l.categoria}") não encontrada no Plano de Contas.` }
    }

    // Buscar conta de contrapartida (Caixa/Banco)
    // Tenta 1.1.1.02 (Bancos), depois 1.1.1.01 (Caixa), depois qualquer uma no grupo 1.1.1 que aceite lançamentos
    const bankAccount = plano?.find(p => p.codigo === '1.1.1.02') || 
                        plano?.find(p => p.codigo === '1.1.1.01') || 
                        plano?.find(p => p.codigo.startsWith('1.1.1') && p.aceita_lancamentos)

    if (!bankAccount) {
      return { error: 'Conta de Banco ou Caixa não encontrada no Grupo 1.1.1 do Plano de Contas.' }
    }

    // Determinar Débito e Crédito baseado no tipo (ingresso/dispendio)
    let contaDebitoId, contaCreditoId
    if (config.tipo === 'ingresso') {
      contaDebitoId = bankAccount.id      // D: Banco/Caixa
      contaCreditoId = mappedAccount.id   // C: Receita
    } else {
      contaDebitoId = mappedAccount.id    // D: Despesa
      contaCreditoId = bankAccount.id     // C: Banco/Caixa
    }

    // 5. Gerar número sequencial para o ano
    const ano = new Date(l.data).getFullYear()
    const { data: maxSeq } = await sb.rpc('get_next_contabil_seq', { p_tenant_id: tenantId, p_ano: ano })
    const seqStr = String(maxSeq || 1).padStart(4, '0')
    const numeroLancamento = `${ano}/${seqStr}`

    // 6. Inserir Capa do Lançamento
    const { data: lancContabil, error: cErr } = await sb
      .from('lancamentos_contabeis')
      .insert({
        tenant_id: tenantId,
        data_lancamento: l.data,
        numero_lancamento: numeroLancamento,
        historico: `${l.tipo === 'receita' ? 'REC' : 'PAG'} - ${l.descricao}`,
        origem_id: l.id,
        origem_tipo: 'financeiro',
        usuario_nome: user.email // Usando email como identificador do usuário
      })
      .select()
      .single()

    if (cErr) throw cErr

    // 7. Inserir Partidas
    const partidas = [
      {
        tenant_id: tenantId,
        lancamento_id: lancContabil.id,
        conta_id: contaDebitoId,
        tipo_partida: 'D',
        valor: l.valor,
        historico: l.descricao
      },
      {
        tenant_id: tenantId,
        lancamento_id: lancContabil.id,
        conta_id: contaCreditoId,
        tipo_partida: 'C',
        valor: l.valor,
        historico: l.descricao
      }
    ]

    await sb.from('lancamentos_partidas').insert(partidas)

    return { success: true, numero: numeroLancamento }
  } catch (err: any) {
    console.error('Erro sincronizarLancamentoContabil:', err)
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
  const tenantId = await getMyTenantIdAction()

  try {
    const table = type === 'nfse' ? 'nfse_entradas' : 'nfe_entradas'
    const { data: doc } = await sb.from(table).select('*').eq('id', docId).single()
    if (!doc) throw new Error('Documento não encontrado')

    // Verificar se já existe
    const { data: existing } = await sb.from('lancamentos_contabeis').select('id').eq('origem_id', docId).maybeSingle()
    if (existing) return { success: true, error: 'Documento já sincronizado' }

    const catNome = type === 'nfse' ? 'SERVIÇOS PRESTADOS' : 'COMPRA DE MERCADORIAS'
    
    // Buscar mapeamento
    const { data: config } = await sb
      .from('configuracoes_contabeis')
      .select('conta_contabil_codigo, tipo')
      .eq('tenant_id', tenantId)
      .eq('categoria_nome', catNome)
      .maybeSingle()

    if (!config) return { error: `Mapeamento contábil para "${catNome}" não configurado.` }

    // Resolver IDs
    const { data: plano } = await sb.from('plano_contas').select('id, codigo, aceita_lancamentos').eq('tenant_id', tenantId)
    const mappedAccount = plano?.find(p => p.codigo === config.conta_contabil_codigo)
    const bankAccount = plano?.find(p => p.codigo === '1.1.1.02') || 
                        plano?.find(p => p.codigo === '1.1.1.01') || 
                        plano?.find(p => p.codigo.startsWith('1.1.1') && p.aceita_lancamentos)

    if (!mappedAccount || !bankAccount) return { error: 'Contas contábeis (mapeamento ou banco) não encontradas no plano.' }

    const ano = new Date(doc.data_emissao).getFullYear()
    const { data: maxSeq } = await sb.rpc('get_next_contabil_seq', { p_tenant_id: tenantId, p_ano: ano })
    const seqStr = String(maxSeq || 1).padStart(4, '0')
    const numeroLancamento = `${ano}/${seqStr}`

    const { data: lancContabil, error: cErr } = await sb.from('lancamentos_contabeis').insert({
      tenant_id: tenantId,
      data_lancamento: doc.data_emissao,
      numero_lancamento: numeroLancamento,
      historico: `FISCAL - ${type.toUpperCase()} ${doc.numero_nfse || doc.numero_nf || ''} - ${doc.prestador_nome || doc.nome_emitente || ''}`,
      origem_id: doc.id,
      origem_tipo: type,
      usuario_nome: user.email
    }).select().single()

    if (cErr) throw cErr

    const v = doc.valor_servicos || doc.valor_produtos || doc.valor_total || 0
    
    let contaDebitoId, contaCreditoId
    if (config.tipo === 'ingresso') {
       contaDebitoId = bankAccount.id
       contaCreditoId = mappedAccount.id
    } else {
       contaDebitoId = mappedAccount.id
       contaCreditoId = bankAccount.id
    }

    await sb.from('lancamentos_partidas').insert([
      { tenant_id: tenantId, lancamento_id: lancContabil.id, conta_id: contaDebitoId, tipo_partida: 'D', valor: v, historico: 'Vlr ref. nota fiscal' },
      { tenant_id: tenantId, lancamento_id: lancContabil.id, conta_id: contaCreditoId, tipo_partida: 'C', valor: v, historico: 'Vlr ref. nota fiscal' }
    ])

    return { success: true, numero: numeroLancamento }
  } catch (err: any) {
    console.error('Erro sincronizarNotaFiscalContabil:', err)
    return { error: err.message }
  }
}

/**
 * Sincroniza todos os lançamentos de um período (Financeiro -> Contábil)
 */
export async function sincronizarPeriodoContabil(dataInicio: string) {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }

  const tenantId = await getMyTenantIdAction()

  let query = sb
    .from('lancamentos')
    .select('id, data, status, descricao, categoria')
    .gte('data', dataInicio)
    .order('data', { ascending: true })
    .order('created_at', { ascending: true })
  
  if (tenantId) query = query.eq('tenant_id', tenantId)
  
  const { data: items, error } = await query
  
  if (error) return { error: error.message }
  if (!items || items.length === 0) return { success: true, total: 0 }

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
    
    // Verificar se já existe
    const { data: existing } = await sb.from('lancamentos_contabeis').select('id').eq('origem_id', l.id).maybeSingle()
    if (existing) {
      results.alreadySync++
      continue
    }

    // Filtrar status
    const status = (l.status || '').toLowerCase()
    if (status !== 'pago' && status !== 'conciliado') {
      results.skippedStatus++
      continue
    }

    const res = await sincronizarLancamentoContabil(l.id)
    if (res.error) {
      if (res.error.includes('Mapeamento não encontrado')) results.skippedMapping++
      else results.errors.push(`${l.descricao}: ${res.error}`)
    } else {
      results.success++
    }
  }

  // Tentar reparar numeração
  try { await repararNumeracaoAction() } catch (err) { console.error('Erro no auto-reparo:', err) }

  // Log imutável (com try-catch para não quebrar o retorno principal se a tabela não existir)
  try {
    await sb.from('contabil_logs').insert({
      tenant_id: tenantId,
      acao: 'SINCRONIZAÇÃO FINANCEIRO',
      detalhes: `Período desde ${dataInicio}. Total: ${results.total} | Sucesso: ${results.success} | Já Sinc: ${results.alreadySync} | Pulados (Status): ${results.skippedStatus} | Pulados (Mapeamento): ${results.skippedMapping}.`,
      usuario_id: user.id
    })
  } catch (logErr) {
    console.warn('Erro ao gravar log contábil (tabela pode estar ausente):', logErr)
  }

  return { ...results, success: true }
}

/**
 * Exclui lançamentos contábeis em lote e registra no log
 */
export async function excluirLancamentosLoteAction(ids: string[], senha: string) {
  if (senha !== '19072425') return { error: 'Senha de exclusão incorreta.' }
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }
  const tenantId = await getMyTenantIdAction()

  try {
    await sb.from('lancamentos_partidas').delete().in('lancamento_id', ids)
    const { error: delErr } = await sb.from('lancamentos_contabeis').delete().in('id', ids)
    if (delErr) throw delErr
    
    try {
      await sb.from('contabil_logs').insert({
        tenant_id: tenantId,
        acao: 'EXCLUSÃO EM LOTE',
        detalhes: `Usuário excluiu permanentemente ${ids.length} lançamentos do Livro Diário.`,
        usuario_id: user.id
      })
    } catch (logErr) {}

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
  const tenantId = await getMyTenantIdAction()

  const { data: nfses } = await sb.from('nfse_entradas').select('id, data_emissao').eq('tenant_id', tenantId).gte('data_emissao', dataInicio).order('data_emissao', { ascending: true })
  let nfseCount = 0
  if (nfses) { for (const n of nfses) { const res = await sincronizarNotaFiscalContabil(n.id, 'nfse'); if (!res.error) nfseCount++ } }

  const { data: nfes } = await sb.from('nfe_entradas').select('id, data_emissao').eq('tenant_id', tenantId).gte('data_emissao', dataInicio).order('data_emissao', { ascending: true })
  let nfeCount = 0
  if (nfes) { for (const n of nfes) { const res = await sincronizarNotaFiscalContabil(n.id, 'nfe'); if (!res.error) nfeCount++ } }

  return { nfseCount, nfeCount }
}

/**
 * AÇÃO COMBINADA: Integração Fiscal + Contábil
 */
export async function integracaoFiscalContabilTotalAction(dataInicio: string = '2026-01-01') {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }
  const tenantId = await getMyTenantIdAction()

  const resFin: any = await sincronizarPeriodoContabil(dataInicio)
  const resFis: any = await sincronizarFiscalContabilLote(dataInicio)

  try {
    await sb.from('contabil_logs').insert({
      tenant_id: tenantId,
      acao: 'INTEGRAÇÃO TOTAL (FISCAL+CONTÁBIL)',
      detalhes: `Sincronização total desde ${dataInicio}. Resumo: ${resFin.success || 0} financeiros e ${(resFis.nfseCount || 0) + (resFis.nfeCount || 0)} fiscais integrados.`,
      usuario_id: user.id
    })
  } catch (logErr) {}

  return {
    success: true,
    financeiro: resFin,
    fiscal: resFis,
    resumo: `Financeiro: ${resFin.success || 0} novos, ${resFin.skippedStatus || 0} pulados por status, ${resFin.skippedMapping || 0} sem mapeamento. Fiscal: ${(resFis.nfseCount || 0) + (resFis.nfeCount || 0)} notas.`
  }
}
