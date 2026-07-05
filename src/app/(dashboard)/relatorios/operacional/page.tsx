'use client'

import React, { useState, useEffect } from 'react'
import EIPReportContainer from '@/components/eip/EIPReportContainer'
import { Briefcase, CheckCircle, Clock, AlertOctagon, Sparkles, Loader2 } from 'lucide-react'
import { getEIPOperacionalData, EIPOperacionalData } from '@/app/actions/eip/operacional'
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

export default function OperacionalHub() {
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EIPOperacionalData | null>(null)

  useEffect(() => {
    if (!tenant?.id) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await getEIPOperacionalData(tenant.id)
        setData(res)
      } catch (err) {
        console.error("Erro ao buscar dados EIP Operacional", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tenant?.id])

  if (!tenant) return null

  // Chart Data
  const statusChartData = {
    labels: data?.projetosStatus.map(d => d.status) || [],
    datasets: [
      {
        data: data?.projetosStatus.map(d => d.quantidade) || [],
        backgroundColor: [
          '#3b82f6', // Azul (Em andamento)
          '#22c55e', // Verde (Concluido)
          '#ef4444', // Vermelho (Atrasado)
          '#9ca3af'  // Cinza (Outros)
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  const respChartData = {
    labels: data?.projetosPorResponsavel.map(d => d.responsavel) || [],
    datasets: [
      {
        label: 'Projetos Alocados',
        data: data?.projetosPorResponsavel.map(d => d.quantidade) || [],
        backgroundColor: 'rgba(236, 72, 153, 0.8)',
        borderColor: 'rgb(236, 72, 153)',
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
      x: { beginAtZero: true, grid: { color: 'rgba(156, 163, 175, 0.2)' }, ticks: { stepSize: 1 } },
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
        title="Painel Operacional"
        description="Acompanhamento de alocação de equipe e velocidade de entrega de projetos."
        reportId="painel-operacional"
        onExportPDF={() => exportToPDF('painel-operacional', 'Operacional_Entregas')}
        onExportExcel={() => exportToExcel(data?.projetosPorResponsavel || [], 'Projetos_Equipe')}
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
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Projetos</h3>
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.kpis.totalProjetos || 0}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Demandas na base
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Concluídos</h3>
                  <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.kpis.concluidos || 0}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Projetos entregues
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Em Andamento</h3>
                  <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.kpis.emAndamento || 0}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Projetos ativos
                  </p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Atrasados</h3>
                  <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.kpis.atrasados || 0}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Passaram do prazo
                  </p>
                </div>
              </div>
            </div>

            {data && data.kpis.atrasados > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 flex gap-4 mt-4">
                <div className="shrink-0 mt-1 text-red-600 dark:text-red-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-red-900 dark:text-red-300">Atenção Operacional</h4>
                  <p className="text-sm text-red-800 dark:text-red-200/80 mt-1">
                    Existem {data.kpis.atrasados} projetos com o prazo vencido. É recomendável uma reunião de alinhamento com a equipe de {data.projetosPorResponsavel[0]?.responsavel} (maior alocação) para readequar cronogramas.
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
          title="Status do Portfólio"
          description="Distribuição do status geral de todos os projetos."
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="h-72 w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex justify-center">
              {data && data.projetosStatus.length > 0 ? (
                <Doughnut data={statusChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center text-gray-500">Nenhum projeto cadastrado.</div>
              )}
            </div>
          )}
        </EIPReportContainer>

        <EIPReportContainer
          title="Alocação por Responsável"
          description="Quantidade de projetos atribuídos a cada membro/equipe."
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="h-72 w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex justify-center">
              {data && data.projetosPorResponsavel.length > 0 ? (
                <Bar data={respChartData} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center text-gray-500">Sem responsáveis definidos.</div>
              )}
            </div>
          )}
        </EIPReportContainer>
      </div>
    </div>
  )
}
