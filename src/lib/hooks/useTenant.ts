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
    console.log('[useTenant] Buscando dados para ID:', tenantId)
    
    const { data, error } = await sb.from('tenants')
      .select('id, nome, logo_url, zapsign_token, cora_id, cora_cert, cora_key')
      .eq('id', tenantId)
      .single()
    
    if (error) {
      console.error('[useTenant] Erro ao buscar:', error.message)
      if (error.code === 'PGRST116') {
        console.warn('[useTenant] Registro não encontrado. Criando base...')
        await sb.from('tenants').insert({ id: tenantId, nome: 'Configuração Inicial' })
      }
    }

    if (data) {
      console.log('[useTenant] Dados carregados com sucesso:', data.nome)
      setTenant(data)
    }
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  const atualizar = async (input: Partial<TenantData>) => {
    if (!tenantId) return { error: { message: 'ID do inquilino não identificado', code: 'NO_ID', details: '', hint: '' } }
    // Usamos upsert para garantir que o registro seja criado se não existir
    const { error } = await sb.from('tenants').upsert({ ...input, id: tenantId })
    if (!error) fetch()
    return { error }
  }

  return { tenant, loading, atualizar, refresh: fetch }
}
