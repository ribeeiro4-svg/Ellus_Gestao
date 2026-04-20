import React from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import ChartCard from '@/components/ui/ChartCard'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend)

import { fmtR, MESES, fmtPct } from '@/lib/utils/formatters'

interface DashboardChartsProps {
  metrics: any
  onChartClick: (config: any) => void
}

export default function DashboardCharts({ metrics, onChartClick }: DashboardChartsProps) {
  const { recReal, recProv, despReal, despProv, resultadoData, associadosStats } = metrics
  const { ativos, inadimplentes, inativos } = associadosStats

  const chartConfigs: any = {
    receita: {
      title: 'Fluxo Mensal Consolidado',
      subtitle: 'Comparativo de Entradas e Saídas — Realizado vs Projetado',
      chartType: 'bar',
      insights: [
        { label: 'Receita Realizada', value: fmtR(recReal.reduce((a: number, b: number) => a + b, 0)), color: 'var(--green)', sub: 'acumulado pago' },
        { label: 'Receita Provisionada', value: fmtR(recProv.reduce((a: number, b: number) => a + b, 0)), color: 'rgba(45, 140, 111, 0.4)', sub: 'a receber' },
        { label: 'Resultado Líquido', value: fmtR(resultadoData.reduce((a: number, b: number) => a + b, 0)), color: 'var(--green)', sub: 'saldo final' },
      ],
      chartData: {
        labels: MESES,
        datasets: [
          { label: 'Receita (Paga)', data: recReal, backgroundColor: 'rgba(45, 140, 111, 0.85)', borderRadius: 5, stack: 'receita' },
          { label: 'Receita (Aberta)', data: recProv, backgroundColor: 'rgba(45, 140, 111, 0.25)', borderRadius: 5, stack: 'receita' },
          { label: 'Despesa (Paga)', data: despReal, backgroundColor: 'rgba(239, 68, 68, 0.8)', borderRadius: 5, stack: 'despesa' },
          { label: 'Despesa (Aberta)', data: despProv, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 5, stack: 'despesa' },
          { label: 'Resultado', data: resultadoData, type: 'line', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4, fill: true, borderWidth: 2.5, pointRadius: 4 },
        ]
      },
      tableData: {
        headers: ['Mês', 'Rec. Real', 'Rec. Prov', 'Desp. Real', 'Desp. Prov'],
        rows: MESES.map((m: any, i: any) => [m, fmtR(recReal[i]), fmtR(recProv[i]), fmtR(despReal[i]), fmtR(despProv[i])])
      }
    },
    associados: {
      title: 'Composição da Carteira',
      subtitle: 'Distribuição proporcional por status',
      chartType: 'doughnut',
      insights: [
        { label: 'Total', value: ativos + inadimplentes + inativos, color: 'var(--accent)', sub: 'associados' },
        { label: 'Ativos', value: ativos, color: 'var(--green)', sub: 'adimplentes' },
        { label: 'Inadimplentes', value: inadimplentes, color: 'var(--red)', sub: 'necessitam ação' },
      ],
      chartData: {
        labels: [`Ativos (${ativos})`, `Inadimplentes (${inadimplentes})`, `Inativos (${inativos})`],
        datasets: [{
          data: [ativos, inadimplentes, inativos],
          backgroundColor: ['#10b981', '#ef4444', '#9ca3af'],
          hoverOffset: 10,
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      tableData: {
        headers: ['Status', 'Qtd', '%'],
        rows: [
          ['Ativo', ativos, fmtPct((ativos / ((ativos + inadimplentes + inativos) || 1)) * 100)],
          ['Inadimplente', inadimplentes, fmtPct((inadimplentes / ((ativos + inadimplentes + inativos) || 1)) * 100)],
          ['Inativo', inativos, fmtPct((inativos / ((ativos + inadimplentes + inativos) || 1)) * 100)],
        ]
      }
    }
  }

  return (
    <div className="charts-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2">
        <ChartCard title="Evolução Financeira" subtitle="Receita vs Despesa" onClick={() => onChartClick(chartConfigs.receita)}>
          <div className="h-[300px] mt-4">
            <Bar data={chartConfigs.receita.chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 10 }, callback: (v) => 'R$ ' + Math.round(Number(v) / 1000) + 'k' } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } } }} />
          </div>
        </ChartCard>
      </div>
      <div>
        <ChartCard title="Status Carteira" subtitle="Associados" onClick={() => onChartClick(chartConfigs.associados)}>
          <div className="h-[300px] mt-4">
            <Doughnut data={chartConfigs.associados.chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 20 } } }, cutout: '70%' }} />
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
