'use client'
import { useMemo } from 'react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useMetas } from '@/lib/hooks/useMetas'
import { useTenant } from '@/lib/hooks/useTenant'
import { MESES } from '@/lib/utils/formatters'
import type { Lancamento, Associado, Meta } from '@/lib/types'

export interface ApresentacaoKpis {
  saldoCaixa: number
  receitaMes: number
  variacaoReceita: number
  despesaMes: number
  variacaoDespesa: number
  resultadoMes: number
  variacaoResultado: number
  totalAtivos: number
  variacaoAtivos: number
  novasAdesoesCount: number
  inadimplenciaRate: number
  variacaoInadimplencia: number
  inadimplenciaValor: number
  topDevedores: { nome: string; valor: number; diasAtraso: number }[]
}

export interface FluxoMensal {
  label: string
  receita: number
  despesa: number
  resultado: number
}

export interface ComposicaoItem {
  categoria: string
  valor: number
  percentual: number
  tipo: 'receita' | 'despesa'
}

export interface EvolucaoAssociados {
  label: string
  ativos: number
}

export interface ApresentacaoData {
  loading: boolean
  tenantNome: string
  tenantLogo: string
  kpis: ApresentacaoKpis
  fluxo6Meses: FluxoMensal[]
  composicaoReceitas: ComposicaoItem[]
  composicaoDespesas: ComposicaoItem[]
  evolucaoAssociados: EvolucaoAssociados[]
  metas: Meta[]
  lancamentos: Lancamento[]
  associados: Associado[]
  mesAtual: number
  anoAtual: number
}

