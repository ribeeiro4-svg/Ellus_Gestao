'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
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
  ChevronRight,
  X
} from 'lucide-react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import { useOFXParser, OFXTransaction } from '@/lib/hooks/useOFXParser'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import CrudModal from '@/components/ui/CrudModal'

export default function ConciliacaoPage() {
  const { lancamentos, conciliar, inserir, inserirBulk, loading: finLoading } = useFinanceiro()
  const { contas } = useContas()
  const { associados, atualizar: atualizarAssociado } = useAssociados()
  const { fornecedores, inserir: inserirFornecedor } = useFornecedores()
  const { parseOFX } = useOFXParser()

  const [extrato, setExtrato] = useState<OFXTransaction[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)
  const [selectedExtrato, setSelectedExtrato] = useState<OFXTransaction | null>(null)
  const [selectedContaId, setSelectedContaId] = useState<string>('')
  const [filterMatch, setFilterMatch] = useState<'todos' | 'com_match' | 'sem_match'>('todos')
  const [ignoredMatches, setIgnoredMatches] = useState<Set<string>>(new Set())
  const [editedMemos, setEditedMemos] = useState<Record<string, string>>({})

  // Inicializa conta padrão
  useEffect(() => {
    if (contas.length > 0 && !selectedContaId) {
      setSelectedContaId(contas[0].id)
    }
  }, [contas, selectedContaId])
  
  // Helper para normalização robusta
  const normalizeStr = (str: string) => {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/-|\.|\/|<|>|\|/g, ' ')
      .replace(/\b(de|da|do|das|dos|e)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  const handleUnmatch = (fitid: string) => {
    setIgnoredMatches(prev => new Set(prev).add(fitid))
  }

  // Lógica de matching inteligente
  const matchedTransactions = useMemo(() => {
    const adesaoJaSugerida = new Set<string>()

    const allMatches = extrato.map((ext: OFXTransaction) => {
      if (ignoredMatches.has(ext.fitid)) {
        return { bank: ext, match: null, assocMatch: null, forMatch: null, isCpfMatch: false, suggestedCategory: ext.type === 'CREDIT' ? 'Mensalidades' : 'Outros', isFirstPayment: false, similarCount: 0 }
      }

      const isCredit = ext.type === 'CREDIT'
      const cnpjNoMemo = (ext.memo.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/))?.[0]?.replace(/[^\d]/g, '')
      const cpfNoMemo = (ext.memo.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/))?.[0]?.replace(/[^\d]/g, '')
      const docNoMemo = cnpjNoMemo || cpfNoMemo

      let finalAssoc = null
      let finalFor = null
      let isCpfMatch = false

      if (isCredit) {
        const match = docNoMemo ? associados.find(a => (a.cpf || '').replace(/[^\d]/g, '') === docNoMemo) : null
        if (match) { finalAssoc = match; isCpfMatch = true }
        else {
          const memoLimpo = normalizeStr(ext.memo.replace(/PIX RECEBIDO|TRANSFERENCIA|RECEBIDA|TRANSF|PIX|CONTA|MEMO|PAGTO|DOC|TED/gi, ''))
          const palavrasBanco = memoLimpo.split(' ').filter(p => p.length > 1)
          finalAssoc = associados.find(a => {
            const nomeA = normalizeStr(a.nome); const palavrasA = nomeA.split(' ').filter(p => p.length > 2)
            const count = palavrasA.filter(p => palavrasBanco.includes(p)).length
            return count >= Math.min(palavrasA.length, 3)
          })
        }
      } else {
        const match = docNoMemo ? fornecedores.find(f => (f.cpf_cnpj || '').replace(/[^\d]/g, '') === docNoMemo) : null
        if (match) { finalFor = match; isCpfMatch = true }
        else {
          const memoLimpo = normalizeStr(ext.memo.replace(/PIX ENVIADO|TRANSFERENCIA|ENVIADA|TRANSF|PIX|CONTA|MEMO|PAGTO|DOC|TED/gi, ''))
          const palavrasBanco = memoLimpo.split(' ').filter(p => p.length > 1)
          finalFor = fornecedores.find(f => {
            const nomeF = normalizeStr(f.nome); const palavrasF = nomeF.split(' ').filter(p => p.length > 2)
            const count = palavrasF.filter(p => palavrasBanco.includes(p)).length
            return count >= Math.min(palavrasF.length, 2)
          })
        }
      }

      let suggestedCategory = isCredit ? 'Mensalidades' : (finalFor?.categoria_padrao || 'Serviços')
      if (isCredit && finalAssoc) {
        const temNoBanco = lancamentos.some(l => l.associado_id === (finalAssoc as any).id && l.status === 'pago')
        if (!temNoBanco && !adesaoJaSugerida.has((finalAssoc as any).id)) {
          suggestedCategory = 'ADESÃO'; adesaoJaSugerida.add((finalAssoc as any).id)
        }
      }

      const matches = lancamentos.filter(l => {
        if (l.banco_transacao_id === ext.fitid) return true
        return Math.abs(l.valor - ext.amount) < 0.01 && !l.conciliado
      })
      
      return { bank: ext, match: matches[0] || null, assocMatch: finalAssoc || null, forMatch: finalFor || null, isCpfMatch, suggestedCategory, isFirstPayment: suggestedCategory === 'ADESÃO', similarCount: matches.length }
    })

    return allMatches.filter(m => !m.match)
  }, [extrato, lancamentos, associados, fornecedores, ignoredMatches])

  const batchTargets = useMemo(() => matchedTransactions.filter(t => (t.assocMatch || t.forMatch) && !t.match), [matchedTransactions])
  const countComMatch = useMemo(() => matchedTransactions.filter(t => t.assocMatch || t.forMatch).length, [matchedTransactions])
  const countSemMatch = useMemo(() => matchedTransactions.filter(t => !t.assocMatch && !t.forMatch).length, [matchedTransactions])

  const transacoesFiltradas = useMemo(() => {
    if (filterMatch === 'com_match') return matchedTransactions.filter(t => t.assocMatch || t.forMatch)
    if (filterMatch === 'sem_match') return matchedTransactions.filter(t => !t.assocMatch && !t.forMatch)
    return matchedTransactions
  }, [matchedTransactions, filterMatch])

  const handleProcessarLote = async () => {
    if (!batchTargets.length || !selectedContaId) return alert('Verifique os alvos do lote.')
    setIsProcessingBatch(true)
    try {
      const items = (batchTargets as any[]).map(t => ({
        tipo: t.bank.type === 'CREDIT' ? 'receita' : 'despesa',
        descricao: editedMemos[t.bank.fitid] || t.bank.memo,
        categoria: t.suggestedCategory,
        conta_id: selectedContaId,
        valor: t.bank.amount,
        taxa: t.bank.taxa,
        data: t.bank.date,
        status: 'pago',
        associado_id: t.assocMatch?.id,
        fornecedor_id: t.forMatch?.id,
        conciliado: true,
        banco_transacao_id: t.bank.fitid
      }))
      await inserirBulk(items as any)
      alert(`${items.length} itens processados!`)
    } finally {
      setIsProcessingBatch(false)
    }
  }

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0]
    if (!file) return
    const reader = new FileReader(); reader.onload = (evt) => setExtrato(parseOFX(evt.target?.result as string)); reader.readAsText(file)
  }

  const handleQuickCreate = (tx: OFXTransaction) => { setSelectedExtrato(tx); setIsModalOpen(true) }

  const handleSalvarNovo = async (data: any) => {
    if (!selectedExtrato) return
    const { cpf, ...lancamentoData } = data
    const res = await inserir({ ...lancamentoData, valor: selectedExtrato.amount, taxa: selectedExtrato.taxa, data: selectedExtrato.date, conciliado: true, banco_transacao_id: selectedExtrato.fitid })
    if (!res.error) { setIsModalOpen(false); setSelectedExtrato(null) } else { alert(`Erro: ${res.error}`) }
  }

  const handleSalvarFornecedor = async (data: any) => {
    const res = await inserirFornecedor(data)
    if (!res.error) { setIsSupplierModalOpen(false); alert('Fornecedor cadastrado!') } else { alert(`Erro: ${res.error}`) }
  }

  const modalInitialData = useMemo(() => {
    if (!selectedExtrato) return null
    const m = matchedTransactions.find(mt => (mt as any).bank.fitid === selectedExtrato.fitid) as any
    const isDebit = selectedExtrato.type === 'DEBIT'
    return {
      descricao: editedMemos[selectedExtrato.fitid] || selectedExtrato.memo,
      associado_id: m?.assocMatch?.id || '',
      fornecedor_id: m?.forMatch?.id || '',
      cpf: selectedExtrato.cpf_extraido || m?.assocMatch?.cpf || m?.forMatch?.cpf_cnpj || '',
      categoria: m?.suggestedCategory || (isDebit ? 'Serviços' : 'Mensalidades'),
      conta_id: selectedContaId,
      forma_pagamento: selectedExtrato.metodo_inferido,
      tipo: isDebit ? 'despesa' : 'receita',
      status: 'pago'
    }
  }, [selectedExtrato, matchedTransactions, selectedContaId, editedMemos])

  const totals = useMemo(() => {
    const entries = extrato.filter(i => i.type === 'CREDIT').reduce((s, i) => s + i.amount, 0)
    const exits = extrato.filter(i => i.type === 'DEBIT').reduce((s, i) => s + Math.abs(i.amount), 0)
    const matchEntries = matchedTransactions.filter(i => i.bank.type === 'CREDIT' && i.assocMatch).reduce((s, i) => s + i.bank.amount, 0)
    const matchExits = matchedTransactions.filter(i => i.bank.type === 'DEBIT' && (i.match || i.forMatch)).reduce((s, i) => s + Math.abs(i.bank.amount), 0)
    return { entradas: entries, saidas: exits, matchEntradas: matchEntries, matchSaidas: matchExits }
  }, [extrato, matchedTransactions])

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="page-header flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm"><FileCheck size={26} /></div>
          <div>
            <h1 className="page-title text-2xl font-bold tracking-tight">Conciliador Bancário</h1>
            <p className="page-subtitle text-xs text-gray-500 font-medium tracking-tight">Cruze seu extrato OFX com o sistema automaticamente.</p>
          </div>
        </div>

        {extrato.length > 0 && (
          <div className="flex items-center gap-3 animate-in slide-in-from-right">
            <button onClick={() => setExtrato([])} className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest mr-2"><RefreshCw size={14} /> Limpar</button>
            <div className="flex items-center gap-3 bg-white p-2 pl-4 rounded-[20px] border border-gray-100 shadow-xl shadow-indigo-900/5">
              <select value={selectedContaId} onChange={(e) => setSelectedContaId(e.target.value)} className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 p-0 cursor-pointer min-w-[150px]">
                {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <button onClick={handleProcessarLote} disabled={isProcessingBatch || !batchTargets.length} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-30">
                {isProcessingBatch ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Lançar {batchTargets.length} Sugestões
              </button>
            </div>
          </div>
        )}
      </div>

      {!extrato.length ? (
        <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileUpload(e); }} className={`relative border-2 border-dashed rounded-[32px] p-20 flex flex-col items-center justify-center transition-all bg-white shadow-xl shadow-indigo-900/5 ${isDragOver ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-gray-200 hover:border-indigo-300'}`}>
          <input type="file" accept=".ofx" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 mb-8 animate-bounce-slow"><Upload size={36} /></div>
          <h3 className="text-xl font-bold text-gray-900">Importe seu extrato OFX</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-sm text-center">Arraste aqui ou clique para selecionar o arquivo .ofx.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="table-card overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between bg-gray-50/30 gap-4 flex-wrap">
              <div className="flex items-center gap-6">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2"><Search size={16} className="text-indigo-600" /> Transações ({extrato.length})</h2>
                <div className="flex gap-4">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">IN {fmtR(totals.entradas)}</span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">OUT {fmtR(totals.saidas)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {['todos', 'com_match', 'sem_match'].map(f => (
                  <button key={f} onClick={() => setFilterMatch(f as any)} className={`text-[10px] font-black px-4 py-1.5 rounded-full border transition-all ${filterMatch === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-100'}`}>
                    {f === 'todos' ? 'Todas' : f === 'com_match' ? 'Com Match' : 'Sem Match'}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {transacoesFiltradas.map((item) => (
                <div key={item.bank.fitid} className="p-5 hover:bg-slate-50 transition-all flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 flex items-center gap-4 w-full">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bank.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><Banknote size={20} /></div>
                    <div className="flex-1">
                      <div className="text-[10px] font-black text-gray-400 uppercase">{fmtData(item.bank.date)}</div>
                      {item.bank.type === 'DEBIT' ? (
                        <div className="flex flex-col gap-1">
                          <input 
                            type="text" 
                            value={editedMemos[item.bank.fitid] !== undefined ? editedMemos[item.bank.fitid] : item.bank.memo}
                            onChange={(e) => setEditedMemos(prev => ({ ...prev, [item.bank.fitid]: e.target.value }))}
                            className="text-sm font-bold text-indigo-700 bg-white border border-gray-100 rounded-lg p-1.5 px-3 focus:ring-2 focus:ring-indigo-100 w-full outline-none shadow-sm"
                            placeholder="Descrição da Saída..."
                          />
                          <span className="text-[9px] text-gray-300 italic truncate max-w-[250px]">Banco: {item.bank.memo}</span>
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-gray-900">{item.bank.memo}</div>
                      )}
                      <div className="text-xs font-black text-gray-700 mt-1">{fmtR(item.bank.amount)}</div>
                    </div>
                  </div>

                  <ArrowRight className="text-gray-200 hidden md:block" />

                  <div className="flex-[1.2] w-full">
                    {item.assocMatch || item.forMatch ? (
                      <button onClick={() => handleQuickCreate(item.bank)} className={`flex items-center gap-4 w-full p-4 rounded-2xl border border-dashed transition-all hover:shadow-lg ${item.forMatch ? 'border-orange-200 bg-orange-50/20' : 'border-emerald-200 bg-emerald-50/20'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${item.forMatch ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                          {item.forMatch ? <Banknote size={20} /> : <Users size={20} />}
                        </div>
                        <div className="flex-1 text-left">
                          <div className={`text-[10px] font-black uppercase tracking-widest ${item.forMatch ? 'text-orange-600' : 'text-emerald-600'}`}>
                            {item.forMatch ? 'FORNECEDOR' : (item.isFirstPayment ? '🌟 ADESÃO' : 'ASSOCIADO')}
                          </div>
                          <div className="text-xs font-bold text-gray-800">{(item.forMatch ? (item.forMatch as any).nome : (item.assocMatch as any).nome)}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleUnmatch(item.bank.fitid) }} className="p-2 text-gray-300 hover:text-red-500"><X size={16} /></button>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {item.bank.type === 'DEBIT' && (
                          <button onClick={() => { setSelectedExtrato(item.bank); setIsSupplierModalOpen(true) }} className="flex-1 flex items-center justify-center gap-2 py-3 border border-dashed border-orange-200 bg-orange-50/10 text-orange-600 text-[10px] font-black rounded-xl hover:bg-orange-50">
                            <Plus size={14} /> FORNECEDOR
                          </button>
                        )}
                        <button onClick={() => handleQuickCreate(item.bank)} className="flex-1 flex items-center justify-center gap-2 py-3 border border-dashed border-gray-200 bg-gray-50/50 text-gray-600 text-[10px] font-black rounded-xl hover:bg-gray-100">
                          <Plus size={14} /> MANUAL
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Lançamento */}
      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirmar Lançamento"
        initialData={modalInitialData}
        onSubmit={handleSalvarNovo}
        fields={[
          { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [{ value: 'receita', label: 'Receita' }, { value: 'despesa', label: 'Despesa' }] },
          { name: 'descricao', label: 'Descrição Final', type: 'text', required: true },
          { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: [
            { value: 'Mensalidades', label: 'Mensalidades' }, { value: 'ADESÃO', label: 'Adesão' }, { value: 'Serviços', label: 'Serviços' }, { value: 'Outros', label: 'Outros' }
          ] },
          { name: 'conta_id', label: 'Conta', type: 'select', required: true, options: contas.map(c => ({ value: c.id, label: c.nome })) },
          { name: 'associado_id', label: 'Associado', type: 'select', showIf: (d) => d.tipo === 'receita', options: [{ value: '', label: 'Selecione...' }, ...associados.map(a => ({ value: a.id, label: a.nome }))] },
          { name: 'fornecedor_id', label: 'Fornecedor', type: 'select', showIf: (d) => d.tipo === 'despesa', options: [{ value: '', label: 'Selecione...' }, ...fornecedores.map(f => ({ value: f.id, label: f.nome }))] },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'pago', label: 'Liquidado' }, { value: 'pendente', label: 'Pendente' }] },
        ]}
      />

      {/* Modal de Novo Fornecedor */}
      <CrudModal 
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="Novo Fornecedor / Prestador"
        initialData={{ nome: selectedExtrato?.memo || '', cpf_cnpj: (selectedExtrato?.memo.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/))?.[0]?.replace(/[^\d]/g, '') || '' }}
        onSubmit={handleSalvarFornecedor}
        fields={[
          { name: 'nome', label: 'Nome / Razão Social', type: 'text', required: true },
          { name: 'cpf_cnpj', label: 'CPF ou CNPJ', type: 'text' },
          { name: 'categoria_padrao', label: 'Categoria Padrão', type: 'text' },
          { name: 'email', label: 'E-mail', type: 'text' },
          { name: 'telefone', label: 'Telefone', type: 'text' },
        ]}
      />
    </div>
  )
}
