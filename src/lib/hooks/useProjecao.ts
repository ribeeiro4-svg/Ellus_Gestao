'use client'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { CenarioSimulacao, ProLaboreItem, CenarioInput, ProLaborePeriodo, Lancamento } from '@/lib/types'

const CUR_YEAR = new Date().getFullYear()

const DEFAULT_CENARIO: CenarioSimulacao = {
  id: 'temp',
  tenant_id: '',
  nome: 'Simulação Inicial',
  mes_referencia: new Date().getMonth(),
  ano_referencia: CUR_YEAR,
  num_associados: 0,
  valor_mensalidade: 0,
  despesas_fixas: 0,
  despesas_variaveis: 0,
  folha_pagamento: 0,
  pro_labores: [],
  reserva_meses_alvo: 0,
  created_at: new Date().toISOString()
}

export function useProjecao() {
  const tenantId = useTenantId()
  const [cenario, setCenario] = useState<CenarioSimulacao>(DEFAULT_CENARIO)
  const [visao, setVisao] = useState<'mensal' | 'anual'>('mensal')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [realYearData, setRealYearData] = useState<any[]>([])
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
    
    // Busca a realidade do ano selecionado para o projetado
    const targetYear = data?.ano_referencia || cenario.ano_referencia
    const startOfYear = new Date(targetYear, 0, 1).toISOString()
    const endOfYear = new Date(targetYear, 11, 31).toISOString()
    
    const { data: yearData } = await sb.from('lancamentos')
      .select('valor, tipo, data, categoria')
      .eq('tenant_id', tenantId)
      .gte('data', startOfYear)
      .lte('data', endOfYear)

    if (yearData) setRealYearData(yearData)

    setLoading(false)
  }, [tenantId, sb, cenario.ano_referencia])

  useEffect(() => { fetchCenario() }, [fetchCenario])

  const salvarCenario = async (input: CenarioInput) => {
    if (!tenantId) {
      setCenario({ ...DEFAULT_CENARIO, ...input })
      return { error: null }
    }
    
    const { id, ...dataToSave } = input
    const finalData = id === 'temp' ? dataToSave : { ...dataToSave, id }

    const { error } = await sb.from('cenarios_simulacao').upsert({
      ...finalData,
      tenant_id: tenantId
    }, { onConflict: 'tenant_id,nome' })
    
    if (!error) await fetchCenario()
    return { error }
  }

  const limparTudo = async () => {
    if (!tenantId) return
    await sb.from('cenarios_simulacao').delete().eq('tenant_id', tenantId)
    setCenario(DEFAULT_CENARIO)
  }

  const carregarDadosReais = async () => {
    if (!tenantId) return
    setSyncing(true)
    
    // Filtra os dados que já temos em memória (ano todo) para o mês de referência
    const financeiroRef = realYearData.filter(l => {
      const d = new Date(l.data)
      return d.getMonth() === cenario.mes_referencia && d.getFullYear() === cenario.ano_referencia
    })

    const { count: assocCount } = await sb.from('associados')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')

    const { data: diretoria } = await sb.from('diretoria')
      .select('id, nome, pro_labore_base')
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')

    if (financeiroRef.length > 0 || assocCount !== null) {
      const receitaReal = financeiroRef.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
      const despesaReal = financeiroRef.filter(l => l.tipo === 'despesa')
      const totalDespesa = despesaReal.reduce((s, l) => s + l.valor, 0)
      const folhaReal = despesaReal
        .filter(l => l.categoria.toLowerCase().includes('folha') || l.categoria.toLowerCase().includes('salário'))
        .reduce((s, l) => s + l.valor, 0)
      const fixaReal = totalDespesa - folhaReal

      const proLaboresReais = (diretoria || []).map(d => ({
        id: d.id,
        nome: d.nome,
        periodos: [{
          id: Math.random().toString(),
          valor: d.pro_labore_base || 0,
          mes_inicio: 0, // Começa em Janeiro
          ano_inicio: 2000 // Garante que vale para qualquer ano da simulação
        }]
      }))

      setCenario(prev => ({
        ...prev,
        num_associados: assocCount || prev.num_associados,
        valor_mensalidade: assocCount ? Math.round(receitaReal / assocCount) : prev.valor_mensalidade,
        despesas_fixas: Math.round(fixaReal * 0.7),
        despesas_variaveis: Math.round(fixaReal * 0.3),
        folha_pagamento: folhaReal,
        pro_labores: proLaboresReais.length > 0 ? proLaboresReais : prev.pro_labores
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
      
      const simReceita = cenario.num_associados * cenario.valor_mensalidade
      const simDespesa = fixas + vars + folha

      // Realidade já cadastrada para este mês
      const realMes = realYearData.filter(l => new Date(l.data).getMonth() === i)
      const realReceita = realMes.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
      const realDespesa = realMes.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)

      // O projetado é o maior entre a simulação e a realidade já lançada
      const receita = Math.max(simReceita, realReceita)
      const despesas = Math.max(simDespesa, realDespesa)

      return {
        mes: i,
        receita,
        fixas: Math.max(fixas, realMes.filter(l => l.tipo === 'despesa' && !l.categoria.toLowerCase().includes('folha')).reduce((s,l)=>s+l.valor,0)),
        variaveis: vars,
        folha: Math.max(folha, realMes.filter(l => l.tipo === 'despesa' && l.categoria.toLowerCase().includes('folha')).reduce((s,l)=>s+l.valor,0)),
        proLabore: pl,
        despesas,
        resultado: receita - despesas
      }
    })
  }, [cenario.ano_referencia, cenario.folha_pagamento, cenario.despesas_fixas, cenario.despesas_variaveis, cenario.num_associados, cenario.valor_mensalidade, getProLaboreNoMes, realYearData])

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
    limparTudo,
    carregarDadosReais,
    loading,
    syncing,
    calculos: { ...calculos, reservaAlvo },
    projecaoAnual: projecaoMeses
  }
}
