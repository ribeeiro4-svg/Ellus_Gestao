'use client'
import React from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip,
  Legend, ArcElement, PointElement, LineElement,
} from 'chart.js'
import { X, Maximize2, FileText, Users as UsersIcon, Target, Zap as ZapIcon } from 'lucide-react'
import { fmtR, MESES, fmtPct } from '@/lib/utils/formatters'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend)

interface DashboardChartsProps { metrics: any; onChartClick: (config: any) => void }

/* ─── GRÁFICO 1: Gauge Semicircular — Mix da Carteira ─── */
function GaugeMixCarteira({ ativos, inadimplentes, inativos }: { ativos: number; inadimplentes: number; inativos: number }) {
  const total = ativos + inadimplentes + inativos || 1
  const fundo = total
  const data = {
    datasets: [{
      data: [ativos, inadimplentes, inativos, fundo],
      backgroundColor: ['#1D9E75', '#E24B4A', '#444441', 'rgba(255,255,255,0.04)'],
      borderWidth: [0, 0, 0, 0],
      borderRadius: [4, 4, 4, 0],
      hoverOffset: 4,
    }],
  }
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    circumference: 180,
    rotation: -90,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        filter: (item: any) => item.dataIndex < 3,
        backgroundColor: '#0d1f1a',
        titleColor: '#e0f5ed',
        bodyColor: '#5DCAA5',
        borderColor: 'rgba(29,158,117,0.2)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (c: any) => ` ${['Ativos','Inadimplentes','Inativos'][c.dataIndex]}: ${c.raw}`,
        },
      },
    },
  }
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Legenda HTML */}
      <div className="flex gap-3 mb-2 shrink-0 flex-wrap">
        {[['#1D9E75','Ativos',ativos],['#E24B4A','Inadimplentes',inadimplentes],['#444441','Inativos',inativos]].map(([cor,label,qt]) => (
          <div key={label as string} className="flex items-center gap-1.5">
            <div style={{ width:8, height:8, borderRadius:2, backgroundColor: cor as string }} />
            <span style={{ fontSize:11, color:'#6abf97' }}>{label} {qt}</span>
          </div>
        ))}
      </div>
      {/* Canvas */}
      <div className="relative flex-1 min-h-0">
        <Doughnut data={data} options={options} />
        {/* Texto central */}
        <div className="absolute bottom-[8%] left-0 right-0 flex flex-col items-center pointer-events-none">
          <span style={{ fontSize:64, fontWeight:600, color:'#5DCAA5', lineHeight:1 }}>{ativos}</span>
          <span style={{ fontSize:14, color:'rgba(90,200,155,0.6)', marginTop:6, letterSpacing:'0.1em' }}>ATIVOS / {total}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── GRÁFICO 2: Radial SVG Progress — Pendências ZapSign ─── */
function RadialZapSign({ pendentes, regularizados }: { pendentes: number; regularizados: number }) {
  const total = pendentes + regularizados || 1
  const r = 80
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - regularizados / total)
  const cor = pendentes === 0 ? '#1D9E75' : '#E24B4A'
  const pct = Math.round((regularizados / total) * 100)
  const sz = 200
  const cx = sz / 2
  return (
    <div className="flex items-center justify-center gap-10 h-full w-full px-4">
      {/* Anel SVG maior */}
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(29,158,117,0.12)" strokeWidth="14" />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={cor} strokeWidth="14"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        <text x={cx} y={cx - 6} textAnchor="middle" fill={cor} fontSize="36" fontWeight="500">{pendentes}</text>
        <text x={cx} y={cx + 18} textAnchor="middle" fill="rgba(90,200,155,0.55)" fontSize="13">PENDENTES</text>
      </svg>
      {/* Bloco direito */}
      <div className="flex flex-col gap-3 min-w-0">
        <span style={{ fontSize:13, color:'#4a9e7a' }}>Regularizados</span>
        <span style={{ fontSize:48, fontWeight:500, color:'#5DCAA5', lineHeight:1 }}>{regularizados}</span>
        <div style={{ width:'140px', height:6, background:'rgba(29,158,117,0.12)', borderRadius:3, overflow:'hidden' }}>
          <div style={{ width: `${pct}%`, height:'100%', background:'#1D9E75', borderRadius:3, transition:'width 0.6s ease' }} />
        </div>
        <span style={{ fontSize:12, color:'rgba(90,200,155,0.5)' }}>{pct}% concluído</span>
      </div>
    </div>
  )
}

