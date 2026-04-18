'use client'
import React, { useState } from 'react'
import { 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Store, 
  ArrowRight, 
  Eye, 
  Ghost,
  ShieldCheck,
  Zap,
  Tag,
  Calendar,
  DollarSign,
  Edit2,
  XCircle,
  Link as LinkIcon
} from 'lucide-react'
import { fmtR, fmtData } from '@/lib/utils/formatters'

interface MatchItemProps {
  bank: any
  assocMatch?: any
  forMatch?: any
  suggestedCategory?: string
  onLinkManual?: () => void
  onLinkSupplier?: () => void
  onIgnore?: () => void
  onEditMemo?: (newMemo: string) => void
  isIgnored?: boolean
  isDuplicate?: boolean
  isCora?: boolean
}

export default function MatchItem({ 
  bank, 
  assocMatch, 
  forMatch, 
  suggestedCategory,
  onLinkManual,
  onLinkSupplier,
  onIgnore,
  onEditMemo,
  isIgnored,
  isDuplicate,
  isCora
}: MatchItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localMemo, setLocalMemo] = useState(bank.memo)

  const isIncome = bank.type === 'CREDIT'
  const hasMatch = !!(assocMatch || forMatch)

  const handleSaveMemo = () => {
    onEditMemo?.(localMemo)
    setIsEditing(false)
  }

  return (
    <div className={`relative flex flex-col md:flex-row items-stretch gap-6 p-5 rounded-[32px] border transition-all duration-300 ${
      isDuplicate ? 'bg-gray-50/50 border-gray-100 opacity-60' :
      isIgnored ? 'bg-red-50/30 border-red-100 opacity-70' :
      hasMatch ? 'bg-emerald-50/20 border-emerald-100/50 hover:border-emerald-200' : 
      'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'
    }`}>
      
      {/* Coluna Banco */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {isIncome ? <DollarSign size={14} /> : <DollarSign size={14} className="rotate-180" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Transação Bancária {isCora && '(CORA API)'}</span>
          {isDuplicate && <span className="text-[10px] font-black bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">JÁ LANÇADO</span>}
        </div>

        <div className="flex flex-col">
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <input 
                autoFocus
                value={localMemo}
                onChange={(e) => setLocalMemo(e.target.value)}
                onBlur={handleSaveMemo}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveMemo()}
                className="w-full bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1 text-sm font-bold text-indigo-900 outline-none"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
              <h4 className="text-sm font-black text-gray-800 leading-tight uppercase">{localMemo}</h4>
              <Edit2 size={12} className="text-gray-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
          )}
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500"><Calendar size={12} /> {fmtData(bank.date)}</span>
            <span className={`text-sm font-black ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>{isIncome ? '+' : '-'}{fmtR(Math.abs(bank.amount))}</span>
            {bank.metodo_inferido && (
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Zap size={10} className="fill-indigo-600" /> {bank.metodo_inferido}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Seta Central */}
      <div className="hidden md:flex items-center justify-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasMatch ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-gray-100 text-gray-400'}`}>
          <ArrowRight size={18} strokeWidth={3} />
        </div>
      </div>

      {/* Coluna Sistema */}
      <div className={`flex-1 flex flex-col gap-3 p-4 rounded-2xl border ${
        hasMatch ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50/50 border-gray-200 border-dashed'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {assocMatch ? <User size={14} className="text-emerald-600" /> : forMatch ? <Store size={14} className="text-emerald-600" /> : <Ghost size={14} className="text-gray-400" />}
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Vínculo no Sistema</span>
          </div>
          {hasMatch && <CheckCircle2 size={16} className="text-emerald-500" />}
        </div>

        {hasMatch ? (
          <div className="flex flex-col">
            <h4 className="text-sm font-black text-emerald-900 uppercase">
              {assocMatch?.nome || forMatch?.nome}
              {forMatch?.isDirector && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg">DIRETORIA</span>}
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600/70"><Tag size={12} /> {suggestedCategory}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">Nenhum vínculo encontrado</span>
            <div className="flex items-center gap-2">
               <button onClick={onLinkManual} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-[10px] font-black hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                  <User size={12} /> + ASSOCIADO
               </button>
               <button onClick={onLinkSupplier} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-[10px] font-black hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                  <Store size={12} /> + FORNECEDOR
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Ações Laterais */}
      <div className="flex md:flex-col items-center justify-center gap-2">
        {!isDuplicate && (
          <button 
            onClick={onIgnore}
            title={isIgnored ? "Remover ignorado" : "Ignorar esta transação"}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
              isIgnored ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            {isIgnored ? <XCircle size={18} /> : <Trash2 size={18} />}
          </button>
        )}
      </div>

    </div>
  )
}
