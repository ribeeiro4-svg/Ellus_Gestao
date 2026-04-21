'use client'
import React, { useState } from 'react'
import { 
  Calendar, Target, ChevronLeft, ChevronRight,
  Target as TargetIcon, Activity, TrendingUp, BarChart3, FileText
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

  const { lancamentos } = useFinanceiro()
  const { associados } = useAssociados()
  const { orcamentos } = useOrcamentos(selectedMes, selectedAno)
  const metrics = useDashboardMetrics(lancamentos, associados, orcamentos, selectedMes, selectedAno)

  const tabs = [
    { id: 'metas' as TabID, label: 'Metas', icon: TargetIcon, color: 'indigo' },
    { id: 'simulador' as TabID, label: 'Simulador', icon: Activity, color: 'emerald' },
    { id: 'evolucao' as TabID, label: 'Análise Histórica', icon: BarChart3, color: 'blue' },
  ]

  const getActiveColor = () => {
    if (activeTab === 'metas') return 'bg-indigo-600'
    if (activeTab === 'simulador') return 'bg-[#2d8c6f]'
    return 'bg-blue-600'
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Header Hub Unificado */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/60 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl ${getActiveColor()} flex items-center justify-center text-white shadow-lg transition-all duration-500`}>
             {activeTab === 'metas' && <Target size={28} />}
             {activeTab === 'simulador' && <Activity size={28} />}
             {activeTab === 'evolucao' && <BarChart3 size={28} />}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Estratégia & Planejamento</h1>
            <div className="flex items-center gap-2 mt-1">
              {tabs.map((tab) => (
                <React.Fragment key={tab.id}>
                  <button 
                    onClick={() => setActiveTab(tab.id)}
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md transition-all tracking-widest uppercase ${activeTab === tab.id ? `${getActiveColor()} text-white shadow-lg` : 'text-slate-400 hover:text-slate-600 bg-slate-50'}`}
                  >
                    {tab.label}
                  </button>
                  {tab.id !== 'evolucao' && <span className="text-slate-200 text-[10px]">/</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {activeTab !== 'evolucao' && (
            <>
              <div className="flex items-center gap-3 bg-slate-50/80 border border-slate-100 p-2 rounded-2xl">
                <div className="pl-3 py-1 flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Reserva</span>
                  <span className="text-[9px] font-bold text-slate-300 mt-1">Meses</span>
                </div>
                <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                   <button onClick={() => setReservaMeses(Math.max(1, reservaMeses - 1))} className="p-3 hover:bg-slate-50 text-slate-400">－</button>
                   <input type="number" value={reservaMeses} onChange={e => setReservaMeses(Number(e.target.value))} className="w-10 text-center font-black text-slate-700 bg-transparent outline-none" />
                   <button onClick={() => setReservaMeses(reservaMeses + 1)} className="p-3 hover:bg-slate-50 text-slate-400">＋</button>
                </div>
              </div>

              <div className="flex items-center bg-white border border-slate-200 p-1 rounded-2xl gap-1 shadow-sm h-14">
                <button onClick={() => setSelectedMes(m => m === 0 ? 11 : m - 1)} className="p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><ChevronLeft size={20} /></button>
                <div className="flex items-center gap-3 px-6 min-w-[170px] justify-center border-x border-slate-100">
                  <Calendar size={18} className="text-slate-400" />
                  <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{MESES[selectedMes]} {selectedAno}</span>
                </div>
                <button onClick={() => setSelectedMes(m => m === 11 ? 0 : m + 1)} className="p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><ChevronRight size={20} /></button>
              </div>
            </>
          )}
          
          <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-3 h-14 px-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
            <FileText size={18} /> Exportar
          </button>
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
