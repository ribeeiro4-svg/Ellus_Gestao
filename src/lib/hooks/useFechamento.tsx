'use client'
import { useState, useCallback, useEffect, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'

export interface FechamentoPeriodo {
  id: string
  mes: number
  ano: number
  status: 'fechado'
  snapshot?: any[]
}

const FechamentoContext = createContext<ReturnType<typeof useFechamentoInternal> | null>(null)

export function FechamentoProvider({ children }: { children: React.ReactNode }) {
  const value = useFechamentoInternal()
  return <FechamentoContext.Provider value={value}>{children}</FechamentoContext.Provider>
}

export function useFechamento() {
  const context = useContext(FechamentoContext)
  if (!context) throw new Error('useFechamento deve ser usado dentro de um FechamentoProvider')
  return context
}

function useFechamentoInternal() {
  const tenantId = useTenantId()
  const sb = createClient()
  const [fechamentos, setFechamentos] = useState<FechamentoPeriodo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFechamentos = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data } = await sb.from('fechamentos_periodo')
      .select('*, snapshot:fechamentos_contas(*)')
      .eq('tenant_id', tenantId)
    setFechamentos(data || [])
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => { fetchFechamentos() }, [fetchFechamentos])

  /**
   * Verifica se uma data específica está dentro de um período bloqueado.
   * Regra: Se existe um fechamento em Jan/2024, tudo de Janeiro para trás está bloqueado.
   */
  const isPeriodoBloqueado = useCallback((dataStr: string) => {
    if (fechamentos.length === 0) return false
    
    const data = new Date(dataStr)
    const mes = data.getMonth()
    const ano = data.getFullYear()

    return fechamentos.some(f => {
      if (ano < f.ano) return true
      if (ano === f.ano && mes <= f.mes) return true
      return false
    })
  }, [fechamentos])

  const fecharPeriodo = async (mes: number, ano: number, saldos: any[]) => {
    if (!tenantId) return { error: 'Tenant não encontrado' }

    // 1. Criar o registro mestre
    const { data: mestre, error: errMestre } = await sb.from('fechamentos_periodo')
      .insert({ tenant_id: tenantId, mes, ano, status: 'fechado' })
      .select()
      .single()

    if (errMestre) return { error: errMestre.message }

    // 2. Criar os registros de detalhe (saldos por conta)
    const detalhes = saldos.map(s => ({
      fechamento_id: mestre.id,
      conta_id: s.conta_id,
      saldo_inicial: s.saldo_inicial,
      saldo_final_sistema: s.saldo_final_sistema,
      saldo_final_real: s.saldo_final_real,
      diferenca: s.diferenca
    }))

    const { error: errDetalhe } = await sb.from('fechamentos_contas').insert(detalhes)
    
    if (!errDetalhe) await fetchFechamentos()
    return { error: errDetalhe?.message || null }
  }

  const reabrirPeriodo = async (mes: number, ano: number) => {
    if (!tenantId) return { error: 'Tenant não encontrado' }

    const { error } = await sb.from('fechamentos_periodo')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('mes', mes)
      .eq('ano', ano)

    if (!error) await fetchFechamentos()
    return { error: error?.message || null }
  }

  return { 
    fechamentos, 
    loading, 
    isPeriodoBloqueado, 
    fecharPeriodo,
    reabrirPeriodo,
    refresh: fetchFechamentos 
  }
}
