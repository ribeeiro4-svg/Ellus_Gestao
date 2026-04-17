'use client'
import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'

export interface CoraStagedItem {
  id: string
  cora_id: string
  data: string
  descricao: string
  valor: number
  tipo: 'CREDIT' | 'DEBIT'
  documento?: string
  status: 'pendente' | 'sincronizado' | 'ignorado'
}

export function useCoraStaged() {
  const tenantId = useTenantId()
  const sb = createClient()
  const [items, setItems] = useState<CoraStagedItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data } = await sb.from('cora_staged')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'pendente')
      .order('data', { ascending: false })
    
    setItems(data || [])
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => { fetchItems() }, [fetchItems])

  const syncWithBank = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cora/sync')
      const data = await res.json()
      if (data.success) {
        await fetchItems()
      }
      return data
    } catch (err) {
      console.error('Erro ao sincronizar com Cora:', err)
      return { error: 'Falha na conexão com o banco.' }
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: 'sincronizado' | 'ignorado') => {
    const { error } = await sb.from('cora_staged')
      .update({ status })
      .eq('id', id)
    
    if (!error) {
      setItems(prev => prev.filter(item => item.id !== id))
    }
    return { error }
  }

  const updateStatusBulk = async (ids: string[], status: 'sincronizado' | 'ignorado') => {
    const { error } = await sb.from('cora_staged')
      .update({ status })
      .in('id', ids)
    
    if (!error) {
      setItems(prev => prev.filter(item => !ids.includes(item.id)))
    }
    return { error }
  }

  return { 
    items, 
    loading, 
    syncWithBank, 
    updateStatus, 
    updateStatusBulk,
    refresh: fetchItems 
  }
}
