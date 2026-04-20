'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { FileCheck, Search, Trash2, RefreshCw, CloudLightning } from 'lucide-react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useCoraStaged } from '@/lib/hooks/useCoraStaged'
import { useContas } from '@/lib/hooks/useContas'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { useOFXParser } from '@/lib/hooks/useOFXParser'
import { useCategorias } from '@/lib/hooks/useCategorias'
import OFXUpload from '@/components/conciliacao/OFXUpload'
import { fmtR } from '@/lib/utils/formatters'
import MatchItem from '@/components/conciliacao/MatchItem'
import ManualMatchModal from '@/components/conciliacao/ManualMatchModal'
import SupplierMatchModal from '@/components/conciliacao/SupplierMatchModal'
import Skeleton from '@/components/ui/Skeleton'
import { useConciliacaoAudit } from '@/features/conciliacao/hooks/useConciliacaoAudit'
import ConciliacaoToolbar from '@/features/conciliacao/components/ConciliacaoToolbar'

export default function ConciliacaoPage() {
  const { lancamentos, inserirBulk, loading: loadingFinanceiro } = useFinanceiro()
  const { items: coraItems, updateStatusBulk, loading: loadingCora } = useCoraStaged()
  const { contas } = useContas()
  const { associados, atualizar: atualizarAssociado } = useAssociados()
  const { fornecedores } = useFornecedores()
  const { diretoria } = useDiretoria()
  const { categorias } = useCategorias()
  const { parseOFX } = useOFXParser()

  const [activeTab, setActiveTab] = useState<'ofx' | 'cora'>('ofx')
  const [extrato, setExtrato] = useState<any[]>([])
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)
  const [selectedContaId, setSelectedContaId] = useState<string>('')
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL')
  const [filterMatch, setFilterMatch] = useState<'ALL' | 'FOUND' | 'NOT_FOUND'>('ALL')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NEW' | 'DUPLICATE'>('ALL')
  const [ignoredMatches, setIgnoredMatches] = useState<Set<string>>(new Set())
  const [editedMemos, setEditedMemos] = useState<Record<string, string>>({})
  const [editedCategories, setEditedCategories] = useState<Record<string, string>>({})
  const [isAuditingBatch, setIsAuditingBatch] = useState(false)
  const [auditResults, setAuditResults] = useState<Record<string, any[]>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [selectedExtrato, setSelectedExtrato] = useState<any>(null)

  const { matchedTransactions, coraMatchedItems, existingTxIds, auditStats } = useConciliacaoAudit(
    extrato, coraItems, activeTab, associados, fornecedores, diretoria, lancamentos, processedIds
  )

  useEffect(() => {
    if (contas.length > 0 && !selectedContaId) {
      const coraCont = contas.find(c => c.nome.toLowerCase().includes('cora'))
      setSelectedContaId(coraCont ? coraCont.id : contas[0].id)
    }
  }, [contas, selectedContaId])

  const enhanceMemo = (name: string, originalMemo: string) => {
    const docRegex = /(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})|(\d{3}\.?\d{3}\.?\d{3}-?\d{2})|(\d{14})|(\d{11})/
    const match = originalMemo.match(docRegex)
    return match ? `${name.toUpperCase()} - ${match[0]}` : name.toUpperCase()
  }

  const filteredItems = useMemo(() => {
    const list = activeTab === 'ofx' ? matchedTransactions : coraMatchedItems
    return list.filter((item: any) => {
      const matchesSearch = item.bank.memo.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'ALL' || item.bank.type === filterType
      const hasMatch = !!(item.assocMatch || item.forMatch)
      const matchesMatch = filterMatch === 'ALL' || (filterMatch === 'FOUND' ? hasMatch : !hasMatch)
      const isDuplicate = existingTxIds.has(item.bank.fitid) || processedIds.has(item.bank.fitid)
      const matchesStatus = filterStatus === 'ALL' || (filterStatus === 'DUPLICATE' ? isDuplicate : !isDuplicate)
      return matchesSearch && matchesType && matchesMatch && matchesStatus
    })
  }, [activeTab, matchedTransactions, coraMatchedItems, searchTerm, filterType, filterMatch, filterStatus, existingTxIds, processedIds])

  const handleProcessarLote = async () => {
    const itemsToProcess = matchedTransactions.filter((t: any) => !ignoredMatches.has(t.bank.fitid) && !existingTxIds.has(t.bank.fitid) && !processedIds.has(t.bank.fitid))
    if (itemsToProcess.length === 0) return alert('Nenhuma transação nova a processar.')
    setIsProcessingBatch(true)
    try {
      const enrichments = itemsToProcess.filter(t => t.needsUpdate && t.assocMatch?.id && t.newDocument).map(t => atualizarAssociado(t.assocMatch.id, { cpf: t.newDocument as string }))
      if (enrichments.length > 0) await Promise.all(enrichments)
      const items = itemsToProcess.map((t: any) => ({
        tipo: t.bank.type === 'CREDIT' ? 'receita' : 'despesa',
        descricao: editedMemos[t.bank.fitid] || t.bank.memo,
        categoria: editedCategories[t.bank.fitid] || t.suggestedCategory || (t.bank.type === 'CREDIT' ? 'Mensalidades' : 'Outros'),
        conta_id: selectedContaId,
        valor: Math.abs(t.bank.amount),
        data: t.bank.date,
        status: 'pago',
        forma_pagamento: t.bank.metodo_inferido || 'Transferência',
        associado_id: t.assocMatch?.id || null,
        fornecedor_id: t.forMatch?.isDirector ? null : (t.forMatch?.id || null),
        diretor_id: t.forMatch?.isDirector ? t.forMatch.id : null,
        conciliado: true,
        banco_transacao_id: t.bank.fitid
      }))
      const res = await inserirBulk(items as any)
      if (res.error) alert(`Erro: ${res.error}`)
      else {
        alert(`${items.length} lançamentos processados!`)
        setProcessedIds(prev => { const next = new Set(prev); itemsToProcess.forEach(it => next.add(it.bank.fitid)); return next; })
      }
    } finally { setIsProcessingBatch(false) }
  }

  const handleCoraBatch = async () => {
    const rowsToProcess = coraMatchedItems.filter((t: any) => !existingTxIds.has(t.bank.fitid) && !processedIds.has(t.bank.fitid))
    if (rowsToProcess.length === 0) return alert('Nenhuma nova transação Cora.')
    setIsProcessingBatch(true)
    try {
      const enrichments = rowsToProcess.filter(t => t.needsUpdate && t.assocMatch?.id && t.newDocument).map(t => atualizarAssociado(t.assocMatch.id, { cpf: t.newDocument as string }))
      if (enrichments.length > 0) await Promise.all(enrichments)
      const rows = rowsToProcess.map((t: any) => ({
        tipo: t.bank.type === 'CREDIT' ? 'receita' : 'despesa',
        descricao: editedMemos[t.bank.fitid] || t.bank.memo,
        categoria: editedCategories[t.bank.fitid] || t.suggestedCategory || (t.bank.type === 'CREDIT' ? 'Mensalidades' : 'Outros'),
        conta_id: selectedContaId,
        valor: Math.abs(t.bank.amount),
        data: t.bank.date,
        status: 'pago',
        forma_pagamento: t.bank.metodo_inferido || 'Transferência',
        conciliado: true,
        associado_id: t.assocMatch?.id || null,
        fornecedor_id: t.forMatch?.isDirector ? null : (t.forMatch?.id || null),
        diretor_id: t.forMatch?.isDirector ? t.forMatch.id : null,
        banco_transacao_id: t.bank.fitid
      }))
      const res = await inserirBulk(rows as any)
      if (!res.error) {
        if (updateStatusBulk) await updateStatusBulk(rowsToProcess.map((i: any) => i.bank.fitid), 'sincronizado')
        alert(`${rows.length} transações Cora sincronizadas!`)
        setProcessedIds(prev => { const next = new Set(prev); rowsToProcess.forEach(it => next.add(it.bank.fitid)); return next; })
      } else alert(`Erro Cora: ${res.error}`)
    } finally { setIsProcessingBatch(false) }
  }

  const handleAuditAll = async () => {
    const cpfs = Array.from(new Set(filteredItems.map(i => i.assocMatch?.cpf || i.bank.documento).filter(Boolean))).map(cpf => cpf.replace(/\D/g, ''))
    if (cpfs.length === 0) return alert('Nenhum associado com CPF identificado.')
    setIsAuditingBatch(true); let found = 0
    try {
      for (const cpf of cpfs) {
        const resp = await fetch(`/api/cora/audit/invoices?cpf=${cpf}`)
        const data = await resp.json()
        if (data.success && data.invoices.length > 0) { setAuditResults(prev => ({ ...prev, [cpf]: data.invoices })); found++ }
      }
      alert(`Auditoria finalizada! ${found} associados com pendências na Cora.`)
    } catch { alert('Erro na auditoria.') } finally { setIsAuditingBatch(false) }
  }

  const handleBatchCategory = (categoryName: string) => {
    const next = { ...editedCategories }
    filteredItems.forEach((item: any) => { if (!processedIds.has(item.bank.fitid) && !existingTxIds.has(item.bank.fitid)) next[item.bank.fitid] = categoryName })
    setEditedCategories(next)
  }

  const isLoading = loadingFinanceiro || (activeTab === 'cora' && loadingCora)

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
        <div className="bg-[#0e2d22] p-8 rounded-[32px] text-white shadow-2xl border border-emerald-500/10 mb-2">
          <div className="page-header flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm"><FileCheck size={26} /></div>
              <div>
                <h1 className="page-title text-2xl font-bold tracking-tight !text-white">Conciliador Bancário</h1>
                <p className="page-subtitle text-xs !text-emerald-300 font-black tracking-tight uppercase tracking-[2px] opacity-90">Auditoria e sincronização inteligente de fluxos.</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-6 bg-white/5 p-3 px-6 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="flex flex-col"><span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Entradas (+)</span><span className="text-sm font-black !text-white">{fmtR(auditStats.credits)}</span></div>
              <div className="w-px h-8 bg-white/10" /><div className="flex flex-col"><span className="text-[9px] font-black text-red-400 uppercase tracking-wider">Saídas (-)</span><span className="text-sm font-black text-red-400">{fmtR(auditStats.debits)}</span></div>
              <div className="w-px h-8 bg-white/10" /><div className="flex flex-col"><span className="text-[9px] font-black text-blue-300 uppercase tracking-wider">Saldo Líquido</span><span className={`text-sm font-black ${auditStats.balance >= 0 ? '!text-white' : 'text-red-400'}`}>{fmtR(auditStats.balance)}</span></div>
              <div className="w-px h-8 bg-white/10" /><div className="flex flex-col"><span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">Duplicados</span><span className="text-sm font-black text-amber-400">{auditStats.duplicates}</span></div>
            </div>
          </div>
        </div>

        {(extrato.length > 0 || (activeTab === 'cora' && (coraItems || []).length > 0)) && (
          <ConciliacaoToolbar 
            contas={contas} selectedContaId={selectedContaId} onContaChange={setSelectedContaId} 
            activeTab={activeTab} categorias={categorias} onBatchCategory={handleBatchCategory} 
            onAuditAll={handleAuditAll} isAuditingBatch={isAuditingBatch} 
            onExecute={activeTab === 'ofx' ? handleProcessarLote : handleCoraBatch} 
            isProcessingBatch={isProcessingBatch} hasFilteredItems={filteredItems.length > 0} 
            newItemsCount={activeTab === 'ofx' ? matchedTransactions.filter((t: any) => !ignoredMatches.has(t.bank.fitid) && !existingTxIds.has(t.bank.fitid) && !processedIds.has(t.bank.fitid)).length : coraMatchedItems.filter((t: any) => !existingTxIds.has(t.bank.fitid) && !processedIds.has(t.bank.fitid)).length} 
          />
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm relative z-10">
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 text-[11px] font-bold">
          <button onClick={() => setActiveTab('ofx')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${activeTab === 'ofx' ? 'bg-white text-[#2d8c6f] shadow-md border border-[#2d8c6f]/10' : 'text-gray-400'}`}><CloudLightning size={14} /> EXTRATO OFX</button>
          <button onClick={() => setActiveTab('cora')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${activeTab === 'cora' ? 'bg-white text-[#2d8c6f] shadow-md border border-[#2d8c6f]/10' : 'text-gray-400'}`}><RefreshCw size={14} /> CONEXÃO CORA</button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={14} /><input type="text" placeholder="Filtrar por texto..." className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <select className="bg-gray-50 text-[11px] font-bold text-gray-600 outline-none border border-gray-100 p-2.5 rounded-xl transition-colors" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}><option value="ALL">Todo Tipo</option><option value="CREDIT">Entradas</option><option value="DEBIT">Saídas</option></select>
          <select className="bg-gray-50 text-[11px] font-bold text-gray-600 outline-none border border-gray-100 p-2.5 rounded-xl transition-colors" value={filterMatch} onChange={(e) => setFilterMatch(e.target.value as any)}><option value="ALL">Total ({activeTab === 'ofx' ? extrato.length : (coraItems || []).length})</option><option value="FOUND">Com Vínculo</option><option value="NOT_FOUND">Sem Vínculo</option></select>
          <select className="bg-gray-50 text-[11px] font-bold text-gray-600 outline-none border border-gray-100 p-2.5 rounded-xl transition-colors" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}><option value="ALL">Todo Status</option><option value="NEW">Não Conciliados</option><option value="DUPLICATE">Conciliados</option></select>
        </div>
      </div>

      {isLoading ? (<div className="grid grid-cols-1 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} height={80} />)}</div>) : activeTab === 'ofx' ? (
        extrato.length === 0 ? (<OFXUpload onUpload={(data: any) => setExtrato(parseOFX(data))} />) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between px-2"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lista de Lançamentos ({filteredItems.length})</span><button onClick={() => setExtrato([])} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={14} /> LIMPAR</button></div>
            {filteredItems.map((item: any) => (<MatchItem key={item.bank.fitid} {...item} isAdesao={item.isAdesao} isProcessed={processedIds.has(item.bank.fitid)} memo={editedMemos[item.bank.fitid] || item.bank.memo} category={editedCategories[item.bank.fitid] || item.suggestedCategory} allCategories={categorias} onEditMemo={(m: string) => setEditedMemos(prev => ({ ...prev, [item.bank.fitid]: m }))} onEditCategory={(c: string) => setEditedCategories(prev => ({ ...prev, [item.bank.fitid]: c }))} onLinkManual={() => { setSelectedExtrato(item); setIsModalOpen(true) }} onLinkSupplier={() => { setSelectedExtrato(item); setIsSupplierModalOpen(true) }} onIgnore={() => setIgnoredMatches(prev => { const n = new Set(prev); if (n.has(item.bank.fitid)) n.delete(item.bank.fitid); else n.add(item.bank.fitid); return n; })} isIgnored={ignoredMatches.has(item.bank.fitid)} isDuplicate={existingTxIds.has(item.bank.fitid)} externalAuditInvoices={auditResults[(item.assocMatch?.cpf || item.bank.documento)?.replace(/\D/g, '')]} />))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {(!coraItems || coraItems?.length === 0) ? (<div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-dashed border-gray-200"><RefreshCw size={48} className="text-gray-300 mb-4 animate-spin text-indigo-200" /><p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Sincronizando com Banco Cora...</p></div>) : 
            filteredItems.map((item: any) => (<MatchItem key={item.bank.fitid} {...item} isCora isDuplicate={existingTxIds.has(item.bank.fitid)} isProcessed={processedIds.has(item.bank.fitid)} memo={editedMemos[item.bank.fitid] || item.bank.memo} category={editedCategories[item.bank.fitid] || item.suggestedCategory} allCategories={categorias} onEditMemo={(m: string) => setEditedMemos(prev => ({ ...prev, [item.bank.fitid]: m }))} onEditCategory={(c: string) => setEditedCategories(prev => ({ ...prev, [item.bank.fitid]: c }))} externalAuditInvoices={auditResults[(item.assocMatch?.cpf || item.bank.documento)?.replace(/\D/g, '')]} />))
          }
        </div>
      )}

      <ManualMatchModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} extrato={selectedExtrato} onSelect={(assoc: any) => { const tf = selectedExtrato.bank.fitid; setEditedMemos(prev => ({ ...prev, [tf]: enhanceMemo(assoc.nome, selectedExtrato.bank.memo) })); setExtrato(prev => prev.map((item: any) => item.fitid === tf ? { ...item, assocMatch: assoc, suggestedCategory: 'Mensalidades' } : item)); setIsModalOpen(false); setSelectedExtrato(null); }} />
      <SupplierMatchModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} extrato={selectedExtrato} onSelect={(sup: any) => { const tf = selectedExtrato.bank.fitid; setEditedMemos(prevEdit => ({ ...prevEdit, [tf]: enhanceMemo(sup.nome, selectedExtrato.bank.memo) })); setExtrato(prev => prev.map((tx: any) => tx.fitid === tf ? tx : tx)); setIsSupplierModalOpen(false); setSelectedExtrato(null); }} />
    </div>
  )
}
