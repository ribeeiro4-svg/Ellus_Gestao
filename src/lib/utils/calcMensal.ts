import type { Lancamento, Associado, EvolucaoMensal } from '@/lib/types'
import { MESES } from './formatters'

export function calcMensalFinanceiro(lancamentos: Lancamento[]) {
  const receita = Array(12).fill(0)
  const despesa = Array(12).fill(0)

  lancamentos.forEach(row => {
    const m = new Date(row.data).getMonth()
    if (isNaN(m)) return
    if (row.tipo === 'receita') receita[m] += row.valor
    else                        despesa[m] += row.valor
  })

  const resultado = receita.map((v, i) => v - despesa[i])
  const margem    = receita.map((v, i) => v > 0 ? Math.round((v - despesa[i]) / v * 1000) / 10 : 0)

  return { receita, despesa, resultado, margem }
}

export function calcEvolucao(lancamentos: Lancamento[], associados: Associado[]): EvolucaoMensal[] {
  const { receita, despesa, resultado, margem } = calcMensalFinanceiro(lancamentos)
  const ativos     = associados.filter(a => a.status === 'ativo').length
  const inadimp    = associados.filter(a => a.status === 'inadimplente').length

  return MESES.map((label, mes) => ({
    mes, label,
    receita:            receita[mes],
    despesa:            despesa[mes],
    resultado:          resultado[mes],
    margem:             margem[mes],
    assocAtivos:        ativos,
    assocInadimplentes: inadimp,
  }))
}
