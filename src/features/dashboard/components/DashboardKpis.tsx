import React from 'react'
import { fmtR, fmtPct } from '@/lib/utils/formatters'

interface DashboardKpisProps {
  metrics: any
}

export default function DashboardKpis({ metrics }: DashboardKpisProps) {
  const { receitaTotal, despesaTotal, receitaProvisionada, despesaProvisionada, associadosStats, regime } = metrics

  const isCompetencia = regime === 'competencia'

  // No modo competência: soma realizado + projetado para mostrar o total do período
  const ingresso  = isCompetencia ? receitaTotal + (receitaProvisionada || 0) : receitaTotal
  const dispendio = isCompetencia ? despesaTotal + (despesaProvisionada  || 0) : despesaTotal
  const saldo     = ingresso - dispendio

  const cards = [
    {
      label: isCompetencia ? '📈 Ingresso Projetado' : '📈 Ingresso Realizado',
      value: fmtR(ingresso),
      color: 'text-emerald-600'
    },
    {
      label: isCompetencia ? '📉 Dispêndios Projetados' : '📉 Dispêndios Pagos',
      value: fmtR(dispendio),
      color: 'text-rose-600'
    },
    {
      label: `💵 Superávit/Déficit Líquido`,
      value: fmtR(saldo),
      color: 'text-emerald-600'
    },
    {
      label: `🚀 Superávit`,
      value: fmtR(saldo),
      color: 'text-emerald-600'
    },
    {
      label: `⚠️ Inadimplência`,
      value: fmtPct(associadosStats.pctInadimp),
      color: 'text-rose-500'
    },
  ]

  return (
    <div className="flex items-center gap-3 mb-8 w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 flex-1">
        {cards.map(k => (
          <div key={k.label} className="bg-gradient-to-br from-[#040d0a]/95 to-[#071a12]/95 backdrop-blur-2xl border border-white/5 rounded-2xl py-5 px-4 md:py-8 md:px-6 shadow-2xl transition-all hover:border-emerald-500/40">
            <div className="text-[9px] md:text-[10px] font-black text-white uppercase mb-1.5 md:mb-2 tracking-wider">{k.label}</div>
            <div className={`text-xl md:text-3xl font-black ${k.color} tracking-tight`}>{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
