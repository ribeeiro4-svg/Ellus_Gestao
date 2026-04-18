'use client'
import React from 'react'
import { Trash2, CheckCircle2, XCircle, ChevronDown } from 'lucide-react'

interface BatchActionBarProps {
  selectedCount: number
  onDelete: () => void
  onStatusChange: (status: 'pago' | 'aberto') => void
  onClear: () => void
}

export default function BatchActionBar({ selectedCount, onDelete, onStatusChange, onClear }: BatchActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-8 min-w-[400px]">
        <div className="flex items-center gap-3 pr-8 border-r border-white/10">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold ring-4 ring-blue-600/20">
            {selectedCount}
          </div>
          <span className="text-sm font-medium tracking-tight whitespace-nowrap">Itens selecionados</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => onStatusChange('pago')}
            className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors text-emerald-400 text-sm font-bold"
          >
            <CheckCircle2 size={16} />
            Marcar Pago
          </button>
          
          <button 
            onClick={() => onStatusChange('aberto')}
            className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors text-amber-400 text-sm font-bold"
          >
            <XCircle size={16} />
            Marcar Aberto
          </button>

          <div className="w-px h-6 bg-white/10 mx-2" />

          <button 
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 hover:bg-rose-600 rounded-xl transition-colors text-rose-400 hover:text-white text-sm font-bold"
          >
            <Trash2 size={16} />
            Excluir Tudo
          </button>
        </div>

        <button 
          onClick={onClear}
          className="ml-4 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
