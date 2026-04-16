'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { Lancamento, LancamentoInput } from '@/lib/types'

export function useFinanceiro() {
  const tenantId = useTenantId()
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) {
      // Modo Demonstração (Bypass de Login) ou Sandbox
      setLancamentos([
        { id: '1', data: '2026-04-10', descricao: 'Mensalidade Associação Abril', categoria: 'Mensalidades', tipo: 'receita', valor: 15300.00, status: 'pago', created_at: '2026-04-10', updated_at: '2026-04-10' },
        { id: '2', data: '2026-04-12', descricao: 'Patrocínio Evento Anual', categoria: 'Patrocínios', tipo: 'receita', valor: 8500.00, status: 'pendente', created_at: '2026-04-12', updated_at: '2026-04-12' },
        { id: '3', data: '2026-04-15', descricao: 'Consultoria Financeira', categoria: 'Serviços', tipo: 'receita', valor: 3200.00, status: 'pago', created_at: '2026-04-15', updated_at: '2026-04-15' },
        { id: '4', data: '2026-04-05', descricao: 'Aluguel Escritório SP', categoria: 'Infraestrutura', tipo: 'despesa', valor: 3500.00, status: 'pago', created_at: '2026-04-05', updated_at: '2026-04-05' },
        { id: '5', data: '2026-04-08', descricao: 'Marketing Digital ACPROBEC', categoria: 'Publicidade', tipo: 'despesa', valor: 1200.00, status: 'pendente', created_at: '2026-04-08', updated_at: '2026-04-08' },
        { id: '6', data: '2026-04-18', descricao: 'Materiais Gráficos do Evento', categoria: 'Suprimentos', tipo: 'despesa', valor: 850.00, status: 'aberto', created_at: '2026-04-18', updated_at: '2026-04-18' },
      ] as Lancamento[])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await sb.from('lancamentos')
        .select('*').eq('tenant_id', tenantId)
        .order('data', { ascending: false })
      
      if (error) throw error
      setLancamentos(data || [])
    } catch (err) {
      console.error('Error fetching financeiro:', err)
      setLancamentos([])
    } finally {
      setLoading(false)
    }
  }, [tenantId, sb])

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
