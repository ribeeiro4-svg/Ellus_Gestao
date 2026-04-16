'use client'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { CenarioSimulacao, ProLaboreItem, CenarioInput, ProLaborePeriodo } from '@/lib/types'

const CUR_YEAR = new Date().getFullYear()

const DEFAULT_CENARIO: CenarioSimulacao = {
  id: 'temp',
  tenant_id: '',
  nome: 'Simulação Inicial',
  mes_referencia: new Date().getMonth(),
  ano_referencia: CUR_YEAR,
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
        { id: 'p1', valor: 2500, mes_inicio: 0, ano_inicio: CUR_YEAR, mes_fim: 5, ano_fim: CUR_YEAR },
        { id: 'p2', valor: 3000, mes_inicio: 6, ano_inicio: CUR_YEAR }
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
  const [syncing, setSyncing] = useState(false)
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

  // Função para carregar dados reais como baseline
  const carregarDadosReais = async () => {
    if (!tenantId) return
    setSyncing(true)
    
    // 1. Buscar lançamentos do mês/ano alvo
    const start = new Date(cenario.ano_referencia, cenario.mes_referencia, 1).toISOString()
    const end = new Date(cenario.ano_referencia, cenario.mes_referencia + 1, 0).toISOString()
    
    const { data: financeiro } = await sb.from('lancamentos')
      .select('valor, tipo, categoria')
      .eq('tenant_id', tenantId)
      .gte('data', start)
      .lte('data', end)

    // 2. Buscar contagem de associados ativos
    const { count: assocCount } = await sb.from('associados')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')

    if (financeiro) {
      const receitaReal = financeiro.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
      const despesaReal = financeiro.filter(l => l.tipo === 'despesa')
      const totalDespesa = despesaReal.reduce((s, l) => s + l.valor, 0)
      
      // Heurística simples: Categorias com "Folha" ou "Salário" vão para folha_base_real
      const folhaReal = despesaReal
        .filter(l => l.categoria.toLowerCase().includes('folha') || l.categoria.toLowerCase().includes('salário'))
        .reduce((s, l) => s + l.valor, 0)
      
      const fixaReal = totalDespesa - folhaReal // Simplificação: o que não é folha é fixo/variável

      setCenario(prev => ({
        ...prev,
        num_associados: assocCount || prev.num_associados,
        valor_mensalidade: assocCount ? Math.round(receitaReal / assocCount) : prev.valor_mensalidade,
        despesas_fixas: Math.round(fixaReal * 0.7), // Chute 70% fixo
        despesas_variaveis: Math.round(fixaReal * 0.3), // Chute 30% variável
        folha_pagamento: folhaReal
      }))
    }
    setSyncing(false)
  }

  // Cálculos de Pro-labore para um mês específico
  const getProLaboreNoMes = useCallback((mes: number, ano: number) => {
    const targetSerial = ano * 12 + mes
    return cenario.pro_labores.reduce((totalDirector, director) => {
      const periodActive = director.periodos.find(p => {
        const startSerial = p.ano_inicio * 12 + p.mes_inicio
        const endSerial = p.ano_fim !== undefined 
          ? (p.ano_fim * 12 + (p.mes_fim ?? 11)) 
          : 999999
        return targetSerial >= startSerial && targetSerial <= endSerial
      })
      return totalDirector + (periodActive?.valor || 0)
    }, 0)
  }, [cenario.pro_labores])

  // Cálculos dinâmicos (Snapshot do Mês Atual)
  const totalReceita = cenario.num_associados * cenario.valor_mensalidade
  const totalProLabores = getProLaboreNoMes(cenario.mes_referencia, cenario.ano_referencia)
  const totalFolha = cenario.folha_pagamento + totalProLabores
  const totalDespesas = cenario.despesas_fixas + cenario.despesas_variaveis + totalFolha
  const resultado = totalReceita - totalDespesas
  const margem = totalReceita > 0 ? (resultado / totalReceita) * 100 : 0
  const reservaAlvo = (cenario.despesas_fixas + totalFolha) * cenario.reserva_meses_alvo

  // Projeção do Ano (12 Meses)
  const projecaoAnual = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const pl = getProLaboreNoMes(i, cenario.ano_referencia)
      const folha = cenario.folha_pagamento + pl
      const desps = cenario.despesas_fixas + cenario.despesas_variaveis + folha
      const res = totalReceita - desps
      return {
        mes: i,
        resultado: res,
        folha: folha
      }
    })
  }, [cenario.ano_referencia, cenario.folha_pagamento, cenario.despesas_fixas, cenario.despesas_variaveis, totalReceita, getProLaboreNoMes])

  return {
    cenario,
    setCenario,
    salvarCenario,
    carregarDadosReais,
    loading,
    syncing,
    calculos: {
      totalReceita,
      totalProLabores,
      totalFolha,
      totalDespesas,
      resultado,
      margem,
      reservaAlvo
    },
    projecaoAnual
  }
}
