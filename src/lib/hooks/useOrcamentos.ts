'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { Orcamento, OrcamentoInput } from '@/lib/types'

export function useOrcamentos(mes?: number, ano?: number) {
  const tenantId = useTenantId()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    let query = sb.from('orcamentos').select('*').eq('tenant_id', tenantId)
    
    if (mes !== undefined) query = query.eq('mes', mes)
    if (ano !== undefined) query = query.eq('ano', ano)

    const { data } = await query
    setOrcamentos(data || [])
    setLoading(false)
  }, [tenantId, sb, mes, ano])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: OrcamentoInput) => {
    const { error } = await sb.from('orcamentos').insert({ ...input, tenant_id: tenantId })
    if (!error) fetch()
    return { error }
  }

  const atualizar = async (id: string, input: Partial<OrcamentoInput>) => {
    const { error } = await sb.from('orcamentos').update(input).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb.from('orcamentos').delete().eq('id', id)
    if (!error) fetch()
    return { error }
  }

  return { orcamentos, loading, inserir, atualizar, remover, refresh: fetch }
}
