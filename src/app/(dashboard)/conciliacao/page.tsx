'use client'
import React, { useState, useMemo, useEffect } from 'react'
import {
  FileCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter,
  RefreshCw,
  ShieldCheck,
  X,
  CreditCard,
  CloudLightning,
  Trash2,
  Zap,
  Info
} from 'lucide-react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useCoraStaged } from '@/lib/hooks/useCoraStaged'
import { useContas } from '@/lib/hooks/useContas'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { useOFXParser } from '@/lib/hooks/useOFXParser'
import OFXUpload from '@/components/conciliacao/OFXUpload'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import MatchItem from '@/components/conciliacao/MatchItem'
import ManualMatchModal from '@/components/conciliacao/ManualMatchModal'
import SupplierMatchModal from '@/components/conciliacao/SupplierMatchModal'

export default function ConciliacaoPage() {
  const { lancamentos, inserirBulk } = useFinanceiro()
  const { items: coraItems, updateStatusBulk: updateCoraStatusBulk } = useCoraStaged()
  const { contas } = useContas()
  const { associados } = useAssociados()
  const { fornecedores } = useFornecedores()
  const { diretoria } = useDiretoria()
  const { parseOFX } = useOFXParser()

  const [activeTab, setActiveTab] = useState<'ofx' | 'cora'>('ofx')
  const [extrato, setExtrato] = useState<any[]>([])
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)
  const [selectedContaId, setSelectedContaId] = useState<string>('')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL')
  const [filterMatch, setFilterMatch] = useState<'ALL' | 'FOUND' | 'NOT_FOUND'>('ALL')
  const [ignoredMatches, setIgnoredMatches] = useState<Set<string>>(new Set())
  const [editedMemos, setEditedMemos] = useState<Record<string, string>>({})

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [selectedExtrato, setSelectedExtrato] = useState<any>(null)

  useEffect(() => {
    if (contas.length > 0 && !selectedContaId) {
      const cora = contas.find(c => c.nome.toLowerCase().includes('cora'))
      setSelectedContaId(cora ? cora.id : contas[0].id)
    }
  }, [contas, selectedContaId])

  const matchedTransactions = useMemo(() => {
    return extrato.map((bank: any) => {
      const memoNormalize = bank.memo.toUpperCase()
      
      const assocMatch = associados.find(a => 
        memoNormalize.includes(a.nome.toUpperCase()) || 
        (a.cpf_cnpj && memoNormalize.includes(a.cpf_cnpj.replace(/\D/g, '')))
      )
      
      const forMatch = fornecedores.find(f => 
        memoNormalize.includes(f.nome.toUpperCase()) || 
        (f.cpf_cnpj && memoNormalize.includes(f.cpf_cnpj.replace(/\D/g, '')))
      )

      const dirMatch = diretoria.find(d => memoNormalize.includes(d.nome.toUpperCase()))

      return {
        bank,
        assocMatch: assocMatch || null,
        forMatch: forMatch ? { ...forMatch, isDirector: false } : (dirMatch ? { ...dirMatch, isDirector: true } : null),
        suggestedCategory: assocMatch ? 'Mensalidades' : (forMatch ? (forMatch as any).categoria_padrao : 'Outros')
      }
    })
  }, [extrato, associados, fornecedores, diretoria])

  const coraMatchedItems = useMemo(() => {
    return (coraItems || []).map((bank: any) => {
      const memoNormalize = bank.memo.toUpperCase()
      const assocMatch = associados.find(a => memoNormalize.includes(a.nome.toUpperCase()) || (a.cpf_cnpj && memoNormalize.includes(a.cpf_cnpj.replace(/\D/g, ''))))
      const forMatch = fornecedores.find(f => memoNormalize.includes(f.nome.toUpperCase()) || (f.cpf_cnpj && memoNormalize.includes(f.cpf_cnpj.replace(/\D/g, ''))))
      const dirMatch = diretoria.find(d => memoNormalize.includes(d.nome.toUpperCase()))

      return {
        bank,
        assocMatch: assocMatch || null,
        forMatch: forMatch ? { ...forMatch, isDirector: false } : (dirMatch ? { ...dirMatch, isDirector: true } : null),
        suggestedCategory: assocMatch ? 'Mensalidades' : (forMatch ? (forMatch as any).categoria_padrao : 'Outros')
      }
    })
  }, [coraItems, associados, fornecedores, diretoria])

  const filteredItems = useMemo(() => {
    const list = activeTab === 'ofx' ? matchedTransactions : coraMatchedItems
    return list.filter((item: any) => {
      const matchesSearch = item.bank.memo.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'ALL' || item.bank.type === filterType
      const hasMatch = !!(item.assocMatch || item.forMatch)
      const matchesMatch = filterMatch === 'ALL' || (filterMatch === 'FOUND' ? hasMatch : !hasMatch)
      return matchesSearch && matchesType && matchesMatch
    })
  }, [activeTab, matchedTransactions, coraMatchedItems, searchTerm, filterType, filterMatch])

  const handleProcessarLote = async () => {
    const itemsToProcess = matchedTransactions.filter((t: any) => {
      const isNotIgnored = !ignoredMatches.has(t.bank.fitid);
      const isNotDuplicate = !lancamentos.some(l => l.banco_transacao_id === t.bank.fitid);
      return isNotIgnored && isNotDuplicate;
    })

    if (itemsToProcess.length === 0) {
      alert('Nenhuma transação nova encontrada para lançamento.')
      return
    }
    
    setIsProcessingBatch(true)
    try {
      const items = itemsToProcess.map((t: any) => ({
        tipo: t.bank.type === 'CREDIT' ? 'receita' : 'despesa',
        descricao: editedMemos[t.bank.fitid] || t.bank.memo,
        categoria: t.suggestedCategory || (t.bank.type === 'CREDIT' ? 'Mensalidades' : 'Outros'),
        conta_id: selectedContaId,
        valor: Math.abs(t.bank.amount),
        data: t.bank.date,
        status: 'pago',
        forma_pagamento: (t.bank as any).metodo_inferido || 'Transferência',
        associado_id: t.assocMatch?.id || null,
        fornecedor_id: t.forMatch?.isDirector ? null : (t.forMatch?.id || null),
        diretor_id: t.forMatch?.isDirector ? t.forMatch.id : null,
        conciliado: true,
        banco_transacao_id: t.bank.fitid
      }))
      const res = await inserirBulk(items as any)
      if (res.error) alert(`Erro no Banco: ${JSON.stringify(res.error)}`)
      else { 
        alert(`${items.length} lançamentos processados com sucesso!`)
        setExtrato(prev => prev.filter((tx: any) => !itemsToProcess.find((it: any) => it.bank.fitid === tx.fitid)))
      }
    } finally { setIsProcessingBatch(false) }
  }

  const handleCoraBatch = async () => {
    const rowsToProcess = coraMatchedItems.filter((t: any) => !lancamentos.some(l => l.banco_transacao_id === (t.bank as any).id))
    if (rowsToProcess.length === 0) return alert('Nenhuma nova transação Cora encontrada.')

    setIsProcessingBatch(true)
    try {
      const rows = rowsToProcess.map((t: any) => ({
        tipo: t.bank.type === 'CREDIT' ? 'receita' : 'despesa',
        descricao: t.bank.memo,
        categoria: t.suggestedCategory || (t.bank.type === 'CREDIT' ? 'Mensalidades' : 'Outros'),
        conta_id: selectedContaId,
        valor: Math.abs(t.bank.amount),
        data: t.bank.date,
        status: 'pago',
        forma_pagamento: (t.bank as any).metodo_inferido || 'Transferência',
        conciliado: true,
        associado_id: t.assocMatch?.id || null,
        fornecedor_id: t.forMatch?.isDirector ? null : (t.forMatch?.id || null),
        diretor_id: t.forMatch?.isDirector ? t.forMatch.id : null,
        banco_transacao_id: (t.bank as any).id
      }))
      const res = await inserirBulk(rows as any)
      if (!res.error) {
        if (updateCoraStatusBulk) {
          await updateCoraStatusBulk(rowsToProcess.map((i: any) => (i.bank as any).id), 'sincronizado')
        }
        alert(`${rows.length} transações Cora sincronizadas com sucesso!`)
      } else {
        alert(`Erro Cora: ${JSON.stringify(res.error)}`)
      }
    } finally { setIsProcessingBatch(false) }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Sticky Action Bar */}
      <div className="flex flex-col gap-6">
        <div className="page-header flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm"><FileCheck size={26} /></div>
            <div>
              <h1 className="page-title text-2xl font-bold tracking-tight">Conciliador Bancário</h1>
              <p className="page-subtitle text-xs text-gray-500 font-medium tracking-tight">Cruze seu extrato OFX com o sistema automaticamente.</p>
            </div>
          </div>

          {(extrato.length > 0 || (activeTab === 'cora' && (coraItems || []).length > 0)) && (
            <div className="hidden md:block">
              <div className="flex items-center gap-3 bg-white p-2 pl-4 rounded-[20px] border border-gray-100 shadow-xl shadow-indigo-900/5">
                <select value={selectedContaId} onChange={(e) => setSelectedContaId(e.target.value)} className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 p-0 cursor-pointer min-w-[150px]">
                  {contas.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                {activeTab === 'ofx' ? (
                  <button onClick={handleProcessarLote} disabled={isProcessingBatch || !matchedTransactions.length} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-30">
                    {isProcessingBatch ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Lançar Lote OFX
                  </button>
                ) : (
                  <button onClick={handleCoraBatch} disabled={isProcessingBatch || !coraItems?.length} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-30">
                    {isProcessingBatch ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Sincronizar Tudo (Cora)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Toolbar */}
        {(extrato.length > 0 || (activeTab === 'cora' && (coraItems || []).length > 0)) && (
          <div className="sticky top-[80px] z-[40] flex items-center justify-between gap-3 bg-indigo-900/90 backdrop-blur-md p-3 px-6 rounded-[24px] border border-indigo-500/30 shadow-2xl shadow-indigo-900/20 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Conta de Destino</span>
                <select 
                  value={selectedContaId} 
                  onChange={(e) => setSelectedContaId(e.target.value)} 
                  className="bg-transparent border-none text-sm font-black text-white focus:ring-0 p-0 cursor-pointer"
                >
                  {contas.map((c: any) => <option key={c.id} value={c.id} className="text-gray-900">{c.nome}</option>)}
                </select>
              </div>
              <div className="h-8 w-px bg-indigo-500/30 mx-2" />
              <div className="flex flex-col">
                <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Prontos p/ Lançar</span>
                <span className="text-sm font-black text-white">
                  {activeTab === 'ofx' 
                    ? matchedTransactions.filter((t: any) => !ignoredMatches.has(t.bank.fitid) && !lancamentos.some(l => l.banco_transacao_id === t.bank.fitid)).length 
                    : coraMatchedItems.filter((t: any) => !lancamentos.some(l => l.banco_transacao_id === (t.bank as any).id)).length
                  } itens
                </span>
              </div>
            </div>

            <button 
              onClick={activeTab === 'ofx' ? handleProcessarLote : handleCoraBatch} 
              disabled={isProcessingBatch} 
              className="flex items-center gap-3 px-8 py-3 bg-white text-indigo-900 rounded-2xl font-black text-xs shadow-xl hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50"
            >
              {isProcessingBatch ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} className="fill-indigo-900" />} 
              {activeTab === 'ofx' ? 'EXECUTAR LANÇAMENTO EM LOTE' : 'SINCRONIZAR API CORA'}
            </button>
          </div>
        )}
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm relative z-10">
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          <button 
            onClick={() => setActiveTab('ofx')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'ofx' ? 'bg-white text-indigo-600 shadow-md border border-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <CloudLightning size={14} /> EXTRATO OFX
          </button>
          <button 
            onClick={() => setActiveTab('cora')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'cora' ? 'bg-white text-indigo-600 shadow-md border border-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <RefreshCw size={14} className={activeTab === 'cora' ? 'animate-spin' : ''} /> CONEXÃO CORA (API)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/10 min-w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
            <Filter size={14} className="text-gray-400" />
            <select 
              className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="ALL">Tudo</option>
              <option value="CREDIT">↑ Entradas</option>
              <option value="DEBIT">↓ Saídas</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
            <select 
              className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer"
              value={filterMatch}
              onChange={(e) => setFilterMatch(e.target.value as any)}
            >
              <option value="ALL">Todas ({activeTab === 'ofx' ? extrato.length : (coraItems || []).length})</option>
              <option value="FOUND">✓ Com Match</option>
              <option value="NOT_FOUND">⚠ Sem Match</option>
            </select>
          </div>
        </div>
      </div>

      {activeTab === 'ofx' ? (
        extrato.length === 0 ? (
          <OFXUpload onUpload={(data: any) => {
            const parsed = parseOFX(data)
            setExtrato(parsed)
          }} />
        ) : (
          <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transações ({filteredItems.length})</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">IN {fmtR(filteredItems.reduce((acc: number, i: any) => acc + (i.bank.type === 'CREDIT' ? i.bank.amount : 0), 0))}</span>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">OUT {fmtR(filteredItems.reduce((acc: number, i: any) => acc + (i.bank.type === 'DEBIT' ? Math.abs(i.bank.amount) : 0), 0))}</span>
              </div>
              <button 
                onClick={() => setExtrato([])}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={14} /> LIMPAR TUDO
              </button>
            </div>
            {filteredItems.map((item: any, idx: number) => (
              <MatchItem 
                key={idx} 
                {...item} 
                onEditMemo={(newMemo: string) => setEditedMemos(prev => ({ ...prev, [item.bank.fitid]: newMemo }))}
                onLinkManual={() => { setSelectedExtrato(item); setIsModalOpen(true) }}
                onLinkSupplier={() => { setSelectedExtrato(item); setIsSupplierModalOpen(true) }}
                onIgnore={() => setIgnoredMatches(prev => {
                  const next = new Set(prev)
                  if (next.has(item.bank.fitid)) next.delete(item.bank.fitid)
                  else next.add(item.bank.fitid)
                  return next
                })}
                isIgnored={ignoredMatches.has(item.bank.fitid)}
                isDuplicate={lancamentos.some(l => l.banco_transacao_id === item.bank.fitid)}
              />
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-2">
          {(!coraItems || coraItems?.length === 0) ? (
             <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-dashed border-gray-200">
               <RefreshCw size={48} className="text-gray-300 mb-4 animate-spin" />
               <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Buscando transações da API Cora...</p>
             </div>
          ) : (
            filteredItems.map((item: any, idx: number) => (
              <MatchItem 
                key={idx} 
                {...item} 
                isCora
                isDuplicate={lancamentos.some(l => l.banco_transacao_id === (item.bank as any).id)}
              />
            ))
          )}
        </div>
      )}

      <ManualMatchModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        extrato={selectedExtrato}
        onSelect={(assoc: any) => {
          setExtrato(prev => prev.map((item: any) => 
            item.fitid === selectedExtrato.bank.fitid 
              ? { ...item, assocMatch: assoc, suggestedCategory: 'Mensalidades' }
              : item
          ))
          setIsModalOpen(false)
          setSelectedExtrato(null)
        }}
      />

      <SupplierMatchModal 
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        extrato={selectedExtrato}
        onSelect={(sup: any) => {
          const targetFitid = selectedExtrato.bank.fitid;
          setExtrato(prev => prev.map((tx: any) => {
            if (tx.fitid === targetFitid) {
               setEditedMemos(prev => ({ ...prev, [targetFitid]: sup.nome }));
               return tx;
            }
            return tx;
          }));
          setIsSupplierModalOpen(false);
          setSelectedExtrato(null);
        }}
      />
    </div>
  )
}
