'use client'
import React, { useState } from 'react'
import { Trash2, Layers, Zap } from 'lucide-react'
import BulkEditAssociadosModal from './BulkEditAssociadosModal'

interface BatchActionBarAssociadosProps {
  selectedCount: number
  onDelete?: () => void
  onUpdate?: (data: any) => Promise<void>
  onClear: () => void
  contas: { id: string; nome: string }[]
  onGerarMensalidades?: () => void
}

export default function BatchActionBarAssociados({ 
  selectedCount, 
  onDelete, 
  onUpdate, 
  onClear,
  contas,
  onGerarMensalidades
}: BatchActionBarAssociadosProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (selectedCount === 0) return null

  return (
    <>
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 animate-in fade-in slide-in-from-top-8 duration-300">
        <div className="bg-slate-900 text-white p-1.5 rounded-2xl shadow-xl border border-white/10 flex items-center justify-between w-full">
          
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* Contador */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 border-r border-white/10 select-none cursor-pointer" onClick={onClear} title="Limpar Seleção">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-xs font-black ring-4 ring-blue-600/20 shadow-lg shadow-blue-600/20">
                {selectedCount}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Items</span>
                <span className="text-xs font-bold tracking-tight whitespace-nowrap leading-none">Seleção</span>
              </div>
            </div>

            {/* Ações Rápidas Funcionais */}
            {onGerarMensalidades && (
              <div className="flex items-center gap-0.5 px-2 border-r border-white/10 pr-4 shrink-0">
                <button 
                  onClick={onGerarMensalidades}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 rounded-xl transition-all font-black uppercase tracking-widest text-[10px] active:scale-95 whitespace-nowrap"
                >
                  <Zap size={14} />
                  Mensalidades
                </button>
              </div>
            )}
            
            {/* Botão de Edição em Lote (Abre o Modal) */}
            {onUpdate && (
              <div className="px-2 shrink-0">
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
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-600 rounded-xl transition-all text-rose-400 hover:text-white text-[10px] font-black uppercase tracking-widest active:scale-95 group whitespace-nowrap shrink-0"
              >
                <Trash2 size={14} className="group-hover:animate-bounce shrink-0" />
                Excluir
              </button>
            )}
            <button 
              onClick={onClear}
              className="flex items-center px-4 py-2.5 hover:bg-white/10 rounded-xl transition-all text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest active:scale-95 whitespace-nowrap shrink-0"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <BulkEditAssociadosModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCount={selectedCount}
        onConfirm={async (data) => {
          if (onUpdate) await onUpdate(data)
        }}
        contas={contas}
      />
    </>
  )
}
