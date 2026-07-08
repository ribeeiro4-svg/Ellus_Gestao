'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { X, Search, Store, CheckCircle2, UserCheck, Plus, ArrowLeft, ArrowRight, Calendar, DollarSign, Tag } from 'lucide-react'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import CrudModal from '@/components/ui/CrudModal'
import SupplierCreateModal from './SupplierCreateModal'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { fmtR, fmtData } from '@/lib/utils/formatters'

interface SupplierMatchModalProps {
  isOpen: boolean
  onClose: () => void
  extrato: any
  onSelect: (sup: any, existingMatch?: any) => void
  fornecedores: any[]
  inserir: (data: any) => Promise<any>
}

export default function SupplierMatchModal({ isOpen, onClose, extrato, onSelect, fornecedores, inserir }: SupplierMatchModalProps) {
  const { diretoria } = useDiretoria()
  const { lancamentos } = useFinanceiro()
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedSup, setSelectedSup] = useState<any>(null)

  const handleSalvarNovo = (sup: any) => {
    onSelect(sup, null)
    onClose()
  }

  const allItems = useMemo(() => {
    const list = [...fornecedores]
    diretoria.forEach(d => list.push({ ...d, isDirector: true } as any))
    return list
  }, [fornecedores, diretoria])

  const filtered = useMemo(() => {
    if (!search) return []
    const q = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    const cleanSearch = search.replace(/\D/g, '')
    return allItems.filter(f => {
      const nome = f.nome ? f.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : ''
      if (nome.includes(q)) return true
      if (cleanSearch && f.cpf_cnpj && f.cpf_cnpj.replace(/\D/g, '').includes(cleanSearch)) return true
      return false
    }).slice(0, 10)
  }, [allItems, search])

  const supplierLancamentos = useMemo(() => {
    if (!selectedSup || !extrato) return []
    const tipoDesejado = extrato.bank?.type === 'CREDIT' ? 'receita' : 'despesa'
    return lancamentos.filter(l => 
      ((selectedSup.isDirector && l.diretor_id === selectedSup.id) || 
      (!selectedSup.isDirector && l.fornecedor_id === selectedSup.id)) && 
      l.status === 'aberto' && 
      l.tipo === tipoDesejado
    ).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  }, [selectedSup, lancamentos, extrato])

  const extractedDoc = useMemo(() => {
    const memo = extrato?.bank?.memo || ''
    const match = memo.match(/(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})|(\d{3}\.?\d{3}\.?\d{3}-?\d{2})|(\d{14})|(\d{11})/)
    return match ? match[0] : ''
  }, [extrato])

  const handleClose = () => {
    setSelectedSup(null)
    setSearch('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedSup && (
              <button 
                onClick={() => setSelectedSup(null)} 
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
                title="Voltar"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-black text-indigo-950 tracking-tight">
                {selectedSup ? 'Selecione a Provisão' : 'Vincular Fornecedor/Diretor'}
              </h2>
              {!selectedSup && (
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Busque na base pelo nome ou documento</p>
                  <span className="text-gray-300 hidden sm:inline">•</span>
                  <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors flex items-center gap-1 whitespace-nowrap"
                  >
                    <Plus size={10} strokeWidth={4} />
                    Novo Fornecedor
                  </button>
                </div>
              )}
              {selectedSup && (
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Fornecedor/Diretor: {selectedSup.nome}
                </p>
              )}
            </div>
          </div>
          <button onClick={handleClose} className="p-3 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-8 pt-4">
          {!selectedSup ? (
            <>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Digite o nome..." 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {filtered.length > 0 ? (
                  filtered.map((item: any) => (
                    <button 
                      key={item.id}
                      onClick={() => setSelectedSup(item)}
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                           item.isDirector ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                        }`}>
                          {item.isDirector ? <UserCheck size={18} /> : <Store size={18} />}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-gray-800 uppercase group-hover:text-indigo-900 transition-colors">{item.nome}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">
                            {item.isDirector ? 'DIRETORIA' : (item.cpf_cnpj || 'Sem Documento')}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))
                ) : search ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <Search size={32} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest text-center">Nenhum fornecedor<br/>encontrado para "{search}"</p>
                    <button 
                      onClick={() => setIsCreateOpen(true)}
                      className="mt-6 px-6 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[2px] rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                    >
                      Cadastrar Agora
                    </button>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <Store size={32} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest text-center">Comece a digitar para pesquisar</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-right-4">
              <button 
                onClick={() => {
                  onSelect(selectedSup, null)
                  handleClose()
                }}
                className="flex items-center justify-center gap-2 w-full p-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-2xl transition-all group shadow-sm"
              >
                <div className="flex flex-col items-center">
                  <span className="text-xs font-black uppercase tracking-widest">Criar Novo Lançamento</span>
                  <span className="text-[10px] font-medium opacity-70">Não vincular a nenhuma provisão existente</span>
                </div>
              </button>

              {supplierLancamentos.length > 0 && (
                <div className="my-2 border-t border-gray-100 relative">
                  <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Ou vincule a um existente
                  </span>
                </div>
              )}

              {supplierLancamentos.map(l => (
                <button
                  key={l.id}
                  onClick={() => {
                    onSelect(selectedSup, l)
                    handleClose()
                  }}
                  className="flex flex-col p-4 bg-white border border-gray-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group text-left relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-black text-gray-800 uppercase leading-tight pr-6 group-hover:text-indigo-900">{l.descricao}</h3>
                    <CheckCircle2 size={16} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-all absolute right-4 top-4" />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                      <Calendar size={12} className="text-gray-400" />
                      Vence: {fmtData(l.data)}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                      <DollarSign size={10} />
                      {fmtR(l.valor)}
                    </span>
                  </div>
                  {l.categoria && (
                    <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase bg-gray-50 self-start px-2 py-0.5 rounded-md">
                      <Tag size={10} />
                      {l.categoria}
                    </div>
                  )}
                </button>
              ))}

              {supplierLancamentos.length === 0 && (
                <div className="py-8 flex flex-col items-center justify-center text-gray-400 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Este {selectedSup.isDirector ? 'diretor' : 'fornecedor'} não possui<br/>provisões em aberto.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SupplierCreateModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleSalvarNovo}
        memo={extrato?.bank?.memo}
        inserir={inserir}
      />
    </div>
  )
}
