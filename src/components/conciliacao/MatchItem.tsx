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
  Trash2,
  AlertCircle
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
  memo?: string;
  category?: string;
  allCategories?: any[];
  onEditCategory?: (newCat: string) => void;
  warning?: string;
  existingMatch?: any;
  onSearchEntries?: () => void;
  onClearMatch?: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
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
  externalAuditInvoices,
  memo,
  category,
  allCategories,
  onEditCategory,
  warning,
  existingMatch,
  onSearchEntries,
  onClearMatch,
  isSelected,
  onToggleSelect
}: MatchItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localMemo, setLocalMemo] = useState(memo || bank.memo)
  const [isAuditing, setIsAuditing] = useState(false)
  const [internalInvoices, setInternalInvoices] = useState<any[]>([])

  // Sincroniza estado local se o valor externo mudar (ex: via modal de fornecedor)
  React.useEffect(() => {
    if (memo) setLocalMemo(memo)
  }, [memo])

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
      hasMatch ? (isIncome ? 'bg-emerald-50/20 border-emerald-100/50 hover:border-emerald-200' : 'bg-rose-50/20 border-rose-100/50 hover:border-rose-200') : 
      'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'
    }`}>
      
      <div className="flex flex-col md:flex-row items-stretch gap-6">
        {onToggleSelect && (
          <div className="flex items-center justify-center -mr-2">
            <input 
              type="checkbox" 
              checked={isSelected} 
              onChange={onToggleSelect} 
              className={`w-5 h-5 rounded cursor-pointer transition-all ${isIncome ? 'border-emerald-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-500' : 'border-rose-300 text-rose-600 focus:ring-rose-500 accent-rose-500'}`}
            />
          </div>
        )}
        
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
              <div className="flex flex-col gap-1 mt-1">
                <input 
                  autoFocus
                  value={localMemo}
                  onChange={(e) => setLocalMemo(e.target.value)}
                  onBlur={handleSaveMemo}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveMemo()}
                  className="w-full bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1 text-sm font-bold text-indigo-900 outline-none"
                />
                <span className="text-[9px] text-gray-400 font-bold uppercase leading-tight flex items-center gap-1">
                  <AlertCircle size={8} /> Extrato Original: {bank.memo}
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                <div className="flex flex-col">
                  <h4 className="text-sm font-black text-gray-800 leading-tight uppercase whitespace-normal break-words">{localMemo}</h4>
                  <span className="text-[9px] text-gray-400 font-bold uppercase mt-1 leading-tight flex items-center gap-1">
                    <AlertCircle size={8} /> Extrato Original: {bank.memo}
                  </span>
                </div>
                <div className="p-1 rounded-md bg-indigo-50 text-indigo-500 opacity-40 group-hover:opacity-100 transition-all shrink-0">
                  <Edit2 size={10} />
                </div>
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
            hasMatch ? (isIncome ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-rose-500 text-white shadow-lg shadow-rose-200') : 
            'bg-gray-100 text-gray-400'
          }`}>
            {isProcessed ? <ShieldCheck size={20} /> : <ArrowRight size={18} strokeWidth={3} />}
          </div>
        </div>

        {/* Coluna Sistema */}
        <div className={`flex-1 flex flex-col gap-3 p-4 rounded-2xl border ${
          hasMatch ? (isIncome ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100') : 'bg-gray-50/50 border-gray-200 border-dashed'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {assocMatch ? <User size={14} className={isIncome ? "text-emerald-600" : "text-rose-600"} /> : forMatch ? <Store size={14} className={isIncome ? "text-emerald-600" : "text-rose-600"} /> : <Ghost size={14} className="text-gray-400" />}
              <span className={`text-[10px] font-black uppercase tracking-widest ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>Vínculo no Sistema</span>
            </div>
            <div className="flex items-center gap-2">
              {hasMatch && <CheckCircle2 size={16} className={isIncome ? "text-emerald-500" : "text-rose-500"} />}
              {targetCpf && !isAuditing && !isDuplicate && (
                <button 
                  onClick={handleAuditCora}
                  className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
                >
                  <Search size={10} /> AUDITAR COBRANÇAS
                </button>
              )}
              {hasMatch && !isDuplicate && !isProcessed && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={isIncome ? onLinkManual : onLinkSupplier}
                    className={`flex items-center gap-1 px-3 py-1 text-white rounded-lg text-[9px] font-black shadow-sm transition-all active:scale-95 ${isIncome ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                  >
                    <Search size={10} /> BUSCAR NO SISTEMA
                  </button>
                  <button 
                    onClick={onClearMatch}
                    title="Limpar Vínculo"
                    className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 shadow-sm transition-all active:scale-95"
                  >
                    <Trash2 size={12} strokeWidth={3} />
                  </button>
                </div>
              )}
              {!hasMatch && !isDuplicate && !isProcessed && (
                 <button 
                  onClick={isIncome ? onLinkManual : onLinkSupplier}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-lg text-[9px] font-black hover:bg-gray-700 shadow-sm transition-all active:scale-95"
                >
                  <Search size={10} /> VINCULAR MANUAL
                </button>
              )}
              {isAuditing && <RefreshCw size={12} className="animate-spin text-indigo-600" />}
            </div>
          </div>

          {hasMatch ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h4 className={`text-sm font-black uppercase whitespace-normal break-words ${isIncome ? 'text-emerald-900' : 'text-rose-900'}`}>
                  {assocMatch?.nome || forMatch?.nome}
                  {forMatch?.isDirector && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg">DIRETORIA</span>}
                </h4>
                {!isProcessed && (
                  <button 
                    onClick={assocMatch ? onLinkSupplier : onLinkManual}
                    title={assocMatch ? "Mudar para Fornecedor" : "Mudar para Associado"}
                    className={`p-1.5 rounded-lg transition-all active:scale-95 ${isIncome ? 'bg-emerald-100/50 text-emerald-600 hover:bg-emerald-200' : 'bg-rose-100/50 text-rose-600 hover:bg-rose-200'}`}
                  >
                    <RefreshCw size={12} strokeWidth={3} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${isIncome ? 'bg-emerald-100/50 border-emerald-200/50' : 'bg-rose-100/50 border-rose-200/50'}`}>
                  <Tag size={10} className={isIncome ? 'text-emerald-700' : 'text-rose-700'} />
                  <select 
                    value={category || (suggestedCategory ? `suggested_${suggestedCategory}` : '')} 
                    onChange={(e) => {
                      const val = e.target.value.replace('suggested_', '');
                      onEditCategory?.(val);
                    }}
                    disabled={isProcessed}
                    className={`bg-transparent border-none p-0 text-[11px] font-bold focus:ring-0 cursor-pointer outline-none capitalize ${isIncome ? 'text-emerald-800' : 'text-rose-800'}`}
                  >
                    <option value="" disabled>Selecionar Categoria</option>
                    {!category && suggestedCategory && (
                      <option value={`suggested_${suggestedCategory}`}>
                        {suggestedCategory} (Sugerido)
                      </option>
                    )}
                    {(allCategories || []).map((cat: any) => (
                      <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                    ))}
                    {category && !allCategories?.some(c => c.nome === category) && (
                      <option value={category}>{category}</option>
                    )}
                  </select>
                </div>
                {isAdesao && (
                  <span className={`text-[9px] font-black text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    <Zap size={10} className="fill-white" /> 1º PAGAMENTO (ADESÃO)
                  </span>
                )}
              </div>
              {warning && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 animate-bounce">
                  <RefreshCw size={12} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[10px] font-black text-amber-700 leading-tight uppercase">{warning}</p>
                </div>
              )}

              {/* Detalhes do Lançamento Existente no Financeiro */}
              {existingMatch && (
                <div className={`mt-3 p-3 rounded-xl border space-y-2 ${isIncome ? 'bg-emerald-100/30 border-emerald-200/30' : 'bg-rose-100/30 border-rose-200/30'}`}>
                  <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest opacity-70 ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <AlertCircle size={10} /> Cadastro Original no Financeiro
                  </div>
                  <div className="space-y-1">
                    <p className={`text-[11px] font-bold leading-tight ${isIncome ? 'text-emerald-900' : 'text-rose-900'}`}>
                      "{existingMatch.descricao}"
                    </p>
                    <div className="flex items-center gap-3">
                       <span className={`text-[10px] font-medium ${isIncome ? 'text-emerald-700/70' : 'text-rose-700/70'}`}>
                        Vencimento: <span className="font-black">{fmtData(existingMatch.data)}</span>
                       </span>
                       <span className={`text-[10px] font-medium ${isIncome ? 'text-emerald-700/70' : 'text-rose-700/70'}`}>
                        Valor: <span className="font-black">{fmtR(existingMatch.valor)}</span>
                       </span>
                    </div>
                  </div>
                </div>
              )}
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
            {coraInvoices.map((inv: any) => (
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
