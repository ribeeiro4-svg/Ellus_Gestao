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
  data_entrada?: string
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
  prestador_id?: string
  nfe_id?: string
  created_at: string
}

export function useBensDuraveis(tenantId: string | null) {
  const sb = createClient()
  const [bens, setBens] = useState<BemDuravel[]>([])
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([])
  const [todasManutencoes, setTodasManutencoes] = useState<Manutencao[]>([])
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
      // Tenta primeiro com os joins (pode falhar se as colunas prestador_id/nfe_id não existirem)
      const { data, error: err } = await sb
        .from('bens_duraveis_manutencoes')
        .select(`
          *,
          prestador:fornecedores(id, nome, cpf_cnpj),
          nfe:nfe_entradas(*)
        `)
        .eq('bem_id', bemId)
        .order('data_ocorrencia', { ascending: false })
      
      if (err) {
        console.warn('Erro ao carregar manutenções com joins, tentando fallback:', err.message)
        // Fallback para select simples se as colunas novas não existirem
        const { data: fallbackData, error: fallbackErr } = await sb
          .from('bens_duraveis_manutencoes')
          .select('*')
          .eq('bem_id', bemId)
          .order('data_ocorrencia', { ascending: false })
        
        if (fallbackErr) throw fallbackErr
        setManutencoes(fallbackData || [])
      } else {
        setManutencoes(data || [])
      }
    } catch (err: any) {
      console.error('Erro crítico ao carregar manutenções:', err.message)
    }
  }, [tenantId, sb])

  const carregarTodasManutencoes = useCallback(async () => {
    if (!tenantId) return
    try {
      const { data, error: err } = await sb
        .from('bens_duraveis_manutencoes')
        .select(`
          *,
          prestador:fornecedores(id, nome, cpf_cnpj),
          nfe:nfe_entradas(*)
        `)
        .eq('tenant_id', tenantId)
        .order('data_ocorrencia', { ascending: false })
      
      if (err) {
        console.warn('Erro ao carregar todas manutenções com joins, tentando fallback:', err.message)
        const { data: fallbackData, error: fallbackErr } = await sb
          .from('bens_duraveis_manutencoes')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('data_ocorrencia', { ascending: false })
        
        if (fallbackErr) throw fallbackErr
        setTodasManutencoes(fallbackData || [])
      } else {
        setTodasManutencoes(data || [])
      }
    } catch (err: any) {
      console.error('Erro crítico ao carregar todas manutenções:', err.message)
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
      
      if (err) {
        // Fallback: Se falhou porque as colunas novas ainda não existem no banco, tenta salvar sem elas
        if (err.message.includes('prestador_id') || err.message.includes('nfe_id') || err.code === '42703') {
          console.warn('Falha ao salvar com vínculos, tentando fallback sem colunas novas...')
          const { prestador_id, nfe_id, ...dadosSimples } = dados
          const { error: retryErr } = await sb.from('bens_duraveis_manutencoes').insert({
            ...dadosSimples,
            tenant_id: tenantId
          })
          if (retryErr) throw retryErr
        } else {
          throw err
        }
      }
      
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
    todasManutencoes,
    loading,
    error,
    carregarBens,
    carregarManutencoes,
    carregarTodasManutencoes,
    atualizarBem,
    adicionarManutencao,
    excluirManutencao,
    excluirBem
  }
}
