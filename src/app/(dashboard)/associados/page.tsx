'use client'
import React, { useState } from 'react'
import { Users, ShoppingCart, ShieldCheck, AlertTriangle } from 'lucide-react'
import AssociadosTab from '@/features/associados/components/AssociadosTab'
import FornecedoresTab from '@/features/associados/components/FornecedoresTab'
import DiretoriaTab from '@/features/associados/components/DiretoriaTab'
import HistoricoCancelamentosTab from '@/features/associados/components/HistoricoCancelamentosTab'

type TabID = 'associados' | 'fornecedores' | 'diretoria' | 'cancelamentos'

export default function AssociadosHubPage() {
  const [activeTab, setActiveTab] = useState<TabID>('associados')

  const tabs = [
    { id: 'associados' as TabID, label: 'Associados', icon: Users, color: 'emerald' },
    { id: 'fornecedores' as TabID, label: 'Fornecedores', icon: ShoppingCart, color: 'orange' },
    { id: 'diretoria' as TabID, label: 'Diretoria', icon: ShieldCheck, color: 'indigo' },
    { id: 'cancelamentos' as TabID, label: 'Cancelamentos', icon: AlertTriangle, color: 'red' },
  ]

  const getActiveIcon = () => {
    const tab = tabs.find(t => t.id === activeTab)
    const Icon = tab?.icon || Users
    return <Icon size={28} />
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Header Centralizado - Estilo Hub Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#0e2d22] flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 transition-all duration-500">
            {getActiveIcon()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Vidas</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70">Membros, Parceiros e Diretoria — ACPROBEC</p>
          </div>
        </div>

        {/* Tab Switcher - Premium Interaction */}
        <div className="bg-slate-100/60 p-1.5 rounded-[22px] flex flex-wrap items-center gap-1 border border-slate-200/40 backdrop-blur-sm shadow-inner">
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
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'associados' && <AssociadosTab />}
        {activeTab === 'fornecedores' && <FornecedoresTab />}
        {activeTab === 'diretoria' && <DiretoriaTab />}
        {activeTab === 'cancelamentos' && <HistoricoCancelamentosTab />}
      </div>
    </div>
  )
}
