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
    
    if (error && error.code === 'PGRST116') {
      console.log('[useTenant] Criando registro inicial...')
      await sb.from('tenants').insert({ id: tenantId, nome: 'Configuração Inicial' })
    } else if (error) {
      console.error('[useTenant] Erro:', error.message)
    }

    if (data) {
      console.log('[useTenant] Logo URL encontrada:', data.logo_url)
      setTenant(data)
    }
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    const handleRefresh = () => fetch()
    window.addEventListener('tenant-updated', handleRefresh)
    return () => window.removeEventListener('tenant-updated', handleRefresh)
  }, [fetch])

  const atualizar = async (input: Partial<TenantData>) => {
    if (!tenantId) return { error: { message: 'ID do inquilino não identificado', code: 'NO_ID', details: '', hint: '' } }
    
    // Garantir que o nome sempre exista para evitar erro de NOT NULL constraint no upsert
    const nomeFinal = input.nome || tenant?.nome || 'ACPROBEC'
    const payload: any = { 
      ...input, 
      id: tenantId,
      nome: nomeFinal
    }
    
    // Só gera novo slug se o nome estiver sendo alterado ou se não houver slug
    payload.slug = nomeFinal.toLowerCase().replace(/[^a-z0-9]/g, '-')
    
    console.log('[useTenant] Enviando atualização robusta:', payload)
    const { error } = await sb.from('tenants').upsert(payload)
    
    if (!error) {
      console.log('[useTenant] Atualização concluída com sucesso')
      fetch()
      window.dispatchEvent(new Event('tenant-updated'))
    } else {
      console.error('[useTenant] Erro ao atualizar:', error.message)
    }
    return { error }
  }

  return { tenant, loading, atualizar, refresh: fetch }
}
