'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { repararNumeracaoAction } from './documentLinkActions'
import { getMyTenantIdAction } from '@/app/actions/tenantActions'

/**
 * Cliente admin para garantir que a integração total funcione sem falhas de RLS no servidor
 */
const getAdminClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

/**
 * Normaliza string para comparação
 */
function normalizar(str: string): string {
  return (str || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Encontra ou cria conta contábil para Fornecedor
 */
async function getOrCreatePessoaAccount(
  sb: any,
  tenantId: string,
  pessoaId: string,
  tipo: 'fornecedor',
  nome: string
): Promise<{ id: string; codigo: string; descricao: string } | null> {
  try {
    const { data: pessoa } = await sb.from('fornecedores').select('conta_contabil_id').eq('id', pessoaId).single()
    if (pessoa?.conta_contabil_id) {
      const { data: conta } = await sb.from('plano_contas').select('id, codigo, descricao').eq('id', pessoa.conta_contabil_id).single()
      if (conta) return conta
    }

    const descBusca = `FORNECEDOR: ${nome.toUpperCase()}`
    const { data: existente } = await sb.from('plano_contas').select('id, codigo, descricao').eq('tenant_id', tenantId).eq('descricao', descBusca).maybeSingle()
    if (existente) {
      await sb.from('fornecedores').update({ conta_contabil_id: existente.id }).eq('id', pessoaId)
      return existente
    }

    // 1. Garantir conta pai (2.1.2 - FORNECEDORES)
    let { data: pai } = await sb.from('plano_contas').select('*').eq('tenant_id', tenantId).eq('codigo', '2.1.2').maybeSingle()
    
    if (!pai) {
      // Se não existe, cria a 2.1.2 como sintética
      const { data: novaPai } = await sb.from('plano_contas').insert({
        tenant_id: tenantId, codigo: '2.1.2', descricao: 'FORNECEDORES',
        nivel: 3, tipo: 'sintetica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: false, ativa: true
      }).select().single()
      pai = novaPai
    } else if (pai.tipo === 'analitica') {
      // Se existe mas é analítica, converte para sintética para poder ter filhos
      await sb.from('plano_contas').update({ tipo: 'sintetica', aceita_lancamentos: false }).eq('id', pai.id)
    }

    const parentCodigo = '2.1.2'
    const parentId = pai?.id

    // 2. Achar próximo sequencial (Busca por buracos para evitar duplicidade)
    const { data: todas } = await sb.from('plano_contas')
      .select('codigo')
      .eq('tenant_id', tenantId)
      .like('codigo', `${parentCodigo}.%`)

    const codigosExistentes = new Set(todas?.map((c: any) => c.codigo) || [])
    let nextSeq = 1
    let novoCodigo = ''
    while (true) {
      const candidate = `${parentCodigo}.${String(nextSeq).padStart(3, '0')}`
      const candidateAlt = `${parentCodigo}.${nextSeq}`
      if (!codigosExistentes.has(candidate) && !codigosExistentes.has(candidateAlt)) {
        novoCodigo = candidate
        break
      }
      nextSeq++
      if (nextSeq > 999) break
    }

    if (!novoCodigo) return null
    
    // 3. Criar a conta analítica do fornecedor
    const { data: nova, error: createError } = await sb.from('plano_contas').insert({
      tenant_id: tenantId, 
      codigo: novoCodigo, 
      descricao: descBusca,
      nivel: 4, 
      tipo: 'analitica', 
      natureza: 'credora', 
      classificacao: 'passivo', 
      aceita_lancamentos: true, 
      ativa: true, 
      conta_pai_id: parentId || null
    }).select().single()

    if (nova) {
      await sb.from('fornecedores').update({ conta_contabil_id: (nova as any).id }).eq('id', pessoaId)
      return nova as any
    }
    return null
  } catch (err) { 
    console.error('[Accounting] Error in getOrCreatePessoaAccount:', err)
    return null 
  }
}

async function getOrCreateFallbackAccount(sb: any, plano: any[], tenantId: string, tipo: 'ingresso' | 'dispendio'): Promise<any> {
  const codigoFallback = tipo === 'ingresso' ? '3.5.99' : '4.3.99'
  let conta = plano.find((p: any) => p.codigo === codigoFallback)
  if (!conta) {
    try {
      const { data: nova } = await sb.from('plano_contas').insert({
        tenant_id: tenantId, codigo: codigoFallback, 
        descricao: tipo === 'ingresso' ? 'Outros Ingressos A Classificar' : 'Outros Dispêndios A Classificar',
        classificacao: tipo === 'ingresso' ? 'ingresso' : 'despesa', nivel: 4, tipo: 'analitica', natureza: tipo === 'ingresso' ? 'credora' : 'devedora', aceita_lancamentos: true, ativa: true
      }).select().single()
      if (nova) { plano.push(nova); conta = nova }
    } catch (err) {}
  }
  return conta || null
}

async function carregarContextoContabil(tenantIdInput?: string) {
  const sb = getAdminClient()
  const tenantId = tenantIdInput || await getMyTenantIdAction()
  
  // Busca em lote de todas as tabelas de referência para evitar queries individuais no loop
  const [{ data: configs }, { data: plano }, { data: forns }, { data: assocs }] = await Promise.all([
      sb.from('configuracoes_contabeis').select('*').eq('tenant_id', tenantId),
      sb.from('plano_contas').select('*').eq('tenant_id', tenantId),
      sb.from('fornecedores').select('id, nome').eq('tenant_id', tenantId),
      sb.from('associados').select('id, nome').eq('tenant_id', tenantId)
  ])

  // Criar mapas para acesso ultra-rápido
  const fornecedoresMap: Record<string, string> = {}
  if (forns) forns.forEach(f => fornecedoresMap[f.id] = f.nome)
  
  const associadosMap: Record<string, string> = {}
  if (assocs) assocs.forEach(a => associadosMap[a.id] = a.nome)

  return { 
      configs: (configs as any[]) || [], 
      plano: (plano as any[]) || [], 
      fornecedoresMap,
      associadosMap,
      tenantId 
  }
}

export async function sincronizarLancamentoContabil(financialIdOrObject: string | any, contexto?: any, sbClient?: any, emailUsuario?: string, numeroForçado?: string) {
  const sb = sbClient || getAdminClient()
  let usuarioEmail = emailUsuario
  if (!usuarioEmail && !sbClient) {
      const { data: { user } } = await (await createServerSupabase()).auth.getUser()
      usuarioEmail = user?.email || 'sistema@integracao.com'
  }
  if (!usuarioEmail) usuarioEmail = 'sistema@integracao.com'

  try {
    let l: any
    if (typeof financialIdOrObject === 'string') {
        const { data, error: lErr } = await sb.from('lancamentos').select('*').eq('id', financialIdOrObject).single()
        if (lErr || !data) return { error: 'Lançamento não encontrado' }
        l = data
    } else {
        l = financialIdOrObject
    }

    if (l.is_ec_destino) return { error: 'EC ignorado' }
    if (!['pago', 'conciliado', 'liquidado'].includes((l.status || '').toLowerCase())) return { error: 'Status inválido' }

    const { data: existing } = await sb.from('lancamentos_contabeis').select('id, numero_lancamento').eq('origem_id', l.id).maybeSingle()
    if (existing) return { success: true, alreadySync: true }

    const ctx = contexto || await carregarContextoContabil()
    const configs = ctx.configs as any[]
    const plano = ctx.plano as any[]
    const tenantId = ctx.tenantId

    // Busca vínculo com nota fiscal para enriquecer o lançamento
    let linkedNFInfo = ''
    const { data: vinculoNF } = await sb.from('nfse_financeiro_vinculo').select('nfse_id, nfse_entradas(numero_nfse)').eq('transacao_id', l.id).maybeSingle()
    if (vinculoNF?.nfse_entradas) {
        linkedNFInfo = `NF ${vinculoNF.nfse_entradas.numero_nfse}`
    }

    let fornecedorAccount = null
    if (l.fornecedor_id) {
        const nomeFor = ctx.fornecedoresMap?.[l.fornecedor_id]
        if (nomeFor) fornecedorAccount = await getOrCreatePessoaAccount(sb, tenantId, l.fornecedor_id, 'fornecedor', nomeFor)
    }

    const historico = (l.descricao || '').toUpperCase()
    const categoriaNorm = normalizar(l.categoria)
    const targetNature = l.tipo === 'receita' ? 'ingresso' : 'dispendio'
    
    let configMatch = configs.find((c: any) => normalizar(c.categoria_nome) === categoriaNorm && c.tipo === targetNature)
    if (!configMatch) configMatch = configs.find((c: any) => normalizar(c.categoria_nome) === categoriaNorm)

    if (historico.includes('ALUGUEL')) configMatch = configs.find((c: any) => c.categoria_nome === 'ALUGUEL') || configMatch
    else if (historico.includes('TARIFA') || historico.includes('TAXA') || historico.includes('BOLETO')) configMatch = configs.find((c: any) => c.categoria_nome === 'TARIFAS BANCÁRIAS') || configMatch
    else if (historico.includes('ALIMENTAÇÃO') || historico.includes('REFEIÇÃO')) configMatch = configs.find((c: any) => c.categoria_nome === 'ALIMENTAÇÃO') || configMatch
    else if (historico.includes('COMBUSTÍVEL') || historico.includes('POSTO')) configMatch = configs.find((c: any) => c.categoria_nome === 'COMBUSTÍVEL') || configMatch

    if (!configMatch) {
      const fb = await getOrCreateFallbackAccount(sb, plano, tenantId, targetNature)
      configMatch = { conta_contabil_codigo: fb?.codigo, tipo: targetNature }
    }

    let mappedAccount = plano.find((p: any) => p.codigo === configMatch.conta_contabil_codigo)
    if (!mappedAccount) mappedAccount = await getOrCreateFallbackAccount(sb, plano, tenantId, targetNature)

    const { data: bankMapping } = await sb.from('configuracoes_contabeis').select('conta_contabil_codigo').eq('tenant_id', tenantId).eq('categoria_nome', `banco_${l.conta_id}`).maybeSingle()
    let bankAccount = bankMapping ? plano.find((p: any) => p.codigo === (bankMapping as any).conta_contabil_codigo) : null
    if (!bankAccount) bankAccount = plano.find((p: any) => p.codigo === '1.1.1.2') || plano.find((p: any) => p.codigo === '1.1.1.02')

    if (historico.includes('ESPÉCIE') || historico.includes('DINHEIRO')) {
      const caixa = plano.find((p: any) => p.codigo === '1.1.1.01') || plano.find((p: any) => p.codigo === '1.1.1.1')
      if (caixa) bankAccount = caixa
    }

    if (!bankAccount || !mappedAccount) throw new Error(`Contas não localizadas (Banco: ${bankAccount?.codigo || '?'}, Mapeada: ${mappedAccount?.codigo || '?'})`)

    const partidas = []
    // Extrair Taxa da descrição para compor o valor BRUTO na contabilidade
    const matchTaxa = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/);
    const taxaVal = matchTaxa ? parseFloat(matchTaxa[1].replace(/\./g, '').replace(',', '.')) : 0;
    
    const valor = Math.abs(Number(l.valor)) + (l.tipo === 'receita' ? taxaVal : 0)
    const desc = `${l.descricao || l.categoria} ${linkedNFInfo}`.trim()

    // LÓGICA DE PRIORIDADE: Se o usuário informou contas manuais D e C, usa elas e ignora o resto
    if (l.conta_debito_id && l.conta_credito_id) {
        partidas.push({ conta_id: l.conta_debito_id, tipo_partida: 'D', valor, ordem: 1, historico_partida: desc })
        partidas.push({ conta_id: l.conta_credito_id, tipo_partida: 'C', valor, ordem: 2, historico_partida: desc })
    } 
    // Se informou apenas uma, sobrepõe a conta correspondente na lógica automática
    else {
        const dAccId = l.conta_debito_id || (l.tipo === 'receita' ? bankAccount.id : mappedAccount.id)
        const cAccId = l.conta_credito_id || (l.tipo === 'receita' ? mappedAccount.id : bankAccount.id)

        if (fornecedorAccount && l.tipo === 'despesa') {
            // Se houver fornecedor, passamos pela conta individual dele (Provisão + Pagamento)
            // Isso garante que o crédito apareça na conta individual do fornecedor
            if (!l.conta_debito_id && !l.conta_credito_id) {
                partidas.push({ conta_id: mappedAccount.id, tipo_partida: 'D', valor, ordem: 1, historico_partida: desc })
                partidas.push({ conta_id: fornecedorAccount.id, tipo_partida: 'C', valor, ordem: 2, historico_partida: desc })
                partidas.push({ conta_id: fornecedorAccount.id, tipo_partida: 'D', valor, ordem: 3, historico_partida: `PAGTO: ${ctx.fornecedoresMap?.[l.fornecedor_id] || 'FORNECEDOR'}` })
                partidas.push({ conta_id: bankAccount.id, tipo_partida: 'C', valor, ordem: 4, historico_partida: `PAGTO: ${ctx.fornecedoresMap?.[l.fornecedor_id] || 'FORNECEDOR'}` })
            } else {
                const dAccId = l.conta_debito_id || mappedAccount.id
                const cAccId = l.conta_credito_id || fornecedorAccount.id
                partidas.push({ conta_id: dAccId, tipo_partida: 'D', valor, ordem: 1, historico_partida: desc })
                partidas.push({ conta_id: cAccId, tipo_partida: 'C', valor, ordem: 2, historico_partida: desc })
            }
        } else {
            const dAccId = l.conta_debito_id || (l.tipo === 'receita' ? bankAccount.id : mappedAccount.id)
            const cAccId = l.conta_credito_id || (l.tipo === 'receita' ? mappedAccount.id : bankAccount.id)
            partidas.push({ conta_id: dAccId, tipo_partida: 'D', valor, ordem: 1, historico_partida: desc })
            partidas.push({ conta_id: cAccId, tipo_partida: 'C', valor, ordem: 2, historico_partida: desc })
        }
    }

    let numero = numeroForçado
    if (!numero) {
        const ano = l.data.slice(0, 4)
        const { data: last } = await sb.from('lancamentos_contabeis').select('numero_lancamento').eq('tenant_id', tenantId).like('numero_lancamento', `${ano}/%`).order('numero_lancamento', { ascending: false }).limit(1).maybeSingle()
        let nextNum = 1
        if (last) {
          const parts = last.numero_lancamento.split('/')
          if (parts.length === 2) nextNum = parseInt(parts[1], 10) + 1
        }
        numero = `${ano}/${String(nextNum).padStart(6, '0')}`
    }

    const { data: lancContabil, error: insErr } = await sb.from('lancamentos_contabeis').insert({
      tenant_id: tenantId, numero_lancamento: numero, data_lancamento: l.data, data_competencia: l.data,
      historico: desc, origem_id: l.id, origem_tipo: 'financeiro', status: 'confirmado', usuario_nome: usuarioEmail,
      documento_tipo: linkedNFInfo ? 'NF' : null,
      documento_numero: vinculoNF?.nfse_entradas?.numero_nfse || null
    }).select().single()

    if (insErr) throw new Error(insErr.message)

    await sb.from('lancamentos_partidas').insert(partidas.map(p => ({ ...p, lancamento_id: (lancContabil as any).id })))
    return { success: true }
  } catch (err: any) { 
    console.error('[Integrador] Falha no item:', (financialIdOrObject as any)?.id || financialIdOrObject, err.message)
    return { error: err.message } 
  }
}

export async function sincronizarPeriodoContabil(dataInicio: string, dataFim?: string) {
  try {
    const sb = getAdminClient()
    const { data: { user } } = await (await createServerSupabase()).auth.getUser()
    const email = user?.email || 'sistema@integracao.com'
    const tenantId = await getMyTenantIdAction()
    const ctx = await carregarContextoContabil(tenantId)
    
    // Otimização: Fetch sem joins para evitar erro de 'schema cache'
    const { data: items, error: fetchErr } = await sb.from('lancamentos')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('data', dataInicio)
      .lte('data', dataFim || '2099-12-31')
      .order('data', { ascending: true })
      
    if (fetchErr) throw fetchErr
    if (!items) return { success: true, total: 0, successCount: 0, tenantId }
    
    const ano = dataInicio.slice(0, 4)
    const { data: last } = await sb.from('lancamentos_contabeis').select('numero_lancamento').eq('tenant_id', tenantId).like('numero_lancamento', `${ano}/%`).order('numero_lancamento', { ascending: false }).limit(1).maybeSingle()
    let nextNum = 1
    if (last) {
      const parts = last.numero_lancamento.split('/')
      if (parts.length === 2) nextNum = parseInt(parts[1], 10) + 1
    }

    let successCount = 0
    let alreadySyncCount = 0
    let skippedStatusCount = 0
    let errorCount = 0
    let firstError = null
    
    for (const l of items) {
      if (!['pago', 'conciliado', 'liquidado'].includes((l.status || '').toLowerCase())) {
          skippedStatusCount++
          continue
      }
      
      const numero = `${ano}/${String(nextNum).padStart(6, '0')}`
      const res = await sincronizarLancamentoContabil(l, ctx, sb, email, numero)
      if (res.success) {
          if ((res as any).alreadySync) {
              alreadySyncCount++
          } else {
              successCount++
              nextNum++
          }
      } else {
          errorCount++
          if (!firstError) firstError = res.error
      }
    }
    await repararNumeracaoAction()
    return { success: true, total: items.length, successCount: successCount, alreadySync: alreadySyncCount, skippedStatus: skippedStatusCount, errorCount, firstError, tenantId }
  } catch (err: any) {
    console.error('[Integrador] Falha fatal no periodo:', err.message)
    return { error: err.message, success: false }
  }
}

export async function sincronizarNotaFiscalContabil(docId: string, type: 'nfse' | 'nfe', sbClient?: any, numeroForçado?: string) {
  const sb = sbClient || getAdminClient()
  try {
    const table = type === 'nfse' ? 'nfse_entradas' : 'nfe_entradas'
    const { data: doc } = await sb.from(table).select('*').eq('id', docId).single()
    if (!doc) throw new Error('Doc não encontrado')

    // REQUISITO: Bloquear integração se não houver vínculo financeiro
    if (type === 'nfse') {
        const { data: vinculo } = await sb.from('nfse_financeiro_vinculo').select('transacao_id').eq('nfse_id', docId).maybeSingle()
        if (!vinculo) return { success: false, skipped: true, error: 'Nota sem vínculo financeiro ignorada' }
        
        // Se houver vínculo, verifica se o financeiro já foi integrado
        const { data: jaIntegrado } = await sb.from('lancamentos_contabeis').select('id').eq('origem_id', vinculo.transacao_id).maybeSingle()
        if (jaIntegrado) return { success: true, alreadySync: true, message: 'Já integrado via financeiro' }
    } else {
        // Para NFe, checa se tem o campo de vínculo direto (se existir) ou se o status é pendente
        if (!doc.lancamento_financeiro_id) return { success: false, skipped: true, error: 'NFe sem vínculo financeiro ignorada' }
        const { data: jaIntegrado } = await sb.from('lancamentos_contabeis').select('id').eq('origem_id', doc.lancamento_financeiro_id).maybeSingle()
        if (jaIntegrado) return { success: true, alreadySync: true, message: 'Já integrado via financeiro' }
    }

    const ctx = await carregarContextoContabil(doc.tenant_id)
    
    let numero = numeroForçado
    if (!numero) {
        const ano = doc.data_emissao.slice(0, 4)
        const { data: last } = await sb.from('lancamentos_contabeis').select('numero_lancamento').eq('tenant_id', ctx.tenantId).like('numero_lancamento', `${ano}/%`).order('numero_lancamento', { ascending: false }).limit(1).maybeSingle()
        let nextNum = 1
        if (last) {
          const parts = last.numero_lancamento.split('/')
          if (parts.length === 2) nextNum = parseInt(parts[1], 10) + 1
        }
        numero = `${ano}/${String(nextNum).padStart(6, '0')}`
    }

    const { data: lancContabil } = await sb.from('lancamentos_contabeis').insert({
      tenant_id: ctx.tenantId, numero_lancamento: numero, data_lancamento: doc.data_emissao, data_competencia: doc.data_emissao,
      historico: `FISCAL - ${type.toUpperCase()} ${doc.numero_nfse || doc.numero_nf || ''} - ${doc.prestador_nome || doc.nome_emitente || ''}`,
      origem_id: doc.id, origem_tipo: type, status: 'confirmado'
    }).select().single()
    
    const v = doc.valor_servicos || doc.valor_total || 0
    const { data: c1 } = await sb.from('plano_contas').select('id').eq('tenant_id', ctx.tenantId).eq('codigo', '4.3.8').single()
    const { data: c2 } = await sb.from('plano_contas').select('id').eq('tenant_id', ctx.tenantId).eq('codigo', '1.1.1.2').single()
    if (c1 && c2) {
      await sb.from('lancamentos_partidas').insert([
        { lancamento_id: (lancContabil as any).id, conta_id: c1.id, tipo_partida: 'D', valor: v, ordem: 1, historico_partida: 'NF' },
        { lancamento_id: (lancContabil as any).id, conta_id: c2.id, tipo_partida: 'C', valor: v, ordem: 2, historico_partida: 'NF' }
      ])
    }
    return { success: true }
  } catch (err: any) { return { error: err.message } }
}

export async function sincronizarFiscalContabilLote(dataInicio: string, dataFim?: string) {
  try {
    const sb = getAdminClient()
    const tenantId = await getMyTenantIdAction()
    const ctx = await carregarContextoContabil(tenantId)
    const { data: nfses } = await sb.from('nfse_entradas').select('id, data_emissao').eq('tenant_id', tenantId).gte('data_emissao', dataInicio).lte('data_emissao', dataFim || '2099-12-31')
    const { data: nfes } = await sb.from('nfe_entradas').select('id, data_emissao').eq('tenant_id', tenantId).gte('data_emissao', dataInicio).lte('data_emissao', dataFim || '2099-12-31')
    
    const ano = dataInicio.slice(0, 4)
    const { data: last } = await sb.from('lancamentos_contabeis').select('numero_lancamento').eq('tenant_id', tenantId).like('numero_lancamento', `${ano}/%`).order('numero_lancamento', { ascending: false }).limit(1).maybeSingle()
    let nextNum = 1
    if (last) {
      const parts = last.numero_lancamento.split('/')
      if (parts.length === 2) nextNum = parseInt(parts[1], 10) + 1
    }

    let nfseCount = 0
    if (nfses) for (const n of nfses) { 
        const num = `${ano}/${String(nextNum).padStart(6, '0')}`
        const res = await sincronizarNotaFiscalContabil(n.id, 'nfse', sb, num)
        if (res.success) { nfseCount++; nextNum++ } 
    }
    let nfeCount = 0
    if (nfes) for (const n of nfes) { 
        const num = `${ano}/${String(nextNum).padStart(6, '0')}`
        const res = await sincronizarNotaFiscalContabil(n.id, 'nfe', sb, num)
        if (res.success) { nfeCount++; nextNum++ } 
    }
    return { nfseCount, nfeCount, success: true }
  } catch (err: any) {
    return { error: err.message, success: false }
  }
}

export async function excluirLancamentosLoteAction(ids: string[], senha: string) {
  if (senha !== '19072425') return { error: 'Senha incorreta' }
  const sb = getAdminClient()
  await sb.from('lancamentos_partidas').delete().in('lancamento_id', ids)
  await sb.from('lancamentos_contabeis').delete().in('id', ids)
  return { success: true }
}

export async function integracaoFiscalContabilTotalAction(dataInicio: string = '2026-01-01', dataFim?: string) {
  try {
    const resFin = await sincronizarPeriodoContabil(dataInicio, dataFim)
    if (!resFin.success) return { success: false, error: `Erro no financeiro: ${resFin.error}`, resumo: 'Falha no processamento financeiro' }

    const resFis = await sincronizarFiscalContabilLote(dataInicio, dataFim)
    if (!resFis.success) return { success: false, error: `Erro no fiscal: ${resFis.error}`, resumo: 'Falha no processamento fiscal' }

    const financeiroRes = { ...resFin, success: resFin.successCount }

    const resumo = `Fin: ${resFin.successCount || 0} ok, ${resFin.errorCount || 0} err. Fis: ${(resFis as any).nfseCount + (resFis as any).nfeCount} notas. ${resFin.firstError ? 'Atenção: ' + resFin.firstError : ''}`
    return { success: true, financeiro: financeiroRes, fiscal: resFis, tenantId: resFin.tenantId, resumo }
  } catch (err: any) {
    return { error: err.message, success: false, resumo: 'Erro durante a integração' }
  }
}

export { repararNumeracaoAction }
