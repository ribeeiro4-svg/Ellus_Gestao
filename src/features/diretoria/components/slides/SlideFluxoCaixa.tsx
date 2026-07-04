'use client'
import React from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import type { FluxoMensal } from '../../hooks/useApresentacaoData'
import CountUp from '../CountUp'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.5'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.4'/%3E%3C/svg%3E")`

interface SlideFluxoCaixaProps {
  fluxo: FluxoMensal[]
}

export default function SlideFluxoCaixa({ fluxo }: SlideFluxoCaixaProps) {
  const totalReceita = fluxo.reduce((s, m) => s + m.receita, 0)
  const totalDespesa = fluxo.reduce((s, m) => s + m.despesa, 0)
  const totalResultado = totalReceita - totalDespesa

  const chartData = {
    labels: fluxo.map(m => m.label),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Receitas',
        data: fluxo.map(m => m.receita),
        backgroundColor: 'rgba(16,185,129,0.7)',
        borderColor: 'rgba(16,185,129,0.9)',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
        order: 2,
      },
      {
        type: 'bar' as const,
        label: 'Despesas',
        data: fluxo.map(m => m.despesa),
        backgroundColor: 'rgba(251,113,133,0.5)',
        borderColor: 'rgba(251,113,133,0.8)',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Resultado',
        data: fluxo.map(m => m.resultado),
        borderColor: 'rgba(250,204,21,0.8)',
        backgroundColor: 'rgba(250,204,21,0.1)',
        pointBackgroundColor: 'rgba(250,204,21,1)',
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        order: 1,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutQuart' as const },
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: 'rgba(255,255,255,0.5)', font: { size: 11, weight: 'bold' as const }, boxWidth: 12, padding: 16 }
      },
      tooltip: {
        backgroundColor: 'rgba(4,13,10,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: 'rgba(255,255,255,0.8)',
        bodyColor: 'rgba(255,255,255,0.6)',
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: R$ ${ctx.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 12, weight: 'bold' as const } } },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: 'rgba(255,255,255,0.4)',
          font: { size: 11 },
          callback: (v: any) => `R$ ${(v / 1000).toFixed(0)}k`
        }
      }
    }
  }

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#040d0a] p-10">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: HEX_PATTERN, backgroundSize: '56px 100px' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/3 via-transparent to-transparent" />

      <div className="relative z-10 flex flex-col h-full gap-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[3px] text-emerald-400/70">Financeiro</p>
            <h2 className="text-3xl font-black text-white tracking-tight">Fluxo de Caixa</h2>
            <p className="text-sm text-white/30 font-semibold mt-1">Últimos 6 meses — valores efetivados</p>
          </div>
          {/* Mini KPIs */}
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Total Entradas</p>
              <div className="text-xl font-black text-emerald-400">
                <CountUp value={totalReceita} prefix="R$ " decimals={0} duration={900} />
              </div>
            </div>
            <div className="w-px h-10 bg-white/10 self-center" />
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Total Saídas</p>
              <div className="text-xl font-black text-rose-400">
                <CountUp value={totalDespesa} prefix="R$ " decimals={0} duration={900} />
              </div>
            </div>
            <div className="w-px h-10 bg-white/10 self-center" />
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Resultado</p>
              <div className={`text-xl font-black ${totalResultado >= 0 ? 'text-yellow-400' : 'text-rose-400'}`}>
                <CountUp value={totalResultado} prefix="R$ " decimals={0} duration={900} />
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0">
          <Chart type="bar" data={chartData} options={options} />
        </div>
      </div>
    </div>
  )
}
