'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { X, Search, User, CheckCircle2, Calendar, DollarSign, AlertCircle, RefreshCw } from 'lucide-react'
import { fmtR, fmtData } from '@/lib/utils/formatters'

interface ManualLinkLancamentoModalProps {
  isOpen: boolean
  onClose: () => void
  bankItem: any
  associados: any[]
  lancamentos: any[]
  onSelect: (assoc: any, lancamento: any) => void
}

export default function ManualLinkLancamentoModal({ 
  isOpen, 
  onClose, 
  bankItem, 
  associados, 
  lancamentos,
  onSelect 
}: ManualLinkLancamentoModalProps) {
  const [search, setSearch] = useState('')
  const [selectedAssoc, setSelectedAssoc] = useState<any>(null)
  const [loadingEntries, setLoadingEntries] = useState(false)

  // Filtro de associados
  const filteredAssocs = useMemo(() => {
    if (!search) return []
    return associados.filter(a => 
      a.nome.toLowerCase().includes(search.toLowerCase()) || 
      (a.cpf && a.cpf.includes(search))
    ).slice(0, 10)
  }, [associados, search])

  // Lançamentos em aberto do associado selecionado (sem filtro de data)
  const openEntries = useMemo(() => {
    if (!selectedAssoc) return []
    return lancamentos.filter(l => 
      l.associado_id === selectedAssoc.id && 
      (l.status === 'aberto' || l.status === 'atrasado') &&
      !l.conciliado
    ).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  }, [selectedAssoc, lancamentos])

  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      setSelectedAssoc(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-8 pb-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Vincular Lançamento Manual</h2>
              <p className="text-xs font-bold text-indigo-100 opacity-80 uppercase tracking-widest mt-1">Localize o associado e a mensalidade em aberto</p>
            </div>
            <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10">
              <X size={20} />
            </button>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <RefreshCw className="text-white" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Transação Bancária</p>
              <p className="text-sm font-bold truncate max-w-[400px]">{bankItem?.bank?.memo}</p>
              <p className="text-xs font-black text-indigo-100">{fmtData(bankItem?.bank?.date)} | {fmtR(Math.abs(bankItem?.bank?.amount))}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50">
          
          {!selectedAssoc ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Buscar associado pelo nome ou CPF..." 
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                {filteredAssocs.length > 0 ? (
                  filteredAssocs.map(assoc => (
                    <button 
                      key={assoc.id}
                      onClick={() => setSelectedAssoc(assoc)}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 flex items-center justify-center transition-all">
                          <User size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-gray-800 uppercase">{assoc.nome}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">
                            {assoc.cpf || 'Sem Documento'}{assoc.email ? ` | ${assoc.email}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black opacity-0 group-hover:opacity-100 transition-all">SELECIONAR</div>
                    </button>
                  ))
                ) : search ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Search size={32} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest text-center">Nenhum associado encontrado</p>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                    <User size={32} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest text-center">Pesquise para listar os lançamentos</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              {/* Associado Selecionado */}
              <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-indigo-900 uppercase">{selectedAssoc.nome}</p>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase">
                      {selectedAssoc.cpf || 'Sem Documento'}{selectedAssoc.email ? ` | ${selectedAssoc.email}` : ''}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAssoc(null)}
                  className="px-3 py-1.5 bg-white text-indigo-600 rounded-xl text-[9px] font-black border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                >
                  ALTERAR
                </button>
              </div>

              {/* Lista de Lançamentos em Aberto */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lançamentos em Aberto / Atrasados</h3>
                  <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{openEntries.length} Encontrados</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {openEntries.length > 0 ? (
                    openEntries.map(l => (
                      <button 
                        key={l.id}
                        onClick={() => onSelect(selectedAssoc, l)}
                        className="flex flex-col gap-3 p-5 bg-white border border-gray-200 rounded-3xl hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 flex items-center justify-center transition-all">
                              <Calendar size={14} />
                            </div>
                            <span className="text-xs font-black text-gray-700">{fmtData(l.data)}</span>
                          </div>
                          <span className={`text-sm font-black ${l.status === 'atrasado' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {fmtR(l.valor)}
                          </span>
                        </div>
                        
                        <div className="text-left">
                          <p className="text-xs font-bold text-gray-800 uppercase leading-tight">"{l.descricao}"</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-1">{l.categoria}</p>
                        </div>

                        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all">
                          <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-emerald-200">
                            <CheckCircle2 size={12} /> VINCULAR ESTE
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                      <AlertCircle size={32} className="mb-2 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest text-center">Nenhuma mensalidade em aberto<br/>para este associado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
          <p className="text-[10px] font-bold text-gray-400 italic max-w-[300px]">
            * Vincular a um lançamento de outro mês criará automaticamente uma nota de conciliação.
          </p>
          <button 
            onClick={onClose}
            className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all"
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  )
}
