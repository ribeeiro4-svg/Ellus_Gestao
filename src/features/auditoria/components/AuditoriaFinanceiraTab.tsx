'use client'

import React, { useState, useMemo } from 'react'
import { ShieldCheck, Download, Search, AlertTriangle, CheckCircle2, FileText, Upload, Info, X, Plus, Eye, ArrowDownRight, ArrowUpRight, Activity, Trash2 } from 'lucide-react'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useCategorias } from '@/lib/hooks/useCategorias'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import { useOFXParser, OFXTransaction, OFXParseResult } from '@/lib/hooks/useOFXParser'
import OFXUpload from '@/components/conciliacao/OFXUpload'
import * as XLSX from 'xlsx'
import { fmtR } from '@/lib/utils/formatters'

const extrairTaxa = (desc: string) => {
  if (!desc) return 0;
  const match = desc.match(/\(Taxa: R\$\s*([^)]+)\)/);
  return match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0;
}

type AuditTab = 'adesoes' | 'extratos'
type OFXAuditStatus = 'ok' | 'valor_divergente' | 'manual' | 'manual_outra_conta' | 'nao_encontrado' | 'duplicata' | 'data_divergente' | 'status_aberto'

export default function AuditoriaFinanceiraTab() {
  const { associados, loading: loadingAssoc } = useAssociados()
  const { lancamentos, loading: loadingFin, inserirBulk, atualizar, remover } = useFinanceiro()
  const { fornecedores, inserir: inserirFornecedor } = useFornecedores()
  const { contas } = useContas()
  const { categorias } = useCategorias()
  const { parseOFX } = useOFXParser()

  const [activeTab, setActiveTab] = useState<AuditTab>('adesoes')
  
  // --- Estados para Adesoes ---
  const [searchQAdesoes, setSearchQAdesoes] = useState('')
  const [filterTypeAdesoes, setFilterTypeAdesoes] = useState<'todos' | 'divergencias'>('divergencias')
  const [filterIngressoMes, setFilterIngressoMes] = useState<string>('todos')
  const [filterTag, setFilterTag] = useState<string>('todas')
  const [filterFaltaTipo, setFilterFaltaTipo] = useState<string>('todas')
  const [isGenerating, setIsGenerating] = useState(false)

  // --- Modal Gerar Faltantes ---
  const [modalGerarData, setModalGerarData] = useState<any[] | null>(null)
  const [mgConta, setMgConta] = useState('padrao')
  const [mgDia, setMgDia] = useState('10')
  const [mgStatus, setMgStatus] = useState('atrasado')
  const [mgValor, setMgValor] = useState('50,00')
  const [mgCategoria, setMgCategoria] = useState('')
  const [mgFormaPagamento, setMgFormaPagamento] = useState('Boleto')
  const [mgFixoVariavel, setMgFixoVariavel] = useState('fixo')
  const [mgOQueGerar, setMgOQueGerar] = useState('tudo')

  // --- Estados para Extratos ---
  const [ofxResult, setOfxResult] = useState<OFXParseResult | null>(null)
  const [contaAuditId, setContaAuditId] = useState<string>('')
  const [searchQExtratos, setSearchQExtratos] = useState('')
  const [filterTypeExtratos, setFilterTypeExtratos] = useState<'todos' | 'divergencias'>('divergencias')
  const [filterStatusExtratos, setFilterStatusExtratos] = useState<string>('todos')
  
  const [newLancData, setNewLancData] = useState({ associado_id: '', fornecedor_id: '', categoria: '' })
  const [isCreatingLanc, setIsCreatingLanc] = useState(false)
  const [importTarget, setImportTarget] = useState<OFXTransaction | null>(null)
  const [importActionType, setImportActionType] = useState<'criar' | 'vincular'>('criar')
  const [vinculoLancamentoId, setVinculoLancamentoId] = useState<string>('')
  const [isCriandoFornecedor, setIsCriandoFornecedor] = useState(false)
  const [novoFornecedorNome, setNovoFornecedorNome] = useState('')
  const [isSavingFornecedor, setIsSavingFornecedor] = useState(false)
  const [selectedDivergencias, setSelectedDivergencias] = useState<string[]>([])

  const handleEstornarLancamento = async (id: string) => {
    if (window.confirm('Tem certeza que deseja estornar este lançamento para "Pendente"? Isso removerá ele do total do caixa Efetivado.')) {
      try {
        await atualizar(id, { status: 'aberto' })
      } catch (err) {
        alert('Erro ao estornar: ' + err)
      }
    }
  }

  const handleMoverTodosConta = async (novaContaId: string) => {
    if (!novaContaId) return
    const contaNova = contas?.find((c: any) => c.id === novaContaId)
    if (window.confirm(`Tem certeza que deseja mover todos os ${fantasmas.length} lançamentos fantasma listados abaixo para a conta "${contaNova?.nome}"? Isso removerá as divergências desta auditoria.`)) {
      try {
        await Promise.all(fantasmas.map(f => atualizar(f.lancamento.id, { conta_id: novaContaId })))
        alert('Contas alteradas com sucesso!')
      } catch (err) {
        alert('Erro ao alterar contas em lote: ' + err)
      }
    }
  }

  const handleRemoverLancamento = async (id: string, descricao: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o lançamento do sistema:\n\n"${descricao}"?\n\nEle sairá permanentemente do sistema.`)) return
    try {
      const res = await remover(id)
      if (res?.error) {
        alert('Erro ao excluir lançamento: ' + (typeof res.error === 'string' ? res.error : (res.error as any).message || JSON.stringify(res.error)))
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + (err.message || err))
    }
  }

  const handleCorrigirAutomaticamente = async (row: any, silent = false) => {
    if (!row.matchLanc || !row.ofx) return
    const updates: any = {}
    
    if (row.status === 'valor_divergente') {
      const taxa = extrairTaxa(row.matchLanc.descricao)
      updates.valor = row.matchLanc.tipo === 'receita' ? (Math.abs(row.ofx.amount) - taxa) : -(Math.abs(row.ofx.amount) - taxa)
    } else if (row.status === 'data_divergente') {
      updates.data = row.ofx.date
      if (row.matchLanc.data_caixa) updates.data_caixa = row.ofx.date
      if (row.matchLanc.data_conciliacao) updates.data_conciliacao = row.ofx.date
    } else if (row.status === 'status_aberto') {
      updates.status = 'efetivado'
      updates.conciliado = true
    } else if (row.status === 'manual') {
      updates.banco_transacao_id = row.ofx.fitid
    } else if (row.status === 'manual_outra_conta') {
      updates.banco_transacao_id = row.ofx.fitid
      updates.conta_id = contaAuditId
    }
    
    if (Object.keys(updates).length > 0) {
      try {
        const res: any = await atualizar(row.matchLanc.id, updates)
        if (res?.error) {
          if (!silent) alert('Erro ao corrigir: ' + (res.error.message || JSON.stringify(res.error)))
          return { error: res.error }
        }
      } catch (err: any) {
        if (!silent) alert('Erro inesperado: ' + (err.message || err))
        return { error: err }
      }
    }
    return { error: null }
  }

  const handleCorrigirLote = async () => {
    if (selectedDivergencias.length === 0) return
    if (!window.confirm(`Acatar e corrigir automaticamente as ${selectedDivergencias.length} divergências selecionadas?`)) return
    
    const toFix = filteredExtratosData.filter(d => selectedDivergencias.includes(d.ofx.fitid) && ['valor_divergente', 'data_divergente', 'status_aberto', 'manual', 'manual_outra_conta'].includes(d.status))
    
    try {
      const results = await Promise.all(toFix.map(row => handleCorrigirAutomaticamente(row, true)))
      const failed = results.filter(r => r?.error)
      if (failed.length > 0) {
        alert(`Erro ao corrigir ${failed.length} lançamento(s) em lote. Alguns podem estar em períodos fechados.`)
      } else {
        alert('Correções aplicadas com sucesso!')
      }
      setSelectedDivergencias([])
    } catch (err: any) {
      alert('Erro ao corrigir em lote: ' + (err.message || err))
    }
  }
  
  const handleSalvarFornecedor = async () => {
    if (!novoFornecedorNome.trim()) return
    setIsSavingFornecedor(true)
    try {
      const res = await (inserirFornecedor as any)({ nome: novoFornecedorNome.trim().toUpperCase() })
      if (res?.error) {
        alert(res.error)
      } else {
        if (res?.data?.id) {
          setNewLancData(prev => ({ ...prev, fornecedor_id: res.data.id }))
        }
        setIsCriandoFornecedor(false)
        setNovoFornecedorNome('')
      }
    } catch (e: any) {
      alert('Erro ao salvar fornecedor: ' + e.message)
    } finally {
      setIsSavingFornecedor(false)
    }
  }

  const loading = loadingAssoc || loadingFin

  const MESES_AUDITADOS = [
    { mes: 1, label: 'Janeiro' },
    { mes: 2, label: 'Fevereiro' },
    { mes: 3, label: 'Março' },
    { mes: 4, label: 'Abril' },
    { mes: 5, label: 'Maio' },
    { mes: 6, label: 'Junho' },
  ]

  // ==========================================
  // LÓGICA DE AUDITORIA DE ADESÕES
  // ==========================================
  const adesoesData = useMemo(() => {
    if (!associados || !lancamentos) return []

    const alvos = associados.filter((a: any) => {
      if (a.status === 'inativo') return false
      
      const joinedDate = a.data_assinatura || a.created_at
      if (!joinedDate) return false
      
      const date = new Date(joinedDate + 'T12:00:00Z')
      if (isNaN(date.getTime())) return false
      if (date.getFullYear() > 2026) return false
      if (date.getFullYear() === 2026 && date.getMonth() > 5) return false
      
      return true
    })

    const results = alvos.map((assoc: any) => {
      const joinedDate = new Date((assoc.data_assinatura || assoc.created_at) + 'T12:00:00Z')
      const joinYear = joinedDate.getFullYear()
      const joinMonth = joinedDate.getMonth() + 1

      const assocLancs = lancamentos.filter((l: any) => l.associado_id === assoc.id)

      const adesaoGeral = assocLancs.find((l: any) => (l.categoria || '').toUpperCase().includes('ADESÃO') || (l.descricao || '').toUpperCase().includes('ADESÃO'))

      let divergencias: string[] = []
      const mesesStatus: any = {}

      MESES_AUDITADOS.forEach(({ mes, label }) => {
        if (joinYear === 2026 && mes < joinMonth) {
          mesesStatus[mes] = { status: 'n/a', msg: 'Não era associado' }
          return
        }

        const lancsNoMes = assocLancs.filter((l: any) => {
          if (!l.data) return false
          const [y, m] = l.data.split('-')
          return parseInt(y) === 2026 && parseInt(m) === mes
        })

        const lancMensalidade = lancsNoMes.find((l: any) => (l.categoria || '').toUpperCase().includes('MENSALIDADE') || (l.descricao || '').toUpperCase().includes('MENSALIDADE'))

        const getStatusUi = (lanc: any, tipo: 'Adesão' | 'Mensalidade', typeValue: string) => {
          if (!lanc) return { status: 'erro', msg: `Sem ${tipo}`, tipoFalta: typeValue, mesNum: mes }
          const st = (lanc.status || 'aberto').toLowerCase()
          if (['pago', 'efetivado', 'concluido', 'recebido'].includes(st)) {
            return { status: 'ok', msg: `${tipo} Paga`, tipoFalta: 'nenhuma', mesNum: mes }
          }
          if (st === 'atrasado') {
            return { status: 'warning_red', msg: `${tipo} Atrasada`, tipoFalta: 'nenhuma', mesNum: mes }
          }
          return { status: 'warning', msg: `${tipo} em Aberto`, tipoFalta: 'nenhuma', mesNum: mes }
        }

        if (joinYear === 2026 && mes === joinMonth) {
          if (!adesaoGeral) {
            divergencias.push(`Falta Adesão em ${label}`)
            mesesStatus[mes] = { status: 'erro', msg: 'Sem Adesão', tipoFalta: 'adesao', mesNum: mes }
          } else {
            mesesStatus[mes] = getStatusUi(adesaoGeral, 'Adesão', 'adesao')
          }
        } 
        else {
          if (!lancMensalidade) {
            divergencias.push(`Falta Mensalidade em ${label}`)
            mesesStatus[mes] = { status: 'erro', msg: 'Sem Mensalidade', tipoFalta: 'mensalidade', mesNum: mes }
          } else {
            mesesStatus[mes] = getStatusUi(lancMensalidade, 'Mensalidade', 'mensalidade')
          }
        }
      })

      let qtdAtrasos = 0
      Object.values(mesesStatus).forEach((st: any) => {
        if (st.status === 'warning_red' || (st.status === 'erro' && (st.tipoFalta === 'adesao' || st.tipoFalta === 'mensalidade'))) {
          qtdAtrasos++
        }
      })

      return {
        associado: assoc,
        joinedDate: joinedDate.toISOString().split('T')[0],
        joinMonth,
        joinYear,
        mesesStatus,
        divergencias,
        qtdAtrasos
      }
    })

    return results.sort((a, b) => b.divergencias.length - a.divergencias.length)
  }, [associados, lancamentos])

  const filteredAdesoesData = useMemo(() => {
    let data = adesoesData
    if (filterTypeAdesoes === 'divergencias') data = data.filter(d => d.divergencias.length > 0)
    if (searchQAdesoes) {
      const q = searchQAdesoes.toLowerCase()
      data = data.filter(d => d.associado.nome?.toLowerCase().includes(q) || d.associado.cpf?.includes(q))
    }
    if (filterIngressoMes !== 'todos') {
      data = data.filter(d => d.joinMonth === parseInt(filterIngressoMes))
    }
    if (filterTag === 'suspensao') {
      data = data.filter(d => d.qtdAtrasos === 2)
    } else if (filterTag === 'cancelamento') {
      data = data.filter(d => d.qtdAtrasos >= 3)
    }
    
    if (filterFaltaTipo === 'adesao') {
      data = data.filter(d => 
        Object.values(d.mesesStatus).some((st: any) => st.status === 'erro' && st.tipoFalta === 'adesao')
      )
    } else if (filterFaltaTipo === 'mensalidade') {
      data = data.filter(d => 
        Object.values(d.mesesStatus).some((st: any) => st.status === 'erro' && st.tipoFalta === 'mensalidade')
      )
    }
    
    return data
  }, [adesoesData, searchQAdesoes, filterTypeAdesoes, filterIngressoMes, filterTag, filterFaltaTipo])

  const handleOpenGerarModal = (rows: any[]) => {
    if (rows.length === 0) {
      alert('Não há faltas para gerar pendências.')
      return
    }
    setModalGerarData(rows)
    setMgConta('padrao')
    setMgDia('10')
    setMgStatus('atrasado')
    setMgValor('50,00')
    setMgCategoria('')
    setMgFormaPagamento('Boleto')
    setMgFixoVariavel('fixo')
    setMgOQueGerar('tudo')
  }

  const handleGerarPendencias = (row: any) => {
    handleOpenGerarModal([row])
  }

  const handleGerarFaltantesTodos = () => {
    const associadosComDivergencia = filteredAdesoesData.filter(d => d.divergencias.length > 0)
    handleOpenGerarModal(associadosComDivergencia)
  }

  const executeGerarPendencias = async () => {
    if (!modalGerarData) return
    
    setIsGenerating(true)
    try {
      const novasPendencias: any[] = []
      
      modalGerarData.forEach(row => {
        MESES_AUDITADOS.forEach(({ mes }) => {
          const status = row.mesesStatus[mes]
          if (status && status.status === 'erro' && (status.tipoFalta === 'adesao' || status.tipoFalta === 'mensalidade')) {
            
            // Pula se o usuário escolheu gerar apenas de um tipo específico e a falta for de outro tipo
            if (mgOQueGerar === 'adesao' && status.tipoFalta !== 'adesao') return;
            if (mgOQueGerar === 'mensalidade' && status.tipoFalta !== 'mensalidade') return;

            const dataVencimento = `2026-${String(mes).padStart(2, '0')}-${String(mgDia).padStart(2, '0')}`
            const valorFinal = mgValor ? parseFloat(mgValor.replace(',', '.')) : (row.associado.plano_valor || 35.00)
            
            novasPendencias.push({
              tipo: 'receita',
              categoria: mgCategoria || (status.tipoFalta === 'adesao' ? 'ADESÃO' : 'MENSALIDADE'),
              descricao: (status.tipoFalta === 'adesao' 
                ? `RECEB. DE ADESÃO - ${row.associado.nome.toUpperCase()}`
                : `RECEB. DE MENSALIDADE - ${row.associado.nome.toUpperCase()}`) + 
                (mgFixoVariavel === 'fixo' ? ' [FIXO]' : (mgFixoVariavel === 'variavel' ? ' [VARIÁVEL]' : '')),
              valor: valorFinal,
              status: mgStatus,
              forma_pagamento: mgFormaPagamento,
              associado_id: row.associado.id,
              data: dataVencimento,
              ...(mgConta !== 'padrao' ? { conta_id: mgConta } : {})
            })
          }
        })
      })
      
      if (novasPendencias.length > 0) {
        const res = await inserirBulk(novasPendencias)
        if (res.error) throw new Error(typeof res.error === 'string' ? res.error : 'Erro desconhecido ao inserir')
        alert(`Sucesso! ${novasPendencias.length} pendências foram geradas.`)
        setModalGerarData(null)
      } else {
        alert('Nenhuma falta real encontrada para gerar (mensalidades indevidas não geram pagamentos).')
      }
    } catch (err: any) {
      alert(`Erro ao gerar pendências em lote: ${err.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // ==========================================
  // LÓGICA DE AUDITORIA DE EXTRATOS (OFX)
  // ==========================================

  // Lançamentos filtrados pela conta bancária selecionada para auditoria
  const lancamentosDaConta = useMemo(() => {
    if (!lancamentos) return []
    if (!contaAuditId) return lancamentos
    return lancamentos.filter((l: any) => l.conta_id === contaAuditId)
  }, [lancamentos, contaAuditId])

  const extratosData = useMemo(() => {
    if (!ofxResult?.transactions.length || !lancamentos) return []

    const extrato = ofxResult.transactions

    // Mapa FITID → lançamentos da conta selecionada para detecção de duplicatas
    const fitidMap = new Map<string, any[]>()
    lancamentosDaConta.forEach((l: any) => {
      if (l.banco_transacao_id) {
        if (!fitidMap.has(l.banco_transacao_id)) fitidMap.set(l.banco_transacao_id, [])
        fitidMap.get(l.banco_transacao_id)!.push(l)
      }
    })

    const matchManualFeito = new Set<string>()

    return extrato.map(ofx => {
      let status: OFXAuditStatus = 'nao_encontrado'
      let matchLanc: any = null
      let duplicatas: any[] = []
      let msg = 'Não encontrado no sistema'
      let comoResolver = `Crie este lançamento no sistema: ${fmtR(ofx.amount)} em ${ofx.date.split('-').reverse().join('/')}`

      let matchedIds: string[] = []

      // 1. Busca exata por FITID
      let byFitid = ofx.fitid ? (fitidMap.get(ofx.fitid) || []) : []

      // Se há mais de 1 mas é Encontro de Contas (split), não é duplicata, é apenas a transação dividida
      const isSplit = byFitid.length > 1 && byFitid.some((l: any) => (l.descricao || '').toUpperCase().includes('ENCONTRO DE CONTAS'))
      if (isSplit) {
        matchedIds = byFitid.map((l: any) => l.id)
        byFitid = [byFitid[0]] // Mantém apenas o primeiro, a lógica de byFitid.length === 1 vai tratar o diff usando isEncontroContas
      }

      if (byFitid.length > 1) {
        // Duplicata: mesmo ID bancário vinculado a mais de um lançamento
        status = 'duplicata'
        matchLanc = byFitid[0]
        duplicatas = byFitid
        msg = `Duplicata: ${byFitid.length} lançamentos com mesmo ID bancário`
        comoResolver = `Remova os lançamentos duplicados. Mantenha apenas 1 dentre os IDs do sistema: ${byFitid.map((l: any) => l.id).join(', ')}`
      } else if (byFitid.length === 1) {
        matchLanc = byFitid[0]
        const matchLancTotal = Math.abs(matchLanc.valor) + extrairTaxa(matchLanc.descricao)
        const diff = Math.abs(matchLancTotal - Math.abs(ofx.amount))
        const isPago = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso'].includes((matchLanc.status || '').toLowerCase()) || matchLanc.conciliado
        const dataLanc = matchLanc.data_caixa || matchLanc.data_conciliacao || matchLanc.data || ''
        const dateMatches = dataLanc.substring(0, 7) === ofx.date.substring(0, 7)
        const isEncontroContas = (matchLanc.descricao || '').toUpperCase().includes('ENCONTRO DE CONTAS')

        if (diff > 0.01 && !isEncontroContas) {
          status = 'valor_divergente'
          msg = 'Valor divergente'
          comoResolver = `Edite o lançamento "${matchLanc.descricao}" e corrija o valor de ${fmtR(matchLancTotal)} para ${fmtR(Math.abs(ofx.amount))}`
        } else if (!isPago) {
          status = 'status_aberto'
          msg = 'Lançamento não efetivado'
          comoResolver = `O lançamento "${matchLanc.descricao}" está com status pendente. Marque-o como Efetivado (Pago).`
        } else if (!dateMatches) {
          status = 'data_divergente'
          msg = 'Mês/Ano divergente'
          comoResolver = `O mês/ano no sistema (${dataLanc.substring(0, 7)}) diverge do banco (${ofx.date.substring(0, 7)}). Edite o lançamento "${matchLanc.descricao}" para o mês correto.`
        } else {
          status = 'ok'
          msg = 'Conciliado OK'
          comoResolver = ''
        }
      } else {
        // 2. Fallback por CPF: cruza o CPF extraído do memo com associados vinculados a lançamentos no período
        const cpfOfx = ofx.cpf_extraido?.replace(/\D/g, '')
        let cpfMatched = false

        if (cpfOfx && cpfOfx.length >= 11) {
          const assocMatch = associados.find((a: any) => (a.cpf || '').replace(/\D/g, '') === cpfOfx)
          if (assocMatch) {
            const dataOfx = new Date(ofx.date).getTime()
            const porCpf = lancamentosDaConta.find((l: any) => {
              if (l.associado_id !== assocMatch.id) return false
              if (matchManualFeito.has(l.id)) return false
              // Ignorar se já vai ser casado por FITID exato neste mesmo arquivo
              if (l.banco_transacao_id && fitidMap.has(l.banco_transacao_id)) return false
              const dataL = l.data_caixa || l.data_conciliacao || l.data
              if (!dataL) return false
              const diffDias = Math.abs(new Date(dataL).getTime() - dataOfx) / (1000 * 60 * 60 * 24)
              const lTotal = Math.abs(l.valor) + extrairTaxa(l.descricao)
              const valueMatches = Math.abs(lTotal - Math.abs(ofx.amount)) < 0.01
              const isPago = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso'].includes((l.status || '').toLowerCase()) || l.conciliado
              return isPago && diffDias <= 3 && valueMatches
            })
            if (porCpf) {
              matchLanc = porCpf
              matchManualFeito.add(porCpf.id)
              status = 'manual'
              msg = `Provável match por CPF (${assocMatch.nome})`
              comoResolver = `Encontramos "${porCpf.descricao}" do mesmo CPF. Use o botão "Acatar Correção" para vincular automaticamente.`
              cpfMatched = true
            } else {
              // CPF encontrado mas sem lançamento correspondente
              msg = `Não encontrado — remetente identificado: ${assocMatch.nome}`
              comoResolver = `Crie um lançamento de ${ofx.type === 'CREDIT' ? 'receita' : 'despesa'} de ${fmtR(ofx.amount)} em ${ofx.date.split('-').reverse().join('/')} vinculado ao associado "${assocMatch.nome}" e preencha o ID Bancário com: ${ofx.fitid}`
            }
          }
        }

        // 3. Fallback genérico: busca por data + valor + tipo
        if (!cpfMatched) {
          const tipoEsperado = ofx.type === 'CREDIT' ? 'receita' : 'despesa'
          const ofxWords = (ofx.memo || '').toLowerCase().split(/[\s\-_]+/).filter(w => w.length >= 4 && !['transf', 'recebida', 'pix', 'ted', 'doc', 'pagamento', 'boleto', 'tarifa', 'taxa', 'receb'].includes(w));
          
          const mesmoDiaValor = lancamentosDaConta.find((l: any) => {
            if (!l.data) return false
            if (matchManualFeito.has(l.id)) return false
            // Ignorar se já vai ser casado por FITID exato neste mesmo arquivo
            if (l.banco_transacao_id && fitidMap.has(l.banco_transacao_id)) return false
            const isPago = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso'].includes((l.status || '').toLowerCase()) || l.conciliado
            const tipoMatches = (l.tipo || '').toLowerCase() === tipoEsperado
            const lTotal = Math.abs(l.valor) + extrairTaxa(l.descricao)
            const valueMatches = Math.abs(lTotal - Math.abs(ofx.amount)) < 0.01
            const dataLancFallback = l.data_caixa || l.data_conciliacao || l.data
            if (!dataLancFallback) return false
            const diffDias = Math.abs(new Date(dataLancFallback).getTime() - new Date(ofx.date).getTime()) / (1000 * 60 * 60 * 24)
            
            const descWords = (l.descricao || '').toLowerCase()
            const nameMatch = ofxWords.length === 0 || ofxWords.some(w => descWords.includes(w))

            return isPago && tipoMatches && valueMatches && diffDias <= 3 && nameMatch
          })

          if (mesmoDiaValor) {
            matchLanc = mesmoDiaValor
            matchManualFeito.add(mesmoDiaValor.id)
            status = 'manual'
            msg = 'Pgto manual (Match no mesmo Mês)'
            comoResolver = `Encontramos o lançamento "${mesmoDiaValor.descricao}" com mesmo valor no mês. Use o botão "Acatar Correção" para vincular automaticamente.`
          } else {
            // 4. Fallback Conta Errada: busca em TODAS as contas
            const mesmoDiaValorOutraConta = lancamentos.find((l: any) => {
              if (!l.data) return false
              if (matchManualFeito.has(l.id)) return false
              if (l.banco_transacao_id && fitidMap.has(l.banco_transacao_id)) return false
              const isPago = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso'].includes((l.status || '').toLowerCase()) || l.conciliado
              const tipoMatches = (l.tipo || '').toLowerCase() === tipoEsperado
              const lTotal = Math.abs(l.valor) + extrairTaxa(l.descricao)
              const valueMatches = Math.abs(lTotal - Math.abs(ofx.amount)) < 0.01
              const dataLancFallback = l.data_caixa || l.data_conciliacao || l.data
              if (!dataLancFallback) return false
              const diffDias = Math.abs(new Date(dataLancFallback).getTime() - new Date(ofx.date).getTime()) / (1000 * 60 * 60 * 24)
              
              const descWords = (l.descricao || '').toLowerCase()
              const nameMatch = ofxWords.length === 0 || ofxWords.some(w => descWords.includes(w))

              return isPago && tipoMatches && valueMatches && diffDias <= 3 && nameMatch
            })

            if (mesmoDiaValorOutraConta) {
              matchLanc = mesmoDiaValorOutraConta
              matchManualFeito.add(mesmoDiaValorOutraConta.id)
              status = 'manual_outra_conta'
              msg = 'Pgto manual (Outra Conta)'
              const contaNome = contas.find((c: any) => c.id === mesmoDiaValorOutraConta.conta_id)?.nome || 'Outra conta'
              comoResolver = `O lançamento "${mesmoDiaValorOutraConta.descricao}" com mesmo valor está na conta "${contaNome}". Acate para alterar a conta e vincular.`
            }
          }
        }
      }

      if (matchLanc && matchedIds.length === 0) {
        matchedIds = [matchLanc.id]
      }
      return { ofx, status, msg, matchLanc, duplicatas, comoResolver, matchedIds }
    }).sort((a, b) => {
      const order: Record<OFXAuditStatus, number> = { duplicata: 0, valor_divergente: 1, data_divergente: 2, status_aberto: 3, manual_outra_conta: 4, manual: 5, nao_encontrado: 6, ok: 7 }
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
      return new Date(a.ofx.date).getTime() - new Date(b.ofx.date).getTime()
    })
  }, [ofxResult, lancamentosDaConta, associados])

  // Lançamentos efetivados na conta selecionada que NÃO tiveram correspondência no extrato OFX
  const fantasmas = useMemo(() => {
    if (!ofxResult?.transactions.length || !lancamentos) return []
    const extrato = ofxResult.transactions
    const datas = extrato.map(t => t.date).sort()
    const periodoInicio = datas[0]
    const periodoFim = datas[datas.length - 1]
    const statusEfetivados = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso']

    // IDs dos lançamentos que já foram casados com alguma transação OFX
    const lancamentosMatchados = new Set<string>()
    extratosData.forEach(d => {
      d.matchedIds?.forEach((id: string) => lancamentosMatchados.add(id))
    })

    return lancamentosDaConta
      .filter((l: any) => {
        const dataL = l.data_caixa || l.data_conciliacao || l.data
        if (!dataL) return false
        const dataLTrunc = dataL.substring(0, 10)
        if (dataLTrunc < periodoInicio || dataLTrunc > periodoFim) return false
        const isEfetivado = statusEfetivados.includes((l.status || '').toLowerCase()) || l.conciliado
        if (!isEfetivado) return false
        // Mostra qualquer lançamento que não casou com nenhuma transação OFX
        return !lancamentosMatchados.has(l.id)
      })
      .map((l: any) => {
        const temFitid = !!l.banco_transacao_id
        const comoResolver = temFitid
          ? `O lançamento tem ID bancário "${l.banco_transacao_id}" mas não consta no extrato OFX. Verifique se o período do arquivo OFX cobre esta data.`
          : `Este lançamento não possui ID bancário vinculado. Busque a transação correspondente no extrato Cora e vincule o ID.`
        return { lancamento: l, temFitid, comoResolver }
      })
      .sort((a, b) => {
        const dA = a.lancamento.data_caixa || a.lancamento.data_conciliacao || a.lancamento.data || ''
        const dB = b.lancamento.data_caixa || b.lancamento.data_conciliacao || b.lancamento.data || ''
        return dA.localeCompare(dB)
      })
  }, [ofxResult, lancamentosDaConta, extratosData])

  // Resumo quantitativo da auditoria + comparação de variação de caixa
  const auditSummary = useMemo(() => {
    if (!ofxResult?.transactions.length || extratosData.length === 0) return null
    const extrato = ofxResult.transactions
    const datas = extrato.map(t => t.date).sort()
    const periodoInicio = datas[0] || ''
    const periodoFim = datas[datas.length - 1] || ''
    const ok = extratosData.filter(d => d.status === 'ok').length
    const divergencias = extratosData.filter(d => ['valor_divergente', 'data_divergente', 'status_aberto'].includes(d.status)).length
    const naoEncontrado = extratosData.filter(d => d.status === 'nao_encontrado').length
    const manual = extratosData.filter(d => d.status === 'manual').length
    const duplicata = extratosData.filter(d => d.status === 'duplicata').length
    // Variação de caixa no período segundo o banco
    const entradasBanco = extrato.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0)
    const saidasBanco = extrato.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + Math.abs(t.amount), 0)
    const variacaoBanco = entradasBanco - saidasBanco

    // Variação de caixa no período segundo os lançamentos efetivados NA CONTA SELECIONADA
    const statusEfetivados = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso']
    const lancEfetivos = lancamentosDaConta.filter((l: any) => {
      const dataL = l.data_caixa || l.data_conciliacao || l.data
      if (!dataL) return false
      const dataLTrunc = dataL.substring(0, 10)
      if (dataLTrunc < periodoInicio || dataLTrunc > periodoFim) return false
      return statusEfetivados.includes((l.status || '').toLowerCase()) || l.conciliado
    })
    
    const entradasSistema = lancEfetivos.filter((l: any) => l.tipo === 'receita').reduce((acc: any, l: any) => acc + Math.abs(l.valor) + extrairTaxa(l.descricao), 0)
    const saidasSistema = lancEfetivos.filter((l: any) => l.tipo === 'despesa').reduce((acc: any, l: any) => acc + Math.abs(l.valor) + extrairTaxa(l.descricao), 0)
    const variacaoSistema = entradasSistema - saidasSistema

    const diferencaVariacao = variacaoBanco - variacaoSistema
    const contaNome = contas.find((c: any) => c.id === contaAuditId)?.nome || (contaAuditId ? '' : 'Todas as contas')
    
    const entradasSistPorConta = lancEfetivos.filter((l: any) => l.tipo === 'receita').reduce((acc: any, l: any) => {
      const nome = contas.find((c: any) => c.id === l.conta_id)?.nome || 'Sem Conta'
      acc[nome] = (acc[nome] || 0) + Math.abs(l.valor) + extrairTaxa(l.descricao)
      return acc
    }, {} as Record<string, number>)

    const saidasSistPorConta = lancEfetivos.filter((l: any) => l.tipo === 'despesa').reduce((acc: any, l: any) => {
      const nome = contas.find((c: any) => c.id === l.conta_id)?.nome || 'Sem Conta'
      acc[nome] = (acc[nome] || 0) + Math.abs(l.valor) + extrairTaxa(l.descricao)
      return acc
    }, {} as Record<string, number>)

    return { 
      total: extratosData.length, ok, divergencias, naoEncontrado, manual, duplicata, 
      entradasBanco, saidasBanco, variacaoBanco, 
      entradasSistema, saidasSistema, variacaoSistema, 
      diferencaVariacao, periodoInicio, periodoFim, contaNome,
      entradasSistPorConta, saidasSistPorConta
    }
  }, [ofxResult, extratosData, lancamentosDaConta, contaAuditId, contas])

  const filteredExtratosData = useMemo(() => {
    let data = extratosData
    if (filterTypeExtratos === 'divergencias') data = data.filter(d => d.status !== 'ok')
    if (filterStatusExtratos !== 'todos') data = data.filter(d => d.status === filterStatusExtratos)
    if (searchQExtratos) {
      const q = searchQExtratos.toLowerCase()
      data = data.filter(d =>
        d.ofx.memo.toLowerCase().includes(q) ||
        (d.matchLanc && d.matchLanc.descricao?.toLowerCase().includes(q))
      )
    }
    return data
  }, [extratosData, searchQExtratos, filterTypeExtratos, filterStatusExtratos])


  // ==========================================
  // EXPORTS
  // ==========================================
  const handleExportAdesoes = () => {
    const wsData = filteredAdesoesData.map(d => {
      const row: any = {
        'Associado': d.associado.nome,
        'CPF': d.associado.cpf || '--',
        'Data Ingresso': d.joinedDate.split('-').reverse().join('/'),
      }
      MESES_AUDITADOS.forEach(({ mes, label }) => {
        row[label] = d.mesesStatus[mes].msg
      })
      row['Divergências Encontradas'] = d.divergencias.join(' | ') || 'Nenhuma'
      return row
    })
    const ws = XLSX.utils.json_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria_Adesoes')
    XLSX.writeFile(wb, 'Auditoria_Adesoes_Mensalidades.xlsx')
  }

  const handleCriarConciliar = async () => {
    if (!importTarget) return
    if (importTarget.type === 'CREDIT' && !newLancData.associado_id) return alert('Selecione um associado!')
    if (importTarget.type === 'DEBIT' && !newLancData.fornecedor_id) return alert('Selecione um fornecedor!')
    if (importActionType === 'criar' && !newLancData.categoria) return alert('Selecione a categoria!')
    if (importActionType === 'vincular' && !vinculoLancamentoId) return alert('Selecione o lançamento que deseja vincular!')
    if (!contaAuditId) return alert('Selecione a conta bancária no topo da tela antes de conciliar.')

    try {
      setIsCreatingLanc(true)

      if (importActionType === 'criar') {
        const assoc = associados.find(a => a.id === newLancData.associado_id)
        const forn = fornecedores.find(f => f.id === newLancData.fornecedor_id)
        const nomeAlvo = (importTarget.type === 'CREDIT' ? assoc?.nome : forn?.nome) || ''
        const tipoPrefixo = importTarget.type === 'CREDIT' ? 'RECEB. DE' : 'PGTO. DE'
        const categoriaFormatada = newLancData.categoria.toUpperCase()
        const descricaoFormatada = `${tipoPrefixo} ${categoriaFormatada} - ${nomeAlvo.toUpperCase()}`

        const novo = {
          descricao: descricaoFormatada,
          banco_original_memo: importTarget.memo,
          associado_id: importTarget.type === 'CREDIT' ? newLancData.associado_id : null,
          fornecedor_id: importTarget.type === 'DEBIT' ? newLancData.fornecedor_id : null,
          categoria: newLancData.categoria,
          valor: Math.abs(importTarget.amount),
          tipo: (importTarget.type === 'CREDIT' ? 'receita' : 'despesa') as any,
          data: importTarget.date,
          status: 'pago' as any,
          conta_id: contaAuditId,
          forma_pagamento: (importTarget.metodo_inferido || 'outros') as any,
          banco_transacao_id: importTarget.fitid,
          tenant_id: associados[0]?.tenant_id || '',
          force_create: true
        }
        
        const { error } = await inserirBulk([novo] as any)
        if (error) {
          alert('Erro ao criar lançamento no BD: ' + (typeof error === 'string' ? error : JSON.stringify(error)))
          return
        }
        alert('Lançamento criado e conciliado com sucesso!')
      } else {
        // Lógica para vincular
        const payload = {
          status: 'pago' as any,
          banco_transacao_id: importTarget.fitid,
          banco_original_memo: importTarget.memo,
          data: importTarget.date,
          data_caixa: importTarget.date,
          valor: Math.abs(importTarget.amount),
          conta_id: contaAuditId,
          forma_pagamento: (importTarget.metodo_inferido || 'outros') as any,
        }
        const { error } = await atualizar(vinculoLancamentoId, payload)
        if (error) {
          alert('Erro ao vincular lançamento: ' + (typeof error === 'string' ? error : JSON.stringify(error)))
          return
        }
        alert('Lançamento atualizado e conciliado com sucesso!')
      }

      setImportTarget(null)
      setNewLancData({ associado_id: '', fornecedor_id: '', categoria: '' })
      setVinculoLancamentoId('')
      setImportActionType('criar')
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message)
    } finally {
      setIsCreatingLanc(false)
    }
  }

  const handleExportExtratos = () => {
    const wsData = filteredExtratosData.map(d => ({
      'Data (Banco)': d.ofx.date.split('-').reverse().join('/'),
      'Tipo': d.ofx.type === 'CREDIT' ? 'Receita' : 'Despesa',
      'Descrição (Banco)': d.ofx.memo,
      'Valor (Banco)': fmtR(Math.abs(d.ofx.amount)),
      'Lançamento (Sistema)': d.matchLanc ? d.matchLanc.descricao : '--',
      'Valor (Sistema)': d.matchLanc ? fmtR(Math.abs(d.matchLanc.valor)) : '--',
      'Categoria (Sistema)': d.matchLanc ? (d.matchLanc.categoria || '--') : '--',
      'Status de Auditoria': d.msg,
      'Como Resolver': d.comoResolver || 'OK — Nenhuma ação necessária'
    }))
    const ws = XLSX.utils.json_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria_Extratos')
    XLSX.writeFile(wb, 'Auditoria_Extratos_OFX.xlsx')
  }

  const totaisTabela = useMemo(() => {
    const totalBanco = filteredExtratosData.reduce((acc, row) => acc + (row.ofx.type === 'CREDIT' ? Math.abs(row.ofx.amount) : -Math.abs(row.ofx.amount)), 0)
    const totalSistema = filteredExtratosData.reduce((acc, row) => {
      if (!row.matchLanc) return acc
      const lTotal = Math.abs(row.matchLanc.valor) + extrairTaxa(row.matchLanc.descricao)
      return acc + (row.matchLanc.tipo === 'receita' ? lTotal : -lTotal)
    }, 0)
    return { totalBanco, totalSistema }
  }, [filteredExtratosData])

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Analisando milhares de transações...</div>
  }

  return (
    <div className="flex flex-col flex-1 gap-8 animate-in fade-in duration-500 pb-20 p-8">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-900 flex items-center justify-center text-white shadow-lg shadow-indigo-900/20">
            <ShieldCheck size={28} />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 px-2.5 py-1 mb-2 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
              <span>CONTROLE DE QUALIDADE</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Auditoria Financeira</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70 mt-1">
              Validação de Regras e Conciliações
            </p>
          </div>
        </div>
        
        <button 
          onClick={activeTab === 'adesoes' ? handleExportAdesoes : handleExportExtratos} 
          className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Download size={16} />
          Exportar Excel ({activeTab === 'adesoes' ? 'Adesões' : 'Extratos'})
        </button>
      </div>

      {/* TABS MENU */}
      <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-sm self-start">
        <button
          onClick={() => setActiveTab('adesoes')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'adesoes' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
        >
          <FileText size={16} />
          Adesões vs Mensalidades
        </button>
        <button
          onClick={() => setActiveTab('extratos')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'extratos' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
        >
          <Upload size={16} />
          Auditoria de Extratos (OFX)
        </button>
      </div>

      {/* CONTENT: ADESÕES */}
      {activeTab === 'adesoes' && (
        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-xl shadow-slate-200/40 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <button 
                onClick={() => setFilterTypeAdesoes('divergencias')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterTypeAdesoes === 'divergencias' ? 'bg-white text-rose-600 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Com Divergências ({adesoesData.filter(d => d.divergencias.length > 0).length})
              </button>
              <button 
                onClick={() => setFilterTypeAdesoes('todos')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterTypeAdesoes === 'todos' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Todos Ativos ({adesoesData.length})
              </button>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
              {filteredAdesoesData.some(d => d.divergencias.length > 0) && (
                <button 
                  onClick={handleGerarFaltantesTodos}
                  disabled={isGenerating}
                  className="px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50"
                >
                  Gerar Faltantes ({filteredAdesoesData.filter(d => d.divergencias.length > 0).length})
                </button>
              )}
              <select 
                value={filterTag}
                onChange={e => setFilterTag(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:border-slate-400"
              >
                <option value="todas">Qualquer Tag</option>
                <option value="suspensao">Suspensão (2 Atrasos)</option>
                <option value="cancelamento">Cancelamento (3+ Atrasos)</option>
              </select>

              <select 
                value={filterFaltaTipo}
                onChange={e => setFilterFaltaTipo(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:border-slate-400"
              >
                <option value="todas">Qualquer Falta</option>
                <option value="adesao">Falta Adesão</option>
                <option value="mensalidade">Falta Mensalidade</option>
              </select>

              <select 
                value={filterIngressoMes}
                onChange={e => setFilterIngressoMes(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:border-slate-400"
              >
                <option value="todos">Qualquer Mês (Ingresso)</option>
                <option value="1">Janeiro</option>
                <option value="2">Fevereiro</option>
                <option value="3">Março</option>
                <option value="4">Abril</option>
                <option value="5">Maio</option>
                <option value="6">Junho</option>
                <option value="7">Julho</option>
                <option value="8">Agosto</option>
                <option value="9">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>
              
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar associado..."
                  value={searchQAdesoes}
                  onChange={e => setSearchQAdesoes(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Associado</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresso</th>
                  {MESES_AUDITADOS.map(m => (
                    <th key={m.mes} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{m.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAdesoesData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-slate-700">{row.associado.nome}</div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {row.qtdAtrasos >= 3 && (
                          <div className="px-2 py-0.5 bg-rose-600 text-white rounded text-[8px] font-black uppercase tracking-widest shadow-sm">
                            Cancelamento
                          </div>
                        )}
                        {row.qtdAtrasos === 2 && (
                          <div className="px-2 py-0.5 bg-orange-500 text-white rounded text-[8px] font-black uppercase tracking-widest shadow-sm">
                            Suspensão
                          </div>
                        )}
                      </div>

                      {row.divergencias.length > 0 && (
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="text-[9px] font-bold text-rose-500 uppercase">
                            {row.divergencias.length} Divergência(s)
                          </div>
                          <button 
                            onClick={() => handleGerarPendencias(row)}
                            disabled={isGenerating}
                            className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-[8px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                          >
                            Gerar Faltantes
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-medium text-slate-500">
                      {row.joinedDate.split('-').reverse().join('/')}
                    </td>
                    {MESES_AUDITADOS.map(m => {
                      const status = row.mesesStatus[m.mes]
                      return (
                        <td key={m.mes} className="px-6 py-4 text-center">
                          {status.status === 'n/a' ? (
                            <span className="text-[10px] font-bold text-slate-300 uppercase">-</span>
                          ) : status.status === 'erro' ? (
                            <div className="flex flex-col items-center gap-1 group relative">
                              <AlertTriangle size={16} className="text-rose-500" />
                              <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider">{status.msg}</span>
                            </div>
                          ) : status.status === 'warning' ? (
                            <div className="flex flex-col items-center gap-1 group relative">
                              <AlertTriangle size={16} className="text-amber-500" />
                              <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider text-center">{status.msg}</span>
                            </div>
                          ) : status.status === 'warning_red' ? (
                            <div className="flex flex-col items-center gap-1 group relative">
                              <AlertTriangle size={16} className="text-orange-500" />
                              <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider text-center">{status.msg}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <CheckCircle2 size={16} className="text-emerald-500" />
                              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider text-center">{status.msg}</span>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {filteredAdesoesData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400 font-medium">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENT: EXTRATOS */}
      {activeTab === 'extratos' && (
        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-xl shadow-slate-200/40 animate-in fade-in duration-300">
          {!ofxResult || ofxResult.transactions.length === 0 ? (
            <div className="max-w-xl mx-auto py-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Cruze seu Extrato Bancário</h3>
                <p className="text-sm text-slate-500 mt-2">Faça o upload de um arquivo OFX para que o sistema identifique se alguma transação do banco ficou de fora do sistema ou foi conciliada com valor divergente.</p>
              </div>
              {/* Seletor de conta ANTES do upload */}
              <div className="mb-6 flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Conta Bancária deste Extrato
                </label>
                <select
                  value={contaAuditId}
                  onChange={e => setContaAuditId(e.target.value)}
                  className="w-full px-4 py-3 bg-indigo-50 border-2 border-indigo-200 rounded-2xl text-sm font-bold text-indigo-700 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">-- Selecione a conta (ex: Cora) --</option>
                  {contas.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                {!contaAuditId && (
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">
                    ⚠ Selecione a conta para uma auditoria precisa (sem ela, todas as contas são comparadas)
                  </p>
                )}
              </div>
              <OFXUpload onUpload={(data: any) => setOfxResult(parseOFX(data))} />
            </div>
          ) : (
            <>
              {/* CARDS DE RESUMO DA AUDITORIA */}
              {auditSummary && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Extrato</div>
                      <div className="text-2xl font-black text-slate-800">{auditSummary.total}</div>
                      <div className="text-[9px] text-slate-400 mt-1">transações</div>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                      <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Conciliadas OK</div>
                      <div className="text-2xl font-black text-emerald-700">{auditSummary.ok}</div>
                      <div className="text-[9px] text-emerald-500 mt-1">✓ sem divergência</div>
                    </div>
                    <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                      <div className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Não Encontradas</div>
                      <div className="text-2xl font-black text-rose-700">{auditSummary.naoEncontrado}</div>
                      <div className="text-[9px] text-rose-500 mt-1">ausentes no sistema</div>
                    </div>
                    <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                      <div className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Divergências</div>
                      <div className="text-2xl font-black text-orange-700">{auditSummary.divergencias}</div>
                      <div className="text-[9px] text-orange-500 mt-1">valor, data ou status</div>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                      <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Pgto Manual</div>
                      <div className="text-2xl font-black text-amber-700">{auditSummary.manual}</div>
                      <div className="text-[9px] text-amber-500 mt-1">sem FITID vinculado</div>
                    </div>
                    <div className={`rounded-2xl p-4 border ${Math.abs(auditSummary.diferencaVariacao) < 0.01 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                      <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${Math.abs(auditSummary.diferencaVariacao) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Diferença Líquida
                      </div>
                      <div className={`text-2xl font-black ${Math.abs(auditSummary.diferencaVariacao) < 0.01 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {fmtR(Math.abs(auditSummary.diferencaVariacao))}
                      </div>
                      <div className={`text-[9px] mt-1 ${Math.abs(auditSummary.diferencaVariacao) < 0.01 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {Math.abs(auditSummary.diferencaVariacao) < 0.01 ? '✓ sistema fechado' : 'divergência nos totais'}
                      </div>
                    </div>
                  </div>
  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><ArrowDownRight size={14} className="text-emerald-500"/> Total de Entradas</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Extrato (Banco)</span><span className="text-sm font-black text-slate-800">{fmtR(auditSummary.entradasBanco)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Sistema (Lançamentos)</span><span className="text-sm font-black text-slate-800">{fmtR(auditSummary.entradasSistema)}</span></div>
                        {Object.entries(auditSummary.entradasSistPorConta || {}).map(([nomeConta, valor]) => (
                          <div key={nomeConta} className="flex justify-between items-center pl-2 border-l border-emerald-200 mt-1 opacity-75">
                            <span className="text-[9px] font-bold text-slate-500">{nomeConta}</span>
                            <span className="text-[10px] font-bold text-slate-600">{fmtR(valor as number)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><ArrowUpRight size={14} className="text-rose-500"/> Total de Saídas</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Extrato (Banco)</span><span className="text-sm font-black text-slate-800">{fmtR(auditSummary.saidasBanco)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Sistema (Lançamentos)</span><span className="text-sm font-black text-slate-800">{fmtR(auditSummary.saidasSistema)}</span></div>
                        {Object.entries(auditSummary.saidasSistPorConta || {}).map(([nomeConta, valor]) => (
                          <div key={nomeConta} className="flex justify-between items-center pl-2 border-l border-rose-200 mt-1 opacity-75">
                            <span className="text-[9px] font-bold text-slate-500">{nomeConta}</span>
                            <span className="text-[10px] font-bold text-slate-600">{fmtR(valor as number)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={`border rounded-2xl p-4 flex flex-col justify-between ${Math.abs(auditSummary.diferencaVariacao) < 0.01 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
                      <div className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${Math.abs(auditSummary.diferencaVariacao) < 0.01 ? 'text-emerald-700' : 'text-orange-700'}`}>
                        <Activity size={14} /> Resultado (Líquido)
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-600 opacity-80">Extrato (Banco)</span><span className="text-sm font-black text-slate-800">{fmtR(auditSummary.variacaoBanco)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-600 opacity-80">Sistema (Lançamentos)</span><span className="text-sm font-black text-slate-800">{fmtR(auditSummary.variacaoSistema)}</span></div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* PERÍODO + SALDO DO BANCO + CONTA */}
              {auditSummary && (
                <div className="flex flex-wrap gap-3 mb-6">
                  {auditSummary.contaNome && (
                    <div className="flex items-center gap-2 bg-indigo-50 border-2 border-indigo-200 rounded-xl px-4 py-2">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Conta:</span>
                      <span className="text-xs font-bold text-indigo-700">{auditSummary.contaNome}</span>
                    </div>
                  )}
                  {auditSummary.periodoInicio && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Período:</span>
                      <span className="text-xs font-bold text-slate-700">
                        {auditSummary.periodoInicio.split('-').reverse().join('/')} → {auditSummary.periodoFim.split('-').reverse().join('/')}
                      </span>
                    </div>
                  )}
                  {ofxResult.ledgerBal !== undefined && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Final (Banco):</span>
                      <span className="text-xs font-bold text-slate-700">{fmtR(ofxResult.ledgerBal)}</span>
                    </div>
                  )}
                  {ofxResult.acctId && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID Conta (OFX):</span>
                      <span className="text-xs font-bold text-slate-700">{ofxResult.acctId}</span>
                    </div>
                  )}
                  {/* Seletor de conta mesmo após upload */}
                  <select
                    value={contaAuditId}
                    onChange={e => setContaAuditId(e.target.value)}
                    className="px-4 py-2 bg-indigo-50 border-2 border-indigo-200 rounded-xl text-[10px] font-black text-indigo-700 outline-none focus:border-indigo-500 uppercase tracking-widest transition-colors"
                  >
                    <option value="">Todas as contas</option>
                    {contas.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* TOOLBAR */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button
                    onClick={() => setFilterTypeExtratos('divergencias')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterTypeExtratos === 'divergencias' ? 'bg-white text-rose-600 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Divergências ({extratosData.filter(d => d.status !== 'ok').length})
                  </button>
                  <button
                    onClick={() => setFilterTypeExtratos('todos')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterTypeExtratos === 'todos' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Extrato Completo ({extratosData.length})
                  </button>
                  <select
                    value={filterStatusExtratos}
                    onChange={e => setFilterStatusExtratos(e.target.value)}
                    className="px-3 py-2 bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-500 border-l border-slate-200 outline-none hover:text-slate-700 cursor-pointer ml-2"
                  >
                    <option value="todos">Todos Status</option>
                    <option value="valor_divergente">Valor Divergente</option>
                    <option value="data_divergente">Data Divergente</option>
                    <option value="status_aberto">Não Efetivado</option>
                    <option value="manual">Pgto Manual</option>
                    <option value="nao_encontrado">Não Encontrado</option>
                    <option value="duplicata">Duplicata</option>
                  </select>
                  {selectedDivergencias.length > 0 && (
                    <button
                      onClick={handleCorrigirLote}
                      className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 size={14} /> Corrigir Selecionados ({selectedDivergencias.length})
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar descrição..."
                      value={searchQExtratos}
                      onChange={e => setSearchQExtratos(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:border-slate-400"
                    />
                  </div>
                  <button
                    onClick={() => setOfxResult(null)}
                    className="flex-shrink-0 flex items-center justify-center px-4 h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors text-[10px] font-bold uppercase tracking-widest"
                    title="Carregar outro OFX"
                  >
                    Novo OFX
                  </button>
                </div>
              </div>

              {/* TABELA COMPARATIVA EXTRATO vs SISTEMA */}
              <div className="overflow-x-auto rounded-3xl border border-slate-100 mb-8">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-10 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={filteredExtratosData.length > 0 && filteredExtratosData.filter(d => ['valor_divergente', 'data_divergente', 'status_aberto', 'manual', 'manual_outra_conta'].includes(d.status)).every(d => selectedDivergencias.includes(d.ofx.fitid))}
                          onChange={e => {
                            if (e.target.checked) {
                              const fixable = filteredExtratosData.filter(d => ['valor_divergente', 'data_divergente', 'status_aberto', 'manual', 'manual_outra_conta'].includes(d.status)).map(d => d.ofx.fitid)
                              setSelectedDivergencias(fixable)
                            } else {
                              setSelectedDivergencias([])
                            }
                          }}
                          title="Selecionar todas as divergências corrigíveis"
                        />
                      </th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transação (Banco)</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Banco</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lançamento (Sistema)</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Sistema</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Como Resolver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredExtratosData.map((row, i) => {
                      const isFixable = ['valor_divergente', 'data_divergente', 'status_aberto', 'manual', 'manual_outra_conta'].includes(row.status)
                      return (
                      <tr key={i} className={`hover:bg-slate-50/50 transition-colors ${row.status !== 'ok' ? 'bg-rose-50/10' : ''}`}>
                        <td className="px-4 py-3 text-center">
                          {isFixable && (
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              checked={selectedDivergencias.includes(row.ofx.fitid)}
                              onChange={e => {
                                if (e.target.checked) setSelectedDivergencias(prev => [...prev, row.ofx.fitid])
                                else setSelectedDivergencias(prev => prev.filter(id => id !== row.ofx.fitid))
                              }}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                          {row.ofx.date.split('-').reverse().join('/')}
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <div className="text-xs font-bold text-slate-800 truncate" title={row.ofx.memo}>{row.ofx.memo}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {row.ofx.type === 'CREDIT'
                              ? <span className="text-[9px] font-black text-emerald-500 uppercase">Receita</span>
                              : <span className="text-[9px] font-black text-rose-500 uppercase">Despesa</span>}
                            {row.ofx.metodo_inferido && (
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{row.ofx.metodo_inferido}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-700 whitespace-nowrap">
                          {fmtR(Math.abs(row.ofx.amount))}
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          {row.matchLanc ? (
                            <div className="flex justify-between items-start gap-2 group">
                              <div className="overflow-hidden">
                                <div className="text-xs font-medium text-slate-600 truncate" title={row.matchLanc.descricao}>
                                  {row.matchLanc.descricao || '--'}
                                </div>
                                {row.matchLanc.categoria && (
                                  <div className="text-[9px] text-slate-400 font-medium truncate">{row.matchLanc.categoria}</div>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoverLancamento(row.matchLanc.id, row.matchLanc.descricao)}
                                className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                                title="Excluir este lançamento permanentemente"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-rose-400 font-bold uppercase">— Sem correspondência</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {row.matchLanc ? (
                            <span className={`text-xs font-bold ${
                              Math.abs((Math.abs(row.matchLanc.valor) + extrairTaxa(row.matchLanc.descricao)) - Math.abs(row.ofx.amount)) < 0.01
                                ? 'text-slate-700'
                                : 'text-rose-600 font-black'
                            }`}>
                              {fmtR(Math.abs(row.matchLanc.valor) + extrairTaxa(row.matchLanc.descricao))}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3 min-w-[130px]">
                          {row.status === 'ok' && (
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">OK</span>
                            </div>
                          )}
                          {row.status === 'valor_divergente' && (
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle size={14} className="text-orange-500 shrink-0" />
                              <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Valor Divergente</span>
                            </div>
                          )}
                          {row.status === 'data_divergente' && (
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle size={14} className="text-orange-500 shrink-0" />
                              <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Data Divergente</span>
                            </div>
                          )}
                          {row.status === 'status_aberto' && (
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle size={14} className="text-orange-500 shrink-0" />
                              <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Não Efetivado</span>
                            </div>
                          )}
                          {row.status === 'manual' && (
                            <div className="flex items-center gap-1.5">
                              <Info size={14} className="text-amber-500 shrink-0" />
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Pgto Manual</span>
                            </div>
                          )}
                          {row.status === 'manual_outra_conta' && (
                            <div className="flex items-center gap-1.5">
                              <Info size={14} className="text-amber-500 shrink-0" />
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Outra Conta</span>
                            </div>
                          )}
                          {row.status === 'nao_encontrado' && (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <AlertTriangle size={14} className="text-rose-500 shrink-0" />
                                <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Não Encontrado</span>
                              </div>
                              <button
                                onClick={() => setImportTarget(row.ofx)}
                                className="flex items-center gap-1 px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-[8px] font-black uppercase tracking-widest transition-colors w-fit"
                              >
                                <Plus size={10} />
                                Ver Dados
                              </button>
                            </div>
                          )}
                          {row.status === 'duplicata' && (
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle size={14} className="text-purple-500 shrink-0" />
                              <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Duplicata</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[240px]">
                          {row.comoResolver ? (
                            <div className="flex flex-col gap-2 items-start">
                              <span className="text-[9px] font-medium text-slate-500 leading-tight">{row.comoResolver}</span>
                              {['valor_divergente', 'data_divergente', 'status_aberto', 'manual', 'manual_outra_conta'].includes(row.status) && (
                                <button
                                  onClick={() => handleCorrigirAutomaticamente(row)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors shadow-sm"
                                >
                                  <CheckCircle2 size={12} />
                                  Acatar Correção
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-500">✓ Nenhuma ação</span>
                          )}
                        </td>
                      </tr>
                    )})}
                    {filteredExtratosData.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-slate-400 font-medium">
                          Nenhuma divergência encontrada ou extrato vazio.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredExtratosData.length > 0 && (
                    <tfoot className="bg-slate-100/50 border-t-2 border-slate-200">
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                          Total na Listagem Atual:
                        </td>
                        <td className={`px-4 py-4 text-xs font-black text-right whitespace-nowrap ${totaisTabela.totalBanco >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {totaisTabela.totalBanco > 0 ? '+' : ''}{fmtR(Math.abs(totaisTabela.totalBanco))}
                        </td>
                        <td className="px-4 py-4"></td>
                        <td className={`px-4 py-4 text-xs font-black text-right whitespace-nowrap ${totaisTabela.totalSistema >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {totaisTabela.totalSistema > 0 ? '+' : ''}{fmtR(Math.abs(totaisTabela.totalSistema))}
                        </td>
                        <td colSpan={2} className="px-4 py-4"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* SEÇÃO: LANÇAMENTOS NO SISTEMA SEM CORRESPONDENTE NO EXTRATO */}
              {fantasmas.length > 0 && (
                <div className="bg-purple-50/50 border border-purple-100 rounded-3xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                        <Eye size={16} className="text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800">No Sistema, Fora do Extrato ({fantasmas.length})</h3>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                          Lançamentos efetivados na conta atual no período do OFX que não tiveram correspondência no extrato.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white px-3 py-2 border border-purple-100 rounded-xl">
                      <span className="text-[10px] font-black uppercase text-purple-400">Mover todos para:</span>
                      <select 
                        onChange={(e) => {
                          handleMoverTodosConta(e.target.value)
                          e.target.value = '' // reset após escolha
                        }}
                        className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                      >
                        <option value="">-- Selecione --</option>
                        {contas?.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-purple-100">
                    <table className="w-full text-left">
                      <thead className="bg-purple-50 border-b border-purple-100">
                        <tr>
                          <th className="px-4 py-3 text-[9px] font-black text-purple-400 uppercase tracking-widest">Data</th>
                          <th className="px-4 py-3 text-[9px] font-black text-purple-400 uppercase tracking-widest">Descrição (Sistema)</th>
                          <th className="px-4 py-3 text-[9px] font-black text-purple-400 uppercase tracking-widest">Conta & Forma</th>
                          <th className="px-4 py-3 text-[9px] font-black text-purple-400 uppercase tracking-widest">Tipo</th>
                          <th className="px-4 py-3 text-[9px] font-black text-purple-400 uppercase tracking-widest text-right">Valor</th>
                          <th className="px-4 py-3 text-[9px] font-black text-purple-400 uppercase tracking-widest">ID Bancário</th>
                          <th className="px-4 py-3 text-[9px] font-black text-purple-400 uppercase tracking-widest">Como Resolver</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50">
                        {fantasmas.map((f, i) => (
                          <tr key={i} className="hover:bg-purple-50/50">
                            <td className="px-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                              {(f.lancamento.data_caixa || f.lancamento.data_conciliacao || f.lancamento.data || '').split('-').reverse().join('/')}
                            </td>
                            <td className="px-4 py-3 max-w-[200px]">
                              <div className="text-xs font-bold text-slate-700 truncate" title={f.lancamento.descricao}>{f.lancamento.descricao || '--'}</div>
                              {f.lancamento.categoria && <div className="text-[9px] text-slate-400">{f.lancamento.categoria}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-[10px] font-bold text-slate-600">{contas?.find((c:any) => c.id === f.lancamento.conta_id)?.nome || 'N/A'}</div>
                              <div className="text-[9px] text-slate-400">{f.lancamento.forma_pagamento || 'Sem forma de pgto'}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {f.lancamento.tipo === 'receita'
                                ? <span className="text-[9px] font-black text-emerald-600 uppercase">Receita</span>
                                : <span className="text-[9px] font-black text-rose-600 uppercase">Despesa</span>}
                            </td>
                            <td className="px-4 py-3 text-right text-xs font-bold text-slate-700 whitespace-nowrap">{fmtR(Math.abs(f.lancamento.valor))}</td>
                            <td className="px-4 py-3">
                              {f.temFitid
                                ? <span className="text-[9px] font-mono text-purple-600 break-all">{f.lancamento.banco_transacao_id}</span>
                                : <span className="text-[9px] font-black text-slate-400 uppercase">Sem ID</span>}
                            </td>
                            <td className="px-4 py-3 max-w-[240px]">
                              <div className="flex flex-col gap-2 items-start">
                                <span className="text-[9px] font-medium text-slate-500 leading-tight">{f.comoResolver}</span>
                                <button 
                                  onClick={() => handleEstornarLancamento(f.lancamento.id)}
                                  className="text-[9px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-md transition-colors uppercase"
                                >
                                  Estornar para Pendente
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MODAL: DADOS DA TRANSAÇÃO NÃO ENCONTRADA */}
      {importTarget && (
        <div className="fixed inset-0 z-[998] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-800">Transação Não Encontrada</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Esta transação do banco não possui correspondente no sistema</p>
              </div>
              <button onClick={() => setImportTarget(null)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dados do Banco</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${importTarget.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {importTarget.type === 'CREDIT' ? 'Receita' : 'Despesa'}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-800">{importTarget.memo}</div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black text-slate-800">{fmtR(importTarget.amount)}</span>
                  <span className="text-xs font-medium text-slate-400">{importTarget.date.split('-').reverse().join('/')}</span>
                </div>
                {importTarget.fitid && (
                  <div className="text-[9px] font-mono text-slate-400">FITID: {importTarget.fitid}</div>
                )}
                {importTarget.metodo_inferido && (
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Forma inferida: {importTarget.metodo_inferido}</div>
                )}
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex bg-indigo-100/50 p-1 rounded-xl">
                  <button 
                    onClick={() => setImportActionType('criar')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors ${importActionType === 'criar' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-400 hover:text-indigo-600'}`}
                  >
                    Criar Novo
                  </button>
                  <button 
                    onClick={() => setImportActionType('vincular')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors ${importActionType === 'vincular' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-400 hover:text-indigo-600'}`}
                  >
                    Vincular Existente
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {importTarget.type === 'CREDIT' ? (
                    <div>
                      <label className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1 block">Associado</label>
                      <select
                        value={newLancData.associado_id}
                        onChange={e => { setNewLancData(prev => ({ ...prev, associado_id: e.target.value })); setVinculoLancamentoId(''); }}
                        className="w-full text-xs bg-white border border-indigo-200 rounded-xl p-2 outline-none focus:border-indigo-400"
                      >
                        <option value="">Selecione...</option>
                        {associados.filter((a:any)=>a.status!=='inativo').sort((a:any,b:any)=>a.nome.localeCompare(b.nome)).map((a: any) => (
                          <option key={a.id} value={a.id}>{a.nome}</option>
                        ))}
                      </select>
                      {newLancData.associado_id && (
                        <div className="mt-1.5 text-[10px] text-indigo-500 px-1">
                          Associado desde: <strong className="font-black">
                            {(() => {
                              const selected = associados.find((a:any) => a.id === newLancData.associado_id);
                              const dataAssociado = selected?.data_assinatura || selected?.data_ingresso;
                              return dataAssociado ? dataAssociado.split('-').reverse().join('/') : 'Não informada';
                            })()}
                          </strong>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block">Fornecedor</label>
                        {!isCriandoFornecedor && (
                          <button onClick={() => setIsCriandoFornecedor(true)} className="text-[9px] text-indigo-600 font-bold hover:underline bg-indigo-50 px-2 py-0.5 rounded-full">
                            + CADASTRAR NOVO
                          </button>
                        )}
                      </div>
                      
                      {isCriandoFornecedor ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text"
                            autoFocus
                            placeholder="Nome do Fornecedor..."
                            className="flex-1 text-xs bg-white border border-indigo-200 rounded-xl p-2 outline-none focus:border-indigo-400"
                            value={novoFornecedorNome}
                            onChange={e => setNovoFornecedorNome(e.target.value)}
                            onKeyDown={e => {
                                if(e.key === 'Enter') handleSalvarFornecedor()
                                if(e.key === 'Escape') setIsCriandoFornecedor(false)
                            }}
                          />
                          <button 
                            onClick={handleSalvarFornecedor}
                            disabled={isSavingFornecedor || !novoFornecedorNome.trim()}
                            className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {isSavingFornecedor ? '...' : 'SALVAR'}
                          </button>
                          <button 
                            onClick={() => setIsCriandoFornecedor(false)}
                            className="bg-slate-200 text-slate-600 p-2 rounded-xl hover:bg-slate-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <select
                          value={newLancData.fornecedor_id}
                          onChange={e => { setNewLancData(prev => ({ ...prev, fornecedor_id: e.target.value })); setVinculoLancamentoId(''); }}
                          className="w-full text-xs bg-white border border-indigo-200 rounded-xl p-2 outline-none focus:border-indigo-400"
                        >
                          <option value="">Selecione...</option>
                          {fornecedores.filter((f:any)=>f.status!=='inativo').sort((a:any,b:any)=>a.nome.localeCompare(b.nome)).map((f: any) => (
                            <option key={f.id} value={f.id}>{f.nome}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                  
                  {importActionType === 'criar' && (
                    <div>
                      <label className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1 block">Categoria</label>
                      <select
                        value={newLancData.categoria}
                        onChange={e => setNewLancData(prev => ({ ...prev, categoria: e.target.value }))}
                        className="w-full text-xs bg-white border border-indigo-200 rounded-xl p-2 outline-none focus:border-indigo-400"
                      >
                        <option value="">Selecione...</option>
                        {categorias.map((c: any) => (
                          <option key={c.id || c.nome} value={c.nome}>{c.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {importActionType === 'vincular' && (
                    <div>
                      <label className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1 block">Lançamento Pendente</label>
                      <select
                        value={vinculoLancamentoId}
                        onChange={e => setVinculoLancamentoId(e.target.value)}
                        className="w-full text-xs bg-white border border-indigo-200 rounded-xl p-2 outline-none focus:border-indigo-400"
                      >
                        <option value="">Selecione...</option>
                        {((importTarget.type === 'CREDIT' && newLancData.associado_id) || (importTarget.type === 'DEBIT' && newLancData.fornecedor_id)) ? lancamentos
                          .filter((l:any) => 
                            (importTarget.type === 'CREDIT' ? l.associado_id === newLancData.associado_id : l.fornecedor_id === newLancData.fornecedor_id) && 
                            !['pago', 'efetivado', 'recebido', 'concluido'].includes((l.status || '').toLowerCase()) &&
                            l.tipo === (importTarget.type === 'CREDIT' ? 'receita' : 'despesa')
                          )
                          .map((l:any) => (
                            <option key={l.id} value={l.id}>
                              {(l.data || l.data_vencimento || l.data_caixa || '').split('-').reverse().join('/')} - {l.descricao} (R$ {l.valor.toFixed(2)})
                            </option>
                          )) : <option disabled>Selecione um {importTarget.type === 'CREDIT' ? 'associado' : 'fornecedor'} primeiro...</option>}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex justify-between rounded-b-3xl">
              <button 
                onClick={handleCriarConciliar}
                disabled={isCreatingLanc}
                className="px-5 py-3 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-colors uppercase tracking-widest disabled:opacity-50"
              >
                {isCreatingLanc ? 'Salvando...' : (importActionType === 'criar' ? 'Criar Lançamento' : 'Vincular Lançamento')}
              </button>
              <button onClick={() => setImportTarget(null)} className="px-5 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors uppercase tracking-widest">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GERAR FALTANTES */}
      {modalGerarData && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-800">Gerar Lançamentos Faltantes</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Você está gerando faltas para {modalGerarData.length} associado(s).
                </p>
              </div>
              <button onClick={() => setModalGerarData(null)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">O que deseja gerar?</label>
                <select value={mgOQueGerar} onChange={e => setMgOQueGerar(e.target.value)} className="w-full px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-bold text-indigo-700 outline-none focus:border-indigo-500">
                  <option value="tudo">Ambos (Adesões e Mensalidades faltantes)</option>
                  <option value="adesao">APENAS Adesões faltantes</option>
                  <option value="mensalidade">APENAS Mensalidades faltantes</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conta Bancária</label>
                <select value={mgConta} onChange={e => setMgConta(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500">
                  <option value="padrao">Conta Padrão (Sem Banco Específico)</option>
                  {contas.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoria</label>
                  <select value={mgCategoria} onChange={e => setMgCategoria(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500">
                    <option value="">Padrão Automático (Adesão/Mensalidade)</option>
                    {categorias.map((c: any) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Natureza (Fixo/Variável)</label>
                  <select value={mgFixoVariavel} onChange={e => setMgFixoVariavel(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500">
                    <option value="fixo">Fixo</option>
                    <option value="variavel">Variável</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Forma de Pagamento</label>
                  <select value={mgFormaPagamento} onChange={e => setMgFormaPagamento(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500">
                    <option value="Boleto">Boleto</option>
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Cartão">Cartão</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Fixo</label>
                  <input type="text" placeholder="Vazio = valor do plano" value={mgValor} onChange={e => setMgValor(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status Inicial</label>
                  <select value={mgStatus} onChange={e => setMgStatus(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500">
                    <option value="atrasado">Atrasado</option>
                    <option value="aberto">Em Aberto</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dia do Vencimento</label>
                  <input type="number" min="1" max="31" value={mgDia} onChange={e => setMgDia(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
              <button onClick={() => setModalGerarData(null)} className="px-5 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors uppercase tracking-widest">
                Cancelar
              </button>
              <button onClick={executeGerarPendencias} disabled={isGenerating} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all">
                {isGenerating ? 'Gerando...' : 'Gerar Lançamentos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
