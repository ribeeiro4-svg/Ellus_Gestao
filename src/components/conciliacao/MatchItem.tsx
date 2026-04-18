'use client'
import React, { useState } from 'react'
import { 
  CheckCircle2, 
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
  Search,
  RefreshCw,
  Trash2
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
  isAdesao?: boolean
  isIgnored?: boolean
  isDuplicate?: boolean
  isCora?: boolean;
  isProcessed?: boolean;
  externalAuditInvoices?: any[];
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
  isCora,
  isAdesao,
  isProcessed,
  externalAuditInvoices
}: MatchItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localMemo, setLocalMemo] = useState(bank.memo)
  const [isAuditing, setIsAuditing] = useState(false)
  const [internalInvoices, setInternalInvoices] = useState<any[]>([])

  const coraInvoices = externalAuditInvoices || internalInvoices

  const isIncome = bank.type === 'CREDIT'
  const hasMatch = !!(assocMatch || forMatch)
  const targetCpf = assocMatch?.cpf || bank.documento

  const handleAuditCora = async () => {
    if (!targetCpf) return alert('CPF/CNPJ não identificado para auditoria.')
    setIsAuditing(true)
    try {
      const resp = await fetch(`/api/cora/audit/invoices?cpf=${targetCpf.replace(/\D/g, '')}`)
      const data = await resp.json()
      if (data.success) setInternalInvoices(data.invoices)
      else alert(`Erro auditoria: ${data.error}`)
    } catch (e) {
      alert('Falha ao conectar com serviço de auditoria.')
    } finally { setIsAuditing(false) }
  }

  const handleSaveMemo = () => {
    onEditMemo?.(localMemo)
    setIsEditing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200'
      case 'OPEN': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'PAID': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className={`relative flex flex-col gap-4 p-5 rounded-[32px] border transition-all duration-300 ${
      isDuplicate ? 'bg-gray-50/50 border-gray-100 opacity-60' :
      isIgnored ? 'bg-red-50/30 border-red-100 opacity-70' :
      hasMatch ? 'bg-emerald-50/20 border-emerald-100/50 hover:border-emerald-200' : 
      'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'
    }`}>
      
      <div className="flex flex-col md:flex-row items-stretch gap-6">
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
              <div className="flex items-start gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                <h4 className="text-sm font-black text-gray-800 leading-tight uppercase whitespace-normal break-words">{localMemo}</h4>
                <Edit2 size={12} className="text-gray-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5" />
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
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isProcessed ? 'bg-indigo-600 text-white scale-110 shadow-xl' :
            hasMatch ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 
            'bg-gray-100 text-gray-400'
          }`}>
            {isProcessed ? <ShieldCheck size={20} /> : <ArrowRight size={18} strokeWidth={3} />}
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
            <div className="flex items-center gap-2">
              {hasMatch && <CheckCircle2 size={16} className="text-emerald-500" />}
              {targetCpf && !isAuditing && !isDuplicate && (
                <button 
                  onClick={handleAuditCora}
                  className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
                >
                  <Search size={10} /> AUDITAR COBRANÇAS
                </button>
              )}
              {isAuditing && <RefreshCw size={12} className="animate-spin text-indigo-600" />}
            </div>
          </div>

          {hasMatch ? (
            <div className="flex flex-col">
              <h4 className="text-sm font-black text-emerald-900 uppercase whitespace-normal break-words">
                {assocMatch?.nome || forMatch?.nome}
                {forMatch?.isDirector && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg">DIRETORIA</span>}
              </h4>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600/70"><Tag size={12} /> {suggestedCategory}</span>
                {isAdesao && (
                  <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <Zap size={10} className="fill-white" /> 1º PAGAMENTO (ADESÃO)
                  </span>
                )}
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

      {/* Painel de Auditoria Cora descritivo */}
      {coraInvoices.length > 0 && (
        <div className="mt-2 p-4 bg-indigo-50/50 rounded-[24px] border border-indigo-100 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw size={14} className="text-indigo-600" />
            <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Cobranças Localizadas na Cora</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {coraInvoices.map((inv) => (
              <div key={inv.id} className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-indigo-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400">#{inv.code}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${getStatusColor(inv.status)}`}>
                    {inv.status === 'OVERDUE' ? 'ATRASADO' : inv.status === 'OPEN' ? 'PENDENTE' : inv.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-900">{fmtR(inv.amount)}</span>
                  <span className="text-[10px] font-bold text-gray-500">Vence: {fmtData(inv.dueDate)}</span>
                </div>
                <a 
                  href={inv.pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black hover:bg-indigo-700 transition-all"
                >
                  <Eye size={12} /> DOWNLOAD PDF
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
