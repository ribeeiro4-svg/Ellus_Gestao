'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { Vaga } from '@/lib/types'

export function useVagas() {
  const tenantId = useTenantId()
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    
    const { data, error } = await sb
      .from('recrutamento_vagas')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (!error) {
      setVagas(data || [])
    }
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: Partial<Vaga>) => {
    const { data, error } = await sb
      .from('recrutamento_vagas')
      .insert({ ...input, tenant_id: tenantId })
      .select()
      .single()
    
    if (!error) fetch()
    return { data, error }
  }

  const atualizar = async (id: string, input: Partial<Vaga>) => {
    const { data, error } = await sb
      .from('recrutamento_vagas')
      .update(input)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (!error) fetch()
    return { data, error }
  }

  const remover = async (id: string) => {
    const { error } = await sb
      .from('recrutamento_vagas')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    
    if (!error) fetch()
    return { error }
  }

  return { vagas, loading, inserir, atualizar, remover, refresh: fetch }
}
