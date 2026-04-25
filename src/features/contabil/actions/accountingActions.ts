'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { PLANO_CONTAS_ITG2002 } from '../data/planoContasITG2002'
import { isPeriodoFechado } from './periodoActions'

export async function sincronizarLancamentoContabil(financialId: string) {
  const sb = await createServerSupabase()
  
  // 1. Buscar o lançamento financeiro
  const { data: fin, error: finErr } = await sb.from('lancamentos').select('*').eq('id', financialId).maybeSingle()
  if (finErr || !fin) return { error: 'Lançamento não encontrado' }
  
  const isElegivel = fin.status === 'pago' || fin.conciliado === true
  if (!isElegivel) return { error: 'Lançamento não elegível para integração contábil (deve estar pago ou conciliado)' }

  // 1.1 Verificar se o período contábil está fechado
  const fechado = await isPeriodoFechado(fin.data, fin.tenant_id)
  if (fechado) return { error: `O período contábil (${fin.data.slice(0,7)}) está FECHADO. Reabra o período para sincronizar.` }

  // 2. Buscar o mapeamento para a categoria (Normalizado/Fuzzy)
  const { data: allMaps } = await sb
    .from('configuracoes_contabeis')
    .select('*')
    .eq('tenant_id', fin.tenant_id)
  
  const normalize = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '').trim()
  const finCatNorm = normalize(fin.categoria)
  
  const targetTipo = fin.tipo === 'receita' ? 'ingresso' : 'dispendio'
  
  // 2.1 Busca Exata (Normalizada)
  let map = allMaps?.find(m => 
    normalize(m.categoria_nome) === finCatNorm && 
    m.tipo === targetTipo
  )

  // 2.2 Busca Fuzzy (se não achou exata, tenta remover 's' final para lidar com plural/singular)
  if (!map && finCatNorm.length > 3) {
    const finCatFuzzy = finCatNorm.endsWith('s') ? finCatNorm.slice(0, -1) : finCatNorm
    map = allMaps?.find(m => {
      const mNorm = normalize(m.categoria_nome)
      const mFuzzy = mNorm.endsWith('s') ? mNorm.slice(0, -1) : mNorm
      return mFuzzy === finCatFuzzy && m.tipo === targetTipo
    })
  }

  if (!map) {
    console.info(`[AccountingSync] Criando mapeamento automático para: ${fin.categoria}`)
    // 3. Verificar se a conta já existe (por descrição) para evitar duplicatas se o mapeamento sumiu mas a conta ficou
    const { data: existingConta } = await sb
      .from('plano_contas')
      .select('id, codigo')
      .eq('tenant_id', fin.tenant_id)
      .eq('descricao', fin.categoria)
      .maybeSingle()

    let finalCodigo = existingConta?.codigo
    let accountId = existingConta?.id

    const parentCodigo = targetTipo === 'ingresso' ? '3.1.1.01' : '4.2.2.01'
    
    if (!existingConta) {
      // Acha o próximo código sequencial
      const { data: lastAccounts } = await sb
        .from('plano_contas')
        .select('codigo')
        .eq('tenant_id', fin.tenant_id)
        .like('codigo', `${parentCodigo}.%`)
        .order('codigo', { ascending: false })
        .limit(1)

      let nextSeq = 100
      if (lastAccounts && lastAccounts.length > 0) {
        const lastPart = lastAccounts[0].codigo.split('.').pop()
        const lastNum = parseInt(lastPart || '0', 10)
        if (!isNaN(lastNum) && lastNum >= 100) nextSeq = lastNum + 1
      }

      finalCodigo = `${parentCodigo}.${String(nextSeq).padStart(3, '0')}`
      const { data: pai } = await sb.from('plano_contas').select('id').eq('tenant_id', fin.tenant_id).eq('codigo', parentCodigo).single()

      // Cria a conta
      const { data: novaConta, error: errConta } = await sb.from('plano_contas').insert({
        tenant_id: fin.tenant_id,
        codigo: finalCodigo,
        descricao: fin.categoria,
        nivel: 5,
        tipo: 'analitica',
        natureza: targetTipo === 'ingresso' ? 'credora' : 'devedora',
        classificacao: targetTipo === 'ingresso' ? 'ingresso' : 'despesa',
        aceita_lancamentos: true,
        ativa: true,
        conta_pai_id: pai?.id || null
      }).select('id').single()

      if (errConta) {
        // Se deu erro de duplicidade (23505), busca a conta existente
        if (errConta.code === '23505') {
          const { data: ec } = await sb.from('plano_contas').select('id').eq('tenant_id', fin.tenant_id).eq('codigo', finalCodigo).single()
          accountId = ec?.id
        } else {
          return { error: `Erro ao criar conta para '${fin.categoria}': ${errConta.message}` }
        }
      } else {
        accountId = novaConta?.id
      }
    }

    if (accountId && finalCodigo) {
      // Cria ou atualiza o mapeamento (Upsert para evitar erro de concorrência/duplicidade)
      const { data: newMap, error: errMap } = await sb.from('configuracoes_contabeis').upsert({
        tenant_id: fin.tenant_id,
        categoria_nome: fin.categoria,
        conta_contabil_codigo: finalCodigo,
        conta_contabil_nome: fin.categoria,
        tipo: targetTipo,
        updated_at: new Date().toISOString()
      }, { onConflict: 'tenant_id,categoria_nome' }).select('*').single()
      
      if (newMap) map = newMap
      else if (errMap) return { error: `Erro ao mapear '${fin.categoria}': ${errMap.message}` }
    }

    if (!map) {
      return { error: `Categoria '${fin.categoria}' não mapeada no Plano de Contas ITG 2002.` }
    }
  }

  // 3. Buscar os IDs reais das contas contábeis no banco de dados
  let { data: contaCat } = await sb.from('plano_contas').select('id').eq('tenant_id', fin.tenant_id).eq('codigo', map.conta_contabil_codigo).maybeSingle()
  
  // Se a conta mapeada não existir no banco, usar fallback forte
  if (!contaCat) {
    const fallbackCodigo = fin.tipo === 'receita' ? '3.1.1.01.001' : '4.2.2.01.013'
    let { data: fallback } = await sb.from('plano_contas').select('id').eq('tenant_id', fin.tenant_id).eq('codigo', fallbackCodigo).maybeSingle()
    if (!fallback) {
      // Se até o fallback falhar, pega qualquer conta aceita_lancamentos que seja receita ou despesa
      const prefix = fin.tipo === 'receita' ? '3.%' : '4.%'
      const { data: anyFallback } = await sb.from('plano_contas').select('id').eq('tenant_id', fin.tenant_id).like('codigo', prefix).eq('aceita_lancamentos', true).limit(1).maybeSingle()
      fallback = anyFallback
    }
    if (fallback) contaCat = fallback
  }

  // Usa o Banco Cora como padrão, ou qualquer conta de Caixa/Bancos (1.1.1) se não achar
  let { data: contaBanco } = await sb.from('plano_contas').select('id').eq('tenant_id', fin.tenant_id).eq('codigo', '1.1.1.02.001').maybeSingle()
  if (!contaBanco) {
    const { data: fallbackBanco } = await sb.from('plano_contas').select('id').eq('tenant_id', fin.tenant_id).like('codigo', '1.1.1.%').eq('aceita_lancamentos', true).limit(1).maybeSingle()
    if (fallbackBanco) contaBanco = fallbackBanco
  }

  if (!contaCat || !contaBanco) {
    return { error: `Erro fatal: Nenhuma conta contábil raiz (Caixa ou Resultado) encontrada para o tenant.` }
  }

  // 3.1 Verificar se é um pagamento de Nota Fiscal (Escrituração Prévia)
  // Se for, o Débito deve ser em Fornecedores (2.1.3.01.002) e não na Despesa
  const { data: vinculoNfse } = await sb.from('nfse_financeiro_vinculo').select('id').eq('financeiro_id', financialId).maybeSingle()
  const { data: vinculoNfe } = await sb.from('nfe_entradas').select('id, numero_nf').eq('lancamento_financeiro_id', financialId).maybeSingle()

  let contaDebitoEfetiva = contaCat
  let historicoEfetivo = `${fin.tipo === 'receita' ? 'REC' : 'PAG'} — ${fin.descricao}`

  if ((vinculoNfse || vinculoNfe) && fin.tipo === 'despesa') {
    const { data: contaFornecedor } = await sb
      .from('plano_contas')
      .select('id')
      .eq('tenant_id', fin.tenant_id)
      .eq('codigo', '2.1.3.01.002')
      .maybeSingle()
    
    if (contaFornecedor) {
      contaDebitoEfetiva = contaFornecedor
      const refNota = vinculoNfe ? `NF ${vinculoNfe.numero_nf}` : 'NFS-e'
      historicoEfetivo = `PAG — Liq. obrigação ${refNota} — ${fin.descricao}`
    }
  }

  // 4. Verificar e limpar lançamento contábil anterior (Permite Re-sincronização)
  const { data: existing } = await sb.from('lancamentos_contabeis').select('id, numero_lancamento').eq('origem_id', financialId).maybeSingle()
  
  let numero = existing?.numero_lancamento

  if (existing) {
    // Remove apenas as partidas antigas (preserva a capa se possível, mas aqui vamos atualizar a capa)
    await sb.from('lancamentos_partidas').delete().eq('lancamento_id', existing.id)
  }

  // 5. Gerar número do lançamento se não existir
  if (!numero) {
    const ano = fin.data.slice(0, 4)
    const { data: ultimosLancs } = await sb
      .from('lancamentos_contabeis')
      .select('numero_lancamento')
      .eq('tenant_id', fin.tenant_id)
      .like('numero_lancamento', `${ano}/%`)
      .order('numero_lancamento', { ascending: false })
      .limit(1)

    let maxSeq = 0
    if (ultimosLancs && ultimosLancs.length > 0) {
      const parts = ultimosLancs[0].numero_lancamento.split('/')
      if (parts.length === 2) {
        maxSeq = parseInt(parts[1], 10)
      }
    }
    const seq = (maxSeq + 1).toString().padStart(6, '0')
    numero = `${ano}/${seq}`
  }

  // 6. Inserir ou Atualizar Header (Livro Diário - Capa)
  let lancId = existing?.id
  let insErr = null

  if (existing) {
    const { error } = await sb.from('lancamentos_contabeis').update({
      data_lancamento: fin.data,
      data_competencia: fin.data,
      historico: historicoEfetivo,
    }).eq('id', existing.id)
    insErr = error
  } else {
    const { data, error } = await sb.from('lancamentos_contabeis').insert({
      tenant_id: fin.tenant_id,
      numero_lancamento: numero,
      data_lancamento: fin.data,
      data_competencia: fin.data,
      tipo: 'normal',
      historico: historicoEfetivo,
      origem_tipo: 'financeiro',
      origem_id: financialId,
      status: 'confirmado',
    }).select('id').single()
    lancId = data?.id
    insErr = error
  }

  if (insErr || !lancId) return { error: insErr?.message || 'Erro ao criar/atualizar capa do lançamento contábil' }

  // 7. Criar as Partidas (Débito e Crédito)
  const valor = Number(fin.valor)
  const partidas = []

  if (fin.tipo === 'receita') {
    partidas.push({ lancamento_id: lancId, conta_id: contaBanco.id, tipo_partida: 'D', valor, ordem: 1, historico_partida: `Vlr. recebido ref. ${fin.categoria}` })
    partidas.push({ lancamento_id: lancId, conta_id: contaCat.id, tipo_partida: 'C', valor, ordem: 2, historico_partida: `Vlr. recebido ref. ${fin.categoria}` })
  } else {
    partidas.push({ lancamento_id: lancId, conta_id: contaDebitoEfetiva.id, tipo_partida: 'D', valor, ordem: 1, historico_partida: (vinculoNfse || vinculoNfe) ? `Liq. obrigação fiscal vinculada` : `Vlr. pago ref. ${fin.categoria}` })
    partidas.push({ lancamento_id: lancId, conta_id: contaBanco.id, tipo_partida: 'C', valor, ordem: 2, historico_partida: `Vlr. pago ref. ${fin.categoria}` })
  }

  const { error: partErr } = await sb.from('lancamentos_partidas').insert(partidas)

  return { error: partErr?.message || null }
}

