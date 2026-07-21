'use client'
import React, { useState, useMemo } from 'react'
import { X, Search, User, CheckCircle2, ArrowLeft, ArrowRight, Calendar, DollarSign, Tag } from 'lucide-react'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { fmtR, fmtData } from '@/lib/utils/formatters'

interface ManualMatchModalProps {
  isOpen: boolean
  onClose: () => void
  extrato: any
  onSelect: (assoc: any, existingMatch?: any | any[]) => void
}

export default function ManualMatchModal({ isOpen, onClose, extrato, onSelect }: ManualMatchModalProps) {
  const { associados } = useAssociados()
  const { lancamentos } = useFinanceiro()
  const [search, setSearch] = useState('')
  const [selectedAssoc, setSelectedAssoc] = useState<any>(null)
  const [selectedProvisoes, setSelectedProvisoes] = useState<any[]>([])

  const toggleProvisao = (l: any) => {
    setSelectedProvisoes(prev => {
      if (prev.find(p => p.id === l.id)) {
        return prev.filter(p => p.id !== l.id)
      }
      return [...prev, l]
    })
  }

  const filtered = useMemo(() => {
    if (!search) return []
    const q = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    const cleanSearch = search.replace(/\D/g, '')
    return associados.filter(a => {
      const nome = a.nome ? a.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : ''
      if (nome.includes(q)) return true
      if (cleanSearch && a.cpf && a.cpf.replace(/\D/g, '').includes(cleanSearch)) return true
      return false
    }).slice(0, 10)
  }, [associados, search])

  const associadoLancamentos = useMemo(() => {
    if (!selectedAssoc || !extrato) return []
    const tipoDesejado = extrato.bank?.type === 'CREDIT' ? 'receita' : 'despesa'
    return lancamentos.filter(l => 
      l.associado_id === selectedAssoc.id && 
      l.status === 'aberto' && 
      l.tipo === tipoDesejado
    ).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  }, [selectedAssoc, lancamentos, extrato])

  const handleClose = () => {
    setSelectedAssoc(null)
    setSelectedProvisoes([])
    setSearch('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedAssoc && (
              <button 
                onClick={() => setSelectedAssoc(null)} 
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
                title="Voltar"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-black text-indigo-950 tracking-tight">
                {selectedAssoc ? 'Selecione a Provisão' : 'Vincular Associado'}
              </h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                {selectedAssoc ? `Associado: ${selectedAssoc.nome}` : 'Busque na base pelo nome ou documento'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-3 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-8 pt-4">
          {!selectedAssoc ? (
            <>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Digite o nome do associado..." 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {filtered.length > 0 ? (
                  filtered.map(assoc => (
                    <button 
                      key={assoc.id}
                      onClick={() => setSelectedAssoc(assoc)}
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 flex items-center justify-center transition-all">
                          <User size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-gray-800 uppercase group-hover:text-emerald-900 transition-colors">{assoc.nome}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">
                            {assoc.cpf || 'Sem Documento'}{assoc.email ? ` | ${assoc.email}` : ''}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))
                ) : search ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <Search size={32} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest text-center">Nenhum associado<br/>encontrado para "{search}"</p>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <User size={32} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest text-center">Comece a digitar para pesquisar</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-right-4 pb-20">
              <button 
                onClick={() => {
                  onSelect(selectedAssoc, null)
                  handleClose()
                }}
                className="flex items-center justify-center gap-2 w-full p-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-2xl transition-all group shadow-sm"
              >
                <div className="flex flex-col items-center">
                  <span className="text-xs font-black uppercase tracking-widest">Criar Novo Lançamento</span>
                  <span className="text-[10px] font-medium opacity-70">Não vincular a nenhuma provisão existente</span>
                </div>
              </button>

              {associadoLancamentos.length > 0 && (
                <div className="my-2 border-t border-gray-100 relative">
                  <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Ou selecione para vincular
                  </span>
                </div>
              )}

              {associadoLancamentos.map(l => {
                const isSelected = selectedProvisoes.some(p => p.id === l.id)
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleProvisao(l)}
                    className={`flex flex-col p-4 border rounded-2xl transition-all group text-left relative overflow-hidden ${
                      isSelected ? 'bg-emerald-50 border-emerald-400 shadow-sm' : 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`text-xs font-black uppercase leading-tight pr-8 ${isSelected ? 'text-emerald-900' : 'text-gray-800 group-hover:text-emerald-900'}`}>
                        {l.descricao}
                      </h3>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center absolute right-4 top-4 transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'}`}>
                        <CheckCircle2 size={14} className={`text-white transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`flex items-center gap-1 text-[10px] font-bold ${isSelected ? 'text-emerald-700' : 'text-gray-500'}`}>
                        <Calendar size={12} className={isSelected ? 'text-emerald-500' : 'text-gray-400'} />
                        Vence: {fmtData(l.data)}
                      </span>
                      <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg ${isSelected ? 'text-emerald-800 bg-emerald-200/50' : 'text-emerald-600 bg-emerald-50'}`}>
                        <DollarSign size={10} />
                        {fmtR(l.valor)}
                      </span>
                    </div>
                    {l.categoria && (
                      <div className={`mt-2 flex items-center gap-1 text-[9px] font-bold uppercase self-start px-2 py-0.5 rounded-md ${isSelected ? 'text-emerald-700 bg-emerald-100' : 'text-gray-400 bg-gray-50'}`}>
                        <Tag size={10} />
                        {l.categoria}
                      </div>
                    )}
                  </button>
                )
              })}

              {associadoLancamentos.length === 0 && (
                <div className="py-8 flex flex-col items-center justify-center text-gray-400 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Este associado não possui<br/>provisões em aberto.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé Fixo para Confirmação Múltipla */}
        {selectedAssoc && selectedProvisoes.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedProvisoes.length} ite{selectedProvisoes.length > 1 ? 'ns' : 'm'} selecionado{selectedProvisoes.length > 1 ? 's' : ''}</span>
                <span className="text-sm font-black text-emerald-600 flex items-center gap-1">
                  Total: {fmtR(selectedProvisoes.reduce((acc, curr) => acc + Number(curr.valor), 0))}
                </span>
                {extrato?.bank?.amount && (
                  <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                    Valor Banco: {fmtR(Math.abs(extrato.bank.amount))}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  onSelect(selectedAssoc, selectedProvisoes)
                  handleClose()
                }}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
              >
                Confirmar <ArrowRight size={16} />
              </button>
            </div>
          </div>
      </div>
    </div>
  )
}
