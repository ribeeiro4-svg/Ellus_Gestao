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

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Receita Projetada',
        data: receitaData,
        borderColor: 'rgba(16,185,129,0.8)',
        backgroundColor: 'rgba(16,185,129,0.08)',
        pointBackgroundColor: projecaoAnual.map(m => m.mes <= mesRef ? 'rgba(16,185,129,1)' : 'rgba(16,185,129,0.4)'),
        pointRadius: 5,
        borderWidth: 2,
        borderDash: [],
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Despesa Projetada',
        data: despesaData,
        borderColor: 'rgba(251,113,133,0.7)',
        backgroundColor: 'rgba(251,113,133,0.05)',
        pointBackgroundColor: projecaoAnual.map(m => m.mes <= mesRef ? 'rgba(251,113,133,1)' : 'rgba(251,113,133,0.4)'),
        pointRadius: 5,
        borderWidth: 2,
        borderDash: [],
        tension: 0.4,
        fill: false,
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
        labels: { color: 'rgba(255,255,255,0.5)', font: { size: 11, weight: 'bold' as const }, boxWidth: 12 }
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
        ticks: { color: 'rgba(255,255,255,0.4)', callback: (v: any) => `R$ ${(v / 1000).toFixed(0)}k` }
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
          <div>
            <p className="text-[10px] font-black uppercase tracking-[3px] text-blue-400/70">Para Onde Vamos</p>
            <h2 className="text-3xl font-black text-white tracking-tight">Projeções Anuais</h2>
            <p className="text-sm text-white/30 font-semibold mt-1">Realizado + projeção baseada no cenário de simulação</p>
          </div>

          <div className="flex gap-4">
            <div className="p-4 rounded-[20px] bg-white/5 border border-emerald-500/20 text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Acumulado Realizado</p>
              <p className="text-xl font-black text-emerald-400">R$ {(saldoAcumulado / 1000).toFixed(0)}k</p>
            </div>
            <div className="p-4 rounded-[20px] bg-white/5 border border-blue-500/20 text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Receita Projetada (Restante)</p>
              <p className="text-xl font-black text-blue-400">R$ {(projecaoReceitaResto / 1000).toFixed(0)}k</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 p-4 rounded-[24px] bg-white/5 border border-white/10">
          <Line data={chartData} options={options} />
        </div>

        {/* Legend realizado vs projetado */}
        <div className="flex items-center gap-3 p-3 rounded-[14px] bg-white/3 border border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-px bg-emerald-400" />
            <span className="text-[10px] font-bold text-white/40">Sólido = Realizado</span>
          </div>
          <div className="w-px h-3 bg-white/15" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-px bg-white/30" style={{ borderTop: '1px dashed rgba(255,255,255,0.3)' }} />
            <span className="text-[10px] font-bold text-white/40">Pontilhado = Projeção futura</span>
          </div>
          <div className="w-px h-3 bg-white/15" />
          <span className="text-[10px] font-bold text-white/30">Mês de referência: {MESES[mesRef]}</span>
        </div>
      </div>
    </div>
  )
}
