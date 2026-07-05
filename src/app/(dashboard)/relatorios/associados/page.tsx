'use client'

import React, { useState, useEffect } from 'react'
import EIPReportContainer from '@/components/eip/EIPReportContainer'
import { Users, UserPlus, HeartPulse, Sparkles, Loader2, DollarSign } from 'lucide-react'
import { getEIPAssociadosData, EIPAssociadosData } from '@/app/actions/eip/associados'
import { exportToPDF, exportToExcel } from '@/lib/exportUtils'
import { useTenant } from '@/lib/hooks/useTenant'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)




// EIP Global Chart Sharpness & Typography
ChartJS.defaults.font.family = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
ChartJS.defaults.font.size = 12;
ChartJS.defaults.font.weight = 500;
ChartJS.defaults.color = '#374151'; // Slate-700 for crisp contrast

export default function AssociadosHub() {
  const { tenant } = useTenant()
  const [dateRange, setDateRange] = useState('este_mes')
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0])
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EIPAssociadosData | null>(null)

  useEffect(() => {
    if (!tenant?.id) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const today = new Date()
        let start = new Date()
        let end = new Date()
        
        if (dateRange === 'este_mes') {
          start = new Date(today.getFullYear(), today.getMonth(), 1)
        } else if (dateRange === 'hoje') {
          start = new Date(today)
        } else if (dateRange === 'ultimos_30') {
          start.setDate(today.getDate() - 30)
        } else if (dateRange === 'este_ano') {
          start = new Date(today.getFullYear(), 0, 1)
        } else if (dateRange === 'personalizado') {
          start = new Date(customStartDate)
          end = new Date(customEndDate)
          start = new Date(start.getTime() + start.getTimezoneOffset() * 60000)
          end = new Date(end.getTime() + end.getTimezoneOffset() * 60000)
        }

        const res = await getEIPAssociadosData(
          tenant.id, 
          start.toISOString(), 
          end.toISOString()
        )
        setData(res)
      } catch (err) {
        console.error("Erro ao buscar dados EIP Associados", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tenant?.id, dateRange, customStartDate, customEndDate])

  if (!tenant) return null

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  // Chart Data
  const catChartData = {
    labels: data?.distCategoria.map(d => d.categoria) || [],
    datasets: [
      {
        data: data?.distCategoria.map(d => d.quantidade) || [],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  const hguChartData = {
    labels: data?.distHgu.map(d => d.status) || [],
    datasets: [
      {
        data: data?.distHgu.map(d => d.quantidade) || [],
        backgroundColor: ['#22c55e', '#f59e0b', '#9ca3af', '#ef4444'],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  const formatMesAno = (mesAnoStr: string) => {
    const [year, month] = mesAnoStr.split('-')
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${meses[parseInt(month) - 1]}/${year.substring(2)}`
  }

  const crescimentoChartData = {
    labels: data?.crescimentoBase.map(d => formatMesAno(d.mesAno)) || [],
    datasets: [
      {
        label: 'Novas Adesões',
        data: data?.crescimentoBase.map(d => d.entradas) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 3,
    plugins: {
      legend: { position: 'right' as const },
      tooltip: { titleFont: { size: 13 }, bodyFont: { size: 13 } }
    }
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 3,
    scales: { 
      y: { beginAtZero: true, grid: { color: 'rgba(156, 163, 175, 0.2)' } },
      x: { grid: { display: false } }
    },
    plugins: {
      legend: { display: false },
      tooltip: { titleFont: { size: 13 }, bodyFont: { size: 13 } }
    }
  }

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Resumo */}
      <EIPReportContainer
        title="Painel de Associados"
        description="Acompanhamento da base ativa, adesões e ticket médio."
        reportId="painel-associados"
        onExportPDF={() => exportToPDF('painel-associados', 'Associados_Painel')}
        onExportExcel={() => exportToExcel(
          data?.distCategoria || [], 
          'Associados_Base'
        )}
        filters={
          <div className="flex flex-wrap items-center gap-4">
            <select 
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="hoje">Hoje</option>
              <option value="este_mes">Este Mês</option>
              <option value="ultimos_30">Últimos 30 Dias</option>
              <option value="este_ano">Este Ano</option>
              <option value="personalizado">Período Personalizado</option>
            </select>
            
            {dateRange === 'personalizado' && (
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <span className="text-gray-500">até</span>
                <input 
                  type="date" 
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            )}
          </div>
        }
      >
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Ativos</h3>
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.kpis.totalAtivos || 0}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Base atual mantenedora
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Novos no Período</h3>
                  <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    <UserPlus className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    +{data?.kpis.novosNoPeriodo || 0}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Adesões no intervalo filtrado
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ticket Médio</h3>
                  <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(data?.kpis.ticketMedio || 0)}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Mensalidade média da base
                  </p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Desligados Totais</h3>
                  <div className="p-2 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.kpis.totalInativos || 0}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Histórico total de inativos
                  </p>
                </div>
              </div>
            </div>

            {data && data.kpis.novosNoPeriodo > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 flex gap-4 mt-4">
                <div className="shrink-0 mt-1 text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">EIP Insights Automáticos</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200/80 mt-1">
                    Houve um ganho de {data.kpis.novosNoPeriodo} associados no período analisado. 
                    A categoria com mais membros ativos é "{data.distCategoria[0]?.categoria}".
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </EIPReportContainer>

      <hr className="border-gray-200 dark:border-gray-800" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EIPReportContainer
          title="Composição por Categoria"
          description="Distribuição dos associados ativos nas categorias cadastradas."
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="h-72 w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex justify-center">
              {data && data.distCategoria.length > 0 ? (
                <Doughnut data={catChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center text-gray-500">Sem dados de categorias.</div>
              )}
            </div>
          )}
        </EIPReportContainer>

        <EIPReportContainer
          title="Status do Plano de Saúde (HGU)"
          description="Penetração do benefício de saúde na base."
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="h-72 w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex justify-center">
              {data && data.distHgu.length > 0 ? (
                <Doughnut data={hguChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center text-gray-500">Sem dados de convênio.</div>
              )}
            </div>
          )}
        </EIPReportContainer>
      </div>

      <hr className="border-gray-200 dark:border-gray-800" />

      <EIPReportContainer
        title="Histórico de Adesões"
        description="Evolução mensal de novas matrículas nos últimos 6 meses."
      >
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="h-80 w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            {data && data.crescimentoBase.length > 0 ? (
              <Bar data={crescimentoChartData} options={barChartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">Sem adesões recentes.</div>
            )}
          </div>
        )}
      </EIPReportContainer>
    </div>
  )
}
