'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { Associado, AssociadoInput } from '@/lib/types'

export function useAssociados() {
  const tenantId = useTenantId()
  const [associados, setAssociados] = useState<Associado[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) {
      // Modo Demonstração
      setAssociados([
        { id: '1', nome: 'João da Silva', codigo: '1001', categoria: 'Pleno', email: 'joao@email.com', telefone: '11999999999', data_ingresso: '2023-01-10', mensalidade: 150.00, status: 'ativo', meses_atraso: 0, created_at: '2023-01-10' },
        { id: '2', nome: 'Maria Souza', codigo: '1002', categoria: 'Premium', email: 'maria@email.com', telefone: '11988888888', data_ingresso: '2023-05-20', mensalidade: 300.00, status: 'inadimplente', meses_atraso: 3, ultimo_pagamento: '2023-12-10', created_at: '2023-05-20' },
        { id: '3', nome: 'Empresa XPTO Ltda', codigo: '1003', categoria: 'Corporativo', email: 'contato@xpto.com', telefone: '1133334444', data_ingresso: '2024-02-01', mensalidade: 1200.00, status: 'inadimplente', meses_atraso: 1, ultimo_pagamento: '2026-03-01', created_at: '2024-02-01' },
      ] as Associado[])
      setLoading(false)
      return
    }
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
