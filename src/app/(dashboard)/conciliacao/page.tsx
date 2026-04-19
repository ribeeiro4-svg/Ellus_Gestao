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
  Info,
  User,
  Store,
  Plus
} from 'lucide-react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useCoraStaged, CoraStagedItem } from '@/lib/hooks/useCoraStaged'
import { useContas } from '@/lib/hooks/useContas'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { useOFXParser } from '@/lib/hooks/useOFXParser'
import { useCategorias } from '@/lib/hooks/useCategorias'
import OFXUpload from '@/components/conciliacao/OFXUpload'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import MatchItem from '@/components/conciliacao/MatchItem'
import ManualMatchModal from '@/components/conciliacao/ManualMatchModal'
import SupplierMatchModal from '@/components/conciliacao/SupplierMatchModal'
import Skeleton from '@/components/ui/Skeleton'
import { safeSum, safeDiff, roundMoney } from '@/lib/utils/formatters'

export default function ConciliacaoPage() {
  const { lancamentos, inserirBulk, loading: loadingFinanceiro, kpis } = useFinanceiro()
  const { items: coraItems, updateStatusBulk, loading: loadingCora } = useCoraStaged()
  const { contas } = useContas()
  const { associados } = useAssociados()
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
  const [ignoredMatches, setIgnoredMatches] = useState<Set<string>>(new Set())
  const [editedMemos, setEditedMemos] = useState<Record<string, string>>({})
  const [editedCategories, setEditedCategories] = useState<Record<string, string>>({})

  const [isAuditingBatch, setIsAuditingBatch] = useState(false)
  const [auditResults, setAuditResults] = useState<Record<string, any[]>>({})

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [selectedExtrato, setSelectedExtrato] = useState<any>(null)

  // Auditoria: Conjunto de IDs já lançados para busca rápida O(1)
  const existingTxIds = useMemo(() => new Set(lancamentos.map(l => l.banco_transacao_id).filter(Boolean)), [lancamentos])

  /* ── Auto-seleção de Conta ── */
  useEffect(() => {
    if (contas.length > 0 && !selectedContaId) {
      const coraCont = contas.find(c => c.nome.toLowerCase().includes('cora'))
      setSelectedContaId(coraCont ? coraCont.id : contas[0].id)
    }
  }, [contas, selectedContaId])

  const { atualizar: atualizarAssociado } = useAssociados()

  const extractDocument = (memo: string) => {
    const raw = memo.replace(/\D/g, '')
    const cnpjMatch = raw.match(/\d{14}/)
    const cpfMatch = raw.match(/\d{11}/)
    return cnpjMatch ? cnpjMatch[0] : (cpfMatch ? cpfMatch[0] : null)
  }

  const enhanceMemo = (name: string, originalMemo: string) => {
    const docRegex = /(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})|(\d{3}\.?\d{3}\.?\d{3}-?\d{2})|(\d{14})|(\d{11})/
    const match = originalMemo.match(docRegex)
    if (match) return `${name.toUpperCase()} - ${match[0]}`
    return name.toUpperCase()
  }


  // Cérebro de Auditoria 2.1 - Precisão + Enriquecimento
  const getAuditMatch = (bankMemo: string, bankAmount: number, bankType: string) => {
    const memo = bankMemo.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const numbersInMemo = memo.replace(/\D/g, '')
    const extractedDoc = extractDocument(bankMemo)
    
    // 1. Prioridade Máxima: CPF / CNPJ
    const dirCpfMatch = diretoria.find(d => d.cpf && numbersInMemo.includes(d.cpf.replace(/\D/g, '')))
    if (dirCpfMatch) return { forMatch: { ...dirCpfMatch, isDirector: true }, assocMatch: null, suggestedCategory: 'Verba Diretoria / Administrativo', isAdesao: false }

    const assocCpfMatch = associados.find(a => a.cpf && numbersInMemo.includes(a.cpf.replace(/\D/g, '')))
    if (assocCpfMatch) {
      const isAdesao = !lancamentos.some(l => l.associado_id === assocCpfMatch.id)
      return { assocMatch: assocCpfMatch, forMatch: null, suggestedCategory: isAdesao ? 'ADESÃO' : 'Mensalidades', isAdesao }
    }

    // 2. Prioridade Média: Nome Completo (Exato)
    const normalizeName = (n: string) => n.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    
    const assocExactMatch = associados.find(a => memo.includes(normalizeName(a.nome)))
    if (assocExactMatch) {
      const isAdesao = !lancamentos.some(l => l.associado_id === assocExactMatch.id)
      return { 
        assocMatch: assocExactMatch, 
        forMatch: null, 
        suggestedCategory: isAdesao ? 'ADESÃO' : 'Mensalidades', 
        isAdesao,
        needsUpdate: !assocExactMatch.cpf && !!extractedDoc,
        newDocument: extractedDoc
      }
    }

    const dirExactMatch = diretoria.find(d => memo.includes(normalizeName(d.nome)))
    if (dirExactMatch) return { forMatch: { ...dirExactMatch, isDirector: true }, assocMatch: null, suggestedCategory: 'Verba Diretoria / Administrativo', isAdesao: false }

    // 3. Match Inteligente de Fragmentos (Fuzzy)
    const fuzzyMatch = (targetName: string) => {
      const parts = normalizeName(targetName).split(' ').filter(p => p.length > 3)
      if (parts.length < 2) return false
      return memo.includes(parts[0]) && parts.slice(1).some(p => memo.includes(p))
    }

    const assocFuzzy = associados.find(a => fuzzyMatch(a.nome))
    if (assocFuzzy) {
      const isAdesao = !lancamentos.some(l => l.associado_id === assocFuzzy.id)
      return { 
        assocMatch: assocFuzzy, 
        forMatch: null, 
        suggestedCategory: isAdesao ? 'ADESÃO' : 'Mensalidades', 
        isAdesao,
        needsUpdate: !assocFuzzy.cpf && !!extractedDoc,
        newDocument: extractedDoc
      }
    }

    const dirFuzzy = diretoria.find(d => fuzzyMatch(d.nome))
    if (dirFuzzy) return { forMatch: { ...dirFuzzy, isDirector: true }, assocMatch: null, suggestedCategory: 'Verba Diretoria / Administrativo', isAdesao: false }

    // 4. Fornecedores
    const forMatch = fornecedores.find(f => {
      const nF = normalizeName(f.nome)
      const cF = (f as any).cpf_cnpj?.replace(/\D/g, '')
      return (cF && numbersInMemo.includes(cF)) || memo.includes(nF)
    })

    return {
      assocMatch: null,
      forMatch: forMatch ? { ...forMatch, isDirector: false } : null,
      suggestedCategory: forMatch ? (forMatch as any).categoria_padrao : 'Outros',
      isAdesao: false
    }
  }

  const matchedTransactions = useMemo(() => {
    return extrato.map((bank: any) => {
      const audit = getAuditMatch(bank.memo, bank.amount, bank.type)
      return { bank, ...audit }
    })
  }, [extrato, associados, fornecedores, diretoria, lancamentos])

  const coraMatchedItems = useMemo(() => {
    return (coraItems || []).map((bank: CoraStagedItem) => {
      const normalizedBank = {
        fitid: bank.cora_id || bank.id,
        memo: bank.descricao,
        amount: bank.valor,
        type: bank.tipo,
        date: bank.data,
        metodo_inferido: bank.descricao.toUpperCase().includes('PIX') ? 'PIX' : bank.descricao.toUpperCase().includes('BOLETO') ? 'BOLETO' : 'Transferência'
      }

      const audit = getAuditMatch(bank.descricao, bank.valor, bank.tipo)
      return { bank: normalizedBank, ...audit }
    })
  }, [coraItems, associados, fornecedores, diretoria, lancamentos])

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

  // Auditoria de Lote: Estatísticas
  const auditStats = useMemo(() => {
    const list = activeTab === 'ofx' ? matchedTransactions : coraMatchedItems
    let credits = 0, debits = 0, duplicates = 0, linked = 0, unlinked = 0
    list.forEach(i => {
      if (processedIds.has(i.bank.fitid)) return
      
      const val = Math.abs(i.bank.amount)
      if (i.bank.type === 'CREDIT') {
        credits = safeSum(credits, val)
      } else {
        debits = safeSum(debits, val)
      }

      if (existingTxIds.has(i.bank.fitid)) duplicates++
      else if (i.assocMatch || i.forMatch) linked++
      else unlinked++
    })
    return { credits, debits, balance: safeDiff(credits, debits), duplicates, linked, unlinked }
  }, [activeTab, matchedTransactions, coraMatchedItems, existingTxIds, processedIds])

  const handleProcessarLote = async () => {
    const itemsToProcess = matchedTransactions.filter((t: any) => {
      const isNotIgnored = !ignoredMatches.has(t.bank.fitid);
      const isNotDuplicate = !existingTxIds.has(t.bank.fitid);
      const isNotProcessed = !processedIds.has(t.bank.fitid);
      return isNotIgnored && isNotDuplicate && isNotProcessed;
    })

    if (itemsToProcess.length === 0) return alert('Nenhuma transação nova a processar.')
    
    setIsProcessingBatch(true)
    try {
      // 1. Enriquecimento Cadastral (Parallel)
      const enrichments = itemsToProcess
        .filter(t => t.needsUpdate && t.assocMatch?.id && t.newDocument)
        .map(t => {
          if (t.assocMatch?.id && t.newDocument) {
            return atualizarAssociado(t.assocMatch.id, { cpf: t.newDocument })
          }
          return Promise.resolve({ error: null })
        })
      
      if (enrichments.length > 0) await Promise.all(enrichments)

      // 2. Lançamentos Financeiros
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
      if (res.error) alert(`Erro na Auditoria/Banco: ${res.error}`)
      else { 
        alert(`${items.length} lançamentos processados ${enrichments.length > 0 ? `com ${enrichments.length} atualizações cadastrais!` : 'com sucesso!'}`)
        setProcessedIds(prev => {
          const next = new Set(prev)
          itemsToProcess.forEach(it => next.add(it.bank.fitid))
          return next
        })
      }
    } finally { setIsProcessingBatch(false) }
  }

  const handleCoraBatch = async () => {
    const rowsToProcess = coraMatchedItems.filter((t: any) => !existingTxIds.has(t.bank.fitid) && !processedIds.has(t.bank.fitid))
    if (rowsToProcess.length === 0) return alert('Nenhuma nova transação Cora encontrada.')

    setIsProcessingBatch(true)
    try {
      // 1. Enriquecimento Cadastral (Parallel)
      const enrichments = rowsToProcess
        .filter(t => t.needsUpdate && t.assocMatch?.id && t.newDocument)
        .map(t => {
          if (t.assocMatch?.id && t.newDocument) {
            return atualizarAssociado(t.assocMatch.id, { cpf: t.newDocument })
          }
          return Promise.resolve({ error: null })
        })
      
      if (enrichments.length > 0) await Promise.all(enrichments)

      // 2. Sincronização
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
        if (updateStatusBulk) {
          await updateStatusBulk(rowsToProcess.map((i: any) => i.bank.fitid), 'sincronizado')
        }
        alert(`${rows.length} transações Cora sincronizadas ${enrichments.length > 0 ? `com ${enrichments.length} CPFs coletados!` : 'com auditoria!'}`)
        setProcessedIds(prev => {
          const next = new Set(prev)
          rowsToProcess.forEach(it => next.add(it.bank.fitid))
          return next
        })
      } else {
        alert(`Erro Cora: ${res.error}`)
      }
    } finally { setIsProcessingBatch(false) }
  }

  const handleAuditAll = async () => {
    const cpfs = filteredItems
      .map(i => i.assocMatch?.cpf || i.bank.documento)
      .filter((cpf): cpf is string => !!cpf)
      .map(cpf => cpf.replace(/\D/g, ''))
    
    const uniqueCpfs = Array.from(new Set(cpfs))
    if (uniqueCpfs.length === 0) return alert('Nenhum associado com CPF identificado na lista.')

    setIsAuditingBatch(true)
    let foundCount = 0
    try {
      for (const cpf of uniqueCpfs) {
        const resp = await fetch(`/api/cora/audit/invoices?cpf=${cpf}`)
        const data = await resp.json()
        if (data.success && data.invoices.length > 0) {
          setAuditResults(prev => ({ ...prev, [cpf]: data.invoices }))
          foundCount++
        }
      }
      alert(`Auditoria finalizada! ${foundCount} associados possuem pendências na Cora.`)
    } catch (e) {
      alert('Erro ao processar auditoria em lote.')
    } finally {
      setIsAuditingBatch(false)
    }
  }

  const handleBatchCategory = (categoryName: string) => {
    const nextCategories = { ...editedCategories }
    filteredItems.forEach((item: any) => {
      if (!processedIds.has(item.bank.fitid) && !existingTxIds.has(item.bank.fitid)) {
        nextCategories[item.bank.fitid] = categoryName
      }
    })
    setEditedCategories(nextCategories)
  }

  const isLoading = loadingFinanceiro || (activeTab === 'cora' && loadingCora)

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
        <div className="page-header flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm transition-transform hover:scale-110 duration-300"><FileCheck size={26} /></div>
            <div>
              <h1 className="page-title text-2xl font-bold tracking-tight">Conciliador Bancário</h1>
              <p className="page-subtitle text-xs text-gray-500 font-medium tracking-tight">Auditoria e sincronização inteligente de fluxos.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Auditoria Card Mini */}
             <div className="hidden lg:flex items-center gap-6 bg-white p-3 px-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Entradas (+)</span>
                   <span className="text-sm font-black text-emerald-700">{fmtR(auditStats.credits)}</span>
                </div>
                <div className="w-px h-8 bg-gray-100" />
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-red-400 uppercase tracking-wider">Saídas (-)</span>
                   <span className="text-sm font-black text-red-600">{fmtR(auditStats.debits)}</span>
                </div>
                <div className="w-px h-8 bg-gray-100" />
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Saldo Líquido</span>
                   <span className={`text-sm font-black ${auditStats.balance >= 0 ? 'text-indigo-900' : 'text-red-600'}`}>
                      {fmtR(auditStats.balance)}
                   </span>
                </div>
                <div className="w-px h-8 bg-gray-100" />
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Duplicados</span>
                   <span className="text-sm font-black text-amber-600">{auditStats.duplicates}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Sticky Action Toolbar */}
        {(extrato.length > 0 || (activeTab === 'cora' && (coraItems || []).length > 0)) && (
          <div className="sticky top-[80px] z-[40] flex items-center justify-between gap-3 bg-[#1d4f3e] backdrop-blur-md p-3 px-6 rounded-[24px] border border-[#2d8c6f]/30 shadow-2xl animate-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Conta de Destino</span>
                <select value={selectedContaId} onChange={(e) => setSelectedContaId(e.target.value)} className="bg-transparent border-none text-sm font-black text-white focus:ring-0 p-0 cursor-pointer">
                  {contas.map((c: any) => <option key={c.id} value={c.id} className="text-gray-900">{c.nome}</option>)}
                </select>
              </div>
              <div className="h-8 w-px bg-indigo-500/30 mx-2" />
              <div className="flex flex-col text-white">
                <span className="text-emerald-100 font-bold uppercase tracking-wider text-[9px]">Itens Novos</span>
                <span className="text-sm font-black">
                  {activeTab === 'ofx' 
                    ? matchedTransactions.filter((t: any) => !ignoredMatches.has(t.bank.fitid) && !existingTxIds.has(t.bank.fitid) && !processedIds.has(t.bank.fitid)).length 
                    : coraMatchedItems.filter((t: any) => !existingTxIds.has(t.bank.fitid) && !processedIds.has(t.bank.fitid)).length
                  } itens
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-col bg-[#163d2f] px-4 py-1.5 rounded-2xl border border-emerald-500/20">
                <span className="text-[9px] text-emerald-200/50 font-bold uppercase tracking-wider">Mudar Filtro em Lote</span>
                <select 
                  onChange={(e) => handleBatchCategory(e.target.value)}
                  className="bg-transparent border-none text-[11px] font-black text-white focus:ring-0 p-0 cursor-pointer outline-none"
                  value=""
                >
                  <option value="" disabled className="text-gray-900">Definir Categoria...</option>
                  {(categorias || []).map((cat: any) => (
                    <option key={cat.id} value={cat.nome} className="text-gray-900">{cat.nome}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleAuditAll}
                disabled={isAuditingBatch || filteredItems.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-[#163d2f] text-white rounded-2xl font-black text-[11px] shadow-xl hover:bg-[#0e2d22] transition-all active:scale-95 disabled:opacity-50"
              >
                {isAuditingBatch ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                {isAuditingBatch ? 'AUDITANDO...' : 'AUDITAR COBRANÇAS EM LOTE'}
              </button>

              <button onClick={activeTab === 'ofx' ? handleProcessarLote : handleCoraBatch} disabled={isProcessingBatch} className="flex items-center gap-3 px-8 py-3 bg-white text-[#163d2f] rounded-2xl font-black text-[11px] shadow-xl hover:bg-emerald-50 hover:text-emerald-700 transition-all active:scale-95 disabled:opacity-50 group">
                {isProcessingBatch ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} className="fill-[#163d2f] group-hover:fill-emerald-600" />} 
                {activeTab === 'ofx' ? 'EXECUTAR LANÇAMENTO AUDITADO' : 'SINCRONIZAR API CORA'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm relative z-10 transition-all hover:shadow-md">
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 text-[11px] font-bold">
          <button onClick={() => setActiveTab('ofx')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${activeTab === 'ofx' ? 'bg-white text-[#2d8c6f] shadow-md border border-[#2d8c6f]/10' : 'text-gray-400'}`}><CloudLightning size={14} /> EXTRATO OFX</button>
          <button onClick={() => setActiveTab('cora')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${activeTab === 'cora' ? 'bg-white text-[#2d8c6f] shadow-md border border-[#2d8c6f]/10' : 'text-gray-400'}`}><RefreshCw size={14} /> CONEXÃO CORA</button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
            <input type="text" placeholder="Filtrar por texto..." className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 min-w-[200px] transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="bg-gray-50 text-[11px] font-bold text-gray-600 outline-none cursor-pointer border border-gray-100 p-2.5 rounded-xl hover:border-indigo-200 transition-colors" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
            <option value="ALL">Todo Tipo</option>
            <option value="CREDIT">Entradas</option>
            <option value="DEBIT">Saídas</option>
          </select>
          <select className="bg-gray-50 text-[11px] font-bold text-gray-600 outline-none cursor-pointer border border-gray-100 p-2.5 rounded-xl hover:border-indigo-200 transition-colors" value={filterMatch} onChange={(e) => setFilterMatch(e.target.value as any)}>
            <option value="ALL">Total ({activeTab === 'ofx' ? extrato.length : (coraItems || []).length})</option>
            <option value="FOUND">Com Vínculo</option>
            <option value="NOT_FOUND">Sem Vínculo</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
           {[1,2,3,4].map(i => <Skeleton key={i} height={80} />)}
        </div>
      ) : activeTab === 'ofx' ? (
        extrato.length === 0 ? (
          <OFXUpload onUpload={(data: any) => setExtrato(parseOFX(data))} />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between px-2">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lista de Lançamentos ({filteredItems.length})</span>
               <button onClick={() => setExtrato([])} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={14} /> LIMPAR</button>
            </div>
            {filteredItems.map((item: any) => (
              <MatchItem 
                key={item.bank.fitid} 
                {...item} 
                isAdesao={item.isAdesao} 
                isProcessed={processedIds.has(item.bank.fitid)} 
                memo={editedMemos[item.bank.fitid] || item.bank.memo}
                category={editedCategories[item.bank.fitid] || item.suggestedCategory}
                allCategories={categorias}
                onEditMemo={(m: string) => setEditedMemos(prev => ({ ...prev, [item.bank.fitid]: m }))} 
                onEditCategory={(c: string) => setEditedCategories(prev => ({ ...prev, [item.bank.fitid]: c }))}
                onLinkManual={() => { setSelectedExtrato(item); setIsModalOpen(true) }} 
                onLinkSupplier={() => { setSelectedExtrato(item); setIsSupplierModalOpen(true) }} 
                onIgnore={() => setIgnoredMatches(prev => { const n = new Set(prev); if (n.has(item.bank.fitid)) n.delete(item.bank.fitid); else n.add(item.bank.fitid); return n; })} 
                isIgnored={ignoredMatches.has(item.bank.fitid)} 
                isDuplicate={existingTxIds.has(item.bank.fitid)} 
                externalAuditInvoices={auditResults[(item.assocMatch?.cpf || item.bank.documento)?.replace(/\D/g, '')]}
              />
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {(!coraItems || coraItems?.length === 0) ? (
             <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-dashed border-gray-200">
               <RefreshCw size={48} className="text-gray-300 mb-4 animate-spin text-indigo-200" />
               <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Sincronizando com Banco Cora...</p>
             </div>
          ) : (
            filteredItems.map((item: any) => (
              <MatchItem 
                key={item.bank.fitid} 
                {...item} 
                isCora 
                isDuplicate={existingTxIds.has(item.bank.fitid)} 
                isProcessed={processedIds.has(item.bank.fitid)}
                memo={editedMemos[item.bank.fitid] || item.bank.memo}
                category={editedCategories[item.bank.fitid] || item.suggestedCategory}
                allCategories={categorias}
                onEditMemo={(m: string) => setEditedMemos(prev => ({ ...prev, [item.bank.fitid]: m }))}
                onEditCategory={(c: string) => setEditedCategories(prev => ({ ...prev, [item.bank.fitid]: c }))}
                externalAuditInvoices={auditResults[(item.assocMatch?.cpf || item.bank.documento)?.replace(/\D/g, '')]}
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
          const tf = selectedExtrato.bank.fitid;
          setEditedMemos(prev => ({ ...prev, [tf]: enhanceMemo(assoc.nome, selectedExtrato.bank.memo) }));
          setExtrato(prev => prev.map((item: any) => item.fitid === tf ? { ...item, assocMatch: assoc, suggestedCategory: 'Mensalidades' } : item)); 
          setIsModalOpen(false); 
          setSelectedExtrato(null); 
        }} 
      />
      <SupplierMatchModal 
        isOpen={isSupplierModalOpen} 
        onClose={() => setIsSupplierModalOpen(false)} 
        extrato={selectedExtrato} 
        onSelect={(sup: any) => { 
          const tf = selectedExtrato.bank.fitid; 
          setEditedMemos(prevEdit => ({ ...prevEdit, [tf]: enhanceMemo(sup.nome, selectedExtrato.bank.memo) }));
          setExtrato(prev => prev.map((tx: any) => tx.fitid === tf ? tx : tx)); 
          setIsSupplierModalOpen(false); 
          setSelectedExtrato(null); 
        }} 
      />
    </div>
  )
}
