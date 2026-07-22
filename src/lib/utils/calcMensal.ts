import type { Lancamento, Associado, EvolucaoMensal } from '@/lib/types'
import { getMesIdx, MESES } from './formatters'

export function calcMensalFinanceiro(lancamentos: Lancamento[]) {
  const receita = Array(12).fill(0)
  const despesa = Array(12).fill(0)

  lancamentos.forEach(row => {
    const m = getMesIdx(row.data)
    if (m < 0 || m > 11) return
    if (row.tipo === 'receita') receita[m] += row.valor
    else                        despesa[m] += row.valor
  })

  const resultado = receita.map((v, i) => v - despesa[i])
  const margem    = receita.map((v, i) => v > 0 ? Math.round((v - despesa[i]) / v * 1000) / 10 : 0)

  return { receita, despesa, resultado, margem }
}

export function calcEvolucao(lancamentos: Lancamento[], associados: Associado[], ano?: number): EvolucaoMensal[] {
  const { receita, despesa, resultado, margem } = calcMensalFinanceiro(lancamentos)
  const dataAtual = new Date()
  const anoAtual = dataAtual.getFullYear()
  const mesAtual = dataAtual.getMonth()

  return MESES.map((label, mes) => {
    const naoVivido = ano !== undefined && (ano > anoAtual || (ano === anoAtual && mes > mesAtual))

    if (naoVivido) {
      return {
        mes, label,
        receita: null,
        despesa: null,
        resultado: null,
        margem: null,
        assocAtivos: null,
        assocInadimplentes: null,
      }
    }

    let ativos = 0
    let inadimp = 0

    associados.forEach(a => {
      const dataStr = a.data_assinatura || a.created_at
      if (dataStr && ano !== undefined) {
        const d = new Date(dataStr)
        const aAno = d.getFullYear()
        const aMes = d.getMonth()
        if (aAno > ano || (aAno === ano && aMes > mes)) return
      }

      if (a.status === 'ativo') ativos++
      else if (a.status === 'inadimplente') inadimp++
    })

    return {
      mes, label,
      receita:            receita[mes],
      despesa:            despesa[mes],
      resultado:          resultado[mes],
      margem:             margem[mes],
      assocAtivos:        ativos,
      assocInadimplentes: inadimp,
    }
  })
}
