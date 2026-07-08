'use client'
import React, { useMemo, useState, Suspense, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
  LineElement, PointElement,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import BatchActionBarAssociados from '@/components/ui/BatchActionBarAssociados'
import CrudModal from '@/components/ui/CrudModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ChartCard from '@/components/ui/ChartCard'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { fmtR, MESES } from '@/lib/utils/formatters'
import { Plus, Mail, Phone, Copy, Trash2, CheckSquare, RefreshCw, Pencil, XCircle, Search, FileText, Loader2, ChevronDown, ChevronUp, Maximize2, X, TrendingUp, PieChart, Download, Zap, UserMinus, Gift } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useWhatsAppTemplates } from '@/lib/hooks/useWhatsAppTemplates'
import { useTenant } from '@/lib/hooks/useTenant'
import { DEFAULT_MSG_HGU } from '@/features/configuracoes/components/MensagensWhatsappTab'
import { fetchZapSignSignedFileAction } from '@/app/actions/zapsign'
import { fixAssociadosRecorrenciaColumnsAction, fixMonthlyFeeDescriptionsAction, fixVencimentoConstraintAction } from '@/app/actions/associados_fix'
import { useContas } from '@/lib/hooks/useContas'
import { useCategorias } from '@/lib/hooks/useCategorias'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import AssociadosLogModal, { AssociadoLogEntry } from './AssociadosLogModal'
import FichaAssociadoModal from './ficha-associado/FichaAssociadoModal'
import CancelamentoModal from './CancelamentoModal'
import PreviewAdesoesModal from './PreviewAdesoesModal'
import PreviewMensalidadesModal from './PreviewMensalidadesModal'
import { insertLoteLancamentosAction } from '@/app/actions/zapsign'
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, LineElement, PointElement)

export default function AssociadosTab() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Carregando Módulo de Associados...</div>}>
      <AssociadosContent />
    </Suspense>
  )
}