export function useApresentacaoData(mesRef: number, anoRef: number): ApresentacaoData {
  const { lancamentos, loading: loadFin } = useFinanceiro()
  const { associados, loading: loadAssoc } = useAssociados()
  const { metas, loading: loadMetas } = useMetas()
  const { tenant, loading: loadTenant } = useTenant()

  const loading = loadFin || loadAssoc || loadMetas || loadTenant

  const kpis = useMemo<ApresentacaoKpis>(() => {
    const hoje = new Date()
    const todayStr = hoje.toISOString().split('T')[0]

    // Filtra lancamentos do mês/ano de referência pagos
    const doMes = lancamentos.filter(l => {
      const d = new Date(l.data)
      return d.getMonth() === mesRef && d.getFullYear() === anoRef && l.status === 'pago'
    })

    const receitaMes = doMes.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
    const despesaMes = doMes.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
    const resultadoMes = receitaMes - despesaMes

    // Previous month calculation for variations
    let prevMes = mesRef - 1
    let prevAno = anoRef
    if (prevMes < 0) { prevMes = 11; prevAno -= 1 }
    
    const prevMesLancamentos = lancamentos.filter(l => {
      const d = new Date(l.data)
      return d.getMonth() === prevMes && d.getFullYear() === prevAno && l.status === 'pago'
    })
    const prevReceita = prevMesLancamentos.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
    const prevDespesa = prevMesLancamentos.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
    const prevResultado = prevReceita - prevDespesa

    const calcVar = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / Math.abs(prev)) * 100
    const variacaoReceita = calcVar(receitaMes, prevReceita)
    const variacaoDespesa = calcVar(despesaMes, prevDespesa)
    const variacaoResultado = calcVar(resultadoMes, prevResultado)

    // Saldo acumulado (todos pagos até hoje)
    const saldoCaixa = lancamentos
      .filter(l => l.status === 'pago')
      .reduce((s, l) => l.tipo === 'receita' ? s + l.valor : s - l.valor, 0)

    // Associados
    const ativos = associados.filter(a => a.status === 'ativo')
    const totalAtivos = ativos.length

    // Previous month active associates (estimate based on data_ingresso and status)
    const limitePrev = new Date(prevAno, prevMes + 1, 0) // ultimo dia do mes anterior
    const prevAtivosCount = associados.filter(assoc => {
      if (!assoc.data_ingresso) return false
      return new Date(assoc.data_ingresso) <= limitePrev && assoc.status === 'ativo'
    }).length
    const variacaoAtivos = calcVar(totalAtivos, prevAtivosCount)

    // Novas adesões no mês
    const novasAdesoesCount = associados.filter(a => {
      if (!a.data_ingresso) return false
      const d = new Date(a.data_ingresso)
      return d.getMonth() === mesRef && d.getFullYear() === anoRef
    }).length

    // Inadimplência: associados com lançamento atrasado
    const ativosIds = new Set(ativos.map(a => a.id))
    const atrasados = lancamentos.filter(l =>
      l.status === 'atrasado' &&
      l.tipo === 'receita' &&
      l.associado_id &&
      ativosIds.has(l.associado_id)
    )

    // Inadimplencia do mes anterior (estimate based on vencimento)
    const atrasadosPrev = lancamentos.filter(l => {
      const d = new Date(l.data)
      return l.status === 'atrasado' && l.tipo === 'receita' && l.associado_id && ativosIds.has(l.associado_id) && 
             (d.getFullYear() < prevAno || (d.getFullYear() === prevAno && d.getMonth() <= prevMes))
    })
    
    const inadimplentesIds = new Set(atrasados.map(l => l.associado_id))
    const inadimplenciaRate = totalAtivos > 0 ? (inadimplentesIds.size / totalAtivos) * 100 : 0
    
    const inadimplentesPrevIds = new Set(atrasadosPrev.map(l => l.associado_id))
    const prevInadimplenciaRate = prevAtivosCount > 0 ? (inadimplentesPrevIds.size / prevAtivosCount) * 100 : 0
    const variacaoInadimplencia = inadimplenciaRate - prevInadimplenciaRate

    const inadimplenciaValor = atrasados.reduce((s, l) => s + l.valor, 0)

    // Top devedores
    const devedoresMap: Record<string, { nome: string; valor: number; diasAtraso: number }> = {}
    atrasados.forEach(l => {
      const assoc = associados.find(a => a.id === l.associado_id)
      if (!assoc) return
      const diasAtraso = Math.floor((hoje.getTime() - new Date(l.data).getTime()) / (1000 * 60 * 60 * 24))
      if (!devedoresMap[l.associado_id!]) {
        devedoresMap[l.associado_id!] = { nome: assoc.nome, valor: 0, diasAtraso: 0 }
      }
      devedoresMap[l.associado_id!].valor += l.valor
      devedoresMap[l.associado_id!].diasAtraso = Math.max(devedoresMap[l.associado_id!].diasAtraso, diasAtraso)
    })

    const topDevedores = Object.values(devedoresMap)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)

    return {
      saldoCaixa,
      receitaMes,
      variacaoReceita,
      despesaMes,
      variacaoDespesa,
      resultadoMes,
      variacaoResultado,
      totalAtivos,
      variacaoAtivos,
      novasAdesoesCount,
      inadimplenciaRate,
      variacaoInadimplencia,
      inadimplenciaValor,
      topDevedores
    }
  }, [lancamentos, associados, mesRef, anoRef])

  // Fluxo dos últimos 6 meses
  const fluxo6Meses = useMemo<FluxoMensal[]>(() => {
    const meses: FluxoMensal[] = []
    for (let i = 5; i >= 0; i--) {
      let m = mesRef - i
      let a = anoRef
      if (m < 0) { m += 12; a -= 1 }

      const doMes = lancamentos.filter(l => {
        const d = new Date(l.data)
        return d.getMonth() === m && d.getFullYear() === a && l.status === 'pago'
      })

      const receita = doMes.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
      const despesa = doMes.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
      meses.push({ label: MESES[m].substring(0, 3), receita, despesa, resultado: receita - despesa })
    }
    return meses
  }, [lancamentos, mesRef, anoRef])

  // Composição: receitas por categoria do mês
  const composicaoReceitas = useMemo<ComposicaoItem[]>(() => {
    const doMes = lancamentos.filter(l => {
      const d = new Date(l.data)
      return d.getMonth() === mesRef && d.getFullYear() === anoRef && l.status === 'pago' && l.tipo === 'receita'
    })
    const total = doMes.reduce((s, l) => s + l.valor, 0)
    const byCategoria: Record<string, number> = {}
    doMes.forEach(l => {
      byCategoria[l.categoria] = (byCategoria[l.categoria] || 0) + l.valor
    })
    return Object.entries(byCategoria)
      .map(([categoria, valor]) => ({ categoria, valor, percentual: total > 0 ? (valor / total) * 100 : 0, tipo: 'receita' as const }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6)
  }, [lancamentos, mesRef, anoRef])

  // Composição: despesas por categoria do mês
  const composicaoDespesas = useMemo<ComposicaoItem[]>(() => {
    const doMes = lancamentos.filter(l => {
      const d = new Date(l.data)
      return d.getMonth() === mesRef && d.getFullYear() === anoRef && l.status === 'pago' && l.tipo === 'despesa'
    })
    const total = doMes.reduce((s, l) => s + l.valor, 0)
    const byCategoria: Record<string, number> = {}
    doMes.forEach(l => {
      byCategoria[l.categoria] = (byCategoria[l.categoria] || 0) + l.valor
    })
    return Object.entries(byCategoria)
      .map(([categoria, valor]) => ({ categoria, valor, percentual: total > 0 ? (valor / total) * 100 : 0, tipo: 'despesa' as const }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6)
  }, [lancamentos, mesRef, anoRef])

  // Evolução de associados ativos (últimos 6 meses estimado por data_ingresso)
  const evolucaoAssociados = useMemo<EvolucaoAssociados[]>(() => {
    const meses: EvolucaoAssociados[] = []
    for (let i = 5; i >= 0; i--) {
      let m = mesRef - i
      let a = anoRef
      if (m < 0) { m += 12; a -= 1 }
      const limite = new Date(a, m + 1, 0) // último dia do mês
      const ativos = associados.filter(assoc => {
        if (!assoc.data_ingresso) return false
        return new Date(assoc.data_ingresso) <= limite && assoc.status === 'ativo'
      }).length
      meses.push({ label: MESES[m].substring(0, 3), ativos })
    }
    return meses
  }, [associados, mesRef, anoRef])

  return {
    loading,
    tenantNome: tenant?.nome || 'ACPROBEC',
    tenantLogo: (tenant?.logo_url && tenant.logo_url.startsWith('http')) ? tenant.logo_url : '/ellus_logo_dark.svg',
    kpis,
    fluxo6Meses,
    composicaoReceitas,
    composicaoDespesas,
    evolucaoAssociados,
    metas,
    lancamentos,
    associados,
    mesAtual: mesRef,
    anoAtual: anoRef
  }
}
