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
        labels: { color: 'rgba(255,255,255,0.9)', font: { size: 14, family: 'system-ui, sans-serif', weight: '600' as const }, boxWidth: 16, padding: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(4,13,10,0.95)',
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        titleColor: '#fff',
        titleFont: { size: 16, family: 'system-ui, sans-serif', weight: '600' as const },
        bodyColor: 'rgba(255,255,255,0.95)',
        bodyFont: { size: 15, family: 'system-ui, sans-serif', weight: '500' as const },
        padding: 12,
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: R$ ${ctx.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 14, family: 'system-ui, sans-serif', weight: '600' as const } } },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: 'rgba(255,255,255,0.7)',
          font: { size: 14, family: 'system-ui, sans-serif', weight: '600' as const },
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
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-black uppercase tracking-[3px] text-emerald-400/80">Financeiro</p>
            <h2 className="text-5xl font-black text-white tracking-tight">Fluxo de Caixa</h2>
            <p className="text-base text-white/50 font-semibold mt-1">Últimos 6 meses — valores efetivados</p>
          </div>
          {/* Mini KPIs */}
          <div className="flex gap-6 mt-2">
            <div className="text-right">
              <p className="text-[12px] font-black uppercase tracking-widest text-white/50">Total Entradas</p>
              <div className="text-3xl font-black text-emerald-400 mt-1">
                <CountUp value={totalReceita} prefix="R$ " decimals={0} duration={900} />
              </div>
            </div>
            <div className="w-px h-12 bg-white/10 self-center" />
            <div className="text-right">
              <p className="text-[12px] font-black uppercase tracking-widest text-white/50">Total Saídas</p>
              <div className="text-3xl font-black text-rose-400 mt-1">
                <CountUp value={totalDespesa} prefix="R$ " decimals={0} duration={900} />
              </div>
            </div>
            <div className="w-px h-12 bg-white/10 self-center" />
            <div className="text-right">
              <p className="text-[12px] font-black uppercase tracking-widest text-white/50">Resultado</p>
              <div className={`text-3xl font-black mt-1 ${totalResultado >= 0 ? 'text-yellow-400' : 'text-rose-400'}`}>
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
