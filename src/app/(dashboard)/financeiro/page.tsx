'use client'
import React, { useMemo, useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Chart, Line } from 'react-chartjs-2'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { useCategorias } from '@/lib/hooks/useCategorias'
import { useTarefas } from '@/features/gestao-tarefas/hooks/useTarefas'
import { useUsuarios } from '@/lib/hooks/useUsuarios'
import { useCoraStaged } from '@/lib/hooks/useCoraStaged'
import { useOFXParser } from '@/lib/hooks/useOFXParser'
import { useConciliacaoAudit } from '@/features/conciliacao/hooks/useConciliacaoAudit'
import { useTenantId } from '@/lib/hooks/useTenantId'
import { useTenant } from '@/lib/hooks/useTenant'
import { useWhatsAppTemplates } from '@/lib/hooks/useWhatsAppTemplates'
import { DEFAULT_MSG_COBRANCA, DEFAULT_MSG_ADESAO } from '@/features/configuracoes/components/MensagensWhatsappTab'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { createClient } from '@/lib/supabase/client'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal, { Field } from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import ChartCard from '@/components/ui/ChartCard'
import IntegrityDropdown from '@/components/ui/IntegrityDropdown'
import Skeleton from '@/components/ui/Skeleton'
import OFXUpload from '@/components/conciliacao/OFXUpload'
import MatchItem from '@/components/conciliacao/MatchItem'
import ManualMatchModal from '@/components/conciliacao/ManualMatchModal'
import SupplierMatchModal from '@/components/conciliacao/SupplierMatchModal'
import SupplierCreateModal from '@/components/conciliacao/SupplierCreateModal'
import ConciliacaoToolbar from '@/features/conciliacao/components/ConciliacaoToolbar'
import { useFechamento } from '@/lib/hooks/useFechamento'
import { useSearchParams } from 'next/navigation'
import { fmtR, fmtData, fmtHora, safeSum, safeDiff, getDiaIdx, getMesIdx, getAnoIdx, MESES } from '@/lib/utils/formatters'
import { Plus, Pencil, BarChart2, RefreshCw, Search, XCircle, FileCheck, FileText, CloudLightning, Trash2, Target, ArrowRightLeft, ArrowUpRight, ArrowDownRight, AlertTriangle, MoreVertical, CheckCircle2, MessageCircle, Calendar as CalendarIcon, ClipboardList, HandCoins, Unlink } from 'lucide-react'
import { processFinancialSubmit } from '@/features/financeiro/utils/processFinancialSubmit'
import FinancialKpiGrid from '@/features/financeiro/components/FinancialKpiGrid'
import BatchActionBar from '@/components/ui/BatchActionBar'
import ConfirmModal from '@/components/ui/ConfirmModal'

import { AssociadoLancamentos } from '@/components/ui/AssociadoLancamentos'
import dynamic from 'next/dynamic'
const InadimplenciaTab = dynamic(() => import('@/features/financeiro/components/InadimplenciaTab'), { ssr: false })
import IndicarCompetenciaModal from '@/components/ui/IndicarCompetenciaModal'
import { cleanupDuplicateMensalidadesAction, cleanupConciliacaoDuplicatesAction, cleanupWrongMensalidadePatternAction } from '@/app/actions/financeiro_cleanup'
import { trackIrregularitiesAction, auditRecorrenciaFaltantesAction } from '@/app/actions/financeiro_irregularities'
import { desvincularLancamentoAction } from '@/app/actions/desvincular_lancamento'
import FichaAssociadoModal from '@/features/associados/components/ficha-associado/FichaAssociadoModal'
import RemanejarModal from '@/components/ui/RemanejarModal'
import ConciliacaoLogModal from '@/components/conciliacao/ConciliacaoLogModal'
import ConciliacaoHistoryModal from '@/components/conciliacao/ConciliacaoHistoryModal'
import AbonoLancamentoModal from '@/components/financeiro/AbonoLancamentoModal'
import ResumoGeralBlocks from '@/components/financeiro/ResumoGeralBlocks'
import { gerarPdfAbonoLote } from '@/features/financeiro/utils/gerarPdfAbonoLote'
import { useConciliacaoLogs } from '@/lib/hooks/useConciliacaoLogs'
import { useConciliacaoCalendario } from '@/lib/hooks/useConciliacaoCalendario'
const CalendarioConciliacao = dynamic(() => import('@/features/conciliacao/components/CalendarioConciliacao'), { ssr: false })
import { tempFixDatabaseAction } from '@/app/actions/zapsign'
import NFSeLinkModal from '@/features/fiscal/components/nfse/NFSeLinkModal'
import { gerarPdfAbono } from '@/features/financeiro/utils/gerarPdfAbono'
import ManualLinkLancamentoModal from '@/components/conciliacao/ManualLinkLancamentoModal'
import { usePermissions } from '@/lib/hooks/usePermissions'
import AuditRecorrenciaModal from '@/components/ui/AuditRecorrenciaModal'
import RecebimentoManualModal from '@/components/financeiro/RecebimentoManualModal'
import { gerarPdfRecibo } from '@/features/financeiro/utils/gerarPdfRecibo'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

