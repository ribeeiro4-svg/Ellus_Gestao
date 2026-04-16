'use client'
import React, { useState } from 'react'
import { 
  DollarSign, 
  Users, 
  Briefcase, 
  Activity,
  Calendar
} from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import ChartModal from '@/components/ui/ChartModal'
import SplashScreen from '@/components/ui/SplashScreen'
import { fmtR, MESES } from '@/lib/utils/formatters'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function DashboardPage() {
  const [activeChart, setActiveChart] = useState<any>(null)

  const labels = MESES
  const receitaData = [32000, 35000, 38000, 31000, 42000, 45000, 48000, 41000, 43000, 49000, 52000, 42500]
  const despesaData = [28000, 26000, 30000, 32000, 31000, 29000, 33000, 35000, 32000, 34000, 36000, 34000]
  const resultadoData = receitaData.map((v, i) => v - despesaData[i])

  const chartConfigs: any = {
    receita: {
      title: 'Receita × Despesa × Resultado Mensal',
      subtitle: 'Visão completa do ano — ACPROBEC · INOVACONT',
      chartType: 'bar',
      insights: [
        { label: 'Melhor Mês', value: 'Novembro', color: 'var(--green)', sub: 'R$ 52.000 em receita' },
        { label: 'Receita Total', value: fmtR(receitaData.reduce((a, b) => a + b, 0)), color: 'var(--green)', sub: 'acumulado no ano' },
        { label: 'Despesa Total', value: fmtR(despesaData.reduce((a, b) => a + b, 0)), color: 'var(--red)', sub: 'acumulado no ano' },
        { label: 'Resultado Líquido', value: fmtR(receitaData.reduce((a, b) => a + b, 0) - despesaData.reduce((a, b) => a + b, 0)), color: 'var(--green)', sub: 'margem positiva' },
      ],
      chartData: {
        labels,
        datasets: [
          { label: 'Receita', data: receitaData, backgroundColor: 'rgba(45, 140, 111, 0.75)', borderRadius: 5 },
          { label: 'Despesa', data: despesaData, backgroundColor: 'rgba(239, 68, 68, 0.65)', borderRadius: 5 },
          { label: 'Resultado', data: resultadoData, type: 'line', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4, fill: true, borderWidth: 2.5, pointRadius: 4 },
        ]
      },
      tableData: {
        headers: ['Mês', 'Receita', 'Despesa', 'Resultado'],
        rows: MESES.map((m, i) => [m, fmtR(receitaData[i]), fmtR(despesaData[i]), fmtR(resultadoData[i])])
      }
    },
    associados: {
      title: 'Situação dos Associados — ACPROBEC',
      subtitle: 'Distribuição por status atual da carteira',
      chartType: 'doughnut',
      insights: [
        { label: 'Total', value: '1,240', color: 'var(--accent)', sub: 'associados cadastrados' },
        { label: 'Ativos', value: '1,120', color: 'var(--green)', sub: '90% da carteira' },
        { label: 'Inadimplentes', value: '85', color: 'var(--red)', sub: 'precisam de cobrança' },
        { label: 'Inativos', value: '35', color: '#9ca3af', sub: 'desligados' },
      ],
      chartData: {
        labels: ['Ativos', 'Inadimplentes', 'Inativos'],
        datasets: [{
          data: [1120, 85, 35],
          backgroundColor: ['#10b981', '#ef4444', '#9ca3af'],
          hoverOffset: 10,
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      tableData: {
        headers: ['Status', 'Qtd', '%'],
        rows: [
          ['Ativo', 1120, '90%'],
          ['Inadimplente', 85, '7%'],
          ['Inativo', 35, '3%'],
        ]
      }
    }
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="page-header">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900 tracking-tight">Dashboard Executivo</h1>
          <p className="page-subtitle text-xs text-gray-500 mt-1 font-medium">Bem-vindo(a), acompanhe o desempenho geral em tempo real.</p>
        </div>
      </div>

      <div className="kpi-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Receita Mensal" value={fmtR(42500)} trend={12} trendLabel="vs mês ant." icon={<DollarSign size={20} />} category="success" />
        <KpiCard title="Associados Ativos" value="1,240" trend={5.2} trendLabel="novos este mês" icon={<Users size={20} />} category="info" />
        <KpiCard title="Inadimplência" value="4.8%" trend={-1.5} trendLabel="redução" icon={<Activity size={20} />} category="error" />
        <KpiCard title="Metas Batidas" value="8/12" trendLabel="no período" icon={<Briefcase size={20} />} category="purple" />
      </div>

      <div className="charts-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ChartCard 
            title="Evolução Financeira" 
            subtitle="Receita vs Despesa"
            onClick={() => setActiveChart(chartConfigs.receita)}
          >
            <div className="h-[300px] mt-4">
              <Bar 
                data={chartConfigs.receita.chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                  }
                }}
              />
            </div>
          </ChartCard>
        </div>

        <div>
          <ChartCard 
            title="Status Cartéira" 
            subtitle="Associados"
            onClick={() => setActiveChart(chartConfigs.associados)}
          >
            <div className="h-[300px] mt-4">
              <Doughnut 
                data={chartConfigs.associados.chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 20 } }
                  },
                  cutout: '70%'
                }}
              />
            </div>
          </ChartCard>
        </div>
      </div>

      <div className="table-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Últimos Lançamentos</h2>
          <Calendar size={18} className="text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-xs font-medium text-gray-500">15/04/2024</td>
                <td className="px-6 py-4 text-xs font-bold text-gray-900">Mensalidade - Associado #124</td>
                <td className="px-6 py-4 text-xs font-bold text-emerald-600">R$ 150,00</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase tracking-wider">Pago</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-xs font-medium text-gray-500">14/04/2024</td>
                <td className="px-6 py-4 text-xs font-bold text-gray-900">Serviços Contábeis - INOVA</td>
                <td className="px-6 py-4 text-xs font-bold text-red-600">- R$ 2.450,00</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 uppercase tracking-wider">Saída</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ChartModal 
        isOpen={!!activeChart}
        onClose={() => setActiveChart(null)}
        {...activeChart}
      />

      <SplashScreen />
    </div>
  )
}