function AssociadosContent() {
  const { criar, editar, excluir, isAdmin } = usePermissions('socios')
  const chartRef = useRef<any>(null)
  const searchParams = useSearchParams()
  const { associados, loading, isSyncing, inserir, atualizar, remover, atualizarBulk, syncZapSign, previewAdesoesFinanceiras, refresh } = useAssociados()
  const { lancamentos, inserirBulk, atualizar: atualizarFinanceiro, atualizarBulk: atualizarBulkFinanceiro, removerBulk: removerFinanceiroBulk } = useFinanceiro()
  const { templates } = useWhatsAppTemplates()
  const { tenant } = useTenant()
  const { contas } = useContas()
  const { categorias: categoriasContabeis } = useCategorias()
  const { currentUser } = useCurrentUser()
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchQ, setSearchQ] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Estados para a Ficha do Associado
  const [isFichaOpen, setIsFichaOpen] = useState(false)
  const [selectedFichaId, setSelectedFichaId] = useState<string | null>(null)

  // Estados para Confirmação de Vencimento e Logs
  const [vencimentoConfirm, setVencimentoConfirm] = useState<{ isOpen: boolean, data: any, toUpdate: any[] }>({ isOpen: false, data: null, toUpdate: [] })
  
  const [isDeleting, setIsDeleting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterCategoria, setFilterCategoria] = useState<string>('todas')
  const [filterCpfInvalido, setFilterCpfInvalido] = useState(false)
  const [filterCpfPresence, setFilterCpfPresence] = useState<string>('todos')
  const [filterDependentes, setFilterDependentes] = useState<string>('todos')
  const [filterRecorrencia, setFilterRecorrencia] = useState<string>('todos')
  const [filterPlanoSaude, setFilterPlanoSaude] = useState<string>('todos')
  const [filterTermo, setFilterTermo] = useState<string>('todos')
  const [filterAdesao, setFilterAdesao] = useState<string>('todos')
  const [filterAnaliseInteligente, setFilterAnaliseInteligente] = useState<string>('todos')
  const [filterMesesIngresso, setFilterMesesIngresso] = useState<number[]>([])
  const [isMesMenuOpen, setIsMesMenuOpen] = useState(false)
  const [filterAnoIngresso, setFilterAnoIngresso] = useState<string>('todos')
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false)
  const [isBulkAccountModalOpen, setIsBulkAccountModalOpen] = useState(false)
  const [isIndividualSyncModalOpen, setIsIndividualSyncModalOpen] = useState(false)
  const [recurrenceTarget, setRecurrenceTarget] = useState<any>(null)
  const [expandedChart, setExpandedChart] = useState<any>(null)
  const [isBatchRecurrenceModalOpen, setIsBatchRecurrenceModalOpen] = useState(false)
  const [associadosLogs, setAssociadosLogs] = useState<AssociadoLogEntry[]>([])
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [logModalTitle, setLogModalTitle] = useState('Relatório de Auditoria')
  
  // Preview Adesões Modal
  const [isPreviewAdesoesOpen, setIsPreviewAdesoesOpen] = useState(false)
  const [previewAdesoesData, setPreviewAdesoesData] = useState<any[]>([])

  const [isPreviewMensalidadesOpen, setIsPreviewMensalidadesOpen] = useState(false)
  const [previewMensalidadesData, setPreviewMensalidadesData] = useState<any[]>([])

  const [showFilters, setShowFilters] = useState(false)

  const [isFixingDescriptions, setIsFixingDescriptions] = useState(false)
  const [cancelamentoItem, setCancelamentoItem] = useState<any>(null)
  
  // Estados para Abono
  const [abonoItem, setAbonoItem] = useState<any>(null)
  
  // Estados para Importação HGU
  const hguFileInputRef = useRef<HTMLInputElement>(null)
  const [isHguModalOpen, setIsHguModalOpen] = useState(false)
  const [hguPreview, setHguPreview] = useState<any[]>([])
  const [isImportingHgu, setIsImportingHgu] = useState(false)
  const [hguModalTab, setHguModalTab] = useState<'encontrados' | 'nao_encontrados'>('encontrados')


  // Capturar busca via URL
  React.useEffect(() => {
    const s = searchParams.get('search')
    if (s) setSearchQ(s)

    const termo = searchParams.get('filterTermo')
    if (termo) setFilterTermo(termo)
    
    const status = searchParams.get('status')
    if (status) setFilterStatus(status)
  }, [searchParams])

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedRows(next)
  }
  
  const normalizeStr = (str: string) => {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
  }

  const handleHguFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws) as any[]

        const groups: Record<string, any[]> = {}
        data.forEach(row => {
          const codigo = row['Código'] || row['Codigo'] || row['CÓDIGO'] || ''
          if (!codigo) return
          const parts = codigo.split('-')
          const prefix = parts[0]
          if (!groups[prefix]) groups[prefix] = []
          groups[prefix].push(row)
        })

        const preview: any[] = []

        Object.keys(groups).forEach(prefix => {
          const group = groups[prefix]
          const titular = group.find(r => (r['Código'] || '').endsWith('-00'))
          const dependentesList = group.filter(r => !(r['Código'] || '').endsWith('-00'))

          if (!titular) return 

          const nomeTitular = normalizeStr(titular['Nome'] || '')

          const rawCodigo = titular['Código'] || titular['Codigo'] || titular['CÓDIGO'] || ''
          const titularCodigo = String(rawCodigo).trim()

          const match = associados.find((a: any) => {
            // 1º - Código HGU exato (mais confiável, prioridade máxima)
            if (a.codigo_hgu && String(a.codigo_hgu).trim() === titularCodigo) return true
            // 2º - Nome completo exato: todos os tokens do HGU devem bater bidirecionalmente
            // NÃO usamos email ou telefone pois familiares compartilham os mesmos dados de contato
            if (nomeTitular && nomeTitular.length > 3 && a.nome) {
              const tokensHgu = nomeTitular.split(/\s+/).filter(Boolean)
              const nomeAssoc = normalizeStr(a.nome)
              const tokensAssoc = nomeAssoc.split(/\s+/).filter(Boolean)
              const allMatch = tokensHgu.every((t: string) => tokensAssoc.includes(t)) && tokensAssoc.every((t: string) => tokensHgu.includes(t))
              if (allMatch) return true
            }
            return false
          })

          const formatDate = (val: any) => {
            if (typeof val === 'number') {
              const excelDate = new Date(Math.round((val - 25569) * 86400 * 1000))
              return excelDate.toISOString().split('T')[0]
            }
            if (val && typeof val === 'string' && val.includes('/')) {
              const parts = val.split('/')
              if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`
            }
            return val
          }

          const dependentesFormatados = dependentesList.map(d => ({
            nome: d['Nome'],
            data_nascimento: formatDate(d['Data de nascimento']),
            codigo_hgu: d['Código'],
            data_inclusao: formatDate(d['Data de inclusão'])
          }))

          let dataInc = formatDate(titular['Data de inclusão'])

          let jaSincronizado = false
          if (match && String(match.codigo_hgu || '').trim() === titularCodigo) {
             const numDepsDb = Array.isArray(match.dependentes) ? match.dependentes.length : 0
             if (numDepsDb === dependentesFormatados.length) {
               jaSincronizado = true
             }
          }
          
          if (jaSincronizado) return

          const getVal = (row: any, possibleKeys: string[]) => {
            const key = Object.keys(row).find(k => possibleKeys.some(p => k.toLowerCase().includes(p.toLowerCase())))
            return key ? row[key] : '--'
          }

          preview.push({
            hgu_codigo: titularCodigo,
            hgu_nome: titular['Nome'],
            hgu_email: getVal(titular, ['email', 'e-mail']),
            hgu_telefone: getVal(titular, ['telefone', 'celular', 'contato', 'whatsapp']),
            hgu_data_inclusao: dataInc,
            dependentes: dependentesFormatados,
            matched_associado: match || null
          })
        })

        setHguPreview(preview)
        setIsHguModalOpen(true)
      } catch (err) {
        alert('Erro ao ler a planilha: ' + err)
      } finally {
        if (hguFileInputRef.current) hguFileInputRef.current.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleConfirmHguImport = async () => {
    setIsImportingHgu(true)
    try {
      const updates = hguPreview.filter(p => p.matched_associado).map(p => ({
        id: p.matched_associado.id,
        codigo_hgu: p.hgu_codigo,
        plano_saude: 'Ativo',
        data_inclusao_plano: p.hgu_data_inclusao || null,
        dependentes: p.dependentes
      }))

      if (updates.length === 0) {
        alert('Nenhum associado correspondente para atualizar.')
        setIsHguModalOpen(false)
        return
      }

      const promises = updates.map(u => {
        const { id, ...data } = u
        return atualizar(id, data as any)
      })

      const results = await Promise.all(promises)
      const errs = results.filter(r => r.error)
      
      if (errs.length > 0) {
        console.error('Erros HGU import:', errs)
        alert(`Ocorreram erros na atualização. Detalhes: ${errs[0].error?.message || JSON.stringify(errs[0].error)}`)
      } else {
        alert(`Importação concluída! ${updates.length} associados atualizados.`)
        setIsHguModalOpen(false)
        refresh()
      }
    } catch (err) {
      console.error('Erro HGU import catch:', err)
      alert('Erro ao atualizar dados: ' + err)
    } finally {
      setIsImportingHgu(false)
    }
  }

  const downloadNaoEncontradosPDF = () => {
    const naoEncontrados = hguPreview.filter(p => !p.matched_associado)
    if (naoEncontrados.length === 0) {
      alert('Nenhum associado não encontrado para exportar.')
      return
    }

    const doc = new jsPDF('landscape')
    
    doc.setFontSize(18)
    doc.text('Relatório HGU - Não Encontrados', 14, 22)
    
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Total: ${naoEncontrados.length} registros`, 14, 30)

    const tableData = naoEncontrados.map(item => [
      item.hgu_nome,
      item.hgu_codigo || '--',
      item.hgu_telefone || '--',
      item.hgu_email || '--',
      item.dependentes && item.dependentes.length > 0 
        ? item.dependentes.map((d: any) => `${d.nome} (${d.codigo_hgu})`).join('\n')
        : 'Nenhum'
    ])

    autoTable(doc, {
      startY: 35,
      head: [['Nome (Planilha)', 'Código HGU', 'Contato', 'E-mail', 'Dependentes']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30 },
        2: { cellWidth: 35 },
        3: { cellWidth: 60 },
        4: { cellWidth: 'auto' }
      }
    })

    doc.save('hgu_nao_encontrados.pdf')
  }

  const downloadNaoEncontradosExcel = () => {
    const naoEncontrados = hguPreview.filter(p => !p.matched_associado)
    if (naoEncontrados.length === 0) {
      alert('Nenhum associado não encontrado para exportar.')
      return
    }

    const data = naoEncontrados.map(item => ({
      'Nome (Planilha)': item.hgu_nome,
      'Código HGU': item.hgu_codigo || '--',
      'Contato': item.hgu_telefone || '--',
      'E-mail': item.hgu_email || '--',
      'Dependentes': item.dependentes && item.dependentes.length > 0 
        ? item.dependentes.map((d: any) => `${d.nome} (${d.codigo_hgu})`).join(' | ')
        : 'Nenhum'
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Auto-size columns
    const maxWidths = [40, 20, 20, 35, 60]
    worksheet['!cols'] = maxWidths.map(w => ({ wch: w }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Não Encontrados')
    XLSX.writeFile(workbook, 'hgu_nao_encontrados.xlsx')
  }

  const handleManualLink = (index: number, associadoId: string) => {
    const assoc = associados.find((a: any) => a.id === associadoId)
    if (!assoc) return
    const next = [...hguPreview]
    next[index].matched_associado = assoc
    setHguPreview(next)
    setHguModalTab('encontrados')
  }

  const handleHguWhatsappClick = (associado: any) => {
    if (!associado.telefone) {
      alert('Associado não possui telefone cadastrado no sistema para enviar mensagem.')
      return
    }

    let phone = associado.telefone.replace(/\D/g, '')
    if (!phone.startsWith('55')) {
      phone = '55' + phone
    }

    let depsText = 'Não possui dependentes!'
    if (Array.isArray(associado.dependentes) && associado.dependentes.length > 0) {
      depsText = associado.dependentes.map((d: any) => `${d.nome} - ${d.codigo_hgu || 'Sem código'}`).join('\n')
    }

    const msg = `Olá, ${associado.nome}. Tudo bem? 

Passando para informar que seu plano HGU SAÚDE já está ativo via ACPROBEC.

TITULAR/RESPONSÁVEL: ${associado.nome}
CÓDIGO MATRÍCULA PLANO HGU: ${associado.codigo_hgu || 'Sem código'}

DEPENDENTES REGISTRADOS:
${depsText}

*O HGU não está mais emitindo carteirinha física no momento. Salve este código para informar quando for utilizar os serviços do plano.

Toda e qualquer dúvida relacionada ao plano HGU, devem ser tratadas diretamente nos contatos abaixo:

📞 Contatos HGU Saúde

MARCAÇÃO DENTRO DAS INSTALAÇÕES HGU: (87) 3866-8282
OUVIDORIA HGU: (87) 3866-8259
OPERADORA HGU: (87) 3866-8250
WHATSAPP DA OPERADORA: 873866-8251
HGU HOSPITAL: (87) 3866-8751
---------

GUIA MÉDICO REDE CREDENCIADA

👨⚕️Acesse os locais de atendimento e especialistas da rede credenciada HGU Saúde através do link abaixo:
https://www.acprobec.com.br/#rede-hgu

Att;
Diretoria / Secretaria ACPROBEC`

    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const toggleHguInformado = async (id: string, value: boolean) => {
    try {
      const { error } = await atualizar(id, { hgu_informado: value } as any)
      if (error) throw error
    } catch (err: any) {
      alert('Erro ao atualizar status. Você precisa rodar o comando SQL no banco de dados para criar a coluna "hgu_informado". Detalhes: ' + err?.message)
    }
  }

  const handleSyncZapSign = async () => {
    await fixVencimentoConstraintAction()
    await fixAssociadosRecorrenciaColumnsAction()
    const res = await syncZapSign()
    if (res.error) {
      const msg = typeof res.error === 'object' ? (res.error as any).message : res.error
      alert(`Erro na sincronização: ${msg}`)
    } else {
      if (res.logs) {
        setAssociadosLogs(res.logs)
        setLogModalTitle('Sincronização ZapSign')
        setIsLogModalOpen(true)
      } else {
        alert(res.message || `Sucesso! ${res.count || 0} registros processados.`)
      }
    }
  }

  
  const handleGerarMensalidades = async () => {
    const associadosAlvo = associados.filter((a: any) => {
      if (a.status === 'inativo') return false;
      const assocLancs = lancamentos.filter(l => l.associado_id === a.id);
      const temAdesao = assocLancs.some(l => (l.categoria || '').toUpperCase().includes('ADESÃO') || (l.descricao || '').toUpperCase().includes('ADESÃO'));
      const temMensalidade = assocLancs.some(l => (l.categoria || '').toUpperCase().includes('MENSALIDADE') || (l.descricao || '').toUpperCase().includes('MENSALIDADE'));
      return temAdesao && !temMensalidade;
    });

    if (associadosAlvo.length === 0) {
      setPreviewMensalidadesData([]);
      setIsPreviewMensalidadesOpen(true);
      return;
    }

    const hoje = new Date();
    const dataAtual = hoje.toISOString().split('T')[0];
    const preview = associadosAlvo.map((a: any) => {
      const contaPadrao = contas?.find((c: any) => c.padrao) || contas?.[0];
      return {
        tenant_id: a.tenant_id,
        associado_id: a.id,
        tipo: 'receita',
        categoria: 'MENSALIDADE',
        descricao: `RECEB. DE MENSALIDADE - ${a.nome.toUpperCase()} [FIXO]`,
        valor: a.plano_valor || 35.0,
        data: dataAtual,
        status: 'aberto',
        conta_id: contaPadrao?.id || null,
        forma_pagamento: 'Boleto'
      };
    });

    setPreviewMensalidadesData(preview);
    setIsPreviewMensalidadesOpen(true);
  }

  const handleConfirmGerarMensalidades = async (selected: any[]) => {
    const res = await insertLoteLancamentosAction(selected)
    if (res.error) {
      alert(`Erro: ${res.error}`)
    } else {
      alert(`${res.count} mensalidades lançadas com sucesso.`)
      setIsPreviewMensalidadesOpen(false)
      refresh()
    }
  }

  const handleGerarAdesoes = async () => {
    const res = await previewAdesoesFinanceiras()
    if (res.error) {
      alert(`Erro: ${res.error}`)
    } else {
      setPreviewAdesoesData(res.preview || [])
      setIsPreviewAdesoesOpen(true)
    }
  }

  const handleConfirmGerarAdesoes = async (selected: any[]) => {
    const res = await insertLoteLancamentosAction(selected)
    if (res.error) {
      alert(`Erro: ${res.error}`)
    } else {
      alert(`${res.count} adesões lançadas com sucesso.`)
      setIsPreviewAdesoesOpen(false)
      refresh()
    }
  }

  const handleFixDescriptions = async () => {
    if (!tenant?.id) return alert('Identificação da conta não encontrada.')
    if (!confirm('Deseja corrigir as descrições das mensalidades para o novo padrão? Isso afetará apenas os registros que possuem o mês/ano na descrição.')) return
    setIsFixingDescriptions(true)
    try {
      await fixVencimentoConstraintAction()
      const res = await fixMonthlyFeeDescriptionsAction(tenant.id)
      alert(res.message || res.error)
      if (!res.error) refresh()
    } finally {
      setIsFixingDescriptions(false)
    }
  }

  const handleConfirmAbono = async (data: any) => {
    if (!abonoItem) return
    setIsUpdatingBulk(true)
    try {
      // 1. Atualizar Associado
      const resAssoc = await atualizar(abonoItem.id, {
        status: 'abonado',
        abono_motivo: data.abono_motivo,
        abono_usuario: currentUser?.nome || currentUser?.email || 'Sistema'
      } as any)
      
      if (resAssoc.error) throw new Error(typeof resAssoc.error === 'string' ? resAssoc.error : (resAssoc.error as any).message)
      
      // 2. Localizar Lançamentos Pendentes/Atrasados
      const toDelete = lancamentos.filter((l: any) => 
        l.associado_id === abonoItem.id && 
        (l.status === 'aberto' || l.status === 'atrasado')
      ).map(l => l.id)
      
      // 3. Deletar Lançamentos
      if (toDelete.length > 0) {
        const resDel = await removerFinanceiroBulk(toDelete)
        if (resDel?.error) throw new Error(resDel.error)
      }
      
      setAssociadosLogs([{
        data: new Date().toISOString().split('T')[0],
        descricao: 'Abono de Associado',
        associado: abonoItem.nome,
        status: 'sucesso',
        mensagem: `Associado abonado pelo motivo: ${data.abono_motivo}. ${toDelete.length} lançamentos excluídos.`
      }])
      setLogModalTitle(`Auditoria de Abono: ${abonoItem.nome}`)
      setIsLogModalOpen(true)
      refresh()
    } catch (err: any) {
      alert(`Erro ao abonar associado: ${err.message}`)
    } finally {
      setAbonoItem(null)
      setIsUpdatingBulk(false)
    }
  }

  const statusMap = useMemo(() => {
    const m: Record<string, number> = {}
    associados.forEach((a: any) => { 
      const s = a.status ? a.status.toUpperCase() : 'PENDENTE'
      m[s] = (m[s] || 0) + 1 
    })
    return Object.keys(m).length ? m : { 'SEM DADOS': 1 }
  }, [associados])

  const categorias = useMemo(() => [...new Set(associados.map((a: any) => a.categoria || 'Sem categoria'))].sort(), [associados])
  
  const anosIngresso = useMemo(() => {
    const years = new Set<number>()
    associados.forEach((a: any) => {
      if (a.data_assinatura) {
        years.add(new Date(a.data_assinatura + 'T12:00:00Z').getUTCFullYear())
      }
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [associados])
  
  const crescimentoMensal = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const months = Array(12).fill(0)
    
    const baseCount = associados.filter((a: any) => {
      const joinDate = a.data_ingresso || a.created_at
      if (!joinDate) return false
      return new Date(joinDate).getFullYear() < currentYear
    }).length

    associados.forEach((a: any) => {
      const joinDate = a.data_ingresso || a.created_at
      if (!joinDate) return
      const date = new Date(joinDate)
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth()
        months[month]++
      }
    })

    let runningTotal = baseCount
    return months.map(count => {
      runningTotal += count
      return runningTotal
    })
  }, [associados])

  const chartConfigs = useMemo(() => ({
    crescimento: {
      id: 'crescimento',
      title: 'Crescimento de Associados',
      subtitle: 'Evolução acumulativa da carteira',
      icon: <TrendingUp size={16} />,
      chartType: 'line',
      chartData: {
        labels: MESES,
        datasets: [{
          label: 'Total de Associados',
          data: crescimentoMensal,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#10b981',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      tableData: {
        headers: ['Mês', 'Associados Ativos (Acumulado)', 'Crescimento Mensal'],
        rows: MESES.map((m, i) => {
          const prev = i === 0 ? (crescimentoMensal[0] - (crescimentoMensal[1]-crescimentoMensal[0])) : crescimentoMensal[i-1]
          const diff = crescimentoMensal[i] - prev
          return [m, crescimentoMensal[i], `+${diff}`]
        })
      }
    },
    status: {
      id: 'status',
      title: 'Mix da Carteira',
      subtitle: 'Distribuição por status',
      icon: <PieChart size={16} />,
      chartType: 'doughnut',
      chartData: {
        labels: Object.keys(statusMap).map(k => `${k.toUpperCase()} (${(statusMap as any)[k]})`),
        datasets: [{
          data: Object.values(statusMap),
          backgroundColor: Object.keys(statusMap).map(k => {
            const s = k.toUpperCase().trim()
            if (s === 'ATIVO') return '#10b981'
            if (s === 'PENDENTE') return '#f59e0b'
            if (s === 'INADIMPLENTE') return '#ef4444'
            if (s === 'INATIVO') return '#94a3b8'
            if (s === 'SUSPENSO') return '#cbd5e1'
            return '#cbd5e1'
          }),
          borderWidth: 0
        }]
      },
      tableData: {
        headers: ['Status', 'Total', 'Representação'],
        rows: Object.keys(statusMap).map(k => {
          const total = Object.values(statusMap).reduce((a: any, b: any) => a + b, 0)
          const pct = ((statusMap[k] / (total || 1)) * 100).toFixed(1) + '%'
          return [k, statusMap[k], pct]
        })
      }
    }
  }), [crescimentoMensal, statusMap])

  const filtrados = useMemo(() => {
    let res = associados
    if (searchQ) {
      const q = normalizeStr(searchQ)
      res = res.filter((a: any) => 
        normalizeStr(a.nome).includes(q) || 
        (a.cpf || '').includes(q) || 
        (a.email || '').toLowerCase().includes(q) ||
        (a.conta_recorrencia || '').toLowerCase().includes(q) ||
        (a.codigo_hgu || '').toLowerCase().includes(q) ||
        (Array.isArray(a.dependentes) && a.dependentes.some((d: any) => 
          normalizeStr(d.nome || '').includes(q) ||
          (d.codigo_hgu || '').toLowerCase().includes(q)
        )) ||
        (a.recorrencia_ativa ? 'sim' : 'nao').includes(q)
      )
    }
    if (filterStatus !== 'todos') res = res.filter((a: any) => (a.status || '').toLowerCase() === filterStatus)
    if (filterCategoria !== 'todas') res = res.filter((a: any) => (a.categoria || '') === filterCategoria)
    if (filterRecorrencia !== 'todos') res = res.filter((a: any) => filterRecorrencia === 'sim' ? a.recorrencia_ativa : !a.recorrencia_ativa)
    if (filterPlanoSaude !== 'todos') res = res.filter((a: any) => (a.plano_saude || 'Não Possui') === filterPlanoSaude)
    if (filterTermo !== 'todos') res = res.filter((a: any) => (a.termo_status || 'Assinatura Pendente') === filterTermo)
    if (filterCpfPresence === 'com_cpf') res = res.filter((a: any) => !!a.cpf && a.cpf.trim() !== '' && a.cpf !== 'Pendente')
    if (filterCpfPresence === 'sem_cpf') res = res.filter((a: any) => !a.cpf || a.cpf.trim() === '' || a.cpf === 'Pendente')
    if (filterDependentes === 'com') res = res.filter((a: any) => a.dependentes && a.dependentes.length > 0)
    if (filterDependentes === 'sem') res = res.filter((a: any) => !a.dependentes || a.dependentes.length === 0)
    if (filterCpfInvalido) res = res.filter((a: any) => (a.cpf || '').replace(/\D/g, '').length < 11)
    
    if (filterMesesIngresso.length > 0) {
      res = res.filter((a: any) => {
        if (!a.data_assinatura) return false
        const date = new Date(a.data_assinatura + 'T12:00:00Z')
        return filterMesesIngresso.includes(date.getUTCMonth())
      })
    }
    if (filterAnoIngresso !== 'todos') {
      res = res.filter((a: any) => {
        if (!a.data_assinatura) return false
        const date = new Date(a.data_assinatura + 'T12:00:00Z')
        return date.getUTCFullYear() === parseInt(filterAnoIngresso)
      })
    }
    
    if (filterAdesao !== 'todos') {
      res = res.filter((a: any) => {
        const hasAdesaoPaga = lancamentos.some(l => 
          l.associado_id === a.id && 
          l.status === 'pago' && 
          (l.categoria?.toUpperCase().includes('ADESÃO') || l.descricao?.toUpperCase().includes('ADESÃO'))
        )
        return filterAdesao === 'identificada' ? hasAdesaoPaga : !hasAdesaoPaga
      })
    }
    
    if (filterAnaliseInteligente === 'so_adesao') {
      res = res.filter((a: any) => {
        const assocLancs = lancamentos.filter(l => l.associado_id === a.id)
        const temAdesao = assocLancs.some(l => (l.categoria || '').toUpperCase().includes('ADESÃO') || (l.descricao || '').toUpperCase().includes('ADESÃO'))
        const temMensalidade = assocLancs.some(l => (l.categoria || '').toUpperCase().includes('MENSALIDADE') || (l.descricao || '').toUpperCase().includes('MENSALIDADE'))
        return temAdesao && !temMensalidade
      })
    }
    
    return res
  }, [associados, lancamentos, searchQ, filterStatus, filterCategoria, filterRecorrencia, filterPlanoSaude, filterTermo, filterCpfInvalido, filterCpfPresence, filterDependentes, filterAnaliseInteligente, filterMesesIngresso, filterAnoIngresso])

  const hasActiveFilters = filterStatus !== 'todos' || filterCategoria !== 'todas' || filterRecorrencia !== 'todos' || filterPlanoSaude !== 'todos' || filterTermo !== 'todos' || filterAnaliseInteligente !== 'todos' || filterCpfInvalido || filterCpfPresence !== 'todos' || filterDependentes !== 'todos' || searchQ !== '' || filterMesesIngresso.length > 0 || filterAnoIngresso !== 'todos'
  const clearFilters = () => { setFilterStatus('todos'); setFilterCategoria('todas'); setFilterRecorrencia('todos'); setFilterPlanoSaude('todos'); setFilterTermo('todos'); setFilterAnaliseInteligente('todos'); setFilterCpfInvalido(false); setFilterCpfPresence('todos'); setFilterDependentes('todos'); setSearchQ(''); setFilterMesesIngresso([]); setFilterAnoIngresso('todos') }

  const handleSalvar = async (data: any) => {
    if (editingItem) {
      // Se o dia de vencimento mudou, verificar lançamentos abertos
      const novoDia = data.vencimento_dia ? Number(data.vencimento_dia) : null
      const antigoDia = editingItem.vencimento_dia ? Number(editingItem.vencimento_dia) : null

      if (novoDia && novoDia !== antigoDia) {
        const toUpdate = lancamentos.filter((l: any) => 
          l.associado_id === editingItem.id && 
          l.status === 'aberto' &&
          (l.categoria?.toUpperCase().includes('MENSALIDADE') || l.descricao?.toUpperCase().includes('MENSALIDADE'))
        )

        if (toUpdate.length > 0) {
          setVencimentoConfirm({ isOpen: true, data, toUpdate })
          setIsModalOpen(false)
          return
        }
      }
      
      await atualizar(editingItem.id, data)
    } else {
      await inserir({ ...data, status: data.status || 'ativo' })
    }
    setIsModalOpen(false)
  }

  const handleConfirmVencimentoUpdate = async (shouldUpdateFinanceiro: boolean) => {
    const { data, toUpdate } = vencimentoConfirm
    const logs: AssociadoLogEntry[] = []
    
    try {
      // 1. Atualizar Associado
      const resAssoc = await atualizar(editingItem.id, data)
      if (resAssoc.error) throw new Error(typeof resAssoc.error === 'string' ? resAssoc.error : (resAssoc.error as any).message)
      
      logs.push({
        data: new Date().toISOString().split('T')[0],
        descricao: 'Alteração de Vencimento',
        associado: data.nome,
        status: 'sucesso',
        mensagem: `Vencimento alterado para o dia ${Number(data.vencimento_dia)}`
      })

      // 2. Atualizar Financeiro se solicitado
      if (shouldUpdateFinanceiro && toUpdate.length > 0) {
        for (const l of toUpdate) {
          const [y, m] = l.data.split('-')
          const newData = `${y}-${m}-${String(data.vencimento_dia).padStart(2, '0')}`
          const resFin = await atualizarFinanceiro(l.id, { data: newData })
          
          logs.push({
            data: l.data,
            descricao: 'Ajuste de Data Financeira',
            associado: data.nome,
            status: resFin.error ? 'erro' : 'sucesso',
            mensagem: resFin.error ? `Erro ao atualizar: ${resFin.error}` : `Vencimento movido de ${l.data.split('-')[2]} para ${data.vencimento_dia}`
          })
        }
      }
      
      setAssociadosLogs(logs)
      setLogModalTitle(`Auditoria de Vencimento: ${data.nome}`)
      setIsLogModalOpen(true)
    } catch (err: any) {
      alert(`Erro ao processar atualização: ${err.message}`)
    } finally {
      setVencimentoConfirm({ isOpen: false, data: null, toUpdate: [] })
    }
  }
  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDuplicate = (item: any) => { const { id, ...rest } = item; setEditingItem(rest); setIsModalOpen(true) }
  const handleDelete = async (id: string) => { if (confirm('Excluir este associado?')) await remover(id) }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Excluir ${selectedIds.length} associados?`)) return
    setIsDeleting(true)
    try { for (const id of selectedIds) await remover(id); setSelectedIds([]) }
    finally { setIsDeleting(false) }
  }

  const handleBatchUpdateVencimento = async (dia: number) => {
    if (selectedIds.length === 0) return
    if (!confirm(`Alterar vencimento para o dia ${dia} em ${selectedIds.length} associados?`)) return
    
    setIsUpdatingBulk(true)
    try {
      const res = await atualizarBulk(selectedIds, { vencimento_dia: dia })
      if (!res.error) { 
        // Atualizar também os lançamentos provisionados
        for (const assocId of selectedIds) {
          const toUpdate = lancamentos.filter((l: any) => 
            l.associado_id === assocId && 
            l.status === 'aberto' &&
            (l.categoria?.toUpperCase().includes('MENSALIDADE') || l.descricao?.toUpperCase().includes('MENSALIDADE'))
          )
          for (const l of toUpdate) {
            const [y, m] = l.data.split('-')
            const newData = `${y}-${m}-${String(dia).padStart(2, '0')}`
            await atualizarFinanceiro(l.id, { data: newData })
          }
        }
        alert('Associados e lançamentos provisionados atualizados com sucesso!') 
        refresh()
        setSelectedIds([])
      } else {
        alert('Erro ao atualizar vencimento: ' + res.error.message)
      }
    } finally { setIsUpdatingBulk(false) }
  }

  const handleBatchUpdateRecorrencia = async (ativa: boolean) => {
    if (selectedIds.length === 0) return
    setIsUpdatingBulk(true)
    try {
      const res = await atualizarBulk(selectedIds, { recorrencia_ativa: ativa } as any)
      if (!res.error) { 
        alert('Recorrência atualizada em lote!') 
        refresh()
        setSelectedIds([])
      } else {
        alert('Erro ao atualizar recorrência: ' + res.error.message)
      }
    } finally { setIsUpdatingBulk(false) }
  }

  const handleBatchUpdatePlanoSaude = async (status: string) => {
    if (selectedIds.length === 0) return
    setIsUpdatingBulk(true)
    try {
      const res = await atualizarBulk(selectedIds, { plano_saude: status } as any)
      if (!res.error) { 
        alert('Plano de Saúde atualizado em lote!') 
        refresh()
        setSelectedIds([])
      } else {
        alert('Erro ao atualizar plano: ' + res.error.message)
      }
    } finally { setIsUpdatingBulk(false) }
  }

  const handleBatchUpdateTermo = async (status: string) => {
    if (selectedIds.length === 0) return
    setIsUpdatingBulk(true)
    try {
      const res = await atualizarBulk(selectedIds, { termo_status: status } as any)
      if (!res.error) { 
        alert('Status do Termo atualizado em lote!') 
        refresh()
        setSelectedIds([])
      } else {
        alert('Erro ao atualizar termo: ' + res.error.message)
      }
    } finally { setIsUpdatingBulk(false) }
  }

  const handleBatchUpdateStatus = async (status: string) => {
    if (selectedIds.length === 0) return
    setIsUpdatingBulk(true)
    try {
      const res = await atualizarBulk(selectedIds, { status } as any)
      if (!res.error) { 
        alert(`Status alterado para ${status.toUpperCase()} em lote!`) 
        refresh()
        setSelectedIds([])
      } else {
        alert('Erro ao atualizar status: ' + res.error.message)
      }
    } finally { 
      setIsUpdatingBulk(false) 
    }
  }

  const handleBulkEdit = async (data: any) => {
    if (selectedIds.length === 0) return
    setIsUpdatingBulk(true)
    try {
      const res = await atualizarBulk(selectedIds, data)
      if (!res.error) {
        alert('Associados atualizados em lote com sucesso!')
        refresh()
        setSelectedIds([])
      } else {
        alert('Erro ao atualizar associados: ' + res.error.message)
      }
    } finally {
      setIsUpdatingBulk(false)
    }
  }

  const handleBatchUpdateConta = async () => {
    if (selectedIds.length === 0) return
    setIsBulkAccountModalOpen(true)
  }

  const handleConfirmBulkAccount = async (data: { conta_recorrencia: string }) => {
    setIsUpdatingBulk(true)
    try {
      const res = await atualizarBulk(selectedIds, { conta_recorrencia: data.conta_recorrencia } as any)
      if (!res.error) { 
        alert('Conta atualizada em lote!')
        setIsBulkAccountModalOpen(false)
        refresh()
        setSelectedIds([])
      } else {
        alert('Erro ao atualizar conta: ' + res.error.message)
      }
    } finally { 
      setIsUpdatingBulk(false) 
    }
  }

  const handleConfirmBatchRecurrence = async (p: any) => {
    setIsUpdatingBulk(true)
    const allLancs: any[] = []
    const logs: AssociadoLogEntry[] = []
    let skipped = 0
    let processed = 0

    try {
      for (const assocId of selectedIds) {
        const assoc = associados.find((a: any) => a.id === assocId)
        if (!assoc) continue

        const diaBase = p.dia === '0' ? (assoc.vencimento_dia || 10) : Number(p.dia)

        for (let i = 0; i < Number(p.meses); i++) {
          const d = new Date(Number(p.ano_inicio), Number(p.mes_inicio) + i, diaBase)
          const mesAlvo = d.getMonth()
          const anoAlvo = d.getFullYear()

          // Evitar duplicidade
          const jaExiste = lancamentos.some(l =>
            l.associado_id === assoc.id &&
            (l.categoria?.toUpperCase().includes('MENSALIDADE') || l.descricao?.toUpperCase().includes('MENSALIDADE')) &&
            Number(l.competencia_mes) === mesAlvo &&
            Number(l.competencia_ano) === anoAlvo
          )

          if (jaExiste) {
            skipped++
            logs.push({
              data: d.toISOString().split('T')[0],
              descricao: 'Geração de Mensalidade',
              associado: assoc.nome,
              status: 'erro',
              mensagem: `Já existe mensalidade para ${MESES[mesAlvo]}/${anoAlvo}`
            })
            continue
          }

          allLancs.push({
            associado_id: assoc.id,
            descricao: `${p.descricao_padrao.toUpperCase()} - ${assoc.nome.toUpperCase()}`,
            valor: assoc.mensalidade || 50,
            tipo: 'receita',
            categoria: p.categoria || 'Mensalidade',
            status: 'aberto',
            data: `${anoAlvo}-${String(mesAlvo + 1).padStart(2, '0')}-${String(diaBase).padStart(2, '0')}`,
            competencia_mes: mesAlvo,
            competencia_ano: anoAlvo,
            forma_pagamento: p.forma_pagamento,
            conta_id: p.conta_id,
            tenant_id: assoc.tenant_id
          })
          processed++
          logs.push({
            data: d.toISOString().split('T')[0],
            descricao: 'Geração de Mensalidade',
            associado: assoc.nome,
            valor: assoc.mensalidade || 50,
            status: 'sucesso',
            mensagem: `Gerada com sucesso para ${MESES[mesAlvo]}/${anoAlvo}`
          })
        }
      }

      if (allLancs.length > 0) {
        await inserirBulk(allLancs)
      }
      
      setAssociadosLogs(logs)
      setLogModalTitle('Geração em Lote: Mensalidades')
      setIsLogModalOpen(true)
      
      setIsBatchRecurrenceModalOpen(false)
      setSelectedIds([])
    } finally {
      setIsUpdatingBulk(false)
    }
  }

  const handleDownloadTermo = async (item: any) => {
    if (!tenant?.zapsign_token || !item.zapsign_doc_token) return
    setDownloadingDoc(item.id)
    try {
      const res = await fetchZapSignSignedFileAction(tenant.zapsign_token, item.zapsign_doc_token)
      if (res.error) alert(res.error)
      else if (res.url) window.open(res.url, '_blank')
    } finally {
      setDownloadingDoc(null)
    }
  }

  const handlePrintAssociados = () => {
    const chartImage = chartRef.current?.toBase64Image()
    
    const ativos = filtrados.filter((a: any) => (a.status || '').toLowerCase() === 'ativo')
    const pendentes = filtrados.filter((a: any) => ['pendente', 'inadimplente'].includes((a.status || '').toLowerCase()))
    const inativos = filtrados.filter((a: any) => (a.status || '').toLowerCase() === 'inativo')

    const janela = window.open('', '_blank')
    if (!janela) return

    const renderTable = (items: any[], groupTitle: string, color: string) => `
      <div class="summary-title" style="border-left-color: ${color};">${groupTitle} (${items.length})</div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF/CNPJ</th>
            <th>Venc.</th>
            <th>Mensalidade</th>
            <th>Recorrência</th>
            <th>Associado Desde</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(i => `
            <tr>
              <td><span class="font-black uppercase">${i.nome}</span></td>
              <td>${i.cpf || 'Pendente'}</td>
              <td>DIA ${i.vencimento_dia || 10}</td>
              <td class="font-bold">${fmtR(i.mensalidade)}</td>
              <td>
                <span class="font-black uppercase" style="font-size: 7px; color: ${i.recorrencia_ativa ? '#059669' : '#94a3b8'}">
                  ${i.recorrencia_ativa ? 'Ativa' : 'Não'}
                </span>
              </td>
              <td>${i.data_assinatura ? new Date(i.data_assinatura + 'T12:00:00Z').toLocaleDateString('pt-BR') : '--'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    janela.document.write(`
      <html>
        <head>
          <title>Relatório de Associados — ACPROBEC</title>
          <style>
            @page { size: landscape; margin: 1cm; }
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 0; color: #1e293b; background: white; line-height: 1.5; width: 100%; }
            
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
            
            table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            th { background: #f8fafc; color: #475569; text-transform: uppercase; font-size: 8px; font-weight: 900; padding: 14px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
            td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 9px; color: #334155; font-weight: 500; }
            tr:last-child td { border-bottom: none; }
            tr:nth-child(even) { background-color: #fcfdfe; }
            
            .chart-container { text-align: center; margin-bottom: 40px; page-break-inside: avoid; }
            .chart-img { max-width: 350px; height: auto; }
            
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            
            .footer { margin-top: 60px; background-color: #ffffff; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; padding-bottom: 20px; font-weight: 600; letter-spacing: 0.5px; }
            .footer-logo { height: 50px; margin-bottom: 10px; }
            
            @media print { 
              @page { size: landscape; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print, button, input, select { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${tenant?.logo_url ? `<img src="${tenant.logo_url}" class="header-logo" onerror="this.style.display='none'" />` : ''}
            <div class="header-info">
              <h1>${tenant?.nome || 'Associação'}</h1>
              <p>Relatório de Associados | Emissão: ${new Date().toLocaleDateString('pt-BR')} — Base Consolidada: ${filtrados.length} Associados</p>
            </div>
          </div>

          ${chartImage ? `
            <div class="chart-container">
              <img src="${chartImage}" class="chart-img" />
            </div>
          ` : ''}

          ${ativos.length > 0 ? renderTable(ativos, 'Associados Ativos', '#10b981') : ''}
          ${pendentes.length > 0 ? renderTable(pendentes, 'Associados Pendentes / Inadimplentes', '#f59e0b') : ''}
          ${inativos.length > 0 ? renderTable(inativos, 'Associados Inativos', '#94a3b8') : ''}

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

  const handleExportExcel = () => {
    if (filtrados.length === 0) return alert('Não há dados para exportar.')

    const dataToExport = filtrados.map((a: any) => ({
      'Matrícula': a.codigo || '',
      'Nome': a.nome || '',
      'CPF/CNPJ': a.cpf || '',
      'Email': a.email || '',
      'Telefone': a.telefone || '',
      'Dia do Vencimento': a.vencimento_dia || 10,
      'Mensalidade': a.mensalidade || 0,
      'Status': (a.status || 'Pendente').toUpperCase(),
      'Recorrência': a.recorrencia_ativa ? 'SIM' : 'NÃO',
      'Plano de Saúde': a.plano_saude || 'Não Possui',
      'Código HGU': a.codigo_hgu || '',
      'Dependentes HGU': Array.isArray(a.dependentes) ? a.dependentes.map((d:any) => d.nome).join(', ') : '',
      'Data de Inclusão Plano': a.data_inclusao_plano ? new Date(a.data_inclusao_plano).toLocaleDateString('pt-BR') : '',
      'Termo Status': a.termo_status || 'Assinatura Pendente',
      'Categoria': a.categoria || '',
      'Data de Ingresso': a.data_ingresso ? new Date(a.data_ingresso).toLocaleDateString('pt-BR') : '',
      'Associado desde': a.data_assinatura ? new Date(a.data_assinatura).toLocaleDateString('pt-BR') : '',
      'Sincronizado ZapSign': a.zapsign_sync_at ? new Date(a.zapsign_sync_at).toLocaleDateString('pt-BR') : ''
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Associados')
    
    // Ajustar largura das colunas
    const wscols = [
      {wch: 12}, {wch: 40}, {wch: 15}, {wch: 30}, {wch: 15}, 
      {wch: 12}, {wch: 12}, {wch: 12}, {wch: 20}, {wch: 20}, 
      {wch: 25}, {wch: 20}, {wch: 15}, {wch: 20}
    ]
    ws['!cols'] = wscols

    XLSX.writeFile(wb, `Associados_Export_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const columns = [
    {
      header: 'Associado', key: 'nome', className: 'min-w-[350px] whitespace-normal',
      filterValue: (i: any) => {
        let val = (i.nome || '') + ' ' + (i.codigo || '')
        if (Array.isArray(i.dependentes)) {
          val += ' ' + i.dependentes.map((d: any) => d.nome).join(' ')
        }
        return val
      },
      render: (i: any) => {
        const isExpanded = expandedRows.has(i.id)
        const hasHistory = i.zapsign_signers && i.zapsign_signers.length > 0
        
        return (
          <div className="flex flex-col gap-2 py-1">
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-emerald-100/50 cursor-pointer hover:bg-emerald-100 transition-colors"
                title="Ver ficha do associado"
                onClick={() => {
                  setSelectedFichaId(i.id)
                  setIsFichaOpen(true)
                }}
              >
                {(i.nome || 'A')[0]}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{i.nome}</span>
                  <button 
                    onClick={() => toggleRow(i.id)}
                    className={`p-1 rounded-lg transition-all ${isExpanded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
                  >
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[1px] opacity-70">#{i.codigo}</span>
              </div>
            </div>

            {isExpanded && hasHistory && (
              <div className="ml-12 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-2 animate-in slide-in-from-top-1 duration-200 mb-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[1px] mb-1">Status de Assinaturas:</p>
                {i.zapsign_signers.map((s: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'signed' || s.signed_at ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-bold text-slate-600 max-w-[150px] truncate">{s.name}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      s.status === 'signed' || s.signed_at
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {(s.status === 'signed' || s.signed_at) ? '✓ Assinado' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {isExpanded && Array.isArray(i.dependentes) && i.dependentes.length > 0 && (
              <div className="ml-12 p-3 bg-blue-50/30 rounded-2xl border border-blue-100/50 flex flex-col gap-2 animate-in slide-in-from-top-1 duration-200 mb-2">
                <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-[1px] mb-1">Dependentes Vinculados ao Plano HGU ({i.codigo_hgu || 'S/N'}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {i.dependentes.map((dep: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-blue-50 shadow-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-6 h-6 shrink-0 rounded-lg bg-blue-100 text-blue-600 font-black text-[9px] flex items-center justify-center">0{idx + 1}</div>
                        <span className="text-[10px] font-bold text-slate-700 uppercase truncate" title={dep.nome}>{dep.nome}</span>
                      </div>
                      <span className="shrink-0 text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100/50">
                        {dep.codigo_hgu}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isExpanded && (
              <div className="ml-12 p-3 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 flex flex-col gap-3 animate-in slide-in-from-top-1 duration-300">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-emerald-700/60 uppercase tracking-[1px]">Extrato Financeiro {new Date().getFullYear()}:</p>
                  <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">Mensalidades</span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {MESES.map((mes, idx) => {
                    const matches = lancamentos.filter((l: any) => {
                      const isCorrectAssociate = l.associado_id === i.id;
                      const isTargetCategory = l.categoria?.toUpperCase().includes('MENSALIDADE') || 
                                             l.descricao?.toUpperCase().includes('MENSALIDADE') ||
                                             l.categoria?.toUpperCase().includes('ADESÃO') ||
                                             l.descricao?.toUpperCase().includes('ADESÃO');
                      
                      if (!isCorrectAssociate || !isTargetCategory) return false;

                      const d = new Date(l.data + 'T12:00:00Z'); // force midday to avoid TZ shifts
                      const compMes = l.competencia_mes != null && l.competencia_mes !== '' ? Number(l.competencia_mes) : d.getUTCMonth();
                      const compAno = l.competencia_ano != null && l.competencia_ano !== '' ? Number(l.competencia_ano) : d.getUTCFullYear();

                      return compMes === idx && compAno === new Date().getFullYear();
                    })

                    const lanc = matches.find((l: any) => l.status === 'pago') || matches[0];
                    const isAdesao = lanc?.categoria?.toUpperCase().includes('ADESÃO') || lanc?.descricao?.toUpperCase().includes('ADESÃO');

                    return (
                      <div key={mes} className="flex items-center justify-between border-b border-emerald-100/30 pb-1 last:border-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{mes.substring(0,3)}</span>
                        {lanc ? (
                          <div className="flex items-center gap-1.5">
                            {isAdesao ? (
                              <span className="text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-[4px] uppercase tracking-tighter">ADESÃO</span>
                            ) : (
                              <>
                                <span className="text-[9px] font-bold text-slate-700">{fmtR(lanc.valor)}</span>
                                <span className={`w-2 h-2 rounded-full ${
                                  lanc.status === 'pago' ? 'bg-emerald-500' : 
                                  lanc.status === 'atrasado' ? 'bg-rose-500' : 'bg-slate-300'
                                }`} title={lanc.status} />
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300">--</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      }
    },
    { header: 'CPF/CNPJ', key: 'cpf', className: 'w-[140px]', render: (i: any) => <span className="text-[11px] font-medium text-gray-500">{i.cpf || 'Pendente'}</span> },
    { header: 'DIA VENC.', key: 'vencimento_dia', className: 'w-[100px]', render: (i: any) => <span className="text-xs font-black text-slate-400">DIA {i.vencimento_dia || 10}</span> },
    { header: 'Mensalidade', key: 'mensalidade', className: 'w-[130px]', render: (i: any) => <span className="text-xs font-bold text-gray-900">{fmtR(i.mensalidade)}</span> },
    { 
      header: 'Status', key: 'status', className: 'w-[120px]', 
      render: (i: any) => {
        if (i.status?.toLowerCase() === 'abonado') {
          return (
            <div className="relative group cursor-pointer">
              <StatusBadge status={i.status} type="associado" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-slate-800 text-white text-[10px] p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700">
                <p className="font-bold mb-1 text-indigo-300 uppercase tracking-wider text-[9px]">Abono Registrado</p>
                <p className="mb-1 text-slate-200"><span className="text-slate-400">Motivo:</span> {i.abono_motivo || 'Não informado'}</p>
                <p className="text-slate-200"><span className="text-slate-400">Autor:</span> {i.abono_usuario || 'Sistema'}</p>
                <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-slate-800 rotate-45 -translate-x-1/2 border-b border-r border-slate-700"></div>
              </div>
            </div>
          )
        }
        return <StatusBadge status={i.status} type="associado" />
      } 
    },
    { 
      header: 'Recorrência', key: 'recorrencia_ativa', className: 'w-[100px]', 
      render: (i: any) => (
        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${i.recorrencia_ativa ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
          {i.recorrencia_ativa ? 'Ativa' : 'Não'}
        </span>
      )
    },
    { 
      header: 'Plano Saúde', key: 'plano_saude', className: 'w-[150px]', 
      render: (i: any) => {
        const s = i.plano_saude || 'Não Possui'
        const colors = 
          s === 'Ativo' ? 'bg-blue-100 text-blue-700' :
          s === 'Aguardando Declaração' ? 'bg-orange-100 text-orange-700' :
          'bg-slate-100 text-slate-400'
        return <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${colors}`}>{s}</span>
      }
    },
    { 
      header: 'Código HGU', key: 'codigo_hgu', className: 'w-[120px] whitespace-nowrap', 
      filterValue: (i: any) => {
        let val = i.codigo_hgu || ''
        if (Array.isArray(i.dependentes)) {
          val += ' ' + i.dependentes.map((d: any) => d.codigo_hgu || '').join(' ')
        }
        return val
      },
      render: (i: any) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            {i.codigo_hgu ? (
              <>
                <button 
                  onClick={() => handleHguWhatsappClick(i)}
                  className="text-[11px] font-black text-emerald-600 hover:text-emerald-500 text-left whitespace-nowrap group flex items-center gap-1.5 transition-colors"
                  title="Enviar mensagem no WhatsApp"
                >
                  {i.codigo_hgu}
                  <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                </button>
                <button
                  onClick={() => toggleHguInformado(i.id, !i.hgu_informado)}
                  className={`p-0.5 rounded-md transition-colors ${i.hgu_informado ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300 hover:text-emerald-500'}`}
                  title={i.hgu_informado ? "Código já informado (Clique para desmarcar)" : "Marcar como informado"}
                >
                  <CheckSquare size={12} />
                </button>
              </>
            ) : (
              <span className="text-[11px] font-black text-slate-700 whitespace-nowrap">--</span>
            )}
          </div>
          {Array.isArray(i.dependentes) && i.dependentes.length > 0 && (
            <span className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">{i.dependentes.length} Dep.</span>
          )}
        </div>
      )
    },
    { 
      header: 'Data de Inclusão', key: 'data_inclusao_plano', className: 'w-[140px]', 
      render: (i: any) => <span className="text-[11px] font-medium text-slate-500">{i.data_inclusao_plano ? new Date(i.data_inclusao_plano + 'T12:00:00Z').toLocaleDateString('pt-BR') : '--'}</span> 
    },
    { 
      header: 'Associado desde', key: 'data_assinatura', className: 'w-[140px]', 
      render: (i: any) => <span className="text-[11px] font-medium text-slate-500">{i.data_assinatura ? new Date(i.data_assinatura + 'T12:00:00Z').toLocaleDateString('pt-BR') : '--'}</span> 
    },
    { 
      header: 'Sincronizado em', key: 'zapsign_sync_at', className: 'w-[140px]', 
      render: (i: any) => <span className="text-[11px] font-medium text-slate-500">{i.zapsign_sync_at ? new Date(i.zapsign_sync_at).toLocaleDateString('pt-BR') : '--'}</span> 
    },
    {
      header: 'Contato', key: 'telefone', className: 'w-[140px]',
      render: (i: any) => (
        <div className="flex items-center gap-2">
          {i.email && <a href={`mailto:${i.email}`} className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-all"><Mail size={12} /></a>}
          {i.telefone && <a href={`https://wa.me/${i.telefone.replace(/\D/g, '')}`} target="_blank" className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-600 hover:text-white transition-all"><Phone size={12} /></a>}
          {i.zapsign_doc_token && (
            <button 
              onClick={() => handleDownloadTermo(i)} 
              disabled={downloadingDoc === i.id}
              className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
              title="Baixar Termo Assinado"
            >
              {downloadingDoc === i.id ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
            </button>
          )}
        </div>
      )
    },
    {
      header: '', key: 'acoes', className: 'w-[80px] text-right',
      render: (i: any) => (
        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {(criar || isAdmin) && (
            <button 
              onClick={() => { setRecurrenceTarget(i); setIsIndividualSyncModalOpen(true) }} 
              className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md"
              title="Gerar Recorrência Individual"
            >
              <RefreshCw size={12} />
            </button>
          )}
          {(editar || isAdmin) && (
            <button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md" title="Editar"><Pencil size={12} /></button>
          )}
          {(editar || isAdmin) && (
            <button onClick={() => setAbonoItem(i)} className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md" title="Abonar Associado"><Gift size={12} /></button>
          )}
          {(criar || isAdmin) && (
            <button onClick={() => handleDuplicate(i)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md" title="Duplicar"><Copy size={12} /></button>
          )}
          {(excluir || isAdmin) && (
            <button onClick={() => setCancelamentoItem(i)} className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-md" title="Cancelar Vínculo"><UserMinus size={12} /></button>
          )}
          {(excluir || isAdmin) && (
            <button onClick={() => handleDelete(i.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md" title="Excluir"><XCircle size={12} /></button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Gestão de Vidas</h2>
            <p className="text-xs text-gray-500 font-medium">Controle total da base de membros e assinaturas</p>
          </div>
        <div className="flex items-center gap-3">

          <button 
            onClick={() => handlePrintAssociados()} 
            className="btn-secondary text-[10px] uppercase font-black px-4 py-2.5 flex items-center gap-2 bg-indigo-50 text-indigo-700 border-none hover:bg-indigo-100"
          >
            <FileText size={14} />
            Relatório
          </button>
          <input type="file" ref={hguFileInputRef} className="hidden" accept=".xlsx, .xlsm, .csv" onChange={handleHguFileChange} />
          <button 
            onClick={() => hguFileInputRef.current?.click()} 
            className="btn-secondary text-[10px] uppercase font-black px-4 py-2.5 flex items-center gap-2 bg-orange-50 text-orange-700 border-none hover:bg-orange-100"
          >
            <Download size={14} className="rotate-180" />
            Importar HGU
          </button>
          <button onClick={handleSyncZapSign} disabled={isSyncing} className="btn-secondary text-[10px] uppercase font-black px-4 py-2.5 flex items-center gap-2 bg-emerald-50 text-emerald-700 border-none hover:bg-emerald-100">
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            Sincronizar ZapSign
          </button>
          <button onClick={handleGerarAdesoes} disabled={isSyncing} className="btn-secondary text-[10px] uppercase font-black px-4 py-2.5 flex items-center gap-2 bg-teal-50 text-teal-700 border-none hover:bg-teal-100">
            <Zap size={14} className={isSyncing ? 'animate-pulse' : ''} />
            Lançar Adesões
          </button>
          <button onClick={handleGerarMensalidades} disabled={isSyncing} className="btn-secondary text-[10px] uppercase font-black px-4 py-2.5 flex items-center gap-2 bg-indigo-50 text-indigo-700 border-none hover:bg-indigo-100">
            <Zap size={14} className={isSyncing ? 'animate-pulse' : ''} />
            Lançar Mensalidades
          </button>

          {(criar || isAdmin) && (
            <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="btn-primary text-[10px] uppercase font-black px-5 py-2.5 flex items-center gap-2">
              <Plus size={14} /> Novo Associado
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard 
            title="Crescimento" 
            subtitle="Evolução acumulativa"
            onClick={() => setExpandedChart(chartConfigs.crescimento)}
          >
            <div className="w-full h-[300px] mt-2">
              <Line 
                data={chartConfigs.crescimento.chartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  layout: { padding: { top: 20, bottom: 10, left: 10, right: 10 } },
                  scales: { 
                    x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' }, color: '#94a3b8' } }, 
                    y: { display: false } 
                  }, 
                  plugins: { legend: { display: false } } 
                }} 
              />
            </div>
          </ChartCard>
        </div>
        <ChartCard 
          title="Status" 
          subtitle="Mix de associados"
          onClick={() => setExpandedChart(chartConfigs.status)}
        >
          <div className="w-full h-[300px] mt-4">
             <Doughnut 
               ref={chartRef}
               data={chartConfigs.status.chartData} 
               options={{ 
                 responsive: true, 
                 maintainAspectRatio: false, 
                 cutout: '85%', 
                 plugins: { 
                   legend: { 
                     position: 'bottom', 
                     labels: { color: '#1e293b', boxWidth: 10, usePointStyle: true, pointStyle: 'circle', font: { family: 'Inter, sans-serif', size: 12, weight: 600 }, padding: 15 } 
                   } 
                 } 
               }}
               plugins={[{
                 id: 'centerText',
                 beforeDraw: function(chart: any) {
                   var width = chart.width, height = chart.height, ctx = chart.ctx;
                   ctx.save();
                   ctx.font = "900 56px Inter, sans-serif";
                   ctx.textBaseline = "middle";
                   ctx.fillStyle = "#1d4f3e";
                   var total = chart.config.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                   var text = total.toString(), textX = Math.round((width - ctx.measureText(text).width) / 2), textY = height / 2 - 5;
                   ctx.fillText(text, textX, textY);
                   ctx.font = "900 12px Inter, sans-serif";
                   ctx.fillStyle = "#94a3b8";
                   var text2 = "ASSOCIADOS", text2X = Math.round((width - ctx.measureText(text2).width) / 2), text2Y = height / 2 + 30;
                   ctx.fillText(text2, text2X, text2Y);
                   ctx.restore();
                 }
               }]}
             />
          </div>
        </ChartCard>
      </div>

      <div className="flex flex-col gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-grow min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Busca global..." className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-indigo-500/10" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors uppercase"
          >
            <Search size={14} />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 flex-wrap mt-2 pt-4 border-t border-gray-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none">{['todos', 'ativo', 'pendente', 'inadimplente', 'suspenso', 'inativo'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select>

          <select value={filterCpfPresence} onChange={e => setFilterCpfPresence(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none">
            <option value="todos">CPF (TODOS)</option>
            <option value="com_cpf">COM CPF</option>
            <option value="sem_cpf">SEM CPF</option>
          </select>
          <select value={filterDependentes} onChange={e => setFilterDependentes(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none">
            <option value="todos">DEPENDENTES (TODOS)</option>
            <option value="com">COM DEPENDENTES</option>
            <option value="sem">SEM DEPENDENTES</option>
          </select>
          <select value={filterRecorrencia} onChange={e => setFilterRecorrencia(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none">
            <option value="todos">RECORRÊNCIA (TODOS)</option>
            <option value="sim">COM RECORRÊNCIA</option>
            <option value="nao">SEM RECORRÊNCIA</option>
          </select>
          <select value={filterPlanoSaude} onChange={e => setFilterPlanoSaude(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none">
            <option value="todos">PLANO SAÚDE (TODOS)</option>
            <option value="Ativo">PLANO ATIVO</option>
            <option value="Aguardando Declaração">AGUARDANDO DECLARAÇÃO</option>
            <option value="Não Possui">NÃO POSSUI</option>
          </select>

          <select value={filterAnaliseInteligente} onChange={e => setFilterAnaliseInteligente(e.target.value)} className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-2xl text-xs font-black border-none outline-none shadow-sm hover:bg-emerald-100 transition-colors">
            <option value="todos">ANÁLISE INTELIGENTE</option>
            <option value="so_adesao">SÓ ADESÃO (SEM MENSALIDADE)</option>
          </select>
          
          <div className="relative">
            <button 
              onClick={() => setIsMesMenuOpen(!isMesMenuOpen)}
              className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none flex items-center gap-2 min-w-[200px] justify-between hover:bg-gray-100 transition-colors"
            >
              <span className="truncate max-w-[160px]">
                {filterMesesIngresso.length === 0 && filterAnoIngresso === 'todos' ? 'PERÍODO INGRESSO (TODOS)' : 
                 `${filterMesesIngresso.length === 0 ? 'TODOS OS MESES' : filterMesesIngresso.length === 1 ? MESES[filterMesesIngresso[0]].toUpperCase() : filterMesesIngresso.length + ' MESES'} / ${filterAnoIngresso === 'todos' ? 'TODOS OS ANOS' : filterAnoIngresso}`}
              </span>
              <ChevronDown size={14} className={isMesMenuOpen ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            
            {isMesMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMesMenuOpen(false)} />
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 z-50 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Selecione o Ano:</p>
                    <select value={filterAnoIngresso} onChange={e => setFilterAnoIngresso(e.target.value)} className="w-full bg-slate-50 px-4 py-3 rounded-xl text-xs font-bold border border-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all">
                      <option value="todos">TODOS OS ANOS</option>
                      {anosIngresso.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Selecione os meses:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {MESES.map((m, i) => {
                        const isSelected = filterMesesIngresso.includes(i)
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              if (isSelected) setFilterMesesIngresso(prev => prev.filter(x => x !== i))
                              else setFilterMesesIngresso(prev => [...prev, i].sort((a, b) => a - b))
                            }}
                            className={`px-2 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${isSelected ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                          >
                            {m.substring(0, 3).toUpperCase()}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <button 
                    onClick={() => { setFilterMesesIngresso([]); setFilterAnoIngresso('todos'); }}
                    className="mt-1 py-2.5 text-[10px] font-black text-rose-500 uppercase hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                  >
                    Limpar Seleção
                  </button>
                </div>
              </>
            )}
          </div>
          {hasActiveFilters && <button onClick={clearFilters} className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors">Limpar Filtros</button>}
          </div>
        )}
      </div>

      <BatchActionBarAssociados
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onDelete={(excluir || isAdmin) ? handleBulkDelete : undefined}
        onUpdate={handleBulkEdit}
        onGerarMensalidades={() => setIsBatchRecurrenceModalOpen(true)}
        contas={contas}
      />

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <DataTable 
          columns={columns} 
          data={filtrados} 
          loading={loading} 
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          showFilterInputs={false}
          headerActions={
            <>
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all shadow-sm"
              >
                <Download size={14} /> 
                Exportar Excel
              </button>
              <button 
                onClick={() => {
                  if (expandedRows.size > 0) setExpandedRows(new Set())
                  else setExpandedRows(new Set(filtrados.map((a: any) => a.id)))
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all shadow-sm"
              >
                <ChevronDown size={14} className={expandedRows.size > 0 ? "rotate-180 transition-transform" : "transition-transform"} /> 
                {expandedRows.size > 0 ? 'Recolher Tudo' : 'Expandir Tudo'}
              </button>
            </>
          }
        />
      </div>

      <CrudModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Associado' : 'Novo Associado'} initialData={editingItem} onSubmit={handleSalvar}
        fields={[
          { name: 'nome', label: 'Nome', type: 'text', required: true },
          { name: 'cpf', label: 'CPF/CNPJ', type: 'text' },
          { name: 'codigo', label: 'Matrícula', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'text', required: true },
          { name: 'telefone', label: 'WhatsApp', type: 'text' },
          { name: 'mensalidade', label: 'Valor', type: 'number', required: true },
          { 
            name: 'vencimento_dia', 
            label: 'Dia do Vencimento', 
            type: 'select', 
            options: Array.from({ length: 30 }, (_, i) => ({ 
              value: String(i + 1), 
              label: `DIA ${String(i + 1).padStart(2, '0')}` 
            })) 
          },
          { name: 'data_ingresso', label: 'Ingresso', type: 'date', required: true },
          { name: 'data_assinatura', label: 'Associado desde (Assinatura)', type: 'date' },
          { name: 'status', label: 'Status', type: 'select', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'pendente', label: 'Pendente' }, { value: 'inadimplente', label: 'Inadimplente' }, { value: 'inativo', label: 'Inativo' }, { value: 'abonado', label: 'Abonado' }] },
          { name: 'recorrencia_ativa', label: 'Cobrança Recorrente', type: 'checkbox' },
          { 
            name: 'conta_recorrencia', 
            label: 'Conta da Recorrência', 
            type: 'select',
            options: contas.map(c => ({ value: c.nome, label: c.nome }))
          },
          {
            name: 'plano_saude',
            label: 'Plano de Saúde',
            type: 'select',
            options: [
              { value: 'Não Possui', label: 'NÃO POSSUI' },
              { value: 'Ativo', label: 'ATIVO' },
              { value: 'Aguardando Declaração', label: 'AGUARDANDO DECLARAÇÃO' }
            ]
          },
          { name: 'codigo_hgu', label: 'Código do Plano HGU', type: 'text' },
          { name: 'data_inclusao_plano', label: 'Data Inclusão Plano', type: 'date' },
          {
            name: 'termo_status',
            label: 'Termo Assinado',
            type: 'select',
            options: [
              { value: 'Assinatura Pendente', label: 'ASSINATURA PENDENTE' },
              { value: 'Enviado ao HGU', label: 'ENVIADO AO HGU' }
            ]
          }
        ]}
      />
      <CrudModal
        isOpen={isBulkAccountModalOpen} 
        onClose={() => setIsBulkAccountModalOpen(false)} 
        title="Definir Conta em Lote" 
        onSubmit={handleConfirmBulkAccount}
        loading={isUpdatingBulk}
        fields={[
          { 
            name: 'conta_recorrencia', 
            label: 'Selecione a Conta Bancária', 
            type: 'select',
            required: true,
            options: contas.map(c => ({ value: c.nome, label: c.nome }))
          }
        ]}
      />


      <CrudModal 
        isOpen={isBatchRecurrenceModalOpen} 
        onClose={() => setIsBatchRecurrenceModalOpen(false)} 
        title={`GERAR MENSALIDADES EM LOTE`}
        onSubmit={handleConfirmBatchRecurrence}
        loading={isUpdatingBulk}
        fields={[
          { 
            name: 'publico_alvo', 
            label: 'Público Alvo', 
            type: 'text', 
            defaultValue: `${selectedIds.length} Associados Selecionados` 
          },
          { 
            name: 'descricao_padrao', 
            label: 'Descrição Base', 
            type: 'text', 
            required: true, 
            defaultValue: 'MENSALIDADE DE ASSOCIADO' 
          },
          { 
            name: 'categoria', 
            label: 'Categoria', 
            type: 'select', 
            required: true, 
            defaultValue: categoriasContabeis.find(c => c.nome.toLowerCase().includes('mensalidade'))?.nome || '', 
            options: categoriasContabeis.map(c => ({ value: c.nome, label: c.nome.toUpperCase() })) 
          },
          { 
            name: 'mes_inicio', 
            label: 'Partir do Mês', 
            type: 'select', 
            required: true, 
            defaultValue: String(new Date().getMonth()), 
            options: MESES.map((m, i) => ({ value: String(i), label: m.toUpperCase() })) 
          },
          { 
            name: 'ano_inicio', 
            label: 'Ano', 
            type: 'number', 
            required: true, 
            defaultValue: new Date().getFullYear() 
          },
          { 
            name: 'dia', 
            label: 'Dia', 
            type: 'select', 
            required: true, 
            defaultValue: '0', 
            options: [
              { value: '0', label: 'USAR VENCIMENTO DO ASSOCIADO' },
              { value: '10', label: 'DIA 10' },
              { value: '20', label: 'DIA 20' }
            ]
          },
          { 
            name: 'meses', 
            label: 'Meses', 
            type: 'select', 
            required: true, 
            defaultValue: '12', 
            options: [
              { value: '1', label: '1 Mês' }, 
              { value: '6', label: '6 Meses' }, 
              { value: '12', label: '12 Meses' }
            ] 
          },
          { 
            name: 'forma_pagamento', 
            label: 'Forma', 
            type: 'select', 
            required: true, 
            defaultValue: 'Boleto', 
            options: [
              { value: 'PIX', label: 'PIX' }, 
              { value: 'Boleto', label: 'BOLETO' }, 
              { value: 'Dinheiro', label: 'DINHEIRO' }
            ] 
          },
          { 
            name: 'conta_id', 
            label: 'Conta', 
            type: 'select', 
            required: true, 
            options: contas.map(c => ({ value: c.id, label: c.nome.toUpperCase() })) 
          }
        ]}
      />

      <CrudModal 
        isOpen={isIndividualSyncModalOpen} 
        onClose={() => setIsIndividualSyncModalOpen(false)} 
        title={`Gerar Recorrência: ${recurrenceTarget?.nome}`}
        onSubmit={async (p: any) => {
          if (!recurrenceTarget) return
          
          const batch: any[] = []
          const logs: AssociadoLogEntry[] = []
          let skipped = 0

          for(let i=0; i<Number(p.meses); i++) { 
            const d = new Date(Number(p.ano_inicio), Number(p.mes_inicio)+i, Number(p.dia))
            const mesAlvo = d.getMonth()
            const anoAlvo = d.getFullYear()

            // Evitar duplicidade
            const jaExiste = lancamentos.some(l => 
              l.associado_id === recurrenceTarget.id && 
              l.tipo === 'receita' &&
              (l.categoria === 'Mensalidade' || l.descricao.toUpperCase().includes('MENSALIDADE')) &&
              (
                (l.competencia_mes === mesAlvo && l.competencia_ano === anoAlvo) ||
                (new Date(l.data).getMonth() === mesAlvo && new Date(l.data).getFullYear() === anoAlvo)
              )
            )

            if (jaExiste) {
              skipped++
              logs.push({
                data: d.toISOString().split('T')[0],
                descricao: 'Geração Mensalidade Individual',
                associado: recurrenceTarget.nome,
                status: 'erro',
                mensagem: `Já existe mensalidade para ${MESES[mesAlvo]}/${anoAlvo}`
              })
              continue
            }

            batch.push({ 
              tipo: 'receita', 
              descricao: `${p.descricao_padrao.toUpperCase()} - ${recurrenceTarget.nome.toUpperCase()}`, 
              categoria: p.categoria || 'Mensalidade', 
              valor: recurrenceTarget.mensalidade || 50, 
              data: d.toISOString().split('T')[0], 
              status: 'aberto', 
              associado_id: recurrenceTarget.id, 
              conta_id: p.conta_id, 
              forma_pagamento: p.forma_pagamento,
              competencia_mes: mesAlvo,
              competencia_ano: anoAlvo
            }) 
            logs.push({
              data: d.toISOString().split('T')[0],
              descricao: 'Geração Mensalidade Individual',
              associado: recurrenceTarget.nome,
              valor: recurrenceTarget.mensalidade || 50,
              status: 'sucesso',
              mensagem: `Gerada para ${MESES[mesAlvo]}/${anoAlvo}`
            })
          }

          if (batch.length > 0) {
            await inserirBulk(batch)
          }

          setAssociadosLogs(logs)
          setLogModalTitle(`Geração Recorrência: ${recurrenceTarget.nome}`)
          setIsLogModalOpen(true)
          setIsIndividualSyncModalOpen(false)
          refresh()
        }} 
        fields={[
          { name: 'descricao_padrao', label: 'Descrição Base', type: 'text', defaultValue: 'MENSALIDADE DE ASSOCIADO' }, 
          { name: 'categoria', label: 'Categoria', type: 'select', defaultValue: 'Mensalidade', options: categoriasContabeis.map(c => ({ value: c.nome, label: c.nome })) },
          { name: 'mes_inicio', label: 'Partir do Mês', type: 'select', defaultValue: new Date().getMonth().toString(), options: MESES.map((m, idx) => ({ value: idx.toString(), label: m })) }, 
          { name: 'ano_inicio', label: 'Ano', type: 'number', defaultValue: new Date().getFullYear().toString() }, 
          { name: 'dia', label: 'Dia', type: 'number', defaultValue: '10' }, 
          { name: 'meses', label: 'Quantidade de Meses', type: 'select', defaultValue: '12', options: [{ value: '1', label: '1 mês' }, { value: '6', label: '6 Meses' }, { value: '12', label: '12 Meses' }, { value: '24', label: '24 Meses' }] }, 
          { name: 'forma_pagamento', label: 'Forma Padrão', type: 'select', defaultValue: 'Boleto', options: [{ value: 'PIX', label: 'PIX' }, { value: 'Boleto', label: 'Boleto' }, { value: 'Dinheiro', label: 'Dinheiro' }] }, 
          { name: 'conta_id', label: 'Conta Destino', type: 'select', options: contas.map(c => ({ value: c.id, label: c.nome })) }
        ]} 
      />

      {/* Zoom Modal (Same as Financeiro/Dashboard) */}
      {expandedChart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#071a12]/95 backdrop-blur-xl" onClick={() => setExpandedChart(null)} />
          
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95 duration-500 border border-white/20">
            {/* Modal Sidebar (Executive Summary) */}
            <div className="lg:w-[320px] bg-gradient-to-br from-[#0e2d22] to-[#163d2f] p-8 text-white flex flex-col justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    {expandedChart.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">{expandedChart.title}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[2px] text-emerald-400 opacity-80">{expandedChart.subtitle}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Status da Base</p>
                    <p className="text-sm font-medium">Análise em tempo real baseada no cadastro de associados e histórico de adesões.</p>
                  </div>
                  <div className="p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Dica Estratégica</p>
                    <p className="text-[12px] leading-relaxed text-emerald-900 font-bold italic">"O crescimento sustentável depende da regularidade das mensalidades. Monitore os inadimplentes."</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setExpandedChart(null)}
                className="mt-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
              >
                <X size={16} /> Fechar Detalhes
              </button>
            </div>

            {/* Modal Content (Chart & Audit Table) */}
            <div className="flex-1 bg-slate-50 flex flex-col min-h-0 overflow-y-auto">
              {/* Top Chart Section */}
              <div className="p-8 lg:p-12 border-b border-slate-200">
                <div className="h-[300px] w-full">
                  {expandedChart.chartType === 'line' ? (
                    <Line 
                      data={expandedChart.chartData} 
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } }} 
                    />
                  ) : (
                    <Doughnut 
                      data={expandedChart.chartData} 
                      options={{ responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: '#1e293b', boxWidth: 10, usePointStyle: true, pointStyle: 'circle', font: { family: 'Inter, sans-serif', size: 12, weight: 600 }, padding: 15 } } } }} 
                      plugins={[{
                        id: 'centerTextModal',
                        beforeDraw: function(chart: any) {
                          var width = chart.width, height = chart.height, ctx = chart.ctx;
                          ctx.save();
                          ctx.font = "900 64px Inter, sans-serif";
                          ctx.textBaseline = "middle";
                          ctx.fillStyle = "#1d4f3e";
                          var total = chart.config.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                          var text = total.toString(), textX = Math.round((width - ctx.measureText(text).width) / 2), textY = height / 2 - 5;
                          ctx.fillText(text, textX, textY);
                          ctx.font = "900 12px Inter, sans-serif";
                          ctx.fillStyle = "#94a3b8";
                          var text2 = "ASSOCIADOS", text2X = Math.round((width - ctx.measureText(text2).width) / 2), text2Y = height / 2 + 30;
                          ctx.fillText(text2, text2X, text2Y);
                          ctx.restore();
                        }
                      }]}
                    />
                  )}
                </div>
              </div>

              {/* Data Table Section */}
              <div className="p-8 lg:p-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Auditando Dados do Período</h3>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">Confidencial</div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        {expandedChart.tableData.headers.map((h: string) => (
                          <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {expandedChart.tableData.rows.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          {row.map((cell: any, ci: number) => (
                            <td key={ci} className={`px-6 py-4 text-xs ${ci === 0 ? 'font-bold text-slate-800' : 'font-black text-emerald-600'}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <AssociadosLogModal 
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        logs={associadosLogs}
        title={logModalTitle}
      />
      
      <FichaAssociadoModal 
        isOpen={isFichaOpen}
        onClose={() => setIsFichaOpen(false)}
        associadoId={selectedFichaId}
        onAtualizar={atualizar}
      />

      <ConfirmModal
        isOpen={vencimentoConfirm.isOpen}
        onClose={() => handleConfirmVencimentoUpdate(false)}
        onConfirm={() => handleConfirmVencimentoUpdate(true)}
        title="Atualizar Lançamentos Financeiros?"
        message={
          <div className="space-y-4">
            <p>Você alterou o dia de vencimento do associado para o dia <strong>{vencimentoConfirm.data?.vencimento_dia}</strong>.</p>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-xs text-left">
              <p className="font-bold mb-1">Atenção:</p>
              <p>Foram encontrados <strong>{vencimentoConfirm.toUpdate.length} lançamentos em aberto</strong> vinculados a este associado.</p>
              <p className="mt-2 text-[10px]">Deseja atualizar a data de vencimento de todos esses lançamentos para o novo dia?</p>
            </div>
          </div>
        }
        confirmText="Sim, atualizar tudo"
        cancelText="Não, manter atuais"
        type="warning"
      />

      {cancelamentoItem && (
        <CancelamentoModal
          associado={cancelamentoItem}
          onClose={() => {
            setCancelamentoItem(null)
            refresh()
          }}
        />
      )}

      <CrudModal
        isOpen={!!abonoItem}
        onClose={() => setAbonoItem(null)}
        title={`Abonar Associado: ${abonoItem?.nome}`}
        onSubmit={handleConfirmAbono}
        loading={isUpdatingBulk}
        fields={[
          {
            name: 'aviso',
            label: '',
            type: 'info',
            render: () => (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-xs text-left mb-2">
                <p className="font-bold mb-1 uppercase tracking-wider text-[10px]">Atenção:</p>
                <p>Confirmar esta ação mudará o status para ABONADO e EXCLUIRÁ todos os lançamentos abertos e atrasados vinculados a este associado.</p>
              </div>
            )
          },
          {
            name: 'abono_motivo',
            label: 'Motivo do Abono',
            type: 'select',
            required: true,
            options: [
              { value: '01 - Abonado por Decisão da ACPROBEC', label: '01 - Abonado por Decisão da ACPROBEC' },
              { value: '02 - Abonado por Decisão do HGU', label: '02 - Abonado por Decisão do HGU' },
              { value: '03 - Abonado por Decisão Judicial', label: '03 - Abonado por Decisão Judicial' }
            ]
          }
        ]}
      />
      
      {isHguModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-800">Pré-visualização da Importação HGU</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Valide os vínculos antes de salvar. Apenas associados encontrados serão atualizados.</p>
              </div>
              <button onClick={() => setIsHguModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm border border-slate-200"><X size={20} /></button>
            </div>
            
            <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
              <button 
                onClick={() => setHguModalTab('encontrados')}
                className={`px-4 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${hguModalTab === 'encontrados' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Encontrados ({hguPreview.filter(p => p.matched_associado).length})
              </button>
              <button 
                onClick={() => setHguModalTab('nao_encontrados')}
                className={`px-4 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${hguModalTab === 'nao_encontrados' ? 'border-rose-500 text-rose-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Não Encontrados ({hguPreview.filter(p => !p.matched_associado).length})
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-slate-50/30">
              {hguPreview.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-10">Nenhum titular válido encontrado na planilha.</p>
              ) : (
                <div className="space-y-4">
                  {hguPreview.map((item, idx) => {
                    const show = hguModalTab === 'encontrados' ? !!item.matched_associado : !item.matched_associado
                    if (!show) return null
                    
                    return (
                      <div key={idx} className={`p-4 rounded-2xl border bg-white shadow-sm flex flex-col gap-3 transition-all ${item.matched_associado ? 'border-emerald-100' : 'border-rose-100'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${item.matched_associado ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {item.matched_associado ? <CheckSquare size={18} /> : <XCircle size={18} />}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800 uppercase">{item.hgu_nome}</p>
                              <p className="text-[10px] font-bold text-slate-500 mt-0.5">CÓD: {item.hgu_codigo}</p>
                            </div>
                          </div>
                          {item.matched_associado ? (
                            <div className="text-right flex flex-col items-end gap-1">
                              <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">Vínculo Encontrado</span>
                              <p className="text-[10px] font-bold text-slate-600">→ {item.matched_associado.nome}</p>
                              <button
                                onClick={() => {
                                  const next = [...hguPreview]
                                  next[idx] = { ...next[idx], matched_associado: null }
                                  setHguPreview(next)
                                  setHguModalTab('nao_encontrados')
                                }}
                                className="text-[9px] font-black text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 hover:border-rose-300 transition-all flex items-center gap-1 mt-0.5"
                                title="Desvincular este associado"
                              >
                                ✕ Desvincular
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-100 px-2 py-1 rounded-md">Não Encontrado</span>
                          )}
                        </div>
                        
                        {item.dependentes && item.dependentes.length > 0 && (
                          <div className="pl-14">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Dependentes Identificados:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {item.dependentes.map((dep: any, dIdx: number) => (
                                <div key={dIdx} className="bg-slate-50 border border-slate-100 p-2 rounded-lg flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-slate-700 uppercase">{dep.nome}</span>
                                  <span className="text-[9px] font-black text-slate-400">{dep.codigo_hgu}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {!item.matched_associado && (
                          <div className="mt-2 pt-3 border-t border-slate-100 flex items-center gap-3 pl-14">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Vincular Manualmente:</span>
                            <select 
                              value=""
                              onChange={e => {
                                if(e.target.value) handleManualLink(idx, e.target.value)
                              }}
                              className="flex-1 text-[11px] border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-emerald-500"
                            >
                              <option value="" disabled>-- Selecione o Associado --</option>
                              {associados.map((a: any) => (
                                <option key={a.id} value={a.id}>{a.nome} (CPF: {a.cpf || 'N/A'})</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-between">
              <div className="flex gap-2">
                {hguModalTab === 'nao_encontrados' && hguPreview.filter(p => !p.matched_associado).length > 0 && (
                  <>
                    <button 
                      onClick={downloadNaoEncontradosPDF}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-rose-700 bg-rose-50 hover:bg-rose-100 uppercase transition-colors"
                    >
                      <FileText size={14} /> Relatório PDF
                    </button>
                    <button 
                      onClick={downloadNaoEncontradosExcel}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 uppercase transition-colors"
                    >
                      <FileText size={14} /> Relatório Excel
                    </button>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsHguModalOpen(false)} 
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 uppercase transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmHguImport}
                  disabled={isImportingHgu || hguPreview.filter(p => p.matched_associado).length === 0}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 uppercase transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isImportingHgu ? <Loader2 size={14} className="animate-spin" /> : <CheckSquare size={14} />}
                  Confirmar Importação ({hguPreview.filter(p => p.matched_associado).length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Preview de Adesões */}
      <PreviewMensalidadesModal 
        isOpen={isPreviewMensalidadesOpen}
        onClose={() => setIsPreviewMensalidadesOpen(false)}
        previewData={previewMensalidadesData}
        associados={associados}
        onConfirm={handleConfirmGerarMensalidades}
      />
      <PreviewAdesoesModal 
        isOpen={isPreviewAdesoesOpen}
        onClose={() => setIsPreviewAdesoesOpen(false)}
        previewData={previewAdesoesData}
        associados={associados}
        onConfirm={handleConfirmGerarAdesoes}
      />

    </div>
  )
}
