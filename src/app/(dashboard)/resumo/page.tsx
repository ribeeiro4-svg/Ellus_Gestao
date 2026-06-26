'use client'
import React from 'react'
import { Calendar, Filter, RefreshCw, FileText, ChevronDown, Check } from 'lucide-react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useOrcamentos } from '@/lib/hooks/useOrcamentos'
import { useCategorias } from '@/lib/hooks/useCategorias'
import { useContas } from '@/lib/hooks/useContas'
import { useFechamento } from '@/lib/hooks/useFechamento'
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics'
import DashboardKpis from '@/features/dashboard/components/DashboardKpis'
import DashboardCharts from '@/features/dashboard/components/DashboardCharts'
import { MESES, getMesIdx, getAnoIdx, getBruto } from '@/lib/utils/formatters'
import ExportReportModal from '@/components/modals/ExportReportModal'

export default function DashboardPage() {
  const { lancamentos, loading: loadFin } = useFinanceiro()
  const { associados, loading: loadAssoc } = useAssociados()
  const { orcamentos, loading: loadOrc } = useOrcamentos()
  const { categorias } = useCategorias()
  
  const { contas } = useContas()
  const { isPeriodoBloqueado } = useFechamento()
  const [selectedMonths, setSelectedMonths] = React.useState<number[]>([new Date().getMonth()])
  const [filterYear, setFilterYear] = React.useState(new Date().getFullYear())
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false)
  const [regime, setRegime] = React.useState<'caixa' | 'competencia'>('caixa')
  const [tipoConta, setTipoConta] = React.useState<'todos' | 'caixa' | 'banco'>('todos')
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = React.useState(false)

  const metrics = useDashboardMetrics(lancamentos, associados, orcamentos, selectedMonths, filterYear, regime, contas, tipoConta, isPeriodoBloqueado)

  const comparativo = React.useMemo(() => {
    const orcCats = orcamentos.map(o => o.categoria)
    const caixaIds = contas.filter((c: any) => c.nome.toLowerCase().includes('caixa')).map((c: any) => c.id)

    const filterByAccount = (l: any) => {
      if (tipoConta === 'todos') return true
      const isCaixa = caixaIds.includes(l.conta_id)
      return tipoConta === 'caixa' ? isCaixa : !isCaixa
    }

    const realCats = Array.from(new Set(lancamentos.filter(l => {
      const baseDate = regime === 'caixa' ? (l.data_conciliacao || l.data) : l.data
      const statusLower = (l.status || '').toLowerCase()
      const isPaidStatus = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso'].includes(statusLower)
      const isRealized = isPaidStatus || statusLower === 'parcial' || !!l.data_conciliacao

      if (regime === 'caixa' && !isRealized) return false
      if (!filterByAccount(l)) return false
      
      return selectedMonths.includes(getMesIdx(baseDate)) && getAnoIdx(baseDate) === filterYear
    }).map(l => l.categoria)))
    const todasMes = Array.from(new Set([...orcCats, ...realCats])).sort()

    return todasMes.map(cat => {
      const lancMes = lancamentos.filter(l => {
        const baseDate = regime === 'caixa' ? (l.data_conciliacao || l.data) : l.data
        if (regime === 'caixa' && l.status !== 'pago') return false
        if (!filterByAccount(l)) return false
        return l.categoria === cat && selectedMonths.includes(getMesIdx(baseDate)) && getAnoIdx(baseDate) === filterYear
      })
      const realizado = lancMes.reduce((sum, l) => Math.round((sum + getBruto(l)) * 100) / 100, 0)
      const orc = orcamentos.find(o => o.categoria === cat)
      const planejado = orc?.valor_planejado || 0
      const catConfig = categorias.find(c => c.nome === cat)
      const tipo = catConfig?.tipo || lancMes[0]?.tipo || (cat.toLowerCase().includes('receita') || cat.toLowerCase().includes('adesão') ? 'receita' : 'despesa')

      return { categoria: cat, tipo, planejado, realizado }
    })
  }, [lancamentos, orcamentos, selectedMonths, filterYear, categorias, regime, contas, tipoConta])

  if (loadFin || loadAssoc || loadOrc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 relative">
        {/* Fundo Escuro Exclusivo Dashboard (Loading) */}
        <div className="fixed inset-0 z-[-1] bg-[#0a1a14] pointer-events-none" />
        <div 
          className="fixed inset-0 z-[-1] opacity-30 pointer-events-none"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.5'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '56px 100px'
          }}
        />
        <div className="fixed inset-0 z-[-1] pointer-events-none bg-gradient-to-b from-emerald-500/5 via-transparent to-[#0a1a14]" />
        
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 animate-spin border border-white/20">
          <RefreshCw size={24} />
        </div>
        <p className="text-sm font-black text-white/40 uppercase tracking-widest animate-pulse">Carregando Inteligência...</p>
      </div>
    )
  }

  const toggleMonth = (idx: number) => {
    setSelectedMonths(prev => {
      if (prev.includes(idx)) {
        if (prev.length === 1) return prev
        return prev.filter(m => m !== idx).sort((a, b) => a - b)
      }
      return [...prev, idx].sort((a, b) => a - b)
    })
  }

  return (
    <div className="relative flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Fundo Escuro Exclusivo Dashboard */}
      <div className="fixed inset-0 z-[-1] bg-[#0a1a14] pointer-events-none" />
      <div 
        className="fixed inset-0 z-[-1] opacity-30 pointer-events-none"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.5'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundSize: '56px 100px'
        }}
      />
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-gradient-to-b from-emerald-500/5 via-transparent to-[#0a1a14]" />

      {/* Dashboard Header - Estilo Hub Premium */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-gradient-to-br from-[#040d0a]/95 to-[#071a12]/95 backdrop-blur-2xl p-6 rounded-[32px] border border-white/5 shadow-2xl relative z-50">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#0e2d22] flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">
            <Calendar size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight">Dashboard Interativo</h1>
            <p className="text-sm text-white/60 font-bold uppercase tracking-widest opacity-70">Inteligência de Dados — ACPROBEC</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Seletor de Tipo de Conta (Caixa vs Banco) */}
          <div className="flex items-center bg-black/40 rounded-2xl p-1 border border-white/5 shadow-inner">
            <button 
              onClick={() => setTipoConta('todos')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoConta === 'todos' ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setTipoConta('caixa')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoConta === 'caixa' ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
            >
              Caixa
            </button>
            <button 
              onClick={() => setTipoConta('banco')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoConta === 'banco' ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
            >
              Banco
            </button>
          </div>

          {/* Seletor de Regime (Caixa vs Competência) */}
          <div className="flex items-center bg-black/40 rounded-2xl p-1 border border-white/5 shadow-inner">
            <button 
              onClick={() => setRegime('caixa')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${regime === 'caixa' ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
            >
              Caixa
            </button>
            <button 
              onClick={() => setRegime('competencia')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${regime === 'competencia' ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
            >
              Competência
            </button>
          </div>

          <div className="flex items-center bg-black/20 rounded-[22px] border border-white/5 p-1.5 shadow-inner backdrop-blur-sm relative">
            <div className="flex items-center bg-white/5 rounded-xl px-4 py-2 border border-white/5 min-w-[140px] justify-between cursor-pointer" onClick={() => setIsMonthSelectorOpen(!isMonthSelectorOpen)}>
              <span className="text-[11px] font-black text-white/80 uppercase tracking-widest">
                {selectedMonths.length === 12 ? 'Todo o Ano' : (selectedMonths.length === 1 ? MESES[selectedMonths[0]] : `${selectedMonths.length} Meses`)}
              </span>
              <ChevronDown size={14} className={`text-white/40 transition-transform ${isMonthSelectorOpen ? 'rotate-180' : ''}`} />
            </div>

            {isMonthSelectorOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-[#071a12] border border-white/10 rounded-2xl shadow-2xl z-[100] p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-3 px-1">
                   <button onClick={() => setSelectedMonths(MESES.map((_, i) => i))} className="text-[9px] font-black text-emerald-400 uppercase tracking-wider hover:text-emerald-300 transition-colors">Todos</button>
                   <button onClick={() => setSelectedMonths([new Date().getMonth()])} className="text-[9px] font-black text-rose-400 uppercase tracking-wider hover:text-rose-300 transition-colors">Limpar</button>
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {MESES.map((m, i) => {
                    const isSelected = selectedMonths.includes(i)
                    return (
                      <div key={m} onClick={() => toggleMonth(i)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer group">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-white/20 group-hover:border-white/40'}`}>
                          {isSelected && <Check size={10} className="text-white" />}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>{m}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="w-px h-4 bg-white/10 mx-2" />
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="bg-transparent border-none text-[11px] font-black text-white/80 focus:ring-0 p-0 cursor-pointer uppercase tracking-widest"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-[#0e2d22]">{y}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-3 h-12 px-8 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/40">
              <FileText size={16} /> Exportar
            </button>
            <button className="h-12 w-12 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-sm backdrop-blur-md">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>


      {/* Main Stats Grid — não cresce, altura fixa */}
      <div className="shrink-0">
        <DashboardKpis metrics={metrics} />
      </div>

      {/* Charts Section */}
      <div className="w-full flex flex-col">
        <DashboardCharts metrics={metrics} onChartClick={() => {}} />
      </div>

      <ExportReportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        data={{
          metrics,
          financeiro: lancamentos.filter(l => {
            const baseDate = regime === 'caixa' ? (l.data_conciliacao || l.data) : l.data
            if (regime === 'caixa' && l.status !== 'pago') return false
            return selectedMonths.includes(getMesIdx(baseDate)) && getAnoIdx(baseDate) === filterYear
          }),
          associados,
          comparativo
        }}
      />
    </div>
  )
}
