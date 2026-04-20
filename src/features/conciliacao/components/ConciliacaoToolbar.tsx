import React from 'react'
import { RefreshCw, Zap, Search } from 'lucide-react'
import { fmtR } from '@/lib/utils/formatters'

interface ConciliacaoToolbarProps {
  contas: any[]
  selectedContaId: string
  onContaChange: (id: string) => void
  activeTab: 'ofx' | 'cora'
  newItemsCount: number
  categorias: any[]
  onBatchCategory: (cat: string) => void
  onAuditAll: () => void
  isAuditingBatch: boolean
  onExecute: () => void
  isProcessingBatch: boolean
  hasFilteredItems: boolean
}

export default function ConciliacaoToolbar({
  contas,
  selectedContaId,
  onContaChange,
  activeTab,
  newItemsCount,
  categorias,
  onBatchCategory,
  onAuditAll,
  isAuditingBatch,
  onExecute,
  isProcessingBatch,
  hasFilteredItems
}: ConciliacaoToolbarProps) {
  return (
    <div className="sticky top-[80px] z-[40] flex items-center justify-between gap-3 bg-[#1d4f3e] backdrop-blur-md p-3 px-6 rounded-[24px] border border-[#2d8c6f]/30 shadow-2xl animate-in slide-in-from-top-4">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Conta de Destino</span>
          <select 
            value={selectedContaId} 
            onChange={(e) => onContaChange(e.target.value)} 
            className="bg-transparent border-none text-sm font-black text-white focus:ring-0 p-0 cursor-pointer"
          >
            {contas.map((c: any) => <option key={c.id} value={c.id} className="text-gray-900">{c.nome}</option>)}
          </select>
        </div>
        <div className="h-8 w-px bg-indigo-500/30 mx-2" />
        <div className="flex flex-col text-white">
          <span className="text-emerald-100 font-bold uppercase tracking-wider text-[9px]">Itens Novos</span>
          <span className="text-sm font-black">{newItemsCount} itens</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-col bg-[#163d2f] px-4 py-1.5 rounded-2xl border border-emerald-500/20">
          <span className="text-[9px] text-emerald-200/50 font-bold uppercase tracking-wider">Mudar Filtro em Lote</span>
          <select 
            onChange={(e) => onBatchCategory(e.target.value)}
            className="bg-transparent border-none text-[11px] font-black text-white focus:ring-0 p-0 cursor-pointer outline-none"
            value=""
          >
            <option value="" disabled className="text-gray-900">Definir Categoria...</option>
            {(categorias || []).map((cat: any) => (
              <option key={cat.id} value={cat.nome} className="text-gray-900">{cat.nome}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={onAuditAll}
          disabled={isAuditingBatch || !hasFilteredItems}
          className="flex items-center gap-2 px-6 py-3 bg-[#163d2f] text-white rounded-2xl font-black text-[11px] shadow-xl hover:bg-[#0e2d22] transition-all active:scale-95 disabled:opacity-50"
        >
          {isAuditingBatch ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
          {isAuditingBatch ? 'AUDITANDO...' : 'AUDITAR COBRANÇAS EM LOTE'}
        </button>

        <button 
          onClick={onExecute} 
          disabled={isProcessingBatch} 
          className="flex items-center gap-3 px-8 py-3 bg-white text-[#163d2f] rounded-2xl font-black text-[11px] shadow-xl hover:bg-emerald-50 hover:text-emerald-700 transition-all active:scale-95 disabled:opacity-50 group"
        >
          {isProcessingBatch ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} className="fill-[#163d2f] group-hover:fill-emerald-600" />} 
          {activeTab === 'ofx' ? 'EXECUTAR LANÇAMENTO AUDITADO' : 'SINCRONIZAR API CORA'}
        </button>
      </div>
    </div>
  )
}
