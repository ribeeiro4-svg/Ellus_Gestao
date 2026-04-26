'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { ContaBancaria } from '@/lib/types'

export function useContas() {
  const tenantId = useTenantId()
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data, error } = await sb.from('contas_bancarias')
        .select('*').eq('tenant_id', tenantId)
        .order('nome', { ascending: true })
      
      if (error) throw error
      setContas(data || [])
    } catch (err) {
      console.error('Error fetching contas:', err)
      setContas([])
    } finally {
      setLoading(false)
    }
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: Omit<ContaBancaria, 'id' | 'tenant_id' | 'created_at'>) => {
    if (!tenantId) {
      alert('Erro: ID de sessão não identificado. Recarregue a página.')
      return { error: 'No tenant' }
    }
    const { data, error } = await sb.from('contas_bancarias').insert({ ...input, tenant_id: tenantId }).select('id').single()
    if (error) {
      console.error('Erro ao inserir conta:', error)
      alert('Erro ao salvar no banco: ' + error.message)
    } else {
      // Tenta mapear automaticamente no contábil
      try {
        const { fixBankAccountsAction } = await import('@/features/contabil/actions/fixBankAccountsAction')
        await fixBankAccountsAction(tenantId)
      } catch (e) {
        console.warn('Erro ao mapear conta contábil:', e)
      }
      await fetch()
    }
    return { error }
  }

  const atualizar = async (id: string, input: Partial<ContaBancaria>) => {
    const { error } = await sb.from('contas_bancarias').update(input).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb.from('contas_bancarias').delete().eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const limparTudo = async () => {
    if (!tenantId) {
      setContas([])
      return { error: null }
    }
    const { error } = await sb.from('contas_bancarias').delete().eq('tenant_id', tenantId)
    if (!error) fetch()
    return { error }
  }

  return { contas, loading, inserir, atualizar, remover, limparTudo, refresh: fetch }
}
