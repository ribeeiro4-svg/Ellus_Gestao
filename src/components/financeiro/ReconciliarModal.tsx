import { useState, useMemo, useEffect } from 'react'
import { X, Search, CheckCircle2, AlertCircle } from 'lucide-react'

interface ReconciliarModalProps {
  isOpen: boolean
  onClose: () => void
  lancamentos: any[] 
  associados: any[]
  categorias: any[]
  todosLancamentos?: any[]
  onConfirm: (receipts: any[], associadoId: string, categoria: string, provisionsToLiquidate: string[]) => Promise<{ error: string | null }>
}

export default function ReconciliarModal({ isOpen, onClose, lancamentos, associados, categorias, todosLancamentos, onConfirm }: ReconciliarModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<string>('')
  const [selectedCategoria, setSelectedCategoria] = useState('MENSALIDADE')
  const [selectedProvisions, setSelectedProvisions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSelectedProvisions([])
  }, [selectedId])

  const filteredAssociados = useMemo(() => {
    if (!searchTerm) return associados.slice(0, 50)
    const term = searchTerm.toLowerCase()
    return associados.filter(a => 
      a.nome?.toLowerCase().includes(term) || 
      a.cpf_cnpj?.toLowerCase().includes(term) ||
      a.codigo?.toLowerCase().includes(term)
    ).slice(0, 50)
  }, [associados, searchTerm])

  const openProvisions = useMemo(() => {
    if (!selectedId || !todosLancamentos) return []
    return todosLancamentos.filter(l => 
      l.associado_id === selectedId && 
      l.tipo === 'receita' && 
      (l.status === 'aberto' || l.status === 'atrasado')
    ).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  }, [selectedId, todosLancamentos])

  if (!isOpen || !lancamentos || lancamentos.length === 0) return null

  const isBatch = lancamentos.length > 1
  const primeiroLancamento = lancamentos[0]

  const valorTotalNumber = isBatch 
    ? lancamentos.reduce((acc, l) => acc + (Number(l.valor) || 0), 0)
    : Number(primeiroLancamento.valor) || 0

  const valorFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalNumber)

  const dataFmt = isBatch
    ? '--'
    : (primeiroLancamento.data ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${primeiroLancamento.data}T00:00:00`)) : '--')
  
  const originalDesc = isBatch
    ? 'Vários lançamentos...'
    : (primeiroLancamento.banco_original_memo || primeiroLancamento.descricao || 'Sem descrição original')

  const handleConfirm = async () => {
    if (!selectedId) {
      alert('Selecione um associado válido.')
      return
    }

    setLoading(true)
    const { error } = await onConfirm(lancamentos, selectedId, selectedCategoria, selectedProvisions)
    setLoading(false)

    if (error) {
      alert(`Erro ao reconciliar: ${error}`)
    } else {
      onClose()
      setSearchTerm('')
      setSelectedId('')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <X size={20} />
          </button>

          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Reconciliar Recebimento{isBatch ? 's em Lote' : ''}</h3>
          <p className="text-sm font-medium text-slate-500 mb-6">
            {isBatch ? `Identifique o associado correto para os ${lancamentos.length} lançamentos selecionados.` : 'Identifique o associado correto para este lançamento.'}
          </p>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6">
            <div className="flex flex-col gap-3">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição Original (Extrato)</span>
                <p className="text-sm font-bold text-slate-700 leading-tight mt-0.5">{originalDesc}</p>
              </div>
              <div className="flex gap-8">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</span>
                  <p className="text-base font-black text-emerald-600 mt-0.5">{valorFmt}</p>
                </div>
                {!isBatch && (
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</span>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{dataFmt}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Categoria
            </label>
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none font-bold text-slate-700 transition-colors"
            >
              {categorias?.map(c => (
                <option key={c.id} value={c.nome}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Buscar Associado
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Nome, CPF/CNPJ ou Código..." 
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-sm outline-none font-medium transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {!selectedId && (
            <div className="max-h-[160px] overflow-y-auto bg-slate-50/50 rounded-xl border border-slate-100 divide-y divide-slate-100 mb-6">
              {filteredAssociados.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400 font-medium">Nenhum associado encontrado.</div>
              ) : (
                filteredAssociados.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className="w-full flex items-center justify-between p-3 text-left transition-all hover:bg-slate-50"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{a.nome}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {a.codigo ? `CÓD: ${a.codigo} | ` : ''}{a.cpf_cnpj || 'SEM DOCUMENTO'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {selectedId && (
            <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-indigo-900">{associados.find(a => a.id === selectedId)?.nome}</span>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Associado Selecionado</span>
                </div>
                <button 
                  onClick={() => setSelectedId('')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                >
                  Alterar
                </button>
              </div>

              <div className="mt-4">
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">
                  Vincular a Lançamento em Aberto (Opcional)
                </label>
                {openProvisions.length === 0 ? (
                  <div className="p-3 bg-white rounded-xl text-center text-xs font-medium text-slate-500 border border-slate-100">
                    Nenhum lançamento em aberto. O recebimento será criado como avulso.
                  </div>
                ) : (
                  <div className="max-h-[140px] overflow-y-auto bg-white rounded-xl border border-slate-100 divide-y divide-slate-100">
                    {openProvisions.map(p => {
                      const isSelected = selectedProvisions.includes(p.id)
                      const pValor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)
                      const pData = p.data ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${p.data}T00:00:00`)) : '--'
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedProvisions(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])
                          }}
                          className={`w-full flex items-center justify-between p-2.5 text-left transition-all ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                        >
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{p.descricao}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pData}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-black ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>{pValor}</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                              {isSelected && <CheckCircle2 size={10} className="text-white" />}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={!selectedId || loading}
              className="flex-1 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? 'Processando...' : `Reconciliar`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

