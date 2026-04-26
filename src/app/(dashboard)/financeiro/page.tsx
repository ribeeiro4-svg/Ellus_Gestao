'use client'
import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Chart, Line } from 'react-chartjs-2'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { useCategorias } from '@/lib/hooks/useCategorias'
import { useCoraStaged } from '@/lib/hooks/useCoraStaged'
import { useOFXParser } from '@/lib/hooks/useOFXParser'
import { useConciliacaoAudit } from '@/features/conciliacao/hooks/useConciliacaoAudit'
import { useTenantId } from '@/lib/hooks/useTenantId'
import { createClient } from '@/lib/supabase/client'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal, { Field } from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import ChartCard from '@/components/ui/ChartCard'
import Skeleton from '@/components/ui/Skeleton'
import OFXUpload from '@/components/conciliacao/OFXUpload'
import MatchItem from '@/components/conciliacao/MatchItem'
import ManualMatchModal from '@/components/conciliacao/ManualMatchModal'
import SupplierMatchModal from '@/components/conciliacao/SupplierMatchModal'
import SupplierCreateModal from '@/components/conciliacao/SupplierCreateModal'
import ConciliacaoToolbar from '@/features/conciliacao/components/ConciliacaoToolbar'
import { useFechamento } from '@/lib/hooks/useFechamento'
import { fmtR, fmtData, fmtHora, safeSum, safeDiff, getMesIdx, getAnoIdx, MESES } from '@/lib/utils/formatters'
import { Plus, Pencil, BarChart2, RefreshCw, Search, XCircle, FileCheck, FileText, CloudLightning, Trash2, Target, ArrowRightLeft } from 'lucide-react'
import { processFinancialSubmit } from '@/features/financeiro/utils/processFinancialSubmit'
import FinancialKpiGrid from '@/features/financeiro/components/FinancialKpiGrid'
import BatchActionBar from '@/components/ui/BatchActionBar'
import ConfirmModal from '@/components/ui/ConfirmModal'
import InadimplenciaTab from '@/features/financeiro/components/InadimplenciaTab'
import IndicarCompetenciaModal from '@/components/ui/IndicarCompetenciaModal'
import { cleanupDuplicateMensalidadesAction, cleanupConciliacaoDuplicatesAction } from '@/app/actions/financeiro_cleanup'
import RemanejarModal from '@/components/ui/RemanejarModal'
import ConciliacaoLogModal from '@/components/conciliacao/ConciliacaoLogModal'
import ConciliacaoHistoryModal from '@/components/conciliacao/ConciliacaoHistoryModal'
import { useConciliacaoLogs } from '@/lib/hooks/useConciliacaoLogs'
import { tempFixDatabaseAction } from '@/app/actions/zapsign'
import NFSeLinkModal from '@/features/fiscal/components/nfse/NFSeLinkModal'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

