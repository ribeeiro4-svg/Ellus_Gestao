'use client'
import React, { useState } from 'react'
import { Users, ShoppingCart, ShieldCheck } from 'lucide-react'
import AssociadosTab from '@/features/associados/components/AssociadosTab'
import FornecedoresTab from '@/features/associados/components/FornecedoresTab'
import DiretoriaTab from '@/features/associados/components/DiretoriaTab'

type TabID = 'associados' | 'fornecedores' | 'diretoria'

export default function AssociadosHubPage() {
  const [activeTab, setActiveTab] = useState<TabID>('associados')

  const tabs = [
    { id: 'associados' as TabID, label: 'Associados', icon: Users, color: 'emerald' },
    { id: 'fornecedores' as TabID, label: 'Fornecedores', icon: ShoppingCart, color: 'orange' },
    { id: 'diretoria' as TabID, label: 'Diretoria', icon: ShieldCheck, color: 'indigo' },
  ]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-${activeTab === 'associados' ? 'emerald' : activeTab === 'fornecedores' ? 'orange' : 'indigo'}-50 text-${activeTab === 'associados' ? 'emerald' : activeTab === 'fornecedores' ? 'orange' : 'indigo'}-600 flex items-center justify-center shadow-sm transition-colors duration-500`}>
            {activeTab === 'associados' && <Users size={24} />}
            {activeTab === 'fornecedores' && <ShoppingCart size={24} />}
            {activeTab === 'diretoria' && <ShieldCheck size={24} />}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Entidades</h1>
            <p className="text-xs text-slate-500 font-medium">Controle centralizado de membros, parceiros e conselho</p>
          </div>
        </div>

        {/* Tab Switcher */}
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

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'associados' && <AssociadosTab />}
        {activeTab === 'fornecedores' && <FornecedoresTab />}
        {activeTab === 'diretoria' && <DiretoriaTab />}
      </div>
    </div>
  )
}
