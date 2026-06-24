import { useMemo } from 'react'
import { getMesIdx, getAnoIdx, getBruto } from '@/lib/utils/formatters'

export function useDashboardMetrics(
  lancamentos: any[], 
  associados: any[], 
  orcamentos: any[], 
  selectedMonths: number[], 
  selectedYear: number,
  regime: 'caixa' | 'competencia' = 'caixa',
  contas: any[] = [],
  tipoConta: 'todos' | 'caixa' | 'banco' = 'todos',
  isPeriodoBloqueado?: (d: string) => boolean
) {
  const metrics = useMemo(() => {
    const caixaIds = contas.filter(c => c.nome.toLowerCase().includes('caixa')).map(c => c.id)
    
    // Filtra os lançamentos pelo tipo de conta selecionado
    const lancamentosFiltrados = lancamentos.filter(l => {
      if (tipoConta === 'todos') return true
      const isCaixa = caixaIds.includes(l.conta_id)
      return tipoConta === 'caixa' ? isCaixa : !isCaixa
    })

    const recRealArr = Array(12).fill(0)
    const recProvArr = Array(12).fill(0)
    const reservaArr = Array(12).fill(0)
    const despRealArr = Array(12).fill(0)
    const despProvArr = Array(12).fill(0)
    
    let kpiRec = 0, kpiDes = 0, kpiProvRec = 0, kpiProvDes = 0
    let kpiRecPrev = 0, kpiDesPrev = 0, kpiProvRecPrev = 0, kpiProvDesPrev = 0

    const prevYearIdx = selectedYear - 1

    lancamentosFiltrados.forEach(l => {
      const statusLower = (l.status || '').toLowerCase()
      const isPaidStatus = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso'].includes(statusLower)
      const isRealizedTotal = isPaidStatus || statusLower === 'parcial' || !!l.data_conciliacao

      // Regra de Ouro: No regime de caixa, só conta o que foi REALIZADO
      if (regime === 'caixa' && !isRealizedTotal) return

      const baseDate = (regime === 'caixa' && isRealizedTotal && l.data_conciliacao) ? l.data_conciliacao : l.data
      const mesIdx = getMesIdx(baseDate)
      const anoIdx = getAnoIdx(baseDate)
      
      const valorBruto = getBruto(l)
      const tipo = (l.tipo || '').toLowerCase()
      const isReserva = l.forma_pagamento === 'Fundo de Caixa'
      const isInternalTransfer = l.categoria === 'Reserva de Caixa' || l.categoria === 'RESERVA ESTRATÉGICA'
      const valorOriginal = Number(l.valor || 0)

      if (anoIdx === selectedYear && mesIdx >= 0 && mesIdx <= 11) {
        // Realização no período (Sincronizada para bater com o caixa real)
        const payM = l.data_conciliacao ? getMesIdx(l.data_conciliacao) : mesIdx
        const isRealizedInPeriod = isRealizedTotal && selectedMonths.includes(payM)

        if (tipo === 'receita') {
          if (isReserva) {
            reservaArr[mesIdx] = Math.round((reservaArr[mesIdx] + valorBruto) * 100) / 100
          } else if (!isInternalTransfer) {
            if (isRealizedInPeriod) recRealArr[mesIdx] = Math.round((recRealArr[mesIdx] + valorBruto) * 100) / 100
            else recProvArr[mesIdx] = Math.round((recProvArr[mesIdx] + valorBruto) * 100) / 100
          }
        } else if (!isInternalTransfer) {
          if (isRealizedInPeriod) despRealArr[mesIdx] = Math.round((despRealArr[mesIdx] + valorOriginal) * 100) / 100
          else despProvArr[mesIdx] = Math.round((despProvArr[mesIdx] + valorOriginal) * 100) / 100
        }
      }

      // KPIs no topo
      if (anoIdx === selectedYear && selectedMonths.includes(mesIdx) && !isInternalTransfer) {
        const payM = l.data_conciliacao ? getMesIdx(l.data_conciliacao) : mesIdx
        const isRealizedInPeriod = isRealizedTotal && selectedMonths.includes(payM)

        if (tipo === 'receita') {
          if (!isReserva) {
            if (isRealizedInPeriod) kpiRec += valorBruto
            else kpiProvRec += valorBruto
          }
        } else {
          if (isRealizedInPeriod) kpiDes += valorOriginal
          else kpiProvDes += valorOriginal
        }
      }

      if (anoIdx === prevYearIdx && selectedMonths.includes(mesIdx) && !isInternalTransfer) {
        const payM = l.data_conciliacao ? getMesIdx(l.data_conciliacao) : mesIdx
        const isRealizedInPeriod = isRealizedTotal && selectedMonths.includes(payM)

        if (tipo === 'receita') {
          if (!isReserva) {
            if (isRealizedInPeriod) kpiRecPrev += valorBruto
            else kpiProvRecPrev += valorBruto
          }
        } else {
          if (isRealizedInPeriod) kpiDesPrev += valorOriginal
          else kpiProvDesPrev += valorOriginal
        }
      }
    })

    const resArr = recRealArr.map((v, i) => Math.round((v + recProvArr[i] - despRealArr[i] - despProvArr[i]) * 100) / 100)
    
    const kpiRecTotal = Math.round(kpiRec * 100) / 100
    const kpiRecPrevTotal = Math.round(kpiRecPrev * 100) / 100
    
    const resCurr = kpiRecTotal - kpiDes
    const resPrev = kpiRecPrevTotal - kpiDesPrev

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return 0
      return Math.round(((curr - prev) / Math.abs(prev)) * 100)
    }

    // ── Inadimplência Real-time do Período Selecionado ──
    const todayStr = new Date().toISOString().split('T')[0]
    const lancsMesInadimp = lancamentosFiltrados.filter(l => 
      selectedMonths.includes(getMesIdx(l.data)) && 
      getAnoIdx(l.data) === selectedYear &&
      (l.tipo || '').toLowerCase() === 'receita'
    )

    const valorTotalMes = lancsMesInadimp.reduce((sum, l) => sum + getBruto(l), 0)
    const valorAtrasadoMes = lancsMesInadimp
      .filter(l => l.status === 'atrasado' || (l.status === 'aberto' && l.data < todayStr))
      .reduce((sum, l) => sum + getBruto(l), 0)

    const pctInadimpReal = valorTotalMes > 0 ? (valorAtrasadoMes / valorTotalMes) * 100 : 0

    // Associados (Status Geral)
    const pendentesList = associados
      .filter(item => (item.status || '').toLowerCase() === 'pendente')
      .map(item => ({ id: item.id, nome: item.nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome))

    const a        = associados.filter(item => {
      const s = (item.status || '').toLowerCase().trim()
      return s === 'ativo' || s === 'ativa'
    }).length
    const i_status = associados.filter(item => {
      const s = (item.status || '').toLowerCase().trim()
      return s === 'inadimplente' || s === 'inadimplentes' || s === 'inadimp'
    }).length
    const inat     = associados.filter(item => {
      const s = (item.status || '').toLowerCase().trim()
      return s === 'inativo' || s === 'inativa'
    }).length
    const pend     = pendentesList.length

    // Planejamento (Soma dos orçamentos dos meses selecionados, separando por tipo)
    const orcPeriodo = orcamentos.filter(o => selectedMonths.includes(o.mes - 1) && o.ano === selectedYear)
    
    let planejadoRec = 0
    let planejadoDesp = 0

    // Para cada orçamento, precisamos saber se a categoria é receita ou despesa
    const { categorias = [] } = (associados as any).categoriasData || {} // Fallback se não vier no hook

    // Como as categorias podem não estar acessíveis aqui diretamente de forma limpa, 
    // vamos assumir que o orcamento já pode ter o tipo ou filtrar por nome comum
    orcPeriodo.forEach(o => {
      const catNome = (o.categoria || '').toLowerCase()
      const isRec = catNome.includes('receita') || catNome.includes('adesão') || catNome.includes('mensalidade') || catNome.includes('aporte')
      if (isRec) planejadoRec += (o.valor_planejado || 0)
      else planejadoDesp += (o.valor_planejado || 0)
    })

    return { 
      regime,
      recReal: recRealArr,
      recProv: recProvArr,
      reservaArr: reservaArr,
      despReal: despRealArr,
      despProv: despProvArr,
      resultadoData: resArr, 
      receitaTotal: kpiRecTotal, 
      despesaTotal: Math.round(kpiDes * 100) / 100,
      receitaProvisionada: Math.round(kpiProvRec * 100) / 100,
      despesaProvisionada: Math.round(kpiProvDes * 100) / 100,
      saldoTotal: Math.round((kpiRecTotal - kpiDes) * 100) / 100,
      trends: {
        receita: calcTrend(kpiRecTotal, kpiRecPrevTotal),
        despesa: calcTrend(kpiDes, kpiDesPrev),
        resultado: calcTrend(resCurr, resPrev)
      },
      associadosStats: {
        ativos: a,
        inadimplentes: i_status,
        inativos: inat,
        zapsignPendentes: pend,
        pctInadimp: pctInadimpReal,
        listaPendentes: pendentesList
      },
      planejamentoStats: {
        planejadoRec: planejadoRec,
        planejadoDesp: planejadoDesp,
        realizadoRec: kpiRecTotal,
        realizadoDesp: Math.round(kpiDes * 100) / 100,
        provRec: Math.round(kpiProvRec * 100) / 100,
        provDesp: Math.round(kpiProvDes * 100) / 100,
        regime: regime,
        percentual: planejadoRec > 0 ? Math.round((kpiRecTotal / planejadoRec) * 100) : 0
      }
    }
  }, [lancamentos, associados, orcamentos, selectedMonths, selectedYear, regime, contas, tipoConta])

  return metrics
}
