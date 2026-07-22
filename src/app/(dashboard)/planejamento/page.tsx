'use client'
import React, { useState, useEffect } from 'react'
import { 
  Calendar, Target, ChevronLeft, ChevronRight,
  Target as TargetIcon, Activity, TrendingUp, BarChart3, FileText, Save, CheckCircle2
} from 'lucide-react'
import MetasTab from '@/features/planejamento/components/MetasTab'
import SimuladorTab from '@/features/planejamento/components/SimuladorTab'
import EvolucaoTab from '@/features/planejamento/components/EvolucaoTab'
import ExportReportModal from '@/components/modals/ExportReportModal'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useOrcamentos } from '@/lib/hooks/useOrcamentos'
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics'
import { MESES, getMesIdx, getAnoIdx } from '@/lib/utils/formatters'

type TabID = 'metas' | 'simulador' | 'evolucao'

export default function PlanejamentoHubPage() {
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth())
  const [selectedAno] = useState(new Date().getFullYear())
  const [activeTab, setActiveTab] = useState<TabID>('metas')
  const [reservaMeses, setReservaMeses] = useState(6)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('reserva_meses_acprobec')
    if (saved) setReservaMeses(Number(saved))
  }, [])

  const { lancamentos } = useFinanceiro()
  const { associados } = useAssociados()
  const { orcamentos } = useOrcamentos(selectedMes, selectedAno)
  const metrics = useDashboardMetrics(lancamentos, associados, orcamentos, [selectedMes], selectedAno)

  const tabs = [
    { id: 'metas' as TabID, label: 'Metas', icon: TargetIcon, color: 'indigo' },
    { id: 'simulador' as TabID, label: 'Simulador', icon: Activity, color: 'emerald' },
    { id: 'evolucao' as TabID, label: 'Análise Histórica', icon: BarChart3, color: 'blue' },
  ]

  const getActiveIcon = () => {
    const tab = tabs.find(t => t.id === activeTab)
    const Icon = (tab as any)?.icon || TargetIcon
    return <Icon size={22} />
  }

  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-700">
      {/* Header Centralizado - Estilo Hub Premium */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/40 backdrop-blur-md py-3.5 px-6 rounded-2xl border border-white/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#0e2d22] flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 transition-all duration-500">
            {getActiveIcon()}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Planejamento Estratégico</h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Metas, Simuladores e Evolução — ACPROBEC</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Tab Switcher - Premium Interaction */}
          <div className="bg-slate-100/60 p-1.5 rounded-[22px] flex items-center gap-1 border border-slate-200/40 backdrop-blur-sm shadow-inner">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500
                    ${isActive 
                      ? 'bg-white text-[#0e2d22] shadow-md border border-slate-200/50 scale-105' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}
                  `}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {activeTab !== 'evolucao' && (
              <>
                <div className="flex items-center gap-3 bg-white/40 border border-white/60 p-2 rounded-2xl backdrop-blur-md">
                  <div className="pl-3 py-1 flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Reserva</span>
                    <span className="text-[8px] font-bold text-slate-300 mt-1 uppercase">Meses</span>
                  </div>
                  <div className="flex items-center bg-white/60 rounded-xl shadow-inner border border-slate-100 overflow-hidden">
                    <button onClick={() => { setReservaMeses(Math.max(1, reservaMeses - 1)); setIsSaved(false); }} className="p-2.5 hover:bg-white text-slate-400">－</button>
                    <input type="number" value={reservaMeses} onChange={e => { setReservaMeses(Number(e.target.value)); setIsSaved(false); }} className="w-8 text-center font-black text-[11px] text-slate-700 bg-transparent outline-none" />
                    <button onClick={() => { setReservaMeses(reservaMeses + 1); setIsSaved(false); }} className="p-2.5 hover:bg-white border-r border-slate-100 text-slate-400">＋</button>
                    <button 
                      onClick={() => {
                        localStorage.setItem('reserva_meses_acprobec', reservaMeses.toString())
                        setIsSaved(true)
                        setTimeout(() => setIsSaved(false), 2000)
                      }} 
                      className={`p-2.5 transition-all ${isSaved ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-white text-slate-400'}`}
                      title="Salvar padrão"
                    >
                      {isSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center bg-white/40 border border-white/60 p-1.5 rounded-2xl gap-1 shadow-sm backdrop-blur-md">
                  <button onClick={() => setSelectedMes(m => m === 0 ? 11 : m - 1)} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400"><ChevronLeft size={18} /></button>
                  <div className="flex items-center gap-3 px-4 min-w-[150px] justify-center border-x border-slate-100/50">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{MESES[selectedMes]} {selectedAno}</span>
                  </div>
                  <button onClick={() => setSelectedMes(m => m === 11 ? 0 : m + 1)} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400"><ChevronRight size={18} /></button>
                </div>
              </>
            )}
            
            <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-3 px-6 py-3.5 bg-[#0e2d22] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-emerald-900/20">
              <FileText size={16} /> Exportar
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-[600px]">
        {activeTab === 'metas' && <MetasTab selectedMes={selectedMes} selectedAno={selectedAno} reservaMeses={reservaMeses} />}
        {activeTab === 'simulador' && <SimuladorTab />}
        {activeTab === 'evolucao' && <EvolucaoTab />}
      </div>

      <ExportReportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={{
          metrics,
          financeiro: lancamentos.filter(l => getMesIdx(l.data) === selectedMes && getAnoIdx(l.data) === selectedAno),
          associados,
          comparativo: [] // O componente MetasTab calcula o comparativo internamente
        }}
      />
    </div>
  )
}
