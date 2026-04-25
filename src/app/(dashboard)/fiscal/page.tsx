'use client'
import React, { useState } from 'react'
import { FileText, Package, Calendar, BarChart3, Upload, BookOpen, AlertTriangle, CheckCircle, Clock, TrendingUp, FileCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useNFe } from '@/features/fiscal/hooks/useNFe'
import { useProdutosEstoque } from '@/features/fiscal/hooks/useProdutosEstoque'
import FiscalDashboard from '@/features/fiscal/components/FiscalDashboard'
import ImportarNFe from '@/features/fiscal/components/ImportarNFe'
import ListaNFe from '@/features/fiscal/components/ListaNFe'
import EscrituracaoNFe from '@/features/fiscal/components/EscrituracaoNFe'
import PeriodosFiscais from '@/features/fiscal/components/PeriodosFiscais'
import EstoqueTab from '@/features/fiscal/components/EstoqueTab'

type Tab = 'dashboard' | 'importar' | 'notas' | 'escrituracao' | 'estoque' | 'periodos' | 'nfse'

export default function FiscalPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [nfeParaEscriturar, setNfeParaEscriturar] = useState<string | null>(null)
  const nfeHook = useNFe()
  const estoqueHook = useProdutosEstoque()

  const tabs = [
    { id: 'dashboard' as Tab, label: '📊 Dashboard', icon: BarChart3 },
    { id: 'importar' as Tab, label: '📥 Importar NF-e', icon: Upload },
    { id: 'notas' as Tab, label: '📋 Notas', icon: FileText, badge: nfeHook.stats.pendentes > 0 ? nfeHook.stats.pendentes : undefined },
    { id: 'escrituracao' as Tab, label: '✍️ Escrituração', icon: BookOpen },
    { id: 'estoque' as Tab, label: '📦 Estoque', icon: Package, badge: estoqueHook.stats.produtosAbaixoMinimo > 0 ? estoqueHook.stats.produtosAbaixoMinimo : undefined },
    { id: 'periodos' as Tab, label: '📅 Períodos', icon: Calendar },
    { id: 'nfse' as Tab, label: '🏢 NFS-e (Serviços)', icon: FileCheck },
  ]

  const handleEscriturar = (nfeId: string) => {
    setNfeParaEscriturar(nfeId)
    setActiveTab('escrituracao')
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Escrituração Fiscal</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">EFD-ICMS/IPI • NF-e Modelo 55 • SPED</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {nfeHook.stats.pendentes > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-2xl">
              <AlertTriangle size={14} className="text-orange-500" />
              <span className="text-xs font-black text-orange-600">{nfeHook.stats.pendentes} nota(s) pendente(s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && <FiscalDashboard nfeHook={nfeHook} estoqueHook={estoqueHook} />}
      {activeTab === 'importar' && <ImportarNFe nfeHook={nfeHook} onImported={() => setActiveTab('notas')} />}
      {activeTab === 'notas' && <ListaNFe nfeHook={nfeHook} onEscriturar={handleEscriturar} />}
      {activeTab === 'escrituracao' && <EscrituracaoNFe nfeHook={nfeHook} nfeIdInicial={nfeParaEscriturar} />}
      {activeTab === 'estoque' && <EstoqueTab estoqueHook={estoqueHook} />}
      {activeTab === 'periodos' && <PeriodosFiscais nfeHook={nfeHook} />}
      {activeTab === 'nfse' && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-blue-200">
           <FileCheck size={48} className="text-blue-100 mb-4" />
           <h3 className="text-lg font-black text-slate-800">Módulo de NFS-e (Serviços Tomados)</h3>
           <p className="text-sm text-slate-400 mb-6 text-center max-w-md">O módulo de serviços agora possui uma área dedicada para gestão de retenções e integração contábil.</p>
           <Link href="/fiscal/nfse" className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
             Acessar Gestão de NFS-e <ArrowRight size={16} />
           </Link>
        </div>
      )}
    </div>
  )
}
