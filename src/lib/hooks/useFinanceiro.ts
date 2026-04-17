'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { Lancamento, LancamentoInput } from '@/lib/types'

export function useFinanceiro() {
  const tenantId = useTenantId()
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
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
    const { error } = await sb.from('lancamentos').update(input).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb.from('lancamentos').delete().eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const removerBulk = async (ids: string[]) => {
    if (!ids.length) return { error: null }
    const { error } = await sb.from('lancamentos').delete().in('id', ids)
    if (!error) fetch()
    return { error }
  }

  const inserirBulk = async (items: LancamentoInput[]) => {
    if (!tenantId) {
      console.error('Tentativa de inserirBulk financeiro sem tenant_id')
      return { error: 'Identificação da conta não encontrada.' }
    }
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
    const { error } = await sb.from('lancamentos')
      .update({ conciliado: true, banco_transacao_id: bancoId })
      .eq('id', id)
    if (!error) fetch()
    return { error }
  }

  return { lancamentos, loading, inserir, atualizar, remover, removerBulk, inserirBulk, limparTudo, conciliar, refresh: fetch }
}
