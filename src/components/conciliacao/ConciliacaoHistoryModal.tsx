'use client'
import React from 'react'
import { X, History, ChevronRight, Calendar, FileText, Trash2 } from 'lucide-react'
import { fmtData, fmtHora } from '@/lib/utils/formatters'

interface ConciliacaoHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  history: any[]
  onSelect: (logs: any[]) => void
}

export default function ConciliacaoHistoryModal({ isOpen, onClose, history, onSelect }: ConciliacaoHistoryModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-[20px] flex items-center justify-center border border-white/30 shadow-inner">
              <History className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-white text-xl font-black font-outfit">Histórico de Relatórios</h2>
              <p className="text-indigo-100 text-xs font-bold opacity-80 uppercase tracking-widest mt-0.5">Conciliações Anteriores</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50">
          {history.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <FileText size={40} />
              </div>
              <p className="text-slate-400 font-bold italic">Nenhum relatório encontrado.</p>
            </div>
          ) : (
            history.map((item) => (
              <button 
                key={item.id}
                onClick={() => onSelect(item.logs)}
                className="w-full bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-50 transition-all text-left"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-700">{fmtData(item.data_processamento)}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{fmtHora(item.data_processamento)} • {item.logs.length} transações</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">
                    Ver Relatório
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-center shrink-0">
          <button 
            onClick={onClose}
            className="px-10 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black transition-all hover:text-slate-700 uppercase tracking-widest text-[11px]"
          >
            VOLTAR AO FINANCEIRO
          </button>
        </div>
      </div>
    </div>
  )
}
