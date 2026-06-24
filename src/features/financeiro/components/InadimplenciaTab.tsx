'use client'
import React, { useMemo, useState } from 'react'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import DataTable from '@/components/ui/DataTable'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, fmtData, fmtPct, statusCobrancaClass } from '@/lib/utils/formatters'
import { AlertTriangle, TrendingDown, Users, ShieldAlert, Pencil, XCircle, CheckCircle2, Search, Trash2, Loader2, MessageCircle, History, Download } from 'lucide-react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import * as XLSX from 'xlsx'
import InadimplenciaLogModal from './InadimplenciaLogModal'
import { useFinanceiroLogs } from '@/lib/hooks/useFinanceiroLogs'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal, { Field } from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import { useContas } from '@/lib/hooks/useContas'
import { useCategorias } from '@/lib/hooks/useCategorias'
import BatchActionBar from '@/components/ui/BatchActionBar'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { getMesIdx, getAnoIdx, MESES } from '@/lib/utils/formatters'
import CobrancaDrawer from '@/features/cobranca/components/CobrancaDrawer'
import CobrancaStatusCell from '@/features/cobranca/components/CobrancaStatusCell'
import { calcularTotalAtualizado } from '@/features/cobranca/utils/cobrancaUtils'
import SuspensaoModal from './SuspensaoModal'
import AbonoLancamentoModal from '@/components/financeiro/AbonoLancamentoModal'
import { FileText, ScrollText } from 'lucide-react'
import jsPDF from 'jspdf'
import { useTenant } from '@/lib/hooks/useTenant'
import { usePermissions } from '@/lib/hooks/usePermissions'

ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController)

interface InadimplenciaTabProps {
  associados?: any[]
  lancamentos?: any[]
  loading?: boolean
  atualizar?: (id: string, data: any) => Promise<any>
  remover?: (id: string) => Promise<any>
  removerBulk?: (ids: string[]) => Promise<any>
  atualizarBulk?: (ids: string[], data: any) => Promise<any>
}

