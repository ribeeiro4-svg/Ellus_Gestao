import { useMemo } from 'react'
import { getMesIdx, getAnoIdx } from '@/lib/utils/formatters'

export function useDashboardMetrics(
  lancamentos: any[], 
  associados: any[], 
  orcamentos: any[], 
  selectedMonth: number, 
  selectedYear: number
) {
  const metrics = useMemo(() => {
    const recRealArr = Array(12).fill(0)
    const recProvArr = Array(12).fill(0)
    const despRealArr = Array(12).fill(0)
    const despProvArr = Array(12).fill(0)
    
    let kpiRec = 0
    let kpiDes = 0
    let kpiTax = 0

    let kpiRecPrev = 0
    let kpiDesPrev = 0
    let kpiTaxPrev = 0

    const prevMonthIdx = selectedMonth === 0 ? 11 : selectedMonth - 1
    const prevYearIdx = selectedMonth === 0 ? selectedYear - 1 : selectedYear

    lancamentos.forEach(l => {
      const mesIdx = getMesIdx(l.data)
      const anoIdx = getAnoIdx(l.data)
      const valor = l.valor || 0
      const tipo = (l.tipo || '').toLowerCase()
      const status = (l.status || '').toLowerCase()
      
      const match = (l.descricao || '').match(/\(Taxa: R\$\ s*([^)]+)\)/)
      const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0

      if (anoIdx === selectedYear && mesIdx >= 0 && mesIdx <= 11) {
        if (tipo === 'receita') {
          if (status === 'pago') recRealArr[mesIdx] = Math.round((recRealArr[mesIdx] + valor + taxaVal) * 100) / 100
          else recProvArr[mesIdx] = Math.round((recProvArr[mesIdx] + valor + taxaVal) * 100) / 100
        } else {
          if (status === 'pago') despRealArr[mesIdx] = Math.round((despRealArr[mesIdx] + valor) * 100) / 100
          else despProvArr[mesIdx] = Math.round((despProvArr[mesIdx] + valor) * 100) / 100
        }
      }

      if (anoIdx === selectedYear && mesIdx === selectedMonth) {
        if (tipo === 'receita' && status === 'pago') {
          kpiRec += valor
          kpiTax += taxaVal
        } else if (tipo === 'despesa' && status === 'pago') {
          kpiDes += valor
        }
      }

      if (anoIdx === prevYearIdx && mesIdx === prevMonthIdx) {
        if (tipo === 'receita' && status === 'pago') {
          kpiRecPrev += valor
          kpiTaxPrev += taxaVal
        } else if (tipo === 'despesa' && status === 'pago') {
          kpiDesPrev += valor
        }
      }
    })

    const resArr = recRealArr.map((v, i) => Math.round((v + recProvArr[i] - despRealArr[i] - despProvArr[i]) * 100) / 100)
    
    const kpiRecTotal = Math.round((kpiRec + kpiTax) * 100) / 100
    const kpiRecPrevTotal = Math.round((kpiRecPrev + kpiTaxPrev) * 100) / 100
    
    const resCurr = kpiRecTotal - kpiDes
    const resPrev = kpiRecPrevTotal - kpiDesPrev

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return 0
      return Math.round(((curr - prev) / Math.abs(prev)) * 100)
    }

    // Associados
    const a = associados.filter(item => (item.status || '').toLowerCase().includes('ativ')).length
    const i = associados.filter(item => (item.status || '').toLowerCase().includes('inadimp')).length
    const inat = associados.filter(item => (item.status || '').toLowerCase().includes('inat')).length
    const pend = associados.filter(item => (item.status || '').toLowerCase() === 'pendente').length
    const total = associados.length || 1

    // Planejamento (Planejado vs Realizado)
    const orcMes = orcamentos.filter(o => (o.mes === selectedMonth + 1 || o.mes === selectedMonth) && o.ano === selectedYear)
    const planejadoTotal = orcMes.reduce((sum, o) => sum + (o.valor_planejado || 0), 0)

    return { 
      recReal: recRealArr,
      recProv: recProvArr,
      despReal: despRealArr,
      despProv: despProvArr,
      resultadoData: resArr, 
      receitaTotal: kpiRecTotal, 
      despesaTotal: Math.round(kpiDes * 100) / 100,
      taxaRecuperada: Math.round(kpiTax * 100) / 100,
      saldoTotal: Math.round((kpiRecTotal - kpiDes) * 100) / 100,
      trends: {
        receita: calcTrend(kpiRecTotal, kpiRecPrevTotal),
        despesa: calcTrend(kpiDes, kpiDesPrev),
        resultado: calcTrend(resCurr, resPrev)
      },
      associadosStats: {
        ativos: a,
        inadimplentes: i,
        inativos: inat,
        zapsignPendentes: pend,
        pctInadimp: (i / total) * 100
      },
      planejamentoStats: {
        planejado: planejadoTotal,
        realizado: kpiRecTotal,
        percentual: planejadoTotal > 0 ? Math.round((kpiRecTotal / planejadoTotal) * 100) : 0
      }
    }
  }, [lancamentos, associados, orcamentos, selectedMonth, selectedYear])

  return metrics
}
