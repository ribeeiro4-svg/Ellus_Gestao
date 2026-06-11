'use client'
import React, { useMemo } from 'react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import ChartCard from '@/components/ui/ChartCard'
import { calcEvolucao } from '@/lib/utils/calcMensal'
import { fmtR, MESES, getAnoIdx } from '@/lib/utils/formatters'
import { TrendingUp, Users, Activity, BarChart2, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'
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

export default function EvolucaoTab() {
  const { lancamentos, loading: loadFin, refresh: refetchFin } = useFinanceiro()
  const { associados, loading: loadAssoc } = useAssociados()

  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear())
  const [compareYear, setCompareYear] = React.useState<number | null>(null)

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    lancamentos.forEach(l => {
      const y = getAnoIdx(l.data)
      if (y > 0) years.add(y)
    })
    if (years.size === 0) years.add(new Date().getFullYear())
    return Array.from(years).sort((a, b) => b - a)
  }, [lancamentos])

  const loading = loadFin || loadAssoc

  const baseData = useMemo(() => {
    const filtered = lancamentos.filter(l => getAnoIdx(l.data) === selectedYear)
    return calcEvolucao(filtered, associados, selectedYear)
  }, [lancamentos, associados, selectedYear])

  const compareData = useMemo(() => {
    if (!compareYear) return null
    const filtered = lancamentos.filter(l => getAnoIdx(l.data) === compareYear)
    return calcEvolucao(filtered, associados, compareYear)
  }, [lancamentos, associados, compareYear])

  const totalReceita = useMemo(() => baseData.reduce((s, m) => s + (m.receita || 0), 0), [baseData])
  const totalDespesa = useMemo(() => baseData.reduce((s, m) => s + (m.despesa || 0), 0), [baseData])
  const ticketMedio = useMemo(() => 
    associados.length > 0 ? (associados.reduce((s, a) => s + a.mensalidade, 0) / associados.length) : 0, 
  [associados])

  const eficiencia = Math.round((totalReceita / (totalDespesa || 1)) * 100)
  const compareEficiencia = compareData ? Math.round((compareData.reduce((s, m) => s + (m.receita || 0), 0) / (compareData.reduce((s, m) => s + (m.despesa || 0), 0) || 1)) * 100) : null

  const fontSm = { size: 10, weight: 'bold' as const }
  const gridStyle = { color: 'rgba(0,0,0,.03)' }

  if (loading) return <div className="p-12 text-center text-slate-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Analisando histórico de dados...</div>

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-8">
      {/* ── Toolbar de Filtros Interna ── */}
      <div className="flex items-center justify-end gap-3 bg-white/40 p-2 rounded-2xl border border-white/60 backdrop-blur-sm self-end">
        <div className="flex items-center gap-2 px-3 border-r border-slate-100">
          <Calendar size={14} className="text-slate-400" />
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-[10px] font-black text-slate-700 bg-transparent border-none focus:ring-0 outline-none cursor-pointer uppercase tracking-widest"
          >
            {availableYears.map(y => <option key={y} value={y}>Base: {y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 px-3">
          <BarChart2 size={14} className="text-slate-400" />
          <select 
            value={compareYear || ''} 
            onChange={(e) => setCompareYear(e.target.value ? Number(e.target.value) : null)}
            className="text-[10px] font-black text-slate-700 bg-transparent border-none focus:ring-0 outline-none cursor-pointer uppercase tracking-widest"
          >
            <option value="">Comparar...</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Ingresso vs Dispêndio" subtitle="Histórico operacional mensal">
          <div className="h-[280px] mt-4">
            <Chart 
              type="bar" 
              data={{
                labels: MESES,
                datasets: [
                  { label: `Ingressos ${selectedYear}`, data: baseData.map(m => m.receita), backgroundColor: 'rgba(16, 185, 129, 0.7)', borderRadius: 4 },
                  { label: `Dispêndios ${selectedYear}`, data: baseData.map(m => m.despesa), backgroundColor: 'rgba(239, 68, 68, 0.6)', borderRadius: 4 },
                  ...(compareData ? [
                    { label: `Ingressos ${compareYear}`, data: compareData.map(m => m.receita), backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 4, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
                    { label: `Dispêndios ${compareYear}`, data: compareData.map(m => m.despesa), backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 4, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' }
                  ] : [])
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

        <ChartCard title="Evolução do Superávit/Déficit" subtitle="Variação mensal do superávit líquido">
          <div className="h-[280px] mt-4">
            <Line 
              data={{
                labels: MESES,
                datasets: [
                  { label: `Superávit/Déficit ${selectedYear}`, data: baseData.map(m => m.resultado), borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', fill: true, tension: 0.4, pointRadius: 3 },
                  ...(compareData ? [{ label: `Superávit/Déficit ${compareYear}`, data: compareData.map(m => m.resultado), borderColor: 'rgba(139, 92, 246, 0.3)', fill: false, tension: 0.4, borderDash: [5, 5] }] : [])
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: fontSm } } } }}
            />
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ChartCard title="Ticket Médio e Associados" subtitle="Evolução da base vs valor cobrado">
            <div className="h-[280px] mt-4">
              <Chart 
                type="line"
                data={{
                  labels: MESES.map((mes, idx) => [mes, baseData[idx]?.assocAtivos !== null ? `${baseData[idx]?.assocAtivos} atv.` : '']),
                  datasets: [
                    { label: `Ticket ${selectedYear}`, data: baseData.map(m => m.receita === null ? null : m.receita / (m.assocAtivos || 1)), borderColor: '#3b82f6', tension: 0.4, yAxisID: 'y' },
                    { label: `Associados ${selectedYear}`, data: baseData.map(m => m.assocAtivos), type: 'bar', backgroundColor: 'rgba(148, 163, 184, 0.1)', yAxisID: 'y2', borderRadius: 4 }
                  ]
                }}
                options={{ 
                  responsive: true, maintainAspectRatio: false,
                  scales: { 
                    y: { position: 'left', grid: gridStyle, ticks: { font: fontSm } },
                    y2: { position: 'right', grid: { display: false } }
                  }
                }}
              />
            </div>
          </ChartCard>
        </div>

        <div className="flex flex-col gap-4">
           <div className="flex-1 bg-slate-900 rounded-[32px] p-8 relative overflow-hidden group flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Eficiência Operacional</p>
                <div className="flex items-end gap-2 mb-2">
                   <h3 className="text-3xl font-black text-white">{eficiencia}%</h3>
                   {compareEficiencia !== null && (eficiencia >= compareEficiencia ? <ArrowUpRight className="text-emerald-400 mb-2" size={18}/> : <ArrowDownRight className="text-rose-400 mb-2" size={18}/>)}
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {eficiencia >= 110 ? 'Seu ingresso cobre os custos operacionais com folga estratégica.' :
                   eficiencia >= 100 ? 'Seu ingresso cobre os custos operacionais com margem justa.' :
                   'Atenção: A arrecadação atual não está sendo suficiente para cobrir todos os custos operacionais.'}
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-center">
                <div>
                  <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-1">Receitas Ano</p>
                  <p className="text-sm font-bold text-emerald-400">{fmtR(totalReceita)}</p>
                </div>
                <div className="w-[1px] h-6 bg-slate-800 mx-2"></div>
                <div>
                  <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-1">Despesas Ano</p>
                  <p className="text-sm font-bold text-rose-400">{fmtR(totalDespesa)}</p>
                </div>
                <div className="w-[1px] h-6 bg-slate-800 mx-2"></div>
                <div>
                  <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-1">Saldo Líquido</p>
                  <p className={`text-sm font-bold ${totalReceita - totalDespesa >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>{fmtR(totalReceita - totalDespesa)}</p>
                </div>
              </div>
           </div>
           <div className="bg-white rounded-[32px] border border-slate-100 p-8 flex flex-col items-center text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4"><Users size={24} /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ticket Médio Ano</p>
              <h3 className="text-3xl font-black text-slate-900">{fmtR(ticketMedio)}</h3>
           </div>
        </div>
      </div>
    </div>
  )
}