export default function InadimplenciaTab({
  associados: propsAssoc,
  lancamentos: propsLanc,
  loading: propsLoading,
  atualizar: propsAtualizar,
  remover: propsRemover,
  removerBulk: propsRemoverBulk,
  atualizarBulk: propsAtualizarBulk
}: InadimplenciaTabProps) {
  // Ganchos internos (fallbacks caso não receba props)
  const { associados: hookAssoc, loading: loadAssoc, atualizar: hookAtualizarAssoc } = useAssociados()
  const { 
    lancamentos: hookLanc, 
    loading: loadFin, 
    atualizar: hookAtualizar, 
    remover: hookRemover, 
    removerBulk: hookRemoverBulk, 
    atualizarBulk: hookAtualizarBulk,
    refresh
  } = useFinanceiro()

  // Prioriza props se disponíveis para garantir sincronização em tempo real
  const associados = propsAssoc || hookAssoc
  const lancamentos = propsLanc || hookLanc
  const loading = propsLoading ?? (loadAssoc || loadFin)
  const atualizar = propsAtualizar || hookAtualizar
  const remover = propsRemover || hookRemover
  const removerBulk = propsRemoverBulk || hookRemoverBulk
  const atualizarBulk = propsAtualizarBulk || hookAtualizarBulk

  // Auditoria
  const { logs, loading: loadingLogs, fetchLogs, logAction } = useFinanceiroLogs()
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)

  const { criar, editar, excluir, isAdmin } = usePermissions('financeiro')
  const { contas } = useContas()
  const { categorias } = useCategorias()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCleaning, setIsCleaning] = useState(false)
  const [cobrancaDrawerOpen, setCobrancaDrawerOpen] = useState(false)
  const [selectedAssociadoCobranca, setSelectedAssociadoCobranca] = useState<any>(null)
  
  // Seletor de Meses para cobrança
  const [isSeletorMesesOpen, setIsSeletorMesesOpen] = useState(false)
  const [lancsParaCobrar, setLancsParaCobrar] = useState<any[]>([])
  const [checkedLancs, setCheckedLancs] = useState<string[]>([])

  // Novos Filtros e Batch
  const [filterMonth, setFilterMonth] = useState<number>(-1)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [cobrancaConfig, setCobrancaConfig] = useState<any>(null)
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<any>(null)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [isSuspensaoModalOpen, setIsSuspensaoModalOpen] = useState(false)
  const { tenant } = useTenant()

  React.useEffect(() => {
    fetch('/api/cobranca/config').then(r => r.json()).then(data => {
      if (!data.error) setCobrancaConfig(data)
    }).catch(() => {})
  }, [])

  // Atualiza os dados no supabase quando o ano muda
  React.useEffect(() => {
    if (refresh) refresh(filterYear)
  }, [filterYear])
  const [filterStatusCobranca, setFilterStatusCobranca] = useState<string>('ALL')
  const [filterPayment, setFilterPayment] = useState<string>('ALL')
  const [filterMesesAtraso, setFilterMesesAtraso] = useState<string>('ALL')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false)

  // Lançamentos atrasados (detalhado) - Base de cálculo real
  const lancamentosAtrasados = useMemo(() => {
    const today = new Date()
    return lancamentos.filter(l => {
        const todayStr = today.toISOString().split('T')[0]
        return l.status === 'atrasado' || (l.status === 'aberto' && l.data < todayStr)
    }).filter(l => {
        const m = getMesIdx(l.data)
        const y = getAnoIdx(l.data)
        const matchPeriod = (filterMonth === -1 || m === filterMonth) && (filterYear === -1 || y === filterYear)

        const searchLower = searchTerm.toLowerCase()
        const assoc = associados.find(a => a.id === l.associado_id)
        const matchSearch = (!searchTerm || 
                l.descricao.toLowerCase().includes(searchLower) ||
                (l.status_cobranca && l.status_cobranca.toLowerCase().includes(searchLower)) ||
                (assoc?.nome && assoc.nome.toLowerCase().includes(searchLower)))

        const matchCobranca = filterStatusCobranca === 'ALL' || 
                             (filterStatusCobranca === 'PENDENTE' ? !l.status_cobranca : l.status_cobranca === filterStatusCobranca)
        
        const matchPayment = filterPayment === 'ALL' || l.forma_pagamento === filterPayment

        const d1 = new Date(l.data)
        const diffMonths = (today.getFullYear() - d1.getFullYear()) * 12 + (today.getMonth() - d1.getMonth())
        const matchMeses = filterMesesAtraso === 'ALL' || 
                          (filterMesesAtraso === '3+' ? diffMonths >= 3 : diffMonths === Number(filterMesesAtraso))

        return matchPeriod && matchSearch && matchCobranca && matchPayment && matchMeses
    })
  }, [lancamentos, searchTerm, associados, filterMonth, filterYear, filterStatusCobranca, filterPayment, filterMesesAtraso])

  // Cálculos Automáticos
  const totalDevido = useMemo(() => 
    lancamentosAtrasados.reduce((acc, l) => acc + (l.valor || 0), 0),
  [lancamentosAtrasados])

  // Agrupamento de Inadimplentes
  const mappedInadimplentes = useMemo(() => {
    const map: Record<string, { id: string, assoc: any, descricao: string, lancamentos: any[], meses: number, totalOriginal: number, totalAtualizado: number, diasAtraso: number }> = {}
    
    lancamentosAtrasados.forEach(l => {
      const aid = l.associado_id || `avulso_${l.id}`
      if (!map[aid]) {
        const assoc = associados.find(a => a.id === l.associado_id)
        map[aid] = { id: aid, assoc, descricao: assoc?.nome || l.descricao, lancamentos: [], meses: 0, totalOriginal: 0, totalAtualizado: 0, diasAtraso: 0 }
      }
      map[aid].lancamentos.push(l)
      map[aid].meses += 1
      map[aid].totalOriginal += (Number(l.valor) || 0)
    })

    const mPerc = cobrancaConfig?.multa_moratoria_perc ?? 2
    const jPerc = cobrancaConfig?.juros_mora_mensal_perc ?? 1

    const result = Object.values(map).map(group => {
      let oldestDate: Date | null = null;
      for (const l of group.lancamentos) {
        if (!l.data) continue;
        const d = new Date(l.data);
        if (!oldestDate || d < oldestDate) oldestDate = d;
      }

      let dias = 0;
      if (oldestDate) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        oldestDate.setHours(0, 0, 0, 0);
        if (hoje > oldestDate) {
           dias = Math.ceil((hoje.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }
      group.diasAtraso = dias;

      const atualizado = calcularTotalAtualizado(group.totalOriginal, dias, mPerc, jPerc);
      group.totalAtualizado = atualizado.total;
      return group;
    });

    return result.sort((a, b) => b.meses - a.meses)
  }, [lancamentosAtrasados, associados, cobrancaConfig])

  const ticketMedioAtraso = mappedInadimplentes.length > 0 ? totalDevido / mappedInadimplentes.length : 0
  const pctInadimpTotal = (mappedInadimplentes.length / (associados.length || 1)) * 100

  // Curva de atraso calculada dinamicamente
  const curva = useMemo(() => {
    let m1 = 0, m2 = 0, m3 = 0, m3plus = 0
    mappedInadimplentes.forEach(item => {
      const ms = item.meses
      if (ms === 1) m1++
      else if (ms === 2) m2++
      else if (ms === 3) m3++
      else if (ms > 3) m3plus++
    })
    return [m1, m2, m3, m3plus]
  }, [mappedInadimplentes])

  const handleMarcarPago = async (item: any) => {
    if (!confirm('Deseja marcar este lançamento como pago?')) return
    const todayStr = new Date().toISOString().split('T')[0]
    const res = await atualizar(item.id, { 
      status: 'pago',
      data_conciliacao: todayStr,
      conciliado: true
    })
    if (!res?.error) {
      logAction('BAIXA DE PAGAMENTO', `Lançamento ${item.id} (${item.descricao}) marcado como PAGO na aba de Inadimplência.`)
      
      if (item.associado_id) {
        fetch(`/api/cobranca/associado/${item.associado_id}/acao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            etapa: 'Pagamento Realizado',
            canal: 'sistema',
            textoEnviado: `Liquidado em Inadimplência: ${item.descricao || 'Mensalidade'}`,
            observacao: `Pagamento confirmado e liquidado (R$ ${item.valor.toFixed(2)})`
          })
        }).catch(console.error)
      }
    }
  }

  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDelete = async (item: any) => { 
    if (confirm('Excluir este lançamento?')) {
      const res = await remover(item.id)
      if (!res?.error) {
        logAction('EXCLUSÃO', `Lançamento ${item.id} (${item.descricao}) EXCLUÍDO definitivamente através da aba de Inadimplência.`)
      }
    }
  }

  const handleSalvar = async (data: any) => {
    if (editingItem) {
      const res = await atualizar(editingItem.id, data)
      if (!res?.error) {
        logAction('EDIÇÃO', `Lançamento ${editingItem.id} (${data.descricao}) editado manualmente.`)
      }
    }
    setIsModalOpen(false)
    setEditingItem(null)
  }

  const handleBulkDelete = async () => {
    const allLancamentoIds = selectedIds.flatMap(groupId => {
      const group = mappedInadimplentes.find(g => g.id === groupId)
      return group ? group.lancamentos.map(l => l.id) : []
    })

    if (allLancamentoIds.length === 0) return

    const res = await removerBulk(allLancamentoIds)
    if (!res.error) {
      logAction('EXCLUSÃO EM LOTE', `${allLancamentoIds.length} lançamentos foram excluídos simultaneamente.`)
      setSelectedIds([])
      setIsConfirmDeleteOpen(false)
    } else {
      alert(res.error)
    }
  }

  const handleBulkAbonar = async (motivo: string) => {
    const allLancamentoIds = selectedIds.flatMap(groupId => {
      const group = mappedInadimplentes.find(g => g.id === groupId)
      return group ? group.lancamentos.map(l => l.id) : []
    })

    if (allLancamentoIds.length === 0) return

    const dataToUpdate: any = {
      status: 'cancelado',
      banco_original_memo: `[ABONO] Motivo: ${motivo} | Por: Sistema`
    }
    const res = await atualizarBulk(allLancamentoIds, dataToUpdate)
    if (!res.error) {
      logAction('ABONO EM LOTE', `${allLancamentoIds.length} lançamentos foram abonados. Motivo: ${motivo}`)
      setSelectedIds([])
      setIsAbonoModalOpen(false)
    } else {
      alert(res.error)
    }
  }

  const handleBulkUpdate = async (data: any) => {
    const allLancamentoIds = selectedIds.flatMap(groupId => {
      const group = mappedInadimplentes.find(g => g.id === groupId)
      return group ? group.lancamentos.map(l => l.id) : []
    })

    if (allLancamentoIds.length === 0) return

    let finalInput = { ...data }
    if (finalInput.status === 'pago') {
      finalInput.data_conciliacao = new Date().toISOString().split('T')[0]
      finalInput.conciliado = true
    }
    const res = await atualizarBulk(allLancamentoIds, finalInput)
    if (!res.error) {
      let detalhes = `Atualização em lote de ${allLancamentoIds.length} lançamentos.`
      if (data.status_cobranca) detalhes += ` Status de cobrança alterado para: ${data.status_cobranca}.`
      if (data.status === 'pago') detalhes += ` Marcados como PAGO.`
      logAction('AÇÃO EM LOTE', detalhes)
      setSelectedIds([])
    } else {
      alert(res.error)
    }
  }

  const handleInvertTypeBulk = async () => {
    const allLancamentoIds = selectedIds.flatMap(groupId => {
      const group = mappedInadimplentes.find(g => g.id === groupId)
      return group ? group.lancamentos.map(l => l.id) : []
    })

    if (allLancamentoIds.length === 0) return
    if (!confirm(`Deseja inverter o tipo (Ingresso ↔ Dispêndio) de ${allLancamentoIds.length} lançamentos?`)) return

    try {
      for (const id of allLancamentoIds) {
        const item = lancamentos.find(l => l.id === id)
        if (item) {
          const novoTipo = item.tipo === 'receita' ? 'despesa' : 'receita'
          await atualizar(id, { tipo: novoTipo })
        }
      }
      setSelectedIds([])
    } catch (err: any) {
      alert(`Erro ao inverter tipos: ${err.message}`)
    }
  }

  const handleCobrar = (assoc: any, lancsDaPessoa?: any[]) => {
    if (!assoc) return
    setSelectedAssociadoCobranca(assoc)
    if (lancsDaPessoa && lancsDaPessoa.length > 1) {
      // Abre o modal de seleção antes de abrir o painel
      setLancsParaCobrar(lancsDaPessoa)
      setCheckedLancs(lancsDaPessoa.map(l => l.id))
      setIsSeletorMesesOpen(true)
    } else {
      setLancsParaCobrar(lancsDaPessoa || [])
      setCheckedLancs(lancsDaPessoa ? [lancsDaPessoa[0]?.id].filter(Boolean) : [])
      setCobrancaDrawerOpen(true)
    }
  }

  const handleExportarExcel = () => {
    if (mappedInadimplentes.length === 0) {
      alert('Nenhuma informação na tabela para exportar.')
      return
    }

    const data = mappedInadimplentes.map(item => {
      const oldestStatus = item.lancamentos[0]?.status_cobranca || 'Pendente'
      return {
        'Associado': item.assoc?.nome || item.descricao,
        'Pendências': item.meses,
        'Dias de Atraso': item.diasAtraso,
        'Valor Original (R$)': item.totalOriginal,
        'Valor Atualizado (R$)': item.totalAtualizado,
        'Status Cobrança': oldestStatus
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(data)
    const maxWidths = [40, 15, 15, 20, 20, 20]
    worksheet['!cols'] = maxWidths.map(w => ({ wch: w }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inadimplência')
    XLSX.writeFile(workbook, 'Inadimplencia_ACPROBEC.xlsx')
  }

  const handleCleanupDuplicates = async () => {
    if (lancamentosAtrasados.length === 0) return
    if (!confirm(`Deseja remover mensalidades duplicadas na lista de inadimplência? O sistema manterá apenas um lançamento por associado/mês.`)) return

    setIsCleaning(true)
    try {
      const groups: Record<string, any[]> = {}
      
      lancamentosAtrasados.forEach(l => {
        if (!l.associado_id || !l.data) return
        const d = new Date(l.data)
        const key = `${l.associado_id}_${d.getFullYear()}_${d.getMonth()}`
        if (!groups[key]) groups[key] = []
        groups[key].push(l)
      })

      const idsToDelete: string[] = []
      Object.values(groups).forEach(group => {
        if (group.length <= 1) return
        for (let i = 1; i < group.length; i++) {
          idsToDelete.push(group[i].id)
        }
      })

      if (idsToDelete.length === 0) {
        alert('Nenhuma duplicata identificada nesta lista.')
        return
      }

      const res = await removerBulk(idsToDelete)
      if (res.error) alert(`Erro: ${res.error}`)
      else {
        alert(`Sucesso! ${idsToDelete.length} lançamentos duplicados removidos.`)
        logAction('LIMPEZA', `Remoção de ${idsToDelete.length} lançamentos duplicados.`)
      }
    } finally {
      setIsCleaning(false)
    }
  }

  const gerarComunicado = async (assoc: any) => {
    const doc = new jsPDF()
    const dateStr = assoc.suspensao_data ? fmtData(assoc.suspensao_data) : fmtData(new Date().toISOString())
    const motivo = assoc.suspensao_motivo || 'Suspensão Por Inadimplência'

    let logoY = 15
    let startY = 45

    if (tenant?.logo_url) {
      try {
        const response = await fetch(tenant.logo_url)
        const blob = await response.blob()
        const reader = new FileReader()
        await new Promise<void>((resolve) => {
          reader.onload = (e) => {
            const imgData = e.target?.result as string
            const imgType = blob.type.includes('png') ? 'PNG' : 'JPEG'
            doc.addImage(imgData, imgType, 80, logoY, 50, 20, undefined, 'FAST')
            resolve()
          }
          reader.readAsDataURL(blob)
        })
        startY = 50
      } catch { /* continua sem logo */ }
    }

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('COMUNICADO DE SUSPENSÃO:', 105, startY, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    const margin = 20
    let cursorY = startY + 18

    doc.setFont('helvetica', 'bold')
    const assunto = motivo === 'Suspensão Por Inadimplência'
      ? 'Assunto: Suspensão de Plano de Saúde e Vínculo Associativo por Inadimplência'
      : `Assunto: ${motivo}`
    const assuntoLines = doc.splitTextToSize(assunto, 170)
    doc.text(assuntoLines, margin, cursorY)
    cursorY += (assuntoLines.length * 6) + 9

    doc.setFont('helvetica', 'normal')
    doc.text(`Prezada(o) Sr(a). ${assoc.nome},`, margin, cursorY)
    cursorY += 10

    const motivoText = motivo === 'Suspensão Por Inadimplência' ? 'motivo de inadimplência' : motivo.toLowerCase()
    const p1 = `A ACPROBEC, Associação Colaborativa de Profissionais Liberais, Comércio e Setor da Beleza, por meio deste, informa que o plano de saúde vinculado ao Hospital HGU, bem como o vínculo associativo junto à ACPROBEC, encontram-se atualmente suspensos por ${motivoText}.`
    const p1Lines = doc.splitTextToSize(p1, 170)
    doc.text(p1Lines, margin, cursorY)
    cursorY += (p1Lines.length * 6) + 5

    const p2 = `Para regularização e reativação do plano de saúde HGU e do vínculo com a associação, faz-se necessário retornar o nosso contato através do número de telefone administrativo: (87) 9 8125 – 6590, para verificar as pendências financeiras com o HGU e a ACPROBEC.`
    const p2Lines = doc.splitTextToSize(p2, 170)
    doc.text(p2Lines, margin, cursorY)
    cursorY += (p2Lines.length * 6) + 5

    const p3 = `Sem mais para o momento, permanecemos à disposição para quaisquer esclarecimentos.`
    const p3Lines = doc.splitTextToSize(p3, 170)
    doc.text(p3Lines, margin, cursorY)
    cursorY += (p3Lines.length * 6) + 10

    doc.text('Atenciosamente,', margin, cursorY)
    cursorY += 6
    doc.text('ACPROBEC - Associação Colaborativa de Profissionais Liberais, Comércio e Setor da', margin, cursorY)
    cursorY += 6
    doc.text('Beleza', margin, cursorY)

    const fileName = `acprobec - Comunicado de Suspensao - ${assoc.nome} - ${dateStr.replace(/\//g, '.')}.pdf`
    doc.save(fileName)
  }

  const handleConfirmarSuspensao = async (data: any) => {
    if (!selectedGroupDetails?.assoc?.id) return { error: 'Associado não encontrado' }
    
    try {
      const res = await hookAtualizarAssoc(selectedGroupDetails.assoc.id, data)
      if (!res.error) {
        logAction('SUSPENSÃO', `Associado ${selectedGroupDetails.assoc.nome} foi SUSPENSO. Motivo: ${data.suspensao_motivo}.`)
        // Atualiza o objeto local para refletir os novos dados imediatamente
        setSelectedGroupDetails((prev: any) => ({
          ...prev,
          assoc: {
            ...prev.assoc,
            ...data
          }
        }))
      } else {
        alert('Erro ao suspender associado: ' + res.error)
      }
      return res
    } catch (err: any) {
      return { error: err.message }
    }
  }

  const modalFields: Field[] = useMemo(() => [
    { name: 'descricao', label: 'Descrição', type: 'text', required: true },
    { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
    { name: 'data', label: 'Vencimento', type: 'date', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'pago', label: 'Recebido / Pago' }, { value: 'aberto', label: 'Aguardando' }, { value: 'atrasado', label: 'Em Atraso' }] },
    { name: 'conta_id', label: 'Conta', type: 'select', required: true, options: contas.map(c => ({ value: c.id, label: c.nome })) },
    { name: 'categoria', label: 'Categoria', type: 'text', required: true },
    { name: 'forma_pagamento', label: 'Forma de Pagamento', type: 'select', options: [{ value: 'PIX', label: 'PIX' }, { value: 'Boleto', label: 'Boleto' }, { value: 'Dinheiro', label: 'Dinheiro' }] },
    { name: 'status_cobranca', label: 'Status Cobrança', type: 'select', options: [{ value: '', label: 'Nenhum' }, { value: 'EM COBRANÇA', label: 'EM COBRANÇA' }, { value: 'NEGOCIADO', label: 'NEGOCIADO' }] },
  ], [contas])

  const columns = [
    { 
      header: 'Associado / Descrição', 
      key: 'descricao', 
      render: (g: any) => {
        const hasEmCobranca = g.lancamentos.some((l: any) => l.status_cobranca === 'EM COBRANÇA')
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{g.descricao}</span>
              {hasEmCobranca && (
                <span className="text-[9px] font-black bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200 flex items-center gap-1">
                  <AlertTriangle size={8} /> EM COBRANÇA
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{g.meses} {g.meses === 1 ? 'pendência' : 'pendências'}</span>
          </div>
        )
      }
    },
    { 
      header: 'Tempo de Atraso', 
      key: 'diasAtraso', 
      className: 'text-center',
      render: (g: any) => {
        const dias = g.diasAtraso
        const mesesStr = g.meses > 1 ? ` (${g.meses} meses)` : ''
        return (
          <div className="flex flex-col items-center">
            <span className="text-xs font-black text-rose-500">{dias} dias{mesesStr}</span>
          </div>
        )
      }
    },
    { 
      header: 'Valor Original', 
      key: 'totalOriginal', 
      render: (g: any) => <span className="text-sm font-bold text-slate-500">{fmtR(g.totalOriginal)}</span>
    },
    { 
      header: 'Valor Atualizado', 
      key: 'totalAtualizado', 
      render: (g: any) => <span className="text-sm font-black text-red-600">{fmtR(g.totalAtualizado)}</span>
    },
    { 
      header: 'Cobrança', 
      key: 'status_cobranca', 
      render: (g: any) => {
        const hasEmCobranca = g.lancamentos.some((l: any) => l.status_cobranca === 'EM COBRANÇA')
        const firstStatus = g.lancamentos.find((l: any) => l.status_cobranca)?.status_cobranca
        const displayStatus = hasEmCobranca ? 'EM COBRANÇA' : firstStatus

        return displayStatus ? (
          <span className={`status-badge ${statusCobrancaClass(displayStatus)}`}>
            {displayStatus}
          </span>
        ) : <span className="text-[10px] text-slate-300 italic">Pendente</span>
      }
    },
    { 
      header: 'Régua Cobrança', 
      key: 'regua_cobranca', 
      render: (g: any) => g.assoc ? <CobrancaStatusCell associadoId={g.assoc.id} /> : null
    },
    { 
      header: '', key: 'acoes', className: 'w-24 text-right', 
      render: (g: any) => {
        return (
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {g.assoc && (editar || criar || isAdmin) && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleCobrar(g.assoc, g.lancamentos) }} 
                title="Acionar Cobrança" 
                className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <MessageCircle size={14} />
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedGroupDetails(g); setIsGroupModalOpen(true); }} 
              title="Ver Detalhes" 
              className="px-2 py-1.5 text-[10px] font-black uppercase text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Detalhes
            </button>
          </div>
        )
      }
    },
  ]

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Vencido', value: fmtR(totalDevido), sub: `${lancamentosAtrasados.length} lançamentos pendentes`, icon: ShieldAlert, color: 'var(--red)' },
          { label: 'Indíce Geral', value: fmtPct(pctInadimpTotal), sub: 'da carteira de associados', icon: TrendingDown, color: 'var(--orange)' },
          { label: 'Ticket Médio', value: fmtR(ticketMedioAtraso), sub: 'por inadimplente', icon: Users, color: 'var(--text2)' },
          { label: 'Críticos (3+ Meses)', value: curva[3], sub: 'casos de alta inadimplência', icon: AlertTriangle, color: 'var(--red)' },
        ].map(k => (
          <div key={k.label} className="kpi-card bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm relative group transition-all hover:shadow-md hover:border-red-100">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight" style={{ color: k.color }}>{k.value}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">{k.sub}</p>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.05] group-hover:scale-110 group-hover:opacity-[0.1] transition-all duration-500">
               <k.icon size={40} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Gráfico e Alerta ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ChartCard title="Curva de Atraso" subtitle="Distribuição por meses vencidos">
            <div className="flex-1 w-[calc(100%+48px)] mx-[-24px] mb-[-24px] h-[340px]">
              <Doughnut 
                data={{
                  labels: ['1 Mês', '2 Meses', '3 Meses', '3+ Meses'],
                  datasets: [{
                    data: curva,
                    backgroundColor: ['#fcd34d', '#fb923c', '#ef4444', '#991b1b'],
                    borderWidth: 0,
                    hoverOffset: 20
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  layout: {
                    padding: {
                      top: 10,
                      bottom: 30,
                      left: 30,
                      right: 30
                    }
                  },
                  plugins: {
                    legend: { 
                      position: 'bottom', 
                      labels: { 
                        boxWidth: 8, 
                        font: { size: 9, weight: 'bold' as const }, 
                        padding: 15 
                      } 
                    }
                  },
                  cutout: '65%'
                }}
              />
            </div>
          </ChartCard>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 h-full flex flex-col">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[2px] mb-6 flex items-center gap-2">
               <ShieldAlert size={18} className="text-red-500" /> Associados em Situação Crítica
            </h4>
            <div className="flex-1 space-y-4">
               {mappedInadimplentes.slice(0, 3).map((item, idx) => (
                 <div key={item.assoc?.id || idx} className="flex items-center justify-between p-5 bg-red-50/20 rounded-2xl border border-red-100/30 hover:bg-red-50/40 transition-colors">
                    <div className="flex items-center gap-5">
                       <div className="w-8 h-8 rounded-full bg-red-100/50 flex items-center justify-center font-black text-red-600 text-[10px]">#{idx+1}</div>
                       <div>
                          <p className="text-sm font-black text-slate-900">{item.assoc?.nome || 'Associado não identificado'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.meses} meses em atraso</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-base font-black text-red-600">{fmtR(item.totalAtualizado || item.totalOriginal)}</p>
                       <button 
                         onClick={() => handleCobrar(item.assoc, item.lancamentos)}
                         className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors mt-1"
                       >
                         Acionar Cobrança
                       </button>
                    </div>
                 </div>
               ))}
               {mappedInadimplentes.length === 0 && (
                 <div className="flex-1 flex items-center justify-center text-slate-300 italic text-sm">
                    Nenhum inadimplente encontrado. Parabéns!
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lançamentos em Atraso</h4>
                <button 
                  onClick={handleExportarExcel}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                >
                  <Download size={12} />
                  Exportar Excel
                </button>
                {(excluir || isAdmin) && (
                  <button 
                    onClick={handleCleanupDuplicates}
                    disabled={isCleaning || lancamentosAtrasados.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all disabled:opacity-50"
                  >
                    {isCleaning ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Limpar Duplicados (Inadimplência)
                  </button>
                )}
                <button onClick={() => setIsLogModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                  <History size={12} /> Auditoria de Ações
                </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select 
                  className="bg-slate-50 border-none px-4 py-3 rounded-2xl text-[11px] font-bold text-slate-600 outline-none hover:ring-2 hover:ring-red-500/10 transition-all"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(Number(e.target.value))}
                >
                  <option value={-1}>Todos Meses</option>
                  {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>

                <select 
                  className="bg-slate-50 border-none px-4 py-3 rounded-2xl text-[11px] font-bold text-slate-600 outline-none hover:ring-2 hover:ring-red-500/10 transition-all"
                  value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                >
                  <option value={-1}>Todos Anos</option>
                  {[2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select 
                  className="bg-slate-50 border-none px-4 py-3 rounded-2xl text-[11px] font-bold text-slate-600 outline-none hover:ring-2 hover:ring-red-500/10 transition-all"
                  value={filterMesesAtraso}
                  onChange={(e) => setFilterMesesAtraso(e.target.value)}
                >
                  <option value="ALL">Tempo de Atraso</option>
                  <option value="1">1 Mês</option>
                  <option value="2">2 Meses</option>
                  <option value="3">3 Meses</option>
                  <option value="3+">3+ Meses</option>
                </select>

                <select 
                  className="bg-slate-50 border-none px-4 py-3 rounded-2xl text-[11px] font-bold text-slate-600 outline-none hover:ring-2 hover:ring-red-500/10 transition-all"
                  value={filterStatusCobranca}
                  onChange={(e) => setFilterStatusCobranca(e.target.value)}
                >
                  <option value="ALL">Status Cobrança</option>
                  <option value="EM COBRANÇA">Em Cobrança</option>
                  <option value="NEGOCIADO">Negociado</option>
                  <option value="PENDENTE">Pendente</option>
                </select>

                <select 
                  className="bg-slate-50 border-none px-4 py-3 rounded-2xl text-[11px] font-bold text-slate-600 outline-none hover:ring-2 hover:ring-red-500/10 transition-all"
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                >
                  <option value="ALL">Pagamento</option>
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>

                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar associado ou descrição..." 
                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-xs outline-none focus:ring-4 ring-red-500/5 transition-all font-bold text-slate-700"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>
        <DataTable 
          columns={columns} 
          data={mappedInadimplentes} 
          loading={loading} 
          onRowClick={(g) => { setSelectedGroupDetails(g); setIsGroupModalOpen(true); }}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
        />
      </div>

      <CrudModal 
        isOpen={isModalOpen} 
        onClose={() => { setEditingItem(null); setIsModalOpen(false) }} 
        title={editingItem?.id ? 'Editar Lançamento' : 'Novo Lançamento'} 
        initialData={editingItem} 
        onSubmit={handleSalvar} 
        fields={modalFields} 
      />
      
      <BatchActionBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onDelete={(excluir || isAdmin) ? () => setIsConfirmDeleteOpen(true) : undefined}
        onUpdate={(editar || isAdmin) ? handleBulkUpdate : undefined}
        onInvertType={(editar || isAdmin) ? handleInvertTypeBulk : undefined}
        onMarkCobranca={(editar || isAdmin) ? () => handleBulkUpdate({ status_cobranca: 'EM COBRANÇA' }) : undefined}
        onAbonar={(editar || isAdmin) ? () => setIsAbonoModalOpen(true) : undefined}
        categories={categorias}
      />

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Excluir Lançamentos Selecionados"
        message={`Você está prestes a excluir ${selectedIds.length} lançamentos. Esta ação não pode ser desfeita. Deseja continuar?`}
      />

      <AbonoLancamentoModal
        isOpen={isAbonoModalOpen}
        onClose={() => setIsAbonoModalOpen(false)}
        lancamentoCount={selectedIds.flatMap(id => mappedInadimplentes.find(g => g.id === id)?.lancamentos.map(l => l.id) || []).length}
        onConfirm={handleBulkAbonar}
      />

      <InadimplenciaLogModal 
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        logs={logs}
        loading={loadingLogs}
        onFilter={fetchLogs}
      />

      {/* Modal Detalhamento de Grupo */}
      {isGroupModalOpen && selectedGroupDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Detalhes de Atraso</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {selectedGroupDetails.descricao} — {selectedGroupDetails.meses} pendências
                </p>
              </div>
              <button 
                onClick={() => setIsGroupModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-4">
                {[...selectedGroupDetails.lancamentos]
                  .sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())
                  .map((i: any) => (
                  <div key={i.id} className="p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white hover:border-blue-200 hover:shadow-sm transition-all group">
                    <div className="flex flex-col gap-1 min-w-[200px]">
                      <span className="text-xs font-bold text-slate-700">{i.descricao}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {i.categoria} — Ref: {fmtData(i.data)}
                      </span>
                    </div>

                    <div className="flex flex-col">
                       <span className="text-sm font-black text-red-600">{fmtR(i.valor)}</span>
                       <StatusBadge status={i.status} type="lancamento" />
                    </div>

                    <div className="flex flex-col">
                       <PaymentBadge method={i.forma_pagamento} />
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => { setIsGroupModalOpen(false); handleCobrar(selectedGroupDetails.assoc, [i]); }} title="Acionar Cobrança (este item)" className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors">
                        <MessageCircle size={16} />
                      </button>
                      <button onClick={() => { setIsGroupModalOpen(false); handleMarcarPago(i); }} title="Marcar como Pago" className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors">
                        <CheckCircle2 size={16} />
                      </button>
                      <button onClick={() => { setIsGroupModalOpen(false); handleEdit(i); }} title="Editar Lançamento" className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => { setIsGroupModalOpen(false); handleDelete(i); }} title="Excluir" className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-6">
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Original</p>
                   <p className="text-lg font-black text-slate-600">{fmtR(selectedGroupDetails.totalOriginal)}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Total Atualizado</p>
                   <p className="text-xl font-black text-red-600">{fmtR(selectedGroupDetails.totalAtualizado)}</p>
                 </div>
               </div>
               
               {selectedGroupDetails.assoc && (
                 <div className="flex items-center gap-3">
                   {selectedGroupDetails.assoc.suspensao_data && (
                     <div className="flex flex-col items-end mr-2">
                       <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Suspenso em</span>
                       <span className="text-xs font-bold text-red-600">{fmtData(selectedGroupDetails.assoc.suspensao_data)}</span>
                     </div>
                   )}
                   {selectedGroupDetails.assoc.suspensao_data && (
                     <button
                       onClick={() => gerarComunicado(selectedGroupDetails.assoc)}
                       className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all shadow-sm"
                       title="Gerar Comunicado de Suspensão em PDF"
                     >
                       <ScrollText size={16} /> Comunicado
                     </button>
                   )}
                   {selectedGroupDetails.assoc.suspensao_arquivo_url && (
                     <a 
                       href={selectedGroupDetails.assoc.suspensao_arquivo_url}
                       target="_blank"
                       rel="noreferrer"
                       className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm"
                       title="Abrir o arquivo enviado pelo associado"
                     >
                       <FileText size={16} /> Ver Termo PDF
                     </a>
                   )}
                   <button 
                     onClick={() => setIsSuspensaoModalOpen(true)}
                     disabled={selectedGroupDetails.diasAtraso < 90 || selectedGroupDetails.assoc.status === 'suspenso' || !!selectedGroupDetails.assoc.suspensao_data}
                     className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     <ShieldAlert size={16} /> Suspensão
                   </button>
                   <button 
                     onClick={() => handleCobrar(selectedGroupDetails.assoc, selectedGroupDetails.lancamentos)}
                     className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-md"
                   >
                     <MessageCircle size={16} /> Acionar Cobrança
                   </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
      
      <SuspensaoModal 
        isOpen={isSuspensaoModalOpen}
        onClose={() => setIsSuspensaoModalOpen(false)}
        associado={selectedGroupDetails?.assoc}
        onConfirm={handleConfirmarSuspensao}
      />

      <CobrancaDrawer 
        associadoId={selectedAssociadoCobranca?.id || null}
        associadoNome={selectedAssociadoCobranca?.nome || ''}
        lancamentosIds={checkedLancs}
        isOpen={cobrancaDrawerOpen}
        onClose={() => setCobrancaDrawerOpen(false)}
      />

      {isSeletorMesesOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-sm font-black text-slate-800">O que deseja cobrar?</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Selecione os meses/vencimentos que serão incluídos na mensagem de cobrança.
              </p>
            </div>
            
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {lancsParaCobrar.sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime()).map(l => {
                const venc = new Date(l.data).toLocaleDateString('pt-BR')
                return (
                  <label key={l.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 cursor-pointer transition-all">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                      checked={checkedLancs.includes(l.id)}
                      onChange={(e) => {
                        if (e.target.checked) setCheckedLancs(prev => [...prev, l.id])
                        else setCheckedLancs(prev => prev.filter(id => id !== l.id))
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-700">{fmtR(l.valor)}</span>
                      <span className="text-[10px] font-bold text-slate-400">Vencimento: {venc}</span>
                    </div>
                  </label>
                )
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setIsSeletorMesesOpen(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-500 font-black text-[10px] uppercase rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setIsSeletorMesesOpen(false)
                  setCobrancaDrawerOpen(true)
                }}
                disabled={checkedLancs.length === 0}
                className="flex-1 py-3 bg-emerald-600 text-white font-black text-[10px] uppercase rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
