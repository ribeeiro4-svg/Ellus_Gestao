import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type BemDuravel = {
  id: string
  tenant_id: string
  nfe_id?: string
  nfe_item_id?: string
  descricao: string
  codigo_interno?: string
  data_aquisicao?: string
  valor_aquisicao?: number
  vida_util_meses?: number
  status: 'pendente_analise' | 'ativo' | 'baixado' | 'manutencao'
  observacoes?: string
  created_at: string
}

export type Manutencao = {
  id: string
  tenant_id: string
  bem_id: string
  data_ocorrencia: string
  tipo: 'preventiva' | 'corretiva' | 'ocorrencia'
  descricao: string
  custo: number
  created_at: string
}

export function useBensDuraveis(tenantId: string | null) {
  const sb = createClient()
  const [bens, setBens] = useState<BemDuravel[]>([])
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carregarBens = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await sb
        .from('bens_duraveis')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
      if (err) throw err
      setBens(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tenantId, sb])

  const carregarManutencoes = useCallback(async (bemId: string) => {
    if (!tenantId) return
    try {
      const { data, error: err } = await sb
        .from('bens_duraveis_manutencoes')
        .select('*')
        .eq('bem_id', bemId)
        .order('data_ocorrencia', { ascending: false })
      if (err) throw err
      setManutencoes(data || [])
    } catch (err: any) {
      console.error(err.message)
    }
  }, [tenantId, sb])

  const atualizarBem = async (id: string, updates: Partial<BemDuravel>) => {
    if (!tenantId) return { error: 'Sem tenant' }
    try {
      const { error: err } = await sb.from('bens_duraveis').update(updates).eq('id', id)
      if (err) throw err
      await carregarBens()
      return { success: true }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  const adicionarManutencao = async (dados: Partial<Manutencao>) => {
    if (!tenantId) return { error: 'Sem tenant' }
    try {
      const { error: err } = await sb.from('bens_duraveis_manutencoes').insert({
        ...dados,
        tenant_id: tenantId
      })
      if (err) throw err
      if (dados.bem_id) await carregarManutencoes(dados.bem_id)
      return { success: true }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  const excluirManutencao = async (id: string, bemId: string) => {
    if (!tenantId) return { error: 'Sem tenant' }
    try {
      const { error: err } = await sb.from('bens_duraveis_manutencoes').delete().eq('id', id)
      if (err) throw err
      await carregarManutencoes(bemId)
      return { success: true }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  const excluirBem = async (id: string) => {
    if (!tenantId) return { error: 'Sem tenant' }
    try {
      const { error: err } = await sb.from('bens_duraveis').delete().eq('id', id)
      if (err) throw err
      await carregarBens()
      return { success: true }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  return {
    bens,
    manutencoes,
    loading,
    error,
    carregarBens,
    carregarManutencoes,
    atualizarBem,
    adicionarManutencao,
    excluirManutencao,
    excluirBem
  }
}
