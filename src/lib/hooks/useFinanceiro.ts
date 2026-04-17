'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import { useFechamento } from './useFechamento'
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

    const rows = items.map(i => {
      let coreData = { ...i }
      if (coreData.taxa && coreData.taxa > 0) {
        const taxaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(coreData.taxa)
        coreData.descricao = `${coreData.descricao} (Taxa: ${taxaFmt})`
      }
      delete coreData.taxa
      return { ...coreData, tenant_id: tenantId }
    })
    const { error, count } = await sb.from('lancamentos').insert(rows)
    if (!error) fetch()
    return { error, count }
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

  return { lancamentos, loading, inserir, atualizar, remover, removerBulk, inserirBulk, limparTudo, conciliar, refresh: fetch }
}
