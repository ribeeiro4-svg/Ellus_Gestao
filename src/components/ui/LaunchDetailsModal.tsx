
import React from 'react'
import { X, Calendar, DollarSign, Tag, Info, CheckCircle2, CreditCard, User, Building2, TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Lancamento } from '@/lib/types'
import { fmtR, fmtData } from '@/lib/utils/formatters'

interface LaunchDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  launch: Lancamento | null
  associadoNome?: string
}

export default function LaunchDetailsModal({ isOpen, onClose, launch, associadoNome }: LaunchDetailsModalProps) {
  if (!isOpen || !launch) return null

  // Extrair taxa da descrição se existir
  const matchTaxa = (launch.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
  const valorTaxaNum = matchTaxa ? parseFloat(matchTaxa[1].replace('.', '').replace(',', '.')) : 0
  const valorPrincipal = launch.valor
  const valorBruto = valorPrincipal + valorTaxaNum

  const isReceita = launch.tipo === 'receita'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Premium Header Gradient */}
        <div className="relative h-32 bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] p-8 flex items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
              {isReceita ? <ArrowUpRight className="text-white" size={28} /> : <ArrowDownLeft className="text-white" size={28} />}
            </div>
            <div>
              <h2 className="text-white text-xl font-bold font-outfit leading-tight">Detalhes do Lançamento</h2>
              <div className="flex items-center gap-2 mt-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/10 w-fit">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{launch.tipo}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 backdrop-blur-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 pb-10">
          <div className="space-y-6">
            
            {/* Main Value Highlight */}
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Valor Final</span>
              <div className={`text-4xl font-black ${isReceita ? 'text-emerald-600' : 'text-rose-600'}`}>
                {fmtR(valorPrincipal)}
              </div>
              
              {isReceita && valorTaxaNum > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200/60 w-full flex flex-col gap-2">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-xs font-semibold text-gray-500">Valor Bruto:</span>
                    <span className="text-sm font-bold text-gray-700">{fmtR(valorBruto)}</span>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-xs font-semibold text-amber-500">(-) Taxa Operacional:</span>
                    <span className="text-sm font-bold text-amber-600">-{fmtR(valorTaxaNum)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-white hover:shadow-md group">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Calendar size={14} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Data</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{fmtData(launch.data)}</span>
              </div>

              <div className="flex flex-col gap-1 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-white hover:shadow-md group">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Tag size={14} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Categoria</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{launch.categoria || 'Sem categoria'}</span>
              </div>

              <div className="flex flex-col gap-1 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-white hover:shadow-md group">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={14} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Status</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${launch.status === 'pago' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-sm font-bold text-gray-800 uppercase text-[12px]">{launch.status === 'pago' ? 'Recebido' : 'Pendente'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-white hover:shadow-md group">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CreditCard size={14} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Pagamento</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{launch.forma_pagamento || 'Não informado'}</span>
              </div>
            </div>

            {/* Description & Entity */}
            <div className="space-y-4">
              <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-emerald-600">
                  <Info size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Descrição</span>
                </div>
                <p className="text-sm font-semibold text-gray-700 leading-relaxed italic">
                  "{launch.descricao?.replace(matchTaxa?.[0] || '', '').trim()}"
                </p>
              </div>

              {(launch.associado_id || associadoNome) && (
                <div className="p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100/50">
                  <div className="flex items-center gap-2 mb-2 text-emerald-600">
                    <User size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Vínculo com Associado</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                      {associadoNome?.charAt(0) || 'A'}
                    </div>
                    <span className="text-sm font-bold text-emerald-800">{associadoNome || 'Associado identificado'}</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
