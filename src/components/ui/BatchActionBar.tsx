'use client'
import React from 'react'
import { Trash2, CheckCircle2, XCircle, CreditCard, Layers, Bookmark, ChevronRight } from 'lucide-react'

interface BatchActionBarProps {
  selectedCount: number
  onDelete: () => void
  onUpdate: (data: any) => void
  onClear: () => void
  categories: { id: string; nome: string }[]
}

const PAYMENT_METHODS = ['PIX', 'Boleto', 'Dinheiro', 'Transferência']
const STATUSES = [
  { value: 'pago', label: 'Efetivado (Pago)', icon: CheckCircle2, color: 'text-emerald-400' },
  { value: 'aberto', label: 'Provisionado', icon: XCircle, color: 'text-amber-400' },
  { value: 'atrasado', label: 'Atrasado', icon: AlertCircle, color: 'text-rose-400' }
]

import { AlertCircle } from 'lucide-react'

export default function BatchActionBar({ 
  selectedCount, 
  onDelete, 
  onUpdate, 
  onClear,
  categories 
}: BatchActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-2 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/10 flex items-center gap-2 min-w-fit">
        
        {/* Contador */}
        <div className="flex items-center gap-3 px-6 py-3 border-r border-white/10 select-none">
          <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center text-sm font-black ring-4 ring-blue-600/20 shadow-lg shadow-blue-600/20">
            {selectedCount}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Selecionados</span>
            <span className="text-sm font-bold tracking-tight whitespace-nowrap leading-none">Lançamentos</span>
          </div>
        </div>

        {/* Ações Rápidas de Status */}
        <div className="flex items-center gap-1 px-2">
          <button 
            onClick={() => onUpdate({ status: 'pago' })}
            className="group flex flex-col items-center justify-center w-14 h-14 hover:bg-emerald-500/10 rounded-2xl transition-all text-emerald-400 hover:scale-105 active:scale-95"
            title="Marcar como Pago"
          >
            <CheckCircle2 size={20} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Pago</span>
          </button>
          
          <button 
            onClick={() => onUpdate({ status: 'aberto' })}
            className="group flex flex-col items-center justify-center w-14 h-14 hover:bg-amber-500/10 rounded-2xl transition-all text-amber-400 hover:scale-105 active:scale-95"
            title="Marcar como Aberto"
          >
            <XCircle size={20} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Aberto</span>
          </button>
        </div>

        <div className="w-px h-10 bg-white/10 mx-1" />

        {/* Seletores Massivos */}
        <div className="flex items-center gap-3 px-4">
          {/* Categoria */}
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">
               <Bookmark size={10} /> Categoria
             </div>
             <select 
               onChange={(e) => e.target.value && onUpdate({ categoria: e.target.value })}
               className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-2 ring-blue-500/30 transition-all hover:bg-white/10 min-w-[140px] appearance-none"
               value=""
             >
               <option value="" disabled className="bg-slate-900">Alterar para...</option>
               {categories.map(cat => (
                 <option key={cat.id} value={cat.nome} className="bg-slate-900">{cat.nome}</option>
               ))}
             </select>
          </div>

          {/* Forma de Pagamento */}
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">
               <CreditCard size={10} /> Pagamento
             </div>
             <select 
               onChange={(e) => e.target.value && onUpdate({ forma_pagamento: e.target.value })}
               className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-2 ring-blue-500/30 transition-all hover:bg-white/10 min-w-[140px] appearance-none"
               value=""
             >
               <option value="" disabled className="bg-slate-900">Alterar para...</option>
               {PAYMENT_METHODS.map(method => (
                 <option key={method} value={method} className="bg-slate-900">{method}</option>
               ))}
             </select>
          </div>
        </div>

        <div className="w-px h-10 bg-white/10 mx-1" />

        {/* Excluir e Cancelar */}
        <div className="flex items-center gap-2 pr-4 pl-2">
          <button 
            onClick={onDelete}
            className="flex items-center gap-2 px-5 py-3.5 bg-rose-500/10 hover:bg-rose-600 rounded-2xl transition-all text-rose-400 hover:text-white text-xs font-black uppercase tracking-widest active:scale-95 group"
          >
            <Trash2 size={16} className="group-hover:animate-bounce" />
            Excluir
          </button>

          <button 
            onClick={onClear}
            className="w-12 h-12 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
            title="Limpar Seleção"
          >
            <ChevronRight size={20} className="rotate-90 md:rotate-0" />
          </button>
        </div>
      </div>
    </div>
  )
}
