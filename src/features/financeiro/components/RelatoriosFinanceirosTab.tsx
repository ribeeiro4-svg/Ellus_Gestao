'use client'
import React, { useState, useMemo } from 'react'
import { FileText, Printer, BarChart2, BarChart3, TrendingUp, TrendingDown, AlertTriangle, Wallet, PieChart, ArrowLeft, Search, FileSpreadsheet, Sparkles, Zap } from 'lucide-react'
import { exportToExcel } from '@/features/importar/utils/excelUtils'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { useCategorias } from '@/lib/hooks/useCategorias'
import { useContas } from '@/lib/hooks/useContas'
import { useFechamento } from '@/lib/hooks/useFechamento'
import { useTenant } from '@/lib/hooks/useTenant'
import { createClient } from '@/lib/supabase/client'
import DataTable from '@/components/ui/DataTable'
import { fmtR, fmtData, getMesIdx, getAnoIdx, getBruto, safeSum, MESES } from '@/lib/utils/formatters'
import StatusBadge from '@/components/ui/StatusBadge'
import PaymentBadge from '@/components/ui/PaymentBadge'

interface RelatoriosFinanceirosTabProps {
  onProvisionarReserva?: (value?: number) => void
  cashReservePercentage?: number
}

export default function RelatoriosFinanceirosTab({ 
  onProvisionarReserva, 
  cashReservePercentage = 20 
}: RelatoriosFinanceirosTabProps) {
  const { lancamentos, loading, refresh } = useFinanceiro()
  const { associados } = useAssociados()
  const { fornecedores } = useFornecedores()
  const { diretoria } = useDiretoria()
  const { categorias } = useCategorias()
  const { contas } = useContas()
  const { isPeriodoBloqueado } = useFechamento()
  const { tenant } = useTenant()

  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  
  // Filtros Globais do Relatório Selecionado
  const [filterMonth, setFilterMonth] = useState<number>(-1)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  
  // Atualiza os dados no supabase quando o ano muda
  React.useEffect(() => {
    refresh(filterYear)
  }, [filterYear])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])
  const [selectedMonths, setSelectedMonths] = useState<number[]>([new Date().getMonth()])
  const [filterLink, setFilterLink] = useState<'all' | 'linked' | 'unlinked'>('all')
  const [timeRange, setTimeRange] = useState<'month' | 'today' | '7d' | '14d' | '30d'>('month')
  const [provisionType, setProvisionType] = useState<'all' | 'receita' | 'despesa'>('all')
  const [reserveType, setReserveType] = useState<'percentage' | 'fixed'>('percentage')
  const [reserveValue, setReserveValue] = useState<number>(cashReservePercentage)

  const [cobrancaLogs, setCobrancaLogs] = useState<any[]>([])
  const [loadingCobranca, setLoadingCobranca] = useState(false)

  React.useEffect(() => {
    if (selectedReport !== 'auditoria_cobrancas' || !tenant?.id) return
    const fetchLogs = async () => {
      setLoadingCobranca(true)
      const sb = createClient()
      const startObj = new Date(filterYear, filterMonth !== -1 ? filterMonth : 0, 1)
      const endObj = new Date(filterYear, filterMonth !== -1 ? filterMonth + 1 : 12, 0)
      
      const { data } = await sb.from('cobranca_acoes')
        .select('*, associados(nome, cpf, telefone)')
        .eq('tenant_id', tenant.id)
        .gte('realizado_em', startObj.toISOString())
        .lte('realizado_em', endObj.toISOString())
        .order('realizado_em', { ascending: false })
      
      setCobrancaLogs(data || [])
      setLoadingCobranca(false)
    }
    fetchLogs()
  }, [selectedReport, tenant?.id, filterMonth, filterYear])

  const filteredCobrancaLogs = useMemo(() => {
    return cobrancaLogs.filter(log => {
      const todayStr = new Date().toISOString().split('T')[0]
      const logDateStr = (log.realizado_em || log.created_at).split('T')[0]
      const logDate = new Date(logDateStr + 'T00:00:00')

      let matchPeriod = true
      if (timeRange === 'today') matchPeriod = logDateStr === todayStr
      else if (timeRange === '7d') {
        const limit = new Date()
        limit.setDate(limit.getDate() - 7)
        limit.setHours(0,0,0,0)
        matchPeriod = logDate >= limit && logDate <= new Date()
      }
      else if (timeRange === '14d') {
        const limit = new Date()
        limit.setDate(limit.getDate() - 14)
        limit.setHours(0,0,0,0)
        matchPeriod = logDate >= limit && logDate <= new Date()
      }
      else if (timeRange === '30d') {
        const limit = new Date()
        limit.setDate(limit.getDate() - 30)
        limit.setHours(0,0,0,0)
        matchPeriod = logDate >= limit && logDate <= new Date()
      }

      const searchLower = searchTerm.toLowerCase()
      const matchSearch = !searchLower || 
        (log.associados?.nome || '').toLowerCase().includes(searchLower) ||
        (log.etapa || '').toLowerCase().includes(searchLower) ||
        (log.canal || '').toLowerCase().includes(searchLower) ||
        (log.texto_enviado || '').toLowerCase().includes(searchLower) ||
        (log.observacao || '').toLowerCase().includes(searchLower)

      return matchPeriod && matchSearch
    })
  }, [cobrancaLogs, timeRange, searchTerm])

  const reports = [
    { id: 'fluxo', title: 'Fluxo de Caixa Analítico', desc: 'Lista completa de ingressos e dispêndios detalhados', icon: BarChart2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'receitas', title: 'Relatório de Receitas', desc: 'Detalhamento de todos os ingressos e mensalidades', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'despesas', title: 'Relatório de Despesas', desc: 'Detalhamento de todos os dispêndios e pagamentos', icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'receitas_mensal', title: 'Receitas por Mês/Conta', desc: 'Matriz mensal de ingressos agrupados por conta bancária', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'despesas_mensal', title: 'Despesas por Mês/Conta', desc: 'Matriz mensal de dispêndios agrupados por conta bancária', icon: BarChart3, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'inadimplencia', title: 'Posição de Inadimplência', desc: 'Relatório de associados com boletos em atraso', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'contas', title: 'Extrato por Conta', desc: 'Movimentação financeira separada por conta bancária', icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'categorias', title: 'Resumo por Categoria', desc: 'Análise de gastos e ganhos agrupados por categoria', icon: PieChart, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'hoje', title: 'Movimentação do Dia', desc: 'Resumo de tudo que vence ou foi pago no dia de hoje', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'curto_prazo', title: 'Análise de Curto Prazo', desc: 'Relatório detalhado dos últimos 7, 14 ou 30 dias', icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'provisoes', title: 'Relatório de Provisões', desc: 'Projeção de entradas e saídas pendentes agrupadas por dia', icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'auditoria_cobrancas', title: 'Auditoria de Cobranças', desc: 'Relatório de rastreabilidade de cobranças efetuadas e pagamentos confirmados', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  const getLinkedName = (item: any) => {
    if (item.associado_id) return associados.find(a => a.id === item.associado_id)?.nome
    if (item.fornecedor_id) return fornecedores.find(f => f.id === item.fornecedor_id)?.nome
    if (item.diretor_id) return diretoria.find(d => d.id === item.diretor_id)?.nome
    return null
  }

  const columns = useMemo(() => [
    { 
      header: 'Data', 
      key: 'data', 
      filterValue: (i: any) => fmtData(i.data), 
      render: (i: any) => <span className="text-xs font-semibold text-slate-600">{fmtData(i.data)}</span> 
    },
    { 
      header: 'Descrição', 
      key: 'descricao', 
      render: (i: any) => {
        const linkedName = getLinkedName(i)
        const descLower = (i.descricao || '').toLowerCase()
        const nameLower = (linkedName || '').toLowerCase()
        const catLower = (i.categoria || '').toLowerCase()
        
        const hasNameInDesc = nameLower && descLower.includes(nameLower)
        const hasCatInDesc = catLower && descLower.includes(catLower)
        
        return (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800">{i.descricao}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
              {!hasCatInDesc && <span className="report-category-label">{i.categoria}</span>}
              {!hasNameInDesc && linkedName ? `${!hasCatInDesc ? ' - ' : ''}${linkedName.toUpperCase()}` : ''}
            </span>
          </div>
        )
      } 
    },
    { 
      header: 'Valor', 
      key: 'valor', 
      filterValue: (i: any) => fmtR(getBruto(i)), 
      render: (i: any) => <span className={`text-sm font-extrabold ${i.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>{i.tipo === 'receita' ? '+' : '-'}{fmtR(getBruto(i))}</span> 
    },
    { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={(i.status === 'aberto' || i.status === 'atrasado') && i.status_cobranca === 'PROCESSANDO' ? 'Processando' : i.status} type="lancamento" /> },
    { header: 'Pagamento', key: 'forma_pagamento', render: (i: any) => <PaymentBadge method={i.forma_pagamento} /> },
    { 
      header: 'Conta', 
      key: 'conta_id', 
      render: (i: any) => <span className="text-[10px] font-bold text-slate-500">{contas.find(c => c.id === i.conta_id)?.nome || 'N/A'}</span> 
    },
  ], [associados, fornecedores, diretoria, contas])

  const filteredData = useMemo(() => {
    return lancamentos.filter(item => {
      const isMatrixReport = selectedReport === 'receitas_mensal' || selectedReport === 'despesas_mensal'
      const statusLower = (item.status || '').toLowerCase()
      const isPaidStatus = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso'].includes(statusLower)
      const isPartial = statusLower === 'parcial'
      const hasConciliation = !!item.data_conciliacao
      const isRealized = isPaidStatus || isPartial || hasConciliation
      
      const dateToUse = (
        (selectedReport === 'fluxo' || selectedReport === 'categorias' || selectedReport === 'contas' || selectedReport === 'receitas_mensal' || selectedReport === 'despesas_mensal') && 
        isRealized && 
        item.data_conciliacao
      ) ? item.data_conciliacao : item.data

      // Definir quais relatórios operam em regime de CAIXA (Liquidez)
      const isCashRegime = selectedReport ? ['fluxo', 'categorias', 'contas', 'receitas_mensal', 'despesas_mensal'].includes(selectedReport) : false
      
      if (selectedReport === 'auditoria_cobrancas') return false // Treated separately

      // No regime de caixa, mostramos APENAS o que foi realizado
      if (isCashRegime && !isRealized) return false

      const dateToUseStr = dateToUse || item.data
      const m = getMesIdx(dateToUseStr)
      const y = getAnoIdx(dateToUseStr)

      const todayStr = new Date().toISOString().split('T')[0]
      const itemDate = new Date((item.data || todayStr) + 'T00:00:00')
      
      const payM = item.data_conciliacao ? getMesIdx(item.data_conciliacao) : m
      // Realização estrita: só é EFETIVADO se o dinheiro caiu no próprio mês
      const isStrictRealized = isRealized && payM === m

      let matchPeriod = false
      if (isMatrixReport || selectedReport === 'receitas' || selectedReport === 'despesas') {
        matchPeriod = selectedMonths.includes(m) && y === filterYear
        if (isMatrixReport) {
          matchPeriod = matchPeriod && isStrictRealized
        }
      } else {
        matchPeriod = (filterMonth === -1 || m === filterMonth) && y === filterYear
        // Se for um dos relatórios de liquidez (Cash Regime), reforçamos a filtragem por realização
        if (isCashRegime && !isStrictRealized && filterMonth !== -1) {
           matchPeriod = false
        }
      }
      
      if (timeRange === 'today') matchPeriod = item.data === todayStr
      else if (timeRange === '7d') {
        const limit = new Date()
        limit.setDate(limit.getDate() - 7)
        limit.setHours(0,0,0,0)
        matchPeriod = itemDate >= limit && itemDate <= new Date()
      }
      else if (timeRange === '14d') {
        const limit = new Date()
        limit.setDate(limit.getDate() - 14)
        limit.setHours(0,0,0,0)
        matchPeriod = itemDate >= limit && itemDate <= new Date()
      }
      else if (timeRange === '30d') {
        const limit = new Date()
        limit.setDate(limit.getDate() - 30)
        limit.setHours(0,0,0,0)
        matchPeriod = itemDate >= limit && itemDate <= new Date()
      }

      const matchSearch = item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.categoria || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getLinkedName(item)?.toLowerCase().includes(searchTerm.toLowerCase())

      let matchType = true
      if (selectedReport === 'hoje') matchType = true
      if (selectedReport === 'curto_prazo') matchType = true
      if (selectedReport === 'fluxo') matchType = isRealized
      
      if (selectedReport === 'receitas' || selectedReport === 'despesas') {
        matchType = (selectedReport === 'receitas' ? item.tipo === 'receita' : item.tipo === 'despesa') &&
                    (selectedStatus.length === 0 || selectedStatus.includes(item.status)) &&
                    (selectedPayments.length === 0 || selectedPayments.includes(item.forma_pagamento || '')) &&
                    (selectedAccounts.length === 0 || selectedAccounts.includes(item.conta_id || ''))
      }
      if (selectedReport === 'inadimplencia') {
        const todayStr = new Date().toISOString().split('T')[0]
        const isAtrasado = item.status === 'atrasado' || (item.status === 'aberto' && item.data < todayStr)
        matchType = isAtrasado &&
                    (selectedPayments.length === 0 || selectedPayments.includes(item.forma_pagamento || '')) &&
                    (selectedAccounts.length === 0 || selectedAccounts.includes(item.conta_id || '')) &&
                    (selectedCategories.length === 0 || selectedCategories.includes(item.categoria || ''))
      }
      if (selectedReport === 'categorias') {
        matchType = isRealized && (selectedCategories.length === 0 || selectedCategories.includes(item.categoria || ''))
      }
      if (selectedReport === 'contas') {
        if (selectedAccounts.includes('sem_conta')) {
          matchType = isRealized && (!item.conta_id || selectedAccounts.includes(item.conta_id))
        } else {
          matchType = isRealized && (selectedAccounts.length === 0 || selectedAccounts.includes(item.conta_id || ''))
        }
      }
      if (selectedReport === 'receitas_mensal' || selectedReport === 'despesas_mensal') {
        matchType = isRealized && (selectedReport === 'receitas_mensal' ? item.tipo === 'receita' : item.tipo === 'despesa')
      }
      if (selectedReport === 'provisoes') {
        const isPending = item.status === 'aberto' || item.status === 'atrasado'
        const matchProvType = provisionType === 'all' || item.tipo === provisionType
        matchType = isPending && matchProvType
      }

      let matchLink = true
      if (filterLink === 'linked') {
        matchLink = !!(item.associado_id || item.fornecedor_id || item.diretor_id)
      } else if (filterLink === 'unlinked') {
        matchLink = !(item.associado_id || item.fornecedor_id || item.diretor_id)
      }

      return matchPeriod && matchSearch && matchType && matchLink
    })
  }, [lancamentos, filterYear, filterMonth, searchTerm, selectedReport, associados, fornecedores, diretoria, selectedCategories, selectedAccounts, selectedStatus, selectedPayments, filterLink, timeRange, selectedMonths, provisionType])


  const summaryData = useMemo(() => {
    if (selectedReport === 'categorias') {
      const map: Record<string, { income: number, expense: number }> = {}
      filteredData.forEach(l => {
        const cat = l.categoria || 'Sem Categoria'
        if (!map[cat]) map[cat] = { income: 0, expense: 0 }
        const val = l.status === 'parcial' ? (l.valor_recebido || 0) : getBruto(l)
        if (l.tipo === 'receita') {
          if (val >= 0) map[cat].income += val
          else map[cat].expense += Math.abs(val)
        } else {
          if (val >= 0) map[cat].expense += val
          else map[cat].income += Math.abs(val)
        }
      })
      return Object.entries(map).map(([name, totals]) => ({
        name,
        ...totals,
        balance: totals.income - totals.expense
      })).sort((a, b) => (b.income + b.expense) - (a.income + a.expense))
    }

    if (selectedReport === 'contas') {
      const map: Record<string, { income: number, expense: number }> = {}
      filteredData.forEach(l => {
        const conta = contas.find(c => c.id === l.conta_id)?.nome || 'Sem Conta'
        if (!map[conta]) map[conta] = { income: 0, expense: 0 }
        const val = l.status === 'parcial' ? (l.valor_recebido || 0) : getBruto(l)
        if (l.tipo === 'receita') {
          if (val >= 0) map[conta].income += val
          else map[conta].expense += Math.abs(val)
        } else {
          if (val >= 0) map[conta].expense += val
          else map[conta].income += Math.abs(val)
        }
      })
      return Object.entries(map).map(([name, totals]) => ({
        name,
        ...totals,
        balance: totals.income - totals.expense
      })).sort((a, b) => (b.income + b.expense) - (a.income + a.expense))
    }

    if (selectedReport === 'receitas_mensal' || selectedReport === 'despesas_mensal') {
      const accountsMap: Record<string, Record<number, number>> = {}
      
      // Inicializa todas as contas conhecidas que têm movimentação no filteredData
      filteredData.forEach(l => {
        const contaId = l.conta_id || 'sem_conta'
        const contaNome = contas.find(c => c.id === l.conta_id)?.nome || 'Sem Conta'
        const key = `${contaId}:::${contaNome}`
        const mIdx = getMesIdx(l.data_conciliacao || l.data)
        
        if (!accountsMap[key]) accountsMap[key] = {}
        if (!accountsMap[key][mIdx]) accountsMap[key][mIdx] = 0
        
        const val = l.status === 'parcial' ? (l.valor_recebido || 0) : getBruto(l)
        if (l.tipo === 'receita') {
          accountsMap[key][mIdx] += val
        } else {
          // Para relatórios de despesas mensais, valores negativos em despesas somam como ingresso (matriz de despesas mostra o líquido?)
          // Na verdade, se a matriz é de receitas, somamos apenas entradas. Se é de despesas, somamos apenas saídas.
          if (val < 0) accountsMap[key][mIdx] += Math.abs(val)
        }
      })

      return Object.entries(accountsMap).map(([key, months]) => {
        const [id, name] = key.split(':::')
        const rowTotal = Object.values(months).reduce((acc, v) => acc + v, 0)
        return { id, name, months, rowTotal }
      }).sort((a, b) => b.rowTotal - a.rowTotal)
    }

    return []
  }, [filteredData, selectedReport, contas])

  const receitaProjetadaPeriodo = useMemo(() => {
    return lancamentos
      .filter(l => {
        const isInternalTransfer = l.categoria === 'Reserva de Caixa' || l.categoria === 'RESERVA ESTRATÉGICA'
        const m = getMesIdx(l.data)
        const y = getAnoIdx(l.data)
        // Consideramos toda receita da competência (Paga ou Aberta)
        return l.tipo === 'receita' && !isInternalTransfer && (filterMonth === -1 || m === filterMonth) && y === filterYear
      })
      .reduce((acc, l) => acc + getBruto(l), 0)
  }, [lancamentos, filterMonth, filterYear])

  const lateProvisionsByMonth = useMemo(() => {
    const map: Record<string, number> = {}
    const todayStr = new Date().toISOString().split('T')[0]
    
    lancamentos.forEach(l => {
      // Consideramos atrasado se o status for 'atrasado' OU se estiver 'aberto' e a data for menor que hoje
      const isLate = l.tipo === 'receita' && (l.status === 'atrasado' || (l.status === 'aberto' && l.data < todayStr))
      if (isLate) {
        const monthYear = `${MESES[getMesIdx(l.data)]} / ${getAnoIdx(l.data)}`
        map[monthYear] = (map[monthYear] || 0) + getBruto(l)
      }
    })
    
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => {
        // Ordenação cronológica reversa (mais recentes primeiro)
        const [mA, yA] = a.label.split(' / ')
        const [mB, yB] = b.label.split(' / ')
        if (yA !== yB) return Number(yB) - Number(yA)
        return MESES.indexOf(mB) - MESES.indexOf(mA)
      })
  }, [lancamentos])

  const totalAtrasados = useMemo(() => {
    return lateProvisionsByMonth.reduce((acc, item) => acc + item.value, 0)
  }, [lateProvisionsByMonth])

  const tetoReal = useMemo(() => {
    // No Relatório de Provisões, o teto (Receita Projetada) é restrito a Mensalidades/Adesões pendentes do mês
    if (selectedReport === 'provisoes') {
      return lancamentos
        .filter(l => {
          if (l.tipo !== 'receita') return false
          const cat = (l.categoria || '').toUpperCase()
          const isTarget = cat.includes('MENSALIDADE') || cat.includes('ADESÃO') || cat.includes('ADESAO')
          if (!isTarget) return false

          const statusLower = (l.status || '').toLowerCase()
          const isRealized = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso', 'parcial'].includes(statusLower) || !!l.data_conciliacao
          
          if (isRealized) {
            // Para realizados, conta a data em que o dinheiro caiu (Visão Caixa)
            const payDate = l.data_conciliacao || l.data
            return getMesIdx(payDate) === filterMonth && getAnoIdx(payDate) === filterYear
          } else {
            // Para pendentes, conta o mês de vencimento (Visão Provisão)
            return getMesIdx(l.data) === filterMonth && getAnoIdx(l.data) === filterYear
          }
        })
        .reduce((acc, l) => acc + getBruto(l), 0)
    }
    return safeSum(receitaProjetadaPeriodo, totalAtrasados)
  }, [receitaProjetadaPeriodo, totalAtrasados, selectedReport, lancamentos, filterMonth, filterYear])

  const fundoCaixaProvisionado = useMemo(() => {
    if (selectedReport !== 'provisoes') return 0
    if (reserveType === 'percentage') {
      return (tetoReal * reserveValue) / 100
    }
    return reserveValue
  }, [tetoReal, selectedReport, reserveType, reserveValue])

  const despesasProvisoesPorCategoria = useMemo(() => {
    const map: Record<string, number> = {}
    lancamentos.forEach(l => {
      const isInternalTransfer = l.categoria === 'Reserva de Caixa' || l.categoria === 'RESERVA ESTRATÉGICA'
      const statusLower = (l.status || '').toLowerCase()
      const isRealized = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso', 'parcial'].includes(statusLower) || !!l.data_conciliacao
      
      let match = false
      if (isRealized) {
        const payDate = l.data_conciliacao || l.data
        match = getMesIdx(payDate) === filterMonth && getAnoIdx(payDate) === filterYear
      } else {
        match = getMesIdx(l.data) === filterMonth && getAnoIdx(l.data) === filterYear
      }

      if (l.tipo === 'despesa' && !isInternalTransfer && match) {
        const cat = l.categoria || 'Sem Categoria'
        map[cat] = (map[cat] || 0) + getBruto(l)
      }
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [lancamentos, filterMonth, filterYear])

  const provisionsExpenseGroups = useMemo(() => {
    if (selectedReport !== 'provisoes') return []
    const expenses = filteredData.filter(l => l.tipo === 'despesa')
    const groups: Record<string, any[]> = {}
    expenses.forEach(l => {
      const date = l.data
      if (!groups[date]) groups[date] = []
      groups[date].push(l)
    })
    
    return Object.keys(groups).sort().map(date => ({
      date,
      items: groups[date].sort((a, b) => a.descricao.localeCompare(b.descricao))
    }))
  }, [filteredData, selectedReport])
  const provisionsIncomeGroups = useMemo(() => {
    if (selectedReport !== 'provisoes') return []
    const incomes = filteredData.filter(l => l.tipo === 'receita')
    const groups: Record<string, any[]> = {}
    incomes.forEach(l => {
      const date = l.data
      if (!groups[date]) groups[date] = []
      groups[date].push(l)
    })
    
    const sortedGroups = Object.keys(groups).sort().map(date => {
      const rawItems = groups[date]
      const aggregated: any[] = []
      const groupsByLabel: Record<string, any> = {}

      rawItems.forEach(l => {
        const cat = (l.categoria || '').toUpperCase()
        let groupLabel = ''
        if (cat.includes('MENSALIDADE')) groupLabel = 'MENSALIDADES A RECEBER'
        else if (cat.includes('ADESÃO') || cat.includes('ADESAO')) groupLabel = 'ADESÕES A RECEBER'

        if (groupLabel) {
          if (!groupsByLabel[groupLabel]) {
            groupsByLabel[groupLabel] = {
              id: `group-${date}-${groupLabel}`,
              data: date,
              descricao: groupLabel,
              categoria: 'RESUMO DIÁRIO',
              valor: 0,
              tipo: 'receita',
              status: 'aberto',
              forma_pagamento: '--',
              conta_id: null,
              isGroup: true
            }
          }
          groupsByLabel[groupLabel].valor = safeSum(groupsByLabel[groupLabel].valor, getBruto(l))
        } else {
          aggregated.push(l)
        }
      })

      return {
        date,
        isAtrasadosGroup: false,
        items: [...Object.values(groupsByLabel), ...aggregated].sort((a, b) => a.descricao.localeCompare(b.descricao))
      }
    })

    if (totalAtrasados > 0) {
      return [{
        date: '0000-00-00',
        isAtrasadosGroup: true,
        items: [{
          id: 'late-receivers-summary',
          descricao: 'RECEBIMENTOS EM ATRASO (ACUMULADO)',
          valor: totalAtrasados,
          tipo: 'receita',
          status: 'atrasado',
          forma_pagamento: '--',
          conta_id: null,
          categoria: 'SALDO ANTERIOR'
        }]
      }, ...sortedGroups]
    }

    return sortedGroups
  }, [filteredData, selectedReport, totalAtrasados])

  const matrixTotalsByMonth = useMemo(() => {
    if (selectedReport !== 'receitas_mensal' && selectedReport !== 'despesas_mensal') return {}
    const totals: Record<number, number> = {}
    selectedMonths.forEach(m => totals[m] = 0)
    
    summaryData.forEach((row: any) => {
      Object.entries(row.months).forEach(([m, val]: [any, any]) => {
        if (!totals[m]) totals[m] = 0
        totals[m] += val
      })
    })
    return totals
  }, [summaryData, selectedReport, selectedMonths])

  const totalProvisionsIncome = useMemo(() => {
    return provisionsIncomeGroups.reduce((acc, g) => acc + g.items.reduce((sum, item) => sum + (item.valor || 0), 0), 0)
  }, [provisionsIncomeGroups])

  const totalProvisionsExpense = useMemo(() => {
    return provisionsExpenseGroups.reduce((acc, g) => acc + g.items.reduce((sum, item) => sum + (item.valor || 0), 0), 0)
  }, [provisionsExpenseGroups])

  const reportSummaryMetrics = useMemo(() => {
    let income = 0, expense = 0, adesao = 0, mensalidade = 0
    filteredData.forEach(l => {
      const val = l.status === 'parcial' ? (l.valor_recebido || 0) : getBruto(l)
      
      if (l.tipo === 'receita') {
        if (val >= 0) {
          income += val
          const cat = (l.categoria || '').toUpperCase()
          if (cat.includes('ADESÃO') || cat.includes('ADESAO')) adesao += val
          if (cat.includes('MENSALIDADE')) mensalidade += val
        } else {
          expense += Math.abs(val)
        }
      } else {
        if (val >= 0) {
          expense += val
        } else {
          income += Math.abs(val)
        }
      }
    })
    return { income, expense, balance: income - expense, adesao, mensalidade }
  }, [filteredData])

  const handlePrint = (title: string) => {
    const tableElement = document.getElementById('report-table')
    const summaryElement = document.getElementById('report-summary')
    const chartElement = document.getElementById('report-chart')
    
    const janela = window.open('', '_blank')
    if (!janela) return

    janela.document.write(`
      <html>
        <head>
          <title>${title} — ACPROBEC</title>
          <style>
            @page { size: landscape; margin: 1cm; }
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 0; color: #1e293b; background: white; line-height: 1.5; }
            
            .header { background-color: #0b2218; display: flex; align-items: center; justify-content: flex-start; padding: 25px 35px; margin-bottom: 30px; border-radius: 12px; }
            .header-logo { max-height: 45px; margin-right: 20px; border-radius: 8px; object-fit: contain; }
            .header-info { text-align: left; }
            .header h1 { margin: 0; font-size: 20px; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; font-weight: 900; }
            .header p { margin: 6px 0 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
            
            .summary-title { 
              font-size: 11px; 
              font-weight: 900; 
              text-transform: uppercase; 
              margin: 40px 0 15px; 
              color: #0f172a; 
              border-left: 5px solid #10b981; 
              padding-left: 12px; 
              letter-spacing: 1px;
              page-break-after: avoid;
            }
            
            table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            th { background: #f8fafc; color: #475569; text-transform: uppercase; font-size: 7px; font-weight: 900; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
            td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 8px; color: #334155; font-weight: 500; }
            tr:last-child td { border-bottom: none; }
            tr:nth-child(even) { background-color: #fcfdfe; }
            
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .text-emerald-600 { color: #059669 !important; font-weight: 800; }
            .text-rose-600 { color: #e11d48 !important; font-weight: 800; }
            .text-amber-600 { color: #d97706 !important; font-weight: 800; }
            
            .chart-box { 
              border: 1px solid #e2e8f0; 
              padding: 25px; 
              border-radius: 20px; 
              margin-bottom: 40px; 
              background: #ffffff;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
              page-break-inside: avoid;
            }
            
            .column-container { 
              display: flex; 
              align-items: flex-end; 
              gap: 12px; 
              height: 240px; 
              padding: 10px 10px 0;
              border-bottom: 2px solid #f1f5f9;
            }
            
            .column-item { 
              flex: 1; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: flex-end; 
              height: 100%;
              min-width: 0;
            }
            
            .column-bar { 
              width: 80%; 
              max-width: 40px;
              border-radius: 8px 8px 0 0; 
              min-height: 4px;
              box-shadow: inset 0 2px 4px rgba(255,255,255,0.1);
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .column-info {
              margin-top: 12px;
              text-align: center;
              width: 100%;
              min-height: 45px;
            }
            
            .column-val-base { font-size: 9px; font-weight: 900; display: block; margin-bottom: 3px; white-space: nowrap; }
            .column-label-text { 
              font-size: 7px; 
              font-weight: 800; 
              color: #475569; 
              text-transform: uppercase; 
              display: block; 
              line-height: 1.2; 
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }
            .column-perc { font-size: 6px; color: #94a3b8; font-weight: 700; display: block; margin-top: 3px; }
            
            .bg-emerald, .bg-emerald-500 { background: #10b981 !important; background: linear-gradient(180deg, #10b981 0%, #059669 100%) !important; }
            .bg-rose, .bg-rose-500 { background: #f43f5e !important; background: linear-gradient(180deg, #f43f5e 0%, #e11d48 100%) !important; }
            .bg-amber, .bg-amber-500, #bar-fundo-caixa, [id="bar-fundo-caixa"] { 
               background: #f59e0b !important; 
               background-color: #f59e0b !important;
               background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%) !important; 
               fill: #f59e0b !important;
            }
            #val-fundo-caixa, [id="val-fundo-caixa"] { color: #d97706 !important; -webkit-text-fill-color: #d97706 !important; }
            
            .report-summary-cards { display: flex; gap: 15px; margin-bottom: 15px; page-break-inside: avoid; }
            .report-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center; }
            .report-card-label { font-size: 7px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 4px; display: block; }
            .report-card-value { font-size: 14px; font-weight: 900; }
            .report-sub-summary { background: #fcfdfe; border: 1px solid #f1f5f9; padding: 8px 20px; border-radius: 8px; display: flex; justify-content: space-around; margin-bottom: 25px; font-size: 8px; color: #475569; page-break-inside: avoid; }

            .footer { margin-top: 60px; background-color: #ffffff; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; padding-bottom: 20px; font-weight: 600; letter-spacing: 0.5px; }
            .footer-logo { height: 50px; margin-bottom: 10px; }
            
            .late-cards-container { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px; page-break-inside: avoid; }
            .late-card { 
              flex: 1; 
              min-width: 120px; 
              border-radius: 18px; 
              padding: 16px; 
              text-align: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.02);
              border: 1px solid transparent;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .late-card-label { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; display: block; }
            .late-card-value { font-size: 13px; font-weight: 900; }
            
            @media print { 
              @page { size: landscape; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .chart-box { background: white !important; border: 1px solid #e2e8f0; box-shadow: none; }
              .no-print, button, input, select { display: none !important; }
            }
            .uppercase { text-transform: uppercase !important; }
            .whitespace-nowrap { white-space: nowrap !important; }
          </style>
        </head>
        <body>
          <div class="header">
            ${tenant?.logo_url ? `<img src="${tenant.logo_url}" class="header-logo" onerror="this.style.display='none'" />` : ''}
            <div class="header-info">
              <h1>${tenant?.nome || 'Associação'}</h1>
              <p>${title.toUpperCase()} | EMISSÃO: ${new Date().toLocaleDateString('pt-BR')} — PERÍODO: ${timeRange === 'month' ? (['receitas', 'despesas', 'receitas_mensal', 'despesas_mensal'].includes(selectedReport || '') ? (selectedMonths.length === 12 ? 'TODOS' : selectedMonths.map(m => MESES[m]).join(', ').toUpperCase()) : (filterMonth === -1 ? 'TODOS' : MESES[filterMonth].toUpperCase())) + ' / ' + filterYear : timeRange.toUpperCase()}</p>
            </div>
          </div>

          ${selectedReport !== 'provisoes' ? `
            <div class="report-summary-cards">
              <div class="report-card">
                <span class="report-card-label">Ingressos Totais</span>
                <div class="report-card-value text-emerald-600">${fmtR(reportSummaryMetrics.income)}</div>
              </div>
              <div class="report-card">
                <span class="report-card-label">Dispêndios Totais</span>
                <div class="report-card-value text-rose-600">${fmtR(reportSummaryMetrics.expense)}</div>
              </div>
              <div class="report-card">
                <span class="report-card-label">
                  <span style="${reportSummaryMetrics.balance >= 0 ? 'font-weight: 900; color: #0f172a;' : 'font-weight: 400; opacity: 0.6;'}">Superávit</span> / 
                  <span style="${reportSummaryMetrics.balance < 0 ? 'font-weight: 900; color: #0f172a;' : 'font-weight: 400; opacity: 0.6;'}">Déficit</span>
                </span>
                <div class="report-card-value ${reportSummaryMetrics.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}">${fmtR(Math.abs(reportSummaryMetrics.balance))}</div>
              </div>
            </div>
            <div class="report-sub-summary">
              <span><strong>Somatório de Adesões:</strong> ${fmtR(reportSummaryMetrics.adesao)}</span>
              <div style="width: 1px; background: #e2e8f0;"></div>
              <span><strong>Somatório de Mensalidades:</strong> ${fmtR(reportSummaryMetrics.mensalidade)}</span>
            </div>
          ` : ''}


          
          ${chartElement ? `
            <div class="summary-title">Análise de Provisões vs Teto de Receita</div>
            <div class="chart-box">
              <div class="column-container">
                ${Array.from(chartElement.querySelectorAll('.column-item')).map(item => {
                  const bar = item.querySelector('.column-bar') as HTMLElement;
                  const label = item.querySelector('.column-label') as HTMLElement;
                  
                  if (!bar || !label) return '';
                  
                  const h = bar.style.height;
                  const isEmerald = bar.classList.contains('bg-emerald');
                  const val = (label.querySelector('.column-val-base') as HTMLElement)?.innerText || '';
                  const titleStr = (label.querySelector('span:nth-child(2)') as HTMLElement)?.innerText || '';
                  const perc = (label.querySelector('.column-perc') as HTMLElement)?.innerText || '';
                  
                  return `
                    <div class="column-item">
                      <span class="column-val-base ${isEmerald ? 'text-emerald-600' : 'text-rose-600'}">${val}</span>
                      <div class="column-bar ${isEmerald ? 'bg-emerald' : 'bg-rose'}" style="height: ${h};"></div>
                      <div class="column-info">
                        <span class="column-label-text">${titleStr}</span>
                        <span class="column-perc">${perc}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
          
          ${summaryElement ? `<div class="summary-title">Resumo por Agrupamento</div>${summaryElement.innerHTML}` : ''}
          ${(tableElement && selectedReport !== 'contas' && selectedReport !== 'categorias' && selectedReport !== 'provisoes') ? `<div class="summary-title">Detalhamento Analítico dos Lançamentos</div>${tableElement.innerHTML}` : ''}
          
          ${selectedReport === 'provisoes' ? `
            <div style="margin-top: 30px;">
              <div class="summary-title">Resumo Financeiro - Reserva Técnica</div>
              <div style="display: flex; gap: 20px; margin-bottom: 30px; page-break-inside: avoid;">
                <div style="flex: 1; padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Receita Projetada</div>
                  <div style="font-size: 16px; font-weight: 900; color: #059669;">R$ ${fmtR(tetoReal)}</div>
                </div>
                <div style="flex: 1; padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Dispêndios</div>
                  <div style="font-size: 16px; font-weight: 900; color: #e11d48;">R$ ${fmtR(totalProvisionsExpense)}</div>
                </div>
                <div style="flex: 1; padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Reserva Técnica</div>
                  <div style="font-size: 16px; font-weight: 900; color: #334155;">R$ ${fmtR(fundoCaixaProvisionado)}</div>
                </div>
              </div>

              <div class="summary-title" style="margin-top: 40px;">Como a Receita se consome (Cascata)</div>
              <div style="display: flex; align-items: flex-end; gap: 8px; height: 280px; margin-bottom: 50px; border-bottom: 1px solid #e2e8f0; padding-bottom: 40px; overflow: hidden; page-break-inside: avoid;">
                
                <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative; min-width: 90px;">
                  <div style="width: 48px; background-color: #34d399; height: ${tetoReal > 0 ? '100%' : '2px'}; border-top-left-radius: 4px; border-top-right-radius: 4px;"></div>
                  <div style="position: absolute; bottom: -35px; text-align: center; width: 100%;">
                    <span style="display: block; font-size: 11px; font-weight: 900; color: #059669; margin-bottom: 2px;">R$ ${fmtR(tetoReal)}</span>
                    <span style="display: block; font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">Receita<br/>Projetada</span>
                  </div>
                </div>

                ${(() => {
                    let accumulatedOffset = 0;
                    return despesasProvisoesPorCategoria.map(([cat, val]) => {
                        const perc = tetoReal > 0 ? (val / tetoReal) * 100 : 0;
                        const topOff = tetoReal > 0 ? (accumulatedOffset / tetoReal) * 100 : 0;
                        const h = Math.max(Math.min(perc, 100 - topOff), 1);
                        accumulatedOffset += val;
                        
                        return '<div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; position: relative; min-width: 70px;">' +
                          '<div style="width: 48px; background-color: #cbd5e1; height: ' + h + '%; margin-top: ' + topOff + '%; border-top-left-radius: 4px; border-top-right-radius: 4px;"></div>' +
                          '<div style="position: absolute; top: ' + (topOff + h) + '%; text-align: center; width: 100%; margin-top: 8px;">' +
                            '<span style="display: block; font-size: 9px; font-weight: 900; color: #64748b; margin-bottom: 2px;">- R$ ' + fmtR(val) + '</span>' +
                            '<span style="display: block; font-size: 7px; font-weight: 900; color: #94a3b8; text-transform: uppercase; line-height: 1;">' + cat.substring(0, 15) + '</span>' +
                          '</div>' +
                        '</div>';
                    }).join('');
                })()}

                ${fundoCaixaProvisionado > 0 ? (() => {
                    const perc = tetoReal > 0 ? (fundoCaixaProvisionado / tetoReal) * 100 : 0;
                    const topOff = tetoReal > 0 ? (totalProvisionsExpense / tetoReal) * 100 : 0;
                    const h = Math.max(Math.min(perc, 100 - topOff), 1);
                    return '<div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; position: relative; min-width: 80px;">' +
                      '<div style="width: 48px; background-color: #94a3b8; height: ' + h + '%; margin-top: ' + topOff + '%; border-top-left-radius: 4px; border-top-right-radius: 4px;"></div>' +
                      '<div style="position: absolute; top: ' + (topOff + h) + '%; text-align: center; width: 100%; margin-top: 8px;">' +
                        '<span style="display: block; font-size: 9px; font-weight: 900; color: #475569; margin-bottom: 2px;">- R$ ' + fmtR(fundoCaixaProvisionado) + '</span>' +
                        '<span style="display: block; font-size: 7px; font-weight: 900; color: #94a3b8; text-transform: uppercase; line-height: 1;">Reserva Técnica</span>' +
                      '</div>' +
                    '</div>';
                })() : ''}
                
                <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative; min-width: 100px; margin-left: 10px; border-left: 1px solid #e2e8f0; padding-left: 10px;">
                  ${(() => {
                      const saldo = tetoReal - (totalProvisionsExpense + fundoCaixaProvisionado);
                      const percSaldo = tetoReal > 0 ? (Math.abs(saldo) / tetoReal) * 100 : 0;
                      const hSaldo = Math.max(Math.min(percSaldo, 100), 1);
                      const color = saldo >= 0 ? '#34d399' : '#f43f5e';
                      const textColor = saldo >= 0 ? '#059669' : '#e11d48';
                      return '<div style="width: 48px; background-color: ' + color + '; height: ' + hSaldo + '%; border-top-left-radius: 4px; border-top-right-radius: 4px;"></div>' +
                        '<div style="position: absolute; bottom: -35px; text-align: center; width: 100%;">' +
                          '<span style="display: block; font-size: 11px; font-weight: 900; color: ' + textColor + '; margin-bottom: 2px;">' + (saldo < 0 ? '-' : '') + ' R$ ' + fmtR(Math.abs(saldo)) + '</span>' +
                          '<span style="display: block; font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">Resultado<br/>Final</span>' +
                        '</div>';
                  })()}
                </div>
              </div>
              
              <div class="summary-title">Detalhamento Analítico dos Lançamentos</div>
              ${document.getElementById('report-table-provisoes')?.outerHTML || ''}
              
              <div style="margin-top: 40px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 20px; background: #f8fafc; page-break-inside: avoid;">
                <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin-bottom: 12px; letter-spacing: 1px;">Considerações Importantes</div>
                <div style="font-size: 10px; color: #475569; font-weight: 500; line-height: 1.6;">
                  As receitas projetadas levam em consideração: adesões em aberto, mensalidades projetadas e mensalidades atrasadas.<br/>
                  <strong>Quantidade de Associados Ativos:</strong> ${associados.filter(a => a.status === 'ativo').length}<br/>
                  <strong>Observação de conciliação:</strong> somando a receita projetada com o total de dispêndios, o resultado projetado é de <strong>${tetoReal - (totalProvisionsExpense + fundoCaixaProvisionado) < 0 ? '-' : ''} R$ ${fmtR(Math.abs(tetoReal - (totalProvisionsExpense + fundoCaixaProvisionado)))}</strong>.
                </div>
              </div>
            </div>
          ` : ''}

          <div class="footer">
            <img src="/ellus_logo_v2.svg" class="footer-logo" onerror="this.style.display='none'" /><br/>
            Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')} pelo sistema Éllus Gestão
          </div>
        </body>
      </html>
    `)
    janela.document.close()
    setTimeout(() => {
      janela.print()
      janela.close()
    }, 800)
  }
  
  const handleExportExcel = (title: string) => {
    if (filteredData.length === 0) return alert('Nenhum dado para exportar.')
    
    let dataToExport: any[] = []

    if (selectedReport === 'receitas_mensal' || selectedReport === 'despesas_mensal') {
      dataToExport = summaryData.map((row: any) => {
        const exportRow: any = { 'Conta Bancária': row.name }
        selectedMonths.forEach(mIdx => {
          exportRow[MESES[mIdx]] = row.months[mIdx] || 0
        })
        exportRow['TOTAL GERAL'] = row.rowTotal
        return exportRow
      })
      
      // Adiciona linha de total mensal
      const totalRow: any = { 'Conta Bancária': 'TOTAL MENSAL' }
      selectedMonths.forEach(mIdx => {
        totalRow[MESES[mIdx]] = matrixTotalsByMonth[mIdx] || 0
      })
      totalRow['TOTAL GERAL'] = Object.values(matrixTotalsByMonth).reduce((acc, v) => acc + v, 0)
      dataToExport.push(totalRow)
    } else {
      dataToExport = filteredData.map((l: any) => ({
        Data: fmtData(l.data),
        Descrição: l.descricao,
        Valor: l.valor,
        Tipo: l.tipo === 'receita' ? 'INGRESSO' : 'DISPÊNDIO',
        Categoria: l.categoria,
        Status: l.status.toUpperCase(),
        Forma: l.forma_pagamento || '',
        Vínculo: getLinkedName(l) || '',
        Conta: contas.find(c => c.id === l.conta_id)?.nome || '',
        ID: l.id
      }))
    }
    
    exportToExcel(dataToExport, `${title.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (selectedReport) {
    const reportInfo = reports.find(r => r.id === selectedReport)
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedReport(null)}
              className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{reportInfo?.title}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{reportInfo?.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedReport === 'provisoes' && onProvisionarReserva && (
              <button 
                onClick={() => onProvisionarReserva(fundoCaixaProvisionado)}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
              >
                <Zap size={16} />
                Provisionar Reserva
              </button>
            )}
            <button 
              onClick={() => handlePrint(reportInfo?.title || 'Relatório')}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              <Printer size={16} />
              Imprimir
            </button>
            <button 
              onClick={() => handleExportExcel(reportInfo?.title || 'Relatório')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 border border-emerald-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-lg shadow-emerald-100/10"
            >
              <FileSpreadsheet size={16} />
              Exportar .XLSX
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtrar dados..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={filterYear} 
            onChange={(e) => setFilterYear(Number(e.target.value))} 
            className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none"
          >
            {[2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {!['receitas', 'despesas', 'receitas_mensal', 'despesas_mensal'].includes(selectedReport || '') && (
            <select 
              value={filterMonth} 
              onChange={(e) => { setFilterMonth(Number(e.target.value)); setTimeRange('month') }} 
              className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none"
            >
              <option value={-1}>Todos Meses</option>
              {MESES.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
            </select>
          )}

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl ml-auto">
            {[
              { id: 'month', label: 'Mensal' },
              { id: 'today', label: 'Hoje' },
              { id: '7d', label: '7 Dias' },
              { id: '14d', label: '14 Dias' },
              { id: '30d', label: '30 Dias' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setTimeRange(r.id as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === r.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {['receitas', 'despesas', 'receitas_mensal', 'despesas_mensal'].includes(selectedReport || '') && (
            <div className="w-full flex flex-wrap gap-2 mt-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
              <p className="w-full text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Sparkles size={12} /> Selecione os meses para o relatório:
              </p>
              {MESES.map((m, idx) => {
                const isSelected = selectedMonths.includes(idx)
                return (
                  <button
                    key={m}
                    onClick={() => {
                      if (isSelected) {
                        if (selectedMonths.length > 1) setSelectedMonths(prev => prev.filter(x => x !== idx))
                      } else {
                        setSelectedMonths(prev => [...prev, idx].sort((a, b) => a - b))
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${isSelected ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200' : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'}`}
                  >
                    {m}
                  </button>
                )
              })}
              <button 
                onClick={() => setSelectedMonths(MESES.map((_, i) => i))}
                className="px-4 py-2 rounded-xl text-[10px] font-black text-emerald-600 uppercase hover:bg-white transition-all ml-auto"
              >
                Selecionar Todos
              </button>
            </div>
          )}

          {selectedReport === 'provisoes' && (
            <div className="w-full flex flex-wrap gap-2 mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
              <p className="w-full text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Sparkles size={12} /> Mostrar Provisões de:
              </p>
              {[
                { id: 'all', label: 'Ambas (Entradas e Saídas)', color: 'bg-indigo-600' },
                { id: 'receita', label: 'Somente Entradas', color: 'bg-emerald-600' },
                { id: 'despesa', label: 'Somente Saídas', color: 'bg-rose-600' },
              ].map(t => {
                const isSelected = provisionType === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setProvisionType(t.id as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${isSelected ? `${t.color} text-white border-transparent shadow-md` : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'}`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {(selectedReport === 'receitas' || selectedReport === 'despesas') && (
          <div className="flex flex-col gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status:</p>
              {['aberto', 'pago', 'atrasado'].map(s => {
                const isSelected = selectedStatus.includes(s)
                return (
                  <button key={s} onClick={() => isSelected ? setSelectedStatus(prev => prev.filter(x => x !== s)) : setSelectedStatus(prev => [...prev, s])}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                  >
                    {s.toUpperCase()}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Forma de Pagamento:</p>
              {['Boleto', 'PIX', 'Dinheiro', 'Cartão', 'Transferência'].map(p => {
                const isSelected = selectedPayments.includes(p)
                return (
                  <button key={p} onClick={() => isSelected ? setSelectedPayments(prev => prev.filter(x => x !== p)) : setSelectedPayments(prev => [...prev, p])}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${isSelected ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conta:</p>
              {contas.map(conta => {
                const isSelected = selectedAccounts.includes(conta.id)
                return (
                  <button key={conta.id} onClick={() => isSelected ? setSelectedAccounts(prev => prev.filter(id => id !== conta.id)) : setSelectedAccounts(prev => [...prev, conta.id])}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                  >
                    {conta.nome}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vínculo:</p>
              {[
                { id: 'all', label: 'TODOS' },
                { id: 'linked', label: selectedReport === 'receitas' ? 'COM ASSOCIADO' : 'COM FORNECEDOR/PRESTADOR' },
                { id: 'unlinked', label: 'SEM VÍNCULOS' },
              ].map(v => {
                const isSelected = filterLink === v.id
                return (
                  <button key={v.id} onClick={() => setFilterLink(v.id as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                  >
                    {v.label}
                  </button>
                )
              })}
            </div>
            {(selectedStatus.length > 0 || selectedPayments.length > 0 || selectedAccounts.length > 0 || filterLink !== 'all') && (
              <button onClick={() => { setSelectedStatus([]); setSelectedPayments([]); setSelectedAccounts([]); setFilterLink('all') }} className="w-fit text-[10px] font-black text-rose-500 uppercase hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all">Limpar Filtros Avançados</button>
            )}
          </div>
        )}

        {selectedReport === 'categorias' && (
          <div className="flex flex-wrap gap-2 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Filtrar Categorias:</p>
            {[...new Set(categorias.map(c => c.nome))].sort().map(cat => {
              const isSelected = selectedCategories.includes(cat)
              return (
                <button
                  key={cat}
                  onClick={() => {
                    if (isSelected) setSelectedCategories(prev => prev.filter(c => c !== cat))
                    else setSelectedCategories(prev => [...prev, cat])
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${isSelected ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                >
                  {cat}
                </button>
              )
            })}
            {selectedCategories.length > 0 && (
              <button 
                onClick={() => setSelectedCategories([])}
                className="px-4 py-2 rounded-xl text-[10px] font-black text-rose-500 uppercase hover:bg-rose-50 transition-all"
              >
                Limpar Seleção
              </button>
            )}
          </div>
        )}

        {selectedReport === 'contas' && (
          <div className="flex flex-wrap gap-2 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Filtrar Contas:</p>
            {contas.map(conta => {
              const isSelected = selectedAccounts.includes(conta.id)
              return (
                <button
                  key={conta.id}
                  onClick={() => {
                    if (isSelected) setSelectedAccounts(prev => prev.filter(id => id !== conta.id))
                    else setSelectedAccounts(prev => [...prev, conta.id])
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                >
                  {conta.nome}
                </button>
              )
            })}
            <button
              onClick={() => {
                if (selectedAccounts.includes('sem_conta')) setSelectedAccounts(prev => prev.filter(id => id !== 'sem_conta'))
                else setSelectedAccounts(prev => [...prev, 'sem_conta'])
              }}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${selectedAccounts.includes('sem_conta') ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-rose-50 text-rose-400 border-rose-100 hover:bg-rose-100'}`}
            >
              EXIBIR "SEM CONTA"
            </button>
            {selectedAccounts.length > 0 && (
              <button 
                onClick={() => setSelectedAccounts([])}
                className="px-4 py-2 rounded-xl text-[10px] font-black text-rose-500 uppercase hover:bg-rose-50 transition-all"
              >
                Limpar Seleção
              </button>
            )}
          </div>
        )}

        {selectedReport === 'inadimplencia' && (
          <div className="flex flex-col gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Forma de Pagamento:</p>
              {['Boleto', 'PIX', 'Dinheiro', 'Cartão', 'Transferência'].map(p => {
                const isSelected = selectedPayments.includes(p)
                return (
                  <button key={p} onClick={() => isSelected ? setSelectedPayments(prev => prev.filter(x => x !== p)) : setSelectedPayments(prev => [...prev, p])}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${isSelected ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Categoria:</p>
              {['Mensalidade', 'Adesão', 'Outros'].map(c => {
                const isSelected = selectedCategories.includes(c)
                return (
                  <button key={c} onClick={() => isSelected ? setSelectedCategories(prev => prev.filter(x => x !== c)) : setSelectedCategories(prev => [...prev, c])}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${isSelected ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conta:</p>
              {contas.map(conta => {
                const isSelected = selectedAccounts.includes(conta.id)
                return (
                  <button key={conta.id} onClick={() => isSelected ? setSelectedAccounts(prev => prev.filter(id => id !== conta.id)) : setSelectedAccounts(prev => [...prev, conta.id])}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                  >
                    {conta.nome}
                  </button>
                )
              })}
            </div>
            {(selectedPayments.length > 0 || selectedAccounts.length > 0 || selectedCategories.length > 0) && (
              <button onClick={() => { setSelectedPayments([]); setSelectedAccounts([]); setSelectedCategories([]) }} className="w-fit text-[10px] font-black text-rose-500 uppercase hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all">Limpar Filtros Avançados</button>
            )}
          </div>
        )}

        {(selectedReport === 'categorias' || selectedReport === 'contas' || selectedReport === 'receitas_mensal' || selectedReport === 'despesas_mensal') && summaryData.length > 0 && (
          <div id="report-summary" className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-8">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[2px] mb-6 flex items-center gap-2">
              {selectedReport === 'categorias' ? <PieChart size={18} className="text-purple-600" /> : (selectedReport === 'contas' ? <Wallet size={18} className="text-indigo-600" /> : <BarChart3 size={18} className="text-emerald-600" />)} 
              {selectedReport === 'receitas_mensal' || selectedReport === 'despesas_mensal' ? `Matriz Mensal de ${selectedReport === 'receitas_mensal' ? 'Receitas' : 'Despesas'}` : `Resumo de Movimentação por ${selectedReport === 'categorias' ? 'Categoria' : 'Conta'}`}
            </h4>
            
            {selectedReport === 'receitas_mensal' || selectedReport === 'despesas_mensal' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-10 min-w-[200px]">Conta Bancária</th>
                      {selectedMonths.map(mIdx => (
                        <th key={mIdx} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{MESES[mIdx].substring(0, 3)}</th>
                      ))}
                      <th className="px-6 py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right bg-slate-100/50">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {summaryData.map((row: any) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 text-sm font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors">{row.name}</td>
                        {selectedMonths.map(mIdx => (
                          <td key={mIdx} className={`px-6 py-4 text-sm font-bold text-right ${row.months[mIdx] > 0 ? (selectedReport === 'receitas_mensal' ? 'text-emerald-600' : 'text-rose-600') : 'text-slate-300'}`}>
                            {row.months[mIdx] ? fmtR(row.months[mIdx]) : '-'}
                          </td>
                        ))}
                        <td className={`px-6 py-4 text-sm font-black text-right bg-slate-50/30 ${selectedReport === 'receitas_mensal' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {fmtR(row.rowTotal)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-900 text-white font-black">
                      <td className="px-6 py-4 text-[10px] uppercase tracking-widest">Total Mensal</td>
                      {selectedMonths.map(mIdx => (
                        <td key={mIdx} className="px-6 py-4 text-sm text-right">{fmtR(matrixTotalsByMonth[mIdx] || 0)}</td>
                      ))}
                      <td className="px-6 py-4 text-sm text-right bg-emerald-500">{fmtR(Object.values(matrixTotalsByMonth).reduce((acc, v) => acc + v, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedReport === 'categorias' ? 'Categoria' : 'Conta'}</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ingressos</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Dispêndios</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {summaryData.map((item: any) => (
                    <tr key={item.name} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{item.name}</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">{fmtR(item.income || 0)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-rose-600 text-right">{fmtR(item.expense || 0)}</td>
                      <td className={`px-6 py-4 text-sm font-black text-right ${(item.balance || 0) >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                        {fmtR(item.balance || 0)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/80 font-black">
                    <td className="px-6 py-4 text-[10px] uppercase tracking-widest text-slate-900">Total Consolidado</td>
                    <td className="px-6 py-4 text-sm text-emerald-600 text-right">{fmtR(summaryData.reduce((acc: number, i: any) => acc + (i.income || 0), 0))}</td>
                    <td className="px-6 py-4 text-sm text-rose-600 text-right">{fmtR(summaryData.reduce((acc: number, i: any) => acc + (i.expense || 0), 0))}</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 text-right">{fmtR(summaryData.reduce((acc: number, i: any) => acc + (i.balance || 0), 0))}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}

        {(selectedReport === 'receitas_mensal' || selectedReport === 'despesas_mensal') && (
          <div className="p-6 bg-indigo-50 rounded-[32px] border border-indigo-100 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <h5 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-1 flex items-center gap-2">
                Informativo: Regime de Caixa
              </h5>
              <p className="text-[11px] text-indigo-700 font-medium leading-relaxed max-w-2xl">
                Os relatórios de <strong>Matriz Mensal</strong> operam exclusivamente sob o <strong>Regime de Caixa</strong>. 
                Os valores são contabilizados na data do pagamento real (conciliação) e apenas para lançamentos quitados.
              </p>
            </div>
          </div>
        )}

        {selectedReport === 'provisoes' && (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            
            {/* HEADER CUSTOMIZADO */}
            <div className="bg-emerald-950 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm border border-emerald-900/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-1 shadow-inner flex-shrink-0 overflow-hidden">
                {tenant?.logo_url ? (
                  <img src={tenant.logo_url} alt={tenant.nome} className="w-full h-full object-contain rounded-full" />
                ) : (
                  <div className="w-full h-full bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 font-black text-xl">
                    {tenant?.nome?.charAt(0) || 'A'}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">{tenant?.nome || 'ACPROBEC'}</h2>
                <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  Relatório de Provisões 
                  <span className="w-1 h-1 rounded-full bg-emerald-500/50" /> 
                  Emissão {fmtData(new Date().toISOString())} 
                  <span className="w-1 h-1 rounded-full bg-emerald-500/50" /> 
                  Período {MESES[filterMonth !== -1 ? filterMonth : 0].substring(0,3).toUpperCase()}/{filterYear}
                </h3>
              </div>
            </div>

            {/* KPIS DE RESULTADO */}
            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 pl-2">Resultado Projetado do Período</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-3 bg-white rounded-2xl border border-rose-100 shadow-sm p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Provisões Menos Receita Projetada</p>
                      <p className="text-4xl font-black text-rose-600 tracking-tighter">
                        {tetoReal - (totalProvisionsExpense + fundoCaixaProvisionado) < 0 ? '-' : ''} R$ {fmtR(Math.abs(tetoReal - (totalProvisionsExpense + fundoCaixaProvisionado)))}
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-rose-50 rounded-full border border-rose-100 text-[10px] font-black text-rose-600 uppercase tracking-widest">
                      • Provisão Negativa
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Receita Projetada</p>
                  <p className="text-xl font-black text-emerald-600 tracking-tighter">R$ {fmtR(tetoReal)}</p>
                </div>
                
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dispêndios (Sem Reserva)</p>
                  <p className="text-xl font-black text-rose-600 tracking-tighter">R$ {fmtR(totalProvisionsExpense)}</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '10px 10px' }} />
                  <div className="relative z-10 flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reserva Técnica</p>
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                      <button 
                        onClick={() => setReserveType('percentage')} 
                        className={`text-[9px] font-bold px-2 py-1 rounded-md transition-colors ${reserveType === 'percentage' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >%</button>
                      <button 
                        onClick={() => setReserveType('fixed')} 
                        className={`text-[9px] font-bold px-2 py-1 rounded-md transition-colors ${reserveType === 'fixed' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >R$</button>
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center gap-2 mb-2">
                    <input 
                      type="number" 
                      value={reserveValue} 
                      onChange={(e) => setReserveValue(Number(e.target.value))}
                      className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-700 outline-none focus:border-slate-300 transition-colors"
                    />
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      {reserveType === 'percentage' ? 'da Receita' : 'Valor Fixo'}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <p className="text-xl font-black text-slate-700 tracking-tighter">R$ {fmtR(fundoCaixaProvisionado)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* GRÁFICO CASCATA */}
            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 pl-2 mt-4">Como a Receita se consome (Cascata)</h4>
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                <div className="column-container flex items-end gap-2 h-[280px] mt-6 pb-20 border-b border-slate-100 overflow-x-auto no-scrollbar">
                  {/* Receita Projetada */}
                  <div className="column-item h-full flex flex-col items-center justify-end relative min-w-[120px]">
                    <div className="w-12 bg-emerald-400 rounded-t-sm flex-shrink-0" style={{ height: tetoReal > 0 ? '100%' : '2px' }} />
                    <div className="absolute -bottom-20 text-center w-full">
                      <span className="block text-[11px] font-black text-emerald-600 mb-1 leading-none">R$ {fmtR(tetoReal)}</span>
                      <span className="block text-[8px] font-black text-slate-400 uppercase leading-tight line-clamp-2 px-1">Receita<br/>Projetada</span>
                    </div>
                  </div>

                  {/* Despesas em Cascata */}
                  {despesasProvisoesPorCategoria.map(([cat, val], idx) => {
                    const perc = tetoReal > 0 ? (val / tetoReal) * 100 : 0
                    // Calcula a margem superior simulando cascata.
                    let acumuladoAnterior = 0;
                    for (let i = 0; i < idx; i++) {
                      acumuladoAnterior += (despesasProvisoesPorCategoria[i][1] / tetoReal) * 100;
                    }
                    
                    const topOffsetVal = Math.min(acumuladoAnterior, 100);
                    const columnHeightVal = Math.max(Math.min(perc, 100 - topOffsetVal), 1);
                    
                    const columnHeight = `${columnHeightVal}%`
                    const topOffset = `${topOffsetVal}%`
                    
                    return (
                      <div key={cat} className="column-item h-full flex flex-col items-center justify-start relative min-w-[120px]">
                        <div style={{ height: topOffset }} className="w-full flex-shrink-0" />
                        <div className="w-12 bg-rose-400 rounded-sm flex-shrink-0" style={{ height: val > 0 ? columnHeight : '2px' }} />
                        <div className="absolute -bottom-20 text-center w-full">
                          <span className="block text-[11px] font-black text-rose-600 mb-1 leading-none">- R$ {fmtR(val)}</span>
                          <span className="block text-[8px] font-black text-slate-400 uppercase leading-tight line-clamp-2 px-1">{cat}</span>
                        </div>
                      </div>
                    )
                  })}

                  {/* Fundo de Caixa */}
                  <div className="column-item h-full flex flex-col items-center justify-start relative min-w-[120px]">
                    {(() => {
                        const percRes = tetoReal > 0 ? (fundoCaixaProvisionado / tetoReal) * 100 : 0
                        let acPrev = despesasProvisoesPorCategoria.reduce((acc, curr) => acc + (curr[1]/tetoReal)*100, 0);
                        
                        const topOffVal = Math.min(acPrev, 100);
                        const hResVal = Math.max(Math.min(percRes, 100 - topOffVal), 1);

                        const topOff = `${topOffVal}%`
                        const hRes = `${hResVal}%`
                        
                        return (
                          <>
                            <div style={{ height: topOff }} className="w-full flex-shrink-0" />
                            <div className="w-12 bg-slate-300 rounded-sm relative overflow-hidden flex-shrink-0" style={{ height: fundoCaixaProvisionado > 0 ? hRes : '2px' }}>
                              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '4px 4px' }} />
                            </div>
                            <div className="absolute -bottom-20 text-center w-full">
                              <span className="block text-[11px] font-black text-slate-600 mb-1 leading-none">- R$ {fmtR(fundoCaixaProvisionado)}</span>
                              <span className="block text-[8px] font-black text-slate-400 uppercase leading-tight line-clamp-2 px-1">Fundo de<br/>Caixa</span>
                            </div>
                          </>
                        )
                    })()}
                  </div>
                  
                  {/* Resultado Final */}
                  <div className="column-item h-full flex flex-col items-center justify-end relative min-w-[120px] ml-4 border-l border-slate-100 pl-4">
                    {(() => {
                        const saldo = tetoReal - (totalProvisionsExpense + fundoCaixaProvisionado);
                        const percSaldo = tetoReal > 0 ? (Math.abs(saldo) / tetoReal) * 100 : 0;
                        const hSaldo = `${Math.max(Math.min(percSaldo, 100), 1)}%`;
                        const color = saldo >= 0 ? 'bg-emerald-400' : 'bg-rose-500';
                        const textColor = saldo >= 0 ? 'text-emerald-600' : 'text-rose-600';
                        return (
                          <>
                            <div className={`w-12 ${color} rounded-t-sm flex-shrink-0`} style={{ height: hSaldo }} />
                            <div className="absolute -bottom-20 text-center w-full">
                              <span className={`block text-[11px] font-black ${textColor} mb-1 leading-none`}>
                                {saldo < 0 ? '-' : ''} R$ {fmtR(Math.abs(saldo))}
                              </span>
                              <span className="block text-[8px] font-black text-slate-400 uppercase leading-tight line-clamp-2 px-1">Resultado<br/>Final</span>
                            </div>
                          </>
                        )
                    })()}
                  </div>

                </div>
              </div>
            </div>

            {/* TABELA ANALÍTICA */}
            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 pl-2 mt-4">Detalhamento Analítico dos Lançamentos</h4>
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <table id="report-table-provisoes" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[150px]">Valor</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[120px]">% do Teto</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[120px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {despesasProvisoesPorCategoria.map(([cat, val]) => (
                      <tr key={cat} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-2 text-xs font-bold text-slate-700 uppercase">{cat}</td>
                        <td className="px-6 py-2 text-right text-xs font-black text-rose-600 whitespace-nowrap">- {fmtR(val)}</td>
                        <td className="px-6 py-2 text-right text-[11px] font-bold text-slate-500">{(tetoReal > 0 ? (val/tetoReal)*100 : 0).toFixed(1)}%</td>
                        <td className="px-6 py-2 text-center">
                          <span className="inline-flex px-3 py-1 bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-200/50">Aberto</span>
                        </td>
                      </tr>
                    ))}
                    {/* Fundo de Caixa */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-2 text-xs font-bold text-slate-500 uppercase">Fundo de Caixa - Reserva Técnica ({reserveType === 'percentage' ? reserveValue + '%' : 'Fixo'})</td>
                      <td className="px-6 py-2 text-right text-xs font-black text-slate-600 whitespace-nowrap">- {fmtR(fundoCaixaProvisionado)}</td>
                      <td className="px-6 py-2 text-right text-[11px] font-bold text-slate-500">{(tetoReal > 0 ? (fundoCaixaProvisionado/tetoReal)*100 : 0).toFixed(1)}%</td>
                      <td className="px-6 py-2 text-center">
                        <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-200">Provisão</span>
                      </td>
                    </tr>
                    {/* Totais */}
                    <tr className="bg-slate-50/50 border-t-2 border-slate-100">
                      <td className="px-6 py-3 text-xs font-black text-slate-900 uppercase tracking-widest">Total Geral de Dispêndios Projetados</td>
                      <td className="px-6 py-3 text-right text-sm font-black text-rose-600 whitespace-nowrap">- {fmtR(totalProvisionsExpense + fundoCaixaProvisionado)}</td>
                      <td className="px-6 py-3 text-right text-xs font-black text-slate-900">{(tetoReal > 0 ? ((totalProvisionsExpense + fundoCaixaProvisionado)/tetoReal)*100 : 0).toFixed(1)}%</td>
                      <td className="px-6 py-3 text-center"></td>
                    </tr>
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td className="px-6 py-3 text-xs font-black text-slate-900 uppercase tracking-widest">Resultado Projetado no Período</td>
                      <td className="px-6 py-3 text-right text-sm font-black text-rose-600">
                         {tetoReal - (totalProvisionsExpense + fundoCaixaProvisionado) < 0 ? '-' : ''} {fmtR(Math.abs(tetoReal - (totalProvisionsExpense + fundoCaixaProvisionado)))}
                      </td>
                      <td colSpan={2} className="px-6 py-3 text-center text-slate-400 font-bold tracking-widest text-[10px]">--</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* CONSIDERAÇÕES IMPORTANTES */}
            <div>
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mt-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Considerações Importantes</h4>
                <div className="space-y-4">
                  <p className="text-xs font-medium text-slate-600">
                    <strong className="text-slate-800">Receita projetada</strong> considera adesões em aberto, mensalidades projetadas e mensalidades atrasadas.
                  </p>
                  <p className="text-xs font-medium text-slate-600">
                    <strong className="text-slate-800">Associados ativos:</strong> {associados?.filter(a => a.status === 'ativo')?.length || 0}
                  </p>
                  <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl mt-4">
                    <p className="text-xs font-medium text-sky-800 leading-relaxed">
                      <strong className="text-sky-900">Observação de conciliação:</strong> somando a receita projetada (R$ {fmtR(tetoReal)}) com o total de dispêndios projetados (- R$ {fmtR(totalProvisionsExpense + fundoCaixaProvisionado)}), o resultado do período é de <strong className="text-sky-900">{tetoReal - (totalProvisionsExpense + fundoCaixaProvisionado) < 0 ? '-' : ''} R$ {fmtR(Math.abs(tetoReal - (totalProvisionsExpense + fundoCaixaProvisionado)))}</strong>.
                      Este relatório traça o <em>Resultado Projetado no Período</em> cruzando a visão categorizada. Acompanhe os alertas de conformidade para anomalias contábeis.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-center text-[9px] font-bold text-slate-400 mt-6 uppercase tracking-[3px]">
                Documento gerado eletronicamente em {fmtData(new Date().toISOString())} pelo sistema Ellus Gestão - Versão Revisada
              </p>
            </div>

          </div>
        )}

        <div id="report-table" className={selectedReport === 'provisoes' ? 'hidden' : "bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden"}>
          {selectedReport === 'extrato' ? (
            <DataTable 
              columns={[
                { 
                  header: 'Data', 
                  key: 'realizado_em', 
                  filterValue: (i: any) => fmtData(i.realizado_em || i.created_at),
                  render: (i: any) => <span className="text-xs font-semibold text-slate-600">{fmtData(i.realizado_em || i.created_at)}</span> 
                },
                { 
                  header: 'Associado', 
                  key: 'associado_id', 
                  filterValue: (i: any) => i.associados?.nome || '',
                  render: (i: any) => <span className="text-sm font-bold text-slate-800">{i.associados?.nome || 'N/A'}</span>
                },
                { 
                  header: 'Ação / Etapa', 
                  key: 'etapa', 
                  filterValue: (i: any) => i.etapa || '',
                  render: (i: any) => <StatusBadge status={i.etapa === 'Pagamento Realizado' ? 'pago' : 'em_andamento'} type="lancamento" label={i.etapa} />
                },
                { 
                  header: 'Canal', 
                  key: 'canal', 
                  filterValue: (i: any) => i.canal || '',
                  render: (i: any) => <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{i.canal || 'SISTEMA'}</span>
                },
                { 
                  header: 'Detalhes', 
                  key: 'observacao', 
                  filterValue: (i: any) => `${i.texto_enviado} ${i.observacao}`,
                  render: (i: any) => (
                    <div className="text-xs text-slate-500 flex flex-col gap-1 max-w-sm">
                      <span className="font-bold text-slate-700 leading-tight">{i.texto_enviado}</span>
                      {i.observacao && <span className="italic text-[10px] leading-tight">{i.observacao}</span>}
                    </div>
                  )
                }
              ]} 
              data={filteredCobrancaLogs} 
              loading={loadingCobranca} 
              showFilterInputs={true}
              exportable={true}
              exportFilename="Auditoria_Cobrancas"
            />
          ) : (
            <DataTable 
              columns={columns} 
              data={filteredData} 
              loading={loading} 
              showFilterInputs={true}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((rel, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedReport(rel.id)}
            className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group cursor-pointer flex items-center gap-4"
          >
            <div className={`w-12 h-12 shrink-0 rounded-2xl ${rel.bg} flex items-center justify-center ${rel.color} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm`}>
              <rel.icon size={22} />
            </div>
            
            <div className="flex-1 min-w-0 pr-2">
              <h4 className="text-[13px] font-black text-slate-800 mb-0.5 tracking-tight truncate group-hover:text-emerald-700 transition-colors">{rel.title}</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-snug line-clamp-2">{rel.desc}</p>
            </div>
            
            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:text-white transition-all duration-300 opacity-50 group-hover:opacity-100 shadow-sm">
              <FileText size={14} />
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100 flex items-start gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
          <FileText size={24} />
        </div>
        <div>
          <h5 className="text-sm font-black text-emerald-900 uppercase tracking-widest mb-1">Central de Relatórios Financeiros</h5>
          <p className="text-[11px] text-emerald-700 font-medium leading-relaxed max-w-2xl">
            Emita relatórios detalhados para análise de fluxo de caixa, receitas, despesas e inadimplência. 
            Utilize os filtros internos de cada relatório para gerar visões dinâmicas e exportar para impressão oficial.
          </p>
        </div>
      </div>
    </div>
  )
}
