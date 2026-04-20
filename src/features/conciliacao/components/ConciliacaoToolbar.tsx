import React from 'react'
import { RefreshCw, Zap, Search } from 'lucide-react'
import { fmtR } from '@/lib/utils/formatters'

interface ConciliacaoToolbarProps {
  contas: any[]
  selectedContaId: string
  onContaChange: (id: string) => void
  activeTab: 'ofx' | 'cora'
  newItemsCount: number
  totalEntradas: number
  totalSaidas: number
  duplicatesCount: number
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
  totalEntradas,
  totalSaidas,
  duplicatesCount,
  categorias,
  onBatchCategory,
  onAuditAll,
  isAuditingBatch,
  onExecute,
  isProcessingBatch,
  hasFilteredItems
}: ConciliacaoToolbarProps) {
  return (
    <div className="sticky top-[20px] z-[40] flex items-center justify-between gap-6 bg-[#0e2d22] backdrop-blur-xl p-5 px-10 rounded-[32px] border border-emerald-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-in slide-in-from-top-4 mb-8">
      <div className="flex items-center gap-10">
        <div className="flex flex-col">
          <span className="text-[10px] text-emerald-400 font-black uppercase tracking-[2px] mb-2">Conta de Destino</span>
          <div className="flex items-center gap-2">
            <select 
              value={selectedContaId} 
              onChange={(e) => onContaChange(e.target.value)} 
              className="bg-[#0e2d22] border border-emerald-500/30 rounded-xl text-[12px] font-black text-white focus:ring-2 focus:ring-emerald-500/50 px-5 py-3 cursor-pointer outline-none transition-all hover:border-emerald-500/50 w-56 shadow-inner"
            >
              {contas.map((c: any) => <option key={c.id} value={c.id} className="bg-[#0e2d22] text-white py-2">{c.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="h-12 w-px bg-white/10" />
        
        <div className="flex gap-10">
          <div className="flex flex-col">
            <span className="text-emerald-400 font-black uppercase tracking-[2px] text-[10px] mb-2">Resumo do Extrato</span>
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Total ({newItemsCount})</span>
                <span className="text-sm font-black text-white">{fmtR(totalEntradas - totalSaidas)}</span>
              </div>
              <div className="flex flex-col border-l border-white/5 pl-6">
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Entradas</span>
                <span className="text-sm font-black text-emerald-400">+{fmtR(totalEntradas)}</span>
              </div>
              <div className="flex flex-col border-l border-white/5 pl-6">
                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter">Saídas</span>
                <span className="text-sm font-black text-rose-400">-{fmtR(totalSaidas)}</span>
              </div>
            </div>
          </div>

          <div className="h-12 w-px bg-white/10 self-center" />

          <div className="flex flex-col">
            <span className="text-amber-400 font-black uppercase tracking-[2px] text-[10px] mb-2">Segurança</span>
            <div className="flex items-center gap-3 bg-amber-400/10 px-4 py-2 rounded-xl border border-amber-400/20">
              {duplicatesCount > 0 ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[11px] font-black text-amber-400 uppercase tracking-tight">{duplicatesCount} Duplicados Identificados</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-black text-emerald-400 uppercase tracking-tight">Nenhuma Duplicata</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col bg-[#0e2d22]/50 px-6 py-2.5 rounded-2xl border border-white/5 min-w-[200px]">
          <span className="text-[9px] text-emerald-400/60 font-black uppercase tracking-[2px] mb-1">Mudar Filtro em Lote</span>
          <select 
            onChange={(e) => onBatchCategory(e.target.value)}
            className="bg-transparent border-none text-[11px] font-black text-white focus:ring-0 p-0 cursor-pointer outline-none placeholder:text-gray-400 appearance-none py-1"
            value=""
          >
            <option value="" disabled className="bg-[#0e2d22] text-white">Selecionar Categoria...</option>
            {(categorias || []).map((cat: any) => (
              <option key={cat.id} value={cat.nome} className="bg-[#0e2d22] text-white py-2">{cat.nome}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={onAuditAll}
          disabled={isAuditingBatch || !hasFilteredItems}
          className="flex items-center gap-3 px-8 py-4 bg-emerald-900/60 text-emerald-400 border border-emerald-500/20 rounded-2xl font-black text-[11px] uppercase tracking-[1px] shadow-xl hover:bg-emerald-800 transition-all active:scale-95 disabled:opacity-50"
        >
          {isAuditingBatch ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
          {isAuditingBatch ? 'Auditando...' : 'Auditar em Lote'}
        </button>

        <button 
          onClick={onExecute} 
          disabled={isProcessingBatch} 
          className="flex items-center gap-4 px-10 py-4 bg-white text-[#0e2d22] rounded-2xl font-black text-[11px] uppercase tracking-[1px] shadow-[0_15px_35px_rgba(255,255,255,0.2)] hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50 group"
        >
          {isProcessingBatch ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} className="fill-emerald-900" />} 
          {activeTab === 'ofx' ? 'Executar Lançamento' : 'Sincronizar Cora'}
        </button>
      </div>
    </div>
  )
}
