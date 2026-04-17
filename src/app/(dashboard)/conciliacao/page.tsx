'use client'
import { useState, useMemo, useEffect } from 'react'
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Search, 
  Plus, 
  Banknote,
  RefreshCw,
  FileCheck,
  Users,
  ChevronRight
} from 'lucide-react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useOFXParser, OFXTransaction } from '@/lib/hooks/useOFXParser'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import CrudModal from '@/components/ui/CrudModal'

export default function ConciliacaoPage() {
  const { lancamentos, conciliar, inserir, inserirBulk, loading: finLoading } = useFinanceiro()
  const { contas } = useContas()
  const { associados } = useAssociados()
  const { parseOFX } = useOFXParser()

  const [extrato, setExtrato] = useState<OFXTransaction[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)
  const [selectedExtrato, setSelectedExtrato] = useState<OFXTransaction | null>(null)
  const [selectedContaId, setSelectedContaId] = useState<string>('')

  // Inicializa conta padrão
  useEffect(() => {
    if (contas.length > 0 && !selectedContaId) {
      setSelectedContaId(contas[0].id)
    }
  }, [contas, selectedContaId])
  
  // Lógica de matching inteligente e FILTRAGEM
  const matchedTransactions = useMemo(() => {
    const allMatches = extrato.map(ext => {
      // 1. Prioridade 1: Busca associado pelo CPF/CNPJ exato extraído do memo
      const cpfMatch = ext.cpf_extraido ? associados.find(a => {
        const cleanA = (a.cpf || '').replace(/[^\d]/g, '')
        const cleanB = (ext.cpf_extraido || '').replace(/[^\d]/g, '')
        return cleanA === cleanB && cleanA.length >= 11
      }) : null

      // 2. Prioridade 2: Busca por NOME (Se CPF falhar)
      const memoLimpo = ext.memo.toUpperCase()
        .replace('PIX RECEBIDO', '')
        .replace('TRANSFERENCIA', '')
        .replace('RECEBIDA', '')
        .trim()
      
      const nameMatch = !cpfMatch ? associados.find(a => {
        const nomeA = a.nome.toUpperCase().trim()
        return memoLimpo.includes(nomeA) || nomeA.includes(memoLimpo)
      }) : null

      const finalAssoc = cpfMatch || nameMatch

      // 3. Regra de Categoria (Adesão vs Mensalidade)
      let suggestedCategory = 'Mensalidades'
      if (finalAssoc) {
        const jaTemLancamento = lancamentos.some(l => 
          l.associado_id === finalAssoc.id && l.status === 'pago' && l.tipo === 'receita'
        )
        suggestedCategory = jaTemLancamento ? 'Mensalidades' : 'ADESÃO'
      }

      // 4. Busca lançamentos no sistema
      const matches = lancamentos.filter(l => {
        if (l.banco_transacao_id && l.banco_transacao_id === ext.fitid) return true
        const diffDate = Math.abs(new Date(l.data).getTime() - new Date(ext.date).getTime())
        const daysDiff = diffDate / (1000 * 60 * 60 * 24)
        const valMatch = Math.abs(l.valor - ext.amount) < 0.01
        return valMatch && daysDiff <= 7 && !l.conciliado
      })
      
      return {
        bank: ext,
        match: matches[0] || null,
        assocMatch: finalAssoc || null,
        isCpfMatch: !!cpfMatch,
        suggestedCategory,
        isFirstPayment: suggestedCategory === 'ADESÃO',
        similarCount: matches.length
      }
    })

    // REGRA: Exibir apenas o que NÃO tem match perfeito no sistema (Pendentes de conciliação/lançamento)
    return allMatches.filter(m => !m.match)
  }, [extrato, lancamentos, associados])

  // Transações que podem ser lançadas em lote
  const batchTargets = useMemo(() => {
    return matchedTransactions.filter(t => t.assocMatch && !t.match)
  }, [matchedTransactions])

  const handleProcessarLote = async () => {
    if (!batchTargets.length || !selectedContaId) {
      alert(!selectedContaId ? 'Selecione uma conta bancária de destino no topo!' : 'Nenhuma sugestão encontrada para processar.')
      return
    }
    
    const contaNome = contas.find(c => c.id === selectedContaId)?.nome
    if (!confirm(`Deseja lançar ${batchTargets.length} recebimentos de uma vez na conta ${contaNome}?`)) return
    
    setIsProcessingBatch(true)
    
    try {
      const itemsToInsert = batchTargets.map(t => ({
        tipo: 'receita',
        descricao: t.bank.memo,
        valor: t.bank.amount,
        taxa: t.bank.taxa, // Salvando a taxa calculada
        data: t.bank.date,
        categoria: t.suggestedCategory,
        conta_id: selectedContaId,
        forma_pagamento: t.bank.metodo_inferido,
        status: 'pago',
        conciliado: true,
        banco_transacao_id: t.bank.fitid,
        associado_id: t.assocMatch?.id
      }))

      await inserirBulk(itemsToInsert as any)
      alert(`${itemsToInsert.length} lançamentos processados com sucesso!`)
    } catch (err) {
      console.error('Erro no processamento em lote:', err)
      alert('Erro ao processar lote.')
    } finally {
      setIsProcessingBatch(false)
    }
  }

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      const content = evt.target?.result as string
      const txs = parseOFX(content)
      setExtrato(txs)
    }
    reader.readAsText(file)
  }

  const handleConciliar = async (id: string, bankId: string) => {
    await conciliar(id, bankId)
  }

  const handleQuickCreate = (tx: OFXTransaction) => {
    setSelectedExtrato(tx)
    setIsModalOpen(true)
  }

  const handleSalvarNovo = async (data: any) => {
    if (!selectedExtrato) return
    const res = await inserir({
      ...data,
      valor: selectedExtrato.amount,
      taxa: selectedExtrato.taxa, // Inclui a taxa calculada no salvamento individual
      data: selectedExtrato.date,
      conciliado: true,
      banco_transacao_id: selectedExtrato.fitid
    })
    if (!res.error) {
      setIsModalOpen(false)
      setSelectedExtrato(null)
    }
  }

  // Define os dados iniciais do modal baseado na transação e match atual
  const modalInitialData = useMemo(() => {
    if (!selectedExtrato) return null
    const m = matchedTransactions.find(mt => mt.bank.id === selectedExtrato.id)
    return {
      descricao: selectedExtrato.memo,
      associado_id: m?.assocMatch?.id || '',
      categoria: m?.suggestedCategory || 'Mensalidades',
      conta_id: selectedContaId,
      forma_pagamento: selectedExtrato.metodo_inferido, // Pré-preenche modal
      tipo: 'receita',
      status: 'pago'
    }
  }, [selectedExtrato, matchedTransactions, selectedContaId])

  // Cálculos de Totais do Extrato
  const totals = useMemo(() => {
    return extrato.reduce((acc, curr) => {
      if (curr.type === 'CREDIT') acc.entradas += curr.amount
      else acc.saidas += curr.amount
      return acc
    }, { entradas: 0, saidas: 0 })
  }, [extrato])

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="page-header flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
            <FileCheck size={26} />
          </div>
          <div>
            <h1 className="page-title text-2xl font-bold tracking-tight">Conciliador Bancário</h1>
            <p className="page-subtitle text-xs text-gray-500 font-medium tracking-tight">Cruze seu extrato OFX com o sistema automaticamente.</p>
          </div>
        </div>

        {extrato.length > 0 && (
          <div className="flex items-center gap-3 animate-in slide-in-from-right">
            <button 
              onClick={() => setExtrato([])}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest mr-2"
            >
              <RefreshCw size={14} /> Limpar Extrato
            </button>

            <div className="flex items-center gap-3 bg-white p-2 pl-4 rounded-[20px] border border-gray-100 shadow-xl shadow-indigo-900/5">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Conta de Destino (Lote)</span>
                <select 
                  value={selectedContaId}
                  onChange={(e) => setSelectedContaId(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 p-0 cursor-pointer min-w-[150px]"
                >
                  {contas.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              
              <div className="w-px h-8 bg-gray-100 mx-1" />

              <button 
                onClick={handleProcessarLote}
                disabled={isProcessingBatch || !batchTargets.length}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-30"
              >
                {isProcessingBatch ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Lançar {batchTargets.length} Sugestões
              </button>
            </div>
          </div>
        )}
      </div>

      {!extrato.length ? (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileUpload(e); }}
          className={`relative border-2 border-dashed rounded-[32px] p-20 flex flex-col items-center justify-center transition-all bg-white shadow-xl shadow-indigo-900/5 
            ${isDragOver ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-gray-200 hover:border-indigo-300'}`}
        >
          <input type="file" accept=".ofx" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 mb-8 animate-bounce-slow">
            <Upload size={36} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Importe seu extrato OFX</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-sm text-center">Arraste aqui ou clique para selecionar o arquivo .ofx exportado do seu banco.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="table-card overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between bg-gray-50/30 gap-4">
              <div className="flex items-center gap-6">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                  <Search size={16} className="text-indigo-600" /> Transações ({extrato.length})
                </h2>
                
                <div className="flex items-center gap-4 bg-white/50 px-4 py-2 rounded-2xl border border-gray-200/50">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-green-500 uppercase tracking-widest leading-none mb-1">Total Entradas</span>
                    <span className="text-xs font-black text-green-600 tracking-tight">{fmtR(totals.entradas)}</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200 mx-1" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Total Saídas</span>
                    <span className="text-xs font-black text-red-600 tracking-tight">{fmtR(totals.saidas)}</span>
                  </div>
                </div>
              </div>

              <button onClick={() => setExtrato([])} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-white border border-gray-100 px-4 py-1.5 rounded-full shadow-sm">
                Trocar Arquivo
              </button>
            </div>
            
            <div className="divide-y divide-gray-50">
              {matchedTransactions.length > 0 ? (
                matchedTransactions.map((item, idx) => (
                  <div key={item.bank.id} className="group p-5 hover:bg-indigo-50/30 transition-all flex flex-col md:flex-row items-center gap-6">
                    
                    {/* Extrato Entry */}
                    <div className="flex-1 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 
                        ${item.bank.type === 'CREDIT' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        <Banknote size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{fmtData(item.bank.date)}</div>
                        <div className="text-sm font-bold text-gray-900 break-words leading-tight">{item.bank.memo}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-gray-700">{fmtR(item.bank.amount)}</span>
                          {item.bank.taxa && item.bank.taxa > 0 ? (
                            <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                              % Taxa: {fmtR(item.bank.taxa)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="text-gray-300 hidden md:block" />

                    {/* System Match Card - Interativo */}
                    <div className="flex-[1.5] flex items-center justify-center w-full">
                      {item.assocMatch ? (
                        <button 
                          onClick={() => handleQuickCreate(item.bank)}
                          className="flex items-center gap-3 w-full p-4 rounded-2xl border border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-left group/card animate-in fade-in zoom-in duration-300 outline-none"
                        >
                          <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg transition-transform group-hover/card:scale-110
                            ${item.isCpfMatch ? 'bg-emerald-500 shadow-emerald-200' : 'bg-indigo-500 shadow-indigo-200'}`}>
                            {item.isCpfMatch ? <CheckCircle2 size={20} /> : <Users size={20} />}
                          </div>
                          <div className="flex-1">
                            <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1
                              ${item.isCpfMatch ? 'text-emerald-600' : 'text-indigo-600'}`}>
                              {item.isCpfMatch ? 'CPF Identificado' : 'Sugestão por Nome'} 
                              {item.isFirstPayment && <span className="ml-1 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] border border-amber-200">🌟 ADESÃO</span>}
                              <span className="text-gray-300 ml-1">•</span> 
                              <span className="text-gray-400 capitalize">Associado</span>
                            </div>
                            <div className="text-xs font-bold text-gray-800 group-hover/card:text-indigo-700 transition-colors">{item.assocMatch.nome}</div>
                            <div className="text-[10px] text-gray-400 font-medium">
                              {item.isFirstPayment ? 'Primeira receita! Clique para conferir adesão.' : 'Mensalidade recorrente identificada.'}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                             <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-500">
                               {contas.find(c => c.id === selectedContaId)?.nome || 'Selecione Conta'}
                             </div>
                             <ChevronRight size={18} className="text-gray-300 group-hover/card:text-indigo-500 group-hover/card:translate-x-1 transition-all" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-full flex items-center justify-center p-4 rounded-2xl border border-dashed border-gray-200">
                          <div className="text-center">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1 mb-2">
                              <AlertCircle size={12} className="text-amber-500" /> Nenhum par encontrado
                            </div>
                            <button 
                              onClick={() => handleQuickCreate(item.bank)}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 text-[10px] font-black rounded-lg hover:bg-gray-100 transition-all uppercase"
                            >
                              <Plus size={12} /> Criar Manualmente
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center animate-in fade-in zoom-in">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Extrato 100% Conciliado</h3>
                  <p className="text-sm text-gray-500 mt-1">Todas as transações deste arquivo já foram lançadas no seu fluxo de caixa.</p>
                  <button onClick={() => setExtrato([])} className="mt-6 text-xs font-bold text-indigo-600 hover:underline">
                    Importar outro arquivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Modal com Destaque para dados faltantes */}
      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Conferência de Lançamento"
        initialData={modalInitialData}
        onSubmit={handleSalvarNovo}
        fields={[
          { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
            { value: 'receita', label: 'Receita' },
            { value: 'despesa', label: 'Despesa' }
          ]},
          { name: 'descricao', label: 'Descrição Bancária', type: 'text', required: true },
          { name: 'categoria', label: 'Categoria (Verifique se está correto)', type: 'select', required: true, options: [
            { value: 'Mensalidades', label: 'Mensalidades' },
            { value: 'ADESÃO', label: 'Adesão' },
            { value: 'Serviços', label: 'Serviços' },
            { value: 'Outros', label: 'Outros' },
          ]},
          { name: 'conta_id', label: 'Conta de Destino', type: 'select', required: true, options: 
            contas.map(c => ({ value: c.id, label: c.nome }))
          },
          { name: 'associado_id', label: 'Associado Vinculado', type: 'select', required: true, options: [
            { value: '', label: '⚠️ SELECIONE UM ASSOCIADO (OBRIGATÓRIO)' },
            ...associados.map(a => ({ value: a.id, label: a.nome }))
          ]},
          { name: 'status', label: 'Status do Fluxo', type: 'select', required: true, options: [
            { value: 'pago', label: 'Confirmado (Pago)' },
            { value: 'pendente', label: 'Aguardando Aprovação' }
          ]},
        ]}
      />

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
