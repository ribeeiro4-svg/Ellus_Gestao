'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { Meta, MetaInput } from '@/lib/types'

export function useMetas() {
  const tenantId = useTenantId()
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) {
      // Se não há tenantId e ainda não temos dados, inicia com o mock
      setMetas(prev => prev.length > 0 ? prev : [
        { id: '1', meta: 'Aumentar Carteira em 10%', responsavel: 'Comercial', prazo: '2026-12-31', valor_meta: 100, valor_realizado: 65, unidade: '%', status: 'em_andamento', created_at: '', updated_at: '' },
        { id: '2', meta: 'Reduzir Inadimplência < 5%', responsavel: 'Financeiro', prazo: '2026-06-30', valor_meta: 5, valor_realizado: 7.2, unidade: '%', status: 'em_andamento', created_at: '', updated_at: '' },
        { id: '3', meta: 'Arrecadação Evento Anual', responsavel: 'Eventos', prazo: '2026-05-15', valor_meta: 50000, valor_realizado: 42000, unidade: 'R$', status: 'em_andamento', created_at: '', updated_at: '' },
      ] as Meta[])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await sb.from('metas').select('*').eq('tenant_id', tenantId).order('prazo')
    setMetas(data || [])
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: MetaInput) => {
    if (!tenantId) {
      const newItem = { ...input, id: Math.random().toString(), created_at: new Date().toISOString() } as Meta
      setMetas(prev => [...prev, newItem])
      return { error: null }
    }
    const { error } = await sb.from('metas').insert({ ...input, tenant_id: tenantId })
    if (!error) fetch(); return { error }
  }

  const atualizar = async (id: string, input: Partial<MetaInput>) => {
    if (!tenantId) {
      setMetas(prev => prev.map(item => item.id === id ? { ...item, ...input } as Meta : item))
      return { error: null }
    }
    const { error } = await sb.from('metas').update(input).eq('id', id)
    if (!error) fetch(); return { error }
  }

  const remover = async (id: string) => {
    if (!tenantId) {
      setMetas(prev => prev.filter(item => item.id !== id))
      return { error: null }
    }
    const { error } = await sb.from('metas').delete().eq('id', id)
    if (!error) fetch(); return { error }
  }

  const inserirBulk = async (items: MetaInput[]) => {
    const rows = items.map(i => ({ ...i, tenant_id: tenantId }))
    const { error } = await sb.from('metas').insert(rows)
    if (!error) fetch(); return { error }
  }

  return { metas, loading, inserir, atualizar, remover, inserirBulk, refresh: fetch }
}
