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
    <div className="sticky top-[20px] z-[40] flex items-center justify-between gap-3 bg-gradient-to-r from-[#0e2d22] to-[#1d4f3e] backdrop-blur-xl p-4 px-8 rounded-[32px] border border-emerald-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-top-4 mb-6">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] text-emerald-400 font-black uppercase tracking-[2px] mb-1">Conta de Destino</span>
          <div className="flex items-center gap-2">
            <select 
              value={selectedContaId} 
              onChange={(e) => onContaChange(e.target.value)} 
              className="bg-emerald-900/40 border border-emerald-500/20 rounded-xl text-xs font-black text-white focus:ring-0 px-3 py-1.5 cursor-pointer appearance-none"
            >
              {contas.map((c: any) => <option key={c.id} value={c.id} className="text-gray-900">{c.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="h-10 w-px bg-white/10 mx-2" />
        <div className="flex flex-col text-white">
          <span className="text-emerald-400 font-black uppercase tracking-[2px] text-[10px] mb-1">Itens Novos</span>
          <span className="text-sm font-black flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {newItemsCount} Transações Extraídas
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col bg-black/20 px-5 py-2 rounded-2xl border border-white/5">
          <span className="text-[9px] text-emerald-400/60 font-black uppercase tracking-[2px] mb-0.5">Mudar Filtro em Lote</span>
          <select 
            onChange={(e) => onBatchCategory(e.target.value)}
            className="bg-transparent border-none text-[11px] font-black text-white focus:ring-0 p-0 cursor-pointer outline-none placeholder:text-gray-400"
            value=""
          >
            <option value="" disabled className="text-gray-900">Selecionar Categoria...</option>
            {(categorias || []).map((cat: any) => (
              <option key={cat.id} value={cat.nome} className="text-gray-900">{cat.nome}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={onAuditAll}
          disabled={isAuditingBatch || !hasFilteredItems}
          className="flex items-center gap-2 px-6 py-3.5 bg-emerald-900/60 text-emerald-400 border border-emerald-500/20 rounded-2xl font-black text-[10px] uppercase tracking-[1px] shadow-xl hover:bg-emerald-800 transition-all active:scale-95 disabled:opacity-50"
        >
          {isAuditingBatch ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
          {isAuditingBatch ? 'Auditando...' : 'Auditar em Lote'}
        </button>

        <button 
          onClick={onExecute} 
          disabled={isProcessingBatch} 
          className="flex items-center gap-3 px-8 py-3.5 bg-white text-[#0e2d22] rounded-2xl font-black text-[10px] uppercase tracking-[1px] shadow-[0_10px_30px_rgba(255,255,255,0.15)] hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50 group"
        >
          {isProcessingBatch ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} className="fill-emerald-900" />} 
          {activeTab === 'ofx' ? 'Executar Lançamento' : 'Sincronizar Cora'}
        </button>
      </div>
    </div>
  )
}
