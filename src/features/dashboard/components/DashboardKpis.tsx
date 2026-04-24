import React from 'react'
import { fmtR, fmtPct } from '@/lib/utils/formatters'

interface DashboardKpisProps {
  metrics: any
}

export default function DashboardKpis({ metrics }: DashboardKpisProps) {
  const { receitaTotal, despesaTotal, associadosStats } = metrics

  const cards = [
    { label: `📈 Ingresso Realizado`, value: fmtR(receitaTotal), color: 'text-emerald-600' },
    { label: `📉 Dispêndios Pagos`, value: fmtR(despesaTotal), color: 'text-rose-600' },
    { label: `💵 Superávit/Déficit Líquido`, value: fmtR(receitaTotal - despesaTotal), color: 'text-indigo-600' },
    { label: `🚀 Superávit`, value: fmtR(receitaTotal - despesaTotal), color: 'text-emerald-600' },
    { label: `⚠️ Inadimplência`, value: fmtPct(associadosStats.pctInadimp), color: 'text-rose-500' },
  ]

  return (
    <div className="flex items-center gap-3 mb-8 w-full">
      <div className="flex flex-wrap items-stretch gap-2 flex-1">
        {cards.map(k => (
          <div key={k.label} className="bg-white border border-slate-100 rounded-2xl p-4 flex-1 min-w-[140px] shadow-sm transition-all hover:shadow-md">
            <div className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">{k.label}</div>
            <div className={`text-base font-black ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
