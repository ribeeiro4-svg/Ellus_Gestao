'use client'
import React from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip, Legend } from 'chart.js'
import type { ApresentacaoKpis, EvolucaoAssociados } from '../../hooks/useApresentacaoData'
import CountUp from '../CountUp'
import { Users, UserPlus } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip, Legend)

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.5'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.4'/%3E%3C/svg%3E")`

interface SlideAssociadosProps {
  kpis: ApresentacaoKpis
  evolucao: EvolucaoAssociados[]
}

export default function SlideAssociados({ kpis, evolucao }: SlideAssociadosProps) {
  const crescimento = evolucao.length >= 2
    ? evolucao[evolucao.length - 1].ativos - evolucao[0].ativos
    : 0

  const chartData = {
    labels: evolucao.map(e => e.label),
    datasets: [{
      label: 'Associados Ativos',
      data: evolucao.map(e => e.ativos),
      borderColor: 'rgba(139,92,246,0.9)',
      backgroundColor: 'rgba(139,92,246,0.1)',
      pointBackgroundColor: 'rgba(139,92,246,1)',
      pointRadius: 5,
      pointHoverRadius: 8,
      borderWidth: 2.5,
      tension: 0.4,
      fill: true,
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutQuart' as const },
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
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 14, family: 'system-ui, sans-serif', weight: 'normal' as const } } },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 14, family: 'system-ui, sans-serif', weight: 'normal' as const } },
        beginAtZero: false,
      }
    },
    layout: {
      padding: {
        top: 50
      }
    }
  }

  const dataLabelsPlugin = {
    id: 'dataLabelsPlugin',
    afterDatasetsDraw(chart: any) {
      const { ctx } = chart
      chart.data.datasets.forEach((dataset: any, i: number) => {
        const meta = chart.getDatasetMeta(i)
        meta.data.forEach((element: any, index: number) => {
          const val = dataset.data[index]
          const prev = index > 0 ? dataset.data[index - 1] : val
          const diff = val - prev

          // Valor total (Associados)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
          ctx.font = '700 16px system-ui, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillText(val.toString(), element.x, element.y - 12)

          // Crescimento em relação ao mês anterior
          if (index > 0) {
            ctx.font = '800 13px system-ui, sans-serif'
            ctx.fillStyle = diff > 0 ? '#34d399' : diff < 0 ? '#fb7185' : 'rgba(255,255,255,0.5)'
            const diffText = diff > 0 ? `+${diff}` : diff.toString()
            ctx.fillText(diffText, element.x, element.y - 32)
          }
        })
      })
    }
  }

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#040d0a] p-10">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: HEX_PATTERN, backgroundSize: '56px 100px' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-violet-500/3 via-transparent to-transparent" />

      <div className="relative z-10 flex flex-col h-full gap-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-black uppercase tracking-[3px] text-violet-400/80">Saúde da Base</p>
            <h2 className="text-5xl font-black text-white tracking-tight">Associados</h2>
            <p className="text-base text-white/50 font-semibold mt-1">Evolução e saúde da base associativa</p>
          </div>
          {/* KPIs rápidos */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1 p-5 rounded-[20px] bg-white/5 border border-violet-500/20 min-w-[120px]">
              <Users size={20} className="text-violet-400" />
              <div className="text-4xl font-black text-violet-400 mt-1">
                <CountUp value={kpis.totalAtivos} duration={900} />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-white/40 mt-1">Ativos</p>
            </div>
            <div className="flex flex-col items-center gap-1 p-5 rounded-[20px] bg-white/5 border border-emerald-500/20 min-w-[120px]">
              <UserPlus size={20} className="text-emerald-400" />
              <div className="text-4xl font-black text-emerald-400 mt-1">
                <CountUp value={kpis.novasAdesoesCount} duration={900} />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-white/40 mt-1">Novas Adesões</p>
            </div>
            <div className={`flex flex-col items-center gap-1 p-5 rounded-[20px] bg-white/5 border min-w-[120px] ${crescimento >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
              <div className={`text-4xl font-black mt-6 ${crescimento >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {crescimento >= 0 ? '+' : ''}{crescimento}
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-white/40 mt-1">Crescimento</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0 p-4 rounded-[24px] bg-white/5 border border-white/10">
          <Line data={chartData} options={options} plugins={[dataLabelsPlugin]} />
        </div>
      </div>
    </div>
  )
}
