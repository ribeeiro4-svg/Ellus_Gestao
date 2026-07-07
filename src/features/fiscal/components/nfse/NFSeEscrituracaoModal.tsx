
'use client'
import React, { useState, useEffect } from 'react'
import { X, Check, Loader2, Search, Calendar, Landmark, CreditCard, Info, AlertCircle, Filter, FileText } from 'lucide-react'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import { buscarLancamentosParaVinculoAction } from '../../actions/nfseActions'

export default function NFSeEscrituracaoModal({ 
  isOpen, 
  onClose, 
  nfseData, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  nfseData: any; 
  onSubmit: (payload: any) => Promise<void> 
}) {
  const [loading, setLoading] = useState(false)
  const [financials, setFinancials] = useState<any[]>([])
  const [loadingFinancials, setLoadingFinancials] = useState(false)
  const [selectedFinId, setSelectedFinId] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState('all')
  const [search, setSearch] = useState('')
  const [dataEfetiva, setDataEfetiva] = useState('')
  const [dataEscrituracao, setDataEscrituracao] = useState(new Date().toISOString().split('T')[0])
  const [ignoreFornecedor, setIgnoreFornecedor] = useState(false)

  const { nota, prestador } = nfseData || {}

  useEffect(() => {
    if (nota) {
      if (nota.data_entrada) setDataEfetiva(nota.data_entrada.split('T')[0])
      else if (nota.data_emissao && !dataEfetiva) setDataEfetiva(nota.data_emissao.split('T')[0])

      if (nota.data_escrituracao) setDataEscrituracao(nota.data_escrituracao.split('T')[0])
    }
  }, [nota])

  useEffect(() => {
    if (isOpen && nota?.prestador_id) {
      loadFinancials()
    }
  }, [isOpen, nota?.prestador_id, periodo, ignoreFornecedor])

  const loadFinancials = async () => {
    setLoadingFinancials(true)
    const res = await buscarLancamentosParaVinculoAction(nota.prestador_id, periodo, ignoreFornecedor)
    setFinancials(res.data || [])
    setLoadingFinancials(false)
  }

  if (!isOpen || !nfseData) return null

  const filteredFinancials = financials.filter(f => 
    f.descricao?.toLowerCase().includes(search.toLowerCase()) ||
    f.categoria?.toLowerCase().includes(search.toLowerCase()) ||
    f.valor.toString().includes(search)
  )

  const handleConfirm = async () => {
    if (!selectedFinId) return
    setLoading(true)
    try {
      await onSubmit({
        nfseId: nota.id,
        financeiroId: selectedFinId,
        dataEfetiva,
        dataEscrituracao
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', animation: 'overlayIn .2s ease both' }}
    >
      <div 
        className="w-full max-w-[1000px] max-h-[90vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200"
      >
        {/* Header Superior */}
        <div className="px-8 py-5 bg-slate-900 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Landmark size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Vincular Escrituração Fiscal</h2>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest opacity-80">Conciliação Nota ↔ Financeiro</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Lado Esquerdo: Detalhes da Nota (Resumo) */}
          <div className="w-full lg:w-[350px] bg-slate-50 p-8 border-r border-slate-100 overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CreditCard size={12} className="text-emerald-500" />
                  Documento Fiscal
                </h3>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">NFS-e Número</p>
                    <button 
                      onClick={async () => {
                        const { abrirDanfseInterno } = await import('@/lib/utils/abrirDanfe')
                        abrirDanfseInterno(nota)
                      }}
                      className="flex items-center gap-2 group"
                    >
                      <p className="text-base font-black text-slate-800 group-hover:text-indigo-600 group-hover:underline">{nota.numero_nfse}</p>
                      <FileText size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Prestador</p>
                    <p className="text-xs font-black text-slate-700 leading-tight">{prestador.razao_social}</p>
                    <p className="text-[10px] font-bold text-slate-400">{prestador.cnpj}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Valor Líquido</p>
                      <p className="text-lg font-black text-emerald-600 leading-none">{fmtR(nota.valor_liquido)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Emissão</p>
                      <p className="text-xs font-black text-slate-600">{fmtData(nota.data_emissao)}</p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
                <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium text-emerald-700 leading-normal">
                  A escrituração fiscal agora exige o vínculo com um lançamento financeiro existente (pagamento ou provisão). Selecione o lançamento correspondente ao lado.
                </p>
              </div>

              {nota.descricao_servico && (
                <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Serviço</h3>
                  <p className="text-[10px] font-medium text-slate-500 italic line-clamp-4">{nota.descricao_servico}</p>
                </section>
              )}

              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Data Efetiva (Prestação / Entrega)
                </h3>
                <input
                  type="date"
                  value={dataEfetiva}
                  onChange={(e) => setDataEfetiva(e.target.value)}
                  disabled={nota.status_escrituracao === 'escriturada' && !!nota.data_entrada}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:bg-slate-50"
                  required
                />
                <p className="text-[9px] text-slate-400 mt-1 italic">
                  * Data real da prestação do serviço ou entrega da mercadoria. Padrão: Emissão.
                  {nota.status_escrituracao === 'escriturada' && " (Imutável após escrituração)"}
                </p>
              </section>

              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Data de Escrituração
                </h3>
                <input
                  type="date"
                  value={dataEscrituracao}
                  onChange={(e) => setDataEscrituracao(e.target.value)}
                  disabled={nota.status_escrituracao === 'escriturada' && !!nota.data_escrituracao}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:bg-slate-50"
                  required
                />
                <p className="text-[9px] text-slate-400 mt-1 italic">
                  * Data de registro fiscal. Padrão: Hoje.
                  {nota.status_escrituracao === 'escriturada' && " (Imutável após escrituração)"}
                </p>
              </section>
            </div>
          </div>

          {/* Lado Direito: Busca de Financeiro */}
          <div className="flex-1 flex flex-col bg-white">
            {/* Toolbar de Busca */}
            <div className="p-6 border-b border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <Landmark size={16} className="text-blue-500" />
                  Selecione o Lançamento Financeiro
                </h3>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100">
                  {filteredFinancials.length} encontrados
                </span>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Filtrar por descrição, categoria ou valor..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="ignoreFornecedor"
                      checked={ignoreFornecedor}
                      onChange={e => setIgnoreFornecedor(e.target.checked)}
                      className="w-3 h-3 accent-blue-600 rounded"
                    />
                    <label htmlFor="ignoreFornecedor" className="text-[10px] font-bold text-slate-400 uppercase cursor-pointer hover:text-slate-600 transition-all">
                      Ignorar filtro de fornecedor
                    </label>
                  </div>
                </div>
                <div className="relative w-40">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select 
                    value={periodo}
                    onChange={e => setPeriodo(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-all appearance-none"
                  >
                    <option value="all">Todo período</option>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const d = new Date()
                      d.setMonth(d.getMonth() - i)
                      const val = d.toISOString().slice(0, 7)
                      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                      return <option key={val} value={val}>{label.toUpperCase()}</option>
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Lista de Resultados */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
              {loadingFinancials ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Buscando lançamentos...</span>
                </div>
              ) : filteredFinancials.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-60">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <Filter size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-xs uppercase tracking-widest">Nenhum lançamento encontrado</p>
                    <p className="text-[10px] font-bold mt-1">Verifique o fornecedor ou altere o período.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredFinancials.map(fin => {
                    const isSelected = selectedFinId === fin.id
                    const valorMatch = Math.abs(fin.valor - nota.valor_liquido) < 0.01
                    
                    return (
                      <div 
                        key={fin.id}
                        onClick={() => setSelectedFinId(fin.id)}
                        className={`
                          group relative p-4 rounded-2xl border-2 transition-all cursor-pointer
                          ${isSelected 
                            ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20 translate-x-1' 
                            : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`
                              w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                              ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}
                            `}>
                              <Landmark size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                  {fin.categoria}
                                </span>
                                {valorMatch && (
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                                    VALOR IDÊNTICO
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm font-black leading-tight mt-1 ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                                {fin.descricao}
                              </p>
                              <div className={`flex items-center gap-3 mt-2 text-[10px] font-bold ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                                <span className="flex items-center gap-1">
                                  <Calendar size={10} /> {fmtData(fin.data)}
                                </span>
                                <span className="uppercase">{fin.status}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className={`text-base font-black ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                              {fmtR(fin.valor)}
                            </p>
                            {isSelected && (
                              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-blue-600 ml-auto mt-2">
                                <Check size={14} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer de Ações */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                  <AlertCircle size={14} />
                </div>
                <p className="text-[10px] font-bold text-slate-500 max-w-[200px] leading-tight">
                  Ao confirmar, a nota será vinculada ao financeiro e o lançamento contábil será reprocessado automaticamente.
                </p>
              </div>

              <div className="flex gap-3 flex-1 sm:flex-none">
                <button
                  onClick={onClose}
                  className="flex-1 sm:px-6 py-3.5 rounded-xl text-[11px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || !selectedFinId || !dataEfetiva || !dataEscrituracao}
                  className={`
                    flex-[2] sm:px-10 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95
                    ${selectedFinId && dataEfetiva && dataEscrituracao
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }
                  `}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
                  Confirmar Vínculo e Escriturar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
