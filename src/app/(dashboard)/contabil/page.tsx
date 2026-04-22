'use client'
import React, { useState } from 'react'
import { BookOpen, BarChart3, List, TreePine, FileBarChart, FolderOpen } from 'lucide-react'
import { usePlanoContas } from '@/features/contabil/hooks/usePlanoContas'
import { useLancamentosContabeis } from '@/features/contabil/hooks/useLancamentosContabeis'
import ContabilDashboard from '@/features/contabil/components/ContabilDashboard'
import LivroDiario from '@/features/contabil/components/LivroDiario'
import PlanoContasTree from '@/features/contabil/components/PlanoContasTree'
import Balancete from '@/features/contabil/components/Balancete'
import Demonstracoes from '@/features/contabil/components/Demonstracoes'

type Tab = 'dashboard' | 'lancamentos' | 'plano' | 'balancete' | 'demonstracoes'

export default function ContabilPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const planoHook = usePlanoContas()
  const lancHook = useLancamentosContabeis()

  const tabs = [
    { id: 'dashboard' as Tab, label: '📊 Dashboard' },
    { id: 'lancamentos' as Tab, label: '📒 Livro Diário', badge: lancHook.stats.total },
    { id: 'plano' as Tab, label: '🏗️ Plano de Contas' },
    { id: 'balancete' as Tab, label: '📈 Balancete' },
    { id: 'demonstracoes' as Tab, label: '📑 Demonstrações' },
  ]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Contabilidade</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ITG 2002 (R1) • Livro Diário • ECD • SPED Contábil</p>
          </div>
        </div>
        {planoHook.contas.length === 0 && (
          <button
            onClick={() => planoHook.inicializarPlanoContas()}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all"
          >
            🚀 Inicializar Plano de Contas ITG 2002
          </button>
        )}
      </div>

      {/* Aviso ITG 2002 */}
      {planoHook.contas.length === 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">📘</span>
          <div>
            <p className="text-sm font-black text-indigo-800">Plano de Contas não inicializado</p>
            <p className="text-xs text-indigo-600 mt-1">
              Clique em "Inicializar Plano de Contas ITG 2002" para carregar automaticamente o plano padrão para
              associações sem fins lucrativos conforme a Norma ITG 2002 (R1) do Conselho Federal de Contabilidade.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && <ContabilDashboard lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'lancamentos' && <LivroDiario lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'plano' && <PlanoContasTree planoHook={planoHook} />}
      {activeTab === 'balancete' && <Balancete lancHook={lancHook} planoHook={planoHook} />}
      {activeTab === 'demonstracoes' && <Demonstracoes lancHook={lancHook} planoHook={planoHook} />}
    </div>
  )
}
