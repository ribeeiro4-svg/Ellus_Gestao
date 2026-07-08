'use client'
import React, { useMemo, useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { ComunicadoHistorico } from '@/lib/hooks/useComunicados'
import { TrendingUp, Zap, BarChart2, Users, Tag, Calendar } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
)

interface MetricasComunicadosProps {
  historico: ComunicadoHistorico[]
}

type Periodo = '1d' | '7d' | '30d' | 'tudo'

const SUCESSO_STATUS = ['iniciado', 'enviado']

function isSuccess(status: string) {
  return SUCESSO_STATUS.includes(status)
}

export default function MetricasComunicados({ historico }: MetricasComunicadosProps) {
  const [periodo, setPeriodo] = useState<Periodo>('1d')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const agora = new Date()

  const historicoFiltrado = useMemo(() => {
    if (periodo === 'tudo') return historico
    const dias = periodo === '1d' ? 1 : periodo === '7d' ? 7 : 30
    const corte = new Date(agora)
    
    if (periodo === '1d') {
      // Para 'Hoje', pegamos a partir da meia-noite de hoje
      corte.setHours(0, 0, 0, 0)
    } else {
      corte.setDate(corte.getDate() - dias)
    }
    
    return historico.filter(h => new Date(h.data_envio) >= corte)
  }, [historico, periodo, agora])

  // ── KPIs derivados ────────────────────────────────────────────────
  const total = historicoFiltrado.length
  const sucessos = historicoFiltrado.filter(h => isSuccess(h.status)).length
  const falhas = total - sucessos
  const taxaSucesso = total > 0 ? Math.round((sucessos / total) * 100) : 0

  // Msgs/minuto: baseado na campanha mais recente (envios em sequência)
  // Agrupa envios por "sessão" (gap < 5 min entre envios consecutivos)
  const msgsPorMinuto = useMemo(() => {
    if (historicoFiltrado.length < 2) return 0
    const sorted = [...historicoFiltrado]
      .sort((a, b) => new Date(a.data_envio).getTime() - new Date(b.data_envio).getTime())

    // Pega a última sessão contínua (gap <= 5min entre registros)
    let sessaoInicio = sorted[sorted.length - 1]
    let sessaoFim = sorted[sorted.length - 1]
    let contSessao = 1

    for (let i = sorted.length - 2; i >= 0; i--) {
      const curr = new Date(sorted[i].data_envio)
      const prox = new Date(sorted[i + 1].data_envio)
      const diffMin = (prox.getTime() - curr.getTime()) / 60000
      if (diffMin <= 5) {
        sessaoInicio = sorted[i]
        contSessao++
      } else {
        break
      }
    }

    const duracaoMin =
      (new Date(sessaoFim.data_envio).getTime() - new Date(sessaoInicio.data_envio).getTime()) / 60000

    if (duracaoMin < 0.1) {
      // Todos no mesmo minuto
      return contSessao
    }
    return Math.round((contSessao / duracaoMin) * 10) / 10
  }, [historicoFiltrado])

  // ── Envios por dia (últimos N dias) ──────────────────────────────
  const { diasLabels, diasSucesso, diasFalha } = useMemo(() => {
    const dias = periodo === '1d' ? 1 : periodo === '7d' ? 7 : 30
    const limDias = Math.min(dias, 30)

    const map: Record<string, { sucesso: number; falha: number }> = {}
    for (let i = limDias - 1; i >= 0; i--) {
      const d = new Date(agora)
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      map[key] = { sucesso: 0, falha: 0 }
    }

    const fonte = periodo === 'tudo' ? historico : historicoFiltrado
    fonte.forEach(h => {
      const key = new Date(h.data_envio).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      })
      if (map[key]) {
        if (isSuccess(h.status)) map[key].sucesso++
        else map[key].falha++
      }
    })

    const labels = Object.keys(map)
    return {
      diasLabels: labels,
      diasSucesso: labels.map(k => map[k].sucesso),
      diasFalha: labels.map(k => map[k].falha),
    }
  }, [historicoFiltrado, periodo, historico, agora])

  // ── Velocidade por minuto ao longo do tempo ───────────────────────
  const { minLabels, minCounts } = useMemo(() => {
    if (historicoFiltrado.length === 0) return { minLabels: [], minCounts: [] }
    const sorted = [...historicoFiltrado].sort(
      (a, b) => new Date(a.data_envio).getTime() - new Date(b.data_envio).getTime()
    )
    const map: Record<string, number> = {}
    sorted.forEach(h => {
      const d = new Date(h.data_envio)
      const key = `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      map[key] = (map[key] || 0) + 1
    })
    const keys = Object.keys(map).slice(-40) // máx 40 pontos
    return {
      minLabels: keys,
      minCounts: keys.map(k => map[k]),
    }
  }, [historicoFiltrado])

  // ── Ranking de templates ──────────────────────────────────────────
  const rankingTemplates = useMemo(() => {
    const map: Record<string, number> = {}
    historicoFiltrado.forEach(h => {
      const nome = h.template_nome || 'Sem template'
      map[nome] = (map[nome] || 0) + 1
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [historicoFiltrado])

  // ── Ranking de responsáveis ───────────────────────────────────────
  const rankingResponsaveis = useMemo(() => {
    const map: Record<string, number> = {}
    historicoFiltrado.forEach(h => {
      let nome = h.usuario_nome || 'Sistema'
      // Normalizar para Title Case (ex: BRUNO MATOS -> Bruno Matos)
      nome = nome
        .toLowerCase()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        
      map[nome] = (map[nome] || 0) + 1
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [historicoFiltrado])

  // ── Chart configs ─────────────────────────────────────────────────
  const barDailyData = {
    labels: diasLabels,
    datasets: [
      {
        label: 'Sucesso',
        data: diasSucesso,
        backgroundColor: '#10b981',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Falha',
        data: diasFalha,
        backgroundColor: '#f43f5e',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  const barDailyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { 
          font: { size: 11, weight: 'bold' as const },
          color: '#64748b'
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 10 }, stepSize: 1 },
      },
    },
  }

  const lineSpeedData = {
    labels: minLabels,
    datasets: [
      {
        label: 'Msgs/minuto',
        data: minCounts,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.12)',
        borderWidth: 2,
        pointRadius: minLabels.length > 20 ? 0 : 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const lineSpeedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.parsed.y} msg neste minuto`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11, weight: 'bold' as const },
          color: '#64748b',
          maxTicksLimit: 8,
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 10 }, stepSize: 1 },
      },
    },
  }

  const doughnutData = {
    labels: ['Sucesso', 'Falha'],
    datasets: [
      {
        data: [sucessos, falhas],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderColor: ['#fff', '#fff'],
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.raw} (${total > 0 ? Math.round((ctx.raw / total) * 100) : 0}%)`,
        },
      },
    },
  }

  const periodos: { value: Periodo; label: string }[] = [
    { value: '1d', label: 'Hoje' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: 'tudo', label: 'Todo o histórico' },
  ]

  if (!isMounted) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Header das métricas com seletor de período */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <BarChart2 size={18} className="text-amber-500" />
          <h3 className="font-bold text-sm uppercase tracking-wider">Painel de Métricas</h3>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {periodos.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                periodo === p.value
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Envios</p>
          <p className="text-3xl font-black text-slate-800">{total}</p>
          <p className="text-[11px] text-slate-400">no período</p>
        </div>
        <div className="bg-emerald-50 p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col gap-1">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Sucesso</p>
          <p className="text-3xl font-black text-emerald-700">{sucessos}</p>
          <p className="text-[11px] text-emerald-500">{taxaSucesso}% de taxa</p>
        </div>
        <div className="bg-rose-50 p-5 rounded-2xl shadow-sm border border-rose-100 flex flex-col gap-1">
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Falhas</p>
          <p className="text-3xl font-black text-rose-600">{falhas}</p>
          <p className="text-[11px] text-rose-400">{total > 0 ? 100 - taxaSucesso : 0}% de taxa</p>
        </div>
        <div className="bg-amber-50 p-5 rounded-2xl shadow-sm border border-amber-100 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Zap size={13} className="text-amber-500" />
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Velocidade</p>
          </div>
          <p className="text-3xl font-black text-amber-700">{msgsPorMinuto}</p>
          <p className="text-[11px] text-amber-500">msgs/minuto (última sessão)</p>
        </div>
      </div>

      {/* Linha 2: Donut + Gráfico de Velocidade */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut de taxa de sucesso */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-slate-500" />
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Taxa de Sucesso</p>
          </div>
          <div className="relative h-44 flex items-center justify-center">
            {total > 0 ? (
              <>
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-slate-800">{taxaSucesso}%</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">sucesso</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">Sem dados</p>
            )}
          </div>
          <div className="flex justify-around text-center">
            <div>
              <div className="w-3 h-3 rounded-full bg-emerald-500 mx-auto mb-1" />
              <p className="text-[10px] text-slate-500">Sucesso</p>
              <p className="text-sm font-bold text-slate-700">{sucessos}</p>
            </div>
            <div>
              <div className="w-3 h-3 rounded-full bg-rose-500 mx-auto mb-1" />
              <p className="text-[10px] text-slate-500">Falha</p>
              <p className="text-sm font-bold text-slate-700">{falhas}</p>
            </div>
          </div>
        </div>

        {/* Velocidade de disparo (line chart) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-amber-500" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Velocidade de Disparo (msgs/min)
              </p>
            </div>
            {msgsPorMinuto > 0 && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                Pico: {Math.max(...minCounts)} msg/min
              </span>
            )}
          </div>
          <div className="h-44">
            {minLabels.length > 1 ? (
              <Line data={lineSpeedData} options={lineSpeedOptions} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-slate-400">Dados insuficientes para gráfico de velocidade</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Linha 3: Volume por dia */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-slate-500" />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Volume de Envios por Dia</p>
        </div>
        <div className="h-52">
          {total > 0 ? (
            <Bar data={barDailyData} options={barDailyOptions} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-slate-400">Sem envios no período selecionado</p>
            </div>
          )}
        </div>
      </div>

      {/* Linha 4: Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ranking Templates */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Tag size={15} className="text-slate-500" />
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Templates Mais Usados</p>
          </div>
          {rankingTemplates.length > 0 ? (
            <div className="flex flex-col gap-3">
              {rankingTemplates.map(([nome, count], i) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                const cores = ['bg-amber-500', 'bg-amber-400', 'bg-amber-300', 'bg-slate-300', 'bg-slate-200']
                return (
                  <div key={nome} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-medium text-slate-700 truncate max-w-[70%]">
                        <span className="text-[10px] font-black text-slate-400 w-4">#{i + 1}</span>
                        {nome}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        {count} <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cores[i]} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Sem dados</p>
          )}
        </div>

        {/* Ranking Responsáveis */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-slate-500" />
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Envios por Responsável</p>
          </div>
          {rankingResponsaveis.length > 0 ? (
            <div className="flex flex-col gap-3">
              {rankingResponsaveis.map(([nome, count], i) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                const cores = ['bg-indigo-500', 'bg-indigo-400', 'bg-indigo-300', 'bg-slate-300', 'bg-slate-200']
                return (
                  <div key={nome} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-medium text-slate-700 truncate max-w-[70%]">
                        <span className="text-[10px] font-black text-slate-400 w-4">#{i + 1}</span>
                        {nome}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        {count} <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cores[i]} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Sem dados</p>
          )}
        </div>
      </div>
    </div>
  )
}
