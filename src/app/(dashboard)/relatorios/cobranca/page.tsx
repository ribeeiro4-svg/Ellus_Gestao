'use client'

import React, { useState, useEffect } from 'react'
import EIPReportContainer from '@/components/eip/EIPReportContainer'
import { AlertCircle, UserX, AlertTriangle, Sparkles, Loader2 } from 'lucide-react'
import { getEIPCobrancaData, EIPCobrancaData } from '@/app/actions/eip/cobranca'
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

export default function CobrancaHub() {
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EIPCobrancaData | null>(null)

  useEffect(() => {
    if (!tenant?.id) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await getEIPCobrancaData(tenant.id)
        setData(res)
      } catch (err) {
        console.error("Erro ao buscar dados de cobrança", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tenant?.id])

  if (!tenant) return null

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  // Chart Data
  const faixasChartData = {
    labels: data?.faixasAtraso.map(f => f.faixa) || [],
    datasets: [
      {
        label: 'Valor Atrasado (R$)',
        data: data?.faixasAtraso.map(f => f.valor) || [],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)', // Amarelo (0-30)
          'rgba(249, 115, 22, 0.8)', // Laranja (31-60)
          'rgba(239, 68, 68, 0.8)',  // Vermelho (61-90)
          'rgba(153, 27, 27, 0.8)'   // Vinho (>90)
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 3,
    plugins: {
      legend: { position: 'right' as const },
      tooltip: { titleFont: { size: 13 }, bodyFont: { weight: 'bold' as const, size: 13 } }
    }
  }

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Inadimplência Resumo */}
      <EIPReportContainer
        title="Painel de Inadimplência"
        description="Acompanhamento da carteira de devedores e performance de recuperação."
        reportId="painel-cobranca"
        onExportPDF={() => exportToPDF('painel-cobranca', 'Cobranca_Inadimplencia')}
        onExportExcel={() => exportToExcel(data?.topDevedores || [], 'Devedores')}
      >
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total em Atraso</h3>
                  <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(data?.kpis.totalAtrasado || 0)}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Referente a {data?.kpis.qtdeAtrasados} recebíveis vencidos
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Maior Dívida Única</h3>
                  <div className="p-2 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(data?.kpis.maiorAtraso || 0)}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Maior título inadimplente da base
                  </p>
                </div>
              </div>
            </div>

            {data && data.kpis.totalAtrasado > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl p-4 flex gap-4 mt-4">
                <div className="shrink-0 mt-1 text-orange-600 dark:text-orange-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-300">EIP Insights Automáticos</h4>
                  <p className="text-sm text-orange-800 dark:text-orange-200/80 mt-1">
                    Atualmente existe um passivo descoberto de {formatCurrency(data.kpis.totalAtrasado)}. 
                    {data.faixasAtraso.find(f => f.faixa === 'Mais de 90 dias')?.valor! > 0 
                      ? ' Existe um volume considerável em atraso superior a 90 dias, sugerindo necessidade de ação de negativação ou acordo.'
                      : ' A maioria das dívidas está em fase inicial, ideal para envio de lembretes.'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </EIPReportContainer>

      <hr className="border-gray-200 dark:border-gray-800" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Faixas de Atraso (Gráfico) */}
        <EIPReportContainer
          title="Aging (Faixas de Atraso)"
          description="Distribuição do valor em atraso por idade da dívida."
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="h-72 w-full bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex justify-center">
              {data && data.kpis.totalAtrasado > 0 ? (
                <Doughnut data={faixasChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Nenhum atraso registrado.
                </div>
              )}
            </div>
          )}
        </EIPReportContainer>

        {/* Top Devedores (Tabela) */}
        <EIPReportContainer
          title="Top 10 Devedores"
          description="Maiores ofensores da carteira de inadimplência."
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
                    <th className="px-4 py-3">Descrição / Cliente</th>
                    <th className="px-4 py-3 text-right">Valor em Atraso</th>
                    <th className="px-4 py-3 text-right">Dias de Atraso</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.topDevedores.map((dev, idx) => (
                    <tr key={idx} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {dev.descricao}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(dev.valor)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {dev.diasAtraso} dias
                      </td>
                    </tr>
                  ))}
                  {(!data?.topDevedores || data.topDevedores.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        Nenhum devedor encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </EIPReportContainer>
      </div>
    </div>
  )
}
