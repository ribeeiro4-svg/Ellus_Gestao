import React from 'react'
import { RefreshCw, Zap, Search, History, FileText } from 'lucide-react'
import { fmtR } from '@/lib/utils/formatters'

interface ConciliacaoToolbarProps {
  contas: any[]
  selectedContaId: string
  onContaChange: (id: string) => void
  activeTab: 'ofx' | 'cora'
  newItemsCount: number
  totalItemsCount: number
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
  onShowHistory: () => void
  onExportCurrent: () => void
  onCleanupConciliacao?: () => void
  hasSelection?: boolean
  selectedCount?: number
  onSelectAll?: (selectAll: boolean) => void
}

export default function ConciliacaoToolbar({
  contas,
  selectedContaId,
  onContaChange,
  activeTab,
  newItemsCount,
  totalItemsCount,
  totalEntradas,
  totalSaidas,
  duplicatesCount,
  categorias,
  onBatchCategory,
  onAuditAll,
  isAuditingBatch,
  onExecute,
  isProcessingBatch,
  hasFilteredItems,
  onShowHistory,
  onExportCurrent,
  onCleanupConciliacao,
  hasSelection,
  selectedCount,
  onSelectAll
}: ConciliacaoToolbarProps) {
  return (
    <div className="sticky top-[20px] z-[40] flex items-center justify-between gap-4 bg-[#0e2d22] backdrop-blur-xl py-2.5 px-6 rounded-[32px] border border-emerald-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-in slide-in-from-top-4 mb-8">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[8px] text-emerald-400 font-black uppercase tracking-[1.5px] mb-1">CONTA</span>
          <select 
            value={selectedContaId} 
            onChange={(e) => onContaChange(e.target.value)} 
            className="bg-transparent border border-emerald-500/40 rounded-lg text-[10px] font-black text-white px-3 py-1 cursor-pointer outline-none transition-all hover:border-emerald-500/60 w-32"
          >
            {contas.map((c: any) => <option key={c.id} value={c.id} className="bg-[#0e2d22] text-white py-2">{c.nome}</option>)}
          </select>
        </div>

        <div className="h-8 w-px bg-white/20" />
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-emerald-400 font-black uppercase tracking-[1.5px] text-[8px] mb-1">Resumo Financeiro</span>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 whitespace-nowrap">
                <span className="text-[7px] font-black text-white/60 uppercase tracking-wider">Itens ({totalItemsCount}):</span>
                <span className="text-[12px] font-black text-white tracking-tight">{fmtR(totalEntradas - totalSaidas)}</span>
              </div>
              <div className="flex items-center gap-3 border-l border-white/20 pl-6 whitespace-nowrap">
                <span className="text-[7px] font-black text-emerald-400 uppercase tracking-wider">Entradas:</span>
                <span className="text-[12px] font-black text-emerald-400 tracking-tight">+{fmtR(totalEntradas)}</span>
              </div>
              <div className="flex items-center gap-3 border-l border-white/20 pl-6 whitespace-nowrap">
                <span className="text-[7px] font-black text-rose-400 uppercase tracking-wider">Saídas:</span>
                <span className="text-[12px] font-black text-rose-400 tracking-tight">-{fmtR(totalSaidas)}</span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-white/20" />

          <div className="flex flex-col">
            <span className="text-amber-400 font-black uppercase tracking-[1.5px] text-[8px] mb-1">Segurança</span>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all ${duplicatesCount > 0 ? 'bg-amber-400/10 border-amber-400/30' : 'bg-emerald-400/10 border-emerald-400/30'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${duplicatesCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span className={`text-[8px] font-black uppercase tracking-widest ${duplicatesCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {duplicatesCount > 0 ? `${duplicatesCount} DUPLICADOS` : 'SEGURO'}
                </span>
              </div>
              {duplicatesCount > 0 && onCleanupConciliacao && (
                <button 
                  onClick={onCleanupConciliacao}
                  className="px-2 py-1 bg-amber-400/20 text-amber-400 border border-amber-400/40 rounded text-[7px] font-black uppercase tracking-widest hover:bg-amber-400/40 transition-all flex items-center gap-1.5"
                  title="Remover duplicatas do banco de dados"
                >
                  <RefreshCw size={8} /> Limpar Banco
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {onSelectAll && (
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={hasSelection} 
              onChange={(e) => onSelectAll(e.target.checked)} 
              className="w-4 h-4 rounded border-emerald-500/40 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500" 
              title="Selecionar Todos / Nenhum"
            />
            {selectedCount ? <span className="text-[10px] font-black text-white px-2 bg-emerald-500 rounded-full">{selectedCount}</span> : null}
          </div>
        )}
        <div className="flex flex-col bg-[#0e2d22]/50 px-5 py-1.5 rounded-xl border border-white/10 min-w-[180px]">
          <span className="text-[8px] text-emerald-400 font-black uppercase tracking-[1.5px] mb-0.5 opacity-60">
            {selectedCount && selectedCount > 0 ? `Categoria em Lote (${selectedCount})` : 'Filtro em Lote (Todos)'}
          </span>
          <select 
            onChange={(e) => onBatchCategory(e.target.value)}
            className="bg-transparent border-none text-[10px] font-black text-white focus:ring-0 p-0 cursor-pointer outline-none placeholder:text-gray-400 appearance-none py-0.5"
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
          className="flex items-center gap-2.5 px-6 py-3 bg-emerald-900/60 text-emerald-400 border border-emerald-500/20 rounded-xl font-black text-[10px] uppercase tracking-[1px] shadow-xl hover:bg-emerald-800 transition-all active:scale-95 disabled:opacity-50"
        >
          {isAuditingBatch ? <RefreshCw size={12} className="animate-spin" /> : <Search size={12} />}
          {isAuditingBatch ? 'Auditando...' : 'Auditar'}
        </button>

        <button 
          onClick={onShowHistory}
          className="flex items-center gap-2.5 px-6 py-3 bg-emerald-900/60 text-emerald-400 border border-emerald-500/20 rounded-xl font-black text-[10px] uppercase tracking-[1px] shadow-xl hover:bg-emerald-800 transition-all active:scale-95 group"
          title="Ver histórico de conciliações"
        >
          <History size={12} className="group-hover:rotate-[-12deg] transition-transform" />
          Histórico
        </button>

        <button 
          onClick={onExportCurrent}
          disabled={!hasFilteredItems}
          className="flex items-center gap-2.5 px-6 py-3 bg-emerald-900/60 text-emerald-400 border border-emerald-500/20 rounded-xl font-black text-[10px] uppercase tracking-[1px] shadow-xl hover:bg-emerald-800 transition-all active:scale-95 disabled:opacity-50 group"
          title="Exportar prévia da conciliação"
        >
          <FileText size={12} />
          Exportar
        </button>

        <button 
          onClick={onExecute} 
          disabled={isProcessingBatch} 
          className="flex items-center gap-3 px-8 py-3 bg-white text-[#0e2d22] rounded-xl font-black text-[10px] uppercase tracking-[1px] shadow-[0_15px_35px_rgba(255,255,255,0.2)] hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50 group"
        >
          {isProcessingBatch ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} className="fill-emerald-900" />} 
          {activeTab === 'ofx' ? 'Lançar' : 'Sincronizar'}
        </button>
      </div>
    </div>
  )
}
