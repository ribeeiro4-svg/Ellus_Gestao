'use client'

import React, { useState, useEffect } from 'react'
import EIPReportContainer from '@/components/eip/EIPReportContainer'
import { Target, Trophy, Clock, Sparkles, Loader2, PlayCircle } from 'lucide-react'
import { getEIPMetasData, EIPMetasData } from '@/app/actions/eip/metas'
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
import { Bar, Doughnut } from 'react-chartjs-2'

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

export default function MetasHub() {
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EIPMetasData | null>(null)

  useEffect(() => {
    if (!tenant?.id) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await getEIPMetasData(tenant.id)
        setData(res)
      } catch (err) {
        console.error("Erro ao buscar dados EIP Metas", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tenant?.id])

  if (!tenant) return null

  // Chart Data
  const statusChartData = {
    labels: ['Atingidas', 'Em Andamento', 'Não Iniciadas'],
    datasets: [
      {
        data: [
          data?.kpis.metasAtingidas || 0,
          data?.kpis.emAndamento || 0,
          data?.kpis.naoIniciadas || 0
        ],
        backgroundColor: ['#22c55e', '#3b82f6', '#9ca3af'],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  const depChartData = {
    labels: data?.progressoPorDepartamento.map(d => d.departamento) || [],
    datasets: [
      {
        label: 'Atingimento (%)',
        data: data?.progressoPorDepartamento.map(d => d.atingimento_percentual) || [],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
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
    indexAxis: 'y' as const,
    scales: { 
      x: { beginAtZero: true, max: 100, grid: { color: 'rgba(156, 163, 175, 0.2)' } },
      y: { grid: { display: false } }
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
        title="Painel de Metas & OKRs"
        description="Acompanhamento do atingimento de objetivos corporativos por departamento."
        reportId="painel-metas"
        onExportPDF={() => exportToPDF('painel-metas', 'Metas_OKRs')}
        onExportExcel={() => exportToExcel(data?.metasTop || [], 'Quadro_Metas')}
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
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Metas</h3>
                  <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.kpis.totalMetas || 0}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Objetivos cadastrados
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Metas Atingidas</h3>
                  <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    <Trophy className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.kpis.metasAtingidas || 0}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Objetivos já alcançados
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Em Andamento</h3>
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <PlayCircle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.kpis.emAndamento || 0}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Em execução atual
                  </p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Não Iniciadas</h3>
                  <div className="p-2 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.kpis.naoIniciadas || 0}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Aguardando início
                  </p>
                </div>
              </div>
            </div>

            {data && data.kpis.totalMetas > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-4 flex gap-4 mt-4">
                <div className="shrink-0 mt-1 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">EIP Insights Automáticos</h4>
                  <p className="text-sm text-indigo-800 dark:text-indigo-200/80 mt-1">
                    Você possui {(data.kpis.metasAtingidas / data.kpis.totalMetas * 100).toFixed(0)}% das metas globais atingidas.
                    Foque nas metas de {data.progressoPorDepartamento[data.progressoPorDepartamento.length - 1]?.departamento || 'alguns responsáveis'} que estão com o menor percentual de atingimento.
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
          title="Status Geral das Metas"
          description="Distribuição do status atual de todos os OKRs."
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="h-72 w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex justify-center">
              {data && data.kpis.totalMetas > 0 ? (
                <Doughnut data={statusChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center text-gray-500">Nenhuma meta cadastrada.</div>
              )}
            </div>
          )}
        </EIPReportContainer>

        <EIPReportContainer
          title="Progresso por Responsável"
          description="Atingimento médio (%) das metas agrupadas por responsável."
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="h-72 w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex justify-center">
              {data && data.progressoPorDepartamento.length > 0 ? (
                <Bar data={depChartData} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center text-gray-500">Sem metas para exibir.</div>
              )}
            </div>
          )}
        </EIPReportContainer>
      </div>

      <hr className="border-gray-200 dark:border-gray-800" />

      <EIPReportContainer
        title="Quadro de Metas e OKRs"
        description="Acompanhamento detalhado do progresso individual."
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
                  <th className="px-6 py-4">Meta / OKR</th>
                  <th className="px-6 py-4">Responsável</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {data?.metasTop.map((item, idx) => (
                  <tr key={idx} className="border-b dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {item.nome}
                    </td>
                    <td className="px-6 py-4">
                      {item.responsavel}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === 'atingida' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        item.status === 'em_andamento' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">{item.progresso.toFixed(0)}%</span>
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${item.progresso >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${Math.min(item.progresso, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.metasTop || data.metasTop.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma meta cadastrada no sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </EIPReportContainer>
    </div>
  )
}
