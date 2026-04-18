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

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data, error } = await sb.from('lancamentos')
        .select('*').eq('tenant_id', tenantId)
        .order('data', { ascending: false })
      
      if (error) throw error
      setLancamentos(data || [])
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
    if (finalInput.taxa && finalInput.taxa > 0) {
      const taxaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalInput.taxa)
      finalInput.descricao = `${finalInput.descricao} (Taxa: ${taxaFmt})`
    }
    // Removemos campos que podem não estar na tabela física
    delete finalInput.taxa 

    const { error } = await sb.from('lancamentos').insert({ ...finalInput, tenant_id: tenantId })
    if (!error) fetch()
    return { error }
  }

  const atualizar = async (id: string, input: Partial<LancamentoInput>) => {
    const item = lancamentos.find(l => l.id === id)
    if (item && isPeriodoBloqueado(item.data)) return { error: 'Este período está fechado e não permite alterações.' }
    if (input.data && isPeriodoBloqueado(input.data)) return { error: 'Não é possível mover lançamentos para períodos fechados.' }
    
    const { error } = await sb.from('lancamentos').update(input).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const remover = async (id: string) => {
    const item = lancamentos.find(l => l.id === id)
    if (item && isPeriodoBloqueado(item.data)) return { error: 'Este período está fechado e não permite alterações.' }
    
    const { error } = await sb.from('lancamentos').delete().eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const removerBulk = async (ids: string[]) => {
    if (!ids.length) return { error: null }
    // Verifica se algum item no lote está bloqueado
    const hasLocked = lancamentos.some(l => ids.includes(l.id) && isPeriodoBloqueado(l.data))
    if (hasLocked) return { error: 'Alguns itens selecionados pertencem a períodos fechados.' }

    const { error } = await sb.from('lancamentos').delete().in('id', ids)
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
      .select('data, valor, descricao, tenant_id')
      .eq('tenant_id', tenantId)
      .in('data', [...new Set(items.map(i => i.data))])

    const rows = items.filter(i => {
      const isDup = existing?.some(e => 
        e.data === i.data && 
        Number(e.valor) === Number(i.valor) && 
        e.descricao === i.descricao
      )
      return !isDup
    }).map(i => {
      let coreData = { ...i }
      if (coreData.taxa && coreData.taxa > 0) {
        const taxaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(coreData.taxa)
        coreData.descricao = `${coreData.descricao} (Taxa: ${taxaFmt})`
      }
      delete coreData.taxa
      return { ...coreData, tenant_id: tenantId }
    })

    if (rows.length === 0) return { error: 'Todos os lançamentos deste lote já existem no sistema (Duplicatas detectadas).' }

    const { error, count } = await sb.from('lancamentos').insert(rows)
    if (!error) fetch()
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

  const conciliar = async (id: string, bancoId: string) => {
    const item = lancamentos.find(l => l.id === id)
    if (item && isPeriodoBloqueado(item.data)) return { error: 'O período deste lançamento está fechado.' }

    const { error } = await sb.from('lancamentos')
      .update({ conciliado: true, banco_transacao_id: bancoId })
      .eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const kpis = useMemo(() => {
    let pagoIncome = 0, pagoExpenses = 0
    let openIncome = 0, openExpenses = 0
    let cash = 0, bank = 0

    lancamentos.forEach(l => {
      const v = l.valor || 0
      const isPago = l.status === 'pago'

      if (l.tipo === 'receita') {
        if (isPago) {
          pagoIncome = safeSum(pagoIncome, v)
          if (l.forma_pagamento === 'Dinheiro') cash = safeSum(cash, v)
          else bank = safeSum(bank, v)
        } else {
          openIncome = safeSum(openIncome, v)
        }
      } else {
        if (isPago) {
          pagoExpenses = safeSum(pagoExpenses, v)
          if (l.forma_pagamento === 'Dinheiro') cash = safeDiff(cash, v)
          else bank = safeDiff(bank, v)
        } else {
          openExpenses = safeSum(openExpenses, v)
        }
      }
    })

    return {
      totalRec: pagoIncome,               // Realizado
      totalDesp: pagoExpenses,           // Realizado
      provisionedRec: openIncome,        // Provisionamento
      provisionedDesp: openExpenses,     // Provisionamento
      resultadoReal: safeDiff(pagoIncome, pagoExpenses),
      resultadoProjetado: safeDiff(safeSum(pagoIncome, openIncome), safeSum(pagoExpenses, openExpenses)),
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
    inserirBulk, 
    limparTudo, 
    conciliar, 
    refresh: fetch 
  }
}