const ActionMenu = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top?: number, bottom?: number, right: number }>({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    const handleScrollOrResize = () => setIsOpen(false);

    document.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [])

  const handleOpen = () => {
    if (buttonRef.current && !isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      if (spaceBelow < 250) {
        setCoords({
          bottom: window.innerHeight - rect.top + 8,
          right: window.innerWidth - rect.right,
        });
      } else {
        setCoords({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button ref={buttonRef} onClick={(e) => { e.stopPropagation(); handleOpen(); }} className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all relative z-10">
        <MoreVertical size={16} />
      </button>
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9998]" style={{ pointerEvents: 'none' }}>
          <div 
            ref={menuRef} 
            className={`fixed min-w-[200px] rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 focus:outline-none z-[9999] p-2 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100 ${coords.bottom ? 'origin-bottom-right' : 'origin-top-right'}`}
            style={{ 
              ...(coords.top !== undefined ? { top: coords.top } : {}), 
              ...(coords.bottom !== undefined ? { bottom: coords.bottom } : {}), 
              right: coords.right, 
              pointerEvents: 'auto' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function FinanceiroPageContent() {
  const { criar, editar, excluir, isAdmin } = usePermissions('financeiro')
  const tenantId = useTenantId()
  const { tenant } = useTenant()
  const { currentUser } = useCurrentUser()
  const { templates } = useWhatsAppTemplates()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab') as any
    if (tab) setActiveTab(tab)
  }, [searchParams])
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
  const { usuarios } = useUsuarios()
  const { tarefas, inserir: inserirTarefa } = useTarefas()

  // Ganchos e Estados de Conciliação
  const { items: coraItems, updateStatusBulk, loading: loadingCora, setItems: setCoraItems, syncWithBank } = useCoraStaged()
  const [isFichaOpen, setIsFichaOpen] = useState(false)
  const [selectedFichaId, setSelectedFichaId] = useState<string | null>(null)
  const { parseOFX } = useOFXParser()
  const [conciliacaoSubTab, setConciliacaoSubTab] = useState<'ofx' | 'cora'>('ofx')
  const [isAlteredExpanded, setIsAlteredExpanded] = useState(false)
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
  const [isTarefaModalOpen, setIsTarefaModalOpen] = useState(false)
  const [tarefaDefaultData, setTarefaDefaultData] = useState<any>(null)
  const [selectedExtrato, setSelectedExtrato] = useState<any>(null)
  
  // Filtros de Conciliação
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL')
  const [filterMatch, setFilterMatch] = useState<'ALL' | 'FOUND' | 'NOT_FOUND'>('ALL')
  const [filterConciliacaoCategory, setFilterConciliacaoCategory] = useState<'ALL' | 'WITH_CAT' | 'WITHOUT_CAT'>('ALL')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NEW' | 'DUPLICATE'>('ALL')

  const { matchedTransactions, coraMatchedItems, existingTxIds } = useConciliacaoAudit(
    extrato, coraItems, conciliacaoSubTab, associados, fornecedores, diretoria, lancamentos, processedIds
  )

  // Estados Base
  const [activeTab, setActiveTab] = useState<'geral' | 'receitas' | 'despesas'>('geral')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDay, setFilterDay] = useState<number>(-1)
  const [filterMonths, setFilterMonths] = useState<number[]>([new Date().getMonth()])
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [filterDateType, setFilterDateType] = useState<'caixa'|'competencia'|'conciliacao'>('caixa')
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [contabilMap, setContabilMap] = useState<Record<string, string>>({})
  const [loadingContabil, setLoadingContabil] = useState(false)
  const [isCompModalOpen, setIsCompModalOpen] = useState(false)
  const [isRemanejarModalOpen, setIsRemanejarModalOpen] = useState(false)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [reconciliationLogs, setReconciliationLogs] = useState<any[]>([])
  const { logsHistory, saveLog } = useConciliacaoLogs()
  const { registrarDiasConciliados } = useConciliacaoCalendario()
  const [compTarget, setCompTarget] = useState<any>(null)
  const [remanejarTarget, setRemanejarTarget] = useState<any>(null)
  const [filterUnlinked, setFilterUnlinked] = useState<'ALL' | 'LINKED' | 'UNLINKED'>('ALL')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [filterConta, setFilterConta] = useState<string>('ALL')
  const [filterPagamento, setFilterPagamento] = useState<string>('ALL')
  const [filterLancamentoStatus, setFilterLancamentoStatus] = useState<string[]>(['ALL'])
  const [filterStatusCobranca, setFilterStatusCobranca] = useState<string>('ALL')
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [isSupplierCreateOpen, setIsSupplierCreateOpen] = useState(false)
  const [parentSetFormData, setParentSetFormData] = useState<any>(null)
  const [currentEditMemo, setCurrentEditMemo] = useState('')
  const [isNFSeLinkModalOpen, setIsNFSeLinkModalOpen] = useState(false)
  const [selectedLancamentoNF, setSelectedLancamentoNF] = useState<any>(null)
  const [isReconciliarModalOpen, setIsReconciliarModalOpen] = useState(false)
  const [selectedLancamentoParaReconciliar, setSelectedLancamentoParaReconciliar] = useState<any>(null)

  // Novos Estados para Ações em Lote
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set())
  const [clearedMatches, setClearedMatches] = useState<Set<string>>(new Set())
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false)
  const [isCobrancaDateModalOpen, setIsCobrancaDateModalOpen] = useState(false)
  const [cobrancaDateTarget, setCobrancaDateTarget] = useState<string[]>([])
  const [isAuditRecorrenciaModalOpen, setIsAuditRecorrenciaModalOpen] = useState(false)
  const [isRecebimentoManualModalOpen, setIsRecebimentoManualModalOpen] = useState(false)
  const [recebimentoManualTarget, setRecebimentoManualTarget] = useState<any>(null)
  
  const [isObsModalOpen, setIsObsModalOpen] = useState(false)
  const [obsTarget, setObsTarget] = useState<any>(null)
  const [obsText, setObsText] = useState('')
  const [cashReservePercentage, setCashReservePercentage] = useState(20)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('@ellus:cashReservePercentage')
      if (saved) {
        setCashReservePercentage(Number(saved))
      }
    }
  }, [])

  const handleCashReserveChange = (val: number) => {
    setCashReservePercentage(val)
    if (typeof window !== 'undefined') {
      localStorage.setItem('@ellus:cashReservePercentage', val.toString())
    }
  }

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

  // Gera descrição padronizada ao trocar categoria no conciliador
  // Preserva rastreabilidade: banco_original_memo continua salvo separadamente
  const gerarDescricaoPadronizadaConciliador = (
    categoria: string,
    tipo: string, // 'CREDIT' | 'DEBIT'
    assocMatch: any,
    forMatch: any
  ): string | null => {
    const cat = categoria.toUpperCase()
    const nome = assocMatch?.nome || forMatch?.nome || assocMatch?.razao_social || forMatch?.razao_social;
    
    if (nome) {
      return tipo === 'CREDIT' ? `RECEB. DE ${cat} - ${nome.toUpperCase()}` : `PGTO DE ${cat} - ${nome.toUpperCase()}`
    }
    
    // Sem vínculo: retorna uma descrição genérica baseada na categoria
    return tipo === 'CREDIT' ? `RECEB. DE ${cat}` : `PGTO DE ${cat}`
  }

  const getMemoForItem = (t: any) => {
    if (editedMemos[t.bank.fitid]) return editedMemos[t.bank.fitid];
    const cat = editedCategories[t.bank.fitid] || t.suggestedCategory;
    if (cat) {
      const desc = gerarDescricaoPadronizadaConciliador(cat, t.bank.type, t.assocMatch, t.forMatch);
      if (desc) return desc;
    }
    return t.bank.memo;
  }

  // ─── Desvincular Lançamento ───────────────────────────────────────────────
  // Usa Server Action com service role para bypassar bloqueio de período fechado.
  const desvincularLancamento = async (lancamento: any) => {
    if (!tenantId) throw new Error('Tenant ID não identificado.')
    const res = await desvincularLancamentoAction(lancamento.id, tenantId)
    if (res.error) throw new Error(res.error)
    refresh()
  };
  // ─────────────────────────────────────────────────────────────────────────

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
          const bankVal = Math.abs(t.bank.amount);
          const existVal = Math.abs(t.existingMatch.valor);

          toUpdate.push({
            id: t.existingMatch.id,
            data: {
              valor: bankVal,
              status: 'pago',
              conciliado: true,
              data_conciliacao: new Date().toISOString(),
              data_caixa: t.bank.date,
              banco_transacao_id: t.bank.fitid,
              banco_original_memo: t.bank.memo,
              forma_pagamento: t.bank.metodo_inferido || 'Transferência'
            }
          })

          if (bankVal < existVal) {
            toInsert.push({
              tipo: t.existingMatch.tipo,
              descricao: `${t.existingMatch.descricao} [PARCIAL]`,
              categoria: t.existingMatch.categoria,
              conta_id: t.existingMatch.conta_id || selectedContaId,
              valor: parseFloat((existVal - bankVal).toFixed(2)),
              data: t.existingMatch.data,
              status: 'aberto',
              forma_pagamento: t.existingMatch.forma_pagamento,
              associado_id: t.existingMatch.associado_id,
              fornecedor_id: t.existingMatch.fornecedor_id,
              diretor_id: t.existingMatch.diretor_id,
              competencia_mes: t.existingMatch.competencia_mes,
              competencia_ano: t.existingMatch.competencia_ano,
              conta_debito_id: t.existingMatch.conta_debito_id,
              conta_credito_id: t.existingMatch.conta_credito_id
            })
          }
        } else {
          const parts = t.bank.date.split('-').map(Number)
          toInsert.push({
            tipo: t.bank.type === 'CREDIT' ? 'receita' : 'despesa',
            descricao: getMemoForItem(t),
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
            data_caixa: t.bank.date,
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

      // Logar pagamento na ficha do associado
      itemsToProcess.forEach((t: any) => {
         const assocId = t.assocMatch?.id || t.existingMatch?.associado_id;
         if (assocId && t.bank.type === 'CREDIT') {
            fetch(`/api/cobranca/associado/${assocId}/acao`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 etapa: 'Pagamento',
                 canal: 'sistema',
                 textoEnviado: `Conciliação Bancária (OFX): ${getMemoForItem(t)}`,
                 observacao: `Pagamento conciliado via OFX (R$ ${Math.abs(t.bank.amount).toFixed(2)})`
               })
            }).catch(console.error)
         }
      })

      // Gerar Logs
      const logs = itemsToProcess.map((t: any) => ({
        data: t.bank.date,
        descricao: getMemoForItem(t),
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
      
      const datasOFX = Array.from(new Set(itemsToProcess.map((t: any) => t.bank.date?.split('T')[0]).filter(Boolean))) as string[]
      datasOFX.sort()
      const periodoStr = datasOFX.length > 0 ? (datasOFX.length > 1 ? `${datasOFX[0]} a ${datasOFX[datasOFX.length - 1]}` : datasOFX[0]) : ''
      let todosOsDiasOFX: { data: string, teve_transacao: boolean }[] = []
      if (datasOFX.length > 0) {
        const d1 = new Date(datasOFX[0] + 'T12:00:00Z')
        const d2 = new Date(datasOFX[datasOFX.length - 1] + 'T12:00:00Z')
        const curr = new Date(d1)
        while (curr <= d2) {
          const ds = curr.toISOString().split('T')[0]
          todosOsDiasOFX.push({ data: ds, teve_transacao: datasOFX.includes(ds) })
          curr.setUTCDate(curr.getUTCDate() + 1)
        }
      }
      const userName = currentUser?.nome || currentUser?.email || 'Usuário Logado'
      const userEmail = currentUser?.email || ''
      await registrarDiasConciliados(selectedContaId, todosOsDiasOFX, userName, userEmail, periodoStr)
      setIsLogModalOpen(true)
      setProcessedIds(prev => { const next = new Set(prev); itemsToProcess.forEach((it: any) => next.add(it.bank.fitid)); return next; })
    } finally { setIsProcessingBatch(false) }
  }

  const handleExportCurrent = () => {
    const logs = filteredItemsConciliacao.map((t: any) => ({
      data: t.bank.date,
      descricao: getMemoForItem(t),
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
          const bankVal = Math.abs(t.bank.amount);
          const existVal = Math.abs(t.existingMatch.valor);

          toUpdate.push({
            id: t.existingMatch.id,
            data: {
              valor: bankVal,
              status: 'pago',
              conciliado: true,
              data_conciliacao: new Date().toISOString(),
              data_caixa: t.bank.date,
              banco_transacao_id: t.bank.fitid,
              banco_original_memo: t.bank.memo,
              forma_pagamento: t.bank.metodo_inferido || 'Transferência'
            }
          })

          if (bankVal < existVal) {
            toInsert.push({
              tipo: t.existingMatch.tipo,
              descricao: `${t.existingMatch.descricao} [PARCIAL]`,
              categoria: t.existingMatch.categoria,
              conta_id: t.existingMatch.conta_id || selectedContaId,
              valor: parseFloat((existVal - bankVal).toFixed(2)),
              data: t.existingMatch.data,
              status: 'aberto',
              forma_pagamento: t.existingMatch.forma_pagamento,
              associado_id: t.existingMatch.associado_id,
              fornecedor_id: t.existingMatch.fornecedor_id,
              diretor_id: t.existingMatch.diretor_id,
              competencia_mes: t.existingMatch.competencia_mes,
              competencia_ano: t.existingMatch.competencia_ano,
              conta_debito_id: t.existingMatch.conta_debito_id,
              conta_credito_id: t.existingMatch.conta_credito_id
            })
          }
        } else {
          const parts = t.bank.date.split('-').map(Number)
          toInsert.push({
            tipo: t.bank.type === 'CREDIT' ? 'receita' : 'despesa',
            descricao: getMemoForItem(t),
            categoria: editedCategories[t.bank.fitid] || t.suggestedCategory || (t.bank.type === 'CREDIT' ? 'Mensalidades' : 'Outros'),
            conta_id: selectedContaId,
            valor: Math.abs(t.bank.amount),
            data: t.bank.date,
            status: 'pago',
            forma_pagamento: t.bank.metodo_inferido || 'Transferência',
            conciliado: true,
            data_conciliacao: new Date().toISOString(),
            associado_id: t.assocMatch?.id || null,
            fornecedor_id: t.forMatch?.isDirector ? null : (t.forMatch?.id || null),
            diretor_id: t.forMatch?.isDirector ? t.forMatch.id : null,
            banco_transacao_id: t.bank.fitid,
            banco_original_memo: t.bank.memo,
            data_caixa: t.bank.date,
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

      // Logar pagamento na ficha do associado
      rowsToProcess.forEach((t: any) => {
         const assocId = t.assocMatch?.id || t.existingMatch?.associado_id;
         if (assocId && t.bank.type === 'CREDIT') {
            fetch(`/api/cobranca/associado/${assocId}/acao`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 etapa: 'Pagamento',
                 canal: 'sistema',
                 textoEnviado: `Conciliação Automática (Cora): ${getMemoForItem(t)}`,
                 observacao: `Pagamento conciliado via Cora (R$ ${Math.abs(t.bank.amount).toFixed(2)})`
               })
            }).catch(console.error)
         }
      })

      if (updateStatusBulk) await updateStatusBulk(rowsToProcess.map((i: any) => i.bank.fitid), 'sincronizado')
      
      // Gerar Logs Cora
      const logs = rowsToProcess.map((t: any) => ({
        data: t.bank.date,
        descricao: getMemoForItem(t),
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
      
      const datasCora = Array.from(new Set(rowsToProcess.map((t: any) => t.bank.date?.split('T')[0]).filter(Boolean))) as string[]
      datasCora.sort()
      const periodoCoraStr = datasCora.length > 0 ? (datasCora.length > 1 ? `${datasCora[0]} a ${datasCora[datasCora.length - 1]}` : datasCora[0]) : ''
      let todosOsDiasCora: { data: string, teve_transacao: boolean }[] = []
      if (datasCora.length > 0) {
        const d1 = new Date(datasCora[0] + 'T12:00:00Z')
        const d2 = new Date(datasCora[datasCora.length - 1] + 'T12:00:00Z')
        const curr = new Date(d1)
        while (curr <= d2) {
          const ds = curr.toISOString().split('T')[0]
          todosOsDiasCora.push({ data: ds, teve_transacao: datasCora.includes(ds) })
          curr.setUTCDate(curr.getUTCDate() + 1)
        }
      }
      const userName = currentUser?.nome || currentUser?.email || 'Usuário Logado'
      const userEmail = currentUser?.email || ''
      await registrarDiasConciliados(selectedContaId, todosOsDiasCora, userName, userEmail, periodoCoraStr)
      setIsLogModalOpen(true)
      setProcessedIds(prev => { const next = new Set(prev); rowsToProcess.forEach(it => next.add(it.bank.fitid)); return next; })
    } finally { setIsProcessingBatch(false) }
  }

  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false)
  const handleCleanupDuplicates = async () => {
    if (!tenantId) return alert('Tenant não identificado')
    if (!confirm('Deseja remover mensalidades duplicadas que ainda não foram conciliadas?')) return
    setIsCleaningDuplicates(true)
    try {
      const res = await cleanupDuplicateMensalidadesAction(tenantId)
      if (res.error) alert(`Erro: ${res.error}`)
      else {
        alert('Limpeza concluída com sucesso.')
      }
    } finally {
      setIsCleaningDuplicates(false)
    }
  }

  const handleCleanupConciliacao = async () => {
    if (!tenantId) return alert('Tenant não identificado')
    if (!confirm('Deseja remover lançamentos conciliados duplicados (mesma data, valor e descrição)? Esta ação manterá apenas um registro de cada importação repetida.')) return
    setIsCleaningDuplicates(true)
    try {
      const res = await cleanupConciliacaoDuplicatesAction(tenantId)
      if (res.error) alert(`Erro: ${res.error}`)
      else alert(res.message)
    } finally {
      setIsCleaningDuplicates(false)
    }
  }

  const handleBulkUpdate = async (data: any) => {
    if (selectedIds.length === 0) return
    if (!confirm(`Atualizar ${selectedIds.length} lançamentos?`)) return
    
    // Se está sendo pago, registrar no histórico
    if (data.status === 'pago') {
      const today = new Date().toISOString().split('T')[0]
      for (const id of selectedIds) {
        const lanc = lancamentos.find(l => l.id === id)
        if (lanc?.associado_id) {
          fetch(`/api/cobranca/associado/${lanc.associado_id}/acao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              etapa: 'Pagamento',
              canal: 'sistema',
              textoEnviado: `Pagamento em lote (Financeiro): ${lanc.descricao || 'Mensalidade'}`,
              observacao: `Pagamento confirmado em lote (R$ ${lanc.valor.toFixed(2)})`
            })
          }).catch(console.error)
        }
      }
    }

    const res = await atualizarBulk(selectedIds, data)
    if (!res?.error) {
      alert('Atualização concluída.')
      setSelectedIds([])
    } else {
      alert('Erro ao atualizar: ' + res.error)
    }
  }

  const handleRegistrarCobrancaLote = () => {
    if (selectedIds.length === 0) return
    setCobrancaDateTarget(selectedIds)
    setIsCobrancaDateModalOpen(true)
  }

  const registrarCobrancaLoteAction = async (data: any) => {
    const ids = cobrancaDateTarget
    if (!ids || ids.length === 0) return
    setIsCobrancaDateModalOpen(false)

    // Atualiza status_cobranca para EM COBRANÇA
    const res = await atualizarBulk(ids, { status_cobranca: 'EM COBRANÇA' })
    if (res?.error) {
      alert('Erro ao marcar como em cobrança: ' + res.error)
      return
    }

    // Registrar ação para cada associado
    const dataCobranca = data.data_cobranca || new Date().toISOString().split('T')[0]
    const obs = data.observacao || 'Cobrança em lote'

    for (const id of ids) {
      const lanc = lancamentos.find(l => l.id === id)
      if (lanc?.associado_id) {
        await fetch(`/api/cobranca/associado/${lanc.associado_id}/acao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            etapa: 'EmCobrança'.substring(0, 10),
            canal: 'sistema',
            textoEnviado: `Cobrança registrada manualmente em ${dataCobranca.split('-').reverse().join('/')}`,
            observacao: `${obs} (Lanc: ${lanc.descricao || 'Mensalidade'}) - Data base da cobrança informada.`
          })
        }).catch(console.error)
      }
    }

    alert('Cobrança registrada no histórico e marcados com tag EM COBRANÇA com sucesso.')
    setSelectedIds([])
    setCobrancaDateTarget([])
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

  const handleBulkAbonar = async (motivo: string) => {
    const caixaConta = contas.find(c => c.nome.toLowerCase().includes('caixa'))
    const dataToUpdate: any = {
      status: 'cancelado',
      banco_original_memo: `[ABONO] Motivo: ${motivo} | Por: Sistema`,
      valor: 0,
      forma_pagamento: 'DINHEIRO'
    }
    if (caixaConta) {
      dataToUpdate.conta_id = caixaConta.id
    }
    const res = await atualizarBulk(selectedIds, dataToUpdate)
    if (!res.error) {
      // Gera o pdf em lote
      const lancamentosAbonados = selectedIds.map(id => lancamentos.find((l: any) => l.id === id)).filter(Boolean)
      if (lancamentosAbonados.length > 0) {
        gerarPdfAbonoLote(lancamentosAbonados, associados, 'download')
      }
      setSelectedIds([])
      setIsAbonoModalOpen(false)
    } else {
      alert(res.error)
    }
  }

  const handleRecebimentoManual = async (data: any) => {
    if (!recebimentoManualTarget) return

    const { data_recebimento, forma_pagamento, conta_id, diretor_id } = data
    
    const res = await atualizar(recebimentoManualTarget.id, {
      status: 'pago',
      data_caixa: data_recebimento,
      forma_pagamento: forma_pagamento,
      conta_id: conta_id,
      diretor_id: diretor_id
    })

    if (res?.error) {
      alert('Erro ao confirmar recebimento: ' + res.error)
      return
    }

    if (forma_pagamento === 'DINHEIRO' && recebimentoManualTarget.associado_id) {
      const assoc = associados.find(a => a.id === recebimentoManualTarget.associado_id)
      const recebedor = diretoria.find(d => d.id === diretor_id)
      if (assoc) {
        const updatedLancamento = { ...recebimentoManualTarget, data_caixa: data_recebimento, forma_pagamento }
        gerarPdfRecibo(assoc, updatedLancamento, recebedor?.nome || '', 'download', tenant?.logo_url)
      }
    }

    alert('Recebimento registrado com sucesso.')
    setIsRecebimentoManualModalOpen(false)
    setRecebimentoManualTarget(null)
  }

  const filteredItemsConciliacao = useMemo(() => {
    const list = conciliacaoSubTab === 'ofx' ? matchedTransactions : coraMatchedItems
    return list.map((item: any) => {
      if (clearedMatches.has(item.bank.fitid)) {
        return { ...item, assocMatch: undefined, forMatch: undefined }
      }
      return item
    }).filter((item: any) => {
      const searchTermsConcil = searchTerm.toLowerCase().split(/\s+/).filter(Boolean)
      const targetTextConcil = (item.bank.memo || '').toLowerCase()
      const matchesSearch = searchTermsConcil.length === 0 || searchTermsConcil.every(term => targetTextConcil.includes(term))
      const matchesType = filterType === 'ALL' || item.bank.type === filterType
      const hasMatch = !!(item.assocMatch || item.forMatch)
      const matchesMatch = filterMatch === 'ALL' || (filterMatch === 'FOUND' ? hasMatch : !hasMatch)
      const isDuplicate = existingTxIds.has(item.bank.fitid) || processedIds.has(item.bank.fitid)
      const matchesStatus = filterStatus === 'ALL' || (filterStatus === 'DUPLICATE' ? isDuplicate : !isDuplicate)
      const cat = editedCategories[item.bank.fitid] || item.suggestedCategory
      const matchesCat = filterConciliacaoCategory === 'ALL' || (filterConciliacaoCategory === 'WITH_CAT' ? !!cat : !cat)
      return matchesSearch && matchesType && matchesMatch && matchesStatus && matchesCat
    })
  }, [conciliacaoSubTab, matchedTransactions, coraMatchedItems, searchTerm, filterType, filterMatch, filterStatus, filterConciliacaoCategory, editedCategories, existingTxIds, processedIds, clearedMatches])

  // Filtros aplicados baseados na aba ativa (Hub Financeiro)
  const filteredLancamentos = useMemo(() => {
    return lancamentos.filter(item => {
      // Statuses considerados "realizados" (igual ao dashboard)
      const statusLower = (item.status || '').toLowerCase()
      const isPago = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso'].includes(statusLower)
        || statusLower === 'parcial'
        || !!item.data_conciliacao

      let d = getDiaIdx(item.data)
      let m = getMesIdx(item.data)
      let y = getAnoIdx(item.data)

      if (filterDateType === 'caixa') {
        // Visão Caixa: só o que foi pago/realizado
        if (!isPago) return false
        // Usa data_caixa prioritariamente. Fallback para conciliacao e data (histórico)
        const baseDate = item.data_caixa || item.data_conciliacao || item.data
        d = getDiaIdx(baseDate)
        m = getMesIdx(baseDate)
        y = getAnoIdx(baseDate)
      } else if (filterDateType === 'conciliacao') {
        // Visão Conciliação: lançamentos conciliados, posicionados pela data de conciliação
        if (!item.data_conciliacao) return false;
        d = getDiaIdx(item.data_conciliacao)
        m = getMesIdx(item.data_conciliacao)
        y = getAnoIdx(item.data_conciliacao)
      } else if (filterDateType === 'competencia') {
        // Visão Competência: tudo do mês (pago ou não), prioriza campo competencia
        if (item.competencia_mes !== undefined && item.competencia_mes !== null) m = item.competencia_mes
        if (item.competencia_ano !== undefined && item.competencia_ano !== null) y = item.competencia_ano
        // Na visão competência, o dia pode não existir (fica -1). Vamos aceitar.
      }
      
      const matchPeriod = (filterDay === -1 || d === filterDay || d === -1) && (filterMonths.includes(-1) || filterMonths.includes(m)) && y === filterYear
      
      const searchTermsHub = searchTerm.toLowerCase().split(/\s+/).filter(Boolean)
      const targetTextHub = [
        item.descricao, 
        item.categoria, 
        item.banco_original_memo, 
        (item as any).observacao,
        item.status_cobranca,
        item.banco_transacao_id,
        (item as any).cora_id,
      ].filter(Boolean).join(' ').toLowerCase()
      const matchSearch = searchTermsHub.length === 0 || searchTermsHub.every(term => targetTextHub.includes(term))
      
      let matchType = true
      if (activeTab === 'receitas') matchType = item.tipo === 'receita'
      if (activeTab === 'despesas') matchType = item.tipo === 'despesa'
      
      const hasLink = !!(item.associado_id || item.fornecedor_id || item.diretor_id)
      const matchUnlinked = filterUnlinked === 'ALL' || (filterUnlinked === 'LINKED' ? hasLink : !hasLink)
      const matchCategory = filterCategory === 'ALL' || (filterCategory === 'SEM_CATEGORIA' ? !item.categoria : (item.categoria || '').toLowerCase() === filterCategory.toLowerCase())
      const matchConta = filterConta === 'ALL' || (filterConta === 'SEM_CONTA' ? !item.conta_id : item.conta_id === filterConta)
      const matchPagamento = filterPagamento === 'ALL' || (item.forma_pagamento || '').toLowerCase() === filterPagamento.toLowerCase()
      const matchStatus = filterLancamentoStatus.includes('ALL') || filterLancamentoStatus.includes((item.status || '').toLowerCase())
      const matchStatusCobranca = filterStatusCobranca === 'ALL' || 
                                  (filterStatusCobranca === 'EM_COBRANCA' ? item.status_cobranca === 'EM COBRANÇA' : item.status_cobranca !== 'EM COBRANÇA')

      return matchPeriod && matchSearch && matchType && matchUnlinked && matchCategory && matchConta && matchPagamento && matchStatus && matchStatusCobranca
    })
  }, [lancamentos, filterDay, filterYear, filterMonths, activeTab, searchTerm, filterUnlinked, filterCategory, filterDateType, filterConta, filterPagamento, filterLancamentoStatus, filterStatusCobranca])

  const contasComSaldo = useMemo(() => {
    return contas.map(c => {
      let saldo = Number(c.saldo_inicial || 0)
      lancamentos.forEach(l => {
        if (l.conta_id === c.id) {
          const statusLower = (l.status || '').toLowerCase()
          const isPago = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso'].includes(statusLower) || statusLower === 'parcial' || !!l.data_conciliacao
          if (isPago) {
            if (l.tipo === 'receita') {
              saldo += Number(l.valor || 0)
            } else {
              saldo -= Number(l.valor || 0)
            }
          }
        }
      })
      return { ...c, saldo }
    })
  }, [contas, lancamentos])

  // KPIs Inteligentes
  const kpiData = useMemo(() => {
    let pInc = 0, pExp = 0, oInc = 0, oExp = 0, fCash = 0, fBank = 0
    lancamentos.forEach(l => {
      const statusLower = (l.status || '').toLowerCase()
      const isPago = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso'].includes(statusLower)
        || statusLower === 'parcial'
        || !!l.data_conciliacao

      let d = getDiaIdx(l.data)
      let m = getMesIdx(l.data)
      let y = getAnoIdx(l.data)

      if (filterDateType === 'caixa') {
        if (!isPago) return
        const baseDate = l.data_caixa || l.data_conciliacao || l.data
        d = getDiaIdx(baseDate)
        m = getMesIdx(baseDate)
        y = getAnoIdx(baseDate)
      } else if (filterDateType === 'conciliacao') {
        if (!l.data_conciliacao) return;
        d = getDiaIdx(l.data_conciliacao)
        m = getMesIdx(l.data_conciliacao)
        y = getAnoIdx(l.data_conciliacao)
      } else if (filterDateType === 'competencia') {
        if (l.competencia_mes !== undefined && l.competencia_mes !== null) m = l.competencia_mes
        if (l.competencia_ano !== undefined && l.competencia_ano !== null) y = l.competencia_ano
      }

      if (y !== filterYear) return
      // Para o KPI também aplicamos o dia (se definido)
      if (filterDay !== -1 && d !== filterDay && d !== -1) return
      const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/);
      const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0;
      const valorComTaxa = safeSum(l.valor || 0, taxaVal);
      if ((filterMonths.includes(-1) || m <= Math.max(...filterMonths)) && l.status === 'pago') {
        const cta = contas.find(c => c.id === l.conta_id);
        const isCash = l.forma_pagamento === 'Dinheiro' || (cta && cta.nome.toLowerCase().includes('espécie'));
        if (l.tipo === 'receita') { isCash ? fCash = safeSum(fCash, valorComTaxa) : fBank = safeSum(fBank, valorComTaxa) }
        else { isCash ? fCash = safeDiff(fCash, l.valor) : fBank = safeDiff(fBank, l.valor) }
      }
      if (filterMonths.includes(-1) || filterMonths.includes(m)) {
        if (l.tipo === 'receita') { isPago ? pInc = safeSum(pInc, valorComTaxa) : oInc = safeSum(oInc, valorComTaxa) }
        else { isPago ? pExp = safeSum(pExp, l.valor) : oExp = safeSum(oExp, l.valor) }
      }
    })
    return { pInc, pExp, realizado: safeDiff(pInc, pExp), provisionado: oExp, receitaProjetada: safeSum(pInc, oInc), projetado: safeSum(safeDiff(pInc, pExp), safeDiff(oInc, oExp)), saldoCaixa: fCash, saldoBanco: fBank }
  }, [lancamentos, filterDay, filterYear, filterMonths, filterDateType, contas])

  const chartData = useMemo(() => {
    const rR = Array(12).fill(0), rP = Array(12).fill(0), dR = Array(12).fill(0), dP = Array(12).fill(0)
    lancamentos.forEach(l => {
      let dStr = l.data;
      if (filterDateType === 'competencia') {
        dStr = (l as any).data_vencimento || l.data;
      } else if (filterDateType === 'conciliacao') {
        if (!l.data_conciliacao) return;
        dStr = l.data_conciliacao;
      }

      let y = getAnoIdx(dStr);
      let m = getMesIdx(dStr);

      if (filterDateType === 'competencia') {
        if (l.competencia_mes !== undefined && l.competencia_mes !== null) m = Number(l.competencia_mes);
        if (l.competencia_ano !== undefined && l.competencia_ano !== null) y = Number(l.competencia_ano);
      }

      if (y !== filterYear) return
      if (m === -1) return
      if (!filterMonths.includes(-1) && !filterMonths.includes(m)) return

      const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/);
      const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0;
      const valorComTaxa = safeSum(l.valor || 0, taxaVal);

      const statusLower = (l.status || '').toLowerCase()
      const isPago = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso'].includes(statusLower) || statusLower === 'parcial' || !!l.data_conciliacao

      if (l.tipo === 'receita') { 
        if (isPago) rR[m] = safeSum(rR[m], valorComTaxa);
        else if (filterDateType === 'competencia') rP[m] = safeSum(rP[m], valorComTaxa);
      } else { 
        if (isPago) dR[m] = safeSum(dR[m], l.valor);
        else if (filterDateType === 'competencia') dP[m] = safeSum(dP[m], l.valor);
      }
    })
    return { recReal: rR, recProv: rP, despReal: dR, despProv: dP }
  }, [lancamentos, filterYear, filterDateType, filterMonths])

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
      let finalData = { ...data };
      const fv = finalData.fixo_variavel;
      delete finalData.fixo_variavel;
      finalData.descricao = (finalData.descricao || '').replace(/ \[FIXO\]| \[VARIÁVEL\]/g, '');
      if (fv === 'fixo') finalData.descricao += ' [FIXO]';
      if (fv === 'variavel') finalData.descricao += ' [VARIÁVEL]';

      const res = await processFinancialSubmit(finalData, editingItem, associados, contas, { inserir, atualizar, inserirBulk })
      if (res?.error) {
        const errorMsg = typeof res.error === 'object' ? (res.error.message || JSON.stringify(res.error)) : res.error
        alert(`Erro ao salvar: ${errorMsg}`)
      }
      else { 
        const d = new Date(data.data)
        const savedMonth = d.getMonth()
        const savedYear = d.getFullYear()
        
        if ((!filterMonths.includes(-1) && !filterMonths.includes(savedMonth)) || savedYear !== filterYear) {
          const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
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

  const filteredSubtotal = useMemo(() => {
    return filteredLancamentos.reduce((acc, curr) => {
      const val = curr.valor || 0;
      return curr.tipo === 'receita' ? safeSum(acc, val) : safeDiff(acc, val);
    }, 0);
  }, [filteredLancamentos]);

  const columns = useMemo(() => [
    { header: 'Data', key: 'data', filterValue: (i: any) => fmtData(i.data), render: (i: any) => <span className="text-xs font-semibold text-slate-600">{fmtData(i.data)}</span> },
    { 
      header: 'Descrição', 
      key: 'descricao', 
      render: (i: any) => {
        const linkedName = getLinkedName(i)
        const isParcial = (i.descricao || '').includes('[PARCIAL]')
        const cleanDesc = (i.descricao || '').replace(/ \[FIXO\]| \[VARIÁVEL\]| \[PARCIAL\]| \[OBS:.*?\]/g, '')
        const obsMatch = (i.descricao || '').match(/\[OBS: (.*?)\]/)
        const hasObs = !!obsMatch
        const hasTarefaEmCurso = !!(i.descricao && tarefas?.some(t => {
          if (t.status === 'Concluído' || !t.descricao) return false;
          if (t.descricao.includes(`[Lançamento ID: ${i.id}]`)) return true;
          return t.descricao.includes(cleanDesc);
        }))

        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {i.banco_transacao_id && (
                <span className="text-[9px] font-black bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                  <RefreshCw size={8} /> OFX
                </span>
              )}
              {i.status_cobranca === 'EM COBRANÇA' && (
                <span className="text-[9px] font-black bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200 flex items-center gap-1">
                  <AlertTriangle size={8} /> EM COBRANÇA
                </span>
              )}
              {isParcial && (
                <span className="text-[9px] font-black bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                  <RefreshCw size={8} /> PARCIAL
                </span>
              )}
              {hasTarefaEmCurso && (
                <span className="text-[9px] font-black bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                  Tarefa em curso
                </span>
              )}
              {hasObs && (
                <span 
                  className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-200 cursor-help flex items-center gap-1"
                  title={obsMatch[1]}
                >
                  OBS
                </span>
              )}
              <span className="text-sm font-bold text-slate-800">{cleanDesc}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center">
                {i.categoria}
                {linkedName && i.associado_id ? (
                  <span 
                    className="cursor-pointer text-indigo-500 hover:text-indigo-700 hover:underline ml-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFichaId(i.associado_id)
                      setIsFichaOpen(true)
                    }}
                  >
                    - {linkedName.toUpperCase()}
                  </span>
                ) : linkedName ? (
                  <span className="ml-1">- {linkedName.toUpperCase()}</span>
                ) : null}
              </span>
            </div>
            {i.banco_original_memo && (
              <span className="text-[9px] text-slate-400 font-bold italic truncate max-w-[350px] mt-0.5">
                Extrato: {i.banco_original_memo}
              </span>
            )}
          </div>
        )
      } 
    },
    { 
      header: 'Natureza', 
      key: 'natureza_fixo_variavel', 
      render: (i: any) => {
        const isFixo = i.descricao?.includes('[FIXO]');
        const isVar = i.descricao?.includes('[VARIÁVEL]');
        if (isFixo) return <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">Fixo</span>;
        if (isVar) return <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">Variável</span>;
        return <span className="text-[10px] font-medium text-slate-300 italic">--</span>;
      } 
    },
    { header: `Valor (${fmtR(filteredSubtotal)})`, key: 'valor', filterValue: (i: any) => fmtR(i.valor), render: (i: any) => <span className={`text-sm font-extrabold ${i.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>{i.tipo === 'receita' ? '+' : '-'}{fmtR(i.valor)}</span> },
    { header: 'Status', key: 'status', render: (i: any) => {
      const isAbonado = i.status === 'cancelado' && i.banco_original_memo?.includes('[ABONO]');
      return <StatusBadge status={isAbonado ? 'abonado' : i.status} type="lancamento" />;
    } },
    { header: 'Pagamento', key: 'forma_pagamento', render: (i: any) => <PaymentBadge method={i.forma_pagamento} /> },
    // { header: 'Conciliação', key: 'data_conciliacao', render: (l: any) => (l.conciliado ? (<div className="flex flex-col"><span className="text-[10px] font-bold text-emerald-600">{fmtData(l.data_conciliacao)}</span><span className="text-[8px] text-emerald-400 font-medium uppercase tracking-tighter">Liquidado</span></div>) : (<span className="text-[10px] font-medium text-slate-300 italic uppercase tracking-tighter">Pendente</span>))},

    { header: 'Data Lançamento', key: 'created_at', filterValue: (l: any) => l.created_at ? fmtData(l.created_at) : '--', render: (l: any) => <span className="text-[10px] font-bold text-slate-500">{l.created_at ? fmtData(l.created_at) : '--'}</span> },
    { header: 'Últ. Cobrança', key: 'data_ultima_cobranca', filterValue: (l: any) => l.data_ultima_cobranca ? fmtData(l.data_ultima_cobranca) : '--', render: (l: any) => <span className="text-[10px] font-bold text-orange-500">{l.data_ultima_cobranca ? fmtData(l.data_ultima_cobranca) : '--'}</span> },
    { 
      header: '', 
      key: 'acoes', 
      className: 'text-right', 
      stopClickPropagation: true,
      render: (i: any) => (
        <div className="flex items-center justify-end">
          <ActionMenu>
            {i.tipo === 'receita' && i.associado_id && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const assoc = associados.find(a => a.id === i.associado_id);
                  if (!assoc || !assoc.telefone) {
                    alert('Associado não encontrado ou sem telefone cadastrado.');
                    return;
                  }
                  const phone = assoc.telefone.replace(/\D/g, '');
                  const nomeCompleto = assoc.nome || 'Associado';
                  const desc = i.descricao ? i.descricao.replace(/ \[FIXO\]| \[VARIÁVEL\]| \[PARCIAL\]/g, '') : i.categoria;
                  const d = i.data ? new Date(i.data) : null;
                  const dataFormatada = d ? new Date(d.getTime() + d.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR') : '';
                  const itemDescricao = `${desc}${dataFormatada ? ` - ${dataFormatada}` : ''}`;

                  const emojiDocument = String.fromCodePoint(0x1F4C4);
                  const emojiSmile = String.fromCodePoint(0x1F60A);
                  
                  let templateCobranca = templates.cobranca || DEFAULT_MSG_COBRANCA;
                  if (i.categoria && i.categoria.toLowerCase().includes('adesão') || i.categoria && i.categoria.toLowerCase().includes('adesao')) {
                    templateCobranca = templates.adesao || DEFAULT_MSG_ADESAO;
                  }
                  
                  const valorStr = `R$ ${(i.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                  const msg = templateCobranca
                    .replace(/\{\{nome\}\}/g, nomeCompleto)
                    .replace(/\{\{descricao\}\}/g, itemDescricao)
                    .replace(/\{\{data\}\}/g, dataFormatada)
                    .replace(/\{\{valor\}\}/g, valorStr)
                    .replace(/📄/g, emojiDocument)
                    .replace(/😊/g, emojiSmile);
                  
                  window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(msg)}`, '_blank');
                  document.body.click();
                }} 
                className="flex items-center gap-3 w-full px-3 py-2 text-left text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
              >
                <MessageCircle size={14} /> WhatsApp Cobrança
              </button>
            )}
            {i.tipo === 'receita' && i.status !== 'pago' && i.status !== 'cancelado' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setRecebimentoManualTarget(i);
                  setIsRecebimentoManualModalOpen(true);
                  document.body.click();
                }} 
                className="flex items-center gap-3 w-full px-3 py-2 text-left text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
              >
                <HandCoins size={14} /> Receber Manualmente
              </button>
            )}
            {i.tipo === 'receita' && i.associado_id && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setCobrancaDateTarget([i.id])
                  setIsCobrancaDateModalOpen(true)
                  document.body.click()
                }} 
                className="flex items-center gap-3 w-full px-3 py-2 text-left text-[11px] font-bold text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
              >
                <MessageCircle size={14} /> Registrar Cobrança (Tag)
              </button>
            )}
            {(i.status === 'cancelado' && i.banco_original_memo?.includes('[ABONO]')) && i.associado_id && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const assoc = associados.find(a => a.id === i.associado_id);
                  if (!assoc) {
                    alert('Associado não encontrado.');
                    return;
                  }
                  gerarPdfAbono(assoc, i, 'download');
                  document.body.click();
                }} 
                className="flex items-center gap-3 w-full px-3 py-2 text-left text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              >
                <FileText size={14} /> Gerar Recibo de Abono
              </button>
            )}
            {i.tipo === 'receita' && (
              <button 
                onClick={() => { setCompTarget(i); setIsCompModalOpen(true); document.body.click() }} 
                className="flex items-center gap-3 w-full px-3 py-2 text-left text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
              >
                <Target size={14} /> Indicar Competência
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const assoc = associados.find(a => a.id === i.associado_id);
                const assocFirstName = assoc ? assoc.nome.split(' ')[0] : '';
                const baseTitle = assocFirstName ? `Verificar pendência - ${assocFirstName}` : 'Verificar pendência';
                
                setTarefaDefaultData({
                  titulo: baseTitle,
                  descricao: `Tarefa gerada a partir do lançamento financeiro:\nDescrição: ${i.descricao}\nValor: R$ ${i.valor}\nData: ${i.data ? new Date(i.data).toLocaleDateString('pt-BR') : ''}\n[Lançamento ID: ${i.id}]`,
                  associado_id: i.associado_id || '',
                  status: 'A Fazer',
                  prioridade: 'Média',
                });
                setIsTarefaModalOpen(true);
                document.body.click();
              }} 
              className="flex items-center gap-3 w-full px-3 py-2 text-left text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <ClipboardList size={14} /> Criar Tarefa
            </button>
            {i.tipo === 'receita' && i.status === 'pago' && (
              <button 
                onClick={() => { setRemanejarTarget(i); setIsRemanejarModalOpen(true); document.body.click() }} 
                className="flex items-center gap-3 w-full px-3 py-2 text-left text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
              >
                <ArrowRightLeft size={14} /> Remanejar
              </button>
            )}
            {(editar || isAdmin) && !i.conciliado && (
              <button 
                onClick={() => {
                  if (confirm('Marcar este lançamento como Conciliado (Liquidado)?')) {
                    atualizar(i.id, { 
                      status: 'pago', 
                      conciliado: true, 
                      data_conciliacao: new Date().toISOString().split('T')[0] 
                    }).then(() => {
                      if (i.associado_id) {
                        fetch(`/api/cobranca/associado/${i.associado_id}/acao`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            etapa: 'EmCobrança'.substring(0, 10),
                            canal: 'sistema',
                            textoEnviado: `Liquidado individualmente: ${i.descricao || 'Mensalidade'}`,
                            observacao: `Pagamento confirmado e conciliado individual (R$ ${i.valor.toFixed(2)})`
                          })
                        }).catch(console.error)
                      }
                    })
                  }
                  document.body.click()
                }} 
                className="flex items-center gap-3 w-full px-3 py-2 text-left text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              >
                <FileCheck size={14} /> Conciliar Manualmente
              </button>
            )}
            {(editar || isAdmin) && i.conciliado && (i.banco_transacao_id || i.cora_id) && (
              <button 
                onClick={() => {
                  setSelectedLancamentoParaReconciliar(i);
                  setIsReconciliarModalOpen(true);
                  document.body.click()
                }} 
                className={`flex items-center gap-3 w-full px-3 py-2 text-left text-[11px] font-bold ${!i.associado_id ? 'text-indigo-600 hover:bg-indigo-50' : 'text-orange-600 hover:bg-orange-50'} rounded-lg transition-all`}
              >
                {!i.associado_id ? (
                  <><RefreshCw size={14} /> Reconciliar</>
                ) : (
                  <><RefreshCw size={14} /> Transferir Vínculo</>
                )}
              </button>
            )}
            {(editar || isAdmin) && i.banco_transacao_id && i.associado_id && i.conciliado && (
              <button
                onClick={async () => {
                  document.body.click();
                  const nomeAssoc = associados.find((a: any) => a.id === i.associado_id)?.nome || 'a associada';
                  const confirmar = confirm(
                    `Desvincular este lançamento?\n\n` +
                    `• O recebimento OFX continuará no financeiro com a descrição original do extrato e sem vínculo de associada.\n` +
                    `• O lançamento de "${nomeAssoc}" voltará para "Em Aberto" sem tag OFX e sem data de conciliação.\n\n` +
                    `Nenhum dado será excluído. Confirma?`
                  );
                  if (!confirmar) return;
                  try {
                    await desvincularLancamento(i);
                    alert('Lançamento desvinculado com sucesso! O recebimento OFX e o lançamento da associada agora estão separados.');
                  } catch (err: any) {
                    alert('Erro ao desvincular: ' + (err?.message || String(err)));
                  }
                }}
                className="flex items-center gap-3 w-full px-3 py-2 text-left text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              >
                <Unlink size={14} /> Desvincular Lançamento
              </button>
            )}
            {(editar || isAdmin) && (
              <button onClick={() => {
                document.body.click();
                if (confirm('Marcar este lançamento como EM COBRANÇA?')) {
                  atualizar(i.id, { status_cobranca: 'EM COBRANÇA' }).then((res: any) => {
                    if (res && res.error) alert('Erro ao marcar: ' + res.error);
                  });
                }
              }} className="flex items-center gap-3 w-full px-3 py-2 text-left text-[11px] font-bold text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
                <AlertTriangle size={14} /> Em Cobrança
              </button>
            )}
            {(editar || isAdmin) && (
              <button onClick={() => { 
                const isFixo = i.descricao?.includes('[FIXO]');
                const isVar = i.descricao?.includes('[VARIÁVEL]');
                const cleanDesc = i.descricao ? i.descricao.replace(/ \[FIXO\]| \[VARIÁVEL\]/g, '') : '';
                setEditingItem({...i, descricao: cleanDesc, fixo_variavel: isFixo ? 'fixo' : (isVar ? 'variavel' : '')}); 
                setIsModalOpen(true);
                document.body.click()
              }} className="flex items-center gap-3 w-full px-3 py-2 text-left text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                <Pencil size={14} /> Editar Lançamento
              </button>
            )}
            {(excluir || isAdmin) && (
              <button onClick={() => { confirm('Excluir?') && remover(i.id); document.body.click() }} className="flex items-center gap-3 w-full px-3 py-2 text-left text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all">
                <XCircle size={14} /> Excluir
              </button>
            )}
          </ActionMenu>
        </div>
      ) 
    }
  ], [associados, fornecedores, diretoria, editedMemos, remover, editar, excluir, isAdmin, filteredSubtotal, tarefas])

  const modalFields: Field[] = useMemo(() => [
    { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [{ value: 'receita', label: 'Ingresso' }, { value: 'despesa', label: 'Dispêndio' }] },
    { name: 'data', label: 'Data', type: 'date', required: true },
    { name: 'descricao', label: 'Descrição', type: 'text', required: true },
    { name: 'fixo_variavel', label: 'Natureza (Fixo/Variável)', type: 'select', options: [{ value: '', label: 'Nenhum' }, { value: 'fixo', label: 'Fixo' }, { value: 'variavel', label: 'Variável' }] },
    { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'aberto', label: 'Provisionado' }, { value: 'pago', label: 'Efetivado (Pago)' }, { value: 'atrasado', label: 'Atrasado' }] },
    { name: 'status_cobranca', label: 'Status Cobrança', type: 'select', options: [{ value: '', label: 'Nenhum' }, { value: 'EM COBRANÇA', label: 'EM COBRANÇA' }, { value: 'NEGOCIADO', label: 'NEGOCIADO' }] },
    { name: 'conta_id', label: 'Conta', type: 'select', required: true, options: contas.map(c => ({ value: c.id, label: c.nome })) },
    { name: 'banco_transacao_id', label: 'ID Bancário (Opcional - p/ Auditoria OFX)', type: 'text' },
    { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: categorias.map(c => ({ value: c.nome, label: c.nome })) },
    { name: 'forma_pagamento', label: 'Forma', type: 'select', options: [{ value: 'PIX', label: 'PIX' }, { value: 'Boleto', label: 'Boleto' }, { value: 'Dinheiro', label: 'Dinheiro' }, { value: 'Transferência', label: 'Transferência' }] },
    { name: 'data_caixa', label: 'Data Efetiva (Caixa)', type: 'date', showIf: (f: any) => f.forma_pagamento === 'Dinheiro' && f.status === 'pago', required: true },
    { name: 'associado_id', label: 'Associado Individual', type: 'select', showIf: (f: any) => f.tipo === 'receita', options: [{ value: '', label: 'Nenhum' }, ...associados.filter(a => a.status === 'ativo').map(a => ({ value: a.id, label: a.nome }))] },
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

  const tarefaFormFields: Field[] = useMemo(() => [
    { name: 'titulo', label: 'Título da Tarefa', type: 'text', required: true },
    { name: 'descricao', label: 'Descrição Detalhada', type: 'textarea', rows: 6 },
    { 
      name: 'associado_id', 
      label: 'Associado Vinculado', 
      type: 'select', 
      options: [
        { value: '', label: 'Nenhum' },
        ...associados.map(a => ({ value: a.id, label: a.nome }))
      ]
    },
    { 
      name: 'responsavel_id', 
      label: 'Responsável', 
      type: 'select', 
      required: true,
      options: [
        ...usuarios.map(u => ({ value: u.id, label: u.nome + ' (USUÁRIO)' })),
        ...diretoria.map(d => ({ value: d.id, label: d.nome + ' (DIRETORIA)' }))
      ]
    },
    {
      name: 'lancamentos_associado',
      label: '',
      type: 'info',
      showIf: (formData: any) => !!formData.associado_id,
      render: (formData: any) => <AssociadoLancamentos associadoId={formData.associado_id} />
    },
    { 
      name: 'status', 
      label: 'Status Inicial', 
      type: 'select', 
      required: true,
      options: [
        { value: 'A Fazer', label: 'A Fazer' },
        { value: 'Em Andamento', label: 'Em Andamento' },
        { value: 'Aguardando', label: 'Aguardando' },
        { value: 'Concluído', label: 'Concluído' },
      ]
    },
    { 
      name: 'prioridade', 
      label: 'Prioridade', 
      type: 'select', 
      required: true,
      options: [
        { value: 'Alta', label: 'Alta' },
        { value: 'Média', label: 'Média' },
        { value: 'Baixa', label: 'Baixa' },
      ]
    },
    { name: 'categoria', label: 'Categoria', type: 'text' },
    { name: 'prazo', label: 'Prazo Final', type: 'date' },
  ], [associados, usuarios, diretoria]);

  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between bg-white py-3 px-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div className="flex items-center gap-4 pl-2">
          <div className="w-11 h-11 rounded-xl bg-[#0b2218] flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
            <BarChart2 size={20} />
          </div>
          <div className="flex flex-col">
            <div className="mb-0.5">
              <IntegrityDropdown 
                onLimparProvisoes={handleCleanupDuplicates}
                onLimparExtrato={handleCleanupConciliacao}
                onRecorrenciaLote={() => setIsSyncModalOpen(true)}
                onRastrearIrregularidades={async () => {
                  if (!confirm('Deseja rastrear e remover mensalidades e adesões duplicadas?')) return
                  setIsProcessingBatch(true)
                  try {
                    const res = await trackIrregularitiesAction()
                    if (res.success) {
                      setReconciliationLogs(res.logs)
                      setIsLogModalOpen(true)
                      refresh()
                    } else {
                      alert(`Erro: ${res.error || res.message}`)
                    }
                  } catch (e: any) { alert(`Erro: ${e.message}`) }
                  finally { setIsProcessingBatch(false) }
                }}
                onLimparProjecao={async () => {
                  if (!tenantId) return
                  if (!confirm('Deseja limpar projeções de mensalidades antigas e mal formatadas?')) return
                  setIsProcessingBatch(true)
                  try {
                    const res = await cleanupWrongMensalidadePatternAction(tenantId)
                    if (res.success) {
                      alert(`Limpeza concluída! ${res.count} registros removidos.`)
                      refresh()
                    } else {
                      alert(`Erro: ${res.error}`)
                    }
                  } catch (e: any) { alert(`Erro: ${e.message}`) }
                  finally { setIsProcessingBatch(false) }
                }}
                onAuditoriaRecorrencia={() => setIsAuditRecorrenciaModalOpen(true)}
                onIntegracaoTotal={async () => {
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
                    setIsProcessingBatch(true)
                    setIsProcessingBatch(false)
                  }
                }}
              />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-0.5">Fluxo de Caixa</h1>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Gestão Financeira Unificada — ACPROBEC</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto no-scrollbar">
          {(criar || isAdmin) && (
            <div className="flex gap-2">
              <button 
                onClick={() => { setEditingItem({ tipo: 'receita' }); setIsModalOpen(true) }} 
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
              >
                <Plus size={12} /> Ingresso
              </button>
              <button 
                onClick={() => { setEditingItem({ tipo: 'despesa' }); setIsModalOpen(true) }} 
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap bg-rose-500 text-white hover:bg-rose-600 shadow-sm"
              >
                <Plus size={12} /> Dispêndio
              </button>
            </div>
          )}
          <div className="flex gap-1 p-1 bg-slate-50 border border-slate-100 rounded-2xl w-full xl:w-auto">
            <button onClick={() => setActiveTab('geral')} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'geral' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-100/50' : 'text-slate-400 hover:text-slate-600'}`}><BarChart2 size={12} /> Geral</button>
            <button onClick={() => setActiveTab('receitas')} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'receitas' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-100/50' : 'text-slate-400 hover:text-slate-600'}`}><ArrowUpRight size={12} /> Ingressos</button>
            <button onClick={() => setActiveTab('despesas')} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'despesas' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-100/50' : 'text-slate-400 hover:text-slate-600'}`}><ArrowDownRight size={12} /> Dispêndios</button>
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-2 mb-4 px-1 flex-wrap">
        <select value={filterDateType} onChange={(e) => setFilterDateType(e.target.value as any)} className="bg-slate-50 px-4 py-2.5 rounded-2xl text-xs font-bold border-none outline-none text-slate-600 transition-all hover:ring-2 hover:ring-emerald-500/10 cursor-pointer">
          <option value="caixa">Visão Caixa</option>
          <option value="competencia">Visão Competência</option>
          <option value="conciliacao">Data Conciliação</option>
        </select>
        
        {activeTab !== 'geral' && (
          <select value={filterDay} onChange={(e) => setFilterDay(Number(e.target.value))} className="bg-slate-50 px-4 py-2.5 rounded-2xl text-xs font-bold border-none outline-none text-slate-600 cursor-pointer transition-all hover:ring-2 hover:ring-emerald-500/10">
            <option value={-1}>Todos Dias</option>
            {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}

        <div className="relative">
          <div 
            onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
            className="bg-slate-50 px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer flex items-center gap-2 text-slate-600 transition-all hover:ring-2 hover:ring-emerald-500/10 h-full"
            title="Selecionar Meses"
          >
            {filterMonths.includes(-1) ? 'Todos Meses' : filterMonths.map(m => MESES[m]).join(', ')}
          </div>
          {isMonthDropdownOpen && (
            <div className="absolute top-full right-0 lg:left-0 lg:right-auto mt-2 w-48 bg-white shadow-xl rounded-xl border border-slate-100 z-[100] py-2 max-h-64 overflow-y-auto">
               <div className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 text-xs font-bold text-slate-700" onClick={() => { setFilterMonths([-1]); setIsMonthDropdownOpen(false); }}>
                 <input type="checkbox" checked={filterMonths.includes(-1)} readOnly className="rounded text-emerald-600" /> Todos Meses
               </div>
               {MESES.map((m, idx) => (
                 <div key={m} className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 text-xs font-bold text-slate-600" onClick={() => {
                   if (filterMonths.includes(-1)) {
                     setFilterMonths([idx]);
                   } else {
                     if (filterMonths.includes(idx)) {
                       const newM = filterMonths.filter(x => x !== idx);
                       setFilterMonths(newM.length === 0 ? [-1] : newM);
                     } else {
                       setFilterMonths([...filterMonths, idx].sort((a,b) => a-b));
                     }
                   }
                 }}>
                   <input type="checkbox" checked={!filterMonths.includes(-1) && filterMonths.includes(idx)} readOnly className="rounded text-emerald-600" /> {m}
                 </div>
               ))}
            </div>
          )}
          {isMonthDropdownOpen && (
            <div className="fixed inset-0 z-[90]" onClick={() => setIsMonthDropdownOpen(false)}></div>
          )}
        </div>

        <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="bg-slate-50 px-4 py-2.5 rounded-2xl text-xs font-bold border-none outline-none text-slate-600 cursor-pointer transition-all hover:ring-2 hover:ring-emerald-500/10">
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {activeTab !== 'geral' && (
        <FinancialKpiGrid 
          kpis={kpiData} 
          cashReservePercentage={cashReservePercentage}
          onCashReservePercentageChange={handleCashReserveChange}
          hasReserveAccount={contas?.some(c => c.nome.toLowerCase().includes('fundo')) || false}
          onFixAccount={() => alert('Para criar a conta de Fundo de Caixa, vá nas Configurações > Contas Bancárias.')}
          onNewIngresso={(criar || isAdmin) ? () => { setEditingItem({ tipo: 'receita' }); setIsModalOpen(true) } : undefined} 
          onNewDespesa={(criar || isAdmin) ? () => { setEditingItem({ tipo: 'despesa' }); setIsModalOpen(true) } : undefined} 
        />
      )}

      {activeTab === 'geral' && (
        <div className="flex flex-col gap-4">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="📊 Fluxo Mensal" subtitle="Realizado vs Projetado"><Chart type="bar" data={{ labels: MESES, datasets: [{ label: 'Ingresso Real', data: chartData.recReal, backgroundColor: '#10b981', borderRadius: 4, stack: '0' }, { label: 'Ingresso Prov.', data: chartData.recProv, backgroundColor: 'rgba(16,185,129,0.25)', borderRadius: 4, stack: '0' }, { label: 'Disp. Real', data: chartData.despReal, backgroundColor: '#f43f5e', borderRadius: 4, stack: '1' }, { label: 'Disp. Prov.', data: chartData.despProv, backgroundColor: 'rgba(244,63,94,0.25)', borderRadius: 4, stack: '1' }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { datalabels: { display: false }, legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10, weight: 'bold' } } } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } }} /></ChartCard>
            <ChartCard 
              title="📈 Saldo Acumulado" 
              subtitle="Evolução do caixa"
              actions={
                <div className="flex items-center gap-3 bg-slate-50/80 border border-slate-100 rounded-lg px-3 py-1.5 shadow-sm">
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-tight">Cora PJ</span>
                    <span className="text-xs text-slate-700 font-black tracking-tight">{fmtR(contasComSaldo.find(c => c.nome.toLowerCase().includes('cora'))?.saldo || 0)}</span>
                  </div>
                  <div className="h-6 w-[1px] bg-slate-200"></div>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-tight">Caixa Espécie</span>
                    <span className="text-xs text-slate-700 font-black tracking-tight">{fmtR(contasComSaldo.find(c => c.nome.toLowerCase().includes('caixa') && c.nome.toLowerCase().includes('espécie'))?.saldo || contasComSaldo.find(c => c.nome.toLowerCase().includes('caixa'))?.saldo || 0)}</span>
                  </div>
                </div>
              }
            >
              <Line data={{ labels: MESES, datasets: [{ label: 'Saldo (R$)', data: chartData.recReal.map((v, i) => safeDiff(v, chartData.despReal[i])), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.05)', fill: true, tension: 0.4 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { datalabels: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } }} />
            </ChartCard>
          </div>
          <ResumoGeralBlocks 
             lancamentos={lancamentos} 
             filterMonths={filterMonths} 
             filterYear={filterYear} 
             filterDateType={filterDateType} 
             contas={contasComSaldo}
          />
        </div>
      )}

      {false ? (
        <InadimplenciaTab />
      ) : false ? (
        <CalendarioConciliacao contas={contas} />
      ) : false ? (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 duration-500">
           {(extrato.length > 0 || (conciliacaoSubTab === 'cora' && (coraItems || []).length > 0)) && (
              <ConciliacaoToolbar 
                contas={contas} selectedContaId={selectedContaId} onContaChange={setSelectedContaId} 
                activeTab={conciliacaoSubTab} categorias={categorias} onBatchCategory={(c: string) => { 
                  const nextCats = { ...editedCategories };
                  const nextMemos = { ...editedMemos };
                  const targetItems = selectedMatchIds.size > 0 
                    ? filteredItemsConciliacao.filter((i: any) => selectedMatchIds.has(i.bank.fitid))
                    : filteredItemsConciliacao;
                  targetItems.forEach((item: any) => { 
                    if (!processedIds.has(item.bank.fitid) && !existingTxIds.has(item.bank.fitid)) {
                      nextCats[item.bank.fitid] = c;
                      const desc = gerarDescricaoPadronizadaConciliador(c, item.bank.type, item.assocMatch, item.forMatch);
                      if (desc) nextMemos[item.bank.fitid] = desc;
                    }
                  }); 
                  setEditedCategories(nextCats);
                  setEditedMemos(nextMemos);
                  if (selectedMatchIds.size > 0) setSelectedMatchIds(new Set()); 
                }} 
                hasSelection={selectedMatchIds.size > 0}
                selectedCount={selectedMatchIds.size}
                onSelectAll={(checked) => {
                  if (checked) {
                    const allIds = filteredItemsConciliacao.map((i: any) => i.bank.fitid)
                    setSelectedMatchIds(new Set(allIds))
                  } else {
                    setSelectedMatchIds(new Set())
                  }
                }}
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
                <button onClick={() => { setConciliacaoSubTab('cora'); syncWithBank(); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${conciliacaoSubTab === 'cora' ? 'bg-white text-emerald-600 shadow-md border border-emerald-50' : 'text-slate-400'}`}><RefreshCw size={14} /> CONEXÃO CORA</button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative group min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="text" placeholder="Filtrar por texto..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-[11px] font-bold outline-none ring-1 ring-slate-100 focus:ring-emerald-500/20 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                <select className="bg-slate-50 text-[11px] font-bold text-slate-600 outline-none border-none p-2.5 rounded-xl ring-1 ring-slate-100" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}><option value="ALL">Todo Tipo</option><option value="CREDIT">Entradas</option><option value="DEBIT">Saídas</option></select>
                <select className="bg-slate-50 text-[11px] font-bold text-slate-600 outline-none border-none p-2.5 rounded-xl ring-1 ring-slate-100" value={filterMatch} onChange={(e) => setFilterMatch(e.target.value as any)}><option value="ALL">Total ({conciliacaoSubTab === 'ofx' ? extrato.length : (coraItems || []).length})</option><option value="FOUND">Com Vínculo</option><option value="NOT_FOUND">Sem Vínculo</option></select>
                <select className="bg-slate-50 text-[11px] font-bold text-slate-600 outline-none border-none p-2.5 rounded-xl ring-1 ring-slate-100" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}><option value="ALL">Todo Status</option><option value="NEW">Não Conciliados</option><option value="DUPLICATE">Conciliados</option></select>
                <select className="bg-slate-50 text-[11px] font-bold text-slate-600 outline-none border-none p-2.5 rounded-xl ring-1 ring-slate-100" value={filterConciliacaoCategory} onChange={(e) => setFilterConciliacaoCategory(e.target.value as any)}><option value="ALL">Com / Sem Categoria</option><option value="WITH_CAT">Com Categoria</option><option value="WITHOUT_CAT">Sem Categoria</option></select>
              </div>
            </div>

            {(loading || (conciliacaoSubTab === 'cora' && loadingCora)) ? (<div className="grid grid-cols-1 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} height={80} />)}</div>) : (() => {
              const pendingItems = filteredItemsConciliacao.filter((item: any) => !editedCategories[item.bank.fitid] && !clearedMatches.has(item.bank.fitid) && !editedMemos[item.bank.fitid]);
              const alteredItems = filteredItemsConciliacao.filter((item: any) => !!editedCategories[item.bank.fitid] || clearedMatches.has(item.bank.fitid) || !!editedMemos[item.bank.fitid]);
              const renderMatchItem = (item: any, isCora: boolean = false) => (
                <MatchItem key={item.bank.fitid} {...item} isCora={isCora} isProcessed={processedIds.has(item.bank.fitid)} memo={getMemoForItem(item)} category={editedCategories[item.bank.fitid]} allCategories={categorias} onEditMemo={(m: string) => setEditedMemos(prev => ({ ...prev, [item.bank.fitid]: m }))} onEditCategory={(c: string) => { setEditedCategories(prev => ({ ...prev, [item.bank.fitid]: c })); const desc = gerarDescricaoPadronizadaConciliador(c, item.bank.type, item.assocMatch, item.forMatch); if (desc) setEditedMemos(prev => ({ ...prev, [item.bank.fitid]: desc })); }} onLinkManual={() => { setSelectedExtrato(item); setIsManualLinkModalOpen(true) }} onLinkSupplier={() => { setSelectedExtrato(item); setIsSupplierLinkModalOpen(true) }} onIgnore={() => setIgnoredMatches(prev => { const n = new Set(prev); if (n.has(item.bank.fitid)) n.delete(item.bank.fitid); else n.add(item.bank.fitid); return n; })} isIgnored={ignoredMatches.has(item.bank.fitid)} isDuplicate={existingTxIds.has(item.bank.fitid)} externalAuditInvoices={auditResults[(item.assocMatch?.cpf || item.bank.documento)?.replace(/\D/g, '')]} isSelected={selectedMatchIds.has(item.bank.fitid)} onToggleSelect={() => { const next = new Set(selectedMatchIds); if (next.has(item.bank.fitid)) next.delete(item.bank.fitid); else next.add(item.bank.fitid); setSelectedMatchIds(next); }} onClearMatch={() => { const next = new Set(clearedMatches); next.add(item.bank.fitid); setClearedMatches(next); }} />
              );

              return conciliacaoSubTab === 'ofx' ? (
              extrato.length === 0 ? (<OFXUpload onUpload={(data: any) => setExtrato(parseOFX(data).transactions)} />) : (
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between px-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lista de Lançamentos ({filteredItemsConciliacao.length})</span><button onClick={() => setExtrato([])} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={14} /> LIMPAR</button></div>
                  {pendingItems.map((item: any) => renderMatchItem(item, false))}
                  {alteredItems.length > 0 && (
                    <div className="mt-2 border-t border-slate-100 pt-4">
                      <button onClick={() => setIsAlteredExpanded(!isAlteredExpanded)} className="flex items-center justify-between w-full bg-slate-50 p-4 rounded-2xl text-slate-500 font-bold text-[11px] hover:bg-slate-100 transition-all uppercase tracking-widest">
                        <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Prontos para Conciliar ({alteredItems.length})</span>
                        {isAlteredExpanded ? 'OCULTAR' : 'EXIBIR'}
                      </button>
                      {isAlteredExpanded && (
                        <div className="mt-4 grid grid-cols-1 gap-4 opacity-70 grayscale-[20%]">
                          {alteredItems.map((item: any) => renderMatchItem(item, false))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {(!coraItems || coraItems?.length === 0) ? (<div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-dashed border-slate-200"><RefreshCw size={48} className="text-slate-300 mb-4 animate-spin" /><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sincronizando com Banco Cora...</p></div>) : 
                  (
                    <>
                      {pendingItems.map((item: any) => renderMatchItem(item, true))}
                      {alteredItems.length > 0 && (
                        <div className="mt-2 border-t border-slate-100 pt-4">
                          <button onClick={() => setIsAlteredExpanded(!isAlteredExpanded)} className="flex items-center justify-between w-full bg-slate-50 p-4 rounded-2xl text-slate-500 font-bold text-[11px] hover:bg-slate-100 transition-all uppercase tracking-widest">
                            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Prontos para Conciliar ({alteredItems.length})</span>
                            {isAlteredExpanded ? 'OCULTAR' : 'EXIBIR'}
                          </button>
                          {isAlteredExpanded && (
                            <div className="mt-4 grid grid-cols-1 gap-4 opacity-70 grayscale-[20%]">
                              {alteredItems.map((item: any) => renderMatchItem(item, true))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )
                }
              </div>
            );
          })()}
        </div>
      ) : (
        <>
          {activeTab === 'geral' ? (
             null
          ) : (
             <>
               <div className="flex flex-wrap items-center gap-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                 <div className="relative flex-1 min-w-[250px]"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Buscar no fluxo..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

            <div className="relative">
              <div 
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="bg-slate-50 px-4 py-3 rounded-2xl text-[11px] font-bold cursor-pointer flex items-center gap-2 text-slate-600 transition-all hover:ring-2 hover:ring-emerald-500/10 h-full"
                title="Selecionar Status"
              >
                {filterLancamentoStatus.includes('ALL') ? 'Status' : filterLancamentoStatus.map(s => s === 'pago' ? 'Pago/Rec.' : s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
              </div>
              {isStatusDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-xl rounded-xl border border-slate-100 z-[100] py-2 max-h-64 overflow-y-auto">
                   <div className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 text-[11px] font-bold text-slate-700" onClick={() => { setFilterLancamentoStatus(['ALL']); setIsStatusDropdownOpen(false); }}>
                     <input type="checkbox" checked={filterLancamentoStatus.includes('ALL')} readOnly className="rounded text-emerald-600" /> Todos Status
                   </div>
                   {[
                     { value: 'pago', label: 'Pago / Recebido' },
                     { value: 'aberto', label: 'Aberto' },
                     { value: 'atrasado', label: 'Atrasado' },
                     { value: 'cancelado', label: 'Cancelado' },
                   ].map((opt) => (
                     <div key={opt.value} className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 text-[11px] font-bold text-slate-600" onClick={() => {
                       if (filterLancamentoStatus.includes('ALL')) {
                         setFilterLancamentoStatus([opt.value]);
                       } else {
                         if (filterLancamentoStatus.includes(opt.value)) {
                           const newS = filterLancamentoStatus.filter(x => x !== opt.value);
                           setFilterLancamentoStatus(newS.length === 0 ? ['ALL'] : newS);
                         } else {
                           setFilterLancamentoStatus([...filterLancamentoStatus, opt.value]);
                         }
                       }
                     }}>
                       <input type="checkbox" checked={!filterLancamentoStatus.includes('ALL') && filterLancamentoStatus.includes(opt.value)} readOnly className="rounded text-emerald-600" /> {opt.label}
                     </div>
                   ))}
                </div>
              )}
              {isStatusDropdownOpen && (
                <div className="fixed inset-0 z-[90]" onClick={() => setIsStatusDropdownOpen(false)}></div>
              )}
            </div>
            <select value={filterConta} onChange={(e) => setFilterConta(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl text-[11px] font-bold border-none outline-none text-slate-600 transition-all hover:ring-2 hover:ring-emerald-500/10">
              <option value="ALL">Todas Contas</option>
              <option value="SEM_CONTA">Sem Conta Vinculada</option>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <select value={filterPagamento} onChange={(e) => setFilterPagamento(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl text-[11px] font-bold border-none outline-none text-slate-600 transition-all hover:ring-2 hover:ring-emerald-500/10">
              <option value="ALL">Forma de Pagto</option>
              {[...new Set(lancamentos.map(l => l.forma_pagamento).filter(Boolean))].sort().map(p => <option key={String(p)} value={String(p)}>{String(p)}</option>)}
            </select>
            <select value={filterUnlinked} onChange={(e) => setFilterUnlinked(e.target.value as any)} className="bg-slate-50 px-4 py-3 rounded-2xl text-[11px] font-bold border-none outline-none text-slate-600 transition-all hover:ring-2 hover:ring-emerald-500/10">
              <option value="ALL">Vínculos</option>
              <option value="LINKED">Com Vínculo</option>
              <option value="UNLINKED">Sem Vínculo</option>
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl text-[11px] font-bold border-none outline-none text-slate-600 transition-all hover:ring-2 hover:ring-emerald-500/10">
              <option value="ALL">Todas Categorias</option>
              <option value="SEM_CATEGORIA">Sem Categoria</option>
              {[...new Set([
                ...categorias.map(c => c.nome),
                ...lancamentos.map(l => l.categoria).filter(Boolean)
              ])].sort().map(cat => <option key={String(cat)} value={String(cat)}>{String(cat)}</option>)}
            </select>
            <select value={filterStatusCobranca} onChange={(e) => setFilterStatusCobranca(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl text-[11px] font-bold border-none outline-none text-slate-600 transition-all hover:ring-2 hover:ring-emerald-500/10">
              <option value="ALL">Cobrança (Todas)</option>
              <option value="EM_COBRANCA">Em Cobrança</option>
              <option value="SEM_COBRANCA">S/ Cobrança</option>
            </select>


          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <DataTable 
              columns={columns as any} 
              data={filteredLancamentos} 
              loading={loading} 
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
              exportable={true}
              exportFilename="Lancamentos_Financeiros"
              onRowClick={(item: any) => {
                setObsTarget(item)
                const match = (item.descricao || '').match(/\[OBS: (.*?)\]/)
                setObsText(match ? match[1] : '')
                setIsObsModalOpen(true)
              }}
            />
          </div>
        </>
      )}
    </>
  )}

      <CrudModal 
        isOpen={isObsModalOpen}
        onClose={() => {
          setIsObsModalOpen(false)
          setObsTarget(null)
          setObsText('')
        }}
        title="Observação do Lançamento"
        onSubmit={async () => {
          if (!obsTarget) return
          setSaving(true)
          try {
            const baseDesc = (obsTarget.descricao || '').replace(/ \[OBS:.*?\]/g, '')
            const newDesc = obsText.trim() ? `${baseDesc} [OBS: ${obsText.trim()}]` : baseDesc
            await atualizar(obsTarget.id, { descricao: newDesc })
            setIsObsModalOpen(false)
            setObsTarget(null)
            setObsText('')
          } catch (err: any) {
            alert(`Erro ao salvar observação: ${err.message}`)
          } finally {
            setSaving(false)
          }
        }}
        initialData={{ observacao: obsText }}
        onChange={(name, val) => {
          if (name === 'observacao') setObsText(val)
        }}
        fields={[
          { name: 'observacao', label: 'Texto Livre (Observação)', type: 'textarea' },
          {
            name: 'recibo_pdf',
            label: '',
            type: 'info',
            showIf: () => !!(obsTarget?.diretor_id),
            render: () => {
              const associado = associados.find((a: any) => a.id === obsTarget?.associado_id)
              const diretor = diretoria.find((d: any) => d.id === obsTarget?.diretor_id)
              return (
                <div className="pt-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      gerarPdfRecibo(associado, obsTarget, diretor?.nome || '--', 'download', tenant?.logo_url)
                    }}
                    className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors w-full justify-center text-xs font-black uppercase tracking-wider shadow-sm active:scale-[0.98]"
                  >
                    <FileText size={16} />
                    Download Recibo PDF
                  </button>
                </div>
              )
            }
          }
        ]}
      />

      <CrudModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? 'Editar Lançamento' : 'Novo Lançamento'} 
        initialData={editingItem} 
        onSubmit={async (data: any) => {
          if (editingItem && editingItem.status !== 'pago' && data.status === 'pago') {
             if (data.associado_id || editingItem.associado_id) {
                const assocId = data.associado_id || editingItem.associado_id;
                fetch(`/api/cobranca/associado/${assocId}/acao`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    etapa: 'EmCobrança'.substring(0, 10),
                    canal: 'sistema',
                    textoEnviado: `Pagamento de: ${data.descricao || editingItem.descricao || 'Mensalidade'}`,
                    observacao: `Pagamento editado e confirmado manualmente (R$ ${(data.valor || editingItem.valor).toFixed(2)})`
                  })
                }).catch(console.error)
             }
          }
          await handleSalvar(data)
        }} 
        onLoad={(setFn) => setParentSetFormData(() => setFn)}
        onChange={(name, val, setFn) => setParentSetFormData(() => setFn)}
        fields={modalFields} 
        loading={saving} 
      />

      <CrudModal 
        isOpen={isCobrancaDateModalOpen} 
        onClose={() => setIsCobrancaDateModalOpen(false)} 
        title="Registrar Data da Cobrança" 
        onSubmit={registrarCobrancaLoteAction} 
        fields={[
          { name: 'data_cobranca', label: 'Data da Cobrança', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
          { name: 'observacao', label: 'Observação (Opcional)', type: 'textarea' }
        ]}
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

      {isReconciliarModalOpen && selectedLancamentoParaReconciliar && (
        <ManualLinkLancamentoModal
          isOpen={isReconciliarModalOpen}
          onClose={() => {
            setIsReconciliarModalOpen(false)
            setSelectedLancamentoParaReconciliar(null)
          }}
          bankItem={{
            bank: {
              memo: selectedLancamentoParaReconciliar.descricao,
              date: selectedLancamentoParaReconciliar.data_conciliacao || selectedLancamentoParaReconciliar.data,
              amount: selectedLancamentoParaReconciliar.valor,
              fitid: selectedLancamentoParaReconciliar.banco_transacao_id || selectedLancamentoParaReconciliar.cora_id
            }
          }}
          associados={associados}
          lancamentos={lancamentos}
          onSelect={async (assoc: any, newLancamento: any) => {
            setIsReconciliarModalOpen(false)
            try {
              const cat = newLancamento.categoria || (newLancamento.tipo === 'receita' ? 'Mensalidades' : 'Outros');
              const nome = assoc.nome || '';
              const desc = newLancamento.tipo === 'despesa' ? `PGTO DE ${cat.toUpperCase()} - ${nome.toUpperCase()}` : `RECEB. DE ${cat.toUpperCase()} - ${nome.toUpperCase()}`;

              await atualizar(newLancamento.id, {
                status: 'pago',
                conciliado: true,
                descricao: desc,
                data: selectedLancamentoParaReconciliar.data_conciliacao || selectedLancamentoParaReconciliar.data,
                data_conciliacao: selectedLancamentoParaReconciliar.data_conciliacao || selectedLancamentoParaReconciliar.data,
                banco_transacao_id: selectedLancamentoParaReconciliar.banco_transacao_id,
                banco_original_memo: selectedLancamentoParaReconciliar.banco_original_memo,
                cora_id: (selectedLancamentoParaReconciliar as any).cora_id,
                forma_pagamento: selectedLancamentoParaReconciliar.forma_pagamento,
                status_cobranca: null as any
              } as any)
              
              const desejaExcluir = confirm('Deseja excluir o lançamento original (que ficou sem o vínculo bancário)?\n\n[OK] para Excluir\n[Cancelar] para Manter em Aberto');

              if (desejaExcluir) {
                // Excluir o antigo
                await remover(selectedLancamentoParaReconciliar.id)
              } else {
                // 2. Reverter o antigo
                await atualizar(selectedLancamentoParaReconciliar.id, {
                  status: 'aberto',
                  conciliado: false,
                  data_conciliacao: null as any,
                  banco_transacao_id: null as any,
                  banco_original_memo: null as any,
                  cora_id: null as any
                } as any)
              }

              alert('Vínculo transferido com sucesso!')
              refresh()
            } catch (err: any) {
              alert('Erro ao transferir vínculo: ' + err.message)
            }
          }}
        />
      )}

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
          setClearedMatches(prev => { const n = new Set(prev); n.delete(tf); return n; });
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
          setClearedMatches(prev => { const n = new Set(prev); n.delete(tf); return n; });
          setIsSupplierLinkModalOpen(false); 
          setSelectedExtrato(null); 
        }} 
      />

      <BatchActionBar 
        selectedCount={selectedIds.length} 
        onDelete={(excluir || isAdmin) ? () => setIsConfirmDeleteOpen(true) : undefined}
        onUpdate={(editar || isAdmin) ? handleBulkUpdate : undefined}
        onClear={() => setSelectedIds([])}
        categories={categorias}
        diretores={diretoria}
        associados={associados}
        contas={contas}
        onMarkCobranca={(editar || isAdmin) ? handleRegistrarCobrancaLote : undefined}
        onRemoveCobranca={(editar || isAdmin) ? () => handleBulkUpdate({ status_cobranca: null as any }) : undefined}
        onAbonar={(editar || isAdmin) ? () => setIsAbonoModalOpen(true) : undefined}
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

      <AbonoLancamentoModal
        isOpen={isAbonoModalOpen}
        onClose={() => setIsAbonoModalOpen(false)}
        lancamentoCount={selectedIds.length}
        onConfirm={handleBulkAbonar}
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
        lancamentos={lancamentos}
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

      <CrudModal
        isOpen={isTarefaModalOpen}
        onClose={() => setIsTarefaModalOpen(false)}
        title="Nova Tarefa (Vinculada)"
        fields={tarefaFormFields}
        initialData={tarefaDefaultData}
        onSubmit={async (data) => {
          const { error } = await inserirTarefa(data)
          if (error) {
            alert('Erro ao criar tarefa: ' + (error.message || 'Erro desconhecido'))
          } else {
            setIsTarefaModalOpen(false)
            alert('Tarefa criada com sucesso!')
          }
        }}
      />
      {/* Ficha do Associado */}
      <FichaAssociadoModal
        isOpen={isFichaOpen}
        onClose={() => setIsFichaOpen(false)}
        associadoId={selectedFichaId}
      />

      <AuditRecorrenciaModal
        isOpen={isAuditRecorrenciaModalOpen}
        onClose={() => setIsAuditRecorrenciaModalOpen(false)}
        loading={isProcessingBatch}
        onConfirm={async (mes, ano) => {
          if (!tenantId) return
          setIsProcessingBatch(true)
          try {
            const res = await auditRecorrenciaFaltantesAction(tenantId, mes, ano)
            if (res.success) {
              setReconciliationLogs(res.logs || [])
              setIsAuditRecorrenciaModalOpen(false)
              setIsLogModalOpen(true)
            } else {
              alert(`Erro: ${res.error}`)
            }
          } catch (e: any) { alert(`Erro: ${e.message}`) }
          finally { setIsProcessingBatch(false) }
        }}
      />
      <RecebimentoManualModal 
        isOpen={isRecebimentoManualModalOpen}
        onClose={() => { setIsRecebimentoManualModalOpen(false); setRecebimentoManualTarget(null); }}
        lancamento={recebimentoManualTarget}
        contas={contas}
        diretores={diretoria}
        onConfirm={handleRecebimentoManual}
      />
    </div>
  )
}


export default function FinanceiroPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Carregando Módulo Financeiro...</div>}>
      <FinanceiroPageContent />
    </Suspense>
  )
}
