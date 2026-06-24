'use client'
import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { Meta, MetaInput } from '@/lib/types'

const MetasContext = createContext<ReturnType<typeof useMetasInternal> | null>(null)

export function MetasProvider({ children }: { children: React.ReactNode }) {
  const value = useMetasInternal()
  return <MetasContext.Provider value={value}>{children}</MetasContext.Provider>
}

export function useMetas() {
  const context = useContext(MetasContext)
  if (!context) throw new Error('useMetas deve ser usado dentro de um MetasProvider')
  return context
}

function useMetasInternal() {
  const tenantId = useTenantId()
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data } = await sb.from('metas').select('*').eq('tenant_id', tenantId).order('prazo')
    setMetas(data || [])
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: MetaInput) => {
    const { error } = await sb.from('metas').insert({ ...input, tenant_id: tenantId })
    if (!error) fetch(); return { error }
  }

  const atualizar = async (id: string, input: Partial<MetaInput>) => {
    const { error } = await sb.from('metas').update(input).eq('id', id)
    if (!error) fetch(); return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb.from('metas').delete().eq('id', id)
    if (!error) fetch(); return { error }
  }

  const limparTudo = async () => {
    if (!tenantId) {
      setMetas([])
      return { error: null }
    }
    const { error } = await sb.from('metas').delete().eq('tenant_id', tenantId)
    if (!error) fetch(); return { error }
  }

  const inserirBulk = async (items: MetaInput[]) => {
    const rows = items.map(i => ({ ...i, tenant_id: tenantId }))
    const { error } = await sb.from('metas').insert(rows)
    if (!error) fetch(); return { error }
  }

  return { metas, loading, inserir, atualizar, remover, limparTudo, inserirBulk, refresh: fetch }
}
