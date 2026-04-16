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
  const [visao, setVisao] = useState<'mensal' | 'anual'>('mensal')
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

  const carregarDadosReais = async () => {
    if (!tenantId) return
    setSyncing(true)
    const start = new Date(cenario.ano_referencia, cenario.mes_referencia, 1).toISOString()
    const end = new Date(cenario.ano_referencia, cenario.mes_referencia + 1, 0).toISOString()
    
    const { data: financeiro } = await sb.from('lancamentos')
      .select('valor, tipo, categoria')
      .eq('tenant_id', tenantId)
      .gte('data', start)
      .lte('data', end)

    const { count: assocCount } = await sb.from('associados')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')

    if (financeiro) {
      const receitaReal = financeiro.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
      const despesaReal = financeiro.filter(l => l.tipo === 'despesa')
      const totalDespesa = despesaReal.reduce((s, l) => s + l.valor, 0)
      const folhaReal = despesaReal
        .filter(l => l.categoria.toLowerCase().includes('folha') || l.categoria.toLowerCase().includes('salário'))
        .reduce((s, l) => s + l.valor, 0)
      const fixaReal = totalDespesa - folhaReal

      setCenario(prev => ({
        ...prev,
        num_associados: assocCount || prev.num_associados,
        valor_mensalidade: assocCount ? Math.round(receitaReal / assocCount) : prev.valor_mensalidade,
        despesas_fixas: Math.round(fixaReal * 0.7),
        despesas_variaveis: Math.round(fixaReal * 0.3),
        folha_pagamento: folhaReal
      }))
    }
    setSyncing(false)
  }

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

  // Cálculos Mensais (Baseline do mês selecionado)
  const mReceita = cenario.num_associados * cenario.valor_mensalidade
  const mProLabores = getProLaboreNoMes(cenario.mes_referencia, cenario.ano_referencia)
  const mFolha = cenario.folha_pagamento + mProLabores
  const mFixas = cenario.despesas_fixas
  const mVariaveis = cenario.despesas_variaveis
  const mResultado = mReceita - (mFixas + mVariaveis + mFolha)

  // Projeção do Ano (12 Meses)
  const projecaoMeses = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const pl = getProLaboreNoMes(i, cenario.ano_referencia)
      const folha = cenario.folha_pagamento + pl
      const fixas = cenario.despesas_fixas
      const vars = cenario.despesas_variaveis
      const receita = cenario.num_associados * cenario.valor_mensalidade
      const despesas = fixas + vars + folha
      return {
        mes: i,
        receita,
        fixas,
        variaveis: vars,
        folha,
        proLabore: pl,
        despesas,
        resultado: receita - despesas
      }
    })
  }, [cenario.ano_referencia, cenario.folha_pagamento, cenario.despesas_fixas, cenario.despesas_variaveis, cenario.num_associados, cenario.valor_mensalidade, getProLaboreNoMes])

  // Agregação Anual
  const aReceita = projecaoMeses.reduce((s, m) => s + m.receita, 0)
  const aFixas = projecaoMeses.reduce((s, m) => s + m.fixas, 0)
  const aVariaveis = projecaoMeses.reduce((s, m) => s + m.variaveis, 0)
  const aFolha = projecaoMeses.reduce((s, m) => s + m.folha, 0)
  const aProLabores = projecaoMeses.reduce((s, m) => s + m.proLabore, 0)
  const aResultado = aReceita - (aFixas + aVariaveis + aFolha)

  // Seleção final baseada na Visão
  const calculos = visao === 'mensal' ? {
    totalReceita: mReceita,
    totalProLabores: mProLabores,
    totalFolha: mFolha,
    totalFixas: mFixas,
    totalVariaveis: mVariaveis,
    totalDespesas: mFixas + mVariaveis + mFolha,
    resultado: mResultado,
    margem: mReceita > 0 ? (mResultado / mReceita) * 100 : 0
  } : {
    totalReceita: aReceita,
    totalProLabores: aProLabores,
    totalFolha: aFolha,
    totalFixas: aFixas,
    totalVariaveis: aVariaveis,
    totalDespesas: aFixas + aVariaveis + aFolha,
    resultado: aResultado,
    margem: aReceita > 0 ? (aResultado / aReceita) * 100 : 0
  }

  const reservaAlvo = (calculos.totalFixas + (calculos.totalFolha)) * (visao === 'mensal' ? cenario.reserva_meses_alvo : 1)

  return {
    cenario,
    setCenario,
    visao,
    setVisao,
    salvarCenario,
    carregarDadosReais,
    loading,
    syncing,
    calculos: { ...calculos, reservaAlvo },
    projecaoAnual: projecaoMeses
  }
}
