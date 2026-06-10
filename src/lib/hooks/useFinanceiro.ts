import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import { useFechamento } from './useFechamento'
import { safeSum, safeDiff } from '@/lib/utils/formatters'
import type { Lancamento, LancamentoInput } from '@/lib/types'

export function useFinanceiro() {
  const tenantId = useTenantId()
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const { isPeriodoBloqueado } = useFechamento()
  const sb = createClient()

  const fetch = useCallback(async (ano?: number) => {
    if (!tenantId) return
    setLoading(true)
    try {
      const targetYear = ano || new Date().getFullYear()
      const start = `${targetYear}-01-01`
      const end = `${targetYear}-12-31`

      let allData: Lancamento[] = []
      let from = 0
      const step = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await sb.from('lancamentos')
          .select('*, nfse_vinculo:nfse_financeiro_vinculo(*, nfse:nfse_id(numero_nfse, xml_url), nfe:nfe_id(numero_nf, chave_acesso))')
          .eq('tenant_id', tenantId)
          .gte('data', start)
          .lte('data', end)
          .order('data', { ascending: false })
          .order('id', { ascending: true })
          .range(from, from + step - 1)

        if (error) throw error
        if (!data || data.length === 0) {
          hasMore = false
        } else {
          allData = [...allData, ...data]
          if (data.length < step) hasMore = false
          else from += step
        }
      }
      
      // Auto-update para status 'atrasado' se a data já passou e ainda está 'aberto'
      const todayStr = new Date().toISOString().split('T')[0]
      const itemsToMarkOverdue = allData.filter(l => l.status === 'aberto' && l.data < todayStr)
      
      if (itemsToMarkOverdue.length > 0) {
        const ids = itemsToMarkOverdue.map(i => i.id)
        // Faz o update no banco de forma silenciosa
        sb.from('lancamentos').update({ status: 'atrasado' }).in('id', ids).then(({ error }) => {
          if (error) console.error('Erro ao atualizar status atrasado:', error)
        })
        // Atualiza a lista local antes do setLancamentos para refletir imediatamente na UI
        allData = allData.map(l => (l.status === 'aberto' && l.data < todayStr) ? { ...l, status: 'atrasado' } : l)
      }
      // 2. Fetch all links for this tenant using a Server Action to bypass RLS
      const { getVinculosFinanceiroAction } = await import('@/features/fiscal/actions/nfseActions')
      const { data: allLinks } = await getVinculosFinanceiroAction(tenantId)
      
      if (allLinks && allLinks.length > 0) {
        // Map links by transacao_id
        const linksByTransacao: Record<string, any[]> = {}
        allLinks.forEach((link: any) => {
          if (!linksByTransacao[link.transacao_id]) linksByTransacao[link.transacao_id] = []
          linksByTransacao[link.transacao_id].push(link)
        })

        // Enriquecer vínculos de NF-e manualmente
        const nfeIds = [...new Set(allLinks.filter((v: any) => v.nfe_id).map((v: any) => v.nfe_id))]
        const nfeMap: Record<string, any> = {}
        
        if (nfeIds.length > 0) {
          const { data: nfeRows } = await sb.from('nfe_entradas').select('id, numero_nf, chave_acesso').in('id', nfeIds)
          if (nfeRows) {
            nfeRows.forEach((n: any) => { nfeMap[n.id] = n })
          }
        }

        allData = allData.map((l: any) => {
          const transacaoLinks = linksByTransacao[l.id] || []
          return {
            ...l,
            nfse_vinculo: transacaoLinks.map(v => ({
              ...v,
              nfe: v.nfe_id && nfeMap[v.nfe_id] ? nfeMap[v.nfe_id] : null
            }))
          }
        })
      } else {
        // Se não tem links, garante que nfse_vinculo é um array vazio
        allData = allData.map((l: any) => ({ ...l, nfse_vinculo: l.nfse_vinculo || [] }))
      }

      setLancamentos(allData)
    } catch (err) {
      console.error('Error fetching financeiro:', err)
      setLancamentos([])
    } finally {
      setLoading(false)
    }
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: LancamentoInput) => {
    if (isPeriodoBloqueado(input.data)) return { error: 'Este período está fechado e não permite alterações.' }
    
    let finalInput = { ...input }

    // Regra de Split de Taxa para Associados: O que passar de R$ 50 é taxa (Apenas se for < 100)
    if (finalInput.tipo === 'receita' && 
        (finalInput.categoria === 'MENSALIDADE' || finalInput.categoria === 'ADESAO' || finalInput.associado_id) && 
        Number(finalInput.valor) > 50 && Number(finalInput.valor) < 100) {
      const total = Number(finalInput.valor)
      const valorLiquido = 50
      const valorTaxa = total - 50
      
      finalInput.valor = valorLiquido
      const taxaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTaxa)
      if (!finalInput.descricao.includes('(Taxa:')) {
        finalInput.descricao = `${finalInput.descricao} (Taxa: ${taxaFmt})`
      }
    } else if (finalInput.taxa && finalInput.taxa > 0) {
      const taxaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalInput.taxa)
      if (!finalInput.descricao.includes('(Taxa:')) {
        finalInput.descricao = `${finalInput.descricao} (Taxa: ${taxaFmt})`
      }
    }
    
    delete (finalInput as any).taxa 

    const { data, error } = await sb.from('lancamentos').insert({ ...finalInput, tenant_id: tenantId }).select('id, status').single()
    if (!error) {
      if (data && data.status === 'pago') {
        const { sincronizarLancamentoContabil } = await import('@/features/contabil/actions/accountingActions')
        sincronizarLancamentoContabil(data.id)
      }
      fetch()
    }
    return { error }
  }

  const atualizar = async (id: string, input: Partial<LancamentoInput>) => {
    if (!id || String(id) === 'undefined') return { error: 'ID do lançamento não identificado para atualização.' }
    const item = lancamentos.find(l => l.id === id)
    if (item && isPeriodoBloqueado(item.data)) return { error: 'Este período está fechado e não permite alterações.' }
    if (input.data && isPeriodoBloqueado(input.data)) return { error: 'Não é possível mover lançamentos para períodos fechados.' }
    
    const { error } = await sb.from('lancamentos').update(input).eq('id', id)
    if (!error) {
      // Integração Contábil Automática
      if (input.status === 'pago') {
        const { sincronizarLancamentoContabil } = await import('@/features/contabil/actions/accountingActions')
        sincronizarLancamentoContabil(id)
      }
      fetch()
    }
    return { error }
  }

  const remover = async (id: string) => {
    if (!id || String(id) === 'undefined') return { error: 'ID do lançamento não identificado para exclusão.' }
    const item = lancamentos.find(l => l.id === id)
    if (!item) return { error: 'Lançamento não encontrado.' }
    if (isPeriodoBloqueado(item.data)) return { error: 'Este período está fechado e não permite alterações.' }
    
    // Lógica de Estorno de Remanejo (Encontro de Contas)
    if (item.is_ec_destino && item.id_origem) {
      const original = lancamentos.find(l => l.id === item.id_origem)

      if (original) {
        // Devolve o valor ao original
        const novoValorOriginal = Number(original.valor) + Number(item.valor)
        
        // Tenta recuperar a descrição com taxa se o valor voltar a ser > 50 e for associado
        let novaDescOriginal = original.descricao.replace(/\[ENCONTRO DE CONTAS[^\]]*\]/, '').trim()
        
        if (novoValorOriginal > 50 && (original.categoria === 'MENSALIDADE' || original.associado_id)) {
           const valorTaxa = novoValorOriginal - 50
           const taxaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTaxa)
           if (!novaDescOriginal.includes('(Taxa:')) {
             novaDescOriginal = `${novaDescOriginal} (Taxa: ${taxaFmt})`
           }
           await sb.from('lancamentos').update({ valor: 50, descricao: novaDescOriginal }).eq('id', original.id)
        } else {
           await sb.from('lancamentos').update({ valor: novoValorOriginal, descricao: novaDescOriginal }).eq('id', original.id)
        }
      }
    }

    const { error } = await sb.from('lancamentos').delete().eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const removerBulk = async (ids: string[]) => {
    if (!ids.length) return { error: null }
    // Verifica se algum item no lote está bloqueado
    const hasLocked = lancamentos.some(l => ids.includes(l.id) && isPeriodoBloqueado(l.data))
    if (hasLocked) return { error: 'Alguns itens selecionados pertencem a períodos fechados.' }

    try {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100)
        const { error } = await sb.from('lancamentos').delete().in('id', chunk)
        if (error) throw error
      }
      fetch()
      return { error: null }
    } catch (err: any) {
      console.error('Erro removerBulk:', err)
      return { error: err.message || 'Erro desconhecido ao remover em lote.' }
    }
  }

  const removerSerie = async (recorrencia_id: string) => {
    if (!recorrencia_id) return { error: 'Este lançamento não faz parte de uma série.' }
    
    // Filtra os IDs da série para checar bloqueio
    const idsSerie = lancamentos.filter(l => l.recorrencia_id === recorrencia_id).map(l => l.id)
    const hasLocked = lancamentos.some(l => idsSerie.includes(l.id) && isPeriodoBloqueado(l.data))
    if (hasLocked) return { error: 'Não é possível excluir a série: alguns itens pertencem a períodos fechados.' }

    const { error } = await sb.from('lancamentos').delete().eq('recorrencia_id', recorrencia_id)
    if (!error) fetch()
    return { error }
  }

  const inserirBulk = async (items: LancamentoInput[]) => {
    if (!tenantId) {
      console.error('Tentativa de inserirBulk financeiro sem tenant_id')
      return { error: 'Identificação da conta não encontrada.' }
    }
    
    const hasLocked = items.some(i => isPeriodoBloqueado(i.data))
    if (hasLocked) return { error: 'Alguns itens do lote pertencem a períodos fechados.' }

    // Auditoria: Verifica duplicatas no banco antes de inserir (mesmo tenant, data, valor e descrição)
    const { data: existing } = await sb.from('lancamentos')
      .select('data, valor, descricao, tenant_id, banco_transacao_id')
      .eq('tenant_id', tenantId)
      .in('data', [...new Set(items.map(i => i.data))])

    const rows = items.filter(i => {
      // Prioridade 1: ID da Transação Bancária (FITID)
      if (i.banco_transacao_id && existing?.some(e => e.banco_transacao_id === i.banco_transacao_id)) {
        return false
      }

      // Prioridade 2: Match Heurístico
      const isDup = existing?.some(e => 
        e.data === i.data && 
        Number(e.valor) === Number(i.valor) && 
        e.descricao === i.descricao
      )
      return !isDup
    }).map(i => {
      // Limpa campos que são apenas da UI e não existem no banco
      const { 
        troco_via_pix, valor_troco, is_lote, selected_associados, 
        recorrencia_ativa, recorrencia_meses, batch_selection,
        ...coreData 
      } = i as any
      
      // Aplicar Regra de Split Automático em Lote (Apenas entre 50 e 100)
      if (coreData.tipo === 'receita' && 
          (coreData.categoria === 'MENSALIDADE' || coreData.categoria === 'ADESAO' || coreData.associado_id) && 
          Number(coreData.valor) > 50 && Number(coreData.valor) < 100) {
        const total = Number(coreData.valor)
        const valorLiquido = 50
        const valorTaxa = total - 50
        coreData.valor = valorLiquido
        const taxaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTaxa)
        if (!coreData.descricao.includes('(Taxa:')) {
          coreData.descricao = `${coreData.descricao} (Taxa: ${taxaFmt})`
        }
      } else if (coreData.taxa && coreData.taxa > 0) {
        const taxaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(coreData.taxa)
        if (!coreData.descricao.includes('(Taxa:')) {
          coreData.descricao = `${coreData.descricao} (Taxa: ${taxaFmt})`
        }
      }
      
      delete coreData.taxa
      return { ...coreData, tenant_id: tenantId, recorrencia_id: (i as any).recorrencia_id }
    })

    if (rows.length === 0) return { error: 'Todos os lançamentos deste lote já existem no sistema (Duplicatas detectadas).' }

    const { data, error, count } = await sb.from('lancamentos').insert(rows).select('id, status')
    if (!error) {
      if (data) {
        const { sincronizarLancamentoContabil } = await import('@/features/contabil/actions/accountingActions')
        for (const item of data) {
          if (item.status === 'pago') {
            sincronizarLancamentoContabil(item.id)
          }
        }
      }
      fetch()
    }
    return { error, count: rows.length }
  }

  const limparTudo = async () => {
    if (!tenantId) {
      setLancamentos([])
      return { error: null }
    }
    const { error } = await sb.from('lancamentos').delete().eq('tenant_id', tenantId)
    if (!error) fetch()
    return { error }
  }

  const atualizarSerie = async (recorrencia_id: string, input: Partial<LancamentoInput>) => {
    if (!recorrencia_id) return { error: 'Este lançamento não faz parte de uma série.' }
    
    // Na atualização de série, geralmente editamos apenas os campos fixos (descrição, categoria, etc)
    const { error } = await sb.from('lancamentos')
      .update(input)
      .eq('recorrencia_id', recorrencia_id)
      .gt('data', new Date().toISOString()) // Opcional: editar apenas os futuros?
    
    if (!error) fetch()
    return { error }
  }

  const conciliar = async (id: string, bancoId: string) => {
    const item = lancamentos.find(l => l.id === id)
    if (item && isPeriodoBloqueado(item.data)) return { error: 'O período deste lançamento está fechado.' }

    const { error } = await sb.from('lancamentos')
      .update({ 
        conciliado: true, 
        status: 'pago',
        banco_transacao_id: bancoId,
        data_conciliacao: new Date().toISOString() 
      })
      .eq('id', id)
    
    if (!error) {
      // Sincroniza com a contabilidade se estiver pago
      const { sincronizarLancamentoContabil } = await import('@/features/contabil/actions/accountingActions')
      await sincronizarLancamentoContabil(id)
      fetch()
    }
    return { error }
  }

  const remanejar = async (idOriginal: string, targetAssociadoId: string, valorParaMover: number, novaDescricao: string, targetLancamentoId?: string) => {
    const original = lancamentos.find(l => l.id === idOriginal)
    if (!original) return { error: 'Lançamento original não encontrado.' }
    if (isPeriodoBloqueado(original.data)) return { error: 'O período deste lançamento está fechado.' }

    // Calcula a Taxa que está escondida na descrição (Regra dos R$ 50)
    const matchTaxa = (original.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
    const valorTaxaOriginal = matchTaxa ? parseFloat(matchTaxa[1].replace(/\./g, '').replace(',', '.')) : 0
    const valorTotalOriginal = Number(original.valor) + valorTaxaOriginal

    const targetVal = Number(valorParaMover)
    if (targetVal > valorTotalOriginal) {
      return { error: 'O valor a remanejar não pode ser maior que o valor bruto do lançamento.' }
    }

    // 1. Calcular Novos Valores
    let novoValorOriginal = Number(original.valor)
    if (targetVal > valorTaxaOriginal) {
      const excesso = targetVal - valorTaxaOriginal
      novoValorOriginal = Math.max(0, novoValorOriginal - excesso)
    }

    // Limpa a descrição do original (remove a taxa antiga) e adiciona a tag de EC com valor original
    const descricaoLimpa = original.descricao
      .replace(/\[ENCONTRO DE CONTAS[^\]]*\]/, '')
      .replace(/\(Taxa: R\$\s*[^)]+\)/, '')
      .trim()
    
    const vlrOrigFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(valorTotalOriginal)
    
    let nomeAssociadoDestino = 'ASSOCIADO'
    if (targetAssociadoId) {
      const { data: assoc } = await sb.from('associados').select('nome').eq('id', targetAssociadoId).single()
      if (assoc) nomeAssociadoDestino = assoc.nome
    }
    
    const novaDescOrigem = `PAGAMENTO REALIZADO PARA - ${nomeAssociadoDestino.toUpperCase()} [ENCONTRO DE CONTAS - VLR ORIG. ${vlrOrigFmt}]`

    // 2. Atualizar o original
    const { error: err1 } = await sb.from('lancamentos')
      .update({ 
        valor: novoValorOriginal, 
        descricao: novaDescOrigem 
      })
      .eq('id', idOriginal)
    
    if (err1) {
      console.error('Erro ao atualizar original:', err1)
      return { error: `Erro no original: ${err1.message}` }
    }

    // 3. Processar Destino
    if (targetLancamentoId) {
      // VINCULAR A EXISTENTE
      const targetLanc = lancamentos.find(l => l.id === targetLancamentoId)
      if (!targetLanc) return { error: 'Lançamento de destino não encontrado.' }
      
      // Se já tiver tags de EC, mantém elas e anexa a nova para rastreabilidade múltipla no FINAL
      const tagNova = `\n[ENCONTRO DE CONTAS - VLR ORIG. ${vlrOrigFmt}]`
      let novaDescDestino = targetLanc.descricao
      
      if (!novaDescDestino.includes(`[ENCONTRO DE CONTAS - VLR ORIG. ${vlrOrigFmt}]`)) {
        novaDescDestino = `${novaDescDestino}${tagNova}`
      }

      // NOVO: Cálculo de quitação total ou parcial
      const jaPago = targetLanc.valor_pago_ec || 0
      const novoTotalPago = jaPago + targetVal
      const statusFinal = novoTotalPago >= targetLanc.valor ? 'pago' : 'parcial'
      
      const { error: err2 } = await sb.from('lancamentos')
        .update({
          status: statusFinal,
          banco_transacao_id: original.banco_transacao_id,
          banco_original_memo: (original as any).banco_original_memo,
          cora_id: (original as any).cora_id,
          conciliado: original.conciliado,
          data_conciliacao: original.data_conciliacao, // CRÍTICO: necessário para Regime de Caixa
          descricao: novaDescDestino,
          data: original.data, // Mantém a data do pagamento real
          is_ec_destino: true,  // MARCAÇÃO PARA CONTABILIDADE
          id_origem: idOriginal, // VÍNCULO TÉCNICO PARA ESTORNO
          valor_pago_ec: novoTotalPago // CONTROLE DE SALDO RECEBIDO
        })
        .eq('id', targetLancamentoId)

      if (err2) {
        console.error('Erro ao vincular destino:', err2)
        // Rollback parcial
        await sb.from('lancamentos').update({ valor: original.valor, descricao: original.descricao }).eq('id', idOriginal)
        return { error: `Erro ao vincular: ${err2.message}` }
      }
    } else {
      // CRIAR NOVO (Legado / Split livre)
      const statusFinal = targetVal >= targetVal ? 'pago' : 'parcial' // Para novos criados do zero sempre será pago
      const nomePagadorOriginal = original.descricao.split('-')[1]?.trim() || original.descricao.split('(')[0].trim()
      
      const novoLancamento: any = {
        tenant_id: tenantId,
        data: original.data,
        tipo: original.tipo,
        categoria: original.categoria,
        status: statusFinal,
        forma_pagamento: original.forma_pagamento,
        conta_id: original.conta_id,
        conciliado: original.conciliado,
        data_conciliacao: original.data_conciliacao, // CRÍTICO: necessário para Regime de Caixa
        banco_transacao_id: original.banco_transacao_id,
        banco_original_memo: (original as any).banco_original_memo,
        cora_id: (original as any).cora_id,
        valor: targetVal,
        valor_pago_ec: targetVal,
        associado_id: targetAssociadoId,
        is_ec_destino: true, // MARCAÇÃO PARA CONTABILIDADE
        id_origem: idOriginal, // VÍNCULO TÉCNICO PARA ESTORNO
        descricao: `${novaDescricao} (Origem: ${nomePagadorOriginal})\n[ENCONTRO DE CONTAS - VLR ORIG. ${vlrOrigFmt}]`
      }

      const { error: err2 } = await sb.from('lancamentos').insert(novoLancamento)
      
      if (err2) {
        console.error('Erro ao inserir novo lançamento:', err2)
        // Rollback
        await sb.from('lancamentos').update({ valor: original.valor, descricao: original.descricao }).eq('id', idOriginal)
        return { error: `Erro no split: ${err2.message}` }
      }
    }

    await fetch()
    return { error: null }
  }

  const atualizarBulk = async (ids: string[], input: Partial<LancamentoInput>) => {
    if (!ids.length) return { error: null }
    const hasLocked = lancamentos.some(l => ids.includes(l.id) && isPeriodoBloqueado(l.data))
    if (hasLocked) return { error: 'Alguns itens selecionados pertencem a períodos fechados.' }

    try {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100)
        const { error } = await sb.from('lancamentos').update(input).in('id', chunk)
        if (error) throw error
      }
      fetch()
      return { error: null }
    } catch (err: any) {
      console.error('Erro atualizarBulk:', err)
      return { error: err.message || 'Erro desconhecido ao atualizar em lote.' }
    }
  }

  const kpis = useMemo(() => {
    let pagoIncome = 0
    let openIncome = 0
    let pagoExpenses = 0
    let openExpenses = 0
    let cash = 0
    let bank = 0

    lancamentos.forEach(l => {
      const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
      const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0
      const v = Number(l.valor)
      const bruto = Math.round((v + taxaVal) * 100) / 100

      if ((l.tipo || '').toLowerCase() === 'receita') {
        if (l.status === 'pago') {
          pagoIncome = Math.round((pagoIncome + bruto) * 100) / 100
          if (l.forma_pagamento === 'Dinheiro') cash = Math.round((cash + v) * 100) / 100
          else bank = Math.round((bank + v) * 100) / 100
        } else {
          openIncome = Math.round((openIncome + bruto) * 100) / 100
        }
      } else {
        if (l.status === 'pago') {
          pagoExpenses = Math.round((pagoExpenses + v) * 100) / 100
          if (l.forma_pagamento === 'Dinheiro') cash = Math.round((cash - v) * 100) / 100
          else bank = Math.round((bank - v) * 100) / 100
        } else {
          openExpenses = Math.round((openExpenses + v) * 100) / 100
        }
      }
    })

    return {
      totalRec: pagoIncome,
      totalDesp: pagoExpenses,
      provisionedRec: openIncome,
      provisionedDesp: openExpenses,
      resultadoReal: Math.round((pagoIncome - pagoExpenses) * 100) / 100,
      resultadoProjetado: Math.round(((pagoIncome + openIncome) - (pagoExpenses + openExpenses)) * 100) / 100,
      saldoCaixa: cash,
      saldoBanco: bank
    }
  }, [lancamentos])

  return { 
    lancamentos, 
    loading, 
    kpis,
    inserir, 
    atualizar, 
    remover, 
    removerBulk, 
    removerSerie,
    atualizarSerie,
    atualizarBulk,
    inserirBulk, 
    limparTudo, 
    conciliar, 
    remanejar,
    refresh: fetch 
  }
}
