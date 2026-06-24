'use client'
import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { ContaBancaria } from '@/lib/types'

const ContasContext = createContext<ReturnType<typeof useContasInternal> | null>(null)

export function ContasProvider({ children }: { children: React.ReactNode }) {
  const value = useContasInternal()
  return <ContasContext.Provider value={value}>{children}</ContasContext.Provider>
}

export function useContas() {
  const context = useContext(ContasContext)
  if (!context) throw new Error('useContas deve ser usado dentro de um ContasProvider')
  return context
}

function useContasInternal() {
  const tenantId = useTenantId()
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data, error } = await sb.from('contas_bancarias')
        .select('*').eq('tenant_id', tenantId)
        .order('nome', { ascending: true })
      
      if (error) throw error
      setContas(data || [])
    } catch (err) {
      console.error('Error fetching contas:', err)
      setContas([])
    } finally {
      setLoading(false)
    }
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  const inserir = async (input: Omit<ContaBancaria, 'id' | 'tenant_id' | 'created_at'>) => {
    if (!tenantId) {
      alert('Erro: ID de sessão não identificado. Recarregue a página.')
      return { error: 'No tenant' }
    }
    const { data, error } = await sb.from('contas_bancarias').insert({ ...input, tenant_id: tenantId }).select('id').single()
    if (error) {
      console.error('Erro ao inserir conta:', error)
      alert('Erro ao salvar no banco: ' + error.message)
    } else {
      // Tenta mapear automaticamente no contábil
      try {
        const { fixBankAccountsAction } = await import('@/features/contabil/actions/fixBankAccountsAction')
        await fixBankAccountsAction(tenantId)
      } catch (e) {
        console.warn('Erro ao mapear conta contábil:', e)
      }
      await fetch()
    }
    return { error }
  }

  const atualizar = async (id: string, input: Partial<ContaBancaria>) => {
    if (!id) return { error: { message: 'ID da conta não fornecido' } }
    
    // Remove campos protegidos ou nulos que podem causar falha na constraint NOT NULL
    const updateData: any = {}
    if (input.nome !== undefined && input.nome !== null) updateData.nome = input.nome
    if (input.tipo !== undefined && input.tipo !== null) updateData.tipo = input.tipo
    if (input.saldo_inicial !== undefined) updateData.saldo_inicial = input.saldo_inicial
    
    if (Object.keys(updateData).length === 0) return { error: null }

    const { error } = await sb.from('contas_bancarias').update(updateData).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const remover = async (id: string) => {
    if (!id) return { error: { message: 'ID da conta não fornecido' } }
    const { error } = await sb.from('contas_bancarias').delete().eq('id', id)
    if (!error) fetch()
    else {
      console.error('Erro ao remover conta:', error)
      if (error.code === '23503') {
        alert('Não é possível excluir esta conta pois ela possui lançamentos vinculados. Transfira ou exclua os lançamentos antes de excluir a conta.')
      } else {
        alert('Erro ao excluir conta: ' + error.message)
      }
    }
    return { error }
  }

  const limparTudo = async () => {
    if (!tenantId) {
      setContas([])
      return { error: null }
    }
    const { error } = await sb.from('contas_bancarias').delete().eq('tenant_id', tenantId)
    if (!error) fetch()
    return { error }
  }

  return { contas, loading, inserir, atualizar, remover, limparTudo, refresh: fetch }
}
