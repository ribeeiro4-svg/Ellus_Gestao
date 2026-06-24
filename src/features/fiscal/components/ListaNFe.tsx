'use client'
import React, { useState, useMemo } from 'react'
import { Search, FileText, CheckCircle, Clock, AlertTriangle, Eye, Trash2, PenLine, RefreshCw, Printer, ArrowRight } from 'lucide-react'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtData = (d: string) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') } catch { return d } }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pendente: { label: 'Pendente', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: RefreshCw },
  escriturada: { label: 'Escriturada', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: CheckCircle },
  com_inconsistencia: { label: 'Inconsistência', color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: AlertTriangle },
}

export default function ListaNFe({ nfeHook, onEscriturar }: { nfeHook: any; onEscriturar: (id: string) => void }) {
  const { nfes, loading, remover, removerLote, filterPeriodo, setFilterPeriodo } = nfeHook
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const visualizarDanfe = async (nfe: any) => {
    let itens = nfe.itens
    if (!itens) {
      itens = await nfeHook.buscarItens(nfe.id)
    }
    const { abrirDanfeInterno } = await import('@/lib/utils/abrirDanfe')
    abrirDanfeInterno(nfe, itens || [])
  }

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const ano = new Date().getFullYear()
  const periodos = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, '0')
    return { value: `${ano}-${m}`, label: `${meses[i]}/${ano}` }
  })

  const filtered = useMemo(() => nfes.filter((n: any) => {
    const matchSearch = !search || n.nome_emitente?.toLowerCase().includes(search.toLowerCase()) ||
      n.numero_nf?.includes(search) || n.cnpj_emitente?.includes(search)
    const matchStatus = filterStatus === 'ALL' || n.status_escrituracao === filterStatus
    return matchSearch && matchStatus
  }), [nfes, search, filterStatus])

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map((n: any) => n.id))
    } else {
      setSelectedIds([])
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleExcluirLote = async () => {
    if (!selectedIds.length) return
    if (confirm(`Tem certeza que deseja excluir ${selectedIds.length} nota(s) permanentemente?`)) {
      const { error } = await removerLote(selectedIds)
      if (error) alert('Erro ao excluir: ' + error)
      else setSelectedIds([])
    }
  }

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 pr-3 border-r border-slate-100">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            checked={selectedIds.length === filtered.length && filtered.length > 0}
            onChange={handleSelectAll}
          />
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text" placeholder="Buscar por emitente, número ou CNPJ..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs outline-none font-medium"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        {selectedIds.length > 0 ? (
          <button
            onClick={handleExcluirLote}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-black border border-rose-100 hover:bg-rose-100 transition-all"
          >
            <Trash2 size={14} /> EXCLUIR SELECIONADAS ({selectedIds.length})
          </button>
        ) : (
          <>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-slate-50 px-3 py-2.5 rounded-xl text-xs font-bold border-none outline-none">
              <option value="ALL">Todos os status</option>
              <option value="pendente">Pendentes</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="escriturada">Escrituradas</option>
              <option value="com_inconsistencia">Com Inconsistência</option>
            </select>
          </>
        )}
        <span className="text-xs font-black text-slate-400">{filtered.length} nota(s)</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white/40 backdrop-blur-md rounded-3xl border border-dashed border-white/60">
          <FileText size={40} className="text-slate-200 mb-3" />
          <p className="text-sm font-black text-slate-400">Nenhuma NF-e encontrada</p>
          <p className="text-xs text-slate-300 mt-1">Importe XMLs na aba "Importar NF-e"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((nfe: any) => {
            const stConf = STATUS_CONFIG[nfe.status_escrituracao] ?? STATUS_CONFIG.pendente
            const StIcon = stConf.icon
            const isSelected = selectedIds.includes(nfe.id)
            
            return (
              <div 
                key={nfe.id} 
                className={`bg-white/60 backdrop-blur-md border p-4 rounded-2xl hover:bg-white/80 transition-all group shadow-sm flex items-center gap-4 ${
                  isSelected ? 'border-indigo-300 bg-indigo-50/50' : 'border-white/40'
                }`}
              >
                <div className="flex-shrink-0">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={isSelected}
                    onChange={() => toggleSelect(nfe.id)}
                  />
                </div>

                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        NF {nfe.serie && `${nfe.serie}-`}{nfe.numero_nf}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${stConf.bg} ${stConf.color}`}>
                        <StIcon size={8} /> {stConf.label.toUpperCase()}
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-bold text-slate-800 truncate">
                      {nfe.nome_emitente}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[9px] text-slate-400 font-mono">Chave: {nfe.chave_acesso}</p>
                      <span className="text-[9px] text-slate-300">•</span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{nfe.uf_emitente}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 px-6 border-x border-slate-100/50 hidden xl:flex">
                    <div className="text-center min-w-[80px]">
                      <span className="block text-[8px] font-black text-slate-400 uppercase">Total</span>
                      <span className="text-sm font-black text-slate-800">{fmtR(nfe.valor_total)}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[8px] font-black text-slate-400 uppercase">ICMS</span>
                      <span className="text-[10px] font-bold text-purple-600">{fmtR(nfe.valor_icms)}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[8px] font-black text-slate-400 uppercase">IPI</span>
                      <span className="text-[10px] font-bold text-blue-600">{fmtR(nfe.valor_ipi)}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[8px] font-black text-slate-400 uppercase">PIS/COF</span>
                      <span className="text-[10px] font-bold text-rose-500">{fmtR((nfe.valor_pis || 0) + (nfe.valor_cofins || 0))}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                    <button onClick={() => visualizarDanfe(nfe)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Ver DANFE">
                      <Printer size={16} />
                    </button>
                    {nfe.status_escrituracao !== 'escriturada' ? (
                      <button onClick={() => onEscriturar(nfe.id)} className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100 transition-all">
                        <PenLine size={11} /> ESCRITURAR
                      </button>
                    ) : (
                      <button onClick={() => onEscriturar(nfe.id)} className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-all">
                        <Eye size={11} /> REVISAR
                      </button>
                    )}
                    <button onClick={() => confirm('Excluir esta nota?') && remover(nfe.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
