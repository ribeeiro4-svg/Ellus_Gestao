'use client'
import React, { useState, useMemo } from 'react'
import { Plus, Save, Loader2, Trash2, RotateCcw, Search, ChevronRight } from 'lucide-react'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtData = (d: string) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') } catch { return d } }

export default function LivroDiario({ lancHook, planoHook }: { lancHook: any; planoHook: any }) {
  const { lancamentos, loading, inserir, estornar, buscarPartidas } = lancHook
  const { contasAnaliticas } = planoHook
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterMes, setFilterMes] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [partidasCache, setPartidasCache] = useState<Record<string, any[]>>({})
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    historico: '',
    documentoTipo: '',
    documentoNumero: '',
    partidas: [
      { contaId: '', tipo: 'D' as 'D' | 'C', valor: '', historico: '' },
      { contaId: '', tipo: 'C' as 'D' | 'C', valor: '', historico: '' },
    ],
  })

  const totalD = form.partidas.filter(p => p.tipo === 'D').reduce((s, p) => s + (Number(p.valor) || 0), 0)
  const totalC = form.partidas.filter(p => p.tipo === 'C').reduce((s, p) => s + (Number(p.valor) || 0), 0)
  const balanceado = Math.abs(totalD - totalC) < 0.01

  const addPartida = () => setForm(f => ({ ...f, partidas: [...f.partidas, { contaId: '', tipo: 'D', valor: '', historico: '' }] }))
  const removePartida = (idx: number) => setForm(f => ({ ...f, partidas: f.partidas.filter((_, i) => i !== idx) }))
  const updatePartida = (idx: number, field: string, value: any) =>
    setForm(f => ({ ...f, partidas: f.partidas.map((p, i) => i === idx ? { ...p, [field]: value } : p) }))

  const salvar = async () => {
    if (!form.historico) return alert('Informe o histórico')
    if (!balanceado) return alert(`Lançamento não balanceado: D=${fmtR(totalD)} | C=${fmtR(totalC)}`)
    const partidas = form.partidas.filter(p => p.contaId && Number(p.valor) > 0)
    if (partidas.length < 2) return alert('Mínimo 2 partidas com conta e valor')
    setSaving(true)
    const r = await inserir({ ...form, partidas: partidas.map(p => ({ ...p, valor: Number(p.valor) })) })
    setSaving(false)
    if (r.error) alert(r.error)
    else { setShowForm(false); setForm({ data: new Date().toISOString().split('T')[0], historico: '', documentoTipo: '', documentoNumero: '', partidas: [{ contaId: '', tipo: 'D', valor: '', historico: '' }, { contaId: '', tipo: 'C', valor: '', historico: '' }] }) }
  }

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!partidasCache[id]) {
      const partidas = await buscarPartidas(id)
      setPartidasCache(prev => ({ ...prev, [id]: partidas }))
    }
  }

  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const ano = new Date().getFullYear()

  const filtered = useMemo(() => lancamentos.filter((l: any) => {
    const matchSearch = !search || l.historico?.toLowerCase().includes(search.toLowerCase()) || l.numero_lancamento?.includes(search)
    const matchMes = !filterMes || l.data_competencia?.startsWith(filterMes)
    return matchSearch && matchMes
  }), [lancamentos, search, filterMes])

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input type="text" placeholder="Buscar lançamentos..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-medium outline-none" />
        </div>
        <select value={filterMes} onChange={e => setFilterMes(e.target.value)}
          className="bg-slate-50 px-3 py-2.5 rounded-xl text-xs font-bold border-none outline-none">
          <option value="">Todos os meses</option>
          {MESES.map((m, i) => <option key={i} value={`${ano}-${(i+1).toString().padStart(2,'0')}`}>{m}/{ano}</option>)}
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all">
          <Plus size={14} /> Novo Lançamento
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-700 mb-4">➕ Novo Lançamento Contábil</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Data *</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Tipo Documento</label>
              <select value={form.documentoTipo} onChange={e => setForm(f => ({ ...f, documentoTipo: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none">
                <option value="">Sem documento</option>
                <option value="NF">NF-e</option>
                <option value="REC">Recibo</option>
                <option value="CTR">Contrato</option>
                <option value="FOL">Folha de Pagamento</option>
                <option value="DEP">Depreciação</option>
                <option value="ADJ">Ajuste</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Número Documento</label>
              <input type="text" value={form.documentoNumero} onChange={e => setForm(f => ({ ...f, documentoNumero: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none" />
            </div>
            <div className="col-span-3">
              <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Histórico *</label>
              <input type="text" value={form.historico} onChange={e => setForm(f => ({ ...f, historico: e.target.value }))}
                placeholder="Descreva o fato contábil..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none" />
            </div>
          </div>

          {/* Partidas */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] font-black text-slate-500 uppercase">Partidas (Débito/Crédito)</label>
              <div className={`text-[10px] font-black ${balanceado ? 'text-emerald-600' : 'text-red-500'}`}>
                {balanceado ? '✅ Balanceado' : `⚠️ D: ${fmtR(totalD)} | C: ${fmtR(totalC)}`}
              </div>
            </div>
            <div className="space-y-2">
              {form.partidas.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select value={p.tipo} onChange={e => updatePartida(idx, 'tipo', e.target.value)}
                    className={`w-16 px-2 py-2 rounded-xl text-[10px] font-black border-none outline-none ${p.tipo === 'D' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    <option value="D">D</option>
                    <option value="C">C</option>
                  </select>
                  <select value={p.contaId} onChange={e => updatePartida(idx, 'contaId', e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none">
                    <option value="">Selecionar conta...</option>
                    {contasAnaliticas.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.codigo} — {c.descricao}</option>
                    ))}
                  </select>
                  <input type="number" min="0.01" step="0.01" placeholder="R$ 0,00"
                    value={p.valor} onChange={e => updatePartida(idx, 'valor', e.target.value)}
                    className="w-28 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none text-right" />
                  {form.partidas.length > 2 && (
                    <button onClick={() => removePartida(idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addPartida} className="mt-2 text-xs font-black text-indigo-600 hover:underline">+ Adicionar partida</button>
          </div>

          <div className="flex gap-2">
            <button onClick={salvar} disabled={saving || !balanceado}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-indigo-600 rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-all">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? 'Salvando...' : 'Confirmar Lançamento'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-xs font-black text-slate-500 bg-slate-100 rounded-xl">Cancelar</button>
          </div>
        </div>
      )}

      {/* Livro Diário */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <p className="text-xs font-bold text-slate-400">Nenhum lançamento encontrado</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>{['Nº Lanç.', 'Data', 'Histórico', 'Tipo', 'Status', 'Ações'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map((l: any) => (
                <React.Fragment key={l.id}>
                  <tr className={`border-t border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${l.status === 'estornado' ? 'opacity-50' : ''}`}
                    onClick={() => toggleExpand(l.id)}>
                    <td className="px-4 py-3 font-mono text-[10px] text-indigo-600 font-black">{l.numero_lancamento}</td>
                    <td className="px-4 py-3 text-slate-600 font-bold whitespace-nowrap">{fmtData(l.data_lancamento)}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800 max-w-xs truncate">{l.historico}</p>
                      {l.documento_numero && <p className="text-[9px] text-slate-400">{l.documento_tipo} {l.documento_numero}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-bold capitalize">{l.tipo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${l.status === 'confirmado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : l.status === 'estornado' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ChevronRight size={12} className={`text-slate-400 transition-transform ${expandedId === l.id ? 'rotate-90' : ''}`} />
                        {l.status === 'confirmado' && (
                          <button onClick={e => { e.stopPropagation(); confirm('Estornar este lançamento?') && estornar(l.id) }}
                            className="p-1 text-orange-500 hover:bg-orange-50 rounded-lg" title="Estornar">
                            <RotateCcw size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === l.id && (
                    <tr className="bg-indigo-50/30">
                      <td colSpan={6} className="px-6 py-3">
                        {partidasCache[l.id] ? (
                          <table className="w-full text-[10px]">
                            <thead><tr className="text-slate-400 font-black uppercase text-[8px]">
                              {['D/C', 'Conta', 'Descrição', 'Valor'].map(h => <th key={h} className="py-1 text-left pr-4">{h}</th>)}
                            </tr></thead>
                            <tbody>
                              {partidasCache[l.id].map((p: any) => (
                                <tr key={p.id} className="border-t border-indigo-100">
                                  <td className={`py-1.5 pr-4 font-black ${p.tipo_partida === 'D' ? 'text-blue-600' : 'text-purple-600'}`}>{p.tipo_partida}</td>
                                  <td className="py-1.5 pr-4 font-mono text-indigo-700">{p.conta?.codigo ?? '--'}</td>
                                  <td className="py-1.5 pr-4 text-slate-700">{p.conta?.descricao ?? '--'}</td>
                                  <td className="py-1.5 font-black text-slate-800">{fmtR(p.valor)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : <p className="text-[10px] text-slate-400">Carregando partidas...</p>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