/* ─── GRÁFICO 3: Barras + Linha de Meta — Atingimento de Metas ─── */
function MetasChart({ realizadoRec, realizadoDesp, planejadoRec, planejadoDesp, provRec, provDesp, regime }: any) {
  // No modo competência, barra = realizado + projetado (total do período)
  const barRec  = regime === 'competencia' ? realizadoRec + provRec  : realizadoRec
  const barDesp = regime === 'competencia' ? realizadoDesp + provDesp : realizadoDesp

  const labelBarra = regime === 'competencia' ? 'Total (Real. + Proj.)' : 'Realizado'
  const data = {
    labels: ['Ingresso', 'Dispêndio'],
    datasets: [
      {
        type: 'bar' as const,
        label: labelBarra,
        data: [barRec, barDesp],
        backgroundColor: ['rgba(29,158,117,0.7)', 'rgba(226,75,74,0.65)'],
        borderRadius: 6,
        borderSkipped: false,
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Meta',
        data: [planejadoRec, planejadoDesp],
        borderColor: 'rgba(255,255,255,0.35)',
        borderWidth: 2,
        borderDash: [6, 4],
        pointBackgroundColor: 'rgba(255,255,255,0.7)',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0,
        order: 1,
      },
    ],
  }
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0d1f1a',
        titleColor: '#e0f5ed',
        bodyColor: '#5DCAA5',
        borderColor: 'rgba(29,158,117,0.2)',
        borderWidth: 1,
        padding: 10,
        callbacks: { label: (c: any) => ` ${c.dataset.label}: ${fmtR(c.raw)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(29,158,117,0.08)' },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, callback: (v: any) => 'R$' + Math.round(Number(v) / 1000) + 'k' },
      },
    },
  }
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Legenda HTML */}
      <div className="flex gap-3 mb-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div style={{ width:8, height:8, borderRadius:2, backgroundColor:'rgba(29,158,117,0.7)' }} />
          <span style={{ fontSize:11, color:'#6abf97' }}>Realizado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width:8, height:8, borderRadius:2, backgroundColor:'rgba(29,158,117,0.25)', border:'1px solid #1D9E75' }} />
          <span style={{ fontSize:11, color:'#6abf97' }}>Meta</span>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        <Bar data={data as any} options={options} />
      </div>
    </div>
  )
}

/* ─── COMPONENTE PRINCIPAL ─── */
export default function DashboardCharts({ metrics, onChartClick }: DashboardChartsProps) {
  const { recReal, recProv, despReal, despProv, resultadoData, associadosStats } = metrics
  const { ativos, inadimplentes, inativos, zapsignPendentes } = associadosStats
  const { planejadoRec, planejadoDesp, realizadoRec, realizadoDesp } = metrics.planejamentoStats
  const regularizados = ativos + inadimplentes + inativos

  const [expandedChart, setExpandedChart] = React.useState<any>(null)

  /* Config do Fluxo Mensal — INALTERADO */
  const receitaConfig: any = {
    id: 'receita',
    title: 'Fluxo Mensal Consolidado',
    subtitle: 'Realizado vs Projetado',
    icon: <FileText size={16} />,
    chartType: 'bar',
    chartData: {
      labels: MESES,
      datasets: [
        { label: 'Ingresso (Pago)', data: recReal, backgroundColor: 'rgba(45,140,111,0.85)', borderRadius: 5, stack: 'receita' },
        { label: 'Ingresso (Aberto)', data: recProv, backgroundColor: 'rgba(45,140,111,0.25)', borderRadius: 5, stack: 'receita' },
        { label: 'Reserva (Fundo)', data: metrics.reservaArr, backgroundColor: '#f59e0b', borderRadius: 5, stack: 'receita' },
        { label: 'Dispêndio (Pago)', data: despReal, backgroundColor: 'rgba(239,68,68,0.8)', borderRadius: 5, stack: 'despesa' },
        { label: 'Dispêndio (Aberto)', data: despProv, backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 5, stack: 'despesa' },
        { label: 'Superávit/Déficit', data: resultadoData, type: 'line', borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true, borderWidth: 2.5, pointRadius: 4 },
      ],
    },
    tableData: {
      headers: ['Mês', 'Ingr. Pago', 'Ingr. Aberto', 'Reserva', 'Disp. Pago', 'Disp. Aberto'],
      rows: MESES.map((m: any, i: any) => [m, fmtR(recReal[i]), fmtR(recProv[i]), fmtR(metrics.reservaArr[i]), fmtR(despReal[i]), fmtR(despProv[i])]),
    },
  }

  const fluxoOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#040d0a', titleColor: '#fff', bodyColor: '#10b981', borderColor: 'rgba(16,185,129,0.2)', borderWidth: 1, padding: 12, displayColors: false },
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v: any) => 'R$ ' + Math.round(Number(v) / 1000) + 'k' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } } },
    },
  }

  /* Card genérico reutilizável */
  const Card = ({ icon, title, subtitle, onClick, children }: any) => (
    <div
      onClick={onClick}
      className="chart-card group relative !p-5 cursor-pointer !bg-gradient-to-br !from-[#040d0a]/95 !to-[#071a12]/95 !backdrop-blur-2xl !border-white/5 hover:!border-emerald-500/40 shadow-2xl transition-all flex flex-col h-full min-h-[320px] overflow-hidden"
    >
      <div className="absolute top-5 right-5 text-white/20 group-hover:text-emerald-400 transition-colors z-20"><Maximize2 size={16} /></div>
      <div className="chart-header !mb-3 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">{icon}</div>
          <div>
            <div className="chart-title !mb-0.5 !text-white tracking-tight">{title}</div>
            <div className="chart-subtitle !text-emerald-400/60 !font-bold uppercase tracking-widest text-[9px]">{subtitle}</div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative z-10">{children}</div>
    </div>
  )

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fluxo Mensal — INALTERADO */}
        <div className="lg:col-span-2 flex flex-col">
          <Card icon={receitaConfig.icon} title={receitaConfig.title} subtitle={receitaConfig.subtitle} onClick={() => setExpandedChart(receitaConfig)}>
            <div className="w-full h-full min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 relative">
                <Bar data={receitaConfig.chartData} options={fluxoOptions} />
              </div>
            </div>
          </Card>
        </div>
        {/* Mix da Carteira — Gauge Semicircular */}
        <div className="flex flex-col">
          <Card icon={<UsersIcon size={16} />} title="Mix da Carteira" subtitle="Associados por Status" onClick={() => {}}>
            <GaugeMixCarteira ativos={ativos} inadimplentes={inadimplentes} inativos={inativos} />
          </Card>
        </div>
      </div>

      {/* Linha 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pendências ZapSign — Radial SVG */}
        <div className="flex flex-col">
          <Card icon={<ZapIcon size={16} />} title="Pendências ZapSign" subtitle="Contratos aguardando assinatura" onClick={() => {}}>
            <RadialZapSign pendentes={zapsignPendentes} regularizados={regularizados} />
          </Card>
        </div>
        {/* Atingimento de Metas — Barras + Linha */}
        <div className="flex flex-col">
          <Card icon={<Target size={16} />} title="Atingimento de Metas" subtitle="Planejado vs Realizado (Mês Atual)" onClick={() => setExpandedChart({ title: 'Atingimento de Metas', subtitle: 'Planejado vs Realizado', icon: <Target size={16} />, chartType: 'bar', chartData: { labels: ['Ingresso','Dispêndio'], datasets: [{ label:'Realizado', data:[realizadoRec,realizadoDesp], backgroundColor:['rgba(29,158,117,0.7)','rgba(226,75,74,0.65)'] }] }, tableData: { headers:['Tipo','Realizado','Meta'], rows:[['Ingresso',fmtR(realizadoRec),fmtR(planejadoRec)],['Dispêndio',fmtR(realizadoDesp),fmtR(planejadoDesp)]] } })}>
            <MetasChart
              realizadoRec={realizadoRec} realizadoDesp={realizadoDesp}
              planejadoRec={planejadoRec} planejadoDesp={planejadoDesp}
              provRec={metrics.planejamentoStats.provRec || 0}
              provDesp={metrics.planejamentoStats.provDesp || 0}
              regime={metrics.planejamentoStats.regime || 'caixa'}
            />
          </Card>
        </div>
      </div>

      {/* Modal de detalhe */}
      {expandedChart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#071a12]/95 backdrop-blur-xl" onClick={() => setExpandedChart(null)} />
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95 duration-500 border border-white/20">
            <div className="lg:w-[320px] bg-gradient-to-br from-[#0e2d22] to-[#163d2f] p-8 text-white flex flex-col justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">{expandedChart.icon}</div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">{expandedChart.title}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[2px] text-emerald-400 opacity-80">{expandedChart.subtitle}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Status Global</p>
                    <p className="text-sm font-medium">Análise consolidada baseada em lançamentos efetivados e provisões.</p>
                  </div>
                  <div className="p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Orientação IA</p>
                    <p className="text-[12px] leading-relaxed text-emerald-900 font-bold italic">"Mantenha o monitoramento de contas a pagar para garantir o superávit projetado."</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setExpandedChart(null)} className="mt-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
                <X size={16} /> Fechar Detalhes
              </button>
            </div>
            <div className="flex-1 bg-slate-50 flex flex-col min-h-0 overflow-y-auto">
              <div className="p-8 lg:p-12 border-b border-slate-200">
                <div className="h-[300px] w-full">
                  <Bar data={expandedChart.chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } }} />
                </div>
              </div>
              <div className="p-8 lg:p-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Auditando Dados do Período</h3>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">Confidencial</div>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        {expandedChart.tableData.headers.map((h: string) => (
                          <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {expandedChart.tableData.rows.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          {row.map((cell: any, ci: number) => (
                            <td key={ci} className={`px-6 py-4 text-xs ${ci === 0 ? 'font-bold text-slate-800' : 'font-black text-emerald-600'}`}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
