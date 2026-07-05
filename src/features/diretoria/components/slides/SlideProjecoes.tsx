'use client'
import React from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip, Legend } from 'chart.js'
import { MESES } from '@/lib/utils/formatters'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip, Legend)

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.5'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.4'/%3E%3C/svg%3E")`

interface ProjecaoMes {
  mes: number
  receita: number
  despesas: number
  resultado: number
}

interface SlideProjecoesProps {
  projecaoAnual: ProjecaoMes[]
  mesRef: number
}

export default function SlideProjecoes({ projecaoAnual, mesRef }: SlideProjecoesProps) {
  const labels = projecaoAnual.map(m => MESES[m.mes].substring(0, 3))
  const passados = projecaoAnual.filter(m => m.mes <= mesRef)
  const futuros = projecaoAnual.filter(m => m.mes > mesRef)

  const receitaData = projecaoAnual.map(m => m.receita)
  const despesaData = projecaoAnual.map(m => m.despesas)
  const resultadoData = projecaoAnual.map(m => m.resultado)

  const getGradient = (ctx: any, chartArea: any, colorStart: string, colorEnd: string) => {
    if (!chartArea) return colorStart;
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Receita Projetada',
        data: receitaData,
        borderColor: 'rgba(16,185,129,1)',
        backgroundColor: (context: any) => getGradient(context.chart.ctx, context.chart.chartArea, 'rgba(16,185,129,0.3)', 'rgba(16,185,129,0.0)'),
        pointBackgroundColor: projecaoAnual.map(m => m.mes <= mesRef ? 'rgba(16,185,129,1)' : 'rgba(16,185,129,0.4)'),
        pointBorderColor: '#000',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 4,
        borderDash: [],
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Despesa Projetada',
        data: despesaData,
        borderColor: 'rgba(251,113,133,1)',
        backgroundColor: (context: any) => getGradient(context.chart.ctx, context.chart.chartArea, 'rgba(251,113,133,0.3)', 'rgba(251,113,133,0.0)'),
        pointBackgroundColor: projecaoAnual.map(m => m.mes <= mesRef ? 'rgba(251,113,133,1)' : 'rgba(251,113,133,0.4)'),
        pointBorderColor: '#000',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 4,
        borderDash: [],
        tension: 0.4,
        fill: true,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutQuart' as const },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: 'rgba(255,255,255,0.9)', font: { size: 20, family: 'system-ui, sans-serif', weight: 'normal' as const }, boxWidth: 24, padding: 30 }
      },
      tooltip: {
        backgroundColor: 'rgba(4,13,10,0.95)',
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        titleColor: '#fff',
        titleFont: { size: 22, family: 'system-ui, sans-serif', weight: 'normal' as const },
        bodyColor: 'rgba(255,255,255,0.95)',
        bodyFont: { size: 20, family: 'system-ui, sans-serif', weight: 'normal' as const },
        padding: 16,
        boxPadding: 8,
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: R$ ${ctx.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 16, family: 'system-ui, sans-serif', weight: 'normal' as const }, autoSkip: false, maxRotation: 0 } },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 16, family: 'system-ui, sans-serif', weight: 'normal' as const }, callback: (v: any) => `R$ ${(v / 1000).toFixed(0)}k` }
      }
    }
  }

  const receitaAcumulada = passados.reduce((s, m) => s + m.receita, 0)
  const despesaAcumulada = passados.reduce((s, m) => s + m.despesas, 0)
  const saldoAcumulado = receitaAcumulada - despesaAcumulada
  const projecaoReceitaResto = futuros.reduce((s, m) => s + m.receita, 0)

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#040d0a] p-10">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: HEX_PATTERN, backgroundSize: '56px 100px' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/3 via-transparent to-transparent" />

      <div className="relative z-10 flex flex-col h-full gap-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-black uppercase tracking-[3px] text-blue-400/80">Para Onde Vamos</p>
            <h2 className="text-5xl font-black text-white tracking-tight">Projeções Anuais</h2>
            <p className="text-base text-white/50 font-semibold mt-1">Realizado + projeção baseada no cenário de simulação</p>
          </div>

          <div className="flex gap-4">
            <div className="p-5 rounded-[20px] bg-white/5 border border-emerald-500/20 text-right min-w-[180px]">
              <p className="text-[12px] font-black uppercase tracking-widest text-white/40 mb-2">Acumulado Realizado</p>
              <p className="text-3xl font-black text-emerald-400">R$ {(saldoAcumulado / 1000).toFixed(0)}k</p>
            </div>
            <div className="p-5 rounded-[20px] bg-white/5 border border-blue-500/20 text-right min-w-[180px]">
              <p className="text-[12px] font-black uppercase tracking-widest text-white/40 mb-2">Receita Projetada</p>
              <p className="text-3xl font-black text-blue-400">R$ {(projecaoReceitaResto / 1000).toFixed(0)}k</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 p-4 rounded-[24px] bg-transparent border border-white/10">
          <Line data={chartData} options={options} />
        </div>

        {/* Legend realizado vs projetado */}
        <div className="flex items-center gap-4 p-4 rounded-[14px] bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 bg-emerald-400" />
            <span className="text-[13px] font-bold text-white/60">Sólido = Realizado</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 bg-white/30" style={{ borderTop: '2px dashed rgba(255,255,255,0.4)' }} />
            <span className="text-[13px] font-bold text-white/60">Pontilhado = Projeção futura</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <span className="text-[13px] font-bold text-white/50">Mês de referência: {MESES[mesRef]}</span>
        </div>
      </div>
    </div>
  )
}
