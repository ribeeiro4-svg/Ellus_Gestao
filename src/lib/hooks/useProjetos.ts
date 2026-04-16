'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { Projeto, ProjetoInput } from '@/lib/types'

export function useProjetos() {
  const tenantId = useTenantId()
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data } = await sb.from('projetos').select('*').eq('tenant_id', tenantId).order('prazo')
    setProjetos(data || [])
    setLoading(false)
  }, [tenantId])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: ProjetoInput) => {
    const { error } = await sb.from('projetos').insert({ ...input, tenant_id: tenantId })
    if (!error) fetch(); return { error }
  }

  const atualizar = async (id: string, input: Partial<ProjetoInput>) => {
    const { error } = await sb.from('projetos').update(input).eq('id', id)
    if (!error) fetch(); return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb.from('projetos').delete().eq('id', id)
    if (!error) fetch(); return { error }
  }

  const inserirBulk = async (items: ProjetoInput[]) => {
    const rows = items.map(i => ({ ...i, tenant_id: tenantId }))
    const { error } = await sb.from('projetos').insert(rows)
    if (!error) fetch(); return { error }
  }

  return { projetos, loading, inserir, atualizar, remover, inserirBulk, refresh: fetch }
}
