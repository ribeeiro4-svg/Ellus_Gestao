'use client'

import React, { useState, useEffect } from 'react'
import EIPReportContainer from '@/components/eip/EIPReportContainer'
import { ShieldCheck, FileSignature, AlertTriangle, Fingerprint, Sparkles, Loader2 } from 'lucide-react'
import { getEIPGovernancaData, EIPGovernancaData } from '@/app/actions/eip/governanca'
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
import { Doughnut, Line, Bar } from 'react-chartjs-2'

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

export default function GovernancaHub() {
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EIPGovernancaData | null>(null)

  useEffect(() => {
    if (!tenant?.id) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await getEIPGovernancaData(tenant.id)
        setData(res)
      } catch (err) {
        console.error("Erro ao buscar dados EIP Governança", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tenant?.id])

  if (!tenant) return null

  // Chart Data
  const complianceChartData = {
    labels: ['Conforme (Assinados)', 'Pendentes'],
    datasets: [
      {
        data: [
          data?.kpis.termosAssinados || 0,
          data?.kpis.pendenciasAssinatura || 0
        ],
        backgroundColor: ['#10b981', '#f43f5e'],
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

  const evolucaoChartData = {
    labels: data?.complianceAoLongoDoTempo.map(d => formatMesAno(d.mesAno)) || [],
    datasets: [
      {
        label: 'Termos Assinados',
        data: data?.complianceAoLongoDoTempo.map(d => d.assinados) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
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

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Resumo */}
      <EIPReportContainer
        title="Painel de Governança & Auditoria"
        description="Monitoramento de compliance documental e trilha de eventos do sistema."
        reportId="painel-governanca"
        onExportPDF={() => exportToPDF('painel-governanca', 'Governanca_Compliance')}
        onExportExcel={() => exportToExcel(data?.auditoriaSimulada || [], 'Trilha_Auditoria')}
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
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Compliance Rate</h3>
                  <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.kpis.taxaCompliance.toFixed(1) || 0}%
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Termos legais assinados
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Docs. Assinados</h3>
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <FileSignature className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.kpis.termosAssinados || 0}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Assinaturas ZapSign/Validadas
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendências Legais</h3>
                  <div className="p-2 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.kpis.pendenciasAssinatura || 0}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Aguardando assinatura
                  </p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Alertas de Auditoria</h3>
                  <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.kpis.alertasCriticos || 0}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Eventos críticos no log
                  </p>
                </div>
              </div>
            </div>

            {data && data.kpis.taxaCompliance < 90 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl p-4 flex gap-4 mt-4">
                <div className="shrink-0 mt-1 text-orange-600 dark:text-orange-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-300">Risco de Compliance</h4>
                  <p className="text-sm text-orange-800 dark:text-orange-200/80 mt-1">
                    A taxa de compliance atual é de {data.kpis.taxaCompliance.toFixed(1)}%. O ideal exigido por normas de governança corporativa é superior a 95%. Foque em resolver as {data.kpis.pendenciasAssinatura} pendências de assinatura de termos.
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
          title="Taxa de Conformidade (Documentação)"
          description="Proporção de associados com termo validado."
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="h-72 w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex justify-center">
              {data && (data.kpis.termosAssinados > 0 || data.kpis.pendenciasAssinatura > 0) ? (
                <Doughnut data={complianceChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center text-gray-500">Sem dados de compliance.</div>
              )}
            </div>
          )}
        </EIPReportContainer>

        <EIPReportContainer
          title="Histórico de Regularização"
          description="Volume de assinaturas e regularizações mensais."
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="h-72 w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex justify-center">
              {data && data.complianceAoLongoDoTempo.length > 0 ? (
                <Bar data={evolucaoChartData} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center text-gray-500">Sem histórico de assinaturas.</div>
              )}
            </div>
          )}
        </EIPReportContainer>
      </div>

      <hr className="border-gray-200 dark:border-gray-800" />

      <EIPReportContainer
        title="Trilha de Auditoria (Logs Críticos)"
        description="Últimos eventos sensíveis de sistema."
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
                  <th className="px-6 py-4">Evento Registrado</th>
                  <th className="px-6 py-4">Data / Hora</th>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Risco</th>
                </tr>
              </thead>
              <tbody>
                {data?.auditoriaSimulada.map((item, idx) => (
                  <tr key={idx} className="border-b dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {item.evento}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(item.data)}
                    </td>
                    <td className="px-6 py-4">
                      {item.usuario}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.severidade === 'alta' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        item.severidade === 'media' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {item.severidade.toUpperCase()}
                      </span>
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
