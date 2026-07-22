'use client'

import React, { useState, useEffect } from 'react'
import EIPReportContainer from '@/components/eip/EIPReportContainer'
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Sparkles, Loader2 } from 'lucide-react'
import { getEIPFinanceiroData, EIPFinanceiroData } from '@/app/actions/eip/financeiro'
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
  ArcElement,
  LineElement,
  PointElement
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
)




// EIP Global Chart Sharpness & Typography
ChartJS.defaults.font.family = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
ChartJS.defaults.font.size = 12;
ChartJS.defaults.font.weight = 500;
ChartJS.defaults.color = '#374151'; // Slate-700 for crisp contrast

export default function FinanceiroHub() {
  const { tenant } = useTenant()
  const [dateRange, setDateRange] = useState('este_mes')
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EIPFinanceiroData | null>(null)

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
          // Add timezone offset to avoid previous day issue
          start = new Date(start.getTime() + start.getTimezoneOffset() * 60000)
          end = new Date(end.getTime() + end.getTimezoneOffset() * 60000)
        }

        const res = await getEIPFinanceiroData(
          tenant.id, 
          start.toISOString(), 
          end.toISOString()
        )
        setData(res)
      } catch (err) {
        console.error("Erro ao buscar dados EIP", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tenant?.id, dateRange, customStartDate, customEndDate])

  if (!tenant) return null

  // Process data for charts
  const fluxoChartData = {
    labels: data?.fluxoCaixa.map(d => {
      const parts = d.data_ref.split('-')
      return `${parts[2]}/${parts[1]}`
    }) || [],
    datasets: [
      {
        label: 'Receitas',
        data: data?.fluxoCaixa.map(d => d.total_receita) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
      {
        label: 'Despesas',
        data: data?.fluxoCaixa.map(d => d.total_despesa) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      }
    ],
  }

  const catChartData = {
    labels: data?.receitasPorCategoria.map(d => d.nome_categoria) || [],
    datasets: [
      {
        data: data?.receitasPorCategoria.map(d => d.total_faturado) || [],
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  const fornecedorChartData = {
    labels: data?.despesasPorFornecedor.map(d => d.fornecedor) || [],
    datasets: [
      {
        data: data?.despesasPorFornecedor.map(d => d.total_gasto) || [],
        backgroundColor: [
          '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#14b8a6'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  const convenioChartData = {
    labels: data?.receitasPorConvenio.map(d => d.convenio) || [],
    datasets: [
      {
        label: 'Faturamento',
        data: data?.receitasPorConvenio.map(d => d.total_faturado) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const getTrend = (atual: number, anterior: number) => {
    if (!anterior) return { text: '+0%', isPositive: true }
    const diff = ((atual - anterior) / Math.abs(anterior)) * 100
    return {
      text: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`,
      isPositive: diff >= 0
    }
  }

  const recTrend = getTrend(data?.kpis.receitaAtual || 0, data?.kpis.receitaAnterior || 0)
  const despTrend = getTrend(data?.kpis.despesaAtual || 0, data?.kpis.despesaAnterior || 0)
  const resTrend = getTrend(data?.kpis.resultadoAtual || 0, data?.kpis.resultadoAnterior || 0)

  return (
    <div className="space-y-8 pb-10">
      {/* 1.1. Fluxo de Caixa Resumo */}
      <EIPReportContainer
        title="Painel Financeiro"
        description="Acompanhamento de DRE, fluxo de caixa e composição de receitas/despesas."
        reportId="painel-financeiro"
        onExportPDF={() => exportToPDF('painel-financeiro', 'Financeiro_Geral')}
        onExportExcel={() => exportToExcel(data?.fluxoCaixa || [], 'Fluxo_Caixa')}
        filters={
          <div className="flex flex-wrap items-center gap-4">
            <select 
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
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
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <span className="text-gray-500 dark:text-gray-400">até</span>
                <input 
                  type="date" 
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Receita Total</h3>
                  <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(data?.kpis.receitaAtual || 0)}
                  </p>
                  <p className={`text-sm mt-1 font-medium ${recTrend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {recTrend.text} em relação ao período anterior
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Despesa Total</h3>
                  <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(data?.kpis.despesaAtual || 0)}
                  </p>
                  <p className={`text-sm mt-1 font-medium ${!despTrend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {despTrend.text} em relação ao período anterior
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Resultado Líquido</h3>
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${Number(data?.kpis.resultadoAtual) >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(data?.kpis.resultadoAtual || 0)}
                  </p>
                  <p className={`text-sm mt-1 font-medium ${resTrend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {resTrend.text} em relação ao período anterior
                  </p>
                </div>
              </div>
            </div>

            {/* EIP Insight Automático */}
            {data && data.kpis.receitaAtual > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 flex gap-4">
                <div className="shrink-0 mt-1 text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">EIP Insights Automáticos</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200/80 mt-1">
                    {data.kpis.resultadoAtual >= 0 
                      ? `A operação gerou caixa positivo de ${formatCurrency(data.kpis.resultadoAtual)} neste período.` 
                      : `Atenção: A operação consumiu caixa neste período (${formatCurrency(Math.abs(data.kpis.resultadoAtual))}).`}
                    {' '}A categoria que mais gerou receita foi "{data.receitasPorCategoria[0]?.nome_categoria || 'N/A'}" com {formatCurrency(data.receitasPorCategoria[0]?.total_faturado || 0)}.
                  </p>
                </div>
              </div>
            )}

            {/* Gráfico Fluxo */}
            <div className="h-72 w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <Bar 
                data={fluxoChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
    devicePixelRatio: 3,
                  plugins: {
                    legend: { labels: { font: { weight: 'bold' } } },
                    tooltip: {
                      titleFont: { size: 13 },
                      bodyFont: { size: 13 }
                    }
                  },
                  scales: { 
                    y: { 
                      beginAtZero: true,
                      grid: { color: 'rgba(156, 163, 175, 0.2)' }
                    },
                    x: {
                      grid: { display: false }
                    }
                  }
                }} 
              />
            </div>
          </>
        )}
      </EIPReportContainer>

      <hr className="border-gray-200 dark:border-gray-800" />

      {/* 1.2. Receitas por Categoria */}
      <EIPReportContainer
        title="Receitas por Categoria"
        description="Detalhamento da origem das receitas por grupo de serviços."
      >
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="h-72 w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex justify-center">
            {data && data.receitasPorCategoria.length > 0 ? (
              <Doughnut 
                data={catChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
    devicePixelRatio: 3,
                  plugins: { 
                    legend: { 
                      position: 'right'
                    },
                    tooltip: {
                      titleFont: { size: 13 },
                      bodyFont: { weight: 'bold', size: 13 }
                    }
                  }
                }} 
              />
            ) : (
              <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
                Nenhuma receita registrada no período.
              </div>
            )}
          </div>
        )}
      </EIPReportContainer>

      <hr className="border-gray-200 dark:border-gray-800" />

      {/* 1.3. Fornecedores e Convênios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EIPReportContainer
          title="Despesas por Fornecedor (Top 7)"
          description="Concentração de gastos nos maiores fornecedores."
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="h-72 w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex justify-center">
              {data && data.despesasPorFornecedor.length > 0 ? (
                <Doughnut 
                  data={fornecedorChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
    devicePixelRatio: 3,
                    plugins: { 
                      legend: { position: 'right' },
                      tooltip: { titleFont: { size: 13 }, bodyFont: { size: 13 } }
                    }
                  }} 
                />
              ) : (
                <div className="flex items-center justify-center text-gray-500">Sem despesas registradas.</div>
              )}
            </div>
          )}
        </EIPReportContainer>

        <EIPReportContainer
          title="Receitas por Convênio (Top 5)"
          description="Faturamento consolidado por parceiro/plano."
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="h-72 w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex justify-center">
              {data && data.receitasPorConvenio.length > 0 ? (
                <Bar 
                  data={convenioChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
    devicePixelRatio: 3,
                    indexAxis: 'y', // Barras horizontais
                    plugins: { 
                      legend: { display: false },
                      tooltip: { titleFont: { size: 13 }, bodyFont: { size: 13 } }
                    },
                    scales: { 
                      x: { beginAtZero: true, grid: { color: 'rgba(156, 163, 175, 0.2)' } },
                      y: { grid: { display: false } }
                    }
                  }} 
                />
              ) : (
                <div className="flex items-center justify-center text-gray-500">Sem receitas registradas.</div>
              )}
            </div>
          )}
        </EIPReportContainer>
      </div>

      <hr className="border-gray-200 dark:border-gray-800" />

      {/* 1.4. DRE Gerencial */}
      <EIPReportContainer
        title="DRE Gerencial"
        description="Demonstrativo do Resultado do Exercício simplificado."
      >
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Linha do DRE</th>
                  <th className="px-6 py-4 text-right">Valor Consolidado</th>
                </tr>
              </thead>
              <tbody>
                {data?.dre.map((item, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-b dark:border-gray-800 ${item.destaque ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-900'} hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors`}
                  >
                    <td className={`px-6 py-4 whitespace-nowrap ${item.destaque ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                      {item.linha}
                    </td>
                    <td className={`px-6 py-4 text-right ${item.destaque ? 'font-bold text-gray-900 dark:text-white' : ''} ${item.tipo === 'resultado' && item.valor < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                      {formatCurrency(item.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </EIPReportContainer>
    </div>
  )
}
