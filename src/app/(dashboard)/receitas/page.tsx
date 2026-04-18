'use client'
import React, { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useAssociados } from '@/lib/hooks/useAssociados'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal, { Field } from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, fmtData, MESES } from '@/lib/utils/formatters'
import { TrendingUp, Plus, RefreshCw, Copy, ChevronDown, ChevronRight, Search, Filter, XCircle, AlertCircle, Check } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

const CHART_COLORS = ['#2d8c6f', '#34d399', '#f59e0b', '#e07b39', '#c084fc', '#22d3ee', '#f43f5e']

const axisDefaults = {
  y: {
    grid: { color: 'rgba(0,0,0,.04)' },
    ticks: { font: { size: 10 }, callback: (v: any) => 'R$' + Math.round(Number(v) / 1000) + 'k' },
  },
  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
}

export default function ReceitasPage() {
  const { lancamentos, loading, inserir, atualizar, remover, inserirBulk } = useFinanceiro()
  const { contas } = useContas()
  const { associados } = useAssociados()
  const receitas = useMemo(() => lancamentos.filter(l => l.tipo === 'receita'), [lancamentos])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['__all__']))
  const [batchSearch, setBatchSearch] = useState('')

  /* ── Filtros ── */
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPagamento, setFilterPagamento] = useState('todos')
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth())
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [onlyUnlinked, setOnlyUnlinked] = useState(false)

  const filteredReceitas = useMemo(() => {
    return receitas.filter(r => {
      const d = new Date(r.data)
      const matchMonth = filterMonth === -1 || d.getMonth() === filterMonth
      const matchYear = d.getFullYear() === filterYear
      const searchLower = searchTerm.toLowerCase()
      const assoc = associados.find(a => a.id === r.associado_id)
      const conta = contas.find(c => c.id === r.conta_id)
      const matchSearch = !searchTerm || 
        r.descricao.toLowerCase().includes(searchLower) ||
        assoc?.nome.toLowerCase().includes(searchLower) ||
        conta?.nome.toLowerCase().includes(searchLower) ||
        r.categoria.toLowerCase().includes(searchLower)
      const matchStatus = filterStatus === 'todos' || r.status === filterStatus
      const matchPagamento = filterPagamento === 'todos' || r.forma_pagamento === filterPagamento
      const matchUnlinked = !onlyUnlinked || !r.associado_id
      return matchMonth && matchYear && matchSearch && matchStatus && matchPagamento && matchUnlinked
    })
  }, [receitas, searchTerm, filterStatus, filterPagamento, filterMonth, filterYear, onlyUnlinked, associados, contas])

  /* ── Gráficos ── */
  const receitaMensal = useMemo(() => {
    const arr = Array(12).fill(0)
    filteredReceitas.forEach(r => {
      const m = new Date(r.data).getMonth()
      if (!isNaN(m)) arr[m] += r.valor || 0
    })
    return arr
  }, [filteredReceitas])

  const receitaCats = useMemo(() => {
    const m: Record<string, number> = {}
    filteredReceitas.forEach(r => { const c = r.categoria || 'Outros'; m[c] = (m[c] || 0) + (r.valor || 0) })
    return Object.keys(m).length ? m : { 'Sem dados': 1 }
  }, [filteredReceitas])

  const totalReceitas = filteredReceitas.reduce((s, r) => s + (r.valor || 0), 0)

  /* ── CRUD helpers ── */
  const handleSalvar = async (data: any) => {
    const dbData = { ...data, tipo: 'receita' }
    if (editingItem) { 
      await atualizar(editingItem.id, dbData) 
    } else {
      const { is_lote, selected_associados, recorrencia_ativa, recorrencia_meses, ...cleanData } = data;
      
      if (is_lote && selected_associados?.length > 0) {
        const batch: any[] = []
        selected_associados.forEach((assocId: string) => {
          const assoc = associados.find(a => a.id === assocId)
          batch.push({ 
            ...cleanData, 
            tipo: 'receita',
            descricao: `${cleanData.descricao.toUpperCase()} - ${assoc?.nome.toUpperCase() || 'LOTE'}`,
            associado_id: assocId, 
            status: cleanData.status || 'pago' 
          })
        })
        await inserirBulk(batch)
      } else if (recorrencia_ativa) {
        const meses = Number(recorrencia_meses || 12)
        const batch: any[] = []
        const assoc = cleanData.associado_id ? associados.find(a => a.id === cleanData.associado_id) : null;
        const baseDesc = assoc ? `${cleanData.descricao.toUpperCase()} - ${assoc.nome.toUpperCase()}` : cleanData.descricao.toUpperCase();

        for (let i = 0; i <= meses; i++) {
          const parts = cleanData.data.includes('-') ? cleanData.data.split('-').map(Number) : cleanData.data.split('/').reverse().map(Number);
          const d = new Date(parts[0], parts[1] - 1 + i, Math.min(parts[2], new Date(parts[0], parts[1] + i, 0).getDate()));
          const dataStr = d.toISOString().split('T')[0];
          batch.push({ ...cleanData, tipo: 'receita', descricao: baseDesc, data: dataStr, status: i === 0 ? (cleanData.status || 'pago') : 'pendente' });
        }
        await inserirBulk(batch)
      } else {
        const assoc = cleanData.associado_id ? associados.find(a => a.id === cleanData.associado_id) : null;
        const finalDesc = assoc ? `${cleanData.descricao.toUpperCase()} - ${assoc.nome.toUpperCase()}` : cleanData.descricao.toUpperCase();
        await inserir({ ...cleanData, tipo: 'receita', descricao: finalDesc, status: cleanData.status || 'pago' })
      }
    }
    setEditingItem(null); setIsModalOpen(false)
  }

  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDuplicate = (item: any) => { setEditingItem({ ...item, id: undefined }); setIsModalOpen(true) }
  const handleDelete = async (id: string) => { if (confirm('Excluir esta receita?')) await remover(id) }

  const receitasPorAssociado = useMemo(() => {
    const groups = new Map<string, { assoc: any; items: any[] }>()
    filteredReceitas.forEach(r => {
      const key = r.associado_id || '__sem_assoc__';
      if (!groups.has(key)) groups.set(key, { assoc: associados.find(a => a.id === r.associado_id) || null, items: [] })
      groups.get(key)!.items.push(r)
    })
    return new Map([...groups.entries()].sort((a,b) => (b[1].items.length - a[1].items.length)))
  }, [filteredReceitas, associados])

  const modalFields: Field[] = useMemo(() => [
    { name: 'descricao', label: 'Descrição', type: 'text', required: true },
    { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
    { name: 'data', label: 'Data', type: 'date', required: true },
    { name: 'conta_id', label: 'Conta de Destino', type: 'select', required: true, options: contas.map(c => ({ value: c.id, label: c.nome })) },
    { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: [{ value: 'Mensalidades', label: 'Mensalidades' }, { value: 'ADESÃO', label: 'Adesão' }, { value: 'Patrocínios', label: 'Patrocínios' }, { value: 'Outros', label: 'Outros' }] },
    { name: 'associado_id', label: 'Associado Individual', type: 'select', showIf: (f: any) => !f.is_lote, options: [{ value: '', label: 'Nenhum' }, ...associados.map(a => ({ value: a.id, label: a.nome }))] },
    { name: 'is_lote', label: '🚀 Lançar em Lote?', type: 'checkbox', showIf: (f: any) => !editingItem },
    { 
      name: 'batch_selection', label: 'Selecionar Associados (Lote)', type: 'info', showIf: (f: any) => f.is_lote,
      render: (formData: any, handleChange: any) => {
        const selected = formData.selected_associados || []
        const filteredList = associados.filter(a => a.nome.toLowerCase().includes(batchSearch.toLowerCase())).slice(0, 10)
        return (
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} /><input type="text" placeholder="Pesquisar nome..." className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs border border-gray-100 outline-none focus:ring-2 ring-indigo-50" value={batchSearch} onChange={e => setBatchSearch(e.target.value)} /></div>
            <div className="grid grid-cols-1 gap-1 max-h-[160px] overflow-y-auto pr-2">
              {filteredList.map(a => {
                const isSel = selected.includes(a.id)
                return (
                  <button key={a.id} type="button" onClick={() => handleChange('selected_associados', isSel ? selected.filter((sid: string) => sid !== a.id) : [...selected, a.id])} className={`flex items-center justify-between p-2 rounded-xl text-left transition-all ${isSel ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-800 hover:bg-gray-100'}`}>
                    <span className="text-xs font-bold truncate">{a.nome}</span>
                    {isSel ? <Check size={14} /> : <Plus size={14} className="text-gray-300" />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      }
    },
    { name: 'recorrencia_ativa', label: 'Lançamento Recorrente', type: 'checkbox' },
    { name: 'recorrencia_meses', label: 'Meses', type: 'number', showIf: (f: any) => f.recorrencia_ativa, defaultValue: 12 },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'pago', label: 'Recebido' }, { value: 'pendente', label: 'Pendente' }] }
  ], [contas, associados, batchSearch, editingItem])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(45,140,111,.12)', border: '1px solid rgba(45,140,111,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><TrendingUp size={24} /></div>
          <div><div className="page-title">Receitas</div><div className="page-subtitle">Entradas financeiras — ACPROBEC</div></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 18px', textAlign: 'center' }}><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Total</div><div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>{fmtR(totalReceitas)}</div></div>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}><Plus size={16} /> Nova Receita</button>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <ChartCard title="📊 Receitas por Mês" subtitle="Evolução mensal das entradas"><Bar data={{ labels: MESES, datasets: [{ label: 'Receita', data: receitaMensal, backgroundColor: 'rgba(45,140,111,.72)', borderRadius: 5, borderSkipped: false }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: axisDefaults }} /></ChartCard>
        <ChartCard title="🍩 Mix por Categoria" subtitle="Distribuição das receitas"><Doughnut data={{ labels: Object.keys(receitaCats), datasets: [{ data: Object.values(receitaCats), backgroundColor: CHART_COLORS, hoverOffset: 6, borderWidth: 2, borderColor: '#fff' }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } } } }} /></ChartCard>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 min-w-[280px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-indigo-300 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100"><select className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer" value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}><option value={-1}>Mês: Todos</option>{MESES.map((m, idx) => <option key={m} value={idx}>{m}</option>)}</select></div>
        <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="bg-gray-50 px-3 py-2 rounded-xl text-xs font-bold border-none outline-none">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
      </div>

      <div className="table-card overflow-hidden">
        {loading ? <div className="p-16 text-center text-sm text-gray-400">Carregando...</div> : (
          <div className="divide-y divide-gray-50">
            {[...receitasPorAssociado.entries()].map(([key, { assoc, items }]) => (
              <div key={key}>
                <div onClick={() => { setExpandedGroups(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next }) }} className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-indigo-50/30 transition-all">
                  <div className="text-gray-400">{expandedGroups.has(key) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-bold text-gray-800 truncate">{assoc?.nome || 'Sem Associado'}</div><div className="text-[10px] text-gray-400 font-medium">{items.length} lançamento(s)</div></div>
                  <div className="text-right"><div className="text-sm font-black text-emerald-600">{fmtR(items.reduce((s,i) => s + (i.valor||0), 0))}</div></div>
                </div>
                {expandedGroups.has(key) && (
                  <div className="bg-gray-50/20 divide-y divide-gray-50">
                    {items.map(i => (
                      <div key={i.id} className="flex items-center gap-4 px-12 py-3 hover:bg-gray-50/50">
                        <div className="text-[11px] font-bold text-gray-500 w-20">{fmtData(i.data)}</div>
                        <div className="flex-1 text-[12px] font-semibold text-gray-700 truncate">{i.descricao}</div>
                        <div className="w-24 text-right font-black text-emerald-600">{fmtR(i.valor)}</div>
                        <div className="flex gap-2"><button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"><Plus size={14} className="rotate-45" /></button><button onClick={() => handleDelete(i.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"><XCircle size={14} /></button></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <CrudModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Receita' : 'Nova Receita'} initialData={editingItem} onSubmit={handleSalvar} fields={modalFields} />
    </div>
  )
}
