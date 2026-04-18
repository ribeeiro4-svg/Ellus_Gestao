'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'

export interface TenantData {
  id: string
  nome: string
  logo_url: string
  zapsign_token: string
  cora_id: string
  cora_cert: string
  cora_key: string
}

export function useTenant() {
  const tenantId = useTenantId()
  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data } = await sb.from('tenants')
      .select('id, nome, logo_url, zapsign_token, cora_id, cora_cert, cora_key')
      .eq('id', tenantId)
      .single()
    
    if (data) setTenant(data)
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  const atualizar = async (input: Partial<TenantData>) => {
    if (!tenantId) return
    // Usamos upsert para garantir que o registro seja criado se não existir
    const { error } = await sb.from('tenants').upsert({ ...input, id: tenantId })
    if (!error) fetch()
    return { error }
  }

  return { tenant, loading, atualizar, refresh: fetch }
}