/**
 * Sincroniza a PROVISÃO de uma Nota Fiscal (Escrituração Fiscal)
 * D: Despesa/Estoque / C: Fornecedores a Pagar
 */
export async function sincronizarNotaFiscalContabil(notaId: string, tipo: 'nfse' | 'nfe') {
  const sb = await createServerSupabase()
  
  // 1. Buscar dados da nota
  let nota: any
  if (tipo === 'nfse') {
    const { data } = await sb.from('nfse_entradas').select('*, fornecedor:fornecedores(*)').eq('id', notaId).single()
    nota = data
  } else {
    const { data } = await sb.from('nfe_entradas').select('*').eq('id', notaId).single()
    nota = data
  }
  if (!nota) return { error: 'Nota não encontrada' }

  // 2. Definir contas
  const { data: config } = await sb.from('configuracoes_contabeis').select('conta_fornecedores_id').eq('tenant_id', nota.tenant_id).single()
  const contaFornecedorId = config?.conta_fornecedores_id || (await sb.from('plano_contas').select('id').eq('tenant_id', nota.tenant_id).eq('codigo', '2.1.3.01.002').maybeSingle()).data?.id

  // Conta de Débito (Despesa)
  // Para NFe, agrupamos os itens por conta contábil para gerar partidas precisas
  const partidasDebito: any[] = []
  if (tipo === 'nfe') {
    const { data: itens } = await sb.from('nfe_entradas_itens').select('conta_contabil_id, valor_produto').eq('nfe_entrada_id', notaId)
    if (itens && itens.length > 0) {
      // Agrupar por conta
      const agrupado = itens.reduce((acc: any, it: any) => {
        const cid = it.conta_contabil_id || 'PENDENTE'
        acc[cid] = (acc[cid] || 0) + Number(it.valor_produto || 0)
        return acc
      }, {})

      for (const [cid, vlr] of Object.entries(agrupado)) {
        const valorItem = Number(vlr)
        if (valorItem > 0) {
          partidasDebito.push({
            conta_id: cid === 'PENDENTE' ? (await sb.from('plano_contas').select('id').eq('tenant_id', nota.tenant_id).eq('codigo', '4.2.2.01.013').maybeSingle()).data?.id : cid,
            valor: valorItem,
            historico: 'Vlr. ref. produtos tomados'
          })
        }
      }
    }
  } else {
    // Para NFSe
    if (nota.conta_despesa_id && Number(nota.valor_bruto) > 0) {
      partidasDebito.push({
        conta_id: nota.conta_despesa_id,
        valor: Number(nota.valor_bruto),
        historico: 'Vlr. ref. serviço tomado'
      })
    }
  }

  if (partidasDebito.length === 0 || !contaFornecedorId) {
    return { error: 'Contas contábeis ou valores não identificados para a nota. Verifique a escrituração.' }
  }

  // 3. Verificar e preservar lançamento contábil anterior (Permite Re-sincronização)
  const { data: existing } = await sb.from('lancamentos_contabeis').select('id, numero_lancamento').eq('origem_id', notaId).maybeSingle()
  
  let numero = existing?.numero_lancamento

  if (existing) {
    // Remove apenas as partidas antigas
    await sb.from('lancamentos_partidas').delete().eq('lancamento_id', existing.id)
  }

  // 4. Criar Capa (ou usar existente)
  const valorTotal = tipo === 'nfse' ? Number(nota.valor_bruto) : Number(nota.valor_total)
  const numeroDoc = tipo === 'nfse' ? nota.numero_nfse : nota.numero_nf
  const emitente = tipo === 'nfse' ? nota.fornecedor?.nome : nota.nome_emitente
  const historicoCapa = `Escrituração Fiscal ${tipo.toUpperCase()} ${numeroDoc} — ${emitente}`

  if (!numero) {
    const ano = nota.data_emissao.slice(0, 4)
    const { data: ultimosLancs } = await sb
      .from('lancamentos_contabeis')
      .select('numero_lancamento')
      .eq('tenant_id', nota.tenant_id)
      .like('numero_lancamento', `${ano}/%`)
      .order('numero_lancamento', { ascending: false })
      .limit(1)

    let maxSeq = 0
    if (ultimosLancs && ultimosLancs.length > 0) {
      const parts = ultimosLancs[0].numero_lancamento.split('/')
      if (parts.length === 2) {
        maxSeq = parseInt(parts[1], 10)
      }
    }
    const seq = (maxSeq + 1).toString().padStart(6, '0')
    numero = `${ano}/${seq}`
  }

  let lancId = existing?.id
  let insErr = null

  if (existing) {
    const { error } = await sb.from('lancamentos_contabeis').update({
      data_lancamento: nota.data_emissao,
      data_competencia: nota.data_competencia || nota.data_emissao,
      historico: historicoCapa,
    }).eq('id', existing.id)
    insErr = error
  } else {
    const { data, error } = await sb.from('lancamentos_contabeis').insert({
      tenant_id: nota.tenant_id,
      numero_lancamento: numero,
      data_lancamento: nota.data_emissao,
      data_competencia: nota.data_competencia || nota.data_emissao,
      tipo: 'normal',
      historico: historicoCapa,
      origem_tipo: tipo === 'nfse' ? 'fiscal_nfse' : 'fiscal',
      origem_id: notaId,
      status: 'confirmado'
    }).select('id').single()
    lancId = data?.id
    insErr = error
  }

  if (insErr || !lancId) return { error: insErr?.message || 'Erro ao criar/atualizar capa do lançamento' }

  // 5. Inserir Partidas
  const finalPartidas = [
    ...partidasDebito.map((p, i) => ({
      lancamento_id: lancId,
      conta_id: p.conta_id,
      tipo_partida: 'D',
      valor: p.valor,
      ordem: i + 1,
      historico_partida: p.historico
    })),
    {
      lancamento_id: lancId,
      conta_id: contaFornecedorId,
      tipo_partida: 'C',
      valor: valorTotal,
      ordem: partidasDebito.length + 1,
      historico_partida: 'Vlr. provisão para pagamento (Passivo)'
    }
  ]

  await sb.from('lancamentos_partidas').insert(finalPartidas)

  return { success: true }
}

