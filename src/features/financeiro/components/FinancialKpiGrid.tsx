import React from 'react'
import { fmtR } from '@/lib/utils/formatters'
import { Plus } from 'lucide-react'

interface FinancialKpiGridProps {
  kpis: any
  onNewReceita: () => void
  onNewDespesa: () => void
}

export default function FinancialKpiGrid({ kpis, onNewReceita, onNewDespesa }: FinancialKpiGridProps) {
  const cards = [
    { label: `📥 Receitas`, value: fmtR(kpis.pInc), color: 'text-emerald-600' },
    { label: `📈 Rec. Projetada`, value: fmtR(kpis.receitaProjetada), color: 'text-emerald-400' },
    { label: `📤 Despesas`, value: fmtR(kpis.pExp), color: 'text-rose-600' },
    { label: `📅 Provisionado`, value: fmtR(kpis.provisionado), color: 'text-amber-500' },
    { label: `💰 Resultado`, value: fmtR(kpis.realizado), color: kpis.realizado >= 0 ? 'text-indigo-600' : 'text-red-600' },
    { label: `📟 Em Caixa`, value: fmtR(kpis.saldoCaixa), color: 'text-amber-600' },
    { label: `🏦 Em Banco`, value: fmtR(kpis.saldoBanco), color: 'text-indigo-600' },
    { label: `📊 Projetado`, value: fmtR(kpis.projetado), color: 'text-indigo-900', isMain: true },
  ]

  return (
    <div className="flex items-center gap-3 mb-8 w-full">
      <div className="flex flex-wrap items-stretch gap-2 flex-1">
        {cards.map(k => (
          <div key={k.label} className={`bg-white border border-slate-100 rounded-2xl p-4 flex-1 min-w-[140px] shadow-sm transition-all hover:shadow-md ${k.isMain ? 'ring-2 ring-indigo-50 border-indigo-200 bg-indigo-50/10' : ''}`}>
            <div className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">{k.label}</div>
            <div className={`text-base font-black ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col gap-2 self-stretch min-w-[180px]">
        <button onClick={onNewReceita} className="flex-1 px-4 bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10 active:scale-[0.98] flex items-center justify-center gap-2">
          <Plus size={14} strokeWidth={4} /> Receita
        </button>
        <button onClick={onNewDespesa} className="flex-1 px-4 bg-rose-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/10 active:scale-[0.98] flex items-center justify-center gap-2">
          <Plus size={14} strokeWidth={4} /> Despesa
        </button>
      </div>
    </div>
  )
}
