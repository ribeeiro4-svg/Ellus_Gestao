'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { Associado, AssociadoInput } from '@/lib/types'

export function useAssociados() {
  const tenantId = useTenantId()
  const [associados, setAssociados] = useState<Associado[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data } = await sb.from('associados')
      .select('*').eq('tenant_id', tenantId)
      .order('nome')
    setAssociados(data || [])
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: AssociadoInput) => {
    const { error } = await sb.from('associados').insert({ ...input, tenant_id: tenantId })
    if (!error) fetch()
    return { error }
  }

  const atualizar = async (id: string, input: Partial<AssociadoInput>) => {
    const { error } = await sb.from('associados').update(input).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb.from('associados').delete().eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const inserirBulk = async (items: AssociadoInput[]) => {
    if (!tenantId) {
      console.error('Tentativa de inserirBulk associados sem tenant_id')
      return { error: 'Identificação da conta não encontrada. Tente atualizar a página.' }
    }
    const rows = items.map(i => ({ ...i, tenant_id: tenantId }))
    const { error } = await sb.from('associados').upsert(rows, { onConflict: 'tenant_id,codigo' })
    if (!error) fetch()
    return { error }
  }

  const limparTudo = async () => {
    if (!tenantId) {
      setAssociados([])
      return { error: null }
    }
    const { error } = await sb.from('associados').delete().eq('tenant_id', tenantId)
    if (!error) fetch()
    return { error }
  }

  return { associados, loading, inserir, atualizar, remover, inserirBulk, limparTudo, refresh: fetch }
}