export async function sincronizarPeriodoContabil(dataInicio: string) {
  const sb = await createServerSupabase()
  
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }
  const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()
  const tenantId = userData?.tenant_id

  // 1. Buscar todos os lançamentos pagos ou conciliados desde a data de início
  let query = sb.from('lancamentos')
    .select('id')
    .or('status.eq.pago,conciliado.eq.true')
    .gte('data', dataInicio)
  
  if (tenantId) query = query.eq('tenant_id', tenantId)
  
  const { data: lancs, error } = await query
  
  if (error) return { error: error.message }
  if (!lancs || lancs.length === 0) return { success: true, count: 0, total: 0 }

  let count = 0
  let alreadySynced = 0
  let errors = []

  for (const l of lancs) {
    const res = await sincronizarLancamentoContabil(l.id)
    if (!res.error) count++
    else if (res.error === 'Lançamento já sincronizado') {
      alreadySynced++
    } else {
      errors.push(`${l.id}: ${res.error}`)
    }
  }

  // 2. Registrar LOG da operação
  await sb.from('contabil_logs').insert({
    tenant_id: tenantId,
    acao: 'SINCRONIZAÇÃO EM MASSA',
    detalhes: `Processados ${lancs.length} itens. Sucesso: ${count}. Já sincronizados: ${alreadySynced}. Erros: ${errors.length}. Período: ${dataInicio}`,
    usuario_id: user.id
  })

  return { 
    success: true, 
    count, 
    total: lancs.length, 
    alreadySynced,
    errors: errors.length > 0 ? errors : null 
  }
}
