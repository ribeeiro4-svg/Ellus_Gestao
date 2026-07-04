'use client'
import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { ComposicaoItem } from '../../hooks/useApresentacaoData'

ChartJS.register(ArcElement, Tooltip, Legend)

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.5'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.4'/%3E%3C/svg%3E")`

const REC_COLORS = ['rgba(16,185,129,0.8)', 'rgba(52,211,153,0.7)', 'rgba(110,231,183,0.6)', 'rgba(167,243,208,0.5)', 'rgba(209,250,229,0.4)', 'rgba(6,95,70,0.6)']
const DESP_COLORS = ['rgba(251,113,133,0.8)', 'rgba(251,146,60,0.7)', 'rgba(252,196,25,0.6)', 'rgba(167,139,250,0.6)', 'rgba(56,189,248,0.5)', 'rgba(239,68,68,0.5)']

interface SlideComposicaoProps {
  receitas: ComposicaoItem[]
  despesas: ComposicaoItem[]
}

function DonutSection({ title, items, colors }: { title: string; items: ComposicaoItem[]; colors: string[] }) {
  const total = items.reduce((s, i) => s + i.valor, 0)
  const data = {
    labels: items.map(i => i.categoria),
    datasets: [{
      data: items.map(i => i.valor),
      backgroundColor: colors,
      borderColor: 'rgba(4,13,10,0.8)',
      borderWidth: 2,
      hoverOffset: 6,
    }]
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutQuart' as const },
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(4,13,10,0.95)',
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        titleColor: '#fff',
        titleFont: { size: 16, family: 'system-ui, sans-serif', weight: 'normal' as const },
        bodyColor: 'rgba(255,255,255,0.95)',
        bodyFont: { size: 15, family: 'system-ui, sans-serif', weight: 'normal' as const },
        padding: 12,
        callbacks: {
          label: (ctx: any) => ` R$ ${ctx.parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${((ctx.parsed / total) * 100).toFixed(1)}%)`
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      <p className="text-[13px] font-black uppercase tracking-[2px] text-white/50">{title}</p>
      <div className="flex gap-6 items-center">
        <div className="relative w-40 h-40 shrink-0">
          {items.length > 0 ? (
            <>
              <Doughnut data={data} options={options} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest">Total</p>
                <p className="text-xl font-black text-white mt-1">R$ {(total / 1000).toFixed(0)}k</p>
              </div>
            </>
          ) : (
            <div className="w-full h-full rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
              <p className="text-xs text-white/30 font-bold">Sem dados</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {items.map((item, i) => (
            <div key={item.categoria} className="flex items-center gap-3 group">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[i] || '#666' }} />
              <p className="text-[13px] font-bold text-white/70 truncate flex-1">{item.categoria}</p>
              <p className="text-[13px] font-black text-white/90 shrink-0">{item.percentual.toFixed(0)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SlideComposicao({ receitas, despesas }: SlideComposicaoProps) {
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#040d0a] p-10">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: HEX_PATTERN, backgroundSize: '56px 100px' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/3 via-transparent to-transparent" />

      <div className="relative z-10 flex flex-col h-full gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-black uppercase tracking-[3px] text-emerald-400/80">Financeiro</p>
          <h2 className="text-5xl font-black text-white tracking-tight">Composição Financeira</h2>
          <p className="text-base text-white/50 font-semibold mt-1">De onde vem e para onde vai o dinheiro</p>
        </div>

        <div className="grid grid-cols-2 gap-8 flex-1">
          <div className="flex flex-col gap-4 p-6 rounded-[24px] bg-white/5 border border-emerald-500/15">
            <DonutSection title="Composição de Receitas" items={receitas} colors={REC_COLORS} />
          </div>
          <div className="flex flex-col gap-4 p-6 rounded-[24px] bg-white/5 border border-rose-500/15">
            <DonutSection title="Composição de Despesas" items={despesas} colors={DESP_COLORS} />
          </div>
        </div>

        {/* Insight */}
        <div className="flex items-center gap-4 p-5 rounded-[20px] bg-white/5 border border-white/10 mt-2">
          <div className="w-1.5 h-10 rounded-full bg-emerald-400/60 shrink-0" />
          <p className="text-[14px] text-white/60 font-semibold">
            {receitas[0] && `Maior fonte de receita: `}
            <span className="text-white">{receitas[0]?.categoria || '—'}</span>
            {receitas[0] && ` (${receitas[0].percentual.toFixed(0)}% do total)`}
            {despesas[0] && <span className="mx-2 text-white/20">|</span>}
            {despesas[0] && `Maior despesa: `}
            <span className="text-white">{despesas[0]?.categoria || '—'}</span>
            {despesas[0] && ` (${despesas[0].percentual.toFixed(0)}%)`}
          </p>
        </div>
      </div>
    </div>
  )
}