export default function FinanceiroPage() {
  const tenantId = useTenantId()
  const sb = createClient()
  // Ganchos Financeiros
  const { 
    lancamentos, loading, inserir, atualizar, remover, 
    removerBulk, inserirBulk, atualizarBulk, conciliar, remanejar, refresh 
  } = useFinanceiro()
  const { contas } = useContas()
  const { associados, atualizar: atualizarAssociado } = useAssociados()
  const { fornecedores, inserir: inserirFornecedor } = useFornecedores()
  const { diretoria } = useDiretoria()
  const { categorias } = useCategorias()

  // Ganchos e Estados de Conciliação
  const { items: coraItems, updateStatusBulk, loading: loadingCora, setItems: setCoraItems } = useCoraStaged()
  const { parseOFX } = useOFXParser()
  const [conciliacaoSubTab, setConciliacaoSubTab] = useState<'ofx' | 'cora'>('ofx')
  const [extrato, setExtrato] = useState<any[]>([])
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set())
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)
  const [selectedContaId, setSelectedContaId] = useState<string>('')
  const [ignoredMatches, setIgnoredMatches] = useState<Set<string>>(new Set())
  const [editedMemos, setEditedMemos] = useState<Record<string, string>>({})
  const [editedCategories, setEditedCategories] = useState<Record<string, string>>({})
  const [isAuditingBatch, setIsAuditingBatch] = useState(false)
  const [auditResults, setAuditResults] = useState<Record<string, any[]>>({})
  const [isManualLinkModalOpen, setIsManualLinkModalOpen] = useState(false)
  const [isSupplierLinkModalOpen, setIsSupplierLinkModalOpen] = useState(false)
  const [selectedExtrato, setSelectedExtrato] = useState<any>(null)
  
  // Filtros de Conciliação
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL')
  const [filterMatch, setFilterMatch] = useState<'ALL' | 'FOUND' | 'NOT_FOUND'>('ALL')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NEW' | 'DUPLICATE'>('ALL')

  const { matchedTransactions, coraMatchedItems, existingTxIds } = useConciliacaoAudit(
    extrato, coraItems, conciliacaoSubTab, associados, fornecedores, diretoria, lancamentos, processedIds
  )

  // Estados Base
  const [activeTab, setActiveTab] = useState<'geral' | 'receitas' | 'despesas' | 'inadimplencia' | 'conciliacao'>('geral')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth())
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [contabilMap, setContabilMap] = useState<Record<string, string>>({})
  const [loadingContabil, setLoadingContabil] = useState(false)
  const [isCompModalOpen, setIsCompModalOpen] = useState(false)
  const [isRemanejarModalOpen, setIsRemanejarModalOpen] = useState(false)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [reconciliationLogs, setReconciliationLogs] = useState<any[]>([])
  const { logsHistory, saveLog } = useConciliacaoLogs()
  const [compTarget, setCompTarget] = useState<any>(null)
  const [remanejarTarget, setRemanejarTarget] = useState<any>(null)
  const [filterUnlinked, setFilterUnlinked] = useState<'ALL' | 'LINKED' | 'UNLINKED'>('ALL')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [isSupplierCreateOpen, setIsSupplierCreateOpen] = useState(false)
  const [parentSetFormData, setParentSetFormData] = useState<any>(null)
  const [currentEditMemo, setCurrentEditMemo] = useState('')
  const [isNFSeLinkModalOpen, setIsNFSeLinkModalOpen] = useState(false)
  const [selectedLancamentoNF, setSelectedLancamentoNF] = useState<any>(null)

  // Novos Estados para Ações em Lote
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    if (contas.length > 0 && !selectedContaId) {
      const coraCont = contas.find(c => c.nome.toLowerCase().includes('cora'))
      setSelectedContaId(coraCont ? coraCont.id : contas[0].id)
    }
  }, [contas, selectedContaId])

  // Limpar seleção ao trocar de aba
  useEffect(() => {
    setSelectedIds([])
  }, [activeTab])

  useEffect(() => {
    tempFixDatabaseAction().then(res => {
      if (res?.error) {
        console.error('Falha na manutenção do banco:', res.error)
        // Se o erro for que a função RPC não existe, avisamos o usuário
        if (res.error.includes('function') && res.error.includes('does not exist')) {
          alert('Atenção: Seu banco de dados precisa de uma atualização manual para suportar o histórico oculto. Entre em contato com o suporte ou execute o script de migração.')
        }
      }
    })
  }, [])

  // Lógica de Processamento de Conciliação
  const enhanceMemo = (name: string, originalMemo: string) => {
    const docRegex = /(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})|(\d{3}\.?\d{3}\.?\d{3}-?\d{2})|(\d{14})|(\d{11})/
    const match = originalMemo.match(docRegex)
    return match ? `${name.toUpperCase()} - ${match[0]}` : name.toUpperCase()
  }

  const handleProcessarLote = async () => {
    const itemsToProcess = filteredItemsConciliacao.filter((t: any) => !ignoredMatches.has(t.bank.fitid) && !existingTxIds.has(t.bank.fitid) && !processedIds.has(t.bank.fitid))
    if (itemsToProcess.length === 0) return alert('Nenhuma transação nova a processar.')
    setIsProcessingBatch(true)
    try {
      const enrichments = itemsToProcess.filter((t: any) => t.needsUpdate && t.assocMatch?.id && t.newDocument).map((t: any) => atualizarAssociado(t.assocMatch.id, { cpf: t.newDocument as string }))
      if (enrichments.length > 0) await Promise.all(enrichments)
      
      const toUpdate: any[] = []
      const toInsert: any[] = []

      itemsToProcess.forEach((t: any) => {
        if (t.existingMatch) {
          toUpdate.push({
            id: t.existingMatch.id,
            data: {
              status: 'pago',
              conciliado: true,
              data_conciliacao: new Date().toISOString(),
              banco_transacao_id: t.bank.fitid,
              banco_original_memo: t.bank.memo,
              forma_pagamento: t.bank.metodo_inferido || 'Transferência'
            }
          })
        } else {
          const parts = t.bank.date.split('-').map(Number)
          toInsert.push({
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
            data_conciliacao: new Date().toISOString(),
            banco_transacao_id: t.bank.fitid,
            banco_original_memo: t.bank.memo,
            competencia_mes: parts[1] - 1,
            competencia_ano: parts[0]
          })
        }
      })

      if (toUpdate.length > 0) {
        await Promise.all(toUpdate.map(u => atualizar(u.id, u.data)))
      }

      if (toInsert.length > 0) {
        const res = await inserirBulk(toInsert as any)
        if (res.error) alert(`Erro: ${(res.error as any)?.message || JSON.stringify(res.error)}`)
      }

      // Gerar Logs
      const logs = itemsToProcess.map((t: any) => ({
        data: t.bank.date,
        descricao: editedMemos[t.bank.fitid] || t.bank.memo,
        valor: Math.abs(t.bank.amount),
        tipo: t.bank.type === 'CREDIT' ? 'receita' : 'despesa',
        associado: t.assocMatch?.nome,
        status: 'sucesso',
        mensagem: t.existingMatch ? 'Conciliado com lançamento existente' : 'Novo lançamento criado',
        id_bancario: t.bank.fitid,
        atualizou_cpf: t.needsUpdate && !!t.newDocument,
        novo_cpf: t.newDocument
      }))
      
      setReconciliationLogs(logs)
      await saveLog(logs)
      setIsLogModalOpen(true)
      setProcessedIds(prev => { const next = new Set(prev); itemsToProcess.forEach((it: any) => next.add(it.bank.fitid)); return next; })
    } finally { setIsProcessingBatch(false) }
  }

  const handleExportCurrent = () => {
    const logs = filteredItemsConciliacao.map((t: any) => ({
      data: t.bank.date,
      descricao: editedMemos[t.bank.fitid] || t.bank.memo,
      valor: Math.abs(t.bank.amount),
      tipo: t.bank.type === 'CREDIT' ? 'receita' : 'despesa',
      associado: t.assocMatch?.nome,
      status: 'sucesso' as const,
      mensagem: t.existingMatch ? 'Vínculo Identificado' : 'Aguardando Lançamento',
      id_bancario: t.bank.fitid,
      atualizou_cpf: t.needsUpdate && !!t.newDocument,
      novo_cpf: t.newDocument
    }))
    setReconciliationLogs(logs)
    setIsLogModalOpen(true)
  }

  const handleCoraBatch = async () => {
    const rowsToProcess = filteredItemsConciliacao.filter((t: any) => !existingTxIds.has(t.bank.fitid) && !processedIds.has(t.bank.fitid))
    if (rowsToProcess.length === 0) return alert('Nenhuma nova transação Cora.')
    setIsProcessingBatch(true)
    try {
      const enrichments = rowsToProcess.filter(t => t.needsUpdate && t.assocMatch?.id && t.newDocument).map(t => atualizarAssociado(t.assocMatch.id, { cpf: t.newDocument as string }))
      if (enrichments.length > 0) await Promise.all(enrichments)
      
      const toUpdate: any[] = []
      const toInsert: any[] = []

      rowsToProcess.forEach((t: any) => {
        if (t.existingMatch) {
          toUpdate.push({
            id: t.existingMatch.id,
            data: {
              status: 'pago',
              conciliado: true,
              data_conciliacao: new Date().toISOString(),
              banco_transacao_id: t.bank.fitid,
              banco_original_memo: t.bank.memo,
              forma_pagamento: t.bank.metodo_inferido || 'Transferência'
            }
          })
        } else {
          const parts = t.bank.date.split('-').map(Number)
          toInsert.push({
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
            banco_transacao_id: t.bank.fitid,
            banco_original_memo: t.bank.memo,
            competencia_mes: parts[1] - 1,
            competencia_ano: parts[0]
          })
        }
      })

      if (toUpdate.length > 0) {
        await Promise.all(toUpdate.map(u => atualizar(u.id, u.data)))
      }

      if (toInsert.length > 0) {
        const res = await inserirBulk(toInsert as any)
        if (res.error) alert(`Erro Cora: ${(res.error as any)?.message || JSON.stringify(res.error)}`)
      }

      if (updateStatusBulk) await updateStatusBulk(rowsToProcess.map((i: any) => i.bank.fitid), 'sincronizado')
      
      // Gerar Logs Cora
      const logs = rowsToProcess.map((t: any) => ({
        data: t.bank.date,
        descricao: editedMemos[t.bank.fitid] || t.bank.memo,
        valor: Math.abs(t.bank.amount),
        tipo: t.bank.type === 'CREDIT' ? 'receita' : 'despesa',
        associado: t.assocMatch?.nome,
        status: 'sucesso',
        mensagem: t.existingMatch ? 'Conciliado com provisão existente' : 'Novo lançamento via Cora',
        id_bancario: t.bank.fitid,
        atualizou_cpf: t.needsUpdate && !!t.newDocument,
        novo_cpf: t.newDocument
      }))

      setReconciliationLogs(logs)
      await saveLog(logs)
      setIsLogModalOpen(true)
      setProcessedIds(prev => { const next = new Set(prev); rowsToProcess.forEach(it => next.add(it.bank.fitid)); return next; })
    } finally { setIsProcessingBatch(false) }
  }

  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false)
  const handleCleanupDuplicates = async () => {
    if (!confirm('Deseja remover mensalidades duplicadas que ainda não foram conciliadas?')) return
    setIsCleaningDuplicates(true)
    try {
      const res = await cleanupDuplicateMensalidadesAction()
      if (res.error) alert(`Erro: ${res.error}`)
      else {
        const namesStr = res.names && res.names.length > 0 
          ? `\n\nAssociados afetados:\n- ${res.names.join('\n- ')}` 
          : ''
        alert(`${res.message}${namesStr}`)
      }
    } finally {
      setIsCleaningDuplicates(false)
    }
  }

  const handleCleanupConciliacao = async () => {
    if (!confirm('Deseja remover lançamentos conciliados duplicados (mesma data, valor e descrição)? Esta ação manterá apenas um registro de cada importação repetida.')) return
    setIsCleaningDuplicates(true)
    try {
      const res = await cleanupConciliacaoDuplicatesAction()
      if (res.error) alert(`Erro: ${res.error}`)
      else alert(res.message)
    } finally {
      setIsCleaningDuplicates(false)
    }
  }

  const handleBulkDelete = async () => {
    const res = await removerBulk(selectedIds)
    if (!res.error) {
      setSelectedIds([])
      setIsConfirmDeleteOpen(false)
    } else {
      alert(res.error)
    }
  }

  const handleBulkUpdate = async (data: any) => {
    let finalInput = { ...data }
    // Regra Automática: Se marcar como PAGO em lote, define a data de hoje como data de pagamento
    if (finalInput.status === 'pago') {
      finalInput.data = new Date().toISOString().split('T')[0]
    }

    const res = await atualizarBulk(selectedIds, finalInput)
    if (!res.error) {
      setSelectedIds([])
    } else {
      alert(res.error)
    }
  }

  const filteredItemsConciliacao = useMemo(() => {
    const list = conciliacaoSubTab === 'ofx' ? matchedTransactions : coraMatchedItems
    return list.filter((item: any) => {
      const matchesSearch = item.bank.memo.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'ALL' || item.bank.type === filterType
      const hasMatch = !!(item.assocMatch || item.forMatch)
      const matchesMatch = filterMatch === 'ALL' || (filterMatch === 'FOUND' ? hasMatch : !hasMatch)
      const isDuplicate = existingTxIds.has(item.bank.fitid) || processedIds.has(item.bank.fitid)
      const matchesStatus = filterStatus === 'ALL' || (filterStatus === 'DUPLICATE' ? isDuplicate : !isDuplicate)
      return matchesSearch && matchesType && matchesMatch && matchesStatus
    })
  }, [conciliacaoSubTab, matchedTransactions, coraMatchedItems, searchTerm, filterType, filterMatch, filterStatus, existingTxIds, processedIds])

  // Filtros aplicados baseados na aba ativa (Hub Financeiro)
  const filteredLancamentos = useMemo(() => {
    return lancamentos.filter(item => {
      const m = getMesIdx(item.data)
      const y = getAnoIdx(item.data)
      const matchPeriod = (filterMonth === -1 || m === filterMonth) && y === filterYear
      const matchSearch = (item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || (item.categoria || '').toLowerCase().includes(searchTerm.toLowerCase()))
      
      let matchType = true
      if (activeTab === 'receitas') matchType = item.tipo === 'receita'
      if (activeTab === 'despesas') matchType = item.tipo === 'despesa'
      
      const hasLink = !!(item.associado_id || item.fornecedor_id || item.diretor_id)
      const matchUnlinked = filterUnlinked === 'ALL' || (filterUnlinked === 'LINKED' ? hasLink : !hasLink)
      const matchCategory = filterCategory === 'ALL' || (item.categoria || '').toLowerCase() === filterCategory.toLowerCase()

      return matchPeriod && matchSearch && matchType && matchUnlinked && matchCategory
    })
  }, [lancamentos, filterYear, filterMonth, activeTab, searchTerm, filterUnlinked, filterCategory])

  // KPIs Inteligentes
  const kpiData = useMemo(() => {
    let pInc = 0, pExp = 0, oInc = 0, oExp = 0, fCash = 0, fBank = 0
    lancamentos.forEach(l => {
      const y = getAnoIdx(l.data); if (y !== filterYear) return
      const m = getMesIdx(l.data)
      const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/);
      const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0;
      const valorComTaxa = safeSum(l.valor || 0, taxaVal);
      if ((filterMonth === -1 || m <= filterMonth) && l.status === 'pago') {
        if (l.tipo === 'receita') { l.forma_pagamento === 'Dinheiro' ? fCash = safeSum(fCash, valorComTaxa) : fBank = safeSum(fBank, valorComTaxa) }
        else { l.forma_pagamento === 'Dinheiro' ? fCash = safeDiff(fCash, l.valor) : fBank = safeDiff(fBank, l.valor) }
      }
      if (filterMonth === -1 || m === filterMonth) {
        if (l.tipo === 'receita') { l.status === 'pago' ? pInc = safeSum(pInc, valorComTaxa) : oInc = safeSum(oInc, valorComTaxa) }
        else { l.status === 'pago' ? pExp = safeSum(pExp, l.valor) : oExp = safeSum(oExp, l.valor) }
      }
    })
    return { pInc, pExp, realizado: safeDiff(pInc, pExp), provisionado: oExp, receitaProjetada: safeSum(pInc, oInc), projetado: safeSum(safeDiff(pInc, pExp), safeDiff(oInc, oExp)), saldoCaixa: fCash, saldoBanco: fBank }
  }, [lancamentos, filterYear, filterMonth])

  const chartData = useMemo(() => {
    const rR = Array(12).fill(0), rP = Array(12).fill(0), dR = Array(12).fill(0), dP = Array(12).fill(0)
    lancamentos.forEach(l => {
      const y = getAnoIdx(l.data); if (y !== filterYear) return
      const m = getMesIdx(l.data); if (m === -1) return
      const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/);
      const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0;
      const valorComTaxa = safeSum(l.valor || 0, taxaVal);
      if (l.tipo === 'receita') { l.status === 'pago' ? rR[m] = safeSum(rR[m], valorComTaxa) : rP[m] = safeSum(rP[m], valorComTaxa) }
      else { l.status === 'pago' ? dR[m] = safeSum(dR[m], l.valor) : dP[m] = safeSum(dP[m], l.valor) }
    })
    return { recReal: rR, recProv: rP, despReal: dR, despProv: dP }
  }, [lancamentos, filterYear])

  const fetchContabilMap = useCallback(async () => {
    if (!tenantId) return
    setLoadingContabil(true)
    try {
      const { data, error } = await sb
        .from('lancamentos_contabeis')
        .select('origem_id, numero_lancamento, origem_tipo')
        .eq('tenant_id', tenantId)
        .in('origem_tipo', ['financeiro', 'nfse', 'nfe', 'fiscal_nfse', 'fiscal_nfe'])
      
      if (error) throw error
      if (data) {
        const map: Record<string, string> = {}
        data.forEach((l: any) => {
          if (l.origem_id) map[l.origem_id] = l.numero_lancamento
        })
        setContabilMap(map)
      }
    } catch (err) {
      console.error('Erro ao buscar mapa contábil:', err)
    } finally {
      setLoadingContabil(false)
    }
  }, [tenantId, sb])

  useEffect(() => {
    fetchContabilMap()
  }, [fetchContabilMap])

  const handleSalvar = async (data: any) => {
    setSaving(true)
    try {
      const res = await processFinancialSubmit(data, editingItem, associados, { inserir, atualizar, inserirBulk })
      if (res?.error) {
        const errorMsg = typeof res.error === 'object' ? (res.error.message || JSON.stringify(res.error)) : res.error
        alert(`Erro ao salvar: ${errorMsg}`)
      }
      else { 
        const d = new Date(data.data)
        const savedMonth = d.getMonth()
        const savedYear = d.getFullYear()
        
        if (savedMonth !== filterMonth || savedYear !== filterYear) {
          const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
          alert(`Salvo com sucesso! O lançamento foi criado em ${meses[savedMonth]}/${savedYear}. Altere os filtros acima para visualizá-lo.`)
        }
        
        setEditingItem(null)
        setCurrentEditMemo('')
        setIsModalOpen(false) 
      }
    } catch (err: any) { alert(`Erro inesperado: ${err.message}`) } finally { setSaving(false) }
  }

  const getLinkedName = (item: any) => {
    if (item.associado_id) return associados.find(a => a.id === item.associado_id)?.nome
    if (item.fornecedor_id) return fornecedores.find(f => f.id === item.fornecedor_id)?.nome
    if (item.diretor_id) return diretoria.find(d => d.id === item.diretor_id)?.nome
    return null
  }

  const columns = useMemo(() => [
    { header: 'Data', key: 'data', filterValue: (i: any) => fmtData(i.data), render: (i: any) => <span className="text-xs font-semibold text-slate-600">{fmtData(i.data)}</span> },
    { 
      header: 'Descrição', 
      key: 'descricao', 
      render: (i: any) => {
        const linkedName = getLinkedName(i)
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">{i.descricao}</span>
              {i.banco_transacao_id && (
                <span className="text-[9px] font-black bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                  <RefreshCw size={8} /> OFX
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                {i.categoria}{linkedName ? ` - ${linkedName.toUpperCase()}` : ''}
              </span>
            </div>
          </div>
        )
      } 
    },
    { header: 'Valor', key: 'valor', filterValue: (i: any) => fmtR(i.valor), render: (i: any) => <span className={`text-sm font-extrabold ${i.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>{i.tipo === 'receita' ? '+' : '-'}{fmtR(i.valor)}</span> },
    { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={i.status} type="lancamento" /> },
    { header: 'Pagamento', key: 'forma_pagamento', render: (i: any) => <PaymentBadge method={i.forma_pagamento} /> },
    { header: 'Conciliação', key: 'data_conciliacao', render: (l: any) => (l.conciliado ? (<div className="flex flex-col"><span className="text-[10px] font-bold text-emerald-600">{fmtData(l.data_conciliacao)}</span><span className="text-[8px] text-emerald-400 font-medium uppercase tracking-tighter">Liquidado</span></div>) : (<span className="text-[10px] font-medium text-slate-300 italic uppercase tracking-tighter">Pendente</span>))},
    { 
      header: 'Nota Fiscal', 
      key: 'nfse', 
      render: (l: any) => {
        const vinculo = l.nfse_vinculo?.[0]
        if (!vinculo) return (
          <button 
            onClick={() => { setSelectedLancamentoNF(l); setIsNFSeLinkModalOpen(true) }}
            className="text-[10px] font-medium text-slate-300 italic uppercase tracking-tighter hover:text-indigo-400 transition-colors"
          >
            Não emitida
          </button>
        )
        
        const isNFe = !!vinculo.nfe_id
        const docNum = isNFe ? vinculo.nfe?.numero_nf : vinculo.nfse?.numero_nfse
        const docLabel = isNFe ? 'NF-e' : 'NFS-e'
        
        return (
          <div className="flex items-center gap-2">
            <div className="flex flex-col cursor-pointer" onClick={() => { setSelectedLancamentoNF(l); setIsNFSeLinkModalOpen(true) }}>
              <span className="text-[10px] font-black text-indigo-600 uppercase">{docLabel} {docNum}</span>
              <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-tighter">Escriturada</span>
            </div>
            {(vinculo.nfse?.xml_url || vinculo.nfe?.xml_url) && (
              <a 
                href={vinculo.nfse?.xml_url || vinculo.nfe?.xml_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                title="Ver/Baixar Nota Fiscal"
              >
                <FileText size={12} />
              </a>
            )}
          </div>
        )
      }
    },
    { header: 'Data Lançamento', key: 'created_at', filterValue: (l: any) => l.created_at ? fmtData(l.created_at) : '--', render: (l: any) => <span className="text-[10px] font-bold text-slate-500">{l.created_at ? fmtData(l.created_at) : '--'}</span> },
    { 
      header: 'Contabilizado', 
      key: 'contabil', 
      render: (l: any) => {
        const numero = contabilMap[l.id]
        if (!numero) return <span className="text-[10px] font-medium text-slate-300 italic uppercase tracking-tighter">Não integrado</span>
        return (
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-emerald-600 uppercase">{numero}</span>
            <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-tighter">Livro Diário</span>
          </div>
        )
      }
    },
    { 
      header: '', 
      key: 'acoes', 
      className: 'text-right', 
      render: (i: any) => (
        <div className="flex items-center justify-end gap-2 group-hover:opacity-100 opacity-0 transition-opacity">
          {i.tipo === 'receita' && (
            <button 
              onClick={() => { setCompTarget(i); setIsCompModalOpen(true) }} 
              className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
              title="Indicar Competência"
            >
              <Target size={14} />
            </button>
          )}
          {i.tipo === 'receita' && i.status === 'pago' && (
            <button 
              onClick={() => { setRemanejarTarget(i); setIsRemanejarModalOpen(true) }} 
              className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
              title="Remanejar para outro associado"
            >
              <ArrowRightLeft size={14} />
            </button>
          )}
          <button onClick={() => { setEditingItem(i); setIsModalOpen(true) }} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Pencil size={14} /></button>
          <button onClick={() => confirm('Excluir?') && remover(i.id)} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><XCircle size={14} /></button>
        </div>
      ) 
    }
  ], [associados, fornecedores, diretoria, editedMemos, remover])

  const modalFields: Field[] = useMemo(() => [
    { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [{ value: 'receita', label: 'Ingresso' }, { value: 'despesa', label: 'Dispêndio' }] },
    { name: 'data', label: 'Data', type: 'date', required: true },
    { name: 'descricao', label: 'Descrição', type: 'text', required: true },
    { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'aberto', label: 'Provisionado' }, { value: 'pago', label: 'Efetivado (Pago)' }, { value: 'atrasado', label: 'Atrasado' }] },
    { name: 'conta_id', label: 'Conta', type: 'select', required: true, options: contas.map(c => ({ value: c.id, label: c.nome })) },
    { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: categorias.map(c => ({ value: c.nome, label: c.nome })) },
    { name: 'forma_pagamento', label: 'Forma', type: 'select', options: [{ value: 'PIX', label: 'PIX' }, { value: 'Boleto', label: 'Boleto' }, { value: 'Dinheiro', label: 'Dinheiro' }, { value: 'Transferência', label: 'Transferência' }] },
    { name: 'associado_id', label: 'Associado Individual', type: 'select', showIf: (f: any) => f.tipo === 'receita', options: [{ value: '', label: 'Nenhum' }, ...associados.map(a => ({ value: a.id, label: a.nome }))] },
    { 
      name: 'fornecedor_id', 
      label: 'Fornecedor', 
      type: 'info', 
      showIf: (f: any) => f.tipo === 'despesa', 
      render: (formData, handleChange) => (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <select
              value={formData.fornecedor_id || ''}
              onChange={e => handleChange('fornecedor_id', e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-50 transition-all cursor-pointer appearance-none"
            >
              <option value="">Nenhum Fornecedor</option>
              {fornecedores.map(f => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>
          <button 
            type="button"
            onClick={() => {
              setCurrentEditMemo(formData.descricao || '')
              setIsSupplierCreateOpen(true)
            }}
            className="px-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center shadow-sm"
            title="Cadastrar Novo Fornecedor"
          >
            <Plus size={20} />
          </button>
        </div>
      )
    },
    { 
      name: 'diretor_id', 
      label: 'Diretoria / Pessoal', 
      type: 'select', 
      showIf: (f: any) => f.tipo === 'despesa', 
      options: [{ value: '', label: 'Nenhum' }, ...diretoria.map(d => ({ value: d.id, label: d.nome }))] 
    },
    { name: 'recorrencia_ativa', label: 'Ativar Recorrência?', type: 'checkbox' },
    { name: 'recorrencia_meses', label: 'Repetir por quantos meses?', type: 'select', showIf: (f: any) => f.recorrencia_ativa, defaultValue: '12', options: [
      { value: '1', label: '1 mês' },
      { value: '3', label: '3 meses' },
      { value: '6', label: '6 meses' },
      { value: '12', label: '1 ano (12 meses)' },
      { value: '24', label: '2 anos (24 meses)' },
    ]},
    { name: 'competencia_mes', label: 'Mês de Competência', type: 'select', showIf: (f: any) => f.tipo === 'receita', options: MESES.map((m, idx) => ({ value: String(idx), label: m })) },
    { name: 'competencia_ano', label: 'Ano de Competência', type: 'select', showIf: (f: any) => f.tipo === 'receita', options: [2024, 2025, 2026].map(y => ({ value: String(y), label: String(y) })) },
  ], [contas, categorias, associados, fornecedores, diretoria, isSupplierCreateOpen])

  const conciliacaoStats = useMemo(() => {
    let entries = 0, outings = 0, duplicates = 0;
    filteredItemsConciliacao.forEach((item: any) => {
      const val = Math.abs(Number(item.bank.amount) || 0);
      const isIncome = item.bank.type === 'CREDIT';
      const isOuting = item.bank.type === 'DEBIT';

      if (isIncome) entries += val;
      else if (isOuting) outings += val;
      
      if (existingTxIds.has(item.bank.fitid)) duplicates++;
    });
    return { entries, outings, duplicates };
  }, [filteredItemsConciliacao, existingTxIds]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm"><BarChart2 size={24} /></div>
          <div><h1 className="text-2xl font-black text-slate-800 tracking-tight">Fluxo de Caixa</h1><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestão Financeira Unificada</p></div>
        </div>
      </div>

      <FinancialKpiGrid kpis={kpiData} onNewIngresso={() => { setEditingItem({ tipo: 'receita' }); setIsModalOpen(true) }} onNewDespesa={() => { setEditingItem({ tipo: 'despesa' }); setIsModalOpen(true) }} />

      <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('geral')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'geral' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>📊 Geral</button>
        <button onClick={() => setActiveTab('receitas')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'receitas' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>↑ Ingressos</button>
        <button onClick={() => setActiveTab('despesas')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'despesas' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>↓ Dispêndios</button>
        <button onClick={() => setActiveTab('inadimplencia')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'inadimplencia' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>⚠️ Inadimplência</button>
        <button onClick={() => setActiveTab('conciliacao')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'conciliacao' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>📑 Conciliação</button>
      </div>

      {activeTab === 'geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="📊 Fluxo Mensal" subtitle="Realizado vs Projetado"><Chart type="bar" data={{ labels: MESES, datasets: [{ label: 'Ingresso Real', data: chartData.recReal, backgroundColor: '#10b981', borderRadius: 4, stack: '0' }, { label: 'Ingresso Prov.', data: chartData.recProv, backgroundColor: 'rgba(16,185,129,0.25)', borderRadius: 4, stack: '0' }, { label: 'Disp. Real', data: chartData.despReal, backgroundColor: '#f43f5e', borderRadius: 4, stack: '1' }, { label: 'Disp. Prov.', data: chartData.despProv, backgroundColor: 'rgba(244,63,94,0.25)', borderRadius: 4, stack: '1' }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10, weight: 'bold' } } } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } }} /></ChartCard>
          <ChartCard title="📈 Saldo Acumulado" subtitle="Evolução do caixa"><Line data={{ labels: MESES, datasets: [{ label: 'Saldo (R$)', data: chartData.recReal.map((v, i) => safeDiff(v, chartData.despReal[i])), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.05)', fill: true, tension: 0.4 }] }} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } }} /></ChartCard>
        </div>
      )}

      {activeTab === 'inadimplencia' ? (
        <InadimplenciaTab />
      ) : activeTab === 'conciliacao' ? (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 duration-500">
           {(extrato.length > 0 || (conciliacaoSubTab === 'cora' && (coraItems || []).length > 0)) && (
              <ConciliacaoToolbar 
                contas={contas} selectedContaId={selectedContaId} onContaChange={setSelectedContaId} 
                activeTab={conciliacaoSubTab} categorias={categorias} onBatchCategory={(c: string) => { const next = { ...editedCategories }; filteredItemsConciliacao.forEach((item: any) => { if (!processedIds.has(item.bank.fitid) && !existingTxIds.has(item.bank.fitid)) next[item.bank.fitid] = c }); setEditedCategories(next); }} 
                onAuditAll={async () => {
                  const cpfs = Array.from(new Set(filteredItemsConciliacao.map(i => i.assocMatch?.cpf || i.bank.documento).filter(Boolean))).map(cpf => (cpf as string).replace(/\D/g, ''))
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
                }} isAuditingBatch={isAuditingBatch} 
                onExecute={conciliacaoSubTab === 'ofx' ? handleProcessarLote : handleCoraBatch} 
                isProcessingBatch={isProcessingBatch} hasFilteredItems={filteredItemsConciliacao.length > 0} 
                newItemsCount={conciliacaoSubTab === 'ofx' ? matchedTransactions.filter((t: any) => !ignoredMatches.has(t.bank.fitid) && !existingTxIds.has(t.bank.fitid) && !processedIds.has(t.bank.fitid)).length : coraMatchedItems.filter((t: any) => !existingTxIds.has(t.bank.fitid) && !processedIds.has(t.bank.fitid)).length} 
                totalItemsCount={filteredItemsConciliacao.length}
                totalEntradas={conciliacaoStats.entries}
                totalSaidas={conciliacaoStats.outings}
                duplicatesCount={conciliacaoStats.duplicates}
                onShowHistory={() => setIsHistoryModalOpen(true)}
                onExportCurrent={handleExportCurrent}
                onCleanupConciliacao={handleCleanupConciliacao}
              />
            )}

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm relative z-10 transition-all">
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 text-[11px] font-bold">
                <button onClick={() => setConciliacaoSubTab('ofx')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${conciliacaoSubTab === 'ofx' ? 'bg-white text-emerald-600 shadow-md border border-emerald-50' : 'text-slate-400'}`}><CloudLightning size={14} /> EXTRATO OFX</button>
                <button onClick={() => setConciliacaoSubTab('cora')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${conciliacaoSubTab === 'cora' ? 'bg-white text-emerald-600 shadow-md border border-emerald-50' : 'text-slate-400'}`}><RefreshCw size={14} /> CONEXÃO CORA</button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative group min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="text" placeholder="Filtrar por texto..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-[11px] font-bold outline-none ring-1 ring-slate-100 focus:ring-emerald-500/20 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                <select className="bg-slate-50 text-[11px] font-bold text-slate-600 outline-none border-none p-2.5 rounded-xl ring-1 ring-slate-100" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}><option value="ALL">Todo Tipo</option><option value="CREDIT">Entradas</option><option value="DEBIT">Saídas</option></select>
                <select className="bg-slate-50 text-[11px] font-bold text-slate-600 outline-none border-none p-2.5 rounded-xl ring-1 ring-slate-100" value={filterMatch} onChange={(e) => setFilterMatch(e.target.value as any)}><option value="ALL">Total ({conciliacaoSubTab === 'ofx' ? extrato.length : (coraItems || []).length})</option><option value="FOUND">Com Vínculo</option><option value="NOT_FOUND">Sem Vínculo</option></select>
                <select className="bg-slate-50 text-[11px] font-bold text-slate-600 outline-none border-none p-2.5 rounded-xl ring-1 ring-slate-100" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}><option value="ALL">Todo Status</option><option value="NEW">Não Conciliados</option><option value="DUPLICATE">Conciliados</option></select>
              </div>
            </div>

            {(loading || (conciliacaoSubTab === 'cora' && loadingCora)) ? (<div className="grid grid-cols-1 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} height={80} />)}</div>) : conciliacaoSubTab === 'ofx' ? (
              extrato.length === 0 ? (<OFXUpload onUpload={(data: any) => setExtrato(parseOFX(data))} />) : (
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between px-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lista de Lançamentos ({filteredItemsConciliacao.length})</span><button onClick={() => setExtrato([])} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={14} /> LIMPAR</button></div>
                  {filteredItemsConciliacao.map((item: any) => (<MatchItem key={item.bank.fitid} {...item} isProcessed={processedIds.has(item.bank.fitid)} memo={editedMemos[item.bank.fitid] || item.bank.memo} category={editedCategories[item.bank.fitid] || item.suggestedCategory} allCategories={categorias} onEditMemo={(m: string) => setEditedMemos(prev => ({ ...prev, [item.bank.fitid]: m }))} onEditCategory={(c: string) => setEditedCategories(prev => ({ ...prev, [item.bank.fitid]: c }))} onLinkManual={() => { setSelectedExtrato(item); setIsManualLinkModalOpen(true) }} onLinkSupplier={() => { setSelectedExtrato(item); setIsSupplierLinkModalOpen(true) }} onIgnore={() => setIgnoredMatches(prev => { const n = new Set(prev); if (n.has(item.bank.fitid)) n.delete(item.bank.fitid); else n.add(item.bank.fitid); return n; })} isIgnored={ignoredMatches.has(item.bank.fitid)} isDuplicate={existingTxIds.has(item.bank.fitid)} externalAuditInvoices={auditResults[(item.assocMatch?.cpf || item.bank.documento)?.replace(/\D/g, '')]} />))}
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {(!coraItems || coraItems?.length === 0) ? (<div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-dashed border-slate-200"><RefreshCw size={48} className="text-slate-300 mb-4 animate-spin" /><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sincronizando com Banco Cora...</p></div>) : 
                  filteredItemsConciliacao.map((item: any) => (<MatchItem key={item.bank.fitid} {...item} isCora isDuplicate={existingTxIds.has(item.bank.fitid)} isProcessed={processedIds.has(item.bank.fitid)} memo={editedMemos[item.bank.fitid] || item.bank.memo} category={editedCategories[item.bank.fitid] || item.suggestedCategory} allCategories={categorias} onEditMemo={(m: string) => setEditedMemos(prev => ({ ...prev, [item.bank.fitid]: m }))} onEditCategory={(c: string) => setEditedCategories(prev => ({ ...prev, [item.bank.fitid]: c }))} externalAuditInvoices={auditResults[(item.assocMatch?.cpf || item.bank.documento)?.replace(/\D/g, '')]} />))
                }
              </div>
            )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="relative flex-1 min-w-[250px]"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Buscar no fluxo..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
            <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none"><option value={-1}>Todos Meses</option>{MESES.map((m, idx) => <option key={m} value={idx}>{m}</option>)}</select>
            <select value={filterUnlinked} onChange={(e) => setFilterUnlinked(e.target.value as any)} className="bg-slate-50 px-4 py-3 rounded-2xl text-[11px] font-bold border-none outline-none text-slate-600 transition-all hover:ring-2 hover:ring-emerald-500/10">
              <option value="ALL">Vínculos</option>
              <option value="LINKED">Com Vínculo</option>
              <option value="UNLINKED">Sem Vínculo</option>
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl text-[11px] font-bold border-none outline-none text-slate-600 transition-all hover:ring-2 hover:ring-emerald-500/10">
              <option value="ALL">Todas Categorias</option>
              {[...new Set(categorias.map(c => c.nome))].sort().map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={handleCleanupDuplicates} disabled={isCleaningDuplicates} className="px-4 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-[1px] flex items-center gap-2 transition-all hover:bg-rose-100 disabled:opacity-50" title="Remover mensalidades duplicadas não conciliadas">
                <Trash2 size={14} className={isCleaningDuplicates ? 'animate-spin' : ''} />
                Limpar Provisões
              </button>
              <button onClick={handleCleanupConciliacao} disabled={isCleaningDuplicates} className="px-4 py-4 bg-amber-50 text-amber-600 rounded-2xl text-[10px] font-black uppercase tracking-[1px] flex items-center gap-2 transition-all hover:bg-amber-100 disabled:opacity-50" title="Remover conciliações duplicadas (importação repetida)">
                <RefreshCw size={14} className={isCleaningDuplicates ? 'animate-spin' : ''} />
                Limpar Extrato
              </button>
              <button onClick={() => setIsSyncModalOpen(true)} className="px-6 py-4 bg-slate-50 text-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[1px] flex items-center gap-3 transition-all hover:bg-slate-100">
                <RefreshCw size={14} /> Recorrência em Lote
              </button>
              <button 
                onClick={async () => {
                  if (!confirm('Deseja realizar a Integração Total (Fiscal e Contábil) de todo o exercício?')) return
                  setIsProcessingBatch(true)
                  try {
                    const { integracaoFiscalContabilTotalAction } = await import('@/features/contabil/actions/accountingActions')
                    const res: any = await integracaoFiscalContabilTotalAction(`${filterYear}-01-01`)
                    if (res.success) {
                      const fin = res.financeiro || {}
                      const fis = res.fiscal || {}
                      const msg = [
                        `=== RESULTADO DA INTEGRAÇÃO ===`,
                        ``,
                        `✅ FINANCEIRO`,
                        `  • Total processados: ${fin.total || 0}`,
                        `  • Integrados agora: ${fin.success || 0}`,
                        `  • Já sincronizados: ${fin.alreadySync || 0}`,
                        `  • Pulados (status): ${fin.skippedStatus || 0}`,
                        `  • Pulados (s/ mapeamento): ${fin.skippedMapping || 0}`,
                        fin.errors?.length ? `  ⚠️ Erros: ${fin.errors.slice(0,3).join(' | ')}` : `  ✔️ Sem erros`,
                        ``,
                        `📄 FISCAL`,
                        `  • NFSe: ${fis.nfseCount || 0}`,
                        `  • NFe: ${fis.nfeCount || 0}`,
                        ``,
                        `Tenant: ${res.tenantId || '(n/a)'}`,
                      ].join('\n')
                      alert(msg)
                      fetchContabilMap()
                      refresh()
                    } else {
                      alert(`Erro na integração: ${res.error}`)
                    }
                  } catch (err: any) {
                    alert(`Erro inesperado: ${err.message}`)
                  } finally {
                    setIsProcessingBatch(true) // Forçar refresh visual se necessário
                    setIsProcessingBatch(false)
                  }
                }}
                className="px-6 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[1px] flex items-center gap-3 transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-100"
              >
                <CloudLightning size={14} /> Integração Fiscal e Contábil
              </button>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <DataTable 
              columns={columns as any} 
              data={filteredLancamentos} 
              loading={loading} 
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
            />
          </div>
        </>
      )}

      <CrudModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? 'Editar Lançamento' : 'Novo Lançamento'} 
        initialData={editingItem} 
        onSubmit={handleSalvar} 
        onLoad={(setFn) => setParentSetFormData(() => setFn)}
        onChange={(name, val, setFn) => setParentSetFormData(() => setFn)}
        fields={modalFields} 
        loading={saving} 
      />
      
      <SupplierCreateModal 
        isOpen={isSupplierCreateOpen} 
        onClose={() => setIsSupplierCreateOpen(false)} 
        memo={currentEditMemo}
        inserir={inserirFornecedor}
        onSuccess={(sup) => {
          if (parentSetFormData) {
            parentSetFormData((prev: any) => ({ ...prev, fornecedor_id: sup.id }))
          }
        }}
      />

      <NFSeLinkModal 
        isOpen={isNFSeLinkModalOpen} 
        onClose={() => setIsNFSeLinkModalOpen(false)} 
        lancamento={selectedLancamentoNF}
        onSuccess={() => {
          refresh()
        }}
      />

      <CrudModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} title="Gerar Mensalidades em Lote" onSubmit={async (p: any) => {
        let list = associados.filter(a => a.status === 'ativo');
        if (p.publico_alvo === 'zapsign_new') { 
          list = list.filter(a => { 
            const isZapSign = (a.categoria || '').toLowerCase() === 'zapsign'; 
            const semRecorrencia = !lancamentos.some(l => l.associado_id === a.id && l.categoria === 'Mensalidade'); 
            return isZapSign && semRecorrencia; 
          }); 
        }
        if (!list.length) return alert('Nenhum associado encontrado.');
        
        const batch: any[] = []; 
        let skipped = 0;

        list.forEach(assoc => { 
          for(let i=0; i<Number(p.meses); i++) { 
            const d = new Date(Number(p.ano_inicio), Number(p.mes_inicio)+i, Number(p.dia)); 
            const mesAlvo = d.getMonth();
            const anoAlvo = d.getFullYear();

            // Evitar duplicidade: Verifica se já existe lançamento de 'Mensalidade' para este associado neste mês/ano
            const jaExiste = lancamentos.some(l => 
              l.associado_id === assoc.id && 
              l.tipo === 'receita' &&
              (l.categoria === 'Mensalidade' || l.descricao.toUpperCase().includes('MENSALIDADE')) &&
              (
                (l.competencia_mes === mesAlvo && l.competencia_ano === anoAlvo) ||
                (getMesIdx(l.data) === mesAlvo && getAnoIdx(l.data) === anoAlvo)
              )
            );

            if (jaExiste) {
              skipped++;
              continue;
            }

            batch.push({ 
              tipo: 'receita', 
              descricao: `${p.descricao_padrao.toUpperCase()} - ${assoc.nome.toUpperCase()}`, 
              categoria: 'Mensalidade', 
              valor: assoc.mensalidade || 50, 
              data: d.toISOString().split('T')[0], 
              status: 'aberto', 
              associado_id: assoc.id, 
              conta_id: p.conta_id, 
              forma_pagamento: p.forma_pagamento,
              competencia_mes: mesAlvo,
              competencia_ano: anoAlvo
            }) 
          } 
        })

        if (batch.length === 0) {
          return alert(`Nenhuma mensalidade nova gerada. ${skipped} mensalidades já existiam no sistema para este período.`);
        }

        const res = await inserirBulk(batch); 
        if (!res.error) { 
          alert(`Sucesso! ${res.count} mensalidades geradas.${skipped > 0 ? ` (${skipped} já existiam e foram puladas)` : ''}`); 
          setIsSyncModalOpen(false) 
        } else alert(res.error)
      }} fields={[{ name: 'publico_alvo', label: 'Público Alvo', type: 'select', defaultValue: 'todos', options: [{ value: 'todos', label: 'Todos os Associados Ativos' }, { value: 'zapsign_new', label: 'Apenas Novos ZapSign (Sem Recorrência)' }] }, { name: 'descricao_padrao', label: 'Descrição Base', type: 'text', defaultValue: 'MENSALIDADE' }, { name: 'mes_inicio', label: 'Partir do Mês', type: 'select', defaultValue: new Date().getMonth().toString(), options: MESES.map((m, idx) => ({ value: idx.toString(), label: m })) }, { name: 'ano_inicio', label: 'Ano', type: 'number', defaultValue: new Date().getFullYear().toString() }, { name: 'dia', label: 'Dia', type: 'number', defaultValue: '10' }, { name: 'meses', label: 'Meses', type: 'select', defaultValue: '12', options: [{ value: '1', label: '1 mês' }, { value: '6', label: '6 Meses' }, { value: '12', label: '12 Meses' }] }, { name: 'forma_pagamento', label: 'Forma', type: 'select', defaultValue: 'Boleto', options: [{ value: 'PIX', label: 'PIX' }, { value: 'Boleto', label: 'Boleto' }, { value: 'Dinheiro', label: 'Dinheiro' }] }, { name: 'conta_id', label: 'Conta', type: 'select', options: contas.map(c => ({ value: c.id, label: c.nome })) } ]} />
      
      <ManualMatchModal 
        isOpen={isManualLinkModalOpen} 
        onClose={() => setIsManualLinkModalOpen(false)} 
        extrato={selectedExtrato} 
        onSelect={(assoc: any) => { 
          const tf = selectedExtrato.bank.fitid; 
          setEditedMemos(prev => ({ ...prev, [tf]: enhanceMemo(assoc.nome, selectedExtrato.bank.memo) })); 
          if (conciliacaoSubTab === 'ofx') {
            setExtrato(prev => prev.map((item: any) => item.fitid === tf ? { ...item, assocMatch: assoc, forMatch: null, suggestedCategory: 'Mensalidades' } : item)); 
          } else {
            setCoraItems?.(prev => prev.map((item: any) => (item.cora_id || item.id) === tf ? { ...item, assocMatch: assoc, forMatch: null, suggestedCategory: 'Mensalidades' } : item));
          }
          setIsManualLinkModalOpen(false); 
          setSelectedExtrato(null); 
        }} 
      />
      <SupplierMatchModal 
        isOpen={isSupplierLinkModalOpen} 
        onClose={() => setIsSupplierLinkModalOpen(false)} 
        extrato={selectedExtrato} 
        fornecedores={fornecedores}
        inserir={inserirFornecedor}
        onSelect={(sup: any) => { 
          const tf = selectedExtrato.bank.fitid; 
          setEditedMemos(prevEdit => ({ ...prevEdit, [tf]: enhanceMemo(sup.nome, selectedExtrato.bank.memo) })); 
          if (conciliacaoSubTab === 'ofx') {
            setExtrato(prev => prev.map((tx: any) => tx.fitid === tf ? { ...tx, forMatch: sup, assocMatch: null, suggestedCategory: sup.categoria_padrao || 'Outros' } : tx)); 
          } else {
            setCoraItems?.(prev => prev.map((item: any) => (item.cora_id || item.id) === tf ? { ...item, forMatch: sup, assocMatch: null, suggestedCategory: sup.categoria_padrao || 'Outros' } : item));
          }
          setIsSupplierLinkModalOpen(false); 
          setSelectedExtrato(null); 
        }} 
      />

      <BatchActionBar 
        selectedCount={selectedIds.length} 
        onDelete={() => setIsConfirmDeleteOpen(true)}
        onUpdate={handleBulkUpdate}
        onClear={() => setSelectedIds([])}
        categories={categorias}
      />

      <ConfirmModal 
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Excluir Lançamentos"
        message={`Você tem certeza que deseja excluir permanentemente ${selectedIds.length} lançamentos? Esta ação não poderá ser desfeita.`}
        confirmText="Sim, Excluir Tudo"
        type="danger"
      />

      <IndicarCompetenciaModal 
        isOpen={isCompModalOpen} 
        onClose={() => setIsCompModalOpen(false)} 
        launch={compTarget}
        lancamentos={lancamentos}
        onSave={async (id, mes, ano) => {
          const res = await atualizar(id, { competencia_mes: mes, competencia_ano: ano })
          if (res.error) throw new Error(String(res.error))
        }}
      />

      <RemanejarModal 
        isOpen={isRemanejarModalOpen}
        onClose={() => setIsRemanejarModalOpen(false)}
        original={remanejarTarget}
        associados={associados}
        onConfirm={remanejar}
      />

      <ConciliacaoLogModal 
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        logs={reconciliationLogs}
      />

      <ConciliacaoHistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={logsHistory}
        onSelect={(logs) => {
          setReconciliationLogs(logs)
          setIsLogModalOpen(true)
        }}
      />
    </div>
  )
}
