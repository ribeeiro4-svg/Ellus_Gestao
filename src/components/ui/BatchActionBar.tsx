'use client'
import React from 'react'
import { Trash2, CheckCircle2, XCircle, CreditCard, Layers, Bookmark, ChevronRight, Calendar, Target, ArrowUpCircle, ArrowDownCircle, AlertCircle, ArrowDownUp, FileCheck } from 'lucide-react'
import { MESES } from '@/lib/utils/formatters'

interface BatchActionBarProps {
  selectedCount: number
  onDelete?: () => void
  onUpdate?: (data: any) => void
  onClear: () => void
  categories: { id: string; nome: string }[]
  planoContas?: { id: string; codigo: string; descricao: string }[]
  contas?: { id: string; nome: string }[]
  onInvertType?: () => void
  onReconciliar?: () => void
  onDownloadInvoice?: () => void
}

const PAYMENT_METHODS = ['PIX', 'Boleto', 'Dinheiro', 'Transferência']

export default function BatchActionBar({ 
  selectedCount, 
  onDelete, 
  onUpdate, 
  onClear,
  categories,
  planoContas,
  contas,
  onInvertType,
  onReconciliar
}: BatchActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="w-full mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="bg-slate-900 text-white p-1.5 rounded-2xl shadow-xl border border-white/10 flex items-center gap-1.5 w-full overflow-x-auto no-scrollbar">
        
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

        {/* Ações Rápidas de Status */}
        {onUpdate && (
          <div className="flex items-center gap-0.5 px-1">
            <button 
              onClick={() => onUpdate?.({ status: 'pago' })}
              className="group flex flex-col items-center justify-center w-12 h-12 hover:bg-emerald-500/10 rounded-xl transition-all text-emerald-400 hover:scale-105 active:scale-95"
              title="Marcar como Pago"
            >
              <CheckCircle2 size={18} />
            </button>
            
            <button 
              onClick={() => onUpdate?.({ status: 'aberto' })}
              className="group flex flex-col items-center justify-center w-12 h-12 hover:bg-amber-500/10 rounded-xl transition-all text-amber-400 hover:scale-105 active:scale-95"
              title="Marcar como Aberto"
            >
              <XCircle size={18} />
            </button>

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

        <div className="w-px h-8 bg-white/10 mx-0.5" />

        {/* Seletores Massivos */}
        <div className="flex items-center gap-2 px-2">
          {/* Categoria */}
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-white/30 ml-1">
               <Bookmark size={9} /> Cat.
             </div>
             <select 
               onChange={(e) => e.target.value && onUpdate?.({ categoria: e.target.value })}
               className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none focus:ring-2 ring-blue-500/30 transition-all hover:bg-white/10 min-w-[110px] appearance-none cursor-pointer"
               value=""
             >
               <option value="" disabled className="bg-slate-900">Alterar...</option>
               {categories.map(cat => (
                 <option key={cat.id} value={cat.nome} className="bg-slate-900">{cat.nome}</option>
               ))}
             </select>
          </div>

           {/* Forma de Pagamento */}
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-white/30 ml-1">
               <CreditCard size={9} /> Pagto
             </div>
             <select 
               onChange={(e) => e.target.value && onUpdate?.({ forma_pagamento: e.target.value })}
               className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none focus:ring-2 ring-blue-500/30 transition-all hover:bg-white/10 min-w-[110px] appearance-none cursor-pointer"
               value=""
             >
               <option value="" disabled className="bg-slate-900">Alterar...</option>
               {PAYMENT_METHODS.map(method => (
                 <option key={method} value={method} className="bg-slate-900">{method}</option>
               ))}
             </select>
          </div>

          {/* Status Cobrança */}
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-white/30 ml-1">
               <Layers size={9} /> Cobr.
             </div>
             <select 
               onChange={(e) => onUpdate?.({ status_cobranca: e.target.value })}
               className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none focus:ring-2 ring-blue-500/30 transition-all hover:bg-white/10 min-w-[110px] appearance-none cursor-pointer"
               value=""
             >
               <option value="" disabled className="bg-slate-900">Alterar...</option>
               <option value="" className="bg-slate-900 italic">Nenhum</option>
               <option value="EM COBRANÇA" className="bg-slate-900 font-bold text-orange-400">EM COBRANÇA</option>
               <option value="NEGOCIADO" className="bg-slate-900 font-bold text-violet-400">NEGOCIADO</option>
             </select>
          </div>

          <div className="w-px h-8 bg-white/10 mx-0.5" />

          {/* Data de Vencimento */}
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-white/30 ml-1">
               <Calendar size={9} /> Venc.
             </div>
             <input 
               type="number"
               min="1"
               max="31"
               placeholder="Dia"
               onChange={(e) => e.target.value && onUpdate?.({ vencimento_dia_bulk: parseInt(e.target.value) })}
               className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none focus:ring-2 ring-blue-500/30 transition-all hover:bg-white/10 min-w-[50px] [appearance:textfield]"
             />
          </div>

          {/* Competência */}
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-white/30 ml-1">
               <Target size={9} /> Comp.
             </div>
             <div className="flex gap-1">
                <select 
                  onChange={(e) => e.target.value && onUpdate?.({ competencia_mes: parseInt(e.target.value) })}
                  className="bg-white/5 border border-white/10 rounded-lg px-1.5 py-1.5 text-[9px] font-bold text-white outline-none focus:ring-2 ring-blue-500/30 transition-all hover:bg-white/10 appearance-none min-w-[50px] cursor-pointer"
                  value=""
                >
                  <option value="" disabled className="bg-slate-900">Mês</option>
                  {MESES.map((m, idx) => (
                    <option key={m} value={idx} className="bg-slate-900">{m}</option>
                  ))}
                </select>
                <select 
                  onChange={(e) => e.target.value && onUpdate?.({ competencia_ano: parseInt(e.target.value) })}
                  className="bg-white/5 border border-white/10 rounded-lg px-1.5 py-1.5 text-[9px] font-bold text-white outline-none focus:ring-2 ring-blue-500/30 transition-all hover:bg-white/10 appearance-none min-w-[55px] cursor-pointer"
                  value=""
                >
                  <option value="" disabled className="bg-slate-900">Ano</option>
                  {[2024, 2025, 2026, 2027].map(year => (
                    <option key={year} value={year} className="bg-slate-900">{year}</option>
                  ))}
                </select>
              </div>
           </div>
          
          {/* Conta Bancária */}
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-white/30 ml-1">
               <Bookmark size={9} className="text-indigo-400" /> Banco
             </div>
             <select 
               onChange={(e) => e.target.value && onUpdate?.({ conta_id: e.target.value })}
               className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none focus:ring-2 ring-indigo-500/30 transition-all hover:bg-white/10 min-w-[110px] appearance-none cursor-pointer"
               value=""
             >
               <option value="" disabled className="bg-slate-900">Alterar...</option>
               {contas?.map(c => (
                 <option key={c.id} value={c.id} className="bg-slate-900">{c.nome}</option>
               ))}
             </select>
          </div>

          <div className="w-px h-8 bg-white/10 mx-0.5" />

           {/* Conta Débito */}
           <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-white/30 ml-1">
                <ArrowUpCircle size={9} /> Déb. Contábil
              </div>
              <select 
                onChange={(e) => onUpdate?.({ conta_debito_id: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none focus:ring-2 ring-emerald-500/30 transition-all hover:bg-white/10 min-w-[110px] appearance-none cursor-pointer"
                value=""
              >
                <option value="" disabled className="bg-slate-900">Alterar...</option>
                <option value="" className="bg-slate-900 italic">Automático</option>
                {planoContas?.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900">{p.codigo} - {p.descricao}</option>
                ))}
              </select>
           </div>

           {/* Conta Crédito */}
           <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-white/30 ml-1">
                <ArrowDownCircle size={9} /> Créd. Contábil
              </div>
              <select 
                onChange={(e) => onUpdate?.({ conta_credito_id: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white outline-none focus:ring-2 ring-rose-500/30 transition-all hover:bg-white/10 min-w-[110px] appearance-none cursor-pointer"
                value=""
              >
                <option value="" disabled className="bg-slate-900">Alterar...</option>
                <option value="" className="bg-slate-900 italic">Automático</option>
                {planoContas?.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900">{p.codigo} - {p.descricao}</option>
                ))}
              </select>
           </div>
        </div>

        <div className="w-px h-8 bg-white/10 mx-0.5" />

        {/* Excluir e Cancelar */}
        <div className="flex items-center gap-1.5 pr-2 pl-1">
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
            className="w-10 h-10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            title="Limpar Seleção"
          >
            <ChevronRight size={18} className="rotate-90 md:rotate-0" />
          </button>
        </div>
      </div>
    </div>
  )
}
