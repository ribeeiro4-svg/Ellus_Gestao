'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Lancamento, Associado, Meta, Projeto, LancamentoInput, AssociadoInput, MetaInput, ProjetoInput } from '@/lib/types'

// ─── Helper ────────────────────────────────────────────────────────────────
function useTenantId() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        sb.from('usuarios').select('tenant_id').eq('id', data.user.id).single()
          .then(({ data: u }) => { if (u) setTenantId(u.tenant_id) })
      }
    })
  }, [])
  return tenantId
}

// ─── useFinanceiro ─────────────────────────────────────────────────────────
export function useFinanceiro() {
  const tenantId = useTenantId()
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data } = await sb.from('lancamentos')
      .select('*').eq('tenant_id', tenantId)
      .order('data', { ascending: false })
    setLancamentos(data || [])
    setLoading(false)
  }, [tenantId])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: LancamentoInput) => {
    const { error } = await sb.from('lancamentos').insert({ ...input, tenant_id: tenantId })
    if (!error) fetch()
    return { error }
  }

  const atualizar = async (id: string, input: Partial<LancamentoInput>) => {
    const { error } = await sb.from('lancamentos').update(input).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb.from('lancamentos').delete().eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const inserirBulk = async (items: LancamentoInput[]) => {
    const rows = items.map(i => ({ ...i, tenant_id: tenantId }))
    const { error, count } = await sb.from('lancamentos').insert(rows)
    if (!error) fetch()
    return { error, count }
  }

  return { lancamentos, loading, inserir, atualizar, remover, inserirBulk, refresh: fetch }
}

// ─── useAssociados ─────────────────────────────────────────────────────────
export function useAssociados() {
  const tenantId = useTenantId()
  const [associados, setAssociados] = useState<Associado[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data } = await sb.from('associados')
      .select('*').eq('tenant_id', tenantId)
      .order('nome')
    setAssociados(data || [])
    setLoading(false)
  }, [tenantId])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: AssociadoInput) => {
    const { error } = await sb.from('associados').insert({ ...input, tenant_id: tenantId })
    if (!error) fetch()
    return { error }
  }

  const atualizar = async (id: string, input: Partial<AssociadoInput>) => {
    const { error } = await sb.from('associados').update(input).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb.from('associados').delete().eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const inserirBulk = async (items: AssociadoInput[]) => {
    const rows = items.map(i => ({ ...i, tenant_id: tenantId }))
    const { error } = await sb.from('associados').upsert(rows, { onConflict: 'tenant_id,codigo' })
    if (!error) fetch()
    return { error }
  }

  return { associados, loading, inserir, atualizar, remover, inserirBulk, refresh: fetch }
}

// ─── useMetas ──────────────────────────────────────────────────────────────
export function useMetas() {
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
  }, [tenantId])

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

  const inserirBulk = async (items: MetaInput[]) => {
    const rows = items.map(i => ({ ...i, tenant_id: tenantId }))
    const { error } = await sb.from('metas').insert(rows)
    if (!error) fetch(); return { error }
  }

  return { metas, loading, inserir, atualizar, remover, inserirBulk, refresh: fetch }
}

// ─── useProjetos ───────────────────────────────────────────────────────────
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
