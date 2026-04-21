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

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Header Hub */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-${activeTab === 'metas' ? 'orange' : 'indigo'}-50 text-${activeTab === 'metas' ? 'orange' : 'indigo'}-600 flex items-center justify-center shadow-sm transition-all duration-500`}>
            {activeTab === 'metas' ? <Target size={24} /> : <Briefcase size={24} />}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Planejamento Estratégico</h1>
            <p className="text-xs text-slate-500 font-medium">Gestão de objetivos, OKRs e projetos corporativos</p>
          </div>
        </div>

        {/* Custom Tab Switcher - Premium Design */}
        <div className="bg-slate-100/50 p-1.5 rounded-[20px] flex items-center gap-1 border border-slate-200/50 backdrop-blur-sm self-start">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-[16px] text-xs font-black uppercase tracking-wider transition-all duration-300
                  ${isActive 
                    ? `bg-white text-${tab.color}-600 shadow-sm border border-slate-200/60` 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}
                `}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Dynamic Content */}
      <div className="min-h-[500px]">
        {activeTab === 'metas' && <MetasTab />}
        {activeTab === 'projetos' && <ProjetosTab />}
      </div>
    </div>
  )
}
