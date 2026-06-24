import React from 'react'
import { fmtR } from '@/lib/utils/formatters'
import { Plus, ArrowUpCircle, ArrowDownCircle, Wallet, Banknote, Target, TrendingUp } from 'lucide-react'

interface FinancialKpiGridProps {
  kpis: any
  onNewIngresso?: () => void
  onNewDespesa?: () => void
  cashReservePercentage: number
  onCashReservePercentageChange: (val: number) => void
  hasReserveAccount: boolean
  onFixAccount: () => void
  regime?: 'caixa' | 'competencia'
}

export default function FinancialKpiGrid({ 
  kpis, 
  onNewIngresso, 
  onNewDespesa,
  cashReservePercentage,
  onCashReservePercentageChange,
  hasReserveAccount,
  onFixAccount,
  regime = 'competencia'
}: FinancialKpiGridProps) {
  // Cálculo de percentuais para as barras de progresso
  const percRec = kpis.receitaProjetada > 0 ? (kpis.pInc / kpis.receitaProjetada) * 100 : 0
  const percDesp = kpis.despesaProjetada > 0 ? (kpis.pExp / kpis.despesaProjetada) * 100 : 0
  const percProv = kpis.despesaProjetada > 0 ? (kpis.provisionado / kpis.despesaProjetada) * 100 : 0

  const availability = kpis.saldoCaixa + kpis.saldoBanco
  const fundoCaixaReal = kpis.saldoFundo || 0
  const fundoCaixaMeta = (kpis.receitaProjetada * cashReservePercentage) / 100

  const isCaixa = regime === 'caixa'

  const cards = [
    { 
      label: 'Entradas Efetivadas', 
      value: fmtR(kpis.pInc), 
      color: 'text-emerald-600',
      icon: <ArrowUpCircle size={14} />,
      detail: regime === 'caixa' ? `Projetado: ${fmtR(kpis.receitaProjetada)}` : `Faturamento Total: ${fmtR(kpis.receitaProjetada)} (Prov: ${fmtR(kpis.provisaoEntrada)})`,
      progress: percRec,
      progressColor: 'bg-emerald-500',
      secondaryProgress: kpis.receitaProjetada > 0 ? (kpis.provisaoEntrada / kpis.receitaProjetada) * 100 : 0,
      secondaryColor: 'bg-amber-400'
    },
    { 
      label: 'Saídas Efetivadas', 
      value: fmtR(kpis.pExp), 
      color: 'text-rose-600',
      icon: <ArrowDownCircle size={14} />,
      detail: regime === 'caixa' ? `Projetado: ${fmtR(kpis.despesaProjetada)}` : `Total a Pagar: ${fmtR(kpis.despesaProjetada)} (Prov: ${fmtR(kpis.provisionado)})`,
      progress: percDesp,
      progressColor: 'bg-rose-500',
      secondaryProgress: percProv,
      secondaryColor: 'bg-amber-400'
    },
    { 
      label: 'Resultado (Liquidez)', 
      value: fmtR(kpis.realizado), 
      color: kpis.realizado >= 0 ? 'text-indigo-600' : 'text-red-600',
      icon: <Target size={14} />,
      detail: `Resultado Projetado: ${fmtR(kpis.projetado)}`,
      isMain: true 
    },
    { 
      label: 'Disponibilidade', 
      value: fmtR(availability), 
      color: 'text-slate-700',
      icon: <Wallet size={14} />,
      detail: `${fmtR(kpis.saldoCaixa)} Espécie / ${fmtR(kpis.saldoBanco)} Banco`
    },
    { 
      label: 'Fundo de Caixa', 
      value: fmtR(fundoCaixaReal), 
      color: 'text-amber-600',
      icon: <Banknote size={14} />,
      detail: `Meta de Reserva: ${fmtR(fundoCaixaMeta)} (${cashReservePercentage}%)`,
      isReserve: true
    },
  ]

  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-4 mb-8 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
        {cards.map(k => (
          <div 
            key={k.label} 
            className={`bg-white border border-slate-100 rounded-[24px] p-5 flex flex-col justify-between shadow-sm transition-all hover:shadow-md hover:border-slate-200 group ${k.isMain ? 'ring-2 ring-indigo-500/5' : ''}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="text-slate-300 group-hover:text-slate-500 transition-colors">{k.icon}</span>
                  {k.label}
                </div>
                {k.progress !== undefined && (
                   <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{Math.round(k.progress)}%</span>
                )}
                {k.isReserve && (
                  <div className="flex items-center gap-2">
                    {!hasReserveAccount && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onFixAccount(); }}
                        className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-200 transition-all border border-amber-200 animate-pulse"
                        title="Conta Bancária 'Fundo de Caixa' não encontrada. Clique para criar."
                      >
                        <Plus size={12} strokeWidth={3} /> Criar Conta
                      </button>
                    )}
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100/50">
                      <input 
                        type="number" 
                        value={cashReservePercentage}
                        onChange={(e) => onCashReservePercentageChange(Number(e.target.value))}
                        className="w-8 bg-transparent text-[10px] font-black text-amber-700 outline-none text-center"
                      />
                      <span className="text-[10px] font-black text-amber-700 opacity-40">%</span>
                    </div>
                  </div>
                )}
              </div>
              <div className={`text-xl font-black tracking-tight ${k.color}`}>{k.value}</div>
            </div>

            <div className="mt-4">
              {k.progress !== undefined && (
                <div className="w-full h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden flex">
                  <div className={`h-full ${k.progressColor} transition-all duration-1000`} style={{ width: `${k.progress}%` }} />
                  {k.secondaryProgress !== undefined && (
                     <div className={`h-full ${k.secondaryColor} opacity-50 transition-all duration-1000`} style={{ width: `${k.secondaryProgress}%` }} />
                  )}
                </div>
              )}
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center justify-between">
                {k.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {(onNewIngresso || onNewDespesa) && (
        <div className="flex flex-col gap-2 min-w-[160px]">
          {onNewIngresso && (
            <button 
              onClick={onNewIngresso} 
              className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[2px] hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-900/10 flex items-center justify-center gap-2 border border-white/10"
            >
              <Plus size={18} strokeWidth={3} /> Ingresso
            </button>
          )}
          {onNewDespesa && (
            <button 
              onClick={onNewDespesa} 
              className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[2px] hover:bg-rose-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-rose-900/10 flex items-center justify-center gap-2 border border-white/10"
            >
              <Plus size={18} strokeWidth={3} /> Dispêndio
            </button>
          )}
        </div>
      )}
    </div>
  )
}
