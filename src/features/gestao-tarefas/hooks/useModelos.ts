'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/lib/hooks/useTenantId'
import type { ModeloMensagem } from '@/lib/types'

export function useModelos() {
  const tenantId = useTenantId()
  const [modelos, setModelos] = useState<ModeloMensagem[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data, error } = await sb.from('modelos_mensagem')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('nome')
      if (error) throw error
      setModelos(data || [])
    } catch (err) {
      console.error('Erro ao buscar modelos:', err)
      setModelos([])
    } finally {
      setLoading(false)
    }
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: Partial<ModeloMensagem>) => {
    const { data: userData } = await sb.auth.getUser()
    const { error } = await sb.from('modelos_mensagem').insert({ 
      ...input, 
      tenant_id: tenantId,
      criado_por: userData.user?.id 
    })
    if (!error) fetch()
    return { error }
  }

  const atualizar = async (id: string, input: Partial<ModeloMensagem>) => {
    const { error } = await sb.from('modelos_mensagem').update(input).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb.from('modelos_mensagem').delete().eq('id', id)
    if (!error) fetch()
    return { error }
  }

  return { modelos, loading, inserir, atualizar, remover, refresh: fetch }
}
