'use client'
import React, { useState, useMemo } from 'react'
import { X, Search, User, CheckCircle2 } from 'lucide-react'
import { useAssociados } from '@/lib/hooks/useAssociados'

interface ManualMatchModalProps {
  isOpen: boolean
  onClose: () => void
  extrato: any
  onSelect: (assoc: any) => void
}

export default function ManualMatchModal({ isOpen, onClose, extrato, onSelect }: ManualMatchModalProps) {
  const { associados } = useAssociados()
  const [search, setSearch] = useState('')

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-indigo-950 tracking-tight">Vincular Associado</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Busque na base pelo nome ou documento</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-8 pt-4">
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
                  onClick={() => onSelect(assoc)}
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
                  <CheckCircle2 size={18} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
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
        </div>
      </div>
    </div>
  )
}
