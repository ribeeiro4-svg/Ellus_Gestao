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
    const { data } = await sb.from('lancamentos')
      .select('*').eq('tenant_id', tenantId)
      .order('data', { ascending: false })
    setLancamentos(data || [])
    setLoading(false)
  }, [tenantId])

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
    const rows = items.map(i => ({ ...i, tenant_id: tenantId }))
    const { error, count } = await sb.from('lancamentos').insert(rows)
    if (!error) fetch()
    return { error, count }
  }

  return { lancamentos, loading, inserir, atualizar, remover, inserirBulk, refresh: fetch }
}
