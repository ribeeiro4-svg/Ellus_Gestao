import React from 'react'
import { fmtR } from '@/lib/utils/formatters'

interface FinancialKpiGridProps {
  kpis: any
  onNew: () => void
}

export default function FinancialKpiGrid({ kpis, onNew }: FinancialKpiGridProps) {
  const cards = [
    { label: `📥 Receitas`, value: fmtR(kpis.pInc), color: 'text-emerald-600' },
    { label: `📤 Despesas`, value: fmtR(kpis.pExp), color: 'text-rose-600' },
    { label: `📅 Provisionado`, value: fmtR(kpis.provisionado), color: 'text-amber-500' },
    { label: `💰 Resultado`, value: fmtR(kpis.realizado), color: kpis.realizado >= 0 ? 'text-indigo-600' : 'text-red-600' },
    { label: `📟 Em Caixa`, value: fmtR(kpis.saldoCaixa), color: 'text-amber-600' },
    { label: `🏦 Em Banco`, value: fmtR(kpis.saldoBanco), color: 'text-indigo-600' },
    { label: `📊 Projetado`, value: fmtR(kpis.projetado), color: 'text-indigo-900', isMain: true },
  ]

  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex items-center justify-end">
        <button onClick={onNew} className="px-6 py-4 bg-emerald-600 text-white rounded-[20px] font-black text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200">
          + NOVO LANÇAMENTO
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 w-full">
        {cards.map(k => (
          <div key={k.label} className={`bg-white border border-slate-100 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md ${k.isMain ? 'ring-2 ring-indigo-50 border-indigo-200 bg-indigo-50/10' : ''}`}>
            <div className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">{k.label}</div>
            <div className={`text-base font-black ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
