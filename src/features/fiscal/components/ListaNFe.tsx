'use client'
import React, { useState, useMemo } from 'react'
import { Search, FileText, CheckCircle, Clock, AlertTriangle, Eye, Trash2, PenLine, RefreshCw, Printer } from 'lucide-react'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtData = (d: string) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') } catch { return d } }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pendente: { label: 'Pendente', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: RefreshCw },
  escriturada: { label: 'Escriturada', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: CheckCircle },
  com_inconsistencia: { label: 'Inconsistência', color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: AlertTriangle },
}

export default function ListaNFe({ nfeHook, onEscriturar }: { nfeHook: any; onEscriturar: (id: string) => void }) {
  const { nfes, loading, remover, filterPeriodo, setFilterPeriodo } = nfeHook
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const visualizarDanfe = (xml: string) => {
    if (!xml) return alert('XML original não encontrado para esta nota.')
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = 'https://www.webdanfe.com.br/danfe/Home/Imprimir'
    form.target = '_blank'
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'xml'
    input.value = xml
    form.appendChild(input)
    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
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

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text" placeholder="Buscar por emitente, número ou CNPJ..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs outline-none font-medium"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={filterPeriodo} onChange={e => setFilterPeriodo(e.target.value)}
          className="bg-slate-50 px-3 py-2.5 rounded-xl text-xs font-bold border-none outline-none">
          <option value="">Todos os períodos</option>
          {periodos.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-50 px-3 py-2.5 rounded-xl text-xs font-bold border-none outline-none">
          <option value="ALL">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="escriturada">Escrituradas</option>
          <option value="com_inconsistencia">Com Inconsistência</option>
        </select>
        <span className="text-xs font-black text-slate-400">{filtered.length} nota(s)</span>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <FileText size={40} className="text-slate-200 mb-3" />
          <p className="text-sm font-black text-slate-400">Nenhuma NF-e encontrada</p>
          <p className="text-xs text-slate-300 mt-1">Importe XMLs na aba "Importar NF-e"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((nfe: any) => {
            const stConf = STATUS_CONFIG[nfe.status_escrituracao] ?? STATUS_CONFIG.pendente
            const StIcon = stConf.icon
            return (
              <div key={nfe.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-800">NF {nfe.serie && `${nfe.serie}-`}{nfe.numero_nf}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${stConf.bg} ${stConf.color}`}>
                          <StIcon size={9} /> {stConf.label}
                        </span>
                        {nfe.crt_emitente === '1' && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black bg-yellow-50 text-yellow-700 border border-yellow-100">
                            Simples Nacional
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{nfe.nome_emitente}</p>
                      <p className="text-[10px] text-slate-400">CNPJ: {nfe.cnpj_emitente} • UF: {nfe.uf_emitente}</p>
                      <p className="text-[10px] text-slate-400">{nfe.nat_operacao}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-slate-800">{fmtR(nfe.valor_total)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Emissão: {fmtData(nfe.data_emissao)}</p>
                    <p className="text-[10px] text-slate-400">Entrada: {fmtData(nfe.data_entrada)}</p>
                  </div>
                </div>

                {/* Impostos resumo */}
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[
                    { label: 'ICMS', value: nfe.valor_icms, color: 'text-purple-600' },
                    { label: 'IPI', value: nfe.valor_ipi, color: 'text-blue-600' },
                    { label: 'PIS', value: nfe.valor_pis, color: 'text-rose-600' },
                    { label: 'COFINS', value: nfe.valor_cofins, color: 'text-orange-600' },
                  ].map((imp, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                      <p className="text-[9px] text-slate-400 font-bold">{imp.label}</p>
                      <p className={`text-[10px] font-black ${imp.color}`}>{fmtR(imp.value)}</p>
                    </div>
                  ))}
                </div>

                {/* Chave de acesso */}
                {nfe.chave_acesso && (
                  <div className="mt-2 flex items-center gap-2 bg-slate-50 rounded-xl p-2">
                    <p className="text-[9px] font-mono text-slate-400 truncate">{nfe.chave_acesso}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2">
                  {nfe.status_escrituracao !== 'escriturada' && (
                    <button
                      onClick={() => onEscriturar(nfe.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all"
                    >
                      <PenLine size={11} /> Escriturar
                    </button>
                  )}
                  {nfe.status_escrituracao === 'escriturada' && (
                    <button
                      onClick={() => onEscriturar(nfe.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl transition-all"
                    >
                      <Eye size={11} /> Visualizar
                    </button>
                  )}
                  <button
                    onClick={() => visualizarDanfe(nfe.xml_original)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100"
                  >
                    <Printer size={11} /> DANFE (PDF)
                  </button>
                  <button
                    onClick={() => confirm('Excluir esta NF-e e todos os seus itens?') && remover(nfe.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                  >
                    <Trash2 size={11} /> Excluir
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
