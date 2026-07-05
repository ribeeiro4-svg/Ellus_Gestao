'use client'

import React, { useEffect, useState } from 'react'
import { ShieldAlert, ShieldCheck, Zap, AlertCircle } from 'lucide-react'
import EIPReportContainer from '@/components/eip/EIPReportContainer'
import { Card } from '@/components/ui/card'
import { Bubble } from 'react-chartjs-2'
import { getEIPInteligenciaData, EIPInteligenciaData } from '@/app/actions/eip/inteligencia'
import { exportToPDF, exportToExcel } from '@/lib/exportUtils'
import { useTenant } from '@/lib/hooks/useTenant'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  LinearScale,
  PointElement,
  Tooltip,
  Legend
)

export default function InteligenciaPage() {
  const { tenant } = useTenant()
  const [data, setData] = useState<EIPInteligenciaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!tenant) return
      setLoading(true)
      try {
        const result = await getEIPInteligenciaData(tenant.id)
        setData(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [tenant])

  if (!tenant || loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const matrizData = {
    datasets: data?.matrizRisco.map(r => ({
      label: r.nome,
      data: [{ x: r.impacto, y: r.probabilidade, r: 15 }],
      backgroundColor: r.cor,
      borderColor: 'white',
      borderWidth: 2
    })) || []
  }

  const bubbleOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 3,
    plugins: {
      legend: { position: 'right' as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: Impacto ${ctx.raw.x}, Probabilidade ${ctx.raw.y}`
        }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Impacto (1 a 5)' }, min: 0, max: 6 },
      y: { title: { display: true, text: 'Probabilidade (1 a 5)' }, min: 0, max: 6 }
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <EIPReportContainer
        title="Painel de Inteligência & Riscos"
        description="Monitoramento proativo de ameaças, matriz de risco e insights gerados."
        reportId="painel-inteligencia"
        onExportPDF={() => exportToPDF('painel-inteligencia', 'Inteligencia_Riscos')}
        onExportExcel={() => exportToExcel(data?.riscos || [], 'Riscos_Identificados')}
      >
        {/* Score & Resumo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
            {data && data.scoreGeral >= 70 ? (
              <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <ShieldCheck className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                <ShieldAlert className="w-12 h-12 text-amber-600 dark:text-amber-400" />
              </div>
            )}
            <h3 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{data?.scoreGeral}</h3>
            <p className="text-gray-500 font-medium mt-1">Health Score Operacional</p>
          </Card>

          <Card className="lg:col-span-2 p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Insights Automáticos</h3>
            </div>
            <div className="space-y-3">
              {data?.riscos.map((risco, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${risco.nivel === 'Alto' ? 'text-red-500' : risco.nivel === 'Médio' ? 'text-amber-500' : 'text-blue-500'}`} />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{risco.descricao}</h4>
                    <p className="text-sm text-gray-500">
                      Risco {risco.nivel} • Impacto Potencial: {risco.impactoEstimado > 0 ? `R$ ${(risco.impactoEstimado).toLocaleString('pt-BR')}` : 'Indireto'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Matriz de Risco (Bubble Chart) */}
        <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Matriz de Risco (Probabilidade x Impacto)</h3>
          <div className="h-80 w-full">
            <Bubble data={matrizData} options={bubbleOptions} />
          </div>
        </Card>
      </EIPReportContainer>
    </div>
  )
}
