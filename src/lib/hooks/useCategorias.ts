'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { CategoriaConfig, CategoriaInput } from '@/lib/types'

export function useCategorias() {
  const tenantId = useTenantId()
  const [categorias, setCategorias] = useState<CategoriaConfig[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    
    const { data, error } = await sb
      .from('config_categorias')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nome', { ascending: true })

    if (!error) {
      setCategorias(data || [])
    }
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: CategoriaInput) => {
    const { data, error } = await sb
      .from('config_categorias')
      .insert({ ...input, tenant_id: tenantId })
      .select()
      .single()
    
    if (!error) fetch()
    return { data, error }
  }

  const atualizar = async (id: string, input: Partial<CategoriaInput>) => {
    const { data, error } = await sb
      .from('config_categorias')
      .update(input)
      .eq('id', id)
      .eq('tenant_id', tenantId) // Segurança extra
      .select()
      .single()
    
    if (!error) fetch()
    return { data, error }
  }

  const remover = async (id: string) => {
    const { error } = await sb
      .from('config_categorias')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    
    if (!error) fetch()
    return { error }
  }

  return { categorias, loading, inserir, atualizar, remover, refresh: fetch }
}
