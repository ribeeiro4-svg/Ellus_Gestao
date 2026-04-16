'use client'
import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { CenarioSimulacao, ProLaboreItem, CenarioInput, ProLaborePeriodo } from '@/lib/types'

const DEFAULT_CENARIO: CenarioSimulacao = {
  id: 'temp',
  tenant_id: '',
  nome: 'Simulação Inicial',
  mes_referencia: new Date().getMonth(),
  ano_referencia: new Date().getFullYear(),
  num_associados: 100,
  valor_mensalidade: 150,
  despesas_fixas: 5000,
  despesas_variaveis: 2000,
  folha_pagamento: 3000,
  pro_labores: [
    { 
      id: '1', 
      nome: 'Diretor Presidente', 
      periodos: [
        { id: 'p1', valor: 2500, mes_inicio: 0, mes_fim: 5 },
        { id: 'p2', valor: 3000, mes_inicio: 6 }
      ]
    }
  ],
  reserva_meses_alvo: 3,
  created_at: new Date().toISOString()
}

export function useProjecao() {
  const tenantId = useTenantId()
  const [cenario, setCenario] = useState<CenarioSimulacao>(DEFAULT_CENARIO)
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetchCenario = useCallback(async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await sb.from('cenarios_simulacao')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) setCenario(data)
    setLoading(false)
  }, [tenantId, sb])

  useEffect(() => { fetchCenario() }, [fetchCenario])

  const salvarCenario = async (input: CenarioInput) => {
    if (!tenantId) {
      setCenario({ ...DEFAULT_CENARIO, ...input })
      return { error: null }
    }
    const { error } = await sb.from('cenarios_simulacao').upsert({
      ...input,
      tenant_id: tenantId
    }, { onConflict: 'tenant_id,nome' })
    return { error }
  }

  // Cálculos dinâmicos
  const totalReceita = cenario.num_associados * cenario.valor_mensalidade

  // Cálculo complexo de Pró-labore baseado no mês de referência
  const totalProLabores = cenario.pro_labores.reduce((totalDirector, director) => {
    const periodActive = director.periodos.find(p => {
      const startOk = p.mes_inicio <= cenario.mes_referencia
      const endOk = p.mes_fim === undefined || p.mes_fim >= cenario.mes_referencia
      return startOk && endOk
    })
    return totalDirector + (periodActive?.valor || 0)
  }, 0)

  const totalFolha = cenario.folha_pagamento + totalProLabores
  const totalDespesas = cenario.despesas_fixas + cenario.despesas_variaveis + totalFolha
  const resultado = totalReceita - totalDespesas
  const margem = totalReceita > 0 ? (resultado / totalReceita) * 100 : 0
  const reservaAlvo = (cenario.despesas_fixas + totalFolha) * cenario.reserva_meses_alvo

  return {
    cenario,
    setCenario,
    salvarCenario,
    loading,
    calculos: {
      totalReceita,
      totalProLabores,
      totalFolha,
      totalDespesas,
      resultado,
      margem,
      reservaAlvo
    }
  }
}
