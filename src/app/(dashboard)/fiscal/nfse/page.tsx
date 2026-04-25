
'use client'
import React, { useState } from 'react'
import { FileText, BarChart3, Upload, ArrowLeft } from 'lucide-react'
import { useNFSe } from '@/features/fiscal/hooks/useNFSe'
import NFSeDashboard from '@/features/fiscal/components/nfse/NFSeDashboard'
import NFSeImportZone from '@/features/fiscal/components/nfse/NFSeImportZone'
import NFSeEscrituracaoModal from '@/features/fiscal/components/nfse/NFSeEscrituracaoModal'
import { salvarEscrituracaoNFSeAction } from '@/features/fiscal/actions/nfseActions'
import Link from 'next/link'

type Tab = 'dashboard' | 'importar' | 'lista'

export default function NFSePage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedNFSe, setSelectedNFSe] = useState<any>(null)
  const nfseHook = useNFSe()

  const tabs = [
    { id: 'dashboard' as Tab, label: '📊 Dashboard', icon: BarChart3 },
    { id: 'importar' as Tab, label: '📥 Importar NFS-e', icon: Upload },
    { id: 'lista' as Tab, label: '📋 Lista de Notas', icon: FileText, badge: nfseHook.stats.pendentes > 0 ? nfseHook.stats.pendentes : undefined },
  ]

  const handleEscriturar = (id: string) => {
    const nota = nfseHook.nfses.find((n: any) => n.id === id)
    if (nota) {
      setSelectedNFSe({
        nota: nota,
        prestador: nota.prestador || { razao_social: 'N/A', cnpj: 'N/A' }
      })
      setIsModalOpen(true)
    }
  }

  const handleSubmitEscrituracao = async (payload: any) => {
    const res = await salvarEscrituracaoNFSeAction(payload)
    if (res.success) {
      alert('Nota escriturada com sucesso!')
      nfseHook.refresh()
      setIsModalOpen(false)
    } else {
      alert(`Erro: ${res.error}`)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/fiscal" className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">NFS-e: Serviços Tomados</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestão Fiscal • Retenções • Escrituração</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
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
      <div className="min-h-[500px]">
        {activeTab === 'dashboard' && <NFSeDashboard nfseHook={nfseHook} onEscriturar={handleEscriturar} />}
        {activeTab === 'importar' && <NFSeImportZone onImported={() => setActiveTab('lista')} />}
        {activeTab === 'lista' && (
          <div className="flex flex-col gap-4">
             <NFSeDashboard nfseHook={nfseHook} onEscriturar={handleEscriturar} />
          </div>
        )}
      </div>

      <NFSeEscrituracaoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        nfseData={selectedNFSe}
        onSubmit={handleSubmitEscrituracao}
      />
    </div>
  )
}
