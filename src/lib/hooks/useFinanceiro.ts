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
    const { error } = await sb.from('lancamentos').insert({ ...input, tenant_id: tenantId })
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

  const inserirBulk = async (items: LancamentoInput[]) => {
    if (!tenantId) {
      console.error('Tentativa de inserirBulk financeiro sem tenant_id')
      return { error: 'Identificação da conta não encontrada.' }
    }
    const rows = items.map(i => {
      // Filtra campos que podem não existir no banco de dados físico conforme migrations.sql
      const { 
        forma_pagamento, valor_recebido, troco_via_pix, 
        recorrencia_ativa, conta_id, conciliado, 
        banco_transacao_id, associado_id, 
        ...rest 
      } = i as any
      return { ...rest, tenant_id: tenantId }
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

  return { lancamentos, loading, inserir, atualizar, remover, inserirBulk, limparTudo, conciliar, refresh: fetch }
}
