'use client'
import React, { useState } from 'react'
import { Target, Briefcase, TrendingUp } from 'lucide-react'
import MetasTab from '@/features/gerencial/components/MetasTab'
import ProjetosTab from '@/features/gerencial/components/ProjetosTab'

type TabID = 'metas' | 'projetos'

export default function EstrategiaHubPage() {
  const [activeTab, setActiveTab] = useState<TabID>('metas')

  const tabs = [
    { id: 'metas' as TabID, label: 'Metas e OKRs', icon: Target, color: 'orange' },
    { id: 'projetos' as TabID, label: 'Projetos e Iniciativas', icon: Briefcase, color: 'indigo' },
  ]

  const getActiveIcon = () => {
    const tab = tabs.find(t => t.id === activeTab)
    const Icon = (tab as any)?.icon || Target
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
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest opacity-70 mt-1">Gestão de Objetivos e OKRs — ACPROBEC</p>
          </div>
        </div>

        {/* Custom Tab Switcher - Premium Interaction */}
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
      </div>


      {/* Dynamic Content */}
      <div className="min-h-[500px]">
        {activeTab === 'metas' && <MetasTab />}
        {activeTab === 'projetos' && <ProjetosTab />}
      </div>
    </div>
  )
}
