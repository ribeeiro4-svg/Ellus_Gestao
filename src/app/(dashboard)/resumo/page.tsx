'use client'
import React from 'react'
import { Calendar, Filter, RefreshCw } from 'lucide-react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useOrcamentos } from '@/lib/hooks/useOrcamentos'
import { useCategorias } from '@/lib/hooks/useCategorias'
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics'
import DashboardKpis from '@/features/dashboard/components/DashboardKpis'
import DashboardCharts from '@/features/dashboard/components/DashboardCharts'
import { MESES, getMesIdx, getAnoIdx, getBruto } from '@/lib/utils/formatters'
import { FileText } from 'lucide-react'
import ExportReportModal from '@/components/modals/ExportReportModal'

export default function DashboardPage() {
  const { lancamentos, loading: loadFin } = useFinanceiro()
  const { associados, loading: loadAssoc } = useAssociados()
  const { orcamentos, loading: loadOrc } = useOrcamentos()
  const { categorias } = useCategorias()
  
  const [filterMonth, setFilterMonth] = React.useState(new Date().getMonth())
  const [filterYear, setFilterYear] = React.useState(new Date().getFullYear())
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false)

  const metrics = useDashboardMetrics(lancamentos, associados, orcamentos, filterMonth, filterYear)

  const comparativo = React.useMemo(() => {
    const orcCats = orcamentos.map(o => o.categoria)
    const realCats = Array.from(new Set(lancamentos.filter(l => getMesIdx(l.data) === filterMonth && getAnoIdx(l.data) === filterYear).map(l => l.categoria)))
    const todasMes = Array.from(new Set([...orcCats, ...realCats])).sort()

    return todasMes.map(cat => {
      const lancMes = lancamentos.filter(l => l.categoria === cat && getMesIdx(l.data) === filterMonth && getAnoIdx(l.data) === filterYear)
      const realizado = lancMes.reduce((sum, l) => Math.round((sum + getBruto(l)) * 100) / 100, 0)
      const orc = orcamentos.find(o => o.categoria === cat)
      const planejado = orc?.valor_planejado || 0
      const catConfig = categorias.find(c => c.nome === cat)
      const tipo = catConfig?.tipo || lancMes[0]?.tipo || (cat.toLowerCase().includes('receita') || cat.toLowerCase().includes('adesão') ? 'receita' : 'despesa')

      return { categoria: cat, tipo, planejado, realizado }
    })
  }, [lancamentos, orcamentos, filterMonth, filterYear, categorias])

  if (loadFin || loadAssoc || loadOrc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 animate-spin">
          <RefreshCw size={24} />
        </div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Carregando Inteligência...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between flex-wrap gap-6 bg-white/40 backdrop-blur-sm p-6 rounded-[32px] border border-white/60 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Calendar size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Overview Executivo</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70">Análise Financeira — ACPROBEC</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm">
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="bg-transparent px-4 py-2 text-xs font-black text-slate-600 outline-none cursor-pointer"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="w-px h-4 bg-slate-100 mx-1" />
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="bg-transparent px-4 py-2 text-xs font-black text-slate-600 outline-none cursor-pointer"
            >
              {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
          <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 h-11 px-6 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 shadow-slate-200">
            <FileText size={16} /> Exportar
          </button>
          <button className="h-11 w-11 flex items-center justify-center bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-emerald-500 transition-colors shadow-sm">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <DashboardKpis metrics={metrics} />

      {/* Charts Section */}
      <DashboardCharts metrics={metrics} onChartClick={() => {}} />

      <ExportReportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        data={{
          metrics,
          financeiro: lancamentos,
          associados,
          comparativo
        }}
      />
    </div>
  )
}
