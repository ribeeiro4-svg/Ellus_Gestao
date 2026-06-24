'use client'
import React, { useState } from 'react'
import { Trash2, ArrowDownUp, FileCheck, Layers, MessageCircle, Gift } from 'lucide-react'
import BulkEditModal from './BulkEditModal'

interface BatchActionBarProps {
  selectedCount: number
  onDelete?: () => void
  onUpdate?: (data: any) => void
  onClear: () => void
  categories: { id: string; nome: string }[]
  planoContas?: { id: string; codigo: string; descricao: string }[]
  contas?: { id: string; nome: string }[]
  diretores?: { id: string; nome: string }[]
  onInvertType?: () => void
  onReconciliar?: () => void
  onDownloadInvoice?: () => void
  onMarkCobranca?: () => void
  onRemoveCobranca?: () => void
  onAbonar?: () => void
}

export default function BatchActionBar({ 
  selectedCount, 
  onDelete, 
  onUpdate, 
  onClear,
  categories,
  planoContas,
  contas,
  diretores,
  onInvertType,
  onReconciliar,
  onMarkCobranca,
  onRemoveCobranca,
  onAbonar
}: BatchActionBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (selectedCount === 0) return null

  return (
    <>
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl px-4 animate-in fade-in slide-in-from-top-8 duration-300">
        <div className="bg-slate-900 text-white p-1.5 rounded-2xl shadow-xl border border-white/10 flex items-center justify-between w-full">
          
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* Contador */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 border-r border-white/10 select-none">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-xs font-black ring-4 ring-blue-600/20 shadow-lg shadow-blue-600/20">
                {selectedCount}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Items</span>
                <span className="text-xs font-bold tracking-tight whitespace-nowrap leading-none">Seleção</span>
              </div>
            </div>

            {/* Ações Rápidas Funcionais */}
            {(onInvertType || onReconciliar) && (
              <div className="flex items-center gap-0.5 px-1 border-r border-white/10 pr-2">
                {onInvertType && (
                  <button 
                    onClick={onInvertType}
                    className="group flex flex-col items-center justify-center w-12 h-12 hover:bg-indigo-500/10 rounded-xl transition-all text-indigo-400 hover:scale-105 active:scale-95"
                    title="Inverter Tipo (Ingresso <-> Dispêndio)"
                  >
                    <ArrowDownUp size={18} />
                  </button>
                )}

                {onReconciliar && (
                  <button 
                    onClick={onReconciliar}
                    className="group flex flex-col items-center justify-center w-12 h-12 hover:bg-blue-500/10 rounded-xl transition-all text-blue-400 hover:scale-105 active:scale-95 ml-1"
                    title="Reconciliar em Lote (Corrigir Associado)"
                  >
                    <FileCheck size={18} />
                  </button>
                )}
              </div>
            )}
            
            {/* Botões de Cobrança */}
            {(onMarkCobranca || onRemoveCobranca) && (
              <div className="flex items-center px-1 border-r border-white/10">
                {onMarkCobranca && (
                  <button
                    onClick={onMarkCobranca}
                    className="flex items-center gap-1 px-3 py-2.5 hover:bg-orange-600/20 rounded-xl transition-all text-orange-400 hover:text-orange-300 font-black uppercase tracking-widest text-[10px] active:scale-95 group whitespace-nowrap"
                    title="Marcar em Cobrança"
                  >
                    <MessageCircle size={14} className="group-hover:animate-bounce" />
                    + Cobrança
                  </button>
                )}
                {onRemoveCobranca && (
                  <button 
                    onClick={onRemoveCobranca}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all whitespace-nowrap"
                    title="Remover Status de Cobrança"
                  >
                    <MessageCircle size={15} className="opacity-50" />
                    <span className="hidden sm:inline">Desmarcar</span>
                  </button>
                )}

                {onAbonar && (
                  <button 
                    onClick={onAbonar}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-indigo-300 hover:text-white hover:bg-indigo-500/20 rounded-xl transition-all whitespace-nowrap"
                    title="Abonar Lançamentos"
                  >
                    <Gift size={15} />
                    <span className="hidden sm:inline">Abonar</span>
                  </button>
                )}
              </div>
            )}
            
            {onUpdate && (
              <div className="px-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/20 active:scale-95 whitespace-nowrap"
                >
                  <Layers size={14} />
                  Editar em Lote
                </button>
              </div>
            )}
          </div>

          {/* Excluir e Cancelar (Lado Direito) */}
          <div className="flex items-center gap-1.5 pr-2 pl-4 border-l border-white/10 shrink-0">
            {onDelete && (
              <button 
                onClick={onDelete}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-600 rounded-xl transition-all text-rose-400 hover:text-white text-[10px] font-black uppercase tracking-widest active:scale-95 group"
              >
                <Trash2 size={14} className="group-hover:animate-bounce" />
                Excluir
              </button>
            )}
            <button 
              onClick={onClear}
              className="flex items-center px-4 py-2.5 hover:bg-white/10 rounded-xl transition-all text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest active:scale-95"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <BulkEditModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={(data) => {
          if (onUpdate) onUpdate(data)
        }}
        selectedCount={selectedCount}
        categories={categories}
        planoContas={planoContas}
        contas={contas}
        diretores={diretores}
      />
    </>
  )
}
