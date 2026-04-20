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

import { 
  X, 
  Maximize2, 
  FileText, 
  Users as UsersIcon, 
  Target, 
  Zap as ZapIcon 
} from 'lucide-react'

interface DashboardChartsProps {
  metrics: any
  onChartClick: (config: any) => void
}

export default function DashboardCharts({ metrics, onChartClick }: DashboardChartsProps) {
  const { 
    recReal, recProv, despReal, despProv, resultadoData, 
    associadosStats, planejamentoStats 
  } = metrics
  
  const { ativos, inadimplentes, inativos, zapsignPendentes } = associadosStats
  const { planejado, realizado, percentual } = planejamentoStats

  const [expandedChart, setExpandedChart] = React.useState<any>(null)

  const chartConfigs: any = {
    receita: {
      id: 'receita',
      title: 'Fluxo Mensal Consolidado',
      subtitle: 'Realizado vs Projetado',
      icon: <FileText size={16} />,
      chartType: 'bar',
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
    planejamento: {
      id: 'planejamento',
      title: 'Atingimento de Metas',
      subtitle: 'Planejado vs Realizado (Mês Atual)',
      icon: <Target size={16} />,
      chartType: 'bar',
      chartData: {
        labels: ['Planejado (Orçamento)', 'Realizado (Receita)'],
        datasets: [{
          label: 'Valor Financeiro',
          data: [planejado, realizado],
          backgroundColor: ['#f59e0b', '#10b981'],
          borderRadius: 12,
        }]
      },
      tableData: {
        headers: ['Tipo', 'Valor', '% Atingido'],
        rows: [
          ['Meta Planejada', fmtR(planejado), '100%'],
          ['Valor Realizado', fmtR(realizado), fmtPct(percentual)],
        ]
      }
    },
    zapsign: {
      id: 'zapsign',
      title: 'Pendências ZapSign',
      subtitle: 'Contratos aguardando assinatura',
      icon: <ZapIcon size={16} />,
      chartType: 'doughnut',
      chartData: {
        labels: ['Pendentes ZS', 'Regularizados'],
        datasets: [{
          data: [zapsignPendentes, ativos + inativos + inadimplentes - zapsignPendentes],
          backgroundColor: ['#ef4444', '#10b981'],
          borderWidth: 0,
        }]
      },
      tableData: {
        headers: ['Status ZapSign', 'Quantidade', 'Prioridade'],
        rows: [
          ['Pendente Assinatura', zapsignPendentes, 'ALTA'],
          ['Assinado/OK', ativos + inativos + inadimplentes - zapsignPendentes, 'BAIXA'],
        ]
      }
    },
    associados: {
      id: 'associados',
      title: 'Mix da Carteira',
      subtitle: 'Associados por Status',
      icon: <UsersIcon size={16} />,
      chartType: 'doughnut',
      chartData: {
        labels: [`Ativos`, `Inadimplentes`, `Inativos`],
        datasets: [{
          data: [ativos, inadimplentes, inativos],
          backgroundColor: ['#10b981', '#ef4444', '#9ca3af'],
          borderWidth: 0,
        }]
      },
      tableData: {
        headers: ['Status', 'Total', 'Representação'],
        rows: [
          ['Ativo', ativos, fmtPct((ativos / ((ativos + inadimplentes + inativos) || 1)) * 100)],
          ['Inadimplente', inadimplentes, fmtPct((inadimplentes / ((ativos + inadimplentes + inativos) || 1)) * 100)],
          ['Inativo', inativos, fmtPct((inativos / ((ativos + inadimplentes + inativos) || 1)) * 100)],
        ]
      }
    }
  }

  const renderMiniChart = (config: any) => {
    const options = { 
      responsive: true, 
      maintainAspectRatio: false, 
      plugins: { legend: { display: false } },
      scales: config.chartType === 'bar' ? { 
        y: { 
          grid: { color: 'rgba(0,0,0,0.03)' }, 
          ticks: { font: { size: 9 }, callback: (v: any) => config.id === 'receita' ? 'R$ ' + Math.round(Number(v) / 1000) + 'k' : v } 
        }, 
        x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' } } } 
      } : {} 
    }
    
    return config.chartType === 'bar' 
      ? <Bar data={config.chartData} options={options as any} />
      : <Doughnut data={config.chartData} options={options as any} />
  }

  const renderChartCard = (config: any) => (
    <div 
      onClick={() => setExpandedChart(config)}
      className="chart-card !bg-white group relative !p-6 cursor-pointer"
    >
      <div className="absolute top-6 right-6 text-slate-300 group-hover:text-emerald-500 transition-colors z-20">
        <Maximize2 size={16} />
      </div>
      
      <div className="chart-header !mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-100">
            {config.icon}
          </div>
          <div>
            <div className="chart-title !mb-0.5">{config.title}</div>
            <div className="chart-subtitle">{config.subtitle}</div>
          </div>
        </div>
      </div>

      <div className="relative z-10" style={{ height: config.id === 'receita' ? '280px' : '220px' }}>
        {renderMiniChart(config)}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-8">
      {/* Primeira Linha: Financeiro (Largo) e Associados (Compacto) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {renderChartCard(chartConfigs.receita)}
        </div>
        <div>
          {renderChartCard(chartConfigs.associados)}
        </div>
      </div>

      {/* Segunda Linha: Planejamento e ZapSign (Equilibrados) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderChartCard(chartConfigs.planejamento)}
        {renderChartCard(chartConfigs.zapsign)}
      </div>

      {/* Professional Zoom Modal */}
      {expandedChart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#071a12]/95 backdrop-blur-xl" onClick={() => setExpandedChart(null)} />
          
          <div className="relative w-full max-w-6xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95 duration-500 border border-white/20">
            {/* Modal Header/Sidebar (Green Side) */}
            <div className="lg:w-[380px] bg-gradient-to-br from-[#0e2d22] to-[#163d2f] p-10 text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    {expandedChart.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">{expandedChart.title}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[2px] text-emerald-400 opacity-80">{expandedChart.subtitle}</p>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Detalhamento Técnico</p>
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-white/10">
                            {expandedChart.tableData.headers.map((h: string) => (
                              <th key={h} className="pb-3 text-[10px] font-black text-white/30 uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {expandedChart.tableData.rows.slice(0, 6).map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/5 last:border-0">
                              {row.map((cell: any, ci: number) => (
                                <td key={ci} className={`py-3 text-[11px] font-medium ${ci === 0 ? 'text-white' : 'text-emerald-400'}`}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setExpandedChart(null)}
                  className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                >
                  <X size={16} /> Fechar Detalhes
                </button>
              </div>
            </div>

            {/* Modal Content (Chart Side) */}
            <div className="flex-1 p-10 lg:p-16 bg-slate-50 flex flex-col">
               <div className="flex-1 min-h-[400px]">
                  {expandedChart.chartType === 'bar' 
                    ? <Bar data={expandedChart.chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    : <Doughnut data={expandedChart.chartData} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom' } } }} />
                  }
               </div>
               <div className="mt-12 p-6 bg-emerald-600 rounded-3xl text-white shadow-xl shadow-emerald-600/20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <ZapIcon size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Insight Inteligente</p>
                      <p className="text-sm font-bold">Dados processados com IA para suporte à decisão estratégica.</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
