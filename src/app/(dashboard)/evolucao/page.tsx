'use client'
import React, { useMemo } from 'react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import ChartCard from '@/components/ui/ChartCard'
import { calcEvolucao } from '@/lib/utils/calcMensal'
import { fmtR, MESES } from '@/lib/utils/formatters'
import { TrendingUp, Users, Activity, BarChart2 } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
  BarController, LineController
} from 'chart.js'
import { Chart, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, 
  PointElement, Title, Tooltip, Legend, Filler,
  BarController, LineController
)

export default function EvolucaoPage() {
  const { lancamentos, loading: loadFin } = useFinanceiro()
  const { associados, loading: loadAssoc } = useAssociados()

  const loading = loadFin || loadAssoc

  // ── Processamento de Dados ──
  const evolution = useMemo(() => calcEvolucao(lancamentos, associados), [lancamentos, associados])
  
  const totalReceita = useMemo(() => evolution.reduce((s, m) => s + m.receita, 0), [evolution])
  const totalDespesa = useMemo(() => evolution.reduce((s, m) => s + m.despesa, 0), [evolution])
  const ticketMedio = useMemo(() => 
    associados.length > 0 ? (associados.reduce((s, a) => s + a.mensalidade, 0) / associados.length) : 0, 
  [associados])

  const fontSm = { size: 10, weight: 'bold' as const }
  const gridStyle = { color: 'rgba(0,0,0,.03)' }

  if (loading) return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">Carregando análise histórica...</div>

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ── Page Header ── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Activity size={24} />
          </div>
          <div>
            <div className="page-title">Evolução Histórica</div>
            <div className="page-subtitle">Análise comparativa de crescimento e desempenho contínuo.</div>
          </div>
        </div>
      </div>

      {/* ── Top Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard 
          title="Receita vs Despesa" 
          subtitle="Acompanhamento mensal do fluxo operacional"
        >
          <div className="h-[280px] mt-4">
            <Chart 
              type="bar" 
              data={{
                labels: MESES,
                datasets: [
                  { label: 'Receitas', data: evolution.map(m => m.receita), backgroundColor: 'rgba(16, 185, 129, 0.7)', borderRadius: 4 },
                  { label: 'Despesas', data: evolution.map(m => m.despesa), backgroundColor: 'rgba(239, 68, 68, 0.6)', borderRadius: 4 },
                ]
              }}
              options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: fontSm } } },
                scales: {
                  y: { grid: gridStyle, ticks: { font: fontSm, callback: (v: any) => 'R$ ' + Math.round(Number(v) / 1000) + 'k' } },
                  x: { grid: { display: false }, ticks: { font: fontSm } }
                }
              }}
            />
          </div>
        </ChartCard>

        <ChartCard 
          title="Resultado Líquido (Evolução)" 
          subtitle="Variação mensal do superávit / déficit"
        >
          <div className="h-[280px] mt-4">
            <Line 
              data={{
                labels: MESES,
                datasets: [{
                  label: 'Resultado',
                  data: evolution.map(m => m.resultado),
                  borderColor: '#8b5cf6',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 3,
                  borderWidth: 2
                }]
              }}
              options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { grid: gridStyle, ticks: { font: fontSm, callback: (v: any) => 'R$ ' + Math.round(Number(v) / 1000) + 'k' } },
                  x: { grid: { display: false }, ticks: { font: fontSm } }
                }
              }}
            />
          </div>
        </ChartCard>
      </div>

      {/* ── Custom Cards & Bottom Data ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ChartCard 
            title="Ticket Médio e Base de Associados" 
            subtitle="Relação entre receita por membro e volume da carteira"
          >
             <div className="h-[280px] mt-4">
                <Chart 
                  type="line"
                  data={{
                    labels: MESES,
                    datasets: [
                      { 
                        label: 'Ticket Médio', 
                        data: evolution.map(m => m.receita / (m.assocAtivos || 1)), 
                        borderColor: '#3b82f6', 
                        backgroundColor: 'transparent',
                        yAxisID: 'y',
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 0
                      },
                      { 
                        label: 'Associados', 
                        data: evolution.map(m => m.assocAtivos), 
                        type: 'bar',
                        backgroundColor: 'rgba(148, 163, 184, 0.1)',
                        yAxisID: 'y2',
                        borderRadius: 4
                      }
                    ]
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: fontSm } } },
                    scales: {
                      y: { position: 'left', grid: gridStyle, ticks: { font: fontSm, callback: (v: any) => 'R$ ' + Math.round(v) } },
                      y2: { position: 'right', grid: { display: false }, ticks: { font: fontSm } },
                      x: { grid: { display: false }, ticks: { font: fontSm } }
                    }
                  }}
                />
             </div>
          </ChartCard>
        </div>

        <div className="flex flex-col gap-4">
           {/* Insight Card 1 */}
           <div className="flex-1 bg-slate-900 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full group-hover:bg-blue-600/30 transition-all"></div>
              <div className="relative z-10 h-full flex flex-col">
                 <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-4">Eficiência Operacional</p>
                 <h3 className="text-3xl font-black text-white mb-2 leading-none">
                    {Math.round((totalReceita / (totalDespesa || 1)) * 100)}%
                 </h3>
                 <p className="text-xs text-slate-400 font-medium leading-relaxed">Sua receita hoje cobre os custos operacionais com margem de segurança.</p>
                 <div className="mt-auto pt-6">
                    <div className="flex items-center gap-2">
                       <TrendingUp className="text-emerald-400" size={16} />
                       <span className="text-[10px] font-bold text-white uppercase tracking-widest">Tendência de Crescimento</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Insight Card 2 */}
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                 <Users size={24} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ticket Médio Estimado</p>
              <h3 className="text-3xl font-black text-slate-900 leading-none">{fmtR(ticketMedio)}</h3>
              <div className="mt-6 w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 w-3/4"></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-wider">Acima da média do setor</p>
           </div>
        </div>
      </div>
    </div>
  )
}

