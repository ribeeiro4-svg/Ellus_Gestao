'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/lib/hooks/useTenantId'
import type { Resolucao } from '@/lib/types'

export function useResolucoes() {
  const tenantId = useTenantId()
  const [resolucoes, setResolucoes] = useState<Resolucao[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data, error } = await sb.from('resolucoes')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('favorito', { ascending: false })
        .order('titulo')
      if (error) throw error
      setResolucoes(data || [])
    } catch (err) {
      console.error('Erro ao buscar resoluções:', err)
      setResolucoes([])
    } finally {
      setLoading(false)
    }
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: Partial<Resolucao>) => {
    const { data: userData } = await sb.auth.getUser()
    const { error } = await sb.from('resolucoes').insert({ 
      ...input, 
      tenant_id: tenantId,
      criado_por: userData.user?.id 
    })
    if (!error) fetch()
    return { error }
  }

  const atualizar = async (id: string, input: Partial<Resolucao>) => {
    const { error } = await sb.from('resolucoes').update(input).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb.from('resolucoes').delete().eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const registrarVisualizacao = async (id: string) => {
    const res = await sb.rpc('increment_visualizacoes', { row_id: id })
    if (res.error) {
       // Fallback se a RPC não existir
       const item = resolucoes.find(r => r.id === id)
       if (item) {
         await sb.from('resolucoes').update({ visualizacoes: (item.visualizacoes || 0) + 1 }).eq('id', id)
       }
    }
    fetch()
  }

  return { resolucoes, loading, inserir, atualizar, remover, registrarVisualizacao, refresh: fetch }
}
