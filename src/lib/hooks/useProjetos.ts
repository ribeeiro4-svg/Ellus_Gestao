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
    if (!tenantId) {
      const local = localStorage.getItem('acprobec_projetos_demo')
      if (local) {
        setProjetos(JSON.parse(local))
      } else {
        const mock = [
          { id: '1', projeto: 'Reforma Sede ACPROBEC', responsavel: 'Infraestrutura', data_inicio: '2026-01-10', prazo: '2026-05-15', orcamento: 45000, gasto: 32000, status: 'em_andamento', created_at: '', updated_at: '' },
          { id: '2', projeto: 'Sistema de Votação Online', responsavel: 'TI', data_inicio: '2026-02-01', prazo: '2026-04-30', orcamento: 12000, gasto: 12500, status: 'atrasado', created_at: '', updated_at: '' },
          { id: '3', projeto: 'Campanha Novos Associados', responsavel: 'Marketing', data_inicio: '2026-03-20', prazo: '2026-12-31', orcamento: 8000, gasto: 1200, status: 'em_andamento', created_at: '', updated_at: '' },
        ] as Projeto[]
        setProjetos(mock)
        localStorage.setItem('acprobec_projetos_demo', JSON.stringify(mock))
      }
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await sb.from('projetos').select('*').eq('tenant_id', tenantId).order('prazo')
    setProjetos(data || [])
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => {
    if (!tenantId && !loading && projetos.length > 0) {
      localStorage.setItem('acprobec_projetos_demo', JSON.stringify(projetos))
    }
  }, [projetos, tenantId, loading])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: ProjetoInput) => {
    if (!tenantId) {
      const newItem = { ...input, id: Math.random().toString(), created_at: new Date().toISOString() } as Projeto
      setProjetos(prev => [...prev, newItem])
      return { error: null }
    }
    const { error } = await sb.from('projetos').insert({ ...input, tenant_id: tenantId })
    if (!error) fetch(); return { error }
  }

  const atualizar = async (id: string, input: Partial<ProjetoInput>) => {
    if (!tenantId) {
      setProjetos(prev => prev.map(item => item.id === id ? { ...item, ...input } as Projeto : item))
      return { error: null }
    }
    const { error } = await sb.from('projetos').update(input).eq('id', id)
    if (!error) fetch(); return { error }
  }

  const remover = async (id: string) => {
    if (!tenantId) {
      setProjetos(prev => prev.filter(item => item.id !== id))
      return { error: null }
    }
    const { error } = await sb.from('projetos').delete().eq('id', id)
    if (!error) fetch(); return { error }
  }

  const limparTudo = async () => {
    if (!tenantId) {
      setProjetos([])
      return { error: null }
    }
    const { error } = await sb.from('projetos').delete().eq('tenant_id', tenantId)
    if (!error) fetch()
    return { error }
  }

  const inserirBulk = async (items: ProjetoInput[]) => {
    const rows = items.map(i => ({ ...i, tenant_id: tenantId }))
    const { error } = await sb.from('projetos').insert(rows)
    if (!error) fetch(); return { error }
  }
  return { projetos, loading, inserir, atualizar, remover, limparTudo, refresh: fetch }
}
