'use client'

import React, { useEffect, useState } from 'react'
import { TrendingUp, Activity, BarChart3, AlertTriangle } from 'lucide-react'
import EIPReportContainer from '@/components/eip/EIPReportContainer'
import { Card } from '@/components/ui/card'
import { Line } from 'react-chartjs-2'
import { getEIPEstrategicoData, EIPEstrategicoData } from '@/app/actions/eip/estrategico'
import { exportToPDF, exportToExcel } from '@/lib/exportUtils'
import { useTenant } from '@/lib/hooks/useTenant'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function EstrategicoPage() {
  const { tenant } = useTenant()
  const [data, setData] = useState<EIPEstrategicoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [ano, setAno] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    async function loadData() {
      if (!tenant) return
      setLoading(true)
      try {
        const result = await getEIPEstrategicoData(tenant.id, ano)
        setData(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [tenant, ano])

  if (!tenant || loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const YoY = data?.kpis.faturamentoAnual && data?.kpis.faturamentoAnterior
    ? ((data.kpis.faturamentoAnual - data.kpis.faturamentoAnterior) / data.kpis.faturamentoAnterior) * 100
    : 0;

  const tendenciaChartData = {
    labels: data?.tendenciaAnual.map(d => d.mes) || [],
    datasets: [
      {
        label: 'Receita',
        data: data?.tendenciaAnual.map(d => d.receita) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Despesa',
        data: data?.tendenciaAnual.map(d => d.despesa) || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        borderDash: [5, 5],
        fill: false,
      }
    ],
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 3,
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(156, 163, 175, 0.2)' } },
      x: { grid: { display: false } }
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <EIPReportContainer
        title="Painel Estratégico (C-Level)"
        description="Acompanhamento macro do negócio, saúde financeira de longo prazo e Runway."
        reportId="painel-estrategico"
        onExportPDF={() => exportToPDF('painel-estrategico', `Estrategico_${ano}`)}
        onExportExcel={() => exportToExcel(data?.tendenciaAnual || [], `Tendencia_${ano}`)}
        filters={
          <div className="flex flex-wrap items-center gap-4">
            <select 
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            >
              <option value={new Date().getFullYear()}>Este Ano ({new Date().getFullYear()})</option>
              <option value={new Date().getFullYear() - 1}>Ano Anterior ({new Date().getFullYear() - 1})</option>
            </select>
          </div>
        }
      >
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex flex-col justify-between bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Faturamento Anual</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  R$ {((data?.kpis.faturamentoAnual || 0)/1000).toFixed(1)}k
                </h3>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`font-medium ${YoY >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {YoY >= 0 ? '+' : ''}{YoY.toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-2">vs Ano Anterior</span>
            </div>
          </Card>

          <Card className="p-5 flex flex-col justify-between bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Margem de Lucro</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {(data?.kpis.margemLucro || 0).toFixed(1)}%
                </h3>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">Lucro Operacional Estimado</div>
          </Card>

          <Card className="p-5 flex flex-col justify-between bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Runway (Sobrevivência)</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {(data?.kpis.runwayMeses || 0).toFixed(1)} Meses
                </h3>
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">Caixa vs Queima Mensal</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Tendência */}
          <Card className="lg:col-span-2 p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tendência Receita vs Despesa</h3>
            <div className="h-72 w-full">
              <Line data={tendenciaChartData} options={lineChartOptions} />
            </div>
          </Card>

          {/* Projetos Estratégicos */}
          <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Projetos Chave</h3>
            <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
              {data?.projetosEstrategicos.map((proj, idx) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-tight pr-2">{proj.nome}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap
                      ${proj.status === 'Em Dia' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        proj.status === 'Atenção' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progresso</span>
                      <span>{proj.progresso}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${proj.status === 'Em Dia' ? 'bg-emerald-500' : proj.status === 'Atenção' ? 'bg-amber-500' : 'bg-red-500'}`} 
                        style={{ width: `${proj.progresso}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </EIPReportContainer>
    </div>
  )
}
