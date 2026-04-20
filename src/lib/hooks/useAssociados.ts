'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { Associado, AssociadoInput } from '@/lib/types'
import { useTenant } from './useTenant'
import { fetchZapSignAssociatesAction, tempFixDatabaseAction } from '@/app/actions/zapsign'

export function useAssociados() {
  const tenantId = useTenantId()
  const { tenant } = useTenant()
  const [associados, setAssociados] = useState<Associado[]>([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data } = await sb.from('associados')
      .select('*').eq('tenant_id', tenantId)
      .order('nome')
    setAssociados(data || [])
    setLoading(false)
  }, [tenantId, sb])

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

  const atualizarBulk = async (ids: string[], input: Partial<AssociadoInput>) => {
    const { error } = await sb.from('associados').update(input).in('id', ids)
    if (!error) fetch()
    return { error }
  }

  const remover = async (id: string) => {
    const { error } = await sb.from('associados').delete().eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const inserirBulk = async (items: AssociadoInput[]) => {
    if (!tenantId) {
      console.error('Tentativa de inserirBulk associados sem tenant_id')
      return { error: 'Identificação da conta não encontrada. Tente atualizar a página.' }
    }
    const rows = items.map(it => ({
      ...it,
      tenant_id: tenantId
    }))
    // Usamos UPSERT direto para garantir flexibilidade com novos campos como zapsign_doc_token
    const { error } = await sb.from('associados').upsert(rows, { onConflict: 'tenant_id,codigo' })
    if (!error) fetch()
    return { error }
  }

  const syncZapSign = async () => {
    if (!tenant?.zapsign_token) {
      return { error: 'Token da ZapSign não configurado. Vá em Configurações.' }
    }

    setIsSyncing(true)
    try {
      const res = await fetchZapSignAssociatesAction(tenant.zapsign_token)
      
      if (res.error) return { error: res.error }
      if (!res.data || res.data.length === 0) return { message: 'Nenhum novo associado encontrado na ZapSign.' }
      
      const { error } = await inserirBulk(res.data)
      return { error, count: res.data.length }
    } catch (err) {
      return { error: 'Falha na comunicação com o servidor de integração.' }
    } finally {
      setIsSyncing(false)
    }
  }

  const limparTudo = async () => {
    if (!tenantId) {
      setAssociados([])
      return { error: null }
    }
    const { error } = await sb.from('associados').delete().eq('tenant_id', tenantId)
    if (!error) fetch()
    return { error }
  }

  return { associados, loading, isSyncing, inserir, atualizar, atualizarBulk, remover, inserirBulk, syncZapSign, limparTudo, refresh: fetch }
}
